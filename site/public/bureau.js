/* Nantes en régulation — la pièce de régulation en pixel art (vue d'entrée du jeu).
 * Vue depuis la chaise, plein écran (bords coupés, flous et vignettés), baie sur la Loire,
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
// Prompt 43 : au poste, l'écran du PC occupe 90 % du canevas (10 % de « non-écran »), surtout moins d'espace dessous
const ECRAN_POSTE = { x: (L - 1728) / 2, y: 40, l: 1728, h: 972 };

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
	M: '101111111101101', // prompt 34 (livre « COMMANDE »)
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
/* Prompt 40 : la pièce est dessinée en PLANS (calques transparents 480×270), chacun décalé avec la caméra
   selon son propre coefficient (k × décalage) : le lointain bouge peu, les objets proches un peu plus.
   k = 1 est la référence (plateau, écran du PC). Avec une caméra à 0 (poste, zoom, animations réduites),
   tous les plans sont alignés. gBureau reste l'image composée (menu principal, poste, bords flous). */
const COUCHES_PIECE = [
	{ nom: 'lointain', k: 0.35, dessin: (g) => dessinerVueNantes(g) }, // ciel, ville, grue, Loire, péniche, pluie
	{
		nom: 'baie',
		k: 0.7,
		dessin: (g) => {
			dessinerPlafondEtBaie(g);
			dessinerMontantsBaie(g);
			if (typeof PIECE !== 'undefined' && PIECE.store) dessinerStore(g); // prompt 29
			dessinerMurDroit(g); // prompt 31 : pan de mur blanc, horloge murale, applique
			dessinerMurBas(g);
		},
	},
	{
		nom: 'plateau',
		k: 1,
		dessin: (g) => {
			dessinerPlateau(g);
			dessinerPC(g);
			dessinerLumiere(g);
		},
	},
	{ nom: 'fond', k: 1.1, dessin: (g) => dessinerObjetsDuFond(g) }, // clavier, dossiers, plante
	{ nom: 'proche', k: 1.25, dessin: (g) => dessinerObjetsProches(g) }, // souris, tasse, téléphone, livres
	{
		nom: 'voile',
		k: 1,
		dessin: (g) => {
			dessinerEclairage(g); // prompt 51 : lampe, stores et heure assombrissent vraiment la pièce ; halo de l'écran
			if (typeof dessinerPersonnageSieste === 'function') dessinerPersonnageSieste(g);
		},
	},
];
/** Coefficient de plan des objets cliquables : leurs zones suivent leur plan */
const COEF_OBJETS = { rapport: 1.25, commande: 1.25, stress: 1.25, tasse: 1.25, telephone: 1.25, plante: 1.1, dossiers: 1.1, lampe: 0.7, fenetre: 0.7, horloge: 0.7, sablier: 1.1 }; // prompt 51 : horloge (mur), sablier (fond du plateau)

function dessinerPieceBureau() {
	COUCHES_PIECE.forEach((c) => {
		if (!c.g) {
			c.g = createGraphics(BW, BH);
			c.g.pixelDensity(1);
			c.g.noSmooth();
		}
		c.g.clear();
		c.g.noStroke();
		c.dessin(c.g);
	});
	gBureau.clear();
	COUCHES_PIECE.forEach((c) => gBureau.image(c.g, 0, 0));
}

function dessinerPlafondEtBaie(g) {
	px(g, '#eef0f1', 0, 0, BW, 8); // plafond blanc (prompt 32)
	px(g, '#ffffff', 120, 2, 240, 3); // bandeau lumineux
	px(g, '#c8cdd2', 0, 8, BW, 1);
}

/* Prompt 45 : la météo vue par la baie change PROGRESSIVEMENT. Deux facteurs lissés (0 → 1) :
   nuit (suivant l'heure simulée, avec aube 6 h–7 h 30 et crépuscule 19 h 30–21 h) et pluie (≥ 1 mm le jour joué).
   Ils convergent en quelques secondes (constante de temps 2,5 s) ; animations réduites : changement direct. */
