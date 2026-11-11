# Prompt 89 — Jeu « Nantes en régulation » : modernisation visuelle de l'appli « Journal de bord »

Demande d'origine (11/11/2026) :

> Je souhaite un prompt permettant d'améliorer visuellement l'app journal de bord tout en respectant le
> design system, tout en le rendant plus moderne.

Objectif : faire de l'appli **Journal** du PC un **tableau de bord de la journée**, moderne, lisible et
agréable à parcourir. Aujourd'hui, c'est une liste de lignes de texte avec une barre de couleur et un
bouton « Enquêter », et une enquête en texte brut sur 4 onglets.

La refonte apporte :
- un **résumé chiffré** en tête ;
- une **frise horaire** de cartes ;
- des **filtres** ;
- une **vue semaine** ;
- une **enquête** illustrée de petits graphiques pixel.

Contenu et règles de jeu inchangés : mêmes données réelles, mêmes évaluations, mêmes effets.

Règles :
- **Design system** (`design-system/DESIGN.md`, Pixel Design System du prompt 39, `ds.js`) : fond `#0D0C0C`,
  primaire `#D4031C`, blancs à opacités, couleurs fonctionnelles, arrondi 0, unité 4 px, polices DS,
  composants `dsBouton` / `dsBadge` / `dsPanneau`.
- **Rien n'est inventé** : tout ce qui s'affiche vient de `Jeu.evenementsJournee`, des dossiers réels, de
  `Jeu.equipes`, `Jeu.plaintes`, des jauges et du carnet. Absent → « non renseigné ».
- **Graphiques honnêtes** :
  - pas d'axe tronqué sans le signaler ;
  - échelle et unité affichées ;
  - couleurs DS fonctionnelles, accompagnées d'un libellé ou d'un symbole : la couleur seule ne porte
    jamais le sens.
- FR + EN via `t(...)` / `T(...)`, contraste ≥ 4,5:1, clavier seul, `prefers-reduced-motion`, aucun flash.

## 0. Point de départ : lire le code existant avant toute modification

Fichiers concernés :
- `site/public/` : `os.js` (`appJournal()`, `enqueteJournal()`, `VOLETS_ENQUETE`, objet `JOURNAL`, fenêtre
  d'appli), `game.js` (`Jeu.evenementsJournee`, `Jeu.ligneMail()`, `Jeu.evaluer()`, `attendus`,
  `Jeu.statsSemaine()` si présent, `Jeu.meteoDuJour()`, `Jeu.evenementsAffluence()`), `mecaniques.js`
  (carnet de bord, `ouvrirCarnet()`, prompt 47), `ds.js`, `i18n.js`, `sauvegarde.js` ;
- `site/scripts/test-jeu.mjs` ;
- une mise à jour de `jeu/`, `prompts/README.md` et `journal.md`.

Si les prompts suivants sont déjà exécutés, s'aligner sur eux :
- **87** : décider sans chrono, réponses par catégorie ;
- **88** : thèmes du jour, tâches variées, carnet de la semaine, expérience et badges ;
- **84** : avertissements du patron ;
- **85** : Community en compte social ;
- **86** : messagerie du patron.

Leurs données apparaissent alors dans le Journal (§ 2 et § 4). Sinon, ignorer ces éléments sans laisser
de case vide.

## 1. Structure de l'appli

La fenêtre d'appli fait 1440×900 environ dans l'écran du PC 1920×1080. Elle se compose de quatre zones.

1. **Barre de navigation des journées**, en haut :
   - une pastille par journée jouée : « J1 », « J2 »… avec la date courte ;
   - une **pastille d'état** par jour : succès si l'objectif est tenu, erreur s'il est raté, `blanc50`
     pour la journée en cours ;
   - la pastille du jour affiché est en primaire ;
   - les journées futures sont grisées et inaccessibles ;
   - ← → pour changer de jour au clavier (remplace les boutons « Veille / Lendemain ») ;
   - à droite, un sélecteur **Jour / Semaine** (§ 4).
2. **Résumé de la journée** : une rangée de 4 à 5 **tuiles** DS (§ 2).
3. **Frise de la journée** : des cartes classées par heure, avec un axe horaire vertical à gauche (§ 3).
4. **Barre de filtres**, au-dessus de la frise : `dsBouton` contour, le filtre actif en primaire, chacun
   avec son compteur.
   - **Tout** ;
   - **Ratés** : évaluation « raté » ou « trop tard » ;
   - **Équipes** ;
   - **Plaintes** ;
   - **Mes notes** : carnet.

Navigation clavier :
- Tab entre les zones ;
- ← → entre les jours ;
- ↑ ↓ entre les cartes ;
- Entrée pour ouvrir l'enquête, Échap pour revenir.

`aria-live` annonce le jour affiché et son résumé en une phrase.

## 2. Résumé de la journée (tuiles)

Chaque tuile est une carte DS (`blanc05`, bordure `blanc15`) avec un grand chiffre en police pixel, un
libellé court et un détail.

