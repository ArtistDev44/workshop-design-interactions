// Collection « oeuvres » : le registre machine-readable de l'édition (prompt 06).
// Un fichier JSON par œuvre dans src/content/oeuvres/, validé au build.
// `z` vient d'astro/zod (inclus dans Astro) : aucune dépendance ajoutée.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const compterMots = (texte: string) => texte.trim().split(/\s+/).filter(Boolean).length;

const oeuvres = defineCollection({
	loader: glob({ pattern: '*.json', base: './src/content/oeuvres' }),
	schema: z.object({
		id: z
			.string()
			.regex(/^PXE-NTE001-G\d{2}-W\d{2}$/, 'Identifiant attendu : PXE-NTE001-G{nn}-W{nn}'),
		titre: z.string().min(1),
		auteurs: z.array(z.string().min(1)).min(1, 'Au moins un auteur (ou « [À COMPLÉTER] »)'),
		groupe: z.string().min(1),
		statut: z.enum(['STUDENT', 'SELECTED', 'COLLECTION']),
		source: z.object({
			titre: z.string().min(1),
			lieu: z.string().min(1),
			type: z.string().min(1),
			url: z.string().url('URL de la source invalide'),
			date_acces: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date d’accès au format AAAA-MM-JJ'),
			droits: z.string().min(1, 'Les droits / la licence de la source sont obligatoires'),
		}),
		grammaire: z.object({
			regle: z.string().min(1, 'La règle structurante est obligatoire'),
			invariants: z.array(z.string()).min(1),
			variables: z.array(z.string()).min(1),
		}),
		parametres: z
			.array(z.object({ nom: z.string().min(1), effet: z.string().min(1) }))
			.min(3, 'Le livret exige au moins 3 paramètres réellement opérants'),
		stack: z.string().min(1),
		mode: z.enum(['generative', 'data', 'interactif']),
		fallback: z.string().min(1, 'Le fonctionnement hors ligne (fallback) est obligatoire'),
		datasets: z.array(z.string()).optional(),
		cartel: z.string().superRefine((t, ctx) => {
			const n = compterMots(t);
			if (n < 80 || n > 120) {
				ctx.addIssue({
					code: 'custom',
					message: `Le cartel doit faire 80 à 120 mots (actuellement ${n})`,
				});
			}
		}),
		assets: z
			.object({
				hero: z.string().optional(),
				detail: z.string().optional(),
				process: z.string().optional(),
				thumb: z.string().optional(),
				demo: z.string().optional(),
			})
			.default({}),
		lien_oeuvre: z.string().optional(),
		ai_usage: z.string().optional(),
	}),
});

export const collections = { oeuvres };
