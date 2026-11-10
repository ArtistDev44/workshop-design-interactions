# Site de l'édition PATRIMOINE.EXE · NTE001

Site statique (Astro) de l'édition Nantes 001 — ESD Nantes, B3 Design, 9, 10 & 12 novembre 2026.

**En ligne :** https://artistdev44.github.io/workshop-design-interactions/patrimoine-exe/nantes/001/

## Auteurs

[À COMPLÉTER : noms et rôles des membres du groupe]

## Édition

PATRIMOINE.EXE · NTE001 — édition pilote STUDIO, Nantes, France. Institution hôte : ESD Nantes (B3 Design).
Direction de l'édition : Kamel Ghabte.

## Concept

Le site est la vitrine publique de l'édition et son registre machine-readable : pages, galerie,
cartels, statistiques et catalogue sont générés à partir des mêmes métadonnées
(`src/data/edition.json` et `src/content/oeuvres/*.json`). Il rend lisible la chaîne
**source → grammaire → système → œuvre**.

## Stack

- [Astro](https://astro.build) 7, rendu **100 % statique** (seule dépendance : `astro`).
- CSS maison d'après `design-system/DESIGN.md` (sans police externe), JavaScript natif.
- Validation du registre par schéma (`astro/zod`) : une fiche d'œuvre incomplète bloque le build.
- Déploiement : GitHub Actions → GitHub Pages (`.github/workflows/deploy.yml`).

## Données

- **Registre local** : `src/data/edition.json` (édition) et `src/content/oeuvres/` (une fiche JSON par œuvre).
- **API Open Data Nantes Métropole** (page `/donnees/`), appelées **dans le navigateur uniquement**,
  jamais au build : 5 jeux temps réel (parkings, vélos Naolib, fluidité, indice ATMO, pollens) et
  4 jeux patrimoniaux (patrimoine arboré, collections du Musée d'arts, occupation du sol, parcs),
  listés dans `src/lib/datasets.js` avec leur phrase de mapping. Accès unique : `src/lib/nantes-api.js`.
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
```

Le site s'ouvre à `http://localhost:4321/workshop-design-interactions/patrimoine-exe/nantes/001/`.

## Robustesse

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

- Sans réseau ou si l'API est en panne : `/donnees/` affiche les instantanés locaux avec leur date ; toutes les autres pages sont statiques et ne dépendent d'aucun réseau.
- Quota de l'API : 10 000 requêtes par jour ; le site en consomme environ 830 par jour pour un écran allumé en continu (rafraîchissement 5 min à 6 h selon le jeu, pause quand l'onglet est caché).
- Les instantanés vieillissent : relancer `node scripts/snapshot.mjs` avant l'exposition.
- Le site s'ouvre via `npm run preview` ou en ligne ; ouvrir `dist/index.html` depuis le Finder ne fonctionne pas (chemins préfixés par la base).

## Déploiement et QR codes

- Chaque push sur `main` qui touche `site/` construit et publie le site (onglet **Actions** du dépôt). Prérequis : **Settings → Pages → Source : GitHub Actions**.
- Le workflow place le site sous `patrimoine-exe/nantes/001/`, copie la page 404 à la racine et redirige la racine du dépôt vers l'édition.
- QR codes dans `public/assets/` : `qr-edition.png` (accueil, crédits) et `qr-{slug}.png` (page de chaque œuvre). Pour en régénérer un :

  ```sh
  npx --yes qrcode@1.5.4 -o public/assets/qr-edition.png -w 600 -m 2 "https://artistdev44.github.io/workshop-design-interactions/patrimoine-exe/nantes/001/"
  ```

  À tester avec un téléphone en conditions réelles avant l'exposition.

## Contributions

[À COMPLÉTER : contributions nominatives et précises de chaque membre — pas de passager invisible]

## AI usage

Le site a été construit avec un assistant IA (Claude, Anthropic) à partir des prompts numérotés de `prompts/` :
structure Astro, composants, page de données, contrôles d'accessibilité, QR codes et ce README.
Les textes de méthode, de corpus et le manifeste sont repris du framework et du livret, sans contenu généré.
[À COMPLÉTER par l'équipe : ce qui a été relu, réécrit et testé par vous.]

## Sources / droits

- Données : Open Data Nantes Métropole et Air Pays de la Loire — Licence Ouverte ou ODbL selon le jeu (indiqué sur chaque carte de `/donnees/`).
- Textes : framework PATRIMOINE.EXE et livret étudiant Nantes 001 (ESD Nantes, 2026).
- Design : couleurs et échelle inspirées des tokens extraits de metropole.nantes.fr ; ce site n'est pas un site officiel de Nantes Métropole.
