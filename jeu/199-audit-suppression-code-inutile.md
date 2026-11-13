# Prompt 199 — Audit et suppression du code désormais inutile

Date : 13/11/2026. Branche `199-jeu-audit-suppression-code-inutile`.
Demande d'origine : « Fais moi un audit qui vise à supprimer le code désormais inutile. »

## Résultat

- **1 226 lignes retirées, 58 ajoutées** dans `site/public/*.js` et `site/scripts/test-jeu.mjs`
  (hors `sw.js` et `version.js`, régénérés au build).
- Aucune règle du jeu modifiée : pas de valeur d'effet, de tirage ni de texte affiché changés.
- `npm test` : `test-jeu.mjs` passe (5 773 contrôles, 5 788 avant : 15 contrôles du code supprimé
  retirés). `smoke.mjs` garde ses 2 erreurs d'avant ce prompt (prompt 164 absent de `main`, label
  d'auteur manquant), sans rapport avec ce travail.
- Parcours sans interface (audit des textes, audit de densité, puis une partie jouée par les vraies
  fonctions : décisions, Community, tâches, fin de journée, Paramètres, sauvegarde) : aucune erreur de page.

## Méthode

Chaque suppression repose sur un `grep` du nom dans `site/public`, `site/scripts` et `site/src` : seules
restaient la définition, ou des appelants eux-mêmes morts. Après les suppressions, une seconde passe a
recherché les déclarations devenues orphelines (une seule : `dessinerBulleVerrou`, voir « À trancher »).

## Ce qui a été retiré

### Code sans aucune référence

