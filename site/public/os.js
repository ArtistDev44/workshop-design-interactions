/* Nantes en régulation — le PC du bureau : démarrage et bureau d'un système FICTIF (« RégulOS »).
 * Fond d'écran ORIGINAL qui évoque l'esthétique bleue et lumineuse des bureaux d'ordinateur de la fin
 * des années 2000 (dégradé, traînées de lumière, bulles floues), pixelisé ; aucun logo ni visuel de
 * marque existant n'est reproduit. Tout est dessiné par le code (contenu 1920×1080 de l'écran du PC).
 */
const PC = { etat: 'eteint', debut: 0, selection: 0, fenetre: null, message: '', flottant: false };
// Prompt 36 : grille d'icônes agrandie et barre des tâches plus haute
const GRILLE_OS = { x: 36, y: 36, l: 200, h: 200, ecart: 16, lignes: 4, echelle: 1.35 };
const BARRE_OS = 84; // etat : 'eteint' | 'demarrage' | 'os' | 'appli' ; fenetre : null | 'patron' | 'community' | 'journal' | 'corbeille'
const DUREE_DEMARRAGE = 3400;
let gFondOS = null;

function demarrerPC() {
	PC.etat = 'demarrage';
	PC.debut = millis();
	Confort.Son.bip('dossier');
}
// ——— Prompt 71 : le PC redémarre au début de chacune des 3 premières journées de la partie ———
// La journée commence PC éteint ; à la fin de l'écran « JOUR n — SEMAINE n », le démarrage (BIOS, logo,
// barre de chargement, bip) se joue en entier, visible sur le moniteur ; à partir du jour 4, rien ne change.
// Une seule fois par journée (clé gardée dans la sauvegarde) ; temps de jeu suspendu pendant le démarrage.
const JOURS_DEMARRAGE = 3;
const JOUR_PC = { attendu: false, fait: '' };
function cleJourPC() {
	return (Jeu.etat && Jeu.etat.semaine ? Jeu.etat.semaine.lundi : (Jeu.etat && Jeu.etat.mode) || '') + '|' + Jeu.jourIndex;
}
/** Appelée au début de chaque journée (demarrerJournee) et à la reprise d'une sauvegarde */
function demarrageDuJour() {
	if (ecran !== 'jeu' || !Jeu.jourCourant || !Jeu.jourCourant()) return;
	const cle = cleJourPC();
	if (JOUR_PC.fait === cle) return; // déjà démarré aujourd'hui : pas de replay
	JOUR_PC.fait = cle;
	if (Jeu.jourIndex >= JOURS_DEMARRAGE || (typeof EXPO !== 'undefined' && EXPO.actif)) return; // prompt 132 : pas de redémarrage en exposition
	JOUR_PC.attendu = true;
	PC.fenetre = null;
	PC.etat = 'eteint';
}
/** Une fois par image : lance le démarrage dès que l'écran de transition du jour est passé */
function majDemarrageJour() {
	if (!JOUR_PC.attendu || ecran !== 'jeu' || TRANSITION_JOUR || smsActif || MENU.actif) return;
	JOUR_PC.attendu = false;
	if (PC.etat !== 'eteint') return; // le joueur l'a déjà allumé en s'installant
	demarrerPC();
	if (reduireAnimations) PC.debut = millis() - (DUREE_DEMARRAGE - 500); // animations réduites : écran d'accueil statique, 0,5 s
}
const pcDemarre = () => PC.etat === 'demarrage';

function ouvrirAppli() {
	PC.fenetre = null; // prompt 103 : la carte est la vue d'accueil de l'appli principale
	if (PC.etat !== 'os') return;
	PC.etat = 'appli';
	Confort.Son.bip('choix');
}
function fermerAppli() {
	if (PC.etat === 'appli') PC.etat = 'os';
}

/** Fond d'écran pixelisé (calculé une fois, 240×135 agrandi ×8) */
function fondOS() {
	if (gFondOS) return gFondOS;
	const g = createGraphics(240, 135);
	g.pixelDensity(1);
	g.noSmooth();
	g.noStroke();
	for (let y = 0; y < 135; y++)
		for (let x = 0; x < 240; x += 2) {
			const dx = (x - 150) / 240;
			const dy = (y - 50) / 135;
			const r = Math.sqrt(dx * dx * 1.4 + dy * dy);
			const t = Math.min(1, r * 1.6);
			g.fill(lerp(70, 8, t), lerp(170, 48, t), lerp(235, 118, t));
			g.rect(x, y, 2, 1);
		}
	// Traînées de lumière (courbes) et bulles floues
	for (let k = 0; k < 4; k++) {
		for (let x = 0; x < 240; x++) {
			const y = 78 + k * 7 - Math.sin((x / 240) * Math.PI) * (36 - k * 6) + Math.sin(x / 19 + k) * 2;
			g.fill(200, 240, 255, 70 - k * 12);
			g.rect(x, Math.round(y), 1, 2 + (k === 0 ? 1 : 0));
		}
	}
	[[60, 30, 10], [190, 24, 7], [120, 100, 12], [210, 90, 8], [30, 110, 6], [160, 60, 5]].forEach(([cx, cy, r]) => {
		for (let rr = r; rr > 0; rr -= 2) {
			g.fill(220, 245, 255, 18);
			for (let dy = -rr; dy <= rr; dy++) {
				const w = Math.floor(Math.sqrt(rr * rr - dy * dy));
				g.rect(cx - w, cy + dy, 2 * w + 1, 1);
			}
		}
	});
	gFondOS = g;
	return g;
}

