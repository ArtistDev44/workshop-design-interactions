# 77 — Rappel à l'ordre, licenciement et écran « game over » (prompt 84)

Code : `game.js` (`REGLAGES.licenciement`, `Jeu.statutPatron`, `Jeu.niveauBrut`, `Jeu.majStatutPatron`,
`Jeu.finJourneeStatut`, `Jeu.livrerSanctions`, `Jeu.lettreLicenciement`, mail du soir, conseil, sauvegarde),
`gameover.js` (nouveau), `journee.js`, `os.js` (Patron, Indicateurs), `sketch.js`, `i18n.js`.
Exception à Q47 documentée dans `jeu/04-jauges-et-fins.md`. Effets des actions, dés et graine inchangés.

## Niveaux (calculés à chaque changement de jauge et après chaque décision)
| Niveau | Condition | Affiché |
|---|---|---|
| Vigilance | score < 120 ou deux jauges < 25 | pastille orange « Sous surveillance » |
| Danger | score < 90 ou deux jauges < 20 | pastille rouge « Dernier avertissement » |
| Effondrement | score < 45 ou une jauge à 0 | licenciement immédiat |

Hystérésis : sortie de la vigilance à score ≥ 140, du danger à ≥ 110.

## Sanction progressive
- **Rappel à l'ordre** (entrée en vigilance, une seule fois) : message du patron mis en avant (bulle rouge,
  bip, `aria-live`) avec les vraies valeurs, la jauge la plus basse et la dernière décision ratée.
- **Dernier avertissement** : immédiat en danger, ou en fin de journée si la vigilance dure depuis un jour
  précédent. Le mail du soir s'ouvre dessus, en rouge.
- **Licenciement** : (a) le soir qui suit la réception du dernier avertissement si le score est toujours < 90 ;
  (b) effondrement ; (c) retour en danger après en être sorti. Jamais au milieu d'une décision : après la
  narration, ou en fin de journée avant le mail. Dernier jour de la semaine : pas de (a), la semaine finit
  normalement et le mail mentionne l'avertissement en cours.
- **Rattrapage** : sortir de la vigilance efface un avertissement (« La salle remonte à 142, je lève la
  surveillance »). La démission (prompt 47) reste possible et distincte.
- **Panne de messagerie** : le compteur d'avertissements change tout de suite ; le message attend la fin de la
  panne ; le délai (a) compte à partir de sa réception.

## Écran « LICENCIÉ » / « FIRED »
Fondu au noir 0,8 s (immédiat si animations réduites), bip grave, musique coupée en fondu. Lettre du patron
(papier, tampon « RÉSILIÉ ») : date et heure du jeu, jauges et score finaux, avertissements et leurs dates,
décisions les plus coûteuses, malus le plus fréquent, cause, conseil tiré de la jauge la plus basse.
Boutons : Rejouer la même semaine (Entrée), Changer de semaine (Échap), Revoir le journal (J) ; Tab / ← →.
Sauvegarde effacée, pas de palmarès, ni défis ni progression de l'histoire ; compteur local
`pxe-nte001-licenciements`.

## Aide
Aide (H) : paragraphe « Le patron vous surveille » ; guide (étape jauges) ; Indicateurs : « Statut auprès du
patron » ; conseil contextuel : « Encore N points de score et la salle sort de la surveillance ».

## Vérifications
- `npm test` : seuils et hystérésis, rappel unique, rattrapage, dernier avertissement immédiat ou le soir
  suivant, licenciement le lendemain soir, effondrement, file pendant la panne, sauvegarde, lettre réelle, ni
  palmarès ni défis.
- Chromium FR / EN : pastille, message mis en avant, écran « game over », journal, Rejouer ; semaine bien gérée
  (score 169) sans avertissement ; aucune erreur console.
