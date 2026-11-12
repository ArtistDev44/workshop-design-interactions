# Prompt 194 — Jeu : finir la journée = cliquer sur l'horloge, sans passer par le message du PC ; le tutoriel l'explique

Demande d'origine (12/11/2026) :

> Enlever le message sur l'ordinateur pour finir la journée : cliquer sur l'horloge devrait suffire. Aussi, le
> tutoriel devrait indiquer le rôle de l'horloge à la fin de la journée.

## Constat (code au 12/11/2026)

À l'heure de fin, un clic sur l'horloge murale (`clicHorloge`, `journee.js`) appelle `terminerJournee()`, qui passe
en phase `mail` : la pièce affiche alors « Un nouveau mail est arrivé sur le PC : cliquez sur l'écran (Entrée) »
(`bureau.mail`, `bureau.js` ~l.1012), le bandeau « lisez le mail de la direction, puis Entrée » (`etat.mail`), et
l'horloge répond « La journée est finie : lisez le mail du soir sur le PC » (`horloge.mail`). Le joueur doit donc
retourner au PC, lire le mail plein écran (`dessinerMail`, `sketch.js`) et appuyer sur Entrée (`rangerPoste`)
avant que le soir commence. Avant l'heure de fin, la pièce et le PC affichent aussi « Journée finie : cliquez sur
l'horloge murale… » (`bureau.finJournee`) et « FIN DE JOURNÉE · … touche Q … ou l'horloge murale » (`etat.finJournee`).

## À faire

1. **Le clic sur l'horloge suffit** : à l'heure de fin (et après « Partir quand même »), `terminerJournee()` enchaîne
   directement sur le soir (`rangerPoste()` : poste rangé, crépuscule, respiration du prompt 191, sortie), sans
   phase d'attente du mail sur le PC. La touche Q (`quitterJourneeRapide`) suit le même chemin. Ce qui doit rester
   avant le soir reste : licenciement (prompt 84), rapport / récapitulatif du soir (`tachesFinJournee`, prompt 88).
2. **Le mail du soir n'est plus un passage obligé** : son contenu (fait marquant, phrase du patron, bilan compact,
   prompt 191) arrive comme un **mail non lu dans l'appli Mails** (prompt 185), consultable le lendemain, et reste
   dans le Journal. Le fait marquant et la phrase du patron sont annoncés au lecteur d'écran au clic sur l'horloge
   (comme aujourd'hui). Aucune donnée inventée.
3. **Supprimer les messages devenus inutiles** : `bureau.mail`, `etat.mail`, `horloge.mail` et le rendu plein écran
   du mail (`dessinerMail` et la touche Entrée associée) s'ils ne servent plus ; garder `bureau.finJournee` /
   `etat.finJournee` seulement s'ils disent « cliquez sur l'horloge » sans renvoyer au PC — sinon les retirer
   aussi (l'horloge porte déjà son infobulle « Horloge : finir sa journée »). Mettre à jour les tables de fenêtres
   et de phases (`tempsSuspendu`, `sauvegarde.js` : une sauvegarde en phase `mail` reprend au soir), le guide,
   `audit-textes.js` (étape « mail du soir ») et les tests.
4. **Tutoriel** : l'étape « La fin de journée » (`tuto.6.*`) explique le rôle de l'horloge murale : quand l'heure de
   fin est atteinte, l'horloge s'arrête ; un clic dessus (ou Q) termine la journée ; avant l'heure, elle propose de
   partir plus tôt, avec ses conséquences. Le mail du soir est à lire dans Mails. FR et EN, dans le cadre actuel.
5. Aide (`aide.js`, règles et raccourcis) et `jeu/174-raccourcis.md` cohérents avec ce chemin.

## Vérifications

- `npm run build` puis `npm test` dans `site/` (tests : clic horloge à l'heure de fin → phase `soir` sans phase
  `mail` ; Q idem ; mail du soir présent et non lu dans Mails ; clés supprimées absentes en FR et EN ; tutoriel
  qui mentionne l'horloge).
- `prompts/README.md` et `journal.md` mis à jour.
