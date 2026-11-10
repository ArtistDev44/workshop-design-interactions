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
	{ de: 'moi', texte: T('sms.0') },
	{ de: T('sms.camille'), texte: T('sms.1') },
	{ de: T('sms.camille'), texte: T('sms.2') },
	{ de: T('sms.camille'), texte: T('sms.3') },
	{ de: T('sms.camille'), texte: T('sms.4') },
	{ de: 'moi', texte: T('sms.5') },
];

const LIVRE_STRESS = [0, 1, 2, 3, 4, 5].map((n) => T('stress.' + n));

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
	{ nom: 'ecran', label: T('objet.ecran') },
	{ nom: 'tuto', label: T('objet.tuto'), x: 58, y: 190, l: 50, h: 9 },
	{ nom: 'stress', label: T('objet.stress'), x: 62, y: 180, l: 44, h: 9 },
	{ nom: 'porte', label: T('objet.porte'), infobulle: T('bureau.porte'), x: 3, y: 40, l: 20, h: 118 }, // prompt 26
	// Prompt 29 : objets de la pièce (micro-interactions, sans effet sur les jauges ni pause)
	{ nom: 'lampe', piece: true, label: T('piece.lampe'), infobulle: T('piece.lampe.survol'), x: 62, y: 140, l: 26, h: 12 },
	{ nom: 'plante', piece: true, label: T('piece.plante'), infobulle: T('piece.plante.survol'), x: 69, y: 153, l: 16, h: 21 },
	{ nom: 'tasse', piece: true, label: T('piece.tasse'), infobulle: T('piece.tasse.survol'), x: 118, y: 178, l: 22, h: 28 },
	{ nom: 'dossiers', piece: true, label: T('piece.dossiers'), infobulle: T('piece.dossiers.survol'), x: 390, y: 160, l: 44, h: 15 },
	{ nom: 'fenetre', piece: true, label: T('piece.fenetre'), infobulle: T('piece.fenetre.survol'), x: 340, y: 14, l: 132, h: 96 },
];

// ——— Prompt 29 : interactions hors écran, dans la pièce ———
const CLE_LAMPE = 'pxe-nte001:jeu:lampe';
const PIECE = {
	lampe: (() => {
		try {
			return localStorage.getItem(CLE_LAMPE) !== 'eteinte';
		} catch (e) {
			return true;
		}
	})(),
	store: false, // store vénitien de la baie : baissé (true) ou relevé (false)
	message: null, // { texte, objet, jusqua }
};

/** Météo affichée par la fenêtre : jour joué (archives) → météo réelle du moment → instantané local */
function meteoFenetre() {
	const j = ecran === 'jeu' && Jeu.jourCourant ? Jeu.jourCourant() : null;
	const m = (j && Jeu.meteoDuJour(j.date)) || Jeu.meteoActuelle || (Jeu.fallback && Jeu.fallback.meteo && Jeu.fallback.meteo[0]) || null;
	return m;
}
const nombreFr = (v) => (Langue.actuelle === 'fr' ? String(v).replace('.', ',') : String(v));

