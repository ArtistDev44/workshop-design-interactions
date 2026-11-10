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
const LARGEUR_ECRAN_PC = 168; // vue depuis la chaise : grand écran face au joueur
const ECRAN_PC = { x: (BW - LARGEUR_ECRAN_PC) / 2, y: 46, l: LARGEUR_ECRAN_PC, h: 94 };
// Vue « au poste » : le moniteur occupe ce rectangle (pixels écran), la pièce reste visible autour
const ECRAN_POSTE = { x: (L - 1240) / 2, y: 96, l: 1240, h: 698 };

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
	copieBasse.width = 336;
	copieBasse.height = 189;
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

// ——— La pièce : open space moderne, vue à la première personne depuis la chaise ———
// Le joueur est assis : le plateau occupe le bas de l'image (en perspective), le grand écran est
// face à lui, les accoudoirs de son fauteuil dépassent dans les coins. Derrière, une baie vitrée
// donne sur Nantes : le Château des ducs de Bretagne (à gauche) et la grue Titan jaune (à droite).
const BAIE_BAS = 150; // bas de la baie vitrée
const PLATEAU_Y = 170; // bord arrière du plateau
function dessinerPieceBureau() {
	const g = gBureau;
	g.noStroke();
	dessinerPlafondEtBaie(g);
	dessinerVueNantes(g);
	dessinerMontantsBaie(g);
	if (typeof PIECE !== 'undefined' && PIECE.store) dessinerStore(g); // prompt 29
	dessinerMurDroit(g); // prompt 31 : pan de mur blanc avec l'horloge murale et l'applique
	dessinerMurBas(g);
	dessinerPorte(g); // prompt 26
	dessinerPlateau(g);
	dessinerPC(g);
	dessinerObjetsBureau(g);
	if (typeof dessinerLivres === 'function') dessinerLivres(g);
	// Prompt 31 : plus d'accoudoirs (la chaise n'est plus visible : on est assis dessus)
	dessinerLumiere(g);
	dessinerAmbianceLampe(g);
	dessinerVignettage(g);
	if (typeof dessinerPersonnageSieste === 'function') dessinerPersonnageSieste(g);
}

function dessinerPlafondEtBaie(g) {
	px(g, '#eef0f1', 0, 0, BW, 8); // plafond blanc (prompt 32)
	px(g, '#ffffff', 120, 2, 240, 3); // bandeau lumineux
	px(g, '#c8cdd2', 0, 8, BW, 1);
}

function dessinerVueNantes(g) {
	const heure = heureAffichee().h;
	const nuit = heure < 7 || heure >= 20;
	const m = Jeu.meteoActuelle;
	const pluie = m && m.pluie_mm >= 1;
	const haut = nuit ? '#141d33' : pluie ? '#7f8c99' : '#79b4de';
	const bas = nuit ? '#2b3757' : pluie ? '#a9b3bb' : '#c6e4f3';
	for (let y = 9; y < BAIE_BAS; y++) px(g, y < 70 ? haut : y < 110 ? lerpColor(color(haut), color(bas), (y - 70) / 40).toString('#rrggbb') : bas, 0, y, BW, 1);
	if (!nuit && !pluie) {
		disque(g, 410, 34, 10, '#f6d76b');
		disque(g, 408, 32, 5, '#fbeaa4');
	}
	if (nuit) disque(g, 410, 30, 7, '#efe8cf');
	for (let n = 0; n < (pluie ? 5 : 3); n++) {
		const nx = 30 + n * 90;
		const ny = 26 + (n % 2) * 12;
		disque(g, nx, ny, 6, pluie ? '#9aa4ad' : '#f4f8fb');
		disque(g, nx + 9, ny - 3, 8, pluie ? '#aeb7bf' : '#ffffff');
		disque(g, nx + 18, ny, 5, pluie ? '#9aa4ad' : '#f4f8fb');
	}
	// Ville lointaine
	[18, 26, 14, 30, 22, 34, 16, 28, 20, 36, 24, 18, 30, 22, 26, 16, 32, 20, 24, 28].forEach((t, i) => {
		px(g, nuit ? '#0f1626' : '#8b96a3', i * 24, 118 - t, 24, t + 4);
		if (nuit) for (let k = 0; k < 3; k++) px(g, '#e8c46a', i * 24 + 4 + k * 6, 122 - t + k * 5, 2, 2);
	});
	// La Loire et ses quais
	px(g, nuit ? '#1b2a44' : '#5f8fb0', 0, 128, BW, 10);
	for (let x = 0; x < BW; x += 9) px(g, nuit ? '#2e4264' : '#8fb6cf', x + ((x * 7) % 5), 131 + (x % 3) * 2, 5, 1);
	px(g, '#a49c8b', 0, 138, BW, 12);
	px(g, '#8a8273', 0, 138, BW, 1);
	dessinerChateauDesDucs(g, 20, 128, nuit);
	dessinerGrueTitan(g, 360, 126, nuit);
	// Arbres des quais
	[[180, 136, 9], [196, 138, 7], [328, 136, 8], [470, 134, 9]].forEach(([cx, cy, r]) => {
		px(g, P.boisSombre, cx - 1, cy + r - 3, 3, 6);
		feuillage(g, cx, cy, r);
	});
	if (pluie) {
		g.fill('#cfd8e0');
		for (let i = 0; i < 70; i++) g.rect((i * 37) % BW, 10 + ((i * 23 + Math.floor(millis() / 50)) % (BAIE_BAS - 14)), 1, 3);
	}
}

