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

## Pistes pour la suite (à décider par le groupe)
- Rendre les objets du bureau interactifs : la pile de dossiers (= dossiers de la semaine), le tampon
  (valider une décision), le téléphone (appels de la direction selon le ton des jauges), le tableau de liège
  (règles du jour).
- Passer une partie de la décision « hors écran », sur papier, avec tampon : la dimension « bureau » du genre.
