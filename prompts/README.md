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
| 13 | `13-build-deploiement-qr.md` | Build, déploiement GitHub Pages (Actions, historique — voir note en tête du prompt), README, QR codes | ✅ (workflow + QR ; QR régénérés vers l'URL canonique et vérifiés au prompt 46, cf. note) |
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
| 46 | `46-livrables-documentation.md` | Livrables J3 (manifest, captation, version archivée), cartel corrigé, pages /cartel/ et /making-of/, guide contributeur | ✅ main |
| 46 | `manifest.json`, `captures/demo.mp4`, `src/pages/making-of.astro`, `CONTRIBUTING.md`, `rendu/` |
| 47 | `47-jeu-mecaniques-narration.md` | Jeu, étape 33 : inspection surprise, palmarès et profils, journal de bord, fin « démission », épilogue personnalisé, agenda anticipé | ✅ main |
| 47 | `mecaniques.js` (`fenetreInspection`, `ouvrirCarnet`), `game.js` (`profilGestion`, `peutDemissionner`, `prevenirAgenda`) |
| 48 | `48-jeu-accessibilite-technique.md` | Jeu, étape 34 : daltonisme, taille du texte, lecture facile, tests automatisés, démo automatique, PWA hors ligne, courbes des jauges | ✅ main |
| 48 | `accessibilite.js` (`PALETTES`, `dessinerDemo`, `dessinerCourbesJauges`), `sw.js`, `scripts/test-jeu.mjs` |
| 49 | `49-jeu-lofi-lisibilite-meteo.md` | Jeu, étape 35 : musique lofi CC0 et sons discrets, textes du PC lisibles, carte sans ligne météo, climat selon le mode (direct / archives) | ✅ main |
| 49 | `audio/lofi-*.ogg`, `accessibilite.js` (`TAILLE_MIN_PC`), `immersion.js` (`meteoFenetre`, `meteo.source`) |
| 50 | `50-jeu-enquete-sources.md` | Jeu, étape 36 : découvrir la situation — alerte vague, détails révélés en consultant carte, info trafic, météo, agenda ; plus de conseil ni de flèches d'effet ; appli Régulation en fenêtre (barre des tâches visible) | ✅ main |
| 50 | `enquete.js` (`SOURCES_ENQ`), `os.js` (`entrerFenetreAppli`, `dessinerBarreTaches`) |
| 51 | `51-jeu-horloge-sablier.md` | Jeu, étape 37 : finir sa journée en cliquant l'horloge (alerte avant 20 h, blâme du patron le lendemain), sablier pour faire passer le temps entre les dossiers, lumière (lampe éteinte, stores baissés) qui se ressent sur le bureau, ombres portées des objets | ✅ main |
| 51 | `journee.js` (`clicHorloge`, `dessinerSablier`, `dessinerEclairage`, `ombreObjet`), `game.js` (`partirAvantLaFin`) |
| 52 | `52-jeu-cafe-boost.md` | Jeu, étape 38 : boire le café (tasse en main, même animation que le téléphone) → boost temporaire : cœur qui s'accélère, pulsation rouge, lignes de vitesse, flou, champ élargi | ✅ main |
| 52 | `cafe.js` (`boireCafe`, `battreCoeur`, `surcadrageCafe`), `telephone-main.js` (paramètre `objet`) |
| 53 | `53-jeu-animations-feedback.md` | Jeu, étape 39 : animations de feedback — arrivée du dossier (glisser + tampon « SIGNALEMENT » + pulsation de la ligne sur la carte), jauges en eased avec deltas flottants, urgence du compteur sous 10 s (barre rouge, sablier accéléré) ; animations réduites respectées | ✅ main |
| 53 | `feedback.js` (`jaugesAffichees`, `dessinerTamponSignalement`, `couleurCompteur`) |
| 54 | `54-jeu-micro-interaction-sonore.md` | Jeu, étape 40 : interaction sonore au micro (push-to-talk, touche M) — amplitude, fragmentation, densité, hauteur, turbulence pilotent une texture granulaire ; voix, souffle, bruit ; VU-mètre à l'écran ; repli si micro refusé ; sans effet sur les règles Q1–Q61 | ✅ main |
| 54 | `micro.js` (`getUserMedia`, `hauteurAutocorrelation`, `jouerGrain`) |
| 55 | `55-jeu-defis-ralenti.md` | Jeu, étape 41 : défis de semaine réels (3 tirés par la graine, +5 sur la jauge concernée si tenus, bilan dans le mail et le rapport) et ralenti tactique (touche R, pause de 10 s du compteur, 1×/jour) | ✅ main |
| 55 | `game.js` (`tirerDefis`, `demanderRalenti`), `journee.js` (`dessinerRalenti`) |
| 56 | `56-jeu-rapport-semaine-deblocage.md` | Jeu, étape 42 : rapport de fin de semaine chiffré (dossiers, décisions, jauges, défis) + papier sur le bureau, mail du patron du dernier soir, déblocage de la semaine suivante en mode histoire, palmarès des semaines persisté | ✅ main |

### Statut des prompts (vérifié le 10/11/2026 dans `site/public/`)

Légende : **✅ main** = implémenté et fusionné dans `main` (toute la chaîne des branches empilées
25–34 l'est depuis le 10/11/2026) ; **◻ prévu** = rien dans le
code ; **🗄 exécuté, pages retirées** = prompt du site Astro exécuté le 9/11, dont les pages ont
été supprimées quand le jeu est passé à la racine (voir `journal.md`). Seule page Astro restante :
`/cartel/` (prompt 33, section 6).

Preuves dans le code (grep ; 14–34 relevées au prompt 33, revérifiées et complétées 35–57 au prompt 58) :

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
| 35 | `menu.js` (`dessinerMenuPrincipal`, `entreesMenu`) |
| 36 | `os.js` (`dessinerIndicateurs`, `GRILLE_OS`) |
| 37 | `guide.js` (`ETAPES_GUIDE`, `flecheGuide`) |
| 38 | `telephone.js` (`chargerNotifications`), `bureau.js` (`scrollSortiePC`) |
| 39 | `ds.js` (`DS`, `dsTitre`) |
| 40 | `bureau.js` (`COUCHES_PIECE`) |
| 41 | `histoire.js` (`ELEMENTS_CHAPITRE`, `fenetreRapport`, `lancerCinematique`) |
| 42 | `telephone-main.js` (`dessinerTelephoneEnMain`, `lancerConversation`) |
| 43 | `immersion.js` (`TRANSITION_JOUR`), `sketch.js` (`bandeauEtat`), `bureau.js` (`ECRAN_POSTE`) |
| 44 | `confort.js` (`PISTES`, `Son.radio`, `signatureFin`) |
| 45 | `bureau.js` (`METEO_VISU`), `index.html` (`og:image`), `favicon.svg` |
| 56 | `game.js` (`statsSemaine`, `mailFinSemaine`), `histoire.js` (`fenetreRapportChiffres`) |
| 57 | `57-jeu-webcam-presence-sieste.md` | Jeu, étape 43 : webcam (objet du poste + option Paramètres) — détection de présence locale (luminance centrale + mouvement, images jamais affichées) ; 8 s sans présence → sieste (mêmes règles que l'inactivité 20 s, malus inchangé) ; LED « cam active » ; repli si webcam refusée (renuméroté 57 : le n° 55 est pris par `55-jeu-defis-ralenti.md`) | ✅ main |
| 57 | `webcam.js` (`getUserMedia`, `joueurParti`), `immersion.js` (sieste sur absence) |
| 58 | `58-audit-achever-prompts-precedents.md` | Méta-prompt (hors jeu) : auditer un par un les prompts 01–57 à l'épreuve du code et des docs, terminer ceux qui sont ◻ ou partiels dans l'ordre croissant (priorité aux prompts du jeu 49–57), corriger les statuts ✅/◻ dans ce tableau, documenter dans `jeu/` et `journal.md` après chaque prompt achevé | ✅ main (audit : tous les prompts 01–57 faits, écarts listés ci-dessous) |
| 59 | `59-checkup-site-optimisation.md` | Méta-prompt (hors jeu) : check-up exhaustif du site (build/tests, hors ligne, navigation FR+EN, accessibilité, liens/métadonnées, perfs, secrets) + optimisation du code sans changement de comportement (factorisation, code mort, allègement) + harmonisation doc ↔ code (`jeu/`, `prompts/README.md`, `README.md`, `notes.md`, `journal.md`) + rapport de check-up dans `notes.md` | ✅ main (rapport dans `notes.md`) |
| 60 | `60-jeu-adaptation-mobile.md` | Jeu, étape 44 : adaptation complète au mobile (canvas 1080×1920 en portrait, panneaux empilés, swipe, cibles ≥ 44 px, clavier virtuel) — desktop 1920×1080 inchangé, captures identiques | ✅ main (60a fondations + 60b portrait par recomposition) |
| 61 | `61-jeu-appli-donnees-presentation.md` | Jeu, étape 45 : appli « Données » (icône à droite du bureau, plein écran à l'ouverture) — données actuelles (direct) ou archivées (semaine passée) avec liens vers les API et licences (`jeu/api.md`) ; + page `/presentation/` générée depuis `slides.md` (racine du dépôt), diaporama au Pixel Design System, contenu conforme au brief (chaîne source → grammaire → système → œuvre, règles, interactions, livrables, crédits) — renuméroté 61 : le n° 60 est pris par `60-jeu-adaptation-mobile.md` | ✅ main |
| 62 | `62-jeu-tasse-musique-sieste.md` | Jeu, étape 46 : tasse redessinée en pixel art, « Chillin' Poupi » par défaut, sieste qui se déclenche réellement quand le joueur ne fait rien | ✅ main |
| 63 | `63-jeu-community-enquete-micro-webcam.md` | Jeu, étape 47 : réactions en chaîne aux réponses Community (0–3, délais variés), enquête après coup dans le Journal, radio des chauffeurs et souffle au micro, geste de réveil à la webcam | ✅ main |
| 64 | `64-jeu-micro-souffle-webcam-presence.md` | Jeu, étape 48 : micro recentré sur le souffle (texture sonore et radio des chauffeurs retirées), présence par webcam réparée | ✅ main |
| 65 | `65-webapp-installable-pwa.md` | Webapp installable : manifest complet (icônes maskable 192/384/512, screenshots, shortcuts, id/scope), méta Apple, service worker précache 100 % des assets + bump VERSION + nettoyage des caches + bannière « nouvelle version », bouton « Installer l'application » (beforeinstallprompt), smoke test manifest/icônes/ESSENTIELS, hors ligne total après installation — renuméroté 64 : le n° 62 est pris par `62-jeu-tasse-musique-sieste.md` | ✅ main |
| 66 | `66-jeu-revue-game-design-comprehension.md` | Jeu, étape 48 : revue très complète du game design pour la compréhensibilité (10 axes : onboarding, boucle, UI, feedback, difficulté, affordances, journée, fins, accessibilité, mobile) — 3 parties jouées, frictions classées bloquant/confus/mineur, améliorations implémentées via tutoriel/guide/narration/aide (pas de conseils sous les boutons, choix du prompt 50) ; rapport dans `notes.md`, doc `jeu/63-revue-game-design.md` ; Q1–Q61 et `game.js` inchangés | ✅ main |
| 67 | `67-jeu-main-webcam-sieste.md` | Jeu, étape 50 : une main devant la webcam lance ou interrompt la sieste (reconnaissance locale), l'absence ne déclenche plus la sieste | ✅ main |
| 68 | `68-jeu-carte-appli-principale-equipes-limitees.md` | Jeu, étape 49 : suppression de l'appli Régulation, la Carte devient l'écran de jeu unique (incidents sur la carte, file d'attente, décision dans le panneau), incidents plus détaillés (données réelles), équipes d'intervention limitées (effectifs, cycle en route / sur place / retour, pertinence par type) | ✅ main |
| 69 | `69-jeu-fin-de-journee-nuit-sortie.md` | Jeu, étape 51 : fin de journée — mail puis « Ranger le poste », crépuscule accéléré jusqu'à 21 h (nuit dehors et dans la pièce, son de nuit), flèche « Sortie » à gauche (clavier, mobile, aria-live), pan vers le couloir, fondu au noir, aube du lendemain ; phase `soir` sauvegardée | ✅ main |
| 70 | `70-jeu-livre-aide.md` | Jeu, étape 52 : le livre « Commande » devient « Aide » — nom interne `aide`, glyphe pixel « A », titre de couverture « AIDE », clés i18n `objet.aide` (FR « Livre « Aide » (tutoriel) », EN « “Help” book (tutorial) »), `cibleGuide('livreAide')`, doc `jeu/28` + `jeu/54-…` mises à jour ; `commandesCarte()` et `mp.mode.recommande` inchangés ; Q1–Q61 inchangés | ✅ main |
| 71 | `71-jeu-demarrage-pc-chaque-jour.md` | Jeu, étape 53 : l'animation de démarrage du PC (`dessinerDemarrage`, 3400 ms) est rejouée à chaque nouvelle journée, **uniquement les 3 premiers jours** de la partie (compteur persisté avec la sauvegarde) ; jour 4+ → transition directe ; temps de jeu suspendu pendant le démarrage ; animations réduites → démarrage direct ; Q1–Q61 inchangés | ✅ main |
| 72 | `72-jeu-alertes-choix-reponses.md` | Jeu, étape 54 : pour les alertes (météo, accident/malaise dans la source, affluence), proposer 2–4 choix de réponses rédigés pour la situation réelle, chacun mappé vers une action 1/2/3/0 ou un envoi d'équipe existant — sans indice de correction (prompts 50/66) ; game.js et Q1–Q61 inchangés | ✅ branche `72-jeu-alertes-choix-reponses` |
| 73 | `73-jeu-suppression-carte.md` | Jeu, étape 55 : supprimer la carte géographique de l'écran de jeu (la source ne donne aucune géométrie de ligne) — liste de signalements + panneau, appli renommée « Signalements » (FR/EN), équipes en état textuel ; game.js et Q1–Q61 inchangés | ✅ branche `73-jeu-suppression-carte` |
| 74 | `74-jeu-variete-comprehension-regulation.md` | Jeu, étape 56 : rendre le poste de régulation compréhensible (explication de première ouverture, actions décrites en langage métier dans tutoriel/guide/aide) et casser la répétition (ordre d'arrivée par graine, textes de liaison, rythme de la journée sur données réelles, feedback de série) — game.js et Q1–Q61 inchangés | ✅ branche `74-jeu-variete-comprehension-regulation` |
| 75 | `75-jeu-logo-bouton-demarrer.md` | Jeu, étape 57 : le bouton en bas à gauche de la barre des tâches (carré rouge « REGUL ») est remplacé par le même pictogramme que l'écran de chargement (moniteur + ligne de bus, `index.html` `#chargement .logo`), fonction du bouton inchangée | ✅ branche `75-jeu-logo-bouton-demarrer` |
| 76 | `76-jeu-horaires-realistes-8h.md` | Jeu, étape 58 : horaires réalistes — la journée de jeu démarre à **8 h 00** (`DEBUT_JOURNEE`) au lieu de 6 h 00, propagé à toutes les horloges et textes FR/EN ; fin toujours à 20 h ; règles inchangées | ✅ branche `76-jeu-horaires-realistes-8h` |
| 77 | `77-jeu-temps-x100-taches-simultanees-notifications.md` | Jeu, étape 59 : temps compressé **×100** entre les dossiers (au lieu de ×30), jusqu'à **3 signalements actifs en parallèle** avec compteurs indépendants, et **notifications style bureau** (signalement, mail, commentaire, équipe) cliquables ; Q1–Q61 inchangées | ✅ branche `77-jeu-temps-x100-taches-simultanees-notifications` |
| 78 | `78-jeu-somnolence-remplace-sablier-sieste-malus.md` | Jeu, étape 60 : la **somnolence remplace le sablier** (jauge 0–100, sieste volontaire ou forcée, temps ×100 pendant la sieste) ; pendant la sieste les signalements arrivent et expirent → malus « non traité » (réponse trop tard) + bilan au réveil ; contenus tutoriel/guide/aide sur le jour vs la sieste ; sablier supprimé sans code mort | ✅ branche `78-jeu-somnolence-remplace-sablier-sieste-malus` |
| 79 | `79-jeu-retards-qui-saggravent-community.md` | Jeu, étape 61 : le retard affiché démarre au **vrai chiffre de la source** puis s'aggrave avec le temps (retard effectif calculé, documenté) ; décision « raté » → aggravation durable de la ligne + malus ; **même système sur l'appli Community** (commentaires non répondus qui s'enveniment, répondre vite évite le malus) | ◻ prévu |
| 80 | `80-jeu-revue-ux-globale.md` | Jeu, étape 62 : **revue UX globale** du jeu (3 parties jouées, frictions bloquant/confus/mineur, corrections par ordre de priorité : navigation, libellés, feedback, onboarding, cohérence bureau↔PC, mobile, accessibilité) — game.js et Q1–Q61 inchangés, rapport dans `notes.md` | ◻ prévu |
| 82 | `82-presentation-slidev.md` | Page `/presentation/` refondue en **Slidev** (skill installé via `npx skills add slidevjs/slidev`) : design system Pixel conservé, plusieurs modèles de slides (layouts variés), images avec flèches démontrant le propos, contenu existant de `slides.md` réarrangé, URL `/presentation/` stable, sw.js à jour — renuméroté 82 : le n° 62 est pris par `62-jeu-tasse-musique-sieste.md` | ◻ prévu |
| 83 | `83-note-evaluation-bareme.md` | Méta-prompt (hors jeu) : créer `note-eval.md` à la racine du dépôt — critères d'évaluation officiels du livret (projet /70 + individuel /30, note /20) confrontés à la proposition réelle avec preuves rejouées et citées, note calculée en bas du fichier, leviers actionnables priorisés avant la soutenance J3 ; aucun fichier de code du jeu modifié | ◻ prévu |

Chaîne des branches empilées 26 → 34 : **fusionnée dans `main`** (vérifié par `git merge-base
--is-ancestor` au prompt 58). Depuis le prompt 49, chaque prompt est fusionné dans `main` dès qu'il est
terminé (demande du 10/11/2026).

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

### Audit du 10/11/2026 (prompt 58)

Méthode : pour chaque prompt du jeu (14 à 57), présence des fichiers et symboles listés ci-dessus
(script de vérification, `grep`), doc `jeu/NN-*.md` listée dans `jeu/README.md`, `npm run build` et
`npm test` (smoke + `test-jeu.mjs`). Résultat : **tous les prompts 01–57 sont faits** ; aucun n'est
repassé en ◻. Écarts connus, voulus ou hors de portée de l'assistant :

- **13 / 46** : QR codes vérifiés identiques à ceux générés vers l'URL canonique ; le **scan réel** avec
  un téléphone reste à faire par le groupe.
- **26** : la porte et sa fonctionnalité ont été retirées à la demande du groupe (10/11/2026).
- **30** : la variante du collaborateur (`origin/jeu/prompt-30-bandes-sonores`, `audio.js`) n'est pas
  fusionnée ; c'est la version de `confort.js` qui est en service — à arbitrer par le groupe.
- **46** : champs `[À COMPLÉTER]` à saisir par le groupe (auteurs, contributions, licence, fiche-source,
  numéro G01) ; licence Hub'Eau et licence des morceaux Loyalty Freak Music (prompt 49) à vérifier.
- **47** : arbre de compétences, événements chaînés, personnages récurrents, nouvelles sources, journée
  type : **reportés par le prompt lui-même** (règles Q1–Q61 ou données à étudier).
- **53** : dans l'appli Carte, c'est le repère d'incident qui pulse (déjà en place), pas le tracé de ligne.
- **54 / 57** : micro et webcam vérifiés avec des périphériques simulés (Chromium) ; essai avec un vrai
  micro et une vraie webcam, et réglage des seuils, à faire en salle.
- `scripts/test-difficulte.mjs` dépend d'un `base.mjs` hors dépôt (Playwright) : remplacé dans
  `npm test` par `scripts/test-jeu.mjs`.

