# 49 — Interaction sonore au micro : voix, souffle, bruit (prompt 54)

Code : `micro.js`. Couche d'immersion seulement : `game.js` inchangé, jauges, compteur et décisions
jamais touchés (`test-jeu.mjs` vert). Le livret autorise le micro comme périphérique d'entrée.

## Push-to-talk
- **Touche M maintenue** (≥ 250 ms) ou **clic maintenu** sur le **micro du poste** (nouvel objet du
  bureau, entre la tasse et le clavier ; voyant rouge pendant l'appui). Un **appui bref sur M** coupe ou
  rétablit le son, comme avant (la touche servait déjà au son : les deux usages se distinguent à la durée).
- `getUserMedia({ audio })` n'est appelé qu'à ce geste ; le flux est arrêté au relâchement (le voyant du
  navigateur s'éteint). Le micro n'est jamais envoyé vers les haut-parleurs (pas de larsen) : on n'entend
  que la texture granulaire.
- Micro refusé ou absent : **repli** sans erreur — source interne synthétisée (voyelle douce + souffle,
  modulés lentement), message « Micro indisponible : texture sonore interne ».

## Analyse (toutes les 50 ms, hors `draw`)
- **Amplitude** : RMS ; **hauteur** : autocorrélation 80–1 000 Hz (retenue si la clarté dépasse 0,5) ;
  **souffle / bruit** : RMS continu sans hauteur ; **fragmentation** : rapport pic / RMS (chocs, bruits).

## Texture granulaire
- Les grains sont lus dans les 2 dernières secondes captées (anneau d'échantillons).
- amplitude → volume et **densité** (3 à 48 grains par seconde) ; hauteur → **hauteur de lecture** des
  grains (voix aiguë = grains plus aigus, ×0,5 à ×2) ; pics → **fragmentation** (grains de 160 à 30 ms) ;
  souffle → **turbulence** (gigue sur le départ et la hauteur des grains).
- Voix, souffle et bruit produisent naturellement trois textures, sans mode à choisir.

## Affichage et réglages
- Pendant l'appui, un panneau en haut à gauche montre un oscilloscope et cinq barres (amplitude,
  hauteur, densité, fragments, turbulence) ; animations réduites : barres seules, sans oscilloscope.
- Paramètres → Accessibilité → **Micro (M maintenue)**, touche 4 (activé par défaut, mémorisé).
- Son toujours sous l'interrupteur Son ; ouverture et fermeture annoncées en `aria-live`. FR + EN.

## Vérifications
- `npm run build`, `npm test` (110 + 137 contrôles).
- Chromium avec un faux micro (`--use-fake-device-for-media-stream`) puis sans autorisation : appui bref M
  → son coupé / rétabli ; M maintenue 1,8 s → micro ouvert (mesures non nulles), relâché → fermé et flux
  arrêté ; repli interne quand l'autorisation manque ; clic maintenu sur le micro du poste ; réglage
  désactivé → M maintenue n'ouvre rien. Aucune erreur console.
- Non vérifiable en automatique : l'écoute réelle de la voix, du souffle et du bruit (à tester par le groupe
  avec un vrai micro).
