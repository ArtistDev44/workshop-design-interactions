# Prompt 18 — Jeu « Nantes en régulation » : contrôles et confort (étape 5/6)

Lire d'abord le prompt 14. La boucle de jeu fonctionne (prompt 17) : rendre le
jeu confortable et complet côté contrôles.

## Instructions
1. Raccourcis clavier complets (`1`/`2`/`3` actions, `0`/`Espace` ne rien faire,
   `Entrée` valider, `R` reset **avec confirmation** (Q38), `P` pause uniquement
   entre deux dossiers (Q13), `M` son ambiance + bips (Q11), `H` aide = raccourcis
   + règles (Q12, Q20)) — jouable sans souris, touch basique (Q32).
2. Le **meilleur bilan par semaine** est mémorisé en `localStorage` pour comparer
   les parties (Q19).

## Vérifications
- Partie jouable entièrement au clavier ; le touch basique fonctionne.
- `R` demande une confirmation ; `P` ne met en pause qu'entre deux dossiers.
- Le meilleur bilan persiste après rechargement de la page (`localStorage`).
- Aucune erreur console ; jeu toujours jouable sans réseau.
