# note-eval.md — Évaluation « Nantes en régulation » (PXE-NTE001-G01-W01)

- **Date** : 11/11/2026, veille de la soutenance J3 (jeudi 12/11, 15:00).
- **Évaluateur** : assistant IA (Claude), à la demande du groupe (prompt 83). C'est une **estimation interne** : elle ne remplace pas la note de l'équipe pédagogique.
- **Méthode** : on applique le barème du livret, section 12 (« Notation individuelle »), critère par critère. Les preuves ont été rejouées le jour même sur `main` (commit `f696206`, prompt 93 inclus) :
  - `npm run build` ;
  - `npm test` ;
  - `git log` et `git shortlog` ;
  - `grep -rn "À COMPLÉTER"` (hors `node_modules`, `dist` et `fallback`) ;
  - `diff -rq site/public rendu/…` ;
  - `ffprobe` sur la vidéo de démonstration.
- **Mise à jour du 11/11/2026 (après-midi)** : les leviers 4 à 7 de la section 5 ont été appliqués. Les critères concernés sont rescorés et les manques levés sont barrés.
- **Règle** : un point n'est attribué que s'il est prouvable dans le dépôt aujourd'hui. Ce qui dépend d'une saisie humaine, d'un test en salle ou de l'oral est compté comme manque.

---

## 1. Barème officiel (rappel)

Source : `contexte/PATRIMOINE.EXE - Nantes 001 — Cours étudiant B3 Design — ESD Nantes — 2026.md`, section 12. Le résumé de `todo.md` (« Soutenance et évaluation ») reprend les mêmes critères et les mêmes points, sans écart. Il ne reprend pas les indicateurs ni l'échelle : le livret prime.

### A. Projet commun — 70 points (même base pour tous les membres)

| Critère | Points | Indicateurs (livret) |
|---|---|---|
| Recherche patrimoniale & provenance | 10 | Source réelle, contextualisée, référencée, droits vérifiés, qualité des relevés |
| Grammaire & concept | 15 | Règles explicites, cohérence source → système, singularité de la proposition |
| Prototype & fonctionnement | 15 | Exécution, stabilité, paramètres opérants, code organisé, reset |
| Data / interaction / mapping | 10 | Pertinence, lisibilité du mapping, feedback, fallback si nécessaire |
| Design visuel & expérience | 10 | Composition, hiérarchie, temporalité, cohérence, mise en situation |
| Processus, test & documentation | 10 | Test croisé, itération, README, archive, cartel, assets |
| **Total projet** | **70** | |

### B. Évaluation individuelle — 30 points (différenciée par étudiant)

| Critère | Points | Ce qui est observé (livret) |
|---|---|---|
| Contribution réelle et traçable | 10 | Tâches effectuées, commits/versions, éléments produits, décisions prises |
| Maîtrise et compréhension | 8 | Expliquer une fonction, une règle, un mapping ou un choix de design ; dépendances du projet |
| Oral individuel | 5 | Réponse précise à une question individuelle ; vocabulaire, argumentation, recul critique |
| Autonomie, engagement, itération | 4 | Implication pendant les 3 jours, résolution de problèmes, prise en compte des critiques |
| Documentation personnelle & intégrité | 3 | Section « Contributions », déclaration IA, sources, distinguer produit / adapté / assisté |
| **Total individuel** | **30** | |

### Formule et échelle

**Note /20 = (points projet /70 + points individuels /30) ÷ 5.** Exemple du livret : 58/70 + 25/30 = 83/100, soit 16,6/20.

| Total /100 | Lecture (livret) |
|---|---|
| 90–100 | Projet exemplaire : traduction précise, système robuste, choix argumentés, exposition maîtrisée |
| 80–89 | Très bon : cohérent et abouti, quelques limites secondaires |
| 70–79 | Bon : concept lisible, prototype fonctionnel, documentation correcte |
| 60–69 | Fragile mais valide : relation source → système présente, exécution ou argumentation limitée |
| < 60 | Insuffisant : source non établie, grammaire faible, prototype non fonctionnel ou non explicable |

---

## 2. Projet commun — critère par critère (/70)

### Recherche patrimoniale & provenance — 10 / 10

**Preuves**

