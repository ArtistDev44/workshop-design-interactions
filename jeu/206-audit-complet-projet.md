# Prompt 206 — Audit ultra-complet du projet (8 axes en parallèle)

Date : 13/11/2026. Demande d'origine : « Avec différents sous-agents qui travaillent en simultané, fais un audit
ultra-complet sur l'ensemble du projet ».
Ce document ne modifie aucune règle, aucun écran ni aucun fichier du jeu. Il complète sans les répéter l'audit global
du 12/11 (`audit-2026-11-12.md`), le code mort (`jeu/200`), le gameplay (`jeu/201`) et l'UX (`jeu/203`).

## Méthode et niveau de preuve

- **8 auditeurs en parallèle**, un axe chacun, en lecture seule sur un worktree propre de `main` :
  1 robustesse du code · 2 données, API, hors ligne, PWA · 3 accessibilité · 4 sécurité et vie privée ·
  5 performance · 6 site Astro, build, tests, outillage · 7 brief, rendu, documentation, suivi des audits ·
  8 textes, i18n, design system.
- **Commit audité** : `f07351b` (après le prompt 203). `main` est passé à `cd7c1be` (prompt 204) pendant l'audit :
  **tous les constats bloquants et majeurs ci-dessous ont été revérifiés sur `cd7c1be`** (lecture `fichier:ligne`
  ou commande), et les numéros de ligne sont ceux de `cd7c1be` quand ils ont bougé.
- **Outils** : Chromium sans interface (playwright-core en cache npx) pour 3 semaines jouées par un bot, une partie
  « singe », des stockages corrompus, le réseau coupé, un déploiement simulé, le zoom, le clavier, les animations
  réduites, les contrastes relevés au pixel (2 804 couples) et les FPS ; `npm run build`, `npm test`, `npm audit` ;
  sondes de l'API Open Data avec `limit=1`. Les FPS viennent d'un Chromium **sans GPU** : ordres de grandeur.
- **Non fait** : aucun test avec un humain, aucun lecteur d'écran réel (NVDA, VoiceOver), aucun téléphone réel.
- **Rapports détaillés de chaque axe** : `jeu/206-annexes/1-robustesse.md` à `8-textes-i18n-ds.md` (écrits sur
  `f07351b` ; les chemins `wt-205` et `/tmp/…` qu'ils citent sont ceux de la session d'audit).

## Verdict

Le socle technique est sain : build en 1,7 s sans avertissement, `npm test` vert (645 + 5 933 contrôles), aucune
erreur de page sur 3 semaines jouées, aucune fuite mémoire sur 3 min, stockage corrompu ou plein toléré, jeu
relançable réseau coupé, aucun secret dans le dépôt ni dans ses 647 commits, 0 vulnérabilité, contraste du texte et
animations réduites tenus.

Les problèmes sont ailleurs : **ce qu'un visiteur d'exposition peut voir** (contenu violent par défaut, caméra
rallumée chez le visiteur suivant), **des tests qui ne regardent pas le jeu tourner**, **un service worker de 35 Mo**,
**un poste qui rame à cause d'un seul flou**, **des licences fausses ou manquantes**, et **les saisies humaines du
rendu toujours vides**.

## En bref — les 12 constats qui comptent le plus

