# 04 — Jauges et fins

## Les trois jauges (0–100, décisions Q40, Q44)
- **Valeur de départ : 50** ; chaque action modifie une jauge de **±5 à ±15**
  points selon le contexte.
  *Prompt 87 — exception à Q40 :* hors « Défi chrono », le budget part de 60 / 50 / 40 selon la difficulté
  de la semaine (fluidité et réputation restent à 50).
- **Poids égaux** dans le score combiné (Q44, décidé : score = somme des 3 jauges).
| Jauge | Ce qu'elle mesure |
|---|---|
| Fluidité du réseau | Retards absorbés, trafic global de la semaine |
| Satisfaction usagers | Communication, renforts, temps d'attente vécus |
| Réputation du réseau (prompt 179 ; « de la salle de contrôle » auparavant) | Cohérence des décisions, gestion des crises |

Chaque action modifie les jauges selon le **contexte** du dossier (météo,
heure de pointe, affluence, source de données choisie en cas de contradiction).

## Les 3 fins (Q47–Q55)
**3 fins au total : bonne, moyenne, mauvaise** — déterminées par le **score
combiné** (somme des 3 jauges, 0–300, poids égaux Q44) :

| Fin | Seuil (Q48) | Scénario (Q49–Q51) | Ambiance (Q53) |
|---|---|---|---|
| **Bonne** | score ≥ 240 | La **direction félicite** la salle de contrôle | Décor clair, ensoleillé |
| **Moyenne** | 150 ≤ score < 240 | **Bilan neutre nuancé** : semaine correcte, quelques incidents mal gérés | Décor neutre |
| **Mauvaise** | score < 150 | La **direction réprimande**, en citant les incidents mal gérés | Décor sombre, pluvieux |

- Si une jauge passe **sous 20** en cours de partie : clignotement discret de la
  jauge (Q46).
- Le **texte de fin intègre le bilan détaillé complet** (Q54) : il reste générique
  sur les faits — les données concrètes de la semaine (pire retard, décisions clés)
  n'apparaissent que dans le bilan chiffré (Q52).
- **Boutons** (Q55, décidé) : Rejouer la même semaine / changer de semaine.

## Écran de fin (décisions verrouillées Q18, Q37)
Texte de fin (= bilan détaillé narratif, Q54) + valeurs finales des trois jauges +
nombre de dossiers traités / 15 + **décisions clés** (Q37) + teinte du décor selon
la fin (Q53) + boutons Rejouer / changer de semaine.

> **Prompt 84 — exception à Q47 : fin anticipée « licenciement ».** Comme la démission (prompt 47), le
> licenciement est une fin hors des trois fins de semaine (Q48 et Q55 inchangés). Mesure sur les trois jauges :
> vigilance (score < 120 ou deux jauges < 25) → rappel à l'ordre ; danger (score < 90 ou deux jauges < 20) →
> dernier avertissement ; toujours sous 90 le soir suivant, ou rechute en danger, → licenciement ; effondrement
> (score < 45 ou une jauge à 0) → licenciement immédiat. Hystérésis : sortie de vigilance à 140, du danger à 110.
> Pas de palmarès, sauvegarde effacée. Voir `jeu/77-rappel-licenciement-game-over.md`.

> **Prompt 207 — exception à Q47–Q55 : dix fins de semaine selon la posture.** La fin ne dépend plus du seul
> score : une table de dix fins, évaluée dans l'ordre (capture virale, burn-out, imposteur, fauteuil du patron = bonne
> fin, diplomate de Quai, insoumis, usagers d'abord, bouc émissaire, semaine correcte, réprimande), lit les gestes du
> joueur (clashs, réponses Quai, cafés, siestes, objectifs du jour, qualité des décisions). Le palier de score (Q48 :
> 240 / 150) garde le décor et le son (Q53) et sert de seuil au fauteuil et à la semaine correcte. Démission et
> licenciement inchangés. Table et seuils finaux : `jeu/207-dix-fins-posture.md`.