- `site/public/source-sheet.md` suit le format de la fiche-source V1. Elle est identique à la copie de `rendu/…`.
  - Titre : réseau Naolib.
  - Lieu : Nantes Métropole.
  - Identifiants des 3 jeux de données Open Data Nantes Métropole, plus Open-Meteo archive (ERA5).
  - Date d'accès : 2026-11-10.
  - Droits : Licence Ouverte pour Nantes Métropole. Open-Meteo est en CC BY 4.0, « vérifié sur open-meteo.com/en/licence le 2026-11-10 ».
  - Relevés : 96 lignes (`data/lignes.json`) et 3 semaines d'archives (`data/semaines/2026-09-14.json`, `2026-10-12.json`, `2026-11-02.json`).
  - 3 propriétés observables (retard par ligne, perturbations datées, contexte du jour).
  - Une limite assumée : le changelog ne donne ni durée ni toujours la ligne.
- `contexte/audit-api-open-data-nantes.md` : audit des API.
- `site/public/data/fallback/` : instantanés réels horodatés.
- `site/public/manifest.json` : sources et droits.
- `site/public/audio/CREDITS.md` : droits des médias.
- `LICENSE` : licence MIT du code, avec un rappel des licences des données.

**Manques / risques (−2, levés par les leviers 6 et 7)**

- ~~La **propriété volontairement écartée** n'est qu'une « proposition à valider par le groupe » dans `source-sheet.md` (ligne 16).~~ Confirmée le 11/11/2026.
- ~~**Licence Hub'Eau** : `"rights": "[À COMPLÉTER] (licence Hub'Eau à vérifier)"` dans `manifest.json` (ligne 23).~~ Licence Ouverte Etalab, d'après les CGU Hub'Eau (§ 5.1.3), vérifiée le 11/11/2026.
- ~~**Musique Loyalty Freak** : Commons signale « License review needed » (`CREDITS.md`, ligne 17) ; la vérification humaine reste à faire.~~ CC0 1.0 vérifiée le 11/11/2026 sur les pages Free Music Archive des 3 morceaux. La revue de Commons reste en attente, mais la source ne la contredit pas.
- ~~**Dates d'accès incohérentes** : 2026-11-09 dans la fiche du cartel (`site/src/content/oeuvres/pxe-nte001-g01-w01.json`), 2026-11-10 dans `source-sheet.md`.~~ Harmonisées sur le 2026-11-09, date du premier instantané versionné.

### Grammaire & concept — 14 / 15

**Preuves**

- `jeu/00-concept.md` contient :
  - la phrase-problématique ;
  - la spec verrouillée (Q1–Q61) ;
  - la chaîne source → grammaire → système → œuvre ;
  - le mapping justifié en une phrase.
- `site/public/grammar.md` (et `grammar.pdf` dans `rendu/`) :
  - règle structurante : un retard ≥ 10 min, une perturbation datée ou une alerte météo au-delà du 95e percentile devient un dossier ;
  - invariants : seuil de 10 min, 3 actions + « ne rien faire », 3 jauges de départ 50, aucun événement inventé ;
  - variables : semaine, météo, heure de pointe, 1d6.
- **Singularité** : la proposition rejoue une vraie semaine du réseau nantais, vue depuis un poste de régulateur.
  - Le joueur a un bureau en pixel art et un PC immersif.
  - Les journées commencent à 8 h.
  - Le patron, la communauté et le téléphone portent la pression morale.
- Le moteur applique bien la table d'effets « base + 1d6 » (Q57–Q61) : `site/public/game.js`, autour des lignes 143 à 152.

**Manques / risques (−3, dont −2 levés par le levier 5)**

- ~~**La documentation de la grammaire n'a pas suivi le prompt 87** (décision sans chrono).~~ **Levé** : constat d'origine ci-dessous.
  - `grammar.md` garde « compteur 60 / 30 / 15 s, Q16, Q55 ».
  - La fiche du cartel garde le paramètre « Durée du compteur ».
  - `jeu/00-concept.md` garde « Pression du temps : oui, un compteur est actif » et le trio de jauges d'origine (« satisfaction usagers »).
  - Or `jeu/01-boucle-gameplay.md` (ligne 29) et `jeu/80-decision-sans-chrono.md` disent qu'il n'y a plus de compteur par défaut, et le budget remplace la satisfaction depuis le prompt 22.
  - Un jury qui lit la grammaire puis joue verra l'écart.
  - **Corrigé le 11/11/2026** dans `grammar.md` (et `grammar.pdf`), la note d'exceptions de `jeu/00-concept.md`, ainsi que le paramètre et le texte du cartel.
