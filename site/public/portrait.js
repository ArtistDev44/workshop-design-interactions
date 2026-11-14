/* Nantes en régulation — prompt 60, sous-étape 60b : mise en page portrait dédiée (téléphone tenu droit).
 * Principe : RECOMPOSITION. Le jeu continue de dessiner en 1920×1080 (ordinateur et paysage inchangés) ; en
 * portrait, un second canevas 1080×1920 recompose, à chaque image, des régions de cette image empilées :
 *   appli Signalements : jauges (fixes) / liste des signalements + lignes, dossier avec sources, compteur et actions (défilables,
 *     défilement automatique vers le dossier à son arrivée) / « Se lever » (fixe) ;
 *   fenêtres : recadrées à leur largeur ; téléphone et tasse en main : recadrés sur l'objet ; menu : sa colonne ;
 *   bureau : la pièce en haut, et tous les objets en grosses cibles tactiles en dessous (≥ 96 px).
 * Les touchers sont reconvertis vers les coordonnées 1920×1080 avant d'appeler les gestionnaires du jeu.
 * Aucune règle touchée ; ne s'active qu'en mode mobile portrait.
 */
const PL = 1080;
let PH = 1920; // prompt 205 : suit la proportion de l'écran (9:16 à 9:21), pour que la barre d'onglets soit en bas
const PORTRAIT = { paysage: false, actif: false, canevas: null, ctx: null, regions: [], boutons: [], defil: 0, defilMax: 0, cible: null, dernierDossier: -1, toucher: null, cleContenu: null, feuille: -9999 };

// ——— Prompt 205 : géométrie portrait de l'appli ———
// Le jeu dessine toujours dans l'image 1920×1080, mais en portrait la carte, les vues (Mails, Community, Journal,
// Données) et la fiche du dossier y sont dessinées en COLONNES de 620 px : recomposées sur toute la largeur du
// téléphone (1040 px portrait ≈ 397 px CSS sur un écran de 412 px), le texte de 20 px de l'appli y fait ≈ 13 px à
// l'écran, contre 5 à 8 px avec la mise en page 16:9 réduite. La carte et les vues partagent la même colonne (une
// seule est dessinée à la fois) ; la fiche a la sienne, à droite, pour ne jamais se superposer à la carte.
const GEO_PORTRAIT = { carte: { x: 184, y: 92, l: 620, h: 980 }, vue: { x: 184, y: 92, l: 620, h: 980 }, panneau: { x: 820, y: 92, l: 620, h: 980 }, suite: { x: 820, y: 92, l: 620, h: 980 } }; // h 980 : jusqu'au bas de l'image (y 1072), la colonne remplit l'écran d'un téléphone 9:20 // suite : seconde colonne d'une vue (Données)
let geoOrigine = null;
// ——— Prompt 215 : téléphone en paysage — le même portrait « à plat » ———
// Canevas recomposé de PLW × PH (PH = 1080, moins sur un écran de moins de 412 px de haut ; PLW = PH × largeur / hauteur) : même échelle qu'en portrait (≈ 0,38 px CSS
// par px), donc mêmes tailles de texte et de cibles. La colonne du portrait (PL = 1080) est au centre, sur toute la hauteur ;
// à gauche et à droite, deux rails de largeur RAIL() (jauges et équipes à gauche ; onglets, actions, objets du bureau à droite).
let PLW = PL;
const RAIL = () => (PORTRAIT.paysage ? Math.round((PLW - PL) / 2) : 0);
function appliquerGeometriePortrait(oui) {
	if (typeof ZONE_CARTE === 'undefined' || typeof ZONE_VUE === 'undefined') return;
	if (!geoOrigine) geoOrigine = { carte: Object.assign({}, ZONE_CARTE), vue: Object.assign({}, ZONE_VUE) };
	Object.assign(ZONE_CARTE, oui ? GEO_PORTRAIT.carte : geoOrigine.carte);
	Object.assign(ZONE_VUE, oui ? GEO_PORTRAIT.vue : geoOrigine.vue);
	if (typeof CARTE !== 'undefined') CARTE.centreSur = null; // recadrer sur le dossier ouvert dans la nouvelle colonne
}
function majHauteurPortrait() {
	const r = window.innerHeight / Math.max(1, window.innerWidth);
	if (PORTRAIT.paysage) {
		// Prompt 215 : échelle du portrait sur un écran de 412 px (1080 px → 412 px CSS, soit ≈ 0,38) gardée quelle que soit la
		// hauteur : sur un écran de 360 px de haut, le canevas fait 944 px de haut au lieu de réduire le texte sous 12 px CSS ;
		// au-delà de 412 px, 1080 (tout grandit). La largeur suit la forme de l'écran.
		PH = Math.min(PL, Math.round((window.innerHeight * PL) / 412));
		PLW = Math.round(PH * Math.min(3, Math.max(16 / 9, 1 / Math.max(0.01, r))));
	} else {
		PH = Math.round(PL * Math.min(21 / 9, Math.max(16 / 9, r)));
		PLW = PL;
	}
	if (PORTRAIT.canevas && PORTRAIT.canevas.height !== PH) PORTRAIT.canevas.height = PH;
	if (PORTRAIT.canevas && PORTRAIT.canevas.width !== PLW) PORTRAIT.canevas.width = PLW;
}

function activerPortrait(oui, paysage) {
	PORTRAIT.paysage = !!(oui && paysage);
	if (typeof document !== 'undefined' && document.body) document.body.classList.toggle('paysage', PORTRAIT.paysage);
	if (oui) majHauteurPortrait();
	if (oui === PORTRAIT.actif) return;
	PORTRAIT.actif = oui;
	document.body.classList.toggle('portrait', oui);
	appliquerGeometriePortrait(oui);
	appliquerFenetresPortrait(oui); // prompt 209
	if (oui && !PORTRAIT.canevas) {
		const c = document.createElement('canvas');
		c.id = 'portrait';
		c.width = PLW;
		c.height = PH;
		c.setAttribute('aria-hidden', 'true'); // les annonces aria-live restent celles du jeu
		document.getElementById('scene').appendChild(c);
		PORTRAIT.canevas = c;
		PORTRAIT.ctx = c.getContext('2d');
	}
}

