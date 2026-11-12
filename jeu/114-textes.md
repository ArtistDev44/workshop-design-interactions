# Prompt 114 — textes qui se chevauchent : analyse et corrections

Date : 12/11/2026. Branche `jeu/110-111-textes-palette`.

## Analyse

- **Audit `?audit=textes&parcours=1`** en 1920 × 1080 et en 1366 × 768, FR et EN.
- **Ajouts à l'audit** (`audit-textes.js`) :
  - **catégorie F** : texte dessiné, puis recouvert par un panneau opaque non modal (`panneau`,
    `panneauDS`). Les fenêtres modales (aide, mail, menu, pause, fin, licenciement, SMS) recouvrent le
    fond exprès : elles sont exclues ;
  - **nouvelle étape** du parcours : signalement avec équipes engagées.

## Défauts trouvés et corrections

| Défaut | Où | Correction |
|---|---|---|
| F — « Recentrer » et les boutons de zoom sous la fenêtre du plaignant | carte, dossier ouvert à droite | `zoneLibreCarte()` : commandes, ligne d'état, zoom, légende des trajets, case « Lieu à préciser » et infobulles se placent dans la partie de la carte que la fenêtre ne couvre pas |
| Notifications posées sur la fenêtre du plaignant (vu à l'écran, hors audit) | carte | notifications dans la partie libre, sous le zoom |
| Indicateur « Partie sauvegardée » sous les notifications | carte | au-dessus des boutons de zoom ; masqué si la partie libre est étroite |
| B — sous-titre « date · dossier · sauvegardée à » coupé | menu principal, carte « Continuer » | carte de 104 → 116 px, interligne 22, deux lignes entières |
| B — extrait d'un message du téléphone coupé (EN) | téléphone | extrait limité à 3 lignes (96 caractères) ; le texte complet s'affiche à l'ouverture |
| B — notification à deux lignes coupée (EN) | notifications | carte de notification à 3 lignes d'extrait |

Aucune police n'est réduite sous la taille minimale, aucune règle ni donnée ne change.

## Résultat

- **Audit à 0 défaut A–F**, en FR et en EN :
  - 1920 × 1080 ;
  - 1366 × 768 ;
  - 1920 × 1080 avec la palette violette (prompt 115).
- `npm run build` vert ; `npm test` : 491 + 550 contrôles réussis.
- Rapport JSON brut : non enregistré (consulté dans la console) — [À COMPLÉTER] si le groupe le veut en
  fichier.
