/* Nantes en régulation — prompt 52 : le café qui fait monter l'adrénaline.
 * Clic sur la tasse → la tasse monte, tenue en main (même animation que le téléphone, telephone-main.js),
 * on boit, elle redescend → BOOST de 25 s : cœur qui s'accélère puis ralentit (battements synthétisés),
 * pulsation rouge douce sur les bords, lignes de vitesse, léger flou de mouvement, champ de vision élargi.
 * Effet de jeu modeste : le temps est suspendu pendant qu'on boit, et pendant le boost les consultations
 * de sources (prompt 50) ne coûtent pas de temps. Une tasse par journée. Rien ne touche Q1–Q61.
 * Accessibilité : pulsations ≤ 140/min (< 3 par seconde), amplitude faible, jamais de plein écran rouge ;
 * animations réduites : ni lignes, ni flou, ni champ élargi — un liseré rouge fixe et les battements.
 */
const CAFE = { boit: false, debutBu: 0, boost: 0, jour: null, battement: 0, prochainBattement: 0 };
const CAFE_BOOST_MS = 25000;

const cleJourCafe = () => (ecran === 'jeu' && Jeu.jourCourant && Jeu.jourCourant() ? (Jeu.etat.semaine ? Jeu.etat.semaine.lundi : Jeu.etat.mode) + '|' + Jeu.jourIndex : 'menu');

function boireCafe() {
	interaction();
	if (CAFE.boit || fenetre) return;
	if (CAFE.jour === cleJourCafe()) {
		PIECE.message = { texte: t('cafe.vide'), objet: 'tasse', jusqua: millis() + 4000 };
		return annoncer(t('cafe.vide'));
	}
	CAFE.boit = true;
	CAFE.debutBu = millis();
	CAFE.jour = cleJourCafe();
	ouvrir('cafe');
	Confort.Son.clic();
	annoncer(t('cafe.boire'));
	// Prompt 62 : chronologie propre à la tasse (montée, vapeur, gorgée, descente), puis le boost
	setTimeout(finGorgee, reduireAnimations ? 1000 : DUREE_GORGEE);
}
function finGorgee() {
	CAFE.boit = false;
	if (typeof SOMNO !== 'undefined') SOMNO.v = Math.max(0, SOMNO.v - Jeu.REGLAGES.somnolence.cafe); // prompt 78 : le café réveille
	if (fenetre === 'cafe') fenetre = null;
	CAFE.boost = millis();
	CAFE.prochainBattement = millis() + 300;
	annoncer(t('cafe.boost'));
}
/** 0 → 1 → 0 : intensité du boost (montée rapide, longue descente) */
function intensiteBoost() {
	if (!CAFE.boost) return 0;
	const u = (millis() - CAFE.boost) / CAFE_BOOST_MS;
	if (u >= 1) {
		CAFE.boost = 0;
		return 0;
	}
	return u < 0.2 ? u / 0.2 : 1 - (u - 0.2) / 0.8;
}
const boostActif = () => intensiteBoost() > 0;
/** Prompt 50 : pendant le boost, consulter une source ne coûte pas de temps */
const coutSourceCafe = (cout) => (boostActif() ? 0 : cout);

