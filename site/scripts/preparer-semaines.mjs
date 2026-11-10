// Nantes en régulation — prépare les semaines rejouées à partir des ARCHIVES PUBLIQUES (prompt 15, mode 1).
// Aucune collecte, aucun retard inventé : chaque dossier cite sa source et sa date.
//
// Usage (dans site/) :
//   node scripts/preparer-semaines.mjs --lister
//       → semaines du changelog GTFS Naolib qui contiennent le plus de perturbations
//   node scripts/preparer-semaines.mjs --semaines 2025-09-22,2024-12-09,2024-10-07 [--fallback 2025-09-22]
//       → écrit data/semaines/{lundi}.json (+ semaines.json / semaines.js), et le fallback si demandé
//
// Sources :
//   - changelog daté du GTFS Naolib (description du jeu 244400404_transports_commun_naolib_nantes_metropole_gtfs)
//   - agenda des événements 244400404_agenda-evenements-nantes-metropole_v2 (dates ≥ 26/09/2025)
//   - archive météo Open-Meteo (ERA5), Nantes 47.2184, -1.5536
// Lancé à la main, jamais au build.
import { writeFile, mkdir } from 'node:fs/promises';

const JEU = new URL('../public/oeuvres/pxe-nte001-g01-w01/data/', import.meta.url);
const SEMAINES = new URL('semaines/', JEU);
const OD = 'https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets';
const GTFS = '244400404_transports_commun_naolib_nantes_metropole_gtfs';
const AGENDA = '244400404_agenda-evenements-nantes-metropole_v2';
const METEO = 'https://archive-api.open-meteo.com/v1/archive';
const NANTES = { lat: 47.2184, lon: -1.5536 };
const JOUR = 86400000;

const args = process.argv.slice(2);
const opt = (nom) => {
	const i = args.indexOf(nom);
	return i >= 0 ? args[i + 1] : null;
};

// ——— Outils de dates (UTC, sans fuseau) ———
const iso = (d) => d.toISOString().slice(0, 10);
const lundiDe = (d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((d.getUTCDay() + 6) % 7)));
function lireDate(txt) {
	const m = txt.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
	if (!m) return null;
	const an = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
	return new Date(Date.UTC(an, Number(m[2]) - 1, Number(m[1])));
}

