# Prompt 71 — Jeu « Nantes en régulation », étape 53 : l'animation de démarrage du PC est rejouée à chaque journée (3 premiers jours seulement)

Demande d'origine (10/11/2026) :

> Parfait : à chaque journée, l'animation qu'on avait faite pour le chargement du PC doit être refaite —
> juste les 3 premiers jours.

Le démarrage du PC existe (`os.js` : `PC.etat = 'demarrage'`, `dessinerDemarrage()`,
`DUREE_DEMARRAGE = 3400` ms) mais n'est joué qu'au lancement. Ce prompt le rejoue au début de chaque
journée de jeu, **uniquement pour les 3 premiers jours** de la partie. Règles Q1–Q61 inchangées.

## Attendu
1. **Compteur de jours** : un compteur de journées jouées dans la partie (persisté avec la sauvegarde,
   `sauvegarde.js`), remis à 0 sur « Nouvelle partie ».
2. **Rejeu du démarrage** : au passage à la journée suivante (après l'écran noir « Jour n — Semaine n »,
   `journee.js` / `TRANSITION_JOUR`), si le numéro du jour est **1, 2 ou 3** → `PC.etat = 'demarrage'` et
   `dessinerDemarrage()` est rejoué en entier (3400 ms, même séquence : logo, barre de chargement, bip)
   avant d'arriver sur le bureau RégulOS ; à partir du jour 4 → transition directe, comme aujourd'hui.
3. **Une seule fois par jour** : pas de replay si le joueur quitte/reprend le PC ou recharge la page au
   milieu d'une journée (le démarrage ne rejoue qu'à l'arrivée sur une nouvelle journée).
4. **Contraintes** : le temps de jeu reste suspendu pendant le démarrage (comme au lancement) ;
   `prefers-reduced-motion` / « Réduire les animations » → démarrage écourté ou direct (état statique,
   comme au prompt 27) ; Échap/clic ne coupe pas le démarrage des 3 premiers jours (comportement
   identique au lancement) ; aucune incidence sur les jauges, le compteur de décision, les dossiers ;
   `game.js` inchangé, `test-jeu.mjs` vert.
5. **Doc** : `jeu/55-…` (nouvelle doc), `jeu/README.md`, `journal.md` à jour.

## Vérifications
- `npm run build`, `npm test` ; essai réel : jours 1, 2, 3 → animation de démarrage rejouée à chaque
  nouvelle journée ; jour 4+ → pas de redémarrage ; reprise de sauvegarde en cours de journée → pas de
  replay ; animations réduites → démarrage direct ; aucune erreur console. FR + EN. Fusion `main` sur
  demande.
