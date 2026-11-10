# 40 — Choix de la musique et immersion sonore (prompt 44)

Tout le son est généré en WebAudio : aucun fichier audio, il fonctionne hors ligne et suit l'interrupteur Son (M). Le jeu reste entièrement jouable sans audio. Les décisions Q1–Q61 ne changent pas.

## Musiques (Paramètres → Musique, touche 8)
Quatre morceaux **originaux composés pour le projet**, donc libres de droits, de style chiptune / pixel (`PISTES`, `confort.js`) :

| Clé | Titre | Tempo | Accords | Timbre |
|---|---|---|---|---|
| `origine` | Salle de nuit (d'origine) | 72 BPM | Am7 Fmaj7 C G | arpège triangle, basse sinus |
| `pixel` | Pixel Ville | 112 BPM | C Am F G | arpège carré, basse triangle, batterie 8 bits |
| `loire` | Bords de Loire | 84 BPM | Dm7 B♭maj7 F Cmaj7 | arpège et basse triangle, calme |
| `regulation` | Heure de pointe | 128 BPM | Em C G D | carré, basse carrée, batterie 8 bits |

- Batterie 8 bits : une grosse caisse (sinus qui descend de 140 à 45 Hz) sur les temps forts, un charleston (bruit passe-haut à 6 kHz) sur les contretemps.
- Le choix est mémorisé avec les autres réglages (`Reglages.choisir`, clé `musique`). Changer de morceau le relance tout de suite si le son est actif.
- Note : la demande parlait d'« importer » des musiques libres de droits. J'ai composé des morceaux originaux en code, ce qui évite toute vérification de licence, ne pèse rien et respecte la règle « aucun fichier audio » des prompts 27 et 30.

## Les 7 pistes d'immersion sonore
| # | Ajout | Déclenchement | Synthèse |
|---|---|---|---|
| 1 | Salle vivante : murmures radio d'ambiance, et une annonce radio liée à la ligne du dossier | Au hasard (environ une fois toutes les 40 s en partie) ; 0,7 s après l'arrivée d'un dossier qui cite une ligne | Rafales de bruit en passe-bande à 1,7 kHz, légère distorsion « talkie », une rafale par signe du nom de ligne (hauteur propre à chaque signe), bip de fin de transmission. S'ajoute au souffle et au ronron de ventilation existants. |
| 2 | Alerte propre à la source | Arrivée d'un dossier (`Son.alerteDossier`) | **GTFS-RT, retard** : deux tons carrés descendants. **Open-Meteo, alerte météo** : sirène sinus montante puis descendante. **Archives, perturbation** : trois impulsions. **Agenda, affluence** : accord. L'intensité monte avec le nombre de dossiers restants dans la journée (×1 à ×1,8). |
| 3 | Compte à rebours sous pression | Les 10 dernières secondes d'un dossier | Tic-tac carré, de plus en plus aigu et fort, toutes les 1 s, puis 0,5 s, puis 0,25 s |
| 4 | Clic de console par action | Chaque décision | Dévier : deux tons montants. Retenir : bruit sourd. Renfort : triple impulsion. Ne rien faire : clic mat. Compteur à 0 : alerte. |
| 5 | Jauges audibles | Après la décision | Une jauge qui baisse de 8 ou plus déclenche un *stinger* grave. Une hausse totale de +8 ou plus déclenche un carillon léger. |
| 6 | Météo en couche sonore | Contexte réel du jour (`meteoFenetre()`) | Pluie (existante), **vent** si les rafales atteignent 50 km/h (bruit passe-bas qui ondule), **canicule** si la température atteint 30 °C (stridulations de cigales, le jour). Fondus d'environ 1 s. |
| 7 | Signature de fin | Fin de semaine (rapport ou cinématique) | Bonne fin : arpège majeur montant. Fin moyenne : motif suspendu. Mauvaise fin : descente mineure. |

## Vérifications
- `npm run build` et `npm test` OK.
- Test automatisé en semaine difficile, sans erreur console :
  - touche 8 : Salle de nuit → Pixel Ville → Bords de Loire, choix mémorisé dans `localStorage`, musique relancée ;
  - signaux déclenchés : alerte de dossier (perturbation), tic-tac de plus en plus urgent, radio, clic d'action, jauges, signature de fin ;
  - contexte d'ambiance calculé avec pluie, vent et chaleur.
- Tests des prompts 25 à 42 relancés, sans régression.

## Musiques CC0 importées (10/11/2026)
- Trois vrais morceaux chiptune **sous licence CC0 1.0** de **Komiku**, importés depuis Wikimedia Commons dans `site/public/audio/`. La licence a été vérifiée sur la page de chaque fichier via l'API Commons, et l'empreinte SHA-1 contrôlée au téléchargement :
  - « Chillin' Poupi » (40 s, calme), **musique par défaut** d'un nouveau joueur ;
  - « Travel to the Horizon » (96 s, entraînant) ;
  - « Night in a seashell » (64 s, nocturne).
- Formats : `.ogg` (originaux Vorbis) et `.mp3` (128 kb/s, conversion ffmpeg) pour les navigateurs qui ne lisent pas l'OGG. Au total, 7,3 Mo.
- Crédits et sources : `site/public/audio/CREDITS.md`. Ils sont aussi rappelés dans les Paramètres, sous la ligne « Musique ».
- Lecture : un élément `<audio>` en boucle, avec un fondu d'entrée de 2 s et de sortie de 0,6 s. Il démarre au premier geste et suit l'interrupteur Son (M). Il fonctionne hors ligne et par double clic, car les fichiers sont locaux.
- Les quatre morceaux composés en code restent proposés. La touche 8 fait défiler les 7 morceaux.
- OpenGameArt n'a pas pu servir de source : le site refuse les lectures automatisées (erreur 403). Je ne l'ai pas contourné.
- Test : lecture OGG active et qui avance, passage au morceau suivant, retour aux morceaux en code, coupure et relance du son, sans erreur console.
