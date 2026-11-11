# Prompt 94 — Jeu « Nantes en régulation » : prise en main plus simple, décisions par glisser-déposer, et du poids

Demande d'origine (11/11/2026) :

> Je souhaite que ce jeu vidéo soit plus facile à prendre en main : il est trop complexe pour les créateurs
> eux-mêmes. Déjà pour quitter la journée : c'est trop compliqué. L'interface comprend trop de boutons à
> cliquer. Pourquoi pas du drop avec le curseur. Il n'y a pas de poids pour le jeu. C'est plat comme jeu.
> Il doit être easy to learn & hard to master.

Objectif : réduire le nombre de gestes et de boutons nécessaires pour jouer et pour quitter la journée,
inverser la courbe d'apprentissage (apprendre en quelques secondes, maîtriser sur la semaine), et donner du
« poids » (game feel) aux décisions — sans toucher aux règles du jeu (Q1–Q61, effets, dés, jauges) ni aux
données.

Règles :
- **Ne rien casser.** Aucune modification de `game.js` (règles, effets, 1d6, jauges, fins). Les données
  réelles (GTFS-RT, Open-Meteo, fallback) ne changent pas. `npm run build` et `npm test` verts après chaque lot.
- **Design system** respecté (`ds.js`, prompt 39) : polices et tailles existantes, contraste ≥ 4,5:1,
  coordonnées 1920×1080, FR + EN (`i18n.js`, toute nouvelle clé dans les deux langues), clavier complet
  conservé, `prefers-reduced-motion` respecté, hors ligne, tactile.
- Le jeu reste **jouable 100 % au clavier** : le glisser-déposer est une alternative à la souris, pas un
  remplacement des raccourcis (1-4, Entrée…).
- Côté « hard to master » : la profondeur vient des effets contextuels, du dé, des situations et des
  jauges — on ne simplifie pas les règles, on simplifie seulement l'accès.

## 1. Quitter la journée en un seul geste visible

Aujourd'hui, quitter la journée demande une chaîne de 4 gestes peu évidents : clic sur l'horloge murale à
l'heure de fin → mail du soir → « Ranger le poste (Entrée) » → attendre la nuit → flèche « Sortie » à gauche
(prompts 51, 64, 69).

- Ajouter un bouton **« Quitter la journée »** toujours visible dans le bandeau du haut de l'écran de jeu
  (à côté d'Aide / Recommencer, `panneau.js` `dessinerBandeau()`), avec la touche **Q** comme équivalent
  (`journee.js` `toucheJournee()` ; vérifier qu'aucun autre raccourci n'utilise Q, `jeu/08-raccourcis.md`).
- Ce bouton avance **l'étape de sortie en cours** : fin de service atteinte → mail du soir ; mail du soir →
  on range le poste ; phase « soir » → sortie du bureau (crépuscule sauté s'il n'est pas encore tombé) ;
  avant l'heure → la fenêtre « partir quand même » existante avec son explication du malus (prompt 51).
- Option : sortie automatique du bureau peu après la nuit tombée (la flèche « Sortie » reste cliquable
  pendant ce délai), pour que « ranger le poste » enchaîne seul jusqu'au lendemain. Garder la cinématique
  courte et passable (Entrée / clic), et ne pas toucher aux règles testées du prompt 69
  (`scripts/test-jeu.mjs`, bloc « soir »).

## 2. Décider par glisser-déposer (drop avec le curseur)

Aujourd'hui, chaque signalement propose 4 cartes de réponse à cliquer (ou touches 1-4) — `panneau.js`
`dessinerCartesReponses()`.

- Rendre les cartes **tirables à la souris** : appui sur une carte, la carte flotte (léger retard d'inertie,
  inclinaison selon la vitesse, ombre portée), et on la **dépose sur le dossier** (zone en haut du panneau :
  titre + blocs « Ce qui se passe / Pourquoi / Ce que vous savez ») pour décider. La zone se surbrille en
  pointillés pendant le drag, avec un libellé « Déposer ici ».
- Relâcher ailleurs → la carte revient à sa place (ressort), aucun choix appliqué, annonce `aria-live`.
- **Un simple clic sur la carte décide toujours** (tactile + accessibilité + souris rapide) ; les touches
  1-4 restent inchangées. Le clavier seul doit rester suffisant.
- Implémentation pressentie : nouveau fichier `site/public/glisser.js` (état du drag, inertie, dessin de la
  carte fantôme et de la zone de dépôt), branché dans `mousePressed` / `mouseReleased` (`sketch.js`,
  `micro.js`) et dans `draw()` ; les rectangles des cartes et la zone de dépôt relevés à chaque image par
  `panneau.js` (`CARTES`, `ZONE_DEPOT`). Ajouter le script dans `index.html` et régénérer `sw.js`
  (`npm run sw`).
- Indice contextuel dans le bandeau pendant un signalement : « Glissez une carte sur le dossier — ou clic / 1-4 ».

## 3. Donner du poids (game feel)

Le jeu paraît « plat » : les conséquences manquent de sensation physique.

- **Secousse d'écran** légère à chaque décision selon l'amplitude réelle des deltas (ex. ≥ 10 → forte,
  ≥ 6 → moyenne), et au dépôt d'une carte — via un `push()`/`translate()` autour du dessin de `draw()`
  (`sketch.js`), désactivé si animations réduites.
- La carte déposée « frappe » le dossier : flash/scale bref + le son de console existant (`Confort.Son`).
- Les jauges glissent déjà vers leur valeur (`feedback.js`) : ajouter un éclair bref sur la jauge qui vient
  de changer si simple, mais ne pas retirer les deltas flottants existants.
- Jamais de flash > 1,5 pulsations/s, rien si `prefers-reduced-motion`.

## 4. Easy to learn & hard to master

- Learn : premier signalement = 1 carte à déposer (ou 1 clic), bouton « Quitter la journée » visible,
  indice en ligne, aide H existante — aucun mur de boutons.
- Master : inchangé — effets contextuels (météo, pointe, affluence), 1d6, retard effectif qui grimpe,
  équipes limitées, thème du jour, pression morale. Ne pas ajouter de tutoriel lourd : le guide « Prendre
  en main » (prompt 37) suffit, éventuellement complété d'une bulle « glissez la carte sur le dossier ».

## 5. Vérifications

- `npm test` (`scripts/smoke.mjs` + `scripts/test-jeu.mjs`) : ajouter des contrôles — nouvelles clés i18n
  présentes en FR et EN ; fonctions de glisser-déposer présentes et appelables dans un contexte `vm` (appui
  sur carte → drag → dépôt sur la zone = `decider(cle)` ; dépôt ailleurs = aucun choix ; simple clic =
  `decider`) ; `quitterJourneeRapide()` enchaîne mail → soir → sortie sans changer les jauges ; aucun
  `[À COMPLÉTER]`.
- `npm run build` vert ; `npm run sw` régénère le précache avec le nouveau fichier.
- Test manuel (Chromium, FR + EN, animations réduites comprises) : quitter la journée en 2 gestes (Q puis
  Entrée) ; décider 3 signalements par glisser-déposer et 3 par clic / clavier ; vérifier la secousse et
  l'absence d'erreur console.
- Mettre à jour `jeu/08-raccourcis.md` (touche Q, geste glisser-déposer) et `journal.md` (une ligne).
