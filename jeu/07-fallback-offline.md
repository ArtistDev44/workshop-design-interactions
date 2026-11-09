# 07 — Fallback hors ligne

## Règle du livret
Le jeu doit rester **jouable sans réseau** : conserver un échantillon local des
données dans `data/fallback.json`.

## Contenu du fallback
- **6 cas figés** : incidents types (tram bloqué, bus en retard, alerte météo,
  conflit de deux lignes, donnée contradictoire, heure de pointe) avec leurs
  données complètes (ligne, retard, affluence, météo, textes de narration).
- **Une semaine de référence** rejouable hors ligne, construite à partir de ces
  6 cas complétés par des variations légères (seed fixe pour la reproductibilité).

## Comportement
- Si l'API est injoignable au lancement : bascule automatique sur le fallback,
  avec un indicateur discret « mode hors ligne ».
- Le joueur peut aussi choisir explicitement le mode hors ligne depuis l'accueil.
