# 42 — Nouvelles mécaniques et narration (prompt 47)

Tout part des **décisions réelles** de la partie et des **données réelles** de la semaine : aucun
fait n'est inventé. Logique dans `game.js` (section « Prompt 47 »), interface dans `mecaniques.js`.

## Inspection surprise
- Une fois par semaine, au **3e jour joué** (ou au dernier si la semaine est plus courte), le
  directeur ressort une décision passée de la partie : date, heure, ligne ou nature réelle, action.
- Question : « Quelle jauge cette décision a-t-elle le plus servie ? » — réponse attendue = la jauge
  au **plus grand effet réel** de cette décision. Seules les décisions avec un effet positif unique en
  tête sont retenues (pas d'égalité, pas de « ne rien faire »).
- Bonne lecture : réputation **+3** ; sinon **−2**. Le temps est suspendu ; touches 1, 2, 3 puis Entrée ;
  Échap ne fait pas partir le directeur.
- La décision est choisie par un hachage de la graine (le générateur de la partie n'est pas consommé :
  la suite des dés ne change pas). L'inspection est sauvegardée avec la partie.

## Palmarès et profils de gestion
- Menu principal → **Palmarès** : meilleur bilan par semaine (et temps réel), date, jauges, profil.
  Stocké sur l'appareil (`pxe-nte001:jeu:meilleurs-bilans`, champ `profil` ajouté).
- Profil = action la plus jouée : renfort → **le pompier**, déviation → **le stratège**, retenue →
  **le gestionnaire discret**, ne rien faire / compteur à 0 → **le spectateur** (égalité : ordre des actions).
- Imprimé aussi sur le rapport papier : « Profil de gestion : le pompier — 10 décision(s) sur 15 (renfort) ».

## Journal de bord
- Touche **J** ou menu Échap → « Journal de bord » : vraie zone de texte HTML (`textarea`, 2 000
  caractères, compteur annoncé), focus piégé, Échap ferme. Le temps est suspendu.
- Les notes sont sauvegardées avec la partie (`Jeu.carnet`, instantané) et un extrait est imprimé sur
  le rapport papier de la semaine.

## Fin « démission »
- Quand les trois jauges sont **sous 20** (seuil critique Q46), un bandeau propose « Rendre son badge »
  (bouton ou **D**), avec confirmation.
- La semaine se termine sur un rapport tamponné **DÉMISSION** ; elle n'entre pas au palmarès et ne valide
  pas le chapitre du mode histoire (pas de cinématique) : « Reprendre cette semaine ».

## Épilogue personnalisé
- Le mail de fin de journée ajoute : « Votre style aujourd'hui : le pompier (3 décision(s) sur 4 :
  renfort). » — d'après les actions réelles de la journée.

## Agenda anticipé
- Chaque matin, si l'agenda réel du jour (semaine jouée) contient un événement grand public — concert,
  musique, sport, spectacle, théâtre, cirque, danse, festival —, le patron prévient d'un afflux avec le
  **titre et le lieu réels**. Les fiches « fourre-tout » de l'agenda (plus de 3 types cochés) sont ignorées.
- Exemple (semaine du 12/10) : jeudi 15/10, « Comédie familiale … — Théâtre de Jeanne, Nantes » (Théâtre - Humour).

## Reporté (à rediscuter en groupe)
- Arbre de compétences, événements chaînés : changeraient les règles verrouillées Q1–Q61.
  *Prompt 88 :* proposés au groupe et livrés **désactivés par défaut** (Paramètres → Options de jeu) :
  événements chaînés étiquetés « conséquence de jeu », déblocages par grade, arbitrage du budget ; expérience,
  grade et badges affichés sans effet sur le jeu. Voir `82-engouement-variete.md` (§ « Points à trancher »).
- Personnages récurrents : demanderaient d'écrire des arcs (risque d'inventer des personnes).
- Nouvelles sources Open Data, semaines et lignes : nouvel échantillonnage des API (prompt dédié).
- Mode « journée type » : découper une semaine en journées jouables seules.

## Vérifications
- `npm run build`, `npm test` (69 contrôles, 22 scripts).
- Partie réelle automatisée (semaine du 14/09, Chromium 1920×1080), sans erreur console : consigne du
  patron, journal de bord tapé (82 caractères) puis Échap (le menu du jeu ne s'ouvre plus derrière :
  bug corrigé en arrêtant la propagation de la touche), mail « Votre style aujourd'hui : le pompier
  (3 décision(s) sur 4 : renfort) », inspection au 3e jour (ligne 97, Bus de renfort, réponse fausse →
  réputation −2, Échap sans effet), rapport avec profil et journal, palmarès rempli (184, le pompier).
- Démission : jauges à 12/15/9 → bandeau, D, Entrée → rapport « DÉMISSION », progression de l'histoire
  inchangée. Toutes les nouvelles clés existent en anglais.
- `scripts/test-difficulte.mjs` ne se lance plus seul (il importe un `base.mjs` hors dépôt) : remplacé
  au prompt 48 par `test-jeu.mjs`.
