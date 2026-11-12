# Prompt 118 — Jeu « Nantes en régulation » : des plaignants désagréables, mots grossiers masqués par des symboles

Demande d'origine (12/11/2026) :

> Les plaignants sont toujours gentils ; rajouter des commentaires de connard peut créer de la friction.
> Pour certains mots, tu pourrais utiliser des caractères en dehors de l'alphabet &#( !.

## 1. Plaintes au ton agressif

- **Nouvelles plaintes** dans `data/messages.json` (fichier modifiable à la main, régénéré par
  `npm run messages`), marquées `"ton": "agressif"`.
  - Elles ont **les mêmes conditions réelles** que les plaintes existantes : retard ≥ 10 min, travaux,
    affluence, pluie, ligne citée.
  - Elles ne s'affichent donc que pour un fait réel du dossier.
- **Fréquence :** environ **1 plainte sur 3**, tirée de façon déterministe par dossier, sans dé.
- **Ton :** impoli, sarcastique, de mauvaise foi (« Encore la ligne {ligne} en retard, vous faites exprès
  ou quoi ? Bande de b@#&!s. »).
- **Interdits :**
  - aucun propos haineux ni discriminatoire ;
  - aucune menace de violence ;
  - aucune donnée personnelle.
- **Mots grossiers** masqués par des symboles : `&#@!`, `%$#`, `@#&!`.
- **À l'écran :** la bulle du plaignant agressif a un petit liseré `alerte`, pour qu'on comprenne que le
  ton est voulu. L'annonce `aria-live` lit « mot masqué » à la place de chaque groupe de symboles.

## 2. Ce qui ne change pas

- Les règles : une plainte agressive n'a pas d'effet de jeu propre. La friction est dans le ton, et la
  tentation du clash (prompt 117) est plus forte.
- La Community (prompt 85) affiche les mêmes plaintes, avec les mêmes symboles.

## 3. Vérifications

- `npm run messages` régénère `messages.js`.
- `npm test` vérifie :
  - les plaintes agressives existent en FR et en EN ;
  - elles ne contiennent aucun mot grossier en clair (liste de contrôle dans le test) ;
  - elles se déclenchent seulement sur un fait réel.
- `npm run build` vert ; audit des textes à 0 défaut.
