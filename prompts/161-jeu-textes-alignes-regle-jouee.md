# Prompt 161 — Jeu : les textes décrivent le jeu qui tourne (et un test le vérifie)

Source : revue UX du 12/11/2026 (`ux-informations-2026-11-12.md`, constat 1 ; volets A § 7, § 9, § 10, § 11 ;
B § 9 ; C § 2, § 4, § 5, § 6, § 12 ; D § 13). Suite n° 2 proposée par la revue, exécutable sans arbitrage.

Le modèle a changé (prompt 87 : pas de chrono par défaut, rien n'expire en journée ; prompt 108 : équipes dès la
semaine 1 ; prompt 117 : trois répliques ; prompt 134 : pas de minutes de retard dans les archives), les textes non.
Le joueur s'en sert pour décider (se presser, attendre les équipes, choisir une difficulté).

## Textes à reformuler (FR et EN, `site/public/i18n.js` sauf mention)

- `histoire.c3.0` « 15 secondes par dossier » : faux sans défi chrono ; dire ce qui change vraiment en semaine 3
  (un signalement à la fois, budget 40, imprévus, conflits de lignes, cellule de crise).
- `histoire.c2.0` « Nouveauté : vous pouvez envoyer des équipes » : les équipes sont là dès la semaine 1 ; reformuler
  (ex. les pompiers et le palier 70, cf. `c2.1`). Idem `mp.mode.histoire.sous` (« un nouvel élément de jeu chaque
  semaine »), `mp.mode.histoire.etat` / `histoire.element.equipes` et `histoire.prochain` sur le rapport (seule la
  cellule de crise est encore verrouillée).
- `mp.difficulte` : retirer « retards ×… » hors temps réel (aucun effet sur les archives) ; si « Défi chrono » est
  actif, afficher son budget réel (50) ; remplacer « signalement(s) à la fois » par une formule lisible.
- `poste.geste.repondre` « quatre répliques… 1 à 4 » → trois répliques, 1 à 3 ; et l'**annonce lecteur d'écran** de la
  fenêtre « Votre poste » (`immersion.js` ~l.1159) qui lit encore Dévier / Retenir / Renfort / Ne rien faire : annoncer
  les gestes `poste.geste.*` affichés.
- `sieste.aide`, `sieste.volontaire` (« ceux qui expirent sont perdus ») et le texte de l'étape somnolence du guide :
  dire la règle selon le mode (hors défi chrono : le temps file, rien n'expire avant la fin du service) ;
  `sieste.bilan` : taire « expirés » hors défi chrono.
- `cafe.boost` : dire l'effet réel (la somnolence redescend) ; la phrase sur les sources seulement en défi chrono.
- `objet.micro.survol` : la parenthèse « défi chrono » seulement en défi chrono.
- Message webcam indisponible « la sieste ne dépend que de l'inactivité » → la sieste se lance avec Z ou d'elle-même
  quand la somnolence est pleine.
- Livre « Bien gérer son stress » (`stress.0-5`) : retirer chrono, « ne rien faire » (→ « attendre ») et
  « un incident ne se met pas en pause ».
- `enq.revele.trafic` « Révèle le retard » → « Révèle le texte de l'alerte (et le retard, s'il est connu) ».
- Aide : carte « GRAVITÉ ET RETARD » (préciser que retards et aggravation jouent en temps réel), Malus
  « (Q25) » et « expiré » (non traité à 20 h hors défi chrono), `acc.lecture.detail` (« en défi chrono : … »),
  incohérence J / K pour le carnet ; raccourcis de sources « 5 6 7 8 » vs « E » : une seule vérité aide / tutoriel.
- `palmares.aide` et `rapport.gestion` / `mail.style` : la table des profils parle de l'ancien modèle à 4 actions
  (déviation, retenue…) ; employer les mots des répliques/familles actuelles.
- Guide, étape `jauges` (seuils 120 / 90 du patron) : elle se valide seule dès qu'un signalement arrive
  (`guide.js` ~l.60) ; ne la valider qu'après affichage effectif de la bulle.
- Méta description / Open Graph de `index.html` : « retards Naolib » → perturbations du réseau Naolib (retards en
  temps réel seulement).

## Contrôle automatique

Étendre le contrôle de `site/scripts/test-jeu.mjs` (fait au prompt 131 pour `sms.*`) aux clés `histoire.c*`,
`mp.mode.*`, `mp.difficulte`, `poste.*`, `sieste.*`, `cafe.*`, `stress.*`, `credits.*`, `fin.*` (FR et EN) :
interdire les formules périmées (« 15 secondes », « quatre répliques », « 1 à 4 », « expirent sont perdus »,
« Nouveauté : vous pouvez envoyer des équipes », « Dévier », « retards ×» hors clé temps réel…).

## Vérifications

- `grep` des formules périmées dans `site/public` : plus aucune occurrence affichée.
- `npm run build` puis `npm test` dans `site/` ; audit des textes à 0 défaut ; `prompts/README.md` et `journal.md`.