| Tuile | Contenu (calculé sur la journée réelle) |
|---|---|
| **Signalements** | nombre traités / reçus, dont non traités |
| **Bonnes décisions** | X / Y, et une petite barre de proportion |
| **Jauges du jour** | 3 mini-courbes (sparklines) pixel de fluidité, réputation, budget, du matin au soir, avec la valeur finale et l'écart du jour (+4, −7) |
| **Objectif du jour** | libellé, atteint / raté (badge succès / erreur), effet appliqué |
| **Équipes** | envois par type, avec les refus faute d'effectif si le prompt 68 les compte |

Tuiles conditionnelles :
- **Thème du jour** et **fait marquant**, avec l'expérience gagnée, si le prompt 88 est exécuté ;
- **Statut patron**, si le prompt 84 est exécuté.

Les mini-courbes sont dessinées avec les valeurs des jauges **après chaque événement réel** de la journée.
Elles n'ont **pas d'interpolation inventée** : un point par événement, reliés par des segments.

## 3. Frise de la journée (cartes)

Un **axe horaire** vertical, en `blanc15`, porte les heures de jeu. Chaque événement est une **carte**
ancrée à son heure.

- **Carte « signalement traité »** :
  - pictogramme pixel du type (retard, travaux, affluence, météo, accident) ;
  - heure ;
  - **badge ligne** : numéro réel, avec la couleur de `data/lignes.js` si elle existe ;
  - titre court en clair, par exemple « 18 min de retard, ligne 2 » ;
  - **puce de la réponse choisie** ;
  - **badge d'évaluation** : « bon choix » succès, « raté » erreur, « aucun détour » info, « trop tard »
    alerte, chacun avec un symbole ✓ ✗ ≈ ⏱ ;
  - **effets réels** en 3 petites puces (F +4 · R −2 · B −8), couleur et signe ;
  - bouton **« Enquêter »** à droite (Entrée).
- **Carte « équipe »** : type d'équipe, ligne, coût, statut (arrivée à HH:MM, en route, inutile,
  hors sujet).
- **Carte « plainte »** : pseudonyme fictif, extrait, réponse donnée et sa qualité, avec un lien vers
  Community.
- **Carte « note »** : la note du **carnet de bord** du joueur pour ce jour, avec le bouton « Écrire une
  note », qui ouvre le carnet existant.
- **Cartes conditionnelles** : message important du patron (avertissement, prompt 84), tâche courte du
  prompt 88, cellule de crise.

Règles communes :
- Les cartes d'un même dossier (décision, équipe, plainte liées) sont **regroupées** et reliées par un
  trait.
- Une journée sans événement affiche un **état vide** illustré : petite icône pixel et phrase
  « Rien à signaler pour cette journée ». Pas de zone noire vide.
- **Défilement fluide** : molette, glisser, ↑ ↓, avec une barre de défilement DS. On ne dessine que les
  cartes visibles, et la hauteur des cartes est mise en cache.

## 4. Vue « Semaine »

Une **grille** d'une colonne par journée jouée. Chaque colonne contient :
- la date ;
- le thème du jour, si le prompt 88 est exécuté ;
- le nombre de signalements ;
- les bonnes décisions ;
- l'objectif tenu ou raté ;
- les jauges de fin de journée en barres verticales pixel.

En dessous :
- une **courbe de la semaine** des 3 jauges et du score combiné (0–300), avec les seuils des fins (150,
  240) en traits pointillés ;
- les **décisions clés** de la semaine (meilleure, pire, mauvaise source), reprises du bilan existant ;
- le **carnet de la semaine** (prompt 88), s'il existe.

Un clic sur une colonne ouvre ce jour en vue Jour.

## 5. Enquête modernisée (fiche d'un dossier)

L'enquête passe d'onglets de texte brut à une **fiche** en cartes.

- **En-tête** :
  - bouton « ← Retour » ;
  - pictogramme et titre du dossier, date et heure ;
  - badge ligne ;
  - badge d'évaluation.
