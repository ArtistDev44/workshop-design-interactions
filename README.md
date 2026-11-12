# PATRIMOINE.EXE · NTE001

**Nantes, novembre 2026.** Un atelier de design (ESD Nantes, B3) devenu terrain de jeu :
un site web statique dédié au patrimoine nantais, et un jeu où chaque incident réel du
réseau de transports devient un dossier à trancher sous pression.

🎮 [**Jouer à « Nantes en régulation »**](https://workshop-design-interactions.pages.dev/) — le jeu est servi à la racine du site déployé
📖 [**Découvrir le projet en détail**](#explorer-le-dépôt) — site de l'édition, corpus patrimonial, œuvres des étudiant·es

## ✅ Conformité au brief

**Nantes en régulation répond point par point au livret PATRIMOINE.EXE · Nantes 001** : chaque obligation du
projet final et chaque livrable de « Ce que chaque groupe remet » a sa preuve dans le dossier rendu [`rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/`](rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/). La chaîne demandée
est tenue de bout en bout : **source réelle → grammaire écrite → système p5.js → œuvre jouable et exposable**.

| Exigence du livret | Ce que nous avons fait | Preuve |
|---|---|---|
| Source patrimoniale identifiable et documentée | Le réseau Naolib de Nantes Métropole à travers ses données ouvertes (offre GTFS, perturbations datées, temps réel), avec la météo et la Loire | rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/`source-sheet.md` / `.pdf` (contexte, provenance, droits, relevés, propriétés observables) |
| Grammaire explicite, au moins une règle structurante | *Un fait daté de la source devient un dossier à trancher* ; fiche du livret remplie (7 champs), invariants, variables, espace génératif à graine fixe | rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/`grammar.md` / `.pdf` |
| Prototype fonctionnel lançable dans un navigateur | Double clic sur `index.html`, hors ligne compris ; en ligne sur https://workshop-design-interactions.pages.dev/ | rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/`index.html` · rubrique « Lancer le projet » |
| Au moins trois paramètres réellement opérants | Semaine rejouée, difficulté (signalements simultanés, aggravation, budget), mode en ligne / hors ligne, défi chrono | rubrique « Data / interaction » · tests `site/scripts/test-jeu.mjs` (3 semaines × 3 façons de jouer, test de difficulté) |
| Itérations documentées | 151 prompts numérotés (01 à 160) exécutés un par un, revues UX et audits suivis de corrections, une ligne par push | dossier `prompts/` et `journal.md` du dépôt |
| Test par un autre groupe | [À COMPLÉTER par le groupe : groupe testeur, 3 observations, décision prise] | — |
| Documentation pour comprendre et relancer | README aux 12 rubriques du « README minimal » | `rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/README.md` |
| Une donnée ne devient intéressante qu'après un mapping | Retard ≥ 10 min, perturbation datée ou météo au-dessus du 95ᵉ centile → dossier ; réponse → effets sur 3 jauges selon le contexte | rubrique « Data / interaction » · rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/`grammar.md` |
| Œuvre générative, pas animation aléatoire | Invariants, variables et contraintes écrits ; dé 1d6 à graine fixe par semaine (même semaine, même partie) | rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/`grammar.md` (« Espace génératif ») |
| Accessibilité de l'interaction | Tout se joue au clavier, à la souris ou au toucher ; micro et webcam seulement en option et doublés ; pas de flash ; sons non indispensables ; tutoriel intégré | rubrique « Data / interaction » · audit des textes à 0 défaut (3 tailles d'écran, FR / EN) |
| Webcam : présence et responsabilité | Images réduites à 48 × 27, jamais affichées, enregistrées ni envoyées ; webcam inactive tant que le joueur ne l’active pas dans les réglages, puis accord du navigateur | `site/public/webcam.js` |
| Livrable : projet lançable | `index.html` + scripts + assets + `data/fallback.json` | `rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/` |
| Livrable : fiche-source et grammaire | `.md` et `.pdf` | rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/`source-sheet.pdf` · rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/`grammar.pdf` |
| Livrable : README | Concept, stack, lancement, mapping, fallback, contributions, IA, sources et droits | `rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/README.md` |
| Livrable : manifest | Métadonnées de l'édition (framework, édition, ville, dates, auteurs, source, stack, données, IA, licence) | rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/`manifest.json` |
| Livrable : cartel | 113 mots (80–120 demandés) + source + système + données | rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/`cartel.md` · page https://workshop-design-interactions.pages.dev/cartel/ |
| Livrable : captation | `hero.jpg`, `detail-01.jpg`, `process.jpg`, `thumb.jpg`, `demo.mp4` de 29 s (20–30 s demandées), vrai rendu du jeu | `rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/` |
| Livrable : présentation | Diaporama de démonstration et de défense | https://workshop-design-interactions.pages.dev/presentation/ |
| Structure de dossier recommandée | `PXE_NTE001_G01_NANTES-EN-REGULATION/` au nommage et au contenu du livret | `rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/` |

Le livret le rappelle : *la complexité n'est pas un critère de qualité*. Les API, le temps réel et les options
micro / webcam ne sont là que parce qu'ils servent la règle : rejouer de vrais faits du réseau, sans en inventer.

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
