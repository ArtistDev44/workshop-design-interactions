# Prompt 202 — Jeu : Community — 300 messages de base, une suite différente par réponse, clash froid pour les messages sympathiques, messages provocants très vulgaires et bouton « Signaler »

Demande d'origine (13/11/2026) :

> Crée plus de variété dans les interactions avec la communauté, on doit avoir 300 messages de base avec des
> réponses différentes qui entraînent encore des messages différents. Pour les commentaires sympathiques : les
> réponses de connard doivent être soft ; pas vulgaires, juste froides. En revanche les commentaires sur
> Community doivent devenir vraiment vulgaires et provocants (incitations au suicide, insultes sur la famille,
> personnelles, etc.), l'option bienveillante de réponse est remplacée par un bouton Signaler.

Sur la base des prompts 63 (réactions en chaîne), 117 (trio de réponses), 196–197 (clash, réaction du
plaignant, mots masqués hors alphabet) et 198 (catégories, `ton`, au plus 1/3 de provocants, tirage semé).

## À faire

### 1. 300 messages de base (`data/messages.json`, régénéré par `npm run messages`)

- Passer de 87 à **300 entrées** (« messages de base ») dans les 9 catégories du prompt 198, FR + EN, même
  validation : conditions sur des champs réels du dossier uniquement, variables connues (`{ligne}`,
  `{retard}` pour une ligne en difficulté, `{nature}` pour une perturbation / alerte / incident, `{nom}` pour
  un événement), pseudonymes fictifs, aucun fait inventé.
- Environ **1/3 de provocants** (≈ 100), le reste neutre ou positif ; le quota de 1/3 par journée et
  l'anti-répétition du prompt 198 sont inchangés.

### 2. Chaque réponse entraîne un message différent (`suite`)

- Chaque réponse jouable porte une **`suite`** (FR + EN) : le message suivant du même auteur, propre à
  cette réponse (remerciement, déception, agacement, surenchère…). Elle arrive comme la première réaction
  en chaîne du prompt 63 (même délai, même effet ±1), à la place d'un texte générique `suivi.*`.
- Après un clash, la `suite` du clash remplace la réaction générique `reactionClash.*`.
- Les 87 entrées existantes reçoivent aussi leurs suites.

### 3. Messages sympathiques (ton `positif`) : clash froid, pas vulgaire

- La 3ᵉ réponse (« connard ») d'un message positif a son propre texte : **froid, sec, condescendant, sans
  aucun mot grossier ni masque** (`clash: true`, `froid: true`, `texte`). Effets inchangés (réputation −8,
  réponse ratée). Pas de secousse `feedback('large')` pour un clash froid (rien de « tentant » à exagérer).

### 4. Messages provocants : vraiment vulgaires, bouton « Signaler »

- Les messages `provoquant` deviennent vraiment vulgaires et provocants envers le community manager :
  insultes personnelles, insultes sur la famille, **incitations au suicide** (allusives, sans aucune méthode,
  champ `incitation: true`). Mots grossiers **masqués hors alphabet** (`#@&!`), comme au prompt 196.
- Limites : rien de discriminatoire (origine, religion, sexe, orientation, handicap), pas de violence
  sexuelle, pas de menace physique, aucune personne réelle visée.
- L'option bienveillante est **remplacée par un bouton « Signaler »** (`signaler: true`, c'est la bonne
  réponse) : le commentaire est masqué et signalé, une notice système le dit dans le fil ; pour une
  incitation au suicide, la notice rappelle le **3114** (numéro national de prévention du suicide, gratuit,
  24 h/24). Les deux autres réponses restent : une réponse froide/ferme et le clash.
- Bouton « Signaler » visuellement distinct (icône drapeau), au clavier comme les autres réponses.

### 5. Confort (`parametres.js`, `confort`)

- Nouveau réglage **« Commentaires violents »** (affichés par défaut / masqués) : masqués, un message
  provocant s'affiche « [Commentaire masqué : contenu violent] » et reste signalable.

## Vérification

- `test-jeu.mjs`, bloc 202 : 300 entrées valides FR + EN ; ≈ 1/3 provocantes ; chaque réponse jouable a une
  suite FR + EN ; chaque provocant a exactement un `signaler` (la bonne réponse) et des mots masqués ; chaque
  positif a un clash froid sans mot grossier ni masque ; la suite arrive après la réponse et remplace le texte
  générique ; la notice de signalement (et le 3114 pour `incitation`) ; réglage de masquage ; reproductibilité
  et sauvegarde inchangées.
- `npm run build` puis `npm test` verts ; audit des textes à 0 défaut A–D.
- Doc `jeu/202-community-300-messages-suites-signaler.md`, ligne 202 dans `prompts/README.md`.

## Hors périmètre

- Ne pas modifier Q1–Q61, les jauges, le quota 1/3, le tirage semé, l'ordre mélangé du trio (197).

Branche `202-jeu-community-300-messages-suites-signaler`. À chaque push : entrée en tête de `journal.md`.