- **Navigation** : les 4 volets existants (Ce qui s'est passé · Contexte · Votre décision · Les suites)
  deviennent des **onglets DS** avec un indicateur primaire. On passe de l'un à l'autre avec ← → ou 1 à 4.

Contenu de chaque volet :

1. **Ce qui s'est passé** :
   - carte « faits » : type, nature, lignes, retard ;
   - **bloc citation** : texte de la source entre guillemets, en italique DS, avec un liseré `blanc15` ;
   - source et date de publication.
2. **Contexte** : des **puces** DS.
   - Météo : température, pluie, rafales, avec pictogrammes pixel.
   - Heure de pointe oui / non.
   - Événements d'agenda du jour, avec leurs noms réels.
   - Modificateur actif.
3. **Votre décision** :
   - la réponse choisie et les **effets réels** en 3 grandes puces ;
   - les **dés** affichés comme de petites **faces de dé pixel** (1 à 6) ;
   - un **graphique en barres horizontales** des effets attendus de chaque action ou réponse possible,
     dans ce contexte (`attendus`) :
     - la barre de la réponse choisie et celle de la meilleure sont repérées par un libellé (« votre
       choix », « la meilleure »), pas seulement par la couleur ;
     - l'axe est centré sur 0 et l'échelle affichée.

     Si le prompt 87 est exécuté, on compare les réponses de la catégorie du dossier.
   - l'**explication en deux phrases** du prompt 87, si elle existe.
4. **Les suites** :
   - fil compact des plaintes liées et de leurs réponses (bulles DS) ;
   - réactions en chaîne reçues (prompt 63) ;
   - équipes envoyées, avec leur pertinence et leur durée.

`aria-live` lit le titre du volet et une phrase résumée.

## 6. Animations, son, mobile, impression

- Animations courtes :
  - entrée des cartes en glissé de 8 px sur 150 ms, en cascade de 30 ms ;
  - courbes tracées en 300 ms à l'ouverture ;
  - changement d'onglet en fondu de 120 ms.

  Toutes sont désactivées avec `prefers-reduced-motion`.
- Son : clic discret sur la navigation. Le tout suit l'interrupteur Son (M).
- Mobile (prompt 60) :
  - pastilles des jours défilantes horizontalement ;
  - tuiles sur 2 colonnes ;
  - frise sur une colonne ;
  - fiche d'enquête en pile ;
  - cibles ≥ 44 px.
- Bouton **« Copier le résumé du jour »** : copie dans le presse-papiers un texte brut FR / EN du résumé
  et des décisions, pour le rapport de soutenance. Un message de confirmation s'affiche ; en cas d'échec
  (permission refusée), le texte s'affiche dans une zone sélectionnable.

## 7. Textes (FR + EN, exemples de clés)

| Clé | Français | English |
|---|---|---|
| `journal.vue.jour` | Jour | Day |
| `journal.vue.semaine` | Semaine | Week |
| `journal.filtre.tout` | Tout | All |
| `journal.filtre.rates` | Ratés | Missed |
| `journal.filtre.equipes` | Équipes | Teams |
| `journal.filtre.plaintes` | Plaintes | Complaints |
| `journal.filtre.notes` | Mes notes | My notes |
| `journal.tuile.signalements` | Signalements | Reports |
| `journal.tuile.bonnes` | Bonnes décisions | Good calls |
| `journal.tuile.jauges` | Jauges du jour | Today's gauges |
| `journal.tuile.objectif` | Objectif du jour | Daily objective |
| `journal.vide` | Rien à signaler pour cette journée. | Nothing to report for this day. |
| `journal.ecrireNote` | Écrire une note | Write a note |
| `journal.votreChoix` | votre choix | your choice |
| `journal.laMeilleure` | la meilleure | the best |
| `journal.copier` | Copier le résumé du jour | Copy the day's summary |
| `journal.copie` | Résumé copié. | Summary copied. |

## 8. Sauvegarde et performances

- La sauvegarde (prompt 33) enregistre :
  - la vue (jour / semaine) ;
  - le jour affiché ;
  - le filtre actif ;
  - le défilement.

  Les données affichées sont **recalculées** à partir de l'état de la partie, sans rien stocker en
  double.
- Le jeu reste fluide avec une semaine complète (7 jours, 40+ événements).
- Courbes et tuiles sont mises en cache par jour, et recalculées seulement quand un événement s'ajoute
  ou que la langue change.

## 9. Vérifications détaillées

- `npm run build` et `npm test` dans `site/`.
- `site/scripts/test-jeu.mjs` couvre :
  - tuiles égales aux comptages réels (signalements, bonnes décisions, objectif, équipes) ;
  - points des mini-courbes = valeurs des jauges après chaque événement ;
  - filtres (comptes et contenu) ;
  - vue semaine cohérente avec les journées ;
  - barres de l'enquête = `attendus`, choix et meilleure bien repérés ;
  - texte du résumé copié ;
  - sauvegarde et chargement.
- Partie réelle, en français puis en anglais, au clavier puis à la souris, sur 3 journées :
  - pastilles des jours ;
  - tuiles ;
  - frise avec cartes groupées ;
  - filtres ;
  - note du carnet ;
  - vue semaine ;
  - enquête avec ses 4 volets (citation, puces de contexte, dés, barres, suites) ;
  - copier le résumé.
- Vérification visuelle :
  - respect du design system (couleurs, arrondi 0, unité 4 px, polices) ;
  - aucune information portée par la couleur seule ;
  - contraste ≥ 4,5:1 (y compris `blanc50` / `blanc75` sur fond DS) ;
  - aucun débordement de texte (FR et EN).
- Accessibilité :
  - clavier seul ;
  - `aria-live` ;
  - `prefers-reduced-motion` ;
  - aucun flash ;
  - hors ligne ;
  - 1920×1080 et mobile.
- Aucune régression des prompts 47, 50, 55, 56 et 63, ni des prompts 84 à 88 s'ils sont exécutés.
- Documenter dans `jeu/NN-journal-de-bord-moderne.md` (numéro libre suivant dans `jeu/`) et ajouter la
  ligne au sommaire de `jeu/README.md`.
- Branche `jeu/prompt-89-journal-moderne`. À chaque push : entrée en tête de `journal.md`. Ne pas fusionner
  dans `main` sans demande.
