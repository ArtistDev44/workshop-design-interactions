// Accès au registre des œuvres (prompt 06).
import { lien } from './liens';
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

/** Adresse de l'œuvre jouable (champ `lien_oeuvre` du registre), ou null si elle n'est pas encore en ligne. */
export function lienJouable(oeuvre: Oeuvre): string | null {
	const l = oeuvre.data.lien_oeuvre;
	return l ? lien(l) : null;
}
