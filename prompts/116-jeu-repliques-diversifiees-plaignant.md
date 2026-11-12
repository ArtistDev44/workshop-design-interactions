# Prompt 116 — Jeu « Nantes en régulation » : diversifier les réponses à donner au plaignant

Demande d'origine (12/11/2026) :

> Je souhaite pouvoir diversifier les réponses possibles à donner au plaignant nantais.

## Constat

Depuis le prompt 107, chaque réponse d'une catégorie (retard, travaux, affluence, météo, accident) n'a
qu'**une** réplique figée. Le même retard donne donc toujours les quatre mêmes phrases, mot pour mot, et le
plaignant n'est jamais nommé.

## Ce qui change

1. **Trois variantes par réponse**, en FR et en EN :
   - clés `repl.<catégorie>.<réponse>.1`, `.2` et `.3` dans `i18n.js` ;
   - même intention, trois tons : factuel, rassurant, bref ;
   - 20 réponses de catégorie + 4 réponses de repli (dévier, retenir, renfort, rien), soit 72 phrases par
     langue.
2. **Des répliques qui parlent du cas réel.** Elles utilisent les variables du dossier, déjà calculées pour
   les plaintes (`variablesDossier`) :
   - `{ligne}`, `{retard}` (minutes), `{nature}` ;
   - le pseudo du plaignant `{auteur}`.

   Une variante dont une variable manque pour ce dossier n'est jamais tirée : aucun « {ligne} » ne reste à
   l'écran, et rien n'est inventé.
3. **Tirage déterministe** : la variante dépend du numéro du dossier et de la réponse, pas d'un dé. Elle
   ne change pas pendant qu'on lit, elle est la même à la reprise d'une sauvegarde, et elle n'influence pas
   les tirages du jeu.
4. **Une réplique de plus, « Dites-m'en plus »**, toujours en dernière position. Ce n'est pas une
   décision : elle ouvre « En savoir plus », c'est-à-dire les sources de l'enquête (comme E). Le plaignant
   précise, le joueur lit les sources, puis il répond.
   - Le bouton « En savoir plus » séparé disparaît, puisqu'il ferait doublon.
   - Le joueur peut répondre à n'importe quel moment avec 1–4, et E reste disponible.

## Ce qui ne change pas

- **Les effets.** Chaque variante déclenche la même réponse qu'avant (`decider(cle)`) : base + 1 dé,
  situations ×1,25. Aucune règle de `game.js` ne change.
- **Le nombre de décisions** : 3 à 4 réponses par catégorie, choisies au clic ou avec 1–4.

## Vérifications

- Toutes les variantes existent en FR et en EN, et aucune n'affiche de variable non remplie. Le test
  `npm test` le vérifie sur tous les dossiers des trois semaines.
- Dans le navigateur : deux dossiers de même catégorie montrent des phrases différentes.
- `npm run build` et `npm test` sont verts ; l'audit des textes reste à 0 défaut sur la fenêtre du
  plaignant, en FR et en EN.
- Livrables :
  - `prompts/README.md` ;
  - une ligne en tête de `journal.md`.
