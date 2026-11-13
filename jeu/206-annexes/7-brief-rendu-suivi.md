# Audit axe 7 — Conformité au brief, dossier de rendu, documentation, suivi des audits

- Dépôt audité : worktree `/home/guillaume/ESD_Docs/design-interaction/wt-205`, commit **f07351b** (après le prompt 203). Lecture seule.
- Date : 13/11/2026.
- **Attention** : `origin/main` a avancé pendant l'audit. Il est maintenant à **cd7c1be**, avec le prompt 204 (« corrections de l'audit UX, constats 2 à 7 ») et le prompt 205 rédigé (mobile portrait). Le suivi du § 5 indique les deux états : f07351b et origin/main.
- Niveaux de preuve employés :
  - **V** : vérifié par commande (grep, diff, git) ;
  - **L** : lu dans un document, non rejoué ;
  - **NV** : non vérifié.
- Rien n'a été exécuté (pas de `npm run build` ni `npm test` : il n'y a pas de `node_modules` dans le worktree, et c'est le travail d'un autre axe).

---

## 1. Conformité au brief (livret, sections « Votre projet final », « Ce que chaque groupe remet », « Notation », « Checklist de robustesse »)

### 1.1 Obligations du projet final

| Exigence (livret l. 46-53) | Statut | Preuve |
|---|---|---|
| Source patrimoniale identifiable et documentée | **Présent** | `site/public/source-sheet.md`, identique à `rendu/…/source-sheet.md` (V). Date d'accès : 2026-11-09 (l. 12). Propriété écartée confirmée (l. 16). |
| Grammaire explicite, au moins une règle structurante | **Présent** | `site/public/grammar.md:5-17`. La règle est formulée telle qu'elle est jouée : le seuil de 10 min ne joue qu'en temps réel, ce qui est assumé. Fiche à 7 champs : l. 38-50. Espace génératif : l. 52. |
| Prototype lançable dans un navigateur | **Présent** | `rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/index.html` et `site/public/index.html` (V présence ; lancement NV ici). |
| ≥ 3 paramètres opérants | **Présent** | `site/src/content/oeuvres/pxe-nte001-g01-w01.json`, champ `parametres` : semaine, difficulté, en ligne / hors ligne (V). |
| Test par un autre groupe + ≥ 1 itération documentée | **Absent (test) / présent (itérations)** | Test croisé : `todo.md:57` non coché ; `README.md:25` et `rendu/…/README.md:23` « [À COMPLÉTER] » ; `notes.md:490-499` protocole seul, `notes.md:452-454` verbatims vides (V). Itérations : 189 prompts et `journal.md`. |
| Documentation pour comprendre et relancer | **Partiel** | Les 12 rubriques du README minimal sont présentes dans `rendu/…/README.md` (titres l. 1-126, V). Mais Contributions (l. 112), rôles (l. 44) et part humaine de l'IA (l. 124) sont « [À COMPLÉTER] ». |

### 1.2 Livrables (« Ce que chaque groupe remet », l. 691-702)

