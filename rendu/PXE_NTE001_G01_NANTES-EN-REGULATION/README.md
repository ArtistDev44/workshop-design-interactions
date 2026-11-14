# Nantes en régulation

PATRIMOINE.EXE · NTE001 — ESD Nantes, B3 Design, 9, 10 & 12 novembre 2026 — œuvre `PXE-NTE001-G01-W01`.
En ligne : https://workshop-design-interactions.pages.dev/ (jeu) · https://workshop-design-interactions.pages.dev/cartel/ (cartel)
· https://workshop-design-interactions.pages.dev/presentation/ (diaporama).

README au format du livret (« README minimal », 12 rubriques), réécrit au prompt 100 (12/11/2026) à partir des
fichiers du dépôt ; les champs que seul le groupe peut remplir restent `[À COMPLÉTER]`.

## Conformité au brief

**Nantes en régulation répond point par point au livret PATRIMOINE.EXE · Nantes 001** : chaque obligation du
projet final et chaque livrable de « Ce que chaque groupe remet » a sa preuve dans ce dossier. La chaîne demandée
est tenue de bout en bout : **source réelle → grammaire écrite → système p5.js → œuvre jouable et exposable**.

| Exigence du livret | Ce que nous avons fait | Preuve |
|---|---|---|
| Source patrimoniale identifiable et documentée | Le réseau Naolib de Nantes Métropole à travers ses données ouvertes (offre GTFS, perturbations datées, temps réel), avec la météo et la Loire | `source-sheet.md` / `.pdf` (contexte, provenance, droits, relevés, propriétés observables) |
| Grammaire explicite, au moins une règle structurante | *Un fait daté de la source devient un dossier à trancher* ; fiche du livret remplie (7 champs), invariants, variables, espace génératif à graine fixe | `grammar.md` / `.pdf` |
| Prototype fonctionnel lançable dans un navigateur | Double clic sur `index.html`, hors ligne compris ; en ligne sur https://workshop-design-interactions.pages.dev/ | `index.html` · rubrique « Lancer le projet » |
| Au moins trois paramètres réellement opérants | Semaine rejouée, difficulté (signalements simultanés, aggravation, budget), mode en ligne / hors ligne, défi chrono | rubrique « Data / interaction » · tests `site/scripts/test-jeu.mjs` (3 semaines × 3 façons de jouer, test de difficulté) |
| Itérations documentées | 181 prompts numérotés (01 à 196) exécutés un par un, revues UX et audits suivis de corrections, une ligne par push | dossier `prompts/` et `journal.md` du dépôt |
| Test par un autre groupe | [À COMPLÉTER par le groupe : groupe testeur, 3 observations, décision prise] | — |
| Documentation pour comprendre et relancer | README aux 12 rubriques du « README minimal » | ce fichier |
| Une donnée ne devient intéressante qu'après un mapping | Retard ≥ 10 min, perturbation datée ou météo au-dessus du 95ᵉ centile → dossier ; réponse → effets sur 3 jauges selon le contexte | rubrique « Data / interaction » · `grammar.md` |
| Œuvre générative, pas animation aléatoire | Invariants, variables et contraintes écrits ; dé 1d6 à graine fixe par semaine (même semaine, même partie) | `grammar.md` (« Espace génératif ») |
| Accessibilité de l'interaction | Tout se joue au clavier, à la souris ou au toucher ; micro et webcam seulement en option et doublés ; pas de flash ; sons non indispensables ; tutoriel intégré | rubrique « Data / interaction » · audit des textes à 0 défaut (3 tailles d'écran, FR / EN) |
| Webcam : présence et responsabilité | Images réduites à 48 × 27, jamais affichées, enregistrées ni envoyées ; webcam inactive tant que le joueur ne l’active pas dans les réglages, puis accord du navigateur | `webcam.js` |
| Livrable : projet lançable | `index.html` + scripts + assets + `data/fallback.json` | ce dossier |
| Livrable : fiche-source et grammaire | `.md` et `.pdf` | `source-sheet.pdf` · `grammar.pdf` |
| Livrable : README | Concept, stack, lancement, mapping, fallback, contributions, IA, sources et droits | ce fichier |
| Livrable : manifest | Métadonnées de l'édition (framework, édition, ville, dates, auteurs, source, stack, données, IA, licence) | `manifest.json` |
| Livrable : cartel | 111 mots (80–120 demandés) + source + système + données | `cartel.md` · page https://workshop-design-interactions.pages.dev/cartel/ |
| Livrable : captation | `hero.jpg`, `detail-01.jpg`, `process.jpg`, `thumb.jpg`, `demo.mp4` de 29 s (20–30 s demandées), vrai rendu du jeu | ce dossier |
| Livrable : présentation | Diaporama de démonstration et de défense | https://workshop-design-interactions.pages.dev/presentation/ |
| Structure de dossier recommandée | `PXE_NTE001_G01_NANTES-EN-REGULATION/` au nommage et au contenu du livret | ce dossier |

