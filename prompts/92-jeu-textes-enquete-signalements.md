# Prompt 92 — Jeu « Nantes en régulation » : des textes d'enquête lisibles dans l'appli Signalements

Demande d'origine (11/11/2026) :

> Je souhaite un prompt améliorant l'affichage des textes des enquêtes dans l'appli Signalement.

Objectif : rendre **lisibles, complets et agréables** les textes révélés par l'enquête d'un signalement.
Il s'agit des sources Lignes, Info trafic, Météo et Agenda du prompt 50, aujourd'hui dans le volet « En
savoir plus » du prompt 87.

Problèmes constatés dans le code actuel (`enquete.js`, `corpsEnquete()`, `texteSource()`) :
- **Textes coupés sans le dire.**
  - Chaque source reçoit une hauteur fixe (un quart de la zone).
  - La première ligne est limitée à 2 lignes, la seconde ne s'affiche que s'il reste de la place.
  - Les citations longues (agenda, changelog) sont tronquées, sans « … » ni moyen de lire la suite.
- **Retour à la ligne approximatif** : le nombre de lignes est estimé par `textWidth × 1,05 / largeur`.
  Le texte peut déborder ou laisser des trous.
- **Tout est mélangé sur une ligne grise** : retard + nature, puis « citation — source · heure ». Aucune
  hiérarchie entre le fait, la citation et la provenance.
- **Taille effective trop petite** : 19 px dans un écran de PC affiché à 90 % (`ECRAN_POSTE`), soit environ
  17 px réels en 1920×1080, et moins sur un écran plus petit.
- **Textes bruts des sources** non nettoyés : espaces multiples, éventuelles entités HTML, ponctuation
  doublée, typographie française non respectée.

Règles :
- **Rien n'est inventé ni reformulé sur le fond.** Les textes des sources sont **cités tels quels**, après
  un simple nettoyage typographique (§ 2) : jamais de résumé automatique qui changerait le sens.
- Design system (`ds.js`, Pixel Design System du prompt 39, `design-system/DESIGN.md`), FR + EN via
  `t(...)`, contraste ≥ 4,5:1, clavier seul, `prefers-reduced-motion`, aucun flash, mobile.
- Les règles de jeu ne changent pas : coût des consultations seulement en défi chrono (prompt 87), mêmes
  sources, mêmes données.

## 0. Point de départ : lire le code existant avant toute modification

