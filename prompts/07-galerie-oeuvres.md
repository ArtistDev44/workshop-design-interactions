# Prompt 07 — Galerie des œuvres générée depuis le registre

## Objectif
Créer la page **Œuvres** (`site/src/pages/oeuvres/index.astro`) qui liste toutes les
œuvres du registre, avec filtrage par statut curatorial (framework, section 11 :
STUDENT / SELECTED / PATRIMOINE.EXE COLLECTION).

## Instructions
1. Page `oeuvres/index.astro` via `Layout.astro` : récupérer les œuvres avec
   `getOeuvres()` (prompt 06), afficher une grille de cartes (composant
   `CarteOeuvre.astro`) avec pour chaque œuvre : titre, identifiant
   `PXE-NTE001-G{nn}-W{nn}`, groupe, statut, miniature
   `${import.meta.env.BASE_URL}oeuvres/{slug}/thumb.jpg` si `assets.thumb` existe,
   sinon un emplacement neutre « Captation à venir » ; lien vers la page de l'œuvre
   `${import.meta.env.BASE_URL}{slug}/` (prompt 08).
2. Filtre par statut (Tous / STUDENT / SELECTED / COLLECTION) en JavaScript côté client
   (`<script>` Astro, sans dépendance). Sans JavaScript, toutes les œuvres restent
   visibles. Annoncer le nombre de résultats dans une zone `aria-live="polite"`.
3. Cas « aucune œuvre » (ou aucune pour le filtre) : message explicite invitant à
   consulter le catalogue.
4. Accessibilité : images avec `alt` descriptif, filtres en `<button>` avec
   `aria-pressed`, navigation clavier complète, contraste suffisant.

## Vérifications
- La galerie affiche toutes les œuvres valides du registre (au moins le jeu).
- Le filtre fonctionne sans rechargement ; sans JS, la liste complète s'affiche.
- `npm run build` génère `dist/oeuvres/index.html` sans erreur.
