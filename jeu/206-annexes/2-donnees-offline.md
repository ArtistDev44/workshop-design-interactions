# Audit axe 2 : données, API, hors ligne, PWA

Dépôt audité : worktree `wt-205`, commit `f07351b` (origin/main), le 13/11/2026.
Méthode : lecture ciblée du code ; sondage des API réelles (`limit=1`, `select`) ; pilotage headless (Chromium 1248, playwright-core) du jeu servi en local, avec le réseau externe coupé (`ctx.route`), puis hors ligne complet (`ctx.setOffline`) ; simulation d'un déploiement (copie de `public/` dans le dossier de travail, serveur avec les en-têtes de Cloudflare `Cache-Control: public, max-age=0, must-revalidate`). Le dépôt n'a pas été modifié.

## Synthèse

| # | Constat | Gravité | Effort | Preuve |
|---|---|---|---|---|
| 1 | L'appli « Données » affiche 0 incident, aucune météo et 0 événement en mode hors ligne | majeur | S | mesuré (headless) |
| 2 | La source patrimoniale (GTFS Naolib) est sous ODbL, mais le jeu, le cartel et les métadonnées indiquent « Licence Ouverte » | majeur | S | mesuré (métadonnées de l'API) |
| 3 | Flux GTFS-RT Okina limité à 1 requête par 30 s : le mode direct se replie en silence | majeur | M | mesuré |
| 4 | Après un déploiement, l'ancien JS reste servi et la mise à jour retélécharge 38 Mo | majeur | M | mesuré + lu |
| 5 | Précache de 38 Mo en 295 requêtes à la première visite (deux formats audio, diaporama, kit presse) | majeur | M | mesuré |
| 6 | Crédits : licence Hub'Eau encore à `[À COMPLÉTER]`, alors qu'elle a été vérifiée ailleurs | mineur | S | lu |
| 7 | Notifications « en direct » du téléphone : sources ODbL sans licence ni producteur | mineur | S | lu + mesuré |
| 8 | Compteur trafic : les tronçons « Saturé » sont ignorés | mineur | S | mesuré |
| 9 | `messages.json` (500 Ko) retéléchargé à chaque chargement en plus de `messages.js` | mineur | S | lu |
| 10 | Précache en `allSettled` : un échec passe inaperçu et le hors ligne reste incomplet | mineur | S | lu |
| 11 | Docs obsolètes : `data/fallback/` présenté comme le repli du jeu ; CORS `*` et quota annoncés pour toutes les API | mineur | S | lu + mesuré |
| 12 | `Jeu.enLigne` ne dépend que d'Open-Meteo : une panne de météo marque des retards réels « repli » | mineur | S | lu |

---

## Constats

### 1. L'appli « Données » se vide en mode hors ligne — majeur, effort S, mesuré (headless)
- **Où** : `site/public/donnees.js:91`.
- **Cause** : `Jeu.chargerHorsLigne` (`game.js:43-53`) met `Jeu.etat.semaine = fb.semaine`, soit `{lundi, dimanche}` sans `dossiers`, `meteo` ni `evenements`. `blocsDonnees()` prend `Jeu.etat.semaine` en priorité, et l'objet de repli construit à droite du `||` n'est jamais utilisé.
- **Scénario mesuré** (réseau externe coupé, `Jeu.chargerHorsLigne()`) : la partie joue bien 6 dossiers réels, et `Jeu.meteoDuJour('2026-10-13')` renvoie la météo réelle. L'appli « Données » affiche pourtant « 0 dossier(s) issus des archives : », un bloc météo vide et « 0 événement(s) à l'agenda ». Le statut dit « archive du 12/10/2026 au 18/10/2026 » au lieu de « hors ligne → repli local ». C'est l'écran qui doit montrer la provenance des données, et il contredit la partie en cours. C'est aussi le cas présenté en jury quand le Wi-Fi tombe.
- **Piste** : en mode `'hors ligne'`, construire `s` depuis `Jeu.fallback` (dossiers, meteo, événements = dossiers de type « événement ») et afficher le statut `donnees.repli`.

### 2. Licence de la source patrimoniale erronée (ODbL, pas Licence Ouverte) — majeur, effort S, mesuré
- **Mesure** (`/catalog/datasets/{id}`, champ `metas.default.license`, 13/11/2026) :
  - `244400404_transports_commun_naolib_nantes_metropole_gtfs` : **Open Database License (ODbL)**, éditeur **Semitan** ;
  - parkings, vélos (éditeur JCDecaux), fluidité, pollens (éditeur Pollinarium sentinelle) : **ODbL** ;
  - agenda `_v2` et `244400404_reseau-transports-collectifs-naolib` (GTFS-RT) : Licence Ouverte.
- **Mentions fausses** :
  - `site/public/donnees.js:18` et `:100` : le bloc « Incidents rejoués » est attribué au changelog GTFS sous « Licence Ouverte (Nantes Métropole) » ;
  - `site/public/data/lignes.json:1` (et `lignes.js`) : « … gtfs (Licence Ouverte) » ;
  - `site/public/data/fallback.json:15,24,33` : « Changelog du GTFS Naolib (… Licence Ouverte) », repris dans le jeu par le champ `source` des dossiers ;
  - `site/public/manifest.json` : `heritage_source.rights` et `data_sources[0].rights`, « Licence Ouverte » ;
  - `site/src/content/oeuvres/pxe-nte001-g01-w01.json:16` : « droits : Licence Ouverte (Nantes Métropole) » ;
  - `site/src/lib/datasets.js:17` (parkings) et `:43` (vélos) : « Licence Ouverte », l'API dit ODbL.
- **Scénario** : le cartel, le manifest PATRIMOINE.EXE et l'appli « Données » attribuent la source patrimoniale à la mauvaise licence et au mauvais producteur (Nantes Métropole au lieu de Semitan). L'ODbL exige l'attribution, et le partage à l'identique pour une base dérivée : `data/semaines/*.json` et `fallback.json` sont des extraits du changelog. Seuls les crédits (`i18n.js:1351`) disent prudemment « Licence Ouverte ou ODbL selon le jeu ».
- **Piste** : remplacer par « ODbL — Semitan via Open Data Nantes Métropole » partout où le GTFS est cité, et indiquer dans `LICENSE` ou le README que les extraits de `data/` restent sous ODbL.

### 3. GTFS-RT Okina : 1 requête par 30 s, puis repli silencieux sur la semaine de référence — majeur, effort M, mesuré
- **Où** : `site/public/gtfsrt.js:12` (URL) et `:219-233` (chargement) ; `site/public/game.js:57-88` (mode direct) ; message `i18n.js:15`.
- **Mesure** :
  - deux requêtes `trip-updates` envoyées l'une après l'autre : la première répond **200 (925 Ko)**, la seconde **429** `{"message":"Rate limit exceeded ! You reach the limit of 1 requests per 30 seconds"}` ;
  - la réponse 429 de l'endpoint `alerts` ne porte pas d'en-tête `Access-Control-Allow-Origin`, donc le navigateur la voit comme une erreur CORS ;
  - en headless, Okina en 429 et Open-Meteo en ligne donnent le mode `'hors ligne'` en 41 ms, avec le message « Flux temps réel injoignable : mode hors ligne. » (`enLigne: true`) ;
  - le cas « Okina ne répond jamais » rend la main en 8 044 ms (délai de 8 s respecté).
- **Scénario** : à l'exposition ou en salle, plusieurs postes ou joueurs sur la même IP lancent « Aujourd'hui en direct ». Seul le premier dans chaque fenêtre de 30 s obtient le flux. Les autres jouent la semaine d'octobre avec un message qui parle de panne. Chaque lancement en direct télécharge aussi environ 0,9 Mo de protobuf. On ne sait pas si la limite s'applique par IP ou à toute la passerelle (non vérifié) ; dans le second cas, le mode direct échouerait pour presque tout le monde. `jeu/api.md:5` annonce pourtant « CORS ouvert (`*`) », ce qui est faux pour Okina (l'origine est renvoyée telle quelle), et un quota de 10 000 requêtes par jour qui ne vaut que pour l'API Explore.
- **Piste** : distinguer le 429 (« flux temps réel saturé, réessayez dans 30 s » avec un bouton Réessayer) de l'injoignable, et garder le dernier flux décodé en `sessionStorage` pour les relances dans la même session.

### 4. Mise à jour après déploiement : ancien JS servi, mise à jour lente et coûteuse — majeur, effort M, mesuré + lu dans le code
- **Où** :
  - `site/public/sw.js:278-288` : ressources en cache d'abord, `ignoreSearch`, scripts sans paramètre de version dans `index.html:133-198` ;
  - `site/public/sw.js:243` : nouvelle version = nouveau cache vide, chaque entrée rechargée en `cache: 'reload'` ;
  - `site/public/installation.js:105-116` : `register()` au `load`, jamais de `registration.update()`.
- **Mesure** (copie locale, en-têtes Cloudflare reproduits, déploiement simulé : `game.js`, `version.js` et `VERSION` de `sw.js` changés) :
  - 1er chargement après le déploiement : ancien `game.js` et ancien `VERSION_BUILD` exécutés ;
  - pendant 30 s : aucune installation, aucun `controllerchange`, aucun bandeau « Nouvelle version » ;
  - après un `registration.update()` forcé : installation, puis `controllerchange` et bandeau environ 60 s plus tard (238 entrées rechargées) ;
  - le chargement suivant reçoit bien la nouvelle version.
- **Scénario** : le jour du jury, un correctif est poussé. Les postes déjà visités rouvrent le jeu avec l'ancienne version, et le bandeau peut n'apparaître que bien plus tard. La navigation est servie réseau d'abord (`sw.js:266-276`), donc un nouvel `index.html` peut aussi s'exécuter avec d'anciens scripts en cache (lu dans le code). Chaque mise à jour retélécharge les 38 Mo du constat 5, y compris les fichiers qui n'ont pas changé.
- **Piste** : appeler `reg.update()` au chargement et au retour de visibilité, copier dans le nouveau cache les entrées d'empreinte identique (ou versionner les URL des scripts) au lieu de tout recharger, et passer `index.html` et les `.js` du jeu en « réseau d'abord ».
- **Note** (non vérifié) : la production sert `VERSION = 'nte-regulation-49fdacccde'`, le dépôt `991d150e3b`, avec une liste de précache identique (221 entrées). Le build Cloudflare produit donc d'autres octets, ou un autre commit est déployé.

### 5. Précache de 38 Mo à la première visite — majeur, effort M, mesuré
- **Où** : `site/scripts/generer-sw.mjs:13` et `:22-29` : tout `public/` est précaché, sauf le trailer.
- **Mesure** :
  - liste : 221 entrées, 34,6 Mo de fichiers ;
  - en headless : 295 requêtes et 38,2 Mo téléchargés avant que le cache soit complet (219 entrées en cache) ;
  - l'audio pèse environ 26 Mo, chaque morceau étant précaché en **OGG et en MP3** alors qu'un navigateur n'en lit qu'un (`lofi-softly` : 4,5 + 4,2 Mo) ;
  - sont aussi précachés : `captures/demo.mp4` (1,2 Mo), tout le diaporama Slidev (`presentation/assets/**`, environ 60 fichiers), `kit-presse/` (images en double de `captures/`), `audit-*.js` (outils de développement), `grammar.md`, `source-sheet.md`, `fonts/README.md`, les 9 instantanés `data/fallback/*.json` inutilisés par le jeu, et les `.json` en double des `.js` de `data/`.
- **Scénario** : un visiteur scanne le QR code en 4G. Sans le savoir, il télécharge 38 Mo en arrière-plan, puis encore 38 Mo à chaque déploiement (constat 4).
- **Piste** : précacher le noyau du jeu (environ 3 Mo : `index.html`, JS, `data/*.js`, polices, icônes, la musique par défaut dans un seul format) et mettre le reste en cache à la demande.

### 6. Crédits : licence Hub'Eau encore à `[À COMPLÉTER]` — mineur, effort S, lu dans le code
- **Où** : `site/public/i18n.js:1351` (FR) et `:3287` (EN) : « Hub'Eau ([À COMPLÉTER]) ».
- **Constat** : la licence est déjà vérifiée ailleurs dans le dépôt : `manifest.json` (« Licence Ouverte Etalab (CGU Hub'Eau § 5.1.3, vérifié le 2026-11-11) ») et `i18n.js:1008` (`donnees.licenceHubeau`).
- **Piste** : reprendre la mention vérifiée dans les crédits.

### 7. Notifications « en direct » du téléphone sans licence ni producteur — mineur, effort S, lu + mesuré
- **Où** : `site/public/notifs-tel.js:335-338` ; seule attribution affichée : `i18n.js:1853` (« En direct aujourd'hui (Open Data Nantes Métropole) »).
- **Constat** : les quatre jeux de données (parkings, vélos, fluidité, pollens) sont sous ODbL. Deux viennent d'autres producteurs (JCDecaux, Pollinarium sentinelle). Aucun n'apparaît dans l'appli « Données », et aucune licence n'est affichée.
- **Piste** : ajouter une ligne « ODbL — producteur » sous l'onglet direct, et ces quatre sources à l'appli « Données ».

### 8. Compteur trafic : les tronçons « Saturé » sont ignorés — mineur, effort S, mesuré
- **Où** : `site/public/notifs-tel.js:337`, filtre `/dense|bloqu/i`.
- **Mesure** (API, 13/11 vers 11 h) : Bloqué 6, Dense 8, **Saturé 6**, Fluide 720, Indéterminé 149. Le téléphone annonce 14 tronçons « denses ou bloqués » au lieu de 20.
- **Piste** : `/dense|bloqu|satur/i`.

### 9. `messages.json` retéléchargé à chaque chargement — mineur, effort S, lu dans le code
- **Où** : `site/public/game.js:1526`, `fetch('./data/messages.json', { cache: 'no-store' })` alors que `data/messages.js` (384 Ko) est déjà chargé par `<script>`.
- **Constat** : environ 500 Ko de plus par visite. Comme le service worker sert ce fichier en cache d'abord (`sw.js:278-288`), le `no-store` ne garantit même pas la fraîcheur annoncée par le commentaire.
- **Piste** : ne lancer ce `fetch` qu'en développement (`location.hostname === 'localhost'`).

### 10. Précache en `allSettled` : un échec reste silencieux — mineur, effort S, lu dans le code
- **Où** : `site/public/sw.js:243`.
- **Scénario** : si `game.js` échoue pendant l'installation (réseau instable), le service worker s'active quand même. Au premier passage hors ligne, `cache.match` ne trouve rien et `respondWith(undefined)` provoque une erreur réseau, donc un jeu cassé hors ligne alors que la promesse était « fonctionne sans réseau ».
- **Piste** : `addAll` strict sur le noyau du jeu, `allSettled` seulement pour les annexes.

### 11. Docs obsolètes sur le repli et les API — mineur, effort S, lu + mesuré
- **Où** : `CLAUDE.md:13`, `jeu/api.md:5` et `:76`, `contexte/audit-api-open-data-nantes.md:102`.
- **Constat** :
  - ces documents présentent `site/public/data/fallback/` comme le repli du jeu. Le jeu ne lit que `data/fallback.js` (la chaîne `datasets.js` → `snapshot.mjs` → `data/fallback/` est morte, déjà relevé dans `jeu/200-…:85`) ;
  - `jeu/api.md:5` affirme CORS `*` et un quota de 10 000 requêtes par jour pour toutes les API (voir constat 3) ;
  - `jeu/07-fallback-offline.md` décrit 6 cas « avec retard », alors que `retard` vaut `null` dans le repli (déjà relevé dans `audit-2026-11-12.md:132`).
- **Piste** : corriger ces lignes quand la chaîne morte sera retirée.

### 12. `Jeu.enLigne` ne dépend que d'Open-Meteo — mineur, effort S, lu dans le code
- **Où** : `site/public/game.js:107-131` ; `immersion.js:82-84` (rafraîchissement toutes les 30 min) ; `donnees.js:53` et `:66`.
- **Scénario** : en partie directe, un échec ponctuel d'Open-Meteo met `Jeu.enLigne = false` jusqu'au prochain essai, 30 min plus tard. Pendant ce temps, l'appli « Données » marque les retards GTFS-RT réels « hors ligne → repli local ».
- **Piste** : un indicateur de provenance par source plutôt qu'un booléen global.

---

## Ce qui est sain (vérifié)

- **API vivantes, champs valides** (13/11/2026) : toutes les requêtes du jeu répondent avec les champs lus.
  - Agenda `_v2` (`nom, lieu, ville, date, heure_debut, types_libelles, annule`) : dates du 26/09/2025 au 21/11/2027, donc les trois semaines d'archives sont couvertes.
  - Parkings, vélos, fluidité, pollens, métadonnées GTFS.
  - Open-Meteo forecast.
  - Hub'Eau `observations_tr` : répond en **206**, que `r.ok` accepte.
  - Okina : CORS accordé à `pages.dev` et à `localhost` ; identifiants `FR_NAOLIB:Line:*` alignés sur `lignes.json`.
- **Décodeur GTFS-RT valide sur le flux réel** : `gtfsrt.js` décode le flux du 13/11 à 10 h 35 Z (696 trajets) ; `retardsParLigne(…, 10)` trouve 2 lignes (ligne 1 : 119 min, ligne 3 : 15 min). Le pic de 119 min mériterait un plafond de vraisemblance (non examiné). Pour obtenir ce flux, il a fallu attendre une fenêtre de plus de 40 s après un 429, ce qui confirme le constat 3.
- **Délais partout** : 8 s pour le GTFS-RT (mesuré : 8 044 ms), 6 s pour l'agenda, Hub'Eau et le direct du téléphone, 4 s pour la météo. Aucun appel dans `draw()` ; appels au clic ou en `setInterval` (Loire toutes les 10 min, météo toutes les 30 min).
- **Réseau externe coupé** (headless, 1366 × 768) : aucune `pageerror`.
  - L'accueil grise « direct » (`accueil.direct.indispo`), et `chargerDirect` se replie en mode `'hors ligne'` (6 dossiers).
  - Une semaine d'archives se lance et la partie démarre (`ecran: 'jeu'`).
  - Le téléphone se replie sur les événements locaux, la Loire sur la médiane figée (4,14 m, « médiane figée »).
  - Les seules erreurs console sont les 5 requêtes externes bloquées.
- **Hors ligne complet après une visite** : le rechargement fonctionne (service worker aux commandes, 300 plaintes chargées, accueil affiché), et une page absente retombe sur le jeu.
- **Précache cohérent** : la liste de `sw.js` correspond exactement aux fichiers de `public/` (221 entrées, seul `captures/trailer.mp4` est exclu, volontairement). `VERSION` recalculé = `991d150e3b` = `version.js`.
- **Données locales cohérentes** : chaque paire `.js`/`.json` de `data/` est identique (lignes, lieux, loire, fallback, messages, reponses), et `semaines.js` = `semaines/*.json` pour les 3 semaines.
- **Fraîcheur et provenance** : `preparee_le` 2026-11-10, GTFS valide du 06/11/2026 au 07/02/2027, instantané Loire du 10/11/2026 (période, station et URL indiquées), `source` par dossier.
- **Lectures partielles** : les requêtes Range sur la musique sont servies depuis le cache (`sw.js:262-265`, `:295-310`).
- **Pourquoi deux manifests** : `manifest.webmanifest` est le manifest PWA (lié par `index.html:20`). Chemins relatifs `./`, `id`, `start_url` et `scope` = `./`, icônes 192/384/512 et maskables présentes aux bonnes tailles, captures existantes, raccourcis `?action=` gérés par `actionDepuisUrl()`. `manifest.json` est la fiche PATRIMOINE.EXE (métadonnées de l'œuvre), non liée comme manifest PWA. La confusion de nom reste possible ; à documenter.
- **Règles du projet** : aucune clé ni aucun secret ; tous les appels d'API partent du navigateur (les scripts `preparer-semaines.mjs` et `snapshot.mjs` sont lancés à la main, jamais au build) ; le site se relance sans réseau.

## Non vérifié
- La limite Okina s'applique-t-elle par IP ou à toute la passerelle ?
- Quel commit est déployé (empreinte de production ≠ dépôt) ?
- Zone de sécurité des icônes maskables.
- Comportement de mise à jour sur Safari iOS.
