// Nantes en régulation — régénère site/public/og-image.jpg (1200 × 630) à partir de site/scripts/og-image.html.
// Deux temps : 1) le jeu est ouvert sans interface et son décor en pixel art (tampon 480 × 270 de bureau.js,
// à 10 h, sans menu ni flou) est récupéré ; 2) le gabarit le compose avec le titre et il est capturé.
// Outil ponctuel, hors build : il faut playwright-core et un Chromium (non listés dans package.json, pour garder
// « astro » comme seule dépendance). Usage, depuis site/ :
//   PLAYWRIGHT=/chemin/vers/playwright-core CHROME=/chemin/vers/chrome node scripts/og-image.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const serveur = createServer(async (req, res) => {
	try {
		let f = join(racine, decodeURIComponent(new URL(req.url, 'http://x').pathname));
		if (!f.startsWith(racine)) throw new Error('hors racine');
		if (f.endsWith('/')) f += 'index.html';
		const corps = await readFile(f);
		res.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' });
		res.end(corps);
	} catch {
		res.writeHead(404);
		res.end();
	}
}).listen(0);
const port = serveur.address().port;
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT || 'playwright-core');
const nav = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});

// 1) Le décor réel du jeu : nouvelle partie (aides du parcours d'audit), horloge à 10 h, PC « fermé »
const jeu = await nav.newPage({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' });
await jeu.goto(`http://localhost:${port}/public/index.html?audit=textes`);
await jeu.waitForFunction(() => window.AUDIT_PARCOURS && window.AUDIT_PARCOURS.H, null, { timeout: 30000 });
await jeu.evaluate(() => window.AUDIT_PARCOURS.H.partie(0));
await jeu.waitForTimeout(1800);
await jeu.evaluate(() => {
	window.AUDIT_PARCOURS.H.raz();
	Jeu.horloge.minutes = 10 * 60;
});
await jeu.waitForTimeout(1500);
const piece = await jeu.evaluate(() => (vue === 'bureau' && gBureau.width === 480 && gBureau.height === 270 ? gBureau.elt.toDataURL('image/png') : null));
await jeu.close();
if (!piece) throw new Error('décor du bureau introuvable (gBureau, bureau.js)');

// 2) Le gabarit
const page = await nav.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`http://localhost:${port}/scripts/og-image.html`);
await page.evaluate((url) => dessiner(url), piece);
await page.waitForFunction(() => document.title === 'pret', null, { timeout: 30000 });
await page.locator('#og').screenshot({ path: join(racine, 'public/og-image.jpg'), type: 'jpeg', quality: 90 });
await nav.close();
serveur.close();
console.log('og-image.jpg régénérée (1200 × 630)');
