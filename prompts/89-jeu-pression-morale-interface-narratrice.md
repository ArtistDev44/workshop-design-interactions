# Prompt 89 — Jeu « Nantes en régulation » : le geste, la pression morale et l'interface comme narration

Demande d'origine (11/11/2026), à partir d'une analyse du jeu *Paper Please* et de cinq questions :

> What does the player do most often ? Does that action express the theme ? Can pressure change the
> moral meaning of that action ? Can the interface carry story instead of only information ? Can the
> game create emotion through rules rather than exposition ?

Objectif : répondre à ces cinq questions pour « Nantes en régulation », sans recharger l'écran
simplifié par le prompt 87 et sans casser la variété de tâches du prompt 88. Trois leviers :

1. **rendre le geste décisionnel expressif** — l'action la plus fréquente (choisir une réponse) doit
   avoir une conséquence visible immédiate, comme tamponner un passeport juge ;
2. **rendre la pression lisible comme un choix moral** — l'aggravation du retard (prompt 79) et le
   temps écoulé doivent se voir dans le dossier, pour qu'attendre apparaisse comme une décision ;
3. **faire raconter l'histoire par l'interface et les règles** — traces des décisions dans le dossier,
   état du bureau, conséquences naturelles expliquées, jet de dé visible — sans exposition textuelle.

Règles absolues :
- **Rien n'est inventé côté données.** Toute trace, tout état ou toute conséquence affiché s'appuie sur un fait réel
  déjà chargé ou sur le journal réel de la partie. Une **conséquence de jeu** est toujours
  **étiquetée comme telle** (« conséquence de votre décision de 9 h 40 »), jamais présentée comme un
  fait réel.
- **Pas de conseil ni de flèche d'effet sous les boutons** (choix des prompts 50 et 66) : on montre
  l'état du monde (retard qui grimpe, temps écoulé), jamais l'effet prévu d'une réponse.
- Les personnages restent ceux du jeu (patron, Camille, usagers à pseudonyme fictif).
- **Lisibilité d'abord** : chaque nouvel élément s'explique en une phrase et se joue au clavier seul.
  Le prompt 87 a simplifié l'écran : ne pas le recharger.
- Design system, FR + EN, contraste ≥ 4,5:1 (palettes daltonisme du prompt 48 incluses),
  `prefers-reduced-motion`, aucun flash, hors ligne, mobile (cibles ≥ 44 px).
- Règles Q1–Q61 : ce qui touche aux effets, aux jauges ou aux fins doit être **listé comme exception
  documentée**. Aucun changement de valeur d'effet dans ce prompt.
- Ne pas dupliquer le prompt 88 : les événements chaînés y sont déjà une option du § 7 (désactivée par
  défaut) — s'y référer, ne pas les réimplémenter ici.

## 0. Point de départ : état des lieux

Lire avant toute modification :
- `jeu/01-boucle-gameplay.md`, `jeu/03-actions-decisions.md` (boucle, retard effectif, aggravation) ;
- `jeu/06-narration.md` (narration contextuelle, ton selon les jauges) ;
- `jeu/63-revue-game-design.md`, `jeu/80-decision-sans-chrono.md` (décision sans chrono, retour expliqué) ;
- `jeu/75-retards-aggravation-community.md` (retard effectif : +1 min / 2 min de jeu, figé à la décision) ;
- `jeu/82-engouement-variete.md` (tâches variées, thème du jour, rapport du soir — ne pas les déplacer) ;
- le code : `panneau.js` (dossier et retour expliqué), `carte.js` (file des signalements), `feedback.js`
  (tampon « SIGNALEMENT », deltas flottants des jauges), `bureau.js` / `immersion.js` (lumière, lampe,
  stores, rapport papier), `game.js` (`Jeu.evaluer`, 1d6, conséquences naturelles Q25).

## 1. Le geste décisionnel devient expressif

L'action dominante du joueur est « choisir une réponse ». Donner à ce geste une **conséquence visible
immédiate**, sans ajouter de texte explicatif :

- Au clic, le signalement de la file passe à l'état **traité** avec la réponse choisie et l'heure
  (ex. « 9 h 40 — Bus de renfort »), grisé mais lisible — la file elle-même devient le journal visuel
  de la journée.
- Dans le dossier, une ligne de **trace** s'ajoute : réponse choisie, heure, retard retenu au moment
  du choix, résultat du dé (si § 4 validé). Le dossier ouvert raconte ce qu'on y a fait.
- Feedback existant renforcé, pas dupliqué : tampon « SIGNALEMENT » et pulsation à l'arrivée (prompt 53),
  deltas flottants des jauges (prompt 53), son distinct par catégorie de réponse (prompts 44/49).
- La conséquence spatiale reste textuelle (la carte a été retirée au prompt 73) : la ligne concernée
  est mise en évidence dans la liste le temps de la décision.

## 2. La pression change le sens moral de l'action

Depuis le prompt 87, il n'y a plus de chrono : la pression vient de l'**aggravation du retard** et de
la **fin de service**. La rendre visible pour qu'attendre apparaisse comme un choix :

- Dans le dossier ouvert, le **retard effectif affiché augmente** avec le temps de jeu (règle du
  prompt 79), avec la couleur de gravité existante (moyenne ≥ 10 min, élevée ≥ 20 min) et la mention
  « figé au moment de la décision ».
- Le dossier affiche aussi le **temps écoulé depuis l'arrivée du signalement** (horloge interne de la
  partie), sans jamais annoncer d'effet.
- Le **retour expliqué** (prompt 87) rappelle le retard retenu au moment du choix : le joueur voit
  que la même réponse n'aurait pas eu la même valeur une heure plus tôt.
