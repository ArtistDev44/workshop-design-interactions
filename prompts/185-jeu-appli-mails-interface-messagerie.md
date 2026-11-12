# Prompt 185 — Jeu : l'appli « Patron » devient « Mails », avec une vraie interface de messagerie

Demande d'origine (prise de notes du 12/11/2026) :

> Sur l'app des mails : avoir directement les nombres de mails par catégories affichés. Renommer l'app patron par
> mails. Revoir l'interface de mail pour avoir une vraie interface d'application de mail. Voir le dossier depuis un
> mail -> mauvaise redirection.

Dépend du prompt 170 (icônes Lucide). Fichiers : `patron.js` (`appPatron`, `FILTRES_PATRON`, `carteMessage`,
`voirDossier` ~l.362), `applis.js` (« Voir le dossier » ~l.135, pile de navigation), `os.js` (`ICONES_OS`,
`TITRES_APPS`), `i18n.js` (`app.patron`, `app.titre.patron`, `patron.*`).

## À faire

1. **Renommer l'appli « Mails »** (EN « Mail ») : icône, titre de fenêtre, infobulles, annonces, aide, tutoriel,
   guide. Les messages restent ceux du patron (expéditeur affiché dans chaque mail) ; les identifiants internes
   (`'patron'`) peuvent rester.
2. **Interface de messagerie en trois zones** :
   - **colonne des dossiers / catégories** à gauche (Tout, Consignes, Alertes, Conseils, Budget… = les filtres
     actuels), chacune avec **son nombre de mails affiché en permanence** (et le nombre de non lus mis en avant) ;
   - **liste des mails** : expéditeur, objet, début du texte, heure de jeu, pastille « non lu » ;
   - **volet de lecture** : mail ouvert en entier, blocs enrichis (mini-jauges) et réponses rapides en pied.
   Sur petit écran / mobile : liste puis lecture, avec retour.
3. Les compteurs se mettent à jour à l'arrivée et à la lecture d'un mail ; le badge de l'appli reprend le total des
   non lus.
4. **Corriger « Voir le dossier »** : depuis un mail, le lien doit ouvrir **le dossier cité par ce mail** —
   Signalements s'il est encore ouvert, sinon sa fiche dans le Journal (`applis.js` ~l.135) — et non un autre
   dossier ou l'accueil. Reproduire le défaut d'abord, noter la cause dans le compte rendu ; le retour ramène au
   mail d'origine. Si le mail ne cite aucun dossier, pas de lien.
5. Clavier : ↑ ↓ dans la liste, Tab entre les zones, Entrée pour ouvrir ; annonces « mail 3 sur 12, non lu ».

## Vérifications

- Compteurs par catégorie visibles sans action et justes après réception / lecture.
- « Voir le dossier » testé sur un dossier ouvert, un dossier clos et un mail sans dossier (test dans
  `test-jeu.mjs`).
- `grep` : plus de libellé « Patron » comme nom d'appli (FR/EN).
- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN).
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