- **Couches ajoutées** entre les prompts 72 et 91 : community, messagerie, téléphone, journal, somnolence, priorités imposées.
  - La règle structurante reste vraie, mais elle est moins immédiatement lisible.
  - Il faut savoir dire laquelle est « la règle la plus importante » (question 2 de `todo.md`).

### Prototype & fonctionnement — 13 / 15

**Preuves**

- `cd site && npm run build` : « 2 page(s) built… Complete! ».
- `npm test` :
  - « Smoke test : 313 contrôles réussis (50 scripts, données, secrets, dist) » ;
  - « Test du jeu : 374 contrôles réussis (3 semaines × 3 façons de jouer, reprise, mécaniques, traductions, hors ligne) ».
- **Hors ligne** :
  - `site/public/sw.js` pré-cache le jeu et la présentation ;
  - `data/fallback.json` (6 cas) et `data/fallback/*.json` servent de secours ;
  - `notes.md` (check-up du 11/11) consigne un lancement par `file://` et sans réseau.
- **Reset** (`R`) et **sauvegarde / reprise** : `site/public/sauvegarde.js`, testés par `test-jeu.mjs` (« reprise »).
- **Paramètres opérants** : `jeu/09-parametres.md` (difficulté, durée, langue, accessibilité) et la fenêtre « Options de jeu » (`confort.js`).
- **Code organisé** :
  - environ 50 scripts thématiques dans `site/public/` ;
  - logique pure testée dans une vm (`taches.js`, `journal-donnees.js`, `traces.js`, `notifs-tel.js`) ;
  - un test interdit les noms globaux en double.
- **Version figée** : `rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/`. `diff -rq` ne montre aucun script différent de `site/public/` ; seuls les médias et la présentation sont rangés différemment.
- **Navigation automatisée** en 1920×1080 (FR) et 1280×720 (EN) sans erreur de console : `notes.md`, lignes 85 à 134 (Chromium via Playwright).

**Manques / risques (−2)**

- La **checklist de robustesse au preflight** n'est pas cochée par un humain dans `todo.md` (« Checklist de robustesse complète au preflight »).
- Pas de mise en page dédiée en mobile portrait pour le Journal et le téléphone (prompts 89 et 90). Le bug de gel de la messagerie, corrigé le 11/11 (prompt 91, lot A), montre que la stabilité dépend des tests ajoutés la veille.

### Data / interaction / mapping — 8 / 10

**Preuves**

