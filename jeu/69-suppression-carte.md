# 69 — Suppression de la carte : l'écran de jeu devient une liste de signalements (prompt 73)

Code : `carte.js` (liste, état des équipes, prise d'un signalement), `sketch.js` (mise en page, carte et zoom
supprimés), `enquete.js` (source « Lignes »), `os.js` (appli « Signalements »), `guide.js`, `portrait.js`,
`mobile.js`, `feedback.js`, `i18n.js`. `game.js` est **inchangé** : règles, effets, dés, Q1–Q61.

## Pourquoi
Les sources réelles (GTFS-RT, changelog, agenda, Open-Meteo) ne donnent aucune géométrie d'incident : le repère
était posé au centre (« Réseau ») la plupart du temps. La carte n'apportait aucune information réelle.

## Ce qui disparaît
- Fond de carte, projection et zoom (molette, + / −, ⟲, glisser), tracés et états des lignes, repères qui pulsent,
  traces vertes / orange des décisions, pictogrammes d'équipes qui se déplaçaient, légende des couleurs.
- Code supprimé : `CARTE_VUE`, `zoomerProjection`, `zoomerCarte`, `commandesCarte`, `zoomCarteMolette`,
  `carteVisible`, `etatsLignes`, `dessinerLignesEtat`, `dessinerReperesCarte`, `positionDossier`, `traceDecision`,
  `dessinerBandeauEquipes`, `centreLigne` ; clés i18n `carte.zoom`, `carte.reseau`, `carte.file`, `legende.*`,
  `app.carte`, `enq.source.carte`, `enq.carte.*`, `guide.ouvrirCarte`.
- Le décor d'ambiance de l'écran de fin (eau et lignes en filigrane) reste : ce n'est pas l'écran de jeu.

## L'appli « Signalements » (EN « Reports »)
- Première icône du bureau RégulOS (glyphe : liste à pastilles de gravité), titre de fenêtre
  « SIGNALEMENTS · RÉGULATION NANTES », s'ouvre comme avant après le démarrage du PC.
- **Liste à gauche** : chaque signalement arrivé et non traité — heure d'arrivée, type, ligne(s) (numéro + nom
  réel de `data/lignes.js` une fois identifiée par la source « Lignes », sinon « à identifier » ou « non
  renseignée par la source »), gravité calculée, expiration restante (ou « en cours » / « en attente depuis »).
- **Prendre un signalement** : clic sur sa carte, ou ↑ ↓ puis Entrée (Espace aussi). On peut prendre n'importe
  lequel de la file : il passe en tête du paquet (seul l'ordre de traitement change ; les index mémorisés —
  arrivées, équipes envoyées — suivent ; l'enquête repart de zéro). Panneau de droite : le signalement choisi et
  « Prendre ce signalement (Entrée) ».
- Panneau incident inchangé : enquête (la source 5 s'appelle désormais « Lignes »), historique de la ligne,
  équipes, compteur, décision, narration.
- **Colonne de droite** : « Lignes concernées » repliable (un clic sur une ligne encadre ses signalements dans la
  liste), objectif du jour et modificateur, puis **Équipes** en texte : disponibles / effectif, et pour chaque
  équipe engagée « en route · 12 s », « sur place · 34 s », « retour · 6 s ».
- Écran vide : « Aucun signalement pour le moment. Prochaine arrivée vers 11h48 (heure du jeu). »
- Portrait mobile : liste en haut (hauteur selon le nombre de signalements), dossier dessous, puis la colonne
  lignes / objectif / équipes ; le swipe ne zoome plus.

## Conservé
File avec expiration (2 × le compteur), compteur qui démarre à la prise, conflit A / B, équipes limitées
(effectifs, pertinence, refus), raccourcis (Tab, Entrée, 1 / 2 / 3 / 0, A / B, Maj + 1 à 4, 5 à 8), `aria-live`,
animations réduites, contraste.

## Vérifications
- `npm test` : prise du 3e signalement de la file (ordre, équipe qui suit son dossier, arrivées conservées,
  sauvegarde cohérente, semaine jouée jusqu'au bout), nom réel de la ligne, plus aucun symbole ni clé de la carte.
- Chromium 1920 × 1080 FR et EN, portrait 412 × 915 : liste, prise au clavier du 2e signalement, police envoyée
  et son état « en route », aucune erreur console.
