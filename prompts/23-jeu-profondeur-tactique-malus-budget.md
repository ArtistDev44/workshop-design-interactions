# Prompt 23 — Jeu « Nantes en régulation », étape 10 : profondeur tactique, malus et économie

Objectif : donner de la **profondeur tactique** au-delà des décisions verrouillées Q1–Q61,
sans les modifier : conseils contextuels, modificateurs de jeu (dont une erreur système sur
l'ordinateur), objectifs de journée qui se resserrent, système de malus formalisé, dialogues
liés au budget du joueur et fins personnalisées. S'appuie sur le bureau applicatif du
prompt 22 (jauges **Fluidité / Réputation / Budget**, apps patron / carte / community /
journal).

## 0. Point de départ : lire le code existant avant toute modification

Fichiers concernés : `site/public/oeuvres/pxe-nte001-g01-w01/` (`sketch.js`, `game.js`,
`bureau.js`, `confort.js`, `style.css`, `index.html`), plus une mise à jour de `jeu/` et
`journal.md`.

Repérer dans le code actuel :

- `game.js` : `Jeu.decider(action)` (ligne ~283) applique les deltas puis `Jeu.narrer()`
  (ligne ~342) produit le texte de résultat ; `borner()` (ligne ~273) clamp 0–100 ;
  `Jeu.jauges` = `{ fluidite, reputation, budget }` (prompt 22) ; `Jeu.evenementsJournee`
  (prompt 21) pour l'historique ; `Jeu.ton()` (ligne ~336).
- `sketch.js` : zone du dossier avec les 3 actions + « ne rien faire » et le bouton
  « Dossier suivant » (lignes ~780–805) — c'est là qu'afficher le conseil contextuel ;
  écran de fin (lignes ~806–880) avec `Jeu.bilan()` (ligne ~816) — c'est là qu'enrichir la
  fin personnalisée ; compteur de décision (ligne ~589) pour le modificateur « heure de
  pointe ».
- `bureau.js` : rendu du poste (`vue === 'poste'`) pour le glitch de l'erreur système.

Règle absolue : aucun conseil, malus ou dialogue ne cite de fait inventé. Tout s'appuie sur
les incidents, jauges et budget réels de la partie en cours.

## 1. Conseils contextuels (contre les « décisions trop simples »)

### 1.1 Fonction de conseil

- Ajouter dans `game.js` : `Jeu.conseil = function (dossier) ` qui retourne **une seule
  phrase courte** construite à partir de l'état courant :
  - si `dossier.retard >= 18` : « Ligne X à +Y min, la Réputation baisse déjà sur les
    réseaux. » (vérifier que la réputation a réellement baissé sur les derniers événements) ;
  - si une jauge est sous 30 : « Attention : [jauge] est à Z, une mauvaise décision peut
    la faire passer sous 20. » ;
  - si le dossier a une contradiction (Q24, `detecterContradiction`) : « Deux lignes sont en
    conflit : priorisez. » ;
  - sinon : « [météo/affluence du moment] : l'effet des actions est modifié. ».
- Le conseil ne recommande jamais une action précise : les 3 actions + « ne rien faire »
  restent toutes jouables.

### 1.2 Affichage

- Dans `sketch.js`, au-dessus des boutons d'action de la zone dossier (lignes ~780–805),
  afficher le conseil en italique/petit, couleur neutre (contraste ≥ 4,5:1), ex. préfixé
  « Conseil : ».
- Le même conseil est repris dans l'app Messages du patron quand une jauge est basse
  (déclencheur : jauge < 30).

## 2. Modificateurs de jeu

### 2.1 Structure

- Dans `game.js`, ajouter un tableau documenté :

  ```js
  const MODIFICATEURS = [
    { id: 'erreur_systeme', duree_s: 30, libelle: 'Erreur système sur l\'ordinateur' },
    { id: 'meteo_aggravee', duree_s: 60, libelle: 'Météo aggravée : effets ×1,5' },
    { id: 'heure_pointe', duree_s: 45, libelle: 'Heure de pointe : décisions 20 % plus courtes' },
    { id: 'panne_messagerie', duree_s: 60, libelle: 'Panne de la messagerie du patron' },
  ];
  ```

- En début de journée (et éventuellement une fois en milieu de semaine), tirer **un**
  modificateur au hasard (avec le même générateur déterministe `mulberry32` du prompt 17,
  pour rester rejouable), l'annoncer au joueur (bandeau + message patron si pertinent).
- État : `Jeu.modificateur = { id, fin: timestamp }` ; une fonction `Jeu.modificateurActif()`
  retourne l'id actif ou null.

### 2.2 Erreur système sur l'ordinateur (le modificateur demandé explicitement)

- Pendant 30 s simulées, quand `vue === 'poste'` : le rendu de la salle de contrôle subit un
  **glitch pixel art léger** — décalage horizontal aléatoire de quelques lignes de pixels
  (2–6 px, quelques lignes par frame), **maximum 3 changements par seconde** (pas de flash) ;
  couleur : conserver la palette, juste déplacer des bandes.
- Pendant la même durée, **une des 3 actions + « ne rien faire » est tirée au hasard et
  désactivée** (bouton grisé, non cliquable, tooltip « indisponible : erreur système »).
  Le choix de l'action désactivée est annoncé dans le message d'annonce du modificateur.
- `prefers-reduced-motion` : remplacer le glitch par une **icône d'erreur statique** dans un
  coin de l'écran + la même action désactivée ; la durée reste identique.
- Hors ligne et au bureau : le glitch ne s'applique qu'au poste ; au bureau, seul le message
  patron signale le modificateur.

### 2.3 Les autres modificateurs

- `meteo_aggravee` : multiplier par 1,5 les deltas de toutes les actions (comme le
  modificateur contextuel Q24, mais global et annoncé).
- `heure_pointe` : réduire de 20 % la durée du compteur de décision (ligne ~589 de
  `sketch.js`).
- `panne_messagerie` : l'app Messages du patron est grisée avec « messagerie indisponible ».

## 3. Objectifs de journée qui se resserrent

### 3.1 Structure

- Dans `game.js`, définir les objectifs des 5 jours de la semaine, avec des **seuils qui se
  resserrent** :

  ```js
  const OBJECTIFS = [
    { jour: 1, jauge: 'fluidite',   seuil: 40, libelle: 'Garder la fluidité ≥ 40' },
    { jour: 2, jauge: 'fluidite',   seuil: 45, libelle: 'Garder la fluidité ≥ 45' },
    { jour: 3, jauge: 'reputation', seuil: 45, libelle: 'Garder la réputation ≥ 45' },
    { jour: 4, jauge: 'reputation', seuil: 50, libelle: 'Garder la réputation ≥ 50' },
    { jour: 5, jauge: 'budget',     seuil: 30, libelle: 'Terminer avec un budget ≥ 30' },
  ];
  ```

  (ajuster les seuils après test, mais garder la progression montante jour après jour).
- L'objectif du jour est affiché dans le HUD de la journée (haut de l'écran de jeu) et rappelé
  par le patron en début de journée.
