# 10 — Accessibilité et robustesse du jeu

## Accessibilité
- [ ] Contraste suffisant pour les jauges, alertes et textes de médiation.
- [ ] Pas de flashs rapides ni d'effets stroboscopiques (compteur de temps inclus).
- [ ] `prefers-reduced-motion` respecté : animations réduites ou désactivées.
- [ ] Jouable au clavier seul (voir `08-raccourcis.md`) et au tactile.
- [ ] Version fonctionnelle sans audio.
- [ ] Le joueur comprend les règles sans longue explication orale (écran d'aide `H`).

## Robustesse (checklist du livret)
- [ ] Le jeu se relance après un refresh.
- [ ] Le jeu affiche quelque chose (et reste jouable) sans API — fallback testé.
- [ ] Chemins relatifs pour les assets et `data/fallback.json`.
- [ ] Aucune clé privée, token ou secret dans le code.
- [ ] Reset disponible (`R`).
- [ ] Testé en plein écran 1920×1080, `pixelDensity(1)`.
- [ ] Aucune erreur continue dans la console.
- [ ] `randomSeed` / `noiseSeed` fixés pour archiver une version reproductible.
