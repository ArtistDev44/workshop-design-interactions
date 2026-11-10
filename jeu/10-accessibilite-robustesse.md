# 10 — Accessibilité et robustesse du jeu

## Accessibilité
- [x] Contraste suffisant pour les jauges, alertes et textes de médiation.
- [x] Pas de flashs rapides ni d'effets stroboscopiques (compteur de temps inclus).
- [x] `prefers-reduced-motion` respecté : animations réduites ou désactivées.
- [x] Jouable au clavier seul (voir `08-raccourcis.md`) et au tactile.
- [x] Version fonctionnelle sans audio.
- [x] Le joueur comprend les règles sans longue explication orale (écran d'aide `H`).

## Robustesse (checklist du livret)
- [x] Le jeu se relance après un refresh.
- [x] Le jeu affiche quelque chose (et reste jouable) sans API — fallback testé.
- [x] Chemins relatifs pour les assets et `data/fallback.json`.
- [x] Aucune clé privée, token ou secret dans le code.
- [x] Reset disponible (`R`).
- [x] Testé en plein écran 1920×1080, `pixelDensity(1)`.
- [x] Aucune erreur continue dans la console.
- [x] `randomSeed` / `noiseSeed` fixés pour archiver une version reproductible.

Vérifié le 10/11/2026 (prompt 19) : parties complètes en semaine d'archive, en direct et hors ligne ;
1920×1080 ; clavier seul et touch simulé ; pause, reset, aide ; réglages « animations réduites » et
« contraste renforcé » ; clignotements à 1–1,4 Hz (sous le seuil stroboscopique de 3 Hz) ;
`pixelDensity(1)`, `randomSeed` et dés à graine fixe (partie hors ligne rejouée : même score).
Reste à faire par l'équipe : écouter le son, tester sur l'écran tactile et la machine d'exposition.

## Mise à jour (prompt 59, check-up du 10/11/2026)
- `noiseSeed` n'est plus appelé : le décor n'utilise plus `noise()` ; la graine fixe passe par `randomSeed` (fallback) et le générateur de `game.js` (`initialiserAlea`).