/** Contenu de l'écran quand l'appli n'est pas ouverte (démarrage ou bureau du système) — Pixel Design System */
function dessinerOS() {
	if (PC.etat === 'eteint') {
		background('#050607');
		return;
	}
	if (PC.etat === 'demarrage') return dessinerDemarrage();
	if (PC.fenetre === 'donnees' && !(typeof vueIntegree === 'function' && vueIntegree())) return dessinerAppliDonnees(); // prompt 61 : plein écran hors partie ; en partie, vue intégrée (prompt 103)
	drawingContext.imageSmoothingEnabled = false;
	image(fondOS(), 0, 0, L, H);
	drawingContext.imageSmoothingEnabled = true;
	// Icônes du bureau (2 colonnes × 4) — prompt 36 : agrandies (icône 108 px au lieu de 80, libellé 22 px)
	ICONES_OS.forEach((ic, i) => {
		if (ic.cle !== 'signalements' && ecran === 'jeu') return; // prompt 103 : une seule appli sur le bureau (les autres sont dans son menu)
		const g = GRILLE_OS;
		const x = g.x + Math.floor(i / g.lignes) * (g.l + g.ecart);
		const y = g.y + (i % g.lignes) * (g.h + g.ecart);
		const sel = PC.selection === i;
		const survol = mouseX >= x && mouseX <= x + g.l && mouseY >= y && mouseY <= y + g.h;
		noStroke();
		if (sel || survol) {
			fill(DS.blanc15);
			rect(x, y, g.l, g.h);
			stroke(DS.blanc);
			strokeWeight(2);
			noFill();
			rect(x + 1, y + 1, g.l - 2, g.h - 2);
			noStroke();
		}
		ic.dessin(x + (g.l - 80 * g.echelle) / 2 + decalTremble(ic.cle), y + 14, g.echelle);
		voileVerrou(ic.cle, x, y, g.l, g.h); // prompt 91 § 2 (option) : appli verrouillée grisée, cadenas
		fill(DS.noir50);
		textFont(DS.policeTexte);
		textSize(22);
		const tl = textWidth(String(ic.nom)) + 16;
		rect(x + g.l / 2 - tl / 2, y + 138, tl, 36);
		dsTexte(ic.nom, x + g.l / 2, y + 142, 22, DS.blanc, 'center');
		boutons.push({ x, y, l: g.l, h: g.h, action: () => ouvrirIconeOS(i) });
		if (i === 0) cibleGuide('iconeSignalements', x, y, g.l, g.h); // prompt 37 ; prompts 68 / 73 : « Signalements » est la première icône
		if (i === 1) cibleGuide('iconesOS', x, y, g.l * 2 + g.ecart, g.h * 3 + g.ecart * 2); // patron, community, journal, indicateurs, corbeille
		const b = !appliDebloquee(ic.cle) || ic.cle === 'indicateurs' ? '' : badgeIcone(ic.cle); // prompt 101 : plus de pastille « ● » (le panneau ouvert se voit) // prompt 91 : pas de pastille sur une appli verrouillée
		if (b) dsBadge(x + g.l - 34, y + 20, b, ic.cle === 'indicateurs' ? 'succes' : 'erreur');
	});
	dessinerBulleVerrou(); // prompt 91 § 2
	// Fenêtre d'application ouverte (prompt 22) — hors partie seulement ; en partie, vue intégrée (prompt 103, sketch.js)
	if (PC.fenetre && !(typeof vueIntegree === 'function' && vueIntegree())) dessinerFenetreApp();
	dessinerBarreTaches();
}

/** Fond d'écran seul (derrière l'appli Régulation en fenêtre, prompt 50) */
function dessinerFondOS() {
	drawingContext.imageSmoothingEnabled = false;
	image(fondOS(), 0, 0, L, H);
	drawingContext.imageSmoothingEnabled = true;
}

