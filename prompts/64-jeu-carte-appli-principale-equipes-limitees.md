# Prompt 64 — Jeu « Nantes en régulation », étape 48 : la Carte devient l'appli principale, incidents détaillés, équipes d'intervention limitées

Demande d'origine (10/11/2026) :

> Je souhaite que l'application régulation n'existe plus, à la place l'application principale sera la
> carte et tous les problèmes des transports qui étaient sur l'app régulation soient sur la carte, ainsi
> le joueur aura un gameplay plus fluide et plus intuitif. Pour chaque incident dans l'app de la carte,
> ceux-ci seront un peu plus détaillés et le joueur sera limité en équipes d'intervention (police,
> ambulanciers, techniciens et pompiers) pour pouvoir ajouter de la contrainte.

Objectif :
- **Supprimer l'appli « Régulation »** du PC et faire de la **Carte** l'unique écran de jeu. Les incidents
  arrivent sur la carte, à l'emplacement réel de leur ligne. Le joueur les lit et décide sur place.
- **Détailler chaque incident** davantage, uniquement avec des données réelles.
- **Limiter les équipes d'intervention** pour ajouter de la contrainte.

Le joueur ne passe plus d'une appli à l'autre : il voit, lit, décide et envoie une équipe sur un seul écran.

Règle absolue : **rien n'est inventé côté données**.
- Tout détail affiché vient des sources réelles déjà chargées (GTFS-RT, changelog GTFS, agenda Open Data,
  Open-Meteo, `data/lignes.js`) ou d'un calcul sur ces données.
- Un détail absent s'affiche « non renseigné », ou `"[À COMPLÉTER]"` s'il doit être saisi par le groupe.

Les décisions verrouillées Q1–Q61 restent valables, à deux exceptions près, à documenter :
- l'**emplacement** de l'interface de décision ;
- la **disponibilité** des équipes.

## 0. Point de départ : lire le code existant avant toute modification

Fichiers concernés :
- `site/public/` : `os.js`, `sketch.js`, `game.js`, `immersion.js`, `guide.js`, `i18n.js`, `bureau.js`
  si besoin ;
- `scripts/test-jeu.mjs` ;
- une mise à jour de `jeu/`, `prompts/README.md` et `journal.md`.

Repérer, sans rien supposer (les numéros de ligne bougent) :
- **`os.js`** :
  - `ICONES_OS` (entrée `regulation`), `ouvrirIconeOS()`, `ouvrirAppli()` ;
  - `appCarte()` : projection des tracés réels, repère d'incident qui pulse, panneau latéral équipes ;
  - `envoyerEquipeCarte()`, `centreLigne()`, la barre des tâches (applis épinglées, badges).
