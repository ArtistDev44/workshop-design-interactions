# 70 — Comprendre le poste de régulation, et moins de répétition (prompt 74)

Code : `rythme.js` (nouveau, logique pure testée sous Node), `immersion.js` (fil de la journée, explication du
poste), `sketch.js` (narration, branchements), `sauvegarde.js`, `i18n.js`. `game.js` est **inchangé** : aucune
règle, aucun effet, aucun tirage de dé (`Jeu.alea`) n'est touché.

## Comprendre le poste
- **Première ouverture de l'écran de jeu** dans une partie : fenêtre « Votre poste : opérateur de régulation »
  — rôle, ce que fait le poste, et les décisions en langage métier (`action.desc.*`) :
  Dévier = autre itinéraire le temps de l'incident ; Retenir = garder les véhicules au terminus pour réguler ;
  Renfort = bus supplémentaires ; Ne rien faire = laisser le service et surveiller ; Équipes (Maj + 1–4).
  Aucune action désignée comme bonne. Entrée / Espace / Échap / bouton ; temps de jeu suspendu pendant la
  lecture ; vue une fois par partie, gardée dans la sauvegarde (`interface.explication`).
- Mêmes phrases dans le tutoriel / livre « Aide » (étape 3), l'aide (H, paragraphe « Actions ») et l'étape
  « actions » du guide « Prendre en main ».
- **Narration enrichie** : après chaque décision, une phrase de contexte calculée (météo du jour, heure de la
  décision dans ou hors pointe, ligne et son nom réel, événement d'agenda du jour), choisie par la graine.

## Casser la répétition
- **Ordre d'arrivée** (`Rythme.melangerArrivees`, juste après `Jeu.nouvellePartie()`) : par journée, les créneaux
  réguliers des dossiers **sans heure réelle** (heures de la partie, pas des faits) sont redistribués entre eux
  par la graine ; à minute égale, l'ordre est tiré aussi. Les dossiers à heure réelle gardent la leur. La
  sauvegarde garde le paquet et ses minutes : l'ordre est figé à la reprise.
- **Textes de liaison** après chaque dossier : météo du jour, agenda du jour, radio d'un chauffeur (ligne et
  retard réels), signalements restants aujourd'hui — choisis par hachage (graine + n° de dossier), jamais le
  même deux fois d'affilée.
- **Rythme de la journée** : à 10 h (agenda : événements grand public du jour), 12 h (météo : dégradée si pluie
  ≥ 5 mm ou rafales ≥ 50 km/h, mêmes seuils que les règles) et 17 h (heure de pointe), une ligne annonce la
  situation réelle et la règle déjà en vigueur (contexte × 1,25, Q24). Une fois par jour ; les heures déjà
  passées ne sont pas rejouées à la reprise.
- **Séries** (présentation seule) : 2 bonnes évaluations d'affilée → félicitations du patron (3 variantes) ;
  2 « raté » / « trop tard » → encouragement et rappel de l'aide (3 variantes). La série repart à zéro après
  chaque message. Aucun effet sur les jauges.
- **Objectif du jour** : au matin, le fil rappelle l'objectif ; le panneau d'attente l'affiche avec sa règle
  (vérifié le soir : bonus / −5) et la valeur actuelle de la jauge ; le bilan de la veille (dossiers, bons
  choix, objectif atteint ou manqué) arrive avant le premier signalement.
- Tout est annoncé en `aria-live` ; le fil garde les 6 derniers messages (4 affichés).

## Vérifications
- `npm test` : ordre d'arrivée reproductible (deux contextes), mêmes créneaux, heures réelles intactes, dés non
  consommés, ordre restauré par la sauvegarde, mélange effectif sur au moins une semaine ; plus de 200 textes
  de variété générés sur les 3 semaines, tous traduits FR + EN, aucun trou vide ; séries ; `game.js` sans
  `Rythme`.
- Chromium : 3 semaines complètes (FR facile, EN normale, FR difficile en portrait mobile, animations
  réduites), explication à la première ouverture, fil de la journée, aucune erreur console. Rapport :
  `notes.md`, section « Prompt 74 ».
