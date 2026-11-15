# Prompt 224 — Jeu : l'équipe promise doit être glissée dans son champ

Origine : demande du 15/11/2026 (« pour certains dossiers de la carte, il faudrait pouvoir glisser les unités d'équipe
dans les champs convenus à chaque réponse. Par exemple, je dis que j'envoie une équipe de pompiers, je dois déplacer
l'unité de pompier dans le champ dédié. Si je ne le fais pas, des conséquences apparaissent »). Statut : **exécuté le 15/11/2026**.

## Constat

Cinq réponses promettent une équipe (`data/reponses.json`, champ `equipe`) : travaux → navette (techniciens),
affluence → agents (police), météo → inspection (techniciens), accident → secours (ambulance), sécurité → intervenir
(police). Les choisir n'envoie personne : la promesse est gratuite, l'envoi d'équipe (glisser un jeton) est un geste à
part, sans lien avec la réponse.

## À faire

1. **Promesse** : choisir une réponse qui annonce une équipe (équipes débloquées) crée un **champ dédié** pour ce
   dossier : case en pointillés au pictogramme de l'unité attendue, nom du lieu, compte à rebours (**45 s** de jeu ;
   pause, ralenti et sieste comme les équipes).
2. **Où** : dans le panneau des équipes de la carte, sous les jetons (« À envoyer »), et à côté du marqueur du dossier
   sur la carte. Glisser le **bon** jeton dans le champ (ou dans le marqueur) l'envoie (`Jeu.envoyerEquipe`, coût et
   règles inchangés) et tient la promesse. Mauvais jeton : refusé, le champ dit l'unité attendue.
   Clavier : Maj + 1 à 4 remplit le champ en attente le plus ancien qui attend cette unité ; mobile : toucher le jeton
   puis le champ.
3. **Conséquences** si le temps s'écoule (ou la journée finit) sans le bon jeton : réputation −6, fluidité −3, malus
   « promesse non tenue » (table des malus, aide H), message du plaignant / du patron, annonce lecteur d'écran.
   Promesse tenue : rien de plus que l'envoi normal (remerciement du plaignant au retour).
4. Équipe indisponible ou budget insuffisant au moment du dépôt : le refus est dit comme aujourd'hui ; le champ reste
   jusqu'à l'échéance (une autre unité peut se libérer).
5. Sauvegarde / reprise : les promesses en cours sont gardées (délais relatifs, comme les équipes).
6. FR + EN, contraste, focus, `prefers-reduced-motion` (pas de clignotement du compte à rebours).

## Vérification

`npm run build`, `npm test` (promesse créée par la réponse, tenue par l'envoi du bon jeton, conséquences à l'échéance,
reprise) ; audit des textes et des cibles à 0 en 1920 × 1080, 1366 × 768, 412 × 915 ; essai Chromium : réponse
« secours », glisser l'ambulance dans le champ.

## Fait

- `game.js` : `REGLAGES.promesse` (45 s, réputation −6, fluidité −3), `Jeu.promettreEquipe` (réponse avec `equipe`,
  équipes débloquées, unité pas encore envoyée), `Jeu.majPromesses` (échéance au temps des équipes),
  `Jeu.romprePromessesDuJour` (appelée par `finDeJourneeTactique`), `Jeu.promessePour`. `Jeu.envoyerEquipe` accepte
  l'unité promise sur un dossier déjà répondu (sinon « équipe inutile », inchangé) et tient la promesse. Malus
  « Promesse non tenue » dans la table (aide H, icône `circle-x`), message du patron. Sauvegarde : délais relatifs.
- `sketch.js` : promesse créée à la décision (annonce + message sous les équipes) ; rupture dite, son d'alerte.
- `carte-alertes.js` : section **« À envoyer »** sous les jetons — un champ par promesse (case en pointillés au
  pictogramme attendu, lieu, secondes ; à 15 s ou moins, couleur d'alerte, sans clignotement). Glisser le bon jeton
  (ou le choisir puis cliquer le champ) envoie l'équipe ; un autre jeton est refusé avec l'unité attendue.
- `carte.js` : Maj + 1 à 4 hors d'un dossier ouvert remplit le plus ancien champ qui attend cette unité ; mobile :
  toucher le jeton hors dossier l'envoie vers ce champ (`indexDepotEquipe`).
- Hors champ : pas de champ à côté du marqueur (le dossier répondu sans équipe quitte la carte) — le champ est dans le
  panneau des équipes.

## Vérifié

- `npm run build`, `npm test` (+6 contrôles : promesse seulement pour une réponse à équipe, tenue par le bon jeton,
  autre unité inutile, rupture à 45 s avec −6 / −3 et malus, sauvegarde, fin de journée).
- Chromium 1920 × 1080 : réponse « agents » sur un événement → champ « Police · Exposition · 45 s » ; vrai glisser du
  jeton Police dans le champ → « Police en route (−10 budget). Promesse tenue. » ; sans rien faire, 45 s plus tard :
  réputation 59 → 53, fluidité 50 → 47, « Promesse non tenue… » ; Maj + 1 remplit le champ.
- Audit : 0 défaut de texte, 0 cible sous 44 px CSS en 1920 × 1080, 1366 × 768, 412 × 915 (écran « équipe promise »
  ajouté au parcours).
