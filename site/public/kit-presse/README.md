# Kit de presse — « Nantes en régulation »

Page du kit : `index.html` (https://workshop-design-interactions.pages.dev/kit-presse/), aussi ouvrable depuis le
menu principal du jeu (bouton « Kit de presse »). Tous les fichiers sont servis tels quels et disponibles hors ligne
après une première visite (précache du service worker).

| Fichier | Format | Taille | Licence | À quoi il sert |
|---|---|---|---|---|
| `index.html` | HTML | 12 Ko | MIT (code du dépôt) | Page du kit : communiqué, visuels, vidéo, logo et liens, lisible au clavier et sur mobile |
| `communique-de-presse.txt` | texte brut (UTF-8) | 2 Ko | [À COMPLÉTER] | Communiqué de presse en français, à copier dans un article ou un programme d'événement |
| `communique-de-presse.md` | Markdown | 2 Ko | [À COMPLÉTER] | Même texte, avec titres et puces en Markdown |
| `hero.jpg` | JPEG 1920 × 1080 | 200 Ko | [À COMPLÉTER] | Capture du poste : un signalement réel ouvert, trois répliques, équipes, pour illustrer un article |
| `detail-01.jpg` | JPEG 1920 × 1080 | 179 Ko | [À COMPLÉTER] | Capture de l'appli Mails : boîte de réception, consigne du jour, réponses rapides |
| `process.jpg` | JPEG 1920 × 1080 | 206 Ko | [À COMPLÉTER] | Capture du rapport papier de fin de semaine (mode histoire) |
| `thumb.jpg` | JPEG 640 × 360 | 40 Ko | [À COMPLÉTER] | Vignette (réseaux sociaux, listes d'événements) et image d'attente de la vidéo |
| `logo.svg` | SVG 16 × 16 (pixel art) | 1 Ko | [À COMPLÉTER] | Logo du jeu (bulle-pin rouge), à agrandir sans lissage, lisible sur fond sombre comme clair |
| `../captures/demo.mp4` | MP4, 29 s, sans son | 1,2 Mo | [À COMPLÉTER] | Vidéo de démonstration : une vraie partie, du menu au rapport de la semaine |
| `../captures/trailer.mp4` | MP4 1920 × 1080, 30 s, avec musique | 7,7 Mo | images : [À COMPLÉTER] ; musique : CC BY 4.0 (`trailer/CREDITS.md`) | Trailer (prompt 187), image d'attente `../captures/trailer-poster.jpg`, description textuelle `../captures/trailer.fr.vtt` ; hors précache, en ligne seulement |

Les vidéos ne sont pas copiées dans le kit : la page pointe vers `../captures/demo.mp4` et `../captures/trailer.mp4`
(mêmes fichiers que le cartel et le trailer), pour ne pas alourdir le dépôt ni le précache hors ligne. Le trailer
(8 Mo) est exclu du précache : il ne se lit qu'en ligne. Les captures sont des copies de `../captures/` : en cas de
nouvelle captation, recopier les fichiers ici.

Crédit musical exact du trailer (`trailer/CREDITS.md`) :

```
"Heroic Age" Kevin MacLeod (incompetech.com)
Licensed under Creative Commons: By Attribution 4.0 License
http://creativecommons.org/licenses/by/4.0/
```

Les captures `hero.jpg`, `detail-01.jpg` et `thumb.jpg` ont été refaites le 12/11/2026 au soir depuis le jeu actuel (vrai rendu, partie de la semaine 1, sans mise en scène) ; `process.jpg` et `demo.mp4` datent de l'après-midi (commit 812d094).

Le fichier `LICENSE` du dépôt couvre le code et la documentation (MIT, © 2026 Mattéo Brevet & Guillaume Renoult) ;
les conditions de réutilisation des images, de la vidéo, du logo et du communiqué par la presse restent à préciser
par les auteurs ([À COMPLÉTER]).

Liens : jeu https://workshop-design-interactions.pages.dev/ · présentation
https://workshop-design-interactions.pages.dev/presentation/ · dépôt
https://github.com/ArtistDev44/workshop-design-interactions · licence
https://github.com/ArtistDev44/workshop-design-interactions/blob/main/LICENSE
