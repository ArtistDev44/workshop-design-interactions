/* Nantes en régulation — mode « Prendre en main » (prompt 37).
 * Proposé à la première partie par une case dans l'écran « Nouvelle partie » (menu.js). Des flèches
 * montrent, une étape à la fois, ce qu'il est possible de faire ; chaque étape se valide quand le
 * joueur fait l'action (ou « Étape suivante » pour les étapes de lecture). Le guide ne fait jamais l'action à sa place.
 * Prompt 181 : guide CONTRAIGNANT — tant qu'une étape attend le joueur, seule sa cible (le trou du voile percé) et
 * les boutons de la bulle répondent ; tout le reste est ignoré et rappelle la consigne. Un seul filtre par type
 * d'entrée (guideBloque pour le pointeur, toucheGuide pour le clavier), fondé sur le rectangle de la cible et non sur
 * l'écran affiché. « Quitter le guide » (bouton, ou Échap deux fois) rend toutes les interactions.
 * Les cibles sont relevées au moment où les éléments sont dessinés (cibleGuide), dans l'espace où
 * ils le sont : écran du PC (« pc ») ou écran réel (« ecran »), puis converties à l'affichage.
 */
const CLE_GUIDE_OPTION = 'pxe-nte001-prise-en-main';
const CLE_GUIDE_FINI = 'pxe-nte001-prise-en-main-fini';
const GUIDE = { actif: false, etape: 0, debutEtape: 0, fin: 0, option: null, vu: 0, image: -9, trou: null, zones: [], focus: 0, clavier: false, rappel: -9999, dernierRappel: -9999, confirmer: -9999, absente: 0, essais: 0 }; // vu : ms d'affichage de la bulle de l'étape sur sa propre cible (prompt 161)
let ciblesGuide = {};
let espaceDessin = 'ecran'; // mis à 'pc' pendant le dessin du contenu de l'écran du PC (sketch.js)

function lireStockage(cle) {
	try {
		return localStorage.getItem(cle);
	} catch (e) {
		return null;
	}
}
function ecrireStockage(cle, v) {
	try {
		localStorage.setItem(cle, v);
	} catch (e) {}
}
/** Prompt 177 : une partie a-t-elle déjà été menée au bout sur cet appareil ? Lu dans ce qui existe déjà : le
 * palmarès (un bilan enregistré) ou la progression du mode histoire. Une partie seulement sauvegardée ne compte pas. */
function partieDejaTerminee() {
	if (lireStockage('pxe-nte001:jeu:meilleurs-bilans')) return true;
	if (typeof progressionHistoire !== 'function') return false;
	const p = progressionHistoire();
	return !!(p.termine || Object.keys(p.scores || {}).length);
}
/** Prompt 177 : case cochée d'office tant qu'aucune partie n'a été terminée ni le guide achevé ; le joueur peut la
 * décocher (son choix est gardé) ; ensuite elle reprend son dernier état */
function optionGuide() {
	if (GUIDE.option !== null) return GUIDE.option;
	const memo = lireStockage(CLE_GUIDE_OPTION);
	if (memo === 'oui' || memo === 'non') return (GUIDE.option = memo === 'oui');
	return (GUIDE.option = !(lireStockage(CLE_GUIDE_FINI) === 'oui' || partieDejaTerminee()));
}
function basculerOptionGuide() {
	GUIDE.option = !optionGuide();
	ecrireStockage(CLE_GUIDE_OPTION, GUIDE.option ? 'oui' : 'non');
	annoncer(t(GUIDE.option ? 'guide.option.oui' : 'guide.option.non'));
	Confort.Son.bip('choix');
}

