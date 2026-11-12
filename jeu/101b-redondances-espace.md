# Prompt 101 b — redondances retirées et espace vide (correction après exécution du 101)

Date : 12/11/2026. Branche `jeu/101b-redondances-espace`.

Constat après le prompt 101 : peu de changement visible, informations répétées, pas d'air. Le rapport du 101
(`jeu/95-desencombrement-applis-pc.md`) donnait −4 à −20 % sur le bureau, Patron et Community et aucune mesure
des marges.

## Ce qui a changé

| Où | Avant | Après |
|---|---|---|
| Toutes les fenêtres | marge intérieure 24 px ; bouton « Fermer (Échap) » en bas qui doublait la croix | marge 48 px (96 px sous le titre) ; la croix seule, Échap ferme toujours |
| Patron · en-tête | « Direction de la régulation » + « Direction de la salle de régulation » | le nom seul, statut en dessous |
| Patron · messages | même reproche répété le même jour ; « Dossier lié : action » + rappel qui répétaient le texte ; libellé de type en rouge ; double cadre ; ligne vide sous le texte | une carte « REPROCHE ×N » ; un lien « (Ligne ·) Voir le dossier › » ; libellé en blanc, le rouge reste sur la barre de type ; fond seul ; hauteur exacte (`couperLignes`) ; 16 px entre messages |
| Community · en-tête | @regul.nte dans le titre ET sous le nom | dans le titre seulement |
| Community · posts | avatar + « Régul' Nantes · salle de contrôle · heure » sur chaque post (toujours le même compte) ; « Merci de votre patience. » à chaque post ; cadre | l'heure seule ; phrase retirée de `post.action` (FR, EN) ; fond seul ; 28 px entre posts |
| Journal · commandes | jours + Jour/Semaine, puis résumé + Détails, puis « Afficher : Tout », puis frise ; « Copier le résumé (C) » en pied | jours + Jour/Semaine, puis UNE rangée [Afficher] résumé [Détails] ; « Copier » apparaît avec les Détails (touche C partout) |
| Journal · résumé | valeurs des jauges (déjà dans la barre des tâches) + écarts | écarts du jour seulement |
| Journal · note | « JOURNAL DE BORD (une note pour la semaine) » (répète le titre) | « NOTE DE LA SEMAINE » |
| Libellés | « (S) », « (V) », « (C) » dans les boutons | retirés des boutons ; les raccourcis fonctionnent toujours |

Rien de la logique de jeu (`game.js`) n'a changé. Les raccourcis clavier sont inchangés.

## Mesures (`?audit=densite&parcours=1`, pane 1024×768, FR)

Le compte d'« éléments visibles » baisse peu (Patron milieu de semaine 36 → 37, Journal jour 75 → 71) : les cartes
étant plus courtes, **davantage de messages tiennent à l'écran**. Ce chiffre mesure ce qui est dessiné, pas ce
qui est répété ; il ne suffit pas à juger l'encombrement. Mesures complètes : `jeu/101b-densite-apres.json`.

## Vérifications

- `npm run build` vert ; `npm test` : 460 + 541 contrôles réussis.
- Audit des textes (`?audit=textes`, pane 1024×768) : 0 défaut dans Patron, Community, Journal. 8 défauts
  ailleurs (ligne de sauvegarde du menu titre, une notification en anglais), liés à la petite taille du pane et à
  une sauvegarde locale ; non vérifiés sur `main` en 1920×1080 : [À COMPLÉTER].
- Test humain à l'œil sur grand écran : [À COMPLÉTER].
