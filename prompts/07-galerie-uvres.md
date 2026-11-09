# Prompt 07 — Galerie des œuvres générée depuis le registre

## Objectif
Créer la page **Œuvres** (`src/pages/oeuvres/index.astro`) qui liste toutes les œuvres
du registre, avec filtrage par statut curatorial (framework, section 11 : STUDENT /
SELECTED / PATRIMOINE.EXE COLLECTION).

## Instructions
1. Page `oeuvres/index.astro` via `Layout.astro` : récupérer les œuvres avec
   `getOeuvres()` (prompt 06), afficher une grille de cartes (composant
   `CarteOeuvre.astro`) avec pour chaque œuvre : titre, identifiant
   `PXE-NTE001-G{nn}-W{nn}`, groupe, statut, miniature `thumb.jpg` (chemin relatif
   via `import.meta.env.BASE_URL`), lien vers sa page (prompt 08).
2. Ajouter un filtre simple par statut (STUDENT / SELECTED / COLLECTION) côté client
   ou par query param, sans dépendance externe.
3. Gérer le cas « aucune œuvre » : message explicite invitant à consulter le catalogue.
4. Respecter l'accessibilité : images avec `alt` descriptif, navigation clavier possible,
   contraste suffisant.

## Vérifications
- La galerie affiche toutes les œuvres valides du registre.
- Le filtre par statut fonctionne sans rechargement serveur.
- `npm run build` génère la page statique sans erreur.
