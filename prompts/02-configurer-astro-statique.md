# Prompt 02 — Configurer Astro en rendu statique pour GitHub Pages

## Objectif
Préparer le projet Astro de base pour un **site 100 % statique** déployable sur
GitHub Pages, avec l'URL de l'édition conforme au framework.

## Contexte
Framework : URL recommandée `/patrimoine-exe/nantes/001/slug/`. Le livret exige un site
relançable sans réseau ni API distante ; le rendu statique (SSG) est donc requis.

## Instructions
1. Dans `astro.config.mjs`, configurer :
   - `output: 'static'` ;
   - `site: 'https://<owner>.github.io'` (dépôt GitHub Pages du projet) ;
   - `base: '/patrimoine-exe/nantes/001/'` (chemin de l'édition, conforme au framework) ;
   - `trailingSlash: 'always'` pour des URLs stables.
2. Ne PAS ajouter d'adaptateur de déploiement (le déploiement GitHub Pages se fait par
   upload du dossier `dist/`, voir prompt 12) ni de dépendance.
3. Vérifier que `src/env.d.ts` et le typage restent cohérents.

## Vérifications
- `npm run build` produit un dossier `dist/` entièrement statique (HTML uniquement,
  pas de rendu serveur).
- Toutes les routes internes sont préfixées par `base`.