function interagirPiece(nom) {
	const hS = heureAffichee();
	const heure = String(hS.h).padStart(2, '0') + ':' + String(hS.m).padStart(2, '0');
	let texte;
	if (nom === 'lampe') {
		PIECE.lampe = !PIECE.lampe;
		try {
			localStorage.setItem(CLE_LAMPE, PIECE.lampe ? 'allumee' : 'eteinte');
		} catch (e) {}
		texte = t(PIECE.lampe ? 'piece.lampe.on' : 'piece.lampe.off');
	} else if (nom === 'fenetre') {
		PIECE.store = !PIECE.store;
		const m = meteoFenetre();
		const maintenant = new Date();
		const reelle = String(maintenant.getHours()).padStart(2, '0') + ':' + String(maintenant.getMinutes()).padStart(2, '0');
		const meteo = m
			? t('piece.fenetre.meteo', { date: m.date ? m.date.split('-').reverse().join('/') : '', min: nombreFr(m.temp_min), max: nombreFr(m.temp_max), pluie: nombreFr(m.pluie_mm), vent: nombreFr(m.rafales_max) })
			: t('piece.fenetre.inconnue');
		texte = t(PIECE.store ? 'piece.fenetre.ferme' : 'piece.fenetre.ouvre') + ' ' + meteo + ' ' + t('piece.fenetre.heures', { reelle, jeu: heure });
	} else if (nom === 'plante') {
		const m = meteoFenetre();
		texte = m && m.pluie_mm >= 1 ? t('piece.plante.pluie', { pluie: nombreFr(m.pluie_mm) }) : t('piece.plante.sec', { heure });
	} else if (nom === 'tasse') {
		const j = ecran === 'jeu' && Jeu.jourCourant ? Jeu.jourCourant() : null;
		texte = j ? t('piece.tasse.jour', { heure, n: j.dossiers.length }) : t('piece.tasse.libre', { heure });
	} else if (nom === 'dossiers') {
		const j = ecran === 'jeu' && Jeu.jourCourant ? Jeu.jourCourant() : null;
		texte = j ? t('piece.dossiers.jour', { n: j.dossiers.length, date: j.date.split('-').reverse().join('/') }) : t('piece.dossiers.libre');
	}
	PIECE.message = { texte, objet: nom, jusqua: millis() + 5000 };
	dernierRenduBureau = 0; // la pièce est redessinée tout de suite (lampe, store)
	annoncer(texte);
	Confort.Son.bip('choix');
}

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
			if (Jeu.finDeJourneeTactique) Jeu.finDeJourneeTactique(); // prompt 23 : objectif du jour, budget épuisé
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
	text(t('surv.titre', { date: j ? dateLongue(j.date).toUpperCase() : '' }), z.x + 32, z.y + 32);
	fill(C.texte);
	textFont(POLICE_DONNEES);
	textStyle(BOLD);
	textSize(110);
	text(String(hA.h).padStart(2, '0') + ':' + String(hA.m).padStart(2, '0'), z.x + 32, z.y + 80);
	textStyle(NORMAL);
	textSize(26);
	fill(C.accent);
	if (tempsCompresse()) text(t('surv.accelere', { x: IMMERSION.compression }), z.x + 36, z.y + 210);
	textFont(POLICE_TEXTE);
	textSize(26);
	fill(C.texte);
	const prochain = Jeu.prochainDuJour();
	text(prochain ? t('surv.calme') : t('surv.fin', { heure: Jeu.formaterHeure(Jeu.finJournee()) }), z.x + 32, z.y + 270, z.l - 64, 90);
	textSize(20);
	fill(C.gris);
	const restants = Jeu.paquet.length - Jeu.index;
	text(t('surv.restants', { n: restants, total: Jeu.paquet.length, j: Jeu.jourIndex + 1, jours: Jeu.jours.length }), z.x + 32, z.y + 380, z.l - 64, 80);
	if (enSieste) {
		fill(C.orange);
		textSize(22);
		text(t('surv.sieste'), z.x + 32, z.y + 480);
	}
}