/* Château des ducs de Bretagne (dessin simplifié et original) : courtine crénelée en tuffeau clair,
   grosses tours rondes à mâchicoulis, grand logis aux toits d'ardoise à lucarnes, douves au pied. */
function dessinerChateauDesDucs(g, x, base, nuit) {
	const pierre = nuit ? '#8f8a7e' : '#e9e1cf';
	const pierreOmbre = nuit ? '#6d695f' : '#c9bfa8';
	const ardoise = nuit ? '#2a3140' : '#4a5566';
	const ardoiseClair = nuit ? '#3a4356' : '#64718a';
	// Douves
	px(g, nuit ? '#1b2a44' : '#4d7f73', x - 6, base - 2, 156, 4);
	// Grand logis (au fond) : façade + haut toit d'ardoise à lucarnes
	px(g, P.contour, x + 34, base - 44, 74, 44);
	px(g, pierre, x + 35, base - 43, 72, 43);
	for (let i = 0; i < 4; i++) {
		px(g, '#3f4b5a', x + 42 + i * 17, base - 34, 5, 8);
		px(g, '#3f4b5a', x + 42 + i * 17, base - 20, 5, 8);
	}
	for (let r = 0; r < 18; r++) px(g, r % 4 === 0 ? ardoiseClair : ardoise, x + 34 + r, base - 44 - r, 74 - 2 * r, 1); // toit
	for (let i = 0; i < 3; i++) {
		px(g, P.contour, x + 48 + i * 18, base - 56, 8, 10);
		px(g, pierre, x + 49 + i * 18, base - 55, 6, 9);
		px(g, ardoise, x + 49 + i * 18, base - 59, 6, 4);
	}
	// Courtine crénelée devant
	px(g, P.contour, x - 1, base - 25, 150, 25);
	px(g, pierre, x, base - 24, 148, 24);
	px(g, pierreOmbre, x, base - 6, 148, 6);
	for (let k = 0; k < 148; k += 6) px(g, P.contour, x + k + 3, base - 28, 3, 4), px(g, pierre, x + k, base - 28, 3, 4);
	for (let j = 0; j < 3; j++) for (let k = (j % 2) * 5; k < 148; k += 10) px(g, pierreOmbre, x + k, base - 20 + j * 5, 6, 1); // assises
	// Tours rondes (gauche, centre-gauche, droite) avec mâchicoulis
	[[x + 6, 16, 44], [x + 120, 15, 40], [x + 146, 13, 36]].forEach(([tx, r, h]) => {
		px(g, P.contour, tx - r - 1, base - h, 2 * r + 2, h);
		px(g, pierre, tx - r, base - h + 1, 2 * r, h - 1);
		px(g, pierreOmbre, tx + Math.floor(r / 3), base - h + 1, r - Math.floor(r / 3), h - 1); // ombre du fût
		px(g, P.contour, tx - r - 2, base - h - 2, 2 * r + 4, 4);
		px(g, pierre, tx - r - 1, base - h - 1, 2 * r + 2, 2);
		for (let k = -r; k < r; k += 4) px(g, P.contour, tx + k, base - h + 2, 2, 2); // mâchicoulis
		for (let k = -r; k < r; k += 5) px(g, pierre, tx + k, base - h - 5, 3, 3); // créneaux
		px(g, '#3f4b5a', tx - 1, base - h + 12, 2, 4); // archère
	});
	// Pont d'entrée
	px(g, P.contour, x + 62, base - 12, 16, 12);
	px(g, '#5a4632', x + 63, base - 11, 14, 11);
	px(g, '#b9b2a2', x + 58, base - 2, 24, 3);
}

