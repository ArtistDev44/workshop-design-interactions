# Prompt 88 — Jeu « Nantes en régulation » : donner envie de jouer — des tâches variées, des journées qui ne se ressemblent pas, une progression qui motive

Demande d'origine (11/11/2026) :

> Je souhaite un prompt améliorant le jeu dans sa globalité pour donner un engouement à y jouer et le
> rendre le moins répétitif, surtout dans les tâches à effectuer.

Objectif : à la fin d'une première journée, le joueur doit avoir **envie de jouer la suivante**. Une semaine
complète ne doit jamais donner l'impression de refaire la même chose.

Aujourd'hui, le cœur du jeu est une seule boucle : un signalement arrive, on choisit une réponse,
recommencer. Ce prompt :
1. **varie la nature des tâches** au cours d'une journée et d'une journée à l'autre ;
2. crée des **moments forts** ;
3. donne une **progression visible** (objectifs, récompenses, déblocages) ;
4. rend les **conséquences** des choix perceptibles d'un jour à l'autre.

Le tout sans rien inventer côté données, et en restant lisible : le prompt 87 a simplifié l'écran, il ne faut
pas le recharger.

Règles absolues :
- **Rien n'est inventé côté données.**
  - Toute tâche, crise ou événement s'appuie sur un fait réel déjà chargé : semaine archivée, GTFS,
    agenda, météo, lignes.
  - Une **conséquence de jeu** (par exemple un incident aggravé par une décision du joueur) est
    toujours **étiquetée comme telle** (« conséquence de votre décision de 9 h 40 »), jamais présentée
    comme un fait réel.
- Les personnages restent ceux du jeu (patron, Camille, usagers à pseudonyme fictif), sans personne réelle.
- **Lisibilité d'abord** : chaque nouvelle tâche s'explique en une phrase et se joue au clavier seul.
- Design system, FR + EN, contraste ≥ 4,5:1, `prefers-reduced-motion`, aucun flash, hors ligne, mobile.
- Règles Q1–Q61 : ce qui touche aux effets, aux jauges ou aux fins doit être **listé comme exception
  documentée**. C'est le cas des **événements chaînés** et de la **progression de carrière**, reportés
  au prompt 47 « à rediscuter en groupe » : ce prompt les propose, et le groupe tranche (§ 7).

## 0. Point de départ : faire un état des lieux mesuré avant toute modification

### 0.1 Lire ce qui existe déjà contre la répétition et pour la motivation

Ne rien refaire en double :
- **41** : mode histoire, un élément de jeu de plus par semaine, rapport, cinématiques.
- **47** : inspection surprise, palmarès, profils de gestion, journal de bord, épilogue, agenda anticipé.
- **55 / 56** : défis de semaine, rapport chiffré, déblocage de la semaine suivante.
- **63** : réactions en chaîne Community, enquête après coup.
- **72** : choix de réponses rédigés pour les alertes.
- **74** : ordre d'arrivée par graine, textes de liaison, rythme de la journée, feedback de série.
- **77** : tâches simultanées, notifications.
- **79** : retards qui s'aggravent.
- **84 / 85 / 86 / 87**, s'ils sont exécutés : patron et licenciement, Community en compte social,
  messagerie du patron, décision sans chrono et réponses par catégorie.

### 0.2 Mesurer la répétition

- Jouer (ou simuler avec `site/scripts/`) **3 semaines complètes**, une par niveau.
- Journaliser chaque action du joueur par type : ouvrir un signalement, choisir une réponse, envoyer une
  équipe, répondre à une plainte, lire un message…
- Journaliser aussi chaque texte affiché, pour repérer les **textes identiques répétés**.

### 0.3 Rédiger le diagnostic

Écrire `jeu/NN-diagnostic-repetition.md` (numéro libre suivant dans `jeu/`) : proportion de chaque type
d'action par journée, nombre de textes répétés à l'identique, moments sans rien à faire, moments
surchargés.

