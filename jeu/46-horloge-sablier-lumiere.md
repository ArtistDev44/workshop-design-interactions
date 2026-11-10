# 46 — Finir sa journée à l'horloge, sablier, lumière, ombres (prompt 51)

Code : `journee.js` (interface), `game.js` (section « Prompt 51 » : départ et blâme, testés).

## Horloge murale : finir sa journée
- L'horloge murale est un objet du bureau (clic, ou Tab puis Entrée).
- La journée ne se termine plus toute seule : à l'**heure de fin** (20 h, ou l'heure de fin de la
  journée jouée), l'horloge **s'arrête**, un carillon sonne et le bandeau indique « Journée finie :
  cliquez sur l'horloge murale ». Le clic ouvre le mail du soir (objectif du jour, comme avant).
- **Avant l'heure** : alerte « Partir maintenant ? » (heure, heure de fin, dossiers restants, malus).
  « Rester » (Échap) ou « Partir quand même » (Entrée).
- **Partir quand même** : les dossiers restants du jour suivent la règle « non traité » (Q25,
  conséquences naturelles, comme un compteur à 0), puis mail du soir. **Le lendemain**, à l'ouverture de
  la journée, un **mail prioritaire du patron** s'affiche en premier : il cite la date, l'heure réelle du
  départ, l'heure de fin et le nombre de dossiers laissés, et retire **8 points de réputation** (une seule
  fois). Le message reste aussi dans l'appli Patron. Départ le dernier jour : la semaine se termine.

## Sablier
- Posé sur le plateau entre le pied de l'écran et la souris. Entre deux dossiers, un clic le retourne :
  le sable coule et le temps file 14 fois plus vite que l'attente accélérée, jusqu'au prochain dossier
  (ou jusqu'à l'heure de fin). Nouveau clic : il s'arrête. Pendant un dossier : « Pas maintenant ».
  Animations réduites : sable figé, l'effet sur le temps reste.

## Lumière de la pièce
- Lumière = lumière ambiante + jour (selon l'heure du jeu, divisée par ~3 stores baissés) + lampe.
- Le manque de lumière pose un voile bleu nuit sur **toute la pièce et le bureau** (table, objets,
  clavier) ; l'écran du PC, dessiné par-dessus, reste net. Dans le noir, l'écran devient la source de
  lumière : halo en anneaux pixel sur le plateau et le clavier. Lampe allumée la nuit : le mur reste éclairé.
- Fondu d'environ 1 s (direct si animations réduites). Les textes et boutons de l'interface sont dessinés
  hors de la pièce : contraste inchangé.
- Exemples mesurés : jour, lampe allumée → lumière 1 ; jour, lampe éteinte, stores baissés → 0,4 ;
  22 h, lampe éteinte, stores baissés → 0,12.

## Ombres portées
- Livres, plante, dossiers, tasse, sablier, souris et téléphone partagent la même ombre tramée
  (`ombreObjet`) : plus marquée sous la lampe allumée, plus large et plus claire stores baissés sans lampe.

## Vérifications
- `npm run build`, `npm test` (101 + 134 contrôles ; `test-jeu.mjs` couvre le départ anticipé :
  dossiers réglés, blâme de −8 appliqué une seule fois, mail qui cite l'heure du départ).
- Chromium, sans erreur console : lampe éteinte + store baissé (lumière 0,25 puis 0,12 la nuit) ;
  sablier → dossier suivant aussitôt ; horloge à 06:12 → alerte (3 dossiers restants) → départ → mail ;
  lendemain → mail prioritaire du patron ; journée jouée jusqu'à 20:00 → horloge arrêtée → clic → mail.
