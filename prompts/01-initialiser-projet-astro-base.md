# Prompt 01 — Initialiser le projet Astro depuis le projet Astro de base

## Objectif
Créer le squelette du site de l'édition **PATRIMOINE.EXE / NTE001** à partir du starter
officiel Astro « de base » (template minimal), sans ajouter de dépendance externe.

## Contexte
Édition : PXE · NTE001 · ESD Nantes · B3 Design · 9, 10 & 12 novembre 2026.
Le site est la vitrine publique de l'édition (framework : « Vitrine publique », registre
machine-readable). Voir `contexte/` et `prompts/README.md`.

## Instructions
1. Dans le dossier parent choisi, exécuter : `npm create astro@latest .` (ou créer le
   projet dans un dossier `PXE_NTE001_SITE/` puis déplacer son contenu à la racine).
2. Choisir le template **« Just the basics »** (starter minimal), TypeScript **strict**,
   installer les dépendances, initialiser un dépôt git local si ce n'est pas déjà fait.
3. Nettoyer le contenu de démonstration : vider `src/pages/index.astro` (garder une page
   valide minimale), supprimer les composants de démo inutiles, conserver la structure
   standard Astro (`src/`, `public/`, `astro.config.mjs`, `package.json`).
4. Nommer le projet `pxe-nte001-site` dans `package.json` et définir la langue `fr`.

## Vérifications
- `npm run dev` démarre sans erreur et affiche la page d'accueil vide/minimale.
- Aucune dépendance ajoutée au-delà de celles du starter de base.
- Aucun secret, clé ou token présent dans les fichiers.
