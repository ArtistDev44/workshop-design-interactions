# todo.md — PATRIMOINE.EXE / Nantes 001 (STUDIO)

Édition : PXE · NTE001 · ESD Nantes · B3 Design — 9, 10 & 12 novembre 2026
Intervenant : Kamel Ghabte · Groupe de 2 à 3 étudiants
Stack : p5.js / JS / Open Data · Durée : 21 h · Dépôt : workshop-design-interactions
Références projet : contexte/PATRIMOINE.EXE - Nantes 001 — Cours étudiant B3 Design — ESD Nantes — 2026.md (livret officiel) · contexte/PATRIMOINE.EXE — International Computational Heritage Framework.md

Corpus Nantes 001 : Passage Pommeraye, Île Feydeau / mascarons, Château des ducs de Bretagne, Tour LU, grues et chantiers navals, patrimoine arboré, inventaires locaux, mémoire de la traite. Une autre source documentée peut être défendue.

Chaîne à tenir du début à la fin : source → grammaire → système → œuvre. Une source réelle avant un style. Un système stable avant une technologie supplémentaire. Un mapping justifié avant une API. Une œuvre exposable avant une démonstration de code.

## Phase 0 — Cadrage (avant / début J1)

- [ ] Former le groupe (2 à 3 étudiants) et répartir les rôles
- [ ] Choisir une seule source patrimoniale principale dans le corpus
- [ ] Réserver l'identifiant d'œuvre : PXE-NTE001-G{groupe}-W{numéro}
- [ ] Nommer le dossier de rendu : PXE_NTE001_G{nn}_NOM-PROJET
- [ ] Créer la structure du livret : index.html, sketch.js, style.css, data/fallback.json, assets/, source-sheet, grammar
- [ ] Choisir une piste créative parmi les 25 du livret (ex. Weather Patterns, City DNA, From Hand to Algorithm) ou en proposer une
- [ ] Écrire la phrase-problématique en une phrase

## Phase 1 — J1, lundi 9 nov : observer / décoder

- [ ] Collecter 5 à 10 détails maximum, pas « tout » ; noter pour chacun ce qui est structuré (axe, module, rythme, relation, matière)
- [ ] Repérer une source institutionnelle qui contextualise : Nantes Patrimonia, Open Data Nantes Métropole, sources validées en cours
- [ ] Noter ce qu'on ne sait pas : ne pas inventer d'histoire pour justifier une forme
- [ ] Remplir la fiche-source V1 : titre / lieu / type / contexte / URL ou référence / date d'accès / droits ou licence / relevés / 3 propriétés observables / 1 propriété volontairement écartée
- [ ] Décomposer la source en 3 micro-grammaires : axes, modules, symétries, répétitions ; séparer invariants et variables
- [ ] Formuler la règle en une phrase : « une unité est répétée tous les X pixels et tourne de Y selon Z »
- [ ] Micro-prototype : une règle forte + une variation, 2 captures, repérer la variable qui change réellement la perception

Fin J1 attendue : fiche-source / grammaire visuelle / sketch minimal / phrase-problématique / piste créative / capture.

## Phase 2 — J2, mardi 10 nov : coder / connecter

- [ ] Relire la chaîne source → règle → comportement et confirmer la direction
- [ ] Poser l'architecture : variables, fonctions (une fonction = une idée formulable), boucles, random / noise, seed fixé pour l'archive
- [ ] Choisir le régime temporel : statique généré / évolution lente / événement / interaction continue
- [ ] Rendre au moins 3 paramètres réellement opérants (V1 fonctionnelle)
- [ ] Tester en 1920×1080, pixelDensity(1), éviter de recréer de gros tableaux dans draw()
- [ ] N'ajouter data / API / interaction que si le mapping est justifiable en une phrase ; sinon assumer un projet génératif
- [ ] Intégrer data ou interaction avec fallback local dans data/fallback.json (V2)
- [ ] Test croisé silencieux par un autre groupe (30 à 60 s, 3 observations notées)
- [ ] Corriger une faiblesse perceptuelle ou technique (V3), documenter l'itération
- [ ] Démarrer le README avec les sections du livret

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
- [ ] Générer un QR code pointant vers le site web de l'œuvre (page en ligne de l'édition ou GitHub Pages du dépôt)
- [ ] Intégrer le QR code au cartel / à l'affichage et tester le scan en conditions réelles
- [ ] 14:00 Installation + captation : hero.jpg, detail-01.jpg, process.jpg, demo.mp4 (20 à 30 s), thumb.jpg
- [ ] 15:00 Micro-exposition + soutenance
- [ ] 16:15 Collecte + debrief : structure de dossier conforme au livret, archive complète, dépôt final

## Contrôles qualité

### Obligatoires du livret

- [ ] Source patrimoniale identifiable et documentée
- [ ] Grammaire explicite : au moins une règle structurante clairement formulée
- [ ] Prototype fonctionnel lançable dans un navigateur
- [ ] Au moins 3 paramètres réellement opérants
- [ ] Test par un autre groupe + au moins une itération documentée
- [ ] Documentation complète permettant de comprendre et relancer le projet

### Checklist de robustesse (avant l'exposition)

- [ ] Le projet se relance après un refresh
- [ ] Le projet affiche quelque chose sans API
- [ ] Les assets utilisent des chemins relatifs
- [ ] Aucune clé privée n'est dans le code
- [ ] Un reset est disponible
- [ ] Le plein écran 1920×1080 est testé
- [ ] La console ne produit pas d'erreur continue
- [ ] La version finale est sauvegardée dans un dossier distinct

### Accessibilité

- [ ] Contraste suffisant pour les informations de médiation
- [ ] Pas de flashs rapides ni d'effets stroboscopiques
- [ ] Alternative clavier / touch si l'interaction principale exclut certains gestes
- [ ] Version fonctionnelle sans audio si le son n'est pas nécessaire
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

## Jalons de la semaine

| Date | Jalon |
|---|---|
| Lun 9 nov | J1 : source validée, fiche-source V1, grammaire visuelle, sketch minimal, capture |
| Mar 10 nov | J2 : prototype V3, 3 paramètres opérants, mapping, fallback, test croisé |
| Mer 11 nov | Férié : aucun travail obligatoire |
| Jeu 12 nov | J3 : freeze à midi, archive complète, QR code sur le cartel, soutenance 15:00, dépôt final |
