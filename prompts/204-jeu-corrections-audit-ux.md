# Prompt 204 — Jeu : corrections de l'audit UX (constats 2 à 7)

Demande d'origine (13/11/2026) : « corrige les points 2, 3, 4, 5 (lors du clic, la carte doit zoomer sur le point en
question qui doit être visible), 6 et 7 et crée un nouveau prompt pour le 1 ». Référence : `jeu/203-audit-ux.md`.

1. **Community** (constat 2) : aucune réponse présélectionnée ; Entrée sans choix n'envoie rien et rappelle comment
   choisir ; la réponse focalisée est marquée par un contour, plus par un remplissage rouge.
2. **Prise en main** (constat 3) : une idée par étape ; les seuils du patron (120 / 90) et le ×100 sortent du guide
   (ils restent dans l'Aide) ; la lumière de l'étape des jauges éclaire les trois jauges seules.
3. **Libellés** (constat 4) : noms des jauges en clair sous les réponses et dans le Journal ; « 3/3 libres · coût 10 » ;
   « Somnolence 9 % · Z : repos » ; la consigne des équipes dit le raccourci et le coût.
4. **Fiche et carte** (constat 5) : à l'ouverture d'un signalement, la carte zoome (×4) sur son lieu et le place dans la
   partie libre, à côté des équipes ; la fiche est toujours à gauche.
5. **Chevauchements** (constat 6) : tampon « SIGNALEMENT » effacé après 1,8 s ; source des Données placée selon sa
   hauteur réelle ; carte du Journal à 116 px ; Indicateurs masqués pendant un dossier, détails empilés selon leur
   hauteur réelle.
6. **Rédaction** (constat 7) : accord automatique des « mot(s) » dans `t()` ; « 0/0. On peut faire mieux. » retiré
   quand aucun objectif n'était fixé ; « Game over » → « Fin de mission » (FR).

Vérifier : `npm run build`, `npm test`, audit des textes aux 3 tailles (FR + EN), captures avant / après.
