# 136 — Jeu : bouton « Livrables » au-dessus du bloc dépôt · partage · présentation

## Demande
Ajouter dans le menu principal, au-dessus des boutons « Dépôt du code », « Partager » et « Présentation »,
un bouton **« Livrables »** de la largeur de ces trois boutons réunis, qui ouvre
https://workshop-design-interactions.pages.dev/presentation/#/livrables (diapositive « Les livrables »,
`routeAlias: livrables` dans `slides/slides.md`).

## Fait
- `site/public/menu.js` : `ouvrirLivrables()` ouvre `./presentation/#/livrables` dans un nouvel onglet
  (chemin relatif : même page en ligne, en local et hors ligne) ; rangée de 3 × 260 + 2 × 16 = 812 px,
  68 px de haut, 16 px au-dessus du bloc ; icône `carnet` ; premier élément de `EXTRAS_MENU`
  (ordre clavier ↑ ↓ / Tab = ordre visuel) ; infobulle remontée au-dessus de la nouvelle rangée.
- `site/public/portrait.js` : la région du bloc en portrait inclut la rangée Livrables.
- `site/public/i18n.js` : `mp.livrables`, `.infobulle`, `.annonce` (FR / EN).

## Vérification
`npm run build` puis `npm test` verts ; capture 1920 × 1080 du menu : le bouton est aligné sur les trois autres.
