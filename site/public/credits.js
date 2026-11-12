/* Nantes en régulation — prompt 113 : écran « Crédits » du menu principal (MENU.ecran = 'credits').
 * L'équipe (portraits fournis par le groupe, ./assets/credits/), la licence (d'après LICENSE et audio/CREDITS.md)
 * et l'usage de l'IA (d'après l'historique du dépôt). Dessiné par le code avec le Pixel DS (prompt 120 : fenêtres et
 * lignes libellé / valeur) ; aucun fait inventé :
 * ce que le dépôt ne dit pas reste « [À COMPLÉTER] ». Échap / « Retour » ramènent au menu.
 */
const CREDITS = { choix: 0, images: {} };
const EQUIPE = [
	{ nom: 'Mattéo Brevet', image: './assets/credits/matteo-pp.webp' },
	{ nom: 'Guillaume Renoult', image: './assets/credits/guillaume-pp.webp' },
];
/** Images chargées à la première ouverture (chemins relatifs : en ligne, hors ligne et depuis rendu/) */
function imageCredits(src) {
	if (!CREDITS.images[src]) {
		const img = new Image();
		img.src = src;
		CREDITS.images[src] = img;
	}
	const img = CREDITS.images[src];
	return img.complete && img.naturalWidth ? img : null;
}
function ouvrirCredits() {
	EQUIPE.forEach((p) => imageCredits(p.image));
	MENU.ecran = 'credits';
	MENU.debut = millis();
	CREDITS.choix = 0;
	annoncer(t('credits.titre') + '. ' + EQUIPE.map((p) => p.nom).join(', ') + '. ' + t('credits.atelier'));
	Confort.Son.bip('choix');
}
function fermerCredits() {
	MENU.ecran = 'titre';
	MENU.debut = millis();
}
/** Liens focalisables, dans l'ordre de Tab */
const LIENS_CREDITS = [
	{ cle: 'licence', action: () => ouvrirLien(LICENCE_URL) },
	{ cle: 'makingof', action: () => ouvrirLien(URL_JEU + 'making-of/') },
	{ cle: 'depot', action: () => ouvrirLien(DEPOT_URL) },
	{ cle: 'retour', action: fermerCredits },
].filter((b) => b.cle === 'retour' || typeof EXPO === 'undefined' || !EXPO.actif); // prompt 160 : en exposition, seul « Retour »

