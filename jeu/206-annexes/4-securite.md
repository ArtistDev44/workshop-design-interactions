# Axe 4 — Sécurité et vie privée

Dépôt audité : worktree `/home/guillaume/ESD_Docs/design-interaction/wt-205`, commit `f07351b` (origin/main), 13/11/2026.
Méthode : grep et lectures ciblées, `git log -p --all` sur l'historique (647 commits), `npm audit --omit=dev`.
Aucune requête vers le site déployé : les en-têtes réellement servis par Cloudflare Pages n'ont **pas** été vérifiés en ligne.

## Synthèse

| # | Constat | Gravité | Effort |
|---|---------|---------|--------|
| 1 | Contenu Community violent (insultes, incitations au suicide allusives) affiché par défaut, y compris en kiosque `?expo=1`, sans avertissement préalable | **bloquant** (exposition publique) | S |
| 2 | Le réglage « Webcam » d'un visiteur survit à la purge du mode exposition : la caméra du kiosque se rallume au premier geste du visiteur suivant | **majeur** | S |
| 3 | Aucun fichier `_headers` ni CSP : pas de Content-Security-Policy, pas de Permissions-Policy camera/microphone | **majeur** (défense en profondeur) | S |
| 4 | Le 3114 n'apparaît qu'après un clic sur « Signaler » d'un message d'incitation | majeur | S |
| 5 | Webcam non coupée quand l'onglet est masqué, quand on quitte la partie ou à l'écran titre | mineur | S |
| 6 | Indicateur de webcam : un seul pixel de LED dans le décor, invisible hors de la vue bureau | mineur | S |
| 7 | Lien « Ouvrir la source » (Données) non bloqué en kiosque : sortie du jeu possible | mineur | S |
| 8 | Aucune page de mentions légales ni de confidentialité | mineur | S |
| 9 | `.gitignore` sans `.env` | mineur | S |
| 10 | Détection de main par seuil « couleur peau » YCbCr fixe : fiabilité inégale selon la carnation | mineur (équité, pas sécurité) | M |

---

## 1. Contenu violent visible par défaut, sans avertissement, y compris en kiosque — BLOQUANT pour l'exposition

- **Où** : `site/public/confort.js:32` (`masquerViolence: false` dans `DEFAUTS`) ; `site/public/expo.js:23` (`GARDER` conserve `pxe-nte001:jeu:reglages`, donc la valeur par défaut ou le choix du visiteur précédent) ; `site/public/game.js:1557-1563` et `:1642` (environ 1 dossier sur 3 avec plaignant « provoquant », plafond 1/3 des interactions par journée) ; `site/public/data/messages.js` (7 entrées `incitation: true`, comptées par grep, non recopiées ici).
- **Preuve** : lecture du code + `jeu/202-community-300-messages-suites-signaler.md:47-57` (« désactivé par défaut »). Recherche de `suicide|insulte|vulgai|injur|violent` dans `i18n.js`, `credits.js`, `menu.js`, `src/`, `kit-presse/` : aucun avertissement de contenu hors du libellé du réglage (`i18n.js:397-398`). L'écran « Avant de jouer » est sauté en exposition (`autorisations.js:43`).
- **Scénario** : en exposition publique, un collégien s'assoit au kiosque (`?expo=1`), le jeu le place directement au poste (`expo.js:36-52`). En quelques minutes, Community lui présente des insultes personnelles et, au tirage, un message allusif d'incitation au suicide. Rien ne l'a prévenu, aucun âge n'est indiqué, le masquage existe mais il est désactivé et enfoui dans Paramètres › Accessibilité.
- **Ce qui est sain** : mots grossiers masqués par symboles, pas de méthode, rien de discriminatoire ni de menace sexuelle (déclaré dans 202, non relu message par message ici) ; masquage centralisé dans `Jeu.textePlainte` (`game.js:1576-1579`), réutilisé par Community, notifications (`multitache.js:215`), Journal (`journal.js:340`, `:571`), transfert au patron (`game.js:1971`) : activer le réglage masque bien partout.
- **Piste** : (a) en `EXPO.actif`, forcer `masquerViolence = true` au chargement (et ne pas le garder d'un visiteur à l'autre) ; (b) hors exposition, un avertissement de contenu court avant la première partie (écran « Avant de jouer » ou première ouverture de Community) avec le réglage proposé sur place ; (c) mention d'âge conseillé sur le cartel et le kit presse ; (d) envisager d'exclure les entrées `incitation: true` quand le réglage est actif ou en exposition, plutôt que de les afficher masquées.

