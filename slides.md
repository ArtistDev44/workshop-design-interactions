# Nantes en régulation

**PATRIMOINE.EXE · NTE001** — ESD Nantes, B3 Design, 9, 10 & 12 novembre 2026

Œuvre `PXE-NTE001-G01-W01` · groupe G01 (à confirmer)

Jouer : [workshop-design-interactions.pages.dev](/)

Auteurs : [À COMPLÉTER]

---

# La question

« Rejouer une semaine réelle du réseau de transports nantais et prendre, en salle de contrôle, les décisions de régulation qui préservent la fluidité du réseau — chaque incident réel devenant un dossier à trancher sous pression. »

- Thème : transports en commun nantais (tram, busway, bus)
- Rôle du joueur : régulateur en salle de contrôle
- Aucun événement inventé : tous les dossiers viennent des données

---

# La chaîne

**source → grammaire → système → œuvre**

- **Source** : données ouvertes du réseau Naolib, agenda de Nantes Métropole, météo Open-Meteo, hauteur de la Loire (Hub'Eau)
- **Grammaire** : un seuil (retard ≥ 10 min), des alertes (météo au-delà du 95e centile de la semaine), des perturbations datées
- **Système** : boucle signalement → enquête → décision → jauges
- **Œuvre** : une salle de contrôle en pixel art, jouable au navigateur

---

# Les sources réelles

- **Offre et perturbations Naolib** (GTFS + changelog daté) — Licence Ouverte, Nantes Métropole — [jeu de données](https://data.nantesmetropole.fr/explore/dataset/244400404_transports_commun_naolib_nantes_metropole_gtfs/)
- **Temps réel Naolib** (GTFS-RT, retards par ligne) — Licence Ouverte, Nantes Métropole
- **Agenda des événements** de Nantes Métropole — Licence Ouverte — [API](https://data.nantesmetropole.fr/explore/dataset/244400404_agenda-evenements-nantes-metropole_v2/)
- **Météo** Open-Meteo (prévision et archive ERA5) — CC BY 4.0 — [open-meteo.com](https://open-meteo.com/)
- **Hauteur de la Loire** à Nantes, station M800001010 (Hub'Eau) — licence à vérifier par le groupe
- Hors ligne : instantanés réels datés, rejoués sans réseau

---

# La grammaire

- Un **retard d'au moins 10 minutes** sur une ligne, une **perturbation datée** des archives ou une **alerte météo** devient un dossier
- **Invariants** : seuil de 10 min, 3 actions + « ne rien faire », 3 jauges qui partent de 50
- **Variables** : la semaine rejouée (compteur 60, 30 ou 15 s), la météo, l'heure de pointe, un dé à 6 faces sur les effets
- Mapping en une phrase : les données réelles génèrent les dossiers, chaque action module les jauges selon le contexte

---

# Le système

- Un dossier arrive comme un **signalement vague** ; le joueur **enquête** (carte, info trafic, météo, agenda — ou dans la pièce : téléphone, fenêtre), chaque source coûte 4 s
- **4 décisions** : dévier la ligne, retenir en terminus, bus de renfort, ne rien faire
- **3 jauges** : fluidité, réputation, budget ; score sur 300
- **3 fins** selon le score : bonne (≥ 240), moyenne (≥ 150), mauvaise ; une **démission** possible si les trois jauges passent sous 20
- Mode histoire : trois semaines réelles, facile → normale → difficile ; temps réel débloqué ensuite

---

# L'œuvre

- Une pièce en pixel art, vue depuis la chaise : baie sur la ville, la Loire, la grue Titan
- Un PC avec son système, **RégulOS** : appli Régulation, patron, carte, community, journal, indicateurs, **données**
- Une journée de travail : on la termine à **l'horloge**, le **sablier** fait passer le temps, le **café** fait monter l'adrénaline
- Le soir, un mail ; en fin de semaine, un **rapport papier** et le bilan du patron

---

# Les interactions

- **Clavier** : tout le jeu (1, 2, 3, 0 pour décider ; 5 à 8 pour enquêter ; R ralenti ; J journal de bord ; H aide ; L langue)
- **Souris** et **toucher** : téléphone en paysage ou en portrait (mise en page dédiée), gestes (tap, appui long, glisser)
- **Micro** (M maintenue) : voix, souffle et bruit pilotent une texture sonore granulaire
- **Webcam** (désactivée par défaut) : présence détectée en local, l'absence déclenche la sieste ; aucune image enregistrée ni envoyée

---

# Accessibilité et hors ligne

- Contraste ≥ 4,5:1, focus visible, annonces pour lecteurs d'écran, français et anglais
- Animations réduites respectées ; jamais de flash (≤ 1,5 pulsation par seconde)
- Palettes daltonisme, taille du texte, lecture facile (compteur × 1,5)
- Jouable sans son, au clavier seul, et **hors ligne** (double clic, service worker, instantanés locaux)

---

# Les livrables

- Le jeu : [workshop-design-interactions.pages.dev](/)
- Le cartel : [/cartel/](/cartel/) — avec captation (hero, détail, process, démo vidéo) et QR codes
- La chaîne des prompts : [/making-of/](/making-of/)
- `manifest.json`, fiche-source, grammaire, version archivée relançable (`rendu/`)
- Tests automatisés : une partie complète rejouée à chaque `npm test`

---

# Crédits

- Musiques libres **CC0** : Komiku, Loyalty Freak Music (Wikimedia Commons) — détail dans `audio/CREDITS.md`
- Données : Nantes Métropole, Naolib, Open-Meteo, Hub'Eau
- Outils : p5.js, Web Audio, Astro
- Réalisé avec un assistant IA à partir de prompts écrits par le groupe (dossier `prompts/`) ; part humaine et relecture : [À COMPLÉTER]

Merci — **à vous de réguler.**
