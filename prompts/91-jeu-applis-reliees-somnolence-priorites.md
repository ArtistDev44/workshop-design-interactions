# Prompt 91 — Jeu « Nantes en régulation » : un jeu qui démarre minimal et se complexifie — applis reliées, déblocage par semaine, somnolence nécessaire, priorités imposées

Demande d'origine (11/11/2026), en discussion après le prompt 89 :

> Le jeu est trop complexe. Vision « less is more » : il faut que la somnolence ait un rôle de gameplay
> tel que le joueur doive l'utiliser (intégrée et nécessaire). Les tâches annexes doivent être ajoutées
> chaque semaine (aucune au départ — application avec icône verrouillée grisée), puis chaque semaine les
> tâches sont ajoutées. Les tâches annexes doivent mieux s'intégrer à la prise en main : à chaque retard,
> on doit aller sur l'application Community pour envoyer un message. Les applications doivent être plus
> reliées entre elles, avec des redirections. Bug : dans l'application Messages, on ne peut plus rien
> faire (Échap, curseur, touches, même pas la main). Les priorités doivent être imposées, pas choisies
> (2 par journée, puis 3 au bout de 4 jours).

Objectif : cinq chantiers, du plus bloquant au plus structurant :

1. **correctif** : une fenêtre RégulOS ouverte par-dessus l'appli de jeu ne doit plus bloquer les entrées ;
2. **déblocage par semaine** : semaine 1 = seule l'appli Signalements ; les autres icônes sont verrouillées
   (grisées, cadenas) et se débloquent une par une chaque semaine ;
3. **applis reliées par redirections** : à chaque retard, publier une info sur Community depuis le dossier,
   avec retour « Voir le dossier » ; pile de navigation avec Échap = retour à l'origine ;
4. **priorités imposées** par le patron (2 par journée, 3 au bout de 4 jours joués), plus choisies ;
5. **somnolence nécessaire** : le joueur doit dormir chaque jour, et le choix porte sur le moment.

Règles absolues :
- **Rien n'est inventé côté données.** Brouillons, priorités, consignes et traces s'appuient sur des
  faits réels déjà chargés (semaine archivée, GTFS-RT, agenda, météo) ou sur le journal réel de la
  partie. Toute **conséquence de jeu** est **étiquetée comme telle** (« conséquence de votre décision
  de 9 h 40 »).
- **Pas de conseil ni de flèche d'effet sous les boutons** (choix des prompts 50/66) : le brouillon
  Community pré-remplit les faits (ligne, cause, durée), jamais l'effet attendu.
- Personnages : patron, Camille, usagers à pseudonyme fictif — aucun réel.
- **Lisibilité d'abord** : chaque nouveauté s'explique en une phrase, clavier seul, et ne recharge pas
  l'écran simplifié par le prompt 87.
- Design system, FR + EN, contraste ≥ 4,5:1 (palettes daltonisme du prompt 48), `prefers-reduced-motion`,
  aucun flash, hors ligne, mobile (cibles ≥ 44 px).
- Règles Q1–Q61 : toute modification d'effet, de jauge ou de fin est une **exception documentée**. Ce
  prompt ne change aucune valeur Q57–Q61 ni le 1d6.
- Ne pas dupliquer : la tâche « rédiger l'info trafic » du prompt 88 § 1 **est remplacée** par la
  publication Community de ce prompt (§ 3) ; les événements chaînés restent l'option du prompt 88 lot F.

## 0. Point de départ : état des lieux

- Code : `sketch.js` `keyPressed` (~l. 1150–1210 — voir § 1), `os.js` (`GRILLE_OS`, `ICONES_OS`,
  `ouvrirIconeOS`, `fermerFenetreApp`, barre des tâches), `patron.js` (`appPatron`, `touchePatron`,
  `mollettePatron`), `community.js`, `taches.js` / `taches-ui.js` (prompt 88), `game.js`,
  `journee.js` (somnolence, prompt 78), `sauvegarde.js`.
- Docs : `jeu/01`, `jeu/03`, `jeu/80-decision-sans-chrono.md`, `jeu/82-engouement-variete.md`,
  `jeu/84-pression-morale-interface-narratrice.md`, `jeu/78-community-compte-social.md`,
  `jeu/79-patron-messagerie-moderne.md`.

## 1. Correctif bloquant : fenêtre RégulOS au-dessus de l'appli de jeu

