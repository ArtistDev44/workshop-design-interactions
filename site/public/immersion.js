/* Nantes en régulation — couche d'immersion (prompt 20).
 * Ajoute, SANS toucher aux décisions Q1–Q61 (jauges, actions, fins) :
 *   § 2 intro SMS · § 3 horloge simulée et temps compressé ×10 · § 4 sieste et « Se réveiller »
 *   § 5 bordures rouges pour les incidents importants · § 6 mail de fin de journée · § 7 livres au bureau
 *   § 1 Échap au bureau = menu.
 * Rien n'est inventé côté données : les textes factuels (mail) viennent des dossiers réellement joués.
 */

// ——— Réglages de l'immersion (tout est ici) ———
const IMMERSION = {
	minutesParSeconde: 1, // rythme normal : 1 minute de journée par seconde réelle
	compression: 10, // § 3 : ×10 quand aucun incident n'est actif
	siesteApresMs: 20000, // § 4 : 20 s sans incident ni interaction
	fenetreReveilMs: { 60: 3000, 30: 2000, 15: 1000 }, // § 4 : selon le compteur de la semaine
	retardImportant: 20, // § 5 : retard ≥ 20 min = bordure rouge
	pulsationsParSeconde: 1.5, // § 5 : jamais plus de 3 flashs/s
};

const SMS = [
	{ de: 'moi', texte: 'Premier jour au travail, faut pas que je me loupe.' },
	{ de: 'Camille · cheffe de salle', texte: 'Bienvenue à la régulation ! Ton poste : surveiller le réseau Naolib et traiter les incidents qui arrivent sur ton écran.' },
	{ de: 'Camille · cheffe de salle', texte: 'Pour chaque dossier : dévier la ligne, retenir en terminus, envoyer un bus de renfort… ou ne rien faire. Le chrono tourne.' },
	{ de: 'Camille · cheffe de salle', texte: 'Ton objectif : garder les trois jauges au vert — fluidité du réseau, satisfaction des usagers, réputation de la salle.' },
	{ de: 'Camille · cheffe de salle', texte: 'Si l’écran du PC clignote en rouge, c’est urgent. Et pas de sieste au poste !' },
	{ de: 'moi', texte: 'Ouverture à 6h, on y va.' },
];

const LIVRE_STRESS = [
	'Bien gérer son stress au poste',
	'Respirer : inspirez 4 secondes, bloquez 4 secondes, expirez 6 secondes. Trois cycles suffisent à faire redescendre la tension.',
	'Un dossier à la fois : lisez la ligne, le retard et la raison avant de choisir. Le chrono est long pour les semaines faciles, utilisez-le.',
	'Accepter l’imparfait : « ne rien faire » est parfois la moins mauvaise décision. Une journée se juge sur l’ensemble.',
	'Faire des pauses entre deux dossiers (touche P), pas pendant : un incident ne se met pas en pause.',
	'Demander de l’aide : le tutoriel (livre bleu) rappelle les règles et les effets des actions.',
];

let smsActif = false;
let smsIndex = 0;
let introVue = false;
let inactifDepuis = 0; // millis() de la dernière interaction
let enSieste = false;
let debutSieste = 0;
let reveil = null; // { limite } quand une alerte arrive pendant la sieste
let focusBureau = -1; // -1 : aucun ; sinon index dans OBJETS_BUREAU
let derniereImage = 0;

// Objets cliquables du bureau (coordonnées pixel art, voir bureau.js)
const OBJETS_BUREAU = [
	{ nom: 'ecran', label: 'Écran du PC' },
	{ nom: 'tuto', label: 'Livre « Tutoriel »', x: 140, y: 139, l: 36, h: 7 },
	{ nom: 'stress', label: 'Livre « Bien gérer son stress »', x: 142, y: 131, l: 32, h: 7 },
];

function interaction() {
	inactifDepuis = millis();
}

