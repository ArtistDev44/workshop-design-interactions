# Prompt 211 — Jeu : épurer l'interface sur ordinateur (redondances d'information)

Origine : revue `ux-informations-2026-11-14.md` (skill `ux-questionner-informations`, question 5 « redondance »), et
demande du 14/11/2026 : « je souhaite une interface plus épurée, notamment sur l'ordinateur ; sur l'application de
carte, enlève l'icône avant la catégorie ». Statut : **à exécuter**.

Règle : on retire une information **dite ailleurs**. On garde une redondance **voulue** : couleur doublée par un
symbole ou un texte (accessibilité), source d'une donnée réelle, mention « fictif » ou « supposée ».

## Étapes

1. **Colonne Équipes** (`carte-alertes.js`, `dessinerPanneauEquipes`)
   - Retirer le pictogramme avant le nom de la catégorie (Police, Ambulance…) : chaque case le porte déjà.
   - Retirer la ligne de la base (« Commissariat central… ») : l'épingle de la carte la donne au survol.
   - Retirer « n/N libres » : les cases pleines ou vides le disent. Mettre le coût sur la ligne du nom
     (nouvelle clé `equipes.cout`, FR + EN, à la place de `equipes.etat`). Le verrou reste écrit.
   - Consigne « Glissez une équipe… » : seulement tant qu'aucune équipe n'a été envoyée. Les messages d'envoi et de
     refus restent affichés.
2. **Carte** : retirer « Zoom ×n » (clé `carte.niveauZoom`). Aucune décision ne s'appuie dessus.
3. **Bandeau** (`panneau.js`) : retirer les repères fixes 20 / 40 sur chaque jauge. La couleur les porte déjà (rouge
   < 20, orange < 40). Seul le repère d'objectif reste (prompt 143). Le texte « Priorités · Objectif » reste écrit
   en entier : le visiteur d'exposition en a besoin.
4. **Fiche dossier**
   - En-tête : rang **dans la journée** (« DOSSIER 1 / 5 DU JOUR »), comme le mail « 5 dossiers attendus
     aujourd'hui ». Plus le total de la semaine (« 1 / 16 »), ni le type, que le titre dit déjà.
   - Phrase de la source sous la bulle : sur deux lignes au lieu d'une ligne coupée. La fin, « Le jeu suppose de
     l'affluence », dit l'hypothèse : elle ne doit pas disparaître.
   - Tendances des répliques : les noms des jauges une seule fois, en en-tête de colonnes à côté de « Vos
     réponses ». Sous chaque réplique, les symboles seuls (▲ ≈ ▼, couleur doublée par le symbole).
5. **Poste et bureau**
   - Jauge de somnolence masquée sous 30 %, sauf au survol et pendant le guide. La touche Z et la zone de clic
     restent actives.
   - « Quitter le PC (Échap) » : bouton contour sur fond sombre au lieu du rouge primaire. Il reste désactivé tant
     qu'un choix attend (prompt 182).
   - Au bureau, « Incident en cours : cliquez sur l'écran du PC » suit la règle du prompt 124 : il s'affiche après
     10 s sans geste. La pastille sur l'écran du PC l'annonce déjà.
6. **Applis**
   - Mails : « en ligne » retiré, le statut n'est écrit qu'en panne ; les compteurs à 0 ne sont plus écrits.
   - Community : le titre « Comptes cités » n'apparaît qu'avec au moins un compte.
   - Données : « Ouvrir l'API ↗ » sans le chevron « › ».

## Hors périmètre (à trancher par le groupe)

- L'heure numérique sous l'horloge murale : on la retire (décor) ou on la garde (lisibilité) ?
- Le bandeau réduit à un ✓ / ✗ près des jauges, avec le texte au survol ?
- Les compteurs de dossiers de la carte (« actifs 1/3 ») et du Journal (« 0/1 ») : à aligner sur le compteur du
  jour.
- Filtres du Journal masqués tant que tout vaut 0 : non fait, car ils sont liés à la navigation au clavier par
  zones (prompt 186).

## Vérification

`npm run build`, `npm test`. Audit des textes `?audit=textes&parcours=1` : 0 défaut en 1920 × 1080 et
1366 × 768 ; en 412 × 915, pas plus de défauts « T » que sur `main`. Captures avant / après du poste et de la fiche.
Rapport `jeu/211-epurer-ordinateur.md`.