// ——— Régions : source (image 1920×1080) → destination (portrait), avec ou sans défilement ———
const KP = () => ECRAN_POSTE.l / L;
/** Rectangle de l'appli Régulation (coordonnées de l'appli) → image principale */
function appliVersImage(r) {
	const A = FENETRE_APPLI;
	const k = KP();
	return { x: ECRAN_POSTE.x + (A.x + r.x * A.k) * k, y: ECRAN_POSTE.y + (A.y + r.y * A.k) * k, l: r.l * A.k * k, h: r.h * A.k * k };
}
function region(src, dx, dy, dl, defile) {
	const dh = (src.h * dl) / src.l;
	PORTRAIT.regions.push({ src, dst: { x: dx + RAIL(), y: dy, l: dl, h: dh }, defile: !!defile }); // prompt 215 : colonne décalée du rail gauche
	return dh;
}
// Prompt 173 : les fenêtres n'ont plus que trois largeurs (DS.fenetre) ; le cadrage portrait = largeur + 40 px
// Prompt 209 : en portrait, les trois largeurs valent 640 (colonne étroite de l'image, recomposée pleine largeur : le texte
// de 20 px y fait ≈ 12 px CSS sur un écran de 412 px) ; elles reprennent leurs valeurs en sortant du portrait
const FENETRE_ORDINATEUR = Object.assign({}, DS.fenetre);
const FENETRE_PORTRAIT = 640;
function appliquerFenetresPortrait(oui) {
	['etroite', 'moyenne', 'large'].forEach((k) => (DS.fenetre[k] = oui ? FENETRE_PORTRAIT : FENETRE_ORDINATEUR[k]));
}
const CADRE_FENETRE = {
	get etroite() { return DS.fenetre.etroite + 40; },
	get moyenne() { return DS.fenetre.moyenne + 40; },
	get large() { return DS.fenetre.large + 40; },
};
const LARGEUR_FENETRE = {}; // prompt 88 (largeurs propres), prompt 209 : toutes à CADRE_FENETRE en portrait
['menu'].forEach((f) => Object.defineProperty(LARGEUR_FENETRE, f, { get: () => CADRE_FENETRE.etroite }));
['partage', 'installation', 'demission', 'partir', 'reset'].forEach((f) => Object.defineProperty(LARGEUR_FENETRE, f, { get: () => CADRE_FENETRE.moyenne }));

function scenePortrait() {
	if (typeof CINE !== 'undefined' && CINE) return 'cine'; // prompt 209 : colonne centrale de 640 px
	if (typeof GAMEOVER !== 'undefined' && GAMEOVER) return 'gameover'; // prompt 209 : lettre puis boutons, empilés
	if (typeof TRANSITION_JOUR !== 'undefined' && TRANSITION_JOUR) return 'transition'; // prompt 209 : au-dessus des SMS
	if (fenetre === 'telephone' || fenetre === 'cafe' || smsActif) return 'main';
	if (fenetre === 'rapport') return 'rapport';
	if (fenetre || tutoriel) return 'fenetre';
	if (MENU.actif) return 'menu';
	if (vue === 'poste' && PC.etat === 'appli' && ecran === 'jeu') return 'appli';
	if (vue === 'poste' && typeof vueIntegree === 'function' && vueIntegree()) return 'vueApp'; // prompt 103 : vue intégrée de l'appli
	if (vue === 'bureau' && ecran === 'jeu' && !TRANSITION_JOUR) return 'bureau';
	return 'plein';
}