// ——— Journées et horloge simulée (§ 3) ———
function demarrerJournee() {
	ecran = 'jeu';
	enPause = false;
	phase = 'attente';
	enSieste = false;
	reveil = null;
	interaction();
}

function heureAffichee() {
	// Partie en cours : heure simulée ; sinon (et en mode « aujourd'hui ») : heure réelle
	if (ecran === 'jeu' && Jeu.horloge && Jeu.etat.mode !== 'direct' && phase !== 'fin') {
		const m = Math.floor(Jeu.horloge.minutes);
		return { h: Math.floor(m / 60) % 24, m: m % 60, simulee: true };
	}
	const d = new Date();
	return { h: d.getHours(), m: d.getMinutes(), simulee: false };
}

function tempsCompresse() {
	return ecran === 'jeu' && (phase === 'attente' || phase === 'reveil');
}

function avancerTemps() {
	const maintenant = millis();
	const dt = derniereImage ? Math.min(250, maintenant - derniereImage) : 0;
	derniereImage = maintenant;
	if (ecran !== 'jeu' || !Jeu.horloge || phase === 'fin' || phase === 'mail' || smsActif || enPause) return;
	const vitesse = IMMERSION.minutesParSeconde * (tempsCompresse() ? IMMERSION.compression : 1);
	Jeu.horloge.minutes += (dt / 1000) * vitesse;

	if (phase === 'attente') {
		// Sieste après 20 s sans incident ni interaction (§ 4)
		if (!enSieste && maintenant - inactifDepuis > IMMERSION.siesteApresMs) {
			enSieste = true;
			debutSieste = maintenant;
			if (vue === 'poste') seLever(); // on se cale dans le fauteuil : retour à la vue bureau
		}
		const prochain = Jeu.prochainDuJour();
		if (prochain && Jeu.horloge.minutes >= prochain.minute) arriveeIncident();
		else if (!prochain && Jeu.horloge.minutes >= Jeu.finJournee()) {
			phase = 'mail'; // § 6 : fin de journée
			enSieste = false;
			Confort.Son.bip('dossier');
		}
	} else if (phase === 'reveil' && reveil && maintenant > reveil.limite) {
		rateReveil();
	}
}

function arriveeIncident() {
	if (enSieste) {
		// Triple bip, puis fenêtre de réaction 3 / 2 / 1 s selon le compteur de la semaine
		const c = (Jeu.etat.semaine && Jeu.etat.semaine.difficulte && Jeu.etat.semaine.difficulte.compteur_s) || 30;
		phase = 'reveil';
		reveil = { limite: millis() + (IMMERSION.fenetreReveilMs[c] || 2000) };
		Confort.Son.bip('alerte');
		setTimeout(() => Confort.Son.bip('alerte'), 180);
		setTimeout(() => Confort.Son.bip('alerte'), 360);
		return;
	}
	nouveauDossier(); // présente le dossier (conflit / contradiction / décision) et lance le compteur
}

function seReveiller() {
	if (phase !== 'reveil') return;
	enSieste = false;
	reveil = null;
	interaction();
	nouveauDossier();
}

function rateReveil() {
	enSieste = false;
	reveil = null;
	nouveauDossier();
	phase = 'decision';
	decider('temps'); // « ne rien faire » : conséquences naturelles (Q25)
	if (dernierResultat) Jeu.malusSieste(dernierResultat); // −5 sur la jauge concernée
	interaction();
}

/** Après la narration d'une décision : incident suivant de la journée, ou attente de la fin de journée */
function apresDecision() {
	phase = 'attente';
	interaction();
}

function journeeSuivante() {
	if (Jeu.terminee || !Jeu.jours[Jeu.jourIndex + 1]) return allerFin();
	Jeu.journeeSuivante();
	demarrerJournee();
}

