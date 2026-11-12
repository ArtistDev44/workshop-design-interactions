# Prompts 115 à 119 : tirés de l'audit du 12/11/2026 (expérience de jeu et rendu)

Ces cinq prompts appliquent les constats de `audit-2026-11-12.md` (racine). Ils ont été exécutés le 12/11/2026 sur la
branche `jeu/115-119-audit-experience-rendu`, dans un worktree séparé : une autre session travaillait en même temps
sur le prompt 114 (écran Crédits et menu), d'où la numérotation à partir de 115 et l'absence de toute modification
de `menu.js` et `credits.js`.

## 115 — Une évaluation qui suit les jauges, des tendances avant de choisir

- **Constat rejoué par simulation** (vrais `game.js`, `taches.js`, `rythme.js` et données, dans Node) : la réponse
  jugée « bonne » était celle dont la **somme brute** des effets attendus était la plus haute. Avec le bonus ×1,25 de
  situation, « attendre » (`[-2, 0, +5]`) gagnait partout où c'est calme, soit 10 à 15 dossiers sur 15. Suivre le
  conseil vidait la fluidité.
- **Changement (`game.js`)** : chaque effet attendu est pondéré par le besoin de sa jauge **avant la décision**,
  `(100 − v) / 50`, borné à [0,25 ; 2]. La meilleure réponse est la plus haute somme pondérée ; une réponse à moins
  de 1 point d'elle est « bonne ». L'entrée du journal garde `attendus` (bruts, pour le Journal et l'enquête) et
  ajoute `attendusPonderes`, `poids`, `jaugeBasse`. Les anciennes sauvegardes gardent l'ancien calcul. Les effets
  réels des réponses ne changent pas.
- **Résultat** (semaines 1, 2, 3) :

  | Stratégie | Avant | Après |
  |---|---|---|
  | Toujours la réponse jugée « bonne » | 215 · licencié au 10ᵉ · licencié au 14ᵉ | 287 · 290 · 272, fin « bonne », jamais licencié |
  | Remonter la jauge la plus basse | 246 · 251 · 216, 10 à 12 « raté » | 285 · 285 · 284, 13 à 15 « bon » |
  | Toujours attendre | 175 (licencié au 8ᵉ) | 117 à 125, licencié, 14 à 15 « raté » |

- **Tendances** (`panneau.js`) : sous chaque réplique, « Flu. ▲▲  Rép. ≈  Bud. ▼ » (symbole et couleur, jamais la
  couleur seule), calculée par `Jeu.effetsAttendus`. Les lignes de réponse passent de 62 à 84 px ; elles reviennent
  à 62 px, sans tendance, quand les sources (« En savoir plus ») sont ouvertes.
- **Option « Pression visible »** : marque aussi « ✓ conseillé » sur les réponses que l'évaluation jugerait bonnes
  (désactivée par défaut : le joueur doit pouvoir se tromper). Pas de nouvelle option : la fenêtre des options est
  pleine (12 cases).
- **Raison du retour** : « votre jauge Fluidité est basse (32) » quand la jauge en manque est sous 45.
- **Test** : `test-jeu.mjs` joue les 3 semaines en suivant le conseil (aucun licenciement, 15/15 « bon », score
  ≥ 180). Le test des « chaînes » choisit désormais la pire réponse au sens pondéré.

## 116 — Un retour lisible, une intro qui décrit le vrai jeu

- **Textes** (FR et EN) : `sms.2` ne parle plus de « dévier, retenir, renfort… le chrono tourne » ; `sms.4` ne dit
  plus « pas de sieste au poste ». La fenêtre « Votre poste » décrit les gestes réels : clic sur la carte (horloge
  arrêtée pendant la lecture, `tempsSuspendu`), répliques 1 à 4 avec leur tendance, équipes glissées depuis leur
  centre (prompt 109), menu de gauche et badges (prompt 111).
- **Narration** : plus de suite automatique hors défi chrono (elle passait seule au bout de 6 s) ; en défi chrono,
  10 s.
- **Plaintes Community** : leur délai de 45 s était compté en `millis()` réels, donc pendant la lecture d'un
  signalement. Nouvelle horloge `tempsPlaintes()` (`immersion.js`), qui n'avance que quand le temps de jeu n'est pas
  suspendu, au rythme réel (pas ×100). Une plainte datée du futur (rechargement) repart du délai complet.
- **Guide « Prendre en main »** : quand un dossier ou sa narration est ouvert, la bulle passe sur la carte à gauche
  (sous le menu si c'est lui qu'elle désigne) ; elle couvrait la plainte, puis les répliques.
- **Indicateur de sauvegarde** masqué pendant la narration : il chevauchait son titre.

## 117 — Mode exposition et filet en cas d'erreur

- **`?expo=1`** (nouveau `expo.js`, premier script de la page) :
  - purge des clés `pxe-nte001*` du visiteur précédent, sauf réglages, langue, palmarès et marqueurs de migration
    de la musique ;
  - ni écran « Avant de jouer », ni SMS, ni démarrage du PC, ni fenêtre « Votre poste » : le joueur arrive assis
    devant la carte. Le guide reste proposé ; son étape « somnolence » se valide après 3 s au lieu de 10 ;
  - après 90 s sans geste en partie (`?inactif=` pour les tests), voile « Partie en pause » et compte à rebours de
    15 s ; un geste l'annule, sinon purge et rechargement : retour à l'écran titre.
  - **Mesuré** (Chromium sans tête, 1920×1080) : première décision en **4 gestes et 5,9 s**, contre 12 gestes et
    27,6 s sans le mode exposition.
- **Filet** (`installation.js`) : après une erreur, si `frameCount` est figé 2 s (p5 a cessé de dessiner), message
  « Petit souci d'affichage : on relance le jeu… » puis rechargement 3 s plus tard ; au plus une fois par minute
  (`sessionStorage`). Testé en remplaçant `draw()` par une fonction qui lève une erreur.
- README de `site/` et de `rendu/` : l'adresse d'exposition.

## 118 — Hiérarchie du bandeau, gravité lisible, plein écran

- « Quitter la journée » en bouton secondaire (contour) : le rouge plein reste à l'urgence et aux badges.
- Gravité sur la carte : « élevée » en rouge franc `#D10B00` (3,5:1 sur le fond, au-dessus des 3:1 d'un élément
  graphique) avec un liseré blanc, 36 px ; « moyenne » 28 px ; « faible » 20 px. L'infobulle écrit la gravité.
- Badge en palette protan et deutan : texte sombre sur `#FF7A00` (7,48:1 au lieu de 2,61:1) ; en tritan, le blanc
  reste meilleur (4,67:1 sur `#E8003D`).
- Bandeau : la disponibilité des équipes n'est plus répétée sur la seconde ligne (elle est à droite) ; la ligne n'est
  plus tronquée en 1920×1080.
- Touche **F** : plein écran (entrée et sortie), annoncée ; ajoutée à la ligne « L » de l'aide.
- **Hors champ** : l'écran Crédits (mise en page portrait, licence Hub'Eau encore « [À COMPLÉTER] » dans
  `credits.licence.texte` alors que `manifest.json` la donne) est laissé au prompt 114, qui le redessine.

