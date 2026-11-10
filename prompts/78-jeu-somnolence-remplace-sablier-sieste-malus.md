# Prompt 78 — Jeu « Nantes en régulation », étape 60 : la somnolence remplace le sablier, la sieste devient centrale (avec malus « réponse trop tard »)

Demande d'origine (11/11/2026) :

> Rajoute du contenu afin d'améliorer la compréhension du jour face à la sieste. Il faudrait qu'elle
> soit très importante dans le jeu mais apporte un malus car on répond trop tard, je ne sais pas. Pour la
> somnolence, elle pourrait remplacer le sablier en mécanique.

Aujourd'hui : le **sablier** du bureau (`journee.js` : `clicSablier()`, `facteurSablier()`,
`SABLIER_VITESSE = 14`) fait passer le temps entre deux dossiers ; la **sieste** (`immersion.js` :
`enSieste`, `siesteApresMs = 20000`) se déclenche après 20 s d'inactivité, avec un malus fixe
(`Jeu.malusSieste`, −5) au réveil, et des paupières plein écran (prompt 65).

## Attendu

1. **La somnolence remplace le sablier comme mécanique de temps** :
   - supprimer le sablier du bureau (`clicSablier`, `dessinerSablier`, `facteurSablier`, objet
     `sablier` de la pièce, clés i18n orphelines FR + EN) ;
   - à la place, une **jauge de somnolence** dans le bandeau d'état (0 → 100) qui **monte avec le temps
     de jeu et l'inactivité** (valeurs verrouillées dans `REGLAGES`, documentées) ;
   - le joueur peut cliquer la jauge (ou un objet « se reposer » sur le bureau) pour **déclencher la
     sieste volontairement** : le temps accélère fortement pendant la sieste (facteur ×100, cohérent
     avec le prompt 77), les paupières se ferment (réutiliser l'animation du prompt 65).
2. **La sieste est très importante mais punitive** : pendant la sieste, **les signalements continuent
   d'arriver et leurs compteurs tournent** ; ceux qui expirent pendant la sieste sont réglés « non
   traité » (Q25, malus prompt 23) — le malus vient du fait qu'**on a répondu trop tard**. Au réveil :
   bilan de la sieste (signalements arrivés, expirés, malus subis), en plus du malus fixe existant.
   - La sieste reste annulable/interrompable par la main à la webcam (prompt 67) et par une alerte
     (réveil d'urgence existant, `reveil`).
3. **Comprendre le jour face à la sieste** (contenu, FR + EN) :
   - dans le bandeau d'état, à côté de la jauge de somnolence, une infobulle / ligne d'aide courte :
     « La somnolence monte avec la journée. Se reposer fait passer le temps très vite, mais les
     signalements continuent d'arriver et ceux qui expirent sont perdus. » ;
   - tutoriel (prompt 34), guide « Prendre en main » (prompt 37) et livre « Aide » (touche H) : une
     étape/section dédiée explique le **rythme du jour** (8 h → 20 h, prompt 76) et le compromis
     sieste : plus on dort, plus on avance vite dans la journée, plus on risque de rater des
     signalements ;
   - à 100 de somnolence : **sieste forcée** (on ne peut plus agir tant qu'on n'a pas « Se réveiller »),
     avec le même bilan.
4. L'inactivité de 20 s qui déclenche la sieste (prompt 57/62) est **remplacée** par la jauge de
   somnolence (la sieste ne tombe plus « par surprise » après 20 s ; elle tombe quand la jauge est
   pleine, ou volontairement). Le geste webcam (main) garde son rôle (prompt 67).

## Contraintes

- Règles Q1–Q61 inchangées ; `game.js` : le malus « non traité » (Q25) et `Jeu.malusSieste` existent
  déjà, ils sont simplement appliqués aux signalements expirés pendant la sieste. Les jauges
  Fluidité/Réputation/Budget ne changent pas de règles.
- La somnolence est un affichage + un déclencheur, pas une nouvelle règle de score : ses valeurs sont
  verrouillées dans `REGLAGES` et documentées.
- Accessibilité : jauge avec libellé texte (pas seulement une barre), `aria-live` sur le déclenchement
  et le bilan de sieste, clavier seul, contraste ≥ 4,5:1, `prefers-reduced-motion` (paupières en fondu),
  mobile portrait (jauge cliquable ≥ 44 px).
- Pas de code mort : sablier supprimé proprement (code + i18n + tests + docs).

## Vérifications

- `npm run build`, `npm test` dans `site/` ; tests : la somnolence monte et force la sieste à 100 ;
  pendant la sieste le temps est ×100 et un signalement qui expire applique bien le malus « non traité » ;
  sieste volontaire déclenchable et annulable ; bilan au réveil ; sablier bien supprimé (grep : plus
  aucune référence).
- Partie réelle FR + EN : journée 8 h → 20 h lisible, jauge de somnolence comprise, sieste volontaire
  puis forcée, signalements arrivés/expirés pendant la sieste, réveil webcam (prompt 67) toujours
  fonctionnel, aucune erreur console ; 1920×1080, mobile, hors ligne.
- Doc : `jeu/74-…` (nouvelle doc), `jeu/README.md`, `prompts/README.md`, `journal.md` à jour.
- Branche `jeu/prompt-78-somnolence-sieste`. À chaque push : entrée en tête de `journal.md`.
  Fusion `main` sur demande.
