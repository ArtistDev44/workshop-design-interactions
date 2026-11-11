# 64 — Fin de journée : la nuit tombe, une flèche montre la sortie (prompt 69)

Code : `soir.js` (nouveau), `immersion.js`, `bureau.js`, `journee.js`, `sketch.js`, `guide.js`, `portrait.js`,
`sauvegarde.js`, `webcam.js`, `confort.js`, `i18n.js`. Règles Q1–Q61 et `game.js` inchangés.

## Déroulé
1. Fin de service inchangée (horloge à l'heure de fin puis clic, ou « partir quand même » avec son malus).
   Le mail du soir s'affiche comme avant ; son bouton devient **« Ranger le poste (Entrée) »**.
2. Phase **`soir`** : le joueur se lève (vue bureau), le PC passe en veille (écran assombri, halo à 35 %),
   l'horloge simulée file jusqu'à **21 h en 4 s** (nuit directe si animations réduites). En mode temps réel,
   la nuit tombe aussi (facteur de nuit imposé), l'heure affichée reste l'heure réelle.
3. Nuit : ciel, lune, fenêtres de la ville et vitre de la grue allumées (existant), **feu rouge** en haut de la
   grue Titan, **lampadaires** du quai ; la pluie reste si le jour joué a ≥ 1 mm (météo réelle du jour).
   Dans la pièce : plafonnier éteint, la ville éclaire (lumière plancher 0,30 au lieu de 0,12 : la pièce reste
   lisible lampe éteinte) ; la lampe garde l'état choisi. Son : ambiance nuit (fondu ~1 s), musique baissée à 55 %
   (aucune humeur « soirée » parmi les morceaux CC0).
4. Flèche **« Sortie »** au bord gauche, à mi-hauteur, quand la nuit est installée : plaque sombre bordée de
   blanc, pictogramme de sortie de secours (dessin original, blanc sur vert #0B7A3E), grande flèche jaune
   #FFC138, libellé. Halo qui pulse à 1/s (fixe si animations réduites). Infobulle « Quitter le bureau
   (Entrée) » ; Tab (objet du bureau le temps du soir), Entrée ou S ; clic. Annonce `aria-live`.
   Mobile portrait : grand bouton « ← Sortie » en tête (124 px image, ≈ 47 px CSS sur 412 px).
5. Sortie : pan de 0,8 s vers la gauche (caméra du prompt 40) qui découvre un couloir sombre et le panneau vert
   au-dessus d'une ouverture, fondu au noir 0,6 s, écran noir 1,5 s passable (Entrée, clic) : « Fin de la journée
   du {date} — Retour demain, 8 h », « Fin de la semaine » le dernier jour, « Fin de service » en temps réel.
   Animations réduites : ni pan ni pulsation, fondu au noir direct.
6. Lendemain : `journeeSuivante()` inchangée (transition « JOUR n », pièce à 8 h, aube) ; le dernier jour,
   `allerFin()` (bilan) inchangé.

## États et cas particuliers
- Pendant `soir` : temps figé à 21 h, aucun incident, pas de sieste (inactivité ni main à la webcam), sablier
  inactif. Le PC reste consultable (s'asseoir, applis) ; se relever ramène à la flèche.
- Sauvegarde : la phase `soir` est gardée ; la reprise remet la nuit et la flèche.
- Guide : le premier soir, bulle « Quitter le bureau » avec flèche vers la sortie (jusqu'à la première sortie).
  Tutoriel (page 5) : rangez le poste, sortez par la flèche.
- Écart documenté : le château des ducs n'existe pas dans le panorama de la baie (ville, grue Titan, Loire) ;
  il n'a pas été ajouté.

## Vérifications
- `npm run build`, `npm test` : 13 contrôles « soir » dans `test-jeu.mjs` (soir.js chargé avec game.js) —
  phase soir, 21 h, jauges intactes, pan, lendemain 8 h, départ anticipé (malus −8 le lendemain, inchangé),
  reprise, dernier soir → bilan ; gardes du temps, de la webcam et de la sauvegarde.
- Chromium FR, EN, FR animations réduites : mail → Entrée → crépuscule → flèche (lampe allumée puis éteinte) →
  Tab → Entrée → pan → noir → JOUR 2 à 8 h → aube ; clic souris ; reprise de sauvegarde ; semaine jusqu'au
  bilan ; jour pluvieux réel (12/10/2026, 7,4 mm) : pluie la nuit. Aucune erreur console, aucune clé manquante.
- Contraste : blanc sur plaque #0D0C0C ≈ 19:1, jaune #FFC138 ≈ 11:1, blanc sur vert #0B7A3E ≈ 5,6:1.
