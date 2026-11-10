# Prompt 80 — Jeu « Nantes en régulation », étape 62 : revue complète de l'UX du jeu, le rendre intuitif

Demande d'origine (11/11/2026) :

> Sinon, de manière générale : revois tout l'UX du jeu, il n'est pas intuitif.

Après les prompts 72–79 (alertes à choix de réponses, suppression de la carte, variété, logo, horaires,
×100 + multitâche + notifications, somnolence/sieste, retards qui s'aggravent), faire une **revue UX
globale** du jeu tel qu'il sera devenu : un joueur nouveau doit comprendre seul où cliquer, ce que
chaque écran fait et ce qui se passe quand il agit.

Contrainte forte : décisions verrouillées **Q1–Q61** et règles de `game.js` inchangées ; choix de design
actés conservés (prompts 50/66 : pas de conseil de correction sous les boutons d'action). L'UX passe
par la clarté des écrans, des libellés, de la navigation et des retours d'information.

## 1. Méthode : jouer et filmer/photographier

- Jouer **au moins 3 parties complètes** (une par difficulté, FR puis EN), en notant à chaque écran :
  « qu'est-ce qu'un joueur nouveau ne comprendrait pas ou ne trouverait pas ? » — capture + note datée
  dans `notes.md`.
- Parcourir **tout** le chemin : menu principal → bureau → ouverture du PC → écran de jeu (liste de
  signalements, prompt 73) → panneau incident → décision → narration → applis (Patron, Community,
  Journal, Indicateurs, Données, Aide) → notifications (prompt 77) → sieste (prompt 78) → fin de
  journée / sortie (prompt 69) → fins et rapport.
- Classer les frictions : **bloquant / confus / mineur**, avec l'écran concerné.

## 2. Axes de revue (checklist)

1. **Navigation** : chaque écran a un moyen visible de revenir en arrière / quitter ; les icônes et
   boutons ont des infobulles ; le clavier fonctionne partout (Tab, Entrée, Échap) et c'est documenté.
2. **Compréhension de l'action en cours** : on voit toujours quel signalement est sélectionné, quels
   compteurs tournent, quelle appli est ouverte (état actif visible barre des tâches + fenêtre).
3. **Libellés** : chaque bouton, onglet, jauge a un nom explicite (FR + EN) ; pas d'icône seule sans
   texte ; les données réelles (lignes, retards, météo) sont clairement distinguées des actions du
   joueur.
4. **Feedback immédiat** : chaque clic produit un retour visible/sonore (bip, surbrillance, delta de
   jauge, notification) — cohérence des codes couleur (rouge = danger/expiration, vert = validé…)
   expliquée dans l'aide.
5. **Onboarding** : première partie guidée (tutoriel + guide) couvre le parcours complet sans
   surcharger ; l'objectif du jour et les jauges sont expliqués avant le premier signalement.
6. **Cohérence bureau ↔ PC** : les objets du bureau (téléphone, horloge, livres, tasse…) ont chacun un
   effet visible et expliqué ; quitter/reprendre le PC est évident.
7. **Mobile** (prompt 60) : cibles ≥ 44 px, panneaux empilés lisibles, gestes expliqués.
8. **Accessibilité** : contraste ≥ 4,5:1, clavier seul, `aria-live` sur les annonces, animations
   réduites, taille de texte, daltonisme.

## 3. Implémentation

- Corriger dans l'ordre **bloquant → confus → mineur**, un commit par correction, FR + EN :
  libellés, infobulles, états actifs, ordre de tabulation, textes d'aide, messages vides (« aucun
  signalement pour le moment — prochaine arrivée à … » plutôt qu'un écran vide), regroupement des
  actions par écran.
- `npm run build && npm test` verts après chaque commit ; `game.js` non modifié (ou `git diff` prouvé
  sans effet sur les règles par `test-jeu.mjs`).
- Rapport dans `notes.md` (section « Revue UX du … ») : frictions trouvées (captures si besoin dans
  `site/public/captures/`), corrections faites (commits), reste ouvert.

## Vérifications

- 3 parties complètes rejouées après corrections, FR + EN, clavier seul, animations réduites, 1920×1080
  et mobile, hors ligne : aucune régression, aucune erreur console, `test-jeu.mjs` vert.
- Un joueur qui n'a jamais vu le jeu parcourt le tutoriel + la première journée sans blocage (test
  fait par un membre du groupe).
- Doc : `jeu/76-…` (nouvelle doc), `jeu/README.md`, `prompts/README.md`, `journal.md` à jour.
- Branche `jeu/prompt-80-revue-ux-globale`. À chaque push : entrée en tête de `journal.md`.
  Fusion `main` sur demande.
