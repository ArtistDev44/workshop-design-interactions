# Audit 5 — Performance (PATRIMOINE.EXE · NTE001, commit f07351b)

Worktree audité : `/home/guillaume/ESD_Docs/design-interaction/wt-205`, lecture seule. Date : 13 nov. 2026.

**Avertissement sur les mesures** : elles viennent de Chromium headless-shell 1248 (playwright-core 1.65), **sans GPU** (SwiftShader, rendu logiciel), servi par `python3 -m http.server` (sans compression, sans latence). Elles sont **indicatives**. Les comparaisons A/B faites dans la même session sont fiables, les valeurs absolues de FPS beaucoup moins. Un vrai PC d'exposition avec GPU fera mieux, et un vrai téléphone de milieu de gamme se situera sans doute entre les deux profils mesurés.

Scripts (dossier de scratch) :
- `perf/mesure.js` : chargement, réseau, FPS, durée de `draw()`, heap, nœuds DOM, écouteurs. Usage : `node mesure.js desktop|mobile 180`.
- `perf/profil.js` : profil CPU de 10 s au poste, origines des mutations DOM.
- `perf/pile.js` : pile d'appel de l'insertion DOM faite à chaque image.
- `perf/ab-flou.js` : A/B avec et sans `filter: blur()`.
- Résultats bruts : `perf/desktop.json`, `perf/mobile.json`.

Profils mesurés : **desktop** 1366×768, DPR 1. **Mobile** 412×915, DPR 2,6, `isMobile`/`hasTouch`, CPU ×4 via `Emulation.setCPUThrottlingRate` (le jeu passe en mode portrait). Session longue : 180 s de partie avec une décision automatique toutes les 2 s et des mouvements de souris.

---

## 1. Chiffres clés

| Mesure | Desktop 1366×768 | Mobile 412×915, CPU ×4 |
|---|---|---|
| FCP | 248 ms | 688 ms |
| Premier `draw()`, écran de chargement masqué | 450 ms | 1 719 ms |
| Requêtes au 1er chargement (hors API externes) | 74 | 74 |
| Octets bruts au 1er chargement | 3,60 Mo, dont scripts 3,02 Mo et `messages.json` 0,50 Mo | idem |
| Transfert réel en ligne (brotli, Cloudflare, mesuré par curl) | **1,04 Mo** | idem |
| FPS au menu principal (moyen / min sur 1 s) | 23 / 22 (`draw` 2,7 ms) | 4,9 / 5 (`draw` 21 ms) |
| FPS en partie, vue bureau | 29 / 29 (`draw` 17,8 ms, p95 27 ms, max 78 ms) | 5,2 / 5 (`draw` 109 ms, p95 172 ms) |
| FPS en partie, au poste, 30 s | **15 / 14** (`draw` 21,9 ms, p95 29 ms) | **3 / 3** (`draw` 118 ms, p95 139 ms) |
| Heap JS utilisé : menu → partie → +180 s | 6,4 → 8,5 → 7,6 Mo | 6,1 → 7,8 → 7,3 Mo |
| Nœuds DOM : menu → +180 s | 352 → 395 | 353 → 396 |
| Écouteurs JS | 49 → 49 | 49 → 49 |
| Canvas dans le DOM | 8 → 9 | 9 → 10 |
| Précache du service worker | **216 fichiers, 34,6 Mo** | idem |

Appels p5 par image au poste : environ 31 `text`, 102 `textWidth`, 54 `textFont` et 0 `createGraphics`.

---

## 2. Constats

