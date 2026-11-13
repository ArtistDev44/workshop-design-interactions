# Prompt 200 — Audit général du gameplay : ce qui est à améliorer

Date : 13/11/2026. Branche `200-jeu-audit-gameplay` (empilée sur le prompt 199).
Demande d'origine : « fais un audit général du gameplay avec ce qui est à améliorer ».

Ce document ne modifie aucune règle du jeu. Il décrit l'état réel du code au 13/11/2026, après le
nettoyage du prompt 199, et propose une feuille de route. Les numéros de ligne renvoient à
`site/public/` sur cette branche.

## En bref

1. **Un bug pénalise toutes les réponses Community** : elles sont comptées « tardives » même données en
   moins d'une seconde (−3 de réputation à chaque fois). Correction d'une ligne.
2. **Le joueur ne décide pas vraiment** : la meilleure réplique est toujours parmi les trois proposées
   et l'effet de chacune sur les jauges est affiché dessous. La suivre donne 15 décisions « bonnes »
   sur 15 et la bonne fin dans les trois semaines.
3. **Les dossiers se ressemblent** : 11 à 13 dossiers sur 15 sont des événements de l'agenda, tous dans la
   même catégorie « affluence ». Aucune semaine d'archive ne contient un seul retard, alors que la règle
   des 10 minutes est le cœur annoncé du jeu.
4. **Rien ne presse hors défi chrono**, qui est le mode par défaut : l'horloge s'arrête pendant la
   lecture, rien n'expire avant 20 h, et plusieurs mécaniques (café, micro, ralenti, multitâche, heure
   de pointe) n'ont alors aucun effet.
5. **Le clash coûte plus que le « −8 » annoncé** et cinq clashs d'affilée licencient le joueur dès le
   premier ou le deuxième jour, sans avertissement.

## Méthode et niveau de preuve

- **Mesuré** : simulation avec les vrais fichiers du jeu, `cd site && node scripts/simuler-equilibrage.mjs`
  (ajouté par ce prompt). Elle joue les trois semaines selon quatre stratégies ; elle ne compte ni les
  réponses Community, ni les équipes, ni la sieste, ni l'incident fictif.
- **Vérifié en jeu** : le bug Community, rejoué dans un navigateur sans interface.
- **Lu dans le code** : constantes et branches, avec `fichier:ligne`.
- **Relevé, non revérifié** : constats issus de l'exploration du code que je n'ai pas rejoués moi-même ;
  ils sont regroupés dans une section à part.

Aucun test humain n'appuie ce document : les rubriques « ressenti » des prompts 82, 93, 196 et 197 sont
toujours à compléter. Les pistes ci-dessous sont des hypothèses à tester, pas des valeurs validées.

## Mesures

| Semaine | Dossiers réseau / événements agenda | Catégories | Dossiers par jour | Retards |
|---|---|---|---|---|
| 14/09 (facile) | 4 / 11 | affluence 11, météo 2, travaux 2 | 4 / 5 / 1 / 3 / 1 / 1 | 0 |
| 02/11 (normale) | 2 / 13 | affluence 13, travaux 2 | 4 / 3 / 3 / 1 / 2 / 1 / 1 | 0 |
| 12/10 (difficile) | 3 / 12 | affluence 12, travaux 3 | 5 / 2 / 4 / 2 / 1 / 1 | 0 |

| Stratégie | 14/09 | 02/11 | 12/10 |
|---|---|---|---|
| Toujours la meilleure réplique | 15 bons / 15, score 286, fin bonne | 15 / 15, 277, bonne | 15 / 15, 263, bonne |
| Toujours l'autre réplique | 1 bon / 15, score 184, fin **moyenne** | licencié au jour 6 | licencié au jour 4 |
| Toujours le clash | licencié au 5ᵉ dossier (jour 2) | licencié au 5ᵉ dossier (jour 2) | licencié au 5ᵉ dossier (jour 1) |
| Au hasard (300 parties) | moyenne 72 %, licencié 15 %, mauvaise 7 %, bonne 5 % | moyenne 68 %, licencié 24 %, mauvaise 5 %, bonne 3 % | moyenne 47 %, mauvaise 32 %, licencié 21 %, bonne 0 % |

Score sur 300 ; fin bonne à partir de 240, moyenne à partir de 150 (`game.js:807`).

## Constats

### 1. Bug : toute réponse Community est comptée « tardive » — priorité 1

- `os.js:284` appelle `Jeu.repondrePlainte(p, i, millis())`, alors que le début du délai (`plainte.depuis`)
  est daté avec `tempsPlaintes()` (`sketch.js:701`, `game.js:1613`), une horloge qui ne compte que le
  temps de jeu actif (`immersion.js:265`).
- `millis()` compte aussi le chargement, le menu, l'intro et les pauses : l'écart dépasse presque
  toujours les 15 s du seuil (`game.js:175`, `game.js:1644`).
- **Vérifié en jeu** : après 20 s passées au menu, quatre plaintes répondues 0,8 à 0,9 s après leur
  apparition sont toutes revenues `tardive: true`.
