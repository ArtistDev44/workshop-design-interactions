# Prompt 191 — Rythme : une vallée entre les journées, le mail du soir comme scène

Source : `prompts/191-jeu-rythme-vallee-mail-du-soir-scene.md` (audit wikiHow, Partie 5 étape 2 « Concevez votre rythme »).
Couche de présentation seulement : aucune règle Q1–Q61 ni aucun effet de décision ne change.

## Enchaînement de fin de journée (après le prompt 191)

1. Horloge murale → `terminerJournee()` (`journee.js`) → phase `mail` : le mail du soir s'affiche dans l'écran du PC
   (`dessinerMail`, `immersion.js`) ; le lecteur d'écran annonce aussi le fait marquant et la phrase du patron.
2. « Ranger le poste » (Entrée) → `rangerPoste()` (`soir.js`) → phase `soir`.
3. **Respiration** (nouveau) : les 3 premières secondes du soir (`DUREE_RESPIRATION = 3000`).
4. Nuit installée : flèche « Sortie », sortie automatique après 8 s (prompt 94), pan, fondu, écran noir « Fin de la
   journée du … » → `finirSoir()` → SMS de Camille (veille d'inspection ou météo, prompt 189) → `journeeSuivante()`.
5. Écran « Jour N » (`annoncerJournee`, 9 s, prompt 180) avec, en tête des lignes, **l'accroche météo** (nouveau).
6. Démarrage du PC des jours 1–3 (prompt 71), rapport de la veille (`rapportVeille`, prompt 89 bis).

## 1. Le mail du soir devient une scène

- `Jeu.sceneDuSoir(duJour)` (`game.js`) renvoie `{ fait, niveau, patron }` ; `Jeu.mailDuJour()` l'expose en `scene`
  (les `lignes` du bilan sont inchangées : tests, rapport et Journal s'y appuient).
- **Fait marquant** (`Jeu.faitMarquantDuJour`) : choisi parmi les dossiers **réellement joués ce jour**
  (`Jeu.evenementsJournee`, même date). Priorité à la pire décision (évaluation ≠ « bon choix ! »), plus gros retard
  d'abord puis la plus tôt ; si toutes sont bonnes, la bonne décision au plus gros retard. Texte : heure, ligne (ou
  « Réseau »), nature (`externe`), retard s'il existe, décision prise et, si elle était ratée, la meilleure réponse.
  Aucun chiffre hors du dossier (pas d'heure d'arrivée ni de retard « retombé » : le jeu ne les mesure pas). Un dossier
  fictif garde son étiquette (`marquerFictif`). Sans dossier : « Aucun dossier n'a été réglé aujourd'hui. »
- **Phrase du patron** (`Jeu.niveauPatronDuJour`) : part des décisions « bon choix ! » de la journée — ≥ 2/3
  satisfait, < 1/3 inquiet, sinon (ou sans dossier) neutre (`Jeu.SEUILS_MAIL_PATRON`). 3 variantes par niveau
  (`mailf.patron.<niveau>[.v1|.v2]`, FR/EN), tirage déterministe par la graine et le jour (`hacher`), sans dé.
  Choix : trois niveaux seulement, sans croiser le ton par semaine du prompt 189 (`Jeu.tonPatron`) — 27 phrases de
  plus pour un gain faible ; le ton par semaine reste porté par les messages de l'appli « Mails ».
- **Bilan chiffré** : en dessous, sous un filet et le titre « Bilan de la journée », en 17 px, deux lignes au plus par
  entrée ; ce qui ne tient pas est dans le rapport papier et le Journal.

## 2. Respiration entre deux journées

Choix : **réutiliser la scène du soir existante** (prompt 69 : bureau de nuit, PC en veille, lampe) au lieu d'un
second écran. Ses 3 premières secondes deviennent la vallée :

- crépuscule raccourci de 4 à 2 s (`DUREE_CREPUSCULE`) : le ciel de la baie vire au noir en 2 s ;
- la lampe s'allume à mi-crépuscule (`lampeAllumee()`, sans toucher au réglage enregistré du joueur) ; le PC est en
  veille (halo réduit) depuis `seLever()` ;
- « Fin de journée. » / "End of day." discret en bas (bandeau sombre, blanc 26 px), annoncé au lecteur d'écran ;
- aucune jauge, aucun chrono ajoutés ; la consigne de la pièce (« La nuit tombe… ») est masquée pendant ces 3 s ;
  le temps de jeu est suspendu (phase `soir` dans `tempsSuspendu()`, inchangé) ;
- passable : clic n'importe où, Entrée ou Espace (`passerRespiration()`) → nuit installée, flèche « Sortie » ;
- animations réduites : nuit et lampe immédiates, texte fixe sans fondu ; sinon fondu doux (0,6 s / 0,4 s), pas de
  flash ;
- à la reprise d'une sauvegarde faite le soir, pas de respiration.

La partie n'est pas allongée : le soir dure 1 s de moins qu'avant (respiration 3 s au lieu de 4 s de crépuscule).

## 3. Accroche météo du matin

`Jeu.accrocheMeteo(date)` : première ligne de `lignesTransitionJour()` sur l'écran « Jour N » — « Météo réelle du jour
à Nantes : min à max °C, pluie mm, rafales km/h ». Exige `m.date === date` et les quatre valeurs numériques ; sinon
rien. Pas sur la transition courte de l'intro (titre et date seuls, prompt 112) ; le SMS météo de Camille (soir,
prompt 189) n'est pas dupliqué.

## Tests (`site/scripts/test-jeu.mjs`, bloc « Prompt 191 »)

Deux journées jouées : fait marquant tiré d'un dossier du jour (heure, ligne, nature, décision, aucun chiffre étranger),
tirage du patron stable, bilan présent ; trois niveaux ; clés FR/EN ; respiration ≤ 3 s, passable au clic, à Entrée et
à Espace, lampe allumée, animations réduites ; `tempsSuspendu()` sur une ligne ; accroche météo présente avec la
donnée du jour, absente sinon.