- **`sketch.js`** : tout ce que l'appli Régulation affiche aujourd'hui :
  - la sélection de semaine (si elle n'est pas déjà dans le menu principal du prompt 35) ;
  - `dessinerListeLignes()`, avec le bandeau objectif et modificateur (prompt 23) ;
  - les jauges ;
  - `dessinerDossier()` : compteur, en-tête, ligne, retard, raison, source, météo, conseil, actions 1/2/3/0,
    action bloquée par « erreur système » ;
  - `dessinerConflit()`, la contradiction de sources (choix A/B) ;
  - la narration après décision, la pause, l'écran de fin ;
  - les ajouts des prompts 50 à 63 : info trafic / enquête sur sources, sablier, café, radio des
    chauffeurs, etc.
- **`game.js`** :
  - `EQUIPES`, `Jeu.envoyerEquipe()`, `Jeu.majEquipes()`, `Jeu.equipePour()`, `Jeu.DELAI_EQUIPE_MS` ;
  - `Jeu.conseil()`, la table des malus (`Jeu.MALUS`), la sauvegarde (prompt 33).
- **`guide.js`** (« Prendre en main », prompt 37), le tutoriel (prompt 34) et l'adaptation mobile
  (prompt 60) : ils citent ou pointent l'appli Régulation.

## 1. Suppression de l'appli Régulation

- Retirer l'icône `regulation` de `ICONES_OS` et de la barre des tâches. La **Carte** prend la première
  place : icône mise en avant et ouverte par défaut après le démarrage du PC.
- Plus aucun chemin du jeu ne mène à l'ancien écran plein de l'appli :
  - raccourcis clavier, guide, tutoriel, mobile ;
  - liens « Retour au site » / « Jouer » du site, qui ouvrent maintenant le jeu sur la Carte.
- Le **choix de la semaine** (3 semaines réelles + « Aujourd'hui, en temps réel ») et le bouton
  **Jouer** vont dans le menu principal (prompt 35) s'il existe déjà. Sinon, ils vont dans un écran
  d'accueil de la Carte (même contenu, même style design system).
- Les autres applis (Patron, Community, Journal, Indicateurs, Données…) restent, avec leurs badges.
- Ne pas laisser de code mort :
  - les fonctions de dessin de l'ancien écran qui ne servent plus sont supprimées ;
  - les clés `i18n` orphelines aussi (FR + EN).

## 2. La Carte, écran de jeu unique

Mise en page dans la fenêtre de l'appli, à 1920×1080 :
- **Carte** au centre-gauche : tracés réels des lignes, repères d'incident.
- **Panneau incident** à droite.
- **Bandeau d'état** en haut :
  - les trois jauges Fluidité / Réputation / Budget ;
  - l'objectif du jour et le modificateur actif (prompt 23) ;
  - l'horloge de jeu ;
  - les équipes disponibles (§ 4).

Comportement :
- **Arrivée d'un incident** : le repère apparaît à l'emplacement réel de la ligne (`centreLigne()`), avec
  pulsation rouge et signal sonore `incident`. Si le lieu n'est pas donné par la source : repère
  « Réseau » au centre, comme aujourd'hui.
- Si un autre incident est encore ouvert, le nouveau s'ajoute à une **file d'attente** visible en bas
  du panneau.
  - Le **compteur ne démarre qu'à la sélection** de l'incident.
  - Les incidents en attente ont leur propre délai d'expiration, affiché, égal au compteur de la
    semaine × 2. À expiration : malus « incident non traité » (prompt 23).
  - Le **conflit** de deux lignes (Q27) s'affiche comme deux repères liés par un trait, avec le choix
    A / B dans le panneau.
- **Décision dans le panneau incident** : actions 1 Dévier / 2 Retenir en terminus / 3 Bus de renfort /
  0 Ne rien faire, et tout ce qui existait déjà, sans le changer :
  - le compteur ;
  - le conseil ;
  - l'action bloquée ;
  - les sources contradictoires ;
  - l'info trafic et l'enquête ;
  - le sablier, le café et la radio.
- **Après la décision** : la narration s'affiche dans le panneau. Le repère passe au vert (bon choix) ou
  à l'orange (raté), puis disparaît en fondu après quelques secondes.
- La **liste des lignes** (« Lignes concernées », prompt 16) devient une légende repliable de la carte.
  Cliquer une ligne la met en surbrillance sur la carte.
- Clavier :
  - Tab parcourt les incidents (actif + file) ;
  - Entrée sélectionne ;
  - les touches 1/2/3/0, A/B, P, H, M, L gardent leur sens ;
  - aucune touche existante ne change de rôle.
- `prefers-reduced-motion` : pulsations et fondus remplacés par des états fixes.

## 3. Incidents plus détaillés (données réelles uniquement)

Le panneau incident affiche, dans cet ordre :

1. **En-tête** : type (ligne en difficulté / perturbation / alerte météo / événement), gravité, heure
   d'arrivée dans la journée de jeu.
   - La gravité est **calculée** et affichée avec sa règle dans l'aide :
     - retard ≥ 20 min ou alerte météo → élevée ;
     - 10–19 min ou affluence → moyenne ;
     - sinon faible.
2. **Lignes touchées** : numéro, nom réel (`Jeu.nomLigne`), mode (tram / bus / navibus, selon
   `data/lignes.js`).
   - Si les données GTFS de `data/lignes.js` contiennent les arrêts : terminus de la ligne.
   - Sinon : « non renseigné ».
3. **Ce qui se passe** : retard mesuré (ou « non renseigné »), nature, texte de la source entre
   guillemets, nom de la source, date et heure de publication.
4. **Contexte réel du jour** :
   - météo (température, pluie, rafales — Open-Meteo) ;
   - heure de pointe oui / non ;
   - événement d'agenda en cours, avec son nom et sa commune réels si c'est un dossier d'affluence ;
   - modificateur actif.
5. **Historique de la ligne dans la semaine** : nombre d'incidents déjà traités sur la même ligne, et
   la dernière décision avec son évaluation (calcul sur `Jeu.evenementsJournee`).
6. **Équipes utiles** : types d'équipe pertinents pour ce type d'incident (§ 4.3), avec leur
   disponibilité.
   - C'est une **indication de pertinence**, pas l'action de régulation à choisir.
   - Le conseil du prompt 23 ne recommande toujours aucune action.

Mise en forme :
- Les détails 4 à 6 sont dans des **volets repliables** (clic ou Entrée), pour garder une lecture rapide.
- Le compteur reste visible en permanence.
- Tous les libellés passent par `t(...)` / `T(...)` (FR + EN).
- Les données réelles (noms de lignes, natures, textes, sources) ne sont jamais traduites.

## 4. Équipes d'intervention limitées

### 4.1 Effectifs

Chaque journée commence avec un effectif fixe (valeurs à verrouiller dans `REGLAGES`, documentées) :

| Équipe | Effectif / jour | Coût | Durée d'intervention (temps réel) |
|---|---|---|---|
| Police | 2 | 10 | 40 s |
| Ambulanciers | 1 | 15 | 50 s |
| Techniciens | 2 | 12 | 60 s |
| Pompiers | 1 | 15 (budget ≥ 70, prompt 23) | 60 s |

### 4.2 Cycle d'une équipe

**disponible → en route** (20 s, `DELAI_EQUIPE_MS`) **→ sur place** (durée d'intervention ; les effets
s'appliquent à l'arrivée, comme aujourd'hui) **→ retour** (10 s) **→ disponible**.

- Sur la carte, chaque équipe engagée est un petit pictogramme pixel qui se déplace de la base (Centre
  de régulation, centre de la carte) vers le repère, puis revient. L'animation est réduite à un
  déplacement instantané si `prefers-reduced-motion`.
- **Aucune équipe disponible** :
  - le bouton est désactivé ;
  - un message dit « Toutes les équipes de police sont engagées (retour dans 23 s) » ;
  - un signal sonore court d'erreur est joué.
- Les effectifs sont **remis à zéro chaque matin** (nouvelle journée). Une équipe engagée la veille
  est rentrée.
- Bandeau d'état : un compteur par type, par exemple « Police 1/2 · Ambulanciers 0/1 ». Le compteur
  passe en orange à 0 disponible.

### 4.3 Pertinence selon le type d'incident

La règle est calculée sur les champs réels, sans tirage :

| Type / indice dans la source | Équipes pertinentes |
|---|---|
| ligne en difficulté (retard mesuré) | Techniciens |
| perturbation (changelog : travaux, déviation…) | Techniciens, Police |
| événement / affluence (agenda) | Police |
| alerte météo (pluie forte, rafales) | Pompiers, Techniciens |
| texte de la source contenant accident, malaise, blessé, chute (recherche insensible à la casse) | Ambulanciers, Police |

- Équipe pertinente : effets pleins (table `EQUIPES` actuelle).
- Équipe non pertinente : **effets divisés par deux**, coût entier, et un commentaire Community
  « hors sujet » possible (prompt 22).
- Le malus « équipe inutile » (prompt 23 : équipe envoyée sur un incident déjà résolu) est conservé.
- Une seule équipe **par type** et par incident. Plusieurs types peuvent être envoyés sur le même
  incident, si les effectifs et le budget le permettent.
- Raccourcis : **Maj + 1/2/3/4** envoie Police / Ambulanciers / Techniciens / Pompiers sur l'incident
  sélectionné. Utiliser `keyCode` 49–52 avec `keyIsDown(SHIFT)` pour rester indépendant du clavier
  AZERTY / QWERTY. Les chiffres seuls restent les actions de régulation.

### 4.4 Persistance et bilan

- La sauvegarde (prompt 33) enregistre les effectifs, les équipes engagées et leur phase. Un chargement
  reprend les équipes là où elles étaient.
- Écran de fin et profil de la semaine (prompt 23) : équipes envoyées par type, taux de pertinence,
  équipes refusées faute d'effectif.

## 5. Mise à jour du reste du jeu

- **Guide « Prendre en main »** (prompt 37), tutoriel (prompt 34), aide (H) : textes et flèches
  réécrits pour la Carte (FR + EN). La table des malus et la règle de pertinence figurent dans l'aide.
- **Mobile** (prompt 60), en portrait : carte en haut, panneau incident en dessous, bandeau d'état
  replié, cibles ≥ 44 px.
- **Patron** (prompt 22) : nouvelles consignes possibles, construites sur les effectifs réels de la
  partie (« Plus de techniciens disponibles avant 14 h, gérez sans eux »).
- **Journal / enquête** (prompt 63) : le volet « suites » liste les équipes envoyées, leur pertinence et
  leur durée.
- Indicateurs (prompt 36) et appli Données (prompt 61) : inchangés, sauf libellés qui citeraient
  l'appli Régulation.

## 6. Vérifications détaillées

- `npm run build` et `npm test` dans `site/`.
- `scripts/test-jeu.mjs` couvre :
  - la gravité calculée ;
  - la pertinence par type ;
  - l'effectif décrémenté puis restitué après la durée d'intervention et le retour ;
  - le refus quand l'effectif est à 0 ;
  - la remise à zéro le matin ;
  - les effets divisés par deux hors pertinence ;
  - la sauvegarde et le chargement des équipes.
- Partie réelle, au clavier puis à la souris, en français puis en anglais :
  - plus d'icône Régulation ;
  - semaine choisie, incident sur la carte, panneau détaillé ;
  - décision 1/2/3/0, puis narration ;
  - file d'attente avec deux incidents, conflit A/B ;
  - toutes les polices engagées, avec le message « retour dans X s » ;
  - fin de journée, puis le lendemain avec les effectifs remis à zéro.
- Aucune donnée inventée : chaque détail du panneau est traçable jusqu'à sa source, sinon
  « non renseigné ».
- Accessibilité :
  - contraste ≥ 4,5:1, clavier seul ;
  - `prefers-reduced-motion` ;
  - `aria-live` pour l'arrivée d'un incident et le refus d'équipe ;
  - aucun flash.
- Hors ligne (fallback), 1920×1080 et mobile.
- Aucune régression des règles Q1–Q61 (hors exceptions documentées) ni des prompts 14–63 : rejouer une
  semaine complète.
- Documenter dans `jeu/58-carte-appli-principale.md` (ou le numéro libre suivant) et ajouter la ligne au
  sommaire de `jeu/README.md`.
- Branche `jeu/prompt-64-carte-appli-principale`. À chaque push : entrée en tête de `journal.md`.
  Ne pas fusionner dans `main` sans demande.
