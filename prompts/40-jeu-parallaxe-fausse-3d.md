# Prompt 40 — Jeu « Nantes en régulation », étape 27 : parallaxe multicouche (fausse 3D)

Objectif : lors du petit décalage de la vue au mouvement de la souris (caméra du prompt
25, « on contrôle le personnage »), les **différents éléments de la pièce bougent à des
échelles différentes** — certains de façon presque imperceptible — pour donner une
**impression de fausse 3D**. Les décisions Q1–Q61 ne changent pas.

S'appuie sur les prompts 25 (caméra), 31 (cadrage), 34 et les correctifs plein écran
(surcadrage, bords flous, vignettage).

Fichiers concernés : `site/public/bureau.js` (découpe de `dessinerPieceBureau()` en
plans), `immersion.js` (zones cliquables qui suivent leur plan), plus `jeu/` et `journal.md`.

## Plans et coefficients (décalage = coefficient × décalage caméra)
- **Lointain** (ciel, ville, grue, Loire, péniche, pluie) : ≈ 0,35.
- **Baie et murs** (menuiseries, store, mur de droite, horloge, applique, allège) : ≈ 0,7.
- **Plateau et écran** (bureau, PC, clavier) : 1 (référence, la caméra actuelle).
- **Objets proches** (souris, téléphone, tasse, livres, plante, dossiers) : ≈ 1,15–1,3,
  chacun avec son propre coefficient selon sa profondeur supposée.
- Amplitude maximale inchangée et faible (12 px pour la référence) : certains plans
  bougent de 4 px, d'autres de 15 px ; jamais de trou visible (le surcadrage absorbe).

## Règles
- Aucun fichier image ; chaque plan est un calque transparent dessiné par le code.
- Les zones cliquables (écran du PC, livres, objets, téléphone) suivent leur plan, ainsi
  que les flèches du guide (prompt 37).
- Animations réduites / poste / zooms : tous les plans restent alignés (caméra à 0).
- Coût maîtrisé : calques en 480×270, redessinés au même rythme qu'aujourd'hui.

## Vérifications
- `npm run build` et `npm test` ; souris aux quatre bords : les plans glissent à des
  vitesses différentes sans trou ; clics et survols toujours justes ; animations réduites
  = vue fixe ; aucune régression des prompts 25–38.
- Documenter dans `jeu/35-parallaxe-fausse-3d.md` + sommaire de `jeu/README.md`.
- Branche `jeu/prompt-40-parallaxe`. À chaque push : entrée en tête de `journal.md`.
