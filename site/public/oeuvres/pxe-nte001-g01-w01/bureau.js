/* Nantes en régulation — le bureau en pixel art (vue d'entrée du jeu).
 * Le joueur arrive dans un bureau de régulation ; sur la table, légèrement à droite, un PC dont l'écran
 * affiche EN DIRECT le jeu (salle de contrôle), en miniature pixelisée. Cliquer sur l'écran (ou Entrée)
 * zoome dans l'écran : on « s'installe au poste ». Échap : on se lève et on revient au bureau.
 *
 * Technique : le bureau est dessiné dans une petite image de 480×270 (1 pixel = 4 pixels à l'écran),
 * agrandie sans lissage → rendu pixel art net. L'écran du PC occupe exactement 1/4 de 1920×1080,
 * aux coordonnées ECRAN_PC ci-dessous. Aucun fichier image : tout est dessiné par le code.
 */

const PIX = 4; // taille d'un « pixel » du décor
const BW = L / PIX; // 480
const BH = H / PIX; // 270
// Écran du PC en coordonnées pixel art (120×68 ≈ 16:9), soit 480×272 à l'écran ; centre à x ≈ 1168 (> 960 : à droite)
const ECRAN_PC = { x: 232, y: 82, l: 120, h: 68 };

let vue = 'bureau'; // 'bureau' | 'zoom-avant' | 'poste' | 'zoom-arriere'
let debutZoom = 0;
const DUREE_ZOOM = 700;
let gBureau = null; // image pixel art du bureau (480×270)
let copieBasse = null; // miniature du jeu pour l'écran du PC (240×135, puis agrandie : effet pixel)
let copieHaute = null; // copie pleine résolution pour le zoom
let survolEcran = false;

const P = {
	// Palette du décor (chaude, bureau administratif ; distincte de la palette de l'interface)
	murHaut: '#d9cfb8',
	murBas: '#c9bd9f',
	plinthe: '#7a6a52',
	sol: '#6b5a48',
	solJoint: '#5e4f3f',
	bois: '#9a6b43',
	boisClair: '#b5814f',
	boisSombre: '#6e4a2c',
	metal: '#3c4450',
	metalClair: '#59626e',
	plastique: '#d8d3c4',
	plastiqueOmbre: '#b7b1a1',
	papier: '#f4efe2',
	papierOmbre: '#d9d2bf',
	chemise: '#c9a45c',
	tampon: '#b3261e',
	plante: '#3f7a4a',
	planteClair: '#5c9a5f',
	pot: '#a0522d',
	noir: '#1c2733',
	panneau: '#0e3b46',
	liege: '#b98c5a',
};

function setupBureau() {
	gBureau = createGraphics(BW, BH);
	gBureau.pixelDensity(1);
	gBureau.noSmooth();
	copieBasse = document.createElement('canvas');
	copieBasse.width = 240;
	copieBasse.height = 135;
	copieHaute = document.createElement('canvas');
	copieHaute.width = L;
	copieHaute.height = H;
}

// ——— Dessin du bureau (pixel art) ———
function px(g, c, x, y, l, h) {
	g.fill(c);
	g.rect(Math.round(x), Math.round(y), Math.round(l), Math.round(h));
}

function dessinerPieceBureau() {
	const g = gBureau;
	g.noStroke();
	// Mur (deux tons) et plinthe
	px(g, P.murHaut, 0, 0, BW, 120);
	px(g, P.murBas, 0, 120, BW, 60);
	for (let x = 0; x < BW; x += 16) px(g, '#cfc4a9', x, 120, 1, 60); // lambris
	px(g, P.plinthe, 0, 178, BW, 4);
	// Sol en lattes
	px(g, P.sol, 0, 182, BW, BH - 182);
	for (let y = 186; y < BH; y += 6) px(g, P.solJoint, 0, y, BW, 1);

	dessinerFenetre(g);
	dessinerHorloge(g);
	dessinerPanneauMural(g);
	dessinerTableauLiege(g);
	dessinerPlante(g, 430, 132);

	// Bureau (plateau + façade)
	px(g, P.boisSombre, 20, 156, 440, 4); // ombre du plateau
	px(g, P.boisClair, 16, 150, 448, 8); // plateau
	px(g, P.bois, 16, 158, 448, 3);
	px(g, P.bois, 24, 161, 12, 109); // pied gauche
	px(g, P.bois, 444, 161, 12, 109); // pied droit
	px(g, P.boisSombre, 300, 161, 140, 60); // caisson de tiroirs
	for (let i = 0; i < 3; i++) {
		px(g, P.bois, 304, 165 + i * 19, 132, 15);
		px(g, P.boisClair, 360, 171 + i * 19, 20, 2); // poignée
	}

	dessinerPC(g);
	dessinerObjets(g);
}

