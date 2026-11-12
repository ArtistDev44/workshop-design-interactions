# Prompt 130 — Jeu « Nantes en régulation » : une évaluation qui suit les jauges, des tendances avant de choisir

Demande d'origine (12/11/2026) : « À partir du fichier `audit-2026-11-12.md`, crée plusieurs prompts et exécute-les. »
Ce prompt reprend les sections 3.1 et 3.2 de l'audit.

## 1. Le retour « bon choix / raté » contredit la survie

### Constat (vérifié par simulation)

- `Jeu.journaliser` (`game.js`) classe les réponses par **somme brute** des effets attendus ; `Jeu.evaluer` déclare
  « bon » seulement la meilleure.
- Le bonus ×1,25 de situation (`REGLAGES.bonusSituation`) rend « attendre » (`[-2, 0, +5]`, situation « calme »)
  meilleur partout où c'est calme, c'est-à-dire 10 à 15 dossiers sur 15.
- Résultat sur la semaine 3 : suivre les 15 « bon choix » mène au licenciement au 14ᵉ dossier (fluidité 0) ; jouer
  au hasard ne fait jamais licencier.
- Chaque « raté » coûte un reproche du patron et un commentaire à −3 de réputation : le joueur qui équilibre ses
  jauges, comme l'intro le lui demande, est puni.

### À faire

- **Pondérer par le besoin.** L'effet attendu de chaque réponse est pondéré jauge par jauge selon ce qu'il manque à
  la jauge **au moment de la décision** : `poids = (100 − jauge) / 50`, borné entre 0,25 et 2. Une jauge basse
  compte double ; une jauge pleine ne compte presque plus. Le signe ne change pas : perdre sur une jauge basse
  coûte plus.
- **La meilleure réponse** est celle dont la somme pondérée est la plus haute. Les jauges utilisées sont celles
  d'avant la décision (les deltas du résultat sont déjà appliqués quand on journalise).
- **« Bon »** : la réponse choisie est à moins de 1 point (pondéré) de la meilleure. Plusieurs réponses proches
  peuvent donc être bonnes.
- **Compatibilité** : garder `attendus` (sommes brutes, utilisées par le Journal et l'enquête) et ajouter
  `attendusPonderes` et `poids` à l'entrée du journal. `Jeu.evaluer` utilise `attendusPonderes` s'il existe, sinon
  l'ancien calcul (sauvegardes anciennes).
- **Expliquer le « pourquoi ».** Quand la réponse conseillée est dictée par une jauge basse, le retour le dit :
  nouvelle raison `raison.besoin` (« votre {jauge} est basse ({v}) »), en FR et EN.
- Ne pas toucher aux effets réels des réponses (`Jeu.decider`, `data/reponses.json`) : seule l'évaluation change.

## 2. Décider sans information

### Constat

La fenêtre du plaignant (`dessinerPanneauSignalement`, `panneau.js`) affiche quatre répliques sans coût ni effet.
La tendance ▲▼ par jauge existe déjà (`tendance()`, `Jeu.effetsAttendus`), mais seulement dans
`dessinerCartesReponses`, qui n'est plus appelée depuis le prompt 107.

### À faire

- Sous ou à droite de chaque réplique, afficher la tendance des trois jauges : `Flu. ▲  Rép. ≈  Bud. ▼`, en
  `POLICE_DONNEES`, couleur vert / gris / orange **doublée du symbole** (jamais la couleur seule).
- Marquer d'une pastille discrète « conseillé » la ou les réponses que l'évaluation jugerait bonnes **si l'option
  d'aide est active** (`Traces.option('pressionVisible')` ou une nouvelle option « Aide à la décision »), désactivée
  par défaut : le joueur doit pouvoir se tromper.
- La hauteur des lignes de réplique ne doit pas déborder : vérifier avec l'audit des textes (`?audit=textes`).

## Vérifications

- Simulation (script Node hors dépôt, comme `test-jeu.mjs`) sur les 3 semaines : la stratégie « toujours la
  réponse jugée bonne » ne doit plus être licenciée, et finit au moins aussi bien que le hasard. Noter les chiffres
  avant / après dans la doc.
- Ajouter un contrôle à `site/scripts/test-jeu.mjs` : suivre l'évaluation ne mène pas au licenciement.
- `npm run build`, `npm test`, audit des textes à 0 défaut.
- Doc commune `jeu/130-134-audit-experience-rendu.md`, `prompts/README.md`, `journal.md`.