## 2. Webcam rallumée chez le visiteur suivant en kiosque — MAJEUR

- **Où** : `site/public/expo.js:23` (`GARDER` inclut `pxe-nte001:jeu:reglages`) ; `site/public/confort.js:32` (`webcam` fait partie de ces réglages) ; `site/public/webcam.js:131-140` (au premier `pointerdown`/`keydown` de la page, si `Reglages.webcam === true`, `activerWebcam()` est appelé).
- **Preuve** : lecture du code, chaîne complète vérifiée. Non testé dans un navigateur.
- **Scénario** : visiteur A active la webcam (objet sur l'écran ou Paramètres). Il part ; après 105 s, `location.reload()` purge la partie mais garde les réglages. Visiteur B touche l'écran : la caméra s'ouvre sans aucune demande (permission déjà accordée sur le poste du kiosque), seul un pixel de LED dans le décor et le voyant du navigateur/système le signalent. Aucune image n'est stockée ni envoyée (vérifié : `webcam.js:3-4`, 48 × 27 px en niveaux de gris, `<video>` jamais insérée, pas de `fetch`, `toDataURL`, `MediaRecorder` ni stockage dans `webcam.js`), donc l'impact est un défaut de consentement, pas une fuite.
- **Piste** : en `EXPO.actif`, remettre `webcam` à `false` (et `micro` à sa valeur par défaut) dans la purge, ou retirer ces clés de ce qui est gardé.

## 3. Pas d'en-têtes de sécurité ni de CSP — MAJEUR (défense en profondeur)

- **Où** : aucun `site/public/_headers` (ni `_redirects`, ni `wrangler.toml`) ; `site/public/index.html` sans `<meta http-equiv="Content-Security-Policy">`.
- **Preuve** : `ls -a` du dépôt et grep. Les en-têtes ajoutés par défaut par Cloudflare Pages n'ont pas été vérifiés (pas de requête vers le site, consigne) : « non vérifié ».
- **Scénario** : la surface d'injection actuelle est très faible (voir « Ce qui est sain »), mais sans CSP une régression future (un `innerHTML` alimenté par l'API) s'exécuterait sans filet ; sans `Permissions-Policy`, une page intégrée en iframe ou un script ajouté pourrait demander caméra/micro au nom du domaine.
- **Piste** : `site/public/_headers` pour `/*` : `Content-Security-Policy` avec `default-src 'self'`, `connect-src 'self'` + les 4 origines d'API utilisées (`data.nantesmetropole.fr`, `api.open-meteo.com`, `archive-api.open-meteo.com`, `hubeau.eaufrance.fr`, `api.okina.fr`), `img-src 'self' data: blob:`, `frame-ancestors 'none'` ; `Permissions-Policy: camera=(self), microphone=(self), geolocation=()` ; `X-Content-Type-Options: nosniff` ; `Referrer-Policy: strict-origin-when-cross-origin`. Vérifier p5 (pas d'`eval` attendu, à confirmer) et la présentation Slidev (styles inline probables : `style-src 'self' 'unsafe-inline'`). Tester en `Content-Security-Policy-Report-Only` d'abord.

## 4. Le 3114 n'apparaît qu'après « Signaler » — MAJEUR