const METEO_VISU = { nuit: null, pluie: null, t: 0 };
function melange(a, b, k) {
	if (k <= 0) return a;
	if (k >= 1) return b;
	return lerpColor(color(a), color(b), k).toString('#rrggbb');
}
function facteurNuit() {
	const hA = heureAffichee();
	const h = hA.h + hA.m / 60;
	if (h < 6 || h >= 21) return 1;
	if (h < 7.5) return 1 - (h - 6) / 1.5; // aube
	if (h >= 19.5) return (h - 19.5) / 1.5; // crépuscule
	return 0;
}
function majMeteoVisuelle(nuitCible, pluieCible) {
	const V = METEO_VISU;
	const maintenant = millis();
	if (V.nuit === null || reduireAnimations) {
		V.nuit = nuitCible;
		V.pluie = pluieCible;
	} else {
		const k = 1 - Math.exp(-Math.min(500, maintenant - V.t) / 2500);
		V.nuit += (nuitCible - V.nuit) * k;
		V.pluie += (pluieCible - V.pluie) * k;
	}
	V.t = maintenant;
}
function dessinerVueNantes(g) {
	const m = typeof meteoFenetre === 'function' ? meteoFenetre() : Jeu.meteoActuelle; // météo du jour joué (comme la fenêtre)
	majMeteoVisuelle(facteurNuit(), m && m.pluie_mm >= 1 ? 1 : 0);
	const nuit = METEO_VISU.nuit;
	const pluie = METEO_VISU.pluie;
	const haut = melange(melange('#79b4de', '#7f8c99', pluie), '#141d33', nuit);
	const bas = melange(melange('#c6e4f3', '#a9b3bb', pluie), '#2b3757', nuit);
	for (let y = 9; y < BAIE_BAS; y++) px(g, y < 70 ? haut : y < 110 ? melange(haut, bas, (y - 70) / 40) : bas, 0, y, BW, 1);
	// Soleil (s'efface avec la nuit et la pluie) et lune (apparaît avec la nuit)
	const soleil = (1 - nuit) * (1 - pluie);
	if (soleil > 0.02) {
		disque(g, 410, 34, 10, melange(haut, '#f6d76b', soleil));
		disque(g, 408, 32, 5, melange(haut, '#fbeaa4', soleil));
	}
	if (nuit > 0.02) disque(g, 410, 30, 7, melange(haut, '#efe8cf', nuit));
	// Nuages : trois toujours, deux de plus qui apparaissent avec la pluie
	for (let n = 0; n < 5; n++) {
		const k = n < 3 ? 1 : pluie;
		if (k < 0.05) continue;
		const nx = 30 + n * 90;
		const ny = 26 + (n % 2) * 12;
		const c1 = melange(haut, melange('#f4f8fb', '#9aa4ad', pluie), k);
		const c2 = melange(haut, melange('#ffffff', '#aeb7bf', pluie), k);
		disque(g, nx, ny, 6, c1);
		disque(g, nx + 9, ny - 3, 8, c2);
		disque(g, nx + 18, ny, 5, c1);
	}
	// Ville lointaine, lumières qui s'allument progressivement
	const immeuble = melange('#8b96a3', '#0f1626', nuit);
	[18, 26, 14, 30, 22, 34, 16, 28, 20, 36, 24, 18, 30, 22, 26, 16, 32, 20, 24, 28].forEach((t, i) => {
		px(g, immeuble, i * 24, 118 - t, 24, t + 4);
		if (nuit > 0.05) for (let k = 0; k < 3; k++) px(g, melange(immeuble, '#e8c46a', nuit), i * 24 + 4 + k * 6, 122 - t + k * 5, 2, 2);
	});
	dessinerGrueTitan(g, 344, HORIZON_VILLE, nuit);
	dessinerLoire(g, nuit, pluie, haut, bas);
	if (pluie > 0.02) dessinerPluie(g, m, nuit > 0.5, pluie);
}

/* Prompt 38 : pluie aléatoire et réaliste. Gouttes tirées une fois (graine fixe, pas de motif répété) :
   longueur, vitesse, opacité et phase propres ; densité selon la pluie réelle du jour (pluie_mm),
   inclinaison selon les rafales réelles (rafales_max) ; quelques gouttes posées sur la vitre qui
   glissent lentement. Animations réduites : pluie figée, deux fois moins dense. */
let GOUTTES = null;
let GOUTTES_VITRE = null;
function aleaPluie(graine) {
	let a = graine >>> 0;
	return () => {
		a = (a * 1664525 + 1013904223) >>> 0;
		return a / 4294967296;
	};
}
function dessinerPluie(g, m, nuit, intensite) {
	if (!GOUTTES) {
		const r = aleaPluie(44000);
		GOUTTES = Array.from({ length: 220 }, () => ({ x: r() * (BW + 60) - 30, p: r(), v: 0.55 + r() * 0.9, l: 2 + Math.floor(r() * 5), a: 50 + Math.floor(r() * 110), proche: r() < 0.18 }));
		GOUTTES_VITRE = Array.from({ length: 26 }, () => ({ x: Math.floor(r() * MUR_DROIT_X), y0: 12 + r() * (BAIE_BAS - 30), v: 0.002 + r() * 0.006, p: r(), l: 1 + Math.floor(r() * 3) }));
	}
	const mm = (m && m.pluie_mm) || 1;
	const densite = constrain(0.25 + mm / 10, 0.25, 1) * (reduireAnimations ? 0.5 : 1) * (intensite === undefined ? 1 : intensite); // prompt 45 : la pluie arrive et s'en va progressivement
	const n = Math.round(GOUTTES.length * densite);
	const pente = constrain(((m && m.rafales_max) || 0) / 90, 0, 0.6); // vent → gouttes inclinées
	const tps = reduireAnimations ? 0 : millis() / 1000;
	const haut = 10;
	const course = BAIE_BAS - haut;
	const c = nuit ? [150, 165, 190] : [215, 225, 235];
	for (let i = 0; i < n; i++) {
		const d = GOUTTES[i];
		const vitesse = (d.proche ? 1.6 : 1) * d.v; // gouttes proches plus rapides et plus longues
		const y = haut + ((d.p + tps * vitesse * 1.6) % 1) * course;
		const x = d.x - (y - haut) * pente;
		const l = d.proche ? d.l + 3 : d.l;
		g.fill(c[0], c[1], c[2], d.proche ? Math.min(255, d.a + 40) : d.a);
		for (let k = 0; k < l; k++) g.rect(Math.round(x - k * pente), Math.round(y - k), 1, 1);
	}
	// Gouttes sur la vitre : points clairs qui glissent lentement puis réapparaissent ailleurs
	GOUTTES_VITRE.forEach((v) => {
		const u = (v.p + tps * v.v) % 1;
		const y = v.y0 + u * 30;
		if (y > BAIE_BAS - 3) return;
		g.fill(235, 242, 248, 150 * (1 - u));
		g.rect(v.x, Math.round(y), 1, v.l + 1);
		g.fill(255, 255, 255, 190 * (1 - u));
		g.rect(v.x, Math.round(y) + v.l, 1, 1);
	});
}