### P1 — Le service worker précache 34,6 Mo, dont environ 21 Mo inutiles au jeu, dès la première visite
- **Où** : `site/public/sw.js:12-235` (liste `ESSENTIELS`) et `site/scripts/generer-sw.mjs:13`. Seul `captures/trailer.mp4` est exclu. `installation.js:105-116` enregistre le SW dès `load`.
- **Mesure** : `sed -n '/^const ESSENTIELS/,/^];/p' site/public/sw.js | grep -oE '"\./[^"]*"'` puis somme des `stat -c%s` (script dans le rapport de session) → 216 entrées, 34 580 875 octets.
  - `audio/` : 13 fichiers, 26,5 Mo. **OGG (14,2 Mo) et MP3 (12,3 Mo) sont tous deux précachés**, alors que `confort.js:598-599` n'en lit qu'un (`canPlayType`).
  - `captures/` : 1,96 Mo, dont `demo.mp4` (1,2 Mo), qu'aucun script du jeu ne référence.
  - `presentation/` : 74 fichiers, 1,39 Mo (Slidev). `kit-presse/` : 0,66 Mo.
  - Outils de développement `audit-*.js` (44 Ko), chargés seulement avec `?audit=`.
  - Doublons `.json` des données `.js` : `lignes.json` 105 Ko, `reponses.json`, `lieux.json`, `loire.json`, `fallback.json`, `semaines/*.json`. Le jeu lit les `.js`, sauf `messages.json` (voir P3).
  - Fichiers `.md` (`grammar.md`, `source-sheet.md`, `README`, `CREDITS`).
- **Gravité** : **majeur** (mobile). **Effort** : S. **Preuve** : forte (code + somme des tailles). Le téléchargement réel en ligne n'a pas été mesuré.
- **Scénario** : un visiteur scanne le QR code de l'expo (`assets/qr-*.png`) en 4G. En arrière-plan et sans prévenir, le navigateur télécharge 34,6 Mo (`Promise.allSettled` sur 216 `fetch` en parallèle, `cache: 'reload'`). Ces requêtes concurrencent les appels Open Data et Open-Meteo du jeu pendant ses premières minutes et consomment le forfait du visiteur. La part inutile est d'environ 21 Mo. Comme `VERSION` est un hash du contenu, **chaque déploiement provoque un nouveau téléchargement complet** pour tout client déjà venu.
- **Piste** :
  1. Dans `generer-sw.mjs`, exclure `presentation/`, `kit-presse/`, `captures/`, `audit-*.js`, `*.md` et les `data/*.json` jumeaux (sauf `messages.json`).
  2. Ne précacher qu'un seul format audio : MP3, lu partout. Ou n'en précacher aucun et les mettre en cache à la première lecture : le SW gère déjà les requêtes Range depuis le cache, et la musique synthétisée sert de repli hors ligne (`confort.js:589-597`).
  3. Optionnel : un précache « essentiels » (environ 3,5 Mo) et un second lot différé, ou réservé au mode expo.

### P2 — Le rendu au poste plafonne à environ 15 FPS (desktop) et 3 FPS (mobile ×4), surtout à cause du flou de la pièce
- **Où** : `bureau.js:877` (`drawingContext.filter = 'blur(2px) brightness(0.85)'`, appliqué à chaque image sur une image de la pièce agrandie en 1920×1080). Autres coûts dans `composerVue()` (`bureau.js:849-902`) : copie pleine taille de l'écran (`copieHaute`, `bureau.js:857`) puis nouveau dessin à l'image suivante, et `dessinerPieceBureau()` qui efface et redessine toutes les couches 480×270 toutes les 66 ms (`bureau.js:159-172`, `:863`).
- **Mesures** :
  - `node perf/ab-flou.js desktop` → au poste, **16,4 FPS avec le flou, 43,7 FPS sans**, puis 18,9 FPS au retour du flou.
  - `node perf/ab-flou.js mobile` (paysage 915×412, ×4) → **3,4 FPS avec, 6,8 sans**.
  - Profil CPU de 10 s au poste (`perf/profil.js`) : `composerVue` représente 26 % du temps échantillonné, dont `drawImage` natif à 22,9 % en propre, contre 5,1 % pour `dessinerJeu`.
  - La durée de `draw()` ne baisse que de 4 ms sans le flou : le coût du filtre est payé au rastérisage, hors de `draw()`.
