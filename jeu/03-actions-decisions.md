# 03 — Actions et décisions

## Les 4 choix par dossier (table verrouillée Q57–Q61)
Effet final = **effet de base + 1d6** (dé à 6 faces, Q61), avec modificateurs
contextuels (météo, heure de pointe, affluence — Q24).

| Action | Effets de base |
|---|---|
| Dévier la ligne | Fluidité −10, Satisfaction +5, Réputation 0 (base en 5/10 + aléa, Q57) |
| Retenir en terminus | Fluidité −7, Satisfaction −12, Réputation +8 si retard > 20 min sinon +4 (valeurs hors 5/10, Q58) |
| Bus de renfort | Fluidité +12, Satisfaction +8, Réputation −3 (Q59) |
| Ne rien faire | −2 à −8 sur une **jauge tirée au hasard** (Q60) — distinct du timer à 0 (Q25) |

« Communiquer aux usagers » est un **effet secondaire** de certaines actions
(ex. dévier inclut une communication automatique) — il n'est pas une 4e action
(Q28).

## Règles
- **3 actions + « ne rien faire »** : la décision doit rester lisible en 1920×1080.
- Effets **contextuels** : calculés par **table fixe + modificateurs** (Q24) —
  chaque action a un effet de base, modulé par la météo, l'heure de pointe et
  l'affluence du dossier.
- Si le compteur atteint 0 sans choix : « ne rien faire » est appliqué, avec les
  seules conséquences naturelles du dossier (Q25).

> **Prompt 89 (pression morale) — Q25 expliqué, sans changement de valeur.** Un signalement non traité affiche
> le calcul de ses conséquences naturelles à partir du dossier réel (« retard 25 min → fluidité −5 »), dans la file
> et à l'annonce de fin de service.

> **Prompt 87 — exceptions à Q5 et Q57–Q60 : réponses par catégorie.** Chaque dossier reçoit une catégorie
> calculée sur ses champs réels (accident > météo > retard > travaux > affluence). Chaque catégorie propose 4
> réponses rédigées (`site/public/data/reponses.json`), dont une « ne rien changer » ; elles passent par la même
> formule (base + 1d6, Q61, bonus ×1,25 dans les situations où la réponse est la plus adaptée) et `Jeu.evaluer`
> compare avec la meilleure réponse de la même catégorie. Aucune réponse n'est dominante : chacune est la
> meilleure dans au moins un contexte réel (contrôlé par `npm test`). La table Q57–Q60 reste le repli d'un
> dossier sans catégorie. Hors « Défi chrono », le compteur à 0 n'existe plus (voir `01-boucle-gameplay.md`).

> **Prompt 79 — retard effectif.** Le « retard » lu par Q58 (Retenir : +8 si > 20 min), par la gravité (élevée
> ≥ 20 min, moyenne ≥ 10 min), par les conséquences naturelles d'une « ligne en difficulté » (retard / 5) et par le
> conflit A / B (retards à 5 min près) est désormais le **retard effectif** : retard réel de la source + 1 min
> toutes les 2 minutes de jeu depuis l'arrivée du dossier (plafond +30), figé au moment de la décision, + 5 min
> durables sur la ligne après une décision « raté » ou « trop tard » (plafond +15, jusqu'au soir). Seuils et
> effets de base inchangés (`REGLAGES.aggravation`, `jeu/75-retards-aggravation-community.md`).
