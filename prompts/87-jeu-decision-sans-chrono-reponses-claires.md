# Prompt 87 — Jeu « Nantes en régulation » : décider sans chrono — un écran principal simplifié, des informations claires et des réponses variées selon le problème

Demande d'origine (11/11/2026) :

> Je souhaiterais également un prompt améliorant considérablement l'app principale en la simplifiant. Avec
> le chrono et le trop-plein d'informations, cela crée du stress, et le joueur n'a pas le temps de lire
> toutes les informations et de pouvoir réfléchir. Ce que je propose, c'est de retirer le chrono, de
> simplifier, et de proposer une diversification dans le choix des réponses face aux différents problèmes,
> qui sont à mon goût peu compréhensibles par manque de clarté dans les infos transmises au joueur.

Objectif : refondre l'appli principale **Signalements** (prompts 68, 73, 77) autour de trois idées.

1. **Plus de chrono de décision.** Le joueur a le temps de lire et de réfléchir. La difficulté vient de la
   **gestion de la journée** (file qui grandit, incidents qui s'aggravent, budget, équipes limitées), pas
   d'une barre qui se vide.
2. **Moins d'informations à l'écran, mieux dites.** Chaque signalement se lit en quelques secondes, en
   langage clair, et le détail reste disponible à la demande.
3. **Des réponses propres à chaque type de problème.** Les 4 actions identiques partout (Dévier / Retenir /
   Renfort / Rien) sont remplacées par 3 ou 4 **réponses concrètes**, chacune expliquée, avec la tendance
   de ses effets annoncée.

Règles :
- **Rien n'est inventé côté données** : les phrases sont construites sur les champs réels (type, lignes,
  retard effectif, nature, source, météo, agenda). Absent → « non renseigné ».
- Le **calcul des effets garde la même formule** : base + 1d6 (Q61), modificateurs de contexte (Q24),
  graine fixe, partie rejouable.
- FR + EN, contraste ≥ 4,5:1, clavier seul, `prefers-reduced-motion`, aucun flash, design system.

**Exceptions aux décisions verrouillées**, à documenter dans `jeu/01-boucle-gameplay.md`,
`jeu/03-actions-decisions.md` et `jeu/09-parametres.md` :

| Décision | Aujourd'hui | Avec ce prompt |
|---|---|---|
| Q6, Q16, Q55 | compteur par dossier, durée selon la semaine | compteur **retiré par défaut**, mode « Défi chrono » optionnel (§ 1.3) |
| Q25 | compteur à 0 → « non traité » | un signalement n'est « non traité » qu'à la **fin de la journée** (§ 1.2) |
| Q5, Q57–Q60 | 3 actions + « ne rien faire », table unique | **réponses par catégorie** (§ 3) ; l'ancienne table sert de repli pour un dossier sans catégorie |

## 0. Point de départ : lire le code existant avant toute modification

Fichiers concernés :
- `site/public/` : `carte.js` (appli Signalements), `multitache.js`, `sketch.js` (`dessinerDossier()`,
  compteur, `decider()`), `game.js` (`REGLAGES.effets`, `Jeu.decider()`, `Jeu.evaluer()`, `Jeu.narrer()`,
  `Jeu.conseil()`, modificateurs, malus, retard effectif du prompt 79), `enquete.js` (sources, prompt 50),
  `cafe.js` (52), `mecaniques.js` (défis / ralenti, 55), `micro.js` (souffle et radio, 63–64),
  `rythme.js` (74), `immersion.js` (réveil, journée), `journee.js` (sablier, fin de journée), `guide.js`
  (37), `mobile.js` (60), `i18n.js`, `sauvegarde.js` ;
- un nouveau fichier `data/reponses.json` + `data/reponses.js` ;
- `site/scripts/test-jeu.mjs` ;
- une mise à jour de `jeu/`, `prompts/README.md` et `journal.md`.

Repérer, sans rien supposer (les numéros de ligne bougent) :
- **Tous les usages du compteur** : `compteur_s`, `compteurSemaine()`, `debutCompteur`, `facteurDuree`,
  alerte des 5 dernières secondes, `decider('temps')`.
- **Expiration en file** : 2 × le compteur.
- **Compteurs parallèles** du prompt 77.
- **Modificateur « heure de pointe »** : ×0,8.
- **Coût en temps des sources** (prompt 50), **café** (52), **ralenti** (55), **souffle** (64).
- **Fenêtre de réveil** : selon le compteur.

## 1. Retirer le chrono, garder une vraie pression de gestion

### 1.1 Plus de compteur de décision

