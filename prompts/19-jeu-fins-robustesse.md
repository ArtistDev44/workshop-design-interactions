# Prompt 19 — Jeu « Nantes en régulation » : fins et robustesse (étape 6/6)

Lire d'abord le prompt 14. Le jeu est fonctionnel (prompts 15–18) : ajouter
l'écran de fin et valider la robustesse.

## Instructions
1. Écran de fin : **3 fins** (bonne ≥ 240, moyenne ≥ 150, mauvaise < 150 sur le
   score combiné, Q47/Q48) — bonne : la direction félicite, décor clair
   (Q49, Q53) ; moyenne : bilan neutre nuancé (Q50) ; mauvaise : la direction
   réprimande, décor sombre (Q51). Le texte de fin intègre le **bilan détaillé
   complet** (Q54) : jauges, dossiers traités / 15 et décisions clés (Q18, Q37) ;
   faits réels de la semaine uniquement dans le bilan chiffré (Q52). Le score
   combiné des 3 jauges détermine la fin (Q43). Boutons Rejouer / changer de
   semaine.
2. Respecter `prefers-reduced-motion`, contraste suffisant, aucun effet
   stroboscopique, `pixelDensity(1)`, `randomSeed` fixé pour la reproductibilité.

## Vérifications finales (héritées du prompt 14)
- Le jeu se lance et reste jouable sans réseau (fallback testé).
- Testé en plein écran 1920×1080, aucune erreur continue dans la console.
- Aucune clé privée, token ou secret dans le code.
- Le mapping API → incident → action → jauges tient en une phrase (voir
  `jeu/02-donnees-api.md`).
