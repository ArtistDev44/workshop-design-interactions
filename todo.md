# todo.md — PATRIMOINE.EXE / Nantes 001 (STUDIO)

Édition : PXE · NTE001 · ESD Nantes · B3 Design — 9, 10 & 12 novembre 2026
Intervenant : Kamel Ghabte · Groupe de 2 à 3 étudiants
Stack : p5.js / JS / Open Data · Durée : 21 h · Dépôt : workshop-design-interactions
Références projet : contexte/PATRIMOINE.EXE - Nantes 001 — Cours étudiant B3 Design — ESD Nantes — 2026.md (livret officiel) · contexte/PATRIMOINE.EXE — International Computational Heritage Framework.md · contexte/instructions-personnelles.md (règles de travail) · journal.md (journal des pushes)

Corpus Nantes 001 : Passage Pommeraye, Île Feydeau / mascarons, Château des ducs de Bretagne, Tour LU, grues et chantiers navals, patrimoine arboré, inventaires locaux, mémoire de la traite. Une autre source documentée peut être défendue.

Chaîne à tenir du début à la fin : source → grammaire → système → œuvre. Une source réelle avant un style. Un système stable avant une technologie supplémentaire. Un mapping justifié avant une API. Une œuvre exposable avant une démonstration de code.

## Vue d'ensemble — protocole 3 jours

| J1 · Lundi 9 nov | J2 · Mardi 10 nov | J3 · Jeudi 12 nov |
| --- | --- | --- |
| Observer / Décoder | Coder / Connecter | Produire / Exposer |
| ☐ Fiche-source patrimoniale | ☐ Architecture du code | ☐ Freeze fonctionnel (midi) |
| ☐ Grammaire extraite | ☐ 3 paramètres opératoires | ☐ README |
| ☐ Sketch minimal p5.js | ☐ Mapping data / API | ☐ Manifest JSON |
| ☐ Problématique posée | ☐ Fallback local (offline) | ☐ Cartel |
| ☐ Direction créative fixée | ☐ Test croisé silencieux | ☐ Captation |
|  | ☐ Itération post-test | ☐ Soutenance individuelle |

Suivi rapide du protocole. Le détail de chaque journée est dans les phases ci-dessous : cocher une ligne du tableau revient à valider les tâches correspondantes de la phase du jour.

## Phase 0 — Cadrage (avant / début J1)

- [ ] Former le groupe (2 à 3 étudiants) et répartir les rôles
- [ ] Choisir une seule source patrimoniale principale dans le corpus
- [ ] Réserver l'identifiant d'œuvre : PXE-NTE001-G{groupe}-W{numéro}
- [ ] Nommer le dossier de rendu : PXE_NTE001_G{nn}_NOM-PROJET
- [x] Créer la structure du livret : index.html, sketch.js, style.css, data/fallback.json, assets/, source-sheet, grammar — `site/public/`
- [ ] Choisir une piste créative parmi les 25 du livret (ex. Weather Patterns, City DNA, From Hand to Algorithm) ou en proposer une
- [x] Écrire la phrase-problématique en une phrase — `jeu/00-concept.md`

## Phase 1 — J1, lundi 9 nov : observer / décoder

- [ ] Collecter 5 à 10 détails maximum, pas « tout » ; noter pour chacun ce qui est structuré (axe, module, rythme, relation, matière)
- [ ] Repérer une source institutionnelle qui contextualise : Nantes Patrimonia, Open Data Nantes Métropole, sources validées en cours
- [ ] Noter ce qu'on ne sait pas : ne pas inventer d'histoire pour justifier une forme
- [ ] Remplir la fiche-source V1 : titre / lieu / type / contexte / URL ou référence / date d'accès / droits ou licence / relevés / 3 propriétés observables / 1 propriété volontairement écartée
- [ ] Décomposer la source en 3 micro-grammaires : axes, modules, symétries, répétitions ; séparer invariants et variables
- [x] Formuler la règle en une phrase : « une unité est répétée tous les X pixels et tourne de Y selon Z » — règle structurante de `site/public/grammar.md`
- [ ] Micro-prototype : une règle forte + une variation, 2 captures, repérer la variable qui change réellement la perception

Fin J1 attendue : fiche-source / grammaire visuelle / sketch minimal / phrase-problématique / piste créative / capture.

