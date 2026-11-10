# 19 — Bandes sonores, ambiance et musique (prompt 30 et demande de piste musicale)

Décisions verrouillées.
- Aucun fichier audio binaire : tout est synthétisé en WebAudio par `site/public/audio.js`. C'est donc 100 % local, sans licence, et ça fonctionne hors ligne.
- Le timbre est « 8 bits feutré » (ondes carrées, pulse 25 %, triangle, bruit filtré), accordé au décor pixel.
- Tout suit l'interrupteur **Son (M)**. Le son démarre au premier geste du joueur.

## Ambiance de la pièce (derrière la baie vitrée)
Toute l'ambiance passe par un filtre passe-bas « vitre » : on l'entend depuis l'intérieur du bureau.

La météo utilisée est la même pour l'image et pour le son (`meteoDecor()`) : celle du jour joué (Open-Meteo archive, ou instantané hors ligne). Hors partie, c'est la météo réelle du moment.

| Couche | Source réelle | Réglage |
|---|---|---|
| Pluie : souffle + gouttes sur la vitre (position stéréo aléatoire) | `pluie_mm` du jour | dès 1 mm, comme la pluie dessinée ; plus dense jusqu'à ~12 mm |
| Vent : souffle passe-bande ondulant + rafales qui montent et retombent | `rafales_max` (km/h) | audible dès ~20 km/h, plein vers 75 km/h ; rafales plus fréquentes avec le vent |
| Ville : rumeur grave + tram au loin (roulement et cloche) toutes les 40 à 100 s | heure simulée | de jour seulement |
| Nuit (avant 7 h, après 20 h) | heure simulée | ville presque éteinte, musique plus sombre |
| Ventilation de la salle | — | conservée du prompt 18 |

Quand le contexte change, l'ambiance passe en fondu d'environ 1 s. Au poste, elle baisse légèrement.

## Musique du jeu (composition originale, boucle de 4 mesures, la mineur)
| Humeur | Quand | Caractère |
|---|---|---|
| accueil | écran d'accueil | 70 bpm, arpège doux, sans percussion |
| jeu | surveillance du réseau | 78 bpm, arpège, basse, mélodie, charleston sur les contretemps |
| tension | incident en cours (dossier, contradiction, conflit, réveil) | 92 bpm, basse martelée, accord de mi (dominante), doubles croches |
| fin | écran de fin | résolution en majeur (do – sol – la mineur – fa) |

- L'humeur change au début de la mesure suivante.
- La musique est feutrée sous la pluie, plus sombre la nuit, et baisse en pause.
- Paramètres → **5 « Musique du jeu »** coupe la musique seule ; l'ambiance reste.

## Signaux d'événements (< 1 s)
| Signal | Déclencheur |
|---|---|
| `incident` : deux notes descendantes répétées | arrivée d'un dossier |
| `consequence` : note grave qui retombe | compteur à 0 |
| `mail` : petit arpège montant | mail de fin de journée |
| `clic` : tic très bref | clic au poste |

Les bips existants (action, choix, fin…) sont conservés. Aucun son ne remplace une alerte visuelle.

## Vérifié
- Le graphe audio se construit sans erreur, les fondus suivent la météo du jour, et l'humeur passe `accueil` → `jeu` → `tension`.
- M coupe puis relance l'ordonnanceur ; tous les signaux jouent ; `npm run build` passe.
- L'écoute réelle reste à faire au casque : volumes et goût.
