# Prompt 86 — Jeu « Nantes en régulation » : modernisation visuelle de l'appli « Messages du patron »

Demande d'origine (11/11/2026) :

> J'aimerais un prompt améliorant visuellement l'app message du patron pour qu'elle soit un peu plus
> moderne.

Objectif : faire de l'appli **Patron** du PC une **messagerie moderne et lisible**, dans le respect du design
system. Aujourd'hui, c'est une simple pile des 9 derniers messages en bulles rouges.

Ce qui change :
- un en-tête de conversation ;
- des séparateurs de journée ;
- des **cartes de message typées** (consigne, alerte, reproche, budget…) ;
- un message épinglé, un indicateur de saisie, des accusés de lecture ;
- l'historique complet défilable ;
- un état « hors ligne » propre pendant la panne.

**Le contenu et les effets de jeu ne changent pas** : mêmes messages, mêmes déclencheurs, mêmes valeurs
réelles.

Règles :
- Design system (`design-system/DESIGN.md`, Pixel Design System du prompt 39, `ds.js`) : fond `#0D0C0C`,
  primaire `#D4031C`, blancs à opacités, couleurs fonctionnelles, arrondi 0, unité 4 px, polices DS,
  composants `dsBouton` / `dsBadge` / `dsPanneau`.
- **Aucune imitation d'une messagerie existante** (WhatsApp, Messenger, Slack, Teams…) : pas de logo,
  couleurs ou mise en page reconnaissables. Le style reste pixel / DS.
- Rien n'est inventé : les messages restent ceux du jeu, construits sur les valeurs réelles de la partie.
- FR + EN via `t(...)` / `T(...)`, contraste ≥ 4,5:1, clavier seul, `prefers-reduced-motion`, aucun flash.

## 0. Point de départ : lire le code existant avant toute modification

Fichiers concernés :
- `site/public/` : `os.js` (`appPatron()`, fenêtre d'appli, badges `Jeu.nonLus.patron`), `game.js`
  (`Jeu.messagePatron()`, `Jeu.messagesPatron`, panne `panne_messagerie`), `immersion.js`, `ds.js`,
  `i18n.js`, sauvegarde (prompt 33) ;
- `site/scripts/test-jeu.mjs` ;
- une mise à jour de `jeu/`, `prompts/README.md` et `journal.md`.

Repérer, sans rien supposer (les numéros de ligne bougent) :
- **`appPatron()`** :
  - la boucle `derniers(Jeu.messagesPatron, 9)` ;
  - les bulles `blanc05` à liseré `primaire` ;
  - l'heure à droite ;
  - l'écran de panne (badge « HORS LIGNE » + texte, qui masque tout).
- **Tous les appels à `Jeu.messagePatron(...)`** : une quinzaine au moment de la rédaction, dans
  `game.js` et `immersion.js`.
  - Consigne du jour (`consigneDuJour()`).
  - Alerte jauge < 20 (`patron.alerte`), conseil < 30 (`conseil.basse`).
  - Paliers de budget (`patron.budgetBas/Moyen/Haut`).
  - Décision ratée (`patron.rate`), dossier expiré (`patron.tropTard`).
  - Équipes (`patron.effectifs`, `patron.plusEquipe`), agenda (`patron.agenda`), défis (`patron.defis`).
  - Blâme du départ anticipé (prompt 51).
  - Rappel à l'ordre / dernier avertissement (prompt 84, s'il est exécuté).
- **Prompts 84 et 85** : s'ils sont exécutés, leurs messages (avertissements, transferts depuis la
  messagerie Community) s'affichent avec les types ci-dessous.

## 1. Messages typés (données, sans changer le texte)

- `Jeu.messagePatron(texte, type, meta)` accepte un **type** facultatif. Il est stocké avec le message
  (`{ heure, jour, texte, type, meta, lu }`).
  - Valeur par défaut : `info`.
  - Les appels existants sont mis à jour un par un, sans changer leurs textes.

| Type | Messages concernés | Couleur DS | Pictogramme pixel |
|---|---|---|---|
| `consigne` | consigne du jour | info | presse-papiers |
| `alerte` | jauge < 20, rappel à l'ordre, dernier avertissement | erreur | triangle « ! » |
| `conseil` | jauge < 30 | alerte | ampoule |
| `budget` | paliers de budget | alerte (bas) / succès (haut) | pièce |
| `reproche` | décision ratée, dossier expiré, départ anticipé | primaire | dossier barré |
| `equipes` | effectifs, plus d'équipe | info | gyrophare |
| `info` | agenda, défis, autres | blanc 75 % | bulle |

- `meta` porte les **valeurs réelles** déjà connues au moment de l'envoi, pour l'affichage riche du § 3 :
  - jauge et valeur ;
  - objectif, budget, modificateur ;
  - index du dossier concerné.

  Rien n'est recalculé après coup.
