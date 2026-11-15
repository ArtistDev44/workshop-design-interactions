# Prompt 225 — Jeu : pas de notification du téléphone avant le début de la journée

Origine : demande du 15/11/2026 (« régler les problèmes de début de journée, quand un message sur le téléphone apparaît
avant le début de la journée »). Statut : **exécuté le 15/11/2026**.

## Constat (lecture du code, à confirmer en le reproduisant)

`majNotifsTel()` (`notifs-tel.js`) tourne à chaque image dès que `ecran === 'jeu'`, hors menu, hors `fin` et `soir`.
Rien n'y attend que la journée ait **vraiment** commencé :

- pas de garde pour la transition de jour (`TRANSITION_JOUR`), la phase `reveil`, le démarrage du PC (`pcDemarre`,
  `JOUR_PC.attendu`), un SMS en cours (`smsActif`), le tutoriel ou le guide, ni les fenêtres du matin (mail du patron
  `blame`, `rapportVeille`, tâche) ;
- au changement de date, `NotifsTel.maj` reconstruit le plan du jour, puis livre tout ce qui est dû (`minute <= now`)
  et les **événements de partie** (`evenementsPartie`) sans tenir compte de l'heure : alerte de jauge sous 30,
  avertissement du patron de la veille, plaintes encore en attente, badges… Ils tombent dès la première image du jour,
  pendant l'écran de transition ou le réveil ;
- la file `attente` de la veille n'est vidée qu'au changement de date : un reste du soir peut ressortir le matin.

## À faire

1. **Reproduire** (Chromium, 1920 × 1080 et 412 × 915) : finir le jour 1 avec une jauge sous 30 et une plainte en
   attente, passer au jour 2 ; noter chaque notification affichée, son heure de jeu et l'écran au-dessus duquel elle
   apparaît (capture avant / après dans `jeu/225-captures/`).
2. **Une règle unique** `journeeCommencee()` : transition terminée, phase de jeu (`attente`, `selection`, …) et non
   `reveil`, PC démarré, aucun SMS, tutoriel, guide ni fenêtre du matin ouverts, horloge ≥ `Jeu.debutJournee()` et
   en marche. Tant qu'elle est fausse : **aucune** notification spontanée, aucun son, aucune vibration, aucune annonce.
3. Ce qui devient dû pendant ce temps est **gardé**, pas perdu : livré quand la journée commence, **regroupé** (une
   seule notification « +n autres », la plus importante d'abord), 2 s après le début, jamais sur une décision ouverte.
4. Événements de partie : datés du jour joué ; un événement de la veille (avertissement, plainte en attente) n'est
   annoncé le matin qu'une fois la journée commencée, et une seule fois.
5. Changement de jour : la file `attente` et la notification spontanée de la veille sont vidées au soir ; le
   téléphone posé sur le bureau ne vibre pas pendant la nuit ni la transition.
6. Sauvegarde / reprise en début de journée : même règle (pas de rafale à la reprise).

## Vérification

`npm run build`, `npm test` (contrôles : `journeeCommencee` fausse pendant transition, réveil, démarrage du PC, SMS ;
aucune notification livrée avant ; livraison groupée après ; rien de la veille ne ressort deux fois) ; reproduction
du point 1 refaite : aucune notification avant le début ; audit des textes à 0 en 1920 × 1080, 1366 × 768, 412 × 915.

## Reproduit (avant)

Chromium 1920 × 1080, semaine archivée, fin du jour 1 avec la réputation à 22 et une plainte en attente, passage au
jour 2 : à **8 h 00**, pendant l'écran noir « JOUR 2/6 », PC encore éteint, l'alerte « jauge réputation » est livrée
(son d'alerte, annonce au lecteur d'écran, téléphone qui vibre ensuite sur le bureau). Capture :
`jeu/225-captures/avant-transition-jour2.png`. Même résultat en 412 × 915.

## Fait

- `notifs-tel.js` : `journeeCommencee()` — transition finie, PC démarré (`JOUR_PC.attendu`, `pcDemarre`), aucun SMS,
  tutoriel, guide, cinématique, licenciement ni fenêtre du matin (`blame`, `rapportVeille`, tâche…), phase de jeu (ni
  `reveil`, ni `soir`, ni `fin`), horloge ≥ début de service. Tant qu'elle est fausse, `majNotifsTel` ne livre rien.
- Ce qui devient dû est gardé : quand la journée commence, après **1 s** réelle (2 s retenaient près de 3 h de jeu,
  le temps filant à ×100), `NotifsTel.maj` livre une seule notification spontanée, l'alerte d'abord, « +n autres ».
- Le soir et à la fin, la file spontanée et la notification affichée sont vidées : rien ne ressort le lendemain, le
  téléphone ne vibre pas la nuit (les notifications restent dans le centre).
- Avertissement du patron et plaintes en attente : identifiant sans date — notifiés une fois, pas chaque matin.
- Reprise d'une sauvegarde : même règle (rien avant que la journée ait repris).

## Vérifié

- `npm run build`, `npm test` (+5 contrôles : `journeeCommencee` fausse pendant transition, démarrage du PC, SMS,
  rapport de la veille, soir, avant 8 h ; rien livré, ni son ni annonce ; une notification groupée après ; file vidée
  le soir ; avertissement notifié une fois).
- Reproduction refaite (1920 × 1080 et 412 × 915) : plus rien pendant la transition ni le démarrage du PC ; première
  notification une fois la journée commencée, « jauge réputation » + 3 autres regroupées
  (`jeu/225-captures/apres-journee-commencee.png`).
- Audit : 0 défaut de texte, 0 cible sous 44 px CSS en 1920 × 1080, 1366 × 768, 412 × 915.
