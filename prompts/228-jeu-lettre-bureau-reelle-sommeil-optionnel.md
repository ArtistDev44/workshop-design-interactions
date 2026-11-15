# Prompt 228 — Jeu : lettre sur le bureau en vraie lettre lisible et sommeil optionnel désactivé par défaut

Origine : demande du 15/11/2026 (« la lettre sur le bureau doit ressembler à une vraie lettre quand ouverte avec les informations clés lisibles. Aussi, la fonctionnalité de sommeil devrait être optionnelle et désactivée par défaut, mise dans les options de jeux »).
Statut : **exécuté le 15/11/2026**.

## À faire

### 1. Lettre sur le bureau : apparence de **vraie lettre**

- **Objet cliquable** : la lettre posée sur le bureau (ex. : lettre du patron, courrier administratif) doit avoir une **apparence réaliste** :
  - Enveloppe fermée : rectangle beige avec timbre pixel art, adresse calligraphiée (effet pixel), cachet.
  - **Ouverture** : clic → animation d'ouverture de l'enveloppe (rabats qui se soulèvent) + dépliage de la lettre.
  - **Contenu lisible** : la lettre ouverte affiche un **contenu structuré** :
    - En-tête : « [Expéditeur] » + date de jeu.
    - Corps : texte aligné, police manuscrite pixel (ou JetBrains Mono italique), avec **informations clés en évidence** (surlignées ou en gras pixel).
    - Pied : signature manuscrite.
  - **Informations clés** : nom du destinataire, objet, Montant/Délai/Decision (selon le type de lettre), toujours **lisibles sans zoom** (taille ≥ 18 px CSS).
- **Types de lettres** :
  - Lettre de **mission** (objectif du jour).
  - Lettre de **feedback** (bilan de la veille).
  - Lettre de **sanction** (rappel à l'ordre, licenciement).
- **Persistance** : la lettre reste sur le bureau jusqu'à lecture, puis disparaît ou passe en archive (dossier « Lettres lues » dans Mails).

### 2. Fonctionnalité de sommeil **optionnelle et désactivée par défaut**

- **Option dans les paramètres** : ajouter dans `Paramètres` > « Gameplay » :
  - Case à cocher : **« Activer la somnolence et la sieste »** (`optionSomnolence`, `localStorage`).
  - **Valeur par défaut** : **DÉSACTIVÉE** (`false`).
  - Description : « Si activé, une jauge de somnolence apparaît et la sieste peut se déclencher après inactivité. »
- **Comportement quand désactivé** :
  - Aucune jauge de somnolence n'apparaît.
  - Aucune sieste forcée ou volontaire possible.
  - Le temps ne se comprime pas (pas de ×100 pendant la sieste).
  - Les malus liés à la somnolence/sieste sont **désactivés** (Q20, Q47 inchangés mais non applicables).
- **Comportement quand activé** : rétablit la mécanique actuelle (prompt 57, 78).
- **Migration** : si une partie en cours avait la somnolence activée, la conserver ; sinon, désactivée.

### 3. Intégration visuelle

- **Icône de lettre** : dans `bureau.js`, ajouter `OBJET_LETTRE` (type `lettre`, état `fermee`/`ouverte`).
- **Animation** : `dessinerLettre()` avec étapes : ferme → ouverture (200 ms) → ouverte (stable) → fermeture (200 ms).
- **Style** : couleur papier vieilli (#F5F5DC), texte noir (#1A1A1A), ombre portée pour le réalisme.

## Vérifications

- `npm run build`, `npm test` ;
- Partie nouvelle :
  - Lettre sur le bureau → clic → ouverture avec animation, contenu **lisible** (toutes tailles d'écran), informations clés visibles.
  - Paramètres : « Activer la somnolence » **décoché par défaut**, cocher → sieste activée, décocher → sieste désactivée (aucune jauge, aucun malus).
- Audit des textes : 0 défaut FR/EN.
- Clavier : touche L pour « Lettre » (si visible) ouvre/ferme la lettre.
- Mobile : zone de clic ≥ 44 px CSS sur la lettre.
- `localStorage` : `optionSomnolence` persisté entre les sessions.

## Fichiers concernés

- `bureau.js` : objet Lettre, `dessinerLettre()`, `OBJET_LETTRE`.
- `immersion.js` : animation d'ouverture/fermeture.
- `os.js` : integration dans la vue bureau.
- `parametres.js` : option `optionSomnolence`, valeur par défaut `false`.
- `game.js` : lien entre lettres et événements de jeu (mission, feedback, sanction).
- `i18n.js` : libellés « Lettre de mission », « Lettre de feedback », etc.
- `webcam.js` / `somnolence.js` (si existe) : désactivation quand `optionSomnolence === false`.

## Fait (adapté au code réel : `lettre.js` nouveau, `histoire.js`, `immersion.js`, `sieste.js`, `confort.js`…)

- **Lettre** : sur le bureau, à la place de la feuille du « rapport de la veille », une enveloppe pixel (papier vieilli,
  rabat, timbre, cachet) tant qu'une lettre du jour n'est pas lue — **sanction** (rappel à l'ordre ou dernier
  avertissement reçu aujourd'hui), sinon **bilan** (rapport de la veille), sinon **mission** (objectif, service,
  priorités du jour). Clic, Entrée ou **L** : le rabat se soulève (200 ms), le cachet saute, la lettre sort et se
  déplie (350 ms) ; en-tête (expéditeur, date de jeu, destinataire), objet, corps, **informations clés surlignées**
  (≥ 28 px dans l'image, ≥ 18 px CSS), signature manuscrite tracée. « Ranger » (Échap, Entrée, L) : 200 ms, puis la
  lettre passe dans Mails, dossier **« Lettres lues »**. Faits réels uniquement. L'ancienne fenêtre du rapport de la
  veille est supprimée. La touche L garde le changement de langue quand aucune lettre n'attend.
- **Somnolence optionnelle** : option « Somnolence et sieste » (Paramètres → Avancé, avec les options de jeu),
  **désactivée par défaut**. Désactivée : jauge masquée (ordinateur et mobile, où « Se lever » prend la rangée), ni
  sieste volontaire (Z, webcam : « désactivées ») ni forcée, ni contrecoup du café ; l'étape « somnolence » du guide
  est passée. Une partie reprise avec de la somnolence en cours garde l'option pour la session.

## Vérifié

- `npm run build`, `npm test` (+7 contrôles : types de lettres, animations 200 ms et mode réduit, « Lettres lues »,
  ancienne fenêtre retirée, option par défaut désactivée, somnolence à 0 et sieste refusée sans l'option ; contrôles
  du prompt 78 avec l'option activée).
- Chromium 1920 × 1080 et 412 × 915 : enveloppe sur le bureau, L → ouverture puis lettre de mission lisible, Échap →
  rangée (1 lettre lue, plus d'enveloppe), langue inchangée.