- **Données réelles** :
  - `site/public/gtfsrt.js` décode le flux GTFS-RT Naolib (mode « aujourd'hui ») ;
  - archive météo Open-Meteo ERA5 avec un seuil au 95e percentile (Q39) ;
  - 3 semaines réelles dans `data/semaines/` ; `grammar.md` pose « Aucun événement inventé » comme invariant.
- **Fallback** : `data/fallback.json` et `data/fallback/*.json`, avec un indicateur « mode hors ligne ».
- **Mapping perceptible** : une donnée devient un dossier, le dossier propose des réponses, les réponses agissent sur les jauges.
  - La trace de chaque décision et le calcul Q25 des dossiers non traités sont expliqués à l'écran (`site/public/traces.js`).
  - Le retard grimpe tant que le dossier n'est pas traité (prompt 79).
- **Feedback** : sons, animations désactivées si les animations réduites sont demandées, annonces `aria-live` (`annoncer()`).
- **Sources vivantes au téléphone** (parkings, vélos, trafic, pollens) : interrogées au clic seulement, avec une limite de fréquence et un délai d'attente (`site/public/notifs-tel.js`, `jeu/85-notifications-telephone.md`).

**Manques / risques (−2)**

- En mode archive, le changelog ne donne **pas de retard en minutes**. Le « seuil de 10 min » de la règle structurante ne se voit qu'en mode « aujourd'hui », qui dépend du réseau. C'est la limite assumée de `source-sheet.md`, à savoir défendre à l'oral.
- La plupart des aides de lisibilité du mapping sont **désactivées par défaut** :
  - prompt 89 : `traceDossier`, `pressionVisible`, `deVisible`, `eclairageJauges` ;
  - prompt 91 : déblocage des applis.
  - Le jury ne les verra que si on les active (Paramètres → Options de jeu).

### Design visuel & expérience — 7 / 10

**Preuves**

- `design-system/DESIGN.md` : couleurs et échelle, sans police Picon ni identité Nantes Métropole. Le thème Pixel DS est repris dans le jeu (`ds.js`) et la présentation (`slides/styles/index.css`).
- **Mise en situation** :
  - bureau en pixel art et PC immersif ;
  - écran de présentation Slidev (`/presentation/`, 17 slides) ;
  - cartel (`/cartel/`).
- **Captures réelles** dans `site/public/captures/` : `hero.jpg`, `detail-01.jpg`, `process.jpg`, `thumb.jpg`, et `demo.mp4` (28,0 s mesurés par `ffprobe`).
- **PWA** installable : `manifest.webmanifest` et icônes 192, 384, 512 et maskable.
- **Mobile** (prompt 60) et **i18n** FR + EN complète (contrôlée par `test-jeu.mjs`).

**Manques / risques (−3)**

- Les **contrastes ≥ 4,5:1 n'ont pas été remesurés avec un outil** après les écrans ajoutés aux prompts 85 à 91 (rapport de `notes.md`).
- Aucun **test joueur humain** n'est consigné pour les prompts 80 et 88 à 91 : `[À COMPLÉTER]` dans `jeu/82-engouement-variete.md`, `jeu/84-…`, `jeu/87-…` et `notes.md` (ligne 104). La hiérarchie et la temporalité ne sont donc validées que par l'auteur.
- La **densité d'interface** (une dizaine d'applis, des notifications, le patron) peut nuire à la hiérarchie pour un visiteur de 30 secondes en exposition.

### Processus, test & documentation — 7 / 10

**Preuves**

- **Itérations tracées** :
  - `journal.md` : une ligne par push ;
  - 370 commits sur `main` (`git log --oneline | wc -l`), sur 3 jours : 66 le 09/11, 219 le 10/11, 85 le 11/11 ;
  - 96 fichiers dans `prompts/`, avec leur statut dans `prompts/README.md` ;
  - 89 documents de décision dans `jeu/` ;
  - check-ups des prompts 58 et 59 (`notes.md`, réexécuté le 11/11), revue de game design (66), revue UX (80).
- **Tests automatisés** : 313 + 374 contrôles.
- **Archive** : `rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/` (README, manifest, cartel, source-sheet, grammar.pdf, captures).
- **Cartel** : texte validé au build (`content.config.ts`) et page `/cartel/`.
- **Assets** : captures et QR codes (`site/public/assets/qr-*.png`).

**Manques / risques (−4)**

- **Test croisé silencieux** par un autre groupe (30 à 60 s, 3 observations) : non coché dans `todo.md` (ligne 57), aucune trace ailleurs.
- **README incomplet** dans `site/README.md` et sa copie de `rendu/` : Auteurs (ligne 11), Contributions (ligne 127) et AI usage (ligne 136) sont encore `[À COMPLÉTER]`.
- **Cartel** : `auteurs` et `groupe` sont `[À COMPLÉTER]` (`pxe-nte001-g01-w01.json`, `rendu/…/cartel.md`) ; la relecture finale par le groupe n'est pas cochée.
- ~~**Licence incohérente** : `LICENSE` choisit déjà MIT au nom de « Mattéo Brevet & Guillaume Renoult ». Pourtant le `README.md` racine (ligne 64), `site/README.md` (ligne 141) et `manifest.json` (`"license"`) disent encore « [À COMPLÉTER] ».~~ Alignés le 11/11/2026. Les auteurs et le groupe du cartel sont aussi renseignés (levier 4).
- **QR codes** : scan en conditions réelles non fait (`todo.md`).
- **Déploiement** non documenté : `.github/workflows/deploy.yml` publie sur GitHub Pages, une adresse en 404, alors que le site canonique est sur Cloudflare Pages.

---

## 3. Évaluation individuelle (/30)

Le dépôt ne permet **pas** de différencier les membres. Aucun README ne fait le lien entre les comptes Git et les personnes, et la section Contributions est vide. La note ci-dessous est donc un **plancher commun démontrable**. Chaque membre doit la faire monter en soutenance.

### Contribution réelle et traçable — 4 / 10

