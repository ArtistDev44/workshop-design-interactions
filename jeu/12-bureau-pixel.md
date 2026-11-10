# 12 — Le bureau en pixel art (vue d'entrée)

Demande du groupe (10/11/2026) : un jeu plus complet, inspiré **indirectement** des jeux de
« bureau administratif » (contrôle de documents sous pression), sans en reprendre ni l'univers ni les visuels.

## Ce qui est en place
- **Entrée dans le jeu = un bureau en pixel art** (1 pixel du décor = 4 pixels à l'écran, rendu net
  sans lissage) : mur, fenêtre, horloge, plaque « RÉGULATION », tableau de liège, plante, bureau en bois,
  pile de dossiers et tampon encreur, lampe, tasse, téléphone.
- **Le PC est sur le bureau, légèrement à droite** ; son écran affiche **le jeu actuel en direct**, en
  miniature pixelisée (la salle de contrôle continue de vivre sur l'écran).
- **S'installer au poste** : clic sur l'écran, ou Entrée / Espace → la caméra zoome dans l'écran ; on joue
  en plein écran dans le cadre du moniteur.
- **Se lever** : Échap → retour au bureau. La partie continue (le compteur tourne : c'est un poste de régulation).
- Éléments réels dans le décor : le **ciel de la fenêtre** suit l'heure locale (jour / nuit) et la météo
  réelle du jour (Open-Meteo) ; l'**horloge** donne l'heure réelle.
- Animations réduites : le zoom devient instantané.

Code : `site/public/oeuvres/pxe-nte001-g01-w01/bureau.js` (aucun fichier image, tout est dessiné par le code).

## Style (mise à jour du 10/11/2026, image de référence du groupe)
- Pixel art riche : **contours sombres** (`#2b1d18`), ombrages en 3–4 tons (lumière en haut à gauche,
  ombre en bas à droite), **textures** (enduit du mur, veinage et lattes du bois, liège), **feuillages ronds
  en couches** (arbres dehors, grande plante), **ombres portées tramées**, lumière chaude de la fenêtre et
  léger vignettage.
- **Cadrage plus proche** : le plateau remplit le bas de l'image, le PC est plus grand (écran 576×324 à
  l'écran) et toujours légèrement à droite.
- Le décor est redessiné 8 fois par seconde (≈ 6 ms) pour rester fluide.

## Pistes pour la suite (à décider par le groupe)
- Rendre les objets du bureau interactifs : la pile de dossiers (= dossiers de la semaine), le tampon
  (valider une décision), le téléphone (appels de la direction selon le ton des jauges), le tableau de liège
  (règles du jour).
- Passer une partie de la décision « hors écran », sur papier, avec tampon : la dimension « bureau » du genre.

## Refonte du 10/11/2026 : la pièce entière et le PC qui démarre
- **Cadrage large** : on voit toute la pièce — porte d'entrée (panneau « SORTIE », oculus, poignée laiton, lumière du couloir, paillasson), portemanteau, tableau de liège avec plan schématique, plaque « RÉGULATION », horloge, fenêtre à rideaux (ciel et météo réels), lampadaire, grande plante, parquet en perspective, tapis, bureau en bois avec tiroirs, fauteuil vu de dos. L'écran du PC reste centré sur la page.
- **Au poste, pas de plein écran** : le zoom s'arrête sur le moniteur (1340×754 à l'écran) ; la pièce reste visible autour, légèrement floutée. Les clics sont ramenés dans les coordonnées de l'écran.
- **Le PC démarre** au premier passage (écran texte, logo, « Bienvenue », ~3,4 s) puis affiche le **bureau d'un système fictif (« RégulOS »)** : fond pixelisé ORIGINAL qui évoque les fonds d'écran bleus lumineux de la fin des années 2000 (aucun visuel ni logo de marque existant reproduit), icônes « Régulation Nantes » (pastille rouge quand un incident attend) et « Corbeille », barre des tâches avec horloge. Clic ou Entrée sur l'icône : l'appli de régulation s'ouvre ; la croix en haut à droite revient au bureau du système.
- Fichiers : `site/public/bureau.js` (pièce + composition), `site/public/os.js` (démarrage + bureau du système), `immersion.js` (livres et sieste repositionnés : le personnage somnole dans le fauteuil, vu de dos).
