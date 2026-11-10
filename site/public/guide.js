/* Nantes en régulation — mode « Prendre en main » (prompt 37).
 * Proposé à la première partie par une case dans l'écran « Nouvelle partie » (menu.js). Des flèches
 * montrent, une étape à la fois, ce qu'il est possible de faire ; chaque étape se valide quand le
 * joueur fait l'action (ou « Étape suivante »). Le guide ne fait jamais l'action à sa place.
 * Les cibles sont relevées au moment où les éléments sont dessinés (cibleGuide), dans l'espace où
 * ils le sont : écran du PC (« pc ») ou écran réel (« ecran »), puis converties à l'affichage.
 */
const CLE_GUIDE_OPTION = 'pxe-nte001-prise-en-main';
const CLE_GUIDE_FINI = 'pxe-nte001-prise-en-main-fini';
const GUIDE = { actif: false, etape: 0, debutEtape: 0, fin: 0, option: null };
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
/** Case cochée par défaut si le joueur n'a encore jamais joué (aucune sauvegarde, aucun bilan, guide jamais fini) */
function optionGuide() {
	if (GUIDE.option !== null) return GUIDE.option;
	const memo = lireStockage(CLE_GUIDE_OPTION);
	if (memo === 'oui' || memo === 'non') return (GUIDE.option = memo === 'oui');
	const dejaJoue = lireStockage(CLE_GUIDE_FINI) === 'oui' || Sauvegarde.lister().length > 0 || lireStockage('pxe-nte001:jeu:meilleurs-bilans');
	return (GUIDE.option = !dejaJoue);
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
const ETAPES_GUIDE = [
	{ id: 'installer', cible: () => 'ecranPC', fait: () => vue === 'poste' },
	{ id: 'jauges', cible: () => (vue === 'poste' && PC.etat === 'appli' ? 'jauges' : vue === 'poste' ? 'iconeCarte' : 'ecranPC'), fait: () => phase === 'selection' || PHASES_DOSSIER.includes(phase) },
	// Prompt 66 : étape dédiée au signalement (prendre le dossier lance le compteur)
	{ id: 'prendre', cible: () => (vue === 'poste' && PC.etat === 'appli' ? 'actions' : vue === 'poste' ? 'iconeCarte' : 'ecranPC'), fait: () => PHASES_DOSSIER.includes(phase) || phase === 'narration' || (Jeu.historique || []).length > 0 },
	{ id: 'actions', cible: () => (vue === 'poste' && PC.etat === 'appli' ? 'actions' : vue === 'poste' ? 'iconeCarte' : 'ecranPC'), fait: () => (Jeu.historique || []).length > 0 || phase === 'narration' },
	{ id: 'apps', cible: () => (vue !== 'poste' ? 'ecranPC' : PC.etat === 'appli' ? 'fermerAppli' : 'iconesOS'), fait: () => PC.etat === 'os' && (!!PC.fenetre || PC.flottant) },
	{ id: 'quitter', cible: () => 'quitterPC', fait: () => vue === 'bureau' },
	{ id: 'livre', cible: () => 'livreCommande', fait: () => !!tutoriel || fenetre === 'livre-stress' || (typeof PIECE !== 'undefined' && !!PIECE.message) },
];
function demarrerGuide() {
	GUIDE.actif = true;
	GUIDE.etape = 0;
	GUIDE.debutEtape = millis();
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
	if (c === 'ecranPC' && e.id !== 'installer' && e.id !== 'apps') return t('guide.retourPC');
	if (c === 'iconeCarte') return t('guide.ouvrirCarte');
	if (e.id === 'apps') return t(c === 'fermerAppli' ? 'guide.apps.fermer' : c === 'ecranPC' ? 'guide.retourPC' : 'guide.apps.ouvrir');
	return t('guide.' + e.id);
}
function etapeGuideSuivante() {
	GUIDE.etape++;
	GUIDE.debutEtape = millis();
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

// ——— Dessin : flèche + bulle ———
function flecheGuide(px, py, versBas) {
	// Flèche épaisse jaune à contour sombre (contraste sur fonds clairs et sombres), pointe sur (px, py)
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
	stroke('#0D0C0C');
	strokeWeight(8);
	strokeJoin(ROUND);
	fill('#FFC138'); // Warning Primary du DS
	beginShape();
	pts.forEach(([x, y]) => vertex(px + x, py + y));
	endShape(CLOSE);
	noStroke();
}
function dessinerGuide() {
	if (!GUIDE.actif) {
		if (GUIDE.fin && millis() - GUIDE.fin < 4000) bulleGuide(t('guide.fin'), L / 2, 120, false);
		return;
	}
	if (MENU.actif || ecran !== 'jeu') return;
	const e = ETAPES_GUIDE[GUIDE.etape];
	if (e.fait()) return etapeGuideSuivante(); // validée dès que le joueur a fait l'action, même sous une fenêtre
	if (fenetre || smsActif || tutoriel || clignement || phase === 'mail') return; // prompt 66 : le mail du soir se lit sans bulle
	const c = cibleReelle(e.cible());
	const texte = t('guide.etape', { n: GUIDE.etape + 1, total: ETAPES_GUIDE.length }) + ' · ' + texteEtapeGuide(e);
	if (!c) return bulleGuide(texte, L / 2, H - 260, true);
	const rebond = reduireAnimations ? 0 : Math.sin(millis() / 220) * 10;
	// Prompt 66 : cible dans la colonne de droite de l'appli (jauges, dossier, croix) → bulle à sa gauche, sur la
	// carte, pour ne jamais masquer les sources, les actions ni le texte des conséquences
	const aGauche = vue === 'poste' && PC.etat === 'appli' && c.x > L * 0.55;
	const cx = constrain(c.x + c.l / 2, 60, L - 60);
	const versBas = c.y > 260; // la flèche arrive par le haut, sauf si la cible est tout en haut
	const py = versBas ? c.y - 8 - rebond : c.y + c.h + 8 + rebond;
	// Contour de la cible
	noFill();
	stroke('#0D0C0C');
	strokeWeight(8);
	rect(c.x - 10, c.y - 10, c.l + 20, c.h + 20);
	stroke('#FFC138');
	strokeWeight(4);
	rect(c.x - 10, c.y - 10, c.l + 20, c.h + 20);
	noStroke();
	if (aGauche) {
		const px = c.x - 14 - rebond;
		const pyG = constrain(c.y + c.h / 2, 120, H - 120);
		flecheGuide(px, pyG, 'droite');
		return bulleGuide(texte, 0, pyG, false, px - 100 - 640, true);
	}
	flecheGuide(cx, py, versBas);
	bulleGuide(texte, cx, versBas ? py - 110 : py + 110, versBas);
}
/** Bulle sombre (texte clair, contraste > 12:1) avec « Étape suivante » et « Arrêter le guide (G) » */
function bulleGuide(texte, cx, y, auDessus, xFixe, centreV) {
	const l = 640;
	textFont(POLICE_TEXTE);
	textSize(22);
	textLeading(30);
	const lignes = Math.max(1, Math.ceil((textWidth(texte) * 1.1) / (l - 48)));
	const avecBoutons = GUIDE.actif;
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
	fill('#FFC138');
	rect(x, by, 8, h);
	fill('#ffffff');
	textAlign(LEFT, TOP);
	text(texte, x + 28, by + 18, l - 48, lignes * 30 + 8);
	if (avecBoutons) {
		const yb = by + h - 62;
		bouton(x + 28, yb, 260, 48, t('guide.suivante'), etapeGuideSuivante, false, true);
		bouton(x + l - 28 - 300, yb, 300, 48, t('guide.arreter'), arreterGuide, false, true);
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
	fill(on ? '#D4031C' : 'rgba(0,0,0,0)');
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
