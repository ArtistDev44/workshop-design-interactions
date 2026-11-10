# Prompt 76 — Jeu « Nantes en régulation », étape 58 : des horaires réalistes, la journée commence à 8 h 00

Demande d'origine (11/11/2026) :

> Pour les horaires, cela ne fait jamais 8 h, ce n'est pas réaliste.

Aujourd'hui la journée de jeu démarre à **6 h 00** (`game.js` : `DEBUT_JOURNEE = 6 * 60; // 6h00`,
repris par `Jeu.debutJournee()` et `Jeu.horloge.minutes = Jeu.debutJournee()` ; commentaire
`immersion.js` : « on arrive au bureau : l'ouverture est à 6 h » ; prompt 69 : « lendemain 6 h »).
Un centre de régulation n'ouvre pas à 6 h : rendre les horaires réalistes.

## Attendu

1. **Début de journée à 8 h 00** : `DEBUT_JOURNEE = 8 * 60` (valeur verrouillée et documentée dans
   `REGLAGES` / commentaires), propagé partout où l'heure de début intervient :
   - `game.js` (`DEBUT_JOURNEE`, `Jeu.debutJournee()`) ;
   - `immersion.js` (commentaire « ouverture à 8 h », éventuel texte d'arrivée au bureau) ;
   - `jeu/64-fin-de-journee-nuit-sortie.md` et `jeu/` : « lendemain 8 h » ;
   - la fin de journée reste à 20 h (prompt 51/69) : la journée jouée passe donc de 8 h à 20 h.
2. **Cohérence des horaires affichés** : horloge du bureau, horloge de la barre des tâches
   (`heureAffichee()`), bandeau d'état du jeu, écrans « Jour n », mail de fin de journée, rapport —
   aucune heure affichée ne contredit le début à 8 h (vérifier les textes i18n FR + EN qui citent 6 h).
3. Les horaires des dossiers (semaines enregistrées, `data/semaines/*.json`) commencent au plus tôt à
   8 h ; si un dossier est daté avant 8 h dans les données, il est clampé à 8 h (calcul, pas de donnée
   modifiée à la main).

## Contraintes

- Règles Q1–Q61 inchangées ; la durée de journée jouable et le compteur de décisions ne changent pas
  (seule l'heure de départ affichée/calculée change) ; `game.js` : seule la constante de début et ses
  commentaires sont touchés, effets identiques.
- Toutes les heures affichées passent par le même formateur (pas de « 6h00 » qui traîne).

## Vérifications

- `npm run build`, `npm test` dans `site/` ; partie réelle FR + EN : la journée démarre bien à 8 h 00
  (horloge du bureau, barre des tâches, écran « Jour n », premier dossier), fin toujours à 20 h, rapport
  et mails cohérents ; sauvegarde/reprise à cheval sur le changement d'heure cohérente ; aucune erreur
  console.
- Doc : `jeu/72-…` (nouvelle doc), `jeu/README.md`, `prompts/README.md`, `journal.md` à jour.
- Branche `jeu/prompt-76-horaires-8h`. À chaque push : entrée en tête de `journal.md`.
  Fusion `main` sur demande.
