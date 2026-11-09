// Accès au registre des œuvres (prompt 06).
import { getCollection, type CollectionEntry } from 'astro:content';

export type Oeuvre = CollectionEntry<'oeuvres'>;

/** Toutes les œuvres valides du registre, triées par identifiant. */
export async function getOeuvres(): Promise<Oeuvre[]> {
	const oeuvres = await getCollection('oeuvres');
	return oeuvres.sort((a, b) => a.data.id.localeCompare(b.data.id));
}

/** Slug d'URL d'une œuvre : identifiant en minuscules (ex. pxe-nte001-g01-w01). */
export function slugDe(oeuvre: Oeuvre): string {
	return oeuvre.data.id.toLowerCase();
}

/** Libellé affiché d'un statut curatorial. */
export function libelleStatut(statut: Oeuvre['data']['statut']): string {
	return statut === 'COLLECTION' ? 'PATRIMOINE.EXE COLLECTION' : statut;
}
