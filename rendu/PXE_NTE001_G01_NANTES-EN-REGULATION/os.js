/* Nantes en régulation — le PC du bureau : démarrage et bureau d'un système FICTIF (« RégulOS »).
 * Fond d'écran ORIGINAL qui évoque l'esthétique bleue et lumineuse des bureaux d'ordinateur de la fin
 * des années 2000 (dégradé, traînées de lumière, bulles floues), pixelisé ; aucun logo ni visuel de
 * marque existant n'est reproduit. Tout est dessiné par le code (contenu 1920×1080 de l'écran du PC).
 */
const PC = { etat: 'eteint', debut: 0, selection: 0, fenetre: null, message: '', flottant: false };
// Prompt 36 : grille d'icônes agrandie et barre des tâches plus haute
const GRILLE_OS = { x: 36, y: 36, l: 200, h: 200, ecart: 16, lignes: 4, echelle: 1.35 };
const BARRE_OS = 84; // etat : 'eteint' | 'demarrage' | 'os' | 'appli' ; fenetre : null | 'patron' | 'carte' | 'community' | 'journal'
const DUREE_DEMARRAGE = 3400;
let gFondOS = null;

function demarrerPC() {
	PC.etat = 'demarrage';
	PC.debut = millis();
	Confort.Son.bip('dossier');
}
function ouvrirAppli() {
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
	if (PC.fenetre === 'donnees') return dessinerAppliDonnees(); // prompt 61 : plein écran, barre des tâches comprise
	drawingContext.imageSmoothingEnabled = false;
	image(fondOS(), 0, 0, L, H);
	drawingContext.imageSmoothingEnabled = true;
	// Icônes du bureau (2 colonnes × 4) — prompt 36 : agrandies (icône 108 px au lieu de 80, libellé 22 px)
	ICONES_OS.forEach((ic, i) => {
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
		ic.dessin(x + (g.l - 80 * g.echelle) / 2, y + 14, g.echelle);
		fill(DS.noir50);
		textFont(DS.policeTexte);
		textSize(22);
		const tl = textWidth(String(ic.nom)) + 16;
		rect(x + g.l / 2 - tl / 2, y + 138, tl, 36);
		dsTexte(ic.nom, x + g.l / 2, y + 142, 22, DS.blanc, 'center');
		boutons.push({ x, y, l: g.l, h: g.h, action: () => ouvrirIconeOS(i) });
		if (i === 0) cibleGuide('iconeRegulation', x, y, g.l, g.h); // prompt 37
		if (i === 1) cibleGuide('iconesOS', x, y, g.l * 2 + g.ecart, g.h * 3 + g.ecart * 2); // patron, carte, community, journal, indicateurs
		const b = ic.cle === 'indicateurs' ? (PC.flottant ? '●' : '') : badgeIcone(ic.cle);
		if (b) dsBadge(x + g.l - 34, y + 20, b, ic.cle === 'indicateurs' ? 'succes' : 'erreur');
	});
	// Fenêtre d'application ouverte (prompt 22)
	if (PC.fenetre) dessinerFenetreApp();
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
const FENETRE_APPLI = { k: (H - BARRE_OS - 12) / H, x: 0, y: 6 };
FENETRE_APPLI.x = (L - L * FENETRE_APPLI.k) / 2;
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
function sourisAppli() {
	const m = sourisEcranPC();
	if (PC.etat !== 'appli') return m;
	const A = FENETRE_APPLI;
	return { x: (m.x - A.x) / A.k, y: (m.y - A.y) / A.k };
}

/** Barre des tâches de RégulOS (prompt 36), visible aussi sous l'appli Régulation (prompt 50) */
function dessinerBarreTaches() {
	// Barre des tâches (prompt 36 : agrandie, 84 px, icônes 72 px)
	const tb = H - BARRE_OS;
	noStroke();
	fill(DS.fond);
	rect(0, tb, L, BARRE_OS);
	fill(DS.blanc15);
	rect(0, tb, L, 2);
	fill(DS.primaire);
	rect(8, tb + 10, 140, BARRE_OS - 20);
	dsTitre('REGUL', 78, tb + 22, 32, DS.blanc, 'center');
	ICONES_OS.filter((ic) => ic.cle !== 'corbeille').forEach((ic) => {
		const i = ICONES_OS.indexOf(ic);
		const k = ICONES_OS.filter((x) => x.cle !== 'corbeille').indexOf(ic);
		const x = 164 + k * 84;
		const actif = (ic.cle === 'regulation' && PC.etat === 'appli') || PC.fenetre === ic.cle || (ic.cle === 'indicateurs' && PC.flottant);
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
	dsTexte(String(hA.h).padStart(2, '0') + ':' + String(hA.m).padStart(2, '0'), L - 24, tb + 24, 28, DS.blanc, 'right');
	indicateurWebcamBarre(700, tb + 22); // prompt 57 : « CAM » + point rouge tant que la webcam est active
	if (Jeu.jauges && ecran === 'jeu') dsTexte(t('os.jauges', { b: Jeu.jauges.budget, r: Jeu.jauges.reputation, f: Jeu.jauges.fluidite }), L - 130, tb + 28, 20, DS.blanc75, 'right');
	else dsTexte(t('os.aideClavier'), 790, tb + 28, 18, DS.blanc50, 'left');
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

function iconeRegulation(x, y, s) {
	s = s || 1;
	push();
	translate(x, y);
	scale(s);
	noStroke();
	fill('#0e3b46');
	rect(0, 0, 80, 80, 12);
	fill('#f5efe3');
	rect(6, 6, 68, 68, 8);
	stroke('#1e7a3c');
	strokeWeight(6);
	line(14, 54, 66, 26);
	stroke('#b3261e');
	line(20, 20, 58, 64);
	noStroke();
	fill('#0e3b46');
	circle(40, 40, 16);
	pop();
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
	dsTitre(t('os.barreTitre'), 16, 6, 24, DS.blanc, 'left');
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
	boutons.push({ x, y, l: 40, h: 28, action: fermerAppli });
	cibleGuide('fermerAppli', x, y, 40, 28); // prompt 37
}

// =====================================================================
// Prompt 22 — applications du poste de travail (fenêtres RégulOS, Pixel Design System)
// Le temps ne s'arrête pas pendant la lecture d'une app (comme les livres du prompt 20).
// =====================================================================
const ICONES_OS = [
	{ cle: 'regulation', nom: T('app.regulation'), dessin: (x, y, s) => iconeRegulation(x, y, s || 1) },
	{ cle: 'patron', nom: T('app.patron'), dessin: (x, y, s) => iconePixel(x, y, s, 'enveloppe') },
	{ cle: 'carte', nom: T('app.carte'), dessin: (x, y, s) => iconePixel(x, y, s, 'carte') },
	{ cle: 'community', nom: T('app.community'), dessin: (x, y, s) => iconePixel(x, y, s, 'bulle') },
	{ cle: 'journal', nom: T('app.journal'), dessin: (x, y, s) => iconePixel(x, y, s, 'livre') },
	{ cle: 'indicateurs', nom: T('app.indicateurs'), dessin: (x, y, s) => iconeIndicateurs(x, y, s || 1) }, // prompt 36
	{ cle: 'corbeille', nom: T('app.corbeille'), dessin: (x, y, s) => iconeCorbeille(x, y, s) },
];

function ouvrirIconeOS(i) {
	PC.selection = i;
	const cle = ICONES_OS[i].cle;
	if (cle === 'regulation') return ouvrirAppli();
	if (cle === 'indicateurs') return basculerIndicateurs(); // prompt 36 : app flottante
	if (cle === 'donnees') return ouvrirDonnees(); // prompt 61 : appli plein écran
	if (PC.etat === 'appli') PC.etat = 'os';
	if (cle === 'carte' && typeof revelerSource === 'function') revelerSource('carte', false); // prompt 50
	PC.fenetre = PC.fenetre === cle ? null : cle; // re-cliquer l'icône active referme l'app
	PC.message = '';
	if (PC.fenetre && Jeu.nonLus && Jeu.nonLus[cle] !== undefined) Jeu.nonLus[cle] = 0;
	Confort.Son.bip('choix');
}
function fermerFenetreApp() {
	PC.fenetre = null;
}
function badgeIcone(cle) {
	if (cle === 'regulation') return typeof incidentActif === 'function' && (incidentActif() || phase === 'mail') ? '!' : '';
	if (!Jeu.nonLus) return '';
	if (cle === 'carte') return typeof incidentActif === 'function' && incidentActif() && !Jeu.equipePour(Jeu.index) ? '1' : '';
	return Jeu.nonLus[cle] ? String(Jeu.nonLus[cle]) : '';
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
	} else if (type === 'carte') {
		fill('#2b3a4a');
		rect(10, 10, 60, 60);
		fill(DS.info);
		rect(10, 40, 60, 8); // la Loire
		fill(DS.blanc50);
		rect(36, 10, 4, 60);
		rect(10, 24, 60, 3);
		fill(DS.primaire);
		rect(22, 28, 10, 10);
		rect(50, 52, 8, 8);
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
const TITRES_APPS = { patron: T('app.titre.patron'), carte: T('app.titre.carte'), community: T('app.titre.community'), journal: T('app.titre.journal'), corbeille: T('app.titre.corbeille') };

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
	const zone = { x: f.x + 24, y: f.y + 76, l: f.l - 48, h: f.h - 170 };
	if (!Jeu.paquet || ecran !== 'jeu') {
		dsTexte(t('app.aucunePartie'), zone.x, zone.y, 22, DS.blanc75, 'left', zone.l);
		dsBouton(zone.x, zone.y + 80, 340, 60, t('menu.menuPrincipal'), ouvrirMenuPrincipal); // prompt 36
	} else if (PC.fenetre === 'corbeille') appCorbeille(zone);
	else if (PC.fenetre === 'patron') appPatron(zone);
	else if (PC.fenetre === 'community') appCommunity(zone);
	else if (PC.fenetre === 'journal') appJournal(zone);
	else if (PC.fenetre === 'carte') appCarte(zone);
	dsBouton(f.x + f.l - 260, f.y + f.h - 80, 236, 56, t('commun.fermer'), fermerFenetreApp, 'contour');
}

function derniers(liste, n) {
	return liste.slice(Math.max(0, liste.length - n));
}

function appPatron(z) {
	if (Jeu.modificateurActif && Jeu.modificateurActif() === 'panne_messagerie') {
		// Prompt 23 : panne de la messagerie — les messages arriveront à la fin de la panne
		dsBadge(z.x + 80, z.y + 20, t('app.horsLigne'), 'erreur');
		dsTexte(t('app.panne', { s: Math.ceil((Jeu.modificateur.fin - millis()) / 1000) }), z.x, z.y + 60, 22, DS.blanc75, 'left', z.l - 40);
		return;
	}
	// Fil de bulles façon SMS (même esprit que l'intro du prompt 20), aux couleurs du design system
	let y = z.y;
	derniers(Jeu.messagesPatron, 9).forEach((m) => {
		textFont(DS.policeTexte);
		textSize(20);
		const lmax = z.l - 260;
		const lignes = Math.ceil(textWidth(m.texte) / (lmax - 32)) || 1;
		const h = 24 + lignes * 28;
		noStroke();
		fill(DS.blanc05);
		rect(z.x, y, Math.min(lmax, textWidth(m.texte) + 32), h);
		fill(DS.primaire);
		rect(z.x, y, 4, h);
		dsTexte(m.texte, z.x + 18, y + 12, 20, DS.blanc, 'left', lmax - 32);
		dsTexte(m.heure, z.x + z.l - 10, y + 12, 18, DS.blanc50, 'right');
		y += h + 12;
	});
	if (!Jeu.messagesPatron.length) dsTexte(t('app.pasMessage'), z.x, z.y, 20, DS.blanc50, 'left');
}

// ——— Prompt 28 : plaintes des Nantais (contenu : data/messages.json) ———
let focusReponse = 0; // réponse sélectionnée au clavier (Tab / Entrée, ou 1 / 2 / 3)
let retourPlainte = null; // { texte, bonne, jusqua } : résultat affiché quelques secondes après une réponse

function repondrePlainte(i) {
	const p = Jeu.plaintesEnAttente()[0];
	if (!p) return;
	const r = Jeu.repondrePlainte(p, i);
	if (!r) return;
	focusReponse = 0;
	const fx = Object.keys(r.effets)
		.map((k) => t('jauge.' + k) + ' ' + (r.effets[k] > 0 ? '+' : '') + r.effets[k])
		.join(' · ');
	const texte = t(r.bonne ? 'plainte.bonne' : 'plainte.mauvaise', { effets: fx || '0' });
	retourPlainte = { texte, bonne: r.bonne, jusqua: millis() + 5000 };
	annoncer(texte); // aria-live
	Confort.Son.bip(r.bonne ? 'action' : 'alerte');
}

/** Bloc « plainte en attente » : texte + réponses cliquables ; renvoie la hauteur occupée */
function blocPlainte(z) {
	const attente = Jeu.plaintesEnAttente();
	let y = z.y;
	if (retourPlainte && millis() < retourPlainte.jusqua) {
		dsBadge(z.x + 14, y + 12, retourPlainte.bonne ? '✓' : '!', retourPlainte.bonne ? 'succes' : 'alerte');
		dsTexte(retourPlainte.texte, z.x + 40, y, 20, DS.blanc, 'left', z.l - 40);
		y += 44;
	}
	if (!attente.length) return y - z.y;
	const p = attente[0];
	dsTexte(t('plainte.titre', { n: attente.length }), z.x, y, 20, DS.alerte, 'left');
	y += 36;
	noStroke();
	fill(DS.blanc05);
	rect(z.x, y, z.l, 84);
	fill(DS.alerte);
	rect(z.x, y, 4, 84);
	dsTexte(p.auteur + ' · ' + p.heure, z.x + 18, y + 10, 18, DS.blanc50, 'left');
	dsTexte(Jeu.texteMessage(p.def.texte, p.vars), z.x + 18, y + 38, 20, DS.blanc, 'left', z.l - 36);
	y += 96;
	if (focusReponse >= p.def.reponses.length) focusReponse = 0;
	p.def.reponses.forEach((r, i) => {
		const h = 64;
		const survol = mouseX >= z.x && mouseX <= z.x + z.l && mouseY >= y && mouseY <= y + h;
		const actif = survol || focusReponse === i;
		noStroke();
		fill(actif ? DS.blanc15 : DS.blanc05);
		rect(z.x, y, z.l, h);
		if (actif) {
			noFill();
			stroke(DS.blanc);
			strokeWeight(2);
			rect(z.x + 1, y + 1, z.l - 2, h - 2);
			noStroke();
		}
		dsTexte(String(i + 1), z.x + 16, y + 20, 22, DS.alerte, 'left');
		dsTexte(Jeu.texteMessage(r.texte, p.vars), z.x + 52, y + 8, 19, DS.blanc, 'left', z.l - 70);
		boutons.push({ x: z.x, y, l: z.l, h, action: () => repondrePlainte(i) });
		y += h + 8;
	});
	dsTexte(t('plainte.aide'), z.x, y + 2, 16, DS.blanc50, 'left');
	return y + 34 - z.y;
}

function appCommunity(z) {
	let y = z.y;
	dsTexte(t('app.reputation', { r: Jeu.jauges.reputation }), z.x, y, 20, DS.blanc75, 'left');
	const bp = Jeu.bilanPlaintes ? Jeu.bilanPlaintes() : null;
	if (bp && bp.total) dsTexte(t('plainte.compteur', { x: bp.traitees, y: bp.total }), z.x + z.l, y, 18, DS.blanc50, 'right');
	y += 44;
	const hp = blocPlainte({ x: z.x, y, l: z.l });
	y += hp ? hp + 16 : 0;
	const place = Math.max(1, Math.floor((z.y + z.h - y) / 88));
	derniers(Jeu.commentaires, Math.min(8, place))
		.reverse()
		.forEach((c) => {
			noStroke();
			fill(DS.blanc05);
			rect(z.x, y, z.l, 76);
			stroke(DS.blanc15);
			strokeWeight(2);
			noFill();
			rect(z.x + 1, y + 1, z.l - 2, 74);
			noStroke();
			dsTexte((c.suivi ? '↳ ' + t('suivi.reponse') + ' · ' : '') + c.auteur + ' · ' + c.heure, z.x + 16, y + 10, 18, c.suivi ? DS.alerte : DS.blanc50, 'left'); // prompt 63 : réaction à une de vos réponses
			dsTexte(c.texte, z.x + 16, y + 38, 20, DS.blanc, 'left', z.l - 160);
			dsBadge(z.x + z.l - 60, y + 38, t('app.rep', { d: (c.delta > 0 ? '+' : '') + c.delta }), c.delta > 0 ? 'succes' : 'erreur');
			y += 88;
		});
	if (!Jeu.commentaires.length) dsTexte(t('app.aucunCommentaire'), z.x, y, 20, DS.blanc50, 'left');
}

// Prompt 63 : journal par journée, avec une enquête après coup sur chaque incident (données réelles uniquement)
const JOURNAL = { jour: null, enquete: null, volet: 0 };
const VOLETS_ENQUETE = ['passe', 'contexte', 'decision', 'suites'];
function appJournal(z) {
	const jours = Jeu.jours || [];
	if (JOURNAL.jour === null || JOURNAL.jour > Jeu.jourIndex) JOURNAL.jour = Jeu.jourIndex;
	const j = jours[JOURNAL.jour];
	const entrees = (Jeu.evenementsJournee || []).filter((e) => j && e.jour === j.date);
	if (JOURNAL.enquete !== null && entrees[JOURNAL.enquete]) return enqueteJournal(z, entrees[JOURNAL.enquete], j);
	JOURNAL.enquete = null;
	let y = z.y;
	dsTitre(t('app.journee', { date: j ? j.date.split('-').reverse().join('/') : '' }), z.x, y, 24, DS.blanc, 'left');
	// Navigation entre les journées déjà jouées
	dsBouton(z.x + z.l - 400, y - 4, 190, 40, t('journal.veille'), () => ((JOURNAL.jour = Math.max(0, JOURNAL.jour - 1)), (JOURNAL.enquete = null)), 'contour', JOURNAL.jour <= 0);
	dsBouton(z.x + z.l - 200, y - 4, 200, 40, t('journal.lendemain'), () => ((JOURNAL.jour = Math.min(Jeu.jourIndex, JOURNAL.jour + 1)), (JOURNAL.enquete = null)), 'contour', JOURNAL.jour >= Jeu.jourIndex);
	y += 54;
	const lignes = entrees.map((e, i) => ({ t: Jeu.ligneMail(e), ok: Jeu.evaluer(e) === 'bon', i }));
	(Jeu.equipes || [])
		.filter((q) => j && q.jour === j.date)
		.forEach((q) => lignes.push({ t: T('app.equipeEnvoyee', { heure: q.heure, nom: q.nom, sujet: q.sujet, cout: q.cout, etat: q.arrivee_sim ? T('app.arrivee', { h: q.arrivee_sim }) : T('app.enRoute') }), ok: true, equipe: true }));
	if (!lignes.length) dsTexte(t('app.rien'), z.x, y, 20, DS.blanc50, 'left');
	lignes.forEach((l) => {
		noStroke();
		fill(l.equipe ? DS.info : l.ok ? DS.succes : DS.primaire);
		rect(z.x, y + 4, 6, 22);
		const lt = z.l - 30 - (l.equipe ? 0 : 210);
		dsTexte(l.t, z.x + 18, y, 19, DS.blanc, 'left', lt);
		if (!l.equipe) dsBouton(z.x + z.l - 190, y - 4, 190, 38, t('journal.enqueter'), () => ((JOURNAL.enquete = l.i), (JOURNAL.volet = 0), annoncer(t('journal.enquete'))), 'contour');
		textFont(DS.policeTexte);
		textSize(19);
		y += textWidth(l.t) > lt - 10 ? 62 : 46;
	});
}
function enqueteJournal(z, e, j) {
	const r = e.resultat;
	const d = r.dossier;
	const idx = Jeu.paquet.indexOf(d);
	let y = z.y;
	dsBouton(z.x, y - 4, 280, 40, t('journal.retour'), () => (JOURNAL.enquete = null), 'contour');
	dsTitre(t('journal.titreEnquete', { date: e.jour.split('-').reverse().join('/'), heure: e.heure || '—' }), z.x + 300, y, 24, DS.blanc, 'left');
	y += 50;
	dsTexte(String(e.externeCourt) + (e.ligne ? ' · ' + t('dossier.ligne', { lignes: e.ligne }) : ''), z.x, y, 20, DS.blanc75, 'left', z.l);
	y += 40;
	const lb = (z.l - 3 * 12) / 4;
	VOLETS_ENQUETE.forEach((v, i) => dsBouton(z.x + i * (lb + 12), y, lb, 44, t('journal.volet.' + v), () => (JOURNAL.volet = i), JOURNAL.volet === i ? 'primaire' : 'contour'));
	y += 64;
	const lignes = [];
	const v = VOLETS_ENQUETE[JOURNAL.volet];
	if (v === 'passe') {
		lignes.push(t('journal.type', { type: tSi('type.' + d.type, d.type) }));
		lignes.push(t('journal.nature', { nature: d.nature }));
		lignes.push(d.lignes && d.lignes.length ? t('dossier.ligne', { lignes: d.lignes.join(', ') }) : t('enq.carte.inconnue'));
		lignes.push(d.retard !== null && d.retard !== undefined ? t('dossier.retard', { retard: d.retard }) : t('dossier.retardInconnu'));
		lignes.push(t('dossier.citation', { texte: d.texte_source }));
		lignes.push(t('journal.source', { source: d.source, date: dateLongue(d.date) + (d.heure ? ' · ' + d.heure : '') }));
	} else if (v === 'contexte') {
		const m = Jeu.meteoDuJour(d.date);
		lignes.push(m ? t('journal.meteo', { min: nombreFr(m.temp_min), max: nombreFr(m.temp_max), pluie: nombreFr(m.pluie_mm), vent: nombreFr(m.rafales_max) }) : t('enq.meteo.inconnue'));
		const ctx = r.contexte || {};
		lignes.push(t(ctx.pointe ? 'journal.pointe.oui' : 'journal.pointe.non'));
		if (ctx.meteo) lignes.push(t('journal.meteoAggravante'));
		const ev = Jeu.evenementsAffluence ? Jeu.evenementsAffluence(d.date) : [];
		lignes.push(ev.length ? t('journal.agenda', { n: ev.length, liste: ev.slice(0, 2).map((x) => '« ' + String(x.texte_source).split(' — ')[0] + ' »').join(', ') }) : t('enq.agenda.rien', { date: dateLongue(d.date) }));
	} else if (v === 'decision') {
		lignes.push(t('journal.action', { action: e.action ? String(e.action) : t('journal.aucuneAction') }));
		lignes.push(t('journal.effets', { f: signe(e.deltas.fluidite), r: signe(e.deltas.reputation), b: signe(e.deltas.budget) }));
		if (r.des && r.des.some((x) => x)) lignes.push(t('journal.des', { des: r.des.filter((x) => x).join(', ') }));
		lignes.push(t('journal.evaluation', { eval: t('eval.' + Jeu.evaluer(e)) }));
		lignes.push(t('journal.meilleure', { action: String(e.meilleureAction) }));
		// Ce que chaque action aurait donné en moyenne dans ce contexte : c'est là que l'on apprend les effets (prompt 50)
		lignes.push(t('journal.attendus', { liste: ['devier', 'retenir', 'renfort'].map((a) => t('action.' + a) + ' ' + signe(Math.round(e.attendus[a]))).join(' · ') }));
	} else {
		const p = (Jeu.plaintes || []).find((x) => x.index === idx);
		if (p) {
			lignes.push(t('journal.plainte', { auteur: p.auteur, texte: Jeu.texteMessage(p.def.texte, p.vars) }));
			lignes.push(p.reponse === null ? t('journal.sansReponse') : t('journal.reponse', { texte: Jeu.texteMessage(p.def.reponses[p.reponse].texte, p.vars), qualite: t(p.bonne ? 'journal.bienRecue' : 'journal.malRecue') }));
			const sv = p.suivis || [];
			if (sv.length) lignes.push(t('journal.suivis', { recues: sv.filter((x) => x.livre).length, total: sv.length }));
		} else lignes.push(t('journal.aucunePlainte'));
		const eq = (Jeu.equipes || []).filter((q) => q.index === idx);
		lignes.push(eq.length ? t('journal.equipes', { liste: eq.map((q) => q.nom + (q.inutile ? ' (' + t('journal.inutile') + ')' : '')).join(', ') }) : t('journal.aucuneEquipe'));
	}
	lignes.forEach((l) => {
		dsTexte(l, z.x, y, 21, DS.blanc, 'left', z.l);
		textFont(DS.policeTexte);
		textSize(21);
		y += Math.ceil((textWidth(String(l)) * 1.05) / z.l) * 30 + 14;
	});
}
const signe = (v) => (v > 0 ? '+' + v : v < 0 ? '−' + Math.abs(v) : '0');

// ——— Carte : position d'une ligne = centre réel de son tracé (data/lignes.json) ———
const cacheCentres = new Map();
function centreLigne(nom) {
	if (cacheCentres.has(nom)) return cacheCentres.get(nom);
	const l = Jeu.lignes && Jeu.lignes.lignes.find((x) => x.nom === nom);
	let c = null;
	if (l) {
		let sx = 0;
		let sy = 0;
		let n = 0;
		l.traces.forEach((t) => t.forEach((p) => ((sx += p[0]), (sy += p[1]), n++)));
		c = [sx / n, sy / n];
	}
	cacheCentres.set(nom, c);
	return c;
}

function appCarte(z) {
	const carte = { x: z.x, y: z.y, l: 900, h: z.h };
	noStroke();
	fill('#121a22');
	rect(carte.x, carte.y, carte.l, carte.h);
	const pr = projeter(carte);
	if (Jeu.lignes) {
		noStroke();
		fill(56, 96, 255, 90); // eau (info du design system, atténuée)
		Jeu.lignes.eau.forEach((a) => {
			beginShape();
			a.forEach((p) => vertex(pr.x(p[0]), pr.y(p[1])));
			endShape(CLOSE);
		});
		noFill();
		stroke(255, 255, 255, 38);
		strokeWeight(1.5);
		Jeu.lignes.lignes.forEach((l) =>
			l.traces.forEach((t) => {
				beginShape();
				t.forEach((p) => vertex(pr.x(p[0]), pr.y(p[1])));
				endShape();
			}),
		);
		noStroke();
	}
	// Incident actif (un seul à la fois) et équipes en route
	const actif = typeof incidentActif === 'function' && incidentActif() ? Jeu.dossierCourant() : null;
	const pos = (d) => {
		const c = d && d.lignes && d.lignes.length ? centreLigne(d.lignes[0]) : null;
		return c ? { x: pr.x(c[0]), y: pr.y(c[1]), libre: false } : { x: carte.x + carte.l / 2, y: carte.y + carte.h / 2, libre: true };
	};
	(Jeu.equipes || []).forEach((q) => {
		const p = pos(Jeu.paquet[q.index]);
		fill(q.arrivee_sim ? DS.succes : DS.info);
		rect(p.x + 14, p.y - 8, 16, 16);
		const reste = Math.max(0, Math.ceil((q.arrivee - millis()) / 1000));
		if (!q.arrivee_sim) dsTexte(q.nom + ' · ' + reste + ' s', p.x + 34, p.y - 10, 16, DS.infoClair, 'left');
	});
	const panneauX = carte.x + carte.l + 24;
	const panneauL = z.l - carte.l - 24;
	if (actif) {
		const p = pos(actif);
		const k = typeof pulsationRouge === 'function' ? pulsationRouge() : 1;
		fill(212, 3, 28, 255 * k);
		rect(p.x - 10, p.y - 10, 20, 20);
		noFill();
		stroke(DS.primaire);
		strokeWeight(2);
		rect(p.x - 18, p.y - 18, 36, 36);
		noStroke();
		dsTexte(p.libre ? t('carte.lieuInconnu') : t('dossier.ligne', { lignes: actif.lignes.join(', ') }), p.x + 24, p.y + 14, 16, DS.blanc, 'left');
		// Panneau latéral : incident + équipes
		dsTitre(t('carte.incident'), panneauX, z.y, 24, DS.blanc, 'left');
		dsTexte((actif.lignes && actif.lignes.length ? t('dossier.ligne', { lignes: actif.lignes.join(', ') }) + ' · ' : '') + actif.nature + (actif.retard !== null && actif.retard !== undefined ? ' · +' + actif.retard + ' min' : ''), panneauX, z.y + 44, 19, DS.blanc75, 'left', panneauL);
		dsTexte(t('carte.budget', { b: Jeu.jauges.budget }), panneauX, z.y + 104, 19, DS.alerte, 'left');
		const dejaEnvoyee = Jeu.equipePour(Jeu.index);
		Object.keys(Jeu.EQUIPES).forEach((cle, i) => {
			const q = Jeu.EQUIPES[cle];
			const effets = Object.keys(q.effets).map((k2) => Jeu.LIBELLES_JAUGES[k2] + ' +' + q.effets[k2]).join(', ');
			const verrou = q.palier && Jeu.jauges.budget < q.palier;
			const desactive = !!dejaEnvoyee || Jeu.jauges.budget < q.cout || verrou;
			dsBouton(panneauX, z.y + 150 + i * 92, panneauL, 64, i + 1 + ' · ' + q.nom + ' (−' + q.cout + ')' + (verrou ? t('carte.palier', { p: q.palier }) : ''), () => envoyerEquipeCarte(cle), i === 0 ? 'primaire' : 'secondaire', desactive);
			dsTexte(effets, panneauX, z.y + 218 + i * 92, 15, DS.blanc50, 'left');
		});
		if (dejaEnvoyee) dsTexte(t('carte.deja', { nom: dejaEnvoyee.nom }), panneauX, z.y + 530, 18, DS.infoClair, 'left', panneauL);
	} else {
		dsTitre(t('carte.aucun'), panneauX, z.y, 24, DS.blanc, 'left');
		dsTexte(t('carte.explication'), panneauX, z.y + 44, 19, DS.blanc50, 'left', panneauL);
		// Dernier incident résolu : y envoyer une équipe est possible, mais inutile (malus, prompt 23 § 4)
		const dernier = Jeu.index > 0 ? Jeu.paquet[Jeu.index - 1] : null;
		if (dernier && !Jeu.equipePour(Jeu.index - 1)) {
			dsTexte(t('carte.dernier', { quoi: dernier.lignes && dernier.lignes.length ? t('carte.ligneMin', { lignes: dernier.lignes.join(', ') }) : dernier.nature }), panneauX, z.y + 130, 18, DS.blanc75, 'left', panneauL);
			Object.keys(Jeu.EQUIPES).forEach((cle, i) => {
				const q = Jeu.EQUIPES[cle];
				dsBouton(panneauX, z.y + 190 + i * 76, panneauL, 56, i + 1 + ' · ' + q.nom + ' (−' + q.cout + ')', () => envoyerEquipeCarte(cle, Jeu.index - 1), 'contour', Jeu.jauges.budget < q.cout || (q.palier && Jeu.jauges.budget < q.palier));
			});
		}
	}
	if (PC.message) dsTexte(PC.message, panneauX, z.y + z.h - 60, 18, PC.messageOk ? DS.succesClair : DS.erreurClair, 'left', panneauL);
}

function envoyerEquipeCarte(cle, index) {
	const actif = typeof incidentActif === 'function' && incidentActif();
	if (index === undefined) {
		if (!actif) return;
		index = Jeu.index;
	}
	const r = Jeu.envoyerEquipe(index, cle, millis());
	PC.message = r.message;
	PC.messageOk = r.ok;
	Confort.Son.bip(r.ok ? 'action' : 'alerte');
}

// =====================================================================
// Prompt 36 — Corbeille (plaintes traitées) et app flottante « Indicateurs »
// =====================================================================
function appCorbeille(z) {
	const liste = (Jeu.plaintes || []).filter((p) => p.reponse !== null && !p.masquee);
	dsTexte(t('app.corbeille.intro', { n: liste.length }), z.x, z.y, 20, DS.blanc75, 'left', z.l - 320);
	if (liste.length) dsBouton(z.x + z.l - 300, z.y - 8, 300, 52, t('app.corbeille.vider'), viderCorbeille, 'contour');
	let y = z.y + 64;
	if (!liste.length) dsTexte(t('app.corbeille.vide'), z.x, y, 20, DS.blanc50, 'left');
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
	return { l: 460, h: 392, pos, prise: null };
})();
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
		dsTexte(v + ' / 100', x + I.l - 18, ly, 20, DS.blanc, 'right');
		fill(DS.blanc15);
		rect(x + 18, ly + 32, I.l - 36, 14);
		fill(couleurJauge(v));
		rect(x + 18, ly + 32, ((I.l - 36) * v) / 100, 14);
		const d = dernier && dernier.deltas ? dernier.deltas[k] : null;
		if (d) dsTexte((d > 0 ? '▲ +' : '▼ ') + d, x + I.l - 132, ly, 16, d > 0 ? DS.succes : DS.alerte, 'right');
	});
	const o = Jeu.objectifDuJour ? Jeu.objectifDuJour() : null;
	if (o) dsTexte(t('indic.objectif', { libelle: o.libelle, ok: Jeu.jauges[o.jauge] >= o.seuil ? '✓' : '✗' }), x + 18, y + 284, 16, DS.blanc75, 'left', I.l - 36);
	const b = Jeu.jauges.budget;
	dsTexte(t(b < 20 ? 'indic.budgetBas' : b >= 70 ? 'indic.budgetHaut' : 'indic.budgetMoyen'), x + 18, y + 336, 16, DS.blanc50, 'left', I.l - 36);
}
