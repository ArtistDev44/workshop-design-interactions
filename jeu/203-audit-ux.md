# Prompt 203 — Audit UX complet du jeu « Nantes en régulation »

Date : 13/11/2026. Demande d'origine : « Fais-moi un audit UX complet sur le jeu ».
Ce document ne modifie aucune règle ni aucun écran. Il complète l'audit gameplay du prompt 201 (équilibrage,
tension, bug Community « tardive ») sans le répéter : ici, on regarde **ce que le joueur voit, comprend et fait**.

## Méthode et niveau de preuve

- **Vu en jeu** : le jeu servi en local (`site/public`, commit `740bb2f`), piloté par Chromium sans interface
  (playwright-core en cache npx). Deux parcours :
  1. **démarrage à froid** comme un joueur, au clavier seulement (Tab, Entrée, Espace), en 1366 × 768 ;
  2. **écrans mis en scène** avec `?audit=textes` et `AUDIT_PARCOURS.H` (poste, dossier, sources, conséquence,
     Community, Mails, Journal, Données, Indicateurs, téléphone, Paramètres, Aide, fin de semaine, rapport,
     licenciement), en 1366 × 768 et en mobile portrait 412 × 915.
- **Lu dans le code** : vérifications ponctuelles, avec `fichier:ligne`.
- **Non fait** : aucun test avec un humain, aucun lecteur d'écran réel, aucun test tactile réel. Les rubriques
  « ressenti joueur » restent `[À COMPLÉTER]` après des tests à l'expo.

Captures : `jeu/203-captures/` (01 entrée en jeu, 02 prise en main, 03 dossier, 04 applis, 05 journal / données /
indicateurs, 06–07 mobile).

## En bref — les 7 constats qui comptent le plus

| # | Constat | Gravité | Effort |
|---|---|---|---|
| 1 | **Mobile portrait inutilisable** : texte de 5 à 8 px, HUD illisible, chevauchements, Community rendue en vignette | Bloquant (sur téléphone) | Gros |
| 2 | **Community : Entrée envoie la réponse en tête, qui peut être le clash**, surlignée en rouge comme un bouton principal | Majeur | Petit |
| 3 | **Prise en main surchargée** : 8 étapes, seuils de score (120, 90) et vitesse ×100 expliqués avant le premier dossier ; l'élément montré n'est pas mis en lumière | Majeur | Moyen |
| 4 | **Jargon et abréviations** : `Flu. ≈`, `F +11 R 0 B -4`, `3/3 disponible · -10`, `Somnolence 9 · Z`, « Priorités : budget ≥ 40 · zéro non traité · Objectif… » | Majeur | Petit |
| 5 | **La fiche dossier cache la carte** : le lieu de l'incident et les équipes à glisser sont hors de vue pendant la décision | Majeur | Moyen |
| 6 | **Chevauchements visibles en 1366** : tampon « SIGNALEMENT » sur le titre et la croix ; pied de carte Données ; panneau Indicateurs par-dessus la conclusion | Moyen | Petit |
| 7 | **Rédaction « (s) »** : 133 chaînes d'`i18n.js` avec « dossier(s) », « plainte(s) », « traité(s) »… ; « 0/0. On peut faire mieux. » | Mineur, très visible | Petit |

## 1. Premier contact (menu → partie)

