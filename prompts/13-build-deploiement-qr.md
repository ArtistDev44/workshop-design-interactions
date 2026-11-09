# Prompt 13 — Build, déploiement GitHub Pages, README et QR code

## Objectif
Finaliser le site : build propre, déploiement sur GitHub Pages (URL de l'édition),
README complet au format du livret, et QR codes pointant vers le site en ligne.

## Contexte
- URL finale (prompt 02) :
  `https://artistdev44.github.io/workshop-design-interactions/patrimoine-exe/nantes/001/`.
- Le site est dans `site/` : le déploiement doit construire **ce sous-dossier**.
- Le site appelle les API Open Data **dans le navigateur uniquement** (prompt 11), avec
  instantanés locaux en secours ; aucun appel au build.

## Prérequis à faire par un humain (l'assistant ne peut pas le faire)
Sur GitHub : dépôt → **Settings → Pages → Build and deployment → Source :
« GitHub Actions »**. Le dépôt doit être public (c'est le cas).

## Instructions
1. Build final dans `site/` : `npm run build`, vérifier `dist/` (toutes les pages
   présentes, liens préfixés par la `base`).
2. Déploiement par **GitHub Actions** (aucune dépendance ajoutée au projet) : créer
   `.github/workflows/deploy.yml` **à la racine du dépôt** qui, à chaque push sur
   `main` touchant `site/**` :
   - utilise `actions/checkout`, `actions/setup-node` (version de `site/package.json`
     → `engines`), `npm ci` et `npm run build` avec `working-directory: site` ;
   - publie `site/dist` avec `actions/upload-pages-artifact` puis
     `actions/deploy-pages` (permissions `pages: write`, `id-token: write`).
3. QR codes (sans ajouter de dépendance au site) : générer les images une seule fois
   en ligne de commande avec `npx --yes qrcode -o <fichier> <url>` (outil téléchargé
   ponctuellement, absent de `package.json`) :
   - `site/public/assets/qr-edition.png` → URL de l'édition, affiché sur l'accueil et
     la page Crédits ;
   - `site/public/assets/qr-{slug}.png` → URL de chaque œuvre (cartel, prompt 08).
   **Tester le scan avec un téléphone en conditions réelles** (todo.md, J3).
4. `site/README.md` au format du livret : Auteurs, Édition, Concept, Stack (Astro,
   rendu statique), Données (registre local + API Open Data Nantes Métropole appelées
   côté navigateur, instantanés `public/data/fallback/` régénérés par
   `node scripts/snapshot.mjs`), Lancer le projet (`cd site`, `npm install`,
   `npm run dev`, `npm run build`, `npm run preview`), Fallback / limites,
   Robustesse (prompt 12), Contributions, AI usage (3 à 5 lignes), Sources / droits
   (licences Licence Ouverte / ODbL des jeux utilisés).
5. Ne committer aucun secret ; vérifier `git status` avant chaque commit. À chaque
   push, ajouter une entrée dans `journal.md` **à la racine du dépôt** : date, SHA du
   commit, fichiers modifiés, résumé.

## Vérifications
- L'onglet **Actions** du dépôt montre le déploiement réussi.
- Le site en ligne répond à l'URL de l'édition, avec styles et images, et affiche la
  galerie, au moins une page œuvre et `/donnees/`.
- Le QR code scanné ouvre bien la page en ligne.
- Le README permet à une autre personne de relancer le projet localement.
