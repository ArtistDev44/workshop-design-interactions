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
	{ nom: 'commande', label: T('objet.commande'), x: 58, y: 190, l: 50, h: 9 }, // prompt 34 : remplace le livre « tuto »
	{ nom: 'stress', label: T('objet.stress'), x: 62, y: 180, l: 44, h: 9 },
	// Prompt 29 : objets de la pièce (micro-interactions, sans effet sur les jauges ni pause)
	{ nom: 'lampe', piece: true, label: T('piece.lampe'), infobulle: T('piece.lampe.survol'), x: 410, y: 86, l: 16, h: 14 }, // prompt 31 : applique murale (recalée pour le plein écran)
	{ nom: 'plante', piece: true, label: T('piece.plante'), infobulle: T('piece.plante.survol'), x: 69, y: 153, l: 16, h: 21 },
	{ nom: 'tasse', piece: true, label: T('piece.tasse'), infobulle: T('piece.tasse.survol'), x: 118, y: 178, l: 22, h: 28 },
	{ nom: 'telephone', label: T('objet.telephone'), infobulle: T('objet.telephone.survol'), x: 364, y: 192, l: 26, h: 32 }, // prompt 38
	{ nom: 'dossiers', piece: true, label: T('piece.dossiers'), infobulle: T('piece.dossiers.survol'), x: 390, y: 160, l: 44, h: 15 },
	{ nom: 'fenetre', piece: true, label: T('piece.fenetre'), infobulle: T('piece.fenetre.survol'), x: 334, y: 14, l: 64, h: 96 }, // prompt 31 : la baie s'arrête au pan de mur
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
	if (ecran !== 'jeu' || !Jeu.horloge || phase === 'fin' || phase === 'mail' || smsActif || enPause || tutoriel) return; // prompt 34 : le tutoriel suspend le temps
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
			Confort.Son.bip('mail'); // prompt 30 : carillon de notification
			Sauvegarde.auto(true); // prompt 33 : fin de journée
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
	Confort.Son.bip('consequence'); // prompt 30
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
	Sauvegarde.auto(false); // prompt 33
}

function allerFin() {
	phase = 'fin';
	Sauvegarde.auto(false); // prompt 33 : partie finie → sa sauvegarde est effacée (le meilleur bilan reste)
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
	if (!tutorielVu() && !GUIDE.actif) lancerTutoriel(); // prompt 34 : à la première partie, juste après les SMS (sauf guide)
}