- À la fin de chaque journée (au moment du mail, prompt 20/21) : si `jauges[objectif.jauge]
  >= objectif.seuil` → **bonus** (budget +10 ou réputation +5, annoncé) ; sinon **malus**
  (section 4). Le résultat objectif est noté dans `Jeu.evenementsJournee` et repris dans le
  bilan de fin de semaine (Q54) : « Objectifs atteints : 3/5 ».

## 4. Système des malus

- Formaliser dans `game.js` une table unique, affichable dans l'écran d'aide (H) :

  | Malus | Condition réelle | Conséquence |
  |---|---|---|
  | Incident non traité | dossier expiré sans décision | −5 à −8 sur la jauge du dossier (Q60, inchangé) |
  | Sieste non interrompue | prompt 20, bouton « Se réveiller » raté | −5 sur la jauge de l'incident (inchangé) |
  | Objectif de journée raté | section 3 | −5 sur la jauge de l'objectif |
  | Équipe inutile | équipe envoyée sur un incident déjà résolu | coût du budget perdu, réputation −3 |
  | Budget négatif | budget < 0 en fin de journée | réputation −8 (dettes) |

- Toute application passe par `borner()` : une jauge ne descend jamais sous 0 ni ne monte
  au-dessus de 100. Les valeurs sont toujours les vraies conséquences calculées, jamais un
  chiffre au hasard.

