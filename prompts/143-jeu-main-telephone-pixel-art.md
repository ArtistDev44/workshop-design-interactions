# 143 — Jeu : la main qui tient le téléphone en pixel art

## Demande
Pour l'animation d'origine de la main avec le téléphone (la première animation d'une partie) : ajouter le côté
pixel art sur la main.

## Fait
- `site/public/telephone-main.js` : `dessinerMain()` redessinée en pixel art sur une grille de 15 px (`PIX_MAIN`),
  avec la palette de la tasse en main (`cafe.js`) : contour sombre, aplats nets, coins en escalier, ombre sous chaque
  phalange, ongle du pouce, revers de manche. Le pouce est relié à la paume par son éminence, le long du bord gauche ;
  il ne couvre toujours que la coque, et la paume ne masque ni le bouton « Poser » ni la consigne.
- Le téléphone lui-même (coque arrondie, écran) et l'animation de montée / descente sont inchangés ; la main sert à
  l'intro (Camille), aux ouvertures de semaine et aux notifications.

## Vérification
`npm run build` puis `npm test` verts ; rendu contrôlé sur une capture de la main seule.
