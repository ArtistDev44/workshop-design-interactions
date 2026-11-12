# Prompt 172 — Jeu : aide et tutoriel illustrés, ouverts à la place du livre en jeu

Demande d'origine (prise de notes du 12/11/2026) :

> Rajouter des illustrations dans le menu aide & tutoriel. Intégrer ce menu à la place du menu du livre dans le jeu.

Suite du prompt 171 (l'aide n'est plus dans le menu principal).

## À faire

1. **Illustrations** dans la fenêtre d'aide (`aide.js`, `fenetreAide`, onglets `demarrer`, `regles`, `malus` ;
   l'onglet `raccourcis` est traité au prompt 174) : une illustration par carte de règle, dessinée **avec les
   composants réels du jeu** en réduction (jauge, marqueur de carte, répliques, téléphone, tasse, somnolence) ou en
   pixel art du DS — aucune image externe, aucune capture inventée. Chaque illustration a un équivalent texte dans
   l'annonce de l'onglet.
2. **Le livre d'aide posé sur le bureau ouvre cette fenêtre d'aide** : remplacer le contenu de la fenêtre du livre
   (`immersion.js`, `fenetreLivreStress` ~l.743, `dessinerLivreOuvert` ~l.929, `fenetre === 'livre-stress'`) par
   `fenetreAide()`. Supprimer le rendu de l'ancien livre et ses textes i18n devenus inutiles.
3. Le tutoriel se lance toujours depuis l'aide (touche T). L'étape `livre` du guide (`guide.js` ~l.68) et le
   raccourci H en jeu pointent vers la même fenêtre.
4. Pendant la lecture de l'aide en partie, le temps est suspendu comme pour l'ancien livre.

## Vérifications

- En partie : clic sur le livre → fenêtre d'aide illustrée à onglets ; Échap la ferme ; le temps reprend.
- Plus aucune référence à l'ancien livre (`grep "livre-stress"`), hors objet du décor.
- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN).
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
