# 81 — Diagnostic de la répétition (prompt 88, § 0)

Mesure : `node site/scripts/mesure-repetition.mjs` (option `--json` pour le détail, `--en` pour l'anglais).
Le script rejoue les **3 semaines réelles proposées** (facile 14/09, normale 02/11, difficile 12/10/2026) avec la
logique du jeu (mêmes fichiers que `test-jeu.mjs`, sans affichage). Il journalise, journée par journée, chaque
action du joueur par type et chaque texte montré : titre et texte de narration, phrase de contexte, liaison,
messages du patron, plaintes Community, mail du soir. Une réponse par dossier est choisie en tournant dans la
liste des réponses possibles. L'horloge avance jusqu'à l'heure réelle de chaque dossier, comme en jeu.

Deux vues :
- **toutes les actions**, lecture des messages du patron comprise (liste du prompt) ;
- **décisions actives** : les seules tâches où le joueur choisit quelque chose (signalement, vérifier une
  source, répondre à une plainte, inspection, et les tâches du prompt 88). C'est la vue retenue pour le
  critère de réussite (< 50 %), car lire un message ne casse pas la répétition.

## Avant le prompt 88 (commit 50c8245, prompt 87)

| Journée | Actions | Décisions actives | Types actifs | Part du signalement (actives) | Suite max | Textes répétés |
|---|---|---|---|---|---|---|
| 14/09 (facile) | 10 | 7 | 2 | 57 % | 2 | 4 |
| 15/09 | 11 | 6 | 2 | 83 % | 5 | 4 |
| 16/09 | 3 | 1 | 1 | 100 % | 1 | 0 |
| 17/09 | 7 | 4 | 2 | 75 % | 2 | 1 |
| 18/09 | 3 | 1 | 1 | 100 % | 1 | 0 |
| 19/09 | 4 | 1 | 1 | 100 % | 1 | 0 |
| 02/11 (normale) | 10 | 7 | 2 | 57 % | 2 | 5 |
| 03/11 | 7 | 4 | 2 | 75 % | 3 | 2 |
| 04/11 | 7 | 4 | 2 | 75 % | 2 | 2 |
| 05/11 | 3 | 1 | 1 | 100 % | 1 | 0 |
| 06/11 | 5 | 3 | 2 | 67 % | 1 | 0 |
| 07/11 | 3 | 1 | 1 | 100 % | 1 | 0 |
| 08/11 | 3 | 1 | 1 | 100 % | 1 | 0 |
| 12/10 (difficile) | 14 | 9 | 3 | 56 % | 2 | 5 |
| 13/10 | 5 | 3 | 2 | 67 % | 2 | 1 |
| 14/10 | 8 | 4 | 1 | 100 % | 4 | 6 |
| 15/10 | 4 | 2 | 1 | 100 % | 2 | 0 |
| 16/10 | 3 | 2 | 2 | 50 % | 1 | 0 |
| 17/10 | 2 | 1 | 1 | 100 % | 1 | 0 |

Synthèse :
- **Type dominant** : le signalement, **82 %** des décisions actives en moyenne ; **19 journées sur 19** à 50 % ou
  plus. En comptant la lecture des messages, 51 % en moyenne.
- **Variété** : **18 journées sur 19** ont moins de 3 types de décisions actives.
- **Textes identiques** : **30** répétitions dans une même journée. Le titre de narration « date — affluence »
  revient jusqu'à 3 fois par jour (tous les événements d'agenda ont le même objet). Viennent ensuite les phrases
  météo du jour, la même dans la liaison et dans le contexte de narration.
- **Moments sans rien à faire** : **8 journées** n'ont qu'**un seul** signalement (les fins de semaine surtout) :
  une décision, puis l'attente de la fin de service.
- **Moments surchargés** : 2 journées à **5 signalements** (15/09, 12/10), dont une suite de 5 signalements
  d'affilée sans autre tâche (15/09).

## Priorités retenues (ce qui corrige un problème mesuré)

| Problème mesuré | Réponse du prompt 88 | Lot |
|---|---|---|
| 30 textes répétés | 3 variantes par modèle (narration, patron, liaison, contexte, rythme, veille), sans reprise dans la journée ; nom réel de l'événement dans le titre | A |
| 82 % de signalements, < 3 types | briefing du matin, rapport du soir (chaque journée), rédiger l'info trafic, préparer un événement, vérifier une source ; rotation (jamais plus de 3 fois de suite) | B, C |
| 8 journées à un seul signalement | briefing et rapport donnent un début et une fin à chaque journée ; thème du jour | B, D |
| journées surchargées | la cellule de crise est placée sur le jour réel le plus difficile, annoncée, avec un objectif clair ; les tâches courtes s'intercalent entre les signalements | C, D |
| aucune trace d'un jour à l'autre | carnet de la semaine, demande du rapport du soir reprise par la consigne du lendemain | B |

## Propositions écartées ou mises en option, et pourquoi
- **Arbitrage hebdomadaire du budget** : il ne corrige aucun problème mesuré (le budget n'est pas une source de
  répétition). Point non tranché par le groupe (§ 7) : livré **désactivé par défaut**, derrière un réglage.
- **Événements chaînés** : ils ajoutent du volume, alors que deux journées sont déjà surchargées. Point non
  tranché (§ 7) : **désactivés par défaut**.
- **Déblocages par grade** : point non tranché (§ 7) : **désactivés par défaut** ; l'expérience, le grade et les
  badges restent affichés, sans effet sur le jeu.
- Ajouter des signalements pour « remplir » les journées calmes : écarté, ce serait inventer des données.

Après mise en œuvre : voir `82-engouement-variete.md` (même mesure, mêmes semaines).
