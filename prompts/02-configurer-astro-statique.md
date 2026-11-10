# Prompt 02 — Configurer Astro en rendu statique pour GitHub Pages

> **Note historique (prompt 33, 10/11/2026).** Ce prompt a été exécuté tel quel ; il cite l'ancienne cible GitHub Pages (`https://artistdev44.github.io/workshop-design-interactions/…`), qui renvoie aujourd'hui une 404. L'URL canonique du projet est désormais **https://workshop-design-interactions.pages.dev/** (Cloudflare Pages, racine du domaine, `base: '/'`). Le texte ci-dessous n'est pas réécrit : il documente l'historique.

## Objectif
Préparer le projet Astro (dossier `site/` du dépôt) pour un **site 100 % statique**
déployable sur GitHub Pages, avec l'URL de l'édition conforme au framework.

## Contexte
- Le site vit dans `site/` du dépôt `ArtistDev44/workshop-design-interactions`.
  Toutes les commandes `npm` se lancent dans `site/`.
- GitHub Pages sert un dépôt de projet sous `https://<owner>.github.io/<repo>/`.
  L'URL de l'édition recommandée par le framework (`/patrimoine-exe/nantes/001/`) vient
  donc **après** le nom du dépôt :
  `https://artistdev44.github.io/workshop-design-interactions/patrimoine-exe/nantes/001/`.
- Le livret exige un site relançable sans réseau : rendu statique (SSG) obligatoire.

## Instructions
1. Dans `site/astro.config.mjs`, configurer :
   - `output: 'static'` (valeur par défaut, à écrire explicitement pour la lisibilité) ;
   - `site: 'https://artistdev44.github.io'` ;
   - `base: '/workshop-design-interactions/patrimoine-exe/nantes/001/'` (nom du dépôt
     **+** chemin de l'édition, avec slash final : `BASE_URL` se termine alors par `/`,
     et l'on écrit `${import.meta.env.BASE_URL}oeuvres/` sans slash supplémentaire) ;
   - `trailingSlash: 'always'` pour des URLs stables.
2. Ne PAS ajouter d'adaptateur de déploiement ni de dépendance (déploiement : prompt 13).
3. Ne pas créer `src/env.d.ts` : depuis Astro 5, les types sont générés dans
   `.astro/types.d.ts`, déjà inclus par `tsconfig.json`.
4. Règle pour toute la suite : tout lien interne et tout asset de `public/` passe par
   `import.meta.env.BASE_URL` (jamais de chemin commençant par `/` écrit en dur).

## Vérifications
- `npm run build` (dans `site/`) produit `site/dist/` entièrement statique (HTML, pas
  de rendu serveur). Note : `base` ne crée pas de sous-dossiers dans `dist/` —
  la page d'accueil reste `dist/index.html`.
- `npm run preview` sert la page à
  `http://localhost:4321/workshop-design-interactions/patrimoine-exe/nantes/001/`.
