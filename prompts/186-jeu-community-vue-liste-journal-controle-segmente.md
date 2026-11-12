# Prompt 186 — Jeu : Community (bascule grille / liste) et Journal (contrôle segmenté, contenu visible, sans copie)

Demande d'origine (prise de notes du 12/11/2026) :

> Sur l'application community, intégrer une icone toggle / list. Utiliser un segmented control pour les listes de
> filtres du journal. Supprimer l'option de copie du résumé. Sur l'application « journal », désactiver les détails
> pour avoir le contenu visible par défaut.

Dépend du prompt 170 (icônes Lucide). ⚠ Recoupe les prompts 139 à 142 (Journal) : les exécuter d'abord. Le prompt
141 réduit la vue « Détails » ; celui-ci **supprime le pli** — ce qui reste après 141 est affiché d'office.

## À faire

1. **Community** (`community.js`) : bouton à icône de **bascule d'affichage** (Lucide `layout-grid` ↔ `list`) dans
   l'en-tête de l'appli — vue cartes / vue liste compacte (une ligne par publication : auteur, début du texte,
   heure, réactions). Choix mémorisé, infobulle et annonce de la vue active, `aria-pressed`.
2. **Journal — contrôle segmenté** (`journal.js`) : les listes de filtres deviennent un **segmented control** du DS
   (un seul choix actif, segments de largeur égale, segment actif à la couleur d'accent, flèches ← → pour changer,
   rôle `radiogroup`). Ajouter le composant à `ds.js` et à `design-system/DESIGN.md` ; le réutiliser pour les
   filtres de Mails si la place le permet.
3. **Journal — supprimer « Copier le résumé du jour »** : bouton, touche C, code (`journal.js` ~l.690,
   `journal-donnees.js` ~l.173 si plus rien ne s'en sert), clés `journal.copier*` et `parametres.copie.*` liées.
4. **Journal — contenu visible par défaut** : retirer le bouton / l'état « Détails » ; le contenu de chaque entrée
   s'affiche directement. Si la page devient trop longue, faire défiler plutôt que replier.

## Vérifications

- Community : la bascule change la vue, le choix est conservé après fermeture de l'appli.
- Journal : filtres en contrôle segmenté utilisable au clavier ; plus de « Détails » ni de « Copier » ; contenu lu
  sans clic supplémentaire.
- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN).
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
