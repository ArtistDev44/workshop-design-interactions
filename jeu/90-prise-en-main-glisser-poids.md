# 90 — Prise en main : quitter la journée, glisser-déposer, poids des décisions (prompt 94)

Code :
- `site/public/glisser.js` (nouveau) ;
- `panneau.js` (bandeau, cartes, zone de dépôt) ;
- `journee.js` (`quitterJourneeRapide`, touche Q) ;
- `soir.js` (sortie automatique) ;
- `sketch.js` (appui, secousse) ;
- `micro.js` (relâchement) ;
- `portrait.js` (glisser au doigt en paysage, déjà en place au prompt 92) ;
- `feedback.js` (éclair de jauge) ;
- `i18n.js` ;
- `scripts/test-jeu.mjs`.

`game.js` n'est pas modifié : règles, effets, 1d6, jauges et fins sont inchangés, comme les données.

## 1. Quitter la journée en un geste visible
- Le bouton **« Quitter la journée (Q) »** est toujours visible dans le bandeau, à côté d'Aide et Recommencer. Pour lui faire de la place, les barres des jauges passent de 190 à 140 px, sans changer leurs valeurs ni leurs seuils.
- La touche **Q** n'était utilisée nulle part.
- `quitterJourneeRapide()` avance l'étape en cours :

| Étape en cours | Effet du bouton ou de Q |
|---|---|
| Fin de service atteinte | Mail du soir (`terminerJournee`, rapport du soir du prompt 88 compris) |
| Mail du soir | Rangement du poste |
| Soir | Sortie du bureau, crépuscule sauté |
| Avant l'heure | Fenêtre « partir quand même » existante, avec son malus expliqué (Entrée confirme) |

- Après « ranger le poste », la **sortie est automatique** 8 s après la nuit tombée. La flèche « Sortie » reste cliquable pendant ce délai.
- Les règles testées du prompt 69 sont inchangées ; le bloc « soir » de `test-jeu.mjs` reste vert.
- Le message de fin de journée de la barre d'état cite désormais « Quitter la journée » (Q).

## 2. Décider par glisser-déposer
- À chaque image, les cartes de réponse sont relevées dans `CARTES` et le dossier dans `ZONE_DEPOT` (titre et 3 blocs). Les coordonnées sont celles de l'écran du PC ; `sourisPC()` convertit la souris au poste.
- **Pendant le glisser :**
  - à l'appui, la carte flotte : inertie (0,38), inclinaison selon la vitesse (au plus 0,12 rad), ombre portée ;
  - son emplacement apparaît en pointillés ;
  - le dossier se surligne en pointillés orange avec « Déposer ici ».
- **Au relâchement :**
  - **sur le dossier**, la carte décide (`decider(cle)`), avec une frappe : un éclair de 160 ms, une secousse légère et le son de console existant ;
  - **ailleurs**, elle revient en ressort (250 ms), aucun choix n'est appliqué, et une annonce `aria-live` le dit ;
  - **un simple clic** (déplacement de moins de 8 px) décide toujours ;
  - **au doigt** (mobile), le tap décide directement ;
  - les touches **1-4**, 0 et Espace sont inchangées.
- Indice dans la barre d'état pendant un signalement : « glissez une carte sur le dossier — ou clic, 1 à 4 (0 = attendre) ».

## 3. Poids
- **Secousse d'écran** à chaque décision, selon l'amplitude réelle des deltas : ≥ 10 forte (9 px), ≥ 6 moyenne (5 px), sinon légère (2 px). Elle s'amortit en 360 ms. Elle est appliquée autour de `composerVue()` (pièce et moniteur), et les fenêtres restent fixes.
- **Éclair** de 220 ms sur la barre de la jauge qui vient de changer. Les deltas flottants sont conservés.
- Avec `prefers-reduced-motion`, il n'y a ni secousse, ni inertie, ni inclinaison, ni éclair. Chaque geste déclenche au plus un éclair, bien sous la limite de 3 par seconde.

## 4. Easy to learn & hard to master
- **Apprendre :** un bouton visible pour finir la journée, une carte à déposer (ou un clic), un indice en ligne, l'aide H. Aucun nouveau tutoriel.
- **Maîtriser :** rien ne change (effets contextuels, 1d6, retard qui grimpe, équipes limitées, thème du jour, pression morale).

## Vérifications
- `npm test` passe : 438 contrôles smoke et 473 contrôles du jeu. Il comprend ces nouveaux contrôles :
  - glisser sur le dossier = décision ; ailleurs = rien ; clic = décision ; pas de glisser hors décision ni au doigt ;
  - amplitude selon les deltas, coupée avec les animations réduites ;
  - Q : avant l'heure → fenêtre « partir » ; puis mail → soir → sortie → lendemain, sans toucher aux jauges ;
  - sortie automatique ;
  - clés présentes en FR et en EN.
- Chromium, en FR et en EN :
  - glisser-déposer sur le dossier, carte reposée ailleurs, clic, touche 1 ;
  - Q de l'après-midi au lendemain ;
  - aucune erreur de console.
- Audit des textes (`?audit=textes&parcours=1`) : 0 défaut A à D en 1920×1080 et en mobile portrait.
- **Test humain** (« quitter en 2 gestes », sensation de poids) : [À COMPLÉTER].
