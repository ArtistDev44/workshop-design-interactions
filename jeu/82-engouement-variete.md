# 82 — Donner envie de jouer : tâches variées, journées différentes, progression (prompt 88)

Code : `taches.js` (logique pure, graine, chargée par les tests), `taches-ui.js` (fenêtre « tache », options),
`game.js` (variantes de textes `Jeu.variante`, sauvegarde de `Jeu.taches`, équipes en plus, objectif allégé),
`rythme.js` (variantes), `panneau.js` (grade, thème, bandeau de crise, conséquence étiquetée), `carte.js`
(prévision), `os.js` (carnet dans le Journal, grade et badges dans Indicateurs), `confort.js`
(`Musique.humeur`, options), `immersion.js`, `journee.js`, `soir.js`, `sketch.js`, `portrait.js`, `i18n.js`,
`data/messages.json` (plainte `info_erronee`). Mesure : `site/scripts/mesure-repetition.mjs`. Diagnostic de
départ : `81-diagnostic-repetition.md`.

## Avant / après (même mesure, mêmes 3 semaines réelles)

| Indicateur | Avant (prompt 87) | Après (prompt 88) |
|---|---|---|
| Part du type dominant, décisions actives (moyenne) | 82 % | **31 %** |
| Journées où le type dominant atteint 50 % (actives) | 19 / 19 | **0 / 19** (max 45 %) |
| Même vue en comptant la lecture des messages | 51 % (moyenne) | **31 %** (max 43 %) |
| Journées avec moins de 3 types de décisions | 18 / 19 | **0 / 19** |
| Plus longue suite du même type | 5 | **2** |
| Textes identiques répétés dans une journée | 30 | **0** (FR et EN) |
| Journées réduites à une seule décision | 8 | 0 (briefing, info trafic, rapport) |

Détail après :

| Journée | Actions | Actives | Types actifs | Dominant (actives) | Dominant (tout) | Suite max | Répétés |
|---|---|---|---|---|---|---|---|
| 14/09 | 15 | 12 | 6 | 33 % | 27 % | 2 | 0 |
| 15/09 | 16 | 11 | 6 | 45 % | 31 % | 2 | 0 |
| 16/09 | 6 | 4 | 4 | 25 % | 33 % | 1 | 0 |
| 17/09 | 11 | 8 | 5 | 38 % | 27 % | 1 | 0 |
| 18/09 | 6 | 4 | 4 | 25 % | 33 % | 1 | 0 |
| 19/09 | 7 | 4 | 4 | 25 % | 43 % | 1 | 0 |
| 02/11 | 15 | 12 | 6 | 33 % | 27 % | 1 | 0 |
| 03/11 | 12 | 9 | 6 | 33 % | 25 % | 1 | 0 |
| 04/11 | 12 | 8 | 6 | 38 % | 33 % | 1 | 0 |
| 05/11 | 6 | 4 | 4 | 25 % | 33 % | 1 | 0 |
| 06/11 | 9 | 7 | 5 | 29 % | 22 % | 1 | 0 |
| 07/11 | 6 | 4 | 4 | 25 % | 33 % | 1 | 0 |
| 08/11 | 6 | 4 | 4 | 25 % | 33 % | 1 | 0 |
| 12/10 | 20 | 15 | 7 | 33 % | 25 % | 1 | 0 |
| 13/10 | 9 | 7 | 6 | 29 % | 22 % | 1 | 0 |
| 14/10 | 14 | 9 | 5 | 44 % | 36 % | 2 | 0 |
| 15/10 | 9 | 6 | 5 | 33 % | 33 % | 1 | 0 |
| 16/10 | 7 | 5 | 5 | 20 % | 29 % | 1 | 0 |
| 17/10 | 6 | 4 | 4 | 25 % | 33 % | 1 | 0 |

La mesure simule un joueur qui fait chaque tâche proposée (bonne réponse) et choisit ses réponses en tournant.
Pour ne pas multiplier les messages à lire, la phrase du thème, l'accusé des priorités et la réponse à la
demande de la veille complètent la consigne du jour au lieu d'être des messages séparés.

