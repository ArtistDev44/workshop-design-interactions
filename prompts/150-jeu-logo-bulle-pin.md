# 150 — Jeu : le logo bulle-pin remplace le moniteur partout

## Demande
« Intègres les logos @logo/ dans le projet. » Choix de l'équipe sur la planche du prompt 126 (`logo/planche.html`) :
**piste 2, la bulle-pin**, à poser **partout** (jeu, favicon, icônes de la webapp).

## Fait
- `site/public/ds.js` : `LOGO_PXE` décrit la grande bulle-pin (24 × 20) — une bulle de dialogue « &#@! » dont la
  pointe est un marqueur de carte. `dessinerLogoPXE` est inchangé : le rouge suit toujours la couleur principale
  (prompt 115). Le bouton en bas à gauche de la barre des tâches et l'entrée « carte » du menu de l'appli changent
  donc sans autre code.
- `site/public/index.html` : le SVG de l'écran de chargement reprend les mêmes rectangles (test du prompt 75).
- `site/public/favicon.svg` et `favicon.ico` (16, 32, 48 px) : petite bulle-pin 16 × 16 à trois points « … »,
  fond transparent.
- `icon-192/384/512.png`, `icon-maskable-192/512.png`, `apple-touch-icon.png` : grande bulle-pin à échelle entière
  (pixels nets) sur fond #0D0C0C ; la version maskable garde la bulle dans la zone de sécurité.
- Les pages `/cartel/`, `/making-of/` et le diaporama pointent déjà sur `favicon.svg` : rien à changer.

Les formes viennent telles quelles de `logo/planche.html` (`bulleGrande`, `BULLE`), sans retouche.

## Vérification
`npm run build` puis `npm test` verts (smoke 534, test du jeu 605, dont « formes du bouton = SVG du chargement ») ;
icônes contrôlées sur une planche d'aperçu.
