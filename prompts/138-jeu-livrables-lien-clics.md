# 138 — Jeu : le bouton « Livrables » ouvre la diapositive entièrement dévoilée

## Demande
Changer le lien du bouton « Livrables » du menu principal (prompt 136) pour
https://workshop-design-interactions.pages.dev/presentation/#/livrables?clicks=5

## Fait
- `site/public/menu.js` : `ouvrirLivrables()` ouvre `./presentation/#/livrables?clicks=5` (chemin relatif, même
  page en ligne et hors ligne) ; `?clicks=5` affiche la diapositive avec ses apparitions déjà jouées.

## Vérification
`npm run build` puis `npm test` verts.
