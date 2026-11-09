# Prompt 13 — Jeu « Salle de contrôle Nantes » (œuvre p5.js)

## Objectif
Créer le jeu décrit dans `jeu/` : une salle de contrôle des transports nantais,
façon *Paper Please*, où le joueur rejoue une semaine réelle du réseau et tranche
des décisions de régulation à partir de données réelles (API Tanway/Lila Nantes
Métropole + Open-Meteo), avec fallback local obligatoire (`data/fallback.json`).

## Instructions
1. Créer la structure du livret : `index.html`, `sketch.js`, `game.js`,
   `style.css`, `data/fallback.json`, `assets/`, `source-sheet`, `grammar`
   (deux fichiers JS, Q41 : `sketch.js` = boucle p5, `game.js` = logique du jeu).
2. Écran d'accueil p5.js : titre, sélection de la semaine à rejouer (dans les
   limites de l'API, ou semaine de référence du fallback), bouton Jouer.
3. Écran de jeu en 1920×1080 : panneau gauche = carte/liste des lignes avec leur
   état (à l'heure / en retard / alerte) et météo du jour ; panneau droit =
   dossier courant (retard, affluence, raison, source contradictoire éventuelle),
   3 actions + « ne rien faire », compteur de temps, 3 jauges.
4. Boucle : incident réel (retard ≥ 10 min, ou alerte météo Open-Meteo) → choix
   du joueur → effets contextuels sur les jauges (fluidité, satisfaction,
   réputation) → courte narration ancrée dans les données → incident suivant.
   Environ 15 décisions par partie ; aucun événement inventé.
5. Si le compteur atteint 0 sans choix : appliquer « ne rien faire ».
6. Fallback : `data/fallback.json` contient 6 cas figés ; si l'API est
   injoignable, bascule automatique en mode hors ligne avec indicateur discret.
7. Raccourcis clavier complets (`1`/`2`/`3` actions, `0`/`Espace` ne rien faire,
   `Entrée` valider, `R` reset, `M` son, `H` aide) — jouable sans souris.
8. Respecter `prefers-reduced-motion`, contraste suffisant, aucun effet
   stroboscopique, `pixelDensity(1)`, `randomSeed` fixé pour la reproductibilité.

## Vérifications
- Le jeu se lance et reste jouable sans réseau (fallback testé).
- Testé en plein écran 1920×1080, aucune erreur continue dans la console.
- Aucune clé privée, token ou secret dans le code.
- Le mapping API → incident → action → jauges tient en une phrase (voir `jeu/02-donnees-api.md`).