| Livrable | Statut | Preuve / remarque |
|---|---|---|
| Projet lançable (`index.html` + scripts + `data/fallback.json`) | **Présent, mais copie figée désynchronisée** | `diff -rq site/public rendu/…` : **13 fichiers différents**. `community.js`, `confort.js`, `game.js`, `i18n.js`, `immersion.js`, `menu.js`, `os.js`, `panneau.js`, `parametres.js`, `portrait.js`, `sw.js`, `version.js` et `data/messages.{js,json}` diffèrent : le prompt 202 n'est pas archivé (V). |
| Fiche-source (`.md` + `.pdf`) | **Présent** | `rendu/…/source-sheet.md` et `.pdf`. PDF non ouvert (NV). |
| Grammaire (diagramme, règles, invariants, variables) | **Partiel** | Règles, invariants et variables présents. **Aucun diagramme** : seule la chaîne en texte (`grammar.md:3`, V). Déjà signalé par `audit-2026-11-12.md` § 5.2. |
| README | **Partiel** | Voir 1.1 (saisies humaines manquantes). |
| Manifest | **Partiel** | `site/public/manifest.json:28` : `ai_usage` contient « Relecture et part humaine : [À COMPLÉTER] ». `data_sources` omet OSM et les jeux ODbL (voir § 3). |
| Cartel 80–120 mots + source + système | **Présent** | `rendu/…/cartel.md` : 114 mots (V, `wc -w`). Source, Système, Données et chaîne y figurent. Le `README.md:31` racine annonce « 111 mots », c'est un écart mineur. |
| Captation (hero, detail-01, process, thumb, demo 20–30 s) | **Présent** | `site/public/captures/` et `rendu/…/` : fichiers identiques (cmp V). Refaits le 12/11 à 23:57 (commit 614ecab), mais 12 commits sur `site/public/*.js` ont suivi (prompts 196–203). Durée de 29 s d'après les docs (L). |
| Présentation | **Présent** | Deck Slidev `slides/slides.md`, build dans `site/public/presentation/`. `rendu/…/slides.md` est une **ancienne version** (« Auteurs : [À COMPLÉTER] » l. 14, part humaine l. 111), différente de `slides/slides.md` (V). |
| Structure de dossier `PXE_NTE001_G01_NOM-PROJET/` | **Présent** | `rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/` (V). |
| Fiche individuelle (Notation, l. 815-829) | **Absent** | `todo.md:165` non coché ; aucun fichier dédié (V). |
| Checklist de robustesse (l. 896-907) | **Non cochée par un humain** | `todo.md:189` (V). Les tests automatisés couvrent une partie (L). |
| QR code testé en conditions réelles | **Absent** | `todo.md:76` et `:188` non cochés (V). |

### 1.3 Chaîne source → grammaire → système → œuvre

- **Saine (V/L)**. Chaque maillon a un document qui le porte :
  - source : `source-sheet.md` ;
  - grammaire : `grammar.md`, chaîne l. 3, mapping en une phrase l. 58 ;
  - système : `site/public/game.js`, avec la table base + 1d6 ;
  - œuvre : jeu, `cartel.astro`, `making-of.astro`, kit de presse, trailer, logo (`logo/planche.html|png`), présentation.
- Le cartel (`site/src/pages/cartel.astro`) lit la fiche JSON validée au build (`site/src/content.config.ts:17`, L).
- **Fragilité restante (L)** : le cœur de la règle (retard ≥ 10 min) ne joue qu'en temps réel, mode verrouillé avant la fin de l'histoire. Cette limite est assumée dans `grammar.md:12-17` mais reste non tranchée. Voir le constat 3 de `jeu/201-audit-gameplay.md` et le point § 3.13 de `ux-informations-2026-11-12.md`.

---

## 2. Constats (classés par importance pour le rendu)

