/* Nantes en régulation — prompt 65 : webapp installable.
 * - Enregistre le service worker (http(s) seulement, jamais en file://).
 * - Installation : l'invitation du navigateur (beforeinstallprompt) est gardée pour nos boutons — l'icône
 *   « télécharger » du menu principal (prompt 171, installerJeu) et le bouton de la fenêtre Accessibilité et reprise.
 *   Sans invitation (navigateur qui ne la propose pas, jeu déjà installé), l'icône ouvre une courte explication
 *   (fenêtre 'installation').
 * - appinstalled → message de confirmation.
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
const kiosqueExpo = () => typeof EXPO !== 'undefined' && EXPO.actif; // prompt 160 : ni installation ni bandeau de mise à jour
const installationPossible = () => !kiosqueExpo() && !!PWA.invite && !estInstallee();

function installerApplication() {
	if (!PWA.invite) return;
	const invite = PWA.invite;
	PWA.invite = null;
	invite.prompt();
	invite.userChoice
		.then((c) => annoncer(t(c && c.outcome === 'accepted' ? 'pwa.acceptee' : 'pwa.refusee')))
		.catch(() => {});
}

/** Prompt 171 : icône « télécharger » du menu principal — l'invitation du navigateur si elle existe, sinon l'explication */
function installerJeu() {
	if (kiosqueExpo()) return;
	if (installationPossible()) return installerApplication();
	ouvrirInstallation();
}
function ouvrirInstallation() {
	ouvrir('installation');
	annoncer(t('pwa.aide.titre') + '. ' + (estInstallee() ? t('pwa.aide.dejaInstalle') : [t('pwa.aide.intro'), ...ETAPES_INSTALLATION.map((k) => t('pwa.aide.' + k + '.k') + ' : ' + t('pwa.aide.' + k)), t('pwa.aide.horsLigne')].join(' ')));
}
const ETAPES_INSTALLATION = ['ordinateur', 'android', 'ios'];
/** Explication d'installation (modale par-dessus le menu) : Échap, Entrée ou « Fermer » */
function fenetreInstallation() {
	const l = DS.fenetre.moyenne; // prompt 173 (était 1000)
	const installe = estInstallee();
	const h = installe ? 330 : 620;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.accent);
	noStroke();
	textAlign(LEFT, TOP);
	fill(C.texte);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(36);
	text(t('pwa.aide.titre'), x + 48, y + 36);
	textStyle(NORMAL);
	let yy = y + 104;
	yy += dessinerTexte(t(installe ? 'pwa.aide.dejaInstalle' : 'pwa.aide.intro'), x + 48, yy, l - 96, { taille: 22, interligne: 32 }).h + 20;
	if (!installe) {
		ETAPES_INSTALLATION.forEach((k) => {
			dessinerTexte(t('pwa.aide.' + k + '.k'), x + 48, yy, 250, { taille: 20, interligne: 30, police: POLICE_DONNEES, style: BOLD, couleur: C.orange });
			yy += dessinerTexte(t('pwa.aide.' + k), x + 310, yy, l - 310 - 48, { taille: 20, interligne: 30 }).h + 16;
		});
		dessinerTexte(t('pwa.aide.horsLigne'), x + 48, yy + 8, l - 96, { taille: 20, interligne: 30, couleur: C.gris });
	}
	bouton(x + l - 48 - 260, y + h - 96, 260, 60, t('commun.fermer'), fermer);
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
	if (kiosqueExpo() || document.getElementById('nouvelle-version')) return;
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
	// Prompt 210 (audit 206, accessibilité) : le jeu capte Tab — le bandeau prend donc le focus à son apparition
	// (Échap le ferme et rend le clavier au jeu) ; sketch.js ignore les touches tant qu'un bouton du DOM a le focus
	d.addEventListener('keydown', (ev) => {
		if (ev.key === 'Escape') {
			d.remove();
			const c = document.querySelector('canvas');
			if (c) c.focus();
		}
	});
	document.body.appendChild(d);
	annoncer(t('pwa.nouvelleVersion'));
	b.focus();
}
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
	window.addEventListener('load', () => {
		const avait = !!navigator.serviceWorker.controller; // première visite : pas de bandeau
		navigator.serviceWorker
			.register('./sw.js')
			.then((reg) => {
				if (reg && reg.update) reg.update().catch(() => {}); // prompt 210 : chercher tout de suite une version plus récente
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

// ——— Prompt 132 : filet en cas d'erreur de rendu ———
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
