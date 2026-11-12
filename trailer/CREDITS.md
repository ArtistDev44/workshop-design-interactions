# Crédits du trailer (prompt 187)

## Musique

| Champ | Valeur |
|---|---|
| Titre | « Heroic Age » |
| Auteur | Kevin MacLeod |
| Page de la piste | https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100848 |
| Fichier téléchargé | https://incompetech.com/music/royalty-free/mp3-royaltyfree/Heroic%20Age.mp3 (MP3 320 kb/s, 97,46 s) |
| Licence | Creative Commons Attribution 4.0 International — http://creativecommons.org/licenses/by/4.0/ |
| Licence vérifiée | page de la piste lue le 2026-11-12 (bloc « Attribution Code ») ; métadonnées du catalogue `pieces.json` d'incompetech : 129 BPM, « Action, Bright, Driving, Epic » |
| Téléchargée le | 2026-11-12 |
| Utilisation | extrait de 30 s pris à 30,32 s de la piste (l'impact orchestral de 52,65 s tombe à 22,33 s du film), fondu d'entrée 0,25 s, fondu de sortie 1,6 s, normalisé à −14 LUFS / −1,5 dBTP → `assets/music.mp3` |

Crédit exact, tel que demandé par la page de la piste :

```
"Heroic Age" Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0 License
http://creativecommons.org/licenses/by/4.0/
```

La licence CC BY 4.0 permet de redistribuer le fichier : l'extrait `assets/music.mp3` peut être versionné ;
l'original reste dans `assets/raw/music/` (ignoré par git, retéléchargeable à l'adresse ci-dessus).

## Effets sonores

Aucun. La capture est muette (`<video muted>`) et le trailer n'utilise que la musique : la piste porte déjà ses
impacts (percussions) sur les coupes, et `sound.md` proscrit les tonalités synthétisées. Aucun son sans page de
licence consultée.

## Images

- Toutes les images du jeu viennent de la capture `assets/clips/partie-complete.mp4`, enregistrée le 2026-11-12 par
  `scripts/capture.mjs` sur le jeu servi en local (`site/public`, état de la branche à cette date), hors réseau
  (données de repli réelles de `site/public/data/fallback/`).
- Tracés des lignes de l'accent 3D : `site/public/data/lignes.json` — Open Data Nantes Métropole,
  jeu `244400404_transports_commun_naolib_nantes_metropole_gtfs`, Licence Ouverte (extrait le 2026-11-10).
- Logo bulle-pin : `site/public/favicon.svg` (projet).
- Police : JetBrains Mono — SIL Open Font License 1.1, © 2020 JetBrains s.r.o. (copiée de `site/public/fonts/`).
