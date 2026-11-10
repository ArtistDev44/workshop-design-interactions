/* Nantes en régulation — le bureau en pixel art (vue d'entrée du jeu).
 * Le joueur arrive dans un bureau de régulation ; sur la table, légèrement à droite, un PC dont l'écran
 * affiche EN DIRECT le jeu (salle de contrôle), en miniature pixelisée. Cliquer sur l'écran (ou Entrée)
 * zoome dans l'écran : on « s'installe au poste ». Échap : on se lève et on revient au bureau.
 *
 * Style (référence fournie par le groupe, 10/11/2026) : pixel art riche — contours sombres, ombrages en
 * 3–4 tons, textures (veinage du bois, liège, feuillages), lumière chaude, ombres tramées. Cadrage serré :
 * le plateau remplit le bas de l'image et le PC est grand.
 *
 * Technique : décor dessiné dans une image de 480×270 (1 pixel = 4 pixels à l'écran), agrandie sans lissage.
 * Aucun fichier image : tout est dessiné par le code, de façon déterministe (pas d'aléatoire à chaque image).
 */

const PIX = 4; // taille d'un « pixel » du décor
const BW = L / PIX; // 480
const BH = H / PIX; // 270
// Écran du PC en coordonnées pixel art (144×81 = 16:9), soit 576×324 à l'écran ; centre x ≈ 1112 (> 960 : à droite)
const ECRAN_PC = { x: 206, y: 66, l: 144, h: 81 };

let vue = 'bureau'; // 'bureau' | 'zoom-avant' | 'poste' | 'zoom-arriere'
let debutZoom = 0;
const DUREE_ZOOM = 700;
let gBureau = null; // image pixel art du bureau (480×270)
let copieBasse = null; // miniature du jeu pour l'écran du PC (puis agrandie : effet pixel)
let copieHaute = null; // copie pleine résolution pour le zoom
let survolEcran = false;
let dernierRenduBureau = 0;

// Palette (chaude, saturée, inspirée de la référence ; distincte de la palette de l'interface)
const P = {
	contour: '#2b1d18',
	murClair: '#ecdcb6',
	mur: '#dcc79a',
	murSombre: '#c4ab7a',
	lambris: '#b98f5a',
	lambrisSombre: '#8f6a3e',
	boisClair: '#d29a5c',
	bois: '#b07842',
	boisMoyen: '#8e5a30',
	boisSombre: '#673f22',
	boisNoir: '#442817',
	vertNuit: '#1f3d2a',
	vertSombre: '#2f5d3a',
	vert: '#3f7a43',
	vertClair: '#5f9e4f',
	vertLumiere: '#8cc06a',
	pierre: '#8d8a80',
	pierreSombre: '#6b675e',
	plastique: '#e6dfcc',
	plastiqueClair: '#f6f1e2',
	plastiqueOmbre: '#bdb4a0',
	plastiqueSombre: '#958b77',
	metal: '#3c4450',
	metalClair: '#5f6a78',
	papier: '#f7f1e1',
	papierOmbre: '#d8cfb6',
	chemise: '#d9a94f',
	chemiseSombre: '#a97c33',
	rouge: '#b3261e',
	rougeSombre: '#7d1a15',
	liege: '#c4925a',
	liegeSombre: '#a3733f',
	pot: '#b4583a',
	potSombre: '#83402a',
	noir: '#1c2733',
	panneau: '#0e3b46',
};

function setupBureau() {
	gBureau = createGraphics(BW, BH);
	gBureau.pixelDensity(1);
	gBureau.noSmooth();
	copieBasse = document.createElement('canvas');
	copieBasse.width = 288;
	copieBasse.height = 162;
	copieHaute = document.createElement('canvas');
	copieHaute.width = L;
	copieHaute.height = H;
}