function allerFin() {
	phase = 'fin';
	bilanFin = Confort.Bilans.enregistrer(Confort.Bilans.cle(Jeu.etat), Jeu.score(), Jeu.jauges); // Q19
	Confort.Son.bip('fin');
}

// ——— Incidents importants : bordures rouges (§ 5) ———
function incidentImportant() {
	if (ecran !== 'jeu' || !['decision', 'contradiction', 'conflit', 'reveil'].includes(phase)) return false;
	const d = phase === 'reveil' ? Jeu.prochainDuJour() : Jeu.dossierCourant();
	return !!d && ((d.retard !== null && d.retard !== undefined && d.retard >= IMMERSION.retardImportant) || phase === 'conflit');
}
function incidentActif() {
	return ecran === 'jeu' && ['decision', 'contradiction', 'conflit', 'reveil'].includes(phase);
}
/** Opacité de la pulsation (0..1) : 1,5 pulsation/s, fixe si animations réduites */
function pulsationRouge() {
	if (reduireAnimations) return 1;
	return 0.55 + 0.45 * Math.sin((millis() / 1000) * Math.PI * 2 * IMMERSION.pulsationsParSeconde);
}
function bordureRouge(x, y, l, h, epaisseur) {
	noFill();
	stroke(179, 38, 30, 255 * pulsationRouge());
	strokeWeight(epaisseur);
	rect(x, y, l, h, 8);
	noStroke();
}

// ——— Panneau « attente » (aucun incident actif) ———
function dessinerAttente() {
	const z = { x: DROITE.x, y: DROITE.y + 130, l: DROITE.l, h: DROITE.h - 130 };
	panneau(z.x, z.y, z.l, z.h);
	const hA = heureAffichee();
	textAlign(LEFT, TOP);
	noStroke();
	fill(C.gris);
	textFont(POLICE_DONNEES);
	textSize(18);
	const j = Jeu.jourCourant();
	text('SURVEILLANCE DU RÉSEAU · ' + (j ? dateLongue(j.date).toUpperCase() : ''), z.x + 32, z.y + 32);
	fill(C.texte);
	textFont(POLICE_DONNEES);
	textStyle(BOLD);
	textSize(110);
	text(String(hA.h).padStart(2, '0') + ':' + String(hA.m).padStart(2, '0'), z.x + 32, z.y + 80);
	textStyle(NORMAL);
	textSize(26);
	fill(C.accent);
	if (tempsCompresse()) text('▶▶ temps accéléré ×' + IMMERSION.compression, z.x + 36, z.y + 210);
	textFont(POLICE_TEXTE);
	textSize(26);
	fill(C.texte);
	const prochain = Jeu.prochainDuJour();
	text(prochain ? 'Aucun incident en cours. Le réseau roule.' : 'Plus aucun incident prévu aujourd’hui. Fin de service à ' + Jeu.formaterHeure(Jeu.finJournee()) + '.', z.x + 32, z.y + 270, z.l - 64, 90);
	textSize(20);
	fill(C.gris);
	const restants = Jeu.paquet.length - Jeu.index;
	text('Dossiers restant cette semaine : ' + restants + ' / ' + Jeu.paquet.length + '\nJour ' + (Jeu.jourIndex + 1) + ' sur ' + Jeu.jours.length, z.x + 32, z.y + 380, z.l - 64, 80);
	if (enSieste) {
		fill(C.orange);
		textSize(22);
		text('Zzz… vous somnolez au bureau.', z.x + 32, z.y + 480);
	}
}

