# 48 — Animations de feedback : dossier, jauges, compteur (prompt 53)

Code : `feedback.js` ; appels dans `sketch.js` (jauges, compteur, carte), `enquete.js` (tampon),
`journee.js` (sablier), `confort.js` (tic-tac). `game.js` inchangé (`test-jeu.mjs` vert).

## Arrivée d'un dossier
- Le panneau glisse depuis la droite en **300 ms** (ease out ; 450 ms avant).
- Un tampon **« SIGNALEMENT »** s'imprime en haut à droite du dossier (léger angle, il « tombe » de 160 % à
  100 % en 350 ms et apparaît en fondu) ; il disparaît quand la carte révèle la ligne.
- La ligne concernée **pulse** sur la carte de l'appli Régulation (épaisseur et opacité, 1,2 Hz) tant que
  le dossier n'est pas traité — depuis le prompt 50, une fois la carte consultée. L'appli Carte avait déjà
  un repère d'incident qui pulse (prompt 21) : conservé. Légende « incident actif (pulse) ».
- Annonce `aria-live` : « Nouveau signalement : Perturbation signalée. Enquêtez (5 à 8) puis décidez. »
- Le son d'alerte par source (prompt 44) est conservé.

## Retour des jauges
- Les barres (fluidité, réputation, budget — le prompt cite encore « satisfaction », remplacée par le
  budget au prompt 22) glissent vers leur nouvelle valeur en **600 ms** (ease out) ; le nombre affiché est
  toujours la vraie valeur.
- Les **deltas réels** (+10, −11…) apparaissent sur la barre, montent un peu et s'effacent (1,6 s).
- Sous 20 (Q46) : **pulsation douce** en opacité (1 Hz) au lieu du clignotement sec.
- Annonce `aria-live` de la décision complétée par les variations : « … Fluidité +10, Réputation +2,
  Budget −11. »

## Urgence du compteur (sous 10 s)
- La barre passe au rouge et **pulse doucement** (1,5 Hz) ; au-delà de 10 s, rien ne change.
- Le **sablier** du bureau (prompt 51) s'emballe : le sable tombe de plus en plus vite jusqu'à 0.
- Le **tic-tac** (prompt 44) gagne en intensité (volume doublé à l'approche de 0, en plus de
  l'accélération du rythme).

## Accessibilité
- Pulsations ≤ 1,5 par seconde, amplitudes faibles, pas de flash ni de plein écran rouge.
- Animations réduites : dossier et tampon apparaissent directement, barres à leur valeur sans animation,
  deltas en texte fixe (3 s), barre rouge fixe sous 10 s, sablier figé, ligne d'incident fixe.

## Vérifications
- `npm run build`, `npm test` (107 + 136 contrôles).
- Chromium (normal et animations réduites), sans erreur console : arrivée annoncée, tampon visible,
  compteur à 6 s → urgence 0,45 (barre rouge), décision au clavier → deltas +10 / +4 / −11 lisibles sur
  les barres, budget à 12 → pulsation douce ; annonce de décision avec les variations.

## Prompt 96 : game feel
Les décisions, l'arrivée d'un dossier, le dépôt d'une carte et la sortie du bureau déclenchent maintenant des bundles par tier : secousse trauma², hit-stop, pops ease-out-back, flash de jauge pour les décisions moyennes et fortes. Le tampon et les deltas existants reçoivent un dépassement en ease-out-back. Détail dans `jeu/92-game-feel-juice.md`.
