---
theme: none
title: Nantes en régulation
titleTemplate: '%s — PATRIMOINE.EXE · NTE001'
author: Mattéo Brevet & Guillaume Renoult
keywords: Nantes, Naolib, régulation, données ouvertes, jeu vidéo, p5.js, PATRIMOINE.EXE, ESD Nantes
info: |
  Présentation du jeu « Nantes en régulation » (ESD Nantes, B3 Design, 9, 10 & 12 novembre 2026).
  Chaîne source → grammaire → système → œuvre. Construit avec Slidev (prompts 82, 94 et 99).
htmlAttrs:
  lang: fr
lang: fr
colorSchema: dark
favicon: /favicon.svg
aspectRatio: 16/9
canvasWidth: 980
highlighter: shiki
lineNumbers: false
defaults:
  layout: default
  transition: fade
routerMode: hash
fonts:
  provider: none
  sans: JetBrains Mono
  mono: JetBrains Mono
drawings:
  enabled: false
download: false
wakeLock: false
seoMeta:
  ogTitle: Nantes en régulation — PATRIMOINE.EXE · NTE001
  ogDescription: Rejouer une semaine réelle du réseau de transports nantais, en salle de contrôle. Présentation du jeu (ESD Nantes, B3 Design, 2026).
  ogImage: https://workshop-design-interactions.pages.dev/presentation/og-image.png
  ogUrl: https://workshop-design-interactions.pages.dev/presentation/
  twitterCard: summary_large_image
  twitterTitle: Nantes en régulation — PATRIMOINE.EXE · NTE001
  twitterDescription: Rejouer une semaine réelle du réseau de transports nantais, en salle de contrôle.
  twitterImage: https://workshop-design-interactions.pages.dev/presentation/og-image.png
layout: cover
hideInToc: true
class: diapo-cover
---

<div class="cover-grille">
<div class="cover-texte entree">
  <p class="surtitre">PATRIMOINE.EXE · NTE001 — ESD Nantes, B3 Design</p>
  <h1 class="titre-cover">Nantes en régulation</h1>
  <p class="accroche">Rejouer une semaine réelle du réseau nantais, en salle de contrôle.</p>
</div>
<section class="fenetre cover-fenetre" aria-label="Le projet en une phrase">
  <header class="fenetre-barre"><span>RégulOS · le projet en une phrase</span><span class="fenetre-boutons" aria-hidden="true"><i></i><i></i><i></i></span></header>
  <div class="fenetre-corps">
    <p class="invite" aria-hidden="true">&gt; ouvrir le dossier NTE001<span class="curseur">_</span></p>
    <p v-click class="phrase">Un jeu de régulation où chaque incident vient d'une <strong>donnée ouverte réelle</strong> de Nantes Métropole.</p>
    <dl class="fiche">
      <div v-click><dt>Auteurs</dt><dd>Mattéo Brevet & Guillaume Renoult · licence MIT</dd></div>
      <div v-click><dt>Groupe</dt><dd>G01 · cours de Kamel Ghabte</dd></div>
      <div v-click><dt>Jouer</dt><dd><a href="https://workshop-design-interactions.pages.dev/">workshop-design-interactions.pages.dev</a> · navigateur, hors ligne</dd></div>
    </dl>
  </div>
</section>
</div>

<p class="pied-cover">9, 10 & 12 novembre 2026 · œuvre <code>PXE-NTE001-G01-W01</code></p>

<!--
Bonjour. Nous présentons « Nantes en régulation », notre œuvre du workshop PATRIMOINE.EXE.
[click] Le projet en une phrase : chaque incident vient d'une donnée ouverte réelle.
[click] Les auteurs, crédits du jeu, licence MIT.
[click] Le groupe G01, cours de Kamel Ghabte.
[click] Où jouer : au navigateur, et hors ligne.
Navigation : ← → pour avancer, Début / Fin pour les extrémités.
-->

---
hideInToc: true
class: diapo-sommaire
---

<div class="sommaire">
<div class="sommaire-titre">
  <p class="surtitre">Sommaire</p>
  <h1>Cinq actes</h1>
  <p class="sommaire-note">De la donnée ouverte à la salle de contrôle, puis à vous.</p>
</div>
<Toc columns="1" minDepth="1" maxDepth="2" />
</div>

<!--
Cinq actes : notre objectif, la chaîne, les sources, le jeu, à vous de réguler. Le sommaire est cliquable.
-->