function composerPortrait() {
	if (!PORTRAIT.actif) return;
	const ctx = PORTRAIT.ctx;
	const src = document.querySelector('#scene canvas.p5Canvas');
	if (!src) return;
	PORTRAIT.regions = [];
	PORTRAIT.boutons = [];
	const loupes = PORTRAIT.loupes || []; // prompt 209 : relevées pendant le dessin de cette image
	PORTRAIT.loupes = [];
	if (PORTRAIT.paysage) (PORTRAIT.defilMax = 0), (PORTRAIT.hautDefil = 0), (PORTRAIT.basDefil = PH); // prompt 215 : pas d'état hérité de l'écran précédent
	const scene = scenePortrait();
	if (scene === 'appli' || scene === 'vueApp') regionsPoste(scene); // prompt 205
	else if (scene === 'main') {
		// Prompt 209 : le téléphone seul (560 px de large, sans la main) ; la tasse de café garde l'ancien cadrage
		if (fenetre === 'cafe') region({ x: 880, y: 0, l: 780, h: H }, 0, 200, PL);
		else {
			const src = { x: xTelephoneMain() - 20, y: 16, l: TEL_MAIN.l + 40, h: 980 };
			region(src, 0, Math.max(0, (PH - (src.h * PL) / src.l) / 2), PL);
		}
	}
	else if (scene === 'rapport') regionsFenetre(); // prompt 209 : feuilles de 640 px (histoire.js, rapportPortrait)
	else if (scene === 'fenetre') regionsFenetre();
	else if (scene === 'cine') region({ x: COLONNE_CINE.x - 20, y: 0, l: 680, h: H }, 0, (PH - (H * PL) / 680) / 2, PL);
	else if (scene === 'gameover') regionsDeuxColonnes('gameover', GEO_GAMEOVER.a, GEO_GAMEOVER.b);
	else if (scene === 'transition') region({ x: L / 2 - 340, y: 0, l: 680, h: H }, 0, (PH - (H * PL) / 680) / 2, PL); // prompt 209 : colonne de 640 px
	else if (scene === 'menu' && MENU.ecran === 'semaines') regionsChoixSemaine(); // prompt 209
	else if (scene === 'menu' && (MENU.ecran === 'credits' || MENU.ecran === 'autorisations')) regionsFlux(MENU.ecran); // prompt 209
	else if (scene === 'menu') {
		// Prompt 199 : en haut à droite, la pile FR / EN · télécharger (prompt 214 : plus de plein écran) ; puis la colonne du menu (titre, cartes)
		// jusqu'à Paramètres ; puis la rangée Livrables · Kit de presse · Présentation · Dépôt · Partager et le pied de page. Pile et rangée agrandies ×2 :
		// boutons de 60 et 68 px → ≥ 44 px à l'écran sur un téléphone de 412 px de large
		const lp = LARGEUR_PILE() + 24, hp = 2 * HAUT_MENU.h + 16 + 24; // prompt 214 : deux rangées (FR / EN, télécharger)
		region({ x: L - HAUT_MENU.marge - lp + 12, y: HAUT_MENU.y - 12, l: lp, h: hp }, PL - 20 - 2 * lp, 30, 2 * lp);
		// Prompt 209 : écran titre en colonne de 640 px (x 130 → 810) ; les autres écrans du menu gardent 908 px (x 110 → 1018)
		const titre = MENU.ecran === 'titre';
		const b = BLOC_PARTAGE, yr = b.yDessin || b.y, lc = titre ? COLONNE_MENU_PORTRAIT.l : 908, xc = titre ? COLONNE_MENU_PORTRAIT.x : 110;
		let y = 30 + 2 * hp + 24;
		y += region({ x: xc, y: 60, l: lc, h: yr - 12 - 60 }, 0, y, PL) + 8;
		const lr = RANGEE_MENU.length * b.l + (RANGEE_MENU.length - 1) * 16 + 24;
		y += region({ x: b.x - 12, y: yr - 12, l: lr, h: b.h + 24 }, 20, y, Math.min(2 * lr, PL - 40)) + 16;
		region({ x: xc, y: H - 80, l: lc, h: 56 }, 0, y, PL); // pied de page (nos noms → Crédits)
	}
	else if (scene === 'bureau') {
		// Prompt 215 : en paysage, la pièce en haut de la colonne, l'heure (loupe « haut ») dans le rail gauche, les objets
		// en boutons dans le rail droit
		const y0 = PORTRAIT.paysage ? 20 : 150;
		region({ x: 0, y: 0, l: L, h: H }, 0, y0, PL);
		// Prompt 217 : la pièce est un décor — ses objets y font 8 à 28 px CSS ; on les touche par les grands boutons
		// (boutonsBureau), jamais par l'image (un toucher dessus ne fait rien : pas de clic involontaire)
		PORTRAIT.regions[PORTRAIT.regions.length - 1].inerte = true;
		// Prompt 209 : textes utiles de la pièce repris à l'échelle d'une colonne de 640 px — l'heure dans la bande du haut,
		// la consigne, « Fin de journée. » et la bulle du guide entre l'image et les boutons
		let y = y0 + (H * PL) / L + 16;
		loupes.forEach((z) => {
			const s = Math.min(PL / 680, (PL - 40) / z.l);
			const dl = z.l * s;
			if (z.haut && PORTRAIT.paysage) region(z, -RAIL() + 20, 20, Math.min(RAIL() - 40, z.l * s));
			else if (z.haut) region(z, (PL - dl) / 2, Math.max(4, (150 - z.h * s) / 2), dl);
			else y += region(z, (PL - dl) / 2, y, dl) + 12;
		});
		boutonsBureau(y + 8);
		if (PORTRAIT.paysage) defilementGenerique(); // la consigne et le guide peuvent dépasser la hauteur
	} else region({ x: 0, y: 0, l: L, h: H }, 0, (PH - (H * PL) / L) / 2, PL);
	const poste = scene === 'appli' || scene === 'vueApp';
	// Prompt 215 : en paysage, tout écran qui dépasse la hauteur (1080) remonte en haut et défile au doigt ; les boutons
	// propres au portrait (bureau) sont décalés dans la colonne, sauf ceux posés dans un rail (abs)
	if (PORTRAIT.paysage) {
		if (PORTRAIT.scenePaysage !== scene) (PORTRAIT.scenePaysage = scene), (PORTRAIT.defil = 0);
		if (!poste && scene !== 'bureau') defilementGenerique();
		PORTRAIT.boutons.forEach((b) => {
			if (!b.abs) b.x += RAIL();
		});
	}
	// Dessin
	ctx.fillStyle = '#0D0C0C';
	ctx.fillRect(0, 0, PLW, PH);
	if (PORTRAIT.paysage) {
		ctx.fillStyle = '#171616'; // rails, un ton au-dessus du fond
		ctx.fillRect(0, 0, RAIL(), PH);
		ctx.fillRect(RAIL() + PL, 0, PLW - RAIL() - PL, PH);
	}
	ctx.imageSmoothingEnabled = true;
	const defilant = poste || ((scene === 'fenetre' || scene === 'rapport' || scene === 'menu' || scene === 'gameover' || PORTRAIT.paysage) && PORTRAIT.defilMax > 0); // prompt 209 : fenêtre avec une suite, choix du mode ; prompt 215 : tout écran en paysage
	const zone = defilant ? { haut: PORTRAIT.hautDefil, bas: PORTRAIT.basDefil } : null;
	// Prompt 205 : la fiche du dossier monte du bas à son arrivée (0,3 s ; immédiate si les animations sont réduites)
	const kF = reduireAnimations ? 1 : Math.min(1, (millis() - PORTRAIT.feuille) / 300);
	const montee = poste && kF < 1 ? (1 - (1 - Math.pow(1 - kF, 3))) * (PH - (zone ? zone.haut : 0)) : 0;
	PORTRAIT.regions.forEach((r) => {
		const d = { ...r.dst, y: r.dst.y - (r.defile ? PORTRAIT.defil : 0) + (r.feuille ? montee : 0) };
		ctx.save();
		if (r.defile && zone) {
			ctx.beginPath();
			ctx.rect(RAIL(), zone.haut, PL, zone.bas - zone.haut); // prompt 215 : la colonne seule (les rails restent nets)
			ctx.clip();
		}
		ctx.drawImage(src, r.src.x, r.src.y, r.src.l, r.src.h, d.x, d.y, d.l, d.h);
		ctx.restore();
	});
	if (poste) dessinerBarresPortrait();
	PORTRAIT.boutons.forEach((b) => dessinerBoutonPortrait(b));
	// Sieste : les paupières couvrent aussi tout le portrait (boutons compris), sauf pendant l'alarme de réveil
	if (typeof SOMMEIL !== 'undefined' && SOMMEIL.k > 0.001 && phase !== 'reveil' && !fenetre) {
		paupieres(ctx, SOMMEIL.k, PLW, PH);
		if (SOMMEIL.k > 0.5) PORTRAIT.boutons = [];
		dessinerSousTitresPortrait(ctx, PH - 40); // prompt 208
		return;
	}
	if (defilant && PORTRAIT.defilMax > 0) {
		// Ascenseur discret : où l'on est dans la colonne
		const h = ((zone.bas - zone.haut) * (zone.bas - zone.haut)) / (zone.bas - zone.haut + PORTRAIT.defilMax);
		const y = zone.haut + ((zone.bas - zone.haut - h) * PORTRAIT.defil) / PORTRAIT.defilMax;
		ctx.fillStyle = 'rgba(255,255,255,0.35)';
		ctx.fillRect(RAIL() + PL - 10, y, 6, h);
	}
	dessinerSousTitresPortrait(ctx, (poste && zone ? zone.bas : PH) - 24); // prompt 208 : au-dessus de la barre d'onglets du poste
}

/** Prompt 215 : paysage — le contenu de la colonne qui dépasse 1080 px de haut remonte en haut (les écrans centrés
 * verticalement en portrait, téléphone ou cinématique, partaient au-dessus de l'écran) et défile au doigt */
