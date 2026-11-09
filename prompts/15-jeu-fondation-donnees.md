# Prompt 15 — Jeu « Nantes en régulation » : fondation et données (étape 2/6)

Lire d'abord le prompt 14 (objectif, emplacement, sources de données réelles).
Cette étape crée la structure du livret et toutes les données locales du jeu ;
les écrans arrivent au prompt 16.

## Instructions
1. Créer, dans le dossier indiqué au prompt 14 (« Emplacement »), la structure du
   livret : `index.html`, `lib/p5.min.js`, `sketch.js`, `game.js`,
   `style.css`, `data/fallback.json`, `assets/`, `source-sheet`, `grammar`
   (deux fichiers JS, Q41 : `sketch.js` = boucle p5, `game.js` = logique du jeu).
2. **p5.js est copié en local** (`lib/p5.min.js`, version 1.11.11) : aucun CDN,
   sinon le jeu ne démarre pas sans réseau. Tous les chemins sont **relatifs**
   (`./sketch.js`, `./data/fallback.json`) : le jeu fonctionne aussi ouvert seul.
3. Créer `site/scripts/enregistrer-semaine.mjs` (Node, lancé à la main pendant la
   semaine, jamais au build) : interroge `trip-updates` et `alerts` à intervalle
   régulier (ex. toutes les 10 min), décode le protobuf **dans le script** (ex.
   `gtfs-realtime-bindings` en `devDependencies`), ne garde que les incidents
   (retard ≥ 10 min, alertes) et les écrit en JSON lisible dans
   `data/semaines/{date-debut}.json`. **Le jeu lui-même ne lit que du JSON**,
   jamais le protobuf. Si le groupe ne peut pas enregistrer 3 semaines avant le
   J3, les semaines proposées sont celles réellement enregistrées (au minimum
   celle du `fallback.json`) — aucun incident inventé.
4. Extraire les tracés des lignes du GTFS statique Naolib (archive ZIP, trop
   lourde pour le navigateur) par un script vers `data/lignes.json` : le jeu ne
   lit que ce JSON local (Q42).
5. Fallback : `data/fallback.json` = **6 incidents d'une vraie semaine
   enregistrée** (Q26), semaine rejouée identique à chaque fois — seed fixe (Q35).

## Vérifications
- `index.html` s'ouvre seul (double clic) sans erreur console et sans réseau.
- `lib/p5.min.js` existe localement (1.11.11) ; aucun lien CDN dans le code.
- `data/fallback.json` contient 6 incidents réels ; `data/lignes.json` contient
  les tracés extraits du GTFS statique.
- Aucune clé privée, token ou secret dans le code ou les scripts.
