# 47 — Le café qui fait monter l'adrénaline (prompt 52)

Code : `cafe.js` ; animation « en main » de `telephone-main.js` réutilisée (paramètre `objet` : même main,
sans coque de téléphone).

## Boire le café
- La tasse du bureau est maintenant une **tasse de café** (elle était de thé) ; une fois bue, elle est
  vide jusqu'au lendemain (« La tasse est vide : un seul café par journée »).
- Clic (ou Tab puis Entrée) : la tasse monte du bas de l'écran, tenue par la main, comme le téléphone ;
  elle s'incline et se rapproche (on boit), la vapeur s'arrête, puis elle redescend. Le temps du jeu est
  suspendu pendant la gorgée.

## Boost (25 s)
- **Cœur** : battements « lub-dub » synthétisés (Web Audio, sous l'interrupteur Son, gain maître du
  prompt 49), de 66 à 140 par minute au sommet (montée en 5 s, longue descente), plus forts au sommet.
- **Pulsation rouge** sur les bords de l'écran, synchronisée au cœur ; jamais au centre, jamais plein écran.
- **Accélération** : lignes de vitesse qui filent sur les bords, léger flou de mouvement (copie de l'image
  très transparente et un peu agrandie), **champ de vision élargi** : le surcadrage de la pièce passe de
  1,05 à 1,025 (on voit plus de la pièce) puis revient.
- **Effet de jeu** (modeste, hors règles Q1–Q61) : pendant le boost, consulter une source (prompt 50)
  ne coûte pas de temps de compteur.

## Accessibilité
- Au plus 140 pulsations par minute (moins de 3 par seconde), amplitude faible, pas de flash.
- Animations réduites (système ou Paramètres) : pas de lignes, de flou ni de champ élargi, ni
  d'inclinaison de la tasse ; un liseré rouge fixe sur le bord de l'écran et les battements seulement.

## Vérifications
- `npm run build`, `npm test` (104 + 135 contrôles).
- Chromium, sans erreur console : clic sur la tasse → tasse en main → boost (intensité 0,87, 131 bpm,
  surcadrage 1,028) ; seconde tasse → « vide » ; en animations réduites : liseré seul, surcadrage 1,05.
