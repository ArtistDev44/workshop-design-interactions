/* Nantes en régulation — service worker (prompt 48, complété au prompt 65 : webapp installable).
 * - Précache de TOUT ce que le site sert (liste générée au build par scripts/generer-sw.mjs) : après une
 *   première visite, le jeu, ses données, ses musiques et les pages /cartel/, /making-of/, /presentation/
 *   fonctionnent sans réseau.
 * - Navigation (pages) : réseau d'abord, repli sur le cache hors ligne.
 * - Fichiers du site : cache d'abord, mise à jour du cache en arrière-plan.
 * - API externes (Open Data, Open-Meteo, Hub'Eau, GTFS-RT) : jamais mises en cache ici (le jeu a ses replis).
 * - Nouvelle version : skipWaiting + clients.claim ; la page affiche « Nouvelle version disponible ».
 * Enregistré seulement en http(s), jamais en file:// (index.html).
 */
/* précache:début (généré par scripts/generer-sw.mjs — ne pas modifier à la main) */
const VERSION = 'nte-regulation-ec3f2f4283';
const ESSENTIELS = [
	"./",
	"./accessibilite.js",
	"./aide.js",
	"./apple-touch-icon.png",
	"./applis.js",
	"./assets/credits/guillaume-pp.webp",
	"./assets/credits/matteo-pp.webp",
	"./assets/qr-edition.png",
	"./assets/qr-pxe-nte001-g01-w01.png",
	"./audio/CREDITS.md",
	"./audio/chillin-poupi.mp3",
	"./audio/chillin-poupi.ogg",
	"./audio/lofi-softly.mp3",
	"./audio/lofi-softly.ogg",
	"./audio/lofi-standing.mp3",
	"./audio/lofi-standing.ogg",
	"./audio/lofi-work.mp3",
	"./audio/lofi-work.ogg",
	"./audio/night-in-a-seashell.mp3",
	"./audio/night-in-a-seashell.ogg",
	"./audio/travel-to-the-horizon.mp3",
	"./audio/travel-to-the-horizon.ogg",
	"./audit-densite.js",
	"./audit-parcours.js",
	"./audit-textes.js",
	"./autorisations.js",
	"./bureau.js",
	"./cafe.js",
	"./captures/demo.mp4",
	"./captures/detail-01.jpg",
	"./captures/hero.jpg",
	"./captures/process.jpg",
	"./captures/thumb.jpg",
	"./carte-alertes.js",
	"./carte.js",
	"./community.js",
	"./confort.js",
	"./credits.js",
	"./data/fallback.js",
	"./data/fallback.json",
	"./data/fallback/244400404_disponibilite-temps-reel-velos-libre-service-naolib-nantes-metropole.json",
	"./data/fallback/244400404_fluidite-axes-routiers-nantes-metropole.json",
	"./data/fallback/244400404_inventaire-collections-musee-arts-nantes.json",
	"./data/fallback/244400404_occupation-sol-2022-niveau-3-nantes-metropole.json",
	"./data/fallback/244400404_parcs-jardins-nantes.json",
	"./data/fallback/244400404_parkings-publics-nantes-disponibilites.json",
	"./data/fallback/244400404_patrimoine-arbore-nantes-metropole.json",
	"./data/fallback/323266205_alerte-pollens-nantes.json",
	"./data/fallback/323266205_indice-atmo-nantes-metropole.json",
	"./data/lieux.js",
	"./data/lieux.json",
	"./data/lignes.js",
	"./data/lignes.json",
	"./data/loire.js",
	"./data/loire.json",
	"./data/messages.js",
	"./data/messages.json",
	"./data/reponses.js",
	"./data/reponses.json",
	"./data/semaines.js",
	"./data/semaines/2026-09-14.json",
	"./data/semaines/2026-10-12.json",
	"./data/semaines/2026-11-02.json",
	"./donnees.js",
	"./ds.js",
	"./enquete.js",
	"./expo.js",
	"./favicon.ico",
	"./favicon.svg",
	"./feedback.js",
	"./fonts.css",
	"./fonts/README.md",
	"./fonts/jetbrains-mono-italic-latin-ext.woff2",
	"./fonts/jetbrains-mono-italic-latin.woff2",
	"./fonts/jetbrains-mono-var-latin-ext.woff2",
	"./fonts/jetbrains-mono-var-latin.woff2",
	"./game.js",
	"./gameover.js",
	"./glisser.js",
	"./grammar.md",
	"./gtfsrt.js",
	"./guide.js",
	"./histoire.js",
	"./i18n.js",
	"./icon-192.png",
	"./icon-384.png",
	"./icon-512.png",
	"./icon-maskable-192.png",
	"./icon-maskable-512.png",
	"./icones-lucide.js",
	"./immersion.js",
	"./index.html",
	"./installation.js",
	"./journal-donnees.js",
	"./journal.js",
	"./journee.js",
	"./juice.js",
	"./lib/p5.min.js",
	"./licences/lucide-LICENSE.txt",
	"./manifest.json",
	"./manifest.webmanifest",
	"./mecaniques.js",
	"./menu-app.js",
	"./menu.js",
	"./micro.js",
	"./mobile.js",
	"./multitache.js",
	"./notifs-tel.js",
	"./og-image.jpg",
	"./os.js",
	"./panneau.js",
	"./parametres.js",
	"./patron.js",
	"./portrait.js",
	"./presentation/assets/404-B8OoIpL6.css",
	"./presentation/assets/NoteDisplay-DCBzjb4F.css",
	"./presentation/assets/SlideWrapper-CKd5Gabq.css",
	"./presentation/assets/entry-QBzLDd3z.css",
	"./presentation/assets/index-BNndVvkI.css",
	"./presentation/assets/index-DyzV7V6r.js",
	"./presentation/assets/logo-BYkHSa_O.png",
	"./presentation/assets/md-BRpHnrpn.js",
	"./presentation/assets/md-BVnZyAV6.js",
	"./presentation/assets/md-BWm1IVKO.js",
	"./presentation/assets/md-BbvZ8N3c.js",
	"./presentation/assets/md-Bg3LmaL8.css",
	"./presentation/assets/md-CfVL7CMc.js",
	"./presentation/assets/md-CxJUsy1f.js",
	"./presentation/assets/md-CxbP1fGU.js",
	"./presentation/assets/md-DJQ--qp3.js",
	"./presentation/assets/md-DrtyhVtY.js",
	"./presentation/assets/md-DzEhtjBg.js",
	"./presentation/assets/md-HBcPXc1n.js",
	"./presentation/assets/md-HTRL49U-.js",
	"./presentation/assets/md-LWsm7F4i.js",
	"./presentation/assets/md-adhu7luR.js",
	"./presentation/assets/md-d5FwiuyQ.css",
	"./presentation/assets/md-wKy4bOfa.js",
	"./presentation/assets/modules/file-saver-_HzGZh9f.js",
	"./presentation/assets/modules/shiki-DGvFi9d5.js",
	"./presentation/assets/modules/shiki-V4-KMA-J.css",
	"./presentation/assets/modules/unplugin-icons-D-dBTznm.js",
	"./presentation/assets/modules/vue-Cvcc9j5C.js",
	"./presentation/assets/overview-Bb9z8AKt.css",
	"./presentation/assets/play-D_7yfuao.css",
	"./presentation/assets/presenter-CGxudx_m.css",
	"./presentation/assets/rolldown-runtime-XKyaHtl9.js",
	"./presentation/assets/shortcuts-LwzRQvpL.css",
	"./presentation/assets/slidev/404-OGlq3S40.js",
	"./presentation/assets/slidev/Arrow-D-O04WUE.js",
	"./presentation/assets/slidev/IconButton-DkCKuyGI.js",
	"./presentation/assets/slidev/Link-YZVmAl3M.js",
	"./presentation/assets/slidev/Modal-BbHLhAel.js",
	"./presentation/assets/slidev/NoteDisplay-iY_MBmw0.js",
	"./presentation/assets/slidev/NoteEditable-CDe_D7LK.js",
	"./presentation/assets/slidev/SlideWrapper-BlY1i4Y-.js",
	"./presentation/assets/slidev/TimerBar-_tGyXbuk.js",
	"./presentation/assets/slidev/center-DCOV8JB4.js",
	"./presentation/assets/slidev/default-CWmovsPM.js",
	"./presentation/assets/slidev/entry-PR6VZ-pq.js",
	"./presentation/assets/slidev/image-left-Bvrmpf6u.js",
	"./presentation/assets/slidev/image-right-BdsCVA0G.js",
	"./presentation/assets/slidev/layoutHelper-RhKFsrYK.js",
	"./presentation/assets/slidev/md-BFJ_H_DT.js",
	"./presentation/assets/slidev/md-C9m4dJb7.js",
	"./presentation/assets/slidev/md-DF8zY2ia.js",
	"./presentation/assets/slidev/notes-CNkgAOW4.js",
	"./presentation/assets/slidev/notes-edit-KJajhDy1.js",
	"./presentation/assets/slidev/overview-D2XjB3Sf.js",
	"./presentation/assets/slidev/play-DLZf3HHQ.js",
	"./presentation/assets/slidev/presenter-DQTzsG0v.js",
	"./presentation/assets/slidev/section-D_928eMb.js",
	"./presentation/assets/slidev/shortcuts-QWcPr9AZ.js",
	"./presentation/assets/slidev/title-renderer-B9Q54Myu.js",
	"./presentation/assets/useClicks-DDvjTulw.js",
	"./presentation/fonts/jetbrains-mono-italic-latin-ext.woff2",
	"./presentation/fonts/jetbrains-mono-italic-latin.woff2",
	"./presentation/fonts/jetbrains-mono-var-latin-ext.woff2",
	"./presentation/fonts/jetbrains-mono-var-latin.woff2",
	"./presentation/img/briefing.webp",
	"./presentation/img/bureau.webp",
	"./presentation/img/decision.webp",
	"./presentation/img/equipe/guillaume-pp.webp",
	"./presentation/img/equipe/matteo-pp.webp",
	"./presentation/img/journal.webp",
	"./presentation/img/retour.webp",
	"./presentation/img/sources.webp",
	"./presentation/img/telephone.webp",
	"./presentation/index.html",
	"./presentation/og-image.png",
	"./progression-bureau.js",
	"./rythme.js",
	"./sauvegarde.js",
	"./sieste.js",
	"./sketch.js",
	"./soir.js",
	"./source-sheet.md",
	"./style.css",
	"./taches-ui.js",
	"./taches.js",
	"./telephone-main.js",
	"./telephone.js",
	"./texte.js",
	"./theme.js",
	"./traces.js",
	"./webcam.js",
	"./cartel/",
	"./making-of/",
	"./presentation/"
];
/* précache:fin */

self.addEventListener('install', (e) => {
	e.waitUntil(
		caches
			.open(VERSION)
			// Une à une : une entrée absente (ex. page Astro quand on sert public/ en local) n'empêche pas l'installation
			.then((c) => Promise.allSettled(ESSENTIELS.map((u) => c.add(new Request(u, { cache: 'reload' })))))
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
	if (req.headers.has('range')) return; // lectures partielles (audio, vidéo) : laissées au navigateur
	if (req.mode === 'navigate') {
		// Pages : réseau d'abord (contenu à jour), repli sur le cache puis sur l'accueil du jeu
		e.respondWith(
			fetch(req)
				.then((rep) => {
					if (rep && rep.ok) caches.open(VERSION).then((c) => c.put(req, rep.clone()));
					return rep;
				})
				.catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./'))),
		);
		return;
	}
	e.respondWith(
		caches.open(VERSION).then((cache) =>
			cache.match(req, { ignoreSearch: true }).then((enCache) => {
				const reseau = fetch(req)
					.then((rep) => {
						if (rep && rep.ok && rep.type === 'basic') cache.put(req, rep.clone());
						return rep;
					})
					.catch(() => enCache);
				return enCache || reseau;
			}),
		),
	);
});