---
layout: center
transition: slide-left
class: diapo-objectif
---

<p class="surtitre acte">Acte 01</p>

# Notre objectif

<blockquote class="citation-centree">
  <p>Une question, une contrainte : rien d'inventé.</p>
</blockquote>

<!--
Premier acte : notre objectif tient en une question et une contrainte.
-->

---
title: La question
level: 2
class: diapo-question
---

<div class="question">
  <h1>La question</h1>
  <p class="question-texte">« Rejouer une semaine réelle du réseau de transports nantais et prendre, en salle de contrôle, les décisions de régulation qui préservent la fluidité du réseau — chaque incident réel devenant un dossier à trancher. »</p>
  <ul class="puces-meta">
    <li v-click><span>Thème</span>tram, busway, bus</li>
    <li v-click><span>Rôle</span>régulateur</li>
    <li v-click><span>Durée</span>une semaine de journées réelles</li>
  </ul>
</div>

<!--
La phrase-problématique est restée stable depuis le premier jour (jeu/00-concept.md).
[click] Le thème. [click] Le rôle. [click] La durée.
-->

---
title: La chaîne
level: 1
transition: slide-left
class: diapo-chaine
---

<h1 class="sr-only">La chaîne : 0 événement inventé</h1>

<div class="chaine-grille">
<div class="zero">
  <p class="surtitre acte">Acte 02 · La chaîne</p>
  <p class="zero-chiffre" aria-hidden="true">0</p>
  <p class="zero-legende">événement inventé</p>
  <p class="zero-texte">Chaque dossier, chaque notification, chaque tâche vient d'une donnée réelle — ou de la partie elle-même, et c'est alors écrit.</p>
</div>
<ol class="etapes" aria-label="Source, grammaire, système, œuvre">
  <li v-click><b>Source</b><span>données ouvertes</span></li>
  <li v-click><b>Grammaire</b><span>seuils, catégories</span></li>
  <li v-click><b>Système</b><span>signalement → décision → jauges</span></li>
  <li v-click class="etape-oeuvre"><b>Œuvre</b><span>salle de contrôle pixel</span></li>
</ol>
</div>

<!--
Deuxième acte. Notre contrainte la plus forte : zéro événement inventé. Quand la source ne dit pas la ligne ou la durée, le jeu affiche « non précisé ».
[click] La source : uniquement des données ouvertes.
[click] La grammaire : des règles explicites.
[click] Le système : une boucle courte.
[click] L'œuvre : une pièce où l'on s'assoit.
-->

---
title: Le seuil
level: 2
class: diapo-seuil
---

<div class="seuil">
  <p class="seuil-chiffre"><span>≥</span> 10 min</p>
  <div class="seuil-texte">
    <h1>Le seuil</h1>
    <p>de retard réel sur une ligne : la mesure du réseau qui devient un <span v-mark.underline="{ color: '#FFC138', at: 1 }">dossier à trancher</span>.</p>
  </div>
</div>

<div class="jauge" role="img" aria-label="Échelle de 0 à 20 minutes de retard : à partir de 10 minutes, le retard devient un dossier.">
  <div class="jauge-cases"><i v-for="n in 20" :key="n" :class="{ chaud: n > 10 }"></i></div>
  <div class="jauge-graduations"><span>0 min</span><span class="jauge-seuil">10 min · dossier</span><span>20 min</span></div>
</div>

<!--
Le seuil est l'invariant central de la grammaire. Il vient du flux temps réel (GTFS-RT).
[click] En dessous, le réseau absorbe ; au-dessus, c'est au régulateur de décider.
-->

---
layout: section
transition: slide-left
class: acte-03
---

<p class="acte-numero" aria-hidden="true">03</p>

# Les sources réelles

Données ouvertes, licences vérifiées

<!--
Troisième acte : d'où viennent les données, et sous quelles licences.
-->

---
title: Les sources
level: 2
class: diapo-sources
---

# Les sources

