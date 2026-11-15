# 213 — Équilibre à deux bords, temps qui pèse, sieste qui compte : rapport (14/11/2026)

Prompt : `prompts/213-jeu-equilibre-deux-bords-sieste.md`. Simulation : `node site/scripts/simuler-equilibrage.mjs`
(et `--avant` pour neutraliser les règles du prompt).

## Ce qui a changé

| Règle | Où | Valeur retenue |
|---|---|---|
| Zone d'excès, Budget et Réputation (pas la Fluidité) | `game.js`, `REGLAGES.exces` | à partir de **85** |
| Crédits non consommés, le soir | `Jeu.excesDuSoir` | budget **−15** |
| « On attend des miracles », le soir | `Jeu.excesDuSoir` | réputation **−10**, puis le lendemain chaque perte de réputation **×1,5** |
| Rappel à l'ordre | `Jeu.excesDuSoir` | **2 soirs de suite** sur la même jauge : message « reproche », compté dans les signaux de posture ; aucun licenciement |
| Évaluation | `Jeu.poidsBesoin` | jauge en excès : poids **−0,75** (la faire baisser est le bon choix) ; dans les 10 points sous le seuil : poids 0 |
| Bonus d'objectif du soir | `Jeu.finDeJourneeTactique` | s'il pousserait une jauge à l'approche de l'excès, il va à la Fluidité (+5) |
| Patience des usagers (hors défi chrono) | `Jeu.pertePatience`, `Jeu.decider` | après **20 min** de grâce, **−1** de réputation par **30 min** d'attente, **−4** au plus par dossier, compté à la décision |
| Fatigue par dossier | `sieste.js` | **+3** de somnolence par dossier décidé |
| La fatigue fait perdre de l'information | `panneau.js`, `enquete.js` | au-delà de **70** : tendances « ? » ; au-delà de **90** : la dernière source pas encore lue échappe |
| Sieste | `sieste.js` | bonus « équipes arrivées au réveil » retiré ; le bilan dit la patience perdue pendant le sommeil |
| Café | `cafe.js`, `sieste.js` | −30, puis **+40** deux heures de jeu plus tard (contrecoup, dit dans le fil) |
| Bonne fin, fauteuil du patron | `game.js`, `posture.js` | seuil **240 → 230** ; fauteuil : en plus, **60 %** de bonnes décisions au moins |

**Affichage**
- **Bandeau :** zone d'excès hachurée au bout des jauges Budget et Réputation. En excès, le libellé et la barre passent
  à la couleur d'alerte, et « ⚠ » s'affiche après la barre. L'infobulle explique la règle.
- **Répliques :** un « ▲ » qui mène dans la zone d'excès est dessiné à la couleur d'alerte. À l'arrivée d'un dossier,
  le lecteur d'écran entend maintenant les trois répliques et leurs tendances en mots (« Réputation monte (vers
  l'excès) »). C'est nouveau : jusqu'ici, il n'entendait aucune réplique.
- **Carte :** une barre d'attente verticale à droite du marqueur. Elle est blanche tant que rien n'est perdu, puis
  passe à la couleur d'alerte, sans clignotement. L'infobulle dit la perte (« usager qui attend : réputation −1 »).
  Le mot « sablier » est interdit par les tests depuis le retrait d'un ancien mécanisme : d'où « barre d'attente ».
- **Journal :** une carte « Patience » sous le dossier concerné. La narration de la décision le dit aussi.
- **Textes FR + EN :** consigne du matin (à partir du jour 2, plus l'avertissement le lendemain d'un excès de
  réputation), messages du patron, aide (règle du jeu, pas une donnée), guide, crédits (« zone d'excès, patience des
  usagers et fatigue : règles du jeu »), table des malus de l'aide (trois lignes et leurs icônes),
  `jeu/04-jauges-et-fins.md`.

Captures (1920 × 1080) dans `jeu/213-captures/` : carte avec le Budget en excès et la barre d'attente ; fiche avec des
flèches vers l'excès ; fiche avec une fatigue à 92 (tendances « ? »).

## Simulation : avant et après

Semaines archivées du 14/09, du 12/10 et du 02/11. Stratégies scriptées : réponse 10 min après l'arrivée. Hasard :
300 parties par semaine, délai de 0 à 90 min. Le chiffre « avant » est celui de `main` (seuil de bonne fin à 240).

