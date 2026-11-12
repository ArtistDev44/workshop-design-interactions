# Prompts 110 à 113 : autorisations, badges rouges, intro plus rapide et tutoriel, crédits

Ce rapport couvre les prompts `prompts/110` à `113`, demandés le 12/11/2026. Ils ont été exécutés sur la
branche `jeu/110-113-autorisations-badges-intro-credits`.

## 110 — Autorisations avant de jouer

- **Nouveau `site/public/autorisations.js`.** L'écran « Avant de jouer » (`MENU.ecran = 'autorisations'`)
  passe :
  - après le choix de la semaine (`lancerDepuisMenu`) ;
  - avant « Reprendre » : carte du menu, touche C, raccourci de la webapp.
- **Trois lignes** : Son, Micro, Caméra.
  - Chaque ligne donne son usage réel : musique et bips ; souffler pendant le café (prompt 63) ; montrer la
    main pour la sieste (prompt 67).
  - Statuts possibles : Non demandé, Autorisé, Refusé, Indisponible, Coupé.
  - La couleur double toujours le texte, jamais seule.
- **« Tout autoriser »** :
  - démarre `Confort.Son` (c'est un geste utilisateur) ;
  - fait un seul `getUserMedia({ audio, video })`, donc une seule fenêtre du navigateur ;
  - en cas d'échec, redemande micro et caméra séparément pour savoir lequel manque ;
  - les pistes sont arrêtées aussitôt.
- **Statut réel** lu par `navigator.permissions.query` quand l'API existe. Si tout est déjà réglé, l'écran ne
  s'affiche pas. Il ne revient pas dans la même session.
- **Écart avec le prompt :** `Confort.Reglages.webcam` n'est **pas** passé à `true`.
  - Ce réglage rallume la webcam au premier geste des sessions suivantes (`webcam.js`). L'activer ici
    allumerait la caméra sans clic.
  - La webcam reste donc opt-in, mais elle ne redemande plus la permission.
  - Le prompt a été corrigé dans ce sens.
- **Refus, API absente ou page non sécurisée** (`rendu/` en `file://`) : le jeu reste jouable, avec le
  bouton « Continuer sans ».
- **Vérifié dans Chromium** (périphériques simulés) :
  - permission accordée → écran sauté, partie lancée ;
  - refus (`--deny-permission-prompts`) → « Refusé » sur Micro et Caméra, partie lancée ;
  - aucune erreur console dans les deux cas.

## 111 — Notifications en badges rouges

- **Plus aucune carte de notification à l'écran.** `dessinerNotifications` (prompt 77) et
  `dessinerNotificationBarre` (prompt 80) sont supprimées, ainsi que leurs trois appels dans `sketch.js`.
- **`notifier()` reste la source unique** :
  - il garde l'historique `NOTIFS.liste`, vérifié par `test-jeu.mjs` ;
  - il annonce le message en `aria-live` poli ;
  - il incrémente `NOTIFS.nonVues[appli]`, sauf si l'appli est déjà sous les yeux du joueur.
- **Badge rouge chiffré** (`dsBadge(..., 'erreur')`, « 9+ » au-delà de 9) sur chaque entrée du menu à
  gauche :
  - **Carte** : nouveaux signalements et fins d'intervention ;
  - **Patron** : `Jeu.nonLus.patron` ;
  - **Community** : le plus grand de `Jeu.nonLus.community` et du nombre de plaintes en attente, pour ne
    pas compter deux fois la même plainte ;
  - le « ! » d'incident en cours (prompt 68) reste quand la carte n'a pas de compteur.
- **Remise à zéro** quand l'entrée devient active (`marquerVue`).
- **Vue bureau :** un seul badge, le total, au coin de l'écran du PC, sans clignotement.
- **Accessibilité :** Tab dans le menu annonce « Patron, nouveautés : 3 » (`libelleEntreeMenu`).
- **Vérifié :**
  - 2 signalements + 3 mails → badge total « 5 » sur le bureau, puis « 2 » sur Carte et « 3 » sur Patron ;
  - retour sur la carte → 0.

## 112 — Première partie plus rapide, tutoriel amélioré

### Démarrage

| Mesure (clic « Jouer » → le téléphone se lève, Chromium, hors réseau) | Avant | Après |
|---|---|---|
| Première partie | **5 436 ms** | **1 379 ms** |

- **Transition du jour 1 de la première partie** (`!introVue`) : 1,5 s (`DUREE_TRANSITION_INTRO`).
  - Elle affiche le titre et la date seulement.
  - L'explication de la journée reste annoncée par `annoncer()`, et le tutoriel la reprend.
  - Les autres journées gardent 5,2 s.
- **Téléphone** (`lancerConversation`) : il se lève pendant le fondu de sortie, 400 ms avant la fin de la
  transition, au lieu d'attendre qu'elle soit finie.
  - Cela vaut aussi pour les conversations d'ouverture de semaine.
  - Le premier message s'affichait déjà sans délai de frappe.
  - `DUREE_TEL_MAIN` est inchangée (450 ms).
- **Chargement de la semaine :** instantané (données locales), aucun indicateur ajouté.

### Tutoriel (`immersion.js`, `i18n.js`)

- **Six étapes réécrites en FR et en EN**, d'après le jeu actuel :
  1. **Votre rôle** : `game.js`, jauges et seuil critique 20 ; `journee.js` pour le patron.
  2. **La carte** : `carte-alertes.js`, `carte.lieuAPreciser`, touches + / −, Origine, Maj + flèches.
  3. **Répondre** : fenêtre du plaignant (prompt 107), 1 à 4, E (`panneau.js`), Échap qui réduit la
     fenêtre, horloge arrêtée pendant la lecture (`lecturePanneau`).
  4. **Les équipes** : panneau droit, glisser, clic pastille puis marqueur, Maj + 1–4, centres réels,
     effectifs du jour (prompts 108 et 109).
  5. **Le menu et la somnolence** : badges du prompt 111, Z, M maintenue (`micro.js`).
  6. **La fin de journée** : mail, « Sortie » et S (`soir.js`), clic sur l'horloge, score 0–300.
- **Les touches** de chaque étape sont dans un encart à part, en police de données (`tuto.N.touches`).
  « T : ce tutoriel » est précisé « depuis l'aide (H) » : T n'agit que dans l'aide.
- **Page gauche :** un schéma pixel par étape, dessiné par le code (`illustrationTutoriel`) :
  - jauges ;
  - carte et repères ;
  - bulle et répliques ;
  - centre, tracé et pastille ;
  - menu à badges ;
  - lune, horloge et sortie.
- **Barre de progression cliquable** (`allerEtapeTutoriel`), avec des cibles de 44 px.
- **Textes périmés corrigés ailleurs :**
  - `guide.prendre` : « dans la liste » devient « sur la carte » ;
  - `aide.k.glisser` : « carte de réponse » devient « glisser une équipe » ;
  - aide H : le signalement apparaît sur la carte, et les équipes se glissent depuis le panneau droit.
- **Non fait :** encadrer en vrai l'élément décrit derrière le livre. Le livre (1360 × 700) couvre la zone
  utile, donc ce n'est pas simple à faire. Le prompt disait de ne rien forcer.

## 113 — Crédits et diapositive « L'équipe »

- **Images fournies par le groupe** (`matteo-pp.webp`, `guillaume-pp.webp`, 700 × 700, 23 ko) :
  - copiées telles quelles dans `site/public/assets/credits/` et `slides/public/img/equipe/` ;
  - pas de réduction : un redimensionnement non entier aurait déformé les pixels ;
  - affichées sans lissage.
- **Nouveau `site/public/credits.js`.** L'écran du menu `MENU.ecran = 'credits'` est accessible :
  - par la nouvelle carte « Crédits » du menu (clé `mp.credits.menu`, car `mp.credits` sert déjà aux noms
    du pied de page) ;
  - par les noms du pied de page, qui deviennent un lien souligné.
  - Avec « Reprendre » présent, le menu a 7 cartes : elles sont resserrées (72 / 92 px) pour tenir au-dessus
    du pied de page.
- **Contenu de l'écran :**
  - **L'équipe** : les deux portraits, les noms, et « Atelier ESD Nantes · B3 Design · novembre 2026 ». Pas
    de rôle : le dépôt n'en indique pas.
  - **Licence** : MIT © 2026 (d'après `LICENSE`). Données : Licence Ouverte / ODbL, Open-Meteo CC BY 4.0,
    OpenStreetMap ODbL. Licence Hub'Eau **[À COMPLÉTER]** (déjà signalée au prompt 58). p5.js LGPL-2.1.
    Musiques CC0 (d'après `audio/CREDITS.md`).
  - **Utilisation de l'IA**, d'après l'historique git :
    - 282 commits co-signés Claude Opus (Claude Code) et 16 co-signés Mistral Vibe ;
    - les prompts du groupe sont dans `prompts/` et sur `/making-of/` ;
    - la pièce et l'interface sont dessinées par le code ;
    - la part humaine détaillée reste **[À COMPLÉTER]**.
  - **Liens** : Lire la licence, Making-of, Dépôt du code, Retour.
  - **Clavier** : Tab, ← →, Entrée ; Échap revient au menu.
- **Slidev :**
  - nouvelle diapositive « L'équipe » (16/18) avant « Livrables & crédits » : deux fenêtres du DS avec
    portrait et nom, et une note de présentateur ;
  - la ligne IA de l'encadré « Crédits » reprend le texte factuel du jeu ;
  - deck reconstruit dans `site/public/presentation/` ; images vérifiées (700 px chargés).

## Vérifications communes

- `npm run build`, puis `npm test` : 499 contrôles smoke et 552 contrôles jeu, tous verts.
- Audit des textes `?audit=textes&parcours=1` : **0 défaut** à 1920×1080, 1366×768 et 412×915.
  - Écrans ajoutés au parcours : « menu autorisations » (deux états) et « menu crédits ».
- Copie `rendu/PXE_NTE001_G01_NANTES-EN-REGULATION/` synchronisée : fichiers modifiés et images.
- Reste à faire par le groupe : un essai avec un vrai micro et une vraie webcam (Chrome, Firefox, Safari), et
  les champs [À COMPLÉTER] ci-dessus.
