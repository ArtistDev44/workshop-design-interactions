// Régénère les instantanés locaux des API (fallback hors ligne) — prompt 11.
// Usage (dans site/) : node scripts/snapshot.mjs
// À lancer à la main, jamais au build. Écrit de VRAIES données horodatées, jamais inventées.
import { mkdir, writeFile } from 'node:fs/promises';
import { DATASETS, urlDataset } from '../src/lib/datasets.js';

const dossier = new URL('../public/data/fallback/', import.meta.url);
await mkdir(dossier, { recursive: true });

let erreurs = 0;
for (const ds of DATASETS) {
	try {
		const res = await fetch(urlDataset(ds), { signal: AbortSignal.timeout(15000) });
		if (!res.ok) throw new Error(`HTTP ${res.status} — ${(await res.text()).slice(0, 200)}`);
		const data = await res.json();
		const sortie = { fetchedAt: new Date().toISOString(), source: urlDataset(ds), results: data.results ?? [] };
		await writeFile(new URL(`${ds.id}.json`, dossier), JSON.stringify(sortie, null, 1) + '\n');
		console.log(`✓ ${ds.code} ${ds.id} — ${sortie.results.length} enregistrement(s)`);
	} catch (e) {
		erreurs++;
		console.error(`✗ ${ds.code} ${ds.id} — ${e.message}`);
	}
}
process.exitCode = erreurs ? 1 : 0;
