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
	leverTelephone(); // animation réutilisable : l'objet monte du bas de l'écran, tenu en main
	annoncer(t('cafe.boire'));
	setTimeout(() => baisserTelephone(finGorgee), reduireAnimations ? 900 : 2600);
}
function finGorgee() {
	CAFE.boit = false;
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

// ——— La tasse en main ———
function fenetreCafe() {
	dessinerTelephoneEnMain(contenuTasse, true);
}
function contenuTasse(e) {
	// La coque du téléphone n'est pas dessinée (mode objet) : on dessine une grande tasse dans la zone
	const cx = e.x + e.l / 2;
	const u = millis() - CAFE.debutBu;
	const incl = reduireAnimations ? 0 : constrain((u - 700) / 600, 0, 1) * (u < 2200 ? 1 : Math.max(0, 1 - (u - 2200) / 300));
	push();
	// On porte la tasse à la bouche : elle monte, grossit (elle se rapproche) et s'incline vers soi
	translate(cx - 20, e.y + e.h * 0.58 - incl * 120);
	scale(1.25 + incl * 0.2);
	rotate(incl * 0.18);
	noStroke();
	fill('#f7f1e1');
	rect(-150, -170, 300, 330, 0, 0, 40, 40);
	fill('#d8cfb6');
	rect(110, -170, 40, 330, 0, 0, 40, 0);
	noFill();
	stroke('#f7f1e1');
	strokeWeight(34);
	arc(150, -10, 130, 170, -HALF_PI, HALF_PI); // anse
	noStroke();
	fill('#3b2416'); // café
	rect(-136, -170, 272, 44 - incl * 30);
	fill('#5a3a24');
	rect(-110, -166, 90, 8);
	pop();
	if (!reduireAnimations && incl < 0.5) {
		for (let k = 0; k < 4; k++) {
			const p = (millis() / 1400 + k / 4) % 1;
			fill(255, 255, 255, 120 * (1 - p));
			const vx = cx - 80 + k * 50 + Math.sin(millis() / 300 + k) * 10;
			rect(vx, e.y + e.h * 0.55 - 200 - p * 160, 10, 40);
		}
	}
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
