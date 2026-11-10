# Prompt 15 — Jeu « Nantes en régulation » : fondation et données (étape 2/6)

Lire d'abord le prompt 14 (objectif, emplacement, sources de données réelles).
Cette étape crée la structure du livret et toutes les données locales du jeu ;
les écrans arrivent au prompt 16.

## Instructions
1. Créer, dans le dossier indiqué au prompt 14 (« Emplacement »), la structure du
   livret : `index.html`, `lib/p5.min.js`, `sketch.js`, `game.js`,
   `gtfsrt.js`, `style.css`, `data/fallback.json`, `data/semaines/`, `assets/`,
   `source-sheet`, `grammar`
   (deux fichiers JS, Q41 : `sketch.js` = boucle p5, `game.js` = logique du jeu).
2. **p5.js est copié en local** (`lib/p5.min.js`, version 1.11.11) : aucun CDN,
   sinon le jeu ne démarre pas sans réseau. Tous les chemins sont **relatifs**
   (`./sketch.js`, `./data/fallback.json`) : le jeu fonctionne aussi ouvert seul.
3. **Semaines rejouées (archives publiques, prompt 14 mode 1)** : créer
   `site/scripts/preparer-semaines.mjs` (Node, lancé à la main, jamais au build)
   qui, pour les 3 semaines retenues (Q14) :
   - lit le changelog daté dans la description du jeu GTFS Naolib (API catalogue
     Explore v2.1, champ `metas.default.description`) et garde les entrées de la
     semaine ;
   - ajoute les événements de l'agenda (`244400404_agenda-evenements-nantes-metropole_v2`,
     `where` sur les dates) ;
   - ajoute la météo horaire de l'archive Open-Meteo
     (`https://archive-api.open-meteo.com/v1/archive`, Nantes 47.2184, -1.5536) et
     en dérive les alertes météo (percentiles de la semaine, Q39) ;
   - écrit `data/semaines/{date-debut}.json` : une liste de dossiers
     `{ date, type, ligne | null, nature, source, texte_source }`. **Aucun retard en
     minutes n'est inventé** : `retard` n'existe que s'il est écrit dans la source.
   Proposer d'abord au groupe les semaines du changelog qui contiennent le plus
   d'entrées, et le laisser choisir les 3 (une par difficulté).
4. **Mode « aujourd'hui » (GTFS-RT, prompt 14 mode 2)** : créer `gtfsrt.js`, un
   décodeur protobuf minimal écrit à la main (aucune dépendance) qui lit dans
   `trip-updates` la ligne (`route_id`), l'arrêt et `delay` (secondes), et dans
   `alerts` le texte et les lignes concernées. Appel unique au lancement, délai
   maximal 8 s ; en cas d'échec → repli sur une semaine d'archive avec le message
   « mode hors ligne ». Tester le décodeur sur un vrai fichier téléchargé une fois
   (ne pas l'afficher dans la conversation : il pèse ≈ 1 Mo).
5. Extraire les tracés des lignes du GTFS statique Naolib (archive ZIP, trop
   lourde pour le navigateur) par un script vers `data/lignes.json` : le jeu ne
   lit que ce JSON local (Q42).
6. Fallback : `data/fallback.json` = **6 dossiers réels tirés d'une semaine
   d'archive** (Q26, `jeu/07-fallback-offline.md`), semaine rejouée identique à
   chaque fois — seed fixe (Q35). **Ouverture par double clic** : un navigateur
   bloque `fetch('./data/…json')` en `file://`. Écrire donc aussi les données hors
   ligne indispensables (`fallback`, `lignes`) en `data/fallback.js` et
   `data/lignes.js` (`window.PXE_FALLBACK = {…}`), chargés par `<script>` dans
   `index.html` ; les fichiers `.json` restent la source, régénérés par le même script.

## Vérifications
- `index.html` s'ouvre seul (double clic) sans erreur console et sans réseau.
- `lib/p5.min.js` existe localement (1.11.11) ; aucun lien CDN dans le code.
- `data/fallback.json` contient 6 dossiers réels issus des archives (chaque dossier
  cite sa source et sa date) ; `data/semaines/` contient les semaines préparées ;
  `data/lignes.json` contient les tracés extraits du GTFS statique.
- `gtfsrt.js` décode un vrai fichier `trip-updates` (nombre de retards ≥ 10 min
  affiché en console au test) ; si le flux échoue, le jeu bascule sur une semaine
  d'archive sans erreur.
- Aucune valeur de retard en minutes qui ne vienne pas d'une source.
- Aucune clé privée, token ou secret dans le code ou les scripts.
