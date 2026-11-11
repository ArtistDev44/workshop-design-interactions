/* Nantes en régulation — prompt 96 : game feel (juice) des décisions, d'après le skill `game-feel`.
 * Le juice s'ajoute PAR-DESSUS la mécanique : la secousse déplace la vue (translate autour de composerVue), le
 * hit-stop ralentit seulement l'horloge de jeu (avancerTemps) un instant ; rien ne touche game.js ni les entrées.
 * - Tiers (table du skill) : small (trauma 0,15, sans hit-stop, tic sonore), medium (0,4, 0,05 s, flash de jauge),
 *   large (0,8, 0,10 s, flash, pop du delta). Choix du tier selon max |delta| réel : ≥ 10 large, ≥ 6 medium, sinon small.
 * - Secousse = trauma² × décalage max × somme de sinus (jamais de hasard par image) ; le trauma décroît en TEMPS RÉEL
 *   (1,2 / s), il s'additionne sans se remettre à zéro, et le décalage revient exactement à 0.
 * - Hit-stop : échelle de temps 0,05 pendant ≤ 0,12 s, restaurée en temps réel ; un seul propriétaire (le plus récent).
 * - Pops : ease-out-back (≈ 10 % de dépassement) sur 180 ms, finissant exactement à 1.
 * - Accessibilité : animations réduites → trauma 0, pas de hit-stop, pops instantanés ; réglage « Intensité du
 *   feedback » 100 / 50 / 0 % (fenêtre Accessibilité, touche 6). Aucun flash au-delà de 3 par seconde.
 */
const Juice = (() => {
	const TIERS = {
		small: { trauma: 0.15, stop: 0 },
		medium: { trauma: 0.4, stop: 0.05 },
		large: { trauma: 0.8, stop: 0.1 },
	};
	const DECROISSANCE = 1.2; // trauma perdu par seconde réelle
	const MAX = { x: 14, y: 9 }; // px
	const E = { trauma: 0, t: 0, dernier: null, stopFin: 0, stopId: 0, stopEchelle: 1 };
	const reduit = () => (typeof reduireAnimations !== 'undefined' && reduireAnimations) || intensite() === 0;
	function intensite() {
		const v = typeof Confort !== 'undefined' && Confort.Reglages ? Confort.Reglages.intensiteFeedback : undefined;
		return v === undefined || v === null ? 1 : Math.max(0, Math.min(1, v / 100));
	}
	/** Tier d'une décision selon l'effet réel le plus fort (fonction pure) */
	function tierDeltas(deltas) {
		const m = Math.max(0, ...(deltas || []).map((v) => Math.abs(Number(v) || 0)));
		return m >= 10 ? 'large' : m >= 6 ? 'medium' : 'small';
	}
	/** Ajoute du trauma (borné à 1) et lance le hit-stop du tier ; maintenant en ms réelles */
	function retour(tier, maintenant) {
		const T = TIERS[tier];
		if (!T || reduit()) return { tier, trauma: E.trauma, stop: 0 };
		E.trauma = Math.min(1, E.trauma + T.trauma * intensite());
		if (T.stop) {
			E.stopId++;
			E.stopFin = maintenant + T.stop * 1000; // le plus récent possède la restauration
			E.stopEchelle = 0.05;
		}
		return { tier, trauma: E.trauma, stop: T.stop };
	}
	/** Échelle de temps du jeu (hit-stop) à l'instant donné ; revient à 1 seule, en temps réel */
	function echelleTemps(maintenant) {
		if (E.stopFin && maintenant >= E.stopFin) {
			E.stopFin = 0;
			E.stopEchelle = 1;
		}
		return E.stopFin ? E.stopEchelle : 1;
	}
	/** Avance le trauma en temps réel (ms) et renvoie le décalage {x, y} (0 exact au repos) */
	function decalage(maintenant) {
		const dt = E.dernier === null ? 0 : Math.min(100, maintenant - E.dernier) / 1000;
		E.dernier = maintenant;
		if (E.trauma <= 0) return { x: 0, y: 0 };
		E.trauma = Math.max(0, E.trauma - DECROISSANCE * dt);
		E.t += dt * 30;
		if (E.trauma === 0) return { x: 0, y: 0 };
		const s = E.trauma * E.trauma;
		return { x: MAX.x * s * (0.6 * Math.sin(E.t * 1.7) + 0.4 * Math.sin(E.t * 3.1 + 1)), y: MAX.y * s * (0.6 * Math.sin(E.t * 2.3 + 2) + 0.4 * Math.sin(E.t * 4.1)) };
	}
	/** Pop ease-out-back : 1,15 → 1 en 180 ms (dépassement ≈ 10 %), exactement 1 à la fin ou si réduit */
	function pop(debut, maintenant, depart) {
		if (reduit() || debut === undefined || debut === null) return 1;
		const k = (maintenant - debut) / 180;
		if (k >= 1 || k < 0) return 1;
		const c1 = 1.70158;
		const c3 = c1 + 1;
		const m = k - 1;
		const e = 1 + c3 * m * m * m + c1 * m * m;
		const s0 = depart === undefined ? 1.15 : depart;
		return s0 + (1 - s0) * e;
	}
	return { TIERS, E, tierDeltas, retour, echelleTemps, decalage, pop, intensite };
})();
if (typeof window !== 'undefined') window.Juice = Juice;

/** Un événement de jeu → son bundle (secousse + hit-stop + son du tier). Sons existants seulement (Confort.Son). */
function feedback(tier) {
	const r = Juice.retour(tier, millis());
	if (typeof Confort === 'undefined' || !Confort.Son) return r;
	if (tier === 'small' && Confort.Son.clic) Confort.Son.clic();
	else if (tier === 'medium' && Confort.Son.bip) Confort.Son.bip('choix');
	else if (tier === 'large' && Confort.Son.bip) Confort.Son.bip('consequence'); // signal grave existant (SIGNAUX de confort.js)
	return r;
}
