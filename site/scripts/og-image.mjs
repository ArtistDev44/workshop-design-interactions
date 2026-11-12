// Nantes en régulation — régénère site/public/og-image.jpg (1200 × 630) à partir de site/scripts/og-image.html.
// Outil ponctuel, hors build : il faut playwright-core et un Chromium (non listés dans package.json, pour garder
// « astro » comme seule dépendance). Usage, depuis site/ :
//   PLAYWRIGHT=/chemin/vers/playwright-core CHROME=/chemin/vers/chrome node scripts/og-image.mjs
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2' };
const serveur = createServer(async (req, res) => {
	try {
		const f = join(racine, decodeURIComponent(new URL(req.url, 'http://x').pathname));
		if (!f.startsWith(racine)) throw new Error('hors racine');
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
const page = await nav.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`http://localhost:${port}/scripts/og-image.html`);
await page.waitForFunction(() => document.title === 'pret', null, { timeout: 30000 });
await page.locator('#og').screenshot({ path: join(racine, 'public/og-image.jpg'), type: 'jpeg', quality: 88 });
await nav.close();
serveur.close();
console.log('og-image.jpg régénérée (1200 × 630)');
