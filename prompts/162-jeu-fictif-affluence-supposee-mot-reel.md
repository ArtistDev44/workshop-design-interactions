# Prompt 162 — Jeu : « Fictif » et « affluence supposée » partout, « réel » réservé à la source

Source : revue UX du 12/11/2026 (`ux-informations-2026-11-12.md`, constat 2 et « Informations manquantes » ;
volets A § 4, § 7 ; B § 6, § 7 ; C § 2, § 9, § 10, § 11, § 12 ; D constat 2, § 1, § 6, § 8, § 11, § 14, § 17).
Suite n° 3 proposée par la revue, exécutable sans arbitrage.

Règle de `grammar.md` (prompts 119 et 134) : l'incident fictif hebdomadaire est **toujours marqué « Fictif »** ;
l'affluence d'un événement de l'agenda est une **hypothèse du jeu**. Les cartes de source et `chaine.source` (« pas une
donnée réelle ») tiennent cette règle ; les voix (usagers, Camille, patron, bilans) la perdent.

## À faire

### Incident fictif marqué sur chaque trace
Partout où un dossier `fictif` (ou ce qui en découle) est dit, ajouter l'étiquette existante (`fictif.badge` ou une
forme courte « Fictif · ») :
- titre de la fenêtre du dossier (préfixe, pas seulement le badge sous la bulle) ;
- Community : post, plaintes, mentions liés au dossier ; notifications du téléphone ;
- mail du soir et journal du game over (`Jeu.ligneMail`) ; faits proposés au rapport du soir, carnet, « Fait
  marquant », décisions clés (rapport, journal).

### Compter juste
- `transition.prevus` (« n signalement(s) réel(s) ») et `piece.dossiers.jour` (« n dossier(s) réels ») et la consigne
  du patron : ne plus appeler « réels » des dossiers qui incluent l'agenda et le fictif ; forme proposée
  « n dossier(s) : r perturbation(s) réelle(s), a événement(s) de l'agenda, 1 fictif » (ne citer que les parts non
  nulles).

### Affluence dite comme une hypothèse
- `phrase.affluence` (« X attire du monde ») → « Événement à l'agenda : X (le jeu suppose de l'affluence) » ou
  équivalent court ;
- type « Affluence signalée » → « Affluence supposée » (carte, infobulle, titre, annonces) ;
- tâche « Préparer un événement » (« L'affluence est attendue vers 13h00 ») → « Le jeu suppose une affluence vers … » ;
- causes d'info trafic « Affluence : {nom} » → « Affluence supposée : {nom} » ; « Retard mesuré » proposé seulement
  s'il y a un retard connu ;
- source Agenda de l'enquête : ajouter « affluence : hypothèse du jeu » à côté de « Événement réel du jour » ;
- modèles de plaintes d'affluence de `data/messages.json` qui affirment la foule (« serrés comme des s@#!nes ») :
  passer au doute ou au conditionnel, et ne plus insérer la nature brute de l'agenda comme un nom (« « Stage - Atelier
  - Activité à partager » et vous mettez… ») : utiliser le nom de l'événement.
- `phrase.alerteMeteo` : nombres à la française (`nombreFr`) et ne pas emprunter « Vigilance » (vocabulaire
  Météo-France) pour un seuil du jeu (« pic de la semaine »).

### « Réel » réservé aux données de la source
- Crédits `credits.ia.donnees.v` « réelles, rien n'est inventé » → « réelles ; un incident fictif par semaine au plus,
  marqué ; affluence supposée par le jeu » (FR/EN).
- `fin.sources` « Aucun événement inventé » → mention de l'incident fictif marqué.
- `mp.mode.sous` « une semaine réelle, une quinzaine de signalements » → dire la part (2 à 4 perturbations réelles,
  des événements de l'agenda).
- Rapport page 2 `rapport.chiffresTitre` « Chiffres réels de la semaine » → « Votre semaine en chiffres » ;
  `stats.valeur` / `defi.tenu` « valeur réelle » → « valeur ».
- Ne pas toucher à la fonction `dessinerFin` (traitée au prompt 163).

## Vérifications

- Partie jouée jusqu'au dossier fictif : l'étiquette apparaît dans le dossier, Community, le téléphone, le mail du soir
  et le rapport du soir.
- `grep -n "réel" site/public/i18n.js` : chaque occurrence restante désigne une donnée de la source.
- `npm run build` puis `npm test` (étendre le test des textes si utile) ; `prompts/README.md` et `journal.md`.