## Lots
| Lot | Commit | Contenu |
|---|---|---|
| A | `eec8beb` | Mesure, diagnostic (jeu/81), 3 variantes par modèle (narration, patron, liaison, contexte, rythme, veille), sans reprise dans la journée, tirées par la graine ; nom réel de l'événement dans le titre |
| B | `b5fa6bd` | Briefing du matin, rapport du soir, carnet de la semaine (Journal, K) |
| C | `15ef843` | Rédiger l'info trafic, préparer un événement, rotation |
| D | `17c8fe8` | Thème du jour, cellule de crise, humeur musicale, SMS de Camille la veille de l'inspection |
| E | `364812f` | Expérience, grade, badges, récapitulatif du soir |
| F | `7044f73` | Options du groupe désactivées par défaut (chaînes, déblocages, arbitrage), remise à zéro de la progression |

## Tâches (§ 1)
Chaque tâche : une carte d'introduction (une phrase + un exemple) la première fois seulement, rappel dans l'aide
(H), clavier seul (1 à 4, Tab, Entrée, Échap), annonce `aria-live` à l'ouverture et au résultat, temps de jeu
suspendu pendant la fenêtre, cibles ≥ 44 px en portrait mobile.

| Tâche | Quand | Données réelles | Effet |
|---|---|---|---|
| Briefing du matin | début de chaque journée, au poste | météo, agenda, perturbations du jour | 2 priorités parmi 4 ; +2 de réputation par priorité tenue (calcul sur le journal du jour) |
| Rédiger l'info trafic | après une décision sur deux environ, d'office après 2 signalements d'affilée ou un jour calme | ligne, cause, retard effectif, famille de la réponse ; leurres pris dans les autres dossiers et les lignes du réseau | exacte : +2 ; un bloc faux : −2 et plainte Community `info_erronee` |
| Préparer un événement | une affluence de l'agenda est à venir aujourd'hui | dossier « événement » réel du jour | −3 de budget ; +3 de réputation si la réponse suit la préparation, sinon +1 de budget rendu |
| Vérifier une source | contradiction existante (prompt 50) | changelog | inchangé, compté comme type de tâche |
| Rapport du soir | fin de journée | journal réel du jour | fait marquant (carnet) + demande : +5 de budget, +1 équipe de police ou objectif allégé de 5, le lendemain, si réputation ≥ 50 |
| Arbitrage du budget (option) | un jour par semaine (graine), ni le premier ni la crise | budget de la partie | véhicules : renfort −1 de coût ; équipes : +1 police les jours suivants ; communication : +1 réputation par réponse qui informe |

