# Prompt 108 — Jeu « Nantes en régulation » : les équipes sur le côté droit, plus nombreuses et adaptées au volume de la journée

Demande d'origine (12/11/2026) :

> Sur le côté droit de l'application, on a accès aux différentes équipes disponibles (je souhaite qu'elles
> soient un peu plus élevées, ou en tout cas adaptées au nombre de signalements de la journée sans que ce
> soit trop simple), et nous envoyons les équipes en drag and drop.

Quatrième des prompts 105 → 109.

## 1. Panneau des équipes (côté droit, x 1576 → 1880)

- **Un bloc par type :** police, ambulanciers, techniciens, pompiers.
  - Pictogramme, nom, centre d'intervention (prompt 109).
  - **Une pastille par équipe**, avec son état : disponible / en route / sur place / retour, et le temps
    restant.
- **Glisser une pastille disponible :**
  - sur **n'importe quel marqueur** de signalement arrivé → `Jeu.envoyerEquipe(index, type)` ;
  - ou sur la fenêtre flottante ouverte.
  - Pendant le glisser, les marqueurs acceptables sont entourés de pointillés.
- **Adaptée ou non :** le joueur peut envoyer n'importe quelle équipe ; le retour vient après le dépôt
  (prompt 102).
- **Clavier et tactile :** clic ou tap sur une pastille, puis sur un marqueur. Maj + 1–4 envoient au
  signalement ouvert.
- **Les équipes sont disponibles dès la semaine 1.** Avant, elles se débloquaient en semaine 2 : elles sont
  maintenant le geste principal de l'appli.

## 2. Effectifs adaptés au volume de la journée

- Aujourd'hui l'effectif est fixe par jour : police 2, ambulanciers 1, techniciens 2, pompiers 1.
- **Nouveau :** effectif du jour = base + ⌊signalements du jour ÷ 3⌋, plafonné.

| Type | Base | Plafond |
|---|---|---|
| Police | 2 | 4 |
| Ambulanciers | 1 | 3 |
| Techniciens | 2 | 4 |
| Pompiers | 1 | 3 |

- **« Pas trop simple » :**
  - durées d'intervention, coûts en budget et retour au centre inchangés ;
  - une équipe engagée reste donc indisponible longtemps (prompt 109 : trajet aller et retour) ;
  - une équipe non adaptée n'a que la moitié de l'effet.
- Le message du patron du matin donne les effectifs du jour **seulement si le panneau n'est pas visible**
  (prompt 103).

## Vérifications

- Les effectifs de chaque journée des trois semaines préparées sont notés dans le rapport.
- Simulation : 3 façons de jouer × 3 semaines (`npm test`). Une partie ne doit pas devenir triviale ;
  noter le nombre de refus « aucune équipe disponible ».
- `npm run build`, audit des textes à 0 défaut.
