# Prompt 03 — Structure de dossiers conforme au toolkit PATRIMOINE.EXE

## Objectif
Organiser le projet Astro selon l'architecture du toolkit (framework, section 09 :
« Deploy without diluting ») et la structure de rendu du livret (section 11).

## Contexte
Le site est dans le sous-dossier `site/` du dépôt. La racine du dépôt contient déjà
`README.md`, `journal.md` (journal unique des pushes), `todo.md`, `contexte/`,
`prompts/`, `design-system/` et `jeu/` : **ne pas les dupliquer dans `site/`**.

## Instructions
Créer l'arborescence suivante (dossiers vides : y placer un `.gitkeep`) :

```
workshop-design-interactions/        (racine du dépôt — ne pas modifier ici)
├── journal.md                       (journal UNIQUE, mis à jour à chaque push)
└── site/
    ├── astro.config.mjs
    ├── package.json
    ├── README.md                    (README du site, complété au prompt 13)
    ├── public/
    │   ├── assets/                  (favicon, QR codes)
    │   ├── oeuvres/{slug}/          (captations : hero.jpg, detail-01.jpg, process.jpg,
    │   │                             thumb.jpg, demo.mp4 — et l'œuvre p5.js, prompts 14–19)
    │   └── data/fallback/           (instantanés JSON des API, prompt 11)
    ├── scripts/                     (scripts Node lancés à la main, jamais au build)
    └── src/
        ├── pages/                   (routes du site)
        ├── layouts/                 (Layout.astro principal)
        ├── components/              (Header, Footer, CarteOeuvre, Cartel…)
        ├── content/oeuvres/         (un JSON par œuvre, ex. pxe-nte001-g01-w01.json)
        ├── data/edition.json        (registre de l'édition NTE001)
        ├── lib/                     (accès aux données, prompt 11)
        ├── content.config.ts        (collection « oeuvres », prompt 06)
        └── styles/                  (global.css)
```

Règles :
- Une seule source pour les œuvres : `src/content/oeuvres/` (collection Astro).
- Assets de `public/` toujours référencés via `import.meta.env.BASE_URL`.
- Aucun fichier sensible (clé, `.env` avec secret) n'est commité ; ajouter `.env*`
  au `.gitignore` de `site/` si absent.

## Vérifications
- L'arborescence existe comme ci-dessus, sans second `journal.md`.
- `npm run dev` fonctionne toujours après création des dossiers.