// ——— Mail de fin de journée (§ 6), affiché dans l'écran du PC ———
let mailCalcule = null;
function dessinerMail() {
	if (!mailCalcule || mailCalcule.jour !== Jeu.jourIndex) mailCalcule = Object.assign(Jeu.mailDuJour(), { jour: Jeu.jourIndex });
	const m = mailCalcule;
	const x = 140;
	const y = 90;
	const l = L - 280;
	const h = H - 180;
	voile();
	panneau(x, y, l, h, m.positif ? C.vert : C.rouge);
	// Barre de la messagerie
	noStroke();
	fill(C.accent);
	rect(x, y, l, 64, 12, 12, 0, 0);
	fill(C.panneau);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(24);
	textAlign(LEFT, CENTER);
	text('Messagerie de la salle · 1 nouveau message', x + 32, y + 32);
	textStyle(NORMAL);
	textAlign(LEFT, TOP);
	textFont(POLICE_DONNEES);
	textSize(20);
	fill(C.gris);
	text('De : ' + m.de, x + 48, y + 96);
	text('À : régulateur · poste 3', x + 48, y + 126);
	fill(C.texte);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(32);
	text(m.objet, x + 48, y + 168, l - 96, 50);
	textStyle(NORMAL);
	textSize(23);
	let ty = y + 240;
	m.lignes.forEach((ligne, i) => {
		const estFait = /^\d{2}:\d{2} – /.test(ligne);
		fill(!estFait ? C.texte : ligne.includes('(bon choix !)') ? C.vert : C.rouge);
		textFont(estFait ? POLICE_DONNEES : POLICE_TEXTE);
		textSize(estFait ? 20 : 23);
		text((estFait ? '• ' : '') + ligne, x + 48, ty, l - 96, 80);
		ty += textWidth(ligne) > l - 120 ? 62 : 38;
	});
	fill(C.gris);
	textFont(POLICE_TEXTE);
	textSize(20);
	text('— La direction', x + 48, Math.min(ty + 10, y + h - 150));
	bouton(x + l - 400, y + h - 104, 352, 72, m.dernier ? 'Bilan de la semaine (Entrée)' : 'Journée suivante (Entrée)', journeeSuivante);
}

// ——— Intro SMS (§ 2) ———
function lancerIntroSMS() {
	smsActif = true;
	smsIndex = 0;
	Confort.Son.bip('dossier');
}
function smsSuivant() {
	if (smsIndex < SMS.length - 1) {
		smsIndex++;
		Confort.Son.bip('choix');
	}
}
function terminerIntro() {
	smsActif = false;
	introVue = true;
	demarrerJournee();
	vue = 'bureau'; // on arrive au bureau : l'ouverture est à 6h
}

function dessinerSMS() {
	// Fond distinct (nuit bleutée) et téléphone au centre
	noStroke();
	fill('#16212b');
	rect(0, 0, L, H);
	for (let i = 0; i < 40; i++) {
		fill(255, 255, 255, 10 + (i % 3) * 6);
		rect((i * 211) % L, (i * 137) % H, 3, 3);
	}
	const tl = 560;
	const th = 960;
	const tx = (L - tl) / 2;
	const ty = (H - th) / 2;
	fill('#0b1116');
	rect(tx - 14, ty - 14, tl + 28, th + 28, 48);
	fill('#f3eee2');
	rect(tx, ty, tl, th, 36);
	// En-tête de la conversation
	fill(C.accent);
	rect(tx, ty, tl, 96, 36, 36, 0, 0);
	fill('#FFFDF7');
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(26);
	textAlign(CENTER, CENTER);
	text('Camille · cheffe de salle', L / 2, ty + 40);
	textStyle(NORMAL);
	textSize(16);
	text('Salle de régulation', L / 2, ty + 70);
	// Bulles
	let y = ty + 120;
	textAlign(LEFT, TOP);
	for (let i = 0; i <= smsIndex; i++) {
		const sms = SMS[i];
		const moi = sms.de === 'moi';
		textFont(POLICE_TEXTE);
		textSize(22);
		const largeurMax = tl - 160;
		const lignes = Math.ceil(textWidth(sms.texte) / (largeurMax - 40)) || 1;
		const bh = 24 + lignes * 30;
		const bl = Math.min(largeurMax, textWidth(sms.texte) + 40);
		const bx = moi ? tx + tl - 24 - bl : tx + 24;
		fill(moi ? C.accent : '#ffffff');
		rect(bx, y, bl, bh, 18);
		fill(moi ? '#FFFDF7' : C.texte);
		text(sms.texte, bx + 20, y + 12, bl - 40, bh);
		y += bh + 16;
	}
	// Commandes
	const dernier = smsIndex === SMS.length - 1;
	textFont(POLICE_DONNEES);
	textSize(16);
	fill(C.gris);
	textAlign(CENTER, TOP);
	text(dernier ? '' : 'Clic ou Entrée : message suivant', L / 2, ty + th - 120);
	if (dernier) bouton(tx + 60, ty + th - 110, tl - 120, 72, 'Commencer (Entrée)', terminerIntro);
	else boutons.push({ x: tx, y: ty, l: tl, h: th, action: smsSuivant });
}

