# Prompt 38 — Jeu « Nantes en régulation », étape 25 : passage au PC par la molette, notifications d'événements sur le téléphone, pluie réaliste

Objectif, en trois points (retours de rendu du 10/11/2026) :
1. **Transition vers le mode PC avec la molette vers le haut** : au bureau, faire défiler la
   molette vers le haut (scroll up) fait s'installer au poste (même zoom et clignement que le
   clic sur l'écran) ; la molette vers le bas au poste fait toujours se lever (prompt 26).
2. **Téléphone cliquable** : un clic sur le téléphone du bureau affiche, sous forme de
   **notifications sur l'écran du téléphone**, les messages tirés de l'**API Agenda des
   événements de Nantes Métropole** (`244400404_agenda-evenements-nantes-metropole_v2`).
3. **Pluie plus aléatoire et plus réaliste** par la baie vitrée.

Les décisions Q1–Q61 et la boucle de jeu ne changent pas. S'appuie sur les prompts 25–37.

Fichiers concernés : `site/public/` (`bureau.js`, `sketch.js`, `immersion.js`, nouveau
`telephone.js`, `i18n.js`, `data/` pour le repli), plus `jeu/`, `jeu/api.md` et `journal.md`.

Règles absolues : aucune donnée inventée — chaque notification reprend un événement réel
de l'API (titre, lieu, date et heure tels que publiés) ; appel API dans `setup()` /
au clic, jamais dans `draw()`, avec délai maximal et **repli local** (événements réels de
la semaine jouée dans `data/semaines.js`, ou instantané de `data/fallback/`) ; aucun
fichier image ; textes d'interface via `t(...)` FR + EN ; contraste ≥ 4,5:1 ;
`prefers-reduced-motion` (pas de glissement des notifications, pluie fixe ou très lente).

## 1. Molette vers le haut → au poste
- En vue `bureau`, sans fenêtre ouverte : un geste de molette vers le haut (seuil cumulé +
  anti-rebond, comme au prompt 26) appelle `sAsseoir()`. Vers le bas au bureau : rien.
- L'aide (H) et le guide « Prendre en main » (prompt 37) mentionnent les deux sens.

## 2. Notifications d'événements sur le téléphone
- Le téléphone devient un objet cliquable de la pièce (survol, Tab, Entrée, infobulle).
- Au clic : l'écran du téléphone s'agrandit en **vue téléphone** (superposée, dessinée par
  le code : coque, heure, pile de notifications) qui affiche 3 à 5 notifications
  « Agenda Nantes Métropole » : titre de l'événement, lieu, date / heure, en texte réel.
- Source : Explore API v2.1 d'Open Data Nantes Métropole, événements du jour (ou de la
  journée simulée en cours), `limit` faible, champs sélectionnés ; hors ligne : événements
  réels de la semaine jouée (`Jeu.etat.semaine.evenements`) ou de l'instantané local.
- Animation : notifications qui glissent une à une (fixes si animations réduites) ;
  fermer par clic, Échap ou Entrée ; annonce `aria-live` du nombre de notifications.

## 3. Pluie réaliste
- Remplacer la pluie régulière (gouttes en grille) par une pluie **aléatoire** : gouttes
  de longueur, vitesse et opacité variables, légère inclinaison selon les rafales réelles
  du jour (`rafales_max`), intensité selon la pluie réelle (`pluie_mm`), quelques
  impacts / ruissellements sur la vitre ; graine pseudo-aléatoire pour éviter les motifs
  répétés ; animations réduites : pluie figée, peu dense.

## 4. Vérifications
- `npm run build` et `npm test` ; molette haut / bas au bureau et au poste ; téléphone en
  ligne et API bloquée (repli) ; FR + EN ; clavier seul ; `prefers-reduced-motion`.
- Documenter dans `jeu/33-scroll-telephone-pluie.md`, `jeu/api.md` + sommaire de `jeu/README.md`.
- Branche `jeu/prompt-38-scroll-telephone-pluie`. À chaque push : entrée en tête de `journal.md`.