function cibleGuide(nom, x, y, l, h) {
	const A = typeof transformAppli !== 'undefined' ? transformAppli : null; // prompt 50 : appli en fenêtre
	ciblesGuide[nom] = A ? { x: A.x + x * A.k, y: A.y + y * A.k, l: l * A.k, h: h * A.k, espace: espaceDessin } : { x, y, l, h, espace: espaceDessin };
}
/** Cible convertie en coordonnées réelles du canevas (ou null si elle n'est pas visible à cette image) */
function cibleReelle(nom) {
	const c = ciblesGuide[nom];
	if (!c) return null;
	if (c.espace === 'ecran') return c;
	if (vue !== 'poste') return null; // contenu du PC illisible depuis le bureau : on montre d'abord l'écran
	const r = ECRAN_POSTE;
	const k = r.l / L;
	return { x: r.x + c.x * k, y: r.y + c.y * k, l: c.l * k, h: c.h * k };
}

// ——— Étapes ———
const PHASES_DOSSIER = ['decision', 'contradiction', 'conflit']; // prompt 68 : la sélection d'un signalement précède le dossier
// Prompt 181 — chaque étape : cible() (nom du rectangle éclairé, seul interactif), fait() (validation), issue() (le
// guide ramène lui-même la vue si la cible reste introuvable), lecture (étape sans geste : « Étape suivante » dans la
// bulle), attendre() (l'étape dépend du jeu : le temps doit couler), touches() (touches du jeu qui actionnent la cible).
const ETAPES_GUIDE = [
	{ id: 'installer', cible: () => 'ecranPC', fait: () => vue === 'poste', issue: guideAuPoste },
	// Prompt 161 : validée seulement après lecture effective de la bulle des jauges (seuils 120 / 90 du patron), plus à
	// l'arrivée du premier signalement — qui précédait presque toujours l'arrivée au poste
	{ id: 'jauges', cible: () => (vue === 'poste' ? 'jauges' : 'ecranPC'), fait: () => GUIDE.vu > (typeof EXPO !== 'undefined' && EXPO.actif ? 3000 : 8000), lecture: true, issue: guideAuPoste },
	// Prompt 78 : la somnolence et le compromis de la sieste (validée en se reposant, ou après 10 s de lecture)
	{ id: 'somnolence', cible: () => (vue === 'poste' ? 'somnolence' : 'ecranPC'), fait: () => enSieste || (vue === 'poste' && PC.etat === 'appli' && millis() - GUIDE.debutEtape > (typeof EXPO !== 'undefined' && EXPO.actif ? 3000 : 10000)), lecture: true, issue: guideAuPoste, touches: () => key === 'z' || key === 'Z' },
	// Prompt 66 : étape dédiée au signalement (prendre le dossier lance le compteur)
	{ id: 'prendre', cible: () => (vue === 'poste' ? 'fileSignalements' : 'ecranPC'), fait: () => PHASES_DOSSIER.includes(phase) || phase === 'narration' || (Jeu.historique || []).length > 0, issue: guideAuPoste, attendre: () => vue === 'poste' && PC.etat === 'appli' && !fileIncidents().length, touches: () => [UP_ARROW, DOWN_ARROW, ENTER, RETURN].includes(keyCode) || key === ' ' },
	{ id: 'actions', cible: () => (vue === 'poste' ? 'actions' : 'ecranPC'), fait: () => (Jeu.historique || []).length > 0 || phase === 'narration', issue: guideAuPoste, touches: () => ['1', '2', '3', '4', 'a', 'A', 'b', 'B'].includes(key) || [UP_ARROW, DOWN_ARROW, ENTER, RETURN].includes(keyCode) },
	{ id: 'apps', cible: () => (vue !== 'poste' ? 'ecranPC' : 'iconesOS'), fait: () => vue === 'poste' && ((PC.etat === 'os' && !!PC.fenetre) || PC.flottant), issue: guideAuPoste }, // prompt 103 : les autres applis sont dans le menu à gauche
	{ id: 'quitter', cible: () => 'quitterPC', fait: () => vue === 'bureau', issue: guideAuBureau },
	{ id: 'livre', cible: () => 'livreAide', fait: () => !!tutoriel || fenetre === 'aide' || (typeof PIECE !== 'undefined' && !!PIECE.message), issue: guideAuBureau, touches: () => key === 'h' || key === 'H' || key === '?' },
];
/** Issues : la vue où se trouve la cible. S'asseoir et revenir à l'appli principale (prompt 183 : plus de bureau d'icônes), ou se lever. */
function guideAuPoste() {
	if (vue === 'bureau') return sAsseoir();
	if (vue === 'poste' && PC.etat === 'os') versAppliPrincipale(); // une autre appli est ouverte : retour à la carte
}
function guideAuBureau() {
	if (vue === 'poste') seLever();
}
function razEtapeGuide() {
	GUIDE.debutEtape = millis();
	GUIDE.vu = 0;
	GUIDE.focus = 0;
	GUIDE.absente = 0;
	GUIDE.essais = 0;
	GUIDE.confirmer = -9999;
}
function demarrerGuide() {
	GUIDE.actif = true;
	GUIDE.etape = 0;
	razEtapeGuide();
	GUIDE.fin = 0;
	annoncerEtapeGuide();
}
function arreterGuide() {
	GUIDE.actif = false;
	GUIDE.option = false; // ne revient plus, sauf si la case est recochée
	ecrireStockage(CLE_GUIDE_OPTION, 'non');
	ecrireStockage(CLE_GUIDE_FINI, 'oui');
	annoncer(t('guide.arrete'));
}
function annoncerEtapeGuide() {
	const e = ETAPES_GUIDE[GUIDE.etape];
	if (e) annoncer(t('guide.etape', { n: GUIDE.etape + 1, total: ETAPES_GUIDE.length }) + ' — ' + texteEtapeGuide(e));
}
function texteEtapeGuide(e) {
	const c = e.cible();
	if (e.attendre && e.attendre()) return t('guide.attente'); // prompt 181 : rien à faire, le signalement arrive
	if (c === 'ecranPC' && e.id !== 'installer' && e.id !== 'apps') return t('guide.retourPC');
	if (e.id === 'apps') return t(c === 'ecranPC' ? 'guide.retourPC' : 'guide.apps.ouvrir');
	return t('guide.' + e.id + (e.id === 'somnolence' && Jeu.defiChrono ? 'Chrono' : ''), { x: IMMERSION.compression }); // prompt 77 : « ×100 » suit la valeur réelle ; prompt 161 : règle du mode joué
}
function etapeGuideSuivante() {
	GUIDE.etape++;
	razEtapeGuide();
	Confort.Son.bip('choix');
	if (GUIDE.etape >= ETAPES_GUIDE.length) {
		GUIDE.actif = false;
		GUIDE.fin = millis();
		GUIDE.option = false;
		ecrireStockage(CLE_GUIDE_OPTION, 'non');
		ecrireStockage(CLE_GUIDE_FINI, 'oui');
		annoncer(t('guide.fin'));
	} else annoncerEtapeGuide();
}