// ——— Outils de pixel art ———
function px(g, c, x, y, l, h) {
	g.fill(c);
	g.rect(Math.round(x), Math.round(y), Math.round(l), Math.round(h));
}
// Pseudo-aléatoire déterministe (textures stables d'une image à l'autre)
function bruit(i, j) {
	const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
	return s - Math.floor(s);
}
// Boîte avec contour sombre, lumière en haut à gauche, ombre en bas à droite
function boite(g, x, y, l, h, c, clair, sombre) {
	px(g, P.contour, x - 1, y - 1, l + 2, h + 2);
	px(g, c, x, y, l, h);
	if (clair) {
		px(g, clair, x, y, l, 1);
		px(g, clair, x, y, 1, h);
	}
	if (sombre) {
		px(g, sombre, x, y + h - 1, l, 1);
		px(g, sombre, x + l - 1, y, 1, h);
	}
}
function disque(g, cx, cy, r, c) {
	g.fill(c);
	for (let dy = -r; dy <= r; dy++) {
		const w = Math.floor(Math.sqrt(r * r - dy * dy));
		g.rect(Math.round(cx - w), Math.round(cy + dy), 2 * w + 1, 1);
	}
}
// Ombre portée tramée (damier) : douce, typique du pixel art
function ombreTramee(g, x, y, l, h, alpha) {
	g.fill(43, 29, 24, alpha || 90);
	for (let j = 0; j < h; j++) for (let i = (j % 2); i < l; i += 2) g.rect(x + i, y + j, 1, 1);
}
// Touffe de feuillage en 4 tons avec contour
function feuillage(g, cx, cy, r) {
	disque(g, cx, cy + 1, r + 1, P.contour);
	disque(g, cx, cy, r, P.vertSombre);
	disque(g, cx - 1, cy - 1, r - 2, P.vert);
	disque(g, cx - Math.round(r / 3), cy - Math.round(r / 3), Math.max(1, Math.round(r / 2)), P.vertClair);
	for (let k = 0; k < r; k++) {
		const a = bruit(cx + k, cy) * Math.PI * 2;
		const d = bruit(cx, cy + k) * (r - 1);
		px(g, k % 3 ? P.vertLumiere : P.vertSombre, cx + Math.cos(a) * d, cy + Math.sin(a) * d, 1, 1);
	}
}

// ——— Scène ———
function dessinerPieceBureau() {
	const g = gBureau;
	g.noStroke();
	dessinerMur(g);
	dessinerFenetre(g);
	dessinerPanneauMural(g);
	dessinerHorloge(g);
	dessinerTableauLiege(g);
	dessinerPlante(g);
	dessinerBureauBois(g);
	dessinerLampe(g);
	dessinerDossiers(g);
	dessinerPC(g);
	dessinerTasseTelephone(g);
	dessinerLumiere(g);
}

function dessinerMur(g) {
	px(g, P.mur, 0, 0, BW, 150);
	// Texture d'enduit : petits points clairs/sombres
	for (let j = 0; j < 150; j += 3)
		for (let i = 0; i < BW; i += 3) {
			const b = bruit(i, j);
			if (b > 0.93) px(g, P.murClair, i, j, 1, 1);
			else if (b < 0.05) px(g, P.murSombre, i, j, 1, 1);
		}
	// Lambris (bas du mur) avec lattes
	px(g, P.contour, 0, 121, BW, 1);
	px(g, P.lambris, 0, 122, BW, 30);
	for (let x = 0; x < BW; x += 14) {
		px(g, P.lambrisSombre, x, 122, 1, 30);
		px(g, '#c99f68', x + 1, 122, 1, 30);
	}
	px(g, P.boisClair, 0, 122, BW, 1);
}

