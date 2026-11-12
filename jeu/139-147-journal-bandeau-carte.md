# Prompts 139 à 147 — Journal allégé, bandeau d'une ligne, carte sans « Lieu à préciser »

Décisions verrouillées le 12/11/2026 (demandes de Guillaume, exécutées dans l'ordre).

## Appli Journal (139–142)
- **139** : les pastilles de journée n'affichent plus que `J1`, `J2`… et leur état (✓ ✗ •) ; plus de date JJ/MM (hauteur 52 → 44 px).
- **140** : une seule vue (Jour). Bouton « Semaine », `vueSemaine()`, `JournalDonnees.semaine()` et `finJour()`, touches S/K, état `JOURNAL.vue` / `JOURNAL.carnet` supprimés ; la sauvegarde ne retient plus de vue.
- **141** : « Détails » (V) = trois tuiles : signalements traités/reçus, bonnes décisions n/total, objectif du jour. Sparklines, équipes, thème, patron retirés ; `tuiles()` ne calcule plus équipes, thème, fait, XP ni points de courbe (la fin et l'écart du jour restent pour le résumé copié).
- **142** : plus de notes ni de carnet : filtre « Mes notes », carte note, « Écrire une note », touche J, entrée « Journal de bord » du menu pause, ligne du rapport papier, `Jeu.carnet` / `CARNET_MAX`, `Jeu.taches.carnet` supprimés. Le **rapport de la veille** posé sur le bureau (prompt 89 bis) reste : il est relu dans `Jeu.taches.jours[date].rapport`. Une sauvegarde ancienne perd son carnet au chargement. Clés `carnet.etat.*` renommées `tache.etat.*`.

## Bandeau de l'écran de jeu (143–145)
- **143** : aucune valeur chiffrée de jauge à l'écran (bandeau, fenêtre Indicateurs) ; l'annonce `aria-live` garde les valeurs. La jauge de l'**objectif du jour** porte une barre blanche au seuil (liseré sombre, plus haute que les repères 20/40), libellée « objectif : ≥ N » (infobulle du bandeau, texte dans Indicateurs). Les autres jauges n'ont aucun marqueur ajouté.
- **144** : « Priorités : … · Objectif : fluidité ≥ 40 ✓ » forme **un seul élément** (trop long → « … », ligne complète au survol). Date du jour + heure du jeu (▶ / ▶▶ ×100 / en pause) sortent du bandeau, dans le **coin supérieur droit** (`DATE_COIN`, au-dessus de la colonne des équipes) ; format le plus complet qui tient (« lun. 14 sept. », « 14 sept. », « 14/09 ») car le texte de l'appli est relevé à 20 px.
- **145** : bandeau **84 → 44 px**, une ligne : jauges compactes (barre 88 × 10 px à la hauteur du texte). Le contenu (carte, menu, équipes, vues) commence à `y = 92` au lieu de 132, hauteur 940.

## Appli Carte (146–147)
- **146** : « Recentrer » = 3ᵉ bouton carré blanc 48 × 48 sous + et −, pictogramme carré dessiné ; libellé en infobulle à gauche ; touche Origine inchangée.
- **147** : jamais « Lieu à préciser » : les signalements sans lieu connu sont regroupés en bas à gauche de la carte, sans libellé ; leur infobulle donne le nom de lieu cité par la source s'il existe. Clé `carte.lieuAPreciser` supprimée, tutoriel reformulé.

Vérifications : `npm run build`, `npm test` (smoke + jeu) ; audit des textes `?audit=textes&parcours=1` à 0 défaut en 1920×1080, 1366×768 et mobile portrait.