- Effet : −3 de réputation sur chaque réponse, y compris la bonne. La mécanique « répondre vite » du
  prompt 79 n'existe donc pas pour le joueur.
- **Correction** : passer `tempsPlaintes()` à la place de `millis()` dans `os.js:284`, et ajouter un test
  qui répond à une plainte dans le délai.

### 2. La bonne réponse est toujours visible — priorité 1

- Le trio contient toujours la meilleure réponse selon l'évaluation, une autre réponse et le clash
  (`panneau.js`, `reponsesDialogue`).
- Sous chaque réplique, la tendance ▲▼ des trois jauges est affichée (`panneau.js:230`, `panneau.js:281`).
  Le clash se reconnaît donc à sa flèche de réputation, alors que les prompts 196 et 197 le voulaient
  indiscernable.
- Mesure : suivre la tendance donne 15 « bon » sur 15 et un score de 263 à 286.
- **Pistes** (à choisir, elles ne s'additionnent pas toutes) :
  - masquer la tendance par défaut et la faire payer en temps ou en consultation de source : c'est ce
    que l'enquête est censée apporter ;
  - proposer deux réponses défendables dont l'une sert la fluidité et l'autre la réputation, au lieu
    d'une bonne et d'une mauvaise ;
  - garder l'affichage actuel comme mode « découverte » de la semaine 1, et le retirer ensuite.

### 3. Les dossiers se répètent et le cœur du brief n'est pas joué — priorité 1

- 73 à 87 % des dossiers sont des événements de l'agenda classés « affluence » : le joueur revoit la
  même catégorie, donc les mêmes réponses, presque à chaque fois.
- Aucun dossier n'a de retard dans les trois semaines. La règle « retard ≥ 10 min », l'aggravation des
  retards et les catégories « retard » et « accident » ne sont jouables qu'en temps réel, mode verrouillé
  tant que l'histoire n'est pas terminée.
- Le rythme s'effondre en fin de semaine : les trois derniers jours ont 1 ou 2 dossiers.
- **Pistes** :
  - ouvrir le mode temps réel dès le début, au moins en mode exposition, puisque c'est lui qui montre
    les données vivantes ;
  - plafonner la part d'événements de l'agenda par semaine et resserrer la semaine sur 4 ou 5 jours
    pleins plutôt que 6 ou 7 jours dont trois presque vides ;
  - rejouer une semaine d'archive qui contient de vrais retards, s'il en existe dans les sources (à
    vérifier dans les archives avant de promettre quoi que ce soit : aucune donnée inventée).

### 4. Aucune tension dans le mode par défaut — priorité 2

- Hors défi chrono, l'horloge est à l'arrêt pendant la lecture d'un signalement et rien n'expire avant
  20 h. Le temps ne file (×100, `immersion.js:12`) que lorsqu'il n'y a rien à faire.
- La difficulté règle trois valeurs (`game.js:184`) : signalements actifs en même temps, vitesse
  d'aggravation des retards, budget de départ. Sans chrono et sans retard, seul le budget de départ
  (60, 50 ou 40) joue.
- **Pistes** : une pression douce qui ne punit pas la lecture (par exemple un dossier laissé en file
  qui s'aggrave d'un cran après un délai de jeu), ou rendre le défi chrono plus visible au menu.

### 5. Le clash : coût réel et sanction — priorité 2

- Dans la fenêtre de décision, le clash applique les effets de « attendre », puis −8 de réputation
  (`game.js:166`, `game.js:627`), puis −3 du commentaire automatique (`game.js:1446`) ; il est toujours
  évalué « raté ».
- Dans Community, il coûte −8, puis −3 de la réaction du plaignant (`game.js:1666`).
- L'aide et les fiches 196 et 197 n'annoncent que « −8 ».
- Mesure : cinq clashs de suite mettent la réputation à 0, ce qui déclenche le licenciement immédiat
  (« effondrement », `game.js:180`) dès le jour 1 ou 2, sans rappel à l'ordre préalable.
- **Pistes** : afficher le coût complet, ou faire passer le premier effondrement par le dernier
  avertissement du patron plutôt que par une fin de partie sèche. Le clash est conçu pour être tentant :
  la sanction devrait arriver après un avertissement lisible.

### 6. Se tromper tout le temps peut suffire — priorité 2

- En semaine facile, choisir systématiquement la mauvaise réplique (14 « ratés » sur 15) donne une fin
  « moyenne » avec 184 points, sans licenciement.
- Au hasard, la fin « moyenne » sort dans 47 à 72 % des parties.
- Le seuil de la fin moyenne (150, soit la valeur de départ des jauges à 10 points près) ne distingue
  donc pas un joueur attentif d'un joueur qui clique. **Piste** : relever ce seuil ou le faire dépendre
  du nombre de décisions « bonnes ».

### 7. Les jauges plafonnent — priorité 3

- En jouant bien, la réputation atteint 100 dans deux semaines sur trois et le budget dans la semaine
  facile ; la fluidité reste entre 83 et 86. Une fois au plafond, les gains suivants sont perdus et
  les objectifs du jour (seuils 40 à 50, `game.js:2039`) ne demandent plus rien.
- Les objectifs sont définis pour 5 jours alors que les semaines en comptent 6 ou 7 : le dernier se répète.
- **Piste** : des objectifs relatifs à la valeur du matin, ou des gains décroissants près du plafond.

### 8. Des choix sans conséquence — priorité 3

- Les réponses rapides aux mails du patron ne changent rien, ni jauge ni score : le code le dit lui-même
  (`repondreRapide`, `patron.js`, « cosmétique »).
- Les équipes : la police est pertinente pour tous les événements et toutes les perturbations
  (`game.js:1863`), donc pour 13 à 15 dossiers sur 15. Le choix de l'équipe n'en est pas un.
- **Pistes** : donner un effet léger aux réponses au patron (son ton du lendemain, par exemple), ou les
  retirer ; différencier les équipes par un coût ou un délai plutôt que par la seule pertinence.

### 9. Un texte de règle à vérifier

- Le message de rythme du matin annonce « affluence ×1,25 sur la réputation des dossiers concernés »
  (`i18n.js`, clé `rythme.agenda.v2` ; coefficient lu en `rythme.js:111`).
- Dans le code, ce coefficient (`coefContexte`, `game.js:156`) est appliqué aux lignes 613 et 1004, sur
  le chemin de l'ancienne table d'actions ; les réponses par catégorie utilisent un autre bonus
  (`bonusSituation`, `game.js:597`). Or tous les dossiers des archives ont une catégorie.
- **À confirmer** avant de corriger le texte : je n'ai pas tracé l'exécution complète de ces deux chemins.

### 10. Les tests ne protègent pas l'équilibrage — priorité 2

- La boucle principale de `test-jeu.mjs` joue encore les clés de l'ancienne table (`renfort`, `devier`,
  `retenir`, `rien`), pas les répliques par catégorie réellement proposées au joueur.
