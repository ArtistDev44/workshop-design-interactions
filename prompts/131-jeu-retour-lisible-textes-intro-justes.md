# Prompt 131 — Jeu « Nantes en régulation » : un retour lisible et une intro qui décrit le vrai jeu

Demande d'origine (12/11/2026) : prompts tirés de `audit-2026-11-12.md`, sections 3.4 et 3.5.

## 1. L'intro décrit un autre jeu

| Texte | Ce qu'il dit | Réalité |
|---|---|---|
| `sms.2` (`i18n.js`) | « dévier la ligne, retenir en terminus, envoyer un bus de renfort… Le chrono tourne. » | Pas de chrono par défaut (prompt 87) ; les répliques dépendent de la catégorie (prompt 107). |
| `sms.4` | « Et pas de sieste au poste ! » | La sieste est une mécanique (prompt 78). |
| Fenêtre « Votre poste » (`immersion.js`, `fenetrePoste`) | « 1 Dévier, 2 Retenir, 3 Renfort, 0 Rien, Maj + 1–4 équipes » | Les touches 1 à 4 sont les répliques affichées ; les équipes se glissent depuis le panneau droit (prompt 108). |

### À faire

- Réécrire `sms.2` et `sms.4` (FR et EN) d'après le jeu actuel, même ton que Camille, même longueur.
- Remplacer la liste de la fenêtre du poste par ce que le joueur fait vraiment : ouvrir un signalement sur la carte,
  répondre au plaignant (1 à 4), glisser une équipe, surveiller le menu à gauche. Clés i18n nouvelles, FR et EN.
- Vérifier chaque affirmation dans le code avant de l'écrire.

## 2. Le résultat d'une décision disparaît trop vite

### Constat

`DUREE_NARRATION = 6000` (`sketch.js`) : la narration (titre, texte, 3 deltas, contexte, explication) passe toute
seule au bout de 6 secondes.

### À faire

- Hors défi chrono, **plus de passage automatique** : le joueur continue avec Entrée, clic ou « Suivant ». La barre
  de progression disparaît dans ce cas.
- En défi chrono, garder le passage automatique, porté à 10 s.

## 3. Les plaintes Community expirent pendant la « pause »

### Constat

Le délai de 45 s des plaintes est compté en `millis()` réels (`Jeu.majPlaintes`, appelé avec `millis()` dans
`sketch.js` ; `Jeu.resteReponse` dans `community.js`). Le contrôle est sauté quand le temps est suspendu, mais
l'horloge réelle continue : lire un signalement plus de 45 s fait expirer la plainte (−3 de réputation) dès le
retour.

### À faire

- Une horloge « temps de jeu actif » en ms réelles, qui n'avance que quand le temps n'est pas suspendu
  (`avancerTemps`, `immersion.js`), sans le facteur ×100. `majPlaintes` et `resteReponse` l'utilisent.
- Une plainte dont l'horodatage est dans le futur (reprise de sauvegarde, horloge remise à zéro) repart de
  maintenant.

## 4. La bulle du guide cache ce qu'elle demande de lire

À l'étape « Répondre » du guide « Prendre en main », la bulle recouvre la plainte du dossier. La placer à côté de la
fenêtre (sur la carte, à gauche) ou sous les répliques, jamais sur la bulle du plaignant.

## Vérifications

- Les textes relus dans les deux langues ; audit des textes à 0 défaut.
- Un contrôle dans `test-jeu.mjs` : les textes `sms.*` ne parlent plus de chrono ni de « pas de sieste ».
- `npm run build`, `npm test`.
- Doc commune `jeu/130-134-audit-experience-rendu.md`, `prompts/README.md`, `journal.md`.