// ——— Changelog GTFS ———
const NATURES = [
	{ nature: 'mouvement social', motif: /mouvement|mvmt|grève|greve|social/i },
	{ nature: 'manifestation', motif: /manifestation|manif\b/i },
	{ nature: 'travaux', motif: /travaux|chantier/i },
	{ nature: 'déviation', motif: /déviation|deviation|tracé|trace/i },
	{ nature: 'événement', motif: /match|foulées|trail|marathon|course|concert|festival|fête|fete|salon|événement|evenement|braderie|feu d'artifice/i },
	{ nature: 'intempéries', motif: /neige|verglas|tempête|tempete|inondation|crue|intempérie/i },
];
const TECHNIQUE = /test|export|correction|horaires de la nouvelle période|validation|netex|ods/i;

async function changelog() {
	const meta = await (await fetch(`${OD}/${GTFS}`)).json();
	const html = meta.metas.default.description || '';
	const texte = html
		.replace(/<br\s*\/?>|<\/p>|<\/li>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&#39;|&rsquo;/g, '’');
	return texte
		.split('\n')
		.map((l) => l.trim())
		.filter((l) => lireDate(l))
		.map((l) => {
			const date = lireDate(l);
			const contenu = l.replace(/^\d{1,2}\/\d{1,2}\/\d{2,4}\s*:?\s*/, '').trim();
			const nature = NATURES.find((n) => n.motif.test(contenu))?.nature ?? null;
			return { date: iso(date), contenu, nature };
		})
		.filter((e) => e.nature && !TECHNIQUE.test(e.contenu));
}

// Lignes citées dans un texte, gardées seulement si elles existent dans le GTFS (lignes.json)
let nomsDeLignes = null;
async function lignesCitees(txt) {
	if (!nomsDeLignes) {
		const l = (await import(new URL('lignes.json', JEU), { with: { type: 'json' } })).default;
		nomsDeLignes = new Set(l.lignes.map((x) => x.nom.toUpperCase()));
	}
	const trouvees = new Set();
	const bloc = txt.match(/lignes?\s+([\w\s,+et]+)/gi) || [];
	for (const b of bloc)
		for (const m of b.replace(/^lignes?\s+/i, '').matchAll(/\b([A-Z]{0,2}\d{1,3}[A-Z]?|C\d{1,2}|NM|LCE|NA)\b/gi))
			if (nomsDeLignes.has(m[1].toUpperCase())) trouvees.add(m[1].toUpperCase());
	for (const m of txt.matchAll(/\b(C\d{1,2})\b/g)) if (nomsDeLignes.has(m[1].toUpperCase())) trouvees.add(m[1].toUpperCase());
	return [...trouvees];
}

// ——— Agenda (événements réels de la semaine) ———
async function agenda(lundi) {
	const fin = iso(new Date(Date.parse(lundi) + 7 * JOUR));
	const p = new URLSearchParams({
		select: 'nom,date,lieu,ville,types_libelles',
		where: `date >= date'${lundi}' and date < date'${fin}' and annule = 'non'`,
		order_by: 'date',
		limit: '100',
	});
	const r = await (await fetch(`${OD}/${AGENDA}/records?${p}`)).json();
	return r.results ?? [];
}

// ——— Météo (archive Open-Meteo) et alertes dérivées des données (Q39) ———
async function meteo(lundi) {
	const fin = iso(new Date(Date.parse(lundi) + 6 * JOUR));
	const p = new URLSearchParams({
		latitude: String(NANTES.lat),
		longitude: String(NANTES.lon),
		start_date: lundi,
		end_date: fin,
		hourly: 'temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m',
		timezone: 'Europe/Paris',
	});
	const r = await fetch(`${METEO}?${p}`);
	if (!r.ok) throw new Error(`Open-Meteo : HTTP ${r.status}`);
	return (await r.json()).hourly;
}
const percentile = (vals, q) => {
	const s = vals.filter((v) => v != null).sort((a, b) => a - b);
	return s[Math.min(s.length - 1, Math.floor(q * s.length))];
};
function alertesMeteo(h) {
	// Seuil = 95e percentile horaire de la semaine ; on retient le jour où la valeur maximale est atteinte.
	const variables = [
		{ cle: 'wind_gusts_10m', libelle: 'rafales de vent', unite: 'km/h', min: 50 },
		{ cle: 'precipitation', libelle: 'précipitations', unite: 'mm/h', min: 2 },
		{ cle: 'temperature_2m', libelle: 'température', unite: '°C', min: null },
	];
	const out = [];
	for (const v of variables) {
		const vals = h[v.cle];
		const seuil = percentile(vals, 0.95);
		const iMax = vals.indexOf(Math.max(...vals));
		const max = vals[iMax];
		// « extrême » : au-dessus du 95e percentile ET au-dessus d'un plancher physique (sinon une semaine calme n'en produit pas)
		if (v.min !== null && max < v.min) continue;
		if (v.min === null) {
			const minT = Math.min(...vals);
			if (minT > -2 && max < 30) continue; // ni gel marqué ni forte chaleur
		}
		out.push({
			date: h.time[iMax].slice(0, 10),
			heure: h.time[iMax].slice(11, 16),
			type: 'alerte météo',
			nature: v.libelle,
			valeur: `${max} ${v.unite}`,
			seuil_semaine_p95: `${seuil} ${v.unite}`,
			ligne: null,
			retard: null,
			source: 'Archive Open-Meteo (ERA5), Nantes',
			texte_source: `${v.libelle} : ${max} ${v.unite} le ${h.time[iMax].replace('T', ' à ')} (95e percentile de la semaine : ${seuil} ${v.unite})`,
		});
	}
	return out;
}

// ——— Construction d'une semaine ———
async function construireSemaine(lundi, entrees) {
	const fin = Date.parse(lundi) + 7 * JOUR;
	const perturbations = [];
	for (const e of entrees.filter((x) => Date.parse(x.date) >= Date.parse(lundi) && Date.parse(x.date) < fin)) {
		perturbations.push({
			date: e.date,
			type: 'perturbation',
			nature: e.nature,
			lignes: await lignesCitees(e.contenu),
			retard: null, // le changelog ne donne pas de durée de retard : rien n'est inventé
			source: 'Changelog du GTFS Naolib (Open Data Nantes Métropole, Licence Ouverte)',
			texte_source: e.contenu,
		});
	}
	const vus = new Set();
	const evts = (await agenda(lundi))
		.filter((a) => !vus.has(a.nom) && vus.add(a.nom)) // une occurrence par événement (l'agenda répète les jours)
		.map((a) => ({
		date: a.date?.slice(0, 10),
		type: 'événement',
		nature: (a.types_libelles || []).join(', ') || 'événement',
		lignes: [],
		retard: null,
		source: 'Agenda des événements de Nantes Métropole (Open Data, Licence Ouverte)',
		texte_source: `${a.nom}${a.lieu ? ` — ${a.lieu}` : ''}${a.ville ? `, ${a.ville}` : ''}`,
	}));
	const h = await meteo(lundi);
	const meteoJours = [];
	for (let i = 0; i < 7; i++) {
		const tranche = (cle) => h[cle].slice(i * 24, i * 24 + 24).filter((v) => v != null);
		meteoJours.push({
			date: h.time[i * 24].slice(0, 10),
			temp_min: Math.min(...tranche('temperature_2m')),
			temp_max: Math.max(...tranche('temperature_2m')),
			pluie_mm: Math.round(tranche('precipitation').reduce((s, v) => s + v, 0) * 10) / 10,
			rafales_max: Math.max(...tranche('wind_gusts_10m')),
		});
	}
	return {
		lundi,
		dimanche: iso(new Date(fin - JOUR)),
		preparee_le: new Date().toISOString(),
		dossiers: [...perturbations, ...alertesMeteo(h)].sort((a, b) => a.date.localeCompare(b.date)),
		evenements: evts,
		meteo: meteoJours,
	};
}

// ——— Programme ———
const entrees = await changelog();

if (args.includes('--lister')) {
	const parSemaine = new Map();
	for (const e of entrees) {
		const l = iso(lundiDe(new Date(e.date)));
		if (!parSemaine.has(l)) parSemaine.set(l, []);
		parSemaine.get(l).push(e);
	}
	console.log(`${entrees.length} perturbations datées dans le changelog. Semaines les plus chargées :`);
	[...parSemaine.entries()]
		.sort((a, b) => b[1].length - a[1].length || b[0].localeCompare(a[0]))
		.slice(0, 12)
		.forEach(([l, es]) =>
			console.log(`${l} (${es.length}) ${Date.parse(l) >= Date.parse('2025-09-22') ? '[agenda dispo]' : ''} — ${es.map((e) => `${e.nature}: ${e.contenu.slice(0, 50)}`).join(' | ')}`),
		);
	process.exit(0);
}

const choix = (opt('--semaines') || '').split(',').filter(Boolean);
if (!choix.length) {
	console.error('Indiquer --lister ou --semaines AAAA-MM-JJ,AAAA-MM-JJ,AAAA-MM-JJ (lundis)');
	process.exit(1);
}
await mkdir(SEMAINES, { recursive: true });
const DIFFICULTES = [
	{ niveau: 'facile', compteur_s: 60 },
	{ niveau: 'normale', compteur_s: 30 },
	{ niveau: 'difficile', compteur_s: 15 },
];
const index = [];
const semaines = {};
for (const [i, lundi] of choix.entries()) {
	const s = await construireSemaine(lundi, entrees);
	s.difficulte = DIFFICULTES[i] ?? DIFFICULTES.at(-1);
	semaines[lundi] = s;
	await writeFile(new URL(`${lundi}.json`, SEMAINES), JSON.stringify(s, null, 1) + '\n');
	index.push({ lundi, dimanche: s.dimanche, dossiers: s.dossiers.length, evenements: s.evenements.length, ...s.difficulte });
	console.log(`✓ ${lundi} : ${s.dossiers.length} dossier(s), ${s.evenements.length} événement(s) agenda — ${s.difficulte.niveau}`);
}
await writeFile(new URL('semaines.json', JEU), JSON.stringify(index, null, 1) + '\n');
await writeFile(new URL('semaines.js', JEU), `window.PXE_SEMAINES = ${JSON.stringify({ index, semaines })};\n`);

// Fallback (6 dossiers réels d'une semaine, Q26) — perturbations d'abord, puis météo, puis événements
const lundiFallback = opt('--fallback');
if (lundiFallback) {
	const s = semaines[lundiFallback] ?? (await construireSemaine(lundiFallback, entrees));
	// Événements qui attirent du monde d'abord (affluence sur le réseau) ; les fiches « fourre-tout »
	// de l'agenda (plus de 4 types à la fois) sont écartées.
	const affluence = (e) => {
		const types = e.nature.split(', ');
		if (types.length > 4) return -1;
		if (types.some((t) => /sportif|Festival|Défilé|Marché|Concert|Salon/i.test(t))) return 2;
		if (types.some((t) => /Théâtre|Danse|Cirque|Projection/i.test(t))) return 1;
		return 0;
	};
	const evtsDossiers = s.evenements
		.map((e, i) => ({ e, i, score: affluence(e) }))
		.filter((x) => x.score >= 0)
		.sort((a, b) => b.score - a.score || a.i - b.i)
		.slice(0, 6)
		.map(({ e }) => ({ ...e, type: 'événement' }));
	const six = [...s.dossiers, ...evtsDossiers].slice(0, 6);
	const fb = {
		semaine: { lundi: s.lundi, dimanche: s.dimanche },
		seed: 1001,
		note: 'Semaine de référence hors ligne : 6 dossiers réels tirés des archives publiques, rejoués à l’identique.',
		dossiers: six,
		meteo: s.meteo,
		preparee_le: s.preparee_le,
	};
	await writeFile(new URL('fallback.json', JEU), JSON.stringify(fb, null, 1) + '\n');
	await writeFile(new URL('fallback.js', JEU), `window.PXE_FALLBACK = ${JSON.stringify(fb)};\n`);
	console.log(`✓ fallback : ${six.length} dossier(s) réels de la semaine du ${lundiFallback}${six.length < 6 ? ' — MOINS DE 6 : choisir une semaine plus chargée' : ''}`);
}