function defilementGenerique() {
	const rs = PORTRAIT.regions.filter((r) => r.dst.x + r.dst.l > RAIL() && r.dst.x < RAIL() + PL); // la colonne, pas les rails
	if (!rs.length) return;
	const haut = Math.min(...rs.map((r) => r.dst.y));
	const bas = Math.max(...rs.map((r) => r.dst.y + r.dst.h)) + 20;
	const bb = PORTRAIT.boutons.filter((b) => !b.abs);
	const basB = bb.length ? Math.max(...bb.map((b) => b.y + b.h)) + 20 : 0;
	if (bas - haut <= PH && basB <= PH) {
		if (haut < 0) rs.forEach((r) => (r.dst.y += -haut + 12));
		return;
	}
	const decalage = haut < 12 ? 12 - haut : 0;
	rs.forEach((r) => ((r.dst.y += decalage), (r.defile = true)));
	PORTRAIT.hautDefil = 0;
	PORTRAIT.basDefil = PH;
	PORTRAIT.defilMax = Math.max(0, Math.max(bas + decalage, basB) - PH);
	PORTRAIT.defil = constrain(PORTRAIT.defil, 0, PORTRAIT.defilMax);
}

/** Prompt 208 : sous-titres des sons en portrait — 40 px portrait (≈ 15 px CSS sur 412 px), blanc sur noir, centrés */
function dessinerSousTitresPortrait(ctx, bas) {
	if (!Confort.Reglages.sousTitresSons) return;
	const liste = Confort.Son.legendesVisibles();
	if (!liste.length) return;
	const hl = 72;
	let y = bas - liste.length * (hl + 8);
	ctx.save();
	ctx.font = '400 40px ' + POLICE_PORTRAIT;
	liste.forEach((l) => {
		const txt = t('son.legende.' + l.cle);
		const lt = Math.min(PL - 24, ctx.measureText(txt).width + 48);
		const cx = RAIL() + PL / 2; // prompt 215 : centrés sur la colonne
		ctx.fillStyle = 'rgba(0,0,0,0.88)';
		ctx.fillRect(cx - lt / 2, y, lt, hl);
		texteP(ctx, txt, cx, y + 14, 40, '#FFFFFF', 'center');
		y += hl + 8;
	});
	ctx.restore();
}

/** Prompt 209 : fenêtre — sa colonne (640 px + marges, centrée sur le panneau dessiné), et sa suite éventuelle
 * (FENETRE_SUITE, seconde colonne de l'image) empilée dessous ; l'ensemble défile au doigt s'il dépasse l'écran */
function regionsFenetre() {
	const W = tutoriel ? 1400 : LARGEUR_FENETRE[fenetre] || CADRE_FENETRE.large;
	const Z = typeof ZONE_FENETRE !== 'undefined' ? ZONE_FENETRE : null;
	const cx = !tutoriel && Z && Z.l <= W ? Z.x + Z.l / 2 : L / 2;
	const S = !tutoriel && typeof FENETRE_SUITE !== 'undefined' ? FENETRE_SUITE : null;
	const cle = 'fenetre:' + fenetre;
	if (cle !== PORTRAIT.cleContenu) {
		PORTRAIT.cleContenu = cle;
		PORTRAIT.defil = 0;
	}
	PORTRAIT.hautDefil = 0;
	PORTRAIT.basDefil = PH;
	if (!S) {
		PORTRAIT.defilMax = 0;
		region({ x: cx - W / 2, y: 0, l: W, h: H }, 0, (PH - (H * PL) / W) / 2, PL);
		return;
	}
	const y0 = Z ? Math.max(0, Z.y - 20) : 0;
	const y1 = Z ? Math.min(H, Z.y + Z.h + 20) : H;
	const dh = region({ x: cx - W / 2, y: y0, l: W, h: y1 - y0 }, 0, 0, PL, true);
	const s0 = Math.max(0, S.y - 20);
	const total = dh + region({ x: S.x + S.l / 2 - W / 2, y: s0, l: W, h: Math.min(H, S.y + S.h + 20) - s0 }, 0, dh, PL, true);
	PORTRAIT.defilMax = Math.max(0, total - PH);
	PORTRAIT.defil = constrain(PORTRAIT.defil, 0, PORTRAIT.defilMax);
}

/** Prompt 209 : choix du mode — colonne A (titre, deux cartes) puis colonne B (option du guide, Lancer, Retour),
 * empilées et défilables (menu.js, choixSemainePortrait) */
function regionsChoixSemaine() {
	regionsDeuxColonnes('semaines', GEO_CHOIX_SEMAINE.a, GEO_CHOIX_SEMAINE.b);
}
/** Prompt 209 : deux colonnes de l'image (640 px + marges de 20) empilées et défilables ; cle : retour en haut au changement */
function regionsDeuxColonnes(cle, A, B) {
	if (PORTRAIT.cleContenu !== cle) (PORTRAIT.cleContenu = cle), (PORTRAIT.defil = 0);
	PORTRAIT.hautDefil = 0;
	PORTRAIT.basDefil = PH;
	const dh = region({ x: A.x - 30, y: A.y, l: 680, h: A.h }, 0, 40, PL, true);
	const total = 40 + dh + (B.h > 0 ? region({ x: B.x - 30, y: B.y, l: 680, h: B.h }, 0, 40 + dh, PL, true) : 0) + 40;
	PORTRAIT.defilMax = Math.max(0, total - PH);
	PORTRAIT.defil = constrain(PORTRAIT.defil, 0, PORTRAIT.defilMax);
}

/** Prompt 209 : flux de blocs dans trois colonnes de 640 px de l'image (texte sur 600 px, marges de 20) — un bloc qui
 * ne tient plus dans une colonne passe en haut de la suivante ; GEO_FLUX garde la hauteur occupée de chaque colonne, et
 * regionsFlux les empile pleine largeur (20 px de l'image ≈ 12,9 px CSS sur un écran de 412 px) */
const GEO_FLUX = [0, 1, 2].map((i) => ({ x: 20 + i * 640, y: 20, l: 600, h: 0 }));
function fluxPortrait() {
	GEO_FLUX.forEach((C) => (C.h = 0));
	let i = 0;
	let y = GEO_FLUX[0].y;
	return {
		l: GEO_FLUX[0].l,
		place(h) {
			if (i < GEO_FLUX.length - 1 && y > GEO_FLUX[i].y && y + h > H - 20) (i += 1), (y = GEO_FLUX[i].y);
			const C = GEO_FLUX[i];
			const p = { x: C.x, y };
			y += h;
			C.h = y - C.y;
			return p;
		},
	};
}
function regionsFlux(cle) {
	if (PORTRAIT.cleContenu !== cle) (PORTRAIT.cleContenu = cle), (PORTRAIT.defil = 0);
	PORTRAIT.hautDefil = 0;
	PORTRAIT.basDefil = PH;
	let y = 30;
	GEO_FLUX.forEach((C) => {
		if (C.h > 0) y += region({ x: C.x - 20, y: C.y - 10, l: 640, h: C.h + 20 }, 0, y, PL, true);
	});
	PORTRAIT.defilMax = Math.max(0, y + 30 - PH);
	PORTRAIT.defil = constrain(PORTRAIT.defil, 0, PORTRAIT.defilMax);
}