/* Grue Titan jaune (île de Nantes) : tour en treillis et longue flèche horizontale. */
function dessinerGrueTitan(g, x, base, nuit) {
	const jaune = nuit ? '#9c8634' : '#f2c230';
	const jauneOmbre = nuit ? '#6f5f25' : '#c79a1c';
	px(g, P.contour, x + 30, base - 76, 12, 76);
	px(g, jaune, x + 31, base - 75, 10, 75);
	for (let y = base - 72; y < base; y += 8) {
		px(g, jauneOmbre, x + 31, y, 10, 1);
		for (let k = 0; k < 8; k++) px(g, jauneOmbre, x + 31 + k, y + k, 1, 1);
	}
	px(g, P.contour, x - 20, base - 84, 112, 8); // flèche
	px(g, jaune, x - 19, base - 83, 110, 6);
	for (let k = -18; k < 90; k += 6) px(g, jauneOmbre, x + k, base - 83, 1, 6);
	px(g, P.contour, x + 26, base - 96, 20, 12); // cabine / contrepoids
	px(g, jaune, x + 27, base - 95, 18, 10);
	px(g, '#3f4b5a', x + 30, base - 92, 6, 4);
	px(g, P.contour, x + 82, base - 76, 1, 30); // câble
	px(g, '#3c4450', x + 79, base - 46, 7, 4); // crochet
}

function dessinerMontantsBaie(g) {
	// Baie vitrée toute hauteur, montants fins en aluminium sombre
	// Prompt 32 : menuiseries blanches (aluminium laqué), ombre grise d'un côté
	for (let x = 0; x <= BW; x += 120) {
		px(g, '#eef0f1', x - 2, 9, 4, BAIE_BAS - 9);
		px(g, '#b9bec4', x + 1, 9, 1, BAIE_BAS - 9);
	}
	px(g, '#eef0f1', 0, 9, BW, 2);
	px(g, '#b9bec4', 0, 11, BW, 1);
	g.fill(255, 255, 255, 26); // reflets en diagonale
	for (let k = 0; k < 4; k++) g.quad(30 + k * 120, 12, 46 + k * 120, 12, 6 + k * 120, BAIE_BAS, -10 + k * 120, BAIE_BAS);
}

// Prompt 31 : pan de mur à droite de la baie, horloge murale (heure du jeu) et applique (la lampe du prompt 29)
const MUR_DROIT_X = 420;
const HORLOGE_MURALE = { x: 440, y: 44, r: 13 };
function dessinerMurDroit(g) {
	px(g, '#f4f5f6', MUR_DROIT_X, 9, BW - MUR_DROIT_X, BAIE_BAS - 9);
	px(g, '#b9bec4', MUR_DROIT_X - 2, 9, 3, BAIE_BAS - 9); // dormant de la baie (laqué clair, prompt 32)
	px(g, '#dfe2e5', MUR_DROIT_X + 1, 9, 2, BAIE_BAS - 9); // ombre du dormant
	// Horloge murale ronde : cadran blanc, contour sombre, aiguilles à l'heure du jeu
	const h = HORLOGE_MURALE;
	disque(g, h.x + 1, h.y + 2, h.r + 1, '#c8cdd2'); // ombre portée
	disque(g, h.x, h.y, h.r + 1, P.contour);
	disque(g, h.x, h.y, h.r - 1, '#ffffff');
	for (let k = 0; k < 12; k++) {
		const a = (k / 12) * Math.PI * 2;
		px(g, k % 3 ? '#9aa1a8' : P.contour, h.x + Math.round(Math.sin(a) * (h.r - 3)), h.y - Math.round(Math.cos(a) * (h.r - 3)), 1, 1);
	}
	const hA = heureAffichee();
	const aiguille = (angle, long, c) => {
		for (let i = 0; i <= long; i++) px(g, c, h.x + Math.round(Math.sin(angle) * i), h.y - Math.round(Math.cos(angle) * i), 1, 1);
	};
	aiguille((((hA.h % 12) + hA.m / 60) / 12) * Math.PI * 2, h.r - 7, P.contour);
	aiguille((hA.m / 60) * Math.PI * 2, h.r - 4, P.contour);
	px(g, '#d4031c', h.x, h.y, 1, 1);
	// Applique murale (lampe interactive) : cylindre sombre, flux de lumière chaude sur le mur
	const lampe = typeof OBJETS_BUREAU !== 'undefined' ? OBJETS_BUREAU.find((o) => o.nom === 'lampe') : null;
	if (!lampe) return;
	const lx = lampe.x + lampe.l / 2;
	const allumee = typeof PIECE === 'undefined' || PIECE.lampe;
	if (allumee) {
		g.fill(255, 226, 160, 46);
		g.quad(lx - 4, lampe.y + lampe.h, lx + 4, lampe.y + lampe.h, lx + 14, BAIE_BAS, lx - 14, BAIE_BAS);
		g.quad(lx - 3, lampe.y, lx + 3, lampe.y, lx + 8, lampe.y - 18, lx - 8, lampe.y - 18);
	}
	boite(g, lx - 4, lampe.y + 2, 8, lampe.h - 4, '#2c3036', '#4a5058', '#1a1d21');
	px(g, '#9aa1a8', lx - 1, lampe.y + lampe.h / 2, 2, 1); // patère
	if (allumee) px(g, '#fff3c4', lx - 3, lampe.y + lampe.h - 2, 6, 1);
}

