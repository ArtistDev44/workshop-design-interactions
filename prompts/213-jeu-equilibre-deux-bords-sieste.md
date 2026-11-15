# Prompt 213 — Jeu : équilibre à deux bords, temps qui pèse et sieste qui compte

Origine : échanges du 14/11/2026. D'abord « des idées pour mieux gérer le temps et la mécanique de sieste ? ». Puis
une piste d'équilibre inspirée des jeux de gestion à jauges : une jauge trop haute est aussi dangereuse qu'une jauge
trop basse ; il faut parfois **saigner volontairement** un excès. On reprend **le principe, générique**. On ne
reprend ni les factions, ni les cartes à glisser, ni le ton d'un jeu existant.
Statut : **à exécuter**.

Le fil conducteur : **réguler, c'est tenir un système entre deux bornes, pas maximiser des scores.** Le temps coûte,
la fatigue fait perdre de l'information, et la sieste arbitre entre les deux.

## Constat (code de `main` au 14/11/2026)

**Équilibre**
- Trois jauges, de 0 à 100, départ à 50, score égal à leur somme (`jeu/04-jauges-et-fins.md`, Q40, Q44). Seul le
  bas est dangereux : rappel à l'ordre, dernier avertissement, puis licenciement, avec des seuils de sortie
  différents des seuils d'entrée (`Jeu.finJourneeStatut`, `game.js:1398` ; `REGLAGES.licenciement`).
- Audit 201, point 7 : en jouant bien, la réputation atteint 100 dans deux semaines sur trois. Une fois au plafond,
  les gains suivants sont perdus et les objectifs du jour (seuils 40 à 50) ne demandent plus rien.
- Audit 201, point 6 : au hasard, la fin moyenne sort dans 47 à 72 % des parties. Monter partout suffit.

**Temps et sieste**
- Hors défi chrono, **rien n'expire en journée** (`multitache.js:140`, prompt 87). Le temps ne pèse qu'à 20 h,
  quand les dossiers restants passent en « non traité ».
- Le temps file à ×100 dès qu'aucun incident n'est actif (`IMMERSION.compression`, `immersion.js:12`).
- La somnolence monte de 4,5 par heure de jeu, soit environ 54 sur une journée (`sieste.js:14`). Elle n'atteint 100
  que si le joueur reste inactif : la sieste forcée punit l'absence, ce n'est pas une décision.
- La sieste volontaire ne coûte rien hors défi chrono. C'est une avance ×100, et au réveil les équipes en route
  sont arrivées (`sieste.js:78`). Le café retire 30, une fois par jour (`cafe.js`) : la même chose que la sieste,
  en moins bien.

## Décisions à respecter

- **Prompt 87 : rien n'expire hors défi chrono.** La patience (étape 3) fait baisser une jauge peu à peu. Elle ne
  supprime aucun dossier.
- **Q44 (score = somme des jauges) reste vrai.** La zone d'excès agit par des **conséquences**, pas par un calcul de
  score différent.
- **Licenciement (prompt 84)** : on étend la même escalade, on n'ajoute pas de mort immédiate par excès.
- **Fins selon la posture (prompt 207)** : les nouveaux signaux s'ajoutent à `Jeu.signauxPosture()`. La table de
  priorité des fins ne change pas sans simulation.
- **Vérité sur la source** : la zone d'excès, la patience et la fatigue sont des **hypothèses du jeu**. Le cartel,
  l'aide et les crédits les présentent comme telles, jamais comme des données.

## Étapes (une étape = un commit ; `npm run build` et `npm test` verts à chaque fois)

### 0. Mesurer avant de toucher
Étendre `site/scripts/simuler-equilibrage.mjs` :
- compter, pour chaque stratégie (meilleure, autre, clash, hasard) et chaque semaine, le **temps passé au-dessus de
  85** pour chaque jauge, les gains perdus au plafond et la répartition des fins ;
- ajouter une stratégie « régulateur », qui choisit la réplique ramenant la jauge la plus excentrée vers 50.

Noter ces chiffres « avant » dans le rapport.

### 1. Zone d'excès sur le Budget et la Réputation (pas la Fluidité)
- `REGLAGES.exces = { budget: 85, reputation: 85 }`. **Valeurs de départ, à régler à l'étape 6.** La Fluidité garde
  un seul bord : aucune justification honnête à « trop fluide ».
- Conséquences, appliquées en fin de journée si la jauge est au-dessus du seuil :
  - **Budget au-dessus du seuil : « crédits non consommés ».** Le budget du lendemain matin est réduit (par exemple
    −15). Message du patron, catégorie Budget. C'est une logique réelle de l'administration publique, présentée
    comme une règle du jeu.
  - **Réputation au-dessus du seuil : « on attend des miracles ».** Le lendemain, les pertes de réputation sont
    multipliées (par exemple ×1,5). Une ligne dans le mail du matin le dit.
- Escalade (étendre `Jeu.finJourneeStatut`) : deux soirs de suite en excès sur la même jauge donnent un rappel à
  l'ordre, comme pour une jauge basse. Pas de licenciement par excès seul.
- **Saigner un excès** avec les gestes existants :
  - **Budget :** envoyer des équipes, ce qui coûte du budget.
  - **Réputation :** une réplique moins flatteuse. Le clash marche aussi, et il est déjà compté dans la posture
    (prompt 207) : laisser ce choix cynique visible dans « Ce qui a pesé ».

