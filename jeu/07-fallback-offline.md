# 07 — Fallback hors ligne

## Règle du livret
Le jeu doit rester **jouable sans réseau** : conserver un échantillon local des
données dans `data/fallback.json`.

## Contenu du fallback (Q26)
- **6 cas figés** : 6 incidents capturés lors d'une **vraie semaine de réseau
  enregistrée**, avec leurs données complètes (ligne, retard, météo, textes de
  narration).
- **Une semaine de référence** rejouable hors ligne ; en rejouant la même
  semaine, on retrouve **exactement les mêmes incidents** — seed fixe, partie
  déterministe et reproductible (Q35).

## Comportement
- Si l'API est injoignable au lancement : bascule automatique sur le fallback,
  avec un indicateur discret « mode hors ligne ».
- Le joueur peut aussi choisir explicitement le mode hors ligne depuis l'accueil.