/** Prompt 29 : store vénitien baissé sur la baie (lames claires, la ville reste visible entre les lames) */
function dessinerStore(g) {
	const lb = MUR_DROIT_X; // prompt 31 : la baie s'arrête au pan de mur de droite
	px(g, '#c8cdd2', 0, 9, lb, 4); // caisson
	for (let y = 14; y < BAIE_BAS - 2; y += 5) {
		px(g, '#eef0f1', 0, y, lb, 3);
		px(g, '#c8cdd2', 0, y + 3, lb, 1);
	}
	for (let x = 60; x < lb; x += 120) px(g, '#9aa1a8', x, 13, 1, BAIE_BAS - 15); // cordons
	px(g, '#8d949b', 0, BAIE_BAS - 3, lb, 2); // barre de charge
}

/** Prompt 29 : lampe éteinte → la pièce s'assombrit légèrement (l'écran du PC, dessiné après, n'est pas touché) */
function dessinerAmbianceLampe(g) {
	if (typeof PIECE === 'undefined' || PIECE.lampe) return;
	g.fill(18, 22, 40, 34); // prompt 32 : sur les murs blancs, toute la pièce s'assombrit un peu
	g.rect(0, 0, BW, BH);
	g.fill(18, 22, 40, 18);
	g.rect(MUR_DROIT_X, 9, BW - MUR_DROIT_X, BAIE_BAS - 9);
}

function dessinerMurBas(g) {
	px(g, '#d3d6d9', 0, BAIE_BAS, BW, 3); // appui de baie clair (prompt 32)
	px(g, '#f6f7f8', 0, BAIE_BAS + 3, BW, PLATEAU_Y - BAIE_BAS - 3);
	px(g, '#e3e6e9', 0, PLATEAU_Y - 4, BW, 4);
}

function dessinerPlateau(g) {
	// Plateau en chêne clair, en perspective : bord arrière étroit, bord avant hors champ
	for (let y = PLATEAU_Y; y < BH; y++) {
		const t = (y - PLATEAU_Y) / (BH - PLATEAU_Y);
		const demi = 210 + t * 70;
		// Prompt 32 : plateau stratifié blanc cassé, reflets très légers (le bois ne reste qu'en chant arrière)
		px(g, '#f1ede6', 240 - demi, y, demi * 2, 1);
		for (let i = -6; i <= 6; i++) {
			const gx = 240 + i * (demi / 6.5);
			if (bruit(i, y) > 0.7) px(g, '#e6e0d6', gx, y, 1 + Math.round(t * 2), 1);
		}
	}
	px(g, '#9aa1a8', 30, PLATEAU_Y - 1, 420, 1);
	px(g, '#d8b489', 30, PLATEAU_Y, 420, 2); // chant en chêne clair : le seul détail bois
	px(g, '#e6e0d6', 0, PLATEAU_Y, 30, 1);
}

function dessinerPC(g) {
	// Écran moderne, bord fin noir, pied en aluminium
	const e = ECRAN_PC;
	px(g, '#9aa1a8', BW / 2 - 4, e.y + e.h + 4, 8, PLATEAU_Y + 10 - (e.y + e.h + 4));
	px(g, '#c8cdd2', BW / 2 - 3, e.y + e.h + 4, 3, PLATEAU_Y + 10 - (e.y + e.h + 4));
	ombreTramee(g, BW / 2 - 30, PLATEAU_Y + 13, 60, 3, 110);
	boite(g, BW / 2 - 28, PLATEAU_Y + 8, 56, 5, '#b8bec4', '#dfe3e6', '#8d949b');
	px(g, P.contour, e.x - 4, e.y - 4, e.l + 8, e.h + 10);
	px(g, '#16181b', e.x - 3, e.y - 3, e.l + 6, e.h + 8);
	px(g, '#0a0b0c', e.x, e.y, e.l, e.h);
	px(g, PC.etat === 'eteint' ? '#7d1a15' : '#3fb950', e.x + e.l / 2 - 1, e.y + e.h + 2, 2, 1); // voyant
}