- **Gravité** : **majeur**. Le poste est l'écran où le joueur passe l'essentiel de la partie. **Effort** : S à M. **Preuve** : A/B reproductible. Les valeurs absolues sans GPU sont indicatives.
- **Scénario** : sur un portable d'exposition à GPU intégré ou sur un téléphone, les survols, glissers et animations du poste deviennent saccadés. Sur mobile, la session tourne à 3-5 images/s.
- **Piste** : flouter **une seule fois** la pièce basse définition (480×270) dans un canevas mis en cache, invalidé quand `dernierRenduBureau` change. `masqueFlouEtVignette` le fait déjà pour la vue bureau (`bureau.js:776-783`). On n'agrandit ensuite que l'image déjà floutée, sans `filter`. Au poste, la pièce est presque entièrement cachée par le moniteur : on peut aussi la recomposer à 4-8 Hz seulement.

### P3 — Les plaintes (`messages`) sont chargées et validées deux fois à chaque visite, le JSON sans cache HTTP
- **Où** : `index.html:140` charge `data/messages.js` (384 Ko, parsé de façon synchrone). Ensuite, `game.js:1523-1530` refait `fetch('./data/messages.json', { cache: 'no-store' })` (499 Ko) et relance `Jeu.chargerMessages`.
- **Mesure** : `perf/desktop.json` → `parType.Fetch = 501 514 octets`, c'est-à-dire `messages.json`, le seul fetch local (`perf/profil.js` → `fetches`).
- **Gravité** : mineur à majeur, selon le réseau. **Effort** : S. **Preuve** : forte.
- **Scénario** : environ 880 Ko bruts (environ 30 % du premier chargement) pour un seul contenu. Sans SW, `no-store` le retélécharge à chaque ouverture. Avec le SW, la stratégie « cache puis réseau » le refait quand même en arrière-plan.
- **Piste** : garder `messages.js` seul en production. Réserver le `fetch` du JSON brut au développement (`localhost` ou `?dev`), ou supprimer `cache: 'no-store'`.

### P4 — Aucun cache HTTP longue durée, et le SW revalide chaque fichier sur le réseau à chaque chargement
- **Où** : aucun fichier `_headers` (`find site -name _headers` → rien). En ligne, `curl -sI https://workshop-design-interactions.pages.dev/lib/p5.min.js` renvoie `cache-control: public, max-age=0, must-revalidate`. Même chose pour l'audio. Dans `sw.js:256-268`, le « cache d'abord » lance **toujours** aussi un `fetch` réseau pour mettre le cache à jour.
- **Gravité** : mineur. Cloudflare répond 304 et le brotli est actif (1,04 Mo transférés). **Effort** : S. **Preuve** : en-têtes en ligne et code.
- **Scénario** : à chaque ouverture du jeu, 70 requêtes réseau partent en arrière-plan, sans gain : les fichiers ne changent qu'avec une nouvelle `VERSION`.
- **Piste** : servir le cache sans revalider quand la `VERSION` correspond, puisque le hash invalide tout à chaque build. Ajouter un `_headers` avec `max-age` long sur `lib/`, `fonts/` et `audio/`, et `no-cache` sur `index.html`, `sw.js` et `version.js`.

### P5 — Boucle à 60 FPS permanente, même sur les écrans statiques, sans réduction quand rien ne bouge
- **Où** : aucun appel à `frameRate()` ni à `noLoop()` dans le code (`grep -n "frameRate(\|noLoop" site/public/*.js` → rien). `getTargetFrameRate()` vaut 60.
- **Mesure** : au menu principal, `draw` prend 2,7 ms en JS. Le canevas 1920×1080 est pourtant entièrement redessiné et recomposé à chaque image, et seules 23 images/s sortent en headless sans GPU : le coût est dans le rastérisage et la composition.
- **Gravité** : mineur sur PC secteur, majeur pour l'autonomie mobile (chauffe, batterie). **Effort** : M. **Preuve** : code ; la consommation n'est pas mesurée.
- **Piste** : `frameRate(30)` sur mobile et dans les menus et fenêtres statiques. Ou `noLoop()` et `redraw()` sur les événements dans les écrans sans animation, en gardant 60 FPS seulement pour les transitions.