## 5. Gestion du budget et dialogues liés au budget

### 5.1 Paliers et dialogues du patron

- Trois paliers de Budget, avec des **messages écrits une seule fois** dans l'app Messages
  du patron, déclenchés par les vraies valeurs :
  - **budget < 20** : « On ne peut plus envoyer d'équipes. Trouvez des solutions sans
    dépenser. » + à chaque tentative d'envoi bloquée, message explicite « Budget insuffisant
    (X/Y) » dans l'app Carte ;
  - **20 ≤ budget < 70** : messages neutres de suivi ;
  - **budget ≥ 70** : « On a de la marge, envoyez des équipes si besoin. » + déblocage des
    options coûteuses (ex. pompiers) grisées tant que budget < 70.
- L'envoi d'équipe (prompt 22) est **bloqué** si `budget < coût` : bouton grisé + message.

### 5.2 Le budget comme ressource visible

- La jauge Budget est visible en permanence (panneau des jauges, prompt 22) et son coût est
  rappelé avant chaque envoi d'équipe (pas de dépense surprise).

## 6. Fins personnalisées

- L'écran de fin de semaine (Q47–Q55, `sketch.js` lignes ~806–880) reste tel quel (3 fins +
  bilan Q54 inchangé), mais le panneau de bilan gagne un **bloc « Profil de la semaine »**
  calculé uniquement à partir des données réelles :
  - jauge la plus haute et la plus basse en fin de semaine ;
  - meilleure journée (celle où la somme des deltas positifs est maximale, d'après
    `Jeu.evenementsJournee`) ;
  - malus le plus fréquent (section 4) ;
  - budget final et équipes envoyées (total) ;
  - objectifs atteints (x/5, section 3).
- Exemple de ligne : « Semaine solide sur la fluidité (78), mais 3 incidents non traités. »

## 7. Vérifications détaillées

- `npm run build` dans `site/`.
- Conseil contextuel : visible avant chaque décision, change selon l'état réel (teste avec une
  jauge < 30 et avec un retard ≥ 18 min).
- Modificateurs : forcer chaque id (paramètre de test, remis ensuite) — glitch ≤ 3 flashs/s
  avec une action désactivée, météo ×1,5, compteur −20 %, messagerie grisée ; annonce visible ;
  `prefers-reduced-motion` → icône statique.
- Objectifs : jouer 5 jours, vérifier que les seuils montent et que bonus/malus s'appliquent
  avec les bonnes valeurs ; bilan « Objectifs atteints : x/5 » correct.
- Malus : déclencher chaque ligne du tableau et vérifier la conséquence chiffrée et le clamp
  0–100 ; aide H liste les malus.
- Budget : paliers <20 / 20–70 / ≥70 avec les bons messages patron ; envoi d'équipe bloqué
  sous le coût avec message explicite.
- Fin personnalisée : profil affiché avec les vraies valeurs de la semaine jouée.
- `prefers-reduced-motion`, clavier seul, hors ligne, 1920×1080, contraste ≥ 4,5:1, aucun
  flash > 3/s, aucun fichier image ajouté.
- Documenter dans `jeu/16-profondeur-tactique.md` + sommaire de `jeu/README.md`.
- Branche `jeu/prompt-23-profondeur-tactique`. À chaque push : entrée en tête de `journal.md`.
  Ne pas fusionner dans `main` sans demande.
