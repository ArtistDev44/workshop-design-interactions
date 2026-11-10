# Prompt 56 — Jeu « Nantes en régulation », étape 42 : fin de semaine — rapport, bilan du patron, déblocage de la semaine suivante

Demande d'origine (10/11/2026) :

> Comment conclure une semaine de jeu de façon satisfaisante ? Il faudrait un bilan chiffré de la
> semaine réellement jouée, un retour du patron, et la possibilité d'enchaîner directement sur la
> semaine suivante en mode histoire.

## Attendu
1. **Rapport de fin de semaine** (écran dédié, affiché à la fin de la dernière journée, avant la
   cinématique de fin du prompt 41) :
   - chiffres réels de la partie : dossiers reçus / traités / expirés à 0 (règle Q25), décisions par
     action (les 3 actions + « ne rien faire »), temps moyen de décision, consultations de sources
     (prompt 50), ralenti tactique utilisé ou non (prompt 54) ;
   - courbes des 3 jauges sur toute la semaine (réutilise le tracé du rapport du prompt 48) et
     valeurs finales ;
   - défis de semaine tenus / non tenus avec les vrais chiffres (prompt 54) et bonus appliqués ;
   - profil de gestion (prompt 47) et score final.
   Le rapport est aussi posé comme **papier sur le bureau** (objet cliquable, même style que le
   rapport du prompt 41) : un clic le réaffiche en plein écran.
2. **Mail du patron du dernier soir** : texte selon le bilan (félicitations si les objectifs de la
   semaine sont tenus, avertissement si une jauge est basse, rappel des défis manqués), citant 2 à 3
   vrais chiffres de la semaine. Mis en avant à l'ouverture de l'écran de fin.
3. **Déblocage de la semaine suivante** : en mode histoire, terminer une semaine débloque la
   suivante dans le menu principal (persisté en `localStorage`, même mécanisme que la sauvegarde du
   prompt 33) avec un bouton « Semaine suivante » sur l'écran de fin ; en mode temps réel, proposition
   de rejouer une autre semaine archivée. Aucune donnée inventée : les semaines viennent exclusivement
   de `data/semaines/`.
4. **Palmarès des semaines** : chaque semaine terminée ajoute un résumé local (semaine, score, jauges
   finales, défis tenus, profil) consultable depuis le menu principal (« Palmarès »), en extension du
   palmarès existant du prompt 47. Terminer deux fois la même semaine ne crée pas de doublon.
5. **Accessibilité & i18n** : FR + EN (`i18n.js`) ; clavier complet (Tab entre les sections du rapport,
   Entrée sur « Semaine suivante ») ; annonces `aria-live` ; contraste ≥ 4,5:1 ; avec
   `prefers-reduced-motion` ou « Réduire les animations » : pas d'animation d'apparition du rapport.
   Rien ne touche aux règles verrouillées Q1–Q61.
6. **Tests** : `test-jeu.mjs` couvre le calcul du rapport depuis une partie simulée (chiffres exacts),
   le déblocage de la semaine suivante persisté après rechargement, et le palmarès ajouté une seule
   fois par semaine. `game.js` (effets, dés, règles Q1–Q61) reste inchangé.

## Vérifications
- `npm run build`, `npm test` ; partie réelle Chromium 1920×1080 sans erreur console : finir le
  chapitre 1 du mode histoire, lire le rapport (papiers du bureau inclus), mail du patron, clic
  « Semaine suivante » → chapitre 2 débloqué et visible au menu, palmarès à jour ; rejouer la même
  semaine → pas de doublon ; FR + EN ; clavier seul ; animations réduites. Documenter dans
  `jeu/51-…`. Fusion `main` sur demande.
