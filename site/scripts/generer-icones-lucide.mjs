// Prompt 170 : copie un SOUS-ENSEMBLE des icônes Lucide (https://lucide.dev, licence ISC) dans
// public/icones-lucide.js, entre les repères « lucide:début » et « lucide:fin ». Lancé à la main, jamais au build
// (aucune dépendance ajoutée, aucun réseau) :
//
//   npm pack lucide-static            # dans un dossier temporaire, hors du dépôt
//   tar xzf lucide-static-*.tgz       # → package/
//   node scripts/generer-icones-lucide.mjs /chemin/vers/package
//
// Les tracés sont lus tels quels dans package/icons/<nom>.svg (aucun tracé inventé ni retouché) ; la licence
// (package/LICENSE) est copiée telle quelle dans public/licences/lucide-LICENSE.txt. Pour ajouter une icône :
// ajouter son nom Lucide à NOMS, relancer le script, puis `npm run build` (sw.js) et `npm test`.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const NOMS = `
accessibility alarm-clock archive chart-column circle-question-mark house arrow-down arrow-left arrow-right arrow-up at-sign bar-chart-3 bell bell-off bike
book-open bus calendar camera check chevron-down chevron-left chevron-right chevron-up chevrons-left chevrons-right
circle circle-check circle-x clipboard-list clock cloud cloud-rain coffee coins construction copy database download
external-link eye eye-off file-text filter flag flower-2 gamepad-2 globe hard-hat hash heart help-circle home image
inbox info keyboard languages layout-grid lightbulb link list locate-fixed lock log-out mail map map-pin maximize
megaphone menu message-circle message-square message-square-warning mic minimize minus monitor moon music newspaper
notebook-text paperclip pause pencil phone play plus power presentation refresh-cw reply rotate-ccw save search send
settings share-2 sliders-horizontal square square-parking star sun thumbs-up timer traffic-cone tram-front trash-2
trending-down trending-up triangle-alert trophy user users volume-2 volume-x wallet waves wrench x zap
palette dices upload a-large-small cloud-off contrast lock-open webcam vibrate
`
	.trim()
	.split(/\s+/);

const paquet = process.argv[2];
if (!paquet || !existsSync(join(paquet, 'icons'))) {
	console.error('Usage : node scripts/generer-icones-lucide.mjs /chemin/vers/lucide-static/package');
	process.exit(1);
}
const pub = fileURLToPath(new URL('../public/', import.meta.url));
const version = JSON.parse(readFileSync(join(paquet, 'package.json'), 'utf8')).version;
const BALISES = ['path', 'circle', 'rect', 'line', 'ellipse', 'polyline', 'polygon'];

/** Éléments d'un fichier SVG Lucide : [balise, { attribut: valeur }] dans l'ordre du fichier, valeurs inchangées */
function lire(nom) {
	const svg = readFileSync(join(paquet, 'icons', nom + '.svg'), 'utf8');
	const corps = svg.slice(svg.indexOf('>', svg.indexOf('<svg')) + 1, svg.lastIndexOf('</svg>'));
	const elements = [...corps.matchAll(/<([a-z]+)\b([^>]*?)\/?>/g)].map(([, balise, attrs]) => {
		if (!BALISES.includes(balise)) throw new Error(`${nom} : balise <${balise}> non prise en charge`);
		return [balise, Object.fromEntries([...attrs.matchAll(/([a-z0-9-]+)="([^"]*)"/g)].map(([, k, v]) => [k, v]))];
	});
	if (!elements.length) throw new Error(`${nom} : aucun tracé`);
	return elements;
}

const table = {};
const alias = {};
const vus = new Map(); // tracés (JSON) → premier nom : un ancien nom Lucide (help-circle, home…) devient un alias
for (const nom of [...new Set(NOMS)].sort()) {
	const json = JSON.stringify(lire(nom));
	if (vus.has(json)) alias[nom] = vus.get(json);
	else (vus.set(json, nom), (table[nom] = json));
}
const bloc =
	`/* lucide:début (généré par scripts/generer-icones-lucide.mjs depuis lucide-static ${version} — ne pas modifier à la main) */\n` +
	`const LUCIDE_VERSION = '${version}';\n` +
	`const LUCIDE = {\n${Object.entries(table)
		.map(([nom, json]) => `\t'${nom}': ${json},`)
		.join('\n')}\n};\n` +
	`const LUCIDE_ALIAS = ${JSON.stringify(alias)};\n`;

const chemin = join(pub, 'icones-lucide.js');
const js = readFileSync(chemin, 'utf8');
const i = js.indexOf('/* lucide:début');
const fin = '/* lucide:fin */';
const j = js.indexOf(fin);
if (i < 0 || j < 0) throw new Error('icones-lucide.js : repères lucide:début / lucide:fin introuvables');
writeFileSync(chemin, js.slice(0, i) + bloc + js.slice(j));
mkdirSync(join(pub, 'licences'), { recursive: true });
writeFileSync(join(pub, 'licences', 'lucide-LICENSE.txt'), readFileSync(join(paquet, 'LICENSE')));
console.log(`icones-lucide.js : ${Object.keys(table).length} icônes, ${Object.keys(alias).length} alias (lucide-static ${version})`);