Fichiers concernés :
- `site/public/` : `enquete.js` (`SOURCES_ENQ`, `texteSource()`, `texteLignesSource()`,
  `corpsEnquete()`, `revelerSource()`, `toucheEnquete()`), `carte.js` (panneau du signalement, onglets
  `dessinerOngletsIncident()`, historique, équipes), `sketch.js` (polices `POLICE_TEXTE` /
  `POLICE_DONNEES`, `bouton()`), `ds.js`, `os.js` (`enqueteJournal()`, enquête après coup du prompt 63,
  qui affiche des textes semblables), `i18n.js` (clés `enq.*`, `dossier.*`, `journal.*`), `bureau.js`
  (`ECRAN_POSTE`, pour l'échelle réelle), `mobile.js` ;
- `site/scripts/test-jeu.mjs` ;
- une mise à jour de `jeu/`, `prompts/README.md` et `journal.md`.

Repérer aussi le format réel des textes, en échantillonnant les données locales sans les lire en entier :
- `texte_source` des événements d'agenda : forme « Titre — Lieu, Ville » ;
- textes du changelog GTFS ;
- noms des sources ;
- champs `heure`.

Si le prompt 89 (Journal modernisé) est exécuté, l'enquête du Journal **réutilise** le composant du § 1.

## 1. Un composant de texte fiable (réutilisable)

Créer dans un module partagé (par exemple `texte.js`, chargé avant `enquete.js` et `os.js`) des fonctions
utilitaires, testées.

- **`couperLignes(texte, largeur, police, taille)`** : vrai retour à la ligne, mot par mot, mesuré avec
  `textWidth`.
  - Gère les mots plus longs que la largeur (coupure propre, avec trait d'union si possible), les URL et
    les numéros de ligne collés (« C1/C2 »).
  - Gère les retours à la ligne présents dans la source.
  - Résultat mis en **cache** par (texte, largeur, police, taille, langue).
- **`hauteurTexte(...)`** : hauteur exacte d'un bloc, à partir de `couperLignes` et de l'interligne.
- **`dessinerTexte(texte, x, y, largeur, options)`** : dessine les lignes calculées. Options :
  - `maxLignes` ;
  - ellipse « … » **en fin de mot** si le texte est tronqué ;
  - couleur, alignement, interligne ;
  - mise en relief de segments (§ 3) ;

  La fonction renvoie la hauteur utilisée et l'indicateur « tronqué ».
- **Plus aucune estimation `textWidth × 1,05`** dans `enquete.js`, `carte.js` ni dans l'enquête du Journal.

## 2. Nettoyage typographique (sans changer le sens)

Une fonction **`nettoyerTexteSource(texte, langue)`**, appliquée à l'affichage seulement, sans toucher aux
données.

- **Nettoyage commun** :
  - décoder les entités HTML (`&amp;`, `&#039;`…) ;
  - retirer les balises éventuelles ;
  - réduire les espaces multiples ;
  - supprimer les espaces en début et fin ;
  - supprimer la ponctuation doublée accidentelle (« .. », « ,, »).
- **Français** :
  - espace insécable fine avant `; : ! ?` et avant `»`, et après `«` ;
  - apostrophe typographique `’` ;
  - points de suspension « … » ;
  - nombres au format français (virgule décimale, espace insécable des milliers) ;
  - unités séparées par une espace insécable (« 18 min », « 12 mm », « 54 km/h ») ;
  - heures « 7 h 40 » ou « 07:40 », de façon cohérente dans tout le jeu (s'aligner sur `nombreFr` et
    l'horloge).
- **Anglais** : pas d'espace avant la ponctuation, guillemets “ ”, point décimal.
- Le texte cité reste **mot pour mot**. Le nettoyage ne touche ni l'orthographe ni l'ordre des mots.
  Toute autre correction est interdite.

## 3. Hiérarchie claire d'une source révélée (carte DS)

Chaque source révélée devient une **carte** : fond `blanc05`, bordure `blanc15`, liseré de couleur à gauche.

1. **En-tête de carte** :
   - pictogramme pixel de la source (lignes, trafic, météo, agenda) et son nom en petites capitales ;
   - à droite, l'état « consultée à HH:MM » (heure de jeu), en `blanc50`.
2. **Fait principal**, une phrase en **blanc plein**, taille corps (§ 5). Exemples :
   - « Retard de 18 min (12 min à l'origine) » ;
   - « Pluie 12 mm · rafales 54 km/h ».
3. **Détails en paires clé / valeur**, alignées sur deux colonnes : Nature · Lignes · Heure · Retard
   initial et actuel (prompt 79).
   - Les lignes sont des **pastilles** : numéro réel, avec la couleur de `data/lignes.js` si elle existe,
     et le nom réel à côté.
4. **Citation de la source**, dans un **bloc citation** :
   - liseré `blanc15`, retrait de 16 px ;
   - guillemets typographiques, italique DS si disponible ;
   - **4 lignes au plus**, puis un lien **« Lire tout »** (Entrée), qui déplie la citation complète dans
     la carte, avec défilement si besoin.
5. **Provenance**, en petit (`blanc50`) : nom de la source, date de publication, heure.
   - Une mention distingue l'archive du direct (« Archive Open-Meteo du 14/09 », « En direct »).

Rendu propre à chaque source :
- **Agenda** : chaque événement est un **item de liste**.
  - Le titre est en blanc ; « Lieu, Ville » est en dessous, en `blanc75`, découpé à partir du format réel
    « Titre — Lieu, Ville » (si le format ne correspond pas : texte entier en titre).
  - 3 événements au plus, puis « +n autres » dépliable.
- **Météo** : 3 puces pictogramme + valeur (température min–max, pluie, rafales). Les valeurs qui
  dépassent les seuils du jeu (pluie ≥ 1 mm, rafales ≥ 40 km/h) sont en relief avec un symbole, pas
  seulement la couleur.
- **Info trafic** :
  - les **nombres et les numéros de ligne** présents dans la citation sont mis en gras (mise en relief
    de segments, sans changer le texte) ;
  - si la source donne deux dates contradictoires (prompt 17), les deux sont repérées dans la citation.
- **Lignes** : pastilles de ligne, et « lieu inconnu » clairement signalé si la source ne précise rien.

Source non consultée : un bouton DS clair, avec la touche (5 à 8), le nom de la source et une phrase qui
dit **ce qu'elle va révéler** (« Révèle le retard et le texte de l'alerte »). Plus de libellé technique.

## 4. Mise en page et défilement

- Les cartes prennent **la hauteur de leur contenu**, et non un quart fixe de la zone.
- La zone « Sources » **défile** : molette, glisser, ↑ ↓, avec une barre de défilement DS.
  - À la révélation d'une source, la vue défile jusqu'à elle.
  - Avec `prefers-reduced-motion`, ce défilement est instantané.
- Ordre des cartes :
  - les sources révélées d'abord, **dans l'ordre de consultation** ;
  - puis les boutons des sources restantes.
- **Rien n'est jamais coupé sans indication** : tout texte tronqué porte « … » et un moyen de lire la suite.
- Les onglets Historique et Équipes réutilisent les mêmes composants (§ 1 et § 3) pour leurs textes.
- Apparition d'une carte révélée : fondu de 300 ms (existant), et glissé de 6 px. Les deux sont désactivés
  avec `prefers-reduced-motion`.

## 5. Tailles, contraste, lisibilité

Tailles en coordonnées du canvas 1920×1080 ; l'écran du PC est affiché à 90 % au poste.

| Élément | Taille minimale |
|---|---|
| Corps de texte | 22 px |
| Citation | 21 px |
| Métadonnées | 18 px |
| En-têtes de carte | 16 px en petites capitales |

- **Interligne** de 1,4 environ.
- **Longueur de ligne** limitée à environ 70 caractères : marges internes de 16 à 24 px.
- Contraste ≥ 4,5:1 pour tout texte, y compris `blanc50` sur `blanc05`. Ajuster l'opacité si besoin.
- Le réglage **Contraste renforcé** (prompt 18) passe toutes les métadonnées en `blanc75` et les bordures
  en `blanc50`.
- Polices DS : JetBrains Mono pour les données (chiffres alignés), police texte DS pour les phrases et
  les citations. Pas de police pixel pour le corps : elle est réservée aux titres.

## 6. Accessibilité, mobile, langue

- **Lecture vocale** : à la révélation, `aria-live` lit le **fait principal** et la **citation complète**
  (non tronquée). Avec « Lire tout » ouvert, la région annonce l'ouverture.
- **Clavier** :
  - Tab parcourt les cartes ;
  - Entrée ouvre ou ferme « Lire tout » ;
  - ↑ ↓ fait défiler ;
  - les touches 5 à 8 révèlent, comme aujourd'hui.
- **Mobile** (prompt 60) :
  - cartes pleine largeur ;
  - citation de 6 lignes au plus avant « Lire tout » ;
  - cibles ≥ 44 px.
- **Langue** :
  - libellés, provenance et explications traduits ;
  - la **citation** reste dans sa langue d'origine (donnée réelle), avec la mention « (texte original en
    français) » en anglais ;
  - le changement de langue en pleine partie recalcule les coupures (cache par langue).

## 7. Textes (FR + EN, exemples de clés)

| Clé | Français | English |
|---|---|---|
| `enq.lireTout` | Lire tout | Read all |
| `enq.reduire` | Réduire | Show less |
| `enq.consultee` | consultée à {heure} | checked at {heure} |
| `enq.revele.trafic` | Révèle le retard et le texte de l'alerte | Reveals the delay and the alert text |
| `enq.revele.lignes` | Révèle les lignes concernées | Reveals the lines involved |
| `enq.revele.meteo` | Révèle la météo du jour | Reveals today's weather |
| `enq.revele.agenda` | Révèle les événements du jour | Reveals today's events |
| `enq.autres` | +{n} autres | +{n} more |
| `enq.original` | (texte original en français) | (original text in French) |
| `enq.retardInitial` | Retard initial | Initial delay |
| `enq.retardActuel` | Retard actuel | Current delay |

## 8. Vérifications détaillées

- `npm run build` et `npm test` dans `site/`.
- `site/scripts/test-jeu.mjs` couvre :
  - `couperLignes` : mots longs, URL, retours à la ligne, largeur minimale, cache ;
  - `dessinerTexte` : ellipse en fin de mot et indicateur « tronqué » ;
  - `nettoyerTexteSource` en FR et en EN :
    - entités HTML ;
    - espaces insécables ;
    - nombres et unités ;
    - **le texte cité reste mot pour mot** : comparer les mots avant et après ;
  - découpage « Titre — Lieu, Ville » de l'agenda, avec repli si le format diffère ;
  - aucune estimation `× 1,05` restante (recherche dans le code).
- Partie réelle, en français puis en anglais, au clavier puis à la souris :
  - révéler les 4 sources sur des dossiers réels de chaque type (retard, travaux, affluence, météo,
    accident si présent) ;
  - citation longue → « Lire tout » ;
  - agenda à plusieurs événements → « +n autres » ;
  - défilement ;
  - onglets Historique et Équipes ;
  - même rendu dans l'enquête du Journal.
- Vérification visuelle en 1920×1080 et en 1366×768 :
  - aucun texte qui déborde ou se chevauche ;
  - aucune troncature sans « … » ;
  - tailles minimales respectées ;
  - contraste ≥ 4,5:1, y compris en contraste renforcé.
- Accessibilité :
  - `aria-live` lit la citation complète ;
  - `prefers-reduced-motion` ;
  - aucun flash ;
  - hors ligne ;
  - mobile.
- Aucune régression des prompts 50, 63, 73, 79 et 87, ni des prompts 88, 89 et 91 s'ils sont exécutés.
- Documenter dans `jeu/NN-textes-enquete.md` (numéro libre suivant dans `jeu/`) et ajouter la ligne au
  sommaire de `jeu/README.md`.
- Branche `jeu/prompt-92-textes-enquete`. À chaque push : entrée en tête de `journal.md`. Ne pas fusionner
  dans `main` sans demande.