- **Où** : `site/public/i18n.js:402` (FR) et `:2338` (EN) ; affichage seulement dans la branche `r.signaler === true` (`game.js:1789-1794`, `community.js:495-497`).
- **Preuve** : lecture du code. Exactitude : le libellé FR « 3114, numéro national de prévention du suicide, gratuit, 24 h/24 » est correct (3114 = numéro national de prévention du suicide, gratuit, 24 h/24 et 7 j/7 ; vérifié de mémoire, non revérifié en ligne). L'EN précise bien « in France ». Sain.
- **Scénario** : le joueur répond par le clash, ignore le message ou laisse la journée filer : il a lu l'incitation, il ne voit jamais la ressource.
- **Piste** : afficher la ligne 3114 avec le message lui-même (sous le texte des entrées `incitation: true`) ou dans les crédits/l'avertissement de contenu, pas seulement après signalement.

## 5. Webcam non coupée à l'onglet masqué ou en quittant la partie — mineur

- **Où** : `site/public/webcam.js:58-68` (`couperWebcam` n'est appelée que par le clic et le réglage, `:74`, `:83`) ; seuls `visibilitychange`/`beforeunload` du dépôt sont dans `sauvegarde.js:549-550` (sauvegarde auto).
- **Preuve** : grep. Le micro, lui, est en push-to-talk et ses pistes sont arrêtées au relâchement (`micro.js:96-107`), y compris si on relâche pendant la demande d'autorisation (`micro.js:88`) : sain.
- **Scénario** : webcam activée, le joueur change d'onglet ou revient au menu titre : la caméra reste ouverte et analysée (minuterie 400 ms) tant que la page vit.
- **Piste** : couper sur `visibilitychange` (hidden) et `pagehide`, la rouvrir au retour si le réglage est actif ; la couper en sortie de partie (menu, game over).

## 6. Indicateur de webcam minuscule — mineur

- **Où** : `site/public/webcam.js:121-128` (LED d'un pixel de décor, `PIX = 4` dans `bureau.js:9`) ; état lisible aussi dans Paramètres (`parametres.js:129`) et annonce aria-live `webcam.on` (`i18n.js:1017`).
- **Scénario** : en vue carte ou appli plein écran, aucun indicateur à l'écran ; seul le voyant du navigateur/système témoigne.
- **Piste** : petite pastille « Caméra active » permanente dans la barre d'état du PC tant que `CAM.active`.

## 7. Sortie du kiosque par le lien de source des Données — mineur

- **Où** : `site/public/donnees.js:159-166` (`ouvrirLienApi` ouvre un onglet sans tester `EXPO.actif`), alors que `menu.js:15-18` bloque les autres liens en exposition.
- **Preuve** : lecture du code ; accessibilité du panneau Données en exposition non testée.
- **Piste** : même garde `if (EXPO.actif) return;` (ou afficher l'URL en texte).

## 8. Mentions légales et confidentialité absentes — mineur

- **Où** : grep `mentions légales|confidentialit|données personnelles|RGPD|hébergeur|directeur de la publication` dans `site/src`, `site/public/i18n.js`, `credits.js`, `kit-presse/index.html` : aucun résultat.
- **Contexte** : le site ne collecte aucune donnée personnelle côté serveur (pas de formulaire, pas d'analytics ni de traceur : grep `analytics|gtag|plausible|matomo|cloudflareinsights|umami|hotjar` négatif hors noms internes de bundles) ; le stockage local est fonctionnel. Une page « Mentions légales » reste attendue pour un site public en France (éditeur, hébergeur Cloudflare, contact) : `[À COMPLÉTER]` pour l'éditeur et le contact.
- **Piste** : page Astro `/mentions-legales/` : éditeur, hébergeur, données (aucune collecte, liste des clés `localStorage` et comment les effacer, caméra/micro analysés localement), API tierces appelées depuis le navigateur (l'adresse IP du visiteur leur est transmise : Open Data Nantes, Open-Meteo, Hub'Eau, Okina).

## 9. `.gitignore` sans `.env` — mineur

- **Où** : `.gitignore` (racine) ne liste que `trailer/…`.
- **Piste** : ajouter `.env*`, `*.pem`, `.dev.vars` par précaution.

## 10. Détection de main par couleur de peau — mineur (équité)

- **Où** : `site/public/webcam.js:142-170` (seuils YCbCr fixes Cb 77–127, Cr 133–173).
- **Scénario** : selon la carnation et l'éclairage, la main est moins bien reconnue ; le geste n'est qu'une alternative (Z ou jauge, `i18n.js:648`, `:1019`), donc pas d'exclusion, mais à mentionner dans le cartel ou à remplacer par un critère de mouvement/luminance.

---

## Ce qui est sain (vérifié)

- **Secrets** : aucun motif `ghp_`, `Bearer `, `AKIA`, `xox[bp]-`, `CF_API`, `CLOUDFLARE_API` dans tout l'historique. Les occurrences `apikey`, `api_key`, `token=`, `sk-`, `secret`, `password` sont des bundles minifiés commités autrefois (`dist`/présentation), des checklists ou le smoke test qui recherche ces motifs. Aucun `.env`, `.pem`, `.npmrc`, `wrangler*` dans l'historique. Les URL d'API (`gtfsrt.js:12-13`, `donnees.js:11-13`, `bureau.js:339`, `telephone.js:8`, `notifs-tel.js:333`) ne portent aucune clé.
- **Injections DOM** : rendu quasi entièrement sur canevas p5. Deux `innerHTML` seulement : `expo.js:74` (gabarit constant, textes posés ensuite par `textContent`) et `audit-textes.js:352` (outil de dev chargé seulement avec `?audit=textes`, valeurs échappées). `document.write` unique (`installation.js:136`) borné par la regex `(textes|densite)` : pas d'injection par l'URL. Aucun `eval`, `new Function`, `setTimeout(string)`. `annoncer` écrit en `textContent` ; le dialogue d'import de sauvegarde construit le DOM par `createElement`/`textContent` (`sauvegarde.js:449-454`) et valide le JSON (`JSON.parse` en try/catch, `valider`). Côté Astro, `set:html` de `making-of.astro:113-114` passe par `echapper` (`:34`) sur le contenu du dépôt.
- **Liens** : les deux `window.open` passent `'noopener'` (`menu.js:17`, `donnees.js:164`), sur des URL constantes du code.
- **Capteurs** : getUserMedia uniquement sur geste (`webcam.js:31`, `micro.js:79`) ; écran « Avant de jouer » clair (`i18n.js:640`, « Rien n'est enregistré ni envoyé ») ; les pistes de test sont arrêtées aussitôt (`autorisations.js:67-68`) ; webcam opt-in par défaut (`confort.js:32`) ; micro jamais routé vers les haut-parleurs ; images réduites à 48 × 27, jamais affichées, stockées ni envoyées.
- **Stockage** : uniquement `localStorage` (clés `pxe-nte001*` : réglages, parties, progression, palmarès…) et une clé `sessionStorage` anti-boucle (`installation.js:166`) ; aucun cookie, aucun IndexedDB, aucune donnée personnelle saisie (pas de nom, pas de champ libre hors import de sauvegarde). Purge en exposition (`expo.js:24-30`) ; hors exposition, effacement via suppression de sauvegarde ou réglages du navigateur (pas de bouton « tout effacer » : à ajouter éventuellement).
- **Service worker** : ne met en cache que le même origine (`sw.js:259`), les réponses d'API restent réseau seul.
- **Tiers** : aucun script ni police chargés depuis un CDN (p5 copié dans `site/public/lib/p5.min.js`, polices locales, présentation Slidev autonome) ; donc pas de besoin de SRI.
- **Dépendances** : `astro` 7.4.7 seule dépendance ; `npm audit --omit=dev` (13/11/2026) : 0 vulnérabilité sur 177 paquets de production. Site statique : pas de surface serveur.