// ——— Fenêtres du bureau : menu Échap (§ 1) et livre « stress » (§ 7) ———
function fenetreMenu() {
	const l = 640;
	const h = 470;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.accent);
	textAlign(CENTER, TOP);
	noStroke();
	fill(C.accent);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(40);
	text('Menu', L / 2, y + 36);
	textStyle(NORMAL);
	textSize(18);
	fill(C.gris);
	text('Le temps continue de passer au bureau.', L / 2, y + 92);
	bouton(x + 80, y + 140, l - 160, 72, 'Reprendre (Échap)', fermer);
	bouton(x + 80, y + 230, l - 160, 72, 'Paramètres', () => (fenetre = 'parametres'), false, true);
	bouton(x + 80, y + 320, l - 160, 72, 'Quitter la partie', quitterPartie, false, true);
}

function quitterPartie() {
	fenetre = null;
	enSieste = false;
	reveil = null;
	retourAccueil();
}

function fenetreLivreStress() {
	const l = 1000;
	const h = 860;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	// Page de livre : papier, marge, reliure
	noStroke();
	fill('#6e4a2c');
	rect(x - 16, y - 16, l + 32, h + 32, 10);
	fill('#f7f1e1');
	rect(x, y, l, h, 6);
	fill('#e6dcc4');
	rect(x, y, 26, h);
	textAlign(LEFT, TOP);
	fill('#3f7a43');
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(40);
	text(LIVRE_STRESS[0], x + 70, y + 50, l - 140, 60);
	textStyle(NORMAL);
	textSize(25);
	fill(C.texte);
	let ty = y + 140;
	LIVRE_STRESS.slice(1).forEach((p) => {
		text(p, x + 70, ty, l - 140, 110);
		ty += 120;
	});
	bouton(x + l - 300, y + h - 100, 240, 64, 'Fermer (Échap)', fermer);
}

// ——— Overlay de réveil (§ 4) ———
function dessinerReveil() {
	const reste = Math.max(0, reveil.limite - millis());
	voile();
	const l = 720;
	const h = 300;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.rouge);
	textAlign(CENTER, TOP);
	noStroke();
	fill(C.rouge);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(40);
	text('Alerte ! Un incident arrive', L / 2, y + 36);
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	textSize(22);
	fill(C.texte);
	text((reste / 1000).toFixed(1).replace('.', ',') + ' s pour réagir', L / 2, y + 98);
	bouton(x + 120, y + 160, l - 240, 90, 'Se réveiller (Espace)', seReveiller);
}

