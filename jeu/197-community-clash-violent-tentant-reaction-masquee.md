# Prompt 197 — Community : 3 réponses mélangées dont un clash violent et tentant, réaction de connard, masques hors alphabet

Date : 12/11/2026. Branche `jeu/197-community-clash-violent-tentant-reaction-masquee`.
Demande d'origine : « On pourrait avoir 3 réponses dans community (3 réponses qu'on pourrait donner),
le tout mélangé et indiscernable. Il faudrait qu'un des 3 choix clashe le plaignant assez violemment
pour inciter le joueur à choisir cette option indépendamment des conséquences. Aussi, les plaignants
sont toujours gentils, rajouter des commentaires de connard peut créer de la friction. Pour certains
mots, tu pourrais utiliser des caractères en dehors de l'alphabet &#( ! ».
Sur la base du prompt 196 (mêmes mécaniques dans le panneau de décision).

## Ce qui change

- **3 réponses par plainte** (`data/messages.json`, régénéré via `npm run messages`) : la réponse
  « bonne », une autre réponse, et une réponse `clash: true` (sans champ `texte`, effets réputation −8,
  `bonne: false`). La plainte `retard_20` cède sa 3ᵉ réponse non « bonne » pour faire place au clash.
- **Ordre mélangé et indiscernable** : `Jeu.ordreReponses(plainte)` (game.js) permute les 3 indices de
  façon déterministe (`hacher(graine|ordre|id|index)`, 6 permutations) ; `community.js` affiche les
  boutons dans cet ordre, sans aucun marqueur visuel du clash (ni contour, ni icône, ni couleur) ;
  `plainte.reponse` stocke l'index réel. Annonces clavier (Tab) via `Jeu.texteReponse` + `lireMasques`.
- **Texte du clash** : `Jeu.repliqueClashPlainte(plainte)` tire une variante `clash.<catégorie>.1..3`
  (prompt 196 — déjà cinglantes, mots grossiers masqués `&#(`, `§¤`) dont toutes les variables sont
  connues (`{auteur}`, `{retard}`, `{ligne}`, `{nom}`/`{nature}`), catégorie du dossier réel
  (`Jeu.categoriePlainte`). `Jeu.texteReponse(plainte, r)` est utilisé partout où une réponse est
  affichée (Community, corbeille, Journal, données du journal, annonces).
- **Clash tentant, conséquences inchangées** : dans `repondrePlainte` (os.js), choisir le clash
  déclenche `feedback('large')` (secousse + hit-stop + son grave) — le geste est récompensé à
  l'instant. Conséquences inchangées : effets du JSON (réputation −8), réponse toujours « mauvaise ».
- **Réaction de connard du plaignant** : après un clash, `Jeu.repondrePlainte` pousse un commentaire
  méchant (`Jeu.reactionClashPlainte`, variantes `reactionClash.*` du prompt 196, mots masqués) :
  commentaire public dans `Jeu.commentaires` (delta −3 appliqué, `nonLus.community++`), ou relance
  privée (`plainte.relances`) pour les messages privés. Le toast de retour l'affiche via
  `commu.reactionClash` (FR/EN) et l'annonce aria-live passe par `lireMasques` (« mot masqué »).

## Fichiers touchés

- `site/public/data/messages.json` (+ `messages.js` régénéré) : 3 réponses par plainte dont 1 clash,
  `_lisezMoi` à jour.
- `site/public/game.js` : validation `chargerMessages` (clash sans texte accepté, ≤ 1 clash),
  `variablesUtilisees` ignore le clash, `Jeu.categoriePlainte` / `Jeu.ordreReponses` /
  `Jeu.repliqueClashPlainte` / `Jeu.texteReponse` / `Jeu.reactionClashPlainte`, `Jeu.repondrePlainte`
  (index affiché → réel, `clash`/`reaction` renvoyés, commentaire de connard).
- `site/public/community.js` : boutons dans l'ordre mélangé, textes via `Jeu.texteReponse`.
- `site/public/os.js` : `feedback('large')` au clash, toast avec réaction, annonce `lireMasques` ;
  corbeille via `Jeu.texteReponse`.
- `site/public/sketch.js` : annonce Tab des réponses (ordre mélangé, `lireMasques`).
- `site/public/journal.js`, `journal-donnees.js` : texte de la réponse via `Jeu.texteReponse`.
- `site/public/i18n.js` : `commu.reactionClash` (FR/EN).
- `site/scripts/test-jeu.mjs` : validation JSON (3 réponses dont 1 bonne + 1 clash) ; bloc 197
  (structure, ordre mélangé déterministe ≥ 2 permutations, texte du clash masqué sans variable,
  `repondrePlainte` sur le clash : `clash: true`, `bonne: false`, réputation −8, réaction de connard
  avec masque, relance privée, `lireMasques`, aucune grossièreté en clair, clé FR/EN).

## Vérifications

- `npm run build` vert ; `npm test` : `test-jeu.mjs` vert (5788 contrôles) ; smoke : le prompt 197
  est listé (README + auteurs) — le prompt 164 (autre session, non enregistré) reste signalé, hors
  périmètre (déjà noté au prompt 196).
- Audit des textes (`?audit=textes`) à 0 défaut A–D sur les nouveaux textes : [À COMPLÉTER].
- Ressenti en vraie partie (tentation du clash dans Community, friction de la réaction) : [À COMPLÉTER].

## Hors périmètre

- Panneau de décision (prompts 117 / 196), règles Q1–Q61, plaintes agressives (118), `reponses.json`
  inchangés. Aucun marqueur visuel du clash. Rien de haineux ou menaçant ; mots grossiers toujours masqués.
