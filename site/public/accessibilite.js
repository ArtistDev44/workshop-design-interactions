/* Nantes en régulation — prompt 48 : accessibilité (daltonisme, taille du texte, lecture facile),
 * reprise sur un autre appareil, démo automatique du menu, courbes des jauges sur le rapport papier.
 */

// ——— Palettes daltonisme : jauges, seuils et alertes (bon / attention / critique) ———
const PALETTES = {
	normal: { bon: '#00B74F', alerte: '#FFC138', critique: '#D10B00', critiqueTexte: '#FFC5C2', papier: { bon: '#1e7a3c', alerte: '#a15c07', critique: '#b3261e' } },
	// Protanopie / deutéranopie (rouge-vert confondus) : bleu / jaune / orange
	protan: { bon: '#3D8BFF', alerte: '#FFE08A', critique: '#FF7A00', critiqueTexte: '#FFB870', papier: { bon: '#1f5fbf', alerte: '#7a6300', critique: '#b34d00' } },
	deutan: { bon: '#3D8BFF', alerte: '#FFE08A', critique: '#FF7A00', critiqueTexte: '#FFB870', papier: { bon: '#1f5fbf', alerte: '#7a6300', critique: '#b34d00' } },
	// Tritanopie (bleu-jaune confondus) : turquoise / rose / rouge
	tritan: { bon: '#00C2B8', alerte: '#FF9EC4', critique: '#E8003D', critiqueTexte: '#FF9EB0', papier: { bon: '#00756e', alerte: '#a3366a', critique: '#b0002e' } },
};
const ORDRE_DALTONISME = ['normal', 'protan', 'deutan', 'tritan'];
const TAILLES_TEXTE = [100, 115, 130];
const palette = () => PALETTES[Confort.Reglages.daltonisme] || PALETTES.normal;
/** Couleur d'une jauge sur le papier du rapport (encre lisible sur le crème) */
function couleurPapier(v) {
	const p = palette().papier;
	return v < 20 ? p.critique : v < 40 ? p.alerte : p.bon;
}

/** Appelée par appliquerReglages() (sketch.js) */
function appliquerAccessibilite() {
	const p = palette();
	C.vert = p.bon;
	C.orange = p.alerte;
	C.rougeFonce = p.critique;
	C.rouge = p.critiqueTexte;
	DS.succes = p.bon;
	DS.alerte = p.alerte;
	DS.erreur = p.critique;
	DS.erreurClair = p.critiqueTexte;
	installerEchelleTexte();
	ECHELLE_TEXTE = (Confort.Reglages.tailleTexte || 100) / 100;
	try {
		document.documentElement.style.setProperty('--echelle-texte', String(ECHELLE_TEXTE)); // boîtes HTML (import, journal de bord)
	} catch (e) {}
}

// ——— Taille du texte : seuls les petits textes (< 24 px) grandissent, jusqu'à 24 px au plus ; les titres et
// grands textes gardent leur taille, pour que les mises en page denses (appli, rapport) ne se chevauchent pas ———
let ECHELLE_TEXTE = 1;
let tailleOrigine = null;
let interligneOrigine = null;
function installerEchelleTexte() {
	if (tailleOrigine || typeof window.textSize !== 'function') return;
	tailleOrigine = window.textSize;
	interligneOrigine = window.textLeading;
	let demandee = null; // taille demandée par le code (avant agrandissement) : textSize() la renvoie telle quelle
	window.textSize = function (s) {
		if (s === undefined) return demandee === null ? tailleOrigine() : demandee;
		demandee = s;
		return tailleOrigine(s < 24 ? Math.min(s * ECHELLE_TEXTE, 24) : s);
	};
	window.textLeading = function (s) {
		if (s === undefined) return interligneOrigine();
		return interligneOrigine(Math.max(s, tailleOrigine() * 1.25)); // l'interligne suit le texte agrandi
	};
}

/** Lecture facile : compte à rebours ×1,5 et pas de tic-tac */
const facteurLecture = () => (Confort.Reglages.lectureFacile ? 1.5 : 1);

