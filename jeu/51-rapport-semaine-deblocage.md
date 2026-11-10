# 51 — Fin de semaine : rapport chiffré, mail du patron, déblocage (prompt 56)

Code : `game.js` (section « Prompt 56 » : `Jeu.statsSemaine`, `Jeu.mailFinSemaine`, testés), `histoire.js`
(mail, page 2 du rapport, boutons), `sketch.js` (mesures par décision). Règles Q1–Q61 inchangées.

## Déroulé de la fin de semaine
1. **Mail du patron du dernier soir**, mis en avant dès la fin (bandeau rouge « fin de semaine ») :
   score et dossiers traités, objectifs du jour (félicitations s'ils sont tous tenus, sinon « on peut faire
   mieux »), alerte si une jauge finit sous 40, défis manqués (ou tous tenus), dossiers laissés au compteur.
   Que des chiffres réels de la partie. Pas de mail après une démission.
2. Entrée → la feuille sort de l'imprimante et s'ouvre : **page 1** (bilan du prompt 41 : score, jauges,
   décisions clés, courbes, défis, journal de bord, profils) ; **Tab** (ou le bouton à droite de la feuille)
   → **page 2, chiffres réels** : dossiers reçus / traités / laissés au compteur (Q25), décisions par
   action, temps moyen de décision (temps réel entre l'arrivée du dossier et la décision), sources
   consultées (prompt 50), ralentis utilisés (prompt 55), objectifs du jour tenus, courbes en grand,
   jauges finales et score, défis avec valeur réelle et bonus appliqué, profil de gestion.
3. La feuille reste **posée sur le bureau** (objet cliquable « rapport », comme au prompt 41).
4. Suite : mode histoire → « Semaine suivante » (le chapitre suivant est débloqué et mémorisé, comme
   avant) ; semaine 3 → le rapport passe **avant la cinématique** (« Voir la fin ») ; temps réel →
   « Rejouer », **« Autre semaine archivée »** (choix des semaines, uniquement `data/semaines/`) ou menu.

## Palmarès
- Le résumé de chaque semaine (score, jauges, profil, **défis tenus**) reste unique par semaine : seul le
  meilleur bilan est gardé, terminer deux fois la même semaine ne crée pas de doublon. Les défis tenus
  s'affichent avec le profil (« le pompier · défis 2/3 »).
- Une semaine finie sans dernière soirée (départ anticipé le dernier jour) reçoit quand même ses bonus
  de défis, une seule fois.

## Vérifications
- `npm run build`, `npm test` (110 + 148 contrôles : chiffres du rapport exacts sur une partie simulée,
  mail du dernier soir sans texte manquant, déblocage retrouvé après rechargement, palmarès sans doublon).
- Chromium, chapitre 1 joué de bout en bout sans erreur console : mail (« score 243 / 300, 15 dossier(s)
  traité(s) sur 15 · objectifs 6/6 · défis manqués : Toutes les plaintes répondues ») ; Entrée → rapport ;
  Tab → page 2 (15 reçus, 15 traités, 5/5/5 par action, 15 sources) ; Entrée → chapitre 2 ; progression
  `{ scores: { 1: 243 } }` ; palmarès avec profil et défis 2/3.
