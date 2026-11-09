# Prompt 03 — Structure de dossiers conforme au toolkit PATRIMOINE.EXE

## Objectif
Organiser le projet Astro selon l'architecture du toolkit (framework, section 09 :
« Deploy without diluting ») et la structure de rendu du livret (section 11).

## Instructions
Créer l'arborescence suivante à la racine du projet :

```
PXE_NTE001_SITE/
├── astro.config.mjs
├── package.json
├── README.md                  (sera complété au prompt 12)
├── public/
│   └── assets/                (images, QR codes, favicon — chemins relatifs)
├── src/
│   ├── pages/                 (routes du site)
│   ├── layouts/               (Layout.astro principal)
│   ├── components/            (Header, Footer, CarteOeuvre, Cartel, etc.)
│   ├── data/
│   │   ├── edition.json       (registre de l'édition NTE001)
│   │   └── oeuvres/           (un JSON par œuvre, ex. g01-w01.json)
│   ├── content/               (collection Astro « oeuvres » si utilisée)
│   └── styles/                (global.css)
└── dist/                      (généré par le build)
```

Règles :
- Tous les assets servis depuis `public/` sont référencés par des **chemins relatifs**
  compatibles avec `base` (utiliser `import.meta.env.BASE_URL`).
- Aucun fichier sensible (clé, `.env` avec secret) n'est commité ; ajouter `.env*`
  au `.gitignore` si besoin.

## Vérifications
- L'arborescence existe exactement comme ci-dessus.
- `npm run dev` fonctionne toujours après création des dossiers.
