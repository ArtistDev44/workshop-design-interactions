# Prompt 146 — Jeu : appli Carte, remplacer le bouton « Recentrer » par un bouton carré blanc

Demande d'origine (12/11/2026) :

> Sur l'appli de carte, remplace le bouton noir avec le texte recentrer par un bouton blanc « carré ».

## À faire

- `site/public/carte-alertes.js`, `dessinerControlesCarte` (~ligne 347) : supprimer le bouton texte
  `dsBouton(z.x + z.l - 16 - lr, y, lr, 48, t('carte.recentrer'), recentrer, 'contour')` (fond sombre, largeur
  calculée sur `textWidth`) et le remplacer par un **bouton carré blanc 48×48**, au même endroit sous les
  boutons `+` / `−` : fond `DS.blanc`, pictogramme **carré** `□` centré en `DS.fond` (variante `secondaire` de
  `dsBouton` avec libellé `□`, ou dessin direct équivalent). L'action reste `recentrer()`.
- Le bouton garde son entrée dans `boutons` et `CARTE.controles`, la touche Origine (keyCode 36, ~ligne 709)
  reste active, et l'infobulle / annonce `carte.recentrer` s'affiche au survol (titre du bouton en `aria-label`).
- `site/public/i18n.js` : `carte.recentrer` reste (infobulle + annonce, FR/EN) ; aucun libellé texte dans le
  bouton lui-même.

## Vérifications

- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN).
- Capture 1920×1080 de la carte : trois boutons carrés blancs alignés en bas à droite (+, −, □) ; un clic sur
  □ recentre la carte (même effet que la touche Origine) ; survol → infobulle « Recentrer ».
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