- Ouvrir un signalement **met en pause l'horloge de jeu** tant que le panneau de décision est ouvert.
  - Le joueur lit, consulte, compare et réfléchit sans que rien ne bouge.
  - Une petite mention « Horloge en pause pendant la lecture » le rappelle.
  - L'horloge repart à la fermeture du panneau ou après la décision.
- Ailleurs, l'horloge tourne comme avant :
  - sur la liste des signalements ;
  - dans les autres applis ;
  - au bureau.

  Les incidents continuent d'arriver à leur heure de jeu.
- Plus de barre qui se vide, plus d'alerte des 5 secondes, plus de « temps écoulé » au milieu d'une
  décision.

### 1.2 La pression vient de la journée

- **Aggravation visible en file.** Le retard effectif du prompt 79 (+1 min toutes les 2 min de jeu) continue
  de monter tant que le signalement n'est pas traité. La file affiche « s'aggrave » avec une flèche, et la
  gravité peut passer de moyenne à élevée.
- **Plus d'expiration en cours de journée.** Un signalement toujours en file **à l'heure de fin de service**
  est réglé par la règle « non traité », avec ses conséquences naturelles et le malus du prompt 23. Le
  départ anticipé (prompt 51) garde la même règle.
- La **difficulté des semaines** (facile / normale / difficile) ne règle plus une durée. Elle règle :
  - le nombre de signalements actifs autorisés en même temps (3 / 2 / 1, voir § 2.4) ;
  - la vitesse d'aggravation (×0,5 / ×1 / ×1,5) ;
  - le budget de départ.

  Les valeurs vont dans `REGLAGES`, sont documentées et sont affichées à l'accueil à la place de
  « compteur X s ».

### 1.3 Mode « Défi chrono » (optionnel, désactivé par défaut)

- Paramètres → **« Défi chrono »** (touche à choisir sans collision), sauvegardé dans `localStorage`. Il
  rétablit le comportement actuel :
  - compteur selon la semaine ;
  - compteurs parallèles ;
  - expiration en file ;
  - heure de pointe ×0,8 ;
  - café, ralenti et souffle qui agissent sur le compteur.
- Hors de ce mode, ces mécaniques sont **désactivées ou adaptées**. Aucun bouton mort ne reste visible.
  - **Café** (52) : la tasse donne un coup de fouet visuel et sonore. Son effet de jeu devient « une
    consultation de source gratuite » (§ 2.3), ou rien.
  - **Ralenti** (55) et **souffle** (64) : masqués hors défi chrono.
  - **Heure de pointe** : garde son effet sur les jauges (Q24), plus sur le temps.
  - **Réveil de sieste** : fenêtre fixe et plus généreuse (3 s), indépendante de la semaine.
- Le mode défi chrono est indiqué sur l'écran de fin. Le palmarès distingue les deux modes.

## 2. Un écran principal simplifié

### 2.1 Disposition

Deux colonnes seulement :
- **Liste des signalements** à gauche ;
- **Panneau du signalement ouvert** à droite.

Un bandeau fin en haut regroupe :
- les trois jauges ;
- l'objectif du jour ;
- l'horloge ;
- les équipes disponibles ;
- le budget.

Tout le reste est rangé derrière **« En savoir plus »** ou dans les autres applis : légende, onglets
multiples, détails de sources, historique.

### 2.2 Liste des signalements

