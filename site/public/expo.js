/* Nantes en régulation — prompt 132 : mode exposition (?expo=1 ou #expo).
 * Chargé en PREMIER (avant p5 et les autres scripts) : la purge du stockage doit précéder toute lecture.
 * - Au chargement : efface les clés « pxe-nte001* » du visiteur précédent (partie, progression, tutoriel vu,
 *   carrière, intros…) SAUF les réglages de confort, la langue et le palmarès.
 * - Démarrage court (sketch.js, autorisations.js, os.js) : ni écran « Avant de jouer », ni SMS, ni démarrage du PC,
 *   — le joueur arrive assis devant la carte. Le guide « Prendre en main » reste proposé.
 * - Inactivité EN PARTIE : après 90 s sans geste, un voile « Partie en pause » avec un compte à rebours de 15 s, puis
 *   rechargement de la page (même URL, donc nouvelle purge) : retour à l'écran titre, prêt pour le visiteur suivant.
 *   L'écran titre n'est pas concerné (sa démo automatique tourne déjà). Délai réglable pour les tests : ?inactif=20.
 * Prompt 160 : la partie démarre vraiment au poste (le menu est fermé AVANT de poser la vue), le voile « Partie en
 *   pause » suspend l'horloge du jeu (tempsSuspendu, immersion.js) et n'est annoncé qu'une fois (aria-live polite) ;
 *   le kiosque ne propose plus de sortie (liens externes, installation, nouvelle version) ; marque « EXPO » au titre.
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
	if (typeof JOUR_PC !== 'undefined') JOUR_PC.attendu = false; // pas de démarrage du PC
	// Prompt 160 : fermer le menu ICI, sinon sketch.js le ferme à l'image suivante et remet vue = 'bureau'
	if (typeof MENU !== 'undefined' && MENU.actif) fermerMenuPrincipal();
	// Déjà assis : l'étape « Cliquez sur l'écran du PC » du guide est sans objet, il commence à la suivante
	if (typeof GUIDE !== 'undefined' && GUIDE.actif && GUIDE.etape === 0) {
		GUIDE.etape = 1;
		GUIDE.debutEtape = millis();
	}
	PC.etat = 'appli';
	PC.fenetre = null;
	vue = 'poste';
	if (typeof Confort !== 'undefined') Confort.Son.demarrer();
	if (typeof GUIDE !== 'undefined' && GUIDE.actif && typeof annoncerEtapeGuide === 'function') annoncerEtapeGuide(); // remplace l'annonce de l'étape sautée
}
/** Prompt 160 : voile « Partie en pause » visible → l'horloge du jeu est suspendue (tempsSuspendu, immersion.js) */
const expoEnPause = () => EXPO.actif && !!EXPO.voile && !EXPO.voile.hidden;

// ——— Inactivité en partie ———
if (EXPO.actif) {
	const geste = () => {
		EXPO.dernierGeste = Date.now();
		if (EXPO.voile && !EXPO.voile.hidden) {
			EXPO.voile.hidden = true;
			EXPO.voile.querySelector('.expo-annonce').textContent = ''; // relu à la prochaine apparition
		}
	};
	['keydown', 'pointerdown', 'pointermove', 'touchstart', 'wheel'].forEach((ev) => window.addEventListener(ev, geste, { passive: true, capture: true }));
	const texte = (cle, repli, vars) => (typeof t === 'function' ? t(cle, vars) : repli);
	function voileExpo() {
		if (EXPO.voile) return EXPO.voile;
		const v = document.createElement('div');
		v.id = 'expo-pause';
		// Prompt 160 : annonce polie, une seule fois à l'apparition ; le compte à rebours visible n'est pas relu chaque seconde
		v.setAttribute('aria-live', 'polite');
		v.hidden = true;
		v.innerHTML = '<p class="expo-titre"></p><p class="expo-detail" aria-hidden="true"></p><p class="expo-annonce sr-only"></p>';
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
		const detail = texte('expo.retour', 'Touchez l’écran pour continuer · retour à l’accueil dans ' + reste + ' s', { s: reste });
		v.querySelector('.expo-detail').textContent = detail;
		if (v.hidden) {
			v.hidden = false;
			v.querySelector('.expo-titre').textContent = texte('expo.pause', 'Partie en pause');
			v.querySelector('.expo-annonce').textContent = detail; // lu une fois, avec le titre
		}
	}, 500);
}