// ——— Personnage qui somnole au bureau (§ 4), en pixel art ———
function dessinerPersonnageSieste(g) {
	// Vu de dos, avachi dans le fauteuil, mains derrière la tête ; « Z » qui montent (bureau.js : fauteuil en 212..268)
	if (!enSieste) return;
	const bob = reduireAnimations ? 0 : Math.round(Math.sin(millis() / 700));
	const cx = 241;
	const y = 160 + bob;
	// Épaules / dos du pull au-dessus du dossier
	px(g, P.contour, cx - 20, y + 14, 40, 6);
	px(g, P.tissuClair, cx - 19, y + 15, 38, 5);
	// Bras repliés, coudes écartés
	px(g, P.contour, cx - 26, y - 2, 10, 18);
	px(g, P.tissuClair, cx - 25, y - 1, 8, 16);
	px(g, P.contour, cx + 16, y - 2, 10, 18);
	px(g, P.tissuClair, cx + 17, y - 1, 8, 16);
	// Tête (cheveux, vue de dos) et mains croisées derrière
	disque(g, cx, y + 2, 10, P.contour);
	disque(g, cx, y + 2, 9, '#4a2f1d');
	disque(g, cx - 3, y - 1, 4, '#62412a');
	px(g, '#e0a87a', cx - 10, y + 4, 20, 4); // mains
	px(g, P.contour, cx - 10, y + 8, 20, 1);
	px(g, '#e0a87a', cx - 11, y + 2, 2, 4); // oreilles
	px(g, '#e0a87a', cx + 9, y + 2, 2, 4);
	const t = reduireAnimations ? 2 : Math.floor(millis() / 600) % 3;
	for (let k = 0; k <= t; k++) textePixel(g, 'Z', cx + 14 + k * 6, y - 16 - k * 8, '#f7f1e1');
}

// ——— Livres posés sur le plateau (§ 7) : placeholder pixel art (dos + titre) ———
function dessinerLivres(g) {
	const t = OBJETS_BUREAU[1];
	const s = OBJETS_BUREAU[2];
	boite(g, t.x, t.y, t.l, t.h, '#2e6fb5', '#5a95d6', '#1d4f86');
	textePixel(g, 'TUTO', t.x + 10, t.y + 1, '#f7f1e1');
	boite(g, s.x, s.y, s.l, s.h, '#3f7a43', '#5f9e4f', '#2f5d3a');
	textePixel(g, 'STRESS', s.x + 4, s.y + 1, '#f7f1e1');
}

function ouvrirObjetBureau(nom) {
	interaction();
	if (nom === 'ecran') return sAsseoir();
	if (nom === 'tuto') return ouvrir('aide'); // reprend l'écran d'aide H
	if (nom === 'stress') return ouvrir('livre-stress');
}

/** Zones cliquables du bureau (livres) + focus clavier ; appelé par la vue bureau */
function zonesObjetsBureau() {
	OBJETS_BUREAU.slice(1).forEach((o, i) => {
		const r = { x: o.x * PIX, y: o.y * PIX, l: o.l * PIX, h: o.h * PIX };
		boutons.push({ x: r.x, y: r.y, l: r.l, h: r.h, action: () => ouvrirObjetBureau(o.nom) });
		const survol = mouseX >= r.x && mouseX <= r.x + r.l && mouseY >= r.y && mouseY <= r.y + r.h;
		if (survol || focusBureau === i + 1) {
			noFill();
			stroke('#f2c94c');
			strokeWeight(PIX);
			rect(r.x - 2 * PIX, r.y - 2 * PIX, r.l + 4 * PIX, r.h + 4 * PIX);
			noStroke();
			infobulle(o.label + ' — Entrée pour ouvrir', r.x, r.y - 70);
		}
	});
	if (focusBureau === 0) {
		const e = rectEcranPC();
		noFill();
		stroke('#f2c94c');
		strokeWeight(PIX);
		rect(e.x - 8 * PIX, e.y - 8 * PIX, e.l + 16 * PIX, e.h + 18 * PIX);
		noStroke();
	}
}

function infobulle(texte, x, y) {
	textFont(POLICE_DONNEES);
	textSize(18);
	const l = textWidth(texte) + 28;
	noStroke();
	fill(28, 39, 51, 230);
	rect(x, y, l, 40, 6);
	fill('#FFFDF7');
	textAlign(LEFT, CENTER);
	text(texte, x + 14, y + 20);
}