function dessinerFenetre(g) {
	// Fenêtre : le ciel suit l'heure locale et la météo réelle du jour (Open-Meteo), si disponible
	const x = 30;
	const y = 22;
	const l = 120;
	const h = 80;
	px(g, P.plinthe, x - 4, y - 4, l + 8, h + 8);
	const heure = new Date().getHours();
	const nuit = heure < 7 || heure >= 20;
	const m = Jeu.meteoActuelle;
	const pluie = m && m.pluie_mm >= 1;
	const ciel = nuit ? '#1f2a44' : pluie ? '#8d99a6' : '#9fc7e3';
	px(g, ciel, x, y, l, h);
	// Silhouette de ville (formes génériques, pas de monument)
	const toits = [14, 22, 10, 30, 18, 26, 12, 34, 20, 16, 24, 12];
	toits.forEach((t, i) => {
		px(g, nuit ? '#141b2d' : '#6f7b88', x + i * 10, y + h - t, 10, t);
		if (nuit && i % 2 === 0) px(g, '#e8c46a', x + i * 10 + 3, y + h - t + 4, 2, 2); // fenêtres allumées
	});
	if (!nuit && !pluie) {
		px(g, '#f2c94c', x + 92, y + 10, 12, 12); // soleil
		px(g, '#f5d978', x + 94, y + 12, 8, 8);
	}
	if (nuit) px(g, '#e9e4cf', x + 96, y + 10, 8, 8); // lune
	if (pluie) {
		g.fill('#c9d2db');
		for (let i = 0; i < 30; i++) g.rect(x + ((i * 37) % l), y + ((i * 23 + Math.floor(millis() / 60)) % (h - 4)), 1, 3);
	}
	// Croisillons
	px(g, P.papier, x + l / 2 - 1, y, 2, h);
	px(g, P.papier, x, y + h / 2 - 1, l, 2);
	px(g, P.plinthe, x - 6, y + h + 4, l + 12, 4); // rebord
}

function dessinerHorloge(g) {
	const cx = 196;
	const cy = 40;
	px(g, P.metal, cx - 13, cy - 13, 26, 26);
	px(g, P.papier, cx - 11, cy - 11, 22, 22);
	for (let i = 0; i < 12; i++) {
		const a = (i / 12) * Math.PI * 2;
		px(g, P.noir, cx + Math.round(Math.sin(a) * 9), cy - Math.round(Math.cos(a) * 9), 1, 1);
	}
	// Heure réelle
	const d = new Date();
	const aiguille = (frac, long) => {
		const a = frac * Math.PI * 2;
		for (let r = 0; r <= long; r++) px(g, P.noir, cx + Math.round(Math.sin(a) * r), cy - Math.round(Math.cos(a) * r), 1, 1);
	};
	aiguille(((d.getHours() % 12) + d.getMinutes() / 60) / 12, 5);
	aiguille(d.getMinutes() / 60, 8);
}

function dessinerPanneauMural(g) {
	// Plaque « RÉGULATION » : texte en pixels 3×5 dessiné à la main
	const x = 238;
	const y = 18;
	px(g, P.panneau, x, y, 112, 20);
	px(g, '#174f5c', x + 2, y + 2, 108, 16);
	textePixel(g, 'REGULATION', x + 22, y + 8, '#f4efe2');
	px(g, '#f4efe2', x + 22 + 4 + 1, y + 6, 2, 1); // accent du « É »
}

// Police pixel 3×5 (lettres utiles uniquement)
const GLYPHES = {
	R: '110101110101101', E: '111100110100111', G: '111100101101111', U: '101101101101111', L: '100100100100111',
	A: '010101111101101', T: '111010010010010', I: '111010010010111', O: '111101101101111', N: '101111111111101',
	S: '111100111001111', C: '111100100100111', D: '110101101101110', P: '111101111100100', ' ': '000000000000000',
	0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001',
	5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111',
};
function textePixel(g, txt, x, y, c) {
	g.fill(c);
	let cx = x;
	for (const ch of txt) {
		const m = GLYPHES[ch] || GLYPHES[' '];
		for (let i = 0; i < 15; i++) if (m[i] === '1') g.rect(cx + (i % 3), y + Math.floor(i / 3), 1, 1);
		cx += 4;
	}
}

