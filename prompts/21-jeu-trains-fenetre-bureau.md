# Prompt 21 — Jeu « Nantes en régulation », étape 8 : tramways derrière la fenêtre du bureau

Objectif : dans la vue bureau (mode ordinateur), faire passer des **tramways derrière la
fenêtre**, pilotés par les données réelles du réseau — pour les **semaines rejouées**
(archives) comme pour la **session en direct** — sans toucher aux décisions verrouillées
Q1–Q61 ni à la structure de la vue bureau pixel art déjà en place
(`jeu/12-bureau-pixel.md`, `bureau.js`).

Fichiers concernés : `site/public/oeuvres/pxe-nte001-g01-w01/` (`bureau.js`, `gtfsrt.js`,
`game.js`, `data/semaines/*.json`, `data/semaines.js`, `data/fallback.js`),
`site/scripts/preparer-semaines.mjs`, plus un nouveau `jeu/14-trains-fenetre.md`, le
sommaire de `jeu/README.md` et `journal.md`.

Règle absolue : **aucun horaire de passage inventé**. Il n'existe pas d'archive des flux
temps réel GTFS-RT côté Nantes Métropole (`jeu/api.md` §9) : les passages des semaines
passées viennent exclusivement du GTFS archivé de la semaine (horaires réels), et ceux du
direct du flux VehiclePositions du moment. Inconnu → `"[À COMPLÉTER]"`, jamais de chiffre
au hasard.

## 1. Le décor : où et comment dessiner les tramways

- Tout se passe dans `dessinerFenetre(g)` (`bureau.js`) : la fenêtre fait `x=16, y=12,
  l=132, h=92` en coordonnées pixel art (480×270, ×4 à l'écran). Le décor est déjà
  redessiné 8×/s (`dernierRenduBureau`) : l'animation des tramways passe par là, sans
  ralentir le jeu affiché dans l'écran du PC.
- Ajouter une **bande de voie ferrée horizontale** dans le bas de la fenêtre, dessinée
  **avant** la ville lointaine et les arbres (donc derrière), le ciel restant derrière tout.
  Les croisillons et le reflet de vitre restent dessinés **par-dessus**.
- Chaque tramway est un petit sprite pixel art dessiné par le code (caisse, fenêtres,
  pantographe, roues) : **aucun fichier image**, comme tout le décor. Couleur de caisse =
  `couleur` de la ligne dans `data/lignes.js` (`type === 0` = tram). La nuit (ciel déjà
  géré), phares sobres ; pluie → essuie-glaces discrets si simple.
- Vitesse de défilement constante, direction alternée (gauche→droite / droite→gauche) ;
  un tram sortant d'un côté réapparaît de l'autre selon la source de données (voir §2–3).

## 2. Session en direct : flux GTFS-RT VehiclePositions

- Dans `gtfsrt.js`, ajouter au `FLUX` :
  `vehiclePositions: 'https://api.okina.fr/gateway/semgtfsrt/realtime/vehicle-positions/NAOLIBORG'`
  (flux documenté dans `jeu/api.md`).
- Ajouter un décodeur `lirePositionVehicule` sur le même modèle que `lireTripUpdate` :
  `VehiclePosition { trip { route_id }, position { latitude, longitude }, timestamp }`.
  Exposer `positionsParLigne(flux)` → `[{ ligne, nb }]` (nombre de véhicules réels par
  route_id), testable sous Node comme le reste du décodeur.
- Rafraîchir ce flux au maximum **1 fois toutes les 15–30 s** (même budget que trip-updates :
  1 requête / 30 s), uniquement en mode `direct` et si `Jeu.enLigne`.
- Côté fenêtre : la **fréquence de passage d'un tram d'une ligne ∝ le nombre de véhicules
  réels de cette ligne** en circulation. Un véhicule dont la ligne a un retard ≥ 10 min
  (croisement avec trip-updates) passe **plus lentement**. Hors ligne ou flux
  injoignable : aucun tram en direct (voir §3 pour les semaines).

## 3. Semaines passées : passages réels bakés au build

- Étendre `site/scripts/preparer-semaines.mjs` : pour chaque semaine préparée, télécharger
  la **version archivée du GTFS Naolib** de cette semaine (« Backed up resources » de
  transport.data.gouv.fr — Réseau Naolib, `jeu/api.md` §9), en extraire les `stop_times`
  des lignes de type tram (`type 0` dans `lignes.js`) et écrire dans
  `data/semaines/<lundi>.json` (et `data/semaines.js`) un champ :
  `"passages": [{ "date": "2026-11-04", "heure": "08:12", "ligne": "1" }, …]`
  (horaires réels prévus de la semaine, lignes tram uniquement).
- Au runtime (mode `semaine` / `hors ligne`) : l'heure simulée = `date` + `heure` du
  dossier courant (`Jeu.paquet[Jeu.index]`) ; les passages dont l'heure est proche
  (fenêtre de ±10 min) font passer le tram de la ligne concernée derrière la fenêtre.
- **Repli** si le GTFS archivé est indisponible au build : aucun champ `passages` baké →
  repli sur les dossiers mêmes de la semaine (un dossier `ligne en difficulté` ou
  `perturbation` avec `lignes` non vide et `heure` définie = un passage de cette ligne à
  cette heure). Le mode hors ligne (`data/fallback.js`) suit la même règle avec ses
  6 dossiers. Jamais de passage sans source réelle.

## 4. Déterminisme et accessibilité

- Mêmes données = mêmes passages : positions dérivées de la graine `Jeu.alea` (déjà
  initialisée par semaine), pas de `random()` libre dans le décor.
- `prefers-reduced-motion` (ou réglage « réduire les animations ») : tramways **statiques**
  (un seul tram posé, immobile) ou aucun ; jamais de clignotement, aucun flash > 3/s.
- Contraste ≥ 4,5:1 pour tout élément ajouté ; le tram ne masque jamais le reflet ni les
  croisillons de manière illisible.

## 5. Vérifications

- `npm run build` dans `site/` (pas de captures d'écran répétées).
- Tester : une partie en mode semaine (tram visible à l'heure d'un dossier), le mode
  direct (passages selon les véhicules réels, repli hors ligne si flux coupé), le mode
  hors ligne (double clic sur `index.html`, fallback), `prefers-reduced-motion`, clavier
  seul, 1920×1080.
- Aucune dépendance ajoutée (décodeur protobuf maison, comme `gtfsrt.js`) ; aucun fichier
  image ; aucune clé ni secret ; le site reste relançable hors ligne.

## 6. Documentation et livraison

- Documenter les décisions dans un nouveau `jeu/14-trains-fenetre.md` (sources des passages
  par mode, mapping ligne → couleur, replis) et ajouter la ligne au sommaire de
  `jeu/README.md`.
- Travailler sur une branche `jeu/prompt-21-trains-fenetre`. À chaque push : une entrée en
  tête du tableau de `journal.md` (date, commit, fichiers, résumé). Ne pas fusionner dans
  `main` sans demande.
