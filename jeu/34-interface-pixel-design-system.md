# 34 — Interface au Pixel Design System (prompt 39)

Toute l'interface reprend les jetons de `design-system/pixel-design-system.md` (Pixel Design System, Figma Community), comme le bureau RégulOS depuis le prompt 22. Le décor pixel art de la pièce et les objets diégétiques (livres ouverts, téléphone) gardent leur rendu. Les décisions Q1–Q61 ne changent pas.

## Jetons appliqués
| Jeton (DS) | Valeur | Où |
|---|---|---|
| Background | `#0D0C0C` | Fond de l'appli de régulation, menus, fenêtres, voiles, chargement, boîte d'import, toasts |
| Container (fond + blanc 05) | `#171616` | `panneau()` |
| Border | blanc 15 % | Bordures des containers |
| Primary / Primary-Foreground | `#D4031C` / blanc | Boutons principaux, compteur, case cochée, liseré de sélection, logo du chargement |
| Secondary | blanc / `#0D0C0C` | Carte de menu sélectionnée (fond blanc, texte noir) |
| Text on Background — titre / paragraphe | blanc / blanc 60 % (85 % en contraste renforcé) | `C.texte`, `C.gris` |
| Success / Warning Primary | `#00B74F` / `#FFC138` | Jauges, évaluations, flèches du guide (Warning) |
| Error Primary / Light | `#D10B00` / `#FFC5C2` | Barres critiques (Primary) ; textes d'alerte en teinte claire (Light) : pas de texte rouge sur fond sombre (contraste) |
| Disabled | fond blanc 15 %, texte blanc 50 % | Boutons désactivés |
| General Roundness | `radius-0` | Plus aucun angle arrondi : panneaux, boutons, cartes de menu, bulles, case à cocher, dialogue, toasts |
| Fonts/Paragraph | JetBrains Mono (repli : monospace installé) | `POLICE_TEXTE` = `POLICE_DONNEES` |
| Fonts/Titles | Bitsy Pixels (repli : titres pixelisés de `dsTitre`) | Titre du menu principal, « Nouvelle partie », menu Échap |

- `ds.js` est corrigé sur deux valeurs, pour reprendre exactement le document : succès `#00B74F` (au lieu de `#00FB74`) et erreur `#D10B00` (au lieu de `#D1000B`).

## Composants
- `bouton()` :
  - variante primaire : fond rouge, texte blanc ;
  - variante contour : bordure blanche, fond blanc 05 %, blanc 15 % au survol ;
  - variante désactivée ;
  - survol et focus en **double bordure**, comme le document ;
  - le libellé rapetisse s'il le faut pour tenir dans le bouton.
- `panneau()` : container sans ombre ni arrondi, bordure blanc 15 %, ou bordure accentuée pour les fenêtres.
- Menu principal, « Nouvelle partie », menu Échap : cartes à angles droits. La carte sélectionnée a un fond blanc, un texte `#0D0C0C` et un liseré rouge de 8 px. Voile `#0D0C0C`.
- Guide « Prendre en main » : bulle `#0D0C0C` avec bordure blanc 15 % et liseré Warning, flèche Warning `#FFC138` à contour `#0D0C0C`.
- Écran de chargement, boîte d'import et toasts (`index.html`, `style.css`) : fond `#0D0C0C`, bordure blanc 15 %, boutons rouges, polices du DS, arrondi 0.

## Lisibilité
- La police monospace est environ 20 % plus large que l'ancienne Inter.
- `ajusterTaille(txt, largeur, max)` réduit la taille d'un texte sur une ligne jusqu'à ce qu'il tienne. Elle sert pour l'en-tête du jeu, les libellés des Paramètres, les lignes de l'aide, le texte de confirmation du reset et les titres des cartes de menu et de semaine.
- Les textes en boîte (conseil, objectif, texte de fin, profil, sources) ont reçu une taille et un interligne adaptés. Les boutons de l'écran de fin sont abaissés sous le profil.
- Contrastes :
  - blanc sur `#0D0C0C` : 19:1 ;
  - blanc 60 % : ≈ 7:1 ;
  - blanc sur `#D4031C` : 5,5:1 ;
  - rouge sur blanc (détail de la carte sélectionnée) : 5,5:1 ;
  - `#FFC5C2`, `#FFC138` et `#00B74F` sur fond sombre : > 7:1.

## Vérifications
- `npm run build` et `npm test` OK.
- Captures en FR et EN de : menu, nouvelle partie, paramètres, aide, jeu en attente, dossier, narration, menu Échap, reset, mail, fin et chargement. Plus aucun débordement de texte après les ajustements.
- Tests des prompts 28, 29, 33, 35, 36, 37 et 38 relancés, sans erreur ni régression.
