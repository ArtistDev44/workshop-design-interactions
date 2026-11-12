# Prompt 111 — Jeu « Nantes en régulation » : plus de messages de notification, seulement des badges rouges chiffrés

Demande d'origine (12/11/2026) :

> Supprime les messages des notifications sur l'app de l'ordinateur, mais garde les numéros en rouge associés
> à chaque application, pour que le joueur sache combien il a de notifications sans être sans cesse distrait.

## 1. Constat

- `multitache.js` (prompt 77, revu aux prompts 80 et 105) affiche des **cartes de notification** avec titre
  et extrait :
  - en haut à droite de la carte (`dessinerNotifications(1556, 140)`) ;
  - dans la barre (`dessinerNotificationBarre`) ;
  - sur la vue bureau (`sketch.js` l. 237-248).
- Elles glissent et s'empilent par trois toutes les quelques secondes, ce qui coupe la lecture d'un dossier.
- Les badges du menu à gauche (`menu-app.js`, `badgeIcone` dans `os.js`) ne comptent que ce qui est « à
  faire » :
  - « ! » pour la carte ;
  - le nombre de plaintes en attente pour Community.

## 2. Ce qui change

- **Plus aucune carte de notification visible** sur l'écran du PC : appli, vues intégrées, état « os ».
  - Supprimer les appels de `sketch.js`.
  - Supprimer `dessinerNotificationBarre` et `dessinerNotifications`, ou les garder sans appelant, avec un
    commentaire qui explique pourquoi.
  - Plus de glissement ni d'empilement.
- **`notifier()` reste la source unique.** Au lieu d'empiler une carte, il incrémente un compteur par appli :
  `NOTIFS.nonVues[icone]` (`signalements`, `patron`, `community`).
- **Badge rouge chiffré** (`dsBadge(..., 'erreur')`, rouge du DS, chiffre blanc, contraste ≥ 4,5:1) sur
  chaque entrée du menu à gauche :
  - **Carte** (signalements) : nouveaux signalements arrivés et fins d'intervention depuis le dernier
    affichage de la carte ;
  - **Patron** : `Jeu.nonLus.patron` (compteur déjà tenu par `game.js`) ;
  - **Community** : `Jeu.nonLus.community`, plus les plaintes qui attendent une réponse. Ne pas compter
    deux fois la même plainte ;
  - au-delà de 9 : « 9+ ».
- **Remise à zéro** quand l'entrée devient active (ouverture de la vue, ou retour sur la carte). Pas de badge
  sur l'entrée active : c'est la règle du prompt 103.
- **Mobile portrait :** mêmes badges sur la barre d'onglets du bas.
- **Vue bureau** (PC « fermé ») :
  - plus de cartes de notification ;
  - un seul badge rouge discret au coin de l'écran du PC dessiné dans la pièce, avec le total, s'il est
    non nul ;
  - pas d'animation de clignotement : une apparition simple, figée si les animations sont réduites.
- **Le téléphone** (`notifs-tel.js`, prompt 90) n'est pas concerné : c'est un autre objet, déjà silencieux.
- **Lecteurs d'écran :** `annoncer()` reste appelé par `notifier()`, en `aria-live` poli. Ce n'est pas une
  distraction visuelle, et l'information n'est pas perdue.
  - Les badges ont un libellé accessible : « Patron, 3 nouveaux messages ».
  - Le libellé est annoncé au focus clavier de l'entrée du menu.
- **Ce qui ne bouge pas :** les règles du jeu, les compteurs `Jeu.nonLus` (y compris dans la sauvegarde) et
  les sons de notification déjà en place.

## 3. Textes

- Retirer les clés i18n devenues inutiles (`notif.autres`…) seulement si plus rien ne les lit.
- Ajouter le libellé accessible du badge, en FR et en EN.
- Mettre à jour les mentions des notifications « en haut à droite » dans l'aide et le tutoriel. Le
  prompt 112 réécrit le tutoriel : y dire que les chiffres rouges comptent les nouveautés.

## Vérifications

- Partie semaine 1 :
  - un signalement arrive → badge « 1 » sur Carte quand une autre vue est ouverte, aucune carte de
    notification ;
  - message du patron → badge sur Patron ;
  - ouvrir la vue → le badge disparaît.
- Vue bureau : badge total sur l'écran du PC.
- `npm run build`, `npm test`, audit des textes à 0 défaut (1920×1080, 1366×768, portrait).
- Mettre à jour `scripts/test-jeu.mjs` s'il vérifiait les cartes de notification.
- Doc commune `jeu/110-113-autorisations-badges-intro-credits.md`, `prompts/README.md`, `journal.md`.
