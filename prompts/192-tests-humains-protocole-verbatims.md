# Prompt 192 — Tests humains : protocole de test novice et consignation des verbatims dans `notes.md`

Demande d'origine (12/11/2026) : audit croisé avec le guide wikiHow, Partie 1 étape 8 « Équilibrez la difficulté »
(« cela demande généralement quelques tests ») et `todo.md` (« Test croisé silencieux par un autre groupe » non
coché ; plusieurs `[À COMPLÉTER]` de tests humains dans `jeu/92`, `jeu/93`, `jeu/94`).

## Constat

- L'équilibrage du jeu n'a été validé que par **simulation** (`test-jeu.mjs`), jamais par des joueurs humains.
- Plusieurs rapports de prompts contiennent des `[À COMPLÉTER]` réservés à des tests humains :
  ressenti du game feel (prompt 96), test joueur novice (prompt 97), tests mobile pouce seul et clavier seul
  (prompt 98), partie réelle carte interactive (prompts 102–109).
- Le `todo.md` exige un « test croisé silencieux par un autre groupe (30 à 60 s, 3 observations notées) ».

## À faire

### 1. Protocole de test novice (à exécuter par le groupe, pas par l'assistant)

Rédiger dans `notes.md` une section « Protocole de test novice » :

- **3 testeurs** : personnes hors du projet, n'ayant jamais vu le jeu.
- **Consigne orale** (une seule phrase) : « Joue à ce jeu, dis-moi ce que tu comprends et ce qui te plaît ou
  te gêne. » Aucune explication des règles.
- **Durée** : 10 minutes de jeu libre sur la semaine 1 (facile), en 1920×1080, navigateur récent.
- **Observations à noter** (3 minimum par testeur) :
  1. À quelle décision le testeur a-t-il compris le but du jeu ? (décision n°, temps)
  2. Quelle a été sa première erreur de compréhension ?
  3. Qu'a-t-il ressenti au game feel (secousse, hit-stop) ? (trop fort / imperceptible / agréable)
  4. A-t-il utilisé le clavier, la souris, le glisser-déposer ?
  5. Verbatim exact d'une phrase prononcée (positive ou négative).
- **Ne pas intervenir** pendant le test (test silencieux).

### 2. Test croisé inter-groupe (30–60 s)

- Un autre groupe teste le jeu 60 secondes sans consigne, note 3 observations, rend le jeu.
- Consigner les 3 observations dans `notes.md`, section « Test croisé du [date] ».

### 3. Consignation dans `notes.md`

Créer une section « Tests humains — [date] » avec :

- Pour chaque testeur : profil (âge, habitude de jeu), décision de compréhension, première erreur,
  ressenti game feel, verbatim.
- Synthèse : les 3 frictions les plus citées → liste de propositions d'amélioration (même si non implémentées
  dans ce prompt).
- Cocher dans `todo.md` la ligne « Test croisé silencieux par un autre groupe ».

### 4. Remplir les `[À COMPLÉTER]` des rapports de prompts

Dans `jeu/92-game-feel-juice.md`, `jeu/93-boucle-engagement-flow.md`, `jeu/94-revue-ui-hud.md` et
`jeu/105-109-carte-dialogue-equipes.md`, remplacer chaque `[À COMPLÉTER]` de test humain par le résultat
observé (ou « non testé, prévu le [date] » si le test n'a pas eu lieu).

## Vérifications

- `notes.md` contient la section « Tests humains » avec au moins 3 verbatims de 3 testeurs différents.
- `todo.md` : la case « Test croisé silencieux » est cochée.
- Les `[À COMPLÉTER]` des 4 fichiers de `jeu/` listés ci-dessus sont remplacés.
- Aucun fichier de code du jeu modifié (`game.js`, règles Q1–Q61).
- `prompts/README.md` (ligne 192), `journal.md` au push.

## Hors périmètre

- Ne pas implémenter les améliorations proposées par les testeurs dans ce prompt (ce seront des prompts
  séparés). Le but est de mesurer, pas de corriger.
- Ne pas modifier le code du jeu.
