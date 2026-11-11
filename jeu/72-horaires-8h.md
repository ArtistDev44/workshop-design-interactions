# Prompt 76 — des horaires réalistes : la journée commence à 8 h 00

Un centre de régulation n'ouvre pas à 6 h : la journée de jeu démarre à **8 h 00**.

- `game.js` : `DEBUT_JOURNEE = 8 * 60` (seule la constante et ses commentaires sont touchés) ; les
  créneaux d'arrivée des dossiers sans heure de source passent de 7 h–19 h à **8 h–19 h**, et un
  dossier daté avant 8 h dans les données est **calé à 8 h** (calcul — aucune donnée modifiée à la main).
- Propagation : commentaires (`immersion.js`, `sketch.js`, `soir.js`), textes i18n FR + EN
  (`sms.5`, `tuto.5.texte`, `guide.sortir`, `soir.demain`), docs (`jeu/13`, `jeu/64`, `jeu/README.md`).
- La fin de journée reste à **20 h** ; durée jouable et compteur de décisions inchangés ; Q1–Q61 inchangés.
- Toutes les heures affichées passent par le même formateur (`Jeu.formaterHeure` / `heureAffichee`).
