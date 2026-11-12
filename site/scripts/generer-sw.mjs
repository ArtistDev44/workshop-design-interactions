// Prompt 65 : liste de précache du service worker générée au build (npm run build → prebuild).
// Parcourt public/ (tout ce que le site sert) et ajoute les pages générées par Astro, puis écrit la liste et une
// VERSION calculée sur le contenu dans public/sw.js, entre les repères « précache:début » et « précache:fin ».
// Une modification de n'importe quel fichier change la version : les joueurs reçoivent la mise à jour.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const pub = fileURLToPath(new URL('../public/', import.meta.url));
const PAGES_ASTRO = ['./cartel/', './making-of/', './presentation/']; // générées dans dist/, servies en ligne
const PAGES_DOSSIER = ['./kit-presse/']; // prompt 188 : pages statiques de public/ ouvertes par leur dossier (la navigation hors ligne cherche cette URL, pas …/index.html)
const EXCLUS = new Set(['sw.js', 'captures/trailer.mp4']); // le service worker ne se met pas lui-même en cache ; prompt 187 : le trailer (8 Mo) reste en ligne, hors précache
const HORS_HASH = new Set(['version.js']); // version.js porte la version calculée ici : hors du hash pour ne pas boucler (mais bien servi, donc dans le précache)

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
const liste = ['./', ...fichiers.map((f) => './' + f), ...PAGES_DOSSIER, ...PAGES_ASTRO];

// Prompt 193 : la musique en fichier doit être jouable hors ligne — chaque morceau (OGG et MP3) est précaché, et sw.js
// (partie écrite à la main, hors repères) sert les lectures partielles (Range) depuis ce cache
const audio = liste.filter((u) => /^\.\/audio\/.+\.(ogg|mp3)$/.test(u));
if (!audio.length) throw new Error('sw.js : aucun morceau audio/*.ogg|mp3 à précacher');

const swChemin = join(pub, 'sw.js');
const sw = readFileSync(swChemin, 'utf8');
const debut = '/* précache:début (généré par scripts/generer-sw.mjs — ne pas modifier à la main) */';
const fin = '/* précache:fin */';
const i = sw.indexOf(debut);
const j = sw.indexOf(fin);
if (i < 0 || j < 0) throw new Error('sw.js : repères précache:début / précache:fin introuvables');
if (!/headers\.has\('range'\)[\s\S]*reponsePartielle\(req, enCache\)/.test(sw)) throw new Error('sw.js : les lectures partielles (Range) de la musique doivent être servies depuis le cache (prompt 193)');
const bloc = `${debut}\nconst VERSION = '${version}';\nconst ESSENTIELS = ${JSON.stringify(liste, null, '\t')};\n`;
writeFileSync(swChemin, sw.slice(0, i) + bloc + sw.slice(j));
// La page (hors service worker) a besoin de la même version, affichée dans les paramètres :
// on l'écrit dans version.js, exclu du hash ci-dessus pour ne pas boucler.
const versionChemin = join(pub, 'version.js');
writeFileSync(versionChemin, '/* Généré au build par scripts/generer-sw.mjs — ne pas modifier à la main.\n * Même empreinte que la constante VERSION de sw.js ; affichée dans la fenêtre des paramètres. */\nconst VERSION_BUILD = \'' + version + '\';\n');
console.log(`sw.js : ${liste.length} entrées en précache (dont ${audio.length} morceaux audio), ${version}`);
console.log(`version.js : VERSION_BUILD = ${version}`);