- **Démontrable dans le dépôt** :
  - `git shortlog -sn --all` donne 4 comptes : ArtistDev44 (190 commits), matteobvt49-code (103), Vibe Nuage Agent (62), Skyfe (30) ;
  - 223 commits sur 370 portent `Co-Authored-By: Claude` ;
  - prompts rédigés dans `prompts/`, branches nommées par prompt, `journal.md`.
- **À confirmer en soutenance** :
  - qui est derrière chaque compte ;
  - qui a écrit quels prompts et pris quelles décisions (spec Q1–Q61) ;
  - la part relue, réécrite ou testée à la main.
  - Sans la section Contributions, le livret parle de « passager invisible ».

### Maîtrise et compréhension — 0 / 8

- **Démontrable dans le dépôt** : rien d'individuel. La documentation (`jeu/`, `grammar.md`) prouve que le groupe a compris le système, pas qu'une personne en particulier sait l'expliquer.
- **À confirmer en soutenance** :
  - ouvrir une fonction et l'expliquer : par exemple `Jeu.retardEffectif`, la table « base + 1d6 » de `game.js` ou `Traces.calculQ25` ;
  - expliquer les dépendances : p5.js, le service worker, le fallback, Astro pour le site.

### Oral individuel — 0 / 5

- **Démontrable dans le dépôt** : rien, par nature.
- **À confirmer en soutenance** : réponse à une question individuelle. Les 8 questions de `todo.md` (« Questions de soutenance à préparer ») sont le meilleur entraînement.

### Autonomie, engagement, itération — 2 / 4

- **Démontrable dans le dépôt** :
  - activité continue sur les 3 jours (66, 219 et 85 commits) ;
  - itérations en réponse à des critiques : revues des prompts 66 et 80, check-ups 58 et 59 ;
  - correction du gel de la messagerie au prompt 91.
- **À confirmer en soutenance** :
  - l'implication de chaque membre, observée par l'équipe pédagogique ;
  - la capacité à avancer sans dépendre de l'assistant IA.

### Documentation personnelle & intégrité — 1 / 3

- **Démontrable dans le dépôt** :
  - `manifest.json` contient un champ `ai_usage` qui déclare l'usage d'un assistant IA ;
  - les commits portent la mention Co-Authored-By ;
  - les sources sont citées (fiche-source, CREDITS, audit API) ;
  - la règle « aucune donnée inventée » est appliquée.
- **À confirmer en soutenance** : remplir la section Contributions et la note AI usage du README, et la fiche individuelle du livret (3 contributions, une décision de design, une décision technique, une difficulté, l'usage d'IA).

---

## 4. Note calculée

- **Projet commun : 59 / 70** (10 + 14 + 13 + 8 + 7 + 7). Le 11/11 au matin, avant les leviers 4 à 7, il était de 54 / 70.
  - Rapporté seul sur 20 : 59 ÷ 70 × 20 = **16,9 / 20**.
  - Contribution à la note finale : 59 ÷ 5 = **11,8 / 20**.
- **Individuel : 7 / 30** démontrable aujourd'hui (4 + 0 + 0 + 2 + 1). La plage réaliste va jusqu'à 30 / 30 en soutenance.
- **Note finale estimée** : (X/70 + Y/30) ÷ 5.

| Hypothèse | Projet /70 | Individuel /30 | Total /100 | Note /20 | Lecture (livret) |
|---|---|---|---|---|---|
| Projet seul (individuel à 0) | 59 | 0 | 59 | **11,8** | < 60 : insuffisant |
| Démontrable aujourd'hui | 59 | 7 | 66 | **13,2** | 60–69 : fragile mais valide |
| Soutenance maximale | 59 | 30 | 89 | **17,8** | 80–89 : très bon |

**Fourchette : 13,2 à 17,8 / 20.**

**Lecture** :

- Le projet commun (59/70, soit 84 % des points) se situe désormais dans la zone **« Très bon »** : le concept est lisible et la grammaire à jour, le prototype fonctionnel et très testé, les sources et les droits vérifiés.
- Les points perdus restants viennent surtout des **saisies humaines** encore manquantes (contributions et AI usage du README) et des **tests humains absents** (test croisé, tests joueurs, QR).
- La partie individuelle, aujourd'hui quasi vide de preuves, décidera si la note finale tombe dans « fragile » ou « très bon ».