// ——— Prompt 181 : guide contraignant — filtres d'entrée ———
/** Le guide attend-il le joueur ? Faux pendant tout ce qui a sa propre interaction (fenêtre, SMS, tutoriel, sieste,
 * réveil, soir, transition) : ces écrans se traitent normalement, puis le guide reprend. */
function guideEnCours() {
	if (!GUIDE.actif || ecran !== 'jeu' || MENU.actif || fenetre || smsActif || tutoriel) return false;
	if ((typeof CINE !== 'undefined' && CINE) || (typeof GAMEOVER !== 'undefined' && GAMEOVER) || (typeof TRANSITION_JOUR !== 'undefined' && TRANSITION_JOUR)) return false;
	if (['mail', 'soir', 'fin', 'reveil'].includes(phase) || enSieste || (typeof SOMMEIL !== 'undefined' && SOMMEIL.k > 0.001)) return false;
	return !!ETAPES_GUIDE[GUIDE.etape];
}
/** Filtre actif ? En portrait (image recomposée, bulle pas toujours entière), le guide reste indicatif : jamais de blocage */
function guideFiltre() {
	return guideEnCours() && !(typeof PORTRAIT !== 'undefined' && PORTRAIT.actif);
}
const dansZoneGuide = (z, x, y) => !!z && x >= z.x && x <= z.x + z.l && y >= z.y && y <= z.y + z.h;
/** Point (canevas réel) hors de la cible éclairée et des boutons de la bulle → le geste est ignoré.
 * Filtre unique du pointeur : clic, toucher, molette, glisser (sketch.js, enquete.js, mobile.js). */
