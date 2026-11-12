# 137 — Skill UX « questionner chaque information » et revue de tout le jeu

## Demande
« Installe un skill de UX et questionne chaque choix d'informations sur le jeu-vidéo. »

## Fait
- **Skill de projet** `.claude/skills/ux-questionner-informations/SKILL.md` (partagé par le dépôt) : inventaire de chaque
  information (texte, chiffre, badge, couleur, icône, infobulle, annonce) → 8 questions (décision, public, moment,
  vérité de la source, redondance, hiérarchie, forme, absence) → verdict (garder, reformuler, déplacer, différer,
  fusionner, alléger, supprimer, ajouter, à trancher) et priorité P1 / P2 / P3 → rapport daté.
- **Revue** appliquée au jeu sur `main` (après le prompt 136), en quatre volets parcourus dans le build réel
  (Chromium sans interface, 1920 × 1080, `?expo=1`) : entrée et cadre, cœur de la décision, bureau et applis,
  temps et bilans. Environ 310 informations questionnées, 41 P1.
- Rendu : `ux-informations-2026-11-12.md` (synthèse, informations manquantes, 16 choix à trancher, suites proposées)
  et `ux-informations-2026-11-12/volet-A.md` … `volet-D.md` (un tableau par écran).

## Hors champ
Aucune modification du jeu : la revue propose, les prompts suivants exécuteront (§ 4 du rapport).
