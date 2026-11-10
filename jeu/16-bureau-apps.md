# 16 — Le PC devient un poste de travail (prompt 22)

Adapté à l'architecture actuelle : les applications sont des **fenêtres du système RégulOS** (bureau du PC), à côté de l'appli « Régulation Nantes », au style du Pixel Design System. Fichiers : `site/public/os.js`, `game.js`, `sketch.js`, `bureau.js`.

## Applications
| Icône | App | Contenu (données réelles uniquement) |
|---|---|---|
| Enveloppe | Patron | Consigne au début de chaque journée (nombre réel de dossiers), alerte quand une jauge passe sous 20 (une fois par jauge et par jour), réaction après un dossier raté ou expiré (action choisie / meilleure action calculée). |
| Carte | Carte des incidents | Carte de Nantes dessinée à partir des vraies données (Loire/Erdre, tracés des 96 lignes) ; l'incident actif est placé au **centre réel du tracé de sa ligne** (sinon au centre, « lieu non précisé par la source »). Envoi d'équipes (tableau ci-dessous). |
| Bulle | Community | Un commentaire nantais après chaque dossier traité (modèles courts remplis avec la ligne/le retard réels, pseudonymes fictifs) ; bon choix → réputation +2, sinon −3 ; arrivée d'une équipe → +1. |
| Livre | Journal | Journal de la journée : lignes du mail (prompt 21) + équipes envoyées (coût, heure d'envoi, arrivée). |

Ouverture : clic sur l'icône (bureau ou barre des tâches) ou Tab + Entrée ; re-cliquer l'icône referme ; Échap ferme l'app, puis un second Échap fait se lever ; se lever referme l'app. Le temps ne s'arrête pas pendant la lecture. Pastilles rouges = messages non lus / incident sans équipe.

## Équipes (game.js, `Jeu.EQUIPES`)
| Équipe | Coût budget | Effets à l'arrivée |
|---|---|---|
| Ambulance | 15 | réputation +8 |
| Police | 10 | réputation +5, fluidité +3 |
| Techniciens | 12 | fluidité +10 |
| Pompiers | 15 | réputation +6, fluidité +6 |
Une équipe par incident ; refus explicite si le budget est insuffisant ; arrivée **20 s (réelles)** après l'envoi ; effets bornés 0–100 comme `Jeu.decider`. Touches 1–4 dans la carte.

## Jauges : Fluidité / Réputation / Budget
La « satisfaction » devient le **budget** ; score = somme des 3 (Q44 inchangé). Nouvelle table (ordre fluidité, réputation, budget ; base + 1d6, Q57–Q61 inchangées) :
| Action | Fluidité | Réputation | Budget |
|---|---|---|---|
| Dévier la ligne | −6 | +6 | −3 |
| Retenir en terminus | −7 | +8 si retard > 20 min, sinon +4 (Q58) | +2 |
| Bus de renfort | +12 | +4 | −12 |
| Ne rien faire | −2 à −8 sur une jauge au hasard (Q60) | | |
Modificateurs (Q24) : météo → fluidité ; heure de pointe et affluence → réputation. Conséquence naturelle d'un événement non traité et malus de sieste : réputation. Malus « mauvaise source » (Q31) : réputation.
Équilibre : le bus de renfort reste le meilleur en moyenne (+4 attendu) mais coûte cher en budget, partagé avec les équipes — à affiner au prompt 23.