function dessinerFenetre(g) {
	// Fenêtre : ciel selon l'heure locale et la météo réelle du jour ; arbres au dehors
	const x = 16;
	const y = 12;
	const l = 132;
	const h = 92;
	const heure = new Date().getHours();
	const nuit = heure < 7 || heure >= 20;
	const m = Jeu.meteoActuelle;
	const pluie = m && m.pluie_mm >= 1;
	boite(g, x - 5, y - 5, l + 10, h + 10, P.bois, P.boisClair, P.boisSombre);
	const haut = nuit ? '#17213a' : pluie ? '#7f8c99' : '#7fb6dc';
	const bas = nuit ? '#2a3654' : pluie ? '#a3adb6' : '#b8dcef';
	for (let j = 0; j < h; j++) px(g, j < h / 2 ? haut : bas, x, y + j, l, 1);
	if (!nuit && !pluie) {
		disque(g, x + 104, y + 18, 9, '#f6d76b');
		disque(g, x + 102, y + 16, 5, '#fbeaa4');
	}
	if (nuit) disque(g, x + 104, y + 16, 6, '#efe8cf');
	// Nuages
	const nuages = pluie ? 4 : 2;
	for (let n = 0; n < nuages; n++) {
		const nx = x + 14 + n * 30;
		const ny = y + 12 + (n % 2) * 8;
		disque(g, nx, ny, 6, pluie ? '#9aa4ad' : '#f4f8fb');
		disque(g, nx + 8, ny - 2, 7, pluie ? '#aeb7bf' : '#ffffff');
		disque(g, nx + 16, ny, 5, pluie ? '#9aa4ad' : '#f4f8fb');
	}
	// Ville lointaine puis arbres proches (comme la référence : feuillages ronds en couches)
	const toits = [16, 24, 12, 30, 20, 26, 14, 34, 22, 18, 26, 14, 20];
	toits.forEach((t, i) => {
		px(g, nuit ? '#0f1626' : '#7d8896', x + i * 10, y + h - 30 - t, 10, t + 30);
		if (nuit && i % 2 === 0) px(g, '#e8c46a', x + i * 10 + 3, y + h - 26 - t, 2, 2);
	});
	[
		[x + 10, y + h - 14, 14],
		[x + 34, y + h - 8, 12],
		[x + 60, y + h - 16, 16],
		[x + 90, y + h - 10, 13],
		[x + 118, y + h - 14, 15],
	].forEach(([cx, cy, r]) => {
		px(g, P.boisSombre, cx - 1, cy + r - 4, 3, 10);
		feuillage(g, cx, cy, r);
	});
	if (pluie) {
		g.fill('#cfd8e0');
		for (let i = 0; i < 40; i++) g.rect(x + ((i * 37) % l), y + ((i * 23 + Math.floor(millis() / 50)) % (h - 4)), 1, 3);
	}
	// Croisillons et rebord
	px(g, P.contour, x + l / 2 - 2, y, 4, h);
	px(g, P.bois, x + l / 2 - 1, y, 2, h);
	px(g, P.contour, x, y + h / 2 - 2, l, 4);
	px(g, P.bois, x, y + h / 2 - 1, l, 2);
	// Reflet sur la vitre
	g.fill(255, 255, 255, 40);
	for (let k = 0; k < 18; k++) g.rect(x + 6 + k, y + 4 + k, 2, 1);
	boite(g, x - 9, y + h + 5, l + 18, 5, P.boisClair, '#e4b277', P.boisSombre); // rebord
}

function dessinerPanneauMural(g) {
	const x = 214;
	const y = 14;
	boite(g, x, y, 128, 22, P.panneau, '#1d5f6e', '#082a32');
	px(g, '#174f5c', x + 3, y + 3, 122, 16);
	textePixel(g, 'REGULATION', x + 44, y + 9, '#f4efe2');
	px(g, '#f4efe2', x + 44 + 4 + 1, y + 7, 2, 1); // accent du « É »
	px(g, P.contour, x + 20, y - 8, 1, 7); // fils de suspension
	px(g, P.contour, x + 107, y - 8, 1, 7);
}

