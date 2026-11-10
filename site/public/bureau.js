/* Nantes en régulation — la pièce de régulation en pixel art (vue d'entrée du jeu).
 * Cadrage large : on voit toute la pièce — porte d'entrée, portemanteau, fenêtre, tableau de liège,
 * bureau au centre avec le PC (écran centré sur la page, prompt 21), fauteuil, tapis, lampe, plante.
 * Clic sur le PC (ou Entrée) : zoom jusqu'au moniteur SANS plein écran — la pièce reste visible autour.
 * Le PC démarre puis affiche un bureau (système fictif, voir os.js) avec l'icône de l'appli de régulation.
 * Échap : se lever. Décor dessiné dans une image 480×270 agrandie ×4 sans lissage. Aucun fichier image.
 */

const PIX = 4;
const BW = L / PIX; // 480
const BH = H / PIX; // 270
// Écran du PC (16:9) en coordonnées pixel art, centré horizontalement (prompt 21 § 1.1)
const LARGEUR_ECRAN_PC = 96;
const ECRAN_PC = { x: (BW - LARGEUR_ECRAN_PC) / 2, y: 84, l: LARGEUR_ECRAN_PC, h: 54 };
const HORLOGE_X = 318;
// Vue « au poste » : le moniteur occupe ce rectangle (pixels écran), la pièce reste visible autour
const ECRAN_POSTE = { x: (L - 1340) / 2, y: 96, l: 1340, h: 754 };

let vue = 'bureau'; // 'bureau' | 'zoom-avant' | 'poste' | 'zoom-arriere'
let debutZoom = 0;
const DUREE_ZOOM = 700;
let gBureau = null;
let copieBasse = null; // écran vu depuis la pièce (pixelisé)
let copieHaute = null; // écran vu de près
let survolEcran = false;
let dernierRenduBureau = 0;

const P = {
	contour: '#2b1d18',
	plafond: '#b9a67f',
	murClair: '#efe1bd',
	mur: '#e0cc9f',
	murRayure: '#d6c08f',
	murSombre: '#c4ab7a',
	lambris: '#a97f4c',
	lambrisClair: '#c99f68',
	lambrisSombre: '#7f5d34',
	plinthe: '#5e3f22',
	parquet: '#a8703f',
	parquetClair: '#c48a52',
	parquetSombre: '#7e512b',
	tapis: '#2f5f6b',
	tapisBord: '#c9a04f',
	tapisMotif: '#3f7a86',
	boisClair: '#d29a5c',
	bois: '#b07842',
	boisMoyen: '#8e5a30',
	boisSombre: '#673f22',
	boisNoir: '#442817',
	porte: '#8a5530',
	porteClair: '#a96b3e',
	porteSombre: '#5f3a20',
	laiton: '#e2c071',
	laitonSombre: '#a8853d',
	vertNuit: '#1f3d2a',
	vertSombre: '#2f5d3a',
	vert: '#3f7a43',
	vertClair: '#5f9e4f',
	vertLumiere: '#8cc06a',
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
	tissu: '#1d5f6e',
	tissuClair: '#2a7a8c',
	tissuSombre: '#123f4a',
	noir: '#1c2733',
	panneau: '#0e3b46',
};

function setupBureau() {
	gBureau = createGraphics(BW, BH);
	gBureau.pixelDensity(1);
	gBureau.noSmooth();
	copieBasse = document.createElement('canvas');
	copieBasse.width = 192;
	copieBasse.height = 108;
	copieHaute = document.createElement('canvas');
	copieHaute.width = L;
	copieHaute.height = H;
}