function guideBloque(x, y) {
	if (!guideFiltre()) return false;
	const affiche = typeof frameCount === 'undefined' || frameCount - GUIDE.image <= 1; // bulle dessinée à la dernière image
	if (affiche && (dansZoneGuide(GUIDE.trou, x, y) || GUIDE.zones.some((z) => dansZoneGuide(z, x, y)))) return false;
	return true;
}
/** Geste hors cible : la bulle se signale (liseré, 0,6 s, sans flash ni son) et la consigne est relue */
function rappelerConsigneGuide() {
	const e = ETAPES_GUIDE[GUIDE.etape];
	GUIDE.rappel = millis();
	if (!e || millis() - GUIDE.dernierRappel < 1500) return;
	GUIDE.dernierRappel = millis();
	GUIDE.alterne = !GUIDE.alterne; // même texte deux fois : la zone aria-live ne relit que ce qui change
	annoncer(t('guide.rappel') + ' ' + texteEtapeGuide(e) + (GUIDE.alterne ? '' : '\u00A0'));
}
/** Échap (ou G) : confirmation courte — une seconde pression dans les 5 s quitte le guide */
function demanderQuitterGuide() {
	if (millis() - GUIDE.confirmer < 5000) return arreterGuide();
	GUIDE.confirmer = millis();
	annoncer(t('guide.confirmer'));
}
const focusGuide = () => {
	const e = ETAPES_GUIDE[GUIDE.etape];
	const f = e && e.lecture ? ['cible', 'suivante', 'quitter'] : ['cible', 'quitter'];
	return f[GUIDE.focus % f.length];
};
/** Entrée / Espace sur la cible focalisée : le geste de la cible, par nom de cible */
const ACTIONS_CIBLE_GUIDE = {
	ecranPC: () => sAsseoir(),
	quitterPC: () => quitterPC(),
	livreAide: () => ouvrirObjetBureau('aide'),
	iconesOS: () => {
		const cle = ENTREES_MENU.find((k) => k !== 'signalements' && appliDebloquee(k));
		if (cle) ouvrirEntreeMenu(cle);
	},
};
/** Filtre unique du clavier (keyPressed, sketch.js). true : touche prise par le guide (ou ignorée) ; false : elle
 * passe au jeu. Liste blanche : Tab / Maj+Tab (piégés entre la cible et les boutons de la bulle), Entrée / Espace
 * (cible ou bouton focalisé), les touches de l'étape, Échap / G (quitter, avec confirmation), L et F (langue, plein écran). */