| Mesure | Avant | Après |
|---|---|---|
| Meilleure réplique : fin et score (3 semaines) | fauteuil · 286 / 277 / 263 | fauteuil · 258 / 263 / 239 |
| Meilleure réplique : jauges finales (semaine du 14/09) | F 86 · R 100 · B 100 | F 95 · R 77 · B 86 |
| Meilleure réplique : décisions prises avec une jauge ≥ 85 (Budget / Réputation, 14/09) | 6 / 7 | 1 / 2 |
| Plafond 100 atteint par la meilleure réplique | Réputation dans 2 semaines sur 3, Budget dans 1 | Réputation et Budget jamais |
| Hasard : palier « moyen » | 58 % | **41 %** |
| Hasard : bonne fin (fauteuil ou diplomate) | 3 % | **2 %** |
| Hasard : licencié | 23 % | 30 % |
| Hasard : fin « virale » (4 clashs ou plus) | 57 % | 49 % |
| Dix fins atteintes par au moins un profil (`profils-posture.js`) | oui | oui |

## Écarts au prompt, et pourquoi

- **Réputation : −10 le soir, en plus du ×1,5.** Aucune réplique ne fait baisser la Réputation, sauf le clash. Avec
  le seul ×1,5, un bon joueur restait à 96–100 sans rien payer, puisqu'il ne perd presque rien.
- **Bonne fin à 230 au lieu de 240.** L'excès plafonne deux jauges vers 85, donc le score maximal atteignable
  baisse. À 240, la meilleure stratégie possible tombait à 239 dans une semaine sur trois.
- **Fauteuil : au moins 60 % de bonnes décisions.** Sans cette condition, le seuil à 230 rendait le fauteuil au
  hasard plus souvent qu'avant (4 %). À 70 %, le joueur « neutre » du prompt 207 tombait à 48 % sur une seule fin
  (limite 45 %) : on reste à 60 %.
- **Patience plus douce que prévu.** Au poste, le temps file à 1 minute de jeu par seconde. À −1 par 20 min sans
  délai de grâce, un joueur qui lit 40 s perdait déjà 2 points, et le hasard était licencié une fois sur deux. D'où
  20 min de grâce, puis −1 par 30 min, au plus −4.
- **Rappel à l'ordre pour excès** : un message « reproche » et un signal de posture, sans toucher au compteur
  d'avertissements du prompt 84. Le compteur mène au licenciement, que le prompt excluait pour l'excès seul.
- **Objectif « la meilleure réplique seule ne garantit plus la bonne fin » : non atteint, et c'est voulu.** La
  meilleure réplique tient maintenant compte de l'excès (c'est la stratégie « régulateur »). La stratégie qui monte
  partout (« maximiseur ») n'a que deux répliques hors clash pour choisir, et elle finit à 250 / 250 / 234 : toujours
  le fauteuil. L'écart entre bien réguler et tout faire monter passera par les équipes (dépenser un budget en excès),
  la sieste et le café, que la simulation ne joue pas.
- **Objectif « au hasard, jamais la bonne fin » : 2 % au lieu de 0.** `npm test` verrouille ≤ 5 %.
- **Objectif « fin moyenne au hasard sous 40 % » : 41 %.** `npm test` verrouille < 50 %.

## Tests ajoutés (`npm test`)

Bloc « Prompt 213 » de `test-jeu.mjs` :
- **règles :** poids de l'évaluation, soir en excès, rappel au 2e soir, ×1,5 le lendemain, patience (grâce, palier,
  plafond, rien en défi chrono) ;
- **sauvegarde :** l'excès est sauvegardé, et une ancienne sauvegarde se charge sans excès ;
- **bornes d'équilibrage :** la meilleure réplique mène au fauteuil chaque semaine ; au hasard, bonne fin ≤ 5 % et
  palier moyen < 50 % ;
- **textes :** clés FR + EN, aide, guide et crédits qui disent la règle.

Le test de la sieste du prompt 91 vérifie maintenant que les équipes n'arrivent plus au réveil. Les seuils 230 des
tests 163 et 207 sont mis à jour.

## Vérification

- `npm run build` ; `npm test` : smoke 658, test du jeu 6 970, test navigateur 14, tous réussis.
- Audit des textes `?audit=textes&parcours=1` (FR + EN) :
  - **0 défaut** en 1920 × 1080 et en 1366 × 768 ;
  - en 412 × 915 : 9 défauts « D » dans l'aide portrait, **les mêmes que sur `main`**, donc antérieurs à ce prompt.
- **Non vérifié :** une partie complète jouée au clavier, avec animations réduites et un vrai lecteur d'écran.
  non renseigné

## Limites

- **Mode portrait** (`portrait.js`) : hachures, « ⚠ » après la valeur et couleur d'alerte ajoutés le 14/11 (suite du
  prompt), vérifiés en 412 × 915.
- La perte de patience est **comptée à la décision**. Pendant l'attente, elle se voit sur la barre de la carte et
  dans l'infobulle, mais la jauge ne bouge pas avant la réponse.
- Le contrecoup du café n'est pas sauvegardé : après une reprise de partie, il ne tombe pas.
- Ressenti des joueurs : non renseigné.
