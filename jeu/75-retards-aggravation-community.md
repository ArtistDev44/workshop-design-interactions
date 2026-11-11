# 75 — Les retards s'aggravent, et le même système sur Community (prompt 79)

Code : `game.js` (`REGLAGES.aggravation`, `REGLAGES.community`, `Jeu.retardEffectif`, `Jeu.aggravationLignes`,
`Jeu.majPlaintes`, `Jeu.resteReponse`, `Jeu.bilanCommunity`, réponse rapide / tardive, mail du soir, sauvegarde),
`sketch.js` (annonces), `enquete.js`, `carte.js`, `os.js`, `i18n.js`, `jeu/03-actions-decisions.md`.

## Retards
- Le **retard de départ affiché reste le vrai chiffre de la source** (`d.retard`, GTFS-RT en direct). Tant que
  le dossier n'est pas tranché, le **retard effectif** grandit : `réel + floor(minutes de jeu depuis l'arrivée / 2)`,
  plafonné à +30 min. Il est **figé à la décision** (`d.retardFige`, gardé dans la sauvegarde avec le paquet).
- Affichage : source « Info trafic » « Retard : +12 min (réel) → +17 min actuellement » ; narration « (+12 min
  réels, +17 min au moment de décider) » ; mail du soir avec le retard qui a compté ; annonce `aria-live` à
  chaque palier de +5 min sur le signalement affiché.
- **Règles** : Q58, gravité, conséquences naturelles (« ligne en difficulté ») et conflit A / B lisent le retard
  effectif — mêmes seuils, mêmes effets de base, seule la valeur d'entrée est dynamique.
- **Mauvaise réaction** : décision évaluée « raté » ou « trop tard » sur un dossier avec retard → +5 min durables
  sur sa ou ses lignes pour le reste de la journée (cumulatif, plafond +15), visibles dans l'historique de la
  ligne et dans le mail du soir ; aucun nouveau malus (les jauges perdent ce que prévoient déjà les règles).
  Remise à zéro chaque matin ; gardé dans la sauvegarde.
- Les semaines archivées n'ont pas de retard chiffré (perturbations, alertes, agenda) : le mécanisme joue en
  mode « aujourd'hui » (GTFS-RT) ; les tests utilisent des dossiers de test explicitement marqués.

## Community
- Chaque plainte en attente a un **délai de réponse** (45 s, temps réel) affiché dans l'appli (« réponse
  rapide : encore 12 s », puis « répondre dans 20 s », en rouge sous 10 s).
- Réponse **rapide** (≤ 15 s) : les effets prévus par `data/messages.json` (bonne réponse → bonus existant).
  Réponse **tardive** : mêmes effets + le malus d'un mauvais commentaire (prompt 22 : réputation −3).
- **Expiration** : la plainte « s'envenime » — réputation −3, commentaire de l'usager, badge non lu, annonce
  `aria-live` ; elle n'attend plus de réponse.
- Le mail du soir récapitule : réponses à temps / tardives / plaintes restées sans réponse.
- Le délai est sauvegardé relativement à la reprise (comme les équipes).

## Vérifications
- `npm test` : effectif 12 → 17 → 20 → 42 (plafond), gravité moyenne → élevée, Q58 +8 avec un réel de 12 et
  un effectif de 22, gel à la décision, +5 durables après un raté (sauvegardés, remis à zéro le matin) ;
  Community : rapide (+2), tardive (+2 − 3), expiration à 45 s (−3), bilan du jour et ligne du mail, délai relatif
  dans la sauvegarde.
- Chromium FR / EN : « +12 min (réel) → +21 min actuellement », délai d'une plainte dans Community, aucune erreur
  console.
