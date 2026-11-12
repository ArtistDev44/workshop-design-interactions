# Prompt 197 — Jeu Community : 3 réponses mélangées dont un clash violent et tentant, réaction de connard du plaignant, mots masqués hors alphabet

Demande d'origine (12/11/2026) : « On pourrait avoir 3 réponses dans community (3 réponses qu'on pourrait donner), le tout mélangé et indiscernable. Il faudrait qu'un des 3 choix clashe le plaignant assez violemment pour inciter le joueur à choisir cette option indépendamment des conséquences. Aussi, les plaignants sont toujours gentils, rajouter des commentaires de connard peut créer de la friction. Pour certains mots, tu pourrais utiliser des caractères en dehors de l'alphabet &#( ! »

Sur la base du prompt 196 (mêmes mécaniques, déjà en place dans le **panneau de décision** : trio mélangé
prompt 117, clash tentant `feedback('large')`, `reactionClash.*`, masques hors alphabet lus « mot masqué »
par `lireMasques`) — à porter cette fois dans l'appli **Community** (réponses aux plaintes,
`data/messages.json`, `community.js`).

## À faire

### 1. Trois réponses par plainte (`site/public/data/messages.json`, puis `npm run messages`)

- Chaque plainte passe à **exactement 3 réponses** : la réponse « bonne » existante, une autre réponse
  existante, et une nouvelle réponse **clash** : `{ "clash": true, "bonne": false, "effets": { "fluidite": 0, "reputation": -8, "budget": 0 } }`
  (réputation −8 = `REGLAGES.malusClash`, prompt 117 ; **pas de champ `texte`** : le texte du clash est tiré
  des clés `clash.<catégorie>.1..3` existantes, voir § 3). La plainte `retard_20` (déjà 3 réponses) perd sa
  troisième réponse non « bonne » pour faire place au clash.
- Mettre à jour `_lisezMoi` : documenter le champ `clash` (texte généré depuis `clash.*`, masqué hors alphabet).
- Régénérer `data/messages.js` (`npm run messages` dans `site/`, fait aussi par `prebuild`).

### 2. Ordre mélangé, déterministe et indiscernable (`game.js`, `community.js`, `sketch.js`)

- `Jeu.ordreReponses(plainte)` (game.js) : permutation des indices `[0..n-1]`, déterministe par
  `hacher(graine + '|ordre|' + plainte.id + '|' + plainte.index)` (6 permutations, comme `PERMUTATIONS_3`
  du panneau) — aucun marqueur visuel ne distingue le clash (pas de contour, pastille, icône ni couleur
  spéciale : seul le texte le révèle).
- `community.js` `blocPlainteSociale` : afficher les 3 boutons dans l'ordre `Jeu.ordreReponses(pl)` ;
  le clic et les touches 1-3 passent l'**index affiché**, et `Jeu.repondrePlainte` traduit via
  `ordreReponses` (`plainte.reponse` stocke l'index réel, comme aujourd'hui).
- `sketch.js` (Tab sur les réponses) : annoncer `Jeu.texteReponse(...)` de la réponse affichée, via
  `lireMasques`.

### 3. Texte du clash (`game.js`)

- `Jeu.categoriePlainte(plainte)` : `Jeu.categorie(Jeu.paquet[plainte.index]) || 'autre'` (mêmes 7
  catégories que le panneau).
- `Jeu.repliqueClashPlainte(plainte)` : variante tirée de façon déterministe parmi `clash.<cat>.1..3`
  (FR/EN, prompt 196 — textes déjà cinglants, mots grossiers masqués `&#(`, `§¤`…) dont toutes les
  variables sont connues pour la plainte (`{auteur}`, `{retard}`, `{ligne}`, `{nom}`/`{nature}`) ;
  repli `clash.autre.1`. Hachage : `hacher(graine + '|clashCommu|' + id + '|' + index)`.