// ——— Prompt 50 : l'appli Régulation n'est plus en plein écran — fenêtre au-dessus de la barre des tâches ———
// Elle garde ses coordonnées 1920×1080 : on la dessine réduite (même proportion) et centrée, souris, boutons et
// cibles du guide étant convertis.
// Prompt 105 : l'appli occupe tout l'écran du PC (échelle 1, plus de barre des tâches dessous)
const FENETRE_APPLI = { k: 1, x: 0, y: 0 };
let transformAppli = null;
let sourisAvantAppli = null;
function entrerFenetreAppli() {
	const A = FENETRE_APPLI;
	noStroke();
	fill(0, 0, 0, 120);
	rect(A.x + 8, A.y + 10, L * A.k, H * A.k); // ombre de la fenêtre
	sourisAvantAppli = { x: mouseX, y: mouseY };
	window.mouseX = (mouseX - A.x) / A.k;
	window.mouseY = (mouseY - A.y) / A.k;
	push();
	translate(A.x, A.y);
	scale(A.k);
	drawingContext.save();
	drawingContext.beginPath();
	drawingContext.rect(0, 0, L, H);
	drawingContext.clip();
	transformAppli = A;
	return boutons.length;
}
function sortirFenetreAppli(n0) {
	const A = FENETRE_APPLI;
	drawingContext.restore();
	pop();
	transformAppli = null;
	window.mouseX = sourisAvantAppli.x;
	window.mouseY = sourisAvantAppli.y;
	for (let i = n0; i < boutons.length; i++) {
		const b = boutons[i];
		boutons[i] = Object.assign({}, b, { x: A.x + b.x * A.k, y: A.y + b.y * A.k, l: b.l * A.k, h: b.h * A.k });
	}
	noFill();
	stroke(DS.blanc15);
	strokeWeight(2);
	rect(A.x - 1, A.y - 1, L * A.k + 2, H * A.k + 2);
	noStroke();
}
/** Souris (hors draw) dans les coordonnées de l'appli Régulation */

/** Barre des tâches de RégulOS (prompt 36), visible aussi sous l'appli Régulation (prompt 50) */
function dessinerBarreTaches() {
	// Barre des tâches (prompt 36 : agrandie, 84 px, icônes 72 px)
	const tb = H - BARRE_OS;
	noStroke();
	fill(DS.fond);
	rect(0, tb, L, BARRE_OS);
	fill(DS.blanc15);
	rect(0, tb, L, 2);
	dessinerBoutonDemarrer(tb); // prompt 75 : le logo du chargement à la place du carré rouge « REGUL »
	const barre = ICONES_OS.filter((ic) => ic.cle === 'signalements' || (ecran !== 'jeu' && appliDebloquee(ic.cle))); // prompt 103 : l'appli principale seule (prompt 91 § 2 hors partie)
	barre.forEach((ic) => {
		const i = ICONES_OS.indexOf(ic);
		const k = barre.indexOf(ic);
		const x = 164 + k * 84;
		const actif = (ic.cle === 'signalements' && PC.etat === 'appli') || PC.fenetre === ic.cle || (ic.cle === 'indicateurs' && PC.flottant);
		fill(actif ? DS.blanc15 : DS.blanc05);
		rect(x, tb + 8, 76, BARRE_OS - 16);
		if (actif) {
			fill(DS.primaire);
			rect(x, tb + BARRE_OS - 10, 76, 3);
		}
		ic.dessin(x + 10, tb + 12, 0.7);
		boutons.push({ x, y: tb + 8, l: 76, h: BARRE_OS - 16, action: () => ouvrirIconeOS(i) });
		const b = ic.cle === 'indicateurs' ? '' : badgeIcone(ic.cle);
		if (b) dsBadge(x + 68, tb + 10, b, 'erreur');
	});
	const hA = heureAffichee();
	const bandeauVisible = ecran === 'jeu' && (PC.etat === 'appli' || (typeof vueIntegree === 'function' && vueIntegree())); // prompt 103 : heure et jauges sont dans le bandeau
	if (!bandeauVisible) dsTexte(String(hA.h).padStart(2, '0') + ':' + String(hA.m).padStart(2, '0'), L - 24, tb + 24, 28, DS.blanc, 'right');
	indicateurWebcamBarre(700, tb + 22); // prompt 57 : « CAM » + point rouge tant que la webcam est active
	if (bandeauVisible) {
		// prompt 103 : rien de plus (bandeau visible)
	} else if (Jeu.jauges && ecran === 'jeu') dsTexte(t('os.jauges', { b: Jeu.jauges.budget, r: Jeu.jauges.reputation, f: Jeu.jauges.fluidite }), L - 130, tb + 28, 20, DS.blanc75, 'right');
	else dsTexte(t('os.aideClavier'), 790, tb + 28, 18, DS.blanc50, 'left');
}

// ——— Prompt 75 : bouton en bas à gauche de la barre des tâches = logo du jeu (même source que l'écran de chargement)
// Clic, ou Tab jusqu'à lui puis Entrée : retour à l'accueil de RégulOS (appli et fenêtre fermées).
let focusDemarrer = false;
const BOUTON_DEMARRER = { x: 8, l: 140 };
function dessinerBoutonDemarrer(tb) {
	const b = { x: BOUTON_DEMARRER.x, y: tb + 8, l: BOUTON_DEMARRER.l, h: BARRE_OS - 16 };
	const survol = mouseX >= b.x && mouseX <= b.x + b.l && mouseY >= b.y && mouseY <= b.y + b.h;
	noStroke();
	fill(survol || focusDemarrer ? DS.blanc15 : DS.blanc05);
	rect(b.x, b.y, b.l, b.h);
	dessinerLogoPXE(b.x + (b.l - 72) / 2, b.y + (b.h - 60) / 2, 60); // échelle 3 : 72 × 60 px
	if (focusDemarrer || survol) {
		noFill();
		stroke(DS.blanc);
		strokeWeight(2);
		rect(b.x - 4, b.y - 4, b.l + 8, b.h + 8);
		stroke(DS.fond);
		rect(b.x - 1, b.y - 1, b.l + 2, b.h + 2);
		noStroke();
	}
	boutons.push({ x: b.x, y: b.y, l: b.l, h: b.h, action: retourAccueilPC });
	cibleGuide('demarrer', b.x, b.y, b.l, b.h);
	if (survol || focusDemarrer) infobulle(t('os.demarrer'), b.x, b.y - 48);
}
/** Accueil de RégulOS : ferme l'appli de jeu et la fenêtre ouverte (rien ne s'arrête : le temps continue) */
function retourAccueilPC() {
	if (PC.etat !== 'appli' && PC.etat !== 'os') return;
	PC.etat = 'os';
	PC.fenetre = null;
	Confort.Son.bip('choix');
	annoncer(t('os.demarrer.annonce'));
}
function basculerFocusDemarrer(actif) {
	focusDemarrer = actif;
	if (actif) annoncer(t('os.demarrer'));
}

