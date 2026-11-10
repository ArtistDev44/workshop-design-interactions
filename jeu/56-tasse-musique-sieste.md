# 56 — Tasse en pixel art, musique par défaut, sieste réparée (prompt 62)

## Tasse
- `cafe.js` : la tasse n'emprunte plus la main du téléphone (formes vectorielles plates). Elle est dessinée
  **pixel par pixel** (`dessinerTassePixel`, un « pixel » = 15 px) dans le grain de la pièce : mug aux coins
  arrondis, émail ombré, reflet, bandeau rouge du Pixel DS, ouverture ovale avec café et crème, anse, main
  (pouce, trois doigts aux jointures arrondies, poignet) et manche marine.
- Chronologie propre (2,8 s) : montée du bas (450 ms), vapeur en filets ondulants, **gorgée** (la tasse
  monte, se rapproche, s'incline vers soi, le café baisse), retour, descente — puis le boost du prompt 52.
- Animations réduites : tasse fixe, vapeur figée, sans inclinaison (1 s).

## Musique
- « Chillin' Poupi » (Komiku, CC0) redevient le morceau par défaut ; une seule bascule ramène les joueurs
  restés sur le lofi par défaut du prompt 49 (clé `pxe-nte001:jeu:chillin-v62`). Les lofi restent au choix.

## Sieste
- **Cause** : à ×30, les dossiers s'enchaînent toutes les ~6 s réelles, et la suite automatique d'un dossier
  (`apresDecision` après un compteur à 0) ainsi que le réveil raté (`rateReveil`) appelaient `interaction()` :
  l'inactivité repartait de zéro sans geste du joueur, il n'atteignait jamais 20 s en attente.
- **Correctif** : seuls les vrais gestes (clic, touche, toucher) remettent l'inactivité à zéro.
- Vérifié : joueur inactif → endormi à la première attente après un dossier laissé au compteur, réveil
  raté, rendormi ; joueur qui décide → jamais endormi (chaque décision est un geste).

## Vérifications
- `npm run build`, `npm test` ; Chromium : tasse capturée à 250, 800, 1 550, 2 550 ms et en animations
  réduites, boost déclenché ensuite ; premier geste → `audio/chillin-poupi.ogg` ; aucune erreur console.
