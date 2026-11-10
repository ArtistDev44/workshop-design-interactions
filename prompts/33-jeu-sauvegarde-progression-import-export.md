# Prompt 33 — Jeu « Nantes en régulation », étape 20 : sauvegarde de la progression + import/export

Objectif : permettre de **quitter une partie et de la reprendre plus tard** grâce à une
sauvegarde automatique dans le `localStorage` du navigateur, et d'**exporter / importer
une progression** via un fichier JSON depuis l'écran **Paramètres** — sans toucher aux
décisions verrouillées Q1–Q61 ni à la boucle de jeu de la salle de contrôle.

S'appuie sur les prompts 14–32, notamment le prompt 18 (`localStorage` du meilleur bilan,
clés préfixées `pxe-nte001-`), le prompt 24 (tous les textes passent par `t(...)` FR + EN,
persistance de la langue) et le prompt 09 (`jeu/09-parametres.md`, section Persistance).

Fichiers concernés : `site/public/` (nouveau `sauvegarde.js` chargé dans `index.html`
avant `game.js` et après `i18n.js`, `confort.js` pour la section Paramètres, `game.js`
pour exposer l'état courant, `sketch.js` pour le bouton « Continuer » à l'accueil,
`i18n.js`, `style.css` si besoin), plus une mise à jour de `jeu/` et `journal.md`.