function changerDaltonisme() {
	const i = ORDRE_DALTONISME.indexOf(Confort.Reglages.daltonisme || 'normal');
	Confort.Reglages.choisir('daltonisme', ORDRE_DALTONISME[(i + 1) % ORDRE_DALTONISME.length]);
	appliquerReglages();
	annoncer(t('acc.daltonisme') + ' : ' + t('acc.dalt.' + Confort.Reglages.daltonisme));
	Confort.Son.bip('choix');
}
function changerTailleTexte() {
	const i = TAILLES_TEXTE.indexOf(Confort.Reglages.tailleTexte || 100);
	Confort.Reglages.choisir('tailleTexte', TAILLES_TEXTE[(i + 1) % TAILLES_TEXTE.length]);
	appliquerReglages();
	annoncer(t('acc.taille') + ' : ' + Confort.Reglages.tailleTexte + ' %');
	Confort.Son.bip('choix');
}
function basculerLectureFacile() {
	Confort.Reglages.basculer('lectureFacile');
	annoncer(t('acc.lecture') + ' : ' + t(Confort.Reglages.lectureFacile ? 'commun.oui' : 'commun.non'));
}

// ——— Fenêtre « Accessibilité et reprise » (ouverte depuis les Paramètres, touche 9) ———
let imageQR = null;
function ouvrirAccessibilite() {
	if (!imageQR && typeof loadImage === 'function')
		imageQR = loadImage(
			'./assets/qr-edition.png',
			() => {},
			() => (imageQR = 'echec'), // ouvert en double clic (file://) : on affiche l'adresse seule
		);
	fenetre = 'accessibilite';
	annoncer(t('acc.titre'));
}
function fenetreAccessibilite() {
	const l = 1240;
	const h = 1000;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	const R = Confort.Reglages;
	panneau(x, y, l, h, C.accent);
	noStroke();
	textAlign(LEFT, TOP);
	fill(C.accent);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(40);
	text(t('acc.titre'), x + 48, y + 36);
	textStyle(NORMAL);
	const lignes = [
		['1', t('acc.daltonisme'), t('acc.dalt.' + (R.daltonisme || 'normal')), changerDaltonisme, false],
		['2', t('acc.taille'), (R.tailleTexte || 100) + ' %', changerTailleTexte, false],
		['3', t('acc.lecture'), t(R.lectureFacile ? 'commun.oui' : 'commun.non'), basculerLectureFacile, !R.lectureFacile],
	];
	lignes.forEach(([k, lib, valeur, action, secondaire], i) => {
		const ly = y + 120 + i * 96;
		textFont(POLICE_TEXTE);
		ajusterTaille(lib, 520, 26);
		fill(C.texte);
		textAlign(LEFT, CENTER);
		text(lib, x + 48, ly + 36);
		textFont(POLICE_DONNEES);
		textSize(18);
		fill(C.gris);
		text(t('param.touche', { k }), x + 600, ly + 36);
		bouton(x + l - 48 - 320, ly + 6, 320, 60, valeur, action, false, secondaire);
	});
	// Aperçu de la palette : bon / attention / critique
	const p = palette();
	textFont(POLICE_DONNEES);
	textSize(16);
	textAlign(LEFT, CENTER);
	[['bon', p.bon], ['alerte', p.alerte], ['critique', p.critique]].forEach(([n, c], i) => {
		const px0 = x + 48 + i * 260;
		fill(c);
		rect(px0, y + 410, 120, 18);
		fill(C.texte);
		text(t('acc.niveau.' + n), px0 + 132, y + 419);
	});
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textSize(18);
	fill(C.gris);
	textLeading(26);
	text(t('acc.lecture.detail'), x + 48, y + 446, l - 96, 66);
	// Reprise sur un autre appareil : QR code vers le jeu + export / import JSON
	const yr = y + 544;
	fill(C.bord);
	rect(x + 48, yr - 18, l - 96, 2);
	fill(C.texte);
	textStyle(BOLD);
	textSize(26);
	text(t('acc.reprise.titre'), x + 48, yr);
	textStyle(NORMAL);
	textSize(19);
	textLeading(28);
	fill(C.texte);
	text(t('acc.reprise.texte'), x + 48, yr + 48, l - 96 - 280, 290);
	const q = 220;
	if (imageQR && imageQR !== 'echec' && imageQR.width > 1) {
		fill('#ffffff');
		rect(x + l - 48 - q, yr, q, q);
		image(imageQR, x + l - 48 - q + 6, yr + 6, q - 12, q - 12);
	}
	textFont(POLICE_DONNEES);
	textSize(15);
	fill(C.gris);
	textAlign(RIGHT, TOP);
	text('workshop-design-interactions.pages.dev', x + l - 48, yr + q + 10);
	textAlign(LEFT, TOP);
	bouton(x + 48, y + h - 104, 300, 64, t('parametres.exporter'), () => Sauvegarde.exporter(), false, true);
	bouton(x + 364, y + h - 104, 300, 64, t('parametres.importer'), () => Sauvegarde.ouvrirImport(), false, true);
	bouton(x + l - 288, y + h - 104, 240, 64, t('param.retour'), () => (fenetre = 'parametres'));
}
function toucheAccessibilite() {
	if (fenetre !== 'accessibilite') return false;
	if (key === '1') changerDaltonisme();
	else if (key === '2') changerTailleTexte();
	else if (key === '3') basculerLectureFacile();
	else if (keyCode === ESCAPE || keyCode === BACKSPACE) fenetre = 'parametres';
	return true;
}