// ——— Prompt 205 : poste en portrait — barre des jauges (haut), un seul contenu plein écran (défilant), équipes
// pendant un dossier, somnolence et « Se lever », barre d'onglets (bas). Barres et boutons sont dessinés directement
// sur le canevas portrait (texte ≥ 32 px portrait ≈ 12 px CSS), le contenu vient de l'image du jeu (colonnes de 620 px).
const BARRE_HAUT = 150;
const BARRE_ONGLETS = 150;
const RANGEE_ACTIONS = 136;
const BANDE_EQUIPES = 190;
const POLICE_PORTRAIT = '"JetBrains Mono", ui-monospace, monospace';
const PHASES_FEUILLE = ['decision', 'contradiction', 'conflit', 'narration'];
/** Le dossier (fiche) est-il le contenu affiché ? */
function feuilleOuverte() {
	if (typeof PANNEAU === 'undefined' || typeof phase === 'undefined') return false;
	if (typeof enSieste !== 'undefined' && enSieste && !PHASES_FEUILLE.includes(phase)) return true; // panneau « vous dormez »
	return PHASES_FEUILLE.includes(phase) && !(typeof DIALOGUE !== 'undefined' && DIALOGUE.reduit);
}
/** Bande « Envoyer une équipe » : pendant un choix, équipes débloquées */
function bandeEquipesVisible() {
	return feuilleOuverte() && ['decision', 'contradiction', 'conflit'].includes(phase) && typeof Jeu !== 'undefined' && Jeu.TYPES_EQUIPES && Jeu.elementDebloque && Jeu.elementDebloque('equipes');
}
function regionsPoste(scene) {
	const bande = scene === 'appli' && bandeEquipesVisible();
	const pay = PORTRAIT.paysage; // prompt 215 : barres dans les rails, colonne sur toute la hauteur
	const haut = pay ? 12 : BARRE_HAUT + 12;
	const bas = pay ? PH - 12 : PH - BARRE_ONGLETS - RANGEE_ACTIONS - (bande ? BANDE_EQUIPES : 0) - 8;
	PORTRAIT.hautDefil = haut;
	PORTRAIT.basDefil = bas;
	const feuille = scene === 'appli' && feuilleOuverte();
	const src = scene === 'vueApp' ? ZONE_VUE : feuille ? PANNEAU : typeof zoneCarte === 'function' ? zoneCarte() : ZONE_CARTE;
	let dh = region(appliVersImage({ x: src.x, y: src.y, l: src.l, h: src.h }), 20, haut, PL - 40, true);
	if (feuille) PORTRAIT.regions[PORTRAIT.regions.length - 1].feuille = true;
	if (scene === 'vueApp' && PC.fenetre === 'donnees') dh += 16 + region(appliVersImage(GEO_PORTRAIT.suite), 20, haut + dh + 16, PL - 40, true); // seconde colonne, empilée
	PORTRAIT.defilMax = Math.max(0, haut + dh + 16 - bas);
	// Nouveau contenu (autre vue, autre dossier) : retour en haut ; un dossier qui arrive monte du bas
	const cle = scene === 'vueApp' ? 'vue:' + PC.fenetre : feuille ? 'dossier:' + Jeu.index + ':' + phase : 'carte';
	if (cle !== PORTRAIT.cleContenu) {
		const nouveauDossier = feuille && !(String(PORTRAIT.cleContenu || '').startsWith('dossier:' + Jeu.index + ':'));
		PORTRAIT.cleContenu = cle;
		PORTRAIT.defil = 0;
		PORTRAIT.cible = null;
		if (nouveauDossier) PORTRAIT.feuille = millis();
	}
	PORTRAIT.defil = constrain(PORTRAIT.defil, 0, PORTRAIT.defilMax);
	// Bande des équipes : un toucher envoie l'équipe sur le dossier ouvert (comme glisser sa pastille sur la fiche)
	if (bande && pay) {
		// Prompt 215 : rail gauche, sous les jauges — deux colonnes de boutons de 120 px
		const tm = typeof tempsCarte === 'function' ? tempsCarte() : millis();
		const lb = (RAIL() - 52) / 2;
		Jeu.TYPES_EQUIPES.forEach((c, i) => {
			const q = Jeu.EQUIPES[c];
			const eff = Jeu.effectifJour ? Jeu.effectifJour(c) : 1;
			const eng = (Jeu.equipes || []).filter((x) => x.cle === c && !x.inutile && x.jourIndex === Jeu.jourIndex && Jeu.phaseEquipe(x, tm) !== 'libre').length;
			const dispo = Math.max(0, eff - eng);
			PORTRAIT.boutons.push({ abs: true, x: 20 + (i % 2) * (lb + 12), y: Y_EQUIPES_PAYSAGE + 130 + Math.floor(i / 2) * 132, l: lb, h: 120, texte: String(q.nom), sous: t('portrait.libres', { n: dispo, cout: q.cout }), action: () => deposerJeton(c, Jeu.index), desactive: !dispo });
		});
	} else if (bande) {
		const y = PH - BARRE_ONGLETS - RANGEE_ACTIONS - BANDE_EQUIPES + 58;
		const n = Jeu.TYPES_EQUIPES.length;
		const lb = (PL - 40 - (n - 1) * 12) / n;
		const tm = typeof tempsCarte === 'function' ? tempsCarte() : millis();
		Jeu.TYPES_EQUIPES.forEach((c, i) => {
			const q = Jeu.EQUIPES[c];
			const eff = Jeu.effectifJour ? Jeu.effectifJour(c) : 1;
			const eng = (Jeu.equipes || []).filter((x) => x.cle === c && !x.inutile && x.jourIndex === Jeu.jourIndex && Jeu.phaseEquipe(x, tm) !== 'libre').length;
			const dispo = Math.max(0, eff - eng);
			PORTRAIT.boutons.push({ x: 20 + i * (lb + 12), y, l: lb, h: 120, texte: String(q.nom), sous: t('portrait.libres', { n: dispo, cout: q.cout }), action: () => deposerJeton(c, Jeu.index), desactive: !dispo });
		});
	}
	// Rangée d'actions : somnolence (se reposer / se réveiller) et « Se lever » ; prompt 215 : en bas du rail droit
	const ya = pay ? PH - 20 - 116 : PH - BARRE_ONGLETS - RANGEE_ACTIONS + 10;
	const xa = pay ? RAIL() + PL + 20 : 20;
	const la = pay ? (RAIL() - 52) / 2 : (PL - 52) / 2;
	const v = typeof SOMNO !== 'undefined' ? Math.round(SOMNO.v) : 0;
	PORTRAIT.boutons.push({ abs: pay, x: xa, y: ya, l: la, h: 116, texte: t(typeof enSieste !== 'undefined' && enSieste ? 'portrait.reveiller' : 'portrait.reposer'), sous: t('portrait.somnolence', { v }), jauge: v, action: () => typeof basculerSieste === 'function' && basculerSieste() });
	PORTRAIT.boutons.push({ abs: pay, x: xa + 12 + la, y: ya, l: la, h: 116, texte: t('portrait.seLeverCourt'), action: quitterPC, primaire: false, desactive: !!raisonRetenuAuPC() }); // prompt 182 : estompé tant qu'un choix attend
	// Barre d'onglets : les entrées du menu de l'appli (badges, verrous), l'entrée affichée soulignée de rouge
	const ent = typeof ENTREES_MENU !== 'undefined' ? ENTREES_MENU : [];
	const lo = PL / Math.max(1, ent.length);
	const po = pay ? Math.min(132, (ya - 40) / Math.max(1, ent.length)) : 0; // prompt 215 : onglets empilés dans le rail droit
	ent.forEach((c, i) => {
		const verrou = c !== 'signalements' && typeof appliDebloquee === 'function' && !appliDebloquee(c);
		const geo = pay ? { abs: true, x: RAIL() + PL + 20, y: 20 + i * po, l: RAIL() - 40, h: Math.max(116, po - 12) } : { x: i * lo, y: PH - BARRE_ONGLETS, l: lo, h: BARRE_ONGLETS };
		PORTRAIT.boutons.push({ onglet: true, ...geo, texte: c === 'signalements' ? t('menuApp.carte') : t('menuApp.' + c), actif: entreeActive() === c, badge: typeof nombreBadge === 'function' && entreeActive() !== c ? nombreBadge(c) : 0, verrou, action: () => ouvrirEntreeMenu(c) });
	});
}
/** Couleur (texte clair, contraste ≥ 4,5:1 sur le fond sombre) d'une jauge selon ses seuils 40 / 20 */
const couleurJaugePortrait = (v) => (v < 20 ? DS.erreurClair : v < 40 ? DS.alerteClair : DS.succesClair);
const couleurBarrePortrait = (v) => (v < 20 ? DS.erreur : v < 40 ? DS.alerte : DS.succes);
function texteP(ctx, s, x, y, taille, couleur, align, gras) {
	ctx.font = (gras ? '700 ' : '400 ') + taille + 'px ' + POLICE_PORTRAIT;
	ctx.fillStyle = couleur;
	ctx.textAlign = align || 'left';
	ctx.textBaseline = 'top';
	ctx.fillText(s, x, y);
}
/** Prompt 213 : hachures de la zone d'excès sur une barre du portrait (motif, pas seulement une couleur), et trait de début */
function hachuresPortrait(ctx, x0, x1, y, h) {
	ctx.save();
	ctx.beginPath();
	ctx.rect(x0, y, x1 - x0, h);
	ctx.clip();
	ctx.strokeStyle = 'rgba(255,255,255,0.6)';
	ctx.lineWidth = 2;
	ctx.beginPath();
	for (let xx = x0 - h; xx < x1; xx += 7) {
		ctx.moveTo(xx, y + h);
		ctx.lineTo(xx + h, y);
	}
	ctx.stroke();
	ctx.restore();
	ctx.fillStyle = 'rgba(255,255,255,0.75)';
	ctx.fillRect(x0 - 1, y - 4, 3, h + 8);
}
/** Barre du haut (jauges chiffrées, heure) et titre de la bande des équipes */
/** Texte de 32 px replié sur trois lignes au plus dans la largeur du rail (« … » au-delà) */
function texteRail(ctx, s, x, y, l, couleur) {
	ctx.font = '400 32px ' + POLICE_PORTRAIT;
	const mots = String(s).split(' ');
	const lignes = [''];
	mots.forEach((m) => {
		const essai = lignes[lignes.length - 1] ? lignes[lignes.length - 1] + ' ' + m : m;
		if (ctx.measureText(essai).width <= l || !lignes[lignes.length - 1]) lignes[lignes.length - 1] = essai;
		else lignes.push(m);
	});
	if (lignes.length > 3) lignes[2] += ' …';
	lignes.slice(0, 3).forEach((li, i) => texteP(ctx, li, x, y + i * 40, 32, couleur));
}
const Y_EQUIPES_PAYSAGE = 540; // prompt 215 : titre « Envoyer une équipe » dans le rail gauche, sous les jauges
/** Prompt 215 : rail gauche du paysage — vitesse et heure, puis les trois jauges l'une sous l'autre, puis le titre des équipes */
function dessinerRailGauche() {
	const ctx = PORTRAIT.ctx;
	const lr = RAIL() - 40;
	ctx.save();
	const h = heureAffichee();
	texteP(ctx, t('temps.' + vitesseTemps()), 20, 20, 32, 'rgba(255,255,255,0.75)');
	texteP(ctx, String(h.h).padStart(2, '0') + ':' + String(h.m).padStart(2, '0'), 20, 58, 48, '#FFFFFF', 'left', true);
	const aff = typeof jaugesAffichees === 'function' ? jaugesAffichees() : Jeu.jauges || {};
	['fluidite', 'reputation', 'budget'].forEach((k, i) => {
		const y = 150 + i * 130;
		const va = Math.round(aff[k] || 0);
		const seuil = Jeu.seuilExces ? Jeu.seuilExces(k) : null;
		const enEx = seuil !== null && va >= seuil;
		texteP(ctx, t('jaugeTitre.' + k), 20, y + 8, 32, '#FFFFFF');
		texteP(ctx, String(va) + (enEx ? ' ⚠' : ''), 20 + lr, y, 48, enEx ? DS.alerteClair : couleurJaugePortrait(va), 'right', true);
		ctx.fillStyle = 'rgba(255,255,255,0.15)';
		ctx.fillRect(20, y + 66, lr, 12);
		ctx.fillStyle = enEx ? DS.alerte : couleurBarrePortrait(va);
		ctx.fillRect(20, y + 66, (lr * Math.max(0, Math.min(100, va))) / 100, 12);
		if (seuil !== null) hachuresPortrait(ctx, 20 + (lr * seuil) / 100, 20 + lr, y + 66, 12);
	});
	if (bandeEquipesVisible() && scenePortrait() === 'appli') {
		const msg = typeof SELECTION !== 'undefined' && SELECTION.message && millis() - SELECTION.message.t < 5000 ? SELECTION.message : null;
		texteRail(ctx, msg ? String(msg.texte) : t('portrait.envoyerEquipe'), 20, Y_EQUIPES_PAYSAGE, lr, msg ? (msg.ok ? DS.succesClair : DS.erreurClair) : 'rgba(255,255,255,0.75)');
	}
	ctx.restore();
}
function dessinerBarresPortrait() {
	if (PORTRAIT.paysage) return dessinerRailGauche();
	const ctx = PORTRAIT.ctx;
	ctx.save();
	ctx.fillStyle = '#171616';
	ctx.fillRect(0, 0, PL, BARRE_HAUT);
	ctx.fillRect(0, PH - BARRE_ONGLETS - RANGEE_ACTIONS - (bandeEquipesVisible() && scenePortrait() === 'appli' ? BANDE_EQUIPES : 0), PL, PH);
	const aff = typeof jaugesAffichees === 'function' ? jaugesAffichees() : Jeu.jauges || {};
	const lh = 236;
	['fluidite', 'reputation', 'budget'].forEach((k, i) => {
		const x = 20 + i * (lh + 16);
		const va = Math.round(aff[k] || 0);
		// Prompt 213 : zone d'excès (Budget, Réputation) — valeur et barre à la couleur d'alerte, « ⚠ » après la valeur, hachures
		const seuil = Jeu.seuilExces ? Jeu.seuilExces(k) : null;
		const enEx = seuil !== null && va >= seuil;
		texteP(ctx, t('jaugeTitre.' + k), x, 18, 32, '#FFFFFF');
		texteP(ctx, String(va), x, 58, 48, enEx ? DS.alerteClair : couleurJaugePortrait(va), 'left', true);
		if (enEx) {
			const lv = ctx.measureText(String(va)).width;
			texteP(ctx, '⚠', x + lv + 12, 64, 40, DS.alerte, 'left', true);
		}
		ctx.fillStyle = 'rgba(255,255,255,0.15)';
		ctx.fillRect(x, 120, lh, 12);
		ctx.fillStyle = enEx ? DS.alerte : couleurBarrePortrait(va);
		ctx.fillRect(x, 120, (lh * Math.max(0, Math.min(100, va))) / 100, 12);
		if (seuil !== null) hachuresPortrait(ctx, x + (lh * seuil) / 100, x + lh, 120, 12);
	});
	const h = heureAffichee();
	const xr = PL - 20;
	texteP(ctx, t('temps.' + vitesseTemps()), xr, 18, 32, 'rgba(255,255,255,0.75)', 'right');
	texteP(ctx, String(h.h).padStart(2, '0') + ':' + String(h.m).padStart(2, '0'), xr, 58, 48, '#FFFFFF', 'right', true);
	if (bandeEquipesVisible() && scenePortrait() === 'appli') {
		const y = PH - BARRE_ONGLETS - RANGEE_ACTIONS - BANDE_EQUIPES + 10;
		const msg = typeof SELECTION !== 'undefined' && SELECTION.message && millis() - SELECTION.message.t < 5000 ? SELECTION.message : null;
		texteP(ctx, msg ? String(msg.texte).slice(0, 52) : t('portrait.envoyerEquipe'), 20, y, 32, msg ? (msg.ok ? DS.succesClair : DS.erreurClair) : 'rgba(255,255,255,0.75)');
	}
	ctx.restore();
}
/** Bureau : tous les objets de la pièce en grosses cibles (2 colonnes), plus « S'installer au PC » */
/** Prompt 209 : loupe — rectangle de l'image (texte utile dessiné dans la pièce) repris agrandi au bureau en portrait */
function loupePortrait(x, y, l, h, haut) {
	if (typeof PORTRAIT !== 'undefined' && PORTRAIT.actif) (PORTRAIT.loupes = PORTRAIT.loupes || []).push({ x, y, l, h, haut: !!haut });
}
function boutonsBureau(y0) {
	const nb = typeof totalBadges === 'function' && ecran === 'jeu' && Jeu.paquet ? totalBadges() : 0; // prompt 209 : le badge de l'écran passe dans le bouton
	let objets = [{ nom: 'ecran', label: t('portrait.installer') + (nb ? ' (' + texteBadge(nb) + ')' : ''), action: sAsseoir }].concat(
		OBJETS_BUREAU.slice(1)
			.filter((o) => !o.visible || o.visible())
			.map((o) => ({ nom: o.nom, label: String(o.label), action: () => ouvrirObjetBureau(o.nom) })),
	);
	// Prompt 69 : le soir, la sortie devient la grande cible principale (← Sortie)
	if (typeof sortieVisible === 'function' && sortieVisible()) objets = [{ nom: 'sortie', label: '← ' + t('soir.sortie'), action: quitterBureau }].concat(objets.filter((o) => o.nom !== 'sortie'));
	const lb = (PL - 60) / 2;
	// Prompt 214 : tous les boutons à 124 px (≥ 44 px CSS sur un téléphone de 412 px : 124 × 412 / 1080 ≈ 47) ; 96 n'en faisait que 37
	const hp = 124; // prompt 69 : la sortie ≥ 44 px CSS
	if (PORTRAIT.paysage) {
		// Prompt 215 : rail droit, un bouton par ligne (120 px ≈ 46 px CSS), « S'installer au PC » (ou la sortie) en tête ;
		// sur deux colonnes si la hauteur manque (écran bas, sortie du soir en plus)
		const cols = (PH - 40) / objets.length >= 128 ? 1 : 2;
		const lb = (RAIL() - 40 - (cols - 1) * 12) / cols;
		objets.forEach((o, i) => PORTRAIT.boutons.push({ abs: true, x: RAIL() + PL + 20 + (i % cols) * (lb + 12), y: 20 + Math.floor(i / cols) * 132, l: lb, h: 120, texte: o.label, action: o.action, primaire: i === 0 }));
		return;
	}
	objets.forEach((o, i) => {
		const premier = i === 0;
		const col = premier ? 0 : (i - 1) % 2;
		const ligne = premier ? 0 : 1 + Math.floor((i - 1) / 2);
		PORTRAIT.boutons.push({ x: premier ? 20 : 20 + col * (lb + 20), y: premier ? y0 : y0 + hp + 14 + (ligne - 1) * 138, l: premier ? PL - 40 : lb, h: 124, texte: o.label, action: o.action, primaire: premier });
	});
}
function dessinerBoutonPortrait(b) {
	const ctx = PORTRAIT.ctx;
	ctx.save();
	if (b.desactive || b.verrou) ctx.globalAlpha = b.verrou ? 0.4 : 0.5; // prompt 182
	if (b.onglet) {
		// Prompt 205 : onglet de la barre du bas — fond plus clair et filet rouge en haut pour l'entrée affichée
		ctx.fillStyle = b.actif ? '#2A2828' : '#171616';
		ctx.fillRect(b.x, b.y, b.l, b.h);
		ctx.fillStyle = 'rgba(255,255,255,0.15)';
		ctx.fillRect(b.x, b.y, b.l, 2);
		if (b.actif) {
			ctx.fillStyle = DS.primaire;
			ctx.fillRect(b.x + 8, b.y, b.l - 16, 6);
		}
	} else {
		ctx.fillStyle = b.primaire ? DS.primaire : '#171616'; // prompt 115
		ctx.fillRect(b.x, b.y, b.l, b.h);
		ctx.strokeStyle = b.primaire ? DS.primaire : 'rgba(255,255,255,0.6)';
		ctx.lineWidth = 3;
		ctx.strokeRect(b.x + 1.5, b.y + 1.5, b.l - 3, b.h - 3);
	}
	ctx.fillStyle = '#FFFFFF';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	// Prompt 205 : 34 px, réduit au besoin jusqu'à 32 px (≈ 12 px CSS à 412 px de large), jamais en dessous ; au-delà,
	// fillText resserre les lettres (largeur maximale) plutôt que de déborder
	let taille = 34;
	const police = (tl) => (b.onglet && !b.actif ? '400 ' : '600 ') + tl + 'px ' + POLICE_PORTRAIT;
	ctx.font = police(taille);
	while (taille > 32 && ctx.measureText(b.texte).width > b.l - 24) {
		taille -= 2;
		ctx.font = police(taille);
	}
	const yt = b.sous ? b.y + b.h / 2 - 20 : b.y + b.h / 2 + 2;
	ctx.fillText(b.texte, b.x + b.l / 2, yt, b.l - 16);
	if (b.sous) {
		ctx.font = '400 32px ' + POLICE_PORTRAIT;
		ctx.fillStyle = 'rgba(255,255,255,0.8)';
		ctx.fillText(b.sous, b.x + b.l / 2, b.y + b.h / 2 + 22, b.l - 16);
	}
	if (b.jauge !== undefined) {
		ctx.fillStyle = 'rgba(255,255,255,0.15)';
		ctx.fillRect(b.x + 12, b.y + b.h - 14, b.l - 24, 6);
		ctx.fillStyle = b.jauge >= 80 ? DS.erreur : b.jauge >= 50 ? DS.alerte : '#3860FF';
		ctx.fillRect(b.x + 12, b.y + b.h - 14, ((b.l - 24) * Math.min(100, b.jauge)) / 100, 6);
	}
	if (b.badge) {
		const r = 24;
		const cx = b.x + b.l / 2 + Math.min(b.l / 2 - r - 6, ctx.measureText(b.texte).width / 2 + 10);
		const cy = b.y + 34;
		ctx.globalAlpha = 1;
		ctx.fillStyle = DS.primaire;
		ctx.beginPath();
		ctx.arc(cx, cy, r, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle = '#FFFFFF';
		ctx.font = '700 28px ' + POLICE_PORTRAIT;
		ctx.fillText(b.badge > 9 ? '9+' : String(b.badge), cx, cy + 1);
	}
	ctx.restore();
}

// ——— Entrées : portrait → image principale ———
function pointPortrait(e) {
	const tch = (e && e.changedTouches && e.changedTouches[0]) || (e && e.touches && e.touches[0]) || e;
	const r = PORTRAIT.canevas.getBoundingClientRect();
	return { x: ((tch.clientX - r.left) * PLW) / r.width, y: ((tch.clientY - r.top) * PH) / r.height }; // prompt 215 : largeur réelle du canevas
}
/** Place la souris du jeu sur le point correspondant ; renvoie false si le point ne tombe sur aucune région */
function viserDepuisPortrait(p) {
	for (let i = PORTRAIT.regions.length - 1; i >= 0; i--) {
		const r = PORTRAIT.regions[i];
		if (r.inerte) continue; // prompt 217 : décor (pièce du bureau)
		const dy = r.defile ? PORTRAIT.defil : 0;
		if (r.defile && (p.y < PORTRAIT.hautDefil || p.y > PORTRAIT.basDefil)) continue;
		const d = r.dst;
		if (p.x >= d.x && p.x <= d.x + d.l && p.y >= d.y - dy && p.y <= d.y - dy + d.h) {
			window.mouseX = r.src.x + ((p.x - d.x) * r.src.l) / d.l;
			window.mouseY = r.src.y + ((p.y - (d.y - dy)) * r.src.h) / d.h;
			return true;
		}
	}
	return false;
}
function portraitDebut(e) {
	const p = pointPortrait(e);
	PORTRAIT.toucher = { x: p.x, y: p.y, t: millis(), defil: PORTRAIT.defil };
	sourisDansCanevas = false;
	Confort.Son.demarrer();
	viserDepuisPortrait(p); // survol (infobulles) au point touché
}
function portraitDeplacement(e) {
	const d = PORTRAIT.toucher;
	if (!d) return;
	const p = pointPortrait(e);
	const sc = scenePortrait();
	if ((sc === 'appli' || sc === 'vueApp' || ((sc === 'fenetre' || sc === 'rapport' || sc === 'menu' || sc === 'gameover' || PORTRAIT.paysage) && PORTRAIT.defilMax > 0)) && Math.abs(p.y - d.y) > 12) {
		PORTRAIT.cible = null;
		PORTRAIT.defil = constrain(d.defil - (p.y - d.y), 0, PORTRAIT.defilMax); // le doigt fait défiler la colonne
	}
}
function portraitFin(e) {
	const d = PORTRAIT.toucher;
	PORTRAIT.toucher = null;
	if (typeof mouseReleased === 'function') mouseReleased();
	if (!d) return;
	const p = pointPortrait(e);
	const dx = p.x - d.x;
	const dy = p.y - d.y;
	const dist = Math.hypot(dx, dy);
	const scene = scenePortrait();
	if (dist > 70 && Math.abs(dy) > Math.abs(dx)) {
		if (scene === 'bureau' && dy < 0) sAsseoir(); // swipe vers le haut au bureau : s'installer
		return; // dans l'appli, le swipe a fait défiler
	}
	if (dist > 30) return;
	if (millis() - d.t >= DUREE_APPUI_LONG) return; // appui long : infobulle seulement
	const b = PORTRAIT.boutons.find((x) => p.x >= x.x && p.x <= x.x + x.l && p.y >= x.y && p.y <= x.y + x.h);
	if (b) {
		interaction();
		Confort.Son.clic();
		return b.action();
	}
	if (viserDepuisPortrait(p)) mousePressed();
}

function touchMoved(e) {
	if (horsCanevas(e)) return;
	if (PORTRAIT.actif) return portraitDeplacement(e), false;
	if (MOBILE.actif && typeof mouseDragged === 'function') return mouseDragged(), false; // prompt 92 : glisser dans les sources de l'enquête (paysage)
}
// Recomposition après chaque image dessinée par p5
if (typeof p5 !== 'undefined') p5.prototype.registerMethod('post', composerPortrait);
