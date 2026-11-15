# Site de l'édition PATRIMOINE.EXE · NTE001

Site statique (Astro) de l'édition Nantes 001 — ESD Nantes, B3 Design, 9, 10 & 12 novembre 2026.

**En ligne (URL canonique) :** https://workshop-design-interactions.pages.dev/ — le jeu « Nantes en régulation » est servi à la racine ; cartel de l'œuvre : https://workshop-design-interactions.pages.dev/cartel/

**Statut : projet clôturé le 15/11/2026.** Le jeu, le site et le dossier de rendu sont dans leur version finale ; aucune évolution n'est prévue.

> Historique : l'ancienne adresse GitHub Pages (`https://artistdev44.github.io/workshop-design-interactions/patrimoine-exe/nantes/001/`) renvoie une 404 (vérifié le 10/11/2026). Elle n'apparaît plus que dans les prompts 02, 08 et 13 (note historique en tête de chacun) et dans les anciennes lignes de `journal.md`.

## Auteurs

Mattéo Brevet, Guillaume Renoult (groupe G01).

Rôles, d'après l'historique git (15/11/2026) : **Mattéo Brevet** a construit le site de l'édition et les fondations du jeu,
puis le gameplay des applications du PC ; **Guillaume Renoult** a cadré le projet, rédigé la plupart des prompts,
piloté les fusions et exécuté la majorité des étapes du jeu à partir du 10/11, avec les tests, la captation et la documentation.

## Édition

PATRIMOINE.EXE · NTE001 — édition pilote STUDIO, Nantes, France. Institution hôte : ESD Nantes (B3 Design).
Direction de l'édition : Kamel Ghabte.

## Concept

Le site **est** l'œuvre : le jeu p5.js « Nantes en régulation » (`public/index.html`) est servi
à la racine. Les pages Astro de la vitrine (galerie, statistiques, méthode, `/donnees/`…) ont été
retirées le 10/11/2026 quand le jeu est passé à la racine (voir `journal.md`). Il reste le
registre machine-readable `src/content/oeuvres/*.json`, validé au build, d'où est générée la page
Astro **`/cartel/`** ; la seconde page Astro, **`/making-of/`**, est générée depuis `prompts/README.md`
(prompt 46). Le kit de presse (`public/kit-presse/`, prompt 188) est une page statique servie telle quelle. Le tout rend lisible la chaîne **source → grammaire → système → œuvre**.

Une partie (une semaine rejouée) dure **10 à 20 minutes** ; le mode histoire (3 semaines), 30 à 45 minutes
(durées visées par la conception, à confirmer par les tests humains). Public : 12 ans et plus.

## Stack

- [Astro](https://astro.build) 7, rendu **100 % statique** (seule dépendance : `astro`).
- CSS maison d'après `design-system/DESIGN.md` (sans police externe), JavaScript natif.
- Validation du registre par schéma (`astro/zod`) : une fiche d'œuvre incomplète bloque le build.
- Déploiement : URL canonique sur Cloudflare Pages ; la façon dont Cloudflare Pages construit le site n'est pas documentée dans le dépôt ([À COMPLÉTER], voir `todo.md`). Depuis le prompt 210, `.github/workflows/tests.yml` lance `npm run build` puis `npm test` (avec le test navigateur) à chaque push ; l'ancien workflow GitHub Pages (adresse en 404) est supprimé.
- Smoke test sans dépendance : `npm test` (`scripts/smoke.mjs`).

## Données

- **Registre local** : `src/content/oeuvres/` (une fiche JSON par œuvre, schéma `src/content.config.ts`).
- **Jeu** : `public/data/` — semaines d'archives (`semaines/*.json`, `semaines.js`), tracés des lignes
  (`lignes.json`, `lignes.js`), 6 cas hors ligne (`fallback.json`, `fallback.js`), dialogues
  (`messages.json` → `messages.js`, régénéré par `prebuild`). En mode « aujourd'hui », le jeu interroge
  dans le navigateur le flux GTFS-RT Naolib et Open-Meteo (`game.js`, `gtfsrt.js`).
- **Jeux Open Data du prompt 11** : listés dans `src/lib/datasets.js` (utilisé seulement par
  `scripts/snapshot.mjs` depuis le retrait de la page `/donnees/`).
- **Instantanés de secours** : `public/data/fallback/*.json`, vraies données horodatées, régénérées par :

  ```sh
  cd site
  node scripts/snapshot.mjs
  ```

## Lancer le projet

```sh
cd site
npm install
npm run dev       # développement
npm run build     # construit site/dist/
npm run preview   # sert la version construite
npm test          # smoke test (scripts, données, motifs de secret, dist)
```

Le site s'ouvre à `http://localhost:4321/` (jeu) ; le cartel à `http://localhost:4321/cartel/`. Hors ligne, sans rien installer : double clic sur `public/index.html`.

**Exposition (prompt 132)** : ouvrir `https://workshop-design-interactions.pages.dev/?expo=1` (ou `…/index.html?expo=1` en local). Le stockage du visiteur précédent est effacé (réglages, langue et palmarès gardés), le joueur arrive directement devant la carte, et après 90 s sans geste en partie le jeu revient à l'écran titre (15 s de compte à rebours, un geste l'annule). Touche F11 pour le plein écran.

