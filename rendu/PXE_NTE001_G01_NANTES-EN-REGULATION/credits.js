/* Nantes en régulation — prompt 113 : écran « Crédits » du menu principal (MENU.ecran = 'credits').
 * L'équipe (portraits fournis par le groupe, ./assets/credits/), la licence (d'après LICENSE et audio/CREDITS.md)
 * et l'usage de l'IA (d'après l'historique du dépôt). Dessiné par le code avec le Pixel DS ; aucun fait inventé :
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
];

function portraitCredits(p, x, y, c) {
	noStroke();
	fill(DS.primaire);
	rect(x, y, c, c); // fond rouge du portrait, aussi tant que l'image charge
	const img = imageCredits(p.image);
	if (img) {
		drawingContext.imageSmoothingEnabled = false; // rendu pixel conservé
		drawingContext.drawImage(img, x, y, c, c);
		drawingContext.imageSmoothingEnabled = true;
	}
	stroke(DS.blanc15);
	strokeWeight(2);
	noFill();
	rect(x + 1, y + 1, c - 2, c - 2);
	noStroke();
	textFont(DS.policeTexte);
	textStyle(BOLD);
	dsTexte(p.nom, x + c / 2, y + c + 18, 24, DS.blanc, 'center');
	textStyle(NORMAL);
}
function sectionCredits(titre, corps, x, y, l) {
	noStroke();
	fill(DS.primaire);
	rect(x, y + 4, 6, 26);
	textFont(DS.policeTexte);
	textStyle(BOLD);
	dsTexte(titre, x + 20, y, 26, DS.blanc, 'left');
	textStyle(NORMAL);
	return y + 46 + dessinerTexte(corps, x, y + 46, l, { taille: 20, couleur: DS.blanc75, interligne: 30 }).h;
}
function dessinerCredits() {
	const portrait = L < H;
	const k = reduireAnimations ? 1 : easeOut(constrain((millis() - MENU.debut) / 400, 0, 1));
	const x0 = (portrait ? 60 : 160) - (1 - k) * 30;
	noStroke();
	fill('rgba(13,12,12,0.6)');
	rect(0, 0, L, H);
	dsTitre(t('credits.titre'), x0, portrait ? 60 : 90, portrait ? 60 : 72, DS.blanc, 'left');
	// 1. L'équipe
	const c = portrait ? 300 : 280;
	const yE = portrait ? 180 : 220;
	EQUIPE.forEach((p, i) => portraitCredits(p, x0 + i * (c + 40), yE, c));
	textFont(POLICE_DONNEES);
	textSize(20);
	fill(DS.blanc75);
	textAlign(LEFT, TOP);
	text(t('credits.atelier'), x0, yE + c + 70, 2 * c + 40, 60);
	// 2. Licence, 3. Usage de l'IA
	const xD = portrait ? x0 : x0 + 2 * c + 120;
	const lD = portrait ? L - 2 * x0 : L - xD - 120;
	let y = portrait ? yE + c + 150 : 220;
	y = sectionCredits(t('credits.licence.titre'), t('credits.licence.texte'), xD, y, lD) + 32;
	sectionCredits(t('credits.ia.titre'), t('credits.ia.texte'), xD, y, lD);
	// Liens et retour
	const lb = portrait ? (L - 2 * x0 - 3 * 16) / 4 : 300;
	const yb = H - (portrait ? 140 : 130);
	LIENS_CREDITS.forEach((b, i) => {
		const bx = portrait ? x0 + i * (lb + 16) : i === 3 ? L - 120 - lb : x0 + i * (lb + 16);
		dsBouton(bx, yb, lb, 64, t('credits.' + b.cle), b.action, i === 3 ? 'secondaire' : 'contour');
		if (CREDITS.choix === i) {
			noFill();
			stroke(MENU_C.bleu);
			strokeWeight(4);
			rect(bx - 8, yb - 8, lb + 16, 80);
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