function dessinerTableauLiege(g) {
	const x = 372;
	const y = 30;
	px(g, P.boisSombre, x - 2, y - 2, 64, 54);
	px(g, P.liege, x, y, 60, 50);
	// Notes épinglées (lignes de texte simulées) et un plan schématique
	const notes = [
		[x + 4, y + 4, 18, 16, '#f6e7a1'],
		[x + 26, y + 6, 14, 12, P.papier],
		[x + 44, y + 4, 12, 18, '#cfe3ef'],
		[x + 8, y + 26, 22, 18, P.papier],
		[x + 36, y + 28, 18, 16, '#f2c6c1'],
	];
	notes.forEach(([nx, ny, nl, nh, c]) => {
		px(g, c, nx, ny, nl, nh);
		px(g, P.tampon, nx + Math.floor(nl / 2) - 1, ny - 1, 2, 2); // punaise
		for (let ly = ny + 4; ly < ny + nh - 2; ly += 3) px(g, '#9a937f', nx + 2, ly, nl - 4, 1);
	});
}

function dessinerPlante(g, x, y) {
	px(g, P.pot, x, y + 10, 16, 14);
	px(g, '#8a4424', x, y + 22, 16, 2);
	const feuilles = [[6, -12, 4, 22], [0, -6, 4, 14], [11, -8, 4, 16], [-3, 0, 6, 4], [13, -2, 6, 4], [3, -16, 3, 6]];
	feuilles.forEach(([fx, fy, fl, fh], i) => px(g, i % 2 ? P.planteClair : P.plante, x + fx, y + fy, fl, fh));
}

function dessinerPC(g) {
	const e = ECRAN_PC;
	// Ombre sur le plateau, pied, colonne
	px(g, P.boisSombre, e.x + 34, 155, 60, 2);
	px(g, P.plastiqueOmbre, e.x + 40, 146, 44, 6); // socle
	px(g, P.plastique, e.x + 52, 140, 20, 8); // colonne
	// Coque du moniteur (bordure de 6 px autour de l'écran)
	px(g, P.plastiqueOmbre, e.x - 7, e.y - 7, e.l + 14, e.h + 15);
	px(g, P.plastique, e.x - 6, e.y - 6, e.l + 12, e.h + 12);
	px(g, '#111418', e.x - 1, e.y - 1, e.l + 2, e.h + 2);
	// Voyant d'alimentation
	px(g, '#1e7a3c', e.x + e.l + 1, e.y + e.h + 2, 2, 2);
	// Clavier et souris
	px(g, P.plastiqueOmbre, e.x + 18, 160, 84, 10);
	px(g, P.plastique, e.x + 18, 159, 84, 9);
	for (let r = 0; r < 3; r++) for (let k = 0; k < 13; k++) px(g, P.plastiqueOmbre, e.x + 21 + k * 6, 161 + r * 2, 4, 1);
	px(g, P.plastique, e.x + 112, 160, 7, 9);
	px(g, P.plastiqueOmbre, e.x + 115, 160, 1, 3);
	px(g, P.metal, e.x + 115, 150, 1, 10); // câble
}

function dessinerObjets(g) {
	// Pile de dossiers à traiter (à gauche) avec tampon : clin d'œil « bureau administratif »
	for (let i = 0; i < 5; i++) {
		px(g, i % 2 ? P.chemise : '#b8924d', 60 + (i % 2), 140 - i * 3, 64, 4);
	}
	px(g, P.papier, 66, 128, 52, 3);
	px(g, P.tampon, 132, 140, 10, 6); // tampon encreur
	px(g, P.metal, 135, 134, 4, 6);
	// Feuille posée avec quelques lignes
	px(g, P.papierOmbre, 150, 147, 36, 4);
	px(g, P.papier, 150, 146, 36, 3);
	// Lampe de bureau (gauche)
	px(g, P.metal, 30, 146, 18, 4);
	px(g, P.metal, 37, 116, 3, 30);
	px(g, P.metal, 38, 112, 18, 3);
	px(g, '#2f6f62', 50, 108, 14, 9);
	px(g, '#f5d978', 52, 117, 10, 2);
	// Tasse de café (droite du PC)
	px(g, P.papier, 392, 138, 12, 12);
	px(g, P.papierOmbre, 404, 141, 3, 6);
	px(g, '#5a3b26', 393, 139, 10, 2);
	// Téléphone fixe
	px(g, P.metal, 412, 140, 30, 10);
	px(g, P.metalClair, 414, 136, 26, 5);
	px(g, '#b3261e', 430, 143, 3, 3); // voyant (message)
}