## Robustesse

> Historique : ces contrôles du prompt 12 portaient sur les 10 pages Astro de la vitrine, retirées depuis.
> Ils ne valent plus pour le jeu : la checklist du jeu est dans `jeu/10-accessibilite-robustesse.md`
> et `todo.md` (à repasser au preflight J3).

Contrôles du prompt 12 (livret, sections 13 et 14), effectués le 10/11/2026 sur les 10 pages
(accueil, œuvres, page œuvre, catalogue, statistiques, méthode, corpus, données, crédits, 404).

| Contrôle | Résultat |
|---|---|
| Contraste texte / fond ≥ 4,5:1 (3:1 pour les grands titres), mesuré sur chaque élément de texte visible | ✅ aucune erreur |
| `lang="fr"`, un seul `<h1>` par page, pas de saut de niveau de titre | ✅ |
| Titres de page uniques | ✅ 10 titres différents |
| Images avec `alt`, liens et boutons avec un nom | ✅ |
| Tableaux avec `<th scope>` | ✅ |
| Navigation clavier : lien « Aller au contenu », focus visible (contour 3 px), filtres et boutons utilisables | ✅ |
| Aucune animation si l'utilisateur la refuse (`prefers-reduced-motion`) ; aucun flash ni effet stroboscopique | ✅ |
| Contenu lisible sans JavaScript (rendu statique) ; sur `/donnees/`, message explicite à la place des valeurs | ✅ |
| API coupée : `/donnees/` affiche les instantanés locaux avec « Données locales du JJ/MM/AAAA » | ✅ testé |
| Aucun appel aux API au build ni dans une boucle de rendu | ✅ |
| Assets via `import.meta.env.BASE_URL`, aucune image cassée | ✅ |
| Aucune clé, aucun token, aucun secret dans le code | ✅ |
| 1920×1080 et mobile (375 px) : aucun débordement horizontal | ✅ |
| Console sans erreur continue | ✅ |
| `rm -rf dist && npm run build` régénère le site proprement | ✅ |

Corrections apportées lors de ce contrôle :

- le contenu principal (`<main>`), cible du lien « Aller au contenu », ne s'entoure plus d'un cadre de focus sur toute la page.

Non consignés dans le dépôt à la clôture du projet (15/11/2026) : un audit Lighthouse dans le navigateur
et un test réel Wi-Fi coupé sur la machine d'exposition.

## Fallback / limites

- Sans réseau ou si une API est en panne : le jeu bascule sur une semaine enregistrée (`data/fallback.json`) avec l'indicateur « mode hors ligne » ; `/cartel/` est statique.
- Les instantanés `public/data/fallback/` vieillissent : relancer `node scripts/snapshot.mjs` avant l'exposition si on les utilise.
- Le jeu utilise des chemins relatifs (`./`) : `public/index.html` et `dist/index.html` s'ouvrent aussi par double clic.

## Déploiement et QR codes

