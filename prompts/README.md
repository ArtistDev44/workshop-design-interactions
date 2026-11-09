# prompts/ — Créer le site Astro.js de l'édition PATRIMOINE.EXE / NTE001

Ce dossier contient des **prompts numérotés**, à exécuter **dans l'ordre** avec un assistant
IA dans un projet vide. Chaque prompt produit une étape vérifiable du site web de travail
à rendre pour l'édition PXE · NTE001 (ESD Nantes, B3 Design, 9, 10 & 12 novembre 2026).

Point de départ : le **thème Astro « Basics »** — https://preview.astro.new/basics/ —
lancé via `npm create astro@latest` (sélection du thème Basics) ou copié depuis la page du
thème. Aucun autre starter n'est requis.

## Mode d'emploi

1. Le site vit dans le sous-dossier **`site/`** de ce dépôt (créé au prompt 01). Les
   commandes `npm` se lancent dans `site/` ; `journal.md`, `todo.md`, `contexte/` et
   `jeu/` restent à la racine du dépôt.
2. Ouvrir l'assistant IA à la racine du dépôt (agent de code autorisé à créer/modifier
   des fichiers). Il lit `CLAUDE.md` (règles courtes) : inutile de lui coller le livret.
3. Donner chaque prompt `NN-*.md`, **un par un, dans l'ordre des numéros**, en attendant
   que l'étape précédente soit terminée et vérifiée. Pour économiser les tokens : une
   conversation (ou un `/clear`) par prompt — le dépôt garde la mémoire du travail.
4. Ne jamais inclure de clé privée, de token ou de secret dans le code ou les prompts.
5. À chaque push vers un dépôt du projet, ajouter une entrée dans `journal.md` (date, commit, fichiers touchés, résumé).

## Références de contexte (à ouvrir seulement si un prompt le demande)

- `contexte/PATRIMOINE.EXE - Nantes 001 — Cours étudiant B3 Design — ESD Nantes — 2026.md` — livret officiel (livrables, structure de dossier, manifest, cartel, robustesse, accessibilité).
- `contexte/PATRIMOINE.EXE — International Computational Heritage Framework.md` — framework (registre machine-readable, identifiants `PXE-NTE001-G{nn}-W{nn}`, URL `/patrimoine-exe/nantes/001/slug/`, statuts STUDENT / SELECTED / COLLECTION, vitrine publique).
- `contexte/instructions-personnelles.md` — règles de travail du projet (todo, journal, chaîne source → grammaire → système → œuvre).
- `todo.md` — vue d'ensemble du protocole 3 jours, jalons de la semaine et QR code vers le site en ligne.
- `jeu/` — description fichier par fichier du jeu « Salle de contrôle Nantes » (concept, boucle, API, actions, jauges, UI, narration, fallback, raccourcis, paramètres, accessibilité).
- `journal.md` — journal des pushes du dépôt, une ligne par push.

## Chaîne à tenir du début à la fin

**source → grammaire → système → œuvre** — le site doit rendre cette chaîne lisible,
jamais l'inverse.

## Liste des prompts

| N° | Fichier | Objectif |
|---|---|---|
| 01 | `01-initialiser-projet-astro-base.md` | Générer le projet Astro depuis le thème Basics (preview.astro.new/basics/) |
| 02 | `02-configurer-astro-statique.md` | Config statique + base GitHub Pages (`/workshop-design-interactions/patrimoine-exe/nantes/001/`) |
| 03 | `03-structure-dossiers-toolkit.md` | Arborescence conforme au toolkit PATRIMOINE.EXE |
| 04 | `04-layout-design-system.md` | Layout commun + design system (`design-system/DESIGN.md`) |
| 05 | `05-page-accueil-edition.md` | Page d'accueil NTE001 (manifeste, compteurs, édition) |
| 06 | `06-modele-donnees-registre.md` | Registre machine-readable + schéma des œuvres |
| 07 | `07-galerie-oeuvres.md` | Galerie des œuvres générée depuis le registre |
| 08 | `08-cartel-ouvre-par-slug.md` | Page œuvre + cartel au format du livret |
| 09 | `09-statistiques-catalogue.md` | Statistiques et catalogue générés depuis les métadonnées |
| 10 | `10-methode-ressources-credits.md` | Pages protocole, corpus Nantes, crédits/brand |
| 11 | `11-donnees-vivantes-nantes.md` | Page « Nantes en direct » : données vivantes depuis les API recommandées par l'audit (`contexte/audit-api-open-data-nantes.md`), cache, rafraîchissement temporisé, instantanés réels en secours |
| 12 | `12-accessibilite-robustesse.md` | Contrôles accessibilité + checklist de robustesse (y compris hors ligne) |
| 13 | `13-build-deploiement-qr.md` | Build, déploiement GitHub Pages (Actions), README, QR codes |
| 14 | `14-jeu-salle-de-controle-p5.md` | Jeu « Nantes en régulation » — chapeau : objectif, emplacement, données réelles (œuvre p5.js décrite dans `jeu/`) |
| 15 | `15-jeu-fondation-donnees.md` | Jeu, étape 2/6 : structure du livret, p5.js local, semaines enregistrées, `lignes.json`, `fallback.json` |
| 16 | `16-jeu-ecrans-salle-de-controle.md` | Jeu, étape 3/6 : écran d'accueil + salle de contrôle 1920×1080 |
| 17 | `17-jeu-boucle-effets-jauges.md` | Jeu, étape 4/6 : boucle de jeu, 3 actions + « ne rien faire », table des effets base + 1d6, jauges |
| 18 | `18-jeu-controles-confort.md` | Jeu, étape 5/6 : raccourcis clavier, son, pause, reset, aide, meilleur bilan `localStorage` |
| 19 | `19-jeu-fins-robustesse.md` | Jeu, étape 6/6 : 3 fins + bilan détaillé, accessibilité, vérifications finales |

Les prompts 14–19 (jeu p5.js) sont indépendants du site : ils peuvent être menés en
parallèle dès le prompt 03, l'œuvre étant ensuite reliée au site par sa fiche du
registre (prompt 06). Le prompt 14 était trop long : il est découpé en 6 prompts
(14 chapeau + 5 étapes, 15–19).

Historique : le 9 novembre 2026, l'ancien prompt 13 (données vivantes) est devenu le 11,
et les anciens 11 et 12 sont devenus 12 et 13, pour que l'accessibilité et le
déploiement vérifient aussi la page `/donnees/`. Les entrées anciennes de `journal.md`
gardent les anciens numéros.