function toucheGuide() {
	const e = ETAPES_GUIDE[GUIDE.etape];
	if (keyIsDown(CONTROL) || keyIsDown(ALT) || keyIsDown(91) || (keyCode >= 112 && keyCode <= 123)) return false; // raccourcis du navigateur
	if (['l', 'L', 'f', 'F'].includes(key)) return false;
	if ([SHIFT, CONTROL, ALT].includes(keyCode)) return true;
	if (keyCode === ESCAPE || key === 'g' || key === 'G') return demanderQuitterGuide(), true;
	if (keyCode === TAB) {
		const n = e.lecture ? 3 : 2;
		GUIDE.focus = (GUIDE.focus + (keyIsDown(SHIFT) ? n - 1 : 1)) % n;
		GUIDE.clavier = true;
		const f = focusGuide();
		annoncer(f === 'cible' ? texteEtapeGuide(e) : t(f === 'quitter' ? 'guide.arreter' : 'guide.suivante'));
		return true;
	}
	const valide = keyCode === ENTER || keyCode === RETURN || key === ' ';
	const f = focusGuide();
	if (f !== 'cible') {
		if (valide) f === 'quitter' ? arreterGuide() : etapeGuideSuivante();
		else rappelerConsigneGuide();
		return true;
	}
	if (frameCount - GUIDE.image > 1) return true; // entre deux vues (clignement) : rien ne passe
	const action = ACTIONS_CIBLE_GUIDE[e.cible()];
	if (valide && action) return action(), true;
	if (e.touches && e.touches() && cibleReelle(e.cible())) return false; // la touche actionne la cible : elle passe au jeu
	rappelerConsigneGuide();
	return true;
}
/** Le temps de jeu est suspendu tant qu'une étape attend le joueur — sauf si l'étape attend le jeu (signalement à venir) */
function guideSuspendTemps() {
	if (!guideFiltre()) return false;
	const e = ETAPES_GUIDE[GUIDE.etape];
	return !(e.attendre && e.attendre());
}
/** Aucune impasse : cible introuvable 2 s (vue stable, hors attente du jeu) → le guide ramène la vue (issue), jusqu'à
 * 3 fois ; toujours introuvable après 8 s → l'étape est déclarée faite. Renvoie false si l'étape vient d'être passée. */
function surveillerCibleGuide(e, c) {
	const stable = (vue === 'poste' || vue === 'bureau') && !(typeof pcDemarre === 'function' && pcDemarre());
	if (c || !stable || (e.attendre && e.attendre())) {
		GUIDE.absente = 0;
		GUIDE.essais = 0;
		return true;
	}
	GUIDE.absente += Math.min(deltaTime || 0, 100);
	if (GUIDE.essais < 3 && GUIDE.absente > 2000 * (GUIDE.essais + 1)) {
		GUIDE.essais++;
		e.issue();
	}
	if (GUIDE.absente <= 8000) return true;
	etapeGuideSuivante();
	return false;
}

