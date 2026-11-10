# Prompt 54 — Jeu « Nantes en régulation », étape 40 : interaction sonore au micro (voix, souffle, bruit)

Demande d'origine (10/11/2026) :

> Intégrer une interaction sonore : le micro pilote amplitude, fragmentation, densité, hauteur,
> turbulence. Voix, souffle, bruit.

Le livret autorise le micro comme périphérique d'entrée (« Souris, touch, clavier, webcam, micro,
capteur, présence »). Aucune règle Q1–Q61 n'est touchée : le micro est une couche d'immersion, comme
les bandes sonores du prompt 44.

## Attendu
1. **Push-to-talk** : un objet « micro du poste » sur le bureau (clic maintenu) et la touche **M**
   maintenue activent l'entrée micro. `getUserMedia({ audio })` n'est appelé qu'à ce geste utilisateur
   (règle navigateur) ; si le micro est refusé ou indisponible → **repli silencieux** : texture
   granulaire synthétisée en interne, aucun crash, message discret « Micro indisponible ».
2. **Analyse du signal** (Web Audio, `AnalyserNode`, lu hors `draw`) : **amplitude** (RMS) et
   **hauteur** (autocorrélation simple sur le buffer temps) ; le souffle/bruit = RMS continu sans pic
   de hauteur.
3. **Texture granulaire** pilotée en temps réel (grains lus dans le buffer micro) :
   - amplitude → volume global de la texture et **densité** (grains par seconde) ;
   - hauteur détectée → **hauteur de lecture** des grains (voix aiguë = grains plus aigus) ;
   - amplitude élevée → **fragmentation** (durée des grains plus courte) ;
   - niveau de souffle/bruit → **turbulence** (gigue aléatoire sur le départ et la hauteur des grains).
4. **Les trois sources jouées au micro** : **voix** (hauteur claire → texture tonale), **souffle**
   (RMS continu sans hauteur → grains bruyants, turbulence haute), **bruit** (pics d'amplitude →
   fragmentation forte). Aucun mode à sélectionner : le joueur produit naturellement ces trois états.
5. **Affichage** : oscilloscope / VU-mètre dessiné sur l'écran du PC (appli Régulation, à côté du
   compteur) ou petit VU-mètre sur le bureau, rafraîchi depuis les valeurs analysées ; figé si
   `prefers-reduced-motion` / « Réduire les animations ».
6. **Cadrage** : aucune incidence sur les jauges, le compteur, les décisions : `game.js` inchangé,
   `test-jeu.mjs` reste vert. Son toujours sous l'interrupteur Son ; option « Micro » dans les
   Paramètres (désactivable, état mémorisé en `localStorage`) ; activation/désactivation annoncée en
   `aria-live`. Textes FR + EN. Amplitude visuelle faible (pas de flash).

## Vérifications
- `npm run build`, `npm test` ; essai réel : micro autorisé (voix, souffle, bruit), micro refusé
  (repli), touche M maintenue puis relâchée, Son éteint, option Micro désactivée, animations réduites ;
  aucune erreur console. FR + EN ; clavier. Documenter dans `jeu/49-…`. Fusion `main` sur demande.