// ——— La tasse en main (prompt 62 : pixel art, même grain que la pièce) ———
const DUREE_GORGEE = 2800;
const PIX_TASSE = 15; // taille d'un « pixel » de la tasse à l'écran
const PAL_TASSE = { contour: '#2b1d14', blanc: '#f4efe4', clair: '#ffffff', ombre: '#d8ceba', ombre2: '#bfb39c', cafe: '#3b2416', creme: '#8a5a32', rouge: '#D4031C', rougeClair: '#ec4a57', peau: '#e2ab84', peauOmbre: '#c08461', peauContour: '#6b3f2a', manche: '#1d2a3a', mancheClair: '#2c3f57' };
function fenetreCafe() {
	const u = millis() - CAFE.debutBu;
	const fin = reduireAnimations ? 1000 : DUREE_GORGEE;
	// Avancement : montée (0–450 ms), attente, gorgée (1 100–2 050 ms), descente (2 350–2 800 ms)
	const monte = reduireAnimations ? 1 : easeOut(constrain(u / 450, 0, 1)) * (1 - easeOut(constrain((u - (fin - 450)) / 450, 0, 1)));
	const gorgee = reduireAnimations ? 0 : Math.sin(Math.PI * constrain((u - 1100) / 950, 0, 1)); // 0 → 1 → 0
	const bu = reduireAnimations ? 0 : constrain((u - 1300) / 600, 0, 1); // le niveau du café baisse pendant la gorgée
	noStroke();
	fill(13, 12, 12, 150 * monte);
	rect(0, 0, L, H);
	if (monte <= 0.01) return;
	const s = PIX_TASSE * (1 + 0.22 * gorgee); // la tasse se rapproche
	const cx = L * 0.56 - 60 * gorgee;
	const cy = lerp(H + 420, H * 0.6, monte) - 300 * gorgee;
	push();
	translate(cx, cy);
	rotate(-0.42 * gorgee); // on la penche vers soi
	translate(-13 * s, -13 * s);
	dessinerTassePixel(s, bu, u);
	pop();
}
/** Mug 20 × 24 « pixels » + anse + main ; s = taille d'un pixel, bu = 0 (pleine) → 1 (bue en partie) */
function dessinerTassePixel(s, bu, u) {
	const P = PAL_TASSE;
	const r = (x, y, l, h, c) => {
		fill(c);
		rect(Math.round(x * s), Math.round(y * s), Math.ceil(l * s), Math.ceil(h * s));
	};
	noStroke();
	// Vapeur : volutes fines (demi-pixels) qui ondulent en montant et s'effacent (figées si animations réduites)
	for (let k = 0; k < 3; k++) {
		const depart = reduireAnimations ? 0 : ((u / 2200 + k / 3) % 1); // chaque filet naît, monte et se dissipe
		for (let j = 0; j < 14; j++) {
			const p = j / 14; // position le long du filet (0 = au ras du café)
			const a = Math.round(120 * (1 - p) * Math.sin(Math.PI * Math.min(1, depart + 0.15)) * (1 - bu * 0.6));
			const ox = 5 + k * 5 + Math.sin(p * 5 + k * 2 + (reduireAnimations ? 0 : u / 450)) * (0.6 + p * 1.6);
			fill(255, 255, 255, a);
			rect(ox * s, (-1 - p * 10 - depart * 2) * s, s * 0.55, s * 0.8); // segments jointifs : un filet continu
		}
	}
	// Anse (derrière la main) : anneau épais aux angles adoucis
	r(20, 8, 5, 2, P.contour);
	r(24, 9, 2, 8, P.contour);
	r(20, 16, 5, 2, P.contour);
	r(20, 9, 4, 1, P.blanc);
	r(24, 10, 1, 6, P.ombre);
	r(20, 16, 4, 1, P.ombre);
	// Corps aux coins arrondis : contour, émail, ombrage à droite, reflet à gauche
	r(1, 2, 18, 22, P.contour);
	r(0, 3, 20, 20, P.contour);
	r(1, 3, 18, 20, P.blanc);
	r(2, 22, 16, 1, P.blanc);
	r(14, 3, 4, 20, P.ombre);
	r(17, 4, 1, 18, P.ombre2);
	r(2, 6, 2, 12, P.clair);
	r(2, 19, 1, 2, P.clair);
	r(3, 22, 14, 1, P.ombre2);
	// Bandeau rouge (Pixel DS) avec un liseré clair et l'ombre du côté droit
	r(1, 13, 18, 3, P.rouge);
	r(1, 13, 18, 1, P.rougeClair);
	r(14, 13, 4, 3, '#a8031a');
	// Ouverture ovale vue de trois quarts : rebord clair, café, reflet de crème (le café baisse quand on boit)
	r(2, 0, 16, 1, P.contour);
	r(1, 1, 18, 3, P.contour);
	r(2, 1, 16, 2, P.blanc);
	const niveau = bu > 0.5 ? 1 : 0;
	r(3, 1 + niveau, 14, 2 - niveau, P.cafe);
	r(4, 2, 12, 1, P.cafe);
	if (!niveau) {
		r(5, 1, 4, 1, P.creme);
		r(6, 2, 2, 1, P.creme);
	}
	// Main : pouce sur l'anse, trois doigts repliés aux jointures arrondies, poignet et manche
	r(18, 5, 7, 4, P.peauContour);
	r(19, 6, 5, 2, P.peau);
	r(19, 7, 5, 1, P.peauOmbre);
	r(23, 6, 1, 1, '#f3cdb0'); // ongle du pouce
	for (let k = 0; k < 3; k++) {
		const y = 10 + k * 2;
		r(22, y, 6, 2, P.peauContour);
		r(21, y + 0.5, 1, 1, P.peauContour); // jointure arrondie
		r(22, y, 5, 1, P.peau);
		r(22, y + 1, 5, 1, P.peauOmbre);
		r(22, y, 1, 1, '#f0c3a2'); // reflet de la jointure
	}
	r(24, 16, 7, 9, P.peauContour);
	r(25, 16, 5, 8, P.peau);
	r(28, 16, 2, 8, P.peauOmbre);
	r(25, 16, 1, 6, '#f0c3a2');
	r(23, 23, 11, 12, P.manche);
	r(24, 23, 3, 12, P.mancheClair);
	r(23, 23, 11, 1, '#0d141d');
}