/* Grue Titan (île de Nantes) : tour en treillis et longue flèche horizontale.
   Prompt 34 : posée sur la ligne d'horizon des immeubles et de leur couleur (elle se fond dans la ville). */
const HORIZON_VILLE = 122; // bas des immeubles lointains
function dessinerGrueTitan(g, x, base, nuit) {
	// Correctif : grue à l'échelle des immeubles lointains (≈ 40 px de haut, comme les plus hauts) et
	// silhouette pleine, opaque, un ton plus sombre que la ville — plus de treillis « transparent » sur le ciel.
	const fond = melange('#6f7a87', '#0b111d', nuit);
	const trait = melange('#5b6572', '#1a2336', nuit);
	const bord = melange('#4a535e', '#05080f', nuit);
	px(g, bord, x + 19, base - 37, 8, 37); // tour
	px(g, fond, x + 20, base - 36, 6, 36);
	for (let y = base - 34; y < base; y += 5) for (let k = 0; k < 5; k++) px(g, trait, x + 20 + k, y + k, 1, 1); // croisillons, sur fond plein
	px(g, bord, x - 6, base - 42, 60, 5); // flèche
	px(g, fond, x - 5, base - 41, 58, 3);
	for (let k = -4; k < 52; k += 4) px(g, trait, x + k, base - 41, 1, 3);
	px(g, bord, x + 16, base - 49, 13, 8); // cabine / contrepoids
	px(g, fond, x + 17, base - 48, 11, 6);
	px(g, melange('#5f6a78', '#e8c46a', nuit), x + 19, base - 47, 4, 3); // vitre (allumée la nuit)
	px(g, bord, x + 47, base - 37, 1, 14); // câble
	px(g, bord, x + 45, base - 23, 5, 3); // crochet
}