function dessinerDemarrage() {
	const tB = millis() - PC.debut;
	background(DS.fond);
	if (tB < 1200) {
		const lignes = [0, 1, 2, 3, 4].map((n) => t('os.bios.' + n));
		lignes.slice(0, 1 + Math.floor(tB / 220)).forEach((l, i) => dsTexte(l, 80, 80 + i * 44, 26, i === 0 ? DS.primaire : DS.blanc75, 'left'));
	} else if (tB < DUREE_DEMARRAGE - 500) {
		// Logo du système fictif (carré rouge, angles droits) + titre pixel + barre de progression
		const cx = L / 2;
		const cy = H / 2 - 80;
		noStroke();
		fill(DS.primaire);
		rect(cx - 64, cy - 64, 128, 128);
		fill(DS.blanc);
		rect(cx - 44, cy - 36, 88, 28);
		rect(cx - 40, cy - 4, 80, 12);
		rect(cx - 30, cy + 16, 16, 16);
		rect(cx + 14, cy + 16, 16, 16);
		fill(DS.primaire);
		rect(cx - 36, cy - 30, 30, 14);
		rect(cx + 6, cy - 30, 30, 14);
		dsTitre('RegulOS', cx, cy + 96, 56, DS.blanc, 'center');
		const p = constrain((tB - 1200) / (DUREE_DEMARRAGE - 1700), 0, 1);
		stroke(DS.blanc15);
		strokeWeight(2);
		noFill();
		rect(cx - 200, cy + 190, 400, 20);
		noStroke();
		fill(DS.primaire);
		const blocs = Math.floor(p * 24);
		for (let k = 0; k < blocs; k++) rect(cx - 196 + k * 16.4, cy + 194, 12, 12); // progression par blocs (pixel)
	} else {
		drawingContext.imageSmoothingEnabled = false;
		image(fondOS(), 0, 0, L, H);
		drawingContext.imageSmoothingEnabled = true;
		fill(DS.noir50);
		rect(L / 2 - 260, H / 2 - 60, 520, 120);
		dsTitre(t('os.bienvenue'), L / 2, H / 2 - 30, 56, DS.blanc, 'center');
	}
	if (tB >= DUREE_DEMARRAGE) PC.etat = 'os';
}

function iconeCorbeille(x, y, s) {
	push();
	translate(x, y);
	scale(s || 1);
	x = 0;
	y = 0;
	noStroke();
	fill('#cfd8e0');
	rect(x + 14, y + 16, 52, 62, 6);
	fill('#9aa8b6');
	rect(x + 8, y + 8, 64, 10, 4);
	fill('#7f8c99');
	for (let k = 0; k < 3; k++) rect(x + 24 + k * 12, y + 26, 4, 44, 2);
	pop();
}

/** Barre de titre de l'appli (Pixel Design System) : titre pixel + bouton fermer carré → retour au bureau du système */
function dessinerFermerAppli() {
	noStroke();
	fill(DS.fond);
	rect(0, 0, L, 34);
	fill(DS.blanc15);
	rect(0, 34, L, 2);
	dsTitre(t('os.barreTitre'), DS.esp.xxl, 6, 24, DS.blanc, 'left'); // prompt 101 : même marge gauche (24 px) que le titre des autres applis
	dsTexte(t('os.poste'), L / 2, 8, 16, DS.blanc50, 'center');
	const x = L - 46;
	const y = 3;
	const survol = mouseX >= x && mouseX <= x + 40 && mouseY >= y && mouseY <= y + 28;
	fill(survol ? DS.primaire : DS.fond);
	rect(x, y, 40, 28);
	stroke(survol ? DS.primaire : DS.blanc);
	strokeWeight(2);
	noFill();
	rect(x + 1, y + 1, 38, 26);
	stroke(DS.blanc);
	strokeWeight(3);
	line(x + 14, y + 8, x + 26, y + 20);
	line(x + 26, y + 8, x + 14, y + 20);
	noStroke();
	boutons.push({ x: x - 12, y: 0, l: 58, h: 52, action: fermerAppli }); // prompt 98 : zone de clic ≥ 44 px (le dessin reste 40 × 28)
	cibleGuide('fermerAppli', x, y, 40, 28); // prompt 37
}

