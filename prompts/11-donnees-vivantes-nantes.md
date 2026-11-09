# Prompt 11 — Données vivantes : « Nantes en direct » (API recommandées de l'audit)

## Objectif
Rendre la visualisation de données **vivante et interactive** sur le site, en appliquant
les recommandations de `contexte/audit-api-open-data-nantes.md` (§ 3 et § 5) : une seule
couche d'accès aux données, un rafraîchissement temporisé hors de toute boucle de rendu,
un fallback local systématique, et une page `/donnees/` qui rend la chaîne
**source → grammaire → système → œuvre** visible.

## Contexte
L'audit recommande 5 jeux temps réel (T1 parkings, T2 vélos Naolib, T3 fluidité routière,
T4 indice ATMO, T5 alertes pollens) et 4 jeux patrimoniaux (P1–P4, jamais en direct).
L'API Explore v2.1 de Nantes Métropole est ouverte en CORS, sans clé, quota 10 000
requêtes/jour. Le site reste 100 % statique au build : les appels n'ont lieu que dans le
navigateur du visiteur, jamais au build, jamais à l'évaluation sans réseau.

Ordre : ce prompt s'exécute **après le 10 et avant les prompts 12 (accessibilité /
robustesse) et 13 (déploiement)**, pour que ces deux étapes vérifient aussi la page
`/donnees/`. Tous les chemins ci-dessous sont relatifs à `site/`.

## Instructions
1. Créer `src/lib/datasets.js` : exporter `DATASETS`, la liste des jeux retenus. Chaque
   entrée : `id` (dataset_id), `titre`, `producteur`, `licence`, `frequence`, `mode`
   (`"live"` ou `"snapshot"`), `refreshMs` et `ttlMs` (T1/T2 = 5 min, T3 = 6 min,
   T4/T5 = 6 h), `select`, `where` et `limit` (champs utiles uniquement, `limit=1` pour
   P1–P4 hors agrégats), `viz` (`"barres"`, `"pastilles"`, `"lignes"`), et **`mapping`** :
   la phrase qui justifie le jeu dans la chaîne du livret.
2. Créer `src/lib/nantes-api.js` avec UNE fonction `getDataset(id)` :
   - cache `localStorage` (clé `pxe-nte001:{id}`, avec `fetchedAt`) utilisé si frais
     (`age < ttlMs`) ;
   - sinon appel `fetch` sur
     `https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/{id}/records?...`
     avec `select`/`where`/`limit`, **délai maximal 5 s** (`AbortController`) ;
   - en cas d'échec (réseau, quota, panne), charger `data/fallback/{id}.json` via
     `import.meta.env.BASE_URL` ;
   - retourner `{ records, origin: "live" | "cache" | "local", fetchedAt }` — le site
     affiche toujours quelque chose.
   ```js
   export async function getDataset(id) {
     const ds = DATASETS.find((d) => d.id === id);
     const key = `pxe-nte001:${id}`;
     try {
       const cached = JSON.parse(localStorage.getItem(key) || "null");
       if (cached && Date.now() - cached.fetchedAt < ds.ttlMs) {
         return { ...cached, origin: "cache" };
       }
     } catch {}
     const params = new URLSearchParams({ select: ds.select, limit: String(ds.limit) });
     if (ds.where) params.set("where", ds.where);
     const ctrl = new AbortController();
     const timer = setTimeout(() => ctrl.abort(), 5000);
     try {
       const res = await fetch(
         `https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets/${id}/records?${params}`,
         { signal: ctrl.signal }
       );
       if (!res.ok) throw new Error(String(res.status));
       const data = await res.json();
       const out = { records: data.results || [], fetchedAt: Date.now() };
       try { localStorage.setItem(key, JSON.stringify(out)); } catch {} // stockage bloqué : on garde les données live
       return { ...out, origin: "live" };
     } catch {
       try {
         const res = await fetch(`${import.meta.env.BASE_URL}data/fallback/${id}.json`);
         const data = await res.json();
         return { records: data.results || [], origin: "local", fetchedAt: data.fetchedAt || null };
       } catch {
         return { records: [], origin: "indisponible", fetchedAt: null }; // la carte affiche « données indisponibles »
       }
     } finally {
       clearTimeout(timer);
     }
   }
   ```
