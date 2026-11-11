# 88 — Des textes d'enquête lisibles dans Signalements (prompt 92)

Code :
- `site/public/texte.js` (nouveau, chargé avant `enquete.js`) : `TexteUI`, `couperLignes`, `hauteurTexte`, `dessinerTexte`, `nettoyerTexteSource`.
- `enquete.js` : `modeleSource`, `carteSource`, `corpsEnquete`, `annonceSource`, défilement, clavier.
- `carte.js` : onglets Historique et Équipes.
- `journal.js` : volets « Ce qui s'est passé » et « Contexte » de l'enquête du Journal.
- Branchements : `panneau.js` (place de la zone), `sketch.js` (clavier, molette), `mobile.js` et `portrait.js` (glisser).
- Textes : `i18n.js` (clés `enq.*`).
- Tests : `scripts/test-jeu.mjs`.

## Composant de texte (§ 1)
- **`couperLignes(texte, largeur, police, taille)`** coupe mot par mot, d'après la mesure réelle (`textWidth`).
  - Un mot trop long est coupé après `/ - . _ ? & =` s'il y en a (URL, « C1/C2 »), sinon avec un trait d'union.
  - Les retours à la ligne de la source sont gardés.
  - Le résultat est mis en cache par (texte, largeur, police, taille, langue) ; le cache est vidé au-delà de 800 entrées.
- **`dessinerTexte(texte, x, y, largeur, options)`** accepte les options suivantes :
  - `maxLignes`, avec une ellipse « … » placée **après un mot entier** ;
  - couleur, alignement, interligne (1,4 par défaut), style ;
  - `relief` : les segments mis en gras ne changent pas le texte.
  - La fonction renvoie `{ h, tronque, lignes }`.
- Plus aucune estimation `textWidth × 1,05` dans `enquete.js`, `carte.js` ni `journal.js` (contrôlé par le test).

## Nettoyage typographique (§ 2)
`nettoyerTexteSource(texte, langue)` s'applique à l'affichage seulement ; les données ne sont pas modifiées.
- **Commun** :
  - entités HTML décodées et balises retirées ;
  - espaces multiples réduites, espaces de début et de fin supprimées ;
  - « … » à la place de « ... », ponctuation doublée réduite.
- **Français** :
  - espace fine insécable avant `; : ! ?` (pas dans « 15:00 » ni dans une URL), dans « » ;
  - apostrophe `’` ;
  - virgule décimale (« 50,4 ») ;
  - espace insécable des milliers à partir de 5 chiffres (les années restent intactes) ;
  - espace insécable avant min, mm, km/h, km, °C et %.
  - Les heures gardent le format du jeu.
- **Anglais** : pas d'espace avant la ponctuation, guillemets “ ”, point décimal.
- **Mot pour mot** : le test compare les mots (lettres et chiffres) avant et après nettoyage, sur toutes les citations réelles des 3 semaines, en FR et en EN.

## Carte d'une source révélée (§ 3)
Chaque carte a un fond blanc 5 %, une bordure blanc 15 % (50 % en contraste renforcé) et un liseré à gauche. Elle comprend, dans l'ordre :
1. **En-tête** : pictogramme pixel de la source, nom en capitales (16 px) et, à droite, « consultée à 9h40 » (heure de jeu de la consultation).
2. **Fait principal** en blanc plein et en gras (22 px). Exemples :
   - « Retard de 18 min (12 min à l'origine) » ;
   - « Pluie 7,4 mm · rafales 31 km/h ».

   Un manque (« lieu inconnu ») est en orange, précédé de ⚠.
3. **Paires clé / valeur** sur deux colonnes : Nature, Heure, Retard initial, Retard actuel.
   - Si la citation contient deux dates différentes (prompt 17), une paire « Dates citées » les liste.
   - **Pastilles de ligne** : numéro réel dans la couleur réelle de `data/lignes.js`, texte blanc ou sombre selon la luminance, et le nom réel à côté.
4. **Citation de la source**, dans un bloc citation :
   - liseré à gauche, retrait de 18 px, guillemets typographiques, italique 21 px ;
   - nombres et numéros de ligne en gras ;
   - 4 lignes au plus (6 sur mobile), puis **« Lire tout »** (Entrée ou clic), qui déplie la citation dans la carte.
5. **Provenance** en 18 px gris : nom réel de la source, puis « Archive du 14/09 » ou « En direct », puis l'heure.

Rendu propre à chaque source :
- **Agenda** : un item par événement, découpé à partir du format réel « Titre — Lieu, Ville » (repli : texte entier en titre).
  - 3 événements au plus, puis « +n autres » dépliable.
- **Météo** : 3 puces (températures, pluie, rafales). Au-delà des seuils du jeu (pluie ≥ 1 mm, rafales ≥ 40 km/h), la puce est marquée ⚠, en gras et en orange.
- **Info trafic** : nombres, dates et numéros de ligne en relief.
- **Lignes** : pastilles, et « lieu inconnu » signalé si la source ne précise rien.

Les sources non consultées sont des boutons DS avec la touche (5 à 8), le nom de la source et ce qu'elle révèle (« Révèle le retard et le texte de l'alerte »). En défi chrono, le coût s'affiche aussi (« −4 s au compteur »).

