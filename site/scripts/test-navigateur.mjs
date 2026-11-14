// Nantes en régulation — prompt 210 (audit 206, constat 6) : le jeu tourne-t-il VRAIMENT dans un navigateur ?
// test-jeu.mjs charge game.js dans Node, mais jamais sketch.js : un setup() ou un draw() cassé passait inaperçu.
// Ici, Chromium sans interface ouvre le jeu servi en local, réseau externe coupé (mode hors ligne réel), en
// 1366 × 768 puis en mobile portrait 412 × 915, lance une partie, va au poste, et vérifie : aucune erreur de page,
// la boucle de dessin avance. Puis le mode exposition (?expo=1) : violence masquée, ni webcam ni micro hérités.
//
// playwright-core n'est PAS une dépendance du site (seule dépendance : astro). Il est cherché :
//   1. installé à côté (CI : `npm i --no-save playwright-core`) ;
//   2. dans le cache npx (~/.npm/_npx/*/node_modules/playwright-core).
// Absent : le test est ignoré (message), sauf si EXIGER_NAVIGATEUR=1 (CI), où il échoue.
import { createServer } from 'node:http';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { homedir } from 'node:os';

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const exiger = process.env.EXIGER_NAVIGATEUR === '1';

async function trouverPlaywright() {
	try {
		return await import('playwright-core');
	} catch (e) {}
	const npx = join(homedir(), '.npm', '_npx');
	if (existsSync(npx))
		for (const d of readdirSync(npx)) {
			const p = join(npx, d, 'node_modules', 'playwright-core', 'index.mjs');
			if (existsSync(p)) {
				try {
					return await import(pathToFileURL(p).href);
				} catch (e) {}
			}
		}
	return null;
}