function dessinerHorloge(g) {
	const cx = 172;
	const cy = 34;
	disque(g, cx, cy + 1, 14, P.contour);
	disque(g, cx, cy, 13, P.boisSombre);
	disque(g, cx, cy, 11, P.papier);
	disque(g, cx - 2, cy - 2, 6, P.plastiqueClair);
	for (let i = 0; i < 12; i++) {
		const a = (i / 12) * Math.PI * 2;
		px(g, P.contour, cx + Math.round(Math.sin(a) * 9), cy - Math.round(Math.cos(a) * 9), 1, 1);
	}
	const d = new Date(); // heure réelle
	const aiguille = (frac, long, c) => {
		const a = frac * Math.PI * 2;
		for (let r = 0; r <= long; r++) px(g, c, cx + Math.round(Math.sin(a) * r), cy - Math.round(Math.cos(a) * r), 1, 1);
	};
	aiguille(((d.getHours() % 12) + d.getMinutes() / 60) / 12, 5, P.contour);
	aiguille(d.getMinutes() / 60, 8, P.contour);
	px(g, P.rouge, cx, cy, 1, 1);
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
	const x = 370;
	const y = 18;
	const l = 92;
	const h = 72;
	boite(g, x - 4, y - 4, l + 8, h + 8, P.bois, P.boisClair, P.boisSombre);
	px(g, P.liege, x, y, l, h);
	for (let j = 0; j < h; j++) for (let i = 0; i < l; i++) if (bruit(x + i, y + j) > 0.86) px(g, P.liegeSombre, x + i, y + j, 1, 1);
	const notes = [
		[x + 5, y + 6, 24, 20, '#f6e7a1'],
		[x + 34, y + 4, 20, 16, P.papier],
		[x + 60, y + 8, 26, 24, '#cfe3ef'],
		[x + 8, y + 34, 30, 28, P.papier],
		[x + 46, y + 40, 22, 22, '#f2c6c1'],
	];
	notes.forEach(([nx, ny, nl, nh, c], k) => {
		ombreTramee(g, nx + 2, ny + 2, nl, nh, 70);
		px(g, P.contour, nx - 1, ny - 1, nl + 2, nh + 2);
		px(g, c, nx, ny, nl, nh);
		for (let ly = ny + 5; ly < ny + nh - 3; ly += 3) px(g, '#958d77', nx + 3, ly, nl - 6 - ((ly + k) % 7), 1);
		disque(g, nx + Math.floor(nl / 2), ny, 1, k % 2 ? P.rouge : '#2e6fb5'); // punaise
	});
	// Petit plan de lignes schématique sur la note bleue
	px(g, '#1e7a3c', x + 63, y + 22, 20, 1);
	px(g, P.rouge, x + 72, y + 14, 1, 14);
}

function dessinerPlante(g) {
	// Grande plante dans un pot, à droite, posée sur le plateau
	const x = 444;
	const y = 150;
	[
		[x + 2, y - 52, 14],
		[x - 12, y - 36, 12],
		[x + 16, y - 34, 12],
		[x, y - 24, 13],
		[x + 24, y - 60, 10],
	].forEach(([cx, cy, r]) => feuillage(g, cx, cy, r));
	px(g, P.vertSombre, x, y - 20, 3, 12); // tige
	boite(g, x - 14, y - 10, 30, 22, P.pot, '#d07452', P.potSombre);
	px(g, P.potSombre, x - 14, y - 6, 30, 2);
}