- Le pictogramme est un dessin pixel original de 16×16, agrandi ×2, sans emoji système.

## 2. Mise en page de la conversation

La fenêtre d'appli fait 1440×900 environ dans l'écran du PC 1920×1080.

1. **En-tête de conversation** (hauteur 88 px) :
   - avatar pixel original du patron : buste stylisé, cravate, sans visage réaliste ;
   - nom « Direction de la régulation » (clé `mail.de` existante) et rôle ;
   - **statut** : pastille succès « en ligne », ou pastille erreur « hors ligne » pendant la panne ;
   - à droite, filtres en `dsBouton` contour : **Tout · Consignes · Alertes · Reproches · Budget**.

     Chaque filtre a un compteur. Le filtre actif est en primaire.
2. **Message épinglé** sous l'en-tête :
   - la **consigne du jour en cours**, sur une ligne, avec l'icône punaise ;
   - un clic ou Entrée la déroule.
3. **Fil** :
   - **historique complet** de la partie, plus seulement les 9 derniers ;
   - défilement à la molette, au glisser et aux flèches ↑ ↓, avec une barre de défilement DS ;
   - ouverture positionnée sur le **premier message non lu** ;
   - séparateur « Nouveaux messages » en primaire.
4. **Séparateurs de journée** :
   - « Lundi 14 septembre 2026 », date longue dans la langue active ;
   - centrés, en `blanc50`, avec un filet `blanc15` de part et d'autre.
5. **Regroupement** : les messages consécutifs du même type, à moins de 30 min de jeu d'écart, sont groupés
   sous une seule heure.
6. **Barre de réponse** en bas (§ 4).

Navigation clavier :
- Tab entre les zones (filtres, épinglé, fil, réponses rapides) ;
- ← → entre les filtres, ↑ ↓ dans le fil ;
- Entrée pour ouvrir, Échap pour fermer l'appli.

`aria-live` annonce chaque nouveau message reçu avec son type : « Alerte du patron : … ».

## 3. Cartes de message (rendu par type)

Chaque message est une **carte** DS :
- fond `blanc05`, bordure `blanc15`, **barre latérale de 4 px** à la couleur du type ;
- pictogramme et libellé du type en petites capitales ;
- heure de jeu ;
- texte en JetBrains Mono (ou repli), 20 px, interligne 1,4.

Selon le type, un **bloc enrichi** apparaît sous le texte, construit avec `meta` :

- **`consigne`** : trois « puces » DS en ligne :
  - Objectif « Fluidité ≥ 40 » ;
  - Budget « 50 » ;
  - Modificateur « Erreur système · Dévier indisponible » ;

  et le nombre de dossiers attendus.
- **`alerte`** : **mini-jauge** horizontale de la jauge concernée, avec sa valeur réelle au moment de
  l'envoi, en erreur sous 20 et en alerte sous 30, et le seuil marqué d'un trait. Pour un
  rappel à l'ordre ou un dernier avertissement (prompt 84) : le score combiné et le niveau.
- **`reproche`** : rappel compact du dossier, avec la ligne, l'action choisie et la meilleure action. Le
  bouton contour **« Voir le dossier »** ouvre l'enquête du Journal (prompt 63) sur ce dossier.
- **`budget`** : la valeur du budget et le palier (bas / moyen / haut) en badge.
- **`equipes`** : les compteurs d'effectifs par type, si le prompt 68 est exécuté.

Messages lus et non lus :
- un message **non lu** a un point primaire à gauche et un texte en blanc plein ;
- un message lu passe en `blanc75`.

## 4. Barre de réponse (réponses rapides, sans effet de jeu)

- En bas du fil : 2 ou 3 **réponses rapides** en `dsBouton` secondaire, selon le type du dernier message :

  | Dernier message | Réponses proposées |
  |---|---|
  | consigne | « Bien reçu », « Je m'en occupe » |
  | alerte | « Je redresse la situation », « Compris » |
  | reproche | « Compris, je corrige » |

- La réponse s'affiche comme une bulle du joueur, alignée à droite, fond `blanc15`, avec l'accusé « Vu ✓ ».
- **Aucun effet sur les jauges, le score ou les malus.** C'est une confirmation de lecture, documentée
  comme cosmétique.
- Une réponse rapide par message au plus.
- Pas de saisie libre au clavier : elle n'aurait aucun sens pour le jeu, et la règle d'interprétation
  n'existerait pas.

## 5. Animations et états

- **Indicateur de saisie** : avant chaque nouveau message, la bulle « Direction écrit… » s'affiche avec
  trois points pixel animés pendant 0,8 s. Le message arrive ensuite en glissé de 8 px sur 200 ms.
  - Avec `prefers-reduced-motion` : pas d'indicateur animé, le message apparaît directement.
  - **L'heure de jeu du message ne change pas.**
