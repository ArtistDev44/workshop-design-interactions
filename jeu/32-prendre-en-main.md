# 32 — Mode « Prendre en main » (prompt 37)

À la première partie, une option propose un **guide fléché** : une flèche et une bulle montrent, une étape à la fois, ce qu'il est possible de faire. Le guide ne fait jamais l'action à la place du joueur. Les décisions Q1–Q61 ne changent pas.

## L'option (`guide.js`, écran « Nouvelle partie »)
- Case **« Prendre en main (guidé) — touche G »**, à cocher au clic ou avec la touche G.
- Elle est **cochée par défaut** si le joueur n'a jamais joué : aucune sauvegarde, aucun meilleur bilan, guide jamais terminé. Le choix est mémorisé dans `localStorage` (`pxe-nte001-prise-en-main`).
- Le guide démarre si la case est cochée et que la partie est nouvelle (dossier 1, historique vide). Une reprise ne le relance pas.
- Si le guide est actif, le tutoriel automatique du livre (prompt 34) n'est pas imposé. Il reste disponible dans le livre « Commande » et dans l'aide.

## Les 6 étapes
| # | Où | Flèche vers | Validée quand |
|---|---|---|---|
| 1 | Bureau | L'écran du PC | Le joueur est au poste |
| 2 | Poste, attente d'incident | Les trois jauges | Un dossier arrive |
| 3 | Dossier | Les actions 1 / 2 / 3 / 0 (le texte rappelle le compteur) | Première décision |
| 4 | Poste | La croix de l'appli, puis les applis RégulOS | Une appli ou les Indicateurs sont ouverts |
| 5 | Poste | « Quitter le PC » | Retour au bureau |
| 6 | Bureau | Le livre « Commande » (et les objets) | Livre, tutoriel ou objet de la pièce ouvert |

- Si le joueur n'est pas là où l'étape l'attend, la flèche le ramène : vers l'écran du PC ou vers l'icône « Régulation ».
- Une étape se valide dès que le joueur a fait l'action, même sous une fenêtre ouverte.
- **Prompt 181 — guide contraignant.** Tant qu'une étape attend le joueur, seule sa cible (la zone éclairée par le voile percé) et les boutons de la bulle répondent : clic, toucher, molette, glisser et touches hors cible sont ignorés, la bulle se signale 0,6 s et la consigne est relue (`guideBloque`, `toucheGuide`, `rappelerConsigneGuide` dans `guide.js`).
- Sortie : bouton « Quitter le guide (Échap) », toujours présent ; Échap (ou G) deux fois en 5 s. Quitter rend toutes les interactions.
- Clavier : Tab / Maj+Tab tournent entre la cible et les boutons de la bulle ; Entrée ou Espace actionne la cible focalisée ; seules passent les touches de l'étape (↑ ↓ Entrée pour le signalement, 1 à 3 pour les répliques, Z, H), plus L et F.
- « Étape suivante » n'existe plus que pour les deux étapes de lecture (jauges, somnolence).
- Le temps de jeu est suspendu pendant le guide (`guideSuspendTemps`, lu par `tempsSuspendu()`), sauf en attendant le premier signalement.
- Aucune impasse : chaque étape a une `issue` — cible introuvable 2 s → le guide ramène la vue (s'asseoir, rouvrir l'appli, se lever) ; introuvable 8 s → étape déclarée faite. Fenêtres, SMS, sieste, réveil et soir se traitent normalement, puis le guide reprend. En portrait, le guide reste indicatif (pas de blocage).
- À la fin, le message « Vous avez pris en main la salle de régulation ! » s'affiche 4 s. Le guide ne revient pas, sauf si la case est recochée.
- Chaque étape est annoncée en `aria-live`.

## Cibles réelles
- `cibleGuide(nom, x, y, l, h)` est appelé là où chaque élément est dessiné :
  - écran du PC et « Quitter le PC » (`bureau.js`) ;
  - jauges et boutons d'action (`sketch.js`) ;
  - croix de l'appli, icône Régulation et grille des applis (`os.js`) ;
  - livre « Commande » (`immersion.js`).
- L'espace de dessin (`espaceDessin`, « pc » ou « ecran ») est noté au même moment. À l'affichage, une cible de l'écran du PC est convertie via `ECRAN_POSTE`. Les flèches suivent donc la caméra (prompt 25) et le zoom au poste.

## Rendu et accessibilité
- Flèche épaisse jaune `#f2c94c` à contour `#1c2733`, contour double autour de la cible.
- Bulle bleu nuit, texte blanc (contraste > 12:1), liseré jaune.
- Rebond de 10 px, supprimé si les animations sont réduites.
- Aucune pause : le temps continue de passer comme d'habitude.

## Vérifications
- `npm run build` et `npm test` OK.
- Test automatisé sur un profil neuf, sans erreur console : option cochée par défaut, puis les étapes 1 à 6 validées par les vraies actions (clic sur l'écran, arrivée d'un dossier, touche 1, fermeture de l'appli, I, se lever, livre), fin du guide et option mémorisée « non ».
- Tests des prompts 33 et 35 relancés, sans régression.