- URL canonique : https://workshop-design-interactions.pages.dev/ (Cloudflare Pages, racine du domaine, `base: '/'`).
- Le workflow `.github/workflows/tests.yml` (prompt 210) construit `site/` et lance `npm test` (smoke, jeu, navigateur Chromium) à chaque push ; il ne publie rien. Le mécanisme de publication Cloudflare est [À COMPLÉTER] (voir `todo.md`). Le diaporama (`public/presentation/`) n'est plus reconstruit par `prebuild` : `npm run build:slides` à la demande.
- QR codes dans `public/assets/` : `qr-edition.png` (accueil, crédits) et `qr-{slug}.png` (page de chaque œuvre). Pour en régénérer un :

  ```sh
  qrencode -o public/assets/qr-edition.png -s 20 -m 2 -l M "https://workshop-design-interactions.pages.dev/"
  qrencode -o public/assets/qr-pxe-nte001-g01-w01.png -s 20 -m 2 -l M "https://workshop-design-interactions.pages.dev/cartel/"
  ```

  Les PNG actuels pointent vers l'URL canonique (régénérés au commit dea5dc4 ; identiques octet pour octet à la sortie de ces commandes, vérifié le 12/11/2026). Aucun test au téléphone en conditions réelles n'est consigné dans le dépôt à la clôture du projet (15/11/2026).

## Coquille Astro (choix du prompt 33)

Le build produisait « 0 page(s) built » : seule restait la collection `oeuvres`. Option retenue,
la moins risquée : **conserver le registre et en générer une page**, `src/pages/cartel.astro` → `/cartel/`
(cartel, source, droits, règle, fallback de chaque œuvre, lus dans `src/content/oeuvres/`). Aucune
dépendance, aucun JavaScript client, le jeu `public/index.html` n'est pas touché, et le schéma
`content.config.ts` continue de bloquer le build si une fiche est incomplète. Supprimer la collection
aurait effacé la seule source machine-readable du cartel et de l'identifiant `PXE-NTE001-G01-W01`.

## Contributions

Établi à partir de l'historique git de `main` au 15/11/2026. Comptes rattachés par le groupe (12/11/2026) :
ArtistDev44, Vibe Nuage Agent et Skyfe → Guillaume ; matteobvt49-code → Mattéo. Détail prompt par prompt :
https://workshop-design-interactions.pages.dev/making-of/ (`prompts/auteurs.json`).

**Mattéo Brevet** — 89 commits, 56 fusions dans `main`, 29 fichiers de prompts ajoutés.
- Site de l'édition (09/11) : prompts 01 à 13 exécutés (projet Astro, layout et design system, accueil, registre
  et schéma des œuvres, galerie, page œuvre, cartel et 404, statistiques, pages Méthode / Corpus / Crédits,
  données vivantes, contrôles d'accessibilité, QR codes) ; audit des API Open Data Nantes Métropole
  (`contexte/audit-api-open-data-nantes.md`).
