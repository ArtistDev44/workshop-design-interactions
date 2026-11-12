# Prompt 194 — Jeu : clash violent et tentant, réaction de connard du plaignant, mots masqués hors alphabet

Demande d'origine (12/11/2026) : « On pourrait avoir 3 réponses, le tout mélangé et indiscernable.
Il faudrait qu'un des 3 choix clashe le plaignant assez violemment pour inciter le joueur à choisir
cette option indépendamment des conséquences. Aussi, les plaignants sont toujours gentils, rajouter
des commentaires de connard peut créer de la friction. Pour certains mots, tu pourrais utiliser des
caractères en dehors de l'alphabet &#( ! »

Sur la base des prompts 117–118 (trio de répliques mélangées dont un clash, plaignants parfois
agressifs dans `data/messages.json`).

## À faire

### 1. Trio mélangé et indiscernable (rappel du prompt 117, inchangé)

- Les 3 répliques restent mélangées (ordre déterministe par dossier, 6 permutations) et présentées à
  l'identique : **aucun** contour, icône, pastille ou couleur ne distingue le clash — seul son texte
  le révèle. Ne rien ajouter comme marqueur visuel.

### 2. Clash plus violent et tentant (`i18n.js`, `sketch.js`)

- Réécrire les 3 variantes `clash.<catégorie>.1..3` (FR + EN, 7 catégories : retard, travaux,
  affluence, meteo, accident, securite, autre) : plus cinglantes, plus cathartiques — toujours
  insolentes, **jamais haineuses ni menaçantes** ; chaque variante masque au moins un mot grossier
  avec des caractères hors alphabet (voir § 4). Garder les mêmes variables (`{auteur}`, `{retard}`,
  `{nom}`) aux mêmes endroits.
- Au moment de choisir le clash, le geste est récompensé à l'instant : dans `decider()` (sketch.js),
  si `dernierResultat.clash` → `feedback('large')` (secousse + hit-stop + son grave existants,
  juice.js) **à la place** du tier calculé des deltas — pour inciter à choisir le clash
  indépendamment des conséquences. Les conséquences, elles, ne changent pas : réputation −8
  (`REGLAGES.malusClash`), décision toujours comptée « ratée » (`Jeu.evaluer`), Journal inchangé.

### 3. Réaction de connard du plaignant (`i18n.js`, `game.js`)

- Nouvelles clés `reactionClash.<catégorie>.1..3` (FR + EN, 7 catégories, **sans aucune variable**) :
  après un clash, le plaignant — toujours gentil d'habitude — répond par un commentaire méchant,
  mots masqués hors alphabet, rien de haineux ni de menaçant.
- Affichage dans la narration de retour : `narr.avecClash` devient
  `« {texte} Le plaignant, d'habitude si gentil, répond : « {reaction} » »` (FR ; EN équivalent).
  Variante tirée de façon déterministe par dossier (même hachage que `repliqueDe`, panneau.js) via
  une nouvelle fonction `Jeu.reactionClash(d, index)` dans `game.js`, appelée là où
  `narr.avecClash` est appliqué.
- Lecteur d'écran : la narration de décision est annoncée avec `lireMasques(...)` (sketch.js), donc
  la réaction est lue « mot masqué » (voir § 4).

### 4. Masques hors alphabet (`panneau.js`)

- Jeu de masques utilisé dans les textes de § 2 et § 3 : `&#(`, `§¤`, `%¤`, `!§(`… (caractères en
  dehors de l'alphabet) à la place de certains mots.
- `lireMasques` (panneau.js) : élargir le regex aux caractères hors alphabet :
  `/[\wÀ-ÿ]*[@#$%&!?(§¤]{2,}[\wÀ-ÿ]*/g` — pour lire « mot masqué » à la place de `&#(`, `§¤`, etc.

### 5. Tests et docs

- `site/scripts/test-jeu.mjs` : nouveau bloc prompt 194 — clés `clash.*` et `reactionClash.*`
  présentes FR **et** EN pour les 7 catégories × 3 variantes ; aucun mot grossier en clair (même
  liste que le test 118) ; chaque texte contient au moins un masque hors alphabet ;
  `lireMasques('… &#( … §¤ …')` renvoie « mot masqué » sans symbole ; la narration d'un clash
  contient la réaction entre guillemets ; conséquences du clash inchangées (test 117 existant).
- `npm run build` puis `npm test` verts. Audit des textes (`?audit=textes`) à 0 défaut A–D sur les
  nouveaux textes FR/EN.
- Doc : `jeu/194-clash-violent-tentant-reaction-masquee.md` listée dans `jeu/README.md` ;
  ligne 194 dans `prompts/README.md`.

## Hors périmètre (ne pas faire)

- Ne pas modifier les règles Q1–Q61 ni les effets du clash (réputation −8, compté raté).
- Ne pas retirer la tendance des jauges sous chaque réplique (prompt 130) ni toucher à l'ordre
  mélangé (prompt 117).
- Ne pas toucher aux plaintes agressives de `data/messages.json` (prompt 118).
- Rien de haineux, menaçant ou discriminatoire dans aucun texte ; les mots grossiers restent masqués.
