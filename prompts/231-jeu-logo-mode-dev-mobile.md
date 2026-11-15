# Prompt 231 — Jeu : le logo du mode dev aussi sur mobile

Origine : demande du 15/11/2026 (« ajoute aussi le logo du mode dev sur mobile »). Statut : **exécuté le 15/11/2026**.

## Constat

Le logo PXE du menu principal (qui ouvre le mode développeur, prompt 230) n'était pas dessiné en mobile : la colonne
recomposée du menu commence à x 110 dans l'image et le logo (x 80 → 152) y serait apparu coupé (prompt 171).

## Fait

- `menu.js` : le logo est dessiné en mobile aussi, tiré à x 16 dans l'image (`xLogoMenu`), hors de la colonne ; sur
  ordinateur, inchangé (x 80). Sa zone de clic (88 × 76 px) suit.
- `portrait.js` : sur l'écran titre, région du logo recomposée en haut à gauche, agrandie ×2 comme la pile FR / EN.

## Vérifié

- `npm run build`, `npm test` (+2 contrôles ; contrôle du prompt 171 adapté).
- Chromium 412 × 915 et 915 × 412 (tactile) : logo en haut à gauche, zone de 67 × 58 px CSS ; un toucher ouvre le
  mode développeur ; plus de morceau de logo coupé dans la colonne.
- Audit : 0 défaut de texte, 0 cible sous 44 px CSS en 1920 × 1080, 412 × 915, 915 × 412.