## Phase 2 — J2, mardi 10 nov : coder / connecter

- [ ] Relire la chaîne source → règle → comportement et confirmer la direction
- [ ] Poser l'architecture : variables, fonctions (une fonction = une idée formulable), boucles, random / noise, seed fixé pour l'archive
- [ ] Choisir le régime temporel : statique généré / évolution lente / événement / interaction continue
- [ ] Rendre au moins 3 paramètres réellement opérants (V1 fonctionnelle)
- [ ] Tester en 1920×1080, pixelDensity(1), éviter de recréer de gros tableaux dans draw()
- [ ] N'ajouter data / API / interaction que si le mapping est justifiable en une phrase ; sinon assumer un projet génératif
- [x] Intégrer data ou interaction avec fallback local dans data/fallback.json (V2) — 6 cas dans `site/public/data/fallback.json`
- [ ] Test croisé silencieux par un autre groupe (30 à 60 s, 3 observations notées)
- [ ] Corriger une faiblesse perceptuelle ou technique (V3), documenter l'itération
- [x] Démarrer le README avec les sections du livret — `site/README.md`

Fin J2 attendue : prototype V3 / mapping / fallback / test croisé / décision d'itération / README en cours.

## Mercredi 11 nov — férié

Aucun travail obligatoire. Sauvegarde et relecture des notes possibles, rien de plus.

## Phase 3 — J3, jeudi 12 nov : produire / exposer

- [ ] 09:00 Preflight : relancer le projet, lister les risques, passer la checklist de robustesse, plan de stabilisation
- [ ] Finalisation : stabilité, composition, temporalité, reset, fallback
- [ ] FREEZE FONCTIONNEL À MIDI — après midi : plus aucune réécriture de l'architecture
- [ ] 13:00 Documentation : README complet (Auteurs, Source patrimoniale, Concept, Grammaire/règles, Stack, Data/interaction, Lancer le projet, Fallback/limites, Contributions, AI usage, Sources/droits)
- [ ] Rédiger le cartel : 80 à 120 mots + source patrimoniale + système, au format du livret
- [ ] Produire manifest.json (modèle du livret) et finaliser source-sheet et grammar
- [x] Générer un QR code pointant vers le site web de l'œuvre (page en ligne de l'édition ou GitHub Pages du dépôt) — ⚠ PNG du prompt 13 générés vers l'ancienne adresse GitHub Pages (404) : à régénérer, voir ci-dessous
- [ ] Intégrer le QR code au cartel / à l'affichage et tester le scan en conditions réelles
- [x] 14:00 Installation + captation : hero.jpg, detail-01.jpg, process.jpg, demo.mp4 (20 à 30 s), thumb.jpg (fait au prompt 46 : `site/public/captures/`, vrai rendu)
- [ ] 15:00 Micro-exposition + soutenance
- [ ] 16:15 Collecte + debrief : structure de dossier conforme au livret, archive complète, dépôt final

## Jeu — Salle de contrôle Nantes (œuvre p5.js)

Le jeu est décrit fichier par fichier dans `jeu/` (concept, boucle, API, actions,
jauges, UI, narration, fallback, raccourcis, paramètres, accessibilité).

- [ ] Lire `jeu/00-concept.md` et valider la phrase-problématique
- [ ] Fiche-source V1 : données Tanway/Lila Nantes Métropole + Open-Meteo (archive semaine choisie)
- [x] Sketch minimal p5.js : salle de contrôle à deux panneaux (carte/liste des lignes à gauche, dossier à droite)
- [x] Boucle incident → 3 actions + « ne rien faire » → jauges contextuelles → narration — `game.js`
- [x] Mapping API : retard ≥ 10 min = dossier ; alertes météo Open-Meteo = dossiers (fait : `game.js`, prompts 15–17)
- [x] 15 décisions par partie, semaine réelle sélectionnée au lancement, aucun événement inventé (fait : `REGLAGES.dossiersParPartie` = 15, semaines réelles de `data/semaines/`)
- [x] Compteur de temps par décision ; à 0, « ne rien faire » appliqué
- [x] 3 jauges (fluidité, satisfaction, réputation) + fins multiples selon le bilan (fait ; depuis le prompt 22 le trio est fluidité, réputation, **budget**)
- [x] `data/fallback.json` : 6 cas figés, mode hors ligne jouable
- [x] Raccourcis clavier complets (`jeu/08-raccourcis.md`), reset `R`, test 1920×1080 — raccourcis et reset dans le code ; test 1920×1080 à refaire au preflight
- [x] Accessibilité : `prefers-reduced-motion`, contraste, jouable sans souris et sans audio (fait : prompts 18, 48, 53 ; `prefers-reduced-motion`, contraste ≥ 4,5:1, clavier complet, jouable sans son)

