# Prompt 74 — moins de répétition, un poste de régulation compréhensible

Sans toucher aux règles (Q1–Q61, `game.js` inchangé — vérifié par test) :

- **Première ouverture** de l'écran de jeu (une fois par partie, persisté par graine, FR + EN) : qui est
  le joueur (opérateur du centre de régulation de Nantes), ce que fait le poste, et les décisions
  1 Dévier / 2 Retenir / 3 Renfort / 0 Ne rien faire expliquées en langage métier — sans dire
  laquelle est « bonne » (`poste.explique`, `sketch.js`).
- **Textes de liaison variés** entre deux dossiers (`texteLiaison`, carte.js) : hachage graine + n° de
  dossier, reproductible ; annonce météo réelle du jour, événement d'agenda réel en cours, ou message
  radio d'une ligne réelle. Jamais de donnée inventée.
- **Feedback de série** (`serieDecisions` + `feedbackSerie`, sketch.js) : 2 « bon » d'affilée →
  félicitation du patron, 2 « raté » → encouragement + rappel de l'aide (H). Aucun effet sur les jauges.
- **Objectif du jour** rappelé en clair dans le panneau d'attente + **bilan de la veille** (1–2 lignes,
  chiffres réels du journal de la veille).
- L'ordre d'arrivée des dossiers **reste chronologique** (heures réelles) : le mélanger aurait modifié
  le paquet et les règles ; la variété passe par les contenus et le rythme, pas par les règles.

Rapport de ce qui a été joué/changé : `notes.md`, section « Prompt 74 ».