// ——— Outils de pixel art ———
function px(g, c, x, y, l, h) {
	g.fill(c);
	g.rect(Math.round(x), Math.round(y), Math.round(l), Math.round(h));
}
function bruit(i, j) {
	const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
	return s - Math.floor(s);
}
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
function ombreTramee(g, x, y, l, h, alpha) {
	g.fill(43, 29, 24, alpha || 90);
	for (let j = 0; j < h; j++) for (let i = j % 2; i < l; i += 2) g.rect(x + i, y + j, 1, 1);
}
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
const GLYPHES = {
	R: '110101110101101', E: '111100110100111', G: '111100101101111', U: '101101101101111', L: '100100100100111',
	A: '010101111101101', T: '111010010010010', I: '111010010010111', O: '111101101101111', N: '101111111111101',
	S: '111100111001111', C: '111100100100111', D: '110101101101110', P: '111101111100100', Z: '111001010100111',
	' ': '000000000000000', 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111',
	4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111',
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

// ——— La pièce ———
const SOL_Y = 168; // ligne de plinthe (fond de la pièce)
function dessinerPieceBureau() {
	const g = gBureau;
	g.noStroke();
	dessinerMurs(g);
	dessinerSol(g);
	dessinerPorte(g);
	dessinerPortemanteau(g);
	dessinerFenetre(g, 382, 28, 78, 84);
	dessinerPanneauMural(g);
	dessinerHorloge(g);
	dessinerTableauLiege(g);
	dessinerPlantePied(g);
	dessinerLampadaire(g);
	dessinerTapis(g);
	dessinerBureauMeuble(g);
	dessinerPC(g);
	dessinerObjetsBureau(g);
	if (typeof dessinerLivres === 'function') dessinerLivres(g);
	dessinerFauteuil(g);
	if (typeof dessinerPersonnageSieste === 'function') dessinerPersonnageSieste(g);
	dessinerLumiere(g);
	dessinerVignettage(g);
}

function dessinerMurs(g) {
	// Plafond, corniche, papier peint rayé, lambris, plinthe
	px(g, P.plafond, 0, 0, BW, 8);
	px(g, P.contour, 0, 8, BW, 1);
	px(g, P.lambrisClair, 0, 9, BW, 2);
	px(g, P.mur, 0, 11, BW, SOL_Y - 11);
	for (let x = 0; x < BW; x += 12) px(g, P.murRayure, x, 11, 4, SOL_Y - 11);
	for (let j = 11; j < 128; j += 3)
		for (let i = 0; i < BW; i += 3) {
			const b = bruit(i, j);
			if (b > 0.95) px(g, P.murClair, i, j, 1, 1);
			else if (b < 0.03) px(g, P.murSombre, i, j, 1, 1);
		}
	px(g, P.contour, 0, 127, BW, 1);
	px(g, P.lambris, 0, 128, BW, SOL_Y - 128);
	for (let x = 0; x < BW; x += 16) {
		boite(g, x + 2, 132, 12, SOL_Y - 140, P.lambris, P.lambrisClair, P.lambrisSombre);
	}
	px(g, P.lambrisClair, 0, 128, BW, 1);
	px(g, P.plinthe, 0, SOL_Y - 4, BW, 4);
	px(g, P.contour, 0, SOL_Y, BW, 1);
}

function dessinerSol(g) {
	// Parquet en perspective : lames qui convergent vers un point de fuite au centre
	px(g, P.parquet, 0, SOL_Y + 1, BW, BH - SOL_Y);
	for (let i = -16; i <= 16; i++) {
		const xh = 240 + i * 18;
		const xb = 240 + i * 46;
		for (let y = SOL_Y + 1; y < BH; y++) {
			const t = (y - SOL_Y) / (BH - SOL_Y);
			px(g, P.parquetSombre, xh + (xb - xh) * t, y, 1, 1);
		}
	}
	let pas = 4;
	for (let y = SOL_Y + 4; y < BH; y += pas, pas += 1) {
		px(g, P.parquetSombre, 0, y, BW, 1);
		for (let x = (y * 7) % 23; x < BW; x += 23) px(g, P.parquetClair, x, y + 1, 8, 1);
	}
}

function dessinerPorte(g) {
	// Porte d'entrée (à gauche) avec chambranle, panneaux, oculus, poignée laiton, panneau « SORTIE »
	const x = 22;
	const y = 58;
	const l = 64;
	const h = SOL_Y - y;
	boite(g, x - 6, y - 6, l + 12, h + 6, P.boisSombre, P.bois, P.boisNoir);
	boite(g, x, y, l, h, P.porte, P.porteClair, P.porteSombre);
	boite(g, x + 8, y + 10, l - 16, 24, '#c9dce3', '#e8f2f5', '#9db7c0'); // oculus vitré
	px(g, '#ffffff', x + 11, y + 13, 6, 1);
	px(g, '#ffffff', x + 11, y + 13, 1, 6);
	boite(g, x + 8, y + 44, l - 16, 26, P.porte, P.porteSombre, P.porteClair);
	boite(g, x + 8, y + 76, l - 16, h - 86, P.porte, P.porteSombre, P.porteClair);
	boite(g, x + l - 12, y + 58, 6, 3, P.laiton, '#f5dc9a', P.laitonSombre); // poignée
	px(g, P.laitonSombre, x + l - 11, y + 62, 3, 6);
	g.fill(255, 226, 150, 110); // lumière du couloir sous la porte
	g.rect(x, SOL_Y - 1, l, 1);
	boite(g, x + 10, y - 20, 44, 9, '#1e7a3c', '#2f9b52', '#155a2c'); // SORTIE
	textePixel(g, 'SORTIE', x + 21, y - 18, '#f7f1e1');
	// Paillasson
	boite(g, x + 6, SOL_Y + 4, l - 12, 6, '#7a5a3a', '#94714c', '#5a4028');
}

function dessinerPortemanteau(g) {
	const x = 104;
	px(g, P.contour, x - 1, 66, 4, SOL_Y - 62);
	px(g, P.boisMoyen, x, 66, 2, SOL_Y - 62);
	boite(g, x - 8, SOL_Y + 2, 18, 3, P.boisMoyen, P.bois, P.boisSombre);
	px(g, P.contour, x - 6, 70, 14, 2);
	// Veste et écharpe
	boite(g, x - 9, 72, 12, 34, P.tissu, P.tissuClair, P.tissuSombre);
	px(g, P.tissuSombre, x - 4, 74, 1, 30);
	boite(g, x + 3, 72, 6, 22, '#b3261e', '#d4463c', '#7d1a15');
	disque(g, x + 1, 63, 6, P.contour); // chapeau
	disque(g, x + 1, 63, 5, '#4a3324');
	px(g, '#5c4130', x - 6, 66, 15, 2);
}

function dessinerFenetre(g, x, y, l, h) {
	const heure = heureAffichee().h;
	const nuit = heure < 7 || heure >= 20;
	const m = Jeu.meteoActuelle;
	const pluie = m && m.pluie_mm >= 1;
	boite(g, x - 5, y - 5, l + 10, h + 10, P.bois, P.boisClair, P.boisSombre);
	const haut = nuit ? '#17213a' : pluie ? '#7f8c99' : '#7fb6dc';
	const bas = nuit ? '#2a3654' : pluie ? '#a3adb6' : '#b8dcef';
	for (let j = 0; j < h; j++) px(g, j < h / 2 ? haut : bas, x, y + j, l, 1);
	if (!nuit && !pluie) {
		disque(g, x + 90, y + 16, 8, '#f6d76b');
		disque(g, x + 88, y + 14, 4, '#fbeaa4');
	}
	if (nuit) disque(g, x + 90, y + 14, 6, '#efe8cf');
	for (let n = 0; n < (pluie ? 3 : 2); n++) {
		const nx = x + 12 + n * 30;
		const ny = y + 12 + (n % 2) * 8;
		disque(g, nx, ny, 5, pluie ? '#9aa4ad' : '#f4f8fb');
		disque(g, nx + 7, ny - 2, 6, pluie ? '#aeb7bf' : '#ffffff');
		disque(g, nx + 14, ny, 4, pluie ? '#9aa4ad' : '#f4f8fb');
	}
	[16, 24, 12, 30, 20, 26, 14, 34, 22, 18, 26, 14].forEach((t, i) => {
		px(g, nuit ? '#0f1626' : '#7d8896', x + i * 10, y + h - 28 - t, 10, t + 28);
		if (nuit && i % 2 === 0) px(g, '#e8c46a', x + i * 10 + 3, y + h - 24 - t, 2, 2);
	});
	[[x + 10, y + h - 12, 12], [x + 34, y + h - 7, 10], [x + 58, y + h - 14, 14], [x + 86, y + h - 9, 11], [x + 108, y + h - 12, 12]].forEach(([cx, cy, r]) => {
		px(g, P.boisSombre, cx - 1, cy + r - 4, 3, 8);
		feuillage(g, cx, cy, r);
	});
	if (pluie) {
		g.fill('#cfd8e0');
		for (let i = 0; i < 34; i++) g.rect(x + ((i * 37) % l), y + ((i * 23 + Math.floor(millis() / 50)) % (h - 4)), 1, 3);
	}
	px(g, P.contour, x + l / 2 - 2, y, 4, h);
	px(g, P.bois, x + l / 2 - 1, y, 2, h);
	px(g, P.contour, x, y + h / 2 - 2, l, 4);
	px(g, P.bois, x, y + h / 2 - 1, l, 2);
	g.fill(255, 255, 255, 40);
	for (let k = 0; k < 16; k++) g.rect(x + 6 + k, y + 4 + k, 2, 1);
	boite(g, x - 9, y + h + 5, l + 18, 4, P.boisClair, '#e4b277', P.boisSombre);
	// Rideaux
	boite(g, x - 14, y - 8, 8, h + 20, '#9b3b2e', '#bb5544', '#6e281f');
	boite(g, x + l + 6, y - 8, 8, h + 20, '#9b3b2e', '#bb5544', '#6e281f');
	px(g, P.contour, x - 18, y - 10, l + 36, 2);
}

function dessinerPanneauMural(g) {
	const x = BW / 2 - 52;
	const y = 22;
	px(g, P.contour, x + 16, y - 12, 1, 11);
	px(g, P.contour, x + 87, y - 12, 1, 11);
	boite(g, x, y, 104, 18, P.panneau, '#1d5f6e', '#082a32');
	px(g, '#174f5c', x + 3, y + 3, 98, 12);
	textePixel(g, 'REGULATION', x + 32, y + 7, '#f4efe2');
	px(g, '#f4efe2', x + 37, y + 5, 2, 1); // accent du « É »
}

function dessinerHorloge(g) {
	const cx = HORLOGE_X;
	const cy = 36;
	disque(g, cx, cy + 1, 12, P.contour);
	disque(g, cx, cy, 11, P.boisSombre);
	disque(g, cx, cy, 9, P.papier);
	disque(g, cx - 2, cy - 2, 4, P.plastiqueClair);
	for (let i = 0; i < 12; i++) {
		const a = (i / 12) * Math.PI * 2;
		px(g, P.contour, cx + Math.round(Math.sin(a) * 7), cy - Math.round(Math.cos(a) * 7), 1, 1);
	}
	const hA = heureAffichee();
	const aiguille = (frac, long) => {
		const a = frac * Math.PI * 2;
		for (let r = 0; r <= long; r++) px(g, P.contour, cx + Math.round(Math.sin(a) * r), cy - Math.round(Math.cos(a) * r), 1, 1);
	};
	aiguille(((hA.h % 12) + hA.m / 60) / 12, 4);
	aiguille(hA.m / 60, 7);
	px(g, P.rouge, cx, cy, 1, 1);
}

function dessinerTableauLiege(g) {
	const x = 132;
	const y = 46;
	const l = 64;
	const h = 50;
	boite(g, x - 3, y - 3, l + 6, h + 6, P.bois, P.boisClair, P.boisSombre);
	px(g, P.liege, x, y, l, h);
	for (let j = 0; j < h; j++) for (let i = 0; i < l; i++) if (bruit(x + i, y + j) > 0.87) px(g, P.liegeSombre, x + i, y + j, 1, 1);
	// Plan schématique du réseau (deux lignes qui se croisent) + notes
	px(g, P.papier, x + 4, y + 4, 28, 22);
	px(g, '#1e7a3c', x + 6, y + 14, 24, 1);
	px(g, P.rouge, x + 17, y + 6, 1, 18);
	px(g, '#2e6fb5', x + 8, y + 8, 20, 1);
	[[x + 36, y + 4, 22, 18, '#f6e7a1'], [x + 6, y + 30, 20, 16, '#cfe3ef'], [x + 32, y + 28, 26, 18, '#f2c6c1']].forEach(([nx, ny, nl, nh, c], k) => {
		px(g, P.contour, nx - 1, ny - 1, nl + 2, nh + 2);
		px(g, c, nx, ny, nl, nh);
		for (let ly = ny + 4; ly < ny + nh - 2; ly += 3) px(g, '#958d77', nx + 2, ly, nl - 5 - ((ly + k) % 5), 1);
		disque(g, nx + Math.floor(nl / 2), ny, 1, k % 2 ? P.rouge : '#2e6fb5');
	});
	disque(g, x + 18, y + 4, 1, P.rouge);
}

function dessinerPlantePied(g) {
	// Grande plante en pot posée au sol, coin droit
	const x = 452;
	const y = 236;
	[[x, y - 70, 14], [x - 16, y - 54, 13], [x + 14, y - 50, 12], [x - 4, y - 36, 14], [x + 18, y - 76, 10], [x - 20, y - 76, 9]].forEach(([cx, cy, r]) => feuillage(g, cx, cy, r));
	px(g, P.vertSombre, x - 1, y - 30, 3, 20);
	ombreTramee(g, x - 18, y + 22, 40, 4, 110);
	boite(g, x - 16, y - 12, 34, 34, P.pot, '#d07452', P.potSombre);
	px(g, P.potSombre, x - 16, y - 6, 34, 3);
}

function dessinerLampadaire(g) {
	// Lampadaire à droite du bureau, halo chaud (entre le bureau et la fenêtre)
	const x = 360;
	g.fill(255, 226, 150, 34);
	g.quad(x - 14, 92, x + 14, 92, x + 44, SOL_Y + 40, x - 44, SOL_Y + 40);
	ombreTramee(g, x - 12, 212, 26, 3, 110);
	boite(g, x - 10, 208, 22, 4, P.metal, P.metalClair, '#262c34');
	px(g, P.contour, x - 1, 96, 4, 112);
	px(g, P.metalClair, x, 96, 2, 112);
	boite(g, x - 13, 78, 28, 16, '#e8d6a8', '#f6ead0', '#c4ad78'); // abat-jour
	px(g, '#fbeaa4', x - 12, 93, 26, 2);
}

function dessinerTapis(g) {
	// Tapis en trapèze (perspective) sous le bureau et le fauteuil
	const yh = 188;
	const yb = 262;
	for (let y = yh; y <= yb; y++) {
		const t = (y - yh) / (yb - yh);
		const demi = 112 + t * 52;
		px(g, y === yh || y === yb ? P.contour : P.tapis, 240 - demi, y, demi * 2, 1);
		px(g, P.contour, 240 - demi - 1, y, 1, 1);
		px(g, P.contour, 240 + demi, y, 1, 1);
		if (y > yh + 2 && y < yb - 2) {
			px(g, P.tapisBord, 240 - demi + 3, y, 2, 1);
			px(g, P.tapisBord, 240 + demi - 5, y, 2, 1);
			if ((y - yh) % 8 === 4) for (let k = -6; k <= 6; k++) px(g, P.tapisMotif, 240 + k * (demi / 7) - 2, y, 4, 2);
		}
	}
	px(g, P.tapisBord, 240 - 109, yh + 3, 218, 1);
	px(g, P.tapisBord, 240 - 161, yb - 3, 322, 1);
}

function dessinerBureauMeuble(g) {
	// Bureau en bois au centre : plateau vu de dessus (profondeur 12), chant, façade, tiroirs, pieds
	const x = 132;
	const l = 216;
	const yP = 146;
	ombreTramee(g, x + 4, 222, l, 6, 120);
	// Pieds
	boite(g, x + 4, 166, 10, 56, P.boisMoyen, P.bois, P.boisSombre);
	boite(g, x + l - 14, 166, 10, 56, P.boisMoyen, P.bois, P.boisSombre);
	// Façade (dans l'ombre) et caisson à tiroirs à droite
	boite(g, x + 2, 162, l - 4, 26, P.boisSombre, P.boisMoyen, P.boisNoir);
	for (let i = 0; i < 3; i++) {
		const ty = 166 + i * 18;
		boite(g, x + l - 70, ty, 54, 15, P.boisMoyen, P.bois, P.boisNoir);
		boite(g, x + l - 49, ty + 6, 12, 2, P.laiton, '#f5dc9a', P.laitonSombre);
	}
	// Plateau avec veinage
	px(g, P.contour, x - 1, yP - 1, l + 2, 1);
	px(g, P.bois, x, yP, l, 12);
	for (let j = yP; j < yP + 12; j += 4) {
		px(g, P.boisMoyen, x, j + 3, l, 1);
		for (let i = x; i < x + l; i += 2) {
			const b = bruit(i, j);
			if (b > 0.82) px(g, P.boisClair, i, j + 1, 3, 1);
		}
	}
	px(g, P.boisClair, x, yP, l, 1);
	px(g, P.contour, x - 1, yP + 12, l + 2, 1);
	px(g, P.boisClair, x, yP + 13, l, 1);
	px(g, P.boisSombre, x, yP + 14, l, 2);
	px(g, P.contour, x - 1, yP + 16, l + 2, 1);
	px(g, P.contour, x - 1, yP, 1, 16);
	px(g, P.contour, x + l, yP, 1, 16);
}

function dessinerPC(g) {
	const e = ECRAN_PC;
	ombreTramee(g, e.x + 14, 155, e.l - 20, 3, 110);
	boite(g, e.x + 36, e.y + e.h + 7, 24, 6, P.plastiqueOmbre, P.plastique, P.plastiqueSombre); // pied
	boite(g, e.x + 26, 150, 44, 4, P.plastique, P.plastiqueClair, P.plastiqueOmbre); // socle
	boite(g, e.x - 6, e.y - 6, e.l + 12, e.h + 13, P.plastique, P.plastiqueClair, P.plastiqueSombre); // coque
	px(g, P.plastiqueOmbre, e.x - 5, e.y + e.h + 1, e.l + 10, 5);
	px(g, P.contour, e.x - 1, e.y - 1, e.l + 2, e.h + 2);
	px(g, '#0d1013', e.x, e.y, e.l, e.h);
	px(g, P.plastiqueSombre, e.x + e.l / 2 - 5, e.y + e.h + 3, 10, 1);
	px(g, PC.etat === 'eteint' ? '#7d1a15' : '#1e7a3c', e.x + e.l - 3, e.y + e.h + 3, 2, 2); // voyant
	// Clavier et souris (sur le plateau)
	boite(g, e.x + 4, 152, 88, 5, P.plastique, P.plastiqueClair, P.plastiqueSombre);
	for (let k = 0; k < 14; k++) px(g, P.plastiqueOmbre, e.x + 6 + k * 6, 153, 4, 1);
	for (let k = 0; k < 14; k++) px(g, P.plastiqueOmbre, e.x + 7 + k * 6, 155, 4, 1);
	boite(g, e.x + 98, 152, 5, 5, P.plastique, P.plastiqueClair, P.plastiqueSombre);
}

function dessinerObjetsBureau(g) {
	// Pile de dossiers + tampon (droite), tasse ; les livres sont dessinés par immersion.js
	for (let i = 0; i < 4; i++) {
		const y = 144 - i * 3;
		boite(g, 300 + (i % 2), y, 30, 2, i % 2 ? P.chemise : '#e2b862', '#f0cd7f', P.chemiseSombre);
	}
	px(g, P.papier, 303, 132, 24, 1);
	px(g, P.rouge, 318, 133, 6, 1);
	boite(g, 336, 151, 8, 4, P.rouge, '#d4463c', P.rougeSombre);
	boite(g, 338, 144, 4, 7, P.boisMoyen, P.bois, P.boisSombre);
	// Tasse
	boite(g, 186, 148, 7, 8, P.papier, '#ffffff', P.papierOmbre);
	px(g, P.contour, 193, 150, 2, 1);
	px(g, P.contour, 194, 150, 1, 4);
	px(g, '#5a3b26', 187, 149, 5, 1);
	if (!reduireAnimations) {
		const t = Math.floor(millis() / 300);
		g.fill(255, 255, 255, 90);
		for (let k = 0; k < 2; k++) g.rect(188 + k * 3 + ((t + k) % 2), 142 - k * 2 - (t % 3), 1, 3);
	}
}

function dessinerFauteuil(g) {
	// Fauteuil de bureau vu de dos, devant le bureau (le joueur s'y assoit)
	const x = 212;
	const y = 176;
	ombreTramee(g, x - 6, 246, 70, 5, 120);
	px(g, P.contour, x + 27, 226, 4, 18); // pied central
	px(g, P.metalClair, x + 28, 226, 2, 18);
	[[-6, 244], [24, 247], [54, 244]].forEach(([dx, yy]) => {
		boite(g, x + dx + 2, yy - 2, 8, 2, P.metal, P.metalClair, '#262c34');
		disque(g, x + dx + 6, yy + 2, 2, P.contour);
	});
	boite(g, x - 4, 218, 66, 8, P.tissuSombre, P.tissu, '#0a2a32'); // assise
	boite(g, x + 2, y, 54, 44, P.tissu, P.tissuClair, P.tissuSombre); // dossier
	px(g, P.tissuSombre, x + 10, y + 8, 38, 1);
	px(g, P.tissuSombre, x + 10, y + 30, 38, 1);
	px(g, P.tissuClair, x + 6, y + 4, 2, 34);
}

function dessinerLumiere(g) {
	g.fill(255, 214, 140, 24);
	g.quad(382, 112, 460, 112, 476, SOL_Y + 60, 350, SOL_Y + 60); // lumière de la fenêtre au sol
	g.fill(255, 230, 170, 20);
	disque(g, ECRAN_PC.x + ECRAN_PC.l / 2, ECRAN_PC.y + ECRAN_PC.h / 2, 60, 'rgba(180,215,255,0.05)'); // lueur de l'écran
}

/* Vignettage pixel art (prompt 21 § 1.2), statique : calculé une fois puis superposé. */
let gVignette = null;
function dessinerVignettage(gCible) {
	if (!gVignette) {
		gVignette = createGraphics(BW, BH);
		gVignette.pixelDensity(1);
		gVignette.noSmooth();
		const g = gVignette;
		g.noStroke();
		const bande = 30;
		const paliers = [{ de: 22, pas: 4, alpha: 38 }, { de: 14, pas: 3, alpha: 64 }, { de: 7, pas: 2, alpha: 102 }, { de: 0, pas: 1, alpha: 140 }];
		for (let y = 0; y < BH; y++)
			for (let x = 0; x < BW; x++) {
				const d = Math.min(x, y, BW - 1 - x, BH - 1 - y);
				if (d >= bande) {
					x = BW - bande - 1;
					continue;
				}
				const p = paliers.find((pl) => d >= pl.de);
				if ((x + y * 2) % p.pas !== 0 || (y % p.pas !== 0 && p.pas > 2)) continue;
				g.fill(43, 29, 24, p.alpha);
				g.rect(x, y, 1, 1);
			}
	}
	gCible.image(gVignette, 0, 0);
}

// ——— Composition : pièce + écran du PC (bureau, zoom, poste) ———
function rectEcranPC() {
	return { x: ECRAN_PC.x * PIX, y: ECRAN_PC.y * PIX, l: ECRAN_PC.l * PIX, h: ECRAN_PC.h * PIX };
}

/** Rectangle de l'écran à l'image courante (interpolé pendant le zoom) */
function rectEcranCourant() {
	const e = rectEcranPC();
	if (vue === 'bureau') return e;
	if (vue === 'poste') return ECRAN_POSTE;
	let t = reduireAnimations ? 1 : constrain((millis() - debutZoom) / DUREE_ZOOM, 0, 1);
	const k = vue === 'zoom-avant' ? easeOut(t) : 1 - easeOut(t);
	return { x: lerp(e.x, ECRAN_POSTE.x, k), y: lerp(e.y, ECRAN_POSTE.y, k), l: lerp(e.l, ECRAN_POSTE.l, k), h: lerp(e.h, ECRAN_POSTE.h, k) };
}

/** À appeler AVANT de dessiner le contenu de l'écran : la souris est ramenée dans les coordonnées 1920×1080 de l'écran */
let sourisReelle = null;
function sourisVersEcran() {
	sourisReelle = { x: mouseX, y: mouseY };
	if (vue !== 'poste') return;
	const r = ECRAN_POSTE;
	window.mouseX = ((mouseX - r.x) * L) / r.l;
	window.mouseY = ((mouseY - r.y) * H) / r.h;
}
function sourisRestaurer() {
	if (sourisReelle) {
		window.mouseX = sourisReelle.x;
		window.mouseY = sourisReelle.y;
	}
}

/** Dessine la pièce et l'écran par-dessus le contenu (déjà dessiné en 1920×1080 sur le canevas). */
function composerVue() {
	const r = rectEcranCourant();
	const auPoste = vue === 'poste';
	// Capture du contenu de l'écran
	const src = drawingContext.canvas;
	if (vue === 'bureau') copieBasse.getContext('2d').drawImage(src, 0, 0, copieBasse.width, copieBasse.height);
	else copieHaute.getContext('2d').drawImage(src, 0, 0);
	// Boutons du contenu : cliquables seulement au poste, ramenés en coordonnées réelles
	if (auPoste) {
		const k = r.l / L;
		boutons = boutons.map((b) => Object.assign({}, b, { x: r.x + b.x * k, y: r.y + b.y * k, l: b.l * k, h: b.h * k }));
	} else boutons = [];

	if (!dernierRenduBureau || millis() - dernierRenduBureau > 125) {
		dessinerPieceBureau();
		dernierRenduBureau = millis();
	}
	// Pièce : à l'échelle 1 au bureau, agrandie autour du moniteur au poste (et pendant le zoom)
	const e = rectEcranPC();
	const echelle = r.l / e.l;
	clear();
	background(P.contour);
	drawingContext.imageSmoothingEnabled = false;
	const flou = (tempsCompresse() && vue === 'bureau') || auPoste;
	if (flou && !reduireAnimations) drawingContext.filter = auPoste ? 'blur(2px) brightness(0.85)' : 'blur(1.5px)';
	push();
	translate(r.x - e.x * echelle, r.y - e.y * echelle);
	scale(echelle);
	image(gBureau, 0, 0, L, H);
	pop();
	drawingContext.filter = 'none';
	if (auPoste && reduireAnimations) {
		noStroke();
		fill(28, 39, 51, 60);
		rect(0, 0, L, H);
	}
	// Écran
	drawingContext.imageSmoothingEnabled = vue !== 'bureau';
	drawingContext.drawImage(vue === 'bureau' ? copieBasse : copieHaute, r.x, r.y, r.l, r.h);
	drawingContext.imageSmoothingEnabled = true;
	noStroke();
	fill(255, 255, 255, 14); // reflet sur la vitre
	quad(r.x, r.y, r.x + r.l * 0.3, r.y, r.x + r.l * 0.12, r.y + r.h, r.x, r.y + r.h);
	if (incidentImportant()) bordureRouge(r.x - 14, r.y - 14, r.l + 28, r.h + 28, auPoste ? 8 : 3 * PIX);

	if (vue === 'zoom-avant' || vue === 'zoom-arriere') {
		const t = reduireAnimations ? 1 : (millis() - debutZoom) / DUREE_ZOOM;
		if (t >= 1) {
			if (vue === 'zoom-avant') {
				vue = 'poste';
				if (PC.etat === 'eteint') demarrerPC();
			} else vue = 'bureau';
		}
		return;
	}
	if (auPoste) {
		textFont(POLICE_DONNEES);
		textSize(18);
		fill(28, 39, 51, 220);
		rect(L / 2 - 110, H - 60, 220, 36, 6);
		fill('#FFFDF7');
		textAlign(CENTER, CENTER);
		text('Échap : se lever', L / 2, H - 42);
		return;
	}
	// Au bureau : survol de l'écran, objets, horloge numérique, invitation
	survolEcran = mouseX >= r.x && mouseX <= r.x + r.l && mouseY >= r.y && mouseY <= r.y + r.h;
	if (survolEcran || focusBureau === 0) {
		noFill();
		stroke('#f2c94c');
		strokeWeight(PIX);
		rect(r.x - 8 * PIX, r.y - 8 * PIX, r.l + 16 * PIX, r.h + 17 * PIX);
		noStroke();
	}
	boutons.push({ x: r.x - 6 * PIX, y: r.y - 6 * PIX, l: r.l + 12 * PIX, h: r.h + 13 * PIX, action: sAsseoir });
	zonesObjetsBureau();
	if (ecran === 'jeu' && phase !== 'fin') {
		const hA = heureAffichee();
		textFont(POLICE_DONNEES);
		textSize(22);
		const lib = String(hA.h).padStart(2, '0') + ':' + String(hA.m).padStart(2, '0') + (tempsCompresse() ? '  ▶▶ ×' + IMMERSION.compression : '');
		const lh = textWidth(lib) + 24;
		fill(28, 39, 51, 220);
		rect(HORLOGE_X * PIX - lh / 2, 52 * PIX, lh, 34, 6);
		fill('#FFFDF7');
		textAlign(CENTER, CENTER);
		text(lib, HORLOGE_X * PIX, 52 * PIX + 17);
	}
	const msg = incidentActif()
		? 'Incident en cours : cliquez sur l’écran du PC (Entrée) pour le traiter'
		: phase === 'mail'
			? 'Un nouveau mail est arrivé sur le PC : cliquez sur l’écran (Entrée)'
			: 'Cliquez sur le PC ou Entrée pour vous installer · Tab : objets · Échap : menu';
	textFont(POLICE_DONNEES);
	textSize(22);
	const lm = textWidth(msg) + 40;
	fill(28, 39, 51, 220);
	rect((L - lm) / 2, H - 76, lm, 48, 8);
	fill('#FFFDF7');
	textAlign(CENTER, CENTER);
	text(msg, L / 2, H - 52);
}

// ——— Prompt 21 § 2 : clignement d'œil sur les transitions bureau ↔ écran ———
// Paupières : fermeture ~150 ms puis ouverture ~200 ms, superposées au zoom (qui n'est pas allongé).
// Animations réduites : simple fondu au noir de 150 ms (0 → 1 → 0), sans paupières.
const CLIGNEMENT = { fermeture: 150, ouverture: 200, fondu: 150 };
let clignement = null; // { debut, sens: 'avant' | 'arriere', bascule: bool }

function opaciteClignement() {
	if (!clignement) return 0;
	const t = millis() - clignement.debut;
	if (t < 0) return 0;
	if (reduireAnimations) {
		const m = CLIGNEMENT.fondu / 2;
		return t < m ? t / m : t < CLIGNEMENT.fondu ? 1 - (t - m) / m : 0;
	}
	if (t < CLIGNEMENT.fermeture) return t / CLIGNEMENT.fermeture;
	const u = t - CLIGNEMENT.fermeture;
	return u < CLIGNEMENT.ouverture ? 1 - u / CLIGNEMENT.ouverture : 0;
}

/** Appelé à la fin de draw() : fait avancer la séquence et dessine les paupières (ou le fondu). */
function dessinerClignement() {
	if (!clignement) return;
	const t = millis() - clignement.debut;
	const milieu = reduireAnimations ? CLIGNEMENT.fondu / 2 : CLIGNEMENT.fermeture;
	// En se levant : on ferme les yeux au poste, puis la caméra recule pendant l'ouverture
	if (clignement.sens === 'arriere' && !clignement.bascule && t >= milieu) {
		clignement.bascule = true;
		vue = 'zoom-arriere';
		debutZoom = millis();
	}
	const k = opaciteClignement();
	if (k > 0) {
		noStroke();
		if (reduireAnimations) {
			fill(10, 8, 7, 255 * k);
			rect(0, 0, L, H);
		} else {
			// Deux paupières en bandes pixelisées (pas de 8 px) qui se rejoignent au milieu
			const h = Math.ceil(((H / 2) * k) / 8) * 8;
			fill('#120c0a');
			rect(0, 0, L, h);
			rect(0, H - h, L, h);
			fill('#3a2a22'); // bord de paupière, un ton plus clair
			if (h > 0 && h < H / 2) {
				rect(0, h - 8, L, 8);
				rect(0, H - h, L, 8);
			}
		}
	}
	const fin = reduireAnimations ? CLIGNEMENT.fondu : CLIGNEMENT.fermeture + CLIGNEMENT.ouverture;
	if (t >= fin && (clignement.sens === 'avant' || clignement.bascule)) clignement = null;
}

function sAsseoir() {
	if (vue !== 'bureau') return;
	vue = 'zoom-avant';
	debutZoom = millis();
	// Les yeux se ferment à la fin du zoom (au moment de « plonger » dans l'écran) puis se rouvrent au poste
	const dureeZoom = reduireAnimations ? 0 : DUREE_ZOOM;
	clignement = { debut: millis() + dureeZoom - (reduireAnimations ? CLIGNEMENT.fondu / 2 : CLIGNEMENT.fermeture), sens: 'avant', bascule: true };
	Confort.Son.demarrer();
	Confort.Son.bip('choix');
}

function seLever() {
	if (vue !== 'poste' || clignement) return;
	clignement = { debut: millis(), sens: 'arriere', bascule: false }; // la vue bascule à mi-clignement
	Confort.Son.bip('choix');
}
