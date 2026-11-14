# 210 — Corrections de l'audit 206 (exposition, rendu, performance, accessibilité)

Prompt : `prompts/210-jeu-corrections-expo-perf-a11y.md`. Audit d'origine : `jeu/206-audit-complet-projet.md`.
Date : 14/11/2026. Vérification : `npm run build`, `npm test` (smoke 658, jeu 6 943, navigateur 14 contrôles).

## Ce qui est corrigé (constat de l'audit → correctif → preuve)

| Constat 206 | Correctif | Preuve |
|---|---|---|
| 1 — Commentaires violents par défaut, aussi en kiosque | Masqués d'office en `?expo=1` (`Jeu.violenceMasquee`, réglage absent des Paramètres en exposition) ; les 7 messages `incitation` ne sont plus tirés quand le masquage est actif ; avertissement « propos injurieux et allusions au suicide · conseillé dès 12 ans » sur l'écran titre (FR / EN). **Aucun numéro de téléphone ajouté** (consigne du groupe) | test-jeu « 210 : en exposition… » ; test navigateur « exposition » |
| 4 — Délai des plaintes Community faussé (deux horloges) | Réponse datée sur `tempsPlaintes()` (`os.js`) ; recalage des plaintes à la sauvegarde et à la reprise (`Sauvegarde.recalerPlaintes`) | test-jeu : sauvegarde à 60 s, reprise après 50 s d'écran titre → même temps restant, pas d'expiration (échoue sans le correctif) |
| 5 — Webcam rallumée chez le visiteur suivant, flux en double | En exposition, webcam et micro remis à leur défaut à chaque chargement ; jeton de demande et garde « demande en cours » ; flux arrivé après une coupure fermé ; caméra coupée à l'onglet masqué, rallumée au retour si elle tournait | test navigateur : réglages « webcam allumée » d'un visiteur précédent → éteinte |
| 6 — Tests aveugles à l'exécution, CI sur GitHub Pages | `scripts/test-navigateur.mjs` (Chromium sans interface, hors ligne, 1366 × 768 et 412 × 915, partie au poste, exposition, lecteur d'écran) dans `npm test` ; `.github/workflows/tests.yml` remplace `deploy.yml` | mutation : `setup()` qui appelle une fonction absente → 9 échecs sur 10 |
| 7 — Précache de 34,6 Mo | Noyau strict (`addAll`) : 88 fichiers, 3,3 Mo ; lot complémentaire non bloquant (6 MP3, diaporama, kit de presse, pages) 14,3 Mo, MP3 repris de l'ancien cache au déploiement suivant ; OGG, vidéos, outils d'audit, `.md`, doublons `.json`, `data/fallback/` hors précache ; le jeu lit le MP3 partout ; `registration.update()` au chargement ; `messages.json` relu en local seulement | `npm run build` : « noyau 88 entrées (3,3 Mo) » ; smoke : vidéo et OGG absents du précache |
| 8 — Poste à ≈ 15 FPS (flou recalculé) | Pièce floutée mise en cache (`pieceFloueAuPoste`), refaite si le cadrage change ou toutes les 500 ms | gain non remesuré ici (l'audit mesurait ×2,7 sans le flou) — à vérifier sur le PC d'exposition |
| 9 — Licences fausses ou manquantes | GTFS Naolib = **ODbL, éditeur Semitan** (relu dans les métadonnées de l'API le 14/11/2026) dans les données préparées et leurs scripts, `manifest.json`, registre (cartel), appli « Données », source-sheet, README, `rendu/`, `slides/slides.md` ; parkings, vélos (JCDecaux), fluidité = ODbL ; `LICENSE` complété (OSM, Lucide ISC, JetBrains Mono OFL avec son texte dans `licences/`, musiques CC0 / CC BY) ; Hub'Eau aux crédits du jeu | test-jeu : l'appli Données cite l'ODbL |
| 10 — Appli « Données » vide hors ligne | Semaine de référence lue dans `Jeu.fallback` (6 dossiers, météo, événements) | test-jeu (échoue sans le correctif : « 0 dossier ») |
| Accessibilité — lecteur d'écran (constat 2) | `lecteur-ecran.js` : commandes HTML miroirs des zones cliquables (libellé relevé dans l'image ou `titre`), texte de l'écran, file d'annonces `role="log"`, canevas `aria-hidden` ; libellés ajoutés aux boutons génériques, applis, équipes, icônes du menu ; langue annoncée | test navigateur : commandes libellées, « Paramètres » activé au clavier ouvre la fenêtre |
| Accessibilité — raccourcis d'une lettre | Réglage « Raccourcis d'une lettre » : désactivé, Maj + la lettre garde le raccourci (WCAG 2.1.4) | — |
| Accessibilité — bandeau de mise à jour | Prend le focus à l'apparition, Échap le ferme ; le jeu ignore le clavier tant qu'il a le focus | — |
| Performance — son jamais suspendu | Contexte audio suspendu et musique en pause quand l'onglet est masqué | — |
| Sécurité — pas de `_headers`, pas de 404 | `_headers` : CSP en **Report-Only** (5 origines d'API), `Permissions-Policy` caméra / micro limités au site ; `404.html` | — |
| Site — Slidev reconstruit au build | Sorti du `prebuild` ; `npm run build:slides` à la demande | — |

## Ce qui n'est pas fait, et pourquoi

- **Texte à 160 et 200 %** : essayé puis retiré. Audit des textes en 1920 × 1080 : **117 défauts à 130 %** (palier
  existant), **923 à 160 %**, **1 396 à 200 %** (débordements et chevauchements : les mises en page du canevas sont
  fixes). Livrer ces paliers aurait cassé l'affichage. Il faut d'abord rendre les fenêtres extensibles (chantier à part),
  en commençant par les 117 défauts de 130 %.
- **Zoom** : `user-scalable=no` est retiré, mais le canevas garde `touch-action: none` sur mobile (gestes du jeu) et
  se recadre au zoom du navigateur : le zoom reste sans effet réel sur le jeu. Seul le réglage de taille du texte agit.
- **Numéro 3114** : pas ajouté à côté des messages (consigne du groupe). La notice existante après « Signaler » est inchangée.
- **Saisies humaines** (rôles, contributions, part humaine de l'IA, fiche individuelle, test croisé) : restent
  `[À COMPLÉTER]`, à remplir par le groupe.
- **Diaporama en ligne** : `slides/slides.md` corrigé (ODbL), mais `site/public/presentation/` n'est pas reconstruit
  (Slidev absent du worktree) : lancer `npm run build:slides` sur le poste où Slidev est installé.
- **CSP** : en Report-Only ; à passer en blocage après lecture de la console sur le jeu, le cartel, le making-of et la présentation.
- **Publication Cloudflare** : mécanisme toujours non documenté (`[À COMPLÉTER]`) ; la CI vérifie, elle ne publie pas.
- **Lecteur d'écran** : non testé avec NVDA ni VoiceOver ; les textes dessinés dans des tampons hors écran
  (Community, une partie du bureau) ne sont pas relevés, et quelques commandes restent « sans libellé ».
- **Tests humains** : protocole dans `jeu/210-protocole-tests-humains.md`, aucun résultat inventé.
