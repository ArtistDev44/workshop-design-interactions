# Site de l'édition PATRIMOINE.EXE · NTE001

Site statique (Astro) de l'édition Nantes 001 — ESD Nantes, B3 Design, 9, 10 & 12 novembre 2026.

**En ligne (URL canonique) :** https://workshop-design-interactions.pages.dev/ — le jeu « Nantes en régulation » est servi à la racine ; cartel de l'œuvre : https://workshop-design-interactions.pages.dev/cartel/

> Historique : l'ancienne adresse GitHub Pages (`https://artistdev44.github.io/workshop-design-interactions/patrimoine-exe/nantes/001/`) renvoie une 404 (vérifié le 10/11/2026). Elle n'apparaît plus que dans les prompts 02, 08 et 13 (note historique en tête de chacun) et dans les anciennes lignes de `journal.md`.

## Auteurs

[À COMPLÉTER : noms et rôles des membres du groupe — saisie humaine attendue, voir `todo.md`]

## Édition

PATRIMOINE.EXE · NTE001 — édition pilote STUDIO, Nantes, France. Institution hôte : ESD Nantes (B3 Design).
Direction de l'édition : Kamel Ghabte.

## Concept

Le site **est** l'œuvre : le jeu p5.js « Nantes en régulation » (`public/index.html`) est servi
à la racine. Les pages Astro de la vitrine (galerie, statistiques, méthode, `/donnees/`…) ont été
retirées le 10/11/2026 quand le jeu est passé à la racine (voir `journal.md`). Il reste le
registre machine-readable `src/content/oeuvres/*.json`, validé au build, d'où est générée la seule
page Astro : **`/cartel/`**. Le tout rend lisible la chaîne **source → grammaire → système → œuvre**.

## Stack

- [Astro](https://astro.build) 7, rendu **100 % statique** (seule dépendance : `astro`).
- CSS maison d'après `design-system/DESIGN.md` (sans police externe), JavaScript natif.
- Validation du registre par schéma (`astro/zod`) : une fiche d'œuvre incomplète bloque le build.
- Déploiement : URL canonique sur Cloudflare Pages. ⚠ Incohérence connue : `.github/workflows/deploy.yml` utilise les actions **GitHub Pages** (`upload-pages-artifact`, `deploy-pages`), dont l'adresse renvoie une 404 ; la façon dont Cloudflare Pages construit le site n'est pas documentée dans le dépôt ([À COMPLÉTER], voir `todo.md`).
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

À faire par l'équipe : un audit Lighthouse dans le navigateur avant l'exposition, et un test réel
Wi-Fi coupé sur la machine d'exposition.

## Fallback / limites

- Sans réseau ou si une API est en panne : le jeu bascule sur une semaine enregistrée (`data/fallback.json`) avec l'indicateur « mode hors ligne » ; `/cartel/` est statique.
- Les instantanés `public/data/fallback/` vieillissent : relancer `node scripts/snapshot.mjs` avant l'exposition si on les utilise.
- Le jeu utilise des chemins relatifs (`./`) : `public/index.html` et `dist/index.html` s'ouvrent aussi par double clic.

## Déploiement et QR codes

- URL canonique : https://workshop-design-interactions.pages.dev/ (Cloudflare Pages, racine du domaine, `base: '/'`).
- Le workflow `.github/workflows/deploy.yml` construit `site/` à chaque push sur `main` et publie sur **GitHub Pages** — adresse en 404, donc sans effet visible ; le mécanisme de publication Cloudflare est [À COMPLÉTER] (voir `todo.md`).
- QR codes dans `public/assets/` : `qr-edition.png` (accueil, crédits) et `qr-{slug}.png` (page de chaque œuvre). Pour en régénérer un :

  ```sh
  qrencode -o public/assets/qr-edition.png -s 20 -m 2 -l M "https://workshop-design-interactions.pages.dev/"
  qrencode -o public/assets/qr-pxe-nte001-g01-w01.png -s 20 -m 2 -l M "https://workshop-design-interactions.pages.dev/cartel/"
  ```

  Les PNG actuels pointent vers l'URL canonique (régénérés au commit dea5dc4 ; identiques octet pour octet à la sortie de ces commandes, vérifié le 12/11/2026). Reste à les tester avec un téléphone en conditions réelles avant l'exposition.

## Coquille Astro (choix du prompt 33)

Le build produisait « 0 page(s) built » : seule restait la collection `oeuvres`. Option retenue,
la moins risquée : **conserver le registre et en générer une page**, `src/pages/cartel.astro` → `/cartel/`
(cartel, source, droits, règle, fallback de chaque œuvre, lus dans `src/content/oeuvres/`). Aucune
dépendance, aucun JavaScript client, le jeu `public/index.html` n'est pas touché, et le schéma
`content.config.ts` continue de bloquer le build si une fiche est incomplète. Supprimer la collection
aurait effacé la seule source machine-readable du cartel et de l'identifiant `PXE-NTE001-G01-W01`.

## Contributions

[À COMPLÉTER : contributions nominatives et précises de chaque membre — pas de passager invisible ; saisie humaine attendue. Les commits par compte se listent avec `git shortlog -sn --all`.]

## AI usage

Constat observable dans le dépôt (10/11/2026) : le site et le jeu ont été produits en grande partie par
des assistants IA exécutant les prompts numérotés de `prompts/` (site Astro, jeu p5.js, docs `jeu/`,
smoke test, ce README). L'historique git en garde la trace : des commits portent la mention
`Co-Authored-By: Claude` (Anthropic) et d'autres sont signés par un compte d'agent (« Vibe Nuage Agent »).
Les décisions de jeu (Q1–Q61, `jeu/`) et les prompts ont été rédigés en amont ; les données sont réelles.
[À COMPLÉTER par l'équipe : ce qui a été relu, réécrit et testé par vous.]

## Sources / droits

- Données : Open Data Nantes Métropole (Naolib GTFS / GTFS-RT, agenda) — Licence Ouverte ; Open-Meteo — CC BY 4.0 (vérifié le 10/11/2026, attribution requise) ; jeux du prompt 11 (dont Air Pays de la Loire) — Licence Ouverte ou ODbL selon le jeu (champ `licence` de `src/lib/datasets.js`).
- Code : licence MIT (Mattéo Brevet & Guillaume Renoult), voir `LICENSE` à la racine.
- Textes : framework PATRIMOINE.EXE et livret étudiant Nantes 001 (ESD Nantes, 2026).
- Design : couleurs et échelle inspirées des tokens extraits de metropole.nantes.fr ; ce site n'est pas un site officiel de Nantes Métropole.

## Livrables J3 (prompt 46)
- Pages : le jeu (`/`), les cartels avec captation et QR codes (`/cartel/`), la chaîne des prompts générée depuis `prompts/README.md` (`/making-of/`).
- `public/manifest.json` (modèle du livret), `public/captures/` (hero, detail-01, process, thumb, demo.mp4 de 29 s, issus du vrai rendu).
- Version figée : `rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/` (à la racine du dépôt).
- Ajouter une semaine, un message ou une traduction : `CONTRIBUTING.md` (racine).