// =====================================================================
// Prompt 22 — applications du poste de travail (fenêtres RégulOS, Pixel Design System)
// Le temps ne s'arrête pas pendant la lecture d'une app (comme les livres du prompt 20).
// =====================================================================
const ICONES_OS = [
	{ cle: 'signalements', nom: T('app.signalements'), dessin: (x, y, s) => iconePixel(x, y, s, 'signalements') }, // prompts 68 / 73 : l'écran de jeu (ex-« Carte », plus de carte)
	{ cle: 'patron', nom: T('app.patron'), dessin: (x, y, s) => iconePixel(x, y, s, 'enveloppe') },
	{ cle: 'community', nom: T('app.community'), dessin: (x, y, s) => iconePixel(x, y, s, 'bulle') },
	{ cle: 'journal', nom: T('app.journal'), dessin: (x, y, s) => iconePixel(x, y, s, 'livre') },
	// Prompt 103 : Indicateurs (jauges déjà dans le bandeau) et Corbeille (décorative) retirés du PC
];

function ouvrirIconeOS(i) {
	PC.selection = i;
	const cle = ICONES_OS[i].cle;
	if (!appliDebloquee(cle)) return refuserAppliVerrouillee(cle); // prompt 91 § 2
	if (cle === 'signalements') return ouvrirAppli(); // prompts 68 / 73 : « Signalements » ouvre l'écran de jeu
	if (cle === 'indicateurs') return basculerIndicateurs(); // prompt 36 : app flottante
	if (cle === 'donnees') return ouvrirDonnees(); // prompt 61 : appli plein écran
	if (PC.etat === 'appli') PC.etat = 'os';
	PC.fenetre = typeof vueIntegree === 'function' && ecran === 'jeu' ? cle : PC.fenetre === cle ? null : cle; // prompt 103 : dans l'appli, le menu ne referme pas la vue
	PC.message = '';
	if (PC.fenetre && Jeu.nonLus && Jeu.nonLus[cle] !== undefined) Jeu.nonLus[cle] = 0;
	Confort.Son.bip('choix');
}
function fermerFenetreApp() {
	const integree = typeof vueIntegree === 'function' && vueIntegree();
	PC.fenetre = null;
	if (integree) PC.etat = 'appli'; // prompt 103 : Échap revient à la carte
}
function badgeIcone(cle) {
	if (cle === 'signalements') return typeof incidentActif === 'function' && (incidentActif() || phase === 'mail') ? '!' : ''; // prompt 68
	// Prompt 101 (règle 6) : un badge seulement pour ce qui est À FAIRE — les plaintes qui attendent une réponse ;
	// les nouveaux messages du patron (information) restent annoncés par les notifications et « Nouveaux messages »
	if (cle === 'community') {
		const n = (Jeu.plaintes || []).filter((p) => p.reponse === null && !p.expiree && !p.transmise).length;
		return n ? String(n) : '';
	}
	return '';
}

/** Icônes 80×80 en pixels (rectangles, angles droits), dessinées par le code */
function iconePixel(x, y, s, type) {
	s = s || 1;
	push();
	translate(x, y);
	scale(s);
	noStroke();
	fill(DS.fond);
	rect(0, 0, 80, 80);
	stroke(DS.blanc15);
	strokeWeight(2);
	noFill();
	rect(1, 1, 78, 78);
	noStroke();
	if (type === 'enveloppe') {
		fill(DS.blanc);
		rect(12, 22, 56, 38);
		fill(DS.primaire);
		for (let k = 0; k < 7; k++) rect(16 + k * 4, 26 + k * 3, 4, 4), rect(60 - k * 4, 26 + k * 3, 4, 4);
	} else if (type === 'signalements') {
		// Prompt 73 : une liste de signalements (pastille de gravité + deux traits), plus de carte
		[DS.primaire, '#FFC138', DS.blanc50].forEach((c, k) => {
			fill(c);
			rect(12, 14 + k * 19, 8, 13);
			fill(DS.blanc);
			rect(26, 15 + k * 19, 42 - k * 6, 4);
			fill(DS.blanc50);
			rect(26, 22 + k * 19, 30 - k * 4, 3);
		});
		fill(DS.primaire);
		rect(12, 66, 56, 4);
	} else if (type === 'bulle') {
		fill(DS.blanc);
		rect(10, 14, 60, 38);
		rect(20, 52, 10, 10);
		fill(DS.fond);
		for (let k = 0; k < 3; k++) rect(20, 22 + k * 9, 40 - k * 10, 4);
	} else if (type === 'livre') {
		fill(DS.primaire);
		rect(12, 14, 26, 52);
		rect(42, 14, 26, 52);
		fill(DS.blanc);
		rect(16, 18, 18, 44);
		rect(46, 18, 18, 44);
		fill(DS.fond);
		for (let k = 0; k < 4; k++) rect(18, 24 + k * 9, 14, 2), rect(48, 24 + k * 9, 14, 2);
	}
	pop();
}