## 119 — Décrire la règle que le jeu joue vraiment

- **Vérifié dans les données** : `retard: null` sur les 15, 23 et 28 entrées des trois semaines et les 6 du repli.
  Le seuil de 10 minutes et l'aggravation du retard ne jouent qu'en temps réel.
- **Règle reformulée** dans `grammar.md` (+ `grammar.pdf` régénéré), le registre (`pxe-nte001-g01-w01.json` : règle,
  invariant, cartel de 113 mots, titre de la source sans « alertes »), `rendu/…/cartel.md`, les README, la note de
  `jeu/00-concept.md` et la diapositive « Le seuil ».
- **Inférence assumée** : l'affluence attribuée à un événement de l'agenda est écrite comme une hypothèse du jeu.
- `scripts/test-difficulte.mjs` et `jeu/36-tests-difficulte.md` marqués historiques (ancienne table d'actions).
- `audit-2026-11-12.md` : chaque constat traité est marqué.

## Vérifications

- `npm run build` ; `npm test` : smoke et test du jeu (contrôles ajoutés pour 115 à 118) ; `node --check` sur tous
  les scripts (le test du jeu ne charge pas `sketch.js` : une erreur de syntaxe y passait inaperçue pendant le
  prompt 116, rattrapée par le navigateur).
- Parcours dans Chromium sans tête : fenêtre du dossier, narration, mode exposition, voile d'inactivité, filet,
  carte avec les trois gravités.
- Audit des textes (`?audit=textes&parcours=1`) à 1920×1080, 1366×768 et 412×915 : voir le résultat dans
  `journal.md`.
