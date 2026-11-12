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
const VERSION = 'nte-regulation-f137d2990a';
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
	"./captures/trailer-poster.jpg",
	"./captures/trailer.fr.vtt",
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
	"./kit-presse/README.md",
	"./kit-presse/communique-de-presse.md",
	"./kit-presse/communique-de-presse.txt",
	"./kit-presse/detail-01.jpg",
	"./kit-presse/hero.jpg",
	"./kit-presse/index.html",
	"./kit-presse/logo.svg",
	"./kit-presse/process.jpg",
	"./kit-presse/thumb.jpg",
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
	"./personnages.js",
	"./portrait.js",
	"./presentation/assets/404-B8OoIpL6.css",
	"./presentation/assets/NoteDisplay-DCBzjb4F.css",
	"./presentation/assets/SlideWrapper-CKd5Gabq.css",
	"./presentation/assets/entry-QBzLDd3z.css",
	"./presentation/assets/index-BNndVvkI.css",
	"./presentation/assets/index-BNzZ3oTY.js",
	"./presentation/assets/logo-BYkHSa_O.png",
	"./presentation/assets/md-4WcrxN4m.js",
	"./presentation/assets/md-9y4xO7tC.js",
	"./presentation/assets/md-BBFeDwV2.js",
	"./presentation/assets/md-BRSzGJVM.js",
	"./presentation/assets/md-BTgRMV86.js",
	"./presentation/assets/md-BXtJI-ip.js",
	"./presentation/assets/md-BcJzzUv0.js",
	"./presentation/assets/md-Bg3LmaL8.css",
	"./presentation/assets/md-BozGr9ej.js",
	"./presentation/assets/md-C58cm26Z.js",
	"./presentation/assets/md-CRKhEfeT.js",
	"./presentation/assets/md-CTqri51r.js",
	"./presentation/assets/md-CtWEN_WM.js",
	"./presentation/assets/md-D6IjO3Bg.js",
	"./presentation/assets/md-FNHA4M5O.js",
	"./presentation/assets/md-d5FwiuyQ.css",
	"./presentation/assets/md-iX-fb66b.js",
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
	"./presentation/assets/slidev/404-BXpd5oHM.js",
	"./presentation/assets/slidev/Arrow-Hz5dRqEp.js",
	"./presentation/assets/slidev/IconButton-DkCKuyGI.js",
	"./presentation/assets/slidev/Link-CwVJvXmS.js",
	"./presentation/assets/slidev/Modal-BbHLhAel.js",
	"./presentation/assets/slidev/NoteDisplay-BNzR772-.js",
	"./presentation/assets/slidev/NoteEditable-B-rOxHOD.js",
	"./presentation/assets/slidev/SlideWrapper-DeSD9jih.js",
	"./presentation/assets/slidev/TimerBar-D9XSGDug.js",
	"./presentation/assets/slidev/center-CAj4Ho00.js",
	"./presentation/assets/slidev/default-BKK18B7O.js",
	"./presentation/assets/slidev/entry-CPYf5zd_.js",
	"./presentation/assets/slidev/image-left-CWg2SEF-.js",
	"./presentation/assets/slidev/image-right-BiQEdwhU.js",
	"./presentation/assets/slidev/layoutHelper-CbSXXw1j.js",
	"./presentation/assets/slidev/md-Bf5Hwrg0.js",
	"./presentation/assets/slidev/md-CS1IgCWC.js",
	"./presentation/assets/slidev/md-CaKo0uxg.js",
	"./presentation/assets/slidev/notes-edit-BteGw5e_.js",
	"./presentation/assets/slidev/notes-yhhF_d9g.js",
	"./presentation/assets/slidev/overview-Cfjpm9GI.js",
	"./presentation/assets/slidev/play-BMpsLldS.js",
	"./presentation/assets/slidev/presenter-C-U6Qr6U.js",
	"./presentation/assets/slidev/section-CNWycy75.js",
	"./presentation/assets/slidev/shortcuts-BflHryCy.js",
	"./presentation/assets/slidev/title-renderer-JPZSLfN_.js",
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
	"./kit-presse/",
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
	// Prompt 193 : lectures partielles (musique en fichier) — servies depuis le cache quand le fichier y est (hors ligne
	// compris), réponse 206 découpée dans le fichier complet ; sinon laissées au navigateur (réseau)
	if (req.headers.has('range')) {
		e.respondWith(caches.match(req.url, { ignoreSearch: true }).then((enCache) => (enCache ? reponsePartielle(req, enCache) : fetch(req))));
		return;
	}
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

/** Prompt 193 : réponse 206 (Content-Range) découpée dans un fichier complet du cache, pour un en-tête
 * « Range: bytes=début-fin », « bytes=début- » ou « bytes=-suffixe » ; en-tête illisible → fichier entier (200). */
function reponsePartielle(req, rep) {
	return rep.blob().then((blob) => {
		const taille = blob.size;
		const type = rep.headers.get('content-type') || '';
		const m = /^bytes=(\d*)-(\d*)$/.exec((req.headers.get('range') || '').trim());
		if (!m || (m[1] === '' && m[2] === '')) return new Response(blob, { status: 200, headers: { 'Content-Type': type, 'Content-Length': String(taille), 'Accept-Ranges': 'bytes' } });
		const debut = m[1] === '' ? Math.max(0, taille - Number(m[2])) : Number(m[1]);
		const fin = m[1] === '' || m[2] === '' ? taille - 1 : Math.min(Number(m[2]), taille - 1);
		if (debut >= taille || debut > fin) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${taille}` } });
		return new Response(blob.slice(debut, fin + 1), {
			status: 206,
			statusText: 'Partial Content',
			headers: { 'Content-Type': type, 'Content-Length': String(fin - debut + 1), 'Content-Range': `bytes ${debut}-${fin}/${taille}`, 'Accept-Ranges': 'bytes' },
		});
	});
}