function dessinerBureauBois(g) {
	// Plateau vu légèrement de dessus (profondeur 30 px) avec veinage, puis façade
	const yHaut = 150;
	const yBord = 182;
	px(g, P.contour, 0, yHaut - 1, BW, 1);
	px(g, P.bois, 0, yHaut, BW, yBord - yHaut);
	for (let j = yHaut; j < yBord; j += 6) {
		px(g, P.boisMoyen, 0, j + 5, BW, 1); // jointures des planches
		for (let i = 0; i < BW; i += 2) {
			const b = bruit(i, j);
			if (b > 0.8) px(g, P.boisClair, i, j + 1 + Math.floor(b * 3), 3, 1);
			else if (b < 0.12) px(g, P.boisMoyen, i, j + 2, 4, 1);
		}
	}
	px(g, P.boisClair, 0, yHaut, BW, 1);
	// Chant avant du plateau
	px(g, P.contour, 0, yBord, BW, 1);
	px(g, P.boisClair, 0, yBord + 1, BW, 2);
	px(g, P.boisSombre, 0, yBord + 3, BW, 4);
	px(g, P.contour, 0, yBord + 7, BW, 1);
	// Façade du bureau (dans l'ombre)
	px(g, P.boisSombre, 0, yBord + 8, BW, BH - yBord - 8);
	for (let x = 0; x < BW; x += 24) px(g, P.boisNoir, x, yBord + 8, 1, BH);
	// Caisson à tiroirs à droite
	for (let i = 0; i < 3; i++) {
		const ty = yBord + 14 + i * 26;
		boite(g, 300, ty, 150, 22, P.boisMoyen, P.bois, P.boisNoir);
		boite(g, 364, ty + 9, 22, 3, '#d9c08a', '#f1dca7', '#9a7d45'); // poignée laiton
	}
	ombreTramee(g, 0, yBord + 8, BW, 6, 110); // ombre sous le plateau
}

function dessinerLampe(g) {
	// Lampe d'architecte (gauche) : pied, bras, abat-jour vert, halo
	boite(g, 12, 168, 30, 6, P.metal, P.metalClair, '#262c34');
	px(g, P.contour, 25, 120, 4, 48);
	px(g, P.metalClair, 26, 120, 2, 48);
	px(g, P.contour, 26, 116, 40, 4);
	px(g, P.metalClair, 27, 117, 38, 2);
	boite(g, 58, 104, 26, 14, '#2f6f62', '#4f9a87', '#1d4a41');
	px(g, '#fbeaa4', 60, 118, 22, 2);
	g.fill(251, 234, 164, 45);
	g.quad(60, 120, 82, 120, 108, 168, 40, 168); // halo de lumière sur le plateau
}

function dessinerDossiers(g) {
	// Pile de chemises cartonnées (dossiers de la semaine) + tampon encreur
	ombreTramee(g, 92, 172, 76, 6, 100);
	for (let i = 0; i < 6; i++) {
		const y = 166 - i * 4;
		const dx = (i % 2) * 2 - 1;
		boite(g, 92 + dx, y, 70, 3, i % 2 ? P.chemise : '#e2b862', '#f0cd7f', P.chemiseSombre);
		px(g, P.papier, 96 + dx, y - 1, 60, 1); // feuilles qui dépassent
	}
	boite(g, 98, 140, 56, 3, P.papier, P.plastiqueClair, P.papierOmbre);
	// Étiquette rouge sur le dessus
	px(g, P.rouge, 140, 141, 10, 2);
	// Tampon encreur
	ombreTramee(g, 172, 172, 18, 4, 100);
	boite(g, 172, 164, 16, 7, P.rouge, '#d4463c', P.rougeSombre);
	boite(g, 177, 152, 6, 12, P.boisMoyen, P.bois, P.boisSombre);
	disque(g, 180, 150, 3, P.boisSombre);
}

