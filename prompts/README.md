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

| N° | Fichier | Objectif | Statut |
|---|---|---|---|
| 01 | `01-initialiser-projet-astro-base.md` | Générer le projet Astro depuis le thème Basics (preview.astro.new/basics/) | ✅ (base `site/`) |
| 02 | `02-configurer-astro-statique.md` | Config statique + base GitHub Pages (historique ; URL canonique actuelle : https://workshop-design-interactions.pages.dev/, `base: '/'`) | ✅ (config revue : Cloudflare, `base: '/'`) |
| 03 | `03-structure-dossiers-toolkit.md` | Arborescence conforme au toolkit PATRIMOINE.EXE | 🗄 exécuté, pages retirées |
| 04 | `04-layout-design-system.md` | Layout commun + design system (`design-system/DESIGN.md`) | 🗄 exécuté, pages retirées |
| 05 | `05-page-accueil-edition.md` | Page d'accueil NTE001 (manifeste, compteurs, édition) | 🗄 exécuté, pages retirées |
| 06 | `06-modele-donnees-registre.md` | Registre machine-readable + schéma des œuvres | ✅ (registre `src/content/`) |
| 07 | `07-galerie-oeuvres.md` | Galerie des œuvres générée depuis le registre | 🗄 exécuté, pages retirées |
| 08 | `08-cartel-ouvre-par-slug.md` | Page œuvre + cartel au format du livret | 🗄 exécuté, pages retirées |
| 09 | `09-statistiques-catalogue.md` | Statistiques et catalogue générés depuis les métadonnées | 🗄 exécuté, pages retirées |
| 10 | `10-methode-ressources-credits.md` | Pages protocole, corpus Nantes, crédits/brand | 🗄 exécuté, pages retirées |
| 11 | `11-donnees-vivantes-nantes.md` | Page « Nantes en direct » : données vivantes depuis les API recommandées par l'audit (`contexte/audit-api-open-data-nantes.md`), cache, rafraîchissement temporisé, instantanés réels en secours | ✅ (`src/lib/datasets.js`, `scripts/snapshot.mjs`, `public/data/fallback/` ; page `/donnees/` retirée) |
| 12 | `12-accessibilite-robustesse.md` | Contrôles accessibilité + checklist de robustesse (y compris hors ligne) | 🗄 exécuté, pages retirées |
| 13 | `13-build-deploiement-qr.md` | Build, déploiement GitHub Pages (Actions, historique — voir note en tête du prompt), README, QR codes | ✅ (workflow + QR ; QR à régénérer vers l'URL canonique, cf. note) |
| 14 | `14-jeu-salle-de-controle-p5.md` | Jeu « Nantes en régulation » — chapeau : objectif, emplacement, données réelles (œuvre p5.js décrite dans `jeu/`) | ✅ main |
| 15 | `15-jeu-fondation-donnees.md` | Jeu, étape 2/6 : structure du livret, p5.js local, semaines enregistrées, `lignes.json`, `fallback.json` | ✅ main |
| 16 | `16-jeu-ecrans-salle-de-controle.md` | Jeu, étape 3/6 : écran d'accueil + salle de contrôle 1920×1080 | ✅ main |
| 17 | `17-jeu-boucle-effets-jauges.md` | Jeu, étape 4/6 : boucle de jeu, 3 actions + « ne rien faire », table des effets base + 1d6, jauges | ✅ main |
| 18 | `18-jeu-controles-confort.md` | Jeu, étape 5/6 : raccourcis clavier, son, pause, reset, aide, meilleur bilan `localStorage` | ✅ main |
| 19 | `19-jeu-fins-robustesse.md` | Jeu, étape 6/6 : 3 fins + bilan détaillé, accessibilité, vérifications finales | ✅ main |
| 20 | `20-jeu-immersion-mode-ordinateur.md` | Jeu, étape 7 : couche d'immersion — intro SMS, horloge simulée avec compression du temps, sieste « Se réveiller », bordures rouges d'alerte, mail de fin de journée, livres ressources au bureau | ✅ main |
| 21 | `21-jeu-immersion-visuelle-mail.md` | Jeu, étape 8 : finitions visuelles — vignettage de flou et centrage du PC dans la vue bureau, clignement d'œil sur les transitions bureau ↔ écran, mail de fin de journée enrichi (événements externes + évaluation des décisions) | ✅ main |
| 22 | `22-jeu-bureau-apps-gestion-nantes.md` | Jeu, étape 9 : bureau du PC applicatif — messages du patron, carte de gestion des problèmes nantais (envoi d'équipes façon 911 operator), community manager, journal ; jauges Fluidité / Réputation / Budget | ✅ main |
| 23 | `23-jeu-profondeur-tactique-malus-budget.md` | Jeu, étape 10 : profondeur tactique — conseils contextuels, modificateurs (erreur système), objectifs resserrés, malus, dialogues liés au budget, fins personnalisées | ✅ main |
| 24 | `24-jeu-multi-langue.md` | Jeu, étape 11 : jeu multi-langue — dictionnaire i18n externalisé (FR + EN, extensible), sélecteur de langue (accueil, paramètres, `?lang=`), persistance `localStorage`, `lang` dynamique, accessibilité des textes | ✅ main |
| 25 | `25-jeu-vue-3d-environnement-pc.md` | Jeu, étape 12 : vue 3D / environnement PC — léger dézoom (fond visible autour de l'écran du PC), caméra fausse 3D façon FNAF (souris hors cadre / flèches directionnelles, mouvement subtil, recentrage au centre) | ✅ main (PR #24) |
| 26 | `26-jeu-sortie-mode-pc.md` | Jeu, étape 13 : sortie du mode PC — bouton « Quitter le PC » au poste, scroll au poste, porte d'entrée/sortie cliquable au bureau (Échap conservé) | ✅ main |
| 27 | `27-jeu-loading-screen.md` | Jeu, étape 14 : écran de chargement statique (fond bleu + logo, anti-flash clair→sombre) + musique de fond générée en WebAudio dès le menu | ✅ main |
| 28 | `28-jeu-dialogues-nantais-messages-json.md` | Jeu, étape 15 : dialogues des Nantais (plaintes cohérentes + bonnes réponses possibles) stockés dans un `data/messages.json` brut modifiable, contenu généré depuis ce fichier, rien de figé dans le code | ✅ main |
| 29 | `29-jeu-interactions-hors-ecran.md` | Jeu, étape 16 : interactions hors écran, dans la pièce autour du PC (lampe, fenêtre/rideau, autres objets cliquables en vue bureau) | ✅ main |
| 30 | `30-jeu-bandes-sonores-ambiance.md` | Jeu, étape 17 : bandes sonores au-delà des voix de trame — ambiances contextuelles (pluie, ville, nuit) et alertes sonores, 100 % WebAudio généré par le code | ✅ main |
| 31 | `31-jeu-bureau-cadrage-chaise.md` | Jeu, étape 18 : cadrage du bureau « sur la chaise » (vue centrée, chaise non visible), horloge déplacée du rideau vers le mur, lampadaire revu, arbres OK | ✅ main |
| 32 | `32-jeu-bureau-style-epure.md` | Jeu, étape 19 : direction moderne et épurée de la pièce — murs blancs, moins de bois, beaucoup de blanc (écran du jeu inchangé) | ✅ main |
| 33 | `33-jeu-sauvegarde-progression-import-export.md` | Jeu, étape 20 : sauvegarde auto de la progression en `localStorage` (reprise « Continuer la partie ») + export/import JSON de la progression dans les Paramètres, validation stricte | ✅ main (`sauvegarde.js`) |
| 33 | `33-audit-coherence-leviers.md` | Méta-prompt (hors jeu) : audit de cohérence du dépôt et leviers d'amélioration — URL canonique unique, `[À COMPLÉTER]`, statut des prompts 24–32, livrables J3, smoke test, coquille Astro, LICENSE | ✅ ce prompt (branche `vibe/prompt-33-audit-coherence-4c094b-application`) |
| 34 | `34-jeu-fenetre-loire-tutoriel.md` | Jeu, étape 21 : fond de la baie vitrée corrigé (plus de trottoir/route/arbres ni de château, grue au niveau des bâtiments et de leur couleur), Loire à la place avec hauteur réelle via API (fallback local), souris et téléphone en perspective (téléphone récent), livre « tuto » remplacé par « commande », vrai tutoriel guidé | ✅ main |
| 35 | `35-jeu-menu-principal-modernise.md` | Jeu, étape 22 : menu principal modernisé avant le bureau (Nouvelle partie, Reprendre, Paramètres, Aide, Tutoriel, langue), choix de la semaine sorti du PC, menu Échap modernisé | ✅ main |
| 36 | `36-jeu-applications-indicateurs.md` | Jeu, étape 23 : toutes les applis fonctionnelles (Corbeille comprise), icônes agrandies, app flottante « Indicateurs » (fluidité, réputation, budget) | ✅ main |
| 37 | `37-jeu-mode-prendre-en-main.md` | Jeu, étape 24 : option « Prendre en main » à la première partie, flèches guidées vers ce qu'il est possible de faire | ✅ main |
| 38 | `38-jeu-transition-scroll-telephone-pluie.md` | Jeu, étape 25 : molette vers le haut pour s'installer au PC, notifications d'événements réels (Agenda Nantes Métropole) au clic sur le téléphone, pluie aléatoire et réaliste | ✅ main |
| 39 | `39-jeu-interface-pixel-design-system.md` | Jeu, étape 26 : toute l'interface au Pixel Design System (fond #0D0C0C, primaire #D4031C, arrondi 0, JetBrains Mono / Bitsy Pixels) | ✅ main |
| 40 | `40-jeu-parallaxe-fausse-3d.md` | Jeu, étape 27 : parallaxe multicouche — chaque plan de la pièce se décale à sa propre échelle avec la caméra (fausse 3D) | ✅ main |
| 41 | `41-jeu-mode-histoire-rapport-cinematiques.md` | Jeu, étape 28 : mode histoire (facile → normale → difficile, un élément de jeu de plus par semaine) et mode temps réel à débloquer ; rapport papier sur la table ; 3 cinématiques de fin | ✅ main |
| 42 | `42-jeu-telephone-en-main.md` | Jeu, étape 29 : le joueur saisit son téléphone (animation réutilisable) pour les dialogues et les notifications | ✅ main |
| 43 | `43-jeu-vue-pc-ux-temps-transitions.md` | Jeu, étape 30 : vue PC à 90 %, indicateurs redondants retirés, UX de l'écran de jeu, temps ×30, écran noir « Jour n — Semaine n » entre les journées | ✅ main |
| 44 | `44-jeu-musiques-immersion-sonore.md` | Jeu, étape 31 : choix de la musique (morceaux pixel originaux) et immersion sonore en 7 points (salle vivante, radio, alertes par source, compte à rebours, clics d'action, jauges audibles, météo, signatures de fin) | ✅ main |
| 45 | `45-jeu-meteo-progressive-seo.md` | Jeu, étape 32 : transitions météo progressives (jour/nuit, pluie) et SEO (description, OG image, favicon, canonique, carte Twitter) | ✅ main |
| 46 | `46-livrables-documentation.md` | Livrables J3 (manifest, captation, version archivée), cartel corrigé, pages /cartel/ et /making-of/, guide contributeur | ✅ |
| 47 | `47-jeu-mecaniques-narration.md` | Jeu, étape 33 : inspection surprise, palmarès et profils, journal de bord, fin « démission », épilogue personnalisé, agenda anticipé | ✅ |
| 48 | `48-jeu-accessibilite-technique.md` | Jeu, étape 34 : daltonisme, taille du texte, lecture facile, tests automatisés, démo automatique, PWA hors ligne, courbes des jauges | ✅ |
| 49 | `49-jeu-lofi-lisibilite-meteo.md` | Jeu, étape 35 : musique lofi CC0 et sons discrets, textes du PC lisibles, carte sans ligne météo, climat selon le mode (direct / archives) | ✅ |
| 50 | `50-jeu-enquete-sources.md` | Jeu, étape 36 : découvrir la situation — alerte vague, détails révélés en consultant carte, info trafic, météo, agenda ; plus de conseil ni de flèches d'effet ; appli Régulation en fenêtre (barre des tâches visible) | ✅ |
| 51 | `51-jeu-horloge-sablier.md` | Jeu, étape 37 : finir sa journée en cliquant l'horloge (alerte avant 20 h, blâme du patron le lendemain), sablier pour faire passer le temps entre les dossiers, lumière (lampe éteinte, stores baissés) qui se ressent sur le bureau, ombres portées des objets | ✅ |
| 52 | `52-jeu-cafe-boost.md` | Jeu, étape 38 : boire le café (tasse en main, même animation que le téléphone) → boost temporaire : cœur qui s'accélère, pulsation rouge, lignes de vitesse, flou, champ élargi | ◻ prévu |
| 53 | `53-jeu-animations-feedback.md` | Jeu, étape 39 : animations de feedback — arrivée du dossier (glisser + tampon « SIGNALEMENT » + pulsation de la ligne sur la carte), jauges en eased avec deltas flottants, urgence du compteur sous 10 s (barre rouge, sablier accéléré) ; animations réduites respectées | ◻ prévu |
| 54 | `54-jeu-defis-ralenti.md` | Jeu, étape 40 : défis de semaine réels (3 tirés par la graine, +5 sur la jauge concernée si tenus, bilan dans le mail et le rapport) et ralenti tactique (touche R, pause de 10 s du compteur, 1×/jour) | ◻ prévu |

### Statut des prompts (vérifié le 10/11/2026 dans `site/public/`)

Légende : **✅ main** = implémenté et fusionné dans `main` ; **✅ main** = implémenté sur la
chaîne de branches empilées, **pas encore fusionnée** dans `main` ; **◻ prévu** = rien dans le
code ; **🗄 exécuté, pages retirées** = prompt du site Astro exécuté le 9/11, dont les pages ont
été supprimées quand le jeu est passé à la racine (voir `journal.md`). Seule page Astro restante :
`/cartel/` (prompt 33, section 6).

Preuves dans le code (grep, branche du prompt 33) :

| Prompt | Fichiers / symboles vérifiés |
|---|---|
| 14–19 | `index.html`, `sketch.js`, `game.js`, `confort.js`, `data/fallback.json`, `data/semaines/*.json`, `data/lignes.json`, `lib/p5.min.js` |
| 20–21 | `immersion.js` (sieste, mail de fin de journée) |
| 22 | `os.js` (apps du bureau), `game.js` (`messagesPatron`, jauge `budget`) |
| 23 | `game.js` / `os.js` (`modificateurActif`, objectifs, malus) |
| 24 | `i18n.js` (FR + EN, `?lang=`) |
| 25 | `bureau.js` (`CAMERA`, `DEZOOM`) |
| 26 | `bureau.js` / `sketch.js` (« Quitter le PC », `mouseWheel`, porte) |
| 27 | `index.html` (`#chargement`), `confort.js` (musique `AudioContext`) |
| 28 | `data/messages.json`, `data/messages.js`, `scripts/generer-messages.mjs` |
| 29 | `immersion.js` (objets `piece: true`) |
| 30 | `confort.js` (`Confort.Son.ambiances`) |
| 31 | `bureau.js` (`CADRAGE`, horloge murale) |
| 32 | `bureau.js` / `immersion.js` (palette blanche) |
| 33 (sauvegarde) | `sauvegarde.js` |
| 34 | `bureau.js` (`dessinerLoire`, `LOIRE`, Hub'Eau), `data/loire.js`, `immersion.js` (livre `commande`, `lancerTutoriel`) |

Chaîne des branches non fusionnées (chacune empilée sur la précédente) :
`jeu/prompt-26-sortie-pc` → `jeu/prompt-27-loading-screen` → `jeu/prompt-28-dialogues-nantais`
→ `jeu/prompt-29-interactions-hors-ecran` → `jeu/prompt-30-bandes-sonores-ambiances` →
`jeu/prompt-31-bureau-cadrage` → `jeu/prompt-32-bureau-style-epure` →
`jeu/prompt-33-sauvegarde-progression` → `vibe/prompt-33-audit-coherence-4c094b-application` → `jeu/prompt-34-fenetre-loire-tutoriel`.

Variante non intégrée : `origin/jeu/prompt-30-bandes-sonores` (collaborateur, basée sur `main`,
fichier `site/public/audio.js`) est une autre implémentation du prompt 30, **non fusionnée** et
non reprise dans la chaîne ci-dessus (qui implémente le prompt 30 dans `confort.js`). À arbitrer
par le groupe avant toute fusion.

Les docs de fonctionnalités des prompts 25 à 33 sont `jeu/19-…` à `jeu/27-…` : leurs numéros
diffèrent de ceux demandés dans les prompts, déjà pris dans `jeu/` (choix voulu).

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