// ——— Mail de fin de journée (§ 6), affiché dans l'écran du PC ———
let mailCalcule = null;
function dessinerMail() {
	// Messagerie du PC — Pixel Design System (fond noir, angles droits, titres pixel, bouton primaire rouge)
	if (!mailCalcule || mailCalcule.jour !== Jeu.jourIndex) mailCalcule = Object.assign(Jeu.mailDuJour(), { jour: Jeu.jourIndex });
	const m = mailCalcule;
	const x = 140;
	const y = 90;
	const l = L - 280;
	const h = H - 180;
	noStroke();
	fill(13, 12, 12, 200);
	rect(0, 0, L, H);
	dsPanneau(x, y, l, h, t('mailf.titre'), m.positif ? 'rgba(0,251,116,0.12)' : 'rgba(212,3,28,0.25)');
	dsBadge(x + l - 120, y + 30, t('mailf.nouveau'), m.positif ? 'succes' : 'erreur');
	dsTexte(t('mailf.de', { de: m.de }), x + 32, y + 84, 20, DS.blanc50, 'left');
	dsTexte(t('mailf.a'), x + 32, y + 114, 20, DS.blanc50, 'left');
	dsTitre(String(m.objet).toUpperCase(), x + 32, y + 156, 28, DS.blanc, 'left');
	let ty = y + 220;
	m.lignes.forEach((ligne) => {
		const estFait = !!ligne.fait;
		const ok = !!ligne.ok;
		if (estFait) {
			noStroke();
			fill(ok ? DS.succes : DS.primaire);
			rect(x + 32, ty + 4, 6, 22);
		}
		dsTexte(ligne, x + (estFait ? 50 : 32), ty, estFait ? 19 : 21, estFait ? (ok ? DS.succesClair : DS.erreurClair) : DS.blanc, 'left', l - 100);
		textFont(DS.policeTexte);
		textSize(estFait ? 19 : 21);
		ty += textWidth(ligne) > l - 110 ? 60 : 36;
	});
	dsTexte(t('mailf.signature'), x + 32, Math.min(ty + 10, y + h - 150), 20, DS.blanc50, 'left');
	dsBouton(x + l - 420, y + h - 96, 388, 64, t(m.dernier ? 'mailf.bilan' : 'mailf.suivante'), journeeSuivante, 'primaire');
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
	text(t('sms.camille'), L / 2, ty + 40);
	textStyle(NORMAL);
	textSize(16);
	text(t('intro.salle'), L / 2, ty + 70);
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
	text(dernier ? '' : t('intro.suivant'), L / 2, ty + th - 120);
	if (dernier) bouton(tx + 60, ty + th - 110, tl - 120, 72, t('intro.commencer'), terminerIntro);
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
	text(t('menu.titre'), L / 2, y + 36);
	textStyle(NORMAL);
	textSize(18);
	fill(C.gris);
	text(t('menu.temps'), L / 2, y + 92);
	bouton(x + 80, y + 140, l - 160, 72, t('menu.reprendre'), fermer);
	bouton(x + 80, y + 230, l - 160, 72, t('accueil.parametres'), () => (fenetre = 'parametres'), false, true);
	bouton(x + 80, y + 320, l - 160, 72, t('menu.quitter'), quitterPartie, false, true);
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
	bouton(x + l - 300, y + h - 100, 240, 64, t('commun.fermer'), fermer);
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
	text(t('reveil.titre'), L / 2, y + 36);
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	textSize(22);
	fill(C.texte);
	text(t('reveil.reste', { s: (reste / 1000).toFixed(1).replace('.', Langue.actuelle === 'fr' ? ',' : '.') }), L / 2, y + 98);
	bouton(x + 120, y + 160, l - 240, 90, t('reveil.bouton'), seReveiller);
}

// ——— Personnage qui somnole au bureau (§ 4), en pixel art ———
function dessinerPersonnageSieste(g) {
	// Vue à la première personne : les paupières s'alourdissent (bandes sombres en haut et en bas), « Z » au centre
	if (!enSieste) return;
	const respir = reduireAnimations ? 0 : Math.round((Math.sin(millis() / 900) + 1) * 4);
	const h = 74 + respir;
	px(g, '#120c0a', 0, 0, BW, h);
	px(g, '#120c0a', 0, BH - h, BW, h);
	px(g, '#3a2a22', 0, h - 3, BW, 3);
	px(g, '#3a2a22', 0, BH - h, BW, 3);
	const t = reduireAnimations ? 2 : Math.floor(millis() / 600) % 3;
	for (let k = 0; k <= t; k++) textePixel(g, 'Z', BW / 2 + 40 + k * 7, 60 - k * 9, '#f7f1e1');
}

