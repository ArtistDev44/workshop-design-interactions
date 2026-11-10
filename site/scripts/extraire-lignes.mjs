// Nantes en régulation — extrait les tracés des lignes Naolib du GTFS statique (prompt 15, Q42).
// Usage (dans site/) : node scripts/extraire-lignes.mjs
// L'archive GTFS (~20 Mo zippée, ~440 Mo décompressée) est trop lourde pour le navigateur :
// ce script la télécharge une fois, garde un tracé simplifié par ligne et écrit
//   public/oeuvres/pxe-nte001-g01-w01/data/lignes.json  (source)
//   public/oeuvres/pxe-nte001-g01-w01/data/lignes.js    (même contenu, pour l'ouverture par double clic)
// Nécessite la commande `unzip` (présente sur macOS et Linux). Lancé à la main, jamais au build.
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { writeFile, rm, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const JEU = new URL('../public/oeuvres/pxe-nte001-g01-w01/data/', import.meta.url);
const DATASET = '244400404_transports_commun_naolib_nantes_metropole_gtfs';
const API = `https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/${DATASET}`;
const TOLERANCE = 0.00012; // ≈ 10 m : simplification Douglas-Peucker

// ——— Téléchargement de l'archive ———
const enreg = (await (await fetch(`${API}/records?limit=1`)).json()).results[0];
const dossierTmp = await mkdtemp(join(tmpdir(), 'gtfs-naolib-'));
const zip = join(dossierTmp, 'gtfs.zip');
const res = await fetch(enreg.fichier.url);
if (!res.ok) throw new Error(`Téléchargement GTFS : HTTP ${res.status}`);
await writeFile(zip, Buffer.from(await res.arrayBuffer()));
console.log(`GTFS valide du ${enreg.debut_de_validite} au ${enreg.fin_de_validite}`);

// ——— Lecture CSV en flux (sans dépendance) ———
function decouper(ligne) {
	const out = [];
	let cur = '';
	let guillemets = false;
	for (let i = 0; i < ligne.length; i++) {
		const c = ligne[i];
		if (c === '"') {
			if (guillemets && ligne[i + 1] === '"') (cur += '"'), i++;
			else guillemets = !guillemets;
		} else if (c === ',' && !guillemets) out.push(cur), (cur = '');
		else cur += c;
	}
	out.push(cur);
	return out;
}
async function lireCsv(fichier, surLigne) {
	const proc = spawn('unzip', ['-p', zip, fichier]);
	const rl = createInterface({ input: proc.stdout, crlfDelay: Infinity });
	let entetes = null;
	for await (const brut of rl) {
		const valeurs = decouper(brut);
		if (!entetes) {
			entetes = valeurs.map((v) => v.replace(/^﻿/, ''));
			continue;
		}
		const o = {};
		entetes.forEach((h, i) => (o[h] = valeurs[i]));
		surLigne(o);
	}
}

// ——— routes.txt : identité des lignes ———
const lignes = new Map();
await lireCsv('routes.txt', (r) =>
	lignes.set(r.route_id, {
		id: r.route_id,
		nom: r.route_short_name,
		libelle: r.route_long_name,
		type: Number(r.route_type), // 0 tram, 3 bus, 4 navette fluviale
		couleur: r.route_color ? `#${r.route_color}` : null,
		ordre: Number(r.route_sort_order) || 0,
	}),
);

// ——— trips.txt : tracé le plus utilisé par ligne et par sens ———
const usage = new Map(); // `${route}|${sens}` -> Map(shape -> nb)
await lireCsv('trips.txt', (t) => {
	if (!t.shape_id) return;
	const cle = `${t.route_id}|${t.direction_id}`;
	if (!usage.has(cle)) usage.set(cle, new Map());
	const m = usage.get(cle);
	m.set(t.shape_id, (m.get(t.shape_id) || 0) + 1);
});
const formesRetenues = new Map(); // shape -> route
for (const [cle, m] of usage) {
	const [route] = cle.split('|');
	const [forme] = [...m.entries()].sort((a, b) => b[1] - a[1])[0];
	formesRetenues.set(forme, route);
}

// ——— shapes.txt : points des tracés retenus ———
const points = new Map();
await lireCsv('shapes.txt', (s) => {
	if (!formesRetenues.has(s.shape_id)) return;
	if (!points.has(s.shape_id)) points.set(s.shape_id, []);
	points.get(s.shape_id).push([Number(s.shape_pt_sequence), Number(s.shape_pt_lon), Number(s.shape_pt_lat)]);
});

function douglasPeucker(pts, tol) {
	if (pts.length < 3) return pts;
	const [ax, ay] = pts[0];
	const [bx, by] = pts[pts.length - 1];
	const dx = bx - ax;
	const dy = by - ay;
	const n = Math.hypot(dx, dy) || 1e-12;
	let iMax = 0;
	let dMax = 0;
	for (let i = 1; i < pts.length - 1; i++) {
		const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / n;
		if (d > dMax) (dMax = d), (iMax = i);
	}
	if (dMax <= tol) return [pts[0], pts[pts.length - 1]];
	return [...douglasPeucker(pts.slice(0, iMax + 1), tol).slice(0, -1), ...douglasPeucker(pts.slice(iMax), tol)];
}

const arrondi = (v) => Math.round(v * 1e5) / 1e5;
for (const [forme, route] of formesRetenues) {
	const pts = (points.get(forme) || []).sort((a, b) => a[0] - b[0]).map(([, lon, lat]) => [lon, lat]);
	const simple = douglasPeucker(pts, TOLERANCE).map(([lon, lat]) => [arrondi(lon), arrondi(lat)]);
	const l = lignes.get(route);
	if (l && simple.length > 1) (l.traces ??= []).push(simple);
}

// ——— Écriture ———
const liste = [...lignes.values()].filter((l) => l.traces?.length).sort((a, b) => a.ordre - b.ordre);
const tous = liste.flatMap((l) => l.traces.flat());
const sortie = {
	source: `Open Data Nantes Métropole — ${DATASET} (Licence Ouverte), GTFS valide du ${enreg.debut_de_validite} au ${enreg.fin_de_validite}`,
	extraitLe: new Date().toISOString(),
	emprise: {
		ouest: Math.min(...tous.map((p) => p[0])),
		est: Math.max(...tous.map((p) => p[0])),
		sud: Math.min(...tous.map((p) => p[1])),
		nord: Math.max(...tous.map((p) => p[1])),
	},
	lignes: liste.map(({ ordre, ...l }) => l),
};
const json = JSON.stringify(sortie);
await writeFile(new URL('lignes.json', JEU), json + '\n');
await writeFile(new URL('lignes.js', JEU), `window.PXE_LIGNES = ${json};\n`);
await rm(dossierTmp, { recursive: true, force: true });
console.log(`✓ ${liste.length} lignes, ${tous.length} points, ${(json.length / 1024).toFixed(0)} Ko`);