- La « non-décision » reste lisible : un signalement laissé en file jusqu'à la fin de service est
  marqué « non traité à la fin de service » dans la file, avec ses conséquences naturelles expliquées
  (§ 4).

## 3. L'interface raconte l'histoire

- **Mémoire du dossier** : en « En savoir plus » (touche E), un bloc « Déjà décidé aujourd'hui sur cette
  ligne » liste les traces de la journée (heures + réponses), depuis le journal réel de la partie.
- **La file comme récit** : états lisibles — en attente, traité (réponse + heure), non traité —
  pour voir sa journée se construire sans texte narratif.
- **Le bureau reflète la salle** : via les éléments existants (lumière, lampe, stores du prompt 51,
  rapport papier des prompts 41/56, thème du jour du prompt 88) — le rapport de la veille reste sur
  le bureau tant que la semaine n'est pas terminée ; quand une jauge passe sous son seuil d'alerte,
  l'éclairage de la pièce baisse légèrement (réutiliser `dessinerEclairage`, aucun asset nouveau).
- La narration textuelle (prompt 06) reste, mais elle **reprend les traces** : le texte du soir
  cite le fait marquant choisi au rapport du soir (prompt 88).

## 4. L'émotion par les règles, pas par l'exposition

- **Q25 expliqué** : quand un signalement reste non traité à la fin de service, le malus est affiché
  avec son calcul à partir des données réelles du dossier (« conséquences naturelles : retard 25 min
  → fluidité −5 »), pas seulement comme un chiffre qui bouge.
- **Le dé visible** : le résultat du 1d6 (Q61) apparaît dans le retour expliqué (« dé : 4 → effet
  final +16 »), pour que l'aléa soit vécu comme une règle, pas comme un chiffre abstrait.
- **Chaînage** : ne pas réimplémenter ici — se référer à l'option « événements chaînés » du prompt 88
  (lot F), étiquetés « conséquence de votre décision de … ».

## 5. Accessibilité, mobile, sauvegarde

- Chaque nouvel élément : clavier seul, `aria-live` sur l'arrivée d'une trace et sur le changement de
  gravité, aucune animation obligatoire pour comprendre, `prefers-reduced-motion` respecté.
- La couleur de gravité est toujours doublée d'un texte (seuil en minutes), jamais seule.
- Mobile : la file et les traces restent lisibles en portrait (panneaux empilés du prompt 60),
  cibles ≥ 44 px.
- Sauvegarde (prompt 33) : les traces de la journée, les états de la file et le temps écoulé par
  signalement sont enregistrés et restaurés.

## 6. Points à trancher par le groupe avant d'exécuter (à cocher dans ce fichier)

- [ ] Trace de la décision affichée directement dans le dossier (§ 1) : oui / non (sinon, seulement
      dans « En savoir plus »).
- [ ] Couleur + temps écoulé pour l'aggravation du retard (§ 2) : oui / non.
- [ ] Résultat du dé affiché dans le retour expliqué (§ 4) : oui / non.
- [ ] Éclairage de la pièce lié aux jauges (§ 3) : oui / non.

Si un point n'est pas coché, l'implémenter **désactivé par défaut**, derrière un réglage, et le
signaler dans la doc.

## 7. Mise en œuvre par lots (un commit vérifié par lot)

| Lot | Contenu |
|---|---|
| **A** | § 1 — file comme journal visuel (états + réponse + heure), trace dans le dossier, feedback existant renforcé |
| **B** | § 2 — retard effectif qui grimpe en couleur dans le dossier, temps écoulé affiché, retard figé rappelé dans le retour expliqué |
| **C** | § 3 — mémoire du dossier (« En savoir plus »), rapport papier persistant, éclairage de la pièce lié aux jauges (option) |
| **D** | § 4 + § 6 — Q25 expliqué, dé affiché, options du groupe désactivées par défaut |

## 8. Vérifications détaillées

- `npm run build` et `npm test` dans `site/`, après chaque lot.
- `site/scripts/test-jeu.mjs` couvre :
  - la file affiche bien réponse + heure après chaque décision ;
  - le retard affiché augmente bien entre deux relevés et est figé au moment de la décision ;
  - le temps écoulé affiché correspond à l'horloge de jeu ;
  - Q25 : le malus « non traité » est affiché avec son calcul à partir du dossier réel ;
  - le dé affiché correspond au jet réellement appliqué ;
  - aucune valeur d'effet modifiée (table Q57–Q60 + 1d6 inchangée), aucune exception non documentée ;
  - reproductibilité par la graine (deux parties de même graine = mêmes traces) ;
  - sauvegarde / restauration des traces et états de file.
- **Mesure de réussite** : rejouer 3 journées complètes — le joueur doit pouvoir raconter sa journée
  en regardant seulement la file et le dossier, sans lire la narration. Noter dans la doc ce que le
  test humain comprend sans texte.
- Accessibilité : contraste ≥ 4,5:1, clavier seul, `aria-live`, `prefers-reduced-motion`, aucun flash,
  hors ligne, 1920×1080 et mobile, FR + EN, aucune clé brute ni `[À COMPLÉTER]` affiché.
- Documenter dans `jeu/83-pression-morale-interface-narratrice.md` et ajouter la ligne au sommaire de
  `jeu/README.md`. Mettre à jour `jeu/01`, `jeu/03`, `jeu/06` si leurs sections sont touchées.
- Branche `jeu/prompt-89-pression-morale-interface-narratrice`. À chaque push : entrée en tête de
  `journal.md`. Ne pas fusionner dans `main` sans demande.