| # | Constat | Axe | Gravité | Effort |
|---|---|---|---|---|
| 1 | Messages Community violents (dont 7 incitations au suicide allusives) affichés par défaut, y compris en kiosque `?expo=1`, sans avertissement ni âge conseillé | 4 | **bloquant (expo)** | S |
| 2 | Lecteur d'écran : le jeu est un canevas sans rôle ni nom, aucune commande dans le DOM, chaque annonce efface la précédente | 3 | **bloquant (a11y)** | L |
| 3 | Saisies humaines vides (rôles, contributions, part humaine de l'IA, fiche individuelle) et aucun test croisé consigné | 7 | **bloquant (note)** | S |
| 4 | Délai des plaintes Community faussé : `millis()` mélangé au temps de jeu actif (bug 201 toujours là, et plaintes expirées à la reprise d'une sauvegarde) | 1 | majeur | S |
| 5 | Kiosque : la webcam d'un visiteur se rallume sans demande au premier geste du suivant ; micro et caméra peuvent rester allumés après un double appui | 4, 1 | majeur | S |
| 6 | Les tests restent verts avec `setup()` et `draw()` cassés : `sketch.js` n'est jamais exécuté ; la CI publie sur GitHub Pages (404) sans tests | 6 | majeur | M |
| 7 | Précache de 34,6 Mo à la première visite (≈ 21 Mo inutiles : audio OGG **et** MP3, diaporama, kit presse, outils), retéléchargé à chaque déploiement, mise à jour lente | 2, 5, 6 | majeur | S |
| 8 | Poste à ≈ 15 FPS (desktop sans GPU) et 3 FPS (mobile ×4) : `blur(2px)` recalculé à chaque image sur 1920 × 1080 ; ×2,7 sans lui | 5 | majeur | S |
| 9 | Licence de la source patrimoniale fausse : le GTFS Naolib est en **ODbL (Semitan)**, le dépôt dit « Licence Ouverte (Nantes Métropole) » ; OSM, OFL, Lucide, CC0, CC BY absents de `LICENSE` | 2, 7 | majeur | S |
| 10 | Appli « Données » vide en mode hors ligne (0 dossier, pas de météo) alors que la partie joue 6 dossiers réels | 2 | majeur | S |
| 11 | Zoom navigateur sans effet, pincement interdit (`user-scalable=no`), « Taille du texte » plafonnée à 130 % | 3 | majeur | M |
| 12 | `design-system/DESIGN.md` (référence de `CLAUDE.md`) est l'extraction de l'identité Nantes Métropole (48 styles Picon) ; régénérer selon son README écraserait les sections du jeu | 8 | majeur | S |

## 1. Robustesse du code du jeu

Sain : 3 semaines complètes (avec et sans défi chrono) et une partie au hasard sans aucune erreur ; tous les
`JSON.parse` protégés ; 7 sauvegardes altérées reprises ou ignorées proprement ; 6 rotations mobiles sans erreur ;
aucune globale en double entre les 49 scripts.

- **Plaintes Community et horloges mélangées** — majeur, S. `p.depuis` est daté sur le temps de jeu actif
  (`immersion.js:265`, `tempsPlaintes`) mais l'instantané le rend relatif à `millis()` (`game.js:359`, `:412`), et
  `os.js:284` passe encore `millis()` à `Jeu.repondrePlainte` (action 1 de l'audit 201, non faite). Mesuré : après
  50 s sur l'écran titre, une plainte reprise expire en moins de 1,5 s (réputation 52 → 49). Piste : un seul temps,
  `tempsPlaintes()`, partout, et un test.
- **Micro resté ouvert** — majeur, S. `micro.js:68-94` : appui, relâchement, nouvel appui pendant la demande
  d'autorisation ⇒ deux `getUserMedia`, le premier flux n'est jamais arrêté, une `TypeError` toutes les 50 ms.
- **Caméra restée allumée** — majeur, S. `webcam.js:27-56` : `CAM.active` n'est posé qu'après les `await` ; deux clics
  ouvrent deux flux, « couper » n'arrête que le dernier. Piste commune : jeton de demande, arrêter tout flux arrivé
  après une coupure, `clearInterval` avant `setInterval`.
- Mineurs : défi chrono qui décompte pendant l'aide, le menu et l'onglet masqué (`multitache.js:50`, à arbitrer) ;
  carrière dont `jours` n'est pas un tableau ⇒ exception à chaque fin de journée (`taches.js:121`, `:197`) ;
  aucune garde contre `NaN` dans `appliquerDeltas` (`game.js:1247`) ; mélange `index.html` neuf / scripts anciens
  juste après un déploiement (`sw.js:277`).

## 2. Données, API, hors ligne, PWA

Sain : toutes les API et tous les champs utilisés répondent (13/11) ; délais respectés (GTFS-RT coupé à 8 s) ;
réseau externe coupé, le jeu démarre et une partie se lance sans erreur ; rechargement hors ligne après une visite ;
liste de précache = fichiers réels ; `manifest.webmanifest` (PWA) et `manifest.json` (fiche PATRIMOINE.EXE) ont
chacun leur rôle.

- **Appli « Données » vide hors ligne** — majeur, S. `game.js:47` met `Jeu.etat.semaine = fb.semaine`
  (`{lundi, dimanche}` seulement) ; `donnees.js:91` prend cet objet en priorité, et le repli à droite du `||` n'est
  jamais utilisé. C'est l'écran de provenance, et le cas du jury quand le Wi-Fi tombe.
- **Licence de la source patrimoniale** — majeur, S. Métadonnées de l'API : GTFS Naolib = ODbL, éditeur Semitan ;
  parkings, vélos (JCDecaux), fluidité, pollens = ODbL. Le dépôt écrit « Licence Ouverte » dans `donnees.js:18`,
  `data/lignes.json`, `data/fallback.json`, `manifest.json`, `src/content/oeuvres/pxe-nte001-g01-w01.json:16`,
  `src/lib/datasets.js`. L'ODbL impose l'attribution et le partage à l'identique des extraits de `data/`.
- **Flux temps réel Okina limité à 1 requête / 30 s** — majeur, M. Mesuré : 2ᵉ requête en 429 (sans en-tête CORS),
  le jeu bascule sur les archives avec « Flux temps réel injoignable ». En salle, un seul poste par fenêtre de 30 s
  a le direct ; chaque lancement télécharge ≈ 0,9 Mo. Piste : message « saturé, réessayez dans 30 s », dernier flux
  gardé en `sessionStorage`.
- **Mise à jour après déploiement** — majeur, M. Déploiement simulé : le 1er chargement exécute l'ancien JS, rien
  ne bouge en 30 s faute de `registration.update()` (`installation.js:105-116`), puis tout le cache est
  retéléchargé (`sw.js:243`).
- **Précache** : voir § 5.
- Mineurs : Hub'Eau « [À COMPLÉTER] » dans les crédits (`i18n.js:1353`, `:3291`) alors que la licence est vérifiée
  dans `manifest.json` ; notifications « en direct » du téléphone sans licence ni producteur ; tronçons « Saturé »
  ignorés par le compteur trafic (`notifs-tel.js:337`) ; `Jeu.enLigne` ne dépend que d'Open-Meteo ; docs qui
  présentent encore `data/fallback/` comme le repli du jeu et annoncent CORS `*` pour toutes les API (`jeu/api.md:5`).

## 3. Accessibilité

Tenu et mesuré : aucun texte opaque sous 4,5:1 (2 804 couples, FR/EN, contraste normal et renforcé) ; secousse à 0
et pluie figée en animations réduites ; aucun flash au-delà de 3/s ; cibles ≥ 24 px CSS en 1366 × 768 ;
webcam et micro facultatifs ; boîte d'import de sauvegarde exemplaire ; pages Astro correctes.

- **Canevas muet pour les lecteurs d'écran** — bloquant, L. `index.html:127-129` : seule `#annonces` parle, et
  `annoncer` remplace le texte (`i18n.js`). Piste : miroir DOM hors écran (titre d'écran, boutons des actions,
  ligne d'état des jauges), ou au minimum une touche « relire ». Test NVDA / VoiceOver : `[À COMPLÉTER]`.
- **Zoom** — majeur, M. Canevas à 1 365 px physiques à 100, 200 et 300 % ; `index.html:5`
  `maximum-scale=1, user-scalable=no` ; « Taille du texte » 100/115/130 %, plafond 24 px (`accessibilite.js:17`, `:57`).
- **Raccourcis d'une lettre non désactivables** (Z, F, L, I, V, H, M, J, D, Q…) — majeur, S. `sketch.js:1202-1259`,
  critère 2.1.4. Piste : réglage dans Paramètres › Accessibilité, filtré dans `saisieOuRaccourciNavigateur`.
- **Bandeau « Nouvelle version » inatteignable au clavier** — majeur, S. Le jeu annule Tab (`sketch.js:1168-1176`,
  `installation.js:84-104`).
- Mineurs : changement de langue non annoncé ; `prefers-reduced-motion` lu une seule fois (`sketch.js:60`) ; jauge
  critique à 2,53:1 sur sa piste, ≈ 1,6:1 au creux de la pulsation (`panneau.js`, `feedback.js:100`) ; mode expo à
  15 s pour prolonger au lieu de 20 (`expo.js:33`) ; bonus du souffle sans équivalent clavier ; « Loading… » sans
  `lang="en"`.

## 4. Sécurité et vie privée

Sain : aucun secret dans tout l'historique ; deux `innerHTML` seulement, sans donnée externe ; aucun `eval` ;
`window.open` avec `noopener` ; caméra et micro ouverts seulement sur un geste ; images réduites à 48 × 27, jamais
stockées ni envoyées ; aucun CDN, traceur ni cookie ; `npm audit --omit=dev` : 0 vulnérabilité (astro 7.4.7).

- **Contenu violent par défaut** — bloquant pour l'exposition, S. `confort.js:32` `masquerViolence: false` ;
  `expo.js:23` garde les réglages d'un visiteur à l'autre ; l'écran « Avant de jouer » est sauté en exposition ;
  aucun avertissement de contenu ni âge conseillé (cartel, kit presse). Piste : forcer le masquage en `EXPO.actif`,
  avertissement court hors exposition, âge conseillé sur le cartel, exclure les messages `incitation: true` quand le
  masquage est actif.
- **3114 seulement après « Signaler »** — majeur, S. `game.js:1789-1794` : qui ignore ou « clashe » le message ne
  voit jamais la ressource. Le libellé lui-même est exact (FR) et précise « in France » (EN).
- **Webcam rallumée chez le visiteur suivant** — majeur, S. `expo.js:23` garde `Reglages.webcam`, et
  `webcam.js:131-140` rallume la caméra au premier `pointerdown`/`keydown`. Défaut de consentement, pas de fuite.
- **Pas de `_headers`** — majeur (défense en profondeur), S. Cloudflare envoie déjà `nosniff` et `Referrer-Policy`
  (vérifié en ligne) ; manquent une CSP (`connect-src` limité aux 5 origines d'API) et une `Permissions-Policy`
  caméra/micro. À tester d'abord en `Report-Only`.
- Mineurs : webcam non coupée à l'onglet masqué ni en quittant la partie (`webcam.js:58`) ; indicateur réduit à une
  LED d'un pixel ; lien de source des Données qui sort du kiosque (`donnees.js:162`) ; pas de mentions légales ;
  `.gitignore` racine sans `.env` ; détection de main par seuils de couleur de peau fixes, inégale selon la carnation
  (alternative clavier Z existante).

## 5. Performance

Sain : aucune fuite (heap 6 → 8,5 Mo, 49 écouteurs stables sur 3 min) ; aucun `createGraphics` par image ;
`pixelDensity(1)` ; un seul `Audio` à la fois ; 1,04 Mo transférés en brotli au premier chargement (74 requêtes) ;
premier écran jouable en 450 ms (desktop) et 1,7 s (mobile ×4).

- **Flou recalculé à chaque image** — majeur, S. `bureau.js:877` `drawingContext.filter = 'blur(2px) brightness(0.85)'`
  sur la pièce en 1920 × 1080. A/B : 16 → 44 FPS (desktop), 3,4 → 6,8 FPS (mobile ×4). Piste : flouter une fois la
  pièce 480 × 270 dans un tampon, comme `masqueFlouEtVignette` le fait déjà pour la vue bureau.
- **Précache de 34,6 Mo** — majeur, S. `generer-sw.mjs:13` n'exclut que `sw.js` et le trailer : audio en double
  (OGG 14,2 + MP3 12,3 Mo, un seul lu), `presentation/`, `kit-presse/`, `captures/demo.mp4`, `audit-*.js`, `.md`,
  doublons `.json`. `Promise.allSettled` (`sw.js:243`) masque les échecs. Piste : noyau ≈ 3,5 Mo en `addAll` strict,
  le reste à la demande.
- **Plaintes chargées deux fois** — `messages.js` (384 Ko) puis `messages.json` (499 Ko, `no-store`, `game.js:1526`),
  ≈ 30 % du premier chargement. Piste : le `fetch` en développement seulement.
- **Son jamais suspendu** quand l'onglet est caché (aucun `visibilitychange` audio) ; **boucle à 60 FPS permanente**,
  même sur les écrans statiques (aucun `frameRate`/`noLoop`) — majeurs sur mobile (batterie).
- Mineurs : `max-age=0` partout et revalidation de chaque fichier par le SW ; p5 insère un `<div>` à chaque image
  via `textAscent` ; police `latin-ext` préchargée pour rien ; 66 scripts synchrones non bundlés.

## 6. Site Astro, build, tests, outillage

Sain : build déterministe hors Slidev ; 155 liens internes de `dist/` vérifiés, 0 cassé ; métadonnées et canonical
sur le jeu, `/cartel/` et `/making-of/` ; schéma des œuvres strict ; aucune référence vivante à `github.io` ;
Node 22.23.4 existe ; lockfile cohérent.

- **Tests aveugles à l'exécution** — majeur, M. Mutation vérifiée : `setup()` qui appelle une fonction absente et
  `draw()` qui lève ⇒ smoke et test-jeu restent verts. `sketch.js`, `menu.js`, `bureau.js`… ne sont que lus par regex.
  Aucun contrôle des erreurs console, du mobile, du service worker réel, du hors-ligne. Piste : un
  `scripts/navigateur.mjs` manuel (playwright-core en cache npx) qui charge le jeu en 2 tailles, échoue sur toute
  `pageerror`, coupe le réseau et recharge — à lancer avant chaque fusion.
- **CI** — majeur, S. `.github/workflows/deploy.yml` publie sur GitHub Pages (adresse en 404) et ne lance pas
  `npm test` : aucun garde-fou automatique sur `main`.
- **Déploiement hors git** — majeur (processus), S. Pendant l'audit, la production (`49fdacccde`) servait la copie
  de travail non commitée du prompt 204 ; elle correspond maintenant à `main` (`cd7c1be`), donc le déploiement a
  précédé le commit et les tests. Piste : intégration Git de Cloudflare sur `main`, ou script `deploy` qui refuse un
  arbre sale ; documenter le mécanisme (`deploy.yml:6-8`, `site/README.md` à `[À COMPLÉTER]`).
- **Le build réécrit 96 fichiers là où Slidev est installé** — majeur, S. `construire-slides.mjs:11-13` (prebuild)
  reconstruit `public/presentation/`, qui ne correspond plus à ses sources : diff parasite à chaque « build avant
  push » sur le poste principal. Piste : sortir le deck du `prebuild`.
- Mineurs : pas de page 404 (toute URL inconnue, même `/data/x.json`, renvoie le jeu en 200) ; rush de 28 Mo suivi
  par git (`trailer/assets/clips/partie-complete.mp4`), dépôt ≈ 111 Mo ; chemin personnel codé en dur
  (`trailer/scripts/capture.mjs:19`) ; `site/AGENTS.md` générique ; `CLAUDE.md` décrit `npm test` comme un simple
  smoke test.

## 7. Brief, dossier de rendu, documentation

Sain : chaîne source → grammaire → système → œuvre portée par un document à chaque maillon ; cartel à 114 mots ;
3 paramètres opérants ; `prompts/README.md` et `auteurs.json` couvrent exactement les fichiers ; tous les hash cités
dans `journal.md` existent ; `note-eval.md` fidèle au barème.

- **Saisies humaines vides** — bloquant pour la note, S (groupe). Rôles, contributions, part humaine de l'IA :
  `site/README.md:11,133,142`, `rendu/…/README.md:44,112,124`, `manifest.json:28`, écran Crédits du jeu (« Part
  humaine : [À COMPLÉTER] » visible par le joueur). Pas de fiche individuelle.
- **Test croisé et tests humains** — bloquant (obligation du livret). `todo.md:57`, `notes.md:452-454` vides.
- **Copie `rendu/` désynchronisée** — majeur, S. 19 fichiers diffèrent de `site/public/` sur `cd7c1be` (prompts 202 et
  204 absents) ; `rendu/…/slides.md` est un ancien diaporama. À resynchroniser **en dernier**.
- **Licences incomplètes** — majeur, S. `LICENSE` ne cite ni OSM (ODbL, `data/lieux.json`), ni les jeux ODbL
  redistribués, ni Lucide, ni les musiques CC0, ni le trailer CC BY ; le texte de l'OFL de JetBrains Mono n'est pas
  livré avec la police ; droits des images du kit presse vides.
- Mineurs : grammaire sans diagramme ; 290 lignes sur 307 de `journal.md` disent « ce commit » ; chiffres périmés
  (`README.md:91` « 181 prompts ») ; 9 fiches `jeu/` hors sommaire ; `todo.md` non coché pour les jours 1 et 2 ;
  documents `jeu/` périmés sans mention « historique ».

## 8. Textes, i18n, design system

Sain : 1 933 clés FR = 1 933 EN, 0 placeholder divergent, 0 clé manquante sur 1 452 appels ; seulement 2 clés mortes
(`mailf.fait.titre`, `trace.titre`) ; capitales accentuées, tirets et points de suspension corrects ; aucune trace de
Picon dans le code servi ; décor pixel volontairement hors palette.

- **`DESIGN.md` = identité Nantes Métropole** — majeur, S. Lignes 1-226 : extraction dembrandt de metropole.nantes.fr
  (48 styles Picon, couleurs de marque, URL des woff2 LCTPicon) ; seules les lignes 227 et suivantes décrivent le
  jeu. Piste : déplacer l'extraction dans `design-system/reference-metropole/` (« ne pas appliquer »), faire de
  `DESIGN.md` le Pixel DS réel, corriger la consigne de régénération du README.
- **Aucune espace insécable** dans les 1 933 chaînes FR (579 « ␠: », 90 « «␠ ») alors que `jeu/88` en fait la
  règle — majeur, S. Piste : la poser dans `t()` pour `fr`, hors heures et URL, avec un test.
- **Textes français visibles en anglais** — majeur, S. Incident fictif (`game.js:274-275` : texte et source en dur),
  6 sources descriptives dans `donnees.js`, 17 concaténations `' : '` et 6 guillemets « » codés en dur.
- **Police `Bitsy Pixels` déclarée mais non livrée** (`fonts.css:39-45`) — majeur (cohérence), S : trois rendus de
  titre selon la surface. Licence de redistribution à vérifier avant de déposer le fichier.
- Mineurs : couleurs Nantes Métropole restantes `#005ae1` (`cartel.astro:31`, `making-of.astro:57`) et `#00ca64`
  (`ds.js:496`) ; apostrophes mélangées (« Régul' » / « Régul’ ») ; courbe fluidité `#7FB2FF` hors palette ; 26 tailles
  de police sans échelle écrite ; `pixel-palette.tokens.json` lu par aucun script.

## Suivi des audits précédents (sur `cd7c1be`)

| Audit | Fait | Reste |
|---|---|---|
| `audit-2026-11-12.md` | la plupart des points (évaluation, intro, mode exposition, filet d'erreur, grammaire) | Hub'Eau aux crédits, `user-scalable=no`, `deploy.yml`, test d'équilibrage qui joue l'ancienne table d'actions (`test-jeu.mjs:79-100`), saisies humaines, `rendu/` |
| `jeu/201-audit-gameplay.md` | **0 / 9** | tout, dont le bug du délai Community (`os.js:284`) |
| `jeu/203-audit-ux.md` | **6 / 9** (prompt 204) | mobile portrait (prompt 205 rédigé), autorisations au premier usage, tests joueurs |
| `ux-informations-2026-11-12.md` | 4 suites sur 6 (prompts 160 à 163) | prompt 164 non exécuté, 16 décisions de groupe non tranchées |

## Feuille de route proposée

**Avant toute nouvelle exposition (S, < 1 h chacun)**
1. Masquage des commentaires violents forcé en `?expo=1`, avertissement de contenu, âge conseillé ; 3114 affiché avec
   le message lui-même.
2. En exposition, `webcam` (et `micro`) remis à leur valeur par défaut à chaque visiteur ; garde contre les doubles
   demandes de micro et de caméra ; caméra coupée à l'onglet masqué.
3. Un seul temps pour les plaintes Community (`os.js:284`, `game.js:359`, `:412`) et un test.

**Avant le rendu (S)**
4. Saisies humaines, fiche individuelle, test croisé consigné (groupe).
5. Licences : ODbL / Semitan pour le GTFS partout, OSM, OFL (texte livré), Lucide, CC0, CC BY dans `LICENSE` et
   `manifest.json`, Hub'Eau aux crédits.
6. Appli « Données » hors ligne alimentée par `Jeu.fallback`.
7. `rendu/` resynchronisé en dernier.

**Qualité et performance (S–M)**
8. Flou de la pièce mis en cache (`bureau.js:877`).
9. Précache réduit au noyau (un format audio), `addAll` strict, `registration.update()` au chargement.
10. Test navigateur manuel (`pageerror`, 2 tailles, hors ligne) ; CI qui lance `npm test` au lieu de publier sur
    GitHub Pages ; deck Slidev sorti du `prebuild` ; déploiement depuis un commit.
11. `_headers` : CSP et `Permissions-Policy` (en `Report-Only` d'abord) ; page 404.
12. `DESIGN.md` séparé de l'extraction Nantes Métropole ; espaces insécables dans `t()` ; textes du fictif traduits.

**Accessibilité (M–L, à arbitrer par le groupe)**
13. Retirer `user-scalable=no`, paliers de texte 160 / 200 %, réglage pour couper les raccourcis d'une lettre, bandeau
    de mise à jour atteignable au clavier.
14. Miroir DOM pour les lecteurs d'écran, puis test réel NVDA / VoiceOver.

## Ce que cet audit ne dit pas

- Ressenti des joueurs, compréhension réelle, test d'un lecteur d'écran, FPS sur le PC d'exposition et sur un vrai
  téléphone : `[À COMPLÉTER]` après des tests humains.
- La limite Okina (1 requête / 30 s) s'applique-t-elle par IP ou à toute la passerelle : non vérifié.
- Gameplay, équilibrage et UX écran par écran : voir `jeu/201` et `jeu/203`, non refaits ici.
