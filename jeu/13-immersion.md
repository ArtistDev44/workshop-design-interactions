# 13 — Couche d'immersion (prompt 20)

Ajoutée sans toucher aux décisions Q1–Q61. Code : `immersion.js` (réglages dans `IMMERSION`), branché dans `sketch.js` et `bureau.js`.

- **Échap** : au poste = se lever ; au bureau = menu (Reprendre, Paramètres, Quitter). Le temps continue.
- **Intro SMS** : 6 messages statiques au premier lancement (clic / Entrée, puis « Commencer ») ; pas rejouée sur « Rejouer ».
- **Journées** : une par date réelle des dossiers ; heure d'arrivée = heure de la source si connue, sinon créneaux réguliers 7h–19h (heure DE LA PARTIE). Journée 6h → 20h ; mode « aujourd'hui » : départ à l'heure réelle, incident toutes les 20 min.
- **Horloge simulée** : horloge du bureau, ciel et en-tête la suivent ; ×10 sans incident actif (léger flou du décor, sauf animations réduites).
- **Sieste** : après 20 s sans incident ni interaction ; incident pendant la sieste = triple bip + « Se réveiller » (Espace) en 3 / 2 / 1 s selon le compteur 60 / 30 / 15 s ; raté = « ne rien faire » + −5 sur la jauge concernée (fluidité, ou satisfaction pour un événement).
- **Bordure rouge** (retard ≥ 20 min ou conflit) autour du moniteur, au bureau et en plein écran, 1,5 pulsation/s (fixe si animations réduites).
- **Mail de fin de journée** sur le PC : incidents mal gérés heure par heure (sans réaction, sieste, mauvaise source, bilan ≤ −6), une ligne pour les autres, jauges réelles ; « Journée suivante » puis bilan de la semaine (inchangé).
- **Livres** sur le plateau : « TUTO » (ouvre l'aide H) et « STRESS » (texte de médiation) ; Tab + Entrée au clavier ; la lecture ne met pas le jeu en pause.

Testé (délais raccourcis dans la page de test, code inchangé) : intro SMS, sieste puis réveil raté (−4 naturel −5 sieste), réveil réussi, mail citant les incidents réels, journée suivante, menu Échap, livres au clavier, build.
Restent à vérifier par l'équipe : rendu animé en vrai (sieste, pulsation, flou), son, contraste du texte d'aide gris de l'écran SMS.