Le livret le rappelle : *la complexité n'est pas un critère de qualité*. Les API, le temps réel et les options
micro / webcam ne sont là que parce qu'ils servent la règle : rejouer de vrais faits du réseau, sans en inventer.

## Auteurs

Mattéo Brevet, Guillaume Renoult (groupe G01) — noms du registre (`site/src/content/oeuvres/pxe-nte001-g01-w01.json`),
des crédits du jeu et de `LICENSE`. Rôles de chacun : [À COMPLÉTER par le groupe].

## Source patrimoniale

Le réseau de transports collectifs **Naolib** de Nantes Métropole, tel que le décrivent ses données ouvertes :
offre théorique GTFS avec changelog daté des perturbations, flux temps réel GTFS-RT (retards), agenda des
événements de la métropole, complétés par la météo Open-Meteo (archive ERA5) et la hauteur de la Loire (Hub'Eau).
Fiche complète (contexte, provenance, droits, relevés, propriétés observables, propriété écartée) :
`source-sheet.md` / `source-sheet.pdf`.

## Concept

Le visiteur prend un poste dans une salle de contrôle des transports nantais et rejoue une semaine réelle du
réseau : chaque fait daté de la source (perturbation, météo extrême, événement de l'agenda) devient un dossier à
trancher ; en temps réel, un retard mesuré d'au moins 10 minutes aussi, et il s'aggrave tant qu'il attend. Ses
réponses font bouger trois jauges (fluidité, réputation, budget). Hormis au plus un incident fictif par semaine,
marqué « Fictif », aucun événement n'est inventé ; l'affluence attribuée à un événement est une hypothèse du jeu. Cartel de 111 mots : `cartel.md`.

## Grammaire / règles

Règle structurante : *un fait daté de la source devient un dossier à trancher ; en temps réel, un retard mesuré
d'au moins 10 minutes aussi (les archives ne donnent pas de minutes).* Fiche de grammaire du livret (primitives, relations, invariants, variables, temps,
déclencheur, limites) et espace génératif (graine fixe par semaine) : `grammar.md` / `grammar.pdf`. Décisions
verrouillées Q1–Q61 et leurs exceptions documentées : dossier `jeu/` du dépôt.

## Stack

p5.js 1.11.11 (`lib/`), JavaScript natif sans dépendance, Web Audio API (sons et musiques CC0), service worker
(webapp installable, hors ligne) ; site d'édition Astro (seule dépendance de `site/package.json`) et diaporama
Slidev, tous deux statiques. Polices du Pixel Design System : JetBrains Mono (SIL OFL 1.1, auto-hébergée),
Bitsy Pixels si installée.

## Data / interaction

- **Données** : semaines d'archives préparées (`data/semaines/`), tracés des lignes (`data/lignes.json`) ; en
  mode « aujourd'hui », le navigateur interroge GTFS-RT Naolib et Open-Meteo au lancement (délai borné, jamais
  dans la boucle de rendu). Liste des API et licences : appli « Données » du jeu et `jeu/api.md` du dépôt.
- **Mapping** : retard ≥ 10 min / perturbation datée / météo au-dessus du 95e centile de la semaine → dossier ;
  réponse du joueur → effets sur les jauges, modulés par le contexte (× 1,25) et un dé 1d6 à graine fixe.
