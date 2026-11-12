/* Nantes en régulation — prompt 117 : mode exposition (?expo=1 ou #expo).
 * Chargé en PREMIER (avant p5 et les autres scripts) : la purge du stockage doit précéder toute lecture.
 * - Au chargement : efface les clés « pxe-nte001* » du visiteur précédent (partie, progression, tutoriel vu,
 *   carrière, intros…) SAUF les réglages de confort, la langue et le palmarès.
 * - Démarrage court (sketch.js, autorisations.js, os.js) : ni écran « Avant de jouer », ni SMS, ni démarrage du PC,
 *   ni fenêtre « Votre poste » — le joueur arrive assis devant la carte. Le guide « Prendre en main » reste proposé.
 * - Inactivité EN PARTIE : après 90 s sans geste, un voile « Partie en pause » avec un compte à rebours de 15 s, puis
 *   rechargement de la page (même URL, donc nouvelle purge) : retour à l'écran titre, prêt pour le visiteur suivant.
 *   L'écran titre n'est pas concerné (sa démo automatique tourne déjà). Délai réglable pour les tests : ?inactif=20.
 * Hors ?expo=1, rien ne change.
 */
const EXPO = (() => {
	let params = null;
	try {
		params = new URLSearchParams(location.search);
	} catch (e) {}
	const actif = !!((params && params.has('expo') && params.get('expo') !== '0') || location.hash === '#expo');
	// Gardés d'un visiteur à l'autre : confort (son, animations, palette, taille du texte…), langue, palmarès,
	// et les marqueurs de migration de la musique (sinon le choix de piste par défaut serait rejoué)
	const GARDER = ['pxe-nte001:jeu:reglages', 'pxe-nte001-langue', 'pxe-nte001:jeu:meilleurs-bilans', 'pxe-nte001:jeu:chillin-v62', 'pxe-nte001:jeu:lofi-v49', 'pxe-nte001:jeu:coquillage-v101'];
	function purger() {
		try {
			Object.keys(localStorage)
				.filter((k) => k.startsWith('pxe-nte001') && !GARDER.includes(k))
				.forEach((k) => localStorage.removeItem(k));
		} catch (e) {} // stockage bloqué : rien à purger
	}
	if (actif) purger();
	const secondes = params ? Number(params.get('inactif')) : 0;
	return { actif, purger, GARDER, delaiInactif: secondes > 0 ? secondes * 1000 : 90000, compteRebours: 15000, dernierGeste: Date.now(), voile: null };
})();

/** Appelé par lancerNouvellePartie (sketch.js) : le joueur arrive assis devant la carte, sans intro */
function expoAuPoste() {
	introVue = true;
	if (typeof FIL !== 'undefined') FIL.explicationVue = true; // pas de fenêtre « Votre poste »
	if (typeof JOUR_PC !== 'undefined') JOUR_PC.attendu = false; // pas de démarrage du PC
	PC.etat = 'appli';
	PC.fenetre = null;
	vue = 'poste';
	if (typeof Confort !== 'undefined') Confort.Son.demarrer();
}

// ——— Inactivité en partie ———
if (EXPO.actif) {
	const geste = () => {
		EXPO.dernierGeste = Date.now();
		if (EXPO.voile && !EXPO.voile.hidden) EXPO.voile.hidden = true;
	};
	['keydown', 'pointerdown', 'pointermove', 'touchstart', 'wheel'].forEach((ev) => window.addEventListener(ev, geste, { passive: true, capture: true }));
	const texte = (cle, repli, vars) => (typeof t === 'function' ? t(cle, vars) : repli);
	function voileExpo() {
		if (EXPO.voile) return EXPO.voile;
		const v = document.createElement('div');
		v.id = 'expo-pause';
		v.setAttribute('role', 'alertdialog');
		v.setAttribute('aria-live', 'assertive');
		v.hidden = true;
		v.innerHTML = '<p class="expo-titre"></p><p class="expo-detail"></p>';
		document.body.appendChild(v);
		EXPO.voile = v;
		return v;
	}
	setInterval(() => {
		const enPartie = typeof ecran !== 'undefined' && ecran === 'jeu' && typeof MENU !== 'undefined' && !MENU.actif;
		if (!enPartie) return (EXPO.dernierGeste = Date.now());
		const inactif = Date.now() - EXPO.dernierGeste;
		if (inactif < EXPO.delaiInactif) return;
		const reste = Math.ceil((EXPO.delaiInactif + EXPO.compteRebours - inactif) / 1000);
		if (reste <= 0) {
			EXPO.purger();
			return location.reload();
		}
		const v = voileExpo();
		v.querySelector('.expo-titre').textContent = texte('expo.pause', 'Partie en pause');
		v.querySelector('.expo-detail').textContent = texte('expo.retour', 'Touchez l’écran pour continuer · retour à l’accueil dans ' + reste + ' s', { s: reste });
		v.hidden = false;
	}, 500);
}
