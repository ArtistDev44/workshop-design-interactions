# Prompt 95 — Jeu « Nantes en régulation » : des journées synchronisées et expliquées

Demande d'origine (11/11/2026) :

> Il y a un problème avec les journées : il y a un manque de synchronisation et d'explication.

Diagnostic préalable, relevé dans le code et dans une partie réelle (Chromium) :

- **Deux horloges coexistent.**
  - L'indicateur « Partie sauvegardée à 18:18 » donne l'heure **réelle** de l'ordinateur, à côté d'une horloge de jeu à 20:00.
  - Les équipes comptent en **secondes réelles** (« retour dans 20 s ») : elles continuent d'avancer quand l'horloge du jeu est en pause (lecture d'un signalement) et ne suivent pas l'accélération ×100.
- **La vitesse du temps change sans le dire** : 1 min de jeu par seconde quand un signalement attend, ×100 quand il n'y en a aucun, pause pendant la lecture. Seul le panneau d'attente l'affiche.
- **L'écran de transition se trompe** : hors mode histoire, une semaine d'archive s'annonce « JOUR n — TEMPS RÉEL ».
- **Les semaines font 6 ou 7 jours**, car une journée sans événement réel n'est pas jouée. « Jour 1 sur 6 » ne dit pas pourquoi.
- **Des journées n'ont qu'un signalement**, et on attend sans savoir ce qui reste à venir dans la journée.

Objectif : **une seule horloge visible, celle du jeu**, et des journées qui s'expliquent d'elles-mêmes, sans ajouter de clic.

Règles :
- **Ne rien casser.**
  - Aucune modification de `game.js` (règles, effets, 1d6, jauges, fins) ni des données.
  - Les délais des équipes gardent leurs valeurs (20 / 40 à 60 / 10), exprimés désormais en minutes de jeu au rythme normal.
- FR + EN (`i18n.js`), clavier, `prefers-reduced-motion`, aucun flash, hors ligne, mobile, contraste ≥ 4,5:1.
- Règle de texte du prompt 93 :
  - `dessinerTexte` / `ajusterTaille`, zones déclarées ;
  - l'audit `?audit=textes&parcours=1` reste à 0 défaut A à D.
- `npm run build` et `npm test` verts.

## 1. Une seule horloge : celle du jeu

- **Horloge des équipes.**
  - Ajouter une horloge virtuelle `TEMPS_EQUIPES` (ms) qui avance avec le temps de jeu : × 1 au rythme normal, × 100 en temps accéléré, et 0 quand le temps est suspendu (lecture, fenêtres, pause, soir).
  - La passer à `Jeu.envoyerEquipe`, `equipesDisponibles`, `retourEquipe`, `phaseEquipe` et `majEquipes` à la place de `millis()`.
  - L'API de `game.js` prend déjà `maintenant` en paramètre : `game.js` n'est pas modifié.
  - La sieste (prompt 91) et la sauvegarde / reprise utilisent la même horloge.
- **Libellés** : « retour dans {n} min » (minutes de jeu), dans l'onglet Équipes, les messages de refus et le message du patron.
- **Sauvegarde** : l'indicateur affiche l'heure et le jour de jeu (« Partie sauvegardée à 14h20 · jour 2 »).

## 2. La vitesse du temps, toujours visible

Dans le bandeau, l'heure du jeu est précédée de son état :
- « ▶ » : temps normal, un signalement attend ;
- « ▶▶ ×100 » : aucun signalement en cours ;
- « ⏸ » : en pause (lecture, fenêtre, pause, soir).

Une infobulle explique la règle au survol.

## 3. Le début de journée explique la journée (sans clic de plus)

L'écran noir de transition (prompt 43) affiche :
- un **titre correct** :
  - « JOUR n/N — SEMAINE s » en mode histoire ;
  - « JOUR n/N » pour une semaine d'archive ;
  - « JOUR n — TEMPS RÉEL » seulement en mode direct ;
- la **date** du jour ;
- le **nombre de signalements réels prévus** ce jour-là ;
- le **service** : « 8h00 → 20h00 » ;
- le **rythme du temps** : normal, ×100 quand rien n'arrive, pause pendant la lecture ;
- **comment finir** : « Quitter la journée » (Q) ;
- le premier jour d'une semaine courte, **la raison** : « Semaine de 6 jours : aucun événement réel le dimanche 20 septembre ».

La transition dure un peu plus longtemps, reste passable par Entrée ou un clic, et le texte est annoncé en `aria-live`.

## 4. Ce qui reste dans la journée

- Dans la file des signalements, sous le titre : « reste n aujourd'hui · prochain vers 14h30 » (ou « dernier signalement de la journée »).
- Dans le panneau d'attente : « Jour n sur N · lundi 14 septembre ».

## 5. Vérifications

- `npm test` : ajouter des contrôles.
  - `TEMPS_EQUIPES` n'avance pas pendant une pause et avance ×100 en temps accéléré ;
  - une équipe envoyée arrive après 20 min de jeu ;
  - l'indicateur de sauvegarde est en heure de jeu ;
  - les titres de transition sont corrects (histoire, archive, direct) ;
  - les nouvelles clés existent en FR et en EN.
- Chromium, en FR et en EN : une journée de bout en bout.
  - transition lisible ;
  - indicateur de vitesse qui change d'état ;
  - équipe envoyée pendant la lecture qui n'avance pas tant que l'horloge est en pause ;
  - aucune erreur de console.
- Audit des textes : 0 défaut A à D (1920×1080 et mobile portrait).
- Documenter dans `jeu/91-journees-synchronisation.md`, et mettre à jour `jeu/README.md`, `prompts/README.md` et `journal.md`.
- Branche `95-jeu-journees-synchronisation-explication`, fusionnée dans `main`.