**Ce diagnostic fixe les priorités** :
- ne mettre en œuvre que ce qui corrige un problème mesuré ;
- noter dans le diagnostic les propositions écartées et pourquoi.

## 1. Des tâches de nature différente (pas seulement « choisir une réponse »)

Ajouter des **tâches courtes** (30 s à 2 min de lecture et de réflexion), chacune fondée sur des données
réelles. Il n'y a pas de chrono : la logique du prompt 87 s'applique.

| Tâche | Quand | Ce que fait le joueur | Données réelles | Effet |
|---|---|---|---|---|
| **Briefing du matin** | début de journée | lit la météo du jour, l'agenda et les travaux annoncés ; choisit **2 priorités** parmi 4 (ex. « surveiller la ligne 2 », « préparer le concert du soir ») | Open-Meteo, agenda, changelog | une priorité **tenue** dans la journée donne un petit bonus ; elle fixe le ton des messages du patron |
| **Préparer un événement** | quand l'agenda annonce un événement le soir même | pré-positionne une équipe ou réserve un véhicule **avant** l'affluence (budget engagé tôt) | agenda (nom, commune, horaire si donné) | si l'affluence arrive, la réponse préparée est plus efficace ; sinon, budget perdu en partie |
| **Rédiger l'info trafic** | après certaines décisions (pas toutes) | assemble un message à partir de blocs : ligne, cause, durée estimée, alternative proposée | dossier réel, réponse choisie | message exact et complet → réputation + ; bloc faux (mauvaise ligne, cause inventée) → réputation − et plainte Community |
| **Arbitrage du budget** | une fois par semaine (jour tiré par la graine) | répartit une enveloppe entre réserve de véhicules, équipes, communication | budget réel de la partie | modifie les coûts ou effectifs des jours suivants (valeurs dans `REGLAGES`) |
| **Vérifier une source douteuse** | quand deux sources se contredisent (contradiction existante) | compare les deux textes réels et désigne la plus fiable, en expliquant pourquoi par un choix | changelog (dates publiée / annoncée) | bonne source → décision mieux évaluée ; reprend le prompt 50, en tâche courte et claire |
| **Rapport du soir** | fin de journée | choisit **le fait marquant** de la journée et **une demande** au patron (plus de budget, une équipe de plus, un jour plus calme…) | journal réel de la journée | la demande influence la consigne et l'objectif du lendemain (accordée selon la réputation) |

Règles :
- **Rotation** : aucun type de tâche (signalement compris) plus de **3 fois de suite**. La journée alterne
  au moins **3 types de tâches**.
- **Ordre et choix** tirés d'un hachage de la graine, comme au prompt 74, sans toucher aux dés : partie
  rejouable à l'identique.
- Chaque tâche a une **carte d'introduction** de 1 phrase + 1 exemple, montrée **la première fois
  seulement**, avec un rappel dans l'aide (H).
- Une tâche sans donnée réelle disponible n'est **pas proposée**, par exemple pas d'événement à
  l'agenda → pas de « préparer un événement ».

## 2. Des journées qui ne se ressemblent pas

- **Thème du jour**, calculé sur les faits réels de la date :
  - jour le plus pluvieux ou venteux de la semaine → « journée tempête » (moment fort, § 3) ;
  - jour avec le plus d'événements d'agenda → « journée animée » ;
  - jour de travaux annoncés → « journée chantier » ;
  - sinon → « journée ordinaire ».

  Le thème change :
  - la **tâche signature** du jour, choisie dans le § 1 ;
  - l'**ambiance**, avec la musique et la lumière existantes ;
  - le **ton** de la consigne du patron.
- **Rythme** : chaque journée a un **matin calme**, un **pic** (heure de pointe réelle ou événement) et un
  **soir de clôture**. Le prompt 74 donne déjà le rythme 10 h / 12 h / 17 h ; le compléter sans le
  dupliquer.