Une ligne par signalement, lisible d'un coup d'œil :
- **pictogramme du type** (retard, travaux, affluence, météo, accident) ;
- **titre court en clair**, par exemple « Ligne 2 — 18 min de retard » ;
- **gravité** en badge (faible / moyenne / élevée, règle affichée dans l'aide) ;
- mention « s'aggrave » si c'est le cas ;
- heure d'arrivée.

Trier par gravité puis par ancienneté. Un clic ou Entrée ouvre le signalement.

### 2.3 Panneau du signalement : 3 blocs, dans cet ordre

1. **Ce qui se passe** : **une phrase** construite sur les données réelles.
   - Exemple : « Sur la ligne 2 (tram), les rames ont 18 minutes de retard depuis 7 h 40. »
   - Source et texte brut dans « En savoir plus ».
2. **Pourquoi c'est important** : au plus **3 puces** courtes, seulement celles qui s'appliquent.
   - « Heure de pointe : beaucoup de voyageurs touchés » ;
   - « Pluie forte aujourd'hui (12 mm) » ;
   - « Concert au Zénith ce soir (agenda) » ;
   - « La ligne a déjà eu 2 incidents cette semaine ».
3. **Ce que vous savez — et ce que vous ne savez pas** :
   - les certitudes (source fiable, retard mesuré) ;
   - les incertitudes **dites clairement**, par exemple « Deux sources donnent des dates différentes :
     choisissez celle que vous croyez » à la place de l'ancien badge « contradiction ».

« **En savoir plus** » (volet repliable, au clavier aussi) regroupe :
- les sources détaillées et leurs consultations (prompt 50) ;
- la météo complète ;
- l'historique de la ligne ;
- les équipes en route.

Hors défi chrono, consulter une source ne coûte plus de temps. Une consultation peut coûter un peu de
budget si le prompt 50 le prévoit déjà.

Vocabulaire :
- **unique et défini** : un **glossaire** dans l'aide (H) pour retard effectif, gravité, réputation,
  fluidité, budget, source, équipe ;
- **pas de sigle sans explication** (GTFS-RT → « mesure en temps réel du réseau ») ;
- **une seule information par phrase**.

Le **conseil** du prompt 23 reste une phrase factuelle, placée au-dessus des réponses. Il ne désigne
jamais une réponse.

### 2.4 Plusieurs signalements à la fois

- Plusieurs signalements peuvent être ouverts à la suite, mais **un seul panneau à la fois**.
- La limite d'actifs simultanés (§ 1.2) sert à empêcher de « tout prendre » sans décider : au-delà, le
  joueur doit d'abord décider sur un signalement ouvert.
- Les notifications du prompt 77 restent. Elles ne coupent jamais un panneau ouvert : elles s'empilent
  discrètement.

## 3. Des réponses variées et claires selon le problème

### 3.1 Catégories (calculées sur les champs réels, sans tirage)

| Catégorie | Condition |
|---|---|
| `retard` | type « ligne en difficulté » (retard mesuré) |
| `travaux` | type « perturbation » (changelog : travaux, déviation, fermeture…) |
| `affluence` | type « événement » (agenda) |
| `meteo` | type « alerte météo », ou pluie ≥ 10 mm / rafales ≥ 60 km/h le jour du dossier |
| `accident` | texte de la source contenant accident, malaise, blessé, chute, collision (insensible à la casse) |

Un dossier qui correspond à plusieurs catégories prend la plus grave, dans cet ordre :
accident > meteo > retard > travaux > affluence.

### 3.2 Réponses par catégorie (`data/reponses.json`)

Chaque catégorie propose **3 ou 4 réponses**, toujours dont **une réponse « attendre / ne rien changer »**.
Chaque réponse définit :
- `id` ;
- `libelle` FR/EN : un verbe d'action, court ;
- `explication` FR/EN : une phrase qui dit **ce que ça fait concrètement** ;
- `base` [fluidité, réputation, budget] ;
- `communique` (bool) ;
- `equipe` liée (optionnelle : propose d'envoyer l'équipe correspondante, avec effectifs et coûts du
  prompt 68) ;
- `contexte` : quels modificateurs Q24 l'amplifient.

Propositions de départ, à équilibrer par le test du § 5 :

| Catégorie | Réponses proposées (libellé — ce que ça fait) |
|---|---|
| retard | **Injecter un véhicule de réserve** — ajoute un passage pour absorber le retard (fluidité ++, budget −−) · **Régulariser au terminus** — retient les véhicules pour réespacer les passages (fluidité −, réputation + si long retard, budget +) · **Service partiel** — fait demi-tour avant le tronçon bloqué (fluidité +, réputation −) · **Informer seulement** — annonce aux arrêts et en ligne (réputation +, budget ≈) · **Laisser se résorber** |
| travaux | **Appliquer la déviation annoncée** (fluidité −, réputation +) · **Navette de remplacement** (fluidité +, budget −−) · **Signaler aux arrêts** (réputation +) · **Ne rien changer** |
| affluence | **Renforcer la fréquence** (fluidité +, budget −) · **Agents sur les quais** (avec l'équipe Police, réputation +) · **Prévenir les voyageurs à l'avance** (réputation +, effet ×1,25 si l'événement est le soir même) · **Ne rien changer** |
| meteo | **Rouler au ralenti par sécurité** (fluidité −, réputation +) · **Inspection du matériel** (avec l'équipe Techniciens) · **Prévenir les voyageurs** · **Ne rien changer** |
| accident | **Envoyer les secours** (Ambulanciers + Police, réputation ++, budget −) · **Couper et dévier** (fluidité −−, réputation +) · **Retenir les véhicules en amont** (fluidité −, budget +) · **Attendre les informations** |

- **Sans catégorie** : l'ancienne table Q57–Q60 (4 actions) sert de repli.
- Les effets passent par **la même formule** (base + 1d6, modificateurs Q24, dés et graine).
  `Jeu.decider()` accepte un identifiant de réponse ; `Jeu.evaluer()` compare avec la meilleure réponse
  **de la même catégorie**.
- **Aucune réponse dominante** : dans chaque catégorie, chaque réponse doit être la meilleure dans au moins
  un contexte réel (météo, pointe, affluence, retard court ou long). Sinon, on rééquilibre.

### 3.3 Afficher les réponses clairement

Chaque réponse est une **carte bouton**. On y trouve :
- le numéro de touche (1 à 4) et le libellé ;
- l'explication en une phrase ;
- la **tendance** des effets sur les 3 jauges : flèches ▲ / ▼ / ▲▲ / ▼▼ ou « ≈ », en couleur DS ;
- le coût en budget s'il y en a un ;
- l'équipe liée et sa disponibilité.

**Pas de valeur exacte** (le dé et le contexte la font varier), mais la tendance doit être **honnête** :
c'est le signe et l'ordre de grandeur de l'effet attendu dans le contexte réel du dossier.

### 3.4 Retour après décision

Une **explication en deux phrases** :
1. **Ce qui s'est passé** : effets réels obtenus, en clair.
2. **Pourquoi** : contexte qui a amplifié ou réduit l'effet. Si la réponse était moins bonne, **quelle
   réponse aurait mieux convenu et pourquoi**, avec les mêmes données réelles.

La narration du prompt 74 (`contexteNarration`) peut fournir la phrase de contexte. Le Journal et l'enquête
du prompt 63 reprennent ces explications.

## 4. Mises à jour du reste du jeu

Mettre à jour pour les réponses par catégorie et l'absence de chrono :
- Aide (H) : glossaire, règle de gravité, catégories, mode défi chrono ;
- guide « Prendre en main » (37), tutoriel (34) ;
- écran de fin et bilan (« décisions clés » avec le libellé de la réponse) ;
- profil de la semaine (23) ;
- défis (55 / 56) ;
- Community (plaintes liées au type, prompts 28 / 85) ;
- patron (reproche « il fallait … » avec le libellé de la meilleure réponse).

Mobile (prompt 60) :
- liste et panneau en pile ;
- cartes réponses en pleine largeur, ≥ 44 px ;
- « En savoir plus » repliable.

Sauvegarde (prompt 33) : réponses choisies, horloge en pause ou non, mode défi chrono. Une ancienne
sauvegarde se charge et se convertit (actions anciennes → réponses de repli).

## 5. Vérifications détaillées

- `npm run build` et `npm test` dans `site/`.
- `site/scripts/test-jeu.mjs` couvre :
  - catégorisation sur des dossiers réels des semaines et du fallback ;
  - `reponses.json` valide (FR + EN, 3 ou 4 réponses dont une « attendre », effets et explications
    présents) ;
  - **aucune réponse dominante** par catégorie (calcul des effets attendus sur tous les contextes réels
    du jeu) ;
  - tendance affichée cohérente avec l'effet attendu ;
  - horloge en pause pendant la lecture ;
  - aggravation et « non traité » en fin de journée seulement ;
  - mode défi chrono = comportement actuel inchangé ;
  - sauvegarde, chargement et conversion d'une ancienne sauvegarde.
- Partie réelle, en français puis en anglais, au clavier puis à la souris :
  - une journée complète sans chrono : lire, ouvrir « En savoir plus », choisir une réponse par
    catégorie, lire l'explication ;
  - laisser un signalement en file et voir l'aggravation, puis la règle « non traité » au soir ;
  - semaines facile / normale / difficile : difficulté par charge, pas par temps ;
  - activer le défi chrono et vérifier l'ancien comportement.
- Test de lisibilité : chaque panneau se lit en moins de 10 secondes. Bloc « Ce qui se passe » ≤ 1
  phrase, « Pourquoi » ≤ 3 puces ; aucun sigle sans explication.
- Accessibilité :
  - contraste ≥ 4,5:1 ;
  - clavier seul (1–4, Entrée, Échap, Tab vers « En savoir plus ») ;
  - `aria-live` (nouveau signalement, résultat de la décision) ;
  - `prefers-reduced-motion` ;
  - aucun flash ;
  - hors ligne ;
  - 1920×1080 et mobile.
- Aucune régression hors exceptions documentées : rejouer une semaine complète dans chaque mode.
- Documenter dans `jeu/NN-decision-sans-chrono.md` (numéro libre suivant dans `jeu/`), ajouter la ligne au
  sommaire de `jeu/README.md`, et noter les exceptions Q5 / Q6 / Q16 / Q25 / Q55 / Q57–Q60.
- Branche `jeu/prompt-87-decision-sans-chrono`. À chaque push : entrée en tête de `journal.md`. Ne pas
  fusionner dans `main` sans demande.
