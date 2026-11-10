# Prompt 73 — Jeu « Nantes en régulation », étape 55 : suppression de la carte, l'écran de jeu devient une liste de signalements

Demande d'origine (11/11/2026) :

> Enlève la carte : la source ne précise aucune ligne ; c'est sans intérêt.

Depuis le prompt 68, l'écran de jeu affiche une **carte géographique** de Nantes avec les tracés des
lignes et des repères d'incident positionnés (`carte.js` : projection, `centreLigne()`, repères qui
pulsent). Or les sources réelles (GTFS-RT, changelog, agenda, Open-Meteo) ne donnent **aucune géométrie
de ligne** : la position des repères sur la carte est donc arbitraire (« Réseau » au centre la plupart du
temps). La carte n'apporte aucune information réelle au joueur — la retirer.

## Attendu

1. **Suppression de la carte géographique** dans l'écran de jeu :
   - plus de fond de carte, plus de projection, plus de tracés de lignes, plus de repère positionné ;
   - les pictogrammes d'équipes ne se déplacent plus sur une carte : leur état (en route / sur place /
     retour) s'affiche en texte dans le panneau, avec le temps restant.
2. **L'écran de jeu devient une liste de signalements** (l'appli garde son fonctionnement, prompt 68) :
   - la partie gauche de l'écran affiche la **file des incidents** (actif + en attente) : type, lignes
     concernées (numéro + nom réel), gravité calculée, heure d'arrivée, expiration restante pour ceux
     en file ;
   - un clic ou Entrée sélectionne un signalement ; le panneau de droite garde tout ce qui existe
     (enquête par les sources, historique de la ligne, équipes, compteur, décision, narration).
3. **Renommage de l'appli** : puisqu'il n'y a plus de carte, l'appli « Carte » devient **« Signalements »**
   (EN : « Reports ») — icône, glyphe, libellés i18n FR + EN, barre des tâches, guide, tutoriel, aide,
   docs. L'icône reste à la première place du bureau et s'ouvre par défaut après le démarrage du PC.
4. **Légende des lignes** : la liste « Lignes concernées » (prompt 16) reste, en texte repliable, sans
   carte associée (cliquer une ligne met en surbrillance ses signalements dans la file, pas sur une
   carte).

## Contraintes

- **Rien n'est inventé côté données** : tout ce qui reste affiché vient des sources réelles déjà
  chargées (GTFS-RT, changelog, agenda, Open-Meteo, `data/lignes.js`) ou d'un calcul sur ces données ;
  absent → « non renseigné ».
- Règles Q1–Q61 inchangées ; `game.js` inchangé. Seule la couche d'affichage change (`carte.js`,
  `sketch.js`, `os.js`, `guide.js`, `i18n.js`, `portrait.js` pour le mobile).
- Pas de code mort : supprimer la projection, le tracé des lignes, le déplacement des pictogrammes
  d'équipes, et les clés i18n devenues orphelines (FR + EN).
- Comportements conservés : file d'attente avec expiration (2 × le compteur de la semaine), compteur
  qui ne démarre qu'à la sélection, conflit A/B de deux lignes, équipes limitées avec effectifs et
  pertinence (prompt 68), raccourcis clavier (Tab, Entrée, 1/2/3/0, A/B, Maj+1/2/3/4…), `aria-live`,
  `prefers-reduced-motion`, contraste ≥ 4,5:1, cibles ≥ 44 px en mobile portrait (liste en haut,
  panneau en dessous).
- `scripts/test-jeu.mjs` vert (adapter les tests qui supposaient la carte).

## Vérifications

- `npm run build`, `npm test` dans `site/`.
- Partie réelle FR + EN, clavier seul puis souris, 1920×1080 et mobile portrait :
  - plus aucune carte à l'écran, appli « Signalements » bien nommée partout (bureau, barre des tâches,
    aide, guide, tutoriel) ;
  - file de signalements lisible, sélection au clic/Entrée, panneau incident complet, décisions 1/2/3/0
    et A/B, équipes avec état textuel et refus quand plus d'effectif ;
  - hors ligne (fallback), aucune erreur console.
- Rejouer une semaine complète : aucune régression des prompts 14–72 ni de Q1–Q61.
- Doc : `jeu/69-…` (nouvelle doc), `jeu/README.md`, `prompts/README.md`, `journal.md` à jour.
- Branche `jeu/prompt-73-suppression-carte`. À chaque push : entrée en tête de `journal.md`.
  Fusion `main` sur demande.
