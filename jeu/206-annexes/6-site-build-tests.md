# Audit axe 6 — Site Astro, build, tests, outillage, hygiène du dépôt

Worktree audité : `/home/guillaume/ESD_Docs/design-interaction/wt-205` (origin/main, commit `f07351b`), 13/11/2026.
Environnement : Node v24.13.1 local ; `site/node_modules` = lien vers le dépôt principal (astro 7.4.7).
Après audit : arbre propre (`git status --short` vide), `site/dist` et `site/.astro` supprimés (absents au départ).

## Mesures

| Commande | Résultat | Durée | Fichiers suivis modifiés |
|---|---|---|---|
| `npm run build` (prebuild + astro) | OK, 0 avertissement, 2 pages Astro (`/cartel/`, `/making-of/`) | 1,7 s | **aucun** (Slidev absent → deck conservé ; `sw.js`/`version.js` régénérés à l'identique : `nte-regulation-991d150e3b`) |
| `npm test` | OK — smoke 645 contrôles, test-jeu 5 933 contrôles | 2,8 s | aucun |
| `construire-slides.mjs` avec Slidev installé (lien temporaire vers `slides/node_modules` du dépôt principal) | OK, 4 s | — | **96 chemins** sous `site/public/presentation/` (48 supprimés, 48 nouveaux noms hachés). Deux reconstructions successives sont identiques (sha1) : le deck versionné ne correspond pas à ce que produisent les sources actuelles. Restauré ensuite. |
| `simuler-equilibrage.mjs`, `mesure-repetition.mjs` | OK, sans écriture | < 1 min | aucun |
| `node --check` sur les 14 `scripts/*.mjs` | tous valides | — | — |
| Liens internes de `dist/` (155 href/src/poster/og vérifiés, script maison) | **0 lien cassé** | — | — |
| `npm audit --omit=dev` | 0 vulnérabilité | — | — |
| Node `22.23.4` (engines) | existe (publiée le 20/10/2026, index officiel nodejs.org) ; identique à `engines` d'astro 7.4.7 | — | — |

Sondes en ligne (URL canonique, sans données personnelles) : `/nexiste-pas-xyz` et `/data/nexiste-pas.json` → **200 text/html** (le jeu) ; `/cartel` → 308 ; en-têtes Cloudflare par défaut (`cache-control: max-age=0, must-revalidate`, `nosniff`, `referrer-policy`), pas de CSP.

---

## Constats

### 1. La production ne correspond à aucun commit : elle sert l'arbre de travail non commité du dépôt principal
- **Fichiers** : `site/public/version.js` (en ligne `nte-regulation-49fdacccde` vs `991d150e3b` sur main) ; `.github/workflows/deploy.yml:43-54`.
- **Gravité** : majeur · **Effort** : S (documenter / passer par l'intégration Git Cloudflare) · **Preuve** : forte (empreintes sha1).
- **Constat** : `game.js`, `sketch.js`, `os.js`, `community.js`, `i18n.js` servis en ligne ≠ origin/main (`f07351b`) et ≠ les 15 dernières versions commitées de `game.js` ; ils sont **identiques octet pour octet** à la copie de travail modifiée du dépôt principal (branche `204-jeu-corrections-audit-ux`, fichiers ` M` non commités), dont `version.js` vaut aussi `49fdacccde`. Le déploiement Cloudflare se fait donc à la main depuis un poste, hors git, hors `npm test`.
- **Scénario** : une session en cours déploie un état intermédiaire ; le jury ouvre l'URL canonique et joue un code que personne ne peut retrouver dans l'historique ; un retour arrière est impossible.
- **Piste** : brancher Cloudflare Pages sur `main` (racine `site`, `npm run build && npm test`, sortie `dist`) ou un script `deploy` qui refuse un arbre sale (`git diff --quiet`) et inscrit le commit dans `version.js`. Lever le `[À COMPLÉTER]` de `deploy.yml:6-8` et `site/README.md:111`.

### 2. Le workflow CI publie sur GitHub Pages (404) et ne lance pas les tests
- **Fichier** : `.github/workflows/deploy.yml:35-54`.
- **Gravité** : majeur · **Effort** : S · **Preuve** : lecture (exécution réelle des runs non vérifiée, `gh` absent).
- **Constat** : `upload-pages-artifact` + `deploy-pages` vers l'environnement `github-pages`, adresse historique en 404 ; aucune étape `npm test`. Aucune vérification automatique n'existe donc sur `main`.
- **Piste** : remplacer le job deploy par `npm test` (garde-fou CI) ou le supprimer ; le déploiement reste à Cloudflare.

### 3. Les tests passent avec un jeu qui ne démarre pas
- **Fichiers** : `site/scripts/smoke.mjs:36-38` (syntaxe seulement), `site/scripts/test-jeu.mjs:28` (liste des fichiers exécutés).
- **Gravité** : majeur · **Effort** : M (un test navigateur sans dépendance est impossible ; possible avec playwright-core en outil manuel, déjà utilisé par `og-image.mjs`) · **Preuve** : **mutation vérifiée**.
- **Constat** : sur une copie de `site/` (scratchpad), `function setup() { undefinedFn(); …` et `function draw() { throw new Error("mutation"); …` dans `sketch.js` → `smoke.mjs` : 440 contrôles réussis ; `test-jeu.mjs` : **5 933 contrôles réussis**. `sketch.js` (et menu.js, bureau.js, carte-alertes.js…) n'est jamais exécuté : seulement lu par regex ou en extraits (`test-jeu.mjs:2591`). Sur ~436 appels `.includes/.test/match` du fichier, une grande part vérifie le **texte source** (présence/absence de motifs) et non le comportement.
- **Angles morts** : erreurs console à l'exécution (setup/draw p5), rendu réel et tailles d'écran (mobile 412 px, 1366×768), service worker réel (install, hors ligne effectif, mise à jour), `fetch` des API et repli, clavier/focus réel, chargement dynamique des `audit-*.js`, pages Astro sans `dist/` (section 4 de smoke facultative : `npm test` sans build saute ces contrôles en silence, `smoke.mjs:148`).
- **Piste** : ajouter un `scripts/navigateur.mjs` manuel (playwright-core en cache npx, comme le mémo « audit-textes-headless ») qui charge `index.html` en 2 tailles, échoue sur toute `pageerror`/`console.error`, puis coupe le réseau et recharge ; le lancer avant chaque fusion. À défaut, un test vm qui exécute `sketch.js` avec des bouchons p5 et appelle `setup()` + quelques `draw()`.

### 4. Le build réécrit 96 fichiers suivis sur un poste où Slidev est installé
- **Fichiers** : `site/scripts/construire-slides.mjs:11-13`, `site/package.json:12` (prebuild).
- **Gravité** : majeur · **Effort** : S · **Preuve** : forte (reconstruction réelle, puis restauration).
- **Constat** : le build n'est déterministe que là où `slides/node_modules` manque (CI, worktree). Sur le poste principal (Slidev présent dans `slides/node_modules/.bin/slidev`), `npm run build` vide et reconstruit `site/public/presentation/` : 96 chemins changent (noms hachés), donc `sw.js`/`version.js` changent aussi. Le résultat est stable d'une exécution à l'autre : c'est le deck versionné qui est désynchronisé des sources `slides/` (cause exacte non vérifiée : sources modifiées au prompt 199 ou version de Slidev différente).
- **Scénario** : chaque « build puis test avant push » sur le poste principal produit un diff parasite de ~100 fichiers que l'on commite par erreur ou qui entre en conflit entre sessions parallèles (déjà observé : `sw.js`/`version.js` modifiés dans le dépôt principal).
- **Piste** : sortir la reconstruction du deck du `prebuild` (garder `build:slides` manuel), ou la rendre explicite (`SLIDES=1 npm run build`) ; recommiter un deck reconstruit une fois.
- Détail : ligne 12 dupliquée (`rmSync(sortie…)` deux fois, `construire-slides.mjs:11-12`).

### 5. Pas de `404.html` : Cloudflare sert le jeu (200) pour toute URL inconnue, y compris des JSON
- **Fichiers** : absence de `site/public/404.html` et de `src/pages/404.astro` ; `construire-slides.mjs:17` supprime même le 404 de Slidev.
- **Gravité** : mineur (majeur si un fichier de données manque un jour) · **Effort** : S · **Preuve** : forte (sondes en ligne).
- **Constat** : sans 404.html à la racine, Cloudflare Pages passe en mode SPA. `/data/nexiste-pas.json` → 200 `text/html`. Un `fetch(...).then(r => r.ok ? r.json() : null)` (ex. `site/public/game.js:1526`) recevrait du HTML et lèverait en `json()` (rattrapé ici par `.catch`, mais le diagnostic devient trompeur) ; liens externes mal tapés indexés comme doublons du jeu.
- **Piste** : ajouter `src/pages/404.astro` (lien vers `/`, `/cartel/`), l'exclure du précache.

### 6. Précache du service worker : ~34 Mo téléchargés en arrière-plan dès la première visite
- **Fichiers** : `site/scripts/generer-sw.mjs:13,29`, `site/public/sw.js:243`.
- **Gravité** : majeur (mobile, données mesurées) · **Effort** : S-M · **Preuve** : mesure `du` sur la liste (221 entrées, tout `public/` sauf `sw.js` et `trailer.mp4`).
- **Constat** : chaque morceau existe en **OGG et MP3** (6 morceaux × 2 ≈ 29 Mo d'audio), plus `captures/demo.mp4` (1,2 Mo), la présentation, le kit de presse, les outils `audit-*.js`, `grammar.md`, `source-sheet.md`, `data/fallback/`. Tout est installé à la première visite ; `Promise.allSettled` (`sw.js:243`) masque les échecs, donc un hors-ligne incomplet passe inaperçu.
- **Piste** : ne précacher qu'un format audio (choisi au runtime, ou cache à la demande), exclure `audit-*.js`, `kit-presse/`, `captures/`, `*.md` ; journaliser les entrées refusées.

### 7. `messages.json` (488 Ko) re-téléchargé sans cache à chaque chargement en ligne, en double de `messages.js`
- **Fichier** : `site/public/game.js:1524-1529`.
- **Gravité** : mineur · **Effort** : S · **Preuve** : lecture + tailles.
- **Constat** : `fetch('./data/messages.json', { cache: 'no-store' })` contourne cache HTTP et SW, alors que `messages.js` (376 Ko, même contenu) est déjà chargé ; les plaintes sont rechargées de façon asynchrone après le démarrage.
- **Piste** : réserver ce rechargement au développement (`location.hostname === 'localhost'`).

### 8. Documentation désynchronisée de la réalité
- **Gravité** : mineur · **Effort** : S · **Preuve** : lecture + comptages.
- `README.md:91` : « 181 prompts numérotés (01 à 196) » — réel : **189** fichiers `prompts/NN-*.md`, jusqu'au **203**.
- `site/README.md:21,46,87-88,90,82` : la grille de contrôle coche ✅ des points sur la page `/donnees/` retirée, « Assets via `import.meta.env.BASE_URL` » (plus utilisé), « 10 titres différents » (3 pages HTML Astro + jeu + kit).
- `site/src/pages/cartel.astro:3` : « Seule page Astro du site » — faux depuis `/making-of/`.
- `CLAUDE.md` et `README.md:106` décrivent `npm test` comme « smoke test » seul ; il lance aussi `test-jeu.mjs` (l'essentiel des contrôles).
- `site/AGENTS.md` : gabarit Astro générique en anglais (React/Vue/Tailwind, i18n), sans lien avec le projet ni renvoi à `CLAUDE.md`.
- `rendu/README.md` dit « copie figée… resynchronisée » mais `rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/` diffère de `site/public/` sur 14 fichiers (game.js, os.js, i18n.js, community.js, data/messages.*…, `version.js` = `b0fe80acfe`) : le livrable « prototype lançable » n'inclut pas les prompts 200-203. Aucun test ne vérifie cette synchro.

### 9. Fichiers lourds et doublons suivis par git
- **Gravité** : mineur · **Effort** : M · **Preuve** : `git ls-files | xargs du -k`.
- Total suivi ≈ **111 Mo**. `trailer/assets/clips/partie-complete.mp4` **28 Mo** (rush brut, alors que `trailer/.gitignore` exclut déjà `renders/` et `assets/raw/`) ; `site/public/captures/trailer.mp4` 8 Mo ; `rendu/` (31 Mo) duplique audio, p5 et captures de `site/public/` ; `design-system/pixel-design-system-community.pdf` 4,3 Mo. Chaque mise à jour de ces binaires alourdit l'historique.
- **Piste** : sortir le rush du dépôt (ou Git LFS), ne garder dans `rendu/` qu'une archive générée au moment du rendu.

### 10. Outillage : chemins personnels et scripts hors package.json
- `trailer/scripts/capture.mjs:19` : repli codé en dur sur `/home/guillaume/.npm/_npx/411d535eabdf86de/node_modules/playwright-core` (chemin personnel, casse ailleurs). Mineur, S.
- Scripts manuels non référencés dans `package.json` mais documentés dans leur en-tête et dans `jeu/`/`CONTRIBUTING.md` : `extraire-lignes` (réseau + `unzip`), `geocoder-lieux` (Nominatim), `preparer-semaines` (réseau), `snapshot` (réseau), `og-image` (playwright-core + Chrome, absents des dépendances, voulu), `generer-icones-lucide` (paquet `lucide-static` extrait à la main), `mesure-repetition`, `simuler-equilibrage`. Aucun n'est cassé à la syntaxe ; les deux scripts hors réseau tournent. `extraire-lignes` n'est cité nulle part hors de son propre fichier (orphelin documentaire). Mineur.
- `test-jeu.mjs` lit des fichiers hors de `public/` (`LICENSE`, `design-system/DESIGN.md`, `src/pages/cartel.astro`, `package.json`, `site/README.md` : lignes 805, 2453, 2459, 2605, 2638…) : un test de jeu qui échoue sur une modification de documentation. Mineur.
- Smoke, motif de secret `/api[_-]?key|bearer|password/` (`smoke.mjs:84`) : ne détecte ni `token`, ni `secret`, ni des formats de clé (`sk-`, `ghp_`). Mineur.

### 11. Pas de `_headers` (pas de CSP) — mineur
- Cloudflare applique ses en-têtes par défaut (vérifié) ; aucune CSP alors que le jeu n'appelle que quelques origines (data.nantesmetropole.fr, Open-Meteo, Hub'Eau…). Piste : `public/_headers` avec une CSP `connect-src` explicite (à tester, l'audio et p5 sont locaux). Effort S.

---

## Ce qui est sain
- Build rapide (1,7 s) et sans avertissement ; prebuild **déterministe** hors Slidev (`sw.js`/`version.js` identiques au commit, hash trié sur le contenu).
- Aucun lien interne cassé dans `dist/` (155 vérifiés) ; pas de collision de routes (`public/index.html` sert `/`, aucune `src/pages/index.astro`) ; `/cartel` → `/cartel/` en 308.
- Métadonnées complètes sur le jeu, `/cartel/`, `/making-of/` : `lang="fr"`, title, description, canonical, og:*, twitter:card, og:image absolue sur l'URL canonique.
- Schéma de contenu `content.config.ts` strict (id, cartel 80-120 mots, ≥ 3 paramètres, droits, fallback obligatoires) : le livret est vérifié au build.
- Une seule dépendance (`astro` 7.4.7), lockfile v3 cohérent, 0 vulnérabilité ; `engines` = celui d'astro ; Node 22.23.4 existe.
- Aucune référence vivante à `github.io` : toutes les occurrences sont des notes historiques explicites (prompts 02/08/13/33, `notes.md:52`, `site/README.md:7`, `README.md:106`).
- `.gitignore` corrects (`site/` : dist, .astro, node_modules, .env ; `slides/` ; `trailer/`) ; aucun fichier temporaire, `.env` ou `settings.local` suivi.
- `test-jeu.mjs` couvre bien la **logique** (game.js, i18n, sauvegarde/reprise, 3 semaines × 3 stratégies, traductions FR/EN, liste hors ligne de sw.js vs scripts d'index.html) et `smoke.mjs` vérifie la syntaxe de chacun des 66 scripts, le manifest, les polices et le précache de la présentation et du kit de presse.