- **Plus de textes identiques** :
  - chaque modèle de phrase (narration, patron, Community, liaison) a au moins **3 variantes** ;
  - une même variante ne revient pas deux fois dans la même journée ;
  - la variante est tirée par hachage de la graine.

## 3. Des moments forts

- **Cellule de crise**, au plus 1 par semaine, sur le jour réel le plus difficile de la semaine (météo,
  agenda ou nombre de signalements) :
  - plusieurs signalements arrivent en peu de temps ;
  - un bandeau « Cellule de crise » s'affiche, la musique passe en humeur tension ;
  - **objectif spécial** (par exemple « aucun signalement non traité avant 18 h »), récompense visible
    à la clé ;
  - toujours sans chrono : la difficulté vient du volume et des équipes limitées.
- **Événements chaînés**, proposition soumise au groupe (§ 7) :
  - un signalement mal traité peut entraîner **une conséquence de jeu** plus tard dans la journée, sur
    la même ligne ;
  - exemple : « Suite à votre décision de 9 h 40, la ligne 2 est saturée à 12 h » ;
  - la conséquence est **étiquetée** comme telle et repose sur le retard effectif du prompt 79 ;
  - au plus 1 chaîne par jour ;
  - désactivable dans les Paramètres si le groupe le souhaite.
- **Visite surprise**, l'inspection existante du prompt 47 : la relier au thème du jour, et l'annoncer par
  un SMS de Camille la veille au soir pour créer de l'attente.

## 4. Une progression qui motive

- **Grade du joueur** : Stagiaire → Régulateur·rice → Régulateur·rice confirmé·e → Chef·fe de salle.
  - On monte en grade avec les **points d'expérience** gagnés par les bonnes décisions, les tâches
    réussies, les objectifs du jour et les défis (prompt 55).
  - Le grade est sauvegardé **entre les parties**, dans `localStorage`, et réinitialisable dans les
    Paramètres.
  - Il s'affiche dans le bandeau et sur le rapport de fin de semaine.
- **Déblocages par grade**, proposition soumise au groupe (§ 7) :
  - nouvelles réponses dans certaines catégories (prompt 87) ;
  - une équipe supplémentaire par jour ;
  - un outil (« prévision à 1 h » qui montre le prochain signalement de la file).

  Chaque déblocage est annoncé par une carte claire. Ils ne rendent jamais le jeu impossible sans eux.
- **Badges** pixel (design system), par exemple :
  - « Zéro non traité » sur une journée ;
  - « Info trafic parfaite » ×5 ;
  - « Semaine dans le budget » ;
  - « Cellule de crise maîtrisée ».

  Une vitrine dans l'appli Indicateurs (prompt 36), basée sur des faits de la partie uniquement.
- **Série** : le feedback de série du prompt 74 alimente un **multiplicateur d'expérience**, sans effet
  sur les jauges.
- **Fin de journée gratifiante** :
  - récapitulatif court et animé : expérience gagnée, badges, priorité du matin tenue ou non, fait
    marquant ;
  - puis la nuit et la sortie du prompt 69, s'il est exécuté ;
  - bouton « Continuer » ;
  - `prefers-reduced-motion` : récapitulatif sans animation.

## 5. Conséquences visibles d'un jour à l'autre

- Le **rapport du soir** (§ 1) et les décisions de la journée laissent une **trace le lendemain** :
  - consigne du patron qui y fait référence ;
  - ligne « sous surveillance » si elle a été mal gérée ;
  - usagers Community qui rappellent un mauvais souvenir.

  Toujours fondé sur le journal réel de la partie, et étiqueté comme suite de vos décisions.
- **Carnet de la semaine** dans le Journal (prompt 63) : une ligne par jour avec thème, fait marquant,
  priorité, crise, pour voir sa semaine se construire.

## 6. Accessibilité, mobile, sauvegarde