Règles absolues : aucun secret ni donnée personnelle (seul l'état du jeu est stocké) ;
tous les nouveaux textes passent par `t(...)` FR + EN, aucun texte en dur ; l'import est
strictement validé (`JSON.parse` dans un `try/catch`, jamais d'`eval`) ; contraste ≥ 4,5:1,
clavier complet, `aria-live`, `prefers-reduced-motion`, aucun flash, tout fonctionne hors
ligne (le téléchargement d'export passe par un Blob local, aucun réseau).

## 1. Modèle de sauvegarde

Objet JSON sérialisable, versionné :

```js
{
  version: 1,
  sauvegardeLe: "2026-11-12T14:03:00.000Z",
  semaine: "2026-11-02",            // id de la semaine (data/semaines/) ou "fallback"
  etat: {
    dossierIndex: 4,                 // prochain dossier à trancher
    decisions: [/* décisions déjà prises, dans l'ordre */],
    jauges: { fluidite: 62, reputation: 48, budget: 75 },
    evenementsJournee: [/* incidents déjà servis */],
    graine: 123456,                  // graine déterministe (mulberry32) de la partie
    modeHorsLigne: false,
    parametres: { son: true, contraste: false, tailleTexte: 1 }
  }
}
```

- Une sauvegarde **par semaine** : clé `localStorage` = `pxe-nte001-partie-<idSemaine>`.
  Ne jamais écraser la clé du meilleur bilan (prompt 18) ni `pxe-nte001-langue`.
- N'exposer dans `game.js` qu'un getter de l'état courant (état + jauges + graine), pas
  de mutation interne.

## 2. Sauvegarde automatique

- `Sauvegarde.auto()` appelée : après chaque décision validée (« Dossier suivant »),
  à la pause (`P`), à la fin de journée et sur `beforeunload` / `visibilitychange`.
- Un indicateur discret à l'accueil et en jeu (`t('sauvegarde.auto')`, ex. « Partie
  sauvegardée à 14:03 ») annoncé via la région `aria-live`, sans bloquer le jeu.
- `R` (reset, Q38) efface la sauvegarde de la semaine **après confirmation**.

## 3. Reprise de partie

- **Écran d'accueil** : bouton « Continuer la partie » visible uniquement si au moins une
  sauvegarde existe (sinon masqué) ; reprend la sauvegarde la plus récente. Sur chaque
  semaine possédant une sauvegarde : proposer « Reprendre » ou « Nouvelle partie »
  (écrasement confirmé).
- La reprise restaure exactement : semaine, index du dossier, décisions prises, jauges,
  événements de la journée, graine, mode hors ligne et paramètres — la partie reprend où
  elle s'était arrêtée, compte à rebours compris (recalculé, pas figé).

## 4. Import / export dans les Paramètres (`confort.js`)

Nouvelle section « Progression » de l'écran Paramètres, après les réglages existants :

- **Exporter** : sérialise la sauvegarde de la semaine en cours (ou la plus récente si
  aucune partie en cours) et la télécharge via un Blob local :
  `pxe-nte001-progression-<semaine>-<AAAAMMJJ-HHMM>.json`. Bouton secondaire « Copier
  dans le presse-papiers » (fallback `navigator.clipboard` avec repli textarea).
- **Importer** : champ fichier `.json` (cliquable au clavier via un `<label>` stylé) +
  zone de texte « coller le JSON ici ». Validation stricte avant toute écriture :
  `JSON.parse` en `try/catch` → `version === 1` → `semaine` connue (semaines enregistrées
  ou `"fallback"`) → `etat.dossierIndex` entier ≥ 0 → jauges nombres entre 0 et 100 →
  `graine` nombre. **En cas d'échec** : toast `t('parametres.import.erreur')`, aucun état
  modifié, aucune exception. **En cas de succès** : écriture dans
  `pxe-nte001-partie-<semaine>`, toast `t('parametres.import.ok')` et proposition de
  reprendre immédiatement la partie importée.
- L'export contient le même objet que le `localStorage` + métadonnées (`jeu: "PXE-NTE001-G01-W01"`,
  `exporteLe`). Aucune donnée personnelle.

## 5. Internationalisation et accessibilité

- Toutes les chaînes (boutons Continuer/Reprendre/Nouvelle partie, section Progression,
  Exporter/Importer/Copier, toasts succès/erreur, indicateur de sauvegarde auto) dans
  `i18n.js` en FR + EN, passées par `t(...)` ; `document.documentElement.lang` inchangé.
- Clavier complet : Tab + Entrée sur tous les boutons, le champ fichier et la zone de
  coller ; focus rendu au bouton d'origine après un toast ; annonces `aria-live` traduites.
- Contraste ≥ 4,5:1, `prefers-reduced-motion` respecté, aucun flash (l'écran de
  chargement du prompt 27 reste le garde-fou).

## 6. Hors ligne et robustesse

- 100 % local : `localStorage`, Blob de téléchargement, presse-papiers — aucun appel
  réseau ; fonctionne en double-clic sur `index.html`.
- `localStorage` indisponible (navigation privée, quota) : `try/catch` partout, le jeu
  reste jouable, un toast `t('sauvegarde.indisponible')` prévient une seule fois.
- Aucune régression des décisions verrouillées Q1–Q61 ni des prompts 14–32.

## 7. Vérifications détaillées

- `npm run build` dans `site/`.
- Parcours : lancer une semaine, trancher 3 dossiers, recharger la page → « Continuer la
  partie » reprend au 4ᵉ dossier avec jauges, décisions et graine identiques ; quitter en
  cours de compte à rebours → reprise correcte.
- Export : fichier JSON téléchargé, contenu conforme au schéma ; suppression du
  `localStorage` puis import du fichier → état restauré à l'identique ; import d'un JSON
  invalide, d'une mauvaise `version`, d'une semaine inconnue ou de jauges hors limites →
  toast d'erreur, aucun crash, aucun état modifié.
- `R` avec confirmation efface la sauvegarde de la semaine ; le meilleur bilan (prompt 18)
  et la langue (prompt 24) sont conservés.
- FR + EN (boutons, toasts, aria-live), clavier seul, hors ligne / double-clic local,
  1920×1080, aucune erreur console, aucun fichier image ajouté, aucun secret.
- Documenter dans `jeu/16-sauvegarde-progression.md` + sommaire de `jeu/README.md` +
  section Persistance de `jeu/09-parametres.md`.
- Branche `jeu/prompt-33-sauvegarde-progression`. À chaque push : entrée en tête de
  `journal.md`. Ne pas fusionner dans `main` sans demande.
