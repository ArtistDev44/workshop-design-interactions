# 152 — Jeu : les icônes de la planche dans le jeu (pin d'alerte sur la carte, écran de régulation au démarrage)

## Demande
« Je souhaite que tu intègres les icônes du fichier @logo/planche.html dans le jeu. » Emplacements choisis par
l'équipe : **pin d'alerte sur la carte** et **écran de régulation au démarrage du PC**. Le logotype pixel et le
monogramme « NÉR » ne sont pas retenus.

## Fait
- `site/public/ds.js` : `ICONE_PIN` et `ICONE_ECRAN`, grilles 16 × 16 reprises telles quelles de la planche
  (pistes 1 et 3), et `dessinerIconePixel(grille, x, y, taille, couleurs)` qui les dessine sans lissage.
- `site/public/carte-alertes.js` : `dessinerMarqueur` dessine le pin « ! » à la place du carré. Rien d'autre ne
  change : même position, mêmes tailles par gravité (20, 28, 36 px), même couleur de gravité, liseré blanc de 3 px
  pour la gravité élevée, mêmes zones de clic et de dépôt. Le marqueur creux à sablier des signalements en cours
  d'intervention (prompt 121) reste un carré.
- `site/public/os.js` : pendant le démarrage du PC, le logo de RégulOS est l'écran de régulation (pin sur l'écran,
  Loire en escalier) à l'échelle 8 (128 × 128 px) ; l'écran suit la couleur principale.

## Vérification
`npm run build` puis `npm test` verts ; pin contrôlé aux trois tailles sur un rendu hors jeu (même calcul des cases).
