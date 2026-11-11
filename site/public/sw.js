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
const VERSION = 'nte-regulation-2d595a917a';
const ESSENTIELS = [
	"./",
	"./accessibilite.js",
	"./apple-touch-icon.png",
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
	"./presentation/assets/index-Dulp928Q.js",
	"./presentation/assets/logo-BYkHSa_O.png",
	"./presentation/assets/md-8uWi8XOg.js",
	"./presentation/assets/md-B1K5DUSO.js",
	"./presentation/assets/md-BogzLb7N.js",
	"./presentation/assets/md-C6wQKWiq.js",
	"./presentation/assets/md-CMPCeouD.js",
	"./presentation/assets/md-Cua9mcGb.js",
	"./presentation/assets/md-D8emvHQU.js",
	"./presentation/assets/md-DL5mewYZ.js",
	"./presentation/assets/md-K-MI-xPW.js",
	"./presentation/assets/md-fcsV_e5f.css",
	"./presentation/assets/md-hTLSDz_Q.js",
	"./presentation/assets/md-vXBmtjFl.js",
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
	"./presentation/assets/slidev/404-D-qpI1BW.js",
	"./presentation/assets/slidev/Arrow-lPr_SNI1.js",
	"./presentation/assets/slidev/IconButton-r4sOvuaG.js",
	"./presentation/assets/slidev/Modal-D5jYs28J.js",
	"./presentation/assets/slidev/NoteDisplay-C4-2c64v.js",
	"./presentation/assets/slidev/NoteEditable-Byj2pkRi.js",
	"./presentation/assets/slidev/SlideWrapper-BkD9CThv.js",
	"./presentation/assets/slidev/TimerBar-Dr4Kg7WD.js",
	"./presentation/assets/slidev/default-CWFTPmz5.js",
	"./presentation/assets/slidev/entry-CY-d7JRK.js",
	"./presentation/assets/slidev/md-70K6KF39.js",
	"./presentation/assets/slidev/md-ZghwtAce.js",
	"./presentation/assets/slidev/md-i9iPA9PZ.js",
	"./presentation/assets/slidev/md-ioGifmc5.js",
	"./presentation/assets/slidev/md-nwU_5vgH.js",
	"./presentation/assets/slidev/md-w1wwCrHT.js",
	"./presentation/assets/slidev/notes-DGs4HkCy.js",
	"./presentation/assets/slidev/notes-edit-D_VDCeeF.js",
	"./presentation/assets/slidev/overview-Dk5esWl3.js",
	"./presentation/assets/slidev/play-BTZiM3V6.js",
	"./presentation/assets/slidev/presenter-CFS-eL0O.js",
	"./presentation/assets/slidev/section-BnvRvNN1.js",
	"./presentation/assets/slidev/shortcuts-BZfVhnQt.js",
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