// ——— Prompt 120 : fenêtres du Pixel DS (comme la diapositive « L'équipe ») et lignes libellé / valeur ———
const LIGNES_LICENCE = ['code', 'donnees', 'lieux', 'biblio', 'icones', 'musiques']; // prompt 170 : icônes Lucide
const LIGNES_IA = ['outils', 'methode', 'donnees', 'visuels', 'humain'];
const BARRE_FEN = 40;
/** Fenêtre du DS : fond, bordure blanc 15 %, barre de titre en capitales et deux carrés pixel */
function fenetreCredits(x, y, l, h, titre) {
	noStroke();
	fill(DS.fond);
	rect(x, y, l, h);
	fill(DS.blanc05);
	rect(x, y, l, BARRE_FEN);
	stroke(DS.blanc15);
	strokeWeight(2);
	noFill();
	rect(x + 1, y + 1, l - 2, h - 2);
	line(x + 2, y + BARRE_FEN, x + l - 2, y + BARRE_FEN);
	noStroke();
	textFont(DS.policeTexte);
	textStyle(BOLD);
	textSize(16);
	textAlign(LEFT, CENTER);
	fill(DS.blanc);
	text(String(titre).toUpperCase().split('').join(String.fromCharCode(8202)), x + 16, y + BARRE_FEN / 2); // espacement des capitales
	textStyle(NORMAL);
	fill(DS.blanc15);
	rect(x + l - 40, y + 16, 9, 9);
	fill(DS.primaire);
	rect(x + l - 26, y + 16, 9, 9);
	zoneTexteDeclarer('fenetreCredits', x, y, l, h);
}
/** Découpe en lignes (mots entiers) à la taille courante */
function lignesCredits(txt, l) {
	const out = [];
	let ligne = '';
	String(txt)
		.split(' ')
		.forEach((m) => {
			const essai = ligne ? ligne + ' ' + m : m;
			if (ligne && textWidth(essai) > l) out.push(ligne), (ligne = m);
			else ligne = essai;
		});
	if (ligne) out.push(ligne);
	return out;
}
/** Hauteur (ou dessin si dessine) d'une fenêtre de lignes libellé / valeur, à la taille t */
function blocLignesCredits(x, y, l, titre, prefixe, cles, taille, dessine) {
	const lab = Math.round(taille * 10);
	const inter = Math.round(taille * 1.45);
	textFont(DS.policeTexte);
	textSize(taille);
	const lignes = cles.map((k) => lignesCredits(t(prefixe + k + '.v'), l - 48 - lab));
	const hRangs = lignes.map((ls) => ls.length * inter + 16);
	const h = BARRE_FEN + 12 + hRangs.reduce((a, b) => a + b, 0) + 12;
	if (!dessine) return h;
	fenetreCredits(x, y, l, h, titre);
	let yr = y + BARRE_FEN + 12;
	cles.forEach((k, i) => {
		if (i) {
			stroke(DS.blanc15);
			strokeWeight(1);
			line(x + 24, yr, x + l - 24, yr);
			noStroke();
		}
		textFont(DS.policeTexte);
		textStyle(BOLD);
		textSize(Math.max(14, taille - 4));
		textAlign(LEFT, TOP);
		fill(DS.alerte);
		text(t(prefixe + k).toUpperCase(), x + 24, yr + 10);
		textStyle(NORMAL);
		textSize(taille);
		fill(DS.blanc75);
		lignes[i].forEach((ln, j) => text(ln, x + 24 + lab, yr + 8 + j * inter));
		yr += hRangs[i];
	});
	return h;
}
function portraitCredits(p, x, y, c) {
	const hNom = 56;
	fenetreCredits(x, y, c, BARRE_FEN + c + hNom, t('credits.portrait'));
	const yi = y + BARRE_FEN;
	noStroke();
	fill(DS.primaire);
	rect(x + 2, yi, c - 4, c); // fond rouge du portrait, aussi tant que l'image charge
	const img = imageCredits(p.image);
	if (img) {
		drawingContext.imageSmoothingEnabled = false; // rendu pixel conservé
		drawingContext.drawImage(img, x + 2, yi, c - 4, c);
		drawingContext.imageSmoothingEnabled = true;
	}
	stroke(DS.blanc15);
	strokeWeight(2);
	line(x + 2, yi + c, x + c - 2, yi + c);
	noStroke();
	textFont(DS.policeTexte);
	textStyle(BOLD);
	ajusterTaille(p.nom, c - 24, 24, 16);
	textAlign(CENTER, CENTER);
	fill(DS.blanc);
	text(p.nom, x + c / 2, yi + c + hNom / 2);
	textStyle(NORMAL);
}
function dessinerCredits() {
	const k = reduireAnimations ? 1 : easeOut(constrain((millis() - MENU.debut) / 400, 0, 1));
	const dy = (1 - k) * 24;
	const x0 = 160;
	noStroke();
	fill('rgba(13,12,12,0.72)');
	rect(0, 0, L, H);
	dsTitre(t('credits.titre'), x0, 80 + dy, 72, DS.blanc, 'left');
	textFont(POLICE_DONNEES);
	textSize(20);
	fill(DS.blanc75);
	textAlign(LEFT, TOP);
	text(t('credits.atelier'), x0, 176 + dy);
	// 1. L'équipe : deux fenêtres « Portrait »
	const c = 280;
	const yE = 236 + dy;
	EQUIPE.forEach((p, i) => portraitCredits(p, x0 + i * (c + 32), yE, c));
	// 2. Licence et 3. IA : fenêtres de lignes, taille ajustée pour tenir au-dessus des boutons (jamais coupées)
	const xD = x0 + 2 * c + 32 + 64;
	const lD = L - 120 - xD;
	const yb = H - 130;
	let taille = 19;
	const hTotal = (tl) => blocLignesCredits(xD, 0, lD, '', 'credits.lic.', LIGNES_LICENCE, tl, false) + 24 + blocLignesCredits(xD, 0, lD, '', 'credits.ia.', LIGNES_IA, tl, false);
	while (taille > 15 && yE + hTotal(taille) > yb - 32) taille--;
	const h1 = blocLignesCredits(xD, yE, lD, t('credits.licence.titre'), 'credits.lic.', LIGNES_LICENCE, taille, true);
	blocLignesCredits(xD, yE + h1 + 24, lD, t('credits.ia.titre'), 'credits.ia.', LIGNES_IA, taille, true);
	// Liens et retour (focus : double bordure du DS)
	const lb = 300;
	LIENS_CREDITS.forEach((b, i) => {
		const retour = b.cle === 'retour';
		const bx = retour ? L - 120 - lb : x0 + i * (lb + 16);
		dsBouton(bx, yb, lb, 64, t('credits.' + b.cle), b.action, retour ? 'secondaire' : 'contour');
		if (CREDITS.choix === i) {
			noFill();
			stroke(DS.blanc);
			strokeWeight(2);
			rect(bx - 6, yb - 6, lb + 12, 76);
			stroke(DS.fond);
			rect(bx - 3, yb - 3, lb + 6, 70);
			noStroke();
		}
	});
	textFont(POLICE_DONNEES);
	textSize(18);
	fill(DS.blanc75);
	textAlign(LEFT, TOP);
	text(t('credits.clavier'), x0, H - 50);
}
function toucheCredits() {
	const n = LIENS_CREDITS.length;
	if (keyCode === ESCAPE || keyCode === BACKSPACE) return fermerCredits(), true;
	if (keyCode === UP_ARROW || keyCode === LEFT_ARROW || (keyCode === TAB && keyIsDown(SHIFT))) CREDITS.choix = (CREDITS.choix + n - 1) % n;
	else if (keyCode === DOWN_ARROW || keyCode === RIGHT_ARROW || keyCode === TAB) CREDITS.choix = (CREDITS.choix + 1) % n;
	else if (keyCode === ENTER || keyCode === RETURN || key === ' ') LIENS_CREDITS[CREDITS.choix].action();
	if ([UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW, TAB].includes(keyCode)) annoncer(t('credits.' + LIENS_CREDITS[CREDITS.choix].cle));
	return true;
}
