# workshop-design-interactions

Dépôt de l'atelier **PATRIMOINE.EXE · NTE001** — ESD Nantes, B3 Design — 9, 10 & 12 novembre 2026. Intervenant : Kamel Ghabte. Groupes de 2 à 3 étudiants.

Site web de travail à rendre : un **site Astro statique** dans [`site/`](site/) présentant l'édition, son corpus patrimonial nantais et les œuvres des étudiants, accompagné d'un **jeu p5.js** décrit dans [`jeu/`](jeu/).

## Chaîne à tenir

**source → grammaire → système → œuvre**

Une source réelle avant un style. Un système stable avant une technologie supplémentaire. Un mapping justifié avant une API. Une œuvre exposable avant une démonstration de code.

## Contenu du dépôt

| Chemin | Rôle |
|---|---|
| [`contexte/`](contexte/) | Livret étudiant, framework international PATRIMOINE.EXE, règles de travail, audit des API Open Data Nantes Métropole |
| [`prompts/`](prompts/) | 14 prompts numérotés à exécuter dans l'ordre pour créer le site Astro de l'édition |
| [`site/`](site/) | Site Astro statique de l'édition (commandes `npm` dans `site/`, seule dépendance : `astro`) |
| [`jeu/`](jeu/) | Jeu p5.js « Nantes en régulation » décrit fichier par fichier (concept, boucle, API, actions, jauges, UI, fallback, raccourcis) |
| [`design-system/`](design-system/) | Référentiel visuel (`DESIGN.md`, tokens) extrait de metropole.nantes.fr |
| [`todo.md`](todo.md) | Protocole des 3 jours, jalons, checklist de robustesse et barème |
| [`journal.md`](journal.md) | Journal des pushes — une ligne par push, la plus récente en tête |
| [`notes.md`](notes.md) | Page wiki, liens des API utilisées, pistes d'animation |
| [`CLAUDE.md`](CLAUDE.md) | Règles courtes pour l'assistant IA |

## Lancer le site de l'édition

```bash
cd site
npm install
npm run dev     # développement
npm run build   # build statique (vérification : build, pas captures d'écran)
```

Le site est rendu statique, sans appel réseau : il reste relançable hors ligne grâce aux instantanés réels dans `site/public/data/fallback/`. Base GitHub Pages : `/workshop-design-interactions/patrimoine-exe/nantes/001/` (liens et assets via `import.meta.env.BASE_URL`).

## Règles de travail

- Langue de travail : **français**.
- Exécuter les `prompts/NN-*.md` un par un, dans l'ordre, en vérifiant avant de passer au suivant.
- Aucune donnée, œuvre ou source inventée : inconnu → `"[À COMPLÉTER]"`.
- Aucun secret, clé ou token dans le code.
- Accessibilité : contraste ≥ 4,5:1, navigation clavier, `prefers-reduced-motion`, pas de flash.
- À chaque push : une ligne en tête du tableau de [`journal.md`](journal.md) (date, commit, fichiers, résumé).
- Travailler sur une branche ; fusionner dans `main` sur demande.
