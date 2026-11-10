# Prompt 45 — Jeu « Nantes en régulation », étape 32 : météo progressive et SEO

Demandes d'origine (10/11/2026, reprises telles quelles) :

> Aussi, les transitions dans la météo doivent être progressives, pas subites

> Tu veilleras à changer l'OG Image, la description, le favicon et autres données SEO

## Attendu
1. **Météo progressive** par la baie vitrée : passage jour ↔ nuit, temps sec ↔ pluie
   (couleurs du ciel, soleil / lune, nuages, lumières de la ville, densité de la pluie)
   en fondu sur plusieurs secondes, plus jamais d'un coup ; les ambiances sonores suivent
   déjà en fondu (prompt 30). Animations réduites : changement direct.
2. **SEO** de la page du jeu (`site/public/index.html`) et de la page `/cartel/` :
   description, titre, URL canonique (`https://workshop-design-interactions.pages.dev/`),
   Open Graph et carte Twitter, image OG 1200×630 tirée du rendu réel du jeu, favicon
   (SVG, ICO, icône Apple) au pictogramme du jeu, couleur de thème, langue ; aucun service
   externe, aucun traceur.

## Vérifications
- `npm run build`, `npm test` ; captures d'une transition météo ; balises présentes dans
  `dist/`. Documenter dans `jeu/41-…`. Fusion `main`.
