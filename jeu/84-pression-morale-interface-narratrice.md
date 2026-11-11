# 84 — Le geste, la pression morale et l'interface comme narration (prompt 89 « pression morale »)

Numéro : le prompt demandait `jeu/83-…`, déjà pris par le Journal de bord (autre prompt 89, `83-journal-de-bord-moderne.md`).

Code : `traces.js` (nouveau : logique pure `Traces` testée + rendu des traces dans la file), `carte.js` (la file
affiche « Traités aujourd'hui »), `panneau.js` (pression visible, mémoire du dossier, retard figé et dé dans le
retour), `sketch.js` (son par famille de réponse, trace après décision, indicateur de sauvegarde déplacé),
`game.js` (le mail du soir cite le fait marquant du rapport), `immersion.js` (Q25 expliqué à la fin de service,
rapport de la veille visible), `histoire.js` (feuille et fenêtre du rapport de la veille), `journee.js` (éclairage),
`taches-ui.js` / `confort.js` (options), `i18n.js`. **Aucune valeur d'effet n'est modifiée** (vérifié par
`npm test` : mêmes jauges et mêmes dés avec ou sans les options).

## Ce qui est en place par défaut
- **La file devient le journal visuel de la journée** : sous les signalements en attente, « Traités
  aujourd'hui » liste chaque décision (✓ heure — réponse · ligne, retard retenu au moment du choix) et chaque
  non-traité (✗ « non traité à la fin de service » + calcul Q25). La dernière ligne reste en évidence 3 s ;
  `aria-live` lit la trace.
- **Retour expliqué** : rappelle le retard retenu au moment du choix (figé à la décision, prompt 79).
- **Mémoire du dossier** : dans « En savoir plus » (E), « Déjà décidé aujourd'hui sur cette ligne » (journal réel).
- **Q25 expliqué** : « Conséquences naturelles : retard 25 min → Fluidité −5 (retard ÷ 5, entre 4 et 15) » ;
  perturbation, alerte météo, affluence : effets réels cités. Dans la file et dans l'annonce de fin de service.
- **Son distinct par famille de réponse** (dévier, retenir, renfort, ne rien changer) : corrige un défaut du
  prompt 87 (les réponses par catégorie déclenchaient toutes le bip d'alerte).
- **Le rapport de la veille** (rapport du soir, prompt 88) reste posé sur le bureau jusqu'à la fin de la semaine ;
  un clic l'ouvre (fait marquant, priorités, demande).
- **La narration du soir** (mail) cite le fait marquant choisi au rapport.
- Chaînage : non réimplémenté ; voir l'option « événements chaînés » du prompt 88 (`82-engouement-variete.md`).

## Points à trancher par le groupe (§ 6) — non cochés : désactivés par défaut
Paramètres → Options de jeu (G), touches 4 à 7, effet immédiat :
- **Trace dans le dossier** : la dernière décision du jour sur la même ligne apparaît dans « Ce qu'on sait ».
- **Pression visible** : sous le titre du dossier, « Retard 18 min (signalé 12 min) · gravité moyenne (≥ 10 min)
  · arrivé il y a 35 min (heure de jeu) », couleur de gravité doublée du seuil en texte.
- **Dé visible** : « Dés tirés : Réputation : dé 4 → +8 · Budget : dé 6 → −7 » dans le retour.
- **Éclairage lié aux jauges** : −6 % de lumière par jauge sous 40, fondu existant (aucun flash, aucun asset).

## Exceptions
Aucune règle Q1–Q61 ni valeur d'effet modifiée ; seul l'affichage change.

## Vérifications
`npm run build`, `npm test` (353 contrôles) : trace de la file (réponse + heure) après chaque décision, retard qui
ne baisse pas entre deux relevés et figé à la décision, temps écoulé = horloge de jeu, Q25 cite les effets réels,
dé affiché = dé tiré, options sans effet sur les jauges ni les dés, traces reproductibles par la graine et
restaurées depuis la sauvegarde. Chromium FR / EN : file avec traces, panneau avec pression, retour avec dés.
Test humain (« raconter sa journée en regardant seulement la file et le dossier ») : [À COMPLÉTER].
