# 67 — Le PC redémarre au début des 3 premières journées (prompt 71)

Code : `os.js` (`JOUR_PC`, `demarrageDuJour`, `majDemarrageJour`, `pcDemarre`), `immersion.js`
(`demarrerJournee`, garde du temps), `sketch.js` (appel par image), `menu.js`, `sauvegarde.js`.
`game.js`, jauges, dossiers et compteurs de décision inchangés ; règles Q1–Q61 inchangées.

## Comportement
- Jours **1, 2 et 3** de la partie (`Jeu.jourIndex` 0 à 2, remis à 0 à chaque nouvelle partie) : la journée
  commence PC éteint ; dès la fin de l'écran « JOUR n — SEMAINE n », le démarrage existant (`dessinerDemarrage`,
  3,4 s : BIOS, logo RégulOS, barre de chargement par blocs, bip, « Bienvenue ») se joue en entier, visible sur
  le moniteur depuis le bureau (ou en plein écran si le joueur s'installe), puis le bureau RégulOS.
- Jour **4 et suivants** : transition directe, comme avant.
- **Une seule fois par journée** : la clé de la journée démarrée est gardée (`interface.pcJour` de la
  sauvegarde) ; se relever / se rasseoir ou recharger la page en cours de journée ne rejoue rien (anciennes
  sauvegardes : considérées comme déjà démarrées).
- **Temps de jeu suspendu** pendant le démarrage (aucun incident, horloge figée). Le démarrage ne se coupe pas
  (comme au lancement).
- **Animations réduites** : démarrage écourté — écran d'accueil statique 0,5 s, puis le bureau.

## Vérifications
- `npm run build`, `npm test` : 20 contrôles « démarrage PC » (os.js chargé avec game.js) — jours 1–3 démarrent,
  jour 4+ non, pas pendant l'écran « JOUR n », pas de replay dans la journée ; garde du temps.
- Chromium FR et EN (animations réduites) : jours 1–3 « transition → démarrage → bureau », jour 4 « transition →
  bureau », horloge figée pendant le démarrage, reprise de sauvegarde au jour 2 sans replay, aucune erreur console.
