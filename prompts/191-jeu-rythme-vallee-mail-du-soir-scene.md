# Prompt 191 — Jeu : un moment de respiration entre les journées — le mail du soir comme scène, pas comme bilan

Demande d'origine (12/11/2026) : audit croisé avec le guide wikiHow « Comment concevoir un jeu vidéo », Partie 5
étape 2 « Concevez votre rythme ». Constat : le jeu a une tension constante mais aucune « vallée » — le joueur
ne se repose jamais vraiment entre les journées.

## Constat

- Le mail de fin de journée (`immersion.js`, `soir.js`) est un bilan chiffré : incidents mal gérés heure par
  heure, jauges, une ligne par autre incident. C'est un tableur, pas une scène.
- Entre deux journées, le joueur enchaîne directement sur l'écran « Jour N sur N » puis le démarrage du PC.
- Le guide wikiHow insiste sur des pics et des vallées : excitation puis repos.

## À faire

### 1. Le mail du soir devient une scène

Réécrire le mail de fin de journée pour qu'il raconte **un moment** de la journée, pas seulement des chiffres :

- **Le fait marquant du jour** : l'incident le plus grave de la journée (pire retard, pire décision, ou
  meilleure décision) raconté en 2–3 phrases, ancré dans les données réelles (ligne, heure, nature, décision
  prise). Ex. : « 17h42, ligne 4, retard de 25 min. Vous avez envoyé un renfort. Le bus est arrivé à 18h05,
  le retard est retombé à 8 min. »
- **Une phrase du patron** qui varie selon la performance de la journée (score du jour ≥ seuil → ton
  satisfait ; moyen → neutre ; faible → inquiet). 3 variantes par niveau, FR/EN, tirage déterministe.
- **Le bilan chiffré reste**, mais en dessous, plus compact (il est déjà dans le rapport papier et le Journal).

### 2. Transition de respiration entre deux journées

Entre le mail du soir et l'écran « Jour N+1 » :

- Un **écran de transition court** (2–3 s, passable au clic ou Entrée) qui montre le bureau le soir :
  la nuit tombe progressivement (le ciel derrière la baie vire au noir en 2 s), la lampe du bureau s'allume,
  le PC s'éteint. Un texte discret en bas : « Fin de journée. » / "End of day."
- Ce moment n'a aucun enjeu, aucune jauge, aucun chrono : c'est la vallée du rythme.
- Avec `prefers-reduced-motion` : fondu simple, pas d'animation progressive.

### 3. Le lendemain matin, une accroche météo

Au démarrage de la nouvelle journée (après l'écran « Jour N »), une ligne de texte sur l'écran de
transition ou dans le premier SMS : la météo réelle du jour (Open-Meteo de la semaine jouée) en une phrase.
Ex. : « Mardi 14 octobre 2026 — 12 °C, pluie fine toute la journée. » Cela ancre le nouveau jour dans le réel
et crée une micro-transition après la vallée.

## Vérifications

- `npm run build`, `npm test` verts.
- Partie automatisée sur 2 jours minimum : le mail du soir affiche bien le fait marquant + la phrase du patron
  + le bilan compact ; l'écran de transition nuit apparaît entre les deux journées ; le lendemain affiche la
  météo réelle du jour.
- Toutes les nouvelles clés i18n FR/EN présentes (`npm test` le vérifie).
- Audit des textes (`?audit=textes`) à 0 défaut A–D sur le mail du soir et la transition.
- Animations réduites : pas de fondu progressif, transition directe.
- Doc : `jeu/191-rythme-vallee-mail-scene.md` listée dans `jeu/README.md`. `prompts/README.md` (ligne 191),
  `journal.md` au push.

## Hors périmètre (ne pas faire)

- Ne pas allonger la durée totale d'une partie (la transition doit rester ≤ 3 s, passable).
- Ne pas modifier les règles Q1–Q61 ni les effets des décisions.
- Ne pas inventer d'événements : le fait marquant doit être un incident réellement joué pendant la journée.
