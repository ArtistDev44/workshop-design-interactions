# 54 — Mobile, sous-étape 60b : mise en page portrait (prompt 60)

Code : `portrait.js` ; activation dans `mobile.js`, routage des touchers dans `sketch.js` / `micro.js`,
styles dans `style.css`. Ordinateur et paysage inchangés ; règles Q1–Q61 intactes.

## Principe : recomposition
Le jeu entier est dessiné en coordonnées 1920 × 1080 (`L`, `H` constants dont dérivent tous les rectangles).
Plutôt que de réécrire chaque écran, le portrait **recompose** l'image : le canevas p5 continue de dessiner
en 1920 × 1080 (invisible), et un second canevas **1080 × 1920** affiché recopie, à chaque image (méthode
`post` de p5), des régions de cette image empilées. Les touchers sur le canevas portrait sont reconvertis
vers les coordonnées 1920 × 1080 avant d'appeler les gestionnaires du jeu : boutons, sources, actions,
cartes, objets fonctionnent sans code dupliqué.

## Mises en page
| Scène | Portrait |
|---|---|
| Appli Régulation | jauges **fixes** en haut ; **carte + lignes**, puis **dossier** (compteur, sources 5–8, 4 actions) dans une colonne qui **défile au doigt** (défilement automatique vers le dossier à son arrivée, vers la carte en attente, ascenseur discret) ; **barre des tâches** et **« Se lever »** fixes en bas |
| Bureau | la pièce en haut ; dessous, **tous les objets en grosses cibles** (≥ 96 px) : « S'installer au PC », livres, lampe, plante, café, téléphone, dossiers, fenêtre, horloge, sablier, webcam, micro (rapport quand il existe) ; swipe vers le haut = s'installer |
| Fenêtres (paramètres, aide, palmarès, inspection, mails…) | recadrées à leur largeur, centrées |
| Téléphone, tasse, conversations | recadrés sur l'objet en main |
| Rapport papier | recadré sur la feuille et son bouton de page |
| Menu principal | recadré sur sa colonne (titre entier) |
| Transitions, cinématiques | image entière |

- L'avis « Tournez votre téléphone » de la sous-étape 60a est retiré : le portrait est jouable.
- Appui long = info-bulle (le point touché sert de survol), tap = clic, à travers la recomposition.

## Vérifications
- `npm run build`, `npm test` (119 + 151 contrôles).
- Chromium, téléphone émulé 390 × 844 tactile, sans erreur console : menu → tap « Nouvelle partie » ;
  chapitre 1 ; bureau avec 13 cibles ; tap « Téléphone » → notifications ; tap « S'installer » → appli ;
  dossier → défilement automatique (721 / 721) ; tap sur la source « Carte » → révélée ; swipe → la colonne
  remonte ; tap sur une action → narration ; « Se lever » → bureau ; journal de bord saisi au clavier virtuel.
- Ordinateur 1920 × 1080 : aucune classe mobile, canevas 1920 px ; partie complète FR sans erreur ni clé
  manquante. Paysage mobile : inchangé (60a).