- Chaque nouvelle tâche :
  - clavier seul (Tab, 1–4, Entrée, Échap) ;
  - cibles ≥ 44 px sur mobile ;
  - `aria-live` pour son arrivée et son résultat ;
  - aucune animation obligatoire pour comprendre.
- La sauvegarde (prompt 33) enregistre :
  - les tâches de la journée et leur état ;
  - les priorités du matin ;
  - l'arbitrage du budget ;
  - les chaînes en cours ;
  - le thème du jour ;
  - l'expérience, le grade et les badges.

  Ces deux derniers sont stockés aussi hors partie.
- Paramètres : options pour **désactiver les événements chaînés** et **réinitialiser la progression**.

## 7. Points à trancher par le groupe avant d'exécuter (à cocher dans ce fichier)

- [ ] Événements chaînés (§ 3) : oui / non.
- [ ] Progression de carrière et déblocages (§ 4) : oui / non. Si non, garder seulement les badges et
      l'expérience, sans effet sur le jeu.
- [ ] Arbitrage hebdomadaire du budget (§ 1) : oui / non.
- [ ] Liste définitive des badges (§ 4).

Si un point n'est pas coché, l'implémenter **désactivé par défaut**, derrière un réglage, et le signaler
dans la doc.

## 8. Mise en œuvre par lots (un commit vérifié par lot)

| Lot | Contenu |
|---|---|
| **A** | Diagnostic (§ 0) et variantes de textes (§ 2) |
| **B** | Briefing du matin, rapport du soir, carnet de la semaine (§ 1, § 5) |
| **C** | Tâches courtes restantes et rotation (§ 1) |
| **D** | Thèmes du jour et cellule de crise (§ 2, § 3) |
| **E** | Progression : expérience, grade, badges, récapitulatif du soir (§ 4) |
| **F** | Options soumises au groupe : chaînes, déblocages, arbitrage (§ 3, § 4, § 1) |

## 9. Vérifications détaillées

- `npm run build` et `npm test` dans `site/`, après chaque lot.
- `site/scripts/test-jeu.mjs` couvre :
  - rotation (pas plus de 3 fois de suite le même type, au moins 3 types par journée) ;
  - tâches non proposées sans donnée réelle ;
  - reproductibilité par la graine (deux parties de même graine = mêmes tâches et variantes) ;
  - thème du jour calculé sur les faits réels ;
  - au plus 1 crise par semaine ;
  - chaînes étiquetées et plafonnées ;
  - expérience, grade et badges calculés sur des faits de la partie ;
  - sauvegarde et chargement ;
  - aucune modification des dés ni des effets hors exceptions documentées.
- **Mesure de réussite**, comparée au diagnostic : refaire la mesure du § 0 sur les mêmes 3 semaines. Le
  type d'action dominant doit passer **sous 50 %** des actions de la journée. Aucun texte identique ne
  doit apparaître deux fois dans une même journée.
- **Test de jeu humain** : au moins 2 personnes du groupe jouent 2 journées. Noter dans la doc ce qui
  donne envie de continuer, ce qui ennuie et ce qui est incompris. Corriger les points bloquants.
- Accessibilité :
  - contraste ≥ 4,5:1 ;
  - clavier seul ;
  - `aria-live` ;
  - `prefers-reduced-motion` ;
  - aucun flash ;
  - hors ligne ;
  - 1920×1080 et mobile ;
  - FR + EN, aucune clé brute ni `[À COMPLÉTER]` affiché.
- Documenter dans `jeu/NN-engouement-variete.md` (numéro libre suivant dans `jeu/`), avec le diagnostic
  avant / après, et ajouter les lignes au sommaire de `jeu/README.md`. Mettre à jour
  `jeu/42-mecaniques-narration.md`, section « Reporté », selon les choix du groupe.
- Branche `jeu/prompt-88-engouement-variete`. À chaque push : entrée en tête de `journal.md`. Ne pas
  fusionner dans `main` sans demande.