| Fichier | Retiré | Lignes |
|---|---|---|
| `carte.js` | `dessinerFileSignalements`, `dessinerSelection`, `etatFile`, `texteLignes` (ancienne file en liste, remplacée par les marqueurs de la carte) ; `dessinerEquipesIncident` (onglet « Équipes » jamais posé depuis le prompt 102) | 199 |
| `glisser.js` | tout le glisser-déposer des cartes de réponse (prompt 94) : `CARTES` n'était plus rempli depuis le prompt 107. Le fichier ne garde que `sourisPC` | 159 |
| `panneau.js` | `dessinerCartesReponses`, `pucesImportance`, `savoirs` | 98 |
| `traces.js` | `dessinerTracesFile`, `Traces.lignesFile`, `Traces.memoire`, `Traces.pression`, `TRACE.derniere` | 77 |
| `bureau.js` | 46 couleurs de la palette `P` jamais lues (il en reste 6) | 46 |
| `os.js` | Corbeille : `appCorbeille`, `viderCorbeille` (aucun chemin n'ouvrait la fenêtre depuis le prompt 103) | 34 |
| `micro.js` | restes de la texture granulaire retirée au prompt 64 (`bus`, `anneau`, `ecriture`, `frag`, `densite`, `minuterieGrains`, `prochainGrain`, `souffleMs`) | 27 |
| `sauvegarde.js` | `lireCle`, `semaineCourante`, exports `_encoder` / `_decoder` | 15 |
| divers | `urgenceCompteur` et `URGENCE` (`feedback.js`), `altPhoto` (`community.js`), `pcVersImage` et `nSig` (`portrait.js`), `viderCache` (`texte.js`), `ZONE_CARTE_PLEINE`, `NOMS_JAUGES_LONGS`, `Jeu.equipePour`, `typesFiltre`, `messageFile`, `debutSieste`, appel à `ouvrirFenetreApp` (fonction inexistante) | ~25 |

### Branches inatteignables

- **Briefing au choix** (`taches.js`, `taches-ui.js`) : `Taches.briefing()` renvoyait toujours `null`
  depuis le prompt 91. Retirés : `briefing`, `briefingAncien`, `choisirPriorites`, `corpsBriefing` et les
  branches `briefing` de l'interface des tâches.
- **Tâche « rédiger l'info trafic »** : `apresDecision` n'en produisait plus depuis le prompt 91.
  Retirés : `tacheInfo`, `bloc`, `FAMILLES_ALT`, `plainteInfo`, `R.info`, `corpsInfo`, les branches `info`.
  Gardés : `causeDe`, `ligneDe`, `dureeDe` (publication Community).
- **Fausses erreurs système** : `Jeu.actionBloquee` renvoyait toujours `null`. Retirée, avec ses branches
  dans `panneau.js`, `sketch.js`, `game.js` (`patron.modBloque`) et `patron.js`.
- **Options sans effet** : « Trace dans le dossier » (`traceDossier`) et « Pression visible »
  (`pressionVisible`) étaient proposées dans les Paramètres mais lues par aucun code. Retirées de
  `OPTIONS_JEU`, des valeurs par défaut (`confort.js`) et des icônes (`parametres.js`).
  **Seul changement visible du prompt : ces deux bascules disparaissent des Paramètres.**

### Traductions

136 clés mortes retirées en français et en anglais (272 lignes de `i18n.js`) : `carte.plateau*`,
`equipes.*`, `bloc.*`, `plus.*`, `puce.*`, `savoir.*`, `sig.*` de l'ancienne file, `multi.*` de la file,
`glisser.*`, `tache.briefing.*`, `tache.info.*` de la tâche retirée, `tache.alt.*`, `app.corbeille*`,
`commu.alt*`, `commu.sujet.*`, `jaugeLong.*`, `optjeu.traceDossier*`, `optjeu.pressionVisible*`,
`trace.*` de la file, etc. Les clés construites dynamiquement (`'préfixe.' + variable`, variantes
`.v1` / `.v2`, suffixe `Chrono`) ont été exclues de la recherche puis vérifiées une à une.

### Hors du jeu

- `site/scripts/test-difficulte.mjs` : se déclarait obsolète et importait un `base.mjs` absent du dépôt.
- `guillaume-pp.webp`, `matteo-pp.webp` à la racine : copies exactes (md5) de `site/public/assets/credits/`.
- `briefing.webp`, `retour.webp` dans `slides/public/img/` et `site/public/presentation/img/` : cités par
  aucune diapositive.
- `trailer/.thumbnails/` et `trailer/.waveform-cache/` : caches HyperFrames sortis de git (les fichiers
  restent sur le disque) et ajoutés au `.gitignore`.
- `audit-parcours.js` : cible morte `DEMARRAGE_JOUR` retirée ; la Corbeille sort des parcours d'audit.

### Tests

`test-jeu.mjs` : retrait des contrôles du glisser-déposer, de `texteLignes`, de `Traces.pression` et
`Traces.lignesFile`, de la tâche info trafic ; le contrôle des traces vérifie maintenant `Traces.trace`.
Deux garde-fous d'absence ajoutés (glisser-déposer, briefing). Le déblocage par semaine ne compte plus
la Corbeille (5 applis en temps réel au lieu de 6).

## Ce qui a été gardé, et pourquoi

- **Outils `audit-*.js`** (866 lignes) : chargés seulement avec `?audit=`, entretenus (prompt 194), testés.
- **Migrations de sauvegarde** (v1 → v2, phase `mail`, bascules de musique `lofi-v49`, `chillin-v62`,
  `coquillage-v101`) : des sauvegardes de visiteurs peuvent encore en dépendre.
- **`site/public/data/fallback/`, `src/lib/datasets.js`, `scripts/snapshot.mjs`** : le jeu ne charge pas
  ces instantanés (il utilise `data/fallback.js`), mais `note-eval.md`, `trailer/CREDITS.md`, `CLAUDE.md`
  et le README les citent comme données réelles de repli. Les supprimer est une décision du groupe.
- **Sources `data/*.json` dans le pré-cache** : `game.js` charge bien `data/messages.json` au démarrage ;
  les sortir du pré-cache casserait le hors-ligne.
- **`C.ombre`, `DS.esp`, `LUCIDE_TAILLES`** : jetons du design system (et `icones-lucide.js` est généré).
- **Utilitaires recopiés** (`hacher` ×3, format de nombre ×4, `signe` ×3, coupe de texte ×2) : les
  factoriser gagnerait une quarantaine de lignes pour un risque de régression réel ; listés seulement.
- **Règles CSS `.note-sous` et `.grand-lien`** du deck : les retirer impose de reconstruire le deck.
- **Doublons `kit-presse/*.jpg` ↔ `captures/*.jpg`** (623 ko) et **double format audio** en pré-cache
  (décision du prompt 193).

## À trancher par le groupe

1. **Infobulle du verrou** (`applis.js`) : `dessinerBulleVerrou` n'est appelée nulle part, donc
   l'infobulle d'une appli verrouillée ne s'affiche jamais (seule l'annonce au lecteur d'écran passe).
   Régression probable : la rebrancher ou la supprimer.
2. **Badge « info parfaite »** : il ne peut plus être obtenu depuis le retrait de la tâche info trafic
   (prompt 91), mais il s'affiche toujours, grisé, dans le profil. Le retirer ou le rattacher à la
   publication Community.
3. **Plainte `info_erronee`** de `data/messages.json` : plus aucun code ne la crée.
4. **`data/fallback/`** et sa chaîne de scripts : voir ci-dessus.
5. **Garde-fous d'absence dans `test-jeu.mjs`** (une trentaine de contrôles « tel fichier n'existe
   plus ») : utiles contre un retour en arrière, mais ils alourdissent le fichier.

## Copie `rendu/`

`rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/` a été resynchronisée depuis `site/public/` (procédure de
`rendu/README.md`, sans `captures/`). Elle était en retard de six fichiers sur `main` avant ce prompt
(`community.js`, `game.js`, `i18n.js`, `journal.js`, `os.js`, `sketch.js`) : la copie reprend donc aussi
les derniers changements de Community déjà présents sur `main`.