const FENETRE_APP = { x: 470, y: 40, l: 1410, h: 900 }; // prompt 36 : décalée pour les icônes agrandies
const TITRES_APPS = { patron: T('app.titre.patron'), community: T('app.titre.community'), journal: T('app.titre.journal'), corbeille: T('app.titre.corbeille') };

function dessinerFenetreApp() {
	const f = FENETRE_APP;
	dsPanneau(f.x, f.y, f.l, f.h, TITRES_APPS[PC.fenetre]);
	// Croix de fermeture (carré, angles droits)
	const cx = f.x + f.l - 52;
	const cy = f.y + 12;
	const survol = mouseX >= cx && mouseX <= cx + 36 && mouseY >= cy && mouseY <= cy + 36;
	noStroke();
	fill(survol ? DS.primaire : DS.fond);
	rect(cx, cy, 36, 36);
	stroke(DS.blanc);
	strokeWeight(3);
	line(cx + 11, cy + 11, cx + 25, cy + 25);
	line(cx + 25, cy + 11, cx + 11, cy + 25);
	noStroke();
	boutons.push({ x: cx, y: cy, l: 36, h: 36, action: fermerFenetreApp });
	if (Jeu.nonLus && Jeu.nonLus[PC.fenetre] !== undefined) Jeu.nonLus[PC.fenetre] = 0; // lu
	const zone = { x: f.x + 48, y: f.y + 96, l: f.l - 96, h: f.h - 96 - 48 }; // prompt 101 b : marges d'air (48 px), plus de bouton Fermer en bas
	if (!Jeu.paquet || ecran !== 'jeu') {
		dsTexte(t('app.aucunePartie'), zone.x, zone.y, 22, DS.blanc75, 'left', zone.l);
		dsBouton(zone.x, zone.y + 80, 340, 60, t('menu.menuPrincipal'), ouvrirMenuPrincipal); // prompt 36
	} else if (PC.fenetre === 'corbeille') appCorbeille(zone);
	else if (PC.fenetre === 'patron') appPatron(zone);
	else if (PC.fenetre === 'community') appCommunity(zone);
	else if (PC.fenetre === 'journal') appJournal(zone);
	// Prompt 101 b : le bouton « Fermer (Échap) » du bas doublait la croix du titre (Échap ferme toujours)
}

function derniers(liste, n) {
	return liste.slice(Math.max(0, liste.length - n));
}


// ——— Prompt 28 : plaintes des Nantais (contenu : data/messages.json) ———
let focusReponse = 0; // réponse sélectionnée au clavier (Tab / Entrée, ou 1 / 2 / 3)
let retourPlainte = null; // { texte, bonne, jusqua } : résultat affiché quelques secondes après une réponse

function repondrePlainte(i, cible) {
	const p = cible || cibleCommunity(); // prompt 85 : la plainte visée (mention ou conversation privée)
	if (!p) return;
	const r = Jeu.repondrePlainte(p, i, millis()); // prompt 79 : réponse rapide ou tardive
	if (!r) return;
	focusReponse = 0;
	const fx = Object.keys(r.effets)
		.map((k) => t('jauge.' + k) + ' ' + (r.effets[k] > 0 ? '+' : '') + r.effets[k])
		.join(' · ');
	const texte = t(r.bonne ? 'plainte.bonne' : 'plainte.mauvaise', { effets: fx || '0' }) + (r.tardive ? ' ' + t('plainte.tardive') : '');
	retourPlainte = { texte, bonne: r.bonne, jusqua: millis() + 5000 };
	annoncer(texte); // aria-live
	Confort.Son.bip(r.bonne ? 'action' : 'alerte');
}


function appCommunity(z) {
	dessinerCompteSocial(z); // prompt 85 : le compte social de la régulation (community.js)
}

// Prompt 63 : journal par journée, avec une enquête après coup sur chaque incident (données réelles uniquement)
// Prompt 89 : l'appli Journal (appJournal, enquête, JOURNAL, VOLETS_ENQUETE) est dans journal.js / journal-donnees.js
const signe = (v) => (v > 0 ? '+' + v : v < 0 ? '−' + Math.abs(v) : '0');