// ——— Dessin : flèche + bulle ———
function flecheGuide(px, py, versBas) {
	// Flèche épaisse à la couleur d'accent (prompt 176 : plus de jaune), à contour sombre (contraste sur fonds clairs et sombres), pointe sur (px, py)
	// versBas : true (vers le bas), false (vers le haut) ou 'droite' (prompt 66)
	if (versBas === 'droite') {
		push();
		translate(px, py);
		rotate(-HALF_PI);
		flecheGuide(0, 0, true);
		pop();
		return;
	}
	const s = versBas ? 1 : -1;
	const pts = [
		[0, 0],
		[-34, -40 * s],
		[-14, -40 * s],
		[-14, -96 * s],
		[14, -96 * s],
		[14, -40 * s],
		[34, -40 * s],
	];
	stroke(DS.fond);
	strokeWeight(8);
	strokeJoin(ROUND);
	fill(DS.primaireTrait);
	beginShape();
	pts.forEach(([x, y]) => vertex(px + x, py + y));
	endShape(CLOSE);
	noStroke();
}
function dessinerGuide() {
	GUIDE.zones = [];
	if (phase === 'soir' && ecran === 'jeu' && !MENU.actif) return dessinerGuideSoir(); // prompt 69 : étape « Quitter le bureau », le premier soir
	if (!GUIDE.actif) {
		if (GUIDE.fin && millis() - GUIDE.fin < 4000) bulleGuide(t('guide.fin'), L / 2, 120, false);
		return;
	}
	if (MENU.actif || ecran !== 'jeu') return;
	const e = ETAPES_GUIDE[GUIDE.etape];
	if (e.fait()) return etapeGuideSuivante(); // validée dès que le joueur a fait l'action, même sous une fenêtre
	if (!guideEnCours() || clignement) return; // fenêtre, SMS, tutoriel, sieste (yeux fermés), mail du soir : pas de bulle
	const c = cibleReelle(e.cible());
	if (!surveillerCibleGuide(e, c)) return; // prompt 181 : étape sans cible atteignable → déclarée faite
	GUIDE.image = frameCount; // prompt 181 : la bulle est à l'écran → le filtre laisse passer la cible et ses boutons
	GUIDE.trou = null;
	if (c && e.cible() === e.id) GUIDE.vu += Math.min(deltaTime || 0, 100); // prompt 161 : temps de lecture réel de la bulle de l'étape
	const texte = t('guide.etape', { n: GUIDE.etape + 1, total: ETAPES_GUIDE.length }) + ' · ' + texteEtapeGuide(e);
	if (!c) return bulleGuide(texte, L / 2, H - 260, true);
	const rebond = reduireAnimations ? 0 : Math.sin(millis() / 220) * 10;
	// Prompt 66 : cible dans la colonne de droite de l'appli (jauges, dossier, croix) → bulle à sa gauche, sur la
	// liste des signalements, pour ne jamais masquer les sources, les actions ni le texte des conséquences
	const aGauche = vue === 'poste' && PC.etat === 'appli' && c.x > L * 0.55;
	const cx = constrain(c.x + c.l / 2, 60, L - 60);
	const versBas = c.y > 260; // la flèche arrive par le haut, sauf si la cible est tout en haut
	const py = versBas ? c.y - 8 - rebond : c.y + c.h + 8 + rebond;
	// Prompt 173 : plus de contour jaune — la cible reste éclairée, tout le reste est assombri (voile percé du DS)
	GUIDE.trou = dsVoilePerce(c, 10); // prompt 181 : le trou est aussi la seule zone interactive
	if (GUIDE.clavier && focusGuide() === 'cible') contourFocusGuide(GUIDE.trou);
	// Prompt 131 : dossier ou conséquences ouverts → la bulle va sur la carte, à gauche, jamais sur le plaignant ni les répliques
	const fenetreDossier = vue === 'poste' && PC.etat === 'appli' && (PHASES_DOSSIER.includes(phase) || phase === 'narration');
	if (fenetreDossier) {
		if (aGauche) flecheGuide(c.x - 14 - rebond, constrain(c.y + c.h / 2, 120, H - 120), 'droite');
		else flecheGuide(cx, py, versBas);
		const cibleAGauche = c.x + c.l < 420; // menu de gauche : la bulle passe dessous, sans le cacher
		return bulleGuide(texte, 0, cibleAGauche ? constrain(c.y + c.h + 200, 260, H - 110) : constrain(c.y + c.h / 2, 260, H - 260), false, 24, true);
	}
	if (aGauche) {
		const px = c.x - 14 - rebond;
		const pyG = constrain(c.y + c.h / 2, 120, H - 120);
		flecheGuide(px, pyG, 'droite');
		return bulleGuide(texte, 0, pyG, false, px - 100 - 640, true);
	}
	flecheGuide(cx, py, versBas);
	bulleGuide(texte, cx, versBas ? py - 110 : py + 110, versBas);
}
/** Focus clavier (Tab) : double filet blanc / sombre, lisible sur tous les fonds */
function contourFocusGuide(z) {
	noFill();
	stroke(DS.fond);
	strokeWeight(6);
	rect(z.x - 2, z.y - 2, z.l + 4, z.h + 4);
	stroke(DS.blanc);
	strokeWeight(2);
	rect(z.x - 2, z.y - 2, z.l + 4, z.h + 4);
	noStroke();
}
/** Bulle sombre (texte clair, contraste > 12:1). Guide actif : « Quitter le guide (Échap) », toujours, et « Étape
 * suivante » pour les seules étapes de lecture (prompt 181). */
