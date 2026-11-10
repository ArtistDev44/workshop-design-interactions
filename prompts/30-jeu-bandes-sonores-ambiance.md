# Prompt 30 — Jeu « Nantes en régulation », étape 17 : bandes sonores et ambiances au-delà des voix de trame

Objectif : enrichir la **couche sonore** du jeu au-delà de la musique de menu (prompt 27)
et des bips existants (prompt 18) : des **ambiances contextuelles et des alertes sonores**
générées par le code, sans toucher aux décisions verrouillées Q1–Q61 ni à la boucle de jeu.

S'appuie sur les prompts 14–29 (son et musique du prompt 27 dans `confort.js`, alertes
rouges du prompt 20, météo réelle du décor).

Fichiers concernés : `site/public/` (`confort.js`, `sketch.js`, `bureau.js`,
`immersion.js`, `i18n.js` pour les libellés), plus une mise à jour de `jeu/` et
`journal.md`.

Règles absolues : **aucun fichier audio binaire** (.mp3/.ogg/.wav) — tout est synthétisé
en WebAudio par le code (100 % local, fonctionne hors ligne) ; tout suit l'interrupteur
**Son (M)** existant (`Confort.Reglages.son`, persistance `localStorage`, prompt 18) ;
aucun nouveau texte d'interface hors `t(...)` FR + EN ; aucun son ne masque les alertes
visuelles (les bordures rouges du prompt 20 restent prioritaires).

## 1. Ambiances de la pièce (fond continu, discrets)

- Étendre `Confort.Son` (`confort.js`) avec des **boucles d'ambiance** générées en WebAudio,
  volume très faible, qui suivent le contexte réel :
  - **pluie** (bruit filtré) quand la météo réelle du jour (Open-Meteo, fallback local)
    indique des précipitations ;
  - **tram au loin / ville** (bourdonnement très léger) en journée simulée ;
  - **nuit** (ambiance plus calme, presque silence) selon l'heure simulée du prompt 20.
- L'ambiance change en fondu court (~1 s) quand le contexte change ; aucun à-coup.

## 2. Signaux sonores d'événements (ponctuels)

- **Alerte incident** : quand un nouveau dossier arrive (bordures rouges du prompt 20),
  un **bip d'alerte bref** (distinct de la musique et des bips d'action) ;
  - **fin de compteur** : le compteur de décision à 0 déclenche un son de conséquence
    (prompt 17, Q25) ;
  - **mail de fin de journée** (prompt 20/21) : petite sonnerie de notification ;
  - **clics au poste** (prompt 25/26) : clic très discret sur les interactions du PC.
- Chaque signal reste **court (< 1 s), non agressif**, et respecte `prefers-reduced-motion`
  côté visuel uniquement (l'audio n'est pas concerné, mais aucun flash ne l'accompagne).

## 3. Réglages et accessibilité

- Tous les sons passent par l'interrupteur **Son (M)** existant ; le menu Paramètres
  (prompt 18) affiche toujours l'état actuel. Aucun nouveau réglage obligatoire.
- Démarrage au **premier geste utilisateur** (règle d'autoplay, comme la musique du
  prompt 27).
- Les textes du menu Paramètres passent par `t(...)` (FR + EN).

## 4. Vérifications

- `npm run build` dans `site/`.
- Tester : pluie réelle vs temps clair (ambiance adaptée avec fallback hors ligne), alerte
  incident, fin de compteur, mail de fin de journée, clics au poste ; toggle M on/off
  avec persistance après rechargement ; premier geste requis (pas de son avant) ;
  `prefers-reduced-motion`, clavier seul, hors ligne / double clic local, 1920×1080.
- Aucune régression Q1–Q61 ni des prompts 14–29 (partie complète rejouée, musique du
  menu toujours OK).
- Documenter dans `jeu/17-bandes-sonores.md` + sommaire de `jeu/README.md`.
- Branche `jeu/prompt-30-bandes-sonores`. À chaque push : entrée en tête de `journal.md`.
  Ne pas fusionner dans `main` sans demande.