// =====================================================================
// Prompt 36 — Corbeille (plaintes traitées) et app flottante « Indicateurs »
// =====================================================================
function appCorbeille(z) {
	const liste = (Jeu.plaintes || []).filter((p) => p.reponse !== null && !p.masquee);
	if (!liste.length) return dsTexte(t('app.corbeille.vide'), z.x, z.y, 20, DS.blanc50, 'left'); // prompt 101 : vue vide = une phrase
	dsTexte(t('app.corbeille.intro', { n: liste.length }), z.x, z.y, 20, DS.blanc75, 'left', z.l - 320);
	dsBouton(z.x + z.l - 300, z.y - 8, 300, 52, t('app.corbeille.vider'), viderCorbeille, 'contour');
	let y = z.y + 64;
	liste
		.slice()
		.reverse()
		.slice(0, 6)
		.forEach((p) => {
			const r = p.def.reponses[p.reponse];
			noStroke();
			fill(DS.blanc05);
			rect(z.x, y, z.l, 104);
			fill(p.bonne ? DS.succes : DS.alerte);
			rect(z.x, y, 4, 104);
			dsTexte(p.auteur + ' · ' + p.heure, z.x + 18, y + 10, 16, DS.blanc50, 'left');
			dsTexte(Jeu.texteMessage(p.def.texte, p.vars), z.x + 18, y + 32, 18, DS.blanc, 'left', z.l - 200);
			dsTexte('↳ ' + Jeu.texteMessage(r.texte, p.vars), z.x + 18, y + 66, 17, DS.blanc75, 'left', z.l - 200);
			const rep = Number((r.effets || {}).reputation) || 0;
			dsBadge(z.x + z.l - 90, y + 40, t(p.bonne ? 'app.corbeille.bonne' : 'app.corbeille.mauvaise') + ' ' + (rep > 0 ? '+' : '') + rep, p.bonne ? 'succes' : 'alerte');
			y += 116;
		});
}
function viderCorbeille() {
	(Jeu.plaintes || []).forEach((p) => {
		if (p.reponse !== null) p.masquee = true; // retirées de la liste seulement : jauges et bilan inchangés
	});
	annoncer(t('app.corbeille.videe'));
	Confort.Son.bip('choix');
}

function iconeIndicateurs(x, y, s) {
	push();
	translate(x, y);
	scale(s);
	noStroke();
	fill('#0e3b46');
	rect(0, 0, 80, 80, 12);
	[['#1e7a3c', 52], ['#d39a2e', 36], ['#3860ff', 24]].forEach(([c, h], i) => {
		fill(c);
		rect(14 + i * 20, 66 - h, 14, h, 2);
	});
	fill('#f5efe3');
	rect(10, 68, 60, 4, 2);
	pop();
}

