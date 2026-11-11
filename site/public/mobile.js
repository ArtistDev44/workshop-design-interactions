/* Nantes en régulation — prompt 60, sous-étape 60a : fondations mobiles (ordinateur inchangé).
 * - estMobile() : pointeur grossier ET petit côté de l'écran < 900 px ; réévalué à chaque redimensionnement.
 * - Gestes (mobile seulement) : tap = clic ; appui long = infobulle (pas de clic) ; swipe vers le haut au bureau
 *   = s'installer au PC, vers le bas au poste = se lever (comme la molette, prompt 38).
 * - Paysage : le canevas 16:9 remplit l'écran (100dvh, barres du navigateur comprises).
 * - Portrait : mise en page dédiée (sous-étape 60b, portrait.js) ; l'avis « Tournez votre téléphone » de la
 *   sous-étape 60a a été retiré.
 * - Clavier virtuel : les boîtes HTML (journal de bord, import) suivent la zone visible (visualViewport).
 * Aucune règle du jeu n'est touchée ; sur ordinateur, rien de ce fichier ne s'active.
 */
const MOBILE = { actif: false, portrait: false, toucher: null };
const SEUIL_SWIPE = 70; // px écran
const DUREE_APPUI_LONG = 500; // ms

/** p5 écoute les touchers sur toute la fenêtre : ceux qui visent un élément HTML hors du canevas sont ignorés */
function horsCanevas(e) {
	return !!(e && e.target && e.target.tagName && e.target.tagName !== 'CANVAS');
}
function estMobile() {
	const grossier = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
	return grossier && Math.min(window.innerWidth, window.innerHeight) < 900;
}
function majModeMobile() {
	MOBILE.actif = estMobile();
	MOBILE.portrait = MOBILE.actif && window.innerHeight > window.innerWidth;
	document.body.classList.toggle('mobile', MOBILE.actif);
	activerPortrait(MOBILE.portrait); // prompt 60b : mise en page portrait dédiée (portrait.js)
}
function windowResized() {
	majModeMobile();
}

// ——— Gestes (appelés par touchStarted / touchEnded de p5) ———
function toucherDebut() {
	const tch = (typeof touches !== 'undefined' && touches[0]) || { x: mouseX, y: mouseY };
	MOBILE.toucher = { x: tch.x, y: tch.y, t: millis() };
	sourisDansCanevas = false; // pas de caméra au doigt (prompt 25)
	Confort.Son.demarrer();
}
function toucherFin() {
	const d = MOBILE.toucher;
	MOBILE.toucher = null;
	if (typeof mouseReleased === 'function') mouseReleased(); // micro du poste (prompt 54) relâché
	if (!d) return;
	const dx = mouseX - d.x;
	const dy = mouseY - d.y;
	const k = width / document.querySelector('#scene canvas').getBoundingClientRect().width; // px écran → px canevas
	const dist = Math.hypot(dx, dy) / k;
	if (Math.abs(dy) / k > SEUIL_SWIPE && Math.abs(dy) > Math.abs(dx)) {
		// Swipe vertical : doigt vers le haut = molette vers le haut (s'installer) ; vers le bas = se lever
		scrollSortiePC(dy < 0 ? -150 : 150); // prompt 73 : plus de zoom de carte au swipe
		return;
	}
	if (dist < 14 && millis() - d.t >= DUREE_APPUI_LONG) return; // appui long : l'infobulle reste affichée, pas de clic
	if (dist < 24) mousePressed(); // tap = clic
}

// ——— Clavier virtuel : les boîtes HTML restent dans la zone visible ———
if (typeof window !== 'undefined' && window.visualViewport) {
	const suivre = () => {
		const vv = window.visualViewport;
		document.querySelectorAll('.sv-fond').forEach((el) => {
			el.style.top = vv.offsetTop + 'px';
			el.style.height = vv.height + 'px';
			el.style.bottom = 'auto';
		});
		const a = document.activeElement;
		if (a && (a.tagName === 'TEXTAREA' || a.tagName === 'INPUT') && a.scrollIntoView) a.scrollIntoView({ block: 'center' });
	};
	window.visualViewport.addEventListener('resize', suivre);
	window.visualViewport.addEventListener('scroll', suivre);
}
