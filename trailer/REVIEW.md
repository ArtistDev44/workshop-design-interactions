# REVIEW — trailer 30 s (prompt 187)

## Mesures
- `npx hyperframes check --json` : `ok: true`, 0 erreur. Avertissements gardés : `nested_media_start_basis_ambiguous`
  (temps des vidéos locaux à chaque scène, voulu), `container_overflow` (punch-ins : la capture agrandie déborde
  exprès, `data-layout-allow-overflow`), `console_warning` three.min.js (UMD r158, déprécié mais fonctionnel).
  `line_unread` corrigés (source 3D tenue 1,7 s, crédit musique avancé : ≥ 2,5 s à l'écran).
- Livrable `site/public/captures/trailer.mp4` (ffprobe) : 30,000 s, 1920 × 1080, 30/1 i/s, H.264 yuv420p ~1,95 Mb/s,
  AAC 192 kb/s 48 kHz, faststart, 8,06 Mo. Rendu local `hyperframes render --quality delivery` (42 s), ré-encodé
  crf 22 pour le poids.
- Son (ebur128 sur le livrable) : −13,3 LUFS intégrés, crête −1,1 dBFS. **Mesuré, pas écouté.**
- Part de la capture : 1,86–26,51 s = **24,65 s / 30 s = 82,2 %** (hors capture : accent 3D 1,86 s + carton 3,49 s).
- Cadence des coupes : au plus une coupe par temps (0,465 s → 2,15 coupes/s), images de jeu sombres : aucun éclair
  (≤ 3/s), aucun plein écran rouge. Contraste : blanc sur #D4031C = 5,3:1 ; blanc sur #0D0C0C = 19,6:1 ; gris
  #C8C4C4 sur #0D0C0C = 12:1.

## Regardé (planches `snapshot` à 17 instants + 4 images du livrable)
- Lisible : 3D (lignes rouges/blanches), bureau, carton JOUR 1/6, dossier à 1,65×, répliques, jauges, carton final.
- Corrigé après la première planche : les titres masquaient le message du téléphone (6,0 s) et les répliques (17 s)
  → « Une vraie semaine » passé en haut à gauche, « Chaque dossier, un choix » limité au plan des jauges.

## Plan le plus faible et ce qu'il faudrait refaire
- **Pas de rapport de fin de semaine** : la capture principale s'est bloquée au soir du jour 1 (sieste à 20 h : la
  touche Q est ignorée pendant la sieste — corrigé dans `scripts/capture.mjs`), la seconde capture (`MODE=semaine`)
  a été arrêtée au jour 2 faute de temps. Le climax finit donc sur l'écran de sieste au lieu du tampon du rapport.
  À refaire : `MODE=semaine node scripts/capture.mjs <url> 600`, puis remplacer le dernier plan du climax
  (`scripts/scenes.py`, `climax`) par le rapport.
- Le glisser de l’équipe (13,96–15,82 s du film) est un geste lent passé ×2 : lisible mais mou.
- Pas de passage visible d'un jour au suivant dans le montage (le carton « JOUR 2/6 » existe dans la seconde capture,
  non conservée).

## Choix et écarts
- Storyline A imposée (« sans arrêt ») ; B et C nommées dans `SPEC.md`.
- Capture par screencast CDP (JPEG q90 → FFmpeg) au lieu de `recordVideo` : `recordVideo` encode en VP8 ~1 Mb/s,
  trop flou pour des punch-ins à 1,8× sur du texte ; pas de `partie-complete.webm` donc.
- Registre (`catalog --tag transition`) consulté : `grid-pixelate-wipe`, `camera-shake`, `whip-pan` correspondaient ;
  non installés faute de temps, remplacés par des tweens GSAP de quelques lignes (secousse 3 px, punch-in).
  Grain/scanlines sur la capture **non appliqués** (`media-treatment` non lancé) : la capture pixel art reste nette.
- Pas d'effets sonores : la piste porte les impacts ; aucun SFX à licence vérifiable ajouté.
- Aperçu Studio (`hyperframes preview`) non ouvert : exécution sans arrêt. Le projet s'édite dans l'application de
  bureau HyperFrames (`npm run dev` dans `trailer/`).
