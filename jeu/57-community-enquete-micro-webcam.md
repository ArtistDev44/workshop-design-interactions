# 57 — Réactions en chaîne, enquête après coup, micro et webcam utiles (prompt 63)

## Community : réactions à vos réponses
- `game.js` (`programmerSuivis`, `majSuivis`, testés) : après chaque réponse à une plainte, **0 à 3 réactions**
  (l'auteur, puis d'autres comptes fictifs comme pour les commentaires du prompt 22), tirées par **hachage de
  la graine** (reproductibles, sauvegardées, sans toucher aux dés). Délais variés : 4 min à 10 h de jeu, parfois
  le lendemain matin. Ton selon votre réponse (bien reçue → merci, précisions ; mal reçue → relances,
  agacement), **±1 réputation** chacune, livrées une seule fois quand l'heure du jeu est atteinte (bip discret).
- Affichage : « ↳ réaction à votre réponse » dans l'appli Community. Les modèles citent la nature réelle du
  dossier quand elle existe (le modèle qui la cite n'est pas pris sinon).

## Journal : enquêter après coup
- `os.js` (`appJournal`, `enqueteJournal`) : navigation **Veille / Lendemain** entre les journées jouées ;
  bouton **Enquêter** sur chaque incident traité ; quatre volets, tous issus des données de la partie :
  - **Ce qui s'est passé** : type, nature, lignes, retard, citation et nom de la source, date et heure ;
  - **Contexte** : météo réelle du jour, heure de pointe, météo défavorable, événements grand public ;
  - **Votre décision** : action, effets réels, dés lancés, évaluation, meilleure action attendue et **effet
    moyen attendu de chaque action dans ce contexte** — c'est là que l'on apprend les effets depuis que les
    flèches ont disparu (prompt 50) ;
  - **Les suites** : plainte liée, votre réponse et sa réception, réactions reçues, équipes envoyées.

## Micro et webcam, côté jeu (pistes 1, 3, 5)
- **Radio des chauffeurs** (`micro.js`, `usagesMicro`) : M maintenue pendant un dossier, une voix (hauteur
  détectée) pendant 1,5 s → l'info trafic est révélée **sans coût de temps**, annonce radio. Équivalent : 6.
  La source interne de repli (micro refusé) ne compte pas.
- **Souffle anti-stress** : pendant le boost du café, un souffle continu (bruit sans hauteur) fait redescendre
  le cœur deux fois plus vite et ralentit le compteur de moitié. Bonus facultatif.
- **Geste de réveil** (`webcam.js`) : webcam active, un grand mouvement (main levée, différence moyenne > 22)
  pendant le réveil vaut « Se réveiller ». Équivalent : espace.
- Les info-bulles du micro et de la webcam disent maintenant à quoi ils servent. Règles Q1–Q61 inchangées.

## Vérifications
- `npm run build`, `npm test` (123 + 156 contrôles : réactions ≤ 3, reproductibles, livrées une fois, textes
  complets).
- Chromium (faux micro et fausse caméra) : voix simulée → info trafic révélée ; réponse à une plainte →
  2 réactions programmées, 1 livrée vite ; enquête : 4 volets et journées ; souffle pendant le boost → boost
  avancé de 2 s ; grand mouvement pendant le réveil → réveillé. Aucune erreur console.

## Mise à jour (prompt 64)
- « Radio des chauffeurs » retirée au prompt 64 (demande du groupe) ; détection de présence webcam refaite (voir `jeu/58`).
