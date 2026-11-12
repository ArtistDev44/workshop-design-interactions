# Prompt 194 — Clash violent et tentant, réaction de connard du plaignant, masques hors alphabet

Date : 12/11/2026. Branche `jeu/194-clash-violent-tentant-reaction-masquee`.
Demande d'origine : « 3 réponses, le tout mélangé et indiscernable ; un des 3 choix clashe le
plaignant assez violemment pour inciter le joueur à choisir cette option indépendamment des
conséquences ; les plaignants sont toujours gentils, rajouter des commentaires de connard peut
créer de la friction ; pour certains mots, utiliser des caractères en dehors de l'alphabet &#( ».
Sur la base des prompts 117–118.

## Ce qui change

- **Trio inchangé (prompt 117)** : 3 répliques mélangées de façon déterministe, présentées à
  l'identique — aucun marqueur visuel ne distingue le clash, seul son texte le révèle.
- **Clash plus violent et tentant** :
  - Les 3 variantes `clash.<catégorie>.1..3` (FR + EN, 7 catégories) sont réécrites plus cinglantes,
    toujours insolentes et jamais haineuses ; chaque variante masque au moins un mot avec des
    caractères hors alphabet (`&#(`, `§¤`, `%¤`).
  - Dans `decider()` (sketch.js), choisir le clash déclenche `feedback('large')` (secousse + hit-stop
    + son grave, juice.js) à la place du tier des deltas : le geste est récompensé à l'instant, ce qui
    incite à choisir le clash **indépendamment des conséquences** — qui, elles, ne changent pas :
    réputation −8 (`REGLAGES.malusClash`), décision toujours comptée « ratée ».
- **Réaction de connard du plaignant** : nouvelles clés `reactionClash.<catégorie>.1..3` (FR + EN,
  sans variable). Après un clash, le plaignant — toujours gentil d'habitude — répond par un
  commentaire méchant (mots masqués), affiché dans la narration de retour via `narr.avecClash`
  (« … répond : « {reaction} » ») ; variante tirée de façon déterministe par
  `Jeu.reactionClash(d, index)` (game.js). L'annonce du lecteur d'écran passe par `lireMasques` :
  la réaction est lue « mot masqué ».
- **Masques hors alphabet** : `lireMasques` (panneau.js) couvre désormais tout mot contenant 2
  caractères parmi `@#$%&!?(§¤` (regex élargi), lu « mot masqué » à la synthèse vocale.

## Fichiers touchés

- `site/public/i18n.js` : `clash.*` réécrites (FR/EN), `reactionClash.*` ajoutées (FR/EN),
  `narr.avecClash` avec `{reaction}` (FR/EN).
- `site/public/game.js` : `Jeu.reactionClash(d, index)` ; `narr.avecClash` reçoit la réaction.
- `site/public/sketch.js` : `decider()` → `feedback('large')` si clash ; annonce de la narration avec
  `lireMasques`.
- `site/public/panneau.js` : `lireMasques` élargi aux caractères hors alphabet.
- `site/scripts/test-jeu.mjs` : bloc 194 (clés FR/EN présentes, aucun mot en clair, au moins un masque
  hors alphabet par texte, `lireMasques` couvre `&#(`/`§¤`, narration du clash avec réaction, malus
  réputation ≤ −8 inchangé).

## Vérifications

- `npm run build` vert ; `npm test` : smoke + `test-jeu.mjs` (blocs 116–119 et 194 verts).
  - Note : le smoke signale encore le prompt 164 (fichier posé par une autre session, non enregistré
    dans `prompts/README.md` / `auteurs.json`) — hors périmètre de ce prompt.
- Audit des textes (`?audit=textes`) à 0 défaut A–D sur les nouveaux textes FR/EN : [À COMPLÉTER].
- Ressenti en vraie partie (tentation du clash, friction de la réaction) : [À COMPLÉTER].

## Hors périmètre

- Règles Q1–Q61 et effets du clash inchangés (réputation −8, « raté »).
- Tendance des jauges sous chaque réplique (prompt 130) et ordre mélangé (prompt 117) inchangés.
- Plaintes agressives de `data/messages.json` (prompt 118) inchangées.