### 2. Lisibilité de l'équilibre
- **Bandeau :** au bout des jauges Budget et Réputation, la zone d'excès est **hachurée** (motif, pas seulement une
  couleur). Quand la jauge est dans cette zone, la barre passe à la couleur d'alerte et le libellé prend « ⚠ ».
  C'est le seul repère ajouté (le prompt 211 a retiré les autres). Contraste ≥ 4,5:1.
- **Tendances des répliques** (`tendance()`, `dessinerTendanceReponse`) : près de la zone d'excès, un « ▲ » sur la
  jauge concernée est dessiné à la couleur d'alerte. Le symbole ne change pas. Le lecteur d'écran dit « vers
  l'excès ».
- **Retour de décision** (`Jeu.evaluer`, `game.js:1085`) : une réplique qui fait sortir d'un excès n'est pas jugée
  « mauvaise » parce qu'elle fait baisser une jauge.
- **Consigne du matin, à partir du jour 2** : une phrase sur la règle (« Trop de budget non dépensé se perd »).
  Le guide et l'aide en disent autant, pas plus.

### 3. Le temps coûte : patience des usagers
- Un signalement arrivé et non traité fait perdre, par exemple, **−1 de réputation par 20 min de jeu d'attente**,
  plafonné à −5 par dossier. **Valeurs à régler.** Cela vaut aussi pendant l'avance ×100 et pendant la sieste.
- **Sur la carte :** un sablier sur le marqueur du signalement, qui se remplit. Il est figé si les animations sont
  réduites (prompt 69). Sans clignotement.
- **Journal :** une carte « Patience » par dossier concerné (heure d'arrivée, attente, perte), à côté des autres.
- Hors défi chrono uniquement. Le défi chrono garde son expiration.

### 4. La fatigue fait perdre de l'information
- Au-delà de **70** de somnolence, les tendances des répliques s'affichent « ? » (texte et annonce). Au-delà de
  **90**, une source de l'enquête de plus est masquée (« illisible, vous êtes trop fatigué·e »). **Seuils à
  régler.**
- Aucun flou, aucun flash, aucun texte qui bouge : de l'information **retirée et dite**.
- Montée de la somnolence : garder le temps de jeu ; ajouter une petite charge par dossier traité (par exemple
  +3), pour que la fatigue suive l'activité et pas seulement l'horloge. Le réglage existant « somnolence
  nécessaire » (prompt 91 § 5) reste en option.

### 5. La sieste devient un arbitrage
- Avec l'étape 3, dormir quand des dossiers attendent **coûte** (la patience baisse à ×100). Dormir quand la file
  est vide ne coûte rien. Aucune autre pénalité.
- Le bonus « équipes arrivées au réveil » (`sieste.js:78`) est retiré : il rendait la sieste meilleure que
  l'attente.
- Le bilan de la sieste ajoute la réputation perdue en patience pendant le sommeil.
- **Café** (`cafe.js`) : −30 tout de suite, puis **+40 deux heures de jeu plus tard** (le « contrecoup »), dit par
  une ligne dans le fil. Le choix entre café et sieste devient réel, en accord avec la fin « burn-out »
  (prompt 207).
- La sieste forcée par inactivité reste (utile en exposition quand le visiteur s'en va). Annonce renommée en
  « Vous vous êtes assoupi·e ».

### 6. Réglage par simulation, puis textes
- Relancer `simuler-equilibrage.mjs` et `scripts/profils-posture.js`. Viser :
  - la stratégie « hasard » n'obtient jamais la bonne fin ;
  - la fin moyenne au hasard passe sous 40 % ;
  - la stratégie « meilleure réplique » seule passe du temps en excès, donc elle ne garantit plus la bonne fin ;
  - la stratégie « régulateur » obtient la bonne fin ou la fin « fauteuil du patron » ;
  - chacune des dix fins du prompt 207 reste atteignable par au moins un profil.
- Ajouter à `npm test` (`test-jeu.mjs`) des contrôles qui verrouillent ces bornes, comme le proposait l'audit 201
  (point 10).
- Textes FR + EN par `t()` : consigne, mail du patron, retours de décision, aide, glossaire, annonces. Le contrôle
  des textes de `test-jeu.mjs` vérifie qu'aucun texte ne parle encore de « monter les jauges » comme seul but.

## Hors périmètre

- **Avancer au choix du joueur** (une touche « jusqu'au prochain signalement » au lieu de l'accélération
  automatique) et **heures de pointe** qui ralentissent le temps : à décider après ce prompt, selon le ressenti.
- La somnolence montrée dans le décor (bureau qui s'assombrit) au lieu d'une barre.
- Une zone d'excès pour la Fluidité.

## Vérification

- `npm run build`, `npm test` (avec les nouvelles bornes d'équilibrage).
- Audit des textes `?audit=textes&parcours=1` : 0 défaut en 1920 × 1080 et 1366 × 768 ; en 412 × 915, pas plus de
  défauts « T » que sur `main`.
- Une partie jouée au clavier, avec animations réduites, et le lecteur d'écran sur un dossier en zone d'excès et un
  dossier avec fatigue au-dessus de 70.
- Rapport `jeu/213-equilibre-deux-bords-sieste.md` : chiffres de simulation avant et après, seuils retenus et
  pourquoi, captures du bandeau en excès et d'une réplique en « ? ». Ressenti des joueurs : non renseigné.
