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
const VERSION = 'nte-regulation-867f709212';
const ESSENTIELS = [
	"./",
	"./accessibilite.js",
	"./aide.js",
	"./apple-touch-icon.png",
	"./applis.js",
	"./assets/credits/guillaume-pp.webp",
	"./assets/credits/matteo-pp.webp",
	"./autorisations.js",
	"./bureau.js",
	"./cafe.js",
	"./carte-alertes.js",
	"./carte.js",
	"./community.js",
	"./confort.js",
	"./credits.js",
	"./data/fallback.js",
	"./data/lieux.js",
	"./data/lignes.js",
	"./data/loire.js",
	"./data/messages.js",
	"./data/reponses.js",
	"./data/semaines.js",
	"./donnees.js",
	"./ds.js",
	"./enquete.js",
	"./expo.js",
	"./favicon.ico",
	"./favicon.svg",
	"./feedback.js",
	"./fonts.css",
	"./fonts/jetbrains-mono-italic-latin-ext.woff2",
	"./fonts/jetbrains-mono-italic-latin.woff2",
	"./fonts/jetbrains-mono-var-latin-ext.woff2",
	"./fonts/jetbrains-mono-var-latin.woff2",
	"./game.js",
	"./gameover.js",
	"./glisser.js",
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
	"./lecteur-ecran.js",
	"./lib/p5.min.js",
	"./manifest.json",
	"./manifest.webmanifest",
	"./mecaniques.js",
	"./menu-app.js",
	"./menu.js",
	"./micro.js",
	"./mobile.js",
	"./multitache.js",
	"./notifs-tel.js",
	"./os.js",
	"./panneau.js",
	"./parametres.js",
	"./patron.js",
	"./personnages.js",
	"./portrait.js",
	"./posture.js",
	"./progression-bureau.js",
	"./rythme.js",
	"./sauvegarde.js",
	"./sieste.js",
	"./sketch.js",
	"./soir.js",
	"./style.css",
	"./taches-ui.js",
	"./taches.js",
	"./telephone-main.js",
	"./telephone.js",
	"./texte.js",
	"./theme.js",
	"./traces.js",
	"./version.js",
	"./webcam.js"
];
const COMPLEMENTS = [
	"./audio/chillin-poupi.mp3",
	"./audio/lofi-softly.mp3",
	"./audio/lofi-standing.mp3",
	"./audio/lofi-work.mp3",
	"./audio/night-in-a-seashell.mp3",
	"./audio/travel-to-the-horizon.mp3",
	"./kit-presse/README.md",
	"./kit-presse/communique-de-presse.md",
	"./kit-presse/communique-de-presse.txt",
	"./kit-presse/detail-01.jpg",
	"./kit-presse/hero.jpg",
	"./kit-presse/index.html",
	"./kit-presse/logo.svg",
	"./kit-presse/process.jpg",
	"./kit-presse/thumb.jpg",
	"./presentation/assets/404-VQkf1Vlw.css",
	"./presentation/assets/NoteDisplay-DCBzjb4F.css",
	"./presentation/assets/SlideWrapper-DXuS7oUD.css",
	"./presentation/assets/entry-CQkCdRep.css",
	"./presentation/assets/index-BNndVvkI.css",
	"./presentation/assets/index-Rs8oT701.js",
	"./presentation/assets/logo-BYkHSa_O.png",
	"./presentation/assets/md-B3_sWJMK.js",
	"./presentation/assets/md-BAb5P-hn.js",
	"./presentation/assets/md-BGEufpHP.js",
	"./presentation/assets/md-BPqMNXF1.js",
	"./presentation/assets/md-C3JznfSl.js",
	"./presentation/assets/md-CGnCNMRd.js",
	"./presentation/assets/md-CIVFlesV.js",
	"./presentation/assets/md-CTK0qo_8.js",
	"./presentation/assets/md-Cl9Z5uHm.js",
	"./presentation/assets/md-DLlZC_D9.js",
	"./presentation/assets/md-DZD7o8qF.js",
	"./presentation/assets/md-DtMNVNy7.js",
	"./presentation/assets/md-Dx5CHPCJ.js",
	"./presentation/assets/md-O7ReZhOk.js",
	"./presentation/assets/md-aAuCMs-o.js",
	"./presentation/assets/md-d5FwiuyQ.css",
	"./presentation/assets/md-fcsV_e5f.css",
	"./presentation/assets/modules/file-saver-_HzGZh9f.js",
	"./presentation/assets/modules/shiki-DGvFi9d5.js",
	"./presentation/assets/modules/shiki-V4-KMA-J.css",
	"./presentation/assets/modules/unplugin-icons-D-dBTznm.js",
	"./presentation/assets/modules/vue-Cvcc9j5C.js",
	"./presentation/assets/overview-ClDqe5sD.css",
	"./presentation/assets/play-D_7yfuao.css",
	"./presentation/assets/presenter-BkinJwTM.css",
	"./presentation/assets/rolldown-runtime-XKyaHtl9.js",
	"./presentation/assets/shortcuts-BZ71j2MF.css",
	"./presentation/assets/slidev/404-C3GI2wfW.js",
	"./presentation/assets/slidev/Arrow-BfaZULuH.js",
	"./presentation/assets/slidev/IconButton-DkCKuyGI.js",
	"./presentation/assets/slidev/Link-DKB130KA.js",
	"./presentation/assets/slidev/Modal-BbHLhAel.js",
	"./presentation/assets/slidev/NoteDisplay-B2aowB-1.js",
	"./presentation/assets/slidev/NoteEditable-BoSVRYtE.js",
	"./presentation/assets/slidev/SlideWrapper-DaxwHWLU.js",
	"./presentation/assets/slidev/TimerBar-D7wRORLg.js",
	"./presentation/assets/slidev/center-DuUdVZ90.js",
	"./presentation/assets/slidev/default-D2k0blU3.js",
	"./presentation/assets/slidev/entry-ZLuvz2_M.js",
	"./presentation/assets/slidev/image-left-Kxl4jGci.js",
	"./presentation/assets/slidev/image-right-XOIe1o-o.js",
	"./presentation/assets/slidev/layoutHelper-q4srqrQP.js",
	"./presentation/assets/slidev/md-5BxKTUWs.js",
	"./presentation/assets/slidev/md-ChltnSrf.js",
	"./presentation/assets/slidev/md-CrdoXZLh.js",
	"./presentation/assets/slidev/notes-DbIyCdUa.js",
	"./presentation/assets/slidev/notes-edit-ciIpY8NQ.js",
	"./presentation/assets/slidev/overview-vCiBAqrj.js",
	"./presentation/assets/slidev/play-BimEwtR1.js",
	"./presentation/assets/slidev/presenter-BgDaq5OQ.js",
	"./presentation/assets/slidev/section-CkYFutqo.js",
	"./presentation/assets/slidev/shortcuts-DlImGBTt.js",
	"./presentation/assets/slidev/title-renderer-CsQ9UcXM.js",
	"./presentation/assets/useClicks-DDvjTulw.js",
	"./presentation/fonts/jetbrains-mono-italic-latin-ext.woff2",
	"./presentation/fonts/jetbrains-mono-italic-latin.woff2",
	"./presentation/fonts/jetbrains-mono-var-latin-ext.woff2",
	"./presentation/fonts/jetbrains-mono-var-latin.woff2",
	"./presentation/img/bureau.webp",
	"./presentation/img/decision.webp",
	"./presentation/img/equipe/guillaume-pp.webp",
	"./presentation/img/equipe/matteo-pp.webp",
	"./presentation/img/journal.webp",
	"./presentation/img/sources.webp",
	"./presentation/img/telephone.webp",
	"./presentation/index.html",
	"./presentation/og-image.png",
	"./cartel/",
	"./making-of/",
	"./kit-presse/",
	"./presentation/"
];
/* précache:fin */

self.addEventListener('install', (e) => {
	e.waitUntil(
		caches
			.open(VERSION)
			// Prompt 210 : noyau en addAll STRICT — une entrée en échec fait échouer l'installation (l'ancien service
			// worker reste en place) au lieu d'installer un cache incomplet sans le dire
			.then((c) => c.addAll(ESSENTIELS.map((u) => new Request(u, { cache: 'reload' }))).then(() => c))
			// Lot complémentaire (musique MP3, pages Astro) : un échec n'empêche pas l'installation ; un morceau déjà
			// présent dans un ancien cache est repris tel quel au lieu d'être retéléchargé à chaque déploiement
			.then((c) =>
				Promise.allSettled(
					COMPLEMENTS.map((u) =>
						(/\/audio\//.test(u) ? caches.match(u) : Promise.resolve(null)).then((ancien) => (ancien ? c.put(u, ancien) : c.add(new Request(u, { cache: 'reload' })))),
					),
				),
			)
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
