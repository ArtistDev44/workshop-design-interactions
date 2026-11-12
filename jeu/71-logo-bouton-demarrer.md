# 71 — Le bouton de la barre des tâches reprend le logo du chargement (prompt 75)

Code : `ds.js` (`LOGO_PXE`, `dessinerLogoPXE`), `os.js` (`dessinerBoutonDemarrer`, `retourAccueilPC`, focus),
`sketch.js` (cycle Tab), `bureau.js`, `i18n.js`. Règles et `game.js` inchangés.

## Avant / après
- Avant : un carré rouge plein avec « REGUL » en bas à gauche de la barre des tâches de RégulOS, sans action.
- Après : le **logo de l'écran de chargement** — moniteur blanc à écran rouge, ligne blanche, deux fenêtres
  (verte et blanche), pied et socle — dessiné en pixel art à l'échelle entière 3 (72 × 60 px, pixels nets),
  centré dans un bouton de 140 × 68 px (fond blanc 5 %, 15 % au survol ou au focus, double bordure de focus).
  Le texte « REGUL » est supprimé.

## Une seule source de formes
`LOGO_PXE` (ds.js) liste les mêmes rectangles que le SVG `#chargement .logo` d'`index.html` (viewBox 0 0 24 20).
Le SVG reste dans le HTML (il doit s'afficher avant le chargement des scripts) ; `npm test` vérifie que les deux
listes de formes sont identiques : si le logo du chargement évolue, le test échoue tant que le bouton ne suit pas.
Le logo du démarrage du PC (`dessinerDemarrage`) n'est pas concerné.

## Fonction
Clic (≥ 44 px) ou clavier : retour à l'**accueil de RégulOS** (l'appli de jeu et la fenêtre ouverte se
ferment, le temps continue). Clavier : au bureau RégulOS, Tab parcourt les icônes, « Quitter le PC » puis le
logo ; dans l'appli de jeu, Tab passe de « Quitter le PC » au logo ; Entrée l'active. Infobulle FR + EN au
survol et au focus : « Accueil de RégulOS (clic, ou Tab puis Entrée) », annonce `aria-live` à l'activation.

## Vérifications
- `npm test` : formes du bouton = rectangles du SVG du chargement ; plus de carré rouge « REGUL ».
- Chromium 1920 × 1080 FR / EN et portrait 412 × 915 : logo net, focus visible après Tab Tab, Entrée → accueil
  de RégulOS, aucune erreur console.

## Mise à jour (prompt 150)
Le logo n'est plus le moniteur : c'est la **bulle-pin** (bulle « &#@! » à pointe de marqueur de carte, piste 2 de
`logo/planche.html`). Même grille 24 × 20, même fonction `dessinerLogoPXE`, même test ; favicon et icônes de la
webapp refaits avec la petite et la grande bulle.
