# 74 — La somnolence remplace le sablier, la sieste devient centrale (prompt 78)

Code : `sieste.js` (nouveau), `immersion.js` (temps, arrivées pendant la sieste, réveil d'urgence, paupières),
`multitache.js` (bilan, malus pendant la sieste), `webcam.js`, `cafe.js`, `sketch.js` (bandeau, clavier),
`sauvegarde.js`, `portrait.js`, `guide.js`, `i18n.js`. Sablier supprimé : `journee.js`, `bureau.js`, `soir.js`,
`feedback.js`, objet du bureau, clés `objet.sablier*` et `sablier.*` (FR + EN), tests. `game.js` **inchangé**.

## Somnolence (jauge 0 → 100)
- Dans le bandeau d'état de l'écran de jeu, en bas à droite : « Somnolence 42 » + barre (bleue, orange dès 50,
  rouge dès 80) + « Se reposer · Z ». Survol : ligne d'aide « La somnolence monte avec la journée. Se reposer fait
  passer le temps très vite, mais les signalements continuent d'arriver et ceux qui expirent sont perdus. »
- Valeurs verrouillées dans `Jeu.REGLAGES.somnolence` (ajoutées par `sieste.js`, documentées) :
  +4,5 par heure de jeu (8 h → 20 h : +54) ; +0,5 par seconde sans geste au-delà de 8 s ; −12 par seconde
  de sieste ; −30 avec la tasse de café ; 0 chaque matin ; **100 = sieste forcée**.
- C'est un affichage et un déclencheur, pas une règle de score. Gardée dans la sauvegarde.

## La sieste
- **Volontaire** : clic sur la jauge, touche Z, ou la main à la webcam (prompt 67). **Forcée** à 100.
- Les paupières se ferment (animation du prompt 65, fondu si animations réduites) ; le temps de jeu file
  **×100** (même facteur que l'attente, prompt 77) ; les signalements actifs passent en arrière-plan.
- Pendant la sieste, les signalements **continuent d'arriver** (listés, notifiés) et leurs compteurs tournent ;
  ceux qui expirent sont réglés « non traité » (Q25, malus du prompt 23) **et** reçoivent le malus fixe de sieste
  existant (`Jeu.malusSieste`, −5 sur la jauge concernée) : on a répondu trop tard.
- Un signalement de **gravité élevée** déclenche le réveil d'urgence existant (triple bip, 3 / 2 / 1 s) : se
  réveiller le met dans la liste ; rater le réveil le règle comme ci-dessus, et l'on dort encore.
- L'horloge s'arrête à 20 h tant que des signalements restent (elle ne file plus dans la nuit).
- **Se réveiller** : bouton « Se réveiller (Espace) » sur les paupières, Espace, Entrée, Z, ou la main à la webcam.
  Tant qu'on dort, rien d'autre n'est cliquable (L reste disponible).
- **Bilan au réveil** (fil de la journée, notification, `aria-live`) : temps de journée passé, signalements
  arrivés, expirés sans réponse, variation des trois jauges. Puis reprise de l'actif le plus urgent, ou la liste.
- Supprimé : la sieste « par surprise » après 20 s d'inactivité.

## Comprendre le jour face à la sieste
- Tutoriel / livre « Aide » : nouvelle étape 5/6 « Le jour et la sieste » (8 h → 20 h, compromis sieste) ;
  l'étape « Raccourcis » cite Z ; « Le bilan » passe en 6/6.
- Aide (H) : paragraphe « Somnolence ». Guide « Prendre en main » : étape dédiée qui pointe la jauge.

## Vérifications
- `npm test` : +4,5 par heure de jeu et +0,5 / s d'inactivité ; sieste forcée à 100 ; pendant la sieste, un
  signalement expiré compte « non traité » + malus de sieste et apparaît au bilan ; récupération −12 / s ; bilan au
  réveil ; sieste volontaire refusée pendant une narration, déclenchable et annulable ; temps compressé pendant
  la sieste ; plus de déclenchement par inactivité ; plus aucune référence au sablier (code, i18n).
- Chromium FR / EN : Z → 266 minutes de jeu en 2,7 s, réveil avec bilan, sieste forcée à 100, étape 5 du
  tutoriel ; semaines complètes (FR, et EN en portrait mobile avec animations réduites) sans erreur console.