- `Jeu.texteReponse(plainte, r)` : `r.clash ? Jeu.repliqueClashPlainte(plainte) : Jeu.texteMessage(r.texte, plainte.vars)`.
  L'utiliser partout où le texte d'une réponse est affiché : `community.js` (boutons + réponse publiée),
  `os.js` (corbeille), `journal.js`, `journal-donnees.js`, `sketch.js` (annonce Tab).

### 4. Clash tentant, conséquences inchangées (`os.js`, `game.js`)

- Dans `repondrePlainte` (os.js) : si la réponse choisie est un clash (`r.clash` renvoyé par
  `Jeu.repondrePlainte`), déclencher `feedback('large')` (secousse + hit-stop + son grave, juice.js) —
  le geste est récompensé à l'instant pour inciter à choisir le clash **indépendamment des conséquences**.
- Conséquences inchangées : effets du JSON appliqués (réputation −8), réponse toujours comptée
  « mauvaise » (`bonne: false`), le bilan Community et le Journal ne changent pas de comportement.

### 5. Réaction de connard du plaignant (`game.js`, `i18n.js`, `os.js`)

- `Jeu.reactionClashPlainte(plainte)` : variante `reactionClash.<cat>.1..3` (prompt 196, FR/EN, mots
  masqués hors alphabet) tirée de façon déterministe (même hachage que `Jeu.reactionClash`).
- Après un clash dans `Jeu.repondrePlainte` : le plaignant — toujours gentil d'habitude — répond par un
  commentaire méchant : plainte publique → push dans `Jeu.commentaires` (auteur = plaignant, delta
  `DELTA_REPUTATION.mauvais`, appliqué aux jauges, `Jeu.nonLus.community++`) ; plainte privée (`prive`) →
  relance dans `plainte.relances` (même delta). Le résultat renvoyé contient `clash: true` et `reaction`.
- Affichage du retour (os.js `repondrePlainte`) : le toast ajoute la réaction
  (`commu.reactionClash` FR/EN : « {auteur}, d’habitude si gentil, répond : « {reaction} » ») et
  l'annonce aria-live passe par `lireMasques` (réaction lue « mot masqué »).

### 6. Validation et tests (`game.js`, `site/scripts/test-jeu.mjs`)

- `Jeu.chargerMessages` (game.js) : accepter les réponses `clash: true` sans `texte` ; exiger exactement
  3 réponses dont une `bonne` et une `clash` ; `variablesUtilisees` ignore les réponses clash.
- `test-jeu.mjs` : mettre à jour la validation JSON (ligne ~873 : `reponses.length === 3`, une bonne,
  une clash, les non-clash ont `texte.en`) ; nouveau bloc **prompt 197** : chaque plainte a 3 réponses
  (1 bonne, 1 clash, effets réputation −8 du clash) ; `Jeu.ordreReponses` = permutation déterministe de
  [0,1,2], au moins 2 permutations distinctes sur une semaine ; `Jeu.texteReponse` du clash = texte avec
  au moins un masque hors alphabet, aucune variable `{...}` restante ; `Jeu.repondrePlainte` sur le clash
  renvoie `clash: true`, `bonne: false`, effets réputation −8, et pousse la réaction de connard
  (commentaire public avec masque, ou relance privée) ; `lireMasques` sur ce texte renvoie « mot masqué »
  sans symbole ; aucune grossièreté en clair (même liste que le test 118) ; clé `commu.reactionClash`
  FR + EN.
- `npm run build` puis `npm test` verts.

### 7. Docs

- `jeu/197-community-clash-violent-tentant-reaction-masquee.md` listé dans `jeu/README.md` ;
  ligne 197 dans `prompts/README.md` ; ligne en tête de `journal.md`.

## Hors périmètre (ne pas faire)

- Ne pas toucher au panneau de décision (prompts 117 / 196) ni aux règles Q1–Q61.
- Ne pas ajouter de marqueur visuel du clash dans Community (le trio reste indiscernable).
- Ne pas toucher aux plaintes agressives de `data/messages.json` (prompt 118) ni à `reponses.json`.
- Rien de haineux, menaçant ou discriminatoire ; les mots grossiers restent masqués hors alphabet.
