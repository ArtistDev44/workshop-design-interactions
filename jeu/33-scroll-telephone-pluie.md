# 33 — Passage au PC par la molette, notifications d'événements sur le téléphone, pluie réaliste (prompt 38)

Les décisions Q1–Q61 ne changent pas.

## Molette (`scrollSortiePC`, `bureau.js`)
- **Vers le haut au bureau** : on s'installe au poste (`sAsseoir()`), avec le même zoom et le même clignement qu'au clic sur l'écran.
- **Vers le bas au poste** : on se lève, comme au prompt 26.
- Les deux autres sens ne font rien.
- Garde-fous :
  - seuil cumulé de 100 et anti-rebond de 600 ms ;
  - molette inactive pendant un clignement, une fenêtre, les SMS, le tutoriel ou le menu principal ;
  - au poste, molette également inactive si une app est ouverte, pendant le mail ou pendant le réveil ;
  - au poste, la page ne défile pas.
- Aide (H) : « ↑ s'installer au PC · ↓ ou Échap se lever · bureau : Échap menu ». Le guide « Prendre en main » (prompt 37) mentionne aussi les deux sens.

## Téléphone (`telephone.js`)
- Le téléphone de la pièce devient un objet cliquable (`OBJETS_BUREAU`, zone 364,192 · 26×32) : survol, Tab, Entrée, infobulle.
- Au clic, la **vue téléphone** s'ouvre (fenêtre `telephone`, dessinée par le code) :
  - coque, point caméra, heure du jeu et date du jour joué ;
  - jusqu'à 4 **notifications « Agenda Nantes Métropole »** : titre, type, lieu et ville, heure si elle est publiée ;
  - les notifications glissent une à une (160 ms d'écart), sans animation si les animations sont réduites ;
  - fermeture : Fermer, Échap ou Entrée ;
  - le nombre de notifications est annoncé en `aria-live`.
- Source : Explore API v2.1 d'Open Data Nantes Métropole, jeu `244400404_agenda-evenements-nantes-metropole_v2`, événements non annulés de la date du jour joué (aujourd'hui en mode temps réel). L'appel n'a lieu qu'**au clic** (jamais dans `draw()`), avec un délai de 6 s et un cache par date.
- **Repli** (hors ligne, mode hors ligne forcé, API vide ou en échec) : événements réels de la semaine jouée (`data/semaines.js`, `texte_source` « Titre — Lieu »), ou de l'instantané hors ligne. La source affichée en bas indique « en direct » ou « instantané local ».
- Aucun texte inventé : titres, lieux et heures sont ceux publiés.

## Pluie réaliste (`dessinerPluie`, `bureau.js`)
- Les 220 gouttes sont tirées une seule fois, avec une graine fixe et un LCG local qui ne touche pas aux dés du jeu. Chacune a sa position, sa phase, sa vitesse (0,55 à 1,45), sa longueur (2 à 6 px) et son opacité. 18 % sont des gouttes « proches », plus longues, plus rapides et plus nettes. Plus aucun motif en grille.
- Densité : suit la pluie réelle du jour (`pluie_mm`), de 25 % à 100 % des gouttes.
- Inclinaison : suit les rafales réelles (`rafales_max / 90`, bornée à 0,6).
- 26 gouttes posées sur la vitre glissent lentement et s'estompent.
- Animations réduites : pluie figée et deux fois moins dense.

## Vérifications
- `npm run build` et `npm test` OK.
- Test automatisé, sans erreur console, en FR (en ligne) puis en EN (API bloquées) :
  - molette ↓ au bureau → aucun effet ; ↑ → au poste ; ↑ au poste → aucun effet ; ↓ → au bureau ;
  - téléphone : 4 événements réels du 2/11/2026 via l'API, ou repli sur la semaine ;
  - pluie forcée à 9 mm et 50 km/h : gouttes irrégulières, inclinées.