// ——— Miniature du jeu dans l'écran du PC ———
function capturerJeu(haute) {
	const ctx = copieBasse.getContext('2d');
	ctx.imageSmoothingEnabled = true;
	ctx.drawImage(drawingContext.canvas, 0, 0, copieBasse.width, copieBasse.height);
	if (haute) copieHaute.getContext('2d').drawImage(drawingContext.canvas, 0, 0);
}

function rectEcranPC() {
	return { x: ECRAN_PC.x * PIX, y: ECRAN_PC.y * PIX, l: ECRAN_PC.l * PIX, h: ECRAN_PC.h * PIX };
}

/** Dessine la vue « bureau » (ou une transition) par-dessus le jeu déjà dessiné sur le canevas. */
function dessinerVueBureau() {
	const zoom = vue === 'zoom-avant' || vue === 'zoom-arriere';
	capturerJeu(zoom);
	boutons = []; // le jeu n'est pas cliquable depuis le bureau

	dessinerPieceBureau();
	drawingContext.imageSmoothingEnabled = false;
	image(gBureau, 0, 0, L, H);

	const e = rectEcranPC();
	let t = zoom ? constrain((millis() - debutZoom) / DUREE_ZOOM, 0, 1) : 0;
	if (reduireAnimations) t = 1;
	const k = vue === 'zoom-avant' ? easeOut(t) : 1 - easeOut(t);

	if (zoom) {
		// Le bureau grossit autour de l'écran pendant que l'écran remplit le cadre
		const r = { x: lerp(e.x, 0, k), y: lerp(e.y, 0, k), l: lerp(e.l, L, k), h: lerp(e.h, H, k) };
		const echelle = r.l / e.l;
		push();
		translate(r.x - e.x * echelle, r.y - e.y * echelle);
		scale(echelle);
		image(gBureau, 0, 0, L, H);
		pop();
		drawingContext.imageSmoothingEnabled = true;
		drawingContext.drawImage(copieHaute, r.x, r.y, r.l, r.h);
		if (t >= 1) {
			if (vue === 'zoom-avant') vue = 'poste';
			else vue = 'bureau';
		}
	} else {
		drawingContext.drawImage(copieBasse, e.x, e.y, e.l, e.h); // pixelisé (pas de lissage)
		// Reflet léger sur la vitre
		noStroke();
		fill(255, 255, 255, 18);
		quad(e.x, e.y, e.x + e.l * 0.35, e.y, e.x + e.l * 0.15, e.y + e.h, e.x, e.y + e.h);
		survolEcran = mouseX >= e.x && mouseX <= e.x + e.l && mouseY >= e.y && mouseY <= e.y + e.h;
		if (survolEcran) {
			noFill();
			stroke('#f2c94c');
			strokeWeight(PIX);
			rect(e.x - 8 * PIX, e.y - 8 * PIX, e.l + 16 * PIX, e.h + 17 * PIX);
			noStroke();
		}
		boutons.push({ x: e.x, y: e.y, l: e.l, h: e.h, action: sAsseoir });
		// Invitation (texte d'interface, sur bandeau, lisible)
		const msg = 'Cliquez sur l’écran ou appuyez sur Entrée pour vous installer au poste';
		textFont(POLICE_DONNEES);
		textSize(22);
		const lm = textWidth(msg) + 40;
		fill(28, 39, 51, 220);
		rect((L - lm) / 2, H - 92, lm, 52, 8);
		fill('#FFFDF7');
		textAlign(CENTER, CENTER);
		text(msg, L / 2, H - 66);
	}
	drawingContext.imageSmoothingEnabled = true;
}

/** Cadre du moniteur autour du jeu quand on est installé au poste (dans les marges de 40 px). */
function dessinerCadrePoste() {
	noFill();
	stroke(P.plastique);
	strokeWeight(16);
	rect(8, 8, L - 16, H - 16, 6);
	stroke(P.plastiqueOmbre);
	strokeWeight(2);
	rect(17, 17, L - 34, H - 34, 4);
	noStroke();
	// Indication discrète pour se lever
	textFont(POLICE_DONNEES);
	textSize(14);
	fill(P.metal);
	textAlign(RIGHT, CENTER);
	text('Échap : se lever', L - 28, H - 8);
}

function sAsseoir() {
	if (vue !== 'bureau') return;
	vue = 'zoom-avant';
	debutZoom = millis();
	Confort.Son.demarrer();
	Confort.Son.bip('choix');
}

function seLever() {
	if (vue !== 'poste') return;
	vue = 'zoom-arriere';
	debutZoom = millis();
	Confort.Son.bip('choix');
}
