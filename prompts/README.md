# prompts/ — Créer le site Astro.js de l'édition PATRIMOINE.EXE / NTE001

Ce dossier contient des **prompts numérotés**, à exécuter **dans l'ordre** avec un assistant
IA dans un projet vide. Chaque prompt produit une étape vérifiable du site web de travail
à rendre pour l'édition PXE · NTE001 (ESD Nantes, B3 Design, 9, 10 & 12 novembre 2026).

Point de départ : le **thème Astro « Basics »** — https://preview.astro.new/basics/ —
lancé via `npm create astro@latest` (sélection du thème Basics) ou copié depuis la page du
thème. Aucun autre starter n'est requis.

## Mode d'emploi

1. Créer un dossier vide pour le site (ex. `PXE_NTE001_SITE/`) et s'y placer.
2. Ouvrir l'assistant IA dans ce dossier (agent de code autorisé à créer/modifier des fichiers).
3. Copier-coller le contenu de chaque prompt `NN-*.md`, **un par un**, en attendant que
   l'étape précédente soit terminée et vérifiée avant de passer à la suivante.
4. Ne jamais inclure de clé privée, de token ou de secret dans le code ou les prompts.
5. À chaque push vers un dépôt du projet, ajouter une entrée dans `journal.md` (date, commit, fichiers touchés, résumé).

## Références de contexte (à relire si besoin)

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
| 02 | `02-configurer-astro-statique.md` | Config statique + base GitHub Pages + français |
| 03 | `03-structure-dossiers-toolkit.md` | Arborescence conforme au toolkit PATRIMOINE.EXE |
| 04 | `04-layout-design-system.md` | Layout commun + design system de l'édition |
| 05 | `05-page-accueil-edition.md` | Page d'accueil NTE001 (manifeste, compteurs, édition) |
| 06 | `06-modele-donnees-registre.md` | Registre machine-readable + schéma des œuvres |
| 07 | `07-galerie-uvres.md` | Galerie des œuvres générée depuis le registre |
| 08 | `08-cartel-ouvre-par-slug.md` | Page œuvre + cartel au format du livret |
| 09 | `09-statistiques-catalogue.md` | Statistiques et catalogue générés depuis les métadonnées |
| 10 | `10-methode-ressources-credits.md` | Pages protocole, corpus Nantes, crédits/brand |
| 11 | `11-accessibilite-robustesse.md` | Contrôles accessibilité + checklist de robustesse |
| 12 | `12-build-deploiement-qr.md` | Build, test hors ligne, déploiement GitHub Pages, README |
| 13 | `13-jeu-salle-de-controle-p5.md` | Jeu « Salle de contrôle Nantes » (œuvre p5.js décrite dans `jeu/`) |
