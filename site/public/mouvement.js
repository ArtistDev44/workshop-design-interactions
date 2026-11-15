/* Nantes en régulation — prompt 229 : un langage de mouvement commun (design-system/DESIGN.md, § Mouvement).
 * Jetons de durée et de courbe, et deux aides : Mouvement.progres (une transition qui repart quand sa clé change) et
 * Mouvement.survol (un état 0 → 1 lissé, pour le survol des boutons). Animations réduites (réglage du jeu ou
 * prefers-reduced-motion, déjà reflété par `reduireAnimations`) : tout vaut 1 tout de suite.
 */
const Mouvement = (() => {
	const DUREES = { rapide: 120, normal: 220, lent: 420 };
	const COURBES = {
		lineaire: (t) => t,
		sortie: (t) => 1 - Math.pow(1 - t, 3), // ease-out cubique : départ vif, arrivée douce
		entreeSortie: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
		ressort: (t) => {
			// ease-out-back léger (≈ 6 % de dépassement), finit exactement à 1
			const c1 = 1.1;
			const c3 = c1 + 1;
			return t >= 1 ? 1 : 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
		},
	};
	const reduit = () => typeof reduireAnimations !== 'undefined' && reduireAnimations;
	const vitesse = () => (typeof DEV !== 'undefined' && DEV.vitesse ? DEV.vitesse : 1); // prompt 230 : ralenti du mode dev
	const maintenant = () => (typeof millis === 'function' ? millis() : Date.now());
	const borne = (t) => Math.max(0, Math.min(1, t));
	const duree = (d) => (typeof d === 'number' ? d : DUREES[d] || DUREES.normal) / vitesse();
	const courbe = (c) => COURBES[c] || COURBES.sortie;
	/** Transitions en cours : cle → { valeur, debut } ; repart quand la valeur associée change */
	const T = new Map();
	function progres(cle, valeur, d, c) {
		if (reduit()) return 1;
		let e = T.get(cle);
		if (!e || e.valeur !== valeur) T.set(cle, (e = { valeur, debut: maintenant() }));
		return courbe(c)(borne((maintenant() - e.debut) / duree(d)));
	}
	/** Relance explicitement une transition (ex. ouverture d'une fenêtre déjà nommée) */
	function relancer(cle, valeur) {
		T.set(cle, { valeur, debut: maintenant() });
	}
	/** Survol lissé : 0 → 1 quand `actif`, 1 → 0 sinon, sur `rapide` ; mémoire courte (nettoyée chaque seconde) */
	const S = new Map();
	let nettoye = 0;
	function survol(cle, actif) {
		const t = maintenant();
		if (t - nettoye > 1000) {
			S.forEach((e, k) => t - e.vu > 1000 && S.delete(k));
			nettoye = t;
		}
		if (reduit()) return actif ? 1 : 0;
		const e = S.get(cle) || { v: 0, vu: t };
		const pas = (t - e.vu) / duree('rapide');
		e.v = actif ? Math.min(1, e.v + pas) : Math.max(0, e.v - pas);
		e.vu = t;
		S.set(cle, e);
		return COURBES.sortie(e.v);
	}
	/** Appui sur un bouton : enfoncement de 2 px pendant 90 ms (clé du dernier bouton pressé) */
	const APPUI = { cle: null, t: -1e9 };
	function appuyer(cle) {
		APPUI.cle = cle;
		APPUI.t = maintenant();
	}
	function enfoncement(cle) {
		if (reduit() || APPUI.cle !== cle) return 0;
		const k = (maintenant() - APPUI.t) / (90 / vitesse());
		return k >= 0 && k < 1 ? 2 * (1 - k) : 0;
	}
	return { DUREES, COURBES, progres, relancer, survol, appuyer, enfoncement, duree };
})();