## Mise en page, défilement (§ 4)
- Les cartes prennent la hauteur de leur contenu. Une passe de mesure et une passe de dessin utilisent le même calcul.
- Ordre des cartes : les sources révélées d'abord, dans l'ordre de consultation, puis les boutons des sources restantes.
- La zone défile à la molette, au glisser (souris, ou doigt en mobile paysage) et avec ↑ ↓.
  - Une barre de défilement DS est affichée.
  - À la révélation d'une source, la vue défile jusqu'à sa carte, instantanément avec les animations réduites.
- Apparition d'une carte : fondu de 300 ms et glissé de 6 px, tous deux supprimés avec les animations réduites.
- Les boutons d'une carte ne sont cliquables que s'ils sont entièrement visibles dans la zone.
- Prompt 93 : le décalage de 50 px des cartes de réponse, ajouté ici pour agrandir la zone des sources, a été annulé. Il coupait l'explication des cartes (défaut B relevé par l'audit des textes) ; la zone des sources reste à 238 px et défile.
- **Historique** et **Équipes** utilisent le composant partagé.
  - Les rangées d'Équipes prennent leur hauteur de la zone. Pendant les 5 s du message d'envoi, elles passent sur une seule ligne, pour ne plus déborder sur le conseil.

## Tailles, contraste (§ 5)
- Tailles : corps 22 px, citation 21, métadonnées 18, en-têtes 16 ; interligne 1,4 ; lignes limitées à environ 70 caractères.
- Couleurs : métadonnées en `C.gris` (60 % de blanc, 85 % en contraste renforcé), soit environ 6:1 sur le fond du panneau.
- Contraste renforcé : bordures et liserés passent à blanc 50 %.
- Police : JetBrains Mono pour le corps ; la police pixel reste réservée aux titres.

## Accessibilité, mobile, langue (§ 6)
- `aria-live` annonce, à la révélation : le nom de la source, le fait principal, les détails, la **citation complète** (jamais tronquée), la liste et la provenance. « Lire tout » annonce l'ouverture.
- Clavier, quand « En savoir plus » est ouvert sur Sources :
  - Tab et Maj+Tab parcourent les cartes, avec un focus en double bordure ; après la dernière carte, Tab reprend son rôle habituel ;
  - Entrée ouvre ou ferme « Lire tout », ou révèle une source non consultée ;
  - ↑ ↓ font défiler ; 5 à 8 révèlent, comme avant.
- Mobile : cartes pleine largeur, 6 lignes de citation, boutons de 44 px et plus.
- Langue :
  - libellés et provenance traduits ;
  - la citation reste en français, avec « (original text in French) » en anglais ;
  - le cache de coupure dépend de la langue.

## Vérifications
- `npm run build` et `npm test` passent : 317 contrôles smoke et 384 contrôles du jeu, dont 10 nouveaux.
- Partie réelle en Chromium, en FR et en EN, en 1920×1080 et en 1366×768 :
  - perturbation (contradiction de dates), événement, alerte météo ;
  - les 4 sources révélées au clavier ;
  - Tab, Entrée, ↓ ;
  - onglets Historique et Équipes (avec le message d'envoi) ;
  - enquête du Journal ;
  - mobile paysage (915×412) et animations réduites.
  - Aucune erreur de console.
- **Non vérifié par un outil** : le contraste mesuré pixel par pixel. Il est estimé à partir des opacités (`C.gris` 0,6 sur #171616, soit environ 6:1).
- **Test humain** de lisibilité : [À COMPLÉTER].