// ——— Démo automatique : 40 s sans action sur l'écran titre ———
const DEMO = { dernier: 0, actif: false, debut: 0, souris: null };
const DEMO_APRES_MS = 40000;
/** Toute touche / clic : la démo s'arrête (true si elle tournait : l'appui ne fait rien d'autre) */
function arreterDemo() {
	const etait = DEMO.actif;
	DEMO.dernier = millis();
	DEMO.actif = false;
	if (etait) annoncer(t('mp.annonce'));
	return etait;
}
/** Faits réels de la semaine (archives préparées) qui défilent pendant la démo */
function faitsDemo() {
	const S = window.PXE_SEMAINES;
	if (!S) return [t('demo.titre')];
	const f = [];
	S.index.forEach((s) => {
		const d = (iso) => iso.split('-').reverse().join('/');
		f.push(t('demo.semaine', { lundi: d(s.lundi), dossiers: s.dossiers, evenements: s.evenements, niveau: t('palmares.niveau.' + s.niveau) }));
		const sem = S.semaines[s.lundi] || {};
		const m = (sem.meteo || []).slice().sort((a, b) => b.rafales_max - a.rafales_max)[0];
		if (m) f.push(t('demo.meteo', { date: d(m.date), tmax: m.temp_max, pluie: m.pluie_mm, rafales: m.rafales_max }));
		const e = (sem.evenements || []).find((x) => String(x.nature).split(',').length <= 3);
		if (e) f.push(t('demo.agenda', { date: d(e.date), texte: e.texte_source }));
	});
	return f;
}
let faitsDemoCache = null;
/** Dessine la démo à la place du menu ; renvoie false si elle ne doit pas tourner */
function dessinerDemo() {
	if (!DEMO.dernier) DEMO.dernier = millis();
	const m = { x: mouseX, y: mouseY };
	if (DEMO.souris && (Math.abs(m.x - DEMO.souris.x) > 4 || Math.abs(m.y - DEMO.souris.y) > 4)) arreterDemo();
	DEMO.souris = m;
	if (MENU.ecran !== 'titre' || fenetre || tutoriel || millis() - DEMO.dernier < DEMO_APRES_MS) {
		DEMO.actif = false;
		return false;
	}
	if (!DEMO.actif) {
		DEMO.actif = true;
		DEMO.debut = millis();
		faitsDemoCache = faitsDemo();
		annoncer(t('demo.annonce'));
	}
	if (!dernierRenduBureau || millis() - dernierRenduBureau > 250) {
		dessinerPieceBureau();
		dernierRenduBureau = millis();
	}
	const u = millis() - DEMO.debut;
	background(MENU_C.nuit);
	// La caméra parcourt lentement la pièce (immobile si les animations sont réduites)
	const k = reduireAnimations ? 1.08 : 1.1 + 0.05 * Math.sin(u / 9000);
	const dx = reduireAnimations ? 0 : Math.sin(u / 7000) * 70;
	const dy = reduireAnimations ? 0 : Math.cos(u / 11000) * 24;
	drawingContext.imageSmoothingEnabled = false;
	image(gBureau, (L - L * k) / 2 + dx, (H - H * k) / 2 + dy, L * k, H * k);
	drawingContext.imageSmoothingEnabled = true;
	noStroke();
	fill(13, 12, 12, 225);
	rect(0, H - 200, L, 200);
	rect(0, 0, L, 96);
	textAlign(LEFT, CENTER);
	dsTitre(t('accueil.titre'), 64, 26, 40, '#ffffff', 'left');
	noStroke();
	textFont(POLICE_DONNEES);
	textSize(18);
	fill(MENU_C.doux);
	textAlign(RIGHT, CENTER);
	text(t('demo.reprendre'), L - 64, 48);
	const faits = faitsDemoCache || [];
	const i = Math.floor(u / 6000) % Math.max(1, faits.length);
	const a = reduireAnimations ? 1 : constrain(((u % 6000) / 400) * 1, 0, 1) * constrain((6000 - (u % 6000)) / 400, 0, 1);
	textAlign(LEFT, TOP);
	textFont(POLICE_DONNEES);
	textSize(16);
	fill(MENU_C.doux);
	text(t('demo.titre') + ' · ' + (i + 1) + ' / ' + faits.length, 64, H - 176);
	textFont(POLICE_TEXTE);
	textSize(30);
	textLeading(40);
	fill(255, 255, 255, 255 * a);
	text(faits[i] || '', 64, H - 140, L - 128, 120);
	return true;
}