Rotation : jamais plus de 3 fois de suite le même type (la tâche courte est proposée dès 2 signalements
d'affilée) ; au moins 3 types par journée (briefing, signalement, rapport). Une tâche sans donnée réelle n'est
pas proposée (pas d'affluence à venir → pas de préparation).

## Journées différentes (§ 2) et moments forts (§ 3)
- **Thème** : tempête (jour le plus pluvieux ou venteux au-delà de 5 mm / 50 km/h), animée (le plus
  d'événements d'agenda), chantier (perturbations annoncées), ordinaire. Il fixe la tâche signature (info trafic
  ou préparation), le ton de la consigne et l'humeur musicale (morceau « Régulation » le jour de tempête et
  pendant la crise, sans changer le choix du joueur).
- **Cellule de crise** : au plus une par semaine, le jour réel le plus difficile ayant au moins 3 signalements
  (pas le premier jour s'il y a un autre candidat). Les créneaux de jeu des dossiers **sans heure réelle** sont
  regroupés entre 16 h 30 et 17 h 45 (les heures réelles ne bougent jamais). Bandeau « Cellule de crise »,
  annonce du patron le matin, objectif « aucun signalement non traité » : réussi → +3 de réputation, badge et
  expérience. Toujours sans chrono.
- **Visite surprise** : Camille prévient par SMS la veille au soir du jour de l'inspection (prompt 47), avec le
  thème du lendemain.
- Rythme 10 h / 12 h / 17 h du prompt 74 inchangé (complété par la crise de fin d'après-midi).

## Progression (§ 4)
- Expérience par journée, calculée sur ses faits : bonne décision 10 (autre 4), ×1,25 puis ×1,5 en série de
  bonnes décisions (prompt 74) ; info trafic exacte 8 ; préparation utile 8 ; priorité tenue 10 ; objectif du jour
  15 ; crise maîtrisée 25 ; défi de semaine tenu 20. **Aucun effet sur les jauges.**
- Grades : Stagiaire (0) → Régulateur·rice (150) → Régulateur·rice confirmé·e (450) → Chef·fe de salle (900).
  Gardés entre les parties (`localStorage`, clé `pxe-nte001-carriere`), une journée n'est versée qu'une fois,
  remise à zéro dans Paramètres → Options de jeu (G, touche 4, confirmation).
- Badges pixel (motifs 8 × 8 dessinés par le code) : Zéro non traité (journée), Info trafic parfaite ×5,
  Semaine dans le budget (aucun « budget épuisé », budget final ≥ 30), Cellule de crise maîtrisée. Vitrine dans
  Indicateurs. **Liste à confirmer par le groupe (§ 7).**
- Récapitulatif du soir après le rapport : expérience (compteur animé, immédiat si animations réduites),
  grade et progression, priorités tenues ou non, fait marquant, demande, badges ; puis le mail et la nuit
  (prompt 69). Grade dans le bandeau et sur l'écran de fin.

## Conséquences d'un jour à l'autre (§ 5)
Demande du rapport appliquée le lendemain et rappelée dans la consigne ; carnet de la semaine dans le Journal
(une ligne par jour : thème, fait marquant, priorités et leur état, demande, crise).

## Points à trancher par le groupe (§ 7) — non cochés : livrés désactivés par défaut
Paramètres → **Options de jeu (G)** ; chaque option vaut pour la partie suivante.
- **Événements chaînés** (désactivé) : une décision « ratée » sur une ligne crée, 2 h de jeu plus tard (au plus
  tard 30 min avant la fin), un dossier « ligne saturée » sur la même ligne, au plus 1 par jour. Il reprend le
  retard effectif réel (prompt 79) et il est **étiqueté** partout : « Conséquence de votre décision de 16h30… C'est
  une conséquence de jeu, pas un fait réel », source « Conséquence de jeu … (pas une donnée réelle) ». Il est
  ajouté après les dossiers restants du jour : les numéros déjà présentés ne bougent pas.
- **Déblocages par grade** (désactivé) : Régulateur·rice → +1 équipe de police par jour ; confirmé·e → prévision
  à 1 h (type et gravité du prochain signalement dans la liste) ; Chef·fe de salle → +1 ambulance par jour. Sans
  l'option, expérience, grade et badges restent affichés, sans effet sur le jeu.
- **Arbitrage hebdomadaire du budget** (désactivé) : voir le tableau des tâches.
- **Liste définitive des badges** : celle ci-dessus, en attente de validation.

## Exceptions aux décisions verrouillées (effets sur les jauges)
Toutes passent par `Jeu.appliquerDeltas`, sans toucher aux dés (`Jeu.alea`) : priorités tenues (+2 réputation
chacune), info trafic (+2 / −2), préparation d'événement (−3 budget, +3 réputation ou +1 budget), crise
maîtrisée (+3 réputation), demande accordée (+5 budget, +1 équipe, objectif allégé de 5, exception à Q40 / § 3
des objectifs), arbitrage (option), événements chaînés (option, un dossier de jeu de plus). Les dés et les
effets des réponses (Q57–Q61, prompt 87) sont inchangés : vérifié par `npm test`.

## Vérifications
- `npm run build`, `npm test` : 341 contrôles, dont rotation (≤ 3 de suite, ≥ 3 types, < 50 % dans les deux vues),
  tâches non proposées sans donnée réelle, reproductibilité par la graine, thèmes calculés sur les faits, au plus
  une crise par semaine, chaînes étiquetées et plafonnées, expérience et badges sur les faits sans effet sur les
  jauges, sauvegarde et chargement, aucun texte répété dans une journée (FR et EN).
- Chromium : briefing, rapport, récapitulatif, info trafic (résultat faux → plainte), préparation, crise
  (bandeau, morceau « Régulation »), options, conséquence chaînée, Indicateurs, aide ; FR et EN ; animations
  réduites ; portrait mobile ; 3 semaines complètes jouées au clavier sans erreur console.
- **Test de jeu humain** (au moins 2 personnes du groupe, 2 journées) : [À COMPLÉTER] — ce qui donne envie de
  continuer, ce qui ennuie, ce qui est incompris, et les corrections faites.
- Limite connue : en portrait mobile, les fenêtres (comme l'inspection) sont réduites à environ un tiers ; les
  cibles des tâches font au moins 44 px, mais le texte y reste petit.