function dessinerPC(g) {
	const e = ECRAN_PC;
	// Ombre portée sur le plateau
	ombreTramee(g, e.x + 20, 166, e.l - 20, 8, 110);
	// Pied et socle
	boite(g, e.x + 52, e.y + e.h + 9, 40, 12, P.plastiqueOmbre, P.plastique, P.plastiqueSombre);
	boite(g, e.x + 38, 160, 68, 6, P.plastique, P.plastiqueClair, P.plastiqueOmbre);
	// Coque du moniteur (bordure épaisse, coins arrondis simulés)
	boite(g, e.x - 8, e.y - 8, e.l + 16, e.h + 18, P.plastique, P.plastiqueClair, P.plastiqueSombre);
	px(g, P.plastiqueOmbre, e.x - 7, e.y + e.h + 2, e.l + 14, 7);
	px(g, P.contour, e.x - 1, e.y - 1, e.l + 2, e.h + 2);
	px(g, '#0d1013', e.x, e.y, e.l, e.h);
	// Logo et voyant
	px(g, P.plastiqueSombre, e.x + e.l / 2 - 6, e.y + e.h + 4, 12, 2);
	px(g, '#1e7a3c', e.x + e.l - 4, e.y + e.h + 4, 2, 2);
	px(g, '#8cc06a', e.x + e.l - 4, e.y + e.h + 4, 1, 1);
	// Clavier (plus proche, donc plus grand) et souris
	ombreTramee(g, e.x + 8, 182, 132, 3, 90);
	boite(g, e.x + 6, 168, 132, 13, P.plastique, P.plastiqueClair, P.plastiqueSombre);
	for (let r = 0; r < 3; r++)
		for (let k = 0; k < 18; k++) {
			const kx = e.x + 9 + k * 7 + (r % 2) * 2;
			if (kx + 5 > e.x + 135) continue;
			px(g, P.plastiqueOmbre, kx, 170 + r * 3, 5, 2);
			px(g, P.plastiqueClair, kx, 170 + r * 3, 5, 1);
		}
	boite(g, e.x + 152, 170, 9, 11, P.plastique, P.plastiqueClair, P.plastiqueSombre);
	px(g, P.plastiqueSombre, e.x + 156, 170, 1, 4);
	px(g, P.contour, e.x + 156, 160, 1, 10); // câble
}

function dessinerTasseTelephone(g) {
	// Tasse de café fumante
	ombreTramee(g, 372, 176, 18, 3, 100);
	boite(g, 372, 160, 14, 16, P.papier, '#ffffff', P.papierOmbre);
	px(g, P.contour, 386, 163, 4, 1);
	px(g, P.contour, 389, 163, 1, 8);
	px(g, P.contour, 386, 170, 4, 1);
	px(g, '#5a3b26', 373, 161, 12, 2);
	if (!reduireAnimations) {
		const t = Math.floor(millis() / 300);
		g.fill(255, 255, 255, 90);
		for (let k = 0; k < 3; k++) g.rect(376 + k * 3 + ((t + k) % 2), 152 - k * 3 - (t % 3), 1, 3);
	}
	// Téléphone fixe
	ombreTramee(g, 396, 178, 40, 3, 100);
	boite(g, 396, 164, 38, 13, P.metal, P.metalClair, '#262c34');
	boite(g, 398, 157, 34, 6, P.metalClair, '#7d8898', P.metal);
	for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) px(g, '#9aa4b2', 412 + k * 5, 167 + r * 4, 3, 2);
	px(g, P.rouge, 400, 167, 3, 3); // voyant « message »
}

function dessinerLumiere(g) {
	// Lumière chaude de la fenêtre sur le mur et le plateau, et vignettage doux dans les coins
	g.fill(255, 214, 140, 26);
	g.quad(16, 108, 148, 108, 230, 182, 40, 182);
	for (let k = 0; k < 18; k++) {
		g.fill(43, 29, 24, 10);
		g.rect(0, k, BW, 1);
		g.rect(0, BH - 1 - k, BW, 1);
		g.rect(k, 0, 1, BH);
		g.rect(BW - 1 - k, 0, 1, BH);
	}
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

	// Le décor (des milliers de pixels) n'est redessiné que 8 fois par seconde : assez pour la pluie,
	// la vapeur et l'horloge, sans ralentir le jeu affiché dans l'écran.
	if (!dernierRenduBureau || millis() - dernierRenduBureau > 125) {
		dessinerPieceBureau();
		dernierRenduBureau = millis();
	}
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