<table class="table-ds">
  <thead><tr><th scope="col">Source</th><th scope="col">Ce qu'elle donne au jeu</th><th scope="col">Licence</th></tr></thead>
  <tbody>
    <tr v-click><td><a href="https://data.nantesmetropole.fr/explore/dataset/244400404_transports_commun_naolib_nantes_metropole_gtfs/">Naolib, offre et perturbations</a></td><td>GTFS + changelog daté</td><td>Licence Ouverte</td></tr>
    <tr v-click><td>Naolib, temps réel</td><td>GTFS-RT, retards par ligne</td><td>Licence Ouverte</td></tr>
    <tr v-click><td><a href="https://data.nantesmetropole.fr/explore/dataset/244400404_agenda-evenements-nantes-metropole_v2/">Agenda de Nantes Métropole</a></td><td>événements de la semaine</td><td>Licence Ouverte</td></tr>
    <tr v-click><td><a href="https://open-meteo.com/">Météo Open-Meteo</a></td><td>archive ERA5, pluie à la fenêtre</td><td>CC BY 4.0</td></tr>
    <tr v-click><td>Loire à Nantes (Hub'Eau)</td><td>station M800001010</td><td>Licence Ouverte Etalab</td></tr>
  </tbody>
</table>

<div v-click class="sources-modes">
  <p><span class="badge-ds badge-info">En direct</span> sur le téléphone : parkings, vélos, trafic, pollens — au clic, jamais en boucle</p>
  <p><span class="badge-ds badge-succes">Hors ligne</span> instantanés réels datés, rejoués sans réseau</p>
</div>

<!--
Licences vérifiées à la source le 10 et le 11 novembre (fiche-source, manifest.json).
[click] Offre et perturbations. [click] Temps réel. [click] Agenda. [click] Météo. [click] Loire.
[click] Le téléphone n'interroge le direct qu'au clic ; hors ligne, des instantanés réels datés.
-->

---
layout: section
transition: slide-left
class: acte-04
---

<p class="acte-numero" aria-hidden="true">04</p>

# Le jeu

Lire, décider, assumer

<!--
Quatrième acte : ce que le joueur voit et fait.
-->

---
layout: image-right
image: /img/decision.webp
backgroundSize: contain
level: 2
---

# Décider, sans chrono

<v-clicks>

- Un signalement s'ouvre : l'**horloge se met en pause**
- Trois blocs : ce qui se passe, pourquoi, ce qu'on sait
- Quatre réponses propres à la catégorie
- La pression vient de la journée : le retard s'aggrave en file

</v-clicks>

<div class="sr-only" role="img" aria-label="Capture du jeu : le panneau d'un signalement d'affluence. Flèches vers la mention « Horloge en pause pendant la lecture », vers les trois blocs d'information, vers les cartes de réponse et vers la liste des décisions du jour."></div>
<span class="etiquette" style="left: 790px; top: 108px">horloge en pause</span>
<Arrow x1="850" y1="126" x2="872" y2="176" color="#FFC138" width="3" />
<span class="etiquette" style="left: 600px; top: 430px">3 blocs</span>
<Arrow x1="640" y1="428" x2="712" y2="220" color="#FFC138" width="3" />
<span class="etiquette" style="left: 790px; top: 430px">réponses</span>
<Arrow x1="830" y1="428" x2="816" y2="350" color="#FFC138" width="3" />
<span class="etiquette" style="left: 500px; top: 108px">trace du jour</span>
<Arrow x1="540" y1="126" x2="580" y2="238" color="#FFC138" width="3" />

<!--
Depuis le prompt 87, plus de compteur par décision : on lit à son rythme.
[click] La pause. [click] Les trois blocs. [click] Les réponses. [click] La pression vient du retard qui grimpe.
-->

---
layout: image-left
image: /img/sources.webp
backgroundSize: contain
level: 2
---

# Enquêter

<v-clicks>

- « En savoir plus » : quatre sources à consulter (touches 5 à 8)
- Chaque source est une **carte** : fait principal, détails, citation exacte
- La citation n'est jamais reformulée
- Lecture vocale du texte complet ; Tab et Entrée au clavier

</v-clicks>

<div class="sr-only" role="img" aria-label="Capture du jeu : la carte « Info trafic » d'un signalement, avec la citation exacte de l'agenda. Flèches vers l'en-tête « consultée à 9h03 », vers le fait principal et vers la citation."></div>
<span class="etiquette" style="left: 300px; top: 108px">consultée à…</span>
<Arrow x1="360" y1="126" x2="400" y2="226" color="#FFC138" width="3" />
<span class="etiquette" style="left: 40px; top: 108px">fait principal</span>
<Arrow x1="90" y1="126" x2="214" y2="236" color="#FFC138" width="3" />
<span class="etiquette" style="left: 120px; top: 430px">citation exacte</span>
<Arrow x1="180" y1="428" x2="266" y2="262" color="#FFC138" width="3" />

<!--
Le prompt 92 a rendu les textes d'enquête lisibles : cartes hiérarchisées, coupure réelle, « Lire tout ».
[click] Les sources. [click] La carte. [click] La citation intacte. [click] L'accessibilité.
-->

---
layout: full
title: La salle de contrôle
level: 2
---

<div class="capture" style="left: 40px; top: 30px; width: 900px">
  <img src="/img/bureau.webp" alt="Capture du bureau : la pièce en pixel art avec le PC RégulOS. Flèches vers la fenêtre où il pleut (météo réelle du jour), vers l'écran du PC, vers l'horloge murale et vers le téléphone allumé par une notification." />
</div>
<h1 class="titre-sur-image">La salle de contrôle</h1>
<span class="etiquette" style="left: 120px; top: 160px">pluie réelle du jour</span>
<Arrow x1="170" y1="158" x2="172" y2="100" color="#FFC138" width="3" />
<span class="etiquette" style="left: 440px; top: 330px">PC RégulOS</span>
<Arrow x1="490" y1="328" x2="490" y2="232" color="#FFC138" width="3" />
<span class="etiquette" style="left: 800px; top: 150px">horloge</span>
<Arrow x1="850" y1="148" x2="872" y2="92" color="#FFC138" width="3" />
<span class="etiquette" style="left: 680px; top: 500px">téléphone</span>
<Arrow x1="740" y1="498" x2="784" y2="474" color="#FFC138" width="3" />

<!--
Une pièce vue depuis la chaise : baie sur la ville, la Loire, la grue Titan, la météo réelle à la fenêtre.
On s'installe au PC, on se lève pour téléphoner, on finit la journée d'un geste (« Quitter la journée », Q) ou à l'horloge.
-->

---
layout: image-right
image: /img/telephone.webp
backgroundSize: contain
level: 2
---

# La ville au téléphone

<v-clicks>

- Une appli par source : agenda, météo, travaux, Loire, messages
- Au plus une notification toutes les 20 min de jeu
- Onglet « En direct aujourd'hui », jamais daté de la semaine jouée
- **Ne pas déranger** : seules les alertes passent

</v-clicks>

<div class="sr-only" role="img" aria-label="Capture du téléphone en main. Flèches vers les onglets Notifications, Agenda et En direct, et vers une notification groupée par appli avec son heure."></div>
<span class="etiquette" style="left: 620px; top: 108px">onglets</span>
<Arrow x1="660" y1="126" x2="722" y2="196" color="#FFC138" width="3" />
<span class="etiquette" style="left: 600px; top: 430px">source + heure</span>
<Arrow x1="660" y1="428" x2="722" y2="238" color="#FFC138" width="3" />

<!--
Le téléphone donne la ville en arrière-plan, sans jamais interrompre une décision.
-->

---
layout: image-left
image: /img/journal.webp
backgroundSize: contain
level: 2
---

# Le journal de bord

<v-clicks>

- Pastilles des journées, objectif tenu ou raté
- Tuiles : signalements, bons choix, jauges en mini-courbes
- Frise horaire des décisions, filtres, vue Semaine
- Enquête après coup : source, contexte, dés, effets

</v-clicks>

<div class="sr-only" role="img" aria-label="Capture de l'appli Journal de bord. Flèches vers les tuiles de résumé avec mini-courbes, vers la frise horaire des décisions et vers le bouton « Enquêter »."></div>
<span class="etiquette" style="left: 180px; top: 108px">tuiles</span>
<Arrow x1="210" y1="126" x2="234" y2="190" color="#FFC138" width="3" />
<span class="etiquette" style="left: 60px; top: 430px">frise de la journée</span>
<Arrow x1="130" y1="428" x2="172" y2="262" color="#FFC138" width="3" />
<span class="etiquette" style="left: 360px; top: 430px">enquêter</span>
<Arrow x1="400" y1="428" x2="418" y2="258" color="#FFC138" width="3" />

<!--
Le journal raconte la journée avec les vraies valeurs : on comprend après coup pourquoi une réponse était meilleure.
-->

---
layout: center
title: À vous de réguler
level: 1
transition: slide-left
class: diapo-avous
---

<div class="avous">
<div class="avous-titre">
  <p class="surtitre acte">Acte 05</p>
  <h1>À vous de réguler</h1>
  <p>Au navigateur, au clavier seul, sans son, et sans réseau.</p>
</div>
<div class="billet">
  <p class="billet-etiquette">Jouer</p>
  <p class="billet-lien"><a href="https://workshop-design-interactions.pages.dev/">workshop-design-interactions.pages.dev</a></p>
  <p class="billet-renvoi">Tous les livrables : <Link to="livrables">voir la diapositive des livrables</Link></p>
</div>
</div>

<!--
Cinquième acte. On lance le jeu en direct si le temps le permet ; sinon, la vidéo de démonstration du cartel.
-->

---
title: L'équipe
level: 2
class: diapo-equipe
---

<h1>L'équipe</h1>

<div class="equipe-grille">
  <figure v-click class="fenetre equipe-carte">
    <header class="fenetre-barre"><span>Portrait</span><span class="fenetre-boutons" aria-hidden="true"><i></i><i></i></span></header>
    <img src="/img/equipe/matteo-pp.webp" alt="Portrait de Mattéo Brevet" />
    <figcaption>Mattéo Brevet</figcaption>
  </figure>
  <figure v-click class="fenetre equipe-carte">
    <header class="fenetre-barre"><span>Portrait</span><span class="fenetre-boutons" aria-hidden="true"><i></i><i></i></span></header>
    <img src="/img/equipe/guillaume-pp.webp" alt="Portrait de Guillaume Renoult" />
    <figcaption>Guillaume Renoult</figcaption>
  </figure>
</div>

<p class="equipe-pied">Atelier ESD Nantes · B3 Design · novembre 2026</p>

<!--
Nous deux. Les mêmes portraits sont dans l'écran « Crédits » du jeu (menu principal).
-->

---
routeAlias: livrables
title: Livrables & crédits
level: 2
class: diapo-livrables
---

<div class="livrables-grille">
<section>
  <h1>Les livrables</h1>
  <ol class="liste-livrables">
    <li v-click><b>Le jeu</b><a href="https://workshop-design-interactions.pages.dev/">workshop-design-interactions.pages.dev</a></li>
    <li v-click><b>Le cartel</b><span><a href="/cartel/">/cartel/</a> — captation (hero, détail, process, démo) et QR codes</span></li>
    <li v-click><b>Le making-of</b><span>la chaîne des prompts : <a href="/making-of/">/making-of/</a></span></li>
    <li v-click><b>Les traces</b><span><code>manifest.json</code>, fiche-source, grammaire, version archivée relançable (<code>rendu/</code>)</span></li>
    <li v-click><b>Les tests</b><span>trois semaines rejouées à chaque <code>npm test</code>, audit des textes <code>?audit=textes</code></span></li>
  </ol>
</section>
<aside class="fenetre credits" aria-label="Crédits">
  <header class="fenetre-barre"><span>Crédits</span></header>
  <dl class="fenetre-corps">
    <div><dt>Musiques</dt><dd>libres <strong>CC0</strong> : Komiku, Loyalty Freak Music — <code>audio/CREDITS.md</code></dd></div>
    <div><dt>Données</dt><dd>Nantes Métropole, Naolib, Open-Meteo, Hub'Eau</dd></div>
    <div><dt>Outils</dt><dd>p5.js, Web Audio, Astro, Slidev</dd></div>
    <div><dt>IA</dt><dd>écrit par des assistants IA — Claude Code (Anthropic), ponctuellement Mistral Vibe — à partir des prompts rédigés et relus par le groupe (<code>prompts/</code>, <a href="/making-of/">/making-of/</a>) ; part humaine détaillée : [À COMPLÉTER]</dd></div>
  </dl>
</aside>
</div>

<!--
Tout est versionné dans le dépôt ; la version archivée se lance sans réseau en double-cliquant index.html.
La part humaine et la relecture seront précisées par le groupe (README, section AI usage).
-->

---
layout: end
hideInToc: true
class: diapo-fin
---

# Merci — à vous de réguler.

<div v-click class="fin-action">
  <a class="bouton-ds" href="../">Lancer le jeu<span aria-hidden="true">  ›</span></a>
</div>

<!--
Questions.
[click] Le bouton ouvre la page d'accueil du jeu (même style que les boutons primaires du jeu).
-->