### P6 — En portrait (mobile), chaque image coûte environ 4 Mpx : 1920×1080 dessinés, puis recomposés en 1080×1920
- **Où** : `portrait.js:11-28` (canevas 1080×1920) et `:269` (`registerMethod('post', composerPortrait)`). Le canevas p5 reste dessiné en `opacity: 0` (`style.css:183-190`).
- **Mesure** : mobile ×4 en portrait → menu 4,9 FPS (`draw` 21 ms, intervalle p95 229 ms), poste 3 FPS. Sur la même machine en paysage, le poste fait 3,4 FPS : le surcoût du portrait n'est pas isolé, il est noyé par P2. Non vérifié en détail.
- **Gravité** : mineur, à revoir après P2. **Effort** : L. **Preuve** : moyenne.
- **Piste** : sur mobile, dessiner l'image source à une définition réduite (par exemple 1280×720 avec `scale`). En tout cas, ne pas recomposer les régions inchangées.

### P7 — Une mesure de texte de p5 insère et retire un `<div>` dans `<body>` environ une fois par image (layout synchrone)
- **Où** : `text()` avec `textAlign(..., TOP)` (`ds.js:88`, `:126`, etc.) → `textAscent` → `p5.Renderer2D._updateTextMetrics`, qui ajoute puis retire un conteneur dans `document.body` et lit `offsetTop`.
- **Mesure** : `node perf/pile.js` → 53 insertions en 2 s, pile `textAscent < text` (`lib/p5.min.js`). Le MutationObserver compte environ 94 mutations/s au menu et 60/s au poste.
- **Gravité** : mineur, car le DOM est petit (environ 360 nœuds). **Effort** : S. **Preuve** : forte.
- **Piste** : mémoriser l'ascendante par couple (police, taille) dans `ds.js`, ou caler le texte en `BASELINE` avec un décalage calculé une fois.

### P8 — Le son continue quand l'onglet est caché ou l'appli en arrière-plan
- **Où** : seul `sauvegarde.js:550-552` écoute `visibilitychange`, et seulement pour sauvegarder. Il n'y a aucun `Son.ctx.suspend()` ni `Musique.audio.pause()`. En permanence tournent : 1 bruit, 2 oscillateurs et 1 filtre (`confort.js:143-172`), plus 4 bruits en boucle et 3 LFO dont le gain est à 0 quand les ambiances sont inactives (`confort.js:262-324`). S'y ajoutent `setInterval` à 100 ms (musique synthétisée, `:573`), 20 s et 40 s.
- **Gravité** : majeur sur Android (musique et ambiance continuent derrière une autre appli, batterie), mineur sur PC d'expo. **Effort** : S. **Preuve** : code, comportement non mesuré sur appareil.
- **Piste** : sur `visibilitychange` à `hidden`, appeler `Son.ctx.suspend()` et `Musique.audio.pause()`, puis reprendre sur `visible`. Arrêter (`stop()`) les couches d'ambiance à gain nul plutôt que de les laisser tourner.

### P9 — La police `latin-ext` est préchargée alors qu'elle n'est presque jamais utilisée
- **Où** : `index.html:24-28` précharge `jetbrains-mono-var-latin` et `-latin-ext`. Le `unicode-range` de `latin-ext` (`fonts.css`) ne couvre pas le français courant (é, à, ç, œ et les guillemets sont dans le sous-ensemble `latin`).
- **Mesure** : `Font = 55 978 octets` transférés, soit 40 404 + 15 196.
- **Gravité** : mineur. **Effort** : S. **Preuve** : moyenne ; l'usage réel de caractères `latin-ext` n'a pas été vérifié de façon exhaustive.
- **Piste** : ne précharger que `latin`.