// ——— Rapport papier : courbe des trois jauges, décision par décision ———
function dessinerCourbesJauges(x, y, l, h, encre, gris) {
	const pts = [{ fluidite: 50, reputation: 50, budget: 50 }];
	(Jeu.historique || []).forEach((r) => r.jaugesApres && pts.push(r.jaugesApres));
	if (Jeu.jauges) pts.push(Object.assign({}, Jeu.jauges)); // valeurs finales (objectifs, plaintes, malus compris)
	noFill();
	stroke('#d9d1bd');
	strokeWeight(1);
	[0, 20, 50, 100].forEach((v) => line(x, y + h - (h * v) / 100, x + l, y + h - (h * v) / 100));
	noStroke();
	fill(gris);
	textFont(POLICE_DONNEES);
	textSize(13);
	textAlign(RIGHT, CENTER);
	[0, 50, 100].forEach((v) => text(v, x - 6, y + h - (h * v) / 100));
	const p = palette().papier;
	const series = [
		['fluidite', p.bon, []],
		['reputation', '#1d1a16', [6, 4]],
		['budget', p.critique, [2, 4]],
	];
	const n = Math.max(1, pts.length - 1);
	series.forEach(([cle, c, tirets]) => {
		stroke(c);
		strokeWeight(3);
		drawingContext.setLineDash(tirets); // motifs différents : la courbe ne dépend pas que de la couleur
		noFill();
		beginShape();
		pts.forEach((q, i) => vertex(x + (l * i) / n, y + h - (h * q[cle]) / 100));
		endShape();
	});
	drawingContext.setLineDash([]);
	noStroke();
	textAlign(LEFT, TOP);
	textSize(13);
	series.forEach(([cle, c], i) => {
		fill(c);
		rect(x + i * (l / 3), y + h + 8, 18, 4);
		fill(encre);
		text(t('jaugeTitre.' + cle), x + i * (l / 3) + 24, y + h + 2);
	});
	fill(gris);
	textAlign(RIGHT, TOP);
	text(t('rapport.courbes', { n: pts.length - 2 < 0 ? 0 : pts.length - 2 }), x + l, y - 20);
	textAlign(LEFT, TOP);
}
