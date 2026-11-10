# Prompt 67 — Jeu « Nantes en régulation », étape 50 : fin de journée — la nuit tombe, une flèche montre la sortie du bureau

Demande d'origine (10/11/2026) :

> Je souhaite que tu me fasses un prompt concernant la fin de chaque journée. Je souhaite qu'à chaque fin
> de journée il fasse nuit et qu'on puisse quitter le bureau grâce à une flèche indiquant la sortie du
> bureau.

Objectif : donner à **chaque fin de journée** un vrai moment de clôture, vécu dans la pièce. On ne passe
plus d'un bouton du mail à la journée suivante.

1. Une fois la journée terminée, **la nuit tombe** sur Nantes, derrière la baie vitrée et dans la pièce.
2. Une **flèche « Sortie »** apparaît et indique la sortie du bureau.
3. **Quitter le bureau** par cette flèche termine la journée et lance le lendemain matin. Le dernier jour,
   elle mène au bilan de la semaine.

Règles :
- Ne pas modifier la boucle de jeu ni les décisions verrouillées Q1–Q61.
- Rien n'est inventé côté données : la météo de la nuit reste celle du jour joué.
- Pas de flash, `prefers-reduced-motion` respecté, FR + EN.

## 0. Point de départ : lire le code existant avant toute modification

Fichiers concernés :
- `site/public/` : `journee.js`, `immersion.js`, `bureau.js`, `sketch.js`, `confort.js` (ou `audio.js` selon
  ce qui est en service), `guide.js`, `i18n.js`, `sauvegarde` (prompt 33) ;
- `scripts/test-jeu.mjs` ;
- une mise à jour de `jeu/`, `prompts/README.md` et `journal.md`.