Ce qui marche : menu clair, une action principale (« Nouvelle partie ») avec une promesse chiffrée (« 3 jauges —
10 à 20 min ») ; « Reprendre » grisé avec la raison ; choix du mode avec badge « Recommandé » et mode verrouillé
expliqué ; écran « Avant de jouer » honnête (rien n'est enregistré, le jeu reste jouable sans micro ni caméra) ;
focus clavier très visible (cadre rouge épais) ; intro par SMS de Camille, courte et incarnée.

À améliorer :

- **Icônes sans libellé** : la rangée de 5 icônes (Livrables, Kit de presse, Présentation, Dépôt, Partager) et la pile
  plein écran / télécharger ne se comprennent qu'au survol. Sur tactile il n'y a pas de survol. → Libellé court sous
  chaque icône, ou les regrouper derrière un seul bouton « À propos du projet ».
- **Quatre écrans avant de jouer** (titre → mode → autorisations → SMS). Les autorisations micro / caméra sont
  demandées avant que le joueur sache à quoi sert le café ou la sieste. → Demander chaque autorisation au moment où la
  mécanique apparaît (premier café, première sieste) ; le son seul en amont.
- **Palmarès** : « aujourd'hui en temps réel » en minuscule à côté des « Semaine du… » ; colonnes JAUGES et PROFIL
  vides tant qu'on n'a pas joué → afficher un seul message « Jouez une semaine pour remplir le palmarès ».
- **Licenciement** : sous-titre « Game over » en anglais dans l'interface française ; grande zone vide sous la lettre.

## 2. Prise en main (tutoriel 8 étapes)

- **Trop d'informations d'un coup** : l'étape 2/8 annonce trois jauges, l'accélération ×100, et deux seuils de score
  (120 rappel, 90 dernier avertissement) que le joueur n'a jamais vus. L'étape 3/8 explique la somnolence, la sieste,
  le ×100, l'accumulation et une alerte « 3 s pour réagir ». → Une idée par étape ; les seuils du patron viennent au
  premier rappel à l'ordre, pas avant.
- **Pas de mise en lumière** : tout l'écran est assombri, y compris l'élément désigné (les jauges, la somnolence) ;
  seule une flèche rouge pointe. → Découpe claire (spotlight) autour de la cible.
- **Le temps mort du début** : à 8 h, « 5 à traiter · prochain vers 10h00 » sur une carte vide. Le tutoriel occupe
  ce temps, mais en partie sans guide le joueur ne sait pas s'il doit attendre ou agir. → Message d'attente explicite
  (« Rien à traiter pour l'instant — le temps accélère ») ou premier dossier tôt le premier jour.
- Point positif : « Quitter le guide (Échap) » toujours disponible, numérotation « n/8 ».

## 3. Boucle principale : dossier → décision → conséquence

Ce qui marche : la plainte en bulle avec avatar, les réponses numérotées 1/2/3 + E, l'effet sur les jauges
codé par forme **et** couleur (▲ ▼ ≈), la conclusion « Bon choix, parce que : … » avec la météo réelle du jour,
« Dossier suivant (Entrée) » en gros bouton.

À améliorer :

- **La fiche cache la carte** (capture 03). Le joueur ne voit ni le lieu de l'incident ni le marqueur sur lequel
  glisser une équipe ; l'indication « Glissez une équipe sur un signalement de la carte » est en bas à droite, en gris
  sur noir, loin des équipes. → Fiche ancrée à droite (ou repliable) qui laisse le marqueur visible ; rappel du
  raccourci clavier des équipes dans la fiche.
- **Abréviations des effets** : `Flu. ≈ Rép. ▲ Bud. ▼` sous chaque réponse. Lisible après apprentissage, opaque au
  début. → Initiales en clair la première journée, ou infobulle.
- **Le tampon « SIGNALEMENT »** chevauche « Gravité moyenne » et la croix de fermeture (1366 × 768).
- **Texte tronqué sans accès au reste** : « Événement à l'agenda : Ateliers parents-enfants (Les Cabanes d… »,
  « Commissariat central… », « Semitan (exploitant d… ». Grand vide juste en dessous dans la fiche : la place existe.
- **Compteurs incohérents entre eux** : « Aujourd'hui : 5 à traiter », « DOSSIER 1 / 16 », « Signalements · 1 ·
  actifs 1/3 » sur le même écran. Trois numérotations pour trois périmètres (jour, semaine, carte) non nommés.
  → Un seul compteur visible (« 1er dossier du jour sur 5 ») ; la semaine dans le Journal.
- **Panneau Équipes** : `3/3 disponible · -10` — le « -10 » est un coût en budget, rien ne le dit.
  → « 3 sur 3 libres · coût 10 de budget ».

## 4. HUD et barre du haut

- La barre du haut empile jauges, « Priorités : budget ≥ 40 · zéro non traité · Objectif : fluidité ≥ 40 ✓ », date,
  état « en pause » et heure. Les jauges sont des barres de 50 px sans valeur chiffrée ; les priorités sont du jargon
  en gris. → Valeur chiffrée à côté de chaque jauge ; priorités du jour déplacées dans les Mails (elles y sont déjà,
  dans la consigne du matin) avec un seul rappel court.
- **Somnolence 9 · Z** en bas à droite : ni le sens du chiffre ni celui de la lettre ne sont donnés hors tutoriel.
  → « Fatigue 9 % — Z : se reposer ».
- **Cadre du moniteur** : en 1366 × 768, l'interface du PC perd ~70 px de chaque côté pour dessiner le moniteur ; c'est
  ce qui pousse les textes à 12–14 px. → En vue poste, réduire le cadre ou le supprimer au-dessous de 1440 px.
- « Quitter le PC (Échap) » passe d'un gris peu contrasté (pendant un dossier) à un rouge plein (sinon) : même
  bouton, deux poids visuels — le rouge plein attire l'œil vers la sortie.

## 5. Applis du PC

- **Community** (capture 04) : *constat n° 2*. `focusReponse` est remis à 0 (`os.js:286`, `community.js:645`) ;
  l'ordre des trois réponses est mélangé (`community.js:523`) ; Entrée ou Espace envoie la réponse focalisée
  (`sketch.js:1290`). Quand le clash tombe en première position, il est **rempli de rouge comme une action
  recommandée** et une habitude d'Entrée (prise sur « Dossier suivant (Entrée) ») l'envoie. → Aucun focus initial
  sur une réponse (focus sur le message), et état « focalisé » en contour plutôt qu'en remplissage rouge.
  Le compte à rebours « répondre dans 43 s » est une bonne idée ; il manque la conséquence d'un dépassement.
- **Mails** : riche (catégories, recherche, archives, réponses rapides) — c'est une vraie messagerie, peut-être plus
  que nécessaire pour un jeu de 15 min. La consigne du matin est un bloc dense qui contient les infos clés
  (objectif, budget, priorités). → Mettre ces trois infos en liste en tête du mail ; masquer les catégories vides (0).
- **Journal** : les badges `F +11 R 0 B -4` sont serrés contre la ligne suivante (chevauchement relevé en 1366) ;
  « Pas encore de réponse » sous une plainte sans action proposée.
- **Données** : bonne transparence (source, licence, « Ouvrir l'API »). L'audit des textes relève 3 défauts sur cet
  écran en 1366 : le pied « Source … Central Vigicrues » touche le lien « Ouvrir l'API ».
- **Indicateurs (I)** : le panneau flottant se pose par-dessus la conclusion du dossier et tronque son texte ; les
  détails (« Budget entre 30 et 70 : pompiers indisponibles (palier 70) ») se chevauchent (9 défauts relevés dans cet
  état). → Ancrer le panneau dans la colonne Équipes, ou le fermer à l'ouverture d'un dossier.

## 6. Fin de journée, fin de semaine, échec

- **Mail de fin de semaine** : « 1 dossier(s) traité(s) sur 16 », « Objectifs du jour tenus : 0/0. On peut faire
  mieux. » (la phrase reproche quand il n'y avait rien à tenir).
- **Rapport hebdomadaire** : la mise en page « papier » et le tampon « À SURVEILLER » fonctionnent ; le seuil de la fin
  (« Fin moyenne · score ≥ 150 ») est en 10 px orange sous le tampon. Sous la feuille, la consigne du bureau
  (« … ou Entrée pour vous installer · Tab : objets · Échap : menu ») reste visible derrière « Semaine suivante
  (Entrée) » : deux sens pour Entrée à l'écran.
- **Licenciement** : trois boutons clairs ; la lettre explique la cause et donne un conseil. Bien.

## 7. Accessibilité

Points forts (constatés dans Paramètres) : réduire les animations (et respect du réglage système), contraste
renforcé, palettes daltonisme, taille du texte, lecture facile, secousses réglables (0 / 50 / 100 %), masquer les
commentaires violents, raccourcis rappelés en pied de chaque fenêtre, région `aria-live` et `role="status"` sur le
chargement.

Points faibles :
- Tout le jeu est un canevas : **Tab ne passe jamais dans le DOM** (`document.activeElement` reste `BODY`) ; la
  navigation clavier est réimplémentée par le jeu. Les annonces passent par `#annonces` — à tester avec NVDA /
  VoiceOver `[À COMPLÉTER]`.
- Textes secondaires en gris moyen sur fond noir à 10–12 px (indications d'aide, « Glissez une équipe… »,
  pied de Paramètres) : contraste et taille à mesurer, probablement sous 4,5:1 pour certains.
- Le pied de Paramètres déborde : « … Échap : fermer » coupé sur deux lignes au ras du bord.
- Mobile : cibles et textes très en dessous de 44 px / 16 px (voir § 8).

## 8. Mobile portrait (412 × 915)

Captures 06 et 07. Le menu est correct à part le titre coupé (« Nantes en régulat… ») et le bloc FR/EN qui couvre le
haut. **En partie, l'expérience ne tient pas** :
- la barre du haut est rendue à l'échelle du 16:9, soit 5–6 px de texte ;
- « Somnolence » et une autre étiquette s'écrivent l'une sur l'autre en haut de l'écran ;
- la vue Dossier montre la carte réduite **et** la fiche dessous ; la vue Community n'occupe que le quart supérieur,
  le reste est noir ; le rapport hebdomadaire est une vignette illisible ;
- l'audit des textes du prompt 199 annonçait « 0 défaut à 412 px » : il ne voit pas ces défauts parce qu'il mesure
  le texte avant mise à l'échelle du canevas. → Ajouter à l'audit un contrôle de **taille rendue à l'écran** (taille
  × échelle du canevas ≥ 12 px).

Recommandation : décider explicitement. Soit le mobile portrait est **hors périmètre** et on affiche « Tournez
votre téléphone / jouez sur ordinateur » (l'avis a été retiré au prompt 60b), soit il faut une vraie mise en page
portrait pour le poste (une appli plein écran à la fois, HUD réduit à 3 pastilles chiffrées).

## 9. Rédaction (UX writing)

- **133 chaînes avec « (s) »** dans `i18n.js` → accorder au nombre (`n === 1 ? … : …`).
- Mélange d'anglais : « Game over », « Community », « Mentions ».
- Majuscules et ponctuation irrégulières (« aujourd'hui en temps réel », « 3/3 disponible »).
- Verbes d'action plutôt que noms dans les boutons — déjà le cas presque partout (« Lancer la partie », « Lire le
  rapport »), à garder.

## Feuille de route proposée

| Ordre | Action | Constat | Effort |
|---|---|---|---|
| 1 | Community : pas de focus initial sur une réponse ; focus en contour | 2 | ½ h |
| 2 | Accords « (s) » et « 0/0 » ; « Game over » traduit | 7, § 6 | 2 h |
| 3 | Libellés en clair : coût des équipes, Flu./Rép./Bud., F/R/B du journal, Somnolence | 4 | 2 h |
| 4 | Corriger les 3 chevauchements (tampon, Données, Journal) ; Indicateurs fermé pendant un dossier | 6 | 2 h |
| 5 | Tutoriel : une idée par étape, spotlight, seuils du patron reportés | 3 | ½ j |
| 6 | Fiche dossier ancrée à droite, marqueur visible | 5 | ½ j |
| 7 | Mobile portrait : décider (avis « jouez sur ordinateur » ou vraie mise en page) ; audit de taille rendue | 1 | 1 h ou plusieurs jours |
| 8 | Autorisations micro / caméra au moment de la mécanique | § 1 | ½ j |
| 9 | Tests avec 5 joueurs à l'expo : temps jusqu'au 1er dossier, erreurs Community, compréhension des jauges | tous | `[À COMPLÉTER]` |

## Ce que cet audit ne dit pas

- Rien sur l'équilibrage ni la tension : voir `jeu/201-audit-gameplay.md`.
- Pas de mesure de contraste au pixel : les « probablement sous 4,5:1 » sont à vérifier.
- Le paysage mobile (canevas 16:9 plein écran) n'a pas été capturé.
