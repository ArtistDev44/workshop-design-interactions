// Nantes en régulation — prompt 106 / 109 : positions RÉELLES pour la carte (lancé à la main, jamais au build).
// 1. Lieux des événements de l'agenda (texte_source « … — Lieu, Ville » des semaines préparées) ;
// 2. Centres d'intervention des équipes (commissariat, centre de secours, hôpital, exploitant du réseau).
// Source : OpenStreetMap (© contributeurs OpenStreetMap, ODbL) via le service de géocodage Nominatim,
// une requête par seconde (politique d'usage). Un lieu non trouvé n'est PAS placé (« Lieu à préciser » en jeu).
// Écrit public/data/lieux.json et public/data/lieux.js (même contenu, pour l'ouverture par double clic).
import { readFile, readdir, writeFile } from 'node:fs/promises';

const JEU = new URL('../public/data/', import.meta.url);
const UA = 'workshop-etudiant-pxe/1.0 (atelier de design, usage ponctuel)';
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
async function geocoder(q) {
	const u = new URL('https://nominatim.openstreetmap.org/search');
	u.search = new URLSearchParams({ q, format: 'jsonv2', limit: '1', countrycodes: 'fr', viewbox: '-1.80,47.36,-1.33,47.10', bounded: '1' });
	const r = await fetch(u, { headers: { 'User-Agent': UA } });
	await attendre(1200);
	if (!r.ok) return null;
	const [x] = await r.json();
	return x ? { lat: Number(Number(x.lat).toFixed(6)), lon: Number(Number(x.lon).toFixed(6)), osm: x.display_name.slice(0, 140) } : null;
}

// Centres d'intervention (requêtes vérifiées à la main le 12/11/2026)
const CENTRES = {
	police: { nom: 'Commissariat central de Nantes', q: 'Commissariat Central, Place Waldeck Rousseau, Nantes' },
	pompiers: { nom: 'Centre de secours principal de Nantes-Gouzé', q: 'Centre de secours principal de Nantes-Gouzé' },
	ambulance: { nom: 'Hôpital Nord Laennec (CHU de Nantes)', q: 'Hôpital Nord Guillaume et René Laennec, Saint-Herblain' },
	techniciens: { nom: 'Semitan (exploitant du réseau Naolib), Dalby', q: 'Semitan, Rue Bellier, Nantes' },
};

const sortie = { source: 'OpenStreetMap (© contributeurs OpenStreetMap, ODbL) via Nominatim', extraitLe: new Date().toISOString(), centres: {}, lieux: {} };
for (const [cle, c] of Object.entries(CENTRES)) {
	const g = await geocoder(c.q);
	if (g) sortie.centres[cle] = { nom: c.nom, ...g };
	console.log(cle, g ? `${g.lat}, ${g.lon}` : 'NON TROUVÉ');
}
const lieux = new Set();
for (const f of (await readdir(new URL('semaines/', JEU))).filter((x) => x.endsWith('.json'))) {
	const d = JSON.parse(await readFile(new URL('semaines/' + f, JEU), 'utf8'));
	for (const x of [...d.dossiers, ...(d.evenements || [])]) {
		if (x.type !== 'événement') continue;
		const p = String(x.texte_source || '').split(' — ');
		if (p.length > 1) lieux.add(p[p.length - 1]);
	}
}
for (const l of lieux) {
	// 2e essai : le nom du lieu seul (sans la ville), toujours limité à l'emprise de la métropole
	const g = (await geocoder(l)) || (await geocoder(l.split(',')[0].replace(/\s*\(([^)]*)\)/, ' $1')));
	if (g) sortie.lieux[l] = g;
	console.log(g ? '✓' : '✗', l);
}
const json = JSON.stringify(sortie, null, '\t');
await writeFile(new URL('lieux.json', JEU), json + '\n');
await writeFile(new URL('lieux.js', JEU), '/* Généré par scripts/geocoder-lieux.mjs — ne pas modifier à la main */\nwindow.LIEUX_DONNEES = ' + json + ';\n');
console.log(`${Object.keys(sortie.centres).length} centres, ${Object.keys(sortie.lieux).length}/${lieux.size} lieux géocodés`);
