# 26 — Direction « moderne et épurée » de la pièce (prompt 32)

Décisions verrouillées. La pièce passe au blanc : murs, plafond, menuiseries, plateau et porte sont blancs, et il ne reste presque plus de bois. L'écran du PC et le jeu qu'il affiche ne changent pas. Les décisions Q1–Q61 et la boucle de jeu non plus.

Note de numérotation : le prompt demandait `jeu/19-bureau-style-epure.md`, mais le n° 19 est déjà pris (vue 3D). Ce fichier prend donc le n° 26.

## Palette de la pièce (`bureau.js`)
| Élément | Avant | Après |
|---|---|---|
| Plafond, bandeau lumineux | `#d9dcdf`, `#f4f6f7` | `#eef0f1`, `#ffffff` |
| Menuiseries de la baie | aluminium sombre `#2a2f36` | laqué blanc `#eef0f1`, ombre `#b9bec4` |
| Allège sous la baie | `#e8e9ea` sur appui sombre | `#f6f7f8` sur appui `#d3d6d9` |
| Plateau du bureau | chêne `#d8b489` veiné | stratifié blanc cassé `#f1ede6`, reflets `#e6e0d6` |
| Bois restant | plateau entier | un chant de 2 px en chêne clair `#d8b489` (seul détail bois) |
| Porte (prompt 26) | grise `#5f6a78` | blanche `#f7f8f9`, chant `#c8cdd2` |
| Pile de dossiers | chemises jaunes | chemises blanc / bleu très pâle |
| Vignettage | brun `rgb(43,29,24)` | gris bleuté neutre `rgb(28,32,40)`, 20 % plus léger |

- Sont conservés : les arbres vus par la fenêtre, les livres (prompt 20), la plante, la tasse, le clavier et la souris noirs (contrepoint moderne), l'horloge et l'applique (prompt 31).
- Lampe (prompt 29) :
  - allumée : flux chaud sur le mur blanc ;
  - éteinte : voile bleu nuit léger sur toute la pièce (opacité 0,13), un peu plus marqué sur le pan de mur de l'applique. La pièce reste lisible.
- Le clignement d'œil (paupières sombres) et le fond assombri autour du cadre ne changent pas : ils restent cohérents avec une pièce plus lumineuse.

## Lisibilité des zones cliquables
- Sur fond blanc, le contour jaune seul n'était plus assez contrasté. `contourSurvol()` dessine désormais un trait sombre `#1c2733`, épais, doublé du jaune `#f2c94c`. Le trait sombre donne 15:1 sur `#f1ede6` / `#f6f7f8`, et le jaune reste visible sur les fonds sombres.
- Ce contour sert au survol et au focus de l'écran du PC, des livres, de la porte et des objets de la pièce.
- Les cibles de clic ne changent pas.

## Vérifications
- `npm run build` OK.
- Tests des prompts 25 et 29 relancés, sans erreur : caméra, animations réduites, objets en FR et EN, en ligne et hors ligne.
- Captures : lampe allumée avec survol d'un livre (contour double lisible), puis lampe éteinte.
