# Prompt 205 — Jeu : rendre la partie jouable en mobile portrait (ou l'assumer hors périmètre)

Origine : constat 1 de l'audit UX (`jeu/203-audit-ux.md` § 8, captures `jeu/203-captures/06-mobile.jpg` et
`07-mobile-applis.jpg`). Statut : **à exécuter**.

## Constat (13/11/2026, 412 × 915, Chromium)

- En partie, le bandeau (jauges, priorités, date) est rendu à l'échelle du canevas 16:9 : 5 à 6 px de texte à l'écran.
- En haut de l'écran, « Somnolence » et une autre étiquette s'écrivent l'une sur l'autre.
- Vue dossier : carte réduite en haut **et** fiche dessous ; Community n'occupe que le quart supérieur, le reste est noir ;
  le rapport de la semaine est une vignette illisible.
- Le menu est utilisable, mais le titre est coupé (« Nantes en régulat… ») et le bloc FR / EN couvre le haut.
- L'audit des textes (`?audit=textes&parcours=1`) annonce 0 défaut à 412 px : il mesure le texte avant la mise à
  l'échelle du canevas et ne voit donc rien de tout cela.

## Étape 0 — décision du groupe (à demander avant de coder)

- **A. Hors périmètre** : en portrait sur téléphone, après le menu, un écran « Tournez votre téléphone ou jouez sur
  ordinateur » (l'avis du prompt 60a, retiré au 60b) ; le menu, les crédits et les livrables restent accessibles.
  Effort : ~1 h.
- **B. Mise en page portrait du poste** : une vue à la fois en plein écran (carte · fiche · Community · Mails · Journal),
  barre d'onglets en bas (≥ 44 px), bandeau réduit à trois pastilles chiffrées (F / R / B avec la valeur) + l'heure,
  fiche du dossier en feuille qui monte du bas, réponses en boutons pleine largeur. Effort : plusieurs jours.

Sans réponse, faire **A** (le jeu est exposé sur ordinateur à l'ESD) et garder B comme piste.

## Dans tous les cas

1. Ajouter à `audit-textes.js` un contrôle de **taille rendue à l'écran** : taille du texte × échelle du canevas
   (`width / L` et, au poste, l'échelle de `ECRAN_POSTE`) ≥ 12 px CSS ; défaut de catégorie « T » sinon.
2. Corriger le menu en portrait : titre sur deux lignes ou taille ajustée, pile FR / EN · plein écran · télécharger
   sous le titre.
3. Relancer l'audit des textes aux 3 tailles (1920, 1366, 412 portrait) et ajouter 412 × 915 **paysage** (915 × 412).
4. Captures avant / après dans `jeu/205-captures/`, rapport `jeu/205-mobile-portrait.md`.

## Contraintes

- Rien ne change sur ordinateur (`estMobile()` faux).
- Contraste ≥ 4,5:1, cibles ≥ 44 px, `prefers-reduced-motion` respecté.
- `npm run build` puis `npm test` avant le push ; journal.md, prompts/README.md, jeu/README.md à jour.
