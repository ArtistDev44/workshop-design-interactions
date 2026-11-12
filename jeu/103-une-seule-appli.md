# Prompt 103 — une seule appli sur le PC, menu à gauche, sans information répétée

Date : 12/11/2026. Branche `jeu/103-une-seule-appli` (partie de la branche du prompt 102).

## Ce qui a été fait

- **Menu à gauche de l'appli principale** (`site/public/menu-app.js`, nouveau), colonne x 40 → 168 :
  - logo / **Carte** (accueil) ;
  - **Patron** (en premier, comme demandé) ;
  - Community ;
  - Journal ;
  - Données.
- **Présentation d'une entrée :**
  - pictogramme et libellé court ;
  - entrée active : fond `blanc15` et barre rouge de 4 px, seul rouge du menu ;
  - badges seulement pour ce qui est à faire (`badgeIcone`), jamais sur l'entrée active ;
  - entrées verrouillées (prompt 91) : estompées, cadenas, secousse et annonce existantes.
- **Vues intégrées.** `PC.fenetre` garde sa valeur (`patron`, `community`, `journal`, `donnees`) et le
  clavier des applis est inchangé. Seul le dessin change :
  - la vue est dessinée dans la fenêtre de l'appli, sous le bandeau, à droite du menu ;
  - largeur de lecture de 1440 px au plus ;
  - sans cadre, sans croix, sans grand titre.
- **Données :** `dessinerAppliDonnees(z)` dessine les mêmes 4 blocs dans la zone, sans bandeau rouge ni croix.
  Hors partie, l'ancien plein écran reste.
- **Bureau RégulOS en partie :** une seule icône, l'appli principale. La barre des tâches ne montre que
  l'appli principale.
  - Indicateurs et Corbeille sont retirés de `ICONES_OS` : les jauges sont dans le bandeau, la Corbeille
    était décorative.
  - Hors partie, rien ne change.

### Navigation

- **Échap** dans une vue revient à la carte (`fermerFenetreApp`), après la pile de navigation du prompt 91.
- **Tab** parcourt le menu (focus en double bordure), **Entrée** ouvre l'entrée focalisée, avant les
  raccourcis de la vue (`MENU_FOCUS`).
- **Liens croisés** (« Voir le dossier », « Publier », notifications) : ils restent fondés sur l'état, donc
  ils mènent aux vues intégrées.
- **Mobile portrait :** scène `vueApp` (bandeau, contenu défilant, menu en barre d'onglets en bas,
  `MENU_BAS`). La carte remplace la liste dans `regionsAppli`.

## Doublons retirés (chaque information à un seul endroit)

| Information | Avant | Maintenant |
|---|---|---|
| Jauges | bandeau + barre des tâches + appli Indicateurs | bandeau (la barre des tâches ne les montre que sur le bureau) |
| Heure du jeu | bandeau + barre des tâches | bandeau (barre des tâches : sur le bureau seulement) |
| Nom de l'appli | titre de fenêtre + icône | menu |
| Consigne du jour (Patron) | épinglée en haut + même carte dans la liste | épinglée seulement (marquée lue) |
| Effectifs des équipes | plateau (102) + message du patron chaque matin | plateau ; `Jeu.annoncerEffectifs` se tait quand le plateau est là (`Jeu.plateauEquipesVisible`) |
| Poignée @regul.nte | — (le titre de fenêtre a disparu) | une fois, sous le nom du compte |

## Vérifié dans le navigateur (pane 1024 × 768)

- Carte avec menu, puis Patron, Community, Journal et Données en vues intégrées.
- Échap revient à la carte.
- Au clavier : Tab va de Patron à Community dans le menu, puis Entrée ouvre Community.
- `npm run build` vert ; `npm test` : 471 + 545 contrôles réussis.

## Reste à vérifier

- Mobile portrait 412 px, sur un vrai téléphone : [À COMPLÉTER].
- Mesure `?audit=densite` avant / après sur les 5 vues : l'outil mesure encore des fenêtres. Il faut
  adapter ses étapes aux vues intégrées : [À COMPLÉTER].
