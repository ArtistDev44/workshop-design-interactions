# Prompt 183 — Jeu : PC sans menu de bureau, appli principale directe et allégée

Demande d'origine (prise de notes du 12/11/2026) :

> Supprimer le menu de bureau et accéder directement à l'application principale. Supprimer le message lors de
> l'ouverture de l'application. Enlever le bouton pause dans l'application. Supprimer les textes des objectifs sur
> l'application. Rajouter dans l'application.

⚠ La note « Rajouter dans l'application. » est **incomplète** : demander au groupe ce qui doit être ajouté avant de
clore ce prompt ; ne rien inventer.

Fichiers : `os.js` (`PC.etat` `'os'` / `'appli'`, `dessinerOS`, `ICONES_OS`, `GRILLE_OS`, `retourAccueilPC`,
`dessinerBoutonDemarrer`), `applis.js` (`CLE_INTRO_APPLIS`, `applis.intro.*`), `menu-app.js`, `carte.js`.

## À faire

1. **Plus de bureau d'icônes RégulOS** : s'installer au PC (et la fin du démarrage du jour) mène **directement à
   l'application principale** (carte et signalements). Supprimer l'état « bureau du PC » (`PC.etat === 'os'` comme
   écran d'accueil), la grille d'icônes et le retour à l'accueil.
2. **Accès aux autres applis** (Mails, Community, Journal, Indicateurs, Données, Corbeille) conservé depuis
   l'application principale : barre / menu d'applis existant (`menu-app.js`, barre des tâches), avec leurs badges.
   Aucune appli ne doit devenir inaccessible ; les verrous par chapitre (`voileVerrou`) restent.
3. **Supprimer le message affiché à l'ouverture d'une application** (fenêtres d'introduction `applis.intro.*`, clé
   `pxe-nte001-applis-intro`) et les textes i18n devenus inutiles.
4. **Retirer le bouton « Pause » de l'application** ; la pause reste disponible par Échap (et par le menu du jeu).
5. **Supprimer les textes des objectifs dans l'application** (objectif du jour / priorités écrits dans l'appli
   principale). L'objectif reste porté par le bandeau (prompts 143–145) : ne pas le supprimer là-bas.
6. Mettre à jour le guide « Prendre en main » (étapes qui montraient une icône du bureau), le tutoriel, l'aide et
   `audit-textes.js` / `audit-densite.js` (parcours `os:bureau`).

## Vérifications

- S'installer au PC : la carte s'affiche sans passer par une grille d'icônes ; chaque appli s'ouvre et se ferme
  depuis l'appli principale, au clavier aussi.
- Aucune fenêtre d'introduction à la première ouverture d'une appli ; plus de bouton Pause ni de texte d'objectif
  dans l'appli ; Échap met toujours en pause.
- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut (3 tailles, FR/EN).
- `prompts/README.md` et `journal.md` mis à jour à chaque push.
