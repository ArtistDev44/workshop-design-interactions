# Prompt 189 — Jeu : personnages avec un trait, un arc sur 3 semaines, et Camille ancrée dans la météo réelle

Demande d'origine (12/11/2026) : audit croisé avec le guide wikiHow « Comment concevoir un jeu vidéo », Partie 6
« Concevoir les personnages ». Constat : le patron, Camille et les usagers sont des noms sans psychologie, sans
faille, sans évolution. Un *Paper Please* doit son impact à ses personnages — ici, personne ne marque.

## Constat

- Le patron envoie des messages fonctionnels (consignes, reproches) mais n'a aucun trait de caractère ni arc.
- Camille n'apparaît que dans l'intro (SMS) puis disparaît.
- Les usagers de Community ont des pseudonymes génériques sans registre de langage varié (`messages.json`).
- Aucune évolution de personnage au fil des 3 semaines du mode histoire.

## À faire

### 1. Un trait marquant pour le patron

Dans `i18n.js` et la logique d'envoi (`game.js` / `immersion.js` / `mecaniques.js`) :

- Le patron **déteste qu'on lui mente ou qu'on esquive**. Concrètement : après une réponse Community jugée
  « mauvaise » (refus de reconnaître le problème, renvoi de la faute à l'usager), le prochain reproche du patron
  est plus sévère (malus de réputation passé de −3 à −5 pour cette journée), et un SMS dit pourquoi
  (ex. « J'ai vu ta réponse sur Quai. On assume, ici. »).
- Inversement, une bonne réponse Community lui fait envoyer un message de satisfaction court (réputation +1
  supplémentaire, une fois par jour max).
- Ces textes passent par `t()` en FR et EN, avec des variantes (2–3 formulations par situation, tirage
  déterministe par la graine).

### 2. Arc du patron sur les 3 semaines du mode histoire

Trois tons, un par semaine, dans tous ses messages (consignes, reproches, félicitations) :

| Semaine | Ton | Caractéristiques |
|---|---|---|
| 1 (14/09) | Pédagogue | Phrases longues, explications, encouragements. |
| 2 (02/11) | Professionnel, direct | Phrases courtes, va droit au but. |
| 3 (12/10) | Sous pression | Phrases sèches, ponctuation minimale, peut envoyer deux messages à la suite. |

- Implémentation : un champ `ton` dans les entrées de messagerie du patron, dérivé de `Jeu.semaineActuelle`
  ou du chapitre en cours (`histoire.js`). Les textes FR/EN sont stockés avec une clé de ton
  (ex. `patron.consigne.j1.pedagogue`).
- Le changement de ton est visible dès le premier message de la semaine (conversation téléphonique du patron,
  prompt 42/37).

### 3. Camille ancrée dans le réel

- Entre deux journées (pas pendant une décision), Camille envoie un SMS court qui commente la **météo réelle
  du jour joué** (donnée Open-Meteo de la semaine, ou météo du jour en temps réel) :
  pluie → « Il pleut des cordes sur la Loire, t'as vu ? » ; canicule → « 32 degrés à l'ombre, courage. » ;
  vent fort → « Les rafales secouent les grues du chantier naval. »
- 3 variantes par condition météo, FR/EN, tirage déterministe. Aucun fait inventé : la condition est lue
  dans les données météo déjà chargées.
- Camille a un trait : elle est **légèrement inquiète pour le réseau** (ton rassurant mais preoccupé), ce qui
  contraste avec le patron.

### 4. Diversité des registres dans `messages.json`

- Ajouter un champ `registre` aux plaintes existantes (ou en réécrire quelques-unes) : `etudiant`,
  `senior`, `touriste`, `travailleur`, `parent`. Le registre influe sur le vocabulaire de la plainte
  (ex. l'étudiant dit « mon tram de 8h12 », le senior « la ligne 4 comme au bon vieux temps »).
- Les plaintes restent ancrées dans les données réelles (ligne, retard, nature) — seul le registre de
  langage change.
- Au moins 4 registres différents répartis sur les 14 plaintes existantes.

## Vérifications

- `npm run build`, `npm test` verts.
- Partie automatisée en mode histoire (3 semaines) : le ton du patron change bien entre semaine 1, 2 et 3 ;
  un SMS de Camille apparaît entre deux journées avec une condition météo réelle ; le malus aggravé après une
  mauvaise réponse Community est bien appliqué (−5 au lieu de −3).
- Toutes les nouvelles clés i18n existent en FR et EN (`npm test` le vérifie).
- Audit des textes (`?audit=textes`) à 0 défaut A–D.
- Doc : nouvelle fiche `jeu/189-personnages-patron-camille.md` décrivant les traits, les arcs et les registres,
  listée dans `jeu/README.md`. `prompts/README.md` (ligne 189), `journal.md` au push.

## Hors périmètre (ne pas faire)

- Ne pas inventer de nouveaux personnages nommés (règle du projet : pas de personnes inventées hors fiction
  déclarée du réseau « Quai »).
- Ne pas modifier les règles Q1–Q61 ni les effets des réponses (`reponses.json`) — seulement le ton et les
  SMS contextuels.
- Ne pas toucher à `game.js` au-delà de l'évaluation des conséquences (le malus aggravé est un affichage
  + un delta, pas une nouvelle règle verrouillée).