## Contrôles qualité

### Obligatoires du livret

- [ ] Source patrimoniale identifiable et documentée
- [x] Grammaire explicite : au moins une règle structurante clairement formulée — `site/public/grammar.md`
- [x] Prototype fonctionnel lançable dans un navigateur — `site/public/index.html`
- [ ] Au moins 3 paramètres réellement opérants
- [ ] Test par un autre groupe + au moins une itération documentée
- [ ] Documentation complète permettant de comprendre et relancer le projet

### Checklist de robustesse (avant l'exposition)

- [x] Le projet se relance après un refresh (vérifié : sauvegarde automatique et reprise, prompt 33)
- [x] Le projet affiche quelque chose sans API (vérifié : instantanés `data/fallback.js`, mode hors ligne)
- [x] Les assets utilisent des chemins relatifs — `./` dans `index.html`, vérifié par `npm test`
- [x] Aucune clé privée n'est dans le code — vérifié par `npm test` (motifs de secret)
- [x] Un reset est disponible — fenêtre « Recommencer » (`sketch.js`)
- [x] Le plein écran 1920×1080 est testé (vérifié aux prompts 46–57 dans Chromium 1920×1080)
- [x] La console ne produit pas d'erreur continue (vérifié : aucune erreur console dans les essais automatisés des prompts 46–57)
- [x] La version finale est sauvegardée dans un dossier distinct (fait : `rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/`, prompt 46)

### Accessibilité

- [ ] Contraste suffisant pour les informations de médiation
- [x] Pas de flashs rapides ni d'effets stroboscopiques (vérifié : pulsations ≤ 1,5/s, pas de flash, prompts 52–53)
- [x] Alternative clavier / touch si l'interaction principale exclut certains gestes (fait : tout au clavier, touch basique)
- [x] Version fonctionnelle sans audio si le son n'est pas nécessaire (fait : son coupé par M, le jeu reste complet)
- [ ] Le visiteur peut essayer et comprendre sans longue explication orale

### Les 7 invariants du standard

- [ ] Source réelle & provenance — source sheet
- [ ] Grammaire explicite — grammar map
- [ ] Système computationnel — code / logic
- [ ] Mapping perceptible — mapping sheet
- [ ] Œuvre montrable — live / capture
- [ ] Robustesse & responsabilité — preflight
- [ ] Archive relançable — archive package

## Soutenance et évaluation

Note finale /20 = (points projet /70 + points individuels /30) ÷ 5. Exemple du livret : 58/70 + 25/30 → 16,6/20.

### Projet commun — 70 points

| Critère | Points |
|---|---|
| Recherche patrimoniale & provenance | 10 |
| Grammaire & concept | 15 |
| Prototype & fonctionnement | 15 |
| Data / interaction / mapping | 10 |
| Design visuel & expérience | 10 |
| Processus, test & documentation | 10 |

### Évaluation individuelle — 30 points

| Critère | Points |
|---|---|
| Contribution réelle et traçable (commits, versions, éléments produits) | 10 |
| Maîtrise et compréhension (expliquer une fonction, une règle, un mapping) | 8 |
| Oral individuel (question individuelle) | 5 |
| Autonomie, engagement, itération | 4 |
| Documentation personnelle & intégrité (Contributions, AI usage, sources) | 3 |

- [ ] Remplir la section Contributions du README, nominative et précise (pas de passager invisible)
- [ ] Conserver commits, captures de travail et fichiers intermédiaires
- [ ] Remplir la fiche individuelle avant la soutenance : nom, groupe, 3 contributions principales, une décision de design défendable, une décision technique explicable, une difficulté résolue, usage d'IA
- [ ] Ajouter la note AI usage (3 à 5 lignes) au README si un assistant IA a été utilisé
- [ ] Pouvoir ouvrir et expliquer n'importe quelle partie du code ou du design

