# Prompt 118 — Jeu « Nantes en régulation » : hiérarchie du bandeau, gravité lisible, plein écran

Demande d'origine (12/11/2026) : prompts tirés de `audit-2026-11-12.md`, section 4.

## À faire

1. **« Quitter la journée » en secondaire** (`panneau.js`, `dessinerBandeau`). Le rouge plein reste réservé à
   l'urgence, aux badges et à l'action principale.
2. **Gravité sur la carte** (`carte.js`, `couleurGravite` ; `carte-alertes.js`, marqueurs) :
   - « élevée » en rouge franc (`C.rougeFonce` ou `DS.erreur`) avec un liseré blanc, plus visible que « moyenne » ;
   - une forme qui double la couleur : par exemple un point d'exclamation ou un carré plus grand pour « élevée »,
     le carré actuel pour « moyenne », un carré plus petit pour « faible » ;
   - la gravité écrite dans l'infobulle du marqueur.
3. **Badge en palette daltonienne** (`ds.js`, `dsBadge`) : texte sombre (`DS.fond`) quand la palette n'est pas
   « normale » (contraste mesuré à 2,61:1 en protan/deutan). Recalculer le contraste et le noter.
4. **Bandeau allégé** : retirer la disponibilité des équipes de la seconde ligne (elle est déjà dans le panneau
   Équipes à droite). Vérifier que la ligne n'est plus tronquée en 1920×1080.
5. **Plein écran** : touche F (hors saisie), via `document.documentElement.requestFullscreen()`, et de nouveau F
   pour en sortir ; la touche est listée dans l'Aide (H). Rien si l'API est absente. FR et EN. Le menu titre n'est
   pas modifié ici : il est refait en parallèle par le prompt 114 (autre session), comme l'écran Crédits.

Hors champ : l'écran Crédits (mise en page portrait, licence Hub'Eau encore « [À COMPLÉTER] » alors que
`manifest.json` la donne) est laissé au prompt 114, qui le redessine ; le signaler à son auteur.

## Vérifications

- Captures 1920×1080 et 1366×768 du bandeau et de la carte (navigateur sans tête), avant / après, décrites dans la
  doc.
- Contrastes recalculés pour le badge et le nouveau marqueur.
- `npm run build`, `npm test`, audit des textes à 0 défaut.
- Doc commune `jeu/115-119-audit-experience-rendu.md`, `prompts/README.md`, `journal.md`.