function dessinerObjetsBureau(g) {
	// Clavier (perspective), souris, tasse, lampe, téléphone, horloge de bureau, dossiers, petite plante
	for (let y = 196; y < 222; y++) {
		const t = (y - 196) / 26;
		const demi = 64 + t * 14;
		px(g, y === 196 || y === 221 ? P.contour : '#2c3036', 240 - demi, y, demi * 2, 1);
		if (y > 198 && y < 219 && (y - 199) % 5 < 3) for (let k = -demi + 4; k < demi - 6; k += 7 + t * 2) px(g, '#4a5058', 240 + k, y, 5 + t * 2, 1);
	}
	ombreTramee(g, 176, 222, 128, 3, 90);
	boite(g, 330, 206, 13, 18, '#2c3036', '#4a5058', '#1a1d21'); // souris
	px(g, '#4a5058', 336, 207, 1, 5);
	// Tasse (gauche)
	boite(g, 120, 188, 14, 18, '#f7f1e1', '#ffffff', '#d8cfb6');
	px(g, P.contour, 134, 192, 4, 1);
	px(g, P.contour, 137, 192, 1, 8);
	px(g, P.contour, 134, 199, 4, 1);
	px(g, '#5a3b26', 121, 189, 12, 2);
	if (!reduireAnimations) {
		const t = Math.floor(millis() / 300);
		g.fill(255, 255, 255, 110);
		for (let k = 0; k < 3; k++) g.rect(124 + k * 3 + ((t + k) % 2), 180 - k * 3 - (t % 3), 1, 3);
	}
	// Prompt 31 : la lampe d'architecte devient une applique murale (dessinerMurDroit), l'horloge passe au mur
	// Smartphone posé (droite)
	boite(g, 368, 196, 14, 24, '#16181b', '#2c3036', '#0a0b0c');
	px(g, '#1d5f6e', 370, 199, 10, 16);
	// Pile de dossiers (droite, au fond)
	for (let i = 0; i < 4; i++) boite(g, 392 + (i % 2), 172 - i * 3, 40, 2, i % 2 ? '#dfe7ef' : '#ffffff', '#ffffff', '#9aa8b6'); // chemises claires (prompt 32)
	px(g, P.rouge, 418, 163, 8, 1);
	// Petite plante grasse (gauche, au fond)
	boite(g, 70, 164, 14, 10, '#e8e9ea', '#ffffff', '#c3c7cb');
	feuillage(g, 77, 158, 6);
}

function dessinerLumiere(g) {
	g.fill(255, 240, 200, 18);
	g.quad(0, BAIE_BAS, BW, BAIE_BAS, BW + 60, BH, -60, BH); // lumière du jour sur le plateau
	g.fill(160, 200, 255, 12);
	g.rect(ECRAN_PC.x - 20, ECRAN_PC.y + ECRAN_PC.h, ECRAN_PC.l + 40, 40); // lueur de l'écran
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
				g.fill(28, 32, 40, Math.round(p.alpha * 0.8)); // prompt 32 : vignettage neutre (gris bleuté), plus léger sur le blanc
				g.rect(x, y, 1, 1);
			}
	}
	gCible.image(gVignette, 0, 0);
}

// ——— Prompt 25 : dézoom fixe de la vue bureau + caméra fausse 3D (façon FNAF, mouvement subtil) ———
// La pièce est affichée à 88 % : ~6 % de marge de chaque côté à 1920×1080 (115 px), où l'on voit le
// « fond » (la pièce elle-même, assombrie et plus lointaine). Quand la souris sort du cadre de l'écran
// du PC (ou qu'une flèche est maintenue), la caméra regarde doucement de ce côté : la pièce glisse
// d'au plus 12 px, le fond de 5 px (parallaxe = profondeur). Retour au centre : recentrage progressif.
// Animations réduites, vue au poste, zooms, fenêtres ouvertes : caméra strictement centrée.
const DEZOOM = 0.88;
// Prompt 31 : cadrage « sur la chaise » — on ne montre que la partie centrale de la pièce (16:9, centrée
// sur le PC) : le poste est plus proche, les accoudoirs du fauteuil sortent du champ.
const CADRAGE = { x: 24, y: 6, l: 432, h: 243 };
const CAMERA = { max: 12, maxFond: 5, lissage: 0.1, x: 0, y: 0 };
let sourisDansCanevas = false; // pas de caméra tant que la souris n'a pas bougé sur le canevas (touch, chargement)

function origineBureau() {
	// Cadre de la pièce sur le canevas (dézoom + caméra) et taille d'un pixel art (u) dans ce cadre
	return { x: (L * (1 - DEZOOM)) / 2 + CAMERA.x, y: (H * (1 - DEZOOM)) / 2 + CAMERA.y, k: DEZOOM, u: (L * DEZOOM) / CADRAGE.l };
}
/** Prompt 32 : contour de survol / focus double — trait sombre #1c2733 (15:1 sur les murs blancs) doublé de jaune */
function contourSurvol(x, y, l, h) {
	noFill();
	stroke('#1c2733');
	strokeWeight(PIX + 4);
	rect(x, y, l, h);
	stroke('#f2c94c');
	strokeWeight(PIX);
	rect(x, y, l, h);
	noStroke();
}