function bulleGuide(texte, cx, y, auDessus, xFixe, centreV) {
	const l = 640;
	const avecBoutons = GUIDE.actif;
	const forcee = avecBoutons && guideEnCours();
	if (forcee && millis() - GUIDE.confirmer < 5000) texte = t('guide.confirmer'); // Échap pressé une fois
	push(); // textLeading est un état global de p5 : encadré
	textFont(POLICE_TEXTE);
	textSize(22);
	textLeading(30);
	const lignes = Math.max(1, Math.ceil((textWidth(texte) * 1.1) / (l - 48)));
	const h = 32 + lignes * 30 + (avecBoutons ? 72 : 0);
	const x = constrain(xFixe !== undefined ? xFixe : cx - l / 2, 24, L - l - 24);
	const by = constrain(centreV ? y - h / 2 : auDessus ? y - h : y, 24, H - h - 24);
	noStroke();
	fill(0, 0, 0, 110);
	rect(x + 6, by + 8, l, h);
	fill(13, 12, 12, 248);
	stroke(255, 255, 255, 38);
	strokeWeight(2);
	rect(x, by, l, h);
	noStroke();
	fill(DS.primaire); // prompt 173 : liseré à la couleur d'accent (plus de jaune de mise en avant)
	rect(x, by, 8, h);
	// Prompt 181 : geste hors cible → la bulle se signale 0,6 s par un filet à la couleur d'accent qui s'estompe
	// (une seule fois, sans clignotement ; fixe si les animations sont réduites)
	const depuis = millis() - GUIDE.rappel;
	if (forcee && depuis < 600) {
		const c = color(DS.primaireTrait);
		c.setAlpha(reduireAnimations ? 255 : 255 * (1 - depuis / 600));
		noFill();
		stroke(c);
		strokeWeight(4);
		rect(x - 4, by - 4, l + 8, h + 8);
		noStroke();
	}
	fill('#ffffff');
	textAlign(LEFT, TOP);
	text(texte, x + 28, by + 18, l - 48, lignes * 30 + 8);
	pop();
	if (avecBoutons) {
		const yb = by + h - 62;
		const e = ETAPES_GUIDE[GUIDE.etape];
		const zs = { x: x + 28, y: yb, l: 260, h: 48 };
		const zq = { x: x + l - 28 - 300, y: yb, l: 300, h: 48 };
		if (forcee && e.lecture) {
			bouton(zs.x, zs.y, zs.l, zs.h, t('guide.suivante'), etapeGuideSuivante, false, true);
			GUIDE.zones.push(zs);
		}
		bouton(zq.x, zq.y, zq.l, zq.h, t('guide.arreter'), arreterGuide, false, true);
		GUIDE.zones.push(zq);
		if (forcee && GUIDE.clavier && focusGuide() !== 'cible') contourFocusGuide(focusGuide() === 'quitter' ? zq : zs);
	}
}

// ——— Case à cocher dans « Nouvelle partie » (appelée par menu.js) ———
function dessinerOptionsNouvellePartie(x, y) {
	const on = optionGuide();
	const l = 720;
	const h = 64;
	const survol = mouseX >= x && mouseX <= x + l && mouseY >= y && mouseY <= y + h;
	noStroke();
	fill(255, 255, 255, survol ? 38 : 13);
	rect(x, y, l, h);
	stroke('#ffffff');
	strokeWeight(3);
	fill(on ? DS.primaire : 'rgba(0,0,0,0)'); // prompt 115
	rect(x + 20, y + 16, 32, 32);
	if (on) {
		stroke('#ffffff');
		strokeWeight(5);
		line(x + 27, y + 32, x + 34, y + 40);
		line(x + 34, y + 40, x + 46, y + 23);
	}
	noStroke();
	textAlign(LEFT, CENTER);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(24);
	fill('#ffffff');
	text(t('guide.option'), x + 72, y + h / 2);
	textStyle(NORMAL);
	boutons.push({ x, y, l, h, action: basculerOptionGuide });
}
function toucheOptionsNouvellePartie() {
	if (key === 'g' || key === 'G') basculerOptionGuide();
}
