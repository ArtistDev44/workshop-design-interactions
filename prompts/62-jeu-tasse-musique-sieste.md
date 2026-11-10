# Prompt 62 — Jeu « Nantes en régulation », étape 46 : animation de la tasse, musique par défaut, sieste

Demande d'origine (10/11/2026) :

> refais l'animation avec la tasse : elle est bien môche et mets la musique chillin poopi en principale.
> Aussi, la sieste ne s'active pas automatiquement.

## Attendu
1. **Tasse** : nouvelle animation au style **pixel art** du jeu (mug dessiné pixel par pixel, ombrage,
   café, vapeur, main qui tient l'anse, manche) au lieu des formes vectorielles plates : la tasse monte du
   bas, la vapeur s'élève, on la porte à la bouche (montée, rapprochement, inclinaison, le niveau du café
   baisse), puis elle redescend ; le boost du prompt 52 se déclenche ensuite. Animations réduites : tasse
   fixe, sans inclinaison ni vapeur animée.
2. **Musique par défaut** : « Chillin' Poupi » (Komiku, CC0) redevient le morceau principal (une seule
   bascule pour les joueurs restés sur le lofi par défaut du prompt 49) ; les lofi restent au choix.
3. **Sieste** : elle doit se déclencher seule quand le joueur ne fait rien. Corriger ce qui remet à zéro
   l'inactivité sans geste du joueur (fin automatique d'un dossier, réveil raté) ; vérifier en partie
   réelle qu'un joueur inactif s'endort et qu'un joueur actif ne s'endort pas.

## Vérifications
- `npm run build`, `npm test` ; essai réel (tasse normale et animations réduites, musique au premier
  geste, joueur inactif → sieste, joueur actif → pas de sieste). Documenter dans `jeu/56-…`. Fusion `main`.
