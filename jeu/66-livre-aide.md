# 66 — Le livre « Commande » devient « Aide » (prompt 70)

Code : `immersion.js` (objet `aide`, titre pixel « AIDE » centré, `cibleGuide('livreAide')`, ouverture du
tutoriel), `bureau.js` (`COEF_OBJETS.aide`), `guide.js` (étape « livre »), `i18n.js` (`objet.aide` FR
« Livre « Aide » (tutoriel) », EN « “Help” book (tutorial) », et tous les textes qui nommaient le livre :
`stress.5`, `tuto.pied`, `guide.livre`, `guide.arrete`, `mp.tutoriel`). Glyphes A, I, D, E déjà présents.
Inchangés : `commandesCarte()` (zoom de la carte), `mp.mode.recommande` (« ★ RECOMMANDÉ »), règles Q1–Q61.

## Vérifications
- `npm run build`, `npm test`.
- Chromium FR + EN : couverture « AIDE », infobulle « Livre « Aide » (tutoriel) » / « “Help” book (tutorial) »,
  Tab + Entrée ouvre le tutoriel, le guide pointe `livreAide`, « ★ RECOMMANDÉ » / « ★ RECOMMENDED » intacts,
  aucune erreur console.