/** Rectangle en coordonnées pixel art (480×270) → pixels du canevas, en vue bureau (cadrage + dézoom + caméra). */
function versEcranBureau(x, y, l, h) {
	const o = origineBureau();
	return { x: o.x + (x - CADRAGE.x) * o.u, y: o.y + (y - CADRAGE.y) * o.u, l: (l || 0) * o.u, h: (h || 0) * o.u };
}

/** Flèches maintenues (←→↑↓) → direction, sauf si le focus est dans un champ ou un menu. */
function directionFleches() {
	const actif = document.activeElement;
	if (actif && actif !== document.body && !(actif instanceof HTMLCanvasElement)) return null;
	if (fenetre || smsActif || (phase === 'reveil' && reveil)) return null;
	const dx = (keyIsDown(RIGHT_ARROW) ? 1 : 0) - (keyIsDown(LEFT_ARROW) ? 1 : 0);
	const dy = (keyIsDown(DOWN_ARROW) ? 1 : 0) - (keyIsDown(UP_ARROW) ? 1 : 0);
	return dx || dy ? { x: dx, y: dy } : null;
}

/** Met à jour la caméra (appelé une fois par image, avant la composition). */
function majCamera() {
	let cx = 0;
	let cy = 0;
	if (vue === 'bureau' && !reduireAnimations && !fenetre && !smsActif) {
		const f = directionFleches();
		if (f) {
			cx = -f.x;
			cy = -f.y;
		} else if (sourisDansCanevas) {
			const e = rectEcranPC();
			const dedans = mouseX >= e.x && mouseX <= e.x + e.l && mouseY >= e.y && mouseY <= e.y + e.h;
			if (!dedans) {
				// On regarde vers la souris : la pièce glisse dans l'autre sens, proportionnellement à l'écart au centre
				cx = -constrain((mouseX - L / 2) / (L / 2), -1, 1);
				cy = -constrain((mouseY - H / 2) / (H / 2), -1, 1);
			}
		}
	}
	if (reduireAnimations) {
		CAMERA.x = 0;
		CAMERA.y = 0;
		return;
	}
	const n = Math.hypot(cx, cy);
	if (n > 1) (cx /= n), (cy /= n); // diagonale bornée elle aussi
	const k = 1 - Math.pow(1 - CAMERA.lissage, Math.min(deltaTime || 16, 100) / 16.7); // easing indépendant du nombre d'images/s
	CAMERA.x += (cx * CAMERA.max - CAMERA.x) * k;
	CAMERA.y += (cy * CAMERA.max - CAMERA.y) * k;
	if (Math.abs(CAMERA.x) < 0.05) CAMERA.x = 0;
	if (Math.abs(CAMERA.y) < 0.05) CAMERA.y = 0;
}

/** Fond visible autour de la pièce dézoomée : la pièce elle-même, plus grande, assombrie, qui bouge moins. */
function dessinerFondBureau(echelle) {
	if (vue === 'poste') return;
	const p = CAMERA.max ? CAMERA.maxFond / CAMERA.max : 0;
	const s = 1.04;
	image(gBureau, (L - L * s) / 2 + CAMERA.x * p, (H - H * s) / 2 + CAMERA.y * p, L * s, H * s);
	noStroke();
	fill(12, 16, 22, 215);
	rect(0, 0, L, H);
}

