/* Nantes en régulation — prompt 48 : accessibilité (daltonisme, taille du texte, lecture facile),
 * démo automatique du menu, courbes des jauges sur le rapport papier.
 * Prompt 175 : la fenêtre « Accessibilité et reprise » a disparu — ces réglages sont la section « Accessibilité »
 * de la fenêtre des paramètres (parametres.js) ; « Reprendre sur un autre appareil » (QR code) est supprimé.
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
const TAILLE_MIN_PC = 18;
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
		let v = s < 24 ? Math.min(s * ECHELLE_TEXTE, 24) : s;
		// Prompt 49 : sur l'écran du PC (affiché à 90 %), aucun texte sous 18 px (≈ 16 px à l'écran)
		if (typeof espaceDessin !== 'undefined' && espaceDessin === 'pc') v = Math.max(v, typeof transformAppli !== 'undefined' && transformAppli ? 20 : TAILLE_MIN_PC); // prompt 50 : 20 px dans l'appli, réduite à 91 % en fenêtre
		return tailleOrigine(v);
	};
	window.textLeading = function (s) {
		if (s === undefined) return interligneOrigine();
		return interligneOrigine(Math.max(s, tailleOrigine() * 1.25)); // l'interligne suit le texte agrandi
	};
}

/** Lecture facile : compte à rebours ×1,5 et pas de tic-tac */
const facteurLecture = () => (Confort.Reglages.lectureFacile ? 1.5 : 1);

function changerDaltonisme(sens) {
	const n = ORDRE_DALTONISME.length;
	const i = ORDRE_DALTONISME.indexOf(Confort.Reglages.daltonisme || 'normal');
	Confort.Reglages.choisir('daltonisme', ORDRE_DALTONISME[(i + (sens || 1) + n) % n]);
	appliquerReglages();
	annoncer(t('acc.daltonisme') + ' : ' + t('acc.dalt.' + Confort.Reglages.daltonisme));
	Confort.Son.bip('choix');
}
function changerTailleTexte(sens) {
	const n = TAILLES_TEXTE.length;
	const i = TAILLES_TEXTE.indexOf(Confort.Reglages.tailleTexte || 100);
	Confort.Reglages.choisir('tailleTexte', TAILLES_TEXTE[(i + (sens || 1) + n) % n]);
	appliquerReglages();
	annoncer(t('acc.taille') + ' : ' + Confort.Reglages.tailleTexte + ' %');
	Confort.Son.bip('choix');
}
function basculerLectureFacile() {
	Confort.Reglages.basculer('lectureFacile');
	annoncer(t('acc.lecture') + ' : ' + t(Confort.Reglages.lectureFacile ? 'commun.active' : 'commun.desactive'));
}
/** Prompt 96 : secousse et arrêt sur image des décisions — complet (100 %), atténué (50 %) ou aucun (0 %) ;
 * les animations réduites coupent tout. Prompt 175 : valeurs nommées (parametres.js : libelleIntensite) */
function changerIntensiteFeedback(sens) {
	const n = ORDRE_INTENSITE.length;
	Confort.Reglages.choisir('intensiteFeedback', ORDRE_INTENSITE[(ORDRE_INTENSITE.indexOf(intensiteFeedback()) + (sens || 1) + n) % n]);
	annoncer(t('acc.intensite') + ' : ' + libelleIntensite());
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
	textSize(15); // prompt 98 : 13 → 15 (validations : pas de texte sous 14 px)
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
	textSize(15); // prompt 98 : 13 → 15 (validations : pas de texte sous 14 px)
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
