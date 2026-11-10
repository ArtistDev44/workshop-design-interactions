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
| 20 | `20-jeu-immersion-mode-ordinateur.md` | Jeu, étape 7 : couche d'immersion — intro SMS, horloge simulée avec compression du temps, sieste « Se réveiller », bordures rouges d'alerte, mail de fin de journée, livres ressources au bureau |
| 21 | `21-jeu-immersion-visuelle-mail.md` | Jeu, étape 8 : finitions visuelles — vignettage de flou et centrage du PC dans la vue bureau, clignement d'œil sur les transitions bureau ↔ écran, mail de fin de journée enrichi (événements externes + évaluation des décisions) |
| 22 | `22-jeu-bureau-apps-gestion-nantes.md` | Jeu, étape 9 : bureau du PC applicatif — messages du patron, carte de gestion des problèmes nantais (envoi d'équipes façon 911 operator), community manager, journal ; jauges Fluidité / Réputation / Budget |
| 23 | `23-jeu-profondeur-tactique-malus-budget.md` | Jeu, étape 10 : profondeur tactique — conseils contextuels, modificateurs (erreur système), objectifs resserrés, malus, dialogues liés au budget, fins personnalisées |
| 24 | `24-jeu-multi-langue.md` | Jeu, étape 11 : jeu multi-langue — dictionnaire i18n externalisé (FR + EN, extensible), sélecteur de langue (accueil, paramètres, `?lang=`), persistance `localStorage`, `lang` dynamique, accessibilité des textes |
| 25 | `25-jeu-vue-3d-environnement-pc.md` | Jeu, étape 12 : vue 3D / environnement PC — léger dézoom (fond visible autour de l'écran du PC), caméra fausse 3D façon FNAF (souris hors cadre / flèches directionnelles, mouvement subtil, recentrage au centre) |
| 26 | `26-jeu-sortie-mode-pc.md` | Jeu, étape 13 : sortie du mode PC — bouton « Quitter le PC » au poste, scroll au poste, porte d'entrée/sortie cliquable au bureau (Échap conservé) |
| 27 | `27-jeu-loading-screen.md` | Jeu, étape 14 : écran de chargement statique (fond bleu + logo, anti-flash clair→sombre) + musique de fond générée en WebAudio dès le menu |
| 28 | `28-jeu-dialogues-nantais-messages-json.md` | Jeu, étape 15 : dialogues des Nantais (plaintes cohérentes + bonnes réponses possibles) stockés dans un `data/messages.json` brut modifiable, contenu généré depuis ce fichier, rien de figé dans le code |
| 29 | `29-jeu-interactions-hors-ecran.md` | Jeu, étape 16 : interactions hors écran, dans la pièce autour du PC (lampe, fenêtre/rideau, autres objets cliquables en vue bureau) |
| 30 | `30-jeu-bandes-sonores-ambiance.md` | Jeu, étape 17 : bandes sonores au-delà des voix de trame — ambiances contextuelles (pluie, ville, nuit) et alertes sonores, 100 % WebAudio généré par le code |
| 31 | `31-jeu-bureau-cadrage-chaise.md` | Jeu, étape 18 : cadrage du bureau « sur la chaise » (vue centrée, chaise non visible), horloge déplacée du rideau vers le mur, lampadaire revu, arbres OK |
| 32 | `32-jeu-bureau-style-epure.md` | Jeu, étape 19 : direction moderne et épurée de la pièce — murs blancs, moins de bois, beaucoup de blanc (écran du jeu inchangé) |

Les prompts 14–19 (jeu p5.js) sont indépendants du site : ils peuvent être menés en
parallèle dès le prompt 03, l'œuvre étant ensuite reliée au site par sa fiche du
registre (prompt 06). Le prompt 14 était trop long : il est découpé en 6 prompts
(14 chapeau + 5 étapes, 15–19). Le prompt 20 s'y ajoute après le bureau pixel art
(`jeu/12-bureau-pixel.md`) : il pose la couche d'immersion sans toucher aux décisions
verrouillées Q1–Q61.

Historique : le 9 novembre 2026, l'ancien prompt 13 (données vivantes) est devenu le 11,
et les anciens 11 et 12 sont devenus 12 et 13, pour que l'accessibilité et le
déploiement vérifient aussi la page `/donnees/`. Les entrées anciennes de `journal.md`
gardent les anciens numéros.
