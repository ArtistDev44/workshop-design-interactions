# Prompt 08 — Page œuvre individuelle et cartel au format du livret

## Objectif
Générer une page statique par œuvre (`/oeuvres/[slug]/`) conforme à la convention
d'URL du framework `/patrimoine-exe/nantes/001/<slug>/`, incluant le **cartel** au
format du livret (section 11).

## Instructions
1. Créer `src/pages/oeuvres/[slug].astro` avec `getStaticPaths()` : un chemin par œuvre
   du registre, `slug` = identifiant en minuscules (ex. `pxe-nte001-g01-w01`).
2. La page affiche, via `Layout.astro` et un composant `Cartel.astro` :
   - **PATRIMOINE.EXE / NANTES 001** + titre de l'œuvre + auteurs (ESD Nantes, B3
     Design, 2026) ;
   - **Source patrimoniale** : titre, lieu, référence/URL, droits ;
   - **Concept** : le cartel de 80 à 120 mots ;
   - **Système** : stack, mode, grammaire (règles, invariants, variables, paramètres) ;
   - la chaîne `SOURCE → GRAMMAIRE → ALGORITHME → DATA/INTERACTION → ŒUVRE` ;
   - captation : hero.jpg, detail-01.jpg, process.jpg, thumb.jpg (chemins relatifs) ;
   - QR code vers la page en ligne de l'œuvre (image dans `public/assets/`) ;
   - mention « AI usage » si présente dans le registre.
3. Page 404 personnalisée (`src/pages/404.astro`) renvoyant vers l'accueil.

## Vérifications
- Une page HTML statique est générée par œuvre dans `dist/oeuvres/<slug>/index.html`.
- Le cartel respecte le format du livret et la limite de 80–120 mots.
- Les images utilisent des chemins relatifs compatibles avec `base`.