3. Créer `src/pages/donnees.astro` (« Nantes en direct ») via `Layout` :
   - une carte par jeu de `DATASETS` : titre, producteur, licence, fréquence, la phrase
     de `mapping`, un **badge de source** (`aria-live="polite"`) : « Données en direct ·
     mis à jour il y a X min » ou « Données locales du JJ/MM/AAAA » ;
   - visualisation **sans bibliothèque externe** (règle du prompt 09) : barres en `<div>`
     ou SVG inline pour T1/T2 (disponibilités), pastilles colorées pour T4
     (`coul_qual` officiel), liste horodatée pour T5, tableau `<th scope>` pour T3 ;
   - rafraîchissement par `setInterval` **par jeu selon `refreshMs`**, jamais dans une
     boucle `draw()` ; pause quand `document.hidden` ; bouton « Mettre à jour » par carte
     et global, accessible au clavier ;
   - `prefers-reduced-motion` : aucune animation de pulsation (point « live » statique),
     les rafraîchissements de données restent possibles ;
   - aucun appel réseau au build : la page est rendue statique, vide côté serveur, remplie
     côté client.
4. Créer `scripts/snapshot.mjs` : script Node (`fetch` global) qui importe `DATASETS`
   et écrit, pour chaque jeu, `public/data/fallback/{dataset_id}.json` au format
   `{ "fetchedAt": "<date ISO réelle>", "results": [ … ] }` avec les mêmes
   `select` / `where` / `limit` que le site. P1–P4 : agrégat uniquement (ex.
   `select=lib_genre,count(*) as n&group_by=lib_genre&order_by=n desc&limit=20`).
   Commande : `node scripts/snapshot.mjs` (dans `site/`). Ne jamais le lancer au build.
5. **Lancer `node scripts/snapshot.mjs` une fois** pour produire les instantanés :
   ce sont de **vraies données** de l'API, horodatées. Ne jamais écrire d'instantané à la
   main ni inventer de valeurs « réalistes » (règle du livret : aucune donnée inventée).
   Ne pas relire ni afficher le contenu de ces fichiers dans la conversation (coûteux et
   inutile) : vérifier seulement leur présence et leur taille.
6. Intégrer : ajouter « Données » dans la navigation du header (prompt 04), remplir le
   champ `datasets` de `src/data/edition.json` (prompt 06) avec les `id` retenus, et
   documenter la source dans la section « Données » du README (prompt 13).
7. Budget réseau : T1/T2 toutes les 5 min, T3 toutes les 6 min, T4/T5 au chargement +
   toutes les 6 h, P1–P4 jamais en direct → ≈ 830 requêtes/jour, < 10 % du quota.

## Vérifications
- `npm run build` génère `site/dist/donnees/index.html` sans erreur (la `base` ne crée
  pas de sous-dossiers dans `dist/` ; en ligne, la page sera servie sous
  `…/patrimoine-exe/nantes/001/donnees/`)
  et **sans aucun appel réseau au build**.
- Site ouvert hors ligne (ou API coupée) : `/donnees/` affiche les instantanés locaux avec
  le badge « Données locales du JJ/MM/AAAA ».
- En ligne : badges « Données en direct », valeurs rafraîchies selon `refreshMs`, aucune
  requête par frame, console sans erreur continue.
- Accessibilité : tableaux avec `<th scope>`, `aria-live` sur les badges, navigation
  clavier complète, `prefers-reduced-motion` respecté, contraste ≥ 4,5:1.
- Aucune clé, aucun secret dans le code ; chemins relatifs compatibles `base`.