// ——— Battements du cœur (Web Audio, sous l'interrupteur Son) ———
function bpmBoost() {
	return 66 + intensiteBoost() * 74; // jusqu'à 140 battements par minute (< 3 par seconde)
}
function battreCoeur() {
	if (!boostActif()) return;
	const m = millis();
	if (m < CAFE.prochainBattement) return;
	CAFE.battement = m;
	CAFE.prochainBattement = m + 60000 / bpmBoost();
	const S = Confort.Son;
	if (!Confort.Reglages.son || !S.ctx || !S.maitre) return;
	const c = S.ctx;
	const coup = (t0, force) => {
		const o = c.createOscillator();
		const g = c.createGain();
		o.type = 'sine';
		o.frequency.setValueAtTime(70, t0);
		o.frequency.exponentialRampToValueAtTime(38, t0 + 0.12);
		g.gain.setValueAtTime(0.0001, t0);
		g.gain.exponentialRampToValueAtTime(force, t0 + 0.012);
		g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
		o.connect(g).connect(S.maitre);
		o.start(t0);
		o.stop(t0 + 0.2);
	};
	const f = 0.6 + intensiteBoost() * 0.9; // le cœur cogne plus fort au sommet du boost
	coup(c.currentTime, f); // « lub »
	coup(c.currentTime + 0.17, f * 0.6); // « dub »
}

// ——— Effets visuels, en coordonnées de l'écran (après la pièce, avant les fenêtres) ———
/** Coefficient de surcadrage de la pièce : 1,05 au repos, jusqu'à 1,025 au sommet du boost (champ plus large) */
function surcadrageCafe() {
	if (reduireAnimations || vue !== 'bureau') return 1.05;
	return 1.05 - intensiteBoost() * 0.025;
}
function dessinerBoost() {
	battreCoeur();
	const k = intensiteBoost();
	if (!k) return;
	// Pulsation : enveloppe du dernier battement (décroît en 350 ms)
	const pulse = Math.exp(-(millis() - CAFE.battement) / 350);
	const ctx = drawingContext;
	ctx.save();
	if (reduireAnimations) {
		noFill();
		stroke(212, 3, 28, 90 * k);
		strokeWeight(10);
		rect(5, 5, L - 10, H - 10);
		noStroke();
		ctx.restore();
		return;
	}
	// Flou de mouvement : copie de l'image, très transparente et légèrement agrandie (impression de poussée vers l'avant)
	const ech = 1 + 0.012 * k;
	ctx.globalAlpha = 0.18 * k;
	ctx.drawImage(ctx.canvas, 0, 0, ctx.canvas.width, ctx.canvas.height, (L - L * ech) / 2, (H - H * ech) / 2, L * ech, H * ech);
	ctx.globalAlpha = 1;
	// Vignette rouge sur les bords, synchronisée au cœur (jamais au centre de l'écran)
	const g = ctx.createRadialGradient(L / 2, H / 2, H * 0.5, L / 2, H / 2, L * 0.62); // seulement les bords
	g.addColorStop(0, 'rgba(212,3,28,0)');
	g.addColorStop(0.55, 'rgba(212,3,28,0)');
	g.addColorStop(1, 'rgba(212,3,28,' + (0.12 + 0.3 * pulse) * k + ')');
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, L, H);
	// Lignes de vitesse : rayons courts sur les bords, qui filent vers l'extérieur
	const n = 28;
	stroke(255, 255, 255, 110 * k);
	strokeWeight(3);
	for (let i = 0; i < n; i++) {
		const a = (i / n) * TWO_PI + i * 0.37;
		const p = ((millis() / 500 + i * 0.13) % 1);
		const r0 = H * (0.52 + p * 0.4);
		const r1 = r0 + 40 + 60 * k;
		line(L / 2 + Math.cos(a) * r0 * 1.6, H / 2 + Math.sin(a) * r0, L / 2 + Math.cos(a) * r1 * 1.6, H / 2 + Math.sin(a) * r1);
	}
	noStroke();
	ctx.restore();
}
