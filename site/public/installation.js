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
	else if (action === 'reprendre' && typeof continuerPartie === 'function' && Sauvegarde.lister().length) (typeof avantDeJouer === 'function' ? avantDeJouer(continuerPartie) : continuerPartie()); // prompt 110
}

// Outils de développement chargés SEULEMENT avec leur paramètre (avant l'initialisation de p5, pour que les
// enveloppes de text(), rect()… soient prises par le mode global) : ?audit=textes (prompt 93), ?audit=densite (prompt 101).
// audit-parcours.js (aides du parcours automatique) est chargé avant l'un ou l'autre.
if (typeof location !== 'undefined' && typeof document !== 'undefined') {
	const audit = (/[?&]audit=(textes|densite)(&|$)/.exec(location.search) || [])[1];
	if (audit) {
		const fichiers = ['./audit-parcours.js', `./audit-${audit}.js`];
		if (document.readyState === 'loading') fichiers.forEach((f) => document.write(`<script src="${f}"><\/script>`));
		else {
			const charger = (i) => {
				if (i >= fichiers.length) return;
				const s = document.createElement('script');
				s.src = fichiers[i];
				s.onload = () => charger(i + 1);
				document.head.appendChild(s);
			};
			charger(0);
		}
	}
}

// ——— Prompt 122 : filet en cas d'erreur de rendu ———
// Une exception dans draw() arrête la boucle de p5 : l'écran reste figé pour de bon (bug H_PLATEAU du 12/11).
// Après une erreur, si p5 ne dessine plus rien pendant 2 s (frameCount figé), message sobre puis rechargement au
// bout de 3 s. Au plus un rechargement par minute (sessionStorage), pour ne jamais boucler. Une promesse rejetée
// (réseau, API) ne déclenche rien : elle n'arrête pas le rendu.
(function filetErreur() {
	const CLE = 'pxe-nte001-filet';
	let surveille = false;
	window.addEventListener('error', () => {
		if (surveille) return;
		surveille = true;
		const f0 = window.frameCount;
		setTimeout(() => {
			surveille = false;
			if (document.hidden || window.frameCount !== f0) return; // le rendu continue (ou onglet masqué : rAF suspendu)
			try {
				if (Date.now() - Number(sessionStorage.getItem(CLE) || 0) < 60000) return; // déjà relancé il y a moins d'une minute
				sessionStorage.setItem(CLE, String(Date.now()));
			} catch (e) {
				return; // sans stockage, pas de garde-fou contre une boucle : on ne recharge pas
			}
			const m = document.createElement('div');
			m.id = 'filet-erreur';
			m.setAttribute('role', 'alert');
			m.textContent = typeof t === 'function' ? t('filet.message') : 'Petit souci d’affichage : on relance le jeu…';
			document.body.appendChild(m);
			setTimeout(() => location.reload(), 3000);
		}, 2000);
	});
})();
