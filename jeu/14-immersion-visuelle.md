# 14 — Finitions visuelles et mail enrichi (prompt 21)

Sans toucher aux décisions Q1–Q61. Fichiers : `site/public/bureau.js`, `sketch.js`, `game.js`, `immersion.js`.

## 1. Écran du PC centré + vignettage
- L'écran du PC est **centré** : `ECRAN_PC.x = (BW − 144) / 2`. Mesuré : centre de l'écran = milieu de la page à 1280, 1600 et 1920 px (écart 0 px). Pour garder un bureau lisible, la plaque « RÉGULATION » est centrée au-dessus du PC, l'horloge passe à droite de la plaque, la pile de dossiers est resserrée et le tampon encreur passe à droite de la souris.
- **Vignettage pixel art** (`dessinerVignettage`) : trames sombres `#2b1d18` sur une bande de 40 px logiques, de plus en plus denses vers les bords (pas 4 → 1 px, alpha ≈ 0,15 → 0,55), jamais sur l'écran du PC (+ marge) ni sur les livres. Statique, calculé une seule fois puis superposé (coût nul).

## 2. Clignement d'œil (bureau ↔ écran)
- S'asseoir : le zoom (inchangé, 700 ms) se termine yeux fermés (fermeture 150 ms), on se retrouve au poste et les yeux se rouvrent (200 ms).
- Se lever : fermeture 150 ms au poste, puis la caméra recule pendant la réouverture (200 ms).
- Paupières = deux bandes pixelisées (pas de 8 px) qui se rejoignent au milieu ; animations réduites : fondu au noir de 150 ms. Purement visuel : aucune entrée bloquée, aucun son ajouté.

## 3. Mail de fin de journée enrichi
- `Jeu.evenementsJournee` journalise chaque dossier traité : heure simulée (HH:MM), ligne, événement externe réel (nature, affluence, météo défavorable), retard, action, deltas réels, meilleure action.
- Format : `10:00 – Ligne 4 : retard mesuré + retard 12 min → Bus de renfort (bon choix !)` ; sans ligne citée : `Réseau : …`.
- Évaluation **calculée** : on compare l'effet attendu de chaque action sur ce dossier (table Q57–Q60, dé moyen, modificateurs Q24) ; « bon choix ! » si l'action choisie est la meilleure, « raté » (avec l'action qui était meilleure) sinon, « aucun détour » si aucune action n'aide, « trop tard » si le compteur a expiré.
- Journée parfaite : une seule ligne « Tout a été géré dans les temps, belle journée. ». Les jauges réelles de fin de journée sont toujours rappelées.

## À savoir (équilibre)
Avec la table des effets actuelle, **le bus de renfort est toujours la meilleure action** (+17 attendu contre −5 pour dévier et −11 à −15 pour retenir) : le mail dit donc « raté » à toute autre décision, et « aucun détour » n'apparaît jamais. C'est un choix d'équilibrage à revoir par le groupe (prompt 23, profondeur tactique).

## Mise à jour (prompt 59, check-up du 10/11/2026)
- `dessinerVignettage` a été remplacé par `masqueFlouEtVignette` (`bureau.js`, révision du prompt 25 : vignette et flou fixes sur les bords).