// Fenêtre flottante, toujours au premier plan, déplaçable par sa barre de titre ; position mémorisée
const CLE_INDICATEURS = 'pxe-nte001:jeu:indicateurs';
const INDIC = (() => {
	let pos = { x: 1440, y: 120 };
	try {
		const o = JSON.parse(localStorage.getItem(CLE_INDICATEURS) || 'null');
		if (o && Number.isFinite(o.x) && Number.isFinite(o.y)) pos = o;
	} catch (e) {}
	return { l: 460, h: 572, pos, prise: null, deplie: false }; // prompt 84 : + statut auprès du patron ; prompt 88 : + grade et badges ; prompt 101 (D2) : replié par défaut
})();
// Prompt 101, décision D2 (groupe, 12/11/2026) : panneau replié par défaut sur les trois jauges ; l'objectif, les
// seuils, le statut, le grade et les badges s'affichent au survol, ou restent dépliés (bouton « Détails » ou touche V)
const INDIC_H = { replie: 324, deplie: 616 }; // déplié : le contenu d'avant (572) décalé de 44 px sous « Détails »
function basculerDetailsIndicateurs() {
	INDIC.deplie = !INDIC.deplie;
	Confort.Son.clic();
	annoncer(t(INDIC.deplie ? 'journal.details' : 'journal.detailsMasquer'));
}
function basculerIndicateurs() {
	PC.flottant = !PC.flottant;
	if (PC.flottant) annoncer(t('indic.annonce', { f: Jeu.jauges ? Jeu.jauges.fluidite : 50, r: Jeu.jauges ? Jeu.jauges.reputation : 50, b: Jeu.jauges ? Jeu.jauges.budget : 50 }));
	Confort.Son.bip('choix');
}
/** Souris dans les coordonnées de l'écran du PC (utile dans une action de clic, appelée hors de draw) */
function sourisEcranPC() {
	if (vue !== 'poste') return { x: mouseX, y: mouseY };
	const r = ECRAN_POSTE;
	return { x: ((mouseX - r.x) * L) / r.l, y: ((mouseY - r.y) * H) / r.h };
}
function couleurJauge(v) {
	return v < 20 ? DS.erreur : v < 40 ? DS.alerte : DS.succes;
}
/** Dessinée par-dessus le bureau RégulOS et l'appli de régulation (coordonnées de l'écran du PC) */
function dessinerIndicateurs() {
	if (!PC.flottant || PC.etat === 'eteint' || PC.etat === 'demarrage') return;
	const I = INDIC;
	const survol = mouseX >= I.pos.x && mouseX <= I.pos.x + I.l && mouseY >= I.pos.y && mouseY <= I.pos.y + I.h;
	const deplie = I.deplie || !!I.prise || survol;
	I.h = deplie ? INDIC_H.deplie : INDIC_H.replie;
	if (I.prise) {
		if (mouseIsPressed) {
			I.pos.x = constrain(mouseX - I.prise.dx, 0, L - I.l);
			I.pos.y = constrain(mouseY - I.prise.dy, 0, H - BARRE_OS - I.h);
		} else {
			I.prise = null;
			try {
				localStorage.setItem(CLE_INDICATEURS, JSON.stringify(I.pos));
			} catch (e) {}
		}
	}
	const { x, y } = I.pos;
	noStroke();
	fill(0, 0, 0, 110);
	rect(x + 8, y + 10, I.l, I.h); // ombre : la fenêtre flotte
	fill(DS.fond);
	rect(x, y, I.l, I.h);
	stroke(DS.blanc15);
	strokeWeight(2);
	noFill();
	rect(x + 1, y + 1, I.l - 2, I.h - 2);
	noStroke();
	// Barre de titre (poignée de déplacement)
	fill(I.prise ? DS.primaire : '#1d1b1b');
	rect(x, y, I.l, 44);
	dsTitre(t('indic.titre'), x + 14, y + 8, 22, DS.blanc, 'left');
	dsTexte('⠿', x + I.l - 84, y + 10, 20, DS.blanc50, 'left');
	boutons.push({
		x,
		y,
		l: I.l - 48,
		h: 44,
		action: () => {
			const m = sourisEcranPC();
			I.prise = { dx: m.x - I.pos.x, dy: m.y - I.pos.y };
		},
	});
	const cx = x + I.l - 42;
	fill(DS.fond);
	rect(cx, y + 6, 32, 32);
	stroke(DS.blanc);
	strokeWeight(3);
	line(cx + 9, y + 15, cx + 23, y + 29);
	line(cx + 23, y + 15, cx + 9, y + 29);
	noStroke();
	boutons.push({ x: cx, y: y + 6, l: 32, h: 32, action: basculerIndicateurs });
	if (!Jeu.jauges || ecran !== 'jeu') {
		dsTexte(t('indic.aucunePartie'), x + 18, y + 66, 18, DS.blanc75, 'left', I.l - 36);
		return;
	}
	// Variation due à la dernière décision (deltas réels du journal)
	const dernier = (Jeu.evenementsJournee || [])[Jeu.evenementsJournee.length - 1];
	['fluidite', 'reputation', 'budget'].forEach((k, i) => {
		const v = Jeu.jauges[k];
		const ly = y + 62 + i * 74;
		dsTexte(t('jaugeTitre.' + k), x + 18, ly, 20, DS.blanc, 'left');
		fill(DS.blanc15);
		rect(x + 18, ly + 32, I.l - 36, 14);
		fill(couleurJauge(v));
		rect(x + 18, ly + 32, ((I.l - 36) * v) / 100, 14);
		// Prompt 143 : plus de « v / 100 » ; barre blanche de seuil sur la seule jauge objectif du jour, libellée dessous
		if (dessinerSeuilObjectif(k, x + 18, ly + 32, I.l - 36, 14)) dsTexte('| ' + texteSeuilObjectif(k), x + I.l - 120, ly + 3, 15, DS.blanc, 'right'); // libellé sur la ligne du titre, avant le delta
		const d = dernier && dernier.deltas ? dernier.deltas[k] : null;
		if (d) dsTexte((d > 0 ? '▲ +' : '▼ ') + d, x + I.l - 18, ly, 16, d > 0 ? DS.succes : DS.alerte, 'right');
	});
	// Replié : « Détails » (clic / toucher, V) ; déplié par le bouton : « Masquer les détails » en bas
	// Bouton à la même place dans les deux états (le survol déplie sans le déplacer sous la souris)
	dsBouton(x + 18, y + 268, 300, 44, t(I.deplie ? 'journal.detailsMasquer' : 'journal.details') + ' (V)', basculerDetailsIndicateurs, 'fantome');
	if (!deplie) return;
	const o = Jeu.objectifDuJour ? Jeu.objectifDuJour() : null;
	if (o) dsTexte(t('indic.objectif', { libelle: o.libelle, ok: Jeu.jauges[o.jauge] >= o.seuil ? '✓' : '✗' }), x + 18, y + 328, 16, DS.blanc75, 'left', I.l - 36);
	const b = Jeu.jauges.budget;
	dsTexte(t(b < 20 ? 'indic.budgetBas' : b >= 70 ? 'indic.budgetHaut' : 'indic.budgetMoyen'), x + 18, y + 380, 16, DS.blanc50, 'left', I.l - 36);
	// Prompt 84 : statut auprès du patron (niveau et avertissements)
	const S = Jeu.statutPatron || { niveau: 0, avertissements: 0 };
	dsTexte(t('indic.statut', { statut: t(['statut.normal', 'statut.surveillance', 'statut.dernier'][S.niveau] || 'statut.normal'), n: S.avertissements }), x + 18, y + 428, 16, S.niveau === 2 ? DS.erreurClair : S.niveau === 1 ? DS.alerte : DS.blanc75, 'left', I.l - 36);
	// Prompt 88 : grade (carrière, entre les parties) et vitrine des badges — faits de la partie uniquement
	if (typeof Taches !== 'undefined') {
		const g = Taches.grade();
		dsTexte(t('indic.grade', { grade: t('grade.' + g.i), xp: g.xp }), x + 18, y + 496, 16, DS.blanc, 'left', I.l - 36);
		const c = Taches.carriere();
		Taches.R.badges.forEach((b, i) => {
			const obtenu = !!(c.badges[b] && c.badges[b].n);
			dessinerBadge(b, x + 18 + i * 108, y + 536, 40, obtenu);
			if (obtenu && c.badges[b].n > 1) dsTexte('×' + c.badges[b].n, x + 64 + i * 108, y + 556, 14, DS.blanc75, 'left');
		});
	}
}
