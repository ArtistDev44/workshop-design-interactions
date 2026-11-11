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
const VERSION = 'nte-regulation-c6fe463c29';
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
	"./presentation/assets/404-VQkf1Vlw.css",
	"./presentation/assets/NoteDisplay-DCBzjb4F.css",
	"./presentation/assets/SlideWrapper-DXuS7oUD.css",
	"./presentation/assets/entry-CQkCdRep.css",
	"./presentation/assets/index-B47FUXgf.css",
	"./presentation/assets/index-DotCu2uY.js",
	"./presentation/assets/logo-BYkHSa_O.png",
	"./presentation/assets/md-BGq_VcDF.js",
	"./presentation/assets/md-BVFt9Gtv.js",
	"./presentation/assets/md-BvihD4hh.js",
	"./presentation/assets/md-C1GaK1Ab.js",
	"./presentation/assets/md-Cc3HS82H.js",
	"./presentation/assets/md-CeqbKQe-.js",
	"./presentation/assets/md-Ct5TiK_L.js",
	"./presentation/assets/md-DD5PRcR_.js",
	"./presentation/assets/md-Dk14X-Fq.js",
	"./presentation/assets/md-GE8v2P83.js",
	"./presentation/assets/md-fcsV_e5f.css",
	"./presentation/assets/md-jm4yioAL.js",
	"./presentation/assets/modules/file-saver-_HzGZh9f.js",
	"./presentation/assets/modules/shiki-C_MmXx-G.js",
	"./presentation/assets/modules/shiki-V4-KMA-J.css",
	"./presentation/assets/modules/unplugin-icons-r8Ubbiz7.js",
	"./presentation/assets/modules/vue-c4ukNeYm.js",
	"./presentation/assets/overview-ClDqe5sD.css",
	"./presentation/assets/play-D_7yfuao.css",
	"./presentation/assets/presenter-BkinJwTM.css",
	"./presentation/assets/rolldown-runtime-XKyaHtl9.js",
	"./presentation/assets/shortcuts-BZ71j2MF.css",
	"./presentation/assets/slidev/404-hLeU2lGP.js",
	"./presentation/assets/slidev/Arrow-C0QDDfBr.js",
	"./presentation/assets/slidev/IconButton-r4sOvuaG.js",
	"./presentation/assets/slidev/Modal-D5jYs28J.js",
	"./presentation/assets/slidev/NoteDisplay-atl0U5FM.js",
	"./presentation/assets/slidev/NoteEditable-CpWOE6Jm.js",
	"./presentation/assets/slidev/SlideWrapper-BxrfHAdK.js",
	"./presentation/assets/slidev/TimerBar-dYjUv1_M.js",
	"./presentation/assets/slidev/default-DKFalsn8.js",
	"./presentation/assets/slidev/entry-BxUwEazU.js",
	"./presentation/assets/slidev/md-B030NZYy.js",
	"./presentation/assets/slidev/md-BIC36dv2.js",
	"./presentation/assets/slidev/md-BKgr0-JJ.js",
	"./presentation/assets/slidev/md-BSehZfLq.js",
	"./presentation/assets/slidev/md-DHF1L0LA.js",
	"./presentation/assets/slidev/md-YTv8SJjx.js",
	"./presentation/assets/slidev/notes-DihUIm0Q.js",
	"./presentation/assets/slidev/notes-edit-CR0jOumc.js",
	"./presentation/assets/slidev/overview-Dy_GWy1S.js",
	"./presentation/assets/slidev/play-C2Juscvq.js",
	"./presentation/assets/slidev/presenter-CTBaUYFE.js",
	"./presentation/assets/slidev/section-PHHin_Xl.js",
	"./presentation/assets/slidev/shortcuts-lu5M5uvM.js",
	"./presentation/assets/slidev/two-cols-Br9wskLi.js",
	"./presentation/img/briefing.webp",
	"./presentation/img/bureau.webp",
	"./presentation/img/decision.webp",
	"./presentation/img/journal.webp",
	"./presentation/img/retour.webp",
	"./presentation/img/telephone.webp",
	"./presentation/index.html",
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