// =====================================================================
// Prompt 34 — vrai tutoriel guidé (5 étapes), superposé à l'écran ; le temps du jeu est suspendu.
// Relancé depuis le livre « commande » et l'aide (T). « Tutoriel vu » persiste dans localStorage.
// =====================================================================
const CLE_TUTORIEL = 'pxe-nte001-tutoriel-vu';
const ETAPES_TUTORIEL = 5;
let tutoriel = null; // { etape, focus: 'suivant' | 'passer' }
function tutorielVu() {
	try {
		return localStorage.getItem(CLE_TUTORIEL) === 'oui';
	} catch (e) {
		return false;
	}
}
function lancerTutoriel() {
	fenetre = null;
	tutoriel = { etape: 0, focus: 'suivant', tourne: 0, sens: 1 };
	livreOuverture = millis();
	annoncerEtapeTutoriel();
}
function annoncerEtapeTutoriel() {
	const n = tutoriel.etape + 1;
	annoncer(t('tuto.etape', { n, total: ETAPES_TUTORIEL }) + ' — ' + t('tuto.' + n + '.titre') + '. ' + t('tuto.' + n + '.texte'));
}
function fermerTutoriel() {
	tutoriel = null;
	try {
		localStorage.setItem(CLE_TUTORIEL, 'oui');
	} catch (e) {}
	interaction();
}
function etapeSuivante() {
	if (!tutoriel) return;
	if (tutoriel.etape >= ETAPES_TUTORIEL - 1) return fermerTutoriel();
	tutoriel.etape++;
	tutoriel.tourne = millis(); // la page tourne vers la gauche
	tutoriel.sens = 1;
	tutoriel.focus = 'suivant';
	Confort.Son.bip('choix');
	annoncerEtapeTutoriel();
}
function etapePrecedente() {
	if (!tutoriel || tutoriel.etape === 0) return;
	tutoriel.etape--;
	tutoriel.tourne = millis();
	tutoriel.sens = -1;
	annoncerEtapeTutoriel();
}
function dessinerTutoriel() {
	if (!tutoriel) return;
	boutons = []; // seul le tutoriel est cliquable
	voile();
	const n = tutoriel.etape + 1;
	// Le tutoriel est le livre « Commande » ouvert : couverture marine, page gauche = étape, page droite = texte
	const livre = dessinerLivreOuvert(L / 2 - 680, 120, 1360, 700, '#1c2f52', '#121f38');
	if (livre.pret) {
		const g = livre.gauche;
		const d = livre.droite;
		noStroke();
		textAlign(LEFT, TOP);
		textFont(POLICE_DONNEES);
		textSize(20);
		fill('#6b5d45');
		text(t('tuto.etape', { n, total: ETAPES_TUTORIEL }), g.x, g.y);
		for (let i = 0; i < ETAPES_TUTORIEL; i++) {
			fill(i <= tutoriel.etape ? '#1c2f52' : '#d9cfb8');
			rect(g.x + i * 30, g.y + 40, 20, 8, 4);
		}
		fill('#1c2f52');
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textSize(46);
		textLeading(56);
		text(t('tuto.' + n + '.titre'), g.x, g.y + 90, g.l, 200);
		textStyle(NORMAL);
		textSize(19);
		fill('#6b5d45');
		text(t('tuto.pied'), g.x, g.y + g.h - 60, g.l, 60);
		fill('#1c2733');
		textSize(23);
		textLeading(34);
		text(t('tuto.' + n + '.texte'), d.x, d.y, d.l, d.h);
		textLeading(30);
		pageQuiTourne(livre, tutoriel.tourne, tutoriel.sens);
	}
	// Boutons sous le livre
	const by = 120 + 700 + 40;
	const lb = 300;
	const derniere = n === ETAPES_TUTORIEL;
	const pos = { passer: L / 2 - 680, precedent: L / 2 - 680 + 320, suivant: L / 2 + 680 - lb };
	bouton(pos.suivant, by, lb, 68, t(derniere ? 'tuto.terminer' : 'tuto.suivant'), etapeSuivante);
	bouton(pos.passer, by, lb, 68, t('tuto.passer'), fermerTutoriel, false, true);
	if (tutoriel.etape > 0) bouton(pos.precedent, by, lb, 68, t('tuto.precedent'), etapePrecedente, false, true);
	noFill();
	stroke('#f2c94c');
	strokeWeight(4);
	rect(pos[tutoriel.focus] - 8, by - 8, lb + 16, 84, 14);
	noStroke();
}