### P10 — 66 scripts synchrones non bundlés en fin de `<body>`
- **Où** : `index.html:133-198`, 66 balises `<script>` sans `defer`/`async`. Plus gros fichiers : p5 1.11.11 minifié (1,06 Mo brut, 251 Ko gzip), `messages.js` 384 Ko, `i18n.js` 274 Ko (FR et EN chargés tous les deux), `game.js` 152 Ko.
- **Mesure** : desktop local → FCP 248 ms, premier `draw` 450 ms. Mobile ×4 → FCP 688 ms, premier `draw` 1 719 ms. En ligne, le premier chargement pèse 1,04 Mo en brotli. **Estimation, non mesurée** : environ 5 à 6 s en « Slow 4G » (1,6 Mb/s), auxquels s'ajoute la latence de 74 requêtes en HTTP/2.
- **Gravité** : mineur. Placés en fin de body, les scripts ne bloquent pas le premier rendu de l'écran de chargement, et p5 est bien minifié. **Effort** : M (concaténation au build). **Preuve** : forte.
- **Piste** : concaténer les scripts du jeu en un fichier au build (`generer-sw.mjs` existe déjà), sans changer de bundler. Charger l'anglais d'`i18n.js` à la demande.

---

## 3. Ce qui est sain

- **Aucune fuite mémoire détectée sur 3 min** : le heap JS reste entre 6 et 8,5 Mo (il redescend après le GC), les écouteurs sont stables à 49 et les nœuds DOM passent de 352 à 395 (+43, probablement les toasts et annonces ; non investigué). Il n'y a ni `Audio` ni `<audio>` accumulés : `document.querySelectorAll('audio')` vaut 0 et la musique utilise un seul `new Audio()` à la fois, arrêté en fondu (`confort.js:587-626`).
- **Aucun `createGraphics` par image** (0 appel mesuré par image). Les tampons hors écran sont mis en cache : `fondOS()` (`os.js:56-57`), photos de Community via `cachePhotos` (`community.js:51`, `:68`), couches de la pièce créées une fois (`bureau.js:161-165`).
- `pixelDensity(1)` partout (`sketch.js:101`, `bureau.js:39`) : un téléphone à DPR 2,6 n'est pas forcé de rendre en 5K. Les particules de pluie sont réduites de moitié sur mobile (`sketch.js:104`).
- Les appels réseau sont faits hors de `draw()` (`setInterval` ou `setup`, `bureau.js:361`, `immersion.js:82`) et tous les replis locaux existent.
- Brotli est actif sur Cloudflare (1,04 Mo transférés pour 3,6 Mo bruts). Les polices sont en WOFF2 variable, découpées en sous-ensembles, avec `font-display: swap`.
- La musique est en streaming (`Audio`), sans `decodeAudioData` de fichiers de 2 à 4 Mo, et le SW gère les requêtes Range depuis le cache (`sw.js:248-252`, `:274-290`).
- Aucune erreur JS pendant les deux sessions de 3 min.

## 4. Non vérifié

- FPS et consommation sur un vrai GPU (PC d'expo) et sur un vrai téléphone.
- Durée réelle du précache SW sur un réseau mobile.
- La fenêtre « fin de session » de la mesure (`draw` 45 ms sur desktop, 243 mutations DOM/s) correspond à un état de partie que le script n'a pas identifié : `[À COMPLÉTER]`.
- Surcoût propre au mode portrait (P6) hors effet du flou.

## 5. Priorités suggérées

1. P2 : flou mis en cache (S, gain mesuré ×2,7 en FPS au poste).
2. P1 : précache réduit (S, −21 Mo par visiteur et par déploiement).
3. P3 : un seul chargement des plaintes (S).
4. P8 : son suspendu quand la page est cachée (S).
5. P5 : cadence réduite sur mobile et dans les écrans statiques (M).
