// Construction unique des liens internes du site.
// Toutes les pages et ressources passent par `lien()` : le préfixe de base
// (/workshop-design-interactions/patrimoine-exe/nantes/001/) et la barre oblique finale
// sont gérés ici, à un seul endroit.

/** Préfixe de base du site, toujours terminé par « / ». */
export const BASE = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

/**
 * Lien interne : `lien('oeuvres')` → `/…/001/oeuvres/` ; `lien('assets/qr.png')` → `/…/001/assets/qr.png`.
 * Une page reçoit toujours sa barre oblique finale ; un fichier (avec extension) n'en reçoit pas.
 */
export function lien(chemin = ''): string {
	const propre = chemin.replace(/^\/+/, '');
	if (!propre) return BASE;
	const [route, suite = ''] = propre.split(/(?=[?#])/);
	const estFichier = /\.[a-z0-9]+$/i.test(route);
	return BASE + (estFichier || route.endsWith('/') ? route : `${route}/`) + suite;
}

/** Pages du menu principal (Header) — une seule liste pour tout le site. */
export const NAVIGATION = [
	{ chemin: '', label: 'Accueil' },
	{ chemin: 'oeuvres', label: 'Œuvres' },
	{ chemin: 'catalogue', label: 'Catalogue' },
	{ chemin: 'statistiques', label: 'Statistiques' },
	{ chemin: 'methode', label: 'Méthode' },
	{ chemin: 'corpus', label: 'Corpus' },
	{ chemin: 'donnees', label: 'Données' },
	{ chemin: 'credits', label: 'Crédits' },
];