Repérer, sans rien supposer (les numéros de ligne bougent) :
- **`journee.js`** (prompt 51) :
  - `clicHorloge()`, `terminerJournee()` (objectif du jour, `phase = 'mail'`, sauvegarde) ;
  - `partirQuandMeme()`, la fenêtre « partir » ;
  - la lumière de la pièce (`PIECE.lampe`, stores, halo de l'écran, ombres).
- **`immersion.js`** :
  - `dessinerMail()` et son bouton « Journée suivante / Bilan de la semaine », qui appelle
    `journeeSuivante()` ;
  - `journeeSuivante()`, `demarrerJournee()`, `allerFin()` ;
  - `heureAffichee()` (horloge simulée).
- **`bureau.js`** :
  - `facteurNuit()` : aube 6 h – 7 h 30, crépuscule 19 h 30 – 21 h ;
  - `majMeteoVisuelle()`, le décor de la baie (château, grue, Loire du prompt 34, lune, fenêtres
    allumées) ;
  - la vue au bureau / au poste, la parallaxe (prompt 40) ;
  - la sortie du PC (prompt 26 : **la porte a été retirée à la demande du groupe**, ne pas la
    réintroduire telle quelle).
- **Ambiance sonore nuit** (prompt 30) et musique (prompts 27 / 44) : ce qui change déjà la nuit.

## 1. Déroulé de la fin de journée

1. **Fin de service**, sans changer les règles actuelles : l'horloge atteint l'heure de fin, puis clic
   sur l'horloge ; ou bien « partir quand même », avec son malus inchangé.
   - `terminerJournee()` calcule l'objectif, puis le **mail du soir** s'affiche sur le PC, comme
     aujourd'hui (contenu inchangé).
   - Le bouton du mail devient **« Ranger le poste (Entrée) »**. Il ferme le mail sans passer à la
     journée suivante.
2. **La nuit tombe.**
   - Le joueur se lève automatiquement : vue « bureau », PC en veille.
   - L'horloge simulée avance en **crépuscule accéléré** jusqu'à **21 h 00**, en 4 s environ. À 21 h,
     `facteurNuit()` vaut 1.
   - En cas de départ anticipé, le malus est calculé avant, avec l'heure réelle du départ (comme
     aujourd'hui). La nuit tombe ensuite de la même façon.
   - Animations réduites : passage direct à la nuit, sans transition.
3. **Nuit dans la pièce** :
   - Dehors :
     - ciel nuit et lune ;
     - fenêtres de la ville allumées, château des ducs éclairé, feu rouge en haut de la grue Titan ;
     - la pluie reste si le jour joué est pluvieux (≥ 1 mm), visible dans la lumière des
       lampadaires.
   - Dedans :
     - plafonnier éteint ;
     - l'écran du PC en veille ne diffuse plus qu'un faible halo ;
     - la lampe de bureau reste dans l'état choisi par le joueur (prompt 51).
     - Si la lampe est éteinte, la pièce n'est éclairée que par la ville : la pièce doit rester
       **lisible** et la flèche **contrastée**.
   - Son : l'ambiance passe en mode nuit (ville presque éteinte, plus de tram), en fondu d'environ 1 s.
     La musique passe à une humeur calme de soirée, ou baisse si aucune humeur n'existe.
4. **La flèche « Sortie »** apparaît quand la nuit est installée.
   - **Bord gauche** de la vue bureau, à mi-hauteur.
   - Grande flèche pixel (style du design system, prompt 39) pointant vers l'extérieur du cadre, avec
     le libellé « Sortie » / « Exit » et un pictogramme de sortie de secours vert (homme qui court
     vers une porte, dessin original en pixel art).
   - Elle pulse doucement, à 1 pulsation/s au plus, sans clignotement brutal. Elle est fixe si les
     animations sont réduites.
   - Au survol : curseur main, infobulle « Quitter le bureau (Entrée) ».
   - Clavier : la flèche reçoit le focus de Tab (elle s'ajoute aux `OBJETS_BUREAU` le temps du soir) ;
     **Entrée** ou **S** l'active.
   - Mobile (prompt 60) : bouton flèche ≥ 44 px, même place.
   - `aria-live` : « La journée est finie. La sortie est à gauche (Entrée). »
5. **Quitter le bureau.**
   - La vue **pivote vers la gauche** (pan horizontal d'environ 0,8 s, réutilisant la caméra / parallaxe
     du prompt 40). Elle laisse voir un couloir sombre avec le panneau vert « Sortie » au-dessus d'une
     ouverture (pas de porte à animer).
   - Puis **fondu au noir** sur 0,6 s. Aucun fondu vers le blanc, aucun flash.
   - Écran noir de transition (1,5 s, passable par Entrée ou clic) :
     - « Fin de la journée du {date} » ;
     - « Retour demain, 6 h » ;
     - ou « Fin de la semaine » le dernier jour.
   - Animations réduites : pas de pan, fondu au noir direct.
6. **Lendemain** :
   - `journeeSuivante()`, puis `demarrerJournee()` : fondu depuis le noir sur la pièce à 6 h, à l'aube
     (`facteurNuit()` < 1, le ciel s'éclaircit tout seul).
   - Le dernier jour, la sortie mène à `allerFin()` (bilan de la semaine), inchangé.

## 2. États, sauvegarde et cas particuliers

- Nouvelle phase **`soir`** entre `mail` et la journée suivante.
  - Pendant `soir`, aucun incident n'arrive, l'horloge est figée à 21 h, la sieste ne se déclenche pas,
    et le sablier est inactif.
  - Le PC reste accessible (applis Journal, Community, Indicateurs consultables). Se relever ramène à
    la flèche.
- **Sauvegarde** (prompt 33) : la phase `soir` est enregistrée. Un chargement reprend la nuit tombée
  avec la flèche affichée.
- **Pause** (P) et **menu** (Échap) : disponibles pendant `soir`.
- **Mode « Aujourd'hui, en temps réel »** : l'heure affichée est l'heure réelle.
  - La nuit tombe visuellement à la fin de service, comme dans les autres modes.
  - Le texte de transition dit « Fin de service » sans date de lendemain si aucun autre jour n'est
    prévu.
- **Guide « Prendre en main »** (prompt 37) et tutoriel (prompt 34) : une étape « Quitter le bureau »
  montre la flèche le premier soir.
- Si le prompt 66 (la Carte devient l'appli principale) est déjà exécuté : le mail et le PC en veille
  suivent sa mise en page. Rien d'autre ne change.

## 3. Textes (FR + EN, via `t(...)`)

| Clé (exemple) | Français | English |
|---|---|---|
| `soir.ranger` | Ranger le poste (Entrée) | Put the desk away (Enter) |
| `soir.sortie` | Sortie | Exit |
| `soir.infobulle` | Quitter le bureau (Entrée) | Leave the office (Enter) |
| `soir.annonce` | La journée est finie. La sortie est à gauche (Entrée). | The day is over. The exit is on the left (Enter). |
| `soir.finJour` | Fin de la journée du {date} | End of the day — {date} |
| `soir.demain` | Retour demain, 6 h | Back tomorrow, 6 a.m. |
| `soir.finSemaine` | Fin de la semaine | End of the week |
| `soir.finService` | Fin de service | End of shift |

## 4. Vérifications détaillées

- `npm run build` et `npm test` dans `site/`.
- `scripts/test-jeu.mjs` couvre :
  - fin de journée → phase `soir`, heure 21 h, aucun incident ni sieste pendant `soir` ;
  - sortie → journée suivante à 6 h, ou `allerFin()` le dernier jour ;
  - départ anticipé : malus inchangé, puis soir ;
  - sauvegarde et chargement en phase `soir`.
- Partie réelle, au clavier puis à la souris, en français puis en anglais :
  - fin de journée par l'horloge, mail, « Ranger le poste » ;
  - nuit tombée (ciel, ville, pièce, son) ;
  - flèche visible et contrastée, lampe allumée puis éteinte ;
  - Tab jusqu'à la flèche, Entrée ;
  - pan, fondu, écran de transition, aube du lendemain ;
  - dernier jour vers le bilan ;
  - jour pluvieux : la pluie reste la nuit.
- Accessibilité :
  - contraste de la flèche ≥ 4,5:1 sur la pièce de nuit ;
  - pulsation ≤ 1/s ;
  - aucun flash ni fondu blanc ;
  - `prefers-reduced-motion` (pas de pan ni de pulsation, nuit directe) ;
  - `aria-live` dans la langue active ;
  - mobile ≥ 44 px ;
  - hors ligne, 1920×1080.
- Aucune régression des règles Q1–Q61 ni des prompts 14–66 : rejouer une semaine complète.
- Documenter dans `jeu/NN-fin-de-journee-nuit-sortie.md` (numéro libre suivant dans `jeu/`) et ajouter la
  ligne au sommaire de `jeu/README.md`.
- Branche `jeu/prompt-67-fin-de-journee-nuit-sortie`. À chaque push : entrée en tête de `journal.md`.
  Ne pas fusionner dans `main` sans demande.