**Bug constaté** : quand `PC.fenetre` est défini (ex. Messages) alors que `PC.etat === 'appli'`, les
touches ne sont plus routées vers la fenêtre : Échap déclenche `seLever()` et les autres touches partent
dans les raccourcis du jeu ; le curseur « main » n'apparaît plus sur les zones cliquables.

Correctif :
- Si `PC.fenetre` est défini, **router d'abord** les touches vers la fenêtre concernée
  (`touchePatron()`, `toucheCommunity()`, `toucheJournal()`…), quelle que soit la valeur de `PC.etat`.
- Échap avec une fenêtre ouverte = `fermerFenetreApp()` (retour à l'appli ou au bureau système),
  **avant** toute autre action ; `seLever()` seulement quand aucune fenêtre n'est ouverte.
- Le curseur « main » s'affiche sur les zones cliquables de la fenêtre, appli de jeu ouverte ou non.
- Mobile/portrait : mêmes règles (tap = clic, geste retour = fermer la fenêtre).
- Test : ouvrir Messages par-dessus l'appli Signalements, vérifier Échap, Tab, flèches, M, molette,
  clic sur « Voir le dossier » — tout répond.

## 2. Déblocage des applis par semaine (aucune au départ)

- **Semaine 1** : seule l'icône **Signalements** est active. Les autres icônes de la grille RégulOS
  (Community, Messages, Journal, Indicateurs, Données…) sont dessinées **grisées avec un glyphe
  cadenas** ; au clic : secousse + infobulle « Disponible à partir de la semaine N ».
- Planning (mode histoire, calé sur le déblocage des semaines du prompt 56) :
  - semaine 2 → **Community** ; semaine 3 → **Messages** (patron) ; semaine 4 → **Journal** +
    **Indicateurs** ; semaine 5 → **Données**.
- Au déblocage : carte d'intro d'une phrase (comme le prompt 88) + l'icône passe en couleur ; la carte
  n'est montrée qu'une fois (persisté).
- Le déblocage est enregistré dans la **sauvegarde** (prompt 33) ; en mode Défi / temps réel, tout est
  débloqué (option du § 7).
- La barre des tâches et les notifications de la barre (prompt 77) ne montrent que les applis débloquées.

## 3. Applis reliées par redirections

- **À chaque signalement de type retard**, le dossier affiche un bouton **« → Publier sur Community »**
  qui ouvre la fenêtre Community avec un **brouillon pré-rempli depuis les données réelles du dossier**
  (ligne, cause si connue, durée estimée). Le joueur envoie ou non : ne pas publier n'a pas de malus
  immédiat, mais si le retard s'aggrave ensuite, une plainte arrive (chaînes existantes 63/79).
  Cette publication **remplace** la tâche « rédiger l'info trafic » du prompt 88 § 1.
- **Retours croisés** : post Community publié → « Voir le dossier » rouvre Signalements sur le dossier
  concerné ; plainte Community liée à un signalement actif → « Voir le dossier » ; message du patron →
  « Voir le dossier » (existe, prompt 86) ; rapport du soir → lien vers le Journal.
- **Pile de navigation** : chaque redirection empile l'écran d'origine ; **Échap dépile** (retour à
  l'écran précédent), et ferme la fenêtre/appli au sommet. La pile est sauvegardée avec la partie.
- Règle : chaque appli débloquée a **au moins une redirection** vers une autre appli, avec contexte.

## 4. Priorités imposées par le patron (2, puis 3 après 4 jours)

- Le briefing du matin (prompt 88 § 1) change de nature : le joueur **ne choisit plus** ses priorités.
  Le patron en **impose 2** dans son message du matin (épinglé en haut de l'appli Messages), calculées
  sur les faits réels de la journée (ligne en difficulté prévue, événement de l'agenda, météo).
- Une priorité est **tenue** si l'incident lié a reçu la meilleure réponse de sa catégorie dans la
  journée → le petit bonus existant est conservé.
- **Compteur de jours joués** (persisté dans la sauvegarde) : au bout de **4 jours**, le patron impose
  **3 priorités** par journée.
- Les priorités imposées s'affichent dans le bandeau de la journée. Exception documentée au prompt 88
  § 1 (briefing) ; Q1–Q61 inchangées.

## 5. Somnolence nécessaire : le joueur doit dormir, le choix porte sur le moment

Sur la base du prompt 78 (jauge 0–100, sieste volontaire ou forcée à 100, temps ×100 pendant la sieste) :

- La somnolence **monte avec le temps de jeu actif** (par heure simulée travaillée).
- **Seuil 70** : au-delà, l'aggravation des retards passe à ×1,5 (documenté comme modificateur de
  difficulté, comme ceux du prompt 87) et les équipes avancent moins vite.
- **100** : sieste forcée + malus « non traité » (règles existantes du prompt 78). → Dormir chaque jour
  est inévitable.
- Pendant la sieste (choix du moment) : les **équipes en route avancent** (leur cycle en route → sur place
  progresse) et, au réveil, le **prochain signalement de la file est révélé** (prévision à 1 dossier).
- Lisibilité : la jauge de somnolence est visible dans le bandeau avec son seuil (70), doublé d'un texte,
  jamais de couleur seule ; pendant la sieste, un bandeau indique ce qui avance.

## 6. Accessibilité, mobile, sauvegarde

- Chaque nouveauté : clavier seul, `aria-live` sur les annonces (déblocage, redirection, priorité tenue),
  `prefers-reduced-motion`, aucune animation obligatoire, cibles ≥ 44 px en portrait.
- Sauvegarde (prompt 33) : applis débloquées, pile de navigation, priorités imposées du jour et compteur
  de jours, jauge de somnolence, brouillons Community non envoyés.

## 7. Points à trancher par le groupe avant d'exécuter (à cocher dans ce fichier)

- [ ] Planning de déblocage du § 2 (semaines 2/3/4/5) : oui / non, ou autre répartition.
- [ ] En mode Défi / temps réel, tout débloqué d'emblée : oui / non.
- [ ] Seuil de somnolence 70 et aggravation ×1,5 : oui / non.
- [ ] Publication Community à chaque retard : obligatoire avec malus, ou libre avec plainte en cas
      d'aggravation (recommandé) ?

Si un point n'est pas coché, l'implémenter **désactivé par défaut**, derrière un réglage, et le signaler
dans la doc.

## 8. Mise en œuvre par lots (un commit vérifié par lot)

| Lot | Contenu |
|---|---|
| **A** | § 1 — correctif entrées des fenêtres au-dessus de l'appli (Échap, touches, curseur, mobile) |
| **B** | § 2 — déblocage par semaine, icônes verrouillées grisées, carte d'intro, sauvegarde |
| **C** | § 3 — redirections + pile de navigation + brouillon Community à chaque retard |
| **D** | § 4 — priorités imposées 2 → 3 après 4 jours, exception au prompt 88 § 1 |
| **E** | § 5 — somnolence nécessaire (seuil 70, ×1,5, sieste forcée, équipes qui avancent, prévision au réveil) + options du § 7 |

## 9. Vérifications détaillées

- `npm run build` et `npm test` dans `site/`, après chaque lot.
- `site/scripts/test-jeu.mjs` couvre :
  - § 1 : fenêtre ouverte par-dessus l'appli — Échap ferme la fenêtre (ne se lève pas), les touches de la
    fenêtre répondent, le curseur main est affiché ;
  - § 2 : semaine 1 = une seule icône active, les autres verrouillées ; déblocage par semaine rejoué à
    l'identique (graine) ; sauvegarde / restauration ;
  - § 3 : brouillon pré-rempli = champs réels du dossier ; « Voir le dossier » rouvre le bon dossier ;
    Échap dépile correctement ; aucune donnée inventée dans les brouillons ;
  - § 4 : priorités imposées = 2, puis 3 après 4 jours ; priorité tenue = bonus existant ; aucune
    interface de choix de priorité ne subsiste ;
  - § 5 : somnolence monte avec le temps actif, sieste forcée à 100, ×1,5 au-delà de 70, équipes et
    prévision pendant la sieste ;
  - aucune valeur Q57–Q61 modifiée, 1d6 inchangé, aucune exception non documentée.
- **Test humain** : 2 personnes du groupe jouent la semaine 1 (une seule appli) puis la semaine 2 —
  noter si le déblocage donne envie de continuer et si les redirections sont comprises sans texte.
- Accessibilité : contraste ≥ 4,5:1, clavier seul, `aria-live`, `prefers-reduced-motion`, aucun flash,
  hors ligne, 1920×1080 et mobile, FR + EN, aucune clé brute ni `[À COMPLÉTER]` affiché.
- Documenter dans `jeu/86-applis-reliees-somnolence-priorites.md` et ajouter la ligne au sommaire de
  `jeu/README.md`. Mettre à jour `jeu/82-engouement-variete.md` (briefing et info trafic remplacés).
- Branche `jeu/prompt-91-applis-reliees-somnolence-priorites`. À chaque push : entrée en tête de
  `journal.md`. Ne pas fusionner dans `main` sans demande.
