// Accès unique aux données Open Data Nantes Métropole (prompt 11).
// Ordre : cache localStorage frais → API (5 s max) → instantané local → « indisponible ».
// Exécuté uniquement dans le navigateur : jamais au build, jamais dans une boucle de rendu.
import { DATASETS, urlDataset } from './datasets.js';

const BASE = import.meta.env.BASE_URL;

/**
 * @param {string} id dataset_id
 * @param {{ forcer?: boolean }} [options] forcer = ignorer le cache (bouton « Mettre à jour »)
 * @returns {Promise<{ records: any[], origin: 'live' | 'cache' | 'local' | 'indisponible', fetchedAt: number | string | null }>}
 */
export async function getDataset(id, { forcer = false } = {}) {
	const ds = DATASETS.find((d) => d.id === id);
	if (!ds) throw new Error(`Jeu inconnu : ${id}`);

	// Les jeux patrimoniaux ne sont jamais interrogés en direct.
	if (ds.mode === 'snapshot') return chargerLocal(id);

	const key = `pxe-nte001:${id}`;
	if (!forcer) {
		try {
			const cached = JSON.parse(localStorage.getItem(key) || 'null');
			if (cached && Date.now() - cached.fetchedAt < ds.ttlMs) {
				return { ...cached, origin: 'cache' };
			}
		} catch {}
	}

	const ctrl = new AbortController();
	const timer = setTimeout(() => ctrl.abort(), 5000);
	try {
		const res = await fetch(urlDataset(ds), { signal: ctrl.signal });
		if (!res.ok) throw new Error(String(res.status));
		const data = await res.json();
		const out = { records: data.results || [], fetchedAt: Date.now() };
		try {
			localStorage.setItem(key, JSON.stringify(out));
		} catch {} // stockage bloqué : on garde les données live
		return { ...out, origin: 'live' };
	} catch {
		return chargerLocal(id);
	} finally {
		clearTimeout(timer);
	}
}

async function chargerLocal(id) {
	try {
		const res = await fetch(`${BASE}data/fallback/${id}.json`);
		if (!res.ok) throw new Error(String(res.status));
		const data = await res.json();
		return { records: data.results || [], origin: 'local', fetchedAt: data.fetchedAt || null };
	} catch {
		return { records: [], origin: 'indisponible', fetchedAt: null };
	}
}