- Rien ne vérifie qu'un joueur au hasard ne gagne pas, que les jauges ne plafonnent pas, ni que le délai
  Community fonctionne — le bug du point 1 est passé entre les mailles.
- **Piste** : intégrer `simuler-equilibrage.mjs` à `npm test` avec quelques bornes (par exemple : le
  hasard ne donne jamais la bonne fin ; la mauvaise réplique systématique ne donne jamais mieux que la
  mauvaise fin).

## Relevé par l'exploration, non revérifié

À contrôler avant d'agir :

- **Sieste** : dormir jusqu'à 20 h ferait expirer les dossiers restants sans le malus de −5 appliqué
  quand on rate le réveil d'une alerte grave (`sieste.js:119`, `game.js:966`).
- **Café, micro, ralenti, multitâche, heure de pointe** : sans effet sur les jauges hors défi chrono.
- **Réponses dominées dans `data/reponses.json`** : « accident, en amont » aurait les mêmes effets
  qu'attendre ; « sécurité, calmer » ne coûterait rien et dominerait sa catégorie.
- **Contradiction de sources** : la bonne source serait toujours la même.
- **Message d'effectifs du patron** : il citerait l'effectif de base au lieu de celui du jour.
- **Démission** : possible seulement si les trois jauges sont sous 20 (`game.js:2238`), une fenêtre très
  étroite avant le licenciement.
- **Inspection et modificateurs** : n'apparaissent qu'au jour 3 et en semaine 3.

## Constats issus du nettoyage (prompt 199)

- Le badge « info parfaite » ne peut plus être obtenu, mais reste affiché, grisé, dans le profil.
- L'infobulle d'une appli verrouillée ne s'affiche jamais (`dessinerBulleVerrou` n'est pas appelée).
- Deux aides de lisibilité (« Trace dans le dossier », « Pression visible ») étaient proposées sans
  rien faire ; elles ont été retirées. Si le groupe les voulait, elles sont à réécrire.

## Documents de conception périmés

`jeu/01`, `03`, `04`, `17`, `82` et `93` décrivent encore l'ancienne table d'actions, la jauge
« Satisfaction », quatre réponses sans dominante, les cartes à glisser ou le briefing au choix. Ils sont
à marquer « historique » ou à mettre à jour, pour que la doc ne contredise pas le jeu le jour du rendu.

## Feuille de route proposée

| Ordre | Action | Taille |
|---|---|---|
| 1 | Corriger le délai Community (`os.js:284`) et le tester | une ligne et un test |
| 2 | Brancher la simulation d'équilibrage dans `npm test` avec des bornes | petit |
| 3 | Décider du sort de la tendance ▲▼ sous les répliques (point 2) | décision du groupe, puis petit |
| 4 | Annoncer le coût réel du clash et passer par un avertissement avant le licenciement | petit |
| 5 | Relever le seuil de la fin « moyenne » | une constante, à tester |
| 6 | Ouvrir le temps réel plus tôt, ou resserrer les semaines et limiter l'agenda | moyen, touche aux données |
| 7 | Donner un effet aux réponses au patron et différencier les équipes | moyen |
| 8 | Mettre à jour ou archiver les documents `jeu/` périmés | petit |
| 9 | Faire les tests humains du prompt 192 : sans eux, les points 3 à 7 restent des hypothèses | hors code |