// ——— Livres posés sur le plateau (§ 7) : placeholder pixel art (dos + titre) ———
function dessinerLivres(g) {
	const t = OBJETS_BUREAU[1];
	const s = OBJETS_BUREAU[2];
	boite(g, t.x, t.y, t.l, t.h, '#2e6fb5', '#5a95d6', '#1d4f86');
	textePixel(g, 'TUTO', t.x + 17, t.y + 2, '#f7f1e1');
	boite(g, s.x, s.y, s.l, s.h, '#3f7a43', '#5f9e4f', '#2f5d3a');
	textePixel(g, 'STRESS', s.x + 10, s.y + 2, '#f7f1e1');
}

function ouvrirObjetBureau(nom) {
	interaction();
	if (nom === 'ecran') return sAsseoir();
	if (nom === 'tuto') return ouvrir('aide'); // reprend l'écran d'aide H
	if (nom === 'stress') return ouvrir('livre-stress');
	if (nom === 'porte') return ouvrir('menu'); // prompt 26 : même action qu'Échap au bureau
	if (OBJETS_BUREAU.some((o) => o.nom === nom && o.piece)) return interagirPiece(nom); // prompt 29
}

/** Zones cliquables du bureau (livres) + focus clavier ; appelé par la vue bureau */
function zonesObjetsBureau() {
	OBJETS_BUREAU.slice(1).forEach((o, i) => {
		const r = versEcranBureau(o.x, o.y, o.l, o.h); // prompt 25 : suit le dézoom et la caméra
		boutons.push({ x: r.x, y: r.y, l: r.l, h: r.h, action: () => ouvrirObjetBureau(o.nom) });
		const survol = mouseX >= r.x && mouseX <= r.x + r.l && mouseY >= r.y && mouseY <= r.y + r.h;
		const enReaction = PIECE.message && PIECE.message.objet === o.nom && millis() < PIECE.message.jusqua; // prompt 29
		if (survol || focusBureau === i + 1) {
			noFill();
			stroke('#f2c94c');
			strokeWeight(PIX);
			rect(r.x - 2 * PIX, r.y - 2 * PIX, r.l + 4 * PIX, r.h + 4 * PIX);
			noStroke();
			const ib = o.infobulle ? String(o.infobulle) : t('objet.ouvrir', { label: o.label });
			if (!enReaction) infobulle(ib, Math.max(16, Math.min(r.x, L - textWidth(ib) - 60)), r.y < 120 ? r.y + r.h + 24 : r.y - 70);
		}
	});
	// Prompt 29 : réaction de l'objet (5 s), au-dessus de l'objet, sans pause ni effet sur les jauges
	if (PIECE.message && millis() < PIECE.message.jusqua) {
		const o = OBJETS_BUREAU.find((x) => x.nom === PIECE.message.objet);
		const r = versEcranBureau(o.x, o.y, o.l, o.h);
		bulleTexte(PIECE.message.texte, r.x + r.l / 2, r.y < 160 ? r.y + r.h + 20 : r.y - 20, r.y < 160);
	}
	if (focusBureau === 0) {
		const e = rectEcranPC();
		noFill();
		stroke('#f2c94c');
		strokeWeight(PIX);
		rect(e.x - 7 * PIX, e.y - 7 * PIX, e.l + 14 * PIX, e.h + 15 * PIX);
		noStroke();
	}
}

/** Bulle de texte multiligne (max 560 px), centrée sur x ; au-dessus de y, ou en dessous si dessous = true */
function bulleTexte(texte, x, y, dessous) {
	textFont(POLICE_DONNEES);
	textSize(18);
	const l = Math.min(560, textWidth(texte) + 32);
	const lignes = Math.max(1, Math.ceil((textWidth(texte) * 1.08) / (l - 32))); // marge pour le retour à la ligne par mots
	const h = 20 + lignes * 24;
	const bx = constrain(x - l / 2, 16, L - l - 16);
	const by = dessous ? y : y - h;
	noStroke();
	fill(28, 39, 51, 240);
	rect(bx, by, l, h, 8);
	fill('#FFFDF7');
	textAlign(LEFT, TOP);
	textLeading(24);
	text(texte, bx + 16, by + 10, l - 32, h - 10);
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