### C1 — Saisies humaines du README / manifest / crédits toujours vides — **bloquant pour la note individuelle**
- **Où** :
  - `site/README.md:11, 133, 142` ;
  - `rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/README.md:44, 112, 124` ;
  - `site/public/manifest.json:28` ;
  - `site/public/i18n.js:1369` et `:3305` (« Part humaine : [À COMPLÉTER] » affiché dans l'écran Crédits du jeu).
- **Effort** : S (saisie du groupe). **Preuve** : V (grep).
- **Piste** : rédiger Rôles, Contributions nominatives et AI usage (3 à 5 lignes : relu, réécrit, testé), puis recopier dans les 4 fichiers et dans `rendu/`. Le barème (`note-eval.md` § 5, leviers 1 à 3) chiffre jusqu'à +8 points individuels.

### C2 — Test croisé et tests humains : aucune trace — **bloquant (obligation du livret)**
- **Où** :
  - `todo.md:57`, `:106` ;
  - `README.md:25` ;
  - `rendu/…/README.md:23` ;
  - `notes.md:452-454` et `:501` (gabarit vide) ;
  - `prompts/README.md:272` (prompt 192 « ◐ tests à faire passer par le groupe »).
- **Effort** : S à M (hors code). **Preuve** : V.
- **Piste** : faire le test de 60 s avec un autre groupe, noter 3 observations et une décision dans `notes.md` § « Tests humains », puis cocher `todo.md`. Si le test n'a pas eu lieu, l'écrire tel quel.

### C3 — Copie figée `rendu/` désynchronisée de `site/public/` — **majeur**
- **Où** : `rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/`. Le dernier commit qui la touche est 35cc418 ; le prompt 202 (6c304ec) n'y est pas. 13 fichiers diffèrent (V, `diff -rq`), et davantage encore avec le prompt 204 sur origin/main.
- **Autres incohérences** :
  - `rendu/…/slides.md` est un ancien diaporama, avec « Auteurs : [À COMPLÉTER] » ;
  - `rendu/README.md:12-13` affirme que auteurs, licence et fiche-source restent « [À COMPLÉTER] », ce qui est périmé.
- **Effort** : S. **Preuve** : V.
- **Piste** : resynchroniser selon la procédure de `rendu/README.md`, remplacer `rendu/…/slides.md` par un renvoi vers `/presentation/` (ou le supprimer), mettre à jour `rendu/README.md`. Le faire **en dernier**, après les corrections et les saisies.

### C4 — Crédits du jeu : Hub'Eau « [À COMPLÉTER] » alors que la licence est vérifiée — **majeur (visible à l'écran)**
- **Où** :
  - `site/public/i18n.js:1351` (FR) et `:3287` (EN) ;
  - même texte dans `rendu/…/i18n.js` et sur origin/main (`i18n.js:1353`).
- `manifest.json:23`, `rendu/…/README.md` (Sources/droits) et `note-eval.md:88` donnent pourtant « Licence Ouverte Etalab, vérifié le 2026-11-11 ».
- Signalé par `audit-2026-11-12.md` § 4 (dernière ligne) et jamais corrigé.
- **Effort** : S (2 chaînes). **Preuve** : V.
- **Piste** : « Hub'Eau (Licence Ouverte Etalab ; auteur PHyC, SCHAPI/Vigicrues) » en FR et EN.

### C5 — Licences des ressources tierces incomplètes dans `LICENSE`, `manifest.json` et les README — **majeur**
- **Où** : `LICENSE` (l. 27-41). La liste des éléments non couverts ne cite que p5.js, Open Data Nantes, Open-Meteo, `contexte/` et `design-system/`. Manquent :
  - Lucide (ISC) : texte de licence bien présent dans `site/public/licences/lucide-LICENSE.txt` ;
  - JetBrains Mono (SIL OFL 1.1) : citée dans `site/public/fonts/README.md`, mais le **texte de l'OFL n'est pas livré** avec les `.woff2`, ce que l'OFL exige ;
  - musiques CC0 (`site/public/audio/CREDITS.md`) ;
  - trailer CC BY 4.0 (`trailer/CREDITS.md`) ;
  - Hub'Eau ;
  - **OpenStreetMap (ODbL)** : `site/public/data/lieux.json:2`, crédité dans le jeu seulement (`i18n.js:1353`).
- `manifest.json` (`data_sources`) omet aussi OSM et les jeux ODbL interrogés par le téléphone (`notifs-tel.js:335` et suivantes : parkings, vélos, trafic `244400404_fluidite-axes-routiers…` ODbL, pollens et ATMO ODbL selon `site/src/lib/datasets.js:68,86,110`). Les instantanés de ces jeux sont redistribués dans `data/fallback/`.
- **Effort** : S. **Preuve** : V (grep et lecture).
- **Piste** : compléter la liste de `LICENSE`, ajouter `site/public/licences/OFL-jetbrains-mono.txt`, ajouter OSM et les jeux ODbL à `manifest.json` et à la rubrique Sources/droits des README.

### C6 — Kit de presse : droits des images et date d'exposition non renseignés — **majeur pour la diffusion, mineur pour la note**
- **Où** :
  - `site/public/kit-presse/README.md:10-18, 37` (colonne Licence vide pour les 8 fichiers) ;
  - `site/public/kit-presse/index.html:91, 94, 104` ;
  - `communique-de-presse.md:19, 23` (et `.txt`).
- **Effort** : S (décision du groupe). **Preuve** : V.
- **Piste** : choisir une licence pour les captures (par exemple CC BY 4.0 au nom des auteurs, ou « tous droits réservés, reproduction presse autorisée »). La date et le lieu d'exposition sont à saisir par le groupe.

### C7 — Déploiement Cloudflare non documenté ; `deploy.yml` publie vers une adresse en 404 — **mineur**
- **Où** : `.github/workflows/deploy.yml:4-8`, `site/README.md:35, 112`, `todo.md:197`.
- Signalé dans `note-eval.md` (levier 12) et `audit-2026-11-12.md` § 6, toujours ouvert.
- **Effort** : S. **Preuve** : V.
- **Piste** : écrire le mode de publication réel (intégration Git Cloudflare ou dépôt manuel : `[À COMPLÉTER]` par le groupe), puis supprimer ou désactiver le workflow GitHub Pages.

### C8 — Chiffres et numérotation périmés dans la documentation publique — **mineur**
Toutes les preuves sont V.
- `README.md:24` et `:91` annoncent « 181 prompts numérotés (01 à 196) », or il y a **189 fichiers** numérotés jusqu'à 203 à f07351b.
- `README.md:91` liste « 164–169 absents », or `prompts/164-…md` existe : il est marqué « ◻ non exécuté » dans `prompts/README.md`. Les numéros réellement absents sont 127–129, 135, 148–149, 153–159 et 165–169.
- `rendu/…/README.md:116` donne « Guillaume 152, Mattéo 29 », alors que `prompts/auteurs.json` donne 160 / 29.
- `audit-2026-11-12.md:19` et `jeu/130-134-audit-experience-rendu.md:1` portent le titre « prompts 130 à 124 » (pour 130 à 134). Le tableau de suivi de l'audit (l. 23-37) cite les anciens numéros 115–119, qui désignent aujourd'hui d'autres prompts (115 palettes, 117 clash…).
- **Numéros en double** : 33, 89, 94 et 143 ont chacun deux fichiers. C'est assumé dans `prompts/README.md:76-77, 184-185, 190-191, 236-237`, mais à éviter à l'avenir.
- **Collision en cours** : la branche de cet audit s'appelle `205-audit-complet-projet`, alors que `prompts/205-jeu-mobile-portrait-jouable.md` existe déjà sur origin/main (cd7c1be). Il faut renuméroter avant tout commit.
- **Effort** : S.
- **Piste** : générer ces chiffres par script (comme `npm run auteurs`) ou les retirer des README.

### C9 — `journal.md` : la colonne Commit ne contient pas de hash — **mineur**
- **Où** : `journal.md:7` et suivantes.
  - 290 lignes sur 307 portent « ce commit » au lieu d'un hash.
  - Les 17 hash présents existent tous (`git cat-file -t`, V).
  - L'ordre décroissant des dates est respecté (V).
- **Effort** : M (rétro-remplissage) ou S (changer la règle). **Preuve** : V.
- **Piste** : écrire la ligne après le commit, dans un commit séparé avec le hash court, ou renommer la colonne en « branche / prompt ». La traçabilité de la contribution individuelle en profiterait.

### C10 — `todo.md` : cases des jours 1 et 2 jamais cochées alors que le travail est fait — **mineur**
- **Où** : `todo.md:28-55`. « Remplir la fiche-source V1 » (l. 41), « Former le groupe » (l. 28), etc. ne sont pas cochées, alors que `source-sheet.md` est complète.
- `todo.md:186` (cartel) n'est pas coché alors que le texte est validé : il ne manque que la relecture du groupe.
- **Effort** : S. **Preuve** : V.
- **Piste** : cocher ce qui est prouvé dans le dépôt et ne garder ouvert que ce qui attend le groupe (C1, C2, QR, preflight, fiche individuelle, prompt 30 `audio.js`, l. 201).

### C11 — Index `jeu/README.md` incomplet — **mineur**
- **Où** : 9 documents de `jeu/` ne figurent pas au sommaire :
  - `101b-redondances-espace.md`, `102-carte-plaignant-equipes.md`, `103-une-seule-appli.md`, `104-bureau-au-fil-des-journees.md`, `105-109-carte-dialogue-equipes.md` ;
  - `114-textes.md`, `115-palettes.md`, `117-119-clash-plaignants-incidents.md`, `139-147-journal-bandeau-carte.md`.
- Aucun lien mort vers un fichier inexistant (V).
- **Effort** : S. **Preuve** : V (boucle grep).

### C12 — Documents de conception `jeu/` périmés — **mineur (risque à l'oral)**
- **Où** : `jeu/04-jauges-et-fins.md:12` parle encore de « Satisfaction usagers ». `jeu/201-audit-gameplay.md` § « Documents de conception périmés » cite aussi `01`, `03`, `17`, `82` et `93` comme encore à jour.
- Aucune mention « historique » n'a été ajoutée (V, grep vide).
- **Effort** : S. **Piste** : bandeau « historique — remplacé par … » en tête de ces fichiers.

### C13 — Grammaire sans diagramme — **mineur**
- **Où** : `site/public/grammar.md`. Le livret demande « Diagramme / règles / invariants / variables ».
- **Effort** : S à M. **Piste** : un schéma « fait daté → dossier → 3 répliques → jauges (contexte × 1d6) → fin » dans `grammar.md` et le PDF.

### C14 — `design-system/DESIGN.md` référence encore la police Picon — **mineur (documentaire)**
- **Où** : `design-system/DESIGN.md:12-97` (`fontFamily: "Picon Condensed"`) et `:303-309` (URL des woff2 LCTPicon de metropole.nantes.fr).
- **Aucun usage dans le code** : `grep -rn "Picon\|LCTPicon"` est vide dans `site/src` et `site/public`. Seul le bleu de lien `#005ae1` est repris (`cartel.astro:31`, `making-of.astro:57`), ce qui est conforme à la règle « couleurs, échelle ».
- **Effort** : S. **Piste** : une ligne d'avertissement en tête de DESIGN.md (« typographie relevée pour référence, non utilisée — règle du projet ») pour éviter qu'un lecteur ou un assistant l'applique.

### C15 — Police Bitsy Pixels : licence de redistribution inconnue — **mineur, sain par prudence**
- **Où** : `slides/styles/index.css:38-40` et `site/public/fonts/README.md`.
- Le fichier n'est pas versionné ; la police n'est utilisée qu'en `local()`. C'est correct tant qu'elle n'est pas ajoutée au dépôt sans vérification.

### Ce qui est sain
- Fiche-source, grammaire, cartel et manifest existent sous la forme du livret. Les copies `rendu/` de `grammar.md` et `source-sheet.md` sont identiques à `site/public/` (V).
- Licences des musiques vérifiées à la source, avec SHA-1 (`site/public/audio/CREDITS.md`). Musique du trailer créditée au format exigé (`trailer/CREDITS.md`). Lucide livré avec sa licence ISC. p5.js v1.11.11 annoncé en LGPL-2.1, ce qui est cohérent (`LICENSE`, `lib/p5.min.js` l. 1).
- Pas de police Picon ni d'identité Nantes Métropole dans le code (V). `LICENSE` précise que le projet n'est pas un site officiel.
- `prompts/README.md` : chacun des 189 fichiers numérotés a sa ligne. Aucune ligne ne pointe vers un fichier `prompts/` inexistant ; les autres références renvoient à `jeu/` et existent (V, script).
- `prompts/auteurs.json` couvre exactement les 189 fichiers (V).
- `journal.md` est tenu à chaque push, le plus récent en tête ; tous les hash cités existent.
- `note-eval.md` applique fidèlement le barème du livret § 12 (70 + 30), vérifié contre le livret.

---

## 3. `[À COMPLÉTER]` restants (hors node_modules, dist, fallback), classés pour le rendu

Comptage V : 64 fichiers en contiennent. Les occurrences dans `prompts/`, `CLAUDE.md`, `CONTRIBUTING.md`, `note-eval.md` et dans les commentaires ou mécanismes de repli du code (`i18n.js:4, 3893`, `menu.js:691-693`, `game.js:1569`, `credits.js:5`, `cartel.astro:5`, `content.config.ts:17`, `test-jeu.mjs`) sont **voulues** : c'est la règle « inconnu → [À COMPLÉTER] » ou des citations.

| Priorité | Fichier:ligne | Champ |
|---|---|---|
| 1 — note | `site/README.md:11`, `rendu/…/README.md:44` | Noms et rôles |
| 1 — note | `site/README.md:133`, `rendu/…/README.md:112` | Contributions nominatives |
| 1 — note | `site/README.md:142`, `rendu/…/README.md:124`, `manifest.json:28`, `i18n.js:1369/3305` | Part humaine de l'IA |
| 1 — note | `README.md:25`, `rendu/…/README.md:23`, `notes.md:170, 239, 452-454, 501` | Test croisé, tests humains |
| 2 — visible | `i18n.js:1351/3287` | Licence Hub'Eau dans l'écran Crédits (C4) |
| 2 — visible | `rendu/…/slides.md:14, 111` | Ancien diaporama archivé |
| 3 — diffusion | `kit-presse/README.md:10-18, 37`, `kit-presse/index.html:91, 94, 104`, `communique-de-presse.{md,txt}` | Droits des images, date et lieu d'exposition |
| 4 — interne | `site/README.md:35, 112`, `deploy.yml:7` | Mécanisme Cloudflare |
| 4 — interne | `slides/styles/index.css:39` | Licence Bitsy Pixels |
| 4 — interne | `trailer/SPEC.md:32` | Validation de la variante du trailer par le groupe |
| 4 — interne | `notes.md:147` et suivantes, `jeu/101b`, `102` à `105-109`, `110-113`, `196`, `197`, `203` | Décisions de groupe et ressentis joueurs |
| 4 — interne | `audit-2026-11-12.md`, `ux-informations-2026-11-12/volet-A.md`, `contexte/instructions-personnelles.md` | Citations ou champs de modèle |

---

## 4. Documentation de pilotage

| Document | État | Détail |
|---|---|---|
| `prompts/README.md` | **Cohérent** | 189 fichiers numérotés (plus `README.md` et `auteurs.json` : 191). Tous au tableau. Statuts « ✅ main / fusionné » majoritaires. Lignes ouvertes : 80 (« test joueur novice à faire en salle »), 164 (« ◻ non exécuté », légitime), 192 (« ◐ tests à faire passer par le groupe »). Doublons 33, 89, 94 et 143 assumés. Numéros sautés non expliqués dans le tableau (voir C8). |
| `prompts/auteurs.json` | **Cohérent** | 189 / 189 ; Guillaume 160, Mattéo 29. |
| `journal.md` | **Tenu, peu traçable** | 307 lignes (09/11 au 13/11). Colonne Commit à « ce commit » à 94 % (C9). |
| `todo.md` | **Périmé en partie** | C10. Les vrais restes sont listés l. 186-201. |
| `notes.md` | **Cohérent** | Protocole de tests humains rédigé (l. 471-513), non exécuté. Décisions de groupe du § 6 non tranchées (l. 144-150). |
| `jeu/README.md` | **Incomplet** | 9 fiches hors sommaire (C11). |
| `note-eval.md` | **Daté** | Mis à jour pour la dernière fois le 12/11 (prompt 100). Il ne reflète pas les prompts 101 à 203 et cite des chiffres anciens (« 96 fichiers dans prompts/ », 313 + 374 contrôles). Il affirme Hub'Eau « levé » alors que les crédits du jeu l'affichent encore « [À COMPLÉTER] » (C4). |

---

## 5. Suivi des audits précédents

Légende : ✅ fait · ◐ partiel · ◻ non fait · (204) = fait sur origin/main par le prompt 204, après f07351b.

### 5.1 `audit-2026-11-12.md` (13 h 20, commit e7911fa)

| Recommandation | Statut à f07351b | Preuve |
|---|---|---|
| 3.1 Évaluation contre la survie | ✅ | Prompt 130 (`jeu/130-134-audit-experience-rendu.md`) |
| 3.2 Décision sans information (tendances ▲▼) | ✅, mais remis en cause | `panneau.js:217-279`. L'audit 201 § 2 montre que la tendance révèle la bonne réponse et le clash. |
| 3.3 Une minute avant de jouer | ◐ | Prompts 132 et 160 : `?expo=1` seulement ; hors exposition, inchangé (L). |
| 3.4 Intro qui décrit un autre jeu | ✅ | Prompt 131 (L) |
| 3.5 Narration de 6 s, plaintes qui expirent en pause | ✅ | Prompt 131 (L). Mais le délai Community est faussé par `millis()` (`os.js:284`, V), voir 201 § 1. |
| 3.5 Fin de journée, tension par défaut, équipes sans choix | ◻ | Décisions du groupe ; l'ambulance reste sans pertinence (repris en 201 § 4 et § 8). |
| 3.5 Test d'équilibrage périmé | ◻ | `site/scripts/test-jeu.mjs:79-100` joue encore `renfort/devier/retenir` (V). |
| 4 Netteté de la vue PC, plein écran | ◐ | Plein écran par la touche F (prompt 133, L). Netteté NV. |
| 4 Crédits rognés en portrait (`credits.js:72`) | ◐ / NV | Le test `L < H` a disparu de `credits.js`, mais `credits.js` n'utilise pas `PORTRAIT` (V). Le rendu est à vérifier par le prompt 205. |
| 4 « Quitter la journée » rouge | ✅ | Bouton retiré du bandeau (`panneau.js:103`, prompt 124) |
| 4 Gravité sur la carte, badge daltonien | ✅ / ◐ | Badge : texte sombre calculé (`ds.js:194`, prompt 193). Gravité : NV. |
| 4 Focus clavier unique | NV | — |
| 4 Zoom bloqué `user-scalable=no` | ◻ | `site/public/index.html:5` (V) |
| 4 Bitsy Pixels absente | ◻ | Assumé (`fonts/README.md`) |
| 4 Hub'Eau « [À COMPLÉTER] » aux crédits | ◻ | `i18n.js:1351` (V), voir C4 |
| 5.1 Règle des 10 min, affluence supposée, source à 3 libellés | ✅ (documents) | `grammar.md:12-17` (prompt 134) |
| 5.2 Contributions, test croisé, fiche individuelle | ◻ | C1, C2 |
| 5.2 Captures sur la version finale | ◐ | Refaites le 12/11 à 23:57, 12 commits JS depuis |
| 5.2 Archive `rendu/` à revérifier | ◻ | C3 |
| 6 Mode exposition, filet d'erreur | ✅ | `installation.js:158` (écouteur `error`), prompt 132 |
| 6 Service worker, musique hors ligne, flou, poids audio | ◻ / NV | Non retesté |
| 6 `deploy.yml` | ◻ | C7 |

### 5.2 `jeu/201-audit-gameplay.md` — feuille de route en 9 actions

| # | Action | Statut f07351b | origin/main (cd7c1be) | Preuve |
|---|---|---|---|---|
| 1 | Délai Community : `tempsPlaintes()` au lieu de `millis()` (`os.js:284`) et un test | ◻ | ◻ | `os.js:284` toujours `millis()` (V, aux deux commits). **Bug actif : −3 de réputation sur chaque réponse.** |
| 2 | Simulation d'équilibrage dans `npm test` | ◻ | ◻ | `site/package.json:15` : `smoke.mjs && test-jeu.mjs` seulement (V) |
| 3 | Décider du sort de la tendance ▲▼ | ◻ | ◻ (libellés clarifiés par 204, le principe reste) | `panneau.js:217` |
| 4 | Coût réel du clash + avertissement avant licenciement | ◻ | ◻ | NV dans le code ; aucun commit dédié |
| 5 | Relever le seuil de la fin « moyenne » | ◻ | ◻ | `game.js:814` `SEUILS_FIN = { bonne: 240, moyenne: 150 }` (V) |
| 6 | Temps réel plus tôt / semaines resserrées / agenda plafonné | ◻ | ◻ | Aucun commit |
| 7 | Effet des réponses au patron, équipes différenciées | ◻ | ◻ | `patron.js:777` `repondreRapide` inchangé |
| 8 | Docs `jeu/` périmées marquées « historique » | ◻ | ◻ | C12 |
| 9 | Tests humains du prompt 192 | ◻ | ◻ | C2 |

**Bilan : 0 / 9.** Le prompt 202 (Community, 300 messages), exécuté après 201, n'a pas traité l'action 1.

### 5.3 `jeu/203-audit-ux.md` — feuille de route en 9 actions

| # | Action | f07351b | origin/main (cd7c1be) | Preuve |
|---|---|---|---|---|
| 1 | Community : pas de focus initial, focus en contour | ◻ | ✅ (204) | `jeu/204-corrections-audit-ux.md`, constat 2 (L) |
| 2 | Accords « (s) », « 0/0 », « Game over » traduit | ◻ (133 chaînes « (s) » dans `i18n.js`, V) | ✅ (204), accord automatique dans `t()` | idem, constat 7 |
| 3 | Libellés en clair (Flu./Rép./Bud., F/R/B, équipes, somnolence) | ◻ | ✅ (204) | constat 4 |
| 4 | 3 chevauchements, Indicateurs fermés pendant un dossier | ◻ | ✅ (204) | constat 6 ; « 0 défaut » à l'audit des textes (L) |
| 5 | Tutoriel : une idée par étape, mise en lumière, seuils reportés | ◻ | ✅ (204) | constat 3 |
| 6 | Fiche dossier ancrée, marqueur visible | ◻ | ✅ (204), zoom ×4 `cadrerSur` | constat 5 |
| 7 | Mobile portrait | ◻ | ◻ (prompt 205 rédigé, non exécuté) | `prompts/205-jeu-mobile-portrait-jouable.md` (origin/main) |
| 8 | Autorisations micro / caméra au premier usage | ◻ | ◻ | Hors 204 |
| 9 | Tests avec 5 joueurs | ◻ | ◻ | `[À COMPLÉTER]` |

**Bilan : 0 / 9 à f07351b ; 6 / 9 sur origin/main**. Les corrections de 204 sont déclarées vérifiées par build, tests et audit des textes (L, non rejoué ici).

### 5.4 `ux-informations-2026-11-12.md`

| Suite proposée (§ 4) | Statut | Preuve |
|---|---|---|
| 1 Mode exposition à l'arrivée au poste, pause | ✅ | Prompt 160 « fusionné dans main » (`prompts/README.md`) |
| 2 Textes alignés sur la règle jouée | ✅ | Prompt 161 |
| 3 « Fictif », « affluence supposée », « réel » réservé | ✅ | Prompt 162 |
| 4 Rapport de fin de semaine, faits et sources | ✅ | Prompt 163 |
| 5 Contexte avant la décision, annonces des répliques | ◻ | Prompt 164 « ◻ non exécuté (… dépassé par 117, 184, 196–197) ». Le constat 5 de 203, corrigé en 204, en couvre une partie (L). |
| 6 Couches d'objectifs et soirée allégées | ◐ | Prompts 191 et 194 (rythme, « fin de journée : l'horloge suffit ») en partie ; arbitrage du groupe non consigné |
| § 3 — 16 décisions « à trancher par le groupe » | ◻ en grande majorité | Aucune trace de décision. Exemples : n° 1 (clash indiscernable ou tendance honnête), même question que 201 § 2 ; n° 7 (pression en archive) ; n° 13 (temps réel en exposition) ; n° 16 (vocabulaire, `jeu/04` « Satisfaction », V). |

---

## 6. Priorités pour le rendu (ordre recommandé)

1. **C1 + C2** : saisies humaines (rôles, contributions, part humaine de l'IA, fiche individuelle) et test croisé consigné. C'est le seul gain de points direct.
2. **Bug 201 § 1** (`os.js:284`, une ligne et un test) : il fausse une mécanique jouée devant le jury.
3. **C4 + C5** : crédits Hub'Eau, liste des licences (OSM, ODbL, OFL, Lucide, CC0, CC BY).
4. **C3** : resynchroniser `rendu/` **en dernier**, avec les corrections 204, remplacer `rendu/…/slides.md` et vérifier que les captures correspondent à la version archivée.
5. **C8 à C12** : chiffres périmés, journal, todo, index `jeu/`, docs historiques.
6. Avant de commiter cet audit, **renuméroter** : 205 est déjà pris sur origin/main.