### Questions de soutenance à préparer

1. Quelle propriété de la source avez-vous volontairement laissée de côté ?
2. Quelle règle est la plus importante dans votre système ?
3. Quel paramètre a le plus d'effet perceptuel ?
4. Pourquoi votre mapping est-il pertinent ?
5. Que se passe-t-il si le réseau disparaît ?
6. Quelle itération a réellement amélioré le projet ?
7. Que changeriez-vous avec une semaine supplémentaire ?
8. Quelle partie serait publiable telle quelle, et laquelle demanderait une vérification de droits ?

## Reste à faire avant le rendu J3 (audit du prompt 33, 10/11/2026)

Vérifié par `ls` / `grep` dans le dépôt : seuls les éléments existants sont cochés plus haut.

### Livrables manquants
- [x] `manifest.json` au modèle du livret : `site/public/manifest.json` (prompt 46 ; `authors`, `license` et la licence Hub'Eau renseignés le 11/11/2026)
- [ ] Cartel 80–120 mots : texte présent dans `site/src/content/oeuvres/pxe-nte001-g01-w01.json` (validé au build, affiché sur `/cartel/`) ; « satisfaction des usagers » remplacée par « budget » (prompt 46) — relecture finale par le groupe
- [x] Captures : `site/public/captures/` — `hero.jpg`, `detail-01.jpg`, `process.jpg`, `thumb.jpg`, `demo.mp4` (28 s, refaite au prompt 59), issues du vrai rendu (prompt 46)
- [ ] QR codes `site/public/assets/qr-*.png` : vérifiés identiques à ceux générés vers l'URL canonique (prompt 46) — reste à tester le scan en conditions réelles
- [ ] Checklist de robustesse complète au preflight (refresh, sans API, 1920×1080, console)
- [x] Version finale sauvegardée : `rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/` (lancée hors ligne par `file://`, sans erreur ; prompt 46)

### `[À COMPLÉTER]` qui attendent une saisie humaine du groupe
- [ ] `site/README.md` : Auteurs (noms et rôles), Contributions (nominatives), AI usage (ce qui a été relu, réécrit, testé)
- [x] `site/src/content/oeuvres/pxe-nte001-g01-w01.json` : `auteurs` (Mattéo Brevet, Guillaume Renoult, comme `LICENSE` et les crédits du menu) et `groupe` (G01, repris de l'identifiant) renseignés le 11/11/2026
- [x] `site/public/source-sheet.md` : Contexte et 3 propriétés observables remplis (prompt 59) ; propriété écartée confirmée le 11/11/2026
- [x] `LICENSE` : licence MIT, titulaires Mattéo Brevet & Guillaume Renoult (README et manifest alignés le 11/11/2026)
- [ ] Déploiement : documenter comment Cloudflare Pages publie le site (intégration Git ou dépôt manuel) ; `.github/workflows/deploy.yml` publie sur GitHub Pages (404) — le garder, le corriger ou le supprimer

### Branches à arbitrer
- [x] Fusionner (sur demande) la chaîne empilée `jeu/prompt-26-sortie-pc` → … → `jeu/prompt-33-sauvegarde-progression` → `vibe/prompt-33-audit-coherence-4c094b-application` (fait : chaîne fusionnée dans `main`, vérifié au prompt 58)
- [ ] Trancher entre le prompt 30 de la chaîne (`confort.js`) et la variante non intégrée `origin/jeu/prompt-30-bandes-sonores` (`audio.js`)
- [x] Prompt 34 (`prompts/34-jeu-fenetre-loire-tutoriel.md`) : prévu, non implémenté (fait : prompt 34 implémenté et fusionné)

## Jalons de la semaine

| Date | Jalon |
|---|---|
| Lun 9 nov | J1 : source validée, fiche-source V1, grammaire visuelle, sketch minimal, capture |
| Mar 10 nov | J2 : prototype V3, 3 paramètres opérants, mapping, fallback, test croisé |
| Mer 11 nov | Férié : aucun travail obligatoire |
| Jeu 12 nov | J3 : freeze à midi, archive complète, QR code sur le cartel, soutenance 15:00, dépôt final |
