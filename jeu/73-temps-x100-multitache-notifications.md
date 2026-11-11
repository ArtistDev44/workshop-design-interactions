# 73 — Temps ×100, plusieurs signalements en même temps, notifications sur le bureau (prompt 77)

Code : `multitache.js` (nouveau), `carte.js` (liste et arrivées), `enquete.js` (une enquête par dossier),
`sketch.js`, `immersion.js` (`IMMERSION.compression = 100`), `journee.js` (sablier recalé), `guide.js`, `i18n.js`.
`game.js` **inchangé** : il décide toujours « le dossier courant » avec les mêmes règles, effets et dés.

## Temps ×100
- Entre deux dossiers (aucun signalement en cours), le temps file **×100** (valeur verrouillée) ; l'indicateur,
  le bandeau d'état, l'horloge du bureau et le guide affichent la vraie valeur (`×{x}`).
- Le sablier garde sa mécanique : `SABLIER_VITESSE` passe de 14 à 4,2 pour garder la même vitesse absolue
  (14 × 30 = 4,2 × 100 = 420) ; le prompt 78 le remplace.
- Temps toujours suspendu au démarrage du PC, en pause, au tutoriel, à l'explication du poste, etc.

## Jusqu'à 3 signalements actifs
- Un signalement pris dans la liste devient **actif** ; on peut en prendre d'autres pendant un dossier (clic dans
  la liste), **3 au plus** (le 4e est refusé avec un message). Chaque actif a son compteur (durée du compteur de
  la semaine), son enquête (sources révélées gardées quand on y revient), sa source retenue et sa phase.
- **Navigation** : Tab (avec 2 actifs ou plus) ou clic dans la liste (« Afficher ▸ ») ; le sélectionné est
  encadré en rouge (« en cours · 23 s »), les autres affichent « actif · 18 s au compteur » (rouge sous 10 s).
- **Compteur à 0** sur un actif non affiché : la règle « non traité » (Q25, malus du prompt 23) s'applique à ce
  signalement seul, en arrière-plan ; l'affiché ne bouge pas. Un signalement resté en file (non pris) expire
  toujours après 2 × le compteur, quelle que soit la phase.
- Après la narration d'une décision, le jeu reprend l'actif le plus urgent ; s'il n'y en a plus, retour à la
  liste ou à l'attente. Conflit A / B (Q27) et contradiction de sources : sur le signalement sélectionné.
- Pause (P) refusée tant que d'autres compteurs tournent. Sauvegarde : seul le sélectionné garde son compteur ;
  à la reprise, les autres actifs reviennent dans la file.
- Technique : le sélectionné est mis en tête du paquet (`amenerEnTete`, prompt 73) ; son état d'affichage
  (compteur, arrivée, source, phase…) est sauvé dans sa fiche quand on bascule, puis restauré.

## Notifications style bureau
- Arrivée d'un signalement (type réel, gravité, ligne si identifiée), mail du patron, commentaire ou plainte
  Community, fin d'intervention d'équipe, signalement réglé sans vous : titre + extrait réels + icône de l'appli.
- En haut à droite de l'écran du PC ; quand on est levé (vue bureau), aussi en haut à droite de la vue.
- Clic : ouvre l'appli concernée (en s'installant au poste si besoin) ou sélectionne le signalement.
- 6 s, 3 visibles au plus (empilées), annoncées en `aria-live` ; sans glissement si les animations sont réduites.
  Les compteurs de non lus de la barre des tâches restent ceux d'avant.

## Vérifications
- `npm test` : 3 actifs avec compteurs indépendants (20 / 25 / 30 s), 4e refusé, expiration d'un seul actif en
  arrière-plan (le sélectionné reste en tête), décisions successives avec reprise de l'autre actif, une
  notification par arrivée, compression ×100.
- Chromium FR et EN : 4 arrivées notifiées, 3 actifs, Tab, expiration en fond, reprise après narration ; semaines
  complètes (EN, et FR en portrait mobile avec animations réduites) sans erreur console ; notification sur la vue
  bureau.
