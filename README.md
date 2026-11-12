# PATRIMOINE.EXE · NTE001

**Nantes, novembre 2026.** Un atelier de design (ESD Nantes, B3) devenu terrain de jeu :
un site web statique dédié au patrimoine nantais, et un jeu où chaque incident réel du
réseau de transports devient un dossier à trancher sous pression.

🎮 [**Jouer à « Nantes en régulation »**](https://workshop-design-interactions.pages.dev/) — le jeu est servi à la racine du site déployé
📖 [**Découvrir le projet en détail**](#explorer-le-dépôt) — site de l'édition, corpus patrimonial, œuvres des étudiant·es

## 🎮 Le jeu — « Nantes en régulation »

Façon *Paper Please*, vous rejouez **une semaine réelle du réseau de transports nantais**
(tram, bus) depuis une salle de contrôle. Hormis au plus un incident fictif par semaine, marqué « Fictif », aucun événement n'est inventé : les retards
réels du flux GTFS-RT de Naolib (seuil : 10 min, en temps réel), les perturbations datées des archives et les alertes météo d'Open-Meteo de la
semaine choisie deviennent vos dossiers à trancher.

- **~15 décisions** sous compte à rebours, avec 3 actions + « ne rien faire »
- **3 jauges** à préserver : fluidité du réseau, réputation de la salle de contrôle, budget (depuis le prompt 22, qui a remplacé la satisfaction des usagers)
- **Plusieurs fins** selon le bilan des jauges
- Ambiance immersive : bureau en pixel art, PC qui démarre, SMS, journaux, horloge accélérée…
- **Jouable 100 % hors ligne** grâce à un jeu de données de secours (`site/public/data/fallback/`)

### Jouer maintenant

| Où | Comment |
|---|---|
| En ligne | [Site déployé](https://workshop-design-interactions.pages.dev/), jeu à la racine |
| Hors ligne, sans rien installer | Ouvrir [`site/public/index.html`](site/public/index.html) dans un navigateur (double-clic, aucun réseau requis) |
| Depuis les sources | `cd site && npm install && npm run dev` |

Raccourcis clavier et réglages (difficulté, durée, accessibilité) :
[`jeu/08-raccourcis.md`](jeu/08-raccourcis.md) et [`jeu/09-parametres.md`](jeu/09-parametres.md).

## 🌐 Le site de l'édition

Site **Astro 100 % statique** (seule dépendance : `astro`). Depuis le 10/11/2026, le jeu
est servi à la racine et les pages de la vitrine (galerie, statistiques, `/donnees/`…) ont été
retirées. Reste le registre machine-readable de l'édition (`site/src/content/oeuvres/`), validé
au build, d'où est générée la page [**`/cartel/`**](https://workshop-design-interactions.pages.dev/cartel/)
(cartel, source, droits, règle). Relançable hors ligne ; `npm test` vérifie scripts, données et
absence de secret. Détails : [`site/README.md`](site/README.md).

## La chaîne à tenir

**source → grammaire → système → œuvre**

Une source réelle avant un style. Un système stable avant une technologie supplémentaire.
Un mapping justifié avant une API. Une œuvre exposable avant une démonstration de code.

## Explorer le dépôt

| Chemin | Rôle |
|---|---|
| [`site/`](site/) | Site Astro statique de l'édition + jeu p5.js servi à la racine (`public/index.html`) |
| [`slides/`](slides/) | Présentation du projet (Slidev, prompt 82) : `slides/slides.md`, construite dans `site/public/presentation/` et servie à `/presentation/` |
| [`jeu/`](jeu/) | Spec du jeu « Nantes en régulation », fichier par fichier (concept, boucle, API, actions, jauges, UI, fallback, raccourcis…) |
| [`prompts/`](prompts/) | 104 prompts numérotés (01 à 101, deux prompts 33, deux prompts 89 et deux prompts 94) pour construire le site et le jeu pas à pas, dans l'ordre ; statut de chacun dans [`prompts/README.md`](prompts/README.md) |
| [`contexte/`](contexte/) | Livret étudiant, framework international PATRIMOINE.EXE, règles de travail, audit des API Open Data Nantes Métropole |
| [`design-system/`](design-system/) | Référentiel visuel (`DESIGN.md`, tokens) extrait de metropole.nantes.fr |
| [`todo.md`](todo.md) | Protocole des 3 jours, jalons, checklist de robustesse et barème |
| [`journal.md`](journal.md) | Journal des pushes — une ligne par push, la plus récente en tête |
| [`notes.md`](notes.md) | Liens des API utilisées, pistes d'animation |
| [`CLAUDE.md`](CLAUDE.md) | Règles courtes pour l'assistant IA |
| [`LICENSE`](LICENSE) | Licence du code (MIT, Mattéo Brevet & Guillaume Renoult) et rappel des licences des données |

## 🔧 Coulisses de l'atelier (étudiant·es)

Atelier **PATRIMOINE.EXE · NTE001** — ESD Nantes, B3 Design — 9, 10 & 12 novembre 2026.
Intervenant : Kamel Ghabte. Groupes de 2 à 3 étudiant·es.

- Langue de travail : **français**.
- Lancer le site : `cd site && npm install`, puis `npm run dev` (développement), `npm run build` (build statique) ou `npm test` (smoke test sans dépendance). Site servi à la racine du domaine (`base: '/'`) : URL canonique https://workshop-design-interactions.pages.dev/ (Cloudflare Pages). L'ancienne adresse GitHub Pages (`artistdev44.github.io/…/patrimoine-exe/nantes/001/`) est historique et renvoie une 404.
- Exécuter les `prompts/NN-*.md` un par un, dans l'ordre, en vérifiant avant de passer au suivant.
- Aucune donnée, œuvre ou source inventée : inconnu → `"[À COMPLÉTER]"`.
- Aucun secret, clé ou token dans le code.
- Accessibilité : contraste ≥ 4,5:1, navigation clavier, `prefers-reduced-motion`, pas de flash.
- À chaque push : une ligne en tête du tableau de [`journal.md`](journal.md) (date, commit, fichiers, résumé).
- Travailler sur une branche ; fusionner dans `main` sur demande.

## Crédits et fiction

Jeu « Nantes en régulation » : Mattéo Brevet & Guillaume Renoult (code sous licence MIT, voir `LICENSE`).
**Fiction de jeu** : le réseau social « Quai », le compte « Régul' Nantes · salle de contrôle » (@regul.nte), le
patron, Camille et les usagers à pseudonyme sont inventés pour le jeu. Ce projet n'est affilié à aucun
transporteur ni à aucune collectivité ; les données (incidents, météo, agenda) restent réelles et sourcées.
