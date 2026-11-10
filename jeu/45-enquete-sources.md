# 45 — Découvrir la situation : enquête par les sources (prompt 50)

Direction choisie par le groupe le 10/11/2026 (question posée) : **enquête par les sources**.
Code : `enquete.js` ; panneau du dossier dans `sketch.js` (`dessinerDossier` → `dessinerEnquete`).
`game.js` (effets, dés, règles Q1–Q61) est inchangé : `test-jeu.mjs` reste vert.

## Déroulé
- Un dossier arrive comme un **signalement vague** : « Retard signalé sur le réseau », « Perturbation
  signalée », « Alerte météo signalée », « Affluence signalée ». Ni ligne, ni retard, ni cause affichés.
- Quatre **sources**, chacune liée à une vraie donnée du dossier :

| Touche | Source | Ce qu'elle révèle (données réelles) |
|---|---|---|
| 5 | Carte | lignes du dossier, surlignées sur la carte et ajoutées à « Lignes concernées » (ou « lieu inconnu ») |
| 6 | Info trafic | retard (ou « non renseigné »), nature, citation de la source, nom de la source, heure |
| 7 | Météo | conditions du jour joué ; « Open-Meteo, en direct » ou « Archive Open-Meteo du … » selon le mode |
| 8 | Agenda | l'événement réel (dossier d'affluence) ou les événements grand public du jour (prompt 47), sinon « aucun » |

- Consulter une source dans l'appli coûte **4 s de compteur** (en semaine difficile, 15 s : on ne peut
  pas tout voir). Les gestes dans la pièce révèlent aussi, sans coût de compteur (le temps réel passe
  déjà) : **téléphone** → agenda, **fenêtre** → météo, **appli Carte** de RégulOS → carte.
- La carte et la liste ne montrent plus d'avance les lignes de la semaine : seulement les dossiers
  déjà traités, et le dossier courant une fois la carte consultée.
- **Plus de conseil ni de flèches d'effet** sous les boutons d'action : les effets s'apprennent dans la
  narration, le journal, le mail du soir et le rapport. Les seuils des jauges restent visibles.
- Textes mis à jour : bandeau « À VOUS · enquêtez (5 à 8 …), puis agissez », étape du guide « Prendre en
  main », pages 2 et 3 du livre « Commande ». FR + EN.

## L'appli Régulation en fenêtre (demande complémentaire)
- L'appli n'est plus en plein écran : elle est dessinée réduite (91 %, mêmes proportions) au-dessus de
  la **barre des tâches de RégulOS**, toujours visible (icônes, jauges, heure) et cliquable : un clic sur
  une autre icône ouvre son appli. Souris, boutons, zoom de la carte et cibles du guide sont convertis
  (`entrerFenetreAppli` / `sortirFenetreAppli`, `sourisAppli` dans `os.js`).
- Dans la fenêtre, les textes font au moins 20 px (au lieu de 18) pour compenser la réduction.
- `background()` ne sert plus dans l'appli (p5 l'applique à tout le canevas, transformation ignorée).

## Robustesse
- Le smoke test vérifie désormais la **syntaxe** de chaque script de `index.html` (une virgule mal
  placée bloquait tout le jeu sans que `npm test` le voie) : 98 contrôles.

## Vérifications
- `npm run build`, `npm test` (98 + 128 contrôles).
- Chromium 1920×1080, sans erreur console : signalement « Affluence signalée » ; touches 5 et 6 →
  carte et info trafic révélées, compteur −8 s ; clic souris sur « Météo » → révélée ; clic sur l'icône
  Patron dans la barre des tâches depuis l'appli → appli Patron ouverte ; décision au clavier → narration.