// ——— Composition : pièce + écran du PC (bureau, zoom, poste) ———
/** Écran du PC à l'échelle 1 (sans dézoom) : référence pour placer la pièce autour de n'importe quel rectangle d'écran */
function rectEcranBase() {
	return { x: ECRAN_PC.x * PIX, y: ECRAN_PC.y * PIX, l: ECRAN_PC.l * PIX, h: ECRAN_PC.h * PIX };
}
/** Écran du PC tel qu'il est vu en vue bureau (dézoom + caméra) */
function rectEcranPC() {
	return versEcranBureau(ECRAN_PC.x, ECRAN_PC.y, ECRAN_PC.l, ECRAN_PC.h);
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
	majCamera();
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
	// Pièce : dézoomée au bureau (prompt 25), agrandie autour du moniteur au poste (et pendant le zoom)
	const e = rectEcranBase();
	const echelle = r.l / e.l;
	clear();
	background(P.contour);
	drawingContext.imageSmoothingEnabled = false;
	const ox = r.x - e.x * echelle;
	const oy = r.y - e.y * echelle;
	dessinerFondBureau(echelle);
	// Prompt 31 : la pièce n'est montrée que dans son cadrage (découpe qui grandit avec le zoom vers le poste)
	const cadre = { x: ox + CADRAGE.x * PIX * echelle, y: oy + CADRAGE.y * PIX * echelle, l: CADRAGE.l * PIX * echelle, h: CADRAGE.h * PIX * echelle };
	const decoupe = vue !== 'poste' && (cadre.x > 0 || cadre.y > 0 || cadre.x + cadre.l < L || cadre.y + cadre.h < H);
	if (decoupe) {
		// Ombre portée de la pièce sur le fond : elle se détache comme un plan plus proche
		noStroke();
		fill(0, 0, 0, 90);
		rect(cadre.x + 6, cadre.y + 10, cadre.l, cadre.h);
		fill(P.contour);
		rect(cadre.x - PIX, cadre.y - PIX, cadre.l + 2 * PIX, cadre.h + 2 * PIX);
		drawingContext.save();
		drawingContext.beginPath();
		drawingContext.rect(cadre.x, cadre.y, cadre.l, cadre.h);
		drawingContext.clip();
	}
	const flou = (tempsCompresse() && vue === 'bureau') || auPoste;
	if (flou && !reduireAnimations) drawingContext.filter = auPoste ? 'blur(2px) brightness(0.85)' : 'blur(1.5px)';
	push();
	translate(ox, oy);
	scale(echelle);
	image(gBureau, 0, 0, L, H);
	pop();
	if (decoupe) drawingContext.restore();
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
	if (auPoste && Jeu.modificateurActif && Jeu.modificateurActif() === 'erreur_systeme') glitchEcran(r);

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
		dessinerBoutonQuitterPC();
		return;
	}
	// Au bureau : survol de l'écran, objets, horloge numérique, invitation
	survolEcran = mouseX >= r.x && mouseX <= r.x + r.l && mouseY >= r.y && mouseY <= r.y + r.h;
	if (survolEcran || focusBureau === 0) {
		contourSurvol(r.x - 7 * PIX, r.y - 7 * PIX, r.l + 14 * PIX, r.h + 15 * PIX);
	}
	boutons.push({ x: r.x - 5 * PIX, y: r.y - 5 * PIX, l: r.l + 10 * PIX, h: r.h + 11 * PIX, action: sAsseoir });
	zonesObjetsBureau();
	if (ecran === 'jeu' && phase !== 'fin') {
		const hA = heureAffichee();
		textFont(POLICE_DONNEES);
		textSize(22);
		const lib = String(hA.h).padStart(2, '0') + ':' + String(hA.m).padStart(2, '0') + (tempsCompresse() ? '  ▶▶ ×' + IMMERSION.compression : '');
		const lh = textWidth(lib) + 24;
		const ph = versEcranBureau(HORLOGE_MURALE.x, HORLOGE_MURALE.y + HORLOGE_MURALE.r + 6); // prompt 31 : sous l'horloge murale
		fill(28, 39, 51, 220);
		rect(ph.x - lh / 2, ph.y, lh, 34, 6);
		fill('#FFFDF7');
		textAlign(CENTER, CENTER);
		text(lib, ph.x, ph.y + 17);
	}
	const msg = incidentActif()
		? t('bureau.incident')
		: phase === 'mail'
			? t('bureau.mail')
			: t('bureau.installer');
	textFont(POLICE_DONNEES);
	textSize(22);
	const lm = textWidth(msg) + 40;
	fill(28, 39, 51, 220);
	rect((L - lm) / 2, H - 76, lm, 48, 8);
	fill('#FFFDF7');
	textAlign(CENTER, CENTER);
	text(msg, L / 2, H - 52);
}

// ——— Prompt 26 : sortir du PC — bouton « Quitter le PC », molette, porte du bureau ———
let focusQuitter = false; // focus clavier sur le bouton « Quitter le PC » (Tab au poste)
let dernierScrollSortie = 0;
let cumulScroll = 0;
const BOUTON_QUITTER = { l: 340, h: 56, marge: 40 };

