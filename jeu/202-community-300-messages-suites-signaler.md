# Prompt 202 — Community : 300 messages de base, une suite par réponse, clash froid, provocants vulgaires et « Signaler »

Date : 13/11/2026. Branche `202-jeu-community-300-messages-suites-signaler`.
Demande d'origine : « 300 messages de base avec des réponses différentes qui entraînent encore des messages
différents. Pour les commentaires sympathiques : les réponses de connard doivent être soft ; pas vulgaires,
juste froides. En revanche les commentaires sur Community doivent devenir vraiment vulgaires et provocants
(incitations au suicide, insultes sur la famille, personnelles, etc.), l'option bienveillante de réponse est
remplacée par un bouton Signaler. »

## Contenu (`site/public/data/messages.json`, régénéré en `messages.js`)

300 messages de base (87 → 300), FR + EN, 3 réponses chacun, **800 suites** (une par réponse jouable) :

| Catégorie | Messages | Neutres | Positifs | Provocants |
|---|---|---|---|---|
| plainte | 94 | 56 | 0 | 38 |
| question | 40 | 29 | 0 | 11 |
| remerciement | 36 | 0 | 36 | 0 |
| suggestion | 32 | 16 | 3 | 13 |
| témoignage | 28 | 8 | 13 | 7 |
| relance | 10 | 3 | 0 | 7 |
| doublon | 9 | 4 | 0 | 5 |
| accessibilité | 26 | 18 | 0 | 8 |
| photo | 25 | 9 | 5 | 11 |
| **Total** | **300** | **143** | **57** | **100** |

- Les 87 entrées existantes gardent leur id et leur condition. Leurs suites sont ajoutées, les 20 provocantes
  sont réécrites et les 6 positives reçoivent un clash froid. Une variable non garantie par la condition a été
  retirée de 14 textes, sans changer la condition.
- Les 213 nouvelles entrées ont été rédigées par lots (plaintes ; questions et accessibilité ; remerciements
  et témoignages ; suggestions et photos ; relances et doublons). Chaque lot est contrôlé par un validateur
  commun : variables autorisées selon la condition, unicité de chaque texte, longueurs, masques, limites de
  contenu. 13 messages d'événement ont ensuite été remis au conditionnel ou en question : l'affluence reste
  supposée (prompt 162).

## Mécanique (`game.js`, `os.js`, `community.js`, `parametres.js`, `confort.js`, `i18n.js`)

- **Suite par réponse** : `reponse.suite` (FR + EN). Après une réponse bienveillante ou « autre », la suite
  arrive en **première réaction en chaîne** du même auteur (`programmerSuivis` : au moins 1 réaction, `suite:
  true`), à la place du texte générique `suivi.*`. Elle part en relance privée pour un message privé. Après un
  clash, la suite du clash **remplace la réaction générique** `reactionClash.*` (réaction immédiate, −3, comme
  au prompt 197).
- **Clash froid** (messages `positif`) : `clash: true, froid: true, texte`. Le texte est sec et condescendant,
  sans mot grossier ni masque. `Jeu.texteReponse` l'affiche à la place de la réplique vulgaire tirée de
  `clash.*`, et `os.js` ne déclenche pas la secousse `feedback('large')`. Les effets sont inchangés : réputation −8,
  réponse ratée.
- **Provocants** : messages vraiment vulgaires envers le community manager (insultes personnelles, sur la
  famille ; 7 incitations au suicide allusives, sans méthode, `incitation: true`). Mots grossiers masqués hors
  alphabet (`#@&!`). Rien de discriminatoire, ni menace ni violence sexuelle.
- **Bouton « Signaler »** à la place de la réponse bienveillante (`signaler: true`, bonne réponse, réputation
  +3), repérable par une icône drapeau. Après le signalement, le message s'affiche « [Commentaire signalé et masqué] »
  et la « Modération » publie une notice dans le fil (`commu.signale`), sans réponse publique ni réaction en
  chaîne. Pour une incitation au suicide, la notice rappelle le **3114**, numéro national de prévention du
  suicide (gratuit, 24 h/24) (`commu.signale.incitation`).
- **Confort** : réglage « Masquer les commentaires violents » (Paramètres › Accessibilité, désactivé par
  défaut, `Confort.Reglages.masquerViolence`). Activé, un provocant s'affiche « [Commentaire masqué : contenu
  violent] » et reste signalable.
- Le message de retour après une réponse occupe désormais sa vraie hauteur (deux lignes possibles) et ne
  chevauche plus le premier commentaire de Mentions.
- Inchangés : quota d'au plus 1/3 de provocants par journée, tirage semé et anti-répétition (198), ordre
  mélangé du trio (197), Q1–Q61.

## Vérification

- `generer-messages.mjs` refuse : moins de 300 messages, un id en double, une réponse sans suite FR + EN, un
  provocant sans « Signaler », un « Signaler » hors de la bonne réponse d'un provocant, un positif sans clash
  froid.
- `test-jeu.mjs`, bloc 202 : 300 ids uniques, environ 1/3 de provocants, suites complètes et toutes
  différentes, provocants masqués avec un seul « Signaler », clash froid sans vulgarité (−8), textes de
  modération FR + EN avec le 3114. En jeu : signalement (masquage, notice, pas de réaction), suite livrée en
  première réaction, clash froid et sa suite, réglage de masquage. Tests 197 et 162 adaptés.
- Captures 1920×1080 de l'onglet Mentions : un trio avec « Signaler » et son drapeau, la notice de
  modération, le clash froid et la suite de l'usager.
- `npm run build` puis `npm test` verts ; audit des textes : voir `journal.md`.
- Ressenti joueur (la violence des messages, le soulagement du bouton Signaler) : [À COMPLÉTER] en salle.