/** Clavier du tutoriel : Entrée = bouton focalisé, → suivant, ← précédent, Tab = focus, Échap = passer */
function toucheTutoriel() {
	if (!tutoriel) return false;
	const ordre = tutoriel.etape > 0 ? ['suivant', 'passer', 'precedent'] : ['suivant', 'passer'];
	if (keyCode === TAB) {
		const i = ordre.indexOf(tutoriel.focus);
		tutoriel.focus = ordre[(i + (keyIsDown(SHIFT) ? ordre.length - 1 : 1)) % ordre.length];
		annoncer(t('tuto.' + tutoriel.focus));
	} else if (keyCode === ESCAPE) fermerTutoriel();
	else if (keyCode === RIGHT_ARROW) etapeSuivante();
	else if (keyCode === LEFT_ARROW) etapePrecedente();
	else if (keyCode === ENTER || keyCode === RETURN || key === ' ') {
		if (tutoriel.focus === 'passer') fermerTutoriel();
		else if (tutoriel.focus === 'precedent') etapePrecedente();
		else etapeSuivante();
	}
	return true;
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
	fill('#FFFFFF');
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
// Prompt 35 : menu Échap modernisé (même style que le menu principal)
let choixPause = 0;
const ENTREES_PAUSE = [
	{ cle: 'menu.reprendre', icone: 'lecture', action: () => fermer() },
	{ cle: 'accueil.parametres', icone: 'reglages', action: () => (fenetre = 'parametres') },
	{ cle: 'accueil.aide', icone: 'aide', action: () => (fenetre = 'aide') },
	{ cle: 'menu.menuPrincipal', icone: 'menu', action: () => quitterPartie() },
];
function fenetreMenu() {
	const l = 700;
	const h = 640;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	noStroke();
	fill(13, 12, 12, 245);
	stroke(255, 255, 255, 38);
	strokeWeight(2);
	rect(x, y, l, h);
	noStroke();
	dsTitre(t('menu.titre'), x + 48, y + 40, 44, '#ffffff', 'left');
	noStroke();
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textSize(19);
	fill('rgba(255,255,255,0.78)');
	text(t('menu.temps'), x + 48, y + 104);
	ENTREES_PAUSE.forEach((e, i) => carteMenu(x + 48, y + 160 + i * 112, l - 96, 88, t(e.cle), null, e.action, i === choixPause, e.icone));
}

function quitterPartie() {
	if (ecran === 'jeu') Sauvegarde.auto(false); // prompt 35 : on retrouve la partie avec « Reprendre »
	fenetre = null;
	enSieste = false;
	reveil = null;
	retourAccueil();
}

function fenetreLivreStress() {
	// Le livre « Bien gérer son stress » s'ouvre : couverture verte, deux pages
	const livre = dessinerLivreOuvert(L / 2 - 680, 110, 1360, 720, '#3f7a43', '#2f5d3a');
	if (livre.pret) {
		const g = livre.gauche;
		const d = livre.droite;
		noStroke();
		textAlign(LEFT, TOP);
		fill('#2f5d3a');
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textSize(40);
		textLeading(50);
		text(LIVRE_STRESS[0], g.x, g.y, g.l, 120);
		textStyle(NORMAL);
		textSize(23);
		textLeading(32);
		fill('#1c2733');
		let ty = g.y + 150;
		LIVRE_STRESS.slice(1, 3).forEach((p) => {
			text(p, g.x, ty, g.l, 180);
			ty += 190;
		});
		ty = d.y;
		LIVRE_STRESS.slice(3).forEach((p) => {
			text(p, d.x, ty, d.l, 180);
			ty += 190;
		});
	}
	bouton(L / 2 + 680 - 260, 110 + 720 + 40, 260, 64, t('commun.fermer'), fermer);
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
	const tps = reduireAnimations ? 0 : millis();
	// Livre survolé ou focalisé : il se soulève de 2 px (ombre dessous) ; animations réduites : 1 px, sans transition
	const leve = (o) => (vue === 'bureau' && objetSurvol === o.nom ? (reduireAnimations ? 1 : 2) : 0);
	const lc = leve(t);
	const ls = leve(s);
	if (lc) ombreTramee(g, t.x, t.y + t.h, t.l, 2, 110);
	// Livre « commande » (dessous) : couverture marine, liseré doré, marque-page qui se balance
	const yc = t.y - lc;
	boite(g, t.x, yc, t.l, t.h, '#1c2f52', '#34507f', '#121f38');
	px(g, '#d9b45a', t.x + 2, yc + 1, 1, t.h - 2);
	textePixel(g, 'COMMANDE', t.x + 10, yc + 2, '#fff8e6');
	const balance = Math.round(Math.sin(tps / 650) * 1);
	px(g, '#b3261e', t.x + t.l - 8 + balance, yc + t.h, 2, 4);
	// Livre « stress » (dessus)
	if (ls) ombreTramee(g, s.x, s.y + s.h, s.l, 2, 110);
	const ys = s.y - ls - lc; // posé sur l'autre : il suit aussi le soulèvement du livre du dessous
	boite(g, s.x, ys, s.l, s.h, '#3f7a43', '#5f9e4f', '#2f5d3a');
	textePixel(g, 'STRESS', s.x + 10, ys + 2, '#f7f1e1');
}

// ——— Livres : soulevés au survol, ouverts en vrai livre (deux pages) quand on les clique ———
let objetSurvol = null; // objet survolé ou focalisé à l'image précédente
let livreOuverture = 0; // millis() de l'ouverture du livre affiché
const DUREE_OUVERTURE_LIVRE = 450;
const DUREE_PAGE = 380;

/** Dessine un livre ouvert (couverture, deux pages, dos, tranches, marque-page) ; s'ouvre depuis le dos.
 *  Renvoie les zones de texte des deux pages et « pret » quand l'ouverture est assez avancée pour écrire. */
function dessinerLivreOuvert(x, y, l, h, couv, couvSombre) {
	const k = reduireAnimations ? 1 : easeOut(constrain((millis() - livreOuverture) / DUREE_OUVERTURE_LIVRE, 0, 1));
	const cx = x + l / 2;
	const demi = (l / 2) * Math.max(0.04, k);
	noStroke();
	fill(0, 0, 0, 70);
	rect(cx - demi + 14, y + 22, demi * 2, h, 14); // ombre portée
	fill(couvSombre);
	rect(cx - demi - 6, y - 6, demi * 2 + 12, h + 16, 12); // couverture
	fill(couv);
	rect(cx - demi, y - 10, demi * 2, h + 12, 10);
	// Tranches (feuilles empilées) puis pages
	for (let i = 3; i >= 1; i--) {
		fill(i % 2 ? '#e8dfc9' : '#f3ecda');
		rect(cx - demi + 12 + i * 2, y + 8 + i * 3, demi * 2 - 24 - i * 4, h - 22, 4);
	}
	fill('#fbf6ea');
	rect(cx - demi + 12, y + 6, demi - 12, h - 20, 6, 0, 0, 6);
	rect(cx, y + 6, demi - 12, h - 20, 0, 6, 6, 0);
	// Creux du dos : ombre douce au centre
	for (let i = 0; i < 6; i++) {
		fill(80, 60, 30, 26 - i * 4);
		rect(cx - 18 + i * 3, y + 6, 36 - i * 6, h - 20);
	}
	// Marque-page (ruban) qui dépasse en bas de la page droite
	fill('#b3261e');
	rect(cx + demi * 0.55, y + h - 20, 14, 46);
	triangle(cx + demi * 0.55, y + h + 26, cx + demi * 0.55 + 14, y + h + 26, cx + demi * 0.55 + 7, y + h + 16);
	const marge = 64;
	return {
		pret: k > 0.85,
		k,
		cx,
		y,
		h,
		demi,
		gauche: { x: cx - demi + 12 + marge, y: y + 60, l: demi - 12 - marge * 2, h: h - 140 },
		droite: { x: cx + marge, y: y + 60, l: demi - 12 - marge * 2, h: h - 140 },
	};
}

/** Une page qui tourne (vers la gauche si sens = 1) : la feuille se replie sur le dos puis retombe de l'autre côté */
function pageQuiTourne(livre, debut, sens) {
	if (reduireAnimations || !debut) return;
	const u = (millis() - debut) / DUREE_PAGE;
	if (u >= 1) return;
	const largeur = (livre.demi - 12) * Math.abs(1 - 2 * u); // 1 → 0 → 1
	const premiereMoitie = u < 0.5;
	const aDroite = sens > 0 ? premiereMoitie : !premiereMoitie;
	noStroke();
	fill(80, 60, 30, 40);
	rect(aDroite ? livre.cx : livre.cx - largeur - 8, livre.y + 6, largeur + 8, livre.h - 20); // ombre de la feuille
	fill('#fbf6ea');
	rect(aDroite ? livre.cx : livre.cx - largeur, livre.y + 6, largeur, livre.h - 20);
}

function ouvrirObjetBureau(nom) {
	interaction();
	if (nom === 'ecran') return sAsseoir();
	if (nom === 'telephone') return ouvrirTelephone(); // prompt 38 : notifications de l'Agenda Nantes Métropole
	if (nom === 'commande') return lancerTutoriel(); // prompt 34 : le livre « commande » ouvre le tutoriel
	if (nom === 'stress') return (livreOuverture = millis()), ouvrir('livre-stress');
	if (OBJETS_BUREAU.some((o) => o.nom === nom && o.piece)) return interagirPiece(nom); // prompt 29
}

/** Zones cliquables du bureau (livres) + focus clavier ; appelé par la vue bureau */
function zonesObjetsBureau() {
	objetSurvol = null;
	OBJETS_BUREAU.slice(1).forEach((o, i) => {
		const r = versEcranBureau(o.x, o.y, o.l, o.h); // prompt 25 : suit le dézoom et la caméra
		if (o.nom === 'commande') cibleGuide('livreCommande', r.x, r.y, r.l, r.h); // prompt 37
		boutons.push({ x: r.x, y: r.y, l: r.l, h: r.h, action: () => ouvrirObjetBureau(o.nom) });
		const survol = mouseX >= r.x && mouseX <= r.x + r.l && mouseY >= r.y && mouseY <= r.y + r.h;
		if (survol || focusBureau === i + 1) objetSurvol = o.nom; // les livres se soulèvent (dessinerLivres)
		const enReaction = PIECE.message && PIECE.message.objet === o.nom && millis() < PIECE.message.jusqua; // prompt 29
		if (survol || focusBureau === i + 1) {
			contourSurvol(r.x - 2 * PIX, r.y - 2 * PIX, r.l + 4 * PIX, r.h + 4 * PIX);
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
		contourSurvol(e.x - 7 * PIX, e.y - 7 * PIX, e.l + 14 * PIX, e.h + 15 * PIX);
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
	fill(13, 12, 12, 240);
	rect(bx, by, l, h);
	fill('#FFFFFF');
	textAlign(LEFT, TOP);
	textLeading(24);
	text(texte, bx + 16, by + 10, l - 32, h - 10);
}

function infobulle(texte, x, y) {
	textFont(POLICE_DONNEES);
	textSize(18);
	const l = textWidth(texte) + 28;
	noStroke();
	fill(13, 12, 12, 235);
	rect(x, y, l, 40);
	fill('#FFFFFF');
	textAlign(LEFT, CENTER);
	text(texte, x + 14, y + 20);
}