- Fondations du jeu (10/11) : prompts 14 à 19 et 21 à 24 (sources et données, écrans, boucle, effets et jauges,
  contrôles, fins, PC et bureau en pixel art, jauges fluidité / réputation / budget, économie, jeu en français et
  anglais), prompts 64 (la Carte devient l'appli principale) et 67 (fin de journée de nuit).
- Applications du PC et gameplay (11–12/11) : prompts 84 à 93 (rappel à l'ordre et licenciement, Community,
  Messages du patron, décisions sans chrono, progression, Journal de bord, notifications, textes d'enquête, textes
  hors de leur case), 101 à 111 (applis désencombrées, carte des alertes réelles, appli unique, bureau qui se
  remplit, carte interactive, équipes et trajets, géocodage OpenStreetMap, palettes), 114 à 119 (réponses au
  plaignant, clash, plaignants désagréables, incidents fictifs marqués) ; correctif de l'écran figé.
- Logo : planche des quatre pistes (prompts 120 et 126, dossier `logo/`).

**Guillaume Renoult** — 410 commits (ArtistDev44 354, Vibe Nuage Agent 37, Skyfe 19), 204 fusions dans `main`,
188 fichiers de prompts ajoutés.
- Cadrage (09/11) : création du dépôt, `todo.md` aligné sur le livret, livret et framework dans `contexte/`,
  `notes.md`, extraction du design system, décisions de jeu Q1 à Q61 verrouillées dans `jeu/` avant le code
  (titre, fins, seuils, table des effets 1d6), découpage du prompt 14, prompts 01 à 34 écrits.
- Jeu (10–15/11) : prompt 20 (immersion), puis la majorité des prompts 25 à 231 — sauvegarde, mode histoire,
  dix fins de posture et fins en trois séquences, mails du patron et lettres, animations, son, icônes,
  accessibilité et audits de textes, mode développeur.
- Qualité : tests automatisés (`site/scripts/`, 142 commits : smoke test, test du jeu, test navigateur) et
  workflow `tests.yml`.
- Exposition et documentation : captation et cartel, bande-annonce (`trailer/`), diaporama (`slides/`), kit de
  presse, image Open Graph, page making-of, `journal.md`, audits, `note-eval.md`, README et « Conformité au brief ».

## AI usage

Constat observable dans le dépôt (10/11/2026) : le site et le jeu ont été produits en grande partie par
des assistants IA exécutant les prompts numérotés de `prompts/` (site Astro, jeu p5.js, docs `jeu/`,
smoke test, ce README). L'historique git en garde la trace : des commits portent la mention
`Co-Authored-By: Claude` (Anthropic) et d'autres sont signés par un compte d'agent (« Vibe Nuage Agent »).
Les décisions de jeu (Q1–Q61, `jeu/`) et les prompts ont été rédigés en amont ; les données sont réelles.
Part humaine, d'après l'historique git (15/11/2026) : 480 des 499 commits hors fusions de `main` portent une marque
d'IA (`Co-Authored-By: Claude` ou `Mistral Vibe`, ou compte « Vibe Nuage Agent ») ; les 19 sans marque (compte Skyfe)
couvrent le cadrage : création du dépôt, `todo.md` aligné sur le livret, livret dans `contexte/`, prompts 20, 197
et 199. Le groupe a commandé chaque étape par un prompt numéroté (217 fichiers : Guillaume 188, Mattéo 29),
choisi la source, verrouillé les décisions de jeu Q1 à Q61 avant le code, validé chaque étape par une fusion
dans `main` (260 fusions : Guillaume 204, Mattéo 56) et demandé des corrections, notées dans les commits
(ex. « suppression de la fenêtre “Votre poste” (suite du prompt 183, demande du groupe) »). L'historique ne
montre pas les relectures ou réécritures faites à la main hors commit.

## Sources / droits

- Données : Open Data Nantes Métropole : GTFS Naolib — ODbL, éditeur Semitan ; GTFS-RT et agenda — Licence Ouverte (vérifié le 14/11/2026) ; OpenStreetMap (`data/lieux.json`) — ODbL ; Open-Meteo — CC BY 4.0 (vérifié le 10/11/2026, attribution requise) ; jeux du prompt 11 (dont Air Pays de la Loire) — Licence Ouverte ou ODbL selon le jeu (champ `licence` de `src/lib/datasets.js`).
- Code : licence MIT (Mattéo Brevet & Guillaume Renoult), voir `LICENSE` à la racine.
- Textes : framework PATRIMOINE.EXE et livret étudiant Nantes 001 (ESD Nantes, 2026).
- Design : couleurs et échelle inspirées des tokens extraits de metropole.nantes.fr ; ce site n'est pas un site officiel de Nantes Métropole.

## Livrables J3 (prompt 46)
- Pages : le jeu (`/`), les cartels avec captation et QR codes (`/cartel/`), la chaîne des prompts générée depuis `prompts/README.md` (`/making-of/`).
- `public/manifest.json` (modèle du livret), `public/captures/` (hero, detail-01, process, thumb, demo.mp4 de 29 s, issus du vrai rendu ; `hero.jpg`, `detail-01.jpg` et `thumb.jpg` refaites le 12/11 au soir sur le jeu actuel), `public/captures/trailer.mp4` (trailer de 30 s, prompt 187, hors précache), kit de presse `/kit-presse/` (prompt 188).
- Version figée : `rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/` (à la racine du dépôt).
- Ajouter une semaine, un message ou une traduction : `CONTRIBUTING.md` (racine).
