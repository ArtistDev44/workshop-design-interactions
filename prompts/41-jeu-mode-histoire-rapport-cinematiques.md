# Prompt 41 — Jeu « Nantes en régulation », étape 28 : mode histoire, un élément de jeu par semaine, rapport papier, cinématiques de fin

Objectif (retour du 10/11/2026) : « Nouvelle partie » ne propose plus quatre choix mais
**deux modes** : le **mode histoire** (recommandé) qui enchaîne la semaine facile, puis la
normale, puis la difficile, et le **mode temps réel**, **débloqué** une fois le mode
histoire terminé. **Chaque semaine ajoute un élément de jeu.** Le bilan de chaque semaine
n'est plus un écran dans l'ordinateur mais un **rapport papier posé sur la table** ; le
**tout dernier** rapport est remplacé par **trois cinématiques** (une par fin). Les
décisions Q1–Q61 ne changent pas.

## 1. Deux modes dans « Nouvelle partie » (`menu.js`, nouveau `histoire.js`)
- **Mode histoire — recommandé** : semaine 1 = semaine réelle « facile » (60 s), semaine 2
  = « normale » (30 s), semaine 3 = « difficile » (15 s), dans cet ordre.
- **Mode temps réel** : verrouillé (cadenas + « Terminez le mode histoire ») tant que
  l'histoire n'est pas terminée ; toujours indisponible hors ligne.
- Progression mémorisée en `localStorage` ; « Reprendre » (prompt 33) fonctionne sur
  chaque semaine.

## 2. Un élément de jeu de plus chaque semaine (brainstorm puis choix)
Idées envisagées : plaintes des Nantais ; équipes de terrain ; imprévus de journée ;
conflits entre deux lignes ; contradictions de sources ; budget contraint ; incidents en
chaîne ; appels radio des conducteurs ; presse locale. Retenu (déjà codé, donc fiable, et
progressif) :
- **Semaine 1 — Prise de poste** : dossiers, jauges et **plaintes des Nantais**.
- **Semaine 2 — Équipes de terrain** : + **envoi d'équipes** depuis la carte (ambulance,
  police, techniciens, pompiers ; coût en budget).
- **Semaine 3 — La crise** : + **imprévus de journée** (météo aggravée, heure de pointe,
  panne de messagerie) et **conflits entre deux lignes**.
- Les éléments non encore débloqués sont désactivés et le disent ; en temps réel, tout est
  actif. Chaque nouvelle semaine s'ouvre par un échange au téléphone (prompt 42) qui
  présente le nouvel élément.

## 3. Rapport papier sur la table
- À la fin des semaines 1 et 2 (et en temps réel), le PC affiche « Rapport imprimé » et
  l'on se lève : une **feuille** glisse sur la table (objet cliquable de la pièce).
- La feuille ouverte (papier, tampon de la fin, texte machine) reprend le bilan réel :
  score, fin, jauges, dossiers traités, plaintes, décisions clés, profil.
- Boutons : **Semaine suivante** (histoire) ou **Rejouer / Menu principal** (temps réel).

## 4. Trois cinématiques de fin
- À la fin de la semaine 3, à la place du rapport : une cinématique de trois plans selon la
  fin (bonne, moyenne, mauvaise), dessinée par le code (ville et trams, lettre de la
  direction, la pièce), avec sous-titres `t(...)` et les vrais chiffres (score, semaines).
- Passer : Entrée / clic (plan suivant), Échap (tout passer). Animations réduites : plans
  fixes. À la fin : mode temps réel débloqué, retour au menu principal.

## Règles et vérifications
- Aucune donnée inventée (chiffres réels de la partie) ; textes FR + EN ; contraste ;
  clavier ; `prefers-reduced-motion` ; aucun fichier image.
- `npm run build`, `npm test` ; parcours histoire complet (3 semaines, rapports,
  cinématique) ; verrou / déblocage du temps réel ; reprise d'une semaine.
- Documenter dans `jeu/37-mode-histoire.md`. Fusion dans `main` (demande de l'utilisateur).