function rectBoutonQuitter() {
	return { x: L - BOUTON_QUITTER.l - BOUTON_QUITTER.marge, y: H - BOUTON_QUITTER.h - 22, l: BOUTON_QUITTER.l, h: BOUTON_QUITTER.h };
}
/** Bouton visible au poste, sous le moniteur à droite (dans la pièce, hors de l'écran du PC). */
function dessinerBoutonQuitterPC() {
	const b = rectBoutonQuitter();
	if (clignement) return; // pendant qu'on se lève, le bouton disparaît
	bouton(b.x, b.y, b.l, b.h, t('poste.quitter_pc'), quitterPC);
	if (focusQuitter) {
		noFill();
		stroke('#f2c94c');
		strokeWeight(4);
		rect(b.x - 8, b.y - 8, b.l + 16, b.h + 16, 14);
		noStroke();
	}
}
function quitterPC() {
	focusQuitter = false;
	seLever();
}
function basculerFocusQuitter(actif) {
	focusQuitter = actif;
	if (actif) annoncer(t('poste.quitter_pc_focus'));
}
/** Molette au poste : quitte le PC, avec anti-rebond (600 ms) et un seuil, pour qu'un scroll continu ne fasse rien d'autre. */
function scrollSortiePC(delta) {
	if (vue !== 'poste' || clignement || fenetre || smsActif || PC.fenetre || phase === 'mail' || phase === 'reveil') {
		cumulScroll = 0;
		return false;
	}
	const maintenant = millis();
	if (maintenant - dernierScrollSortie < 600) return true; // anti-rebond : on « avale » le reste du geste
	cumulScroll += Math.abs(delta);
	if (cumulScroll < 100) return true;
	cumulScroll = 0;
	dernierScrollSortie = maintenant;
	quitterPC();
	return true;
}

/** Porte de sortie dessinée sur le mur de gauche, en perspective (pixel art, aucun fichier image). */
function dessinerPorte(g) {
	const o = OBJETS_BUREAU.find((x) => x.nom === 'porte');
	if (!o) return;
	// Pan de mur latéral (blanc) qui fuit vers la baie
	const finMur = o.x + o.l + 6;
	for (let x = 0; x < finMur; x++) {
		const haut = 9 + Math.round(Math.max(0, x - CADRAGE.x) * 0.6);
		px(g, x === finMur - 1 ? '#b9bec4' : '#eef0f1', x, haut, 1, PLATEAU_Y - haut);
	}
	// Porte en perspective : bord proche plus haut que le bord lointain
	for (let x = o.x; x < o.x + o.l; x++) {
		const d = x - o.x;
		const haut = o.y + Math.round(d * 0.6);
		const bas = o.y + o.h - Math.round(d * 0.3);
		px(g, P.contour, x, haut - 1, 1, bas - haut + 2);
		if (x > o.x && x < o.x + o.l - 1) px(g, d < 3 ? '#c8cdd2' : '#f7f8f9', x, haut, 1, bas - haut); // porte blanche (prompt 32)
	}
	px(g, '#b9bec4', o.x + 4, o.y + 10, 1, o.h - 22); // joint vertical (ouvrant)
	px(g, P.contour, o.x + o.l - 6, o.y + Math.round(o.h * 0.5), 4, 3); // poignée
	px(g, '#c8cdd2', o.x + o.l - 6, o.y + Math.round(o.h * 0.5), 3, 1);
	// Pictogramme « sortie » : flèche verte au-dessus de la porte
	px(g, P.contour, o.x + 3, o.y - 9, 15, 7);
	px(g, '#1f7a3f', o.x + 4, o.y - 8, 13, 5);
	px(g, '#ffffff', o.x + 7, o.y - 6, 6, 1);
	px(g, '#ffffff', o.x + 12, o.y - 7, 1, 3);
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
	focusQuitter = false;
	if (typeof PC !== 'undefined') PC.fenetre = null; // prompt 22 : se lever referme l'app ouverte
	clignement = { debut: millis(), sens: 'arriere', bascule: false }; // la vue bascule à mi-clignement
	Confort.Son.bip('choix');
}

/** Prompt 23 : « erreur système » — bandes de l'écran décalées (≤ 3 changements/s, sans flash) ;
 * animations réduites : icône d'erreur fixe à la place. */
function glitchEcran(r) {
	const src = copieHaute;
	if (!reduireAnimations) {
		const graine = Math.floor(millis() / 400); // 2,5 changements par seconde
		for (let i = 0; i < 4; i++) {
			const a = Math.abs(Math.sin(graine * 12.9898 + i * 78.233) * 43758.5453) % 1;
			const b = Math.abs(Math.sin(graine * 4.1414 + i * 19.19) * 1234.567) % 1;
			const sy = a * src.height * 0.92;
			const sh = src.height * 0.05;
			drawingContext.drawImage(src, 0, sy, src.width, sh, r.x + (b - 0.5) * 48, r.y + (sy / src.height) * r.h, r.l, (sh / src.height) * r.h);
		}
	}
	noStroke();
	fill(DS.erreur);
	rect(r.x + r.l - 380, r.y + 16, 364, 44);
	fill(DS.blanc);
	textFont(DS.policeTexte);
	textSize(18);
	textAlign(LEFT, CENTER);
	text(t('bureau.erreur', { action: Jeu.REGLAGES.effets[Jeu.modificateur.actionBloquee].nom }), r.x + r.l - 368, r.y + 38);
}
