# Prompt 09 — Statistiques et catalogue générés depuis les métadonnées

## Objectif
Créer les pages **Statistiques** et **Catalogue** du registre, conformément au
framework : « pages, galeries, cartels, statistiques et catalogues peuvent être
générés depuis les mêmes métadonnées ».

## Instructions
1. `src/pages/statistiques.astro` : calculer à partir de `edition.json` +
   `getOeuvres()` et afficher : nombre d'œuvres par statut (STUDENT / SELECTED /
   COLLECTION), nombre de groupes, nombre de sources patrimoniales, modes utilisés
   (generative / data / interactif), datasets référencés. Rendu textuel simple
   (listes/tableaux), sans bibliothèque de graphiques externe.
2. `src/pages/catalogue.astro` : liste exhaustive de toutes les œuvres avec
   identifiant, titre, auteurs, source patrimoniale et droits — format consultable
   comme archive de l'édition.
3. Les deux pages lisent exclusivement les données locales (aucun appel réseau).
4. Accessibilité : tableaux avec en-têtes `<th scope>`, textes alternatives pour
   toute valeur numérique.

## Vérifications
- Les chiffres affichés correspondent exactement aux JSON du registre.
- `npm run build` génère les deux pages sans erreur.