---

## 5. Leviers actionnables avant la soutenance (priorisés)

Les leviers sont triés par points potentiels rapportés à l'effort, de la saisie de 5 minutes au test en salle. Les points en jeu sont une estimation par rapport aux points retirés ci-dessus.

| Priorité | Levier | Critère visé | Points en jeu | Fichier / action concrète |
|---|---|---|---|---|
| 1 | Remplir **Auteurs** et **Contributions** nominatives, en reliant chaque compte Git (ArtistDev44, matteobvt49-code, Skyfe, Vibe Nuage Agent) à une personne | Contribution traçable · Processus & doc | jusqu'à +6 individuel, +1 projet | `site/README.md` (lignes 11 et 127), puis recopie dans `rendu/…/README.md` |
| 2 | Écrire la note **AI usage** (3 à 5 lignes : ce qui a été écrit par le groupe, relu, réécrit, testé) | Documentation personnelle & intégrité | +2 individuel | `site/README.md` (ligne 136) |
| 3 | Remplir la **fiche individuelle** du livret pour chaque membre et préparer les **8 questions** de `todo.md` | Maîtrise · Oral | jusqu'à +13 individuel | `todo.md`, « Fiche individuelle » et « Questions de soutenance à préparer » |
| 4 | ✅ fait le 11/11 — **Aligner la licence** sur `LICENSE` (MIT déjà choisi) et renseigner `auteurs` / `groupe` du cartel | Processus & doc | +1 projet | `README.md` racine (ligne 64), `site/README.md` (ligne 141), `site/public/manifest.json` (`license`, `authors`), `pxe-nte001-g01-w01.json`, puis `rendu/` |
| 5 | ✅ fait le 11/11 — **Mettre à jour la grammaire** après le prompt 87 (plus de compteur par défaut ; budget à la place de la satisfaction) | Grammaire & concept | +2 projet | `site/public/grammar.md` (+ `grammar.pdf`), `jeu/00-concept.md` (note d'exception), paramètre « Durée du compteur » de `pxe-nte001-g01-w01.json` |
| 6 | ✅ fait le 11/11 — **Confirmer la propriété écartée** (alertes GTFS-RT) et harmoniser la date d'accès (09/11 ou 10/11) | Recherche & provenance | +1 projet | `site/public/source-sheet.md` (ligne 16), `pxe-nte001-g01-w01.json` (`date_acces`) |
| 7 | ✅ fait le 11/11 — **Vérifier les licences Hub'Eau et Loyalty Freak** à la source, ou retirer la musique en cas de doute | Recherche & provenance | +1 projet | `site/public/manifest.json` (ligne 23), `site/public/audio/CREDITS.md` (ligne 17) |
| 8 | **Test croisé silencieux** (30 à 60 s, un autre groupe, 3 observations notées) et une itération qui en découle | Processus · Design & expérience | +2 projet | Consigner dans `notes.md` et cocher `todo.md` (ligne 57) |
| 9 | **Préparer la démo du jury** : activer les options de lisibilité du prompt 89 (trace, pression, dé) ou décider de les activer par défaut | Data / mapping · Design | +1 projet | Paramètres → Options de jeu (`confort.js`) ; décision à noter dans `jeu/84-pression-morale-interface-narratrice.md` |
| 10 | **Preflight humain** : refresh, sans API, 1920×1080, console ouverte ; scanner les QR en vrai | Prototype · Processus | +1 projet | `todo.md` (checklist de robustesse, QR codes), `site/public/assets/qr-*.png` |
| 11 | **Mesurer les contrastes** des écrans des prompts 85 à 91 avec un outil (4,5:1) | Design & expérience | +1 projet | Rapport dans `notes.md` ; corrections dans `site/public/ds.js` si besoin |
| 12 | **Documenter le déploiement** Cloudflare Pages et trancher le sort de `deploy.yml` | Processus & doc | 0 à +1 projet | `.github/workflows/deploy.yml`, `site/README.md` (ligne 106) |

Les leviers 4 à 7 sont faits (projet à 59 / 70). Avec les leviers 8 à 11, le projet commun pourrait atteindre environ 64 / 70. Avec un individuel solide (25 / 30), cela donnerait 89 / 100, soit **17,8 / 20**. C'est une projection, pas un acquis.
