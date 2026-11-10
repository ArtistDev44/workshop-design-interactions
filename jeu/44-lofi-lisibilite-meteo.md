# 44 — Son lofi discret, lisibilité du PC, météo selon le mode (prompt 49)

## Musique lofi et sons en retrait
- Trois vrais morceaux lo-fi **CC0** de Loyalty Freak Music (Wikimedia Commons, SHA-1 vérifiés) :
  « Softly » (par défaut), « Work », « Standing » — `audio/lofi-*.ogg` + `.mp3`, crédits dans
  `audio/CREDITS.md`. Commons affiche encore « License review needed (audio) » sur ces pages :
  **[À COMPLÉTER] vérification humaine de la licence à la source** avant diffusion publique.
- Les joueurs qui avaient l'ancien défaut (« Chillin' Poupi ») passent une fois au lofi ; un choix fait
  à la main ensuite est conservé. Les autres morceaux restent au choix (Paramètres, touche 8).
- **Gain maître des bruitages 0,5 → 0,16** : ambiance de salle, radio, bips, tic-tac, signaux des jauges,
  pluie et vent passent en fond. La musique lofi joue par son propre élément audio (volume 0,3), elle
  reste donc devant. Les morceaux composés en code gardent leur niveau (bus 0,05 → 0,15).

## Lisibilité de l'écran du PC
- Tout texte dessiné sur l'écran du PC (RégulOS, appli Régulation, applis) fait **au moins 18 px**
  (≈ 16 px à l'écran, le PC étant affiché à 90 %), en plus du réglage « Taille du texte » (prompt 48).
  Appliqué au moment du dessin (`textSize`, espace « pc »), sans toucher chaque appel.
- Petits titres en police pixel : pixels ×2 sous 40 px (au lieu de ×4), sinon « AUCUN INCIDENT » était
  dessiné à 6 px puis agrandi, donc illisible.
- Contrôle au rendu réel (1920×1080) : appli Régulation (attente, dossier, conséquences), bureau RégulOS,
  Patron, Carte, Community, Journal, Indicateurs, Corbeille. Les lignes d'effet sous les boutons d'action
  et le conseil, trop serrés, disparaissent au prompt 50 (enquête par les sources).

## Carte sans météo
- Plus aucune information météo sur la carte de l'appli Régulation (ni pictos, ni ligne « météo du jour,
  rafales »). La météo reste visible par la fenêtre de la pièce.

## Climat selon le mode de jeu
- **Partie en direct** : météo Open-Meteo chargée en direct au lancement de la partie, puis rafraîchie
  toutes les 30 minutes (minuterie, jamais dans `draw`).
- **Semaine passée / hors ligne** : météo **archivée du jour joué** (`semaine.meteo`, ERA5), jamais la
  météo d'aujourd'hui (avant, elle servait de repli).
- Hors partie (menu) : météo du moment, sinon l'instantané local.
- Concerne la fenêtre, la pluie et le vent sur la vitre, les ambiances sonores, la plante. La fenêtre cite
  sa source : « (archive Open-Meteo de la semaine jouée) » ou « (Open-Meteo, en direct) ».

## Vérifications
- `npm run build`, `npm test` (72 + 127 contrôles).
- Chromium : premier geste → requête `audio/lofi-softly.ogg`, gain maître 0,16 ; menu : météo du
  10/11/2026 (API) ; semaine du 02/11 : fenêtre « Météo du 02/11/2026 … 13,4 °C … (archive Open-Meteo de
  la semaine jouée) » ; captures de toutes les applis ; aucune erreur console.
- Partie en direct non rejouée dans le test (elle dépend du flux GTFS-RT du moment) : même fonction
  `meteoFenetre`, branche « direct » vérifiée sur le menu.
