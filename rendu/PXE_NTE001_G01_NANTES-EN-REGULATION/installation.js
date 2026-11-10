/* Nantes en régulation — prompt 65 : webapp installable.
 * - Enregistre le service worker (http(s) seulement, jamais en file://).
 * - « Installer l'application » : proposé seulement si le navigateur émet beforeinstallprompt (et pas déjà
 *   installé) — entrée du menu principal et bouton de la fenêtre Accessibilité et reprise.
 * - appinstalled → message de confirmation ; en mode installé (display-mode standalone ou fullscreen) → mention
 *   discrète « webapp installée » au menu.
 * - Nouvelle version prête (le service worker a changé) → bandeau HTML « Nouvelle version disponible — Recharger ».
 * - Raccourcis du manifest : ?action=nouvelle (choix de la partie) et ?action=reprendre (dernière sauvegarde).
 */
const PWA = { invite: null, installee: false };

function estInstallee() {
	try {
		return PWA.installee || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true;
	} catch (e) {
		return false;
	}
}
const installationPossible = () => !!PWA.invite && !estInstallee();

function installerApplication() {
	if (!PWA.invite) return;
	const invite = PWA.invite;
	PWA.invite = null;
	invite.prompt();
	invite.userChoice
		.then((c) => annoncer(t(c && c.outcome === 'accepted' ? 'pwa.acceptee' : 'pwa.refusee')))
		.catch(() => {});
}

window.addEventListener('beforeinstallprompt', (e) => {
	e.preventDefault(); // on garde l'invitation pour notre propre bouton
	PWA.invite = e;
});
window.addEventListener('appinstalled', () => {
	PWA.installee = true;
	PWA.invite = null;
	annoncer(t('pwa.installee'));
	if (typeof Sauvegarde !== 'undefined' && Sauvegarde.toast) Sauvegarde.toast(t('pwa.installee'), 'ok');
});

// ——— Service worker et bandeau de nouvelle version ———
function bandeauNouvelleVersion() {
	if (document.getElementById('nouvelle-version')) return;
	const d = document.createElement('div');
	d.id = 'nouvelle-version';
	d.setAttribute('role', 'status');
	const p = document.createElement('span');
	p.textContent = t('pwa.nouvelleVersion');
	const b = document.createElement('button');
	b.type = 'button';
	b.className = 'sv-bouton';
	b.textContent = t('pwa.recharger');
	b.addEventListener('click', () => location.reload());
	const f = document.createElement('button');
	f.type = 'button';
	f.className = 'sv-bouton sv-secondaire';
	f.textContent = t('commun.fermer');
	f.addEventListener('click', () => d.remove());
	d.append(p, b, f);
	document.body.appendChild(d);
	annoncer(t('pwa.nouvelleVersion'));
}
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
	window.addEventListener('load', () => {
		const avait = !!navigator.serviceWorker.controller; // première visite : pas de bandeau
		navigator.serviceWorker
			.register('./sw.js')
			.then(() => {
				navigator.serviceWorker.addEventListener('controllerchange', () => {
					if (avait) bandeauNouvelleVersion();
				});
			})
			.catch(() => {});
	});
}

// ——— Raccourcis du manifest (appelé en fin de setup) ———
function actionDepuisUrl() {
	let action = null;
	try {
		action = new URLSearchParams(location.search).get('action');
	} catch (e) {}
	if (action === 'nouvelle' && typeof allerChoixSemaine === 'function') allerChoixSemaine();
	else if (action === 'reprendre' && typeof continuerPartie === 'function' && Sauvegarde.lister().length) continuerPartie();
}
