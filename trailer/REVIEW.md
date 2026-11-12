# REVIEW — trailer 30 s (prompt 187, remontage sur la capture du 12/11 au soir)

## Mesures
- `npx hyperframes check --json` : `ok: true`, 0 erreur. Avertissements gardés : `nested_media_start_basis_ambiguous`
  (temps des vidéos locaux à chaque scène, voulu), `console_warning` three.min.js (UMD r158, déprécié mais
  fonctionnel), `line_unread` sur le crédit musique (2,43 s à l'écran pour 2,85 s conseillées : carton inchangé, le
  crédit reste aussi dans `CREDITS.md`, la description VTT et la page). Info : `canvas_content_at_edge` (3D plein cadre).
- Livrable `site/public/captures/trailer.mp4` (ffprobe) : 30,000 s, 1920 × 1080, 30/1 i/s, H.264 yuv420p ~2,05 Mb/s,
  AAC 192 kb/s 48 kHz, faststart, **8,46 Mo**. Rendu local `hyperframes render --quality delivery` (39 s), ré-encodé
  crf 22.
- Son (ebur128 sur le livrable) : −13,3 LUFS intégrés, crête −1,1 dBFS. **Mesuré, pas écouté.**
- Part de la capture : 1,86–26,51 s = **24,65 s / 30 s = 82,2 %** (hors capture : accent 3D 1,86 s + carton 3,49 s).
- Cadence : au plus une coupe par temps (0,465 s → 2,15 coupes/s), aucun éclair (≤ 3/s), aucun plein écran rouge.
  Une seule coupe vers un plan clair (le rapport papier crème, tenu 0,92 s) : pas d'alternance clair/sombre.
  Contraste : blanc sur #D4031C = 5,3:1 ; blanc sur #0D0C0C = 19,6:1.

## Regardé (planches `snapshot` à 19 instants + 10 images du livrable)
- Lisible : bureau (3 s), carton JOUR 1/6 et messages de Camille (5–7 s), signalement Couëron (7,9 s), entrée dans
  le PC (9,5 s), dossier 1/16 à 1,65× (12,6 s), réponses (17 s), titre + journal (19 s), inspection (21,3 s),
  rafale du climax, rapport « Rapport — semaine 1 · À SURVEILLER · 237/300 » (25,5 s), carton final (29,75 s).
- Corrigé après la première planche : les deux plans du téléphone (cadrage hérité de l'ancienne capture, téléphone
  coupé au bord) → recadrés à 1,5× sur les bulles, 23,5 s et 26,5 s de la capture.

## Ce qui change par rapport à la première version
- **Capture refaite sur `main` à jour** (df0c686) : nouveau menu, inspection surprise, SMS météo de nuit, fin de
  journée avec XP, et **rapport de fin de semaine** (réserve principale de la 1ʳᵉ version levée). Le climax finit
  sur le rapport tamponné, et non plus sur l'écran de sieste.
- Preuve : le dernier plan (dossier ligne 1) cède la place à l'« Inspection surprise » (la décision revient).

## Plan le plus faible et ce qu'il faudrait refaire
- Le glisser de l'équipe (14,0–15,8 s du film) est toujours un geste lent passé ×2 : lisible, mais mou.
- Le jour 2 est sauté par le jeu (voir l'anomalie dans `DERUSHAGE.md`) : on ne voit pas de « JOUR 2/6 » ; le
  trailer montre « JOUR 3/6 », réel.

## Choix et écarts
- Storyline A (« sans arrêt ») ; B et C nommées dans `SPEC.md`.
- Capture par screencast CDP (JPEG q90 → FFmpeg H.264 crf 17) et non `recordVideo` (VP8 ~1 Mb/s, trop flou pour
  des punch-ins sur du texte) : pas de `partie-complete.webm`.
- Registre, `media-treatment` et SFX : inchangés depuis la première version (non appliqués, voir l'historique git).
- Les skills HyperFrames sont désactivés pour l'invocation par le modèle dans ce poste (`skillOverrides`) : remontage
  fait sur le projet existant, CLI épinglé 0.9.39 ; `hyperframes` signale 2 skills à mettre à jour
  (`npx hyperframes skills update`, côté utilisateur).
- Aperçu Studio non ouvert (exécution « sans arrêt »).
