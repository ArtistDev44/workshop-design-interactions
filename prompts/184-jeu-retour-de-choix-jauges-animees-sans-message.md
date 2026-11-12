# Prompt 184 — Jeu : après un choix, plus de message « journal » — les jauges s'animent en vert ou en rouge

Demande d'origine (prise de notes du 12/11/2026) :

> Après chaque choix, ne pas afficher de message « journal » avec le contenu des ajouts et suppressions et modifier
> les variables de barres avec une animation et une couleur rouge ou verte sur la partie ajoutée ou sectionnée.

Recoupe le prompt 164 (§ 8, fusion du retour de décision) et les prompts 143–145 (jauges du bandeau) : exécuter
après eux et ne pas réintroduire de pourcentage.

## À faire

1. **Supprimer le message de retour qui liste les gains et pertes** après chaque décision (panneau / toast
   « journal » avec « +4 fluidité, −6 budget… », `panneau.js`, `sketch.js`). Le détail reste consultable dans
   l'appli Journal ; rien n'est perdu, seulement plus affiché d'office.
2. **Le retour passe par les jauges** (bandeau et fenêtre Indicateurs) :
   - **gain** : le segment ajouté apparaît en **vert**, puis rejoint la couleur de la barre ;
   - **perte** : le segment retiré reste visible en **rouge**, puis se résorbe ;
   - durée ≈ 600–900 ms, courbe douce, sans flash ni clignotement ; jauges inchangées : aucune animation.
3. **Ne pas dépendre de la couleur seule** : un signe ▲ / ▼ (ou + / −) accompagne le segment le temps de
   l'animation, et les couleurs suivent les palettes daltonisme (`accessibilite.js`).
4. `prefers-reduced-motion` / « Réduire les animations » : pas de mouvement, le segment coloré s'affiche puis
   disparaît en fondu court.
5. **Lecteur d'écran** : l'annonce des écarts (`#annonces`) est conservée, une seule phrase (« fluidité en hausse,
   budget en baisse »).
6. L'intensité de l'effet suit le réglage « intensité du signal » (prompt 175).

## Vérifications

- Décision avec gain et perte : aucun message listant les écarts ; segments vert et rouge visibles sur les bonnes
  jauges, valeurs finales exactes.
- Simulation daltonisme et animations réduites : l'information reste lisible.
- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN).
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