const pw = await trouverPlaywright();
if (!pw) {
	const msg = 'Test navigateur : playwright-core introuvable — ignoré (CI : npm i --no-save playwright-core).';
	if (exiger) {
		console.error(msg);
		process.exit(1);
	}
	console.log(msg);
	process.exit(0);
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.md': 'text/markdown; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
const serveur = createServer((req, res) => {
	let chemin = decodeURIComponent(new URL(req.url, 'http://x').pathname);
	if (chemin.endsWith('/')) chemin += 'index.html';
	const f = normalize(join(pub, chemin));
	if (!f.startsWith(pub) || !existsSync(f) || !statSync(f).isFile()) {
		res.writeHead(404);
		return res.end();
	}
	res.writeHead(200, { 'Content-Type': TYPES[extname(f)] || 'application/octet-stream' });
	res.end(readFileSync(f));
});
await new Promise((r) => serveur.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${serveur.address().port}/`;

const erreurs = [];
let controles = 0;
const verifier = (ok, message) => (ok ? controles++ : erreurs.push(message));

let navigateur;
const ARGS = ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'];
// Le navigateur attendu par cette version de playwright-core peut manquer : on essaie aussi les Chromium déjà en cache
const cachePw = join(homedir(), '.cache', 'ms-playwright');
const candidats = [undefined].concat(
	existsSync(cachePw)
		? readdirSync(cachePw)
				.filter((d) => /^chromium(_headless_shell)?-\d+$/.test(d))
				.sort()
				.reverse()
				.flatMap((d) => [join(cachePw, d, 'chrome-linux64', 'chrome'), join(cachePw, d, 'chrome-headless-shell-linux64', 'chrome-headless-shell')])
				.filter((f) => existsSync(f))
		: [],
);
let derniere = null;
for (const executablePath of candidats) {
	try {
		navigateur = await pw.chromium.launch({ args: ARGS, executablePath });
		break;
	} catch (e) {
		derniere = e;
	}
}
if (!navigateur) {
	const e = derniere;
	serveur.close();
	const msg = 'Test navigateur : Chromium introuvable (npx playwright-core install chromium) — ' + String(e.message).split('\n')[0];
	if (exiger) {
		console.error(msg);
		process.exit(1);
	}
	console.log(msg + ' — ignoré.');
	process.exit(0);
}

/** Ouvre une page, réseau externe coupé ; renvoie { page, fautes } (erreurs de page et console.error) */
async function ouvrir(url, options) {
	const ctx = await navigateur.newContext(Object.assign({ serviceWorkers: 'block' }, options || {}));
	await ctx.route('**/*', (route) => (route.request().url().startsWith(base) ? route.continue() : route.abort()));
	const page = await ctx.newPage();
	const fautes = [];
	page.on('pageerror', (e) => fautes.push('pageerror : ' + String(e.message).split('\n')[0]));
	page.on('console', (m) => {
		// Les requêtes externes coupées volontairement produisent des erreurs réseau : seules les erreurs de script comptent
		if (m.type() === 'error' && !/Failed to load resource|net::ERR_FAILED|ERR_INTERNET_DISCONNECTED/.test(m.text())) fautes.push('console : ' + m.text().slice(0, 200));
	});
	await page.goto(base + url, { waitUntil: 'load' });
	return { ctx, page, fautes };
}
const images = (page) => page.evaluate(() => (typeof frameCount === 'number' ? frameCount : -1));
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

const TAILLES = [
	{ nom: '1366 × 768', options: { viewport: { width: 1366, height: 768 } } },
	{ nom: 'mobile portrait 412 × 915', options: { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
];
try {
	for (const { nom, options } of TAILLES) {
		const { ctx, page, fautes } = await ouvrir('index.html?audit=textes', options);
		await page.waitForFunction(() => typeof frameCount === 'number' && frameCount > 10 && window.AUDIT_PARCOURS, null, { timeout: 20000 }).catch(() => {});
		const f0 = await images(page);
		verifier(f0 > 10, `${nom} : la boucle de dessin ne démarre pas (frameCount = ${f0}) — setup() ou draw() en erreur ?`);
		// Délai borné : si la boucle de dessin est arrêtée, attendreImages ne rendrait jamais la main
		const borne = (promesse, ms) => Promise.race([promesse, pause(ms).then(() => ({ erreur: 'délai dépassé (' + ms + ' ms) : boucle de dessin arrêtée ?' }))]);
		const lance = await borne(page
			.evaluate(async () => {
				const { H, attendreImages } = window.AUDIT_PARCOURS;
				H.partie(0);
				await attendreImages(60);
				H.raz();
				H.poste();
				await attendreImages(60);
				return { ecran, vue, dossiers: (Jeu.paquet || []).length };
			})
			.catch((e) => ({ erreur: String(e.message).split('\n')[0] })), 15000);
		verifier(!lance.erreur && lance.ecran === 'jeu' && lance.vue === 'poste' && lance.dossiers > 0, `${nom} : partie hors ligne au poste — ${JSON.stringify(lance)}`);
		const f1 = await images(page);
		await pause(1000);
		const f2 = await images(page);
		verifier(f2 > f1, `${nom} : la boucle de dessin s'est arrêtée en partie (${f1} → ${f2})`);
		verifier(!fautes.length, `${nom} : ${fautes.length} erreur(s) de page — ${fautes.slice(0, 3).join(' | ')}`);
		await ctx.close();
	}
	// Mode exposition : réglages d'un « visiteur précédent » (webcam allumée, violence affichée) → remis à zéro
	{
		const ctx = await navigateur.newContext({ viewport: { width: 1366, height: 768 }, serviceWorkers: 'block' });
		await ctx.route('**/*', (route) => (route.request().url().startsWith(base) ? route.continue() : route.abort()));
		await ctx.addInitScript(() => {
			try {
				localStorage.setItem('pxe-nte001:jeu:reglages', JSON.stringify({ webcam: true, micro: false, masquerViolence: false }));
			} catch (e) {}
		});
		const page = await ctx.newPage();
		const fautes = [];
		page.on('pageerror', (e) => fautes.push(String(e.message).split('\n')[0]));
		await page.goto(base + 'index.html?expo=1', { waitUntil: 'load' });
		await page.waitForFunction(() => typeof frameCount === 'number' && frameCount > 10, null, { timeout: 20000 }).catch(() => {});
		const r = await page.evaluate(() => ({ expo: EXPO.actif, masque: Jeu.violenceMasquee(), webcam: Confort.Reglages.webcam, micro: Confort.Reglages.micro, camActive: CAM.active }));
		verifier(r.expo && r.masque && r.webcam === false && r.micro === true && !r.camActive, `exposition : réglages du visiteur précédent remis à zéro — ${JSON.stringify(r)}`);
		verifier(!fautes.length, `exposition : erreur(s) de page — ${fautes.slice(0, 3).join(' | ')}`);
		await ctx.close();
	}
} finally {
	await navigateur.close();
	serveur.close();
}

if (erreurs.length) {
	console.error(`Test navigateur : ${erreurs.length} erreur(s) sur ${controles + erreurs.length} contrôles`);
	for (const e of erreurs) console.error(`  ✗ ${e}`);
	process.exit(1);
}
console.log(`Test navigateur : ${controles} contrôles réussis (Chromium sans interface, hors ligne, 2 tailles, partie au poste, mode exposition).`);
