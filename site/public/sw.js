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
const VERSION = 'nte-regulation-4478f83a97';
const ESSENTIELS = [
	"./",
	"./accessibilite.js",
	"./apple-touch-icon.png",
	"./applis.js",
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
	"./audit-textes.js",
	"./bureau.js",
	"./cafe.js",
	"./captures/demo.mp4",
	"./captures/detail-01.jpg",
	"./captures/hero.jpg",
	"./captures/process.jpg",
	"./captures/thumb.jpg",
	"./carte.js",
	"./community.js",
	"./confort.js",
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
	"./favicon.ico",
	"./favicon.svg",
	"./feedback.js",
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
	"./immersion.js",
	"./index.html",
	"./installation.js",
	"./journal-donnees.js",
	"./journal.js",
	"./journee.js",
	"./juice.js",
	"./lib/p5.min.js",
	"./manifest.json",
	"./manifest.webmanifest",
	"./mecaniques.js",
	"./menu.js",
	"./micro.js",
	"./mobile.js",
	"./multitache.js",
	"./notifs-tel.js",
	"./og-image.jpg",
	"./os.js",
	"./panneau.js",
	"./patron.js",
	"./portrait.js",
	"./presentation/assets/404-B8OoIpL6.css",
	"./presentation/assets/NoteDisplay-DCBzjb4F.css",
	"./presentation/assets/SlideWrapper-CKd5Gabq.css",
	"./presentation/assets/entry-QBzLDd3z.css",
	"./presentation/assets/index-BFzyof6F.js",
	"./presentation/assets/index-DaiSwDPo.css",
	"./presentation/assets/logo-BYkHSa_O.png",
	"./presentation/assets/md-4h3HlYyX.js",
	"./presentation/assets/md-BBy_xJpv.js",
	"./presentation/assets/md-Bg3LmaL8.css",
	"./presentation/assets/md-BgQx2_-1.js",
	"./presentation/assets/md-BhJs-0Sn.js",
	"./presentation/assets/md-Bk1sKA7d.js",
	"./presentation/assets/md-BvaFzOWk.js",
	"./presentation/assets/md-CDng-dNR.js",
	"./presentation/assets/md-CEZQDo3-.js",
	"./presentation/assets/md-CXAXd_ep.js",
	"./presentation/assets/md-DOPUl9WD.js",
	"./presentation/assets/md-DU8sOxo7.js",
	"./presentation/assets/md-Dli0-Wii.js",
	"./presentation/assets/md-UzPYVH92.js",
	"./presentation/assets/md-b1QmfH52.js",
	"./presentation/assets/md-d5FwiuyQ.css",
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
	"./presentation/assets/slidev/404-ihCLB6gJ.js",
	"./presentation/assets/slidev/Arrow-DVSS0CQH.js",
	"./presentation/assets/slidev/IconButton-DkCKuyGI.js",
	"./presentation/assets/slidev/Link-Q5N0tBL4.js",
	"./presentation/assets/slidev/Modal-BbHLhAel.js",
	"./presentation/assets/slidev/NoteDisplay-CPLdsoqA.js",
	"./presentation/assets/slidev/NoteEditable-xijoezXj.js",
	"./presentation/assets/slidev/SlideWrapper-BLEZfsgf.js",
	"./presentation/assets/slidev/TimerBar-ButP-O3Y.js",
	"./presentation/assets/slidev/center-DuOvc98v.js",
	"./presentation/assets/slidev/default-DmI2POFK.js",
	"./presentation/assets/slidev/entry-CQ6RtRr5.js",
	"./presentation/assets/slidev/image-left-CkPHwLSA.js",
	"./presentation/assets/slidev/image-right-Bb7FELWC.js",
	"./presentation/assets/slidev/layoutHelper-CCg33k9o.js",
	"./presentation/assets/slidev/md-B6aK-g32.js",
	"./presentation/assets/slidev/md-CoI5Tx0z.js",
	"./presentation/assets/slidev/md-S6iJlR0t.js",
	"./presentation/assets/slidev/notes-BlKtUc7R.js",
	"./presentation/assets/slidev/notes-edit-Df_ar1VH.js",
	"./presentation/assets/slidev/overview-ejW8NSjq.js",
	"./presentation/assets/slidev/play-CWXS5biG.js",
	"./presentation/assets/slidev/presenter-BnIR70_u.js",
	"./presentation/assets/slidev/section-CGclmb2b.js",
	"./presentation/assets/slidev/shortcuts-Dp0foEWq.js",
	"./presentation/assets/slidev/title-renderer-ZR5ojeE8.js",
	"./presentation/assets/useClicks-DDvjTulw.js",
	"./presentation/fonts/jetbrains-mono-italic-latin-ext.woff2",
	"./presentation/fonts/jetbrains-mono-italic-latin.woff2",
	"./presentation/fonts/jetbrains-mono-var-latin-ext.woff2",
	"./presentation/fonts/jetbrains-mono-var-latin.woff2",
	"./presentation/img/briefing.webp",
	"./presentation/img/bureau.webp",
	"./presentation/img/decision.webp",
	"./presentation/img/journal.webp",
	"./presentation/img/retour.webp",
	"./presentation/img/sources.webp",
	"./presentation/img/telephone.webp",
	"./presentation/index.html",
	"./presentation/og-image.png",
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
