/* Nantes en régulation — service worker (prompt 48) : le jeu et ses données restent jouables hors ligne.
 * Stratégie « cache d'abord » pour les fichiers du site (même origine) : réponse immédiate depuis le cache,
 * puis mise à jour du cache en arrière-plan (la version suivante est servie à la visite d'après).
 * Les API (Open Data, Open-Meteo, Hub'Eau) ne sont jamais mises en cache ici : le jeu a déjà ses
 * instantanés hors ligne (data/fallback.js). Enregistré seulement en http(s), jamais en file://.
 */
const VERSION = 'nte-regulation-v5'; // prompt 49
const ESSENTIELS = [
	'./',
	'./index.html',
	'./style.css',
	'./lib/p5.min.js',
	'./data/lignes.js',
	'./data/semaines.js',
	'./data/fallback.js',
	'./data/messages.js',
	'./data/loire.js',
	'./gtfsrt.js',
	'./i18n.js',
	'./sauvegarde.js',
	'./game.js',
	'./confort.js',
	'./sketch.js',
	'./ds.js',
	'./bureau.js',
	'./os.js',
	'./menu.js',
	'./guide.js',
	'./telephone.js',
	'./telephone-main.js',
	'./histoire.js',
	'./immersion.js',
	'./mecaniques.js',
	'./accessibilite.js',
	'./enquete.js',
	'./journee.js',
	'./cafe.js',
	'./favicon.svg',
	'./manifest.webmanifest',
];

self.addEventListener('install', (e) => {
	e.waitUntil(
		caches
			.open(VERSION)
			.then((c) => c.addAll(ESSENTIELS))
			.then(() => self.skipWaiting()),
	);
});

self.addEventListener('activate', (e) => {
	e.waitUntil(
		caches
			.keys()
			.then((cles) => Promise.all(cles.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
			.then(() => self.clients.claim()),
	);
});

self.addEventListener('fetch', (e) => {
	const req = e.request;
	if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return; // API : réseau seulement
	e.respondWith(
		caches.open(VERSION).then((cache) =>
			cache.match(req, { ignoreSearch: true }).then((enCache) => {
				const reseau = fetch(req)
					.then((rep) => {
						if (rep && rep.ok && rep.type === 'basic' && !req.headers.has('range')) cache.put(req, rep.clone());
						return rep;
					})
					.catch(() => enCache);
				return enCache || reseau;
			}),
		),
	);
});