// ——— Prompt 34 : la Loire, dont la hauteur suit la hauteur d'eau réelle (Hub'Eau, station M800001010) ———
// Lecture dans setup() puis toutes les 10 min (jamais dans draw) ; repli : médiane figée de data/loire.js.
const LOIRE_REPLI = window.PXE_LOIRE || { mediane_m: 4.1385, min_m: 0.755, max_m: 6.832 };
const LOIRE = {
	hauteur: LOIRE_REPLI.mediane_m, // m, dernière valeur connue (cible)
	affichee: LOIRE_REPLI.mediane_m, // m, valeur lissée dessinée
	source: 'repli', // 'api' | 'repli'
	date: null,
	url: 'https://hubeau.eaufrance.fr/api/v2/hydrometrie/observations_tr?code_entite=M800001010&grandeur_hydro=H&size=1&sort=desc&fields=date_obs,resultat_obs',
};
function chargerLoire() {
	if (Confort.Reglages.horsLigneForce || typeof fetch !== 'function') return;
	const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
	const minuterie = setTimeout(() => ctrl && ctrl.abort(), 6000);
	fetch(LOIRE.url, ctrl ? { signal: ctrl.signal } : {})
		.then((r) => (r.ok ? r.json() : null))
		.then((d) => {
			const o = d && d.data && d.data[0];
			const h = o ? Number(o.resultat_obs) / 1000 : NaN; // mm → m
			if (Number.isFinite(h) && h > -2 && h < 15) {
				LOIRE.hauteur = h;
				LOIRE.source = 'api';
				LOIRE.date = o.date_obs;
			}
		})
		.catch(() => {}) // hors ligne : on garde la dernière valeur (ou la médiane figée)
		.finally(() => clearTimeout(minuterie));
}
function demarrerLoire() {
	chargerLoire();
	setInterval(chargerLoire, 10 * 60 * 1000);
}
/** Haut de l'eau (y pixel art) : hauteur réelle bornée [min, max] de la période → 8 à 26 px de fleuve */
function niveauLoire() {
	LOIRE.affichee += (LOIRE.hauteur - LOIRE.affichee) * (reduireAnimations ? 1 : 0.08);
	const k = constrain((LOIRE.affichee - LOIRE_REPLI.min_m) / (LOIRE_REPLI.max_m - LOIRE_REPLI.min_m), 0, 1);
	return Math.round(BAIE_BAS - (8 + k * 18));
}
function dessinerLoire(g, nuit, pluie, ciel, cielBas) {
	const yEau = niveauLoire();
	// Rive d'en face : mur de quai sombre entre la ville et l'eau (sa partie visible dit le niveau du fleuve)
	px(g, melange('#6f7884', '#141b2b', nuit), 0, HORIZON_VILLE, BW, yEau - HORIZON_VILLE);
	for (let x = 0; x < BW; x += 16) px(g, melange('#7d8692', '#1b2436', nuit), x, HORIZON_VILLE + 1, 8, 1);
	// L'eau : bande pleine largeur, reflet du ciel en haut, plus sombre vers la baie
	const eau = melange(melange('#4f7f9f', '#5d7180', pluie), '#1b2a44', nuit);
	const eauSombre = melange(melange('#3f6c8a', '#4a5c69', pluie), '#121d33', nuit);
	px(g, eau, 0, yEau, BW, BAIE_BAS - yEau);
	px(g, eauSombre, 0, Math.round((yEau + BAIE_BAS) / 2), BW, BAIE_BAS - Math.round((yEau + BAIE_BAS) / 2));
	px(g, melange(cielBas, '#2e4264', nuit), 0, yEau, BW, 1); // reflet du ciel à la surface
	// Écume et vaguelettes qui dérivent doucement (figées si animations réduites)
	const decal = reduireAnimations ? 0 : Math.floor(millis() / 220);
	for (let r = 0; r < 4; r++) {
		const y = yEau + 3 + r * Math.max(2, Math.floor((BAIE_BAS - yEau - 4) / 4));
		if (y >= BAIE_BAS - 1) break;
		for (let x = -12; x < BW; x += 22) px(g, melange('#9cc3da', '#2e4264', nuit), x + ((decal * (r % 2 ? 1 : -1) + r * 7) % 22 + 22) % 22, y, 6 - (r % 2) * 2, 1);
	}
	// Une péniche qui descend le fleuve (silhouette), pour lire « fleuve navigable »
	const xp = reduireAnimations ? 250 : ((Math.floor(millis() / 160) % (BW + 80)) - 60);
	const yp = yEau + 2;
	px(g, melange('#2f3a46', '#0b111d', nuit), xp, yp, 52, 3); // coque
	px(g, melange('#2f3a46', '#0b111d', nuit), xp + 2, yp + 3, 48, 1);
	px(g, melange('#3c4652', '#0b111d', nuit), xp + 38, yp - 5, 10, 5); // timonerie
	px(g, melange('#9fb3c4', '#e8c46a', nuit), xp + 40, yp - 4, 3, 2);
	px(g, melange('#6a8aa1', '#1b2a44', nuit), xp - 6, yp + 4, 64, 1); // sillage
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
const MUR_DROIT_X = 402; // correctif plein écran : pan de mur rapproché pour rester dans le champ
const HORLOGE_MURALE = { x: 418, y: 44, r: 13 };
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

/* Prompt 29 → 51 : l'assombrissement (lampe, stores, heure) est géré par dessinerEclairage (journee.js) */

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

/* Prompt 34 : souris et téléphone en perspective, comme le clavier — chaque ligne s'élargit vers l'avant
   (bord arrière étroit, bord avant large), avec une ombre tramée sur le plateau. */
// Orientation vers l'écran : les fuyantes du plateau convergent vers (240, POINT_FUITE_Y). Un objet posé à
// droite du clavier est donc légèrement pivoté, son haut penché vers le centre, comme la table elle-même.
const POINT_FUITE_Y = -130; // demi-largeur du plateau = 210 + 0,7 × (y − 170) → nulle à y = −130
function penteVersEcran(cx, yBas) {
	return (cx - 240) / (yBas - POINT_FUITE_Y); // décalage horizontal par ligne
}
/** Décalage horizontal d'une ligne y (absolue) pour un objet de pied (cx, yBas) orienté vers l'écran */
function decalVersEcran(cx, yBas, y) {
	return penteVersEcran(cx, yBas) * (y - yBas);
}
function trapeze(g, cx, y0, h, demi0, demi1, couleur, bord, arrondi, yBas) {
	const pied = yBas === undefined ? y0 + h - 1 : yBas;
	for (let y = 0; y < h; y++) {
		const t = y / Math.max(1, h - 1);
		let demi = demi0 + (demi1 - demi0) * t;
		if (arrondi && (y < arrondi || y >= h - arrondi)) demi -= arrondi - Math.min(y, h - 1 - y); // coins arrondis
		const c = cx + decalVersEcran(cx, pied, y0 + y);
		px(g, bord && (y === 0 || y === h - 1) ? bord : couleur, c - demi, y0 + y, demi * 2, 1);
		if (bord) {
			px(g, bord, c - demi, y0 + y, 1, 1);
			px(g, bord, c + demi - 1, y0 + y, 1, 1);
		}
	}
}
function dessinerSourisPerspective(g, cx, y0) {
	const pied = y0 + 17;
	const d = (y) => cx + decalVersEcran(cx, pied, y);
	ombreObjet(g, Math.round(d(pied)) - 9, y0 + 18, 17); // prompt 51 : ombre selon la lumière
	trapeze(g, cx, y0, 18, 4.5, 7.5, '#2c3036', P.contour, 3);
	px(g, '#4a5058', d(y0 + 2) - 3, y0 + 2, 6, 1); // reflet
	for (let y = y0 + 1; y < y0 + 7; y++) px(g, '#16181b', d(y), y, 1, 1); // séparation des boutons (suit l'inclinaison)
	px(g, '#6b7280', d(y0 + 3) - 1, y0 + 3, 2, 2); // molette
	px(g, '#2c3036', d(y0) - 1, y0 - 3, 1, 3); // départ du câble, vers l'écran
}
/* Téléphone : notification réelle du jeu ? Non — simple animation d'ambiance : l'écran s'allume ~1,5 s toutes
   les 9 s (bulle de notification), avec une petite vibration de 1 px. Animations réduites : écran fixe. */
function dessinerTelephonePerspective(g, cx, y0) {
	const pied = y0 + 26;
	const cycle = reduireAnimations ? 99999 : millis() % 9000;
	const allume = cycle < 1500;
	const vibre = allume && cycle < 450 && Math.floor(millis() / 60) % 2 ? 1 : 0;
	const x = cx + vibre;
	const d = (y) => x + decalVersEcran(cx, pied, y);
	ombreObjet(g, Math.round(d(pied)) - 11, y0 + 27, 21); // prompt 51 : ombre selon la lumière
	trapeze(g, x, y0, 27, 7, 9, '#0a0b0c', P.contour, 1, pied); // coque fine
	trapeze(g, x, y0 + 2, 23, 6, 8, allume ? '#2a8aa0' : '#1d5f6e', null, 0, pied); // écran bord à bord
	for (let y = 0; y < 23; y += 2) px(g, allume ? '#5fb4c6' : '#2a7a8c', d(y0 + 3 + y) - 4 - y * 0.12, y0 + 3 + y, 3, 1); // reflet
	px(g, '#0a0b0c', d(y0 + 3) - 1, y0 + 3, 2, 1); // point caméra
	px(g, '#5f9eb0', d(y0 + 23) - 3, y0 + 23, 6, 1); // barre gestuelle
	if (allume) {
		// Bulle de notification (lignes de texte stylisées, aucune donnée affichée)
		px(g, '#eef6f8', d(y0 + 7) - 5, y0 + 7, 10, 5);
		px(g, '#2a8aa0', d(y0 + 8) - 4, y0 + 8, 2, 2);
		px(g, '#9aa8b6', d(y0 + 8) - 1, y0 + 8, 5, 1);
		px(g, '#c8d2da', d(y0 + 10) - 1, y0 + 10, 4, 1);
	}
}

/* Tasse de thé : thé ambré, sachet dont l'étiquette se balance doucement, volutes de vapeur qui montent. */
function dessinerTasseThe(g) {
	ombreObjet(g, 120, 206, 19); // prompt 51
	boite(g, 120, 188, 14, 18, '#f7f1e1', '#ffffff', '#d8cfb6');
	px(g, P.contour, 134, 192, 4, 1); // anse
	px(g, P.contour, 137, 192, 1, 8);
	px(g, P.contour, 134, 199, 4, 1);
	px(g, '#b5762e', 121, 189, 12, 2); // thé
	px(g, '#d39a52', 123, 189, 4, 1); // reflet du thé
	const tps = reduireAnimations ? 0 : millis();
	const balance = Math.round(Math.sin(tps / 700) * 1.5);
	// Fil du sachet passé par-dessus le bord gauche, étiquette qui pend à l'extérieur (côté opposé à l'anse)
	px(g, '#bfb59c', 122, 186, 1, 3);
	px(g, '#bfb59c', 119, 187, 3, 1);
	px(g, '#bfb59c', 118 + Math.min(0, balance), 188, 1, 4);
	boite(g, 115 + balance, 192, 5, 6, '#f0c35a', '#f8da8c', '#c99a35'); // étiquette
	if (!reduireAnimations) {
		for (let k = 0; k < 3; k++) {
			const p = ((tps / 1600 + k / 3) % 1); // 0 → 1 : la volute monte et s'efface
			g.fill(255, 255, 255, Math.round(140 * (1 - p)));
			const vy = 186 - p * 16;
			g.rect(123 + k * 4 + Math.round(Math.sin(tps / 400 + k * 2) * 1.5), vy, 1, 3);
			g.rect(124 + k * 4 + Math.round(Math.sin(tps / 400 + k * 2 + 1) * 1.5), vy - 3, 1, 2);
		}
	}
}

/* Prompt 40 : objets répartis en deux plans — fond du plateau (clavier, dossiers, plante) et proches */
function dessinerObjetsDuFond(g) {
	// Clavier (perspective)
	for (let y = 196; y < 222; y++) {
		const t = (y - 196) / 26;
		const demi = 64 + t * 14;
		px(g, y === 196 || y === 221 ? P.contour : '#2c3036', 240 - demi, y, demi * 2, 1);
		if (y > 198 && y < 219 && (y - 199) % 5 < 3) for (let k = -demi + 4; k < demi - 6; k += 7 + t * 2) px(g, '#4a5058', 240 + k, y, 5 + t * 2, 1);
	}
	ombreTramee(g, 176, 222, 128, 3, 90);
	// Pile de dossiers (droite, au fond)
	ombreObjet(g, 391, 175, 42); // prompt 51
	for (let i = 0; i < 4; i++) boite(g, 392 + (i % 2), 172 - i * 3, 40, 2, i % 2 ? '#dfe7ef' : '#ffffff', '#ffffff', '#9aa8b6'); // chemises claires (prompt 32)
	px(g, P.rouge, 418, 163, 8, 1);
	// Petite plante grasse (gauche, au fond)
	ombreObjet(g, 70, 174, 15); // prompt 51
	boite(g, 70, 164, 14, 10, '#e8e9ea', '#ffffff', '#c3c7cb');
	dessinerSablier(g); // prompt 51 : sablier entre le pied de l'écran et la souris
	feuillage(g, 77, 158, 6);
}
function dessinerObjetsProches(g) {
	dessinerSourisPerspective(g, 336, 204);
	dessinerTasseThe(g); // tasse de thé animée (sachet, vapeur)
	dessinerTelephonePerspective(g, 376, 194); // prompt 34 : smartphone récent, en perspective
	if (typeof dessinerLivres === 'function') dessinerLivres(g);
	if (typeof dessinerFeuilleRapport === 'function') dessinerFeuilleRapport(g); // prompt 41
}

function dessinerLumiere(g) {
	g.fill(255, 240, 200, 18);
	g.quad(0, BAIE_BAS, BW, BAIE_BAS, BW + 60, BH, -60, BH); // lumière du jour sur le plateau
	g.fill(160, 200, 255, 12);
	g.rect(ECRAN_PC.x - 20, ECRAN_PC.y + ECRAN_PC.h, ECRAN_PC.l + 40, 40); // lueur de l'écran
}

// ——— Prompt 25 : dézoom fixe de la vue bureau + caméra fausse 3D (façon FNAF, mouvement subtil) ———
// Révision du prompt 25 : le jeu occupe TOUT l'écran. La pièce est légèrement plus grande que le canevas
// (SURCADRAGE 1,05 : ~48 px coupés à gauche et à droite, ~27 px en haut et en bas), ce qui laisse à la
// caméra la place de bouger sans jamais montrer de bord. Les extrémités sont adoucies par un vignettage
// et un masque de flou fixes à l'écran (masqueFlouEtVignette). Quand la souris sort du cadre de l'écran
// du PC (ou qu'une flèche est maintenue), la caméra regarde doucement de ce côté (12 px au plus) ;
// retour au centre : recentrage progressif. Animations réduites, poste, zooms, fenêtres : caméra centrée.
const SURCADRAGE = 1.05;
// Prompt 31 : cadrage « sur la chaise » — on ne montre que la partie centrale de la pièce (16:9, centrée
// sur le PC) : le poste est plus proche, les accoudoirs du fauteuil sortent du champ.
const CADRAGE = { x: 24, y: 6, l: 432, h: 243 };
const CAMERA = { max: 12, lissage: 0.1, x: 0, y: 0 };
let sourisDansCanevas = false; // pas de caméra tant que la souris n'a pas bougé sur le canevas (touch, chargement)

function origineBureau() {
	// Cadre de la pièce sur le canevas (dézoom + caméra) et taille d'un pixel art (u) dans ce cadre
	return { x: (L * (1 - SURCADRAGE)) / 2 + CAMERA.x, y: (H * (1 - SURCADRAGE)) / 2 + CAMERA.y, k: SURCADRAGE, u: (L * SURCADRAGE) / CADRAGE.l };
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
function versEcranBureau(x, y, l, h, k) {
	const o = origineBureau();
	const d = (k === undefined ? 1 : k) - 1; // prompt 40 : décalage propre au plan de l'élément
	return { x: o.x + d * CAMERA.x + (x - CADRAGE.x) * o.u, y: o.y + d * CAMERA.y + (y - CADRAGE.y) * o.u, l: (l || 0) * o.u, h: (h || 0) * o.u };
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

/* Vignettage + masque de flou des bords, fixes à l'écran (la pièce bouge dessous avec la caméra).
   Tout se fait en basse résolution (480×270) puis est agrandi avec lissage : coût négligeable par image.
   - flou : copie floutée de la pièce, recalculée seulement quand la pièce est redessinée,
     posée avec la même transformation que la pièce, puis découpée par une bande de 36 px le long des
     quatre bords (opaque au bord, transparente vers l'intérieur) ;
   - vignettage : dégradé radial sombre, plus marqué dans les coins. */
const BORDS = { flou: 2, bande: 36, vignette: 0.22 }; // bande floue d'épaisseur constante (36 px) le long des 4 bords — plus d'ellipse qui mordait dans les coins
let cPieceFloue = null;
let cCouches = null; // prompt 40 : composition des plans décalés
let cFlouEcran = null;
let cMasqueFlou = null;
let cVignette = null;
let derniereCopieFloue = -1;
function canevas(l, h) {
	const c = document.createElement('canvas');
	c.width = l;
	c.height = h;
	return c;
}
function degradeRadial(c, stops) {
	const ctx = c.getContext('2d');
	ctx.save();
	ctx.scale(1, c.height / c.width); // ellipse à la proportion de l'écran
	const r = Math.hypot(c.width / 2, c.width / 2);
	const g = ctx.createRadialGradient(c.width / 2, c.width / 2, 0, c.width / 2, c.width / 2, r);
	stops.forEach(([pos, coul]) => g.addColorStop(pos, coul));
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, c.width, c.width);
	ctx.restore();
}
/** Masque en bande : opaque au bord de l'écran, transparent à « e » pixels du bord, sur les 4 côtés */
function bandeBords(c, e) {
	const ctx = c.getContext('2d');
	const w = c.width;
	const h = c.height;
	const cotes = [
		[0, 0, 0, e, 0, 0, w, e], // haut
		[0, h, 0, h - e, 0, h - e, w, e], // bas
		[0, 0, e, 0, 0, 0, e, h], // gauche
		[w, 0, w - e, 0, w - e, 0, e, h], // droite
	];
	cotes.forEach(([x0, y0, x1, y1, rx, ry, rl, rh]) => {
		const g = ctx.createLinearGradient(x0, y0, x1, y1);
		g.addColorStop(0, 'rgba(0,0,0,1)');
		g.addColorStop(1, 'rgba(0,0,0,0)');
		ctx.fillStyle = g;
		ctx.fillRect(rx, ry, rl, rh);
	});
}
function masqueFlouEtVignette(ox, oy, echelle) {
	if (!cMasqueFlou) {
		cPieceFloue = canevas(BW, BH);
		cFlouEcran = canevas(BW, BH);
		cMasqueFlou = canevas(BW, BH);
		bandeBords(cMasqueFlou, (BORDS.bande * BW) / L);
		cVignette = canevas(BW, BH);
		degradeRadial(cVignette, [[0, 'rgba(12,16,22,0)'], [0.958, 'rgba(12,16,22,0)'], [0.979, 'rgba(12,16,22,' + BORDS.vignette * 0.45 + ')'], [1, 'rgba(12,16,22,' + BORDS.vignette + ')']]);
	}
	if (derniereCopieFloue !== dernierRenduBureau) {
		const c = cPieceFloue.getContext('2d');
		c.clearRect(0, 0, BW, BH);
		c.filter = 'blur(' + BORDS.flou + 'px)';
		c.drawImage(gBureau.elt, 0, 0, BW, BH);
		c.filter = 'none';
		derniereCopieFloue = dernierRenduBureau;
	}
	const k = BW / L; // canevas → basse résolution
	const f = cFlouEcran.getContext('2d');
	f.globalCompositeOperation = 'source-over';
	f.clearRect(0, 0, BW, BH);
	f.drawImage(cPieceFloue, ox * k, oy * k, BW * echelle, BH * echelle);
	f.globalCompositeOperation = 'destination-in';
	f.drawImage(cMasqueFlou, 0, 0);
	f.globalCompositeOperation = 'source-over';
	const ctx = drawingContext;
	ctx.imageSmoothingEnabled = true;
	ctx.drawImage(cFlouEcran, 0, 0, L, H);
	ctx.drawImage(cVignette, 0, 0, L, H);
	ctx.imageSmoothingEnabled = false;
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

	if (!dernierRenduBureau || millis() - dernierRenduBureau > (reduireAnimations ? 250 : 66)) {
		dessinerPieceBureau();
		dernierRenduBureau = millis();
	}
	// Pièce : plein écran légèrement surcadrée au bureau (prompt 25 révisé), agrandie autour du moniteur au poste
	const e = rectEcranBase();
	const echelle = r.l / e.l;
	clear();
	background(P.contour);
	drawingContext.imageSmoothingEnabled = false;
	const ox = r.x - e.x * echelle;
	const oy = r.y - e.y * echelle;
	const flou = auPoste; // la pièce n'est floutée qu'au poste (derrière le moniteur) ; plus de flou au bureau en temps accéléré
	if (flou && !reduireAnimations) drawingContext.filter = auPoste ? 'blur(2px) brightness(0.85)' : 'blur(1.5px)';
	if (auPoste || !COUCHES_PIECE[0].g) {
		push();
		translate(ox, oy);
		scale(echelle);
		image(gBureau, 0, 0, L, H);
		pop();
	} else {
		// Prompt 40 : plans composés hors écran avec leur décalage propre, puis posés en une fois (flou éventuel compris)
		if (!cCouches) cCouches = canevas(L, H);
		const cc = cCouches.getContext('2d');
		cc.clearRect(0, 0, L, H);
		cc.imageSmoothingEnabled = false;
		COUCHES_PIECE.forEach((c) => cc.drawImage(c.g.elt, ox + (c.k - 1) * CAMERA.x, oy + (c.k - 1) * CAMERA.y, L * echelle, H * echelle));
		drawingContext.drawImage(cCouches, 0, 0);
	}
	drawingContext.filter = 'none';
	if (vue !== 'poste') masqueFlouEtVignette(ox, oy, echelle); // bords flous + vignettage (fixes à l'écran)
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
	if (incidentImportant()) bordureRouge(r.x, r.y, r.l, r.h, auPoste ? 4 : 2); // fin, à l'intérieur de l'écran du PC (plus immersif)

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
	cibleGuide('ecranPC', r.x, r.y, r.l, r.h); // prompt 37
	zonesObjetsBureau();
	if (ecran === 'jeu' && phase !== 'fin') {
		const hA = heureAffichee();
		textFont(POLICE_DONNEES);
		textSize(22);
		const lib = String(hA.h).padStart(2, '0') + ':' + String(hA.m).padStart(2, '0') + (tempsCompresse() ? '  ▶▶ ×' + IMMERSION.compression : '');
		const lh = textWidth(lib) + 24;
		const ph = versEcranBureau(HORLOGE_MURALE.x, HORLOGE_MURALE.y + HORLOGE_MURALE.r + 6, 0, 0, 0.7); // sous l'horloge murale, plan « baie » (prompt 40)
		fill(13, 12, 12, 225);
		rect(ph.x - lh / 2, ph.y, lh, 34);
		fill('#FFFFFF');
		textAlign(CENTER, CENTER);
		text(lib, ph.x, ph.y + 17);
	}
	const msg = incidentActif()
		? t('bureau.incident')
		: phase === 'mail'
			? t('bureau.mail')
			: ecran === 'jeu' && phase === 'attente' && Jeu.journeeFinie && Jeu.journeeFinie()
				? t('bureau.finJournee') // prompt 51
				: t('bureau.installer');
	textFont(POLICE_DONNEES);
	textSize(22);
	const lm = textWidth(msg) + 40;
	fill(13, 12, 12, 225);
	rect((L - lm) / 2, H - 76, lm, 48);
	fill('#FFFFFF');
	textAlign(CENTER, CENTER);
	text(msg, L / 2, H - 52);
}

// ——— Prompt 26 : sortir du PC — bouton « Quitter le PC » et molette (la porte a été retirée) ———
let focusQuitter = false; // focus clavier sur le bouton « Quitter le PC » (Tab au poste)
let dernierScrollSortie = 0;
let cumulScroll = 0;
const BOUTON_QUITTER = { l: 340, h: 50, marge: 40 };

function rectBoutonQuitter() {
	return { x: L - BOUTON_QUITTER.l - BOUTON_QUITTER.marge, y: H - BOUTON_QUITTER.h - 10, l: BOUTON_QUITTER.l, h: BOUTON_QUITTER.h }; // sous l'écran (prompt 43)
}
/** Bouton visible au poste, sous le moniteur à droite (dans la pièce, hors de l'écran du PC). */
function dessinerBoutonQuitterPC() {
	const b = rectBoutonQuitter();
	if (clignement) return; // pendant qu'on se lève, le bouton disparaît
	bouton(b.x, b.y, b.l, b.h, t('poste.quitter_pc'), quitterPC);
	cibleGuide('quitterPC', b.x, b.y, b.l, b.h); // prompt 37
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
	// Prompt 38 : molette vers le haut au bureau → s'installer au PC ; vers le bas au poste → se lever
	const versPC = vue === 'bureau' && delta < 0;
	const versBureau = vue === 'poste' && delta > 0;
	const bloque = clignement || fenetre || smsActif || (typeof tutoriel !== 'undefined' && tutoriel) || (typeof MENU !== 'undefined' && MENU.actif);
	if (bloque || (!versPC && !versBureau) || (versBureau && (PC.fenetre || phase === 'mail' || phase === 'reveil'))) {
		cumulScroll = 0;
		return vue === 'poste' && !bloque && !PC.fenetre ? true : false; // au poste, le scroll ne fait pas défiler la page
	}
	const maintenant = millis();
	if (maintenant - dernierScrollSortie < 600) return true; // anti-rebond : on « avale » le reste du geste
	cumulScroll += Math.abs(delta);
	if (cumulScroll < 100) return true;
	cumulScroll = 0;
	dernierScrollSortie = maintenant;
	if (versPC) sAsseoir();
	else quitterPC();
	return true;
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
