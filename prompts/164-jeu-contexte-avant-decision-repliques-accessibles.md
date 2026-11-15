# Prompt 164 — Jeu : le contexte avant la décision, trois vraies répliques, annoncées

Source : revue UX du 12/11/2026 (`ux-informations-2026-11-12.md`, constats 3, 4 et 5 ; volet B § 6, § 8, § 9,
« Informations manquantes » 1 et 2). Suite n° 5 proposée par la revue.

Hors périmètre (arbitrages du groupe, revue § 3) : masquer ou non la tendance du clash (117 contre 130), renommer
ou recalculer la gravité, hiérarchie plainte / fait réel.

## À faire

1. **Ligne de contexte avant les répliques** dans la fenêtre du dossier, sous la phrase de situation, calculée sur ce
   qui fait varier les tendances (`effetAttendu`, `game.js` ~l.888) : météo du jour (pluie, rafales, « défavorable »
   au seuil du contexte), pointe ou heure creuse, affluence supposée, jauge en manque. Ex. « Contexte : pluie 6 mm
   (défavorable) · 17 h, pointe · budget bas (38) ». Une ligne, sans troncature muette.
2. **Pointe sur l'heure affichée** : le moteur lit l'heure de la source (`d.heure`, `game.js` ~l.546) alors que le
   joueur voit l'heure de la partie (`d.minute`). Calculer la pointe sur l'heure de jeu affichée (et l'utiliser aussi
   dans `JournalDonnees`).
3. **« (effet renforcé) »** dans la narration : ne l'afficher que si un bonus de contexte a réellement été appliqué à
   la réponse, et dire lequel ; sinon retirer la ligne.
4. **Seuils météo alignés** : le ⚠ de la source Météo (`SEUILS_METEO_ENQ`, `enquete.js` ~l.97) suit le seuil du
   contexte « météo défavorable ».
5. **Trois vraies répliques** : quand la meilleure réponse est de la famille « attendre / rien », le clash ne doit pas
   être son jumeau (`reponsesDialogue`, `panneau.js` ~l.398) : prendre deux autres réponses distinctes et faire porter
   le clash sur une famille différente, de sorte que les trois effets diffèrent.
6. **Raison du retour cohérente** : « la situation est calme » ne s'affiche pas pour un dossier de gravité élevée,
   un incident fictif en cours ou une alerte ; la raison cite ce qui a pesé (jauge en manque, budget, contexte). Le
   ton « Rien d'alarmant » n'est pas employé après un dossier de gravité élevée.
7. **Accessibilité de la décision** : à l'ouverture du dossier (et sur demande au clavier), annoncer au lecteur
   d'écran la ligne de contexte, puis « 1 : {réplique}, fluidité en hausse, réputation stable, budget en baisse… »
   pour chacune des trois répliques (et « conseillé » si l'option est active).
8. Retour de décision : fusionner la liste des effets et `retour.passe` (une seule énumération des écarts) ; le dé
   seulement avec l'option « Dé visible ».

## Vérifications

- Sur une semaine d'archive, 5 dossiers : la ligne de contexte s'affiche avant les répliques ; aucun trio avec deux
  effets identiques (ajouter un contrôle dans `test-jeu.mjs` sur tous les dossiers des semaines préparées) ; plus de
  « calme » après une gravité élevée.
- Annonce vérifiée dans `#annonces` à l'ouverture d'un dossier.
- `npm run build` puis `npm test` ; audit des textes ; `prompts/README.md` et `journal.md`.

## Exécuté le 15/11/2026 (sur le code actuel ; branche `164b-…`, l'essai partiel de `wdi-164` n'est pas repris)

1. **Ligne de contexte** avant « Vos réponses » (`ligneContexteDossier`, `panneau.js`) : « Contexte : pluie 7,4 mm,
   rafales 31 km/h (défavorable) · 17 h, pointe · budget en manque (5) » — météo réelle quand elle est défavorable,
   heure de jeu (pointe ou creuse), affluence supposée, jauge sous 45 ; deux lignes au plus, jamais tronquée en silence.
2. **Pointe sur l'heure de jeu** (`contexte`, `game.js`) : `d.minute` (heure affichée), l'heure de la source en repli ;
   le Journal en profite (il lit le même contexte). Le contrôle d'équilibre des réponses varie désormais l'heure de jeu.
3. **« (effet renforcé) »** seulement si un bonus de contexte a vraiment joué sur la réponse choisie
   (`Jeu.renfortsContexte`, même règle qu'`effetAttendu`), et il nomme lequel ; jamais après un clash.
4. **Seuils météo alignés** : le ⚠ de la source Météo suit le contexte (pluie ≥ 5 mm, rafales ≥ 50 km/h).
5. **Trois vraies répliques** : quand la meilleure est « attendre », le clash porte sur une autre réponse.
6. **Raison cohérente** : « le signalement est de gravité élevée » au lieu de « la situation est calme » après un
   dossier grave, un incident fictif ou une alerte ; plus de « Rien d'alarmant » après un dossier grave.
7. Déjà fait par le prompt 213 (répliques et tendances annoncées au lecteur d'écran à l'arrivée du dossier).
8. Déjà fait par le prompt 184 (plus de liste des écarts ; le dé seulement avec l'option « Dé visible »).

Au passage : 21 répliques du prompt 223 raccourcies (elles étaient coupées par « … » sur deux lignes), double guillemet
retiré du clash des perturbations.

Vérifié : `npm run build`, `npm test` (+4 contrôles) ; Chromium : ligne de contexte sur un dossier réel ; audit : 0
défaut de texte, 0 cible sous 44 px CSS en 1920 × 1080, 1366 × 768, 412 × 915, 915 × 412.
