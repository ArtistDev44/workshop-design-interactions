# todo.md — PATRIMOINE.EXE / Nantes 001 (STUDIO)

Édition : PXE · NTE001 · ESD Nantes · B3 Design — 9, 10 & 12 novembre 2026
Intervenant : Kamel Ghabte · Groupe de 2 à 3 étudiants
Stack : p5.js / JS / Open Data · Durée : 21 h · Dépôt : workshop-design-interactions
Références : livret étudiant Nantes 001 + framework PATRIMOINE.EXE (bibliothèque Design interaction)

Corpus Nantes 001 : Passage Pommeraye, Île Feydeau / mascarons, Château des ducs de Bretagne, Tour LU, grues et chantiers navals, patrimoine arboré, inventaires locaux, mémoire de la traite.

## Phase 0 — Cadrage (avant / début J1)

- [ ] Former le groupe (2 à 3 étudiants) et répartir les rôles
- [ ] Choisir une source patrimoniale nantaise réelle et documentée
- [ ] Réserver l'identifiant d'œuvre : PXE-NTE001-G{groupe}-W{numéro}
- [ ] Créer l'arborescence du dépôt : code/ data/ sources/ docs/
- [ ] Choisir une piste créative parmi les 25 pistes du livret (ex. Weather Patterns, City DNA, From Hand to Algorithm)
- [ ] Écrire la phrase-problématique en une phrase

## Phase 1 — J1, lundi 9 nov : observer / décoder

- [ ] Collecter détails et informations sur site ou corpus (fiche-source V0)
- [ ] Trier et critiquer : sélectionner une source exploitable, vérifier la provenance
- [ ] Décomposer la source en axes, modules, symétries, répétitions (3 micro-grammaires)
- [ ] Coder une règle forte + une variation (micro-prototype p5.js)
- [ ] Vérifier les droits de chaque média et source (licence, URL, date d'accès, auteur / institution)

Fin J1 attendue : fiche-source / grammaire visuelle / sketch minimal / phrase-problématique / piste créative / capture.

## Phase 2 — J2, mardi 10 nov : coder / connecter

- [ ] Relire la chaîne source → règle → comportement et confirmer la direction
- [ ] Poser l'architecture de code (variables, fonctions, boucles, random / noise, seeds)
- [ ] Rendre au moins 3 paramètres réellement opérants (V1 fonctionnelle)
- [ ] Décider si une couche data / API / interaction est pertinente, et écrire le mapping justifié en une phrase
- [ ] Intégrer data ou interaction avec fallback local (V2)
- [ ] Faire le test croisé silencieux par un autre groupe (30 à 60 s, 3 observations notées)
- [ ] Corriger une faiblesse perceptuelle ou technique (V3 documentée)
- [ ] Démarrer le README

Fin J2 attendue : prototype V3 / mapping / fallback / test croisé / décision d'itération / README en cours.

## Mercredi 11 nov — férié

Aucun travail obligatoire. Sauvegarde et relecture des notes possibles, rien de plus.

## Phase 3 — J3, jeudi 12 nov : produire / exposer

- [ ] 09:00 Preflight : relancer le projet, lister les risques, plan de stabilisation
- [ ] Finalisation : stabilité, composition, temporalité, reset, fallback
- [ ] FREEZE FONCTIONNEL À MIDI — après midi : plus aucune réécriture de l'architecture
- [ ] 13:00 Documentation : cartel, README, sources, contributions nominatives, déclaration IA, manifest JSON
- [ ] Générer un QR code pointant vers le site web de l'œuvre (page en ligne de l'édition ou GitHub Pages du dépôt)
- [ ] Intégrer le QR code au cartel / à l'affichage, et tester le scan en conditions réelles
- [ ] 14:00 Installation + captation : hero / détail / process / demo
- [ ] 15:00 Micro-exposition + soutenance (voir préparation ci-dessous)
- [ ] 16:15 Collecte + debrief : vérifier l'archive, pousser le dépôt final

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

### Les 7 invariants du standard

- [ ] Source réelle & provenance — source sheet
- [ ] Grammaire explicite — grammar map
- [ ] Système computationnel — code / logic
- [ ] Mapping perceptible — mapping sheet
- [ ] Œuvre montrable — live / capture
- [ ] Robustesse & responsabilité — preflight
- [ ] Archive relançable — archive package

## Soutenance et évaluation (70 pts commun / 30 pts individuel)

### Barème projet commun (70 pts)

| Critère | Points |
|---|---|
| Recherche patrimoniale & provenance | 10 |
| Grammaire & concept | 15 |
| Prototype & fonctionnement | 15 |
| Data / interaction / mapping | 10 |
| Design visuel & expérience | 10 |
| Processus, test & documentation | 10 |

### Partie individuelle (30 pts)

- [ ] Remplir la section Contributions du README, nominative et précise
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
| Lun 9 nov | J1 : source validée, fiche-source, grammaire visuelle, sketch minimal, capture |
| Mar 10 nov | J2 : prototype V3, 3 paramètres opérants, mapping, fallback, test croisé |
| Mer 11 nov | Férié : aucun travail obligatoire |
| Jeu 12 nov | J3 : freeze à midi, archive complète, QR code sur le cartel, soutenance 15:00, dépôt final |
