# PATRIMOINE.EXE · NTE001

**Nantes, novembre 2026.** Un atelier de design (ESD Nantes, B3) devenu terrain de jeu :
un site web statique dédié au patrimoine nantais, et un jeu où chaque incident réel du
réseau de transports devient un dossier à trancher sous pression.

🎮 [**Jouer à « Nantes en régulation »**](https://artistdev44.github.io/workshop-design-interactions/patrimoine-exe/nantes/001/) — le jeu est servi à la racine du site déployé
📖 [**Découvrir le projet en détail**](#explorer-le-dépôt) — site de l'édition, corpus patrimonial, œuvres des étudiant·es

## 🎮 Le jeu — « Nantes en régulation »

Façon *Paper Please*, vous rejouez **une semaine réelle du réseau de transports nantais**
(tram, bus) depuis une salle de contrôle. Aucun événement n'est inventé : les retards
réels du flux GTFS-RT de Naolib (seuil : 10 min) et les alertes météo d'Open-Meteo de la
semaine choisie deviennent vos dossiers à trancher.

- **~15 décisions** sous compte à rebours, avec 3 actions + « ne rien faire »
- **3 jauges** à préserver : fluidité du réseau, satisfaction des usagers, réputation de la salle de contrôle
- **Plusieurs fins** selon le bilan des jauges
- Ambiance immersive : bureau en pixel art, PC qui démarre, SMS, journaux, horloge accélérée…
- **Jouable 100 % hors ligne** grâce à un jeu de données de secours (`site/public/data/fallback/`)

### Jouer maintenant

| Où | Comment |
|---|---|
| En ligne | [Site déployé](https://artistdev44.github.io/workshop-design-interactions/patrimoine-exe/nantes/001/), jeu à la racine |
| Hors ligne, sans rien installer | Ouvrir [`site/public/index.html`](site/public/index.html) dans un navigateur (double-clic, aucun réseau requis) |
| Depuis les sources | `cd site && npm install && npm run dev` |

Raccourcis clavier et réglages (difficulté, durée, accessibilité) :
[`jeu/08-raccourcis.md`](jeu/08-raccourcis.md) et [`jeu/09-parametres.md`](jeu/09-parametres.md).

## 🌐 Le site de l'édition

Vitrine publique et registre machine-readable de l'édition : présentation de l'atelier,
corpus patrimonial nantais (patrimoine arboré, parcs et jardins, collections des musées…),
galerie des œuvres des étudiant·es, cartels et statistiques du catalogue.

Site **Astro 100 % statique** (seule dépendance : `astro`) : aucun appel réseau à
l'exécution, relançable hors ligne grâce aux instantanés réels stockés dans
`site/public/data/fallback/`.

## La chaîne à tenir

**source → grammaire → système → œuvre**

Une source réelle avant un style. Un système stable avant une technologie supplémentaire.
Un mapping justifié avant une API. Une œuvre exposable avant une démonstration de code.

## Explorer le dépôt

| Chemin | Rôle |
|---|---|
| [`site/`](site/) | Site Astro statique de l'édition + jeu p5.js servi à la racine (`public/index.html`) |
| [`jeu/`](jeu/) | Spec du jeu « Nantes en régulation », fichier par fichier (concept, boucle, API, actions, jauges, UI, fallback, raccourcis…) |
| [`prompts/`](prompts/) | 32 prompts numérotés pour construire le site et le jeu pas à pas, dans l'ordre |
| [`contexte/`](contexte/) | Livret étudiant, framework international PATRIMOINE.EXE, règles de travail, audit des API Open Data Nantes Métropole |
| [`design-system/`](design-system/) | Référentiel visuel (`DESIGN.md`, tokens) extrait de metropole.nantes.fr |
| [`todo.md`](todo.md) | Protocole des 3 jours, jalons, checklist de robustesse et barème |
| [`journal.md`](journal.md) | Journal des pushes — une ligne par push, la plus récente en tête |
| [`notes.md`](notes.md) | Liens des API utilisées, pistes d'animation |
| [`CLAUDE.md`](CLAUDE.md) | Règles courtes pour l'assistant IA |

## 🔧 Coulisses de l'atelier (étudiant·es)

Atelier **PATRIMOINE.EXE · NTE001** — ESD Nantes, B3 Design — 9, 10 & 12 novembre 2026.
Intervenant : Kamel Ghabte. Groupes de 2 à 3 étudiant·es.

- Langue de travail : **français**.
- Lancer le site : `cd site && npm install`, puis `npm run dev` (développement) ou `npm run build` (build statique). Base GitHub Pages : `/workshop-design-interactions/patrimoine-exe/nantes/001/` (liens et assets via `import.meta.env.BASE_URL`).
- Exécuter les `prompts/NN-*.md` un par un, dans l'ordre, en vérifiant avant de passer au suivant.
- Aucune donnée, œuvre ou source inventée : inconnu → `"[À COMPLÉTER]"`.
- Aucun secret, clé ou token dans le code.
- Accessibilité : contraste ≥ 4,5:1, navigation clavier, `prefers-reduced-motion`, pas de flash.
- À chaque push : une ligne en tête du tableau de [`journal.md`](journal.md) (date, commit, fichiers, résumé).
- Travailler sur une branche ; fusionner dans `main` sur demande.
