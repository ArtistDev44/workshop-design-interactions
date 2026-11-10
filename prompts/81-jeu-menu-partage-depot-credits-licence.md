# Prompt 81 — Jeu « Nantes en régulation », étape 63 : menu principal — partager (réseaux sociaux), lien du dépôt, crédits et licence MIT

Demande d'origine (11/11/2026) :

> Rédige un nouveau prompt qui permette de mettre à jour le menu du jeu en y incluant le lien du
> dépôt avec une icône / un bouton partager avec différentes options de réseaux sociaux, les crédits
> (Mattéo Brevet & Guillaume Renoult) et la licence MIT.

Aujourd'hui, le menu principal (écran titre, `menu.js` : `dessinerMenuPrincipal()`) affiche les cartes
`entreesMenu()` à gauche, le sélecteur de langue et le bouton PWA en haut à droite, et en pied de page
seulement `mp.clavier` et `mp.sources` en bas à gauche. Aucun lien vers le dépôt, aucun partage, aucun
crédit, aucune licence. Le fichier `LICENSE` racine contient encore « [À COMPLÉTER] ».

Constantes du projet (ne pas en inventer) :

- **Dépôt** : `https://github.com/ArtistDev44/workshop-design-interactions`
  (fichier LICENSE : `https://github.com/ArtistDev44/workshop-design-interactions/blob/main/LICENSE`).
- **Jeu en ligne (URL canonique à partager)** : `https://workshop-design-interactions.pages.dev/`
  (prompt 02). Ne jamais coder l'URL en dur dans plusieurs endroits : constantes nommées en tête de
  `menu.js` (ex. `const DEPOT_URL = '...'`, `const URL_JEU = '...'`).
- **Crédits** : Mattéo Brevet & Guillaume Renoult. **Licence du code** : MIT.
- Liens externes : pattern existant `window.open(url, '_blank', 'noopener')` (`donnees.js`).

Règles Q1–Q61 inchangées : `game.js` non touché, `npm test` reste vert.

## Attendu

1. **Bloc « partager / dépôt » en bas à droite de l'écran titre**, dessiné par le code, dans le style
   Pixel Design System (fond #0D0C0C, primaire #D4031C, arrondi 0, JetBrains Mono / Bitsy Pixels) :
   - un **bouton avec icône GitHub** (nouveau type dans `iconeMenu()`, pixel art dessiné à la main comme
     les autres) ouvrant le dépôt dans un nouvel onglet, avec infobulle FR + EN ;
   - un **bouton « Partager »** (icône partage, ex. trois points reliés) ouvrant un **panneau modal
     par-dessus le menu** (même style que les fenêtres existantes `fenetre`, fermeture par Échap, croix
     et bouton « Fermer »).
2. **Options de partage dans le panneau** (chacune : icône pixel art + libellé FR/EN, cible ≥ 44 px) :
   - **X (Twitter)** : `https://twitter.com/intent/tweet?url={jeu}&text={texte}`
   - **Facebook** : `https://www.facebook.com/sharer/sharer.php?u={jeu}`
   - **LinkedIn** : `https://www.linkedin.com/sharing/share-offsite/?url={jeu}`
   - **Mastodon** : `https://mastodon.social/share?text={texte} {jeu}`
   - **Copier le lien** : `navigator.clipboard.writeText(URL_JEU)` avec repli (sélection + execCommand)
     si l'API est indisponible, et feedback « Lien copié » annoncé en `aria-live`.
   `{jeu}` = URL canonique du jeu, `{texte}` = texte de partage via `t('mp.partager.texte')` (FR + EN),
   encodé avec `encodeURIComponent`. Chaque option ouvre le lien en `_blank` + `noopener`. Le panneau
   s'ouvre et fonctionne **aussi hors ligne** (les liens externes restent au choix du navigateur).
3. **Pied de page complété** en bas à gauche, à la suite de `mp.sources` :
   - crédits : clé `mp.credits` « Mattéo Brevet & Guillaume Renoult » ;
   - licence : clé `mp.licence` « Code sous licence MIT » cliquable (lien vers le LICENSE du dépôt,
     `window.open` `_blank noopener`).
4. **Fichier `LICENSE` racine** : remplacer « [À COMPLÉTER] » par le **texte MIT standard complet**,
   `Copyright (c) 2026 Mattéo Brevet & Guillaume Renoult`, en conservant l'en-tête PATRIMOINE.EXE ·
   NTE001 · « Nantes en régulation ».
5. **i18n** : toutes les nouvelles clés (`mp.partager`, `mp.partager.texte`, `mp.partager.fermer`,
   `mp.partager.copier`, `mp.partager.copie`, `mp.partager.x|facebook|linkedin|mastodon`,
   `mp.depot`, `mp.credits`, `mp.licence`, infobulles…) en **FR + EN** dans `i18n.js`.

## Contraintes

- Menu principal uniquement (écran titre) : ne rien ajouter dans le jeu ni dans le menu Échap.
- Aucun fichier image : toutes les icônes (GitHub, partage, X, Facebook, LinkedIn, Mastodon, lien)
  sont dessinées par le code dans `iconeMenu()` ou une fonction dédiée.
- Accessibilité : clavier complet (↑ ↓ ou Tab dans le panneau, Entrée, Échap ferme), focus visible,
  contraste ≥ 4,5:1, `aria-live` à l'ouverture du panneau et à la copie, `prefers-reduced-motion`
  respecté, cibles tactiles ≥ 44 px.
- **Mobile portrait (prompt 60)** : le bloc en bas à droite et le panneau restent visibles et
  utilisables en 1080×1920 sans chevaucher les cartes de menu ; desktop 1920×1080 inchangé sinon.
- `game.js` et les décisions Q1–Q61 inchangés ; aucune incidence sur les jauges, le compteur, la
  sauvegarde.

## Vérifications

- `npm run build` et `npm test` dans `site/`.
- Parcours au clavier seul, à la souris et en tactile : menu → bouton dépôt (ouvre le dépôt) →
  « Partager » → chaque option (vérifier en console les URLs construites, texte encodé FR puis EN) →
  « Copier le lien » (presse-papiers + annonce aria-live) → Échap ferme le panneau ; pied de page
  crédits + licence MIT cliquable.
- 1920×1080 et portrait mobile 1080×1920 ; FR + EN ; `prefers-reduced-motion` ; hors ligne ; aucune
  erreur console.
- `LICENSE` racine relu : texte MIT complet, crédits présents.
- Doc : `jeu/30-menu-principal.md`, `jeu/README.md`, `prompts/README.md` (ligne 81), `journal.md`.
- Branche `jeu/prompt-81-menu-partage-depot-credits-licence`. À chaque push : entrée en tête de
  `journal.md`. Fusion `main` sur demande.