- **Accusés de lecture** :
  - « Envoyé » à la réception ;
  - « Lu · HH:MM » (heure de jeu) quand l'appli est ouverte sur ce message ;
  - le badge de non-lus de l'icône et de la barre des tâches baisse en conséquence.
- **Panne de messagerie** (prompt 23) : on ne masque plus tout.
  - Bandeau erreur en haut : « Connexion perdue — reconnexion dans 42 s », avec le compte à rebours
    réel.
  - L'historique reste **lisible mais grisé**, et les réponses rapides sont désactivées.
  - Les messages émis pendant la panne arrivent à la reconnexion. Chacun garde son heure d'origine
    et la mention « reçu en retard ».
- **Son** : notification distincte pour un message `alerte`. Les autres types gardent le son actuel. Le
  tout suit l'interrupteur Son (M).
- Mobile (prompt 60) :
  - en-tête compacte ;
  - filtres en menu déroulant ;
  - fil sur une colonne ;
  - barre de réponse collée en bas ;
  - cibles ≥ 44 px.

## 6. Sauvegarde et performances

- La sauvegarde (prompt 33) enregistre, pour chaque message :
  - `type` et `meta` ;
  - le statut `lu` et l'heure de lecture ;
  - les réponses rapides données.

  Elle enregistre aussi le filtre actif et la position de défilement. Une ancienne sauvegarde sans
  `type` se charge avec `info` par défaut.
- Rendu :
  - ne dessiner que les cartes visibles dans la zone défilée ;
  - mettre en cache la hauteur de chaque carte (texte multi-ligne), recalculée seulement au changement
    de langue ou de taille.

  Le jeu doit rester fluide avec plus de 100 messages.

## 7. Textes (FR + EN, exemples de clés)

| Clé | Français | English |
|---|---|---|
| `patron.statut.enLigne` | en ligne | online |
| `patron.statut.horsLigne` | hors ligne | offline |
| `patron.filtre.tout` | Tout | All |
| `patron.filtre.consignes` | Consignes | Instructions |
| `patron.filtre.alertes` | Alertes | Alerts |
| `patron.filtre.reproches` | Reproches | Reprimands |
| `patron.epingle` | Consigne du jour | Today's instructions |
| `patron.nouveaux` | Nouveaux messages | New messages |
| `patron.ecrit` | Direction écrit… | Management is typing… |
| `patron.lu` | Lu · {heure} | Read · {heure} |
| `patron.envoye` | Envoyé | Sent |
| `patron.retard` | reçu en retard | delivered late |
| `patron.reconnexion` | Connexion perdue — reconnexion dans {s} s | Connection lost — reconnecting in {s} s |
| `patron.rapide.recu` | Bien reçu | Got it |
| `patron.rapide.jemen` | Je m'en occupe | I'm on it |
| `patron.rapide.redresse` | Je redresse la situation | I'll turn it around |
| `patron.rapide.compris` | Compris, je corrige | Understood, I'll fix it |
| `patron.voirDossier` | Voir le dossier | View the case |

## 8. Vérifications détaillées

- `npm run build` et `npm test` dans `site/`.
- `site/scripts/test-jeu.mjs` couvre :
  - chaque appel existant de `Jeu.messagePatron` produit le bon `type` et un `meta` cohérent avec les
    valeurs réelles ;
  - non-lus et accusés de lecture ;
  - les réponses rapides n'ont **aucun** effet sur les jauges ni le score ;
  - file d'attente pendant la panne avec la mention « reçu en retard » ;
  - sauvegarde et chargement, y compris une ancienne sauvegarde sans `type`.
- Partie réelle, en français puis en anglais, au clavier puis à la souris :
  - consigne épinglée avec ses puces ;
  - alerte avec mini-jauge ;
  - reproche avec « Voir le dossier » qui ouvre l'enquête ;
  - filtres ;
  - historique de plusieurs journées avec séparateurs ;
  - indicateur de saisie ;
  - panne (bandeau, historique grisé, messages en retard) ;
  - réponses rapides.
- Vérification visuelle :
  - respect du design system (couleurs, arrondi 0, unité 4 px, polices) ;
  - aucune ressemblance avec une messagerie existante ;
  - contraste ≥ 4,5:1 sur toutes les cartes, y compris les messages lus en `blanc75`.
- Accessibilité :
  - clavier seul ;
  - `aria-live` avec le type ;
  - `prefers-reduced-motion` ;
  - aucun flash ;
  - hors ligne ;
  - 1920×1080 et mobile.
- Aucune régression des prompts précédents (22, 23, 51, 63 et, s'ils sont exécutés, 68, 84, 85) : rejouer
  une semaine complète.
- Documenter dans `jeu/NN-patron-messagerie-moderne.md` (numéro libre suivant dans `jeu/`) et ajouter la
  ligne au sommaire de `jeu/README.md`.
- Branche `jeu/prompt-86-patron-messagerie`. À chaque push : entrée en tête de `journal.md`. Ne pas
  fusionner dans `main` sans demande.