- **Interaction** : souris, glisser-déposer des réponses, clavier complet (1–3 pour les répliques, E pour l'enquête, Q, Échap, L pour la langue ; inventaire : `jeu/174-raccourcis.md` du dépôt), tactile
  en portrait ; options micro (souffle) et webcam (main devant la caméra → sieste), toujours doublées au
  clavier et à la souris. Les images de la webcam sont réduites à 48 × 27, jamais affichées, enregistrées ni
  envoyées (`webcam.js`).
- **Paramètres opérants** (≥ 3, livret) : semaine rejouée ; difficulté (3 / 2 / 1 signalements simultanés,
  aggravation × 0,5 / × 1 / × 1,5, budget 60 / 50 / 40) ; mode en ligne / hors ligne ; mode « Défi chrono ».
  Effets vérifiés par `site/scripts/test-jeu.mjs` : 3 semaines × 3 façons de jouer, repli hors ligne, défi
  chrono, et un test dédié à la difficulté (budget, aggravation et signalements simultanés ordonnés par niveau).

## Lancer le projet

- Sans rien installer : double clic sur `index.html` (polices système en `file://`, données locales).
- Serveur local : `python3 -m http.server` dans ce dossier, puis http://localhost:8000/.
- Depuis le dépôt : `cd site && npm install && npm run build && npm test`, puis `npm run preview`.
- Exposition : ajouter `?expo=1` à l'adresse (purge du visiteur précédent, arrivée directe sur la carte, retour à l'écran titre après 90 s sans geste).

## Fallback / limites connues

- API coupée ou lente : semaine de référence locale (`data/fallback.json`, 6 dossiers réels de la semaine du
  12 au 18/10/2026) avec l'indicateur « hors ligne » ; après une première visite, tout le jeu se recharge hors
  ligne (service worker).
- Le changelog GTFS ne donne ni durée de retard ni toujours la ligne : les dossiers d'archive n'affichent que
  ce que dit la source ; seul le mode « aujourd'hui » donne des retards en minutes.
- Micro et webcam dépendent de l'autorisation du navigateur (repli silencieux en cas de refus).
- Copie figée : la source de vérité est `site/public/` du dépôt (procédure de resynchronisation :
  `rendu/README.md`).

## Contributions

[À COMPLÉTER par le groupe : contributions nominatives et précises de chaque membre — pas de passager invisible.]
Trace observable (`git shortlog -sn --all`, 12/11/2026) : ArtistDev44 223 commits, matteobvt49-code 103,
Vibe Nuage Agent 62 (compte d'agent IA), Skyfe 30. Comptes rattachés par le groupe (12/11/2026) :
ArtistDev44, Vibe Nuage Agent et Skyfe → Guillaume ; matteobvt49-code → Mattéo. Prompts par auteur (création du
fichier dans git, `prompts/auteurs.json`) : Guillaume 152, Mattéo 29 — détail sur https://workshop-design-interactions.pages.dev/making-of/.

## AI usage

Le code, la documentation et les prompts ont été produits en grande partie par des assistants IA exécutant les
prompts numérotés du dossier `prompts/` du dépôt, rédigés par le groupe ; l'historique git en garde la trace
(commits `Co-Authored-By: Claude`, compte « Vibe Nuage Agent »). Les décisions de jeu (Q1–Q61) ont été
rédigées en amont ; les données sont réelles.
[À COMPLÉTER par le groupe : ce qui a été relu, réécrit et testé par vous.]

## Sources / droits

- GTFS Naolib (source patrimoniale) : ODbL, éditeur Semitan, via Open Data Nantes Métropole (vérifié le 14/11/2026) ; GTFS-RT et agenda : Licence Ouverte (Nantes Métropole) ; parkings, vélos (JCDecaux), fluidité : ODbL ; lieux (`data/lieux.json`) : © contributeurs OpenStreetMap, ODbL.
- Open-Meteo : CC BY 4.0 (attribution affichée dans le jeu, vérifiée le 10/11/2026).
- Hub'Eau — Hydrométrie : Licence Ouverte Etalab (auteur cité : PHyC, Service Central Vigicrues).
- Musiques : Komiku et Loyalty Freak Music, CC0 1.0 (`audio/CREDITS.md`).
- Police JetBrains Mono : SIL OFL 1.1 ; Bitsy Pixels : usage gratuit, © Paolo Munna (non incluse).
- Code : licence MIT (Mattéo Brevet & Guillaume Renoult). Ce projet n'est pas un service officiel de Naolib ni
  de Nantes Métropole.
- Métadonnées de l'édition : `manifest.json` ; captation : `hero.jpg`, `detail-01.jpg`, `process.jpg`,
  `thumb.jpg`, `demo.mp4` (29 s, 1280 × 720, vrai rendu du jeu).
