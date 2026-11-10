# Prompt 52 — Jeu « Nantes en régulation », étape 38 : le café qui fait monter l'adrénaline

Demande d'origine (10/11/2026) :

> Quand le personnage boit le café, déclenche un effet de "boost" temporaire : le cœur du perso
> s'accélère (battements audio de plus en plus rapides + pulsation lumineuse rouge autour de l'écran
> ou sur le personnage), accompagné d'effets visuels d'accélération (lignes de vitesse, léger flou de
> mouvement, widening du FOV). Reprendre la même animation que celle du téléphone pour la tasse, mais
> couplée à ces effets pour montrer que le café fait monter l'adrénaline.

## Attendu
1. **Tasse en main** : clic sur la tasse → elle monte du bas de l'écran, tenue par la main, comme le
   téléphone (`telephone-main.js`, animation réutilisable généralisée à un objet quelconque), on boit
   (inclinaison, vapeur), puis elle redescend.
2. **Boost temporaire** (≈ 20–30 s de jeu réel) :
   - **cœur** : battements synthétisés (Web Audio, deux coups « lub-dub »), de plus en plus rapides puis
     qui ralentissent ; discrets, sous l'interrupteur Son ;
   - **pulsation rouge** douce sur les bords de l'écran (vignette), synchronisée au cœur ;
   - **accélération** : lignes de vitesse sur les bords, léger flou de mouvement, champ de vision
     élargi (léger dézoom de la pièce) qui revient progressivement.
3. **Accessibilité** : jamais plus de 3 pulsations par seconde, amplitude faible (pas de flash, pas de
   plein écran rouge) ; avec `prefers-reduced-motion` ou « Réduire les animations » : ni lignes, ni flou,
   ni dézoom, seulement un liseré rouge fixe et les battements. Textes toujours lisibles.
4. **Effet de jeu** (à garder modeste et documenté) : à décider — proposition : le temps de la tasse
   n'est pas compté et, pendant le boost, la prochaine consultation de source (prompt 50) ne coûte pas
   de temps. Rien ne touche les règles Q1–Q61.
5. Une tasse par journée de jeu (sinon « La tasse est vide »).

## Vérifications
- `npm run build`, `npm test` ; essai réel (clic et clavier), animations réduites ; aucune erreur
  console. Documenter dans `jeu/47-…`. Fusion `main` sur demande.
