// Prompt 65 : liste de précache du service worker générée au build (npm run build → prebuild).
// Parcourt public/ (tout ce que le site sert) et ajoute les pages générées par Astro, puis écrit la liste et une
// VERSION calculée sur le contenu dans public/sw.js, entre les repères « précache:début » et « précache:fin ».
// Une modification de n'importe quel fichier change la version : les joueurs reçoivent la mise à jour.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const pub = fileURLToPath(new URL('../public/', import.meta.url));
const PAGES_ASTRO = ['./cartel/', './making-of/', './kit-presse/', './presentation/']; // générées dans dist/, servies en ligne (lot complémentaire : absentes quand on sert public/ en local)
const EXCLUS = new Set(['sw.js', '_headers', '404.html']); // le service worker ne se met pas lui-même en cache ; prompt 210 : _headers est lu par Cloudflare (jamais servi), 404.html n'est servi qu'en erreur — en précache strict, ils feraient échouer l'installation
const HORS_HASH = new Set(['version.js']); // version.js porte la version calculée ici : hors du hash pour ne pas boucler (mais bien servi, donc dans le précache)
// Prompt 210 (audit 206, constat 7) : le précache passait 216 fichiers / 34,6 Mo à chaque visiteur et chaque déploiement.
// Hors précache (servis en ligne, mis en cache à la première lecture par sw.js) : diaporama, kit de presse, captures et
// vidéos, outils d'audit, documents .md / .txt, doublons .json des données lues en .js, instantanés de data/fallback/,
// et la musique en OGG (le jeu lit désormais le MP3 partout, confort.js).
const HORS_PRECACHE = [/^presentation\//, /^kit-presse\//, /^captures\//, /^audit-[a-z-]+\.js$/, /\.(md|txt|vtt)$/, /^data\/fallback\//, /^data\/.+\.json$/, /^audio\/.+\.ogg$/, /^og-image\.jpg$/, /^assets\/qr-/];
// Lot complémentaire (installé après le noyau, sans bloquer, repris de l'ancien cache quand il y est) : musique MP3, pages Astro,
// diaporama et kit de presse
const COMPLEMENT = [/^audio\/.+\.mp3$/, /^presentation\//, /^kit-presse\//]; // prompts 82 et 188 : diaporama et kit de presse restent consultables hors ligne

function lister(dossier) {
	return readdirSync(dossier).flatMap((nom) => {
		const chemin = join(dossier, nom);
		return statSync(chemin).isDirectory() ? lister(chemin) : [chemin];
	});
}
const fichiers = lister(pub)
	.map((f) => relative(pub, f).split(sep).join('/'))
	.filter((f) => !EXCLUS.has(f) && !f.startsWith('.'))
	.sort();
const hash = createHash('sha1');
fichiers.filter((f) => !HORS_HASH.has(f)).forEach((f) => hash.update(f).update(readFileSync(join(pub, f))));
const version = 'nte-regulation-' + hash.digest('hex').slice(0, 10);
const servis = fichiers.filter((f) => !HORS_PRECACHE.some((r) => r.test(f)) || COMPLEMENT.some((r) => r.test(f)));
const liste = ['./', ...servis.filter((f) => !COMPLEMENT.some((r) => r.test(f))).map((f) => './' + f)];
const complements = [...servis.filter((f) => COMPLEMENT.some((r) => r.test(f))).map((f) => './' + f), ...PAGES_ASTRO];

// Prompt 193 : la musique en fichier doit être jouable hors ligne — chaque morceau est précaché (prompt 210 : MP3 seul,
// dans le lot complémentaire), et sw.js (partie écrite à la main, hors repères) sert les lectures partielles (Range) depuis ce cache
const audio = complements.filter((u) => /^\.\/audio\/.+\.mp3$/.test(u));
if (!audio.length) throw new Error('sw.js : aucun morceau audio/*.mp3 à précacher');
const taille = (l) => l.filter((u) => u !== './' && !u.endsWith('/')).reduce((a, u) => a + statSync(join(pub, u.slice(2))).size, 0);
const swChemin = join(pub, 'sw.js');
const sw = readFileSync(swChemin, 'utf8');
const debut = '/* précache:début (généré par scripts/generer-sw.mjs — ne pas modifier à la main) */';
const fin = '/* précache:fin */';
const i = sw.indexOf(debut);
const j = sw.indexOf(fin);
if (i < 0 || j < 0) throw new Error('sw.js : repères précache:début / précache:fin introuvables');
if (!/headers\.has\('range'\)[\s\S]*reponsePartielle\(req, enCache\)/.test(sw)) throw new Error('sw.js : les lectures partielles (Range) de la musique doivent être servies depuis le cache (prompt 193)');
const bloc = `${debut}\nconst VERSION = '${version}';\nconst ESSENTIELS = ${JSON.stringify(liste, null, '\t')};\nconst COMPLEMENTS = ${JSON.stringify(complements, null, '\t')};\n`;
writeFileSync(swChemin, sw.slice(0, i) + bloc + sw.slice(j));
// La page (hors service worker) a besoin de la même version, affichée dans les paramètres :
// on l'écrit dans version.js, exclu du hash ci-dessus pour ne pas boucler.
const versionChemin = join(pub, 'version.js');
writeFileSync(versionChemin, '/* Généré au build par scripts/generer-sw.mjs — ne pas modifier à la main.\n * Même empreinte que la constante VERSION de sw.js ; affichée dans la fenêtre des paramètres. */\nconst VERSION_BUILD = \'' + version + '\';\n');
console.log(`sw.js : noyau ${liste.length} entrées (${(taille(liste) / 1e6).toFixed(1)} Mo), complément ${complements.length} (${audio.length} morceaux MP3, ${(taille(complements) / 1e6).toFixed(1)} Mo), ${version}`);
console.log(`version.js : VERSION_BUILD = ${version}`);
