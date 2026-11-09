# 09 — Paramètres

## Paramètres réglés (décisions verrouillées Q11–Q16, Q19)
- **Semaine à rejouer** : **liste de semaines proposées** à l'accueil (dans les
  limites de l'API), plus l'option « semaine de référence hors ligne ».
- **Mode en ligne / hors ligne** : forcer le fallback local.
- **Durée du compteur** : **30 s par défaut** ; difficulté = timer uniquement
  (facile 60 s / normal 30 s / difficile 15 s).
- **Son** : **ambiance de salle de contrôle + bips d'interface**, activé / coupé (`M`).
- **Accessibilité** : réduction des animations (`prefers-reduced-motion`),
  contraste renforcé, taille du texte.
- **Reset** : touche `R` pour recommencer la semaine.
- **Pause** : touche `P`, uniquement entre deux dossiers.

## Persistance
- Réglages et **meilleur bilan par semaine** conservés en `localStorage`
  (jamais de secret) pour comparer les parties (Q19).
