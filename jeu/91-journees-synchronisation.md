# 91 — Des journées synchronisées et expliquées (prompt 95)

Code :
- `immersion.js` : `TEMPS_EQUIPES`, `tempsEquipes`, `vitesseTemps`, `jourDate`, `joursSansEvenement`, `lignesTransitionJour`, titre de transition ;
- `carte.js`, `panneau.js`, `multitache.js`, `sieste.js`, `sketch.js` : horloge des équipes, indicateur de vitesse, `texteResteJournee` ;
- `sauvegarde.js` : `recalerEquipes`, indicateur en heure de jeu ;
- `i18n.js` ;
- `scripts/test-jeu.mjs`.

`game.js` et les données ne sont pas modifiés : l'API des équipes prend déjà « maintenant » en paramètre.

## Diagnostic (11/11/2026)
- **Deux horloges** :
  - « Partie sauvegardée à 18:18 » donnait l'heure réelle, à côté d'une horloge de jeu à 20:00 ;
  - les équipes comptaient en secondes réelles, et avançaient donc pendant la lecture (horloge du jeu en pause) sans suivre le ×100.
- **Vitesse du temps non dite** : ×1, ×100 et pause ne s'affichaient que dans le panneau d'attente.
- **Transition fausse** : une semaine d'archive hors mode histoire s'annonçait « JOUR n — TEMPS RÉEL ».
- **Semaines de 6 ou 7 jours sans explication** : un jour sans événement réel n'est pas joué.
- **Rien sur la suite de la journée** : on attendait sans savoir ce qui restait.

## Corrections
1. **Une seule horloge visible.**
   - `TEMPS_EQUIPES` avance avec le temps de jeu : ×1, ×100 en temps accéléré, et 0 quand il est suspendu (lecture, fenêtres, pause, soir). 1 000 ms valent 1 minute de jeu au rythme normal.
   - Les valeurs verrouillées des équipes deviennent des minutes de jeu : 20 min de route, 40 à 60 min d'intervention, 10 min de retour.
   - Les libellés disent « retour dans n min ».
   - La sieste (prompt 91) et la sauvegarde / reprise (`recalerEquipes`) suivent la même horloge.
   - L'indicateur de sauvegarde affiche « Partie sauvegardée à 14h20 · jour 2 ».
2. **Vitesse du temps** devant l'heure du bandeau : « ▶ » (normal), « ▶▶ ×100 » (aucun signalement en cours) ou « en pause ». Une infobulle sur l'heure explique la règle.
3. **Transition de journée**, sans clic de plus. Elle dure 5,2 s, passable par Entrée ou un clic, et tout son texte est annoncé en `aria-live`. Elle affiche :
   - le titre juste : « JOUR n/N — SEMAINE s » (histoire), « JOUR n/N » (archive), « JOUR n — TEMPS RÉEL » (direct seulement) ;
   - la date avec le jour de la semaine ;
   - le nombre de signalements réels prévus ;
   - le service, de 8h00 à 20h00 ;
   - le rythme du temps ;
   - comment finir la journée (Q) ;
   - le premier jour d'une semaine courte, la raison (« Semaine de 6 jours : aucun événement réel le dimanche 20 septembre »).
4. **La suite de la journée** :
   - en bas de la file : « Aujourd'hui : n à traiter · prochain vers 13h00 », « …, aucun autre prévu » ou « tout est traité · fin du service à 20h00 (Q) ». Cette ligne s'efface pendant les 5 s d'un message de la file.
   - dans le panneau d'attente : « Jour n sur N · lundi 14 septembre ».

## Vérifications
- `npm test` passe : 438 contrôles smoke et 499 contrôles du jeu. Il vérifie en plus :
  - les titres de transition (archive, histoire, direct) ;
  - les lignes d'explication, tirées des données, avec la semaine courte annoncée une seule fois ;
  - une équipe qui arrive après 20 min de jeu, pas avant ;
  - une horloge des équipes arrêtée avec le temps de jeu et qui suit le ×100 ;
  - plus aucun `millis()` pour les équipes ;
  - la sauvegarde en heure de jeu ;
  - 15 clés présentes en FR et en EN.
- Chromium, en FR et en EN :
  - transition lisible ;
  - vitesse « ▶▶ ×100 » en attente, puis « en pause » à la lecture ;
  - une équipe envoyée pendant la lecture reste en route tant que l'horloge est en pause ;
  - aucune erreur de console.
- Audit des textes : 0 défaut A à D (1920×1080 et mobile portrait).
- **Test humain** : [À COMPLÉTER].
