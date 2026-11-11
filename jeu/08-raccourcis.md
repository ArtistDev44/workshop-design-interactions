# 08 — Raccourcis clavier / touch

## Raccourcis prévus
| Touche / geste | Action |
|---|---|
| `1` / `2` / `3` | Choisir l'action 1, 2 ou 3 du dossier courant |
| `0` ou `Espace` | « Ne rien faire » |
| `Entrée` | Valider / avancer (écran d'accueil, narration, fin) |
| `P` | Pause — **uniquement entre deux dossiers** (jamais pendant un compteur actif) |
| `R` | Reset de la partie en cours — **avec confirmation** « recommencer la semaine ? » (Q38) |
| `M` | Couper / réactiver le son |
| `H` ou `?` | Écran d'aide : **raccourcis + règles du jeu** (seuil 10 min, 3 actions + « ne rien faire », jauges) |
| Clic / touch | Sélectionner une action, une ligne sur la carte, un bouton |
| `Q` (prompt 94) | **Quitter la journée** : avance l'étape de sortie en cours — fin de service → mail du soir ; mail → ranger le poste ; soir → sortie du bureau ; avant l'heure → fenêtre « partir quand même » (Entrée confirme). Aussi bouton « Quitter la journée (Q) » dans le bandeau |
| Glisser-déposer (prompt 94) | Saisir une carte de réponse à la souris et la **déposer sur le dossier** (zone en pointillés « Déposer ici ») décide ; relâchée ailleurs, elle revient à sa place sans choix. Un simple clic décide toujours ; au doigt, le tap décide ; `1`-`4` inchangés |

## Règles
- Prompt 94 : `Q` n'était utilisé par aucun autre raccourci (vérifié par recherche dans `site/public/`). Après « ranger le poste », la sortie du bureau se fait seule 8 s après la nuit tombée (la flèche « Sortie » reste cliquable).
- Alternative clavier complète : le jeu est jouable **sans souris** ; le tactile
  couvre les boutons principaux (clavier/souris + touch basique, Q32).
- Respecter `prefers-reduced-motion` pour les animations d'interface.
