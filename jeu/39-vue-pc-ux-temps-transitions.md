# 39 — Vue PC à 90 %, UX de l'écran de jeu, temps ×30, transitions entre journées (prompt 43)

Les décisions Q1–Q61 ne changent pas.

## Vue au poste
- `ECRAN_POSTE = { x: 96, y: 40, l: 1728, h: 972 }` : l'écran du PC occupe **90 %** du canevas en largeur comme en hauteur. Il ne reste que 10 % de « non-écran », dont 68 px sous le PC au lieu de 286.
- Le bouton « Quitter le PC (Échap) » est placé sous l'écran (50 px de haut, à 10 px du bord). Les zooms, la souris au poste, les flèches du guide et les Indicateurs suivent automatiquement, puisqu'ils lisent `ECRAN_POSTE`.

## Indicateurs redondants retirés (appli Régulation)
- Le bouton « Son (M) : oui » de la barre d'outils est retiré : la touche M et les Paramètres le proposent déjà. Il reste « Aide (H) » et « Recommencer (R) ».
- La ligne « Météo : … » du dossier est retirée : la météo du jour est déjà affichée sous la carte, sur le même écran.

## Comprendre le jeu à l'écran
- **Bandeau d'état** en bas de l'écran du jeu (`bandeauEtat()`). Il dit quoi faire selon la phase :
  - surveillance (temps ×30) ;
  - décision ;
  - contradiction ;
  - conflit ;
  - conséquences ;
  - fin de journée ;
  - fin de semaine.
  Il est en rouge primaire quand une décision est attendue.
- **Effets habituels sous chaque action** (`effetsResumes`), calculés à partir des signes de la vraie table `REGLAGES.effets` :
  - « fluidité ▼ · réputation ▲ · budget ▼ » ;
  - pour « Ne rien faire » : « une jauge au hasard ▼ (−2 à −8) ».
- **Repères des seuils réels** (20 critique, 40 orange) sur chaque barre de jauge.

## Temps accéléré ×30
- `IMMERSION.compression = 30` (au lieu de 10) quand aucun incident n'est actif. L'étiquette du bureau, l'écran d'attente, le bandeau et le guide affichent ×30.

## Transition entre journées
- À chaque nouvelle journée (`demarrerJournee` → `annoncerJournee`), un écran **noir** affiche au centre « JOUR n — SEMAINE n » en titre pixel (« JOUR n — TEMPS RÉEL » en temps réel), avec la date réelle de la journée en dessous.
- Durée 2,8 s, fondu d'entrée de 0,3 s et de sortie de 0,5 s (aucun fondu avec animations réduites).
- Le temps du jeu est suspendu. Entrée, Espace, Échap ou un clic passe l'écran.
- Pas de doublon : une journée n'est annoncée qu'une fois.
- Le téléphone d'ouverture de semaine (prompt 42) attend la fin de cette transition avant de monter.
- Annonce `aria-live` : « JOUR 1 — SEMAINE 2 — 2 novembre 2026 ».

## Vérifications
- `npm run build` et `npm test` OK.
- Test automatisé (semaine 2), sans erreur console : transition « JOUR 1 — SEMAINE 2 », puis téléphone du patron, puis poste. Écran du PC à 1728×972, compression ×30. Captures de l'attente et d'un dossier (bandeau, effets, seuils).
