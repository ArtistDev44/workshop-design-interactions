---
theme: none
title: Nantes en régulation — PATRIMOINE.EXE · NTE001
info: |
  Présentation du jeu « Nantes en régulation » (ESD Nantes, B3 Design, 9, 10 & 12 novembre 2026).
  Chaîne source → grammaire → système → œuvre. Construit avec Slidev (prompt 82).
lang: fr
colorSchema: dark
aspectRatio: 16/9
canvasWidth: 980
transition: fade
routerMode: hash
fonts:
  provider: none
  sans: JetBrains Mono
  mono: JetBrains Mono
drawings:
  enabled: false
download: false
wakeLock: false
layout: cover
---

# Nantes en régulation

**PATRIMOINE.EXE · NTE001** — ESD Nantes, B3 Design, 9, 10 & 12 novembre 2026

Œuvre `PXE-NTE001-G01-W01` · groupe G01 (à confirmer)

Jouer : [workshop-design-interactions.pages.dev](https://workshop-design-interactions.pages.dev/)

Auteurs : Mattéo Brevet & Guillaume Renoult (crédits du jeu)

<!-- Présentateur : la page de garde reprend le cartel (prompt 61). Flèches ← → pour avancer, Début / Fin. -->

---
layout: quote
---

# La question

> « Rejouer une semaine réelle du réseau de transports nantais et prendre, en salle de contrôle, les décisions de régulation qui préservent la fluidité du réseau — chaque incident réel devenant un dossier à trancher sous pression. »

- Thème : transports en commun nantais (tram, busway, bus)
- Rôle du joueur : régulateur en salle de contrôle
- Aucun événement inventé : tous les dossiers viennent des données

---
layout: center
---

# La chaîne

<div class="chaine" role="img" aria-label="Chaîne en quatre étapes : source, puis grammaire, puis système, puis œuvre">
  <div>Source<br><small>données ouvertes</small></div><span aria-hidden="true">→</span>
  <div>Grammaire<br><small>seuils, catégories</small></div><span aria-hidden="true">→</span>
  <div>Système<br><small>signalement → décision → jauges</small></div><span aria-hidden="true">→</span>
  <div>Œuvre<br><small>salle de contrôle pixel</small></div>
</div>

- **Source** : données ouvertes du réseau Naolib, agenda de Nantes Métropole, météo Open-Meteo, hauteur de la Loire (Hub'Eau)
- **Grammaire** : un seuil (retard ≥ 10 min), des alertes météo, des perturbations datées, cinq catégories de problème
- **Système** : boucle signalement → lecture → réponse → jauges, rythmée par la journée
- **Œuvre** : une salle de contrôle en pixel art, jouable au navigateur

---
layout: two-cols
---

# Les sources réelles

- **Offre et perturbations Naolib** (GTFS + changelog daté) — Licence Ouverte, Nantes Métropole — [jeu de données](https://data.nantesmetropole.fr/explore/dataset/244400404_transports_commun_naolib_nantes_metropole_gtfs/)
- **Temps réel Naolib** (GTFS-RT, retards par ligne) — Licence Ouverte, Nantes Métropole
- **Agenda des événements** de Nantes Métropole — Licence Ouverte — [API](https://data.nantesmetropole.fr/explore/dataset/244400404_agenda-evenements-nantes-metropole_v2/)

::right::

<br><br>

- **Météo** Open-Meteo (prévision et archive ERA5) — CC BY 4.0 — [open-meteo.com](https://open-meteo.com/)
- **Hauteur de la Loire** à Nantes, station M800001010 (Hub'Eau) — licence à vérifier par le groupe
- **En direct sur le téléphone** (mode « aujourd'hui ») : parkings, vélos, trafic routier, pollens — Open Data Nantes Métropole
- Hors ligne : instantanés réels datés, rejoués sans réseau

---

# La grammaire

- Un **retard d'au moins 10 minutes** sur une ligne, une **perturbation datée** des archives ou une **alerte météo** devient un dossier
- Chaque dossier reçoit une **catégorie** calculée sur ses champs réels : accident > météo > retard > travaux > affluence
- **Invariants** : seuil de 10 min, 4 réponses par catégorie dont « attendre », 3 jauges, un dé à 6 faces sur les effets
- **Variables** : la semaine rejouée (facile, normale, difficile), la météo, l'heure de pointe, l'agenda
- Mapping en une phrase : les données réelles génèrent les dossiers, chaque réponse module les jauges selon le contexte

---
layout: fact
---

# 0

événement inventé : chaque dossier, chaque tâche et chaque notification vient d'une donnée réelle ou de la partie elle-même — une conséquence de jeu est toujours étiquetée comme telle

---
layout: section
---

# Le système

Lire, décider, assumer : la journée d'un régulateur

---

# Décider, sans chrono

<div style="width: 400px">

- Un signalement s'ouvre : l'**horloge du jeu se met en pause** pendant la lecture
- **3 blocs** : ce qui se passe, pourquoi c'est important, ce qu'on sait
- **4 réponses** propres à la catégorie, avec leur tendance sur les jauges
- La **liste** garde la trace des décisions du jour
- La pression vient de la journée : le retard s'aggrave en file, « non traité » à la fin de service

</div>

<div class="capture" style="left: 470px; top: 96px; width: 480px">
  <img src="/img/decision.webp" alt="Capture du jeu : le panneau d'un signalement d'affluence. Flèches vers la mention « Horloge en pause pendant la lecture », vers les trois blocs d'information, vers les quatre cartes de réponse et vers la liste des décisions traitées aujourd'hui." />
</div>
<span class="etiquette" style="left: 800px; top: 66px">horloge en pause</span>
<Arrow x1="850" y1="80" x2="850" y2="138" color="#FFC138" width="3" />
<span class="etiquette" style="left: 470px; top: 400px">3 blocs</span>
<Arrow x1="520" y1="398" x2="690" y2="170" color="#FFC138" width="3" />
<span class="etiquette" style="left: 760px; top: 400px">réponses de la catégorie</span>
<Arrow x1="820" y1="398" x2="790" y2="300" color="#FFC138" width="3" />
<span class="etiquette" style="left: 470px; top: 430px">trace dans la liste</span>
<Arrow x1="560" y1="430" x2="560" y2="198" color="#FFC138" width="3" />
<span class="legende" style="left: 470px; top: 372px">Capture du jeu réel, semaine du 12/10/2026</span>

<!-- Présentateur : décision sans chrono (prompt 87), traces dans la file (prompt 89). -->

---

# Des tâches qui varient

<div style="width: 400px">

- **Briefing du matin** : 2 priorités parmi 4, tirées de la météo, de l'agenda et des travaux du jour
- **Info trafic** à rédiger bloc par bloc : ligne, cause, durée, alternative
- **Préparer un événement** de l'agenda, **rapport du soir**, carnet de la semaine
- Thème du jour, **cellule de crise**, expérience, grade et badges

</div>

<div class="capture" style="left: 470px; top: 96px; width: 480px">
  <img src="/img/briefing.webp" alt="Capture du jeu : la fenêtre « Briefing du matin ». Une flèche désigne la météo réelle du jour (7,4 mm de pluie, rafales à 31 km/h), une autre les quatre priorités proposées." />
</div>
<span class="etiquette" style="left: 470px; top: 400px">météo réelle du jour</span>
<Arrow x1="560" y1="398" x2="620" y2="190" color="#FFC138" width="3" />
<span class="etiquette" style="left: 760px; top: 400px">2 priorités à choisir</span>
<Arrow x1="820" y1="398" x2="790" y2="242" color="#FFC138" width="3" />
<span class="legende" style="left: 470px; top: 372px">Mesure : type de tâche dominant 82 % → 31 % des décisions</span>

---

# Le journal, tableau de bord

<div style="width: 400px">

- **Pastilles** des journées, objectif tenu ou raté
- **Tuiles** : signalements, bonnes décisions, jauges du jour en mini-courbes (un point par événement réel)
- **Frise** horaire de cartes, filtres, vue Semaine
- **Enquête** : citation de la source, contexte, dés, effets attendus de chaque réponse

</div>

<div class="capture" style="left: 470px; top: 96px; width: 480px">
  <img src="/img/journal.webp" alt="Capture de l'appli Journal de bord. Flèches vers les tuiles de résumé avec mini-courbes, vers la frise horaire des décisions et vers le bouton « Enquêter »." />
</div>
<span class="etiquette" style="left: 600px; top: 66px">tuiles et mini-courbes</span>
<Arrow x1="700" y1="82" x2="700" y2="150" color="#FFC138" width="3" />
<span class="etiquette" style="left: 470px; top: 400px">frise de la journée</span>
<Arrow x1="540" y1="398" x2="640" y2="215" color="#FFC138" width="3" />
<span class="etiquette" style="left: 790px; top: 400px">enquêter</span>
<Arrow x1="840" y1="398" x2="880" y2="210" color="#FFC138" width="3" />

---
layout: section
---

# L'œuvre

Une pièce, un PC, une ville derrière la vitre

---

# La salle de contrôle

<div style="width: 400px">

- Une pièce en pixel art, vue depuis la chaise : baie sur la ville, la Loire, la grue Titan ; la **météo réelle** à la fenêtre
- Un PC avec son système, **RégulOS** : signalements, patron, community, journal, indicateurs, données
- On termine la journée à **l'horloge** ; le **téléphone** vibre pour de vraies notifications
- Le soir, un mail ; en fin de semaine, un **rapport papier**

</div>

<div class="capture" style="left: 470px; top: 96px; width: 480px">
  <img src="/img/bureau.webp" alt="Capture du bureau. Flèches vers la fenêtre où il pleut (météo réelle du jour), vers l'écran du PC RégulOS, vers l'horloge murale qui termine la journée et vers le téléphone allumé par une notification." />
</div>
<span class="etiquette" style="left: 470px; top: 66px">pluie réelle du jour</span>
<Arrow x1="520" y1="82" x2="540" y2="130" color="#FFC138" width="3" />
<span class="etiquette" style="left: 640px; top: 400px">PC RégulOS</span>
<Arrow x1="700" y1="398" x2="710" y2="200" color="#FFC138" width="3" />
<span class="etiquette" style="left: 830px; top: 66px">horloge</span>
<Arrow x1="890" y1="82" x2="915" y2="125" color="#FFC138" width="3" />
<span class="etiquette" style="left: 840px; top: 400px">téléphone</span>
<Arrow x1="880" y1="398" x2="868" y2="330" color="#FFC138" width="3" />

---

# Le téléphone, ville vivante

<div style="width: 400px">

- Une **appli par source** : agenda, météo, travaux, Loire, messages de Camille et des chauffeurs, alertes de jeu, rappels
- Arrivées **mesurées** : au plus une toutes les 20 minutes de jeu, jamais pendant une décision
- Onglet **« En direct aujourd'hui »** : parkings, vélos, trafic, pollens — jamais datés de la semaine jouée
- **Ne pas déranger** : seules les alertes passent

</div>

<div class="capture" style="left: 470px; top: 96px; width: 480px">
  <img src="/img/telephone.webp" alt="Capture du téléphone en main. Flèches vers les onglets Notifications, Agenda et En direct, et vers une notification groupée par appli avec son heure." />
</div>
<span class="etiquette" style="left: 470px; top: 66px">onglets</span>
<Arrow x1="520" y1="82" x2="700" y2="156" color="#FFC138" width="3" />
<span class="etiquette" style="left: 470px; top: 400px">notification + source + heure</span>
<Arrow x1="560" y1="398" x2="700" y2="190" color="#FFC138" width="3" />

---
layout: two-cols
---

# Les interactions

- **Clavier** : tout le jeu (1 à 4 pour répondre, 0 pour attendre, E pour en savoir plus, J journal de bord, H aide, L langue)
- **Souris** et **toucher** : téléphone en paysage ou en portrait (mise en page dédiée)
- **Micro** (M maintenue) : après le café, souffler calme le cœur
- **Webcam** (désactivée par défaut) : une main montrée lance la sieste ; aucune image enregistrée ni envoyée

::right::

# Accessibilité, hors ligne

- Contraste ≥ 4,5:1, focus visible, annonces pour lecteurs d'écran, français et anglais
- Animations réduites respectées ; jamais de flash
- Palettes daltonisme, taille du texte, lecture facile
- Jouable sans son, au clavier seul, et **hors ligne** (service worker, instantanés locaux)
- « Défi chrono » optionnel pour qui veut l'ancien compteur

---

# Les livrables

- Le jeu : [workshop-design-interactions.pages.dev](https://workshop-design-interactions.pages.dev/)
- Le cartel : [/cartel/](/cartel/) — avec captation (hero, détail, process, démo vidéo) et QR codes
- La chaîne des prompts : [/making-of/](/making-of/)
- `manifest.json`, fiche-source, grammaire, version archivée relançable (`rendu/`)
- Tests automatisés : trois semaines rejouées à chaque `npm test`, mesure de la répétition (`scripts/mesure-repetition.mjs`)

---

# Crédits

- Musiques libres **CC0** : Komiku, Loyalty Freak Music (Wikimedia Commons) — détail dans `audio/CREDITS.md`
- Données : Nantes Métropole, Naolib, Open-Meteo, Hub'Eau
- Outils : p5.js, Web Audio, Astro, Slidev (cette présentation)
- Réalisé avec un assistant IA à partir de prompts écrits par le groupe (dossier `prompts/`) ; part humaine et relecture : [À COMPLÉTER]

---
layout: end
---

# Merci — à vous de réguler.
