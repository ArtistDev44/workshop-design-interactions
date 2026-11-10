# 24 — Bandes sonores et ambiances (prompt 30)

Décisions verrouillées. En plus de la musique (prompt 27) et des bips (prompt 18), le jeu a désormais des ambiances liées au contexte réel et des signaux sonores d'événements. Tout est synthétisé en WebAudio : aucun fichier audio. Tout suit l'interrupteur Son (M) et ne démarre qu'au premier geste du joueur.

Note de numérotation : le prompt demandait `jeu/17-bandes-sonores.md`, mais le n° 17 est déjà pris (profondeur tactique). Ce fichier prend donc le n° 24.

## Ambiances (`Confort.Son.ambiances`, `confort.js`)
| Couche | Synthèse | Volume cible |
|---|---|---|
| Pluie | Bruit blanc en passe-bande 2,6 kHz (Q 0,6), ondulation lente 0,13 Hz (±30 %) | 0,02 si pluie ≥ 1 mm, 0 sinon |
| Ville | Bruit passe-bas 160 Hz, grondement lointain | 0,05 le jour, 0,012 la nuit (20 h – 7 h simulées) |
| Tram au loin | Glissando en dents de scie 70 → 110 → 80 Hz passé au passe-bas 380 Hz, 3 s, toutes les 40 s | crête 0,012, seulement le jour |

- Le contexte est réévalué une fois par seconde dans `draw()` (`majAmbianceSonore()`) :
  - pluie : la même source que la fenêtre (`meteoFenetre()`, prompt 29), soit la météo réelle du jour joué, puis Open-Meteo, puis l'instantané local ;
  - nuit : l'heure simulée (`heureAffichee()`) ;
  - actif : le PC est allumé ou une partie est en cours. Sur l'écran d'accueil PC éteint, seule la musique joue.
- Changement de contexte : `setTargetAtTime` avec une constante de 0,33 s, soit un fondu d'environ 1 s, sans à-coup. Quand le volume cible est 0, le silence est total : l'ondulation agit sur un étage placé avant le volume cible.

## Signaux d'événements (`Confort.Son.bip(type)`)
| Type | Quand | Timbre |
|---|---|---|
| `incident` | Arrivée d'un dossier (`nouveauDossier()`), avec la bordure rouge le cas échéant | Carré filtré, deux tons descendants 784 → 587 Hz, 0,32 s |
| `consequence` | Compteur à 0 (`decider('temps')`), réveil raté compris | Dents de scie filtrées, trois notes descendantes, 0,7 s |
| `mail` | Fin de journée (`phase = 'mail'`) | Carillon sinus montant 1 047 → 1 319 → 1 568 Hz, 0,54 s |
| `Son.clic()` | Tout clic sur une zone active au poste | 12 ms de bruit en passe-bande 2,5 kHz |

- Tous les signaux durent moins d'1 s, à faible volume (crête ≤ 0,1), et sont passés au passe-bas. Aucun effet visuel ne s'y ajoute : les bordures rouges du prompt 20 restent l'alerte prioritaire.

## Réglages
- Un seul interrupteur, Son (M) / Paramètres : M coupe la musique, l'ambiance de la salle, les ambiances contextuelles et les signaux, et l'état persiste dans `localStorage`.
- Libellé : « Son (musique, ambiances, alertes) » / « Sound (music, ambience, alerts) ».

## Vérifications
- `npm run build` OK.
- Test automatisé, sans erreur console :
  - aucun `AudioContext` avant le premier geste ; après Tab, contexte *running* et couches créées ;
  - en partie (semaine du 14/09, jour sec), pluie à 0 et ville à 0,05 ;
  - signal `incident` à l'arrivée du premier dossier ;
  - M → couches et musique arrêtées.
