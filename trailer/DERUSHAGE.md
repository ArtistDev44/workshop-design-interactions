# Dérushage — `assets/clips/partie-complete.mp4`

Capture du 2026-11-12 (`scripts/capture.mjs`, 2ᵉ prise) : jeu servi en local depuis `site/public` à l'état de
`main` au commit df0c686 (prompts jusqu'à 193 compris), **hors réseau** (données de repli), Chromium headless
1920×1080, `prefers-reduced-motion` désactivé, guide « Prendre en main » décoché, curseur dessiné par-dessus la page.
Durée **366,4 s**, H.264 30 i/s, **semaine complète jusqu'au rapport**. Journal des gestes :
`assets/clips/partie-complete.log.txt` (horloge du script ; la vidéo a 0 à 3 s d'avance sur ce journal, les repères
ci-dessous sont lus sur l'image).

1ʳᵉ prise écartée (`assets/raw/essai1-bloque-inspection.mp4`, non versionnée) : bloquée 13 min sur la fenêtre
« Inspection surprise », qu'Échap ne ferme pas (il faut répondre 1–3). Script corrigé, puis capture relancée.

| Début | Fin | Ce qu'on voit | Intérêt trailer |
|---|---|---|---|
| 0,0 | 6,0 | Menu principal (Nouvelle partie, Livrables, Kit de presse, plein écran) | faible : titre déjà au carton |
| 6,0 | 14,0 | « Nouvelle partie » : mode histoire, guide décoché, « Lancer la partie » | faible |
| 14,0 | 17,0 | « Avant de jouer » (autorisations) | écarté (écran technique) |
| 17,0 | 20,0 | Carton « JOUR 1/6 — SEMAINE 1 · lundi 14 septembre » | **fort** : tension |
| 21,0 | 29,0 | Téléphone : messages de Camille, cheffe de salle (« Bienvenue à la régulation ! ») | **fort** : tension |
| 30,0 | 33,5 | Tutoriel « Votre rôle » (livre) | moyen |
| 34,0 | 42,0 | Vue du bureau : baie sur la Loire, grue, PC (carte), horloge, téléphone ; survol « S'installer au PC » | **fort** : accroche |
| 42,0 | 45,5 | Clic sur l'écran : la caméra du jeu entre dans le PC, l'appli Carte s'ouvre | **fort** : révélation |
| 45,5 | 51,0 | Carte du réseau, signalement « 10h00 · Affluence supposée · Les Cabanes des Loulous, Couëron » | fort : tension |
| 51,0 | 54,0 | Dossier 1/16 : @coincee_dans_la_foule, Ateliers parents-enfants, réponses | **fort** : preuve |
| 54,0 | 72,0 | Équipe Police glissée vers le signalement, trajet orange | moyen (geste lent : passé ×2) |
| 78,0 | 83,0 | Dossier rouvert, curseur sur la réponse 2 puis choix | **fort** : preuve |
| 83,0 | 88,0 | Journal de la salle « Renforcer la fréquence » ; jauges du bandeau | **fort** : preuve |
| 88,0 | 118,0 | Fenêtre « Préparer un événement » (agenda réel) | écarté (fenêtre fixe) |
| 126,0 | 129,0 | Dossier « Fictif · Ligne 1 · Gravité élevée » | fort : climax |
| 129,5 | 135,0 | Journal « 14/09/2026 11:45 — Ligne 1 · Calmer la situation » | fort : climax |
| 149,0 | 153,0 | Dossier « Alerte météo signalée · Gravité élevée » (38 °C relevés) | fort : climax |
| 154,0 | 158,0 | Journal « 14/09/2026 15:00 — température » | climax |
| 168,0 | 171,0 | Paupières : sieste puis réveil | moyen |
| 171,0 | 173,5 | « Rapport du soir » (choix d'objectif) | moyen |
| 174,0 | 177,0 | « Fin de journée » : +67 XP, fait marquant | **fort** : climax |
| 177,0 | 183,0 | Bureau à la tombée de la nuit, « Fin de journée. » | moyen |
| 184,0 | 186,0 | Sortie par la porte EXIT, nuit sur la ville | moyen |
| 187,0 | 192,0 | SMS de Camille la nuit (météo réelle : « 30 °C au plus chaud… ») | **fort** : climax |
| 193,0 | 194,0 | Carton « JOUR 2/6 » (furtif — voir anomalie ci-dessous) | écarté |
| 194,0 | 201,0 | Carton « JOUR 3/6 · mercredi 16 septembre », météo réelle du jour | **fort** : climax |
| 202,0 | 206,0 | « Inspection surprise » : la décision du 14/09 (ligne 1) ressortie, 3 jauges | **fort** : preuve, climax |
| 206,0 | 212,0 | Verdict : « Non : elle a surtout servi la jauge réputation » | moyen |
| 233,0 | 236,0 | « Fin de la journée du 16 septembre 2026 » | moyen |
| 237,0 | 244,0 | Carton « JOUR 4/6 » | moyen |
| 246,0 | 248,0 | « Partir maintenant ? » | faible |
| 270,0 | 345,0 | Jours 4 à 6 au clavier (sieste, rapports du soir, cartons JOUR 5/6, 6/6) | réserve |
| 342,0 | 346,0 | Mail « Votre semaine, en chiffres » (score 237/300) | moyen |
| 349,0 | 356,0 | **Rapport — semaine 1**, tampon « À SURVEILLER », score 237/300, jauges | **fort** : fin du climax |
| 357,0 | 360,0 | Rapport p. 2 « Votre semaine en chiffres » (courbes) | moyen |
| 360,0 | 366,4 | Rapport p. 3 « Sources et faits de la semaine » | moyen (sources) |

**Anomalie du jeu observée (non corrigée ici) :** dans les deux prises, le jour 2 (mardi 15) est sauté. Après le SMS
météo de Camille au soir du jour 1 (prompt 189), « JOUR 2/6 » s'affiche une seconde, puis « JOUR 3/6 ». Journal :
`191,3 jour 1 · SMS actif` → Entrée → `193,1 jour 2`. Une journée semble avancée deux fois. Le trailer montre l'état
réel du jeu, sans maquillage. À instruire dans un prompt dédié.
