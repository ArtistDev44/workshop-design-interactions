// Smoke test sans dépendance (prompt 33, section 5) : `npm test` dans site/.
// Vérifie, sans réseau ni navigateur :
//  1. que chaque <script src> de public/index.html existe dans public/ ;
//  2. que les données de public/data/ se chargent : *.json et fallback/*.json, semaines/*.json
//     parsés par JSON.parse, *.js (fallback.js, semaines.js, lignes.js, messages.js) évalués
//     dans un bac à sable vm avec un objet window vide ;
//  3. qu'aucun motif de secret (api_key, apikey, bearer, password) n'apparaît dans public/*.js
//     et public/data/*.js (lib/p5.min.js exclu) ;
//  4. si dist/ existe (après `npm run build`), que les pages (jeu, /cartel/, /making-of/), le manifest et les captures existent.
// Le contenu des données n'est jamais affiché : seulement des noms de fichiers et des compteurs.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(racine, 'public');
const erreurs = [];
let controles = 0;
const ok = () => controles++;
const echec = (m) => erreurs.push(m);

// 1. Scripts de index.html
const html = readFileSync(join(pub, 'index.html'), 'utf8');
const srcs = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
if (srcs.length === 0) echec('index.html : aucun <script src> trouvé');
for (const src of srcs) {
	if (/^(https?:)?\/\//.test(src)) {
		echec(`index.html : script distant (${src}) — le jeu doit rester relançable hors ligne`);
		continue;
	}
	const chemin = join(pub, src.replace(/^\.?\//, '').split(/[?#]/)[0]);
	if (existsSync(chemin) && statSync(chemin).isFile()) {
		ok();
		// Prompt 50 : syntaxe de chaque script (une erreur de syntaxe empêche tout le jeu de démarrer)
		try {
			new vm.Script(readFileSync(chemin, 'utf8'), { filename: src });
			ok();
		} catch (e) {
			echec(`${src} : erreur de syntaxe — ${e.message}`);
		}
	}
	else echec(`index.html : script introuvable ${src}`);
}

// 2. Données
const data = join(pub, 'data');
const lireJson = (f) => {
	try {
		JSON.parse(readFileSync(f, 'utf8'));
		ok();
	} catch (e) {
		echec(`JSON invalide : ${f.slice(racine.length + 1)} (${e.message.slice(0, 80)})`);
	}
};
const jsonDe = (dossier) =>
	existsSync(dossier) ? readdirSync(dossier).filter((f) => extname(f) === '.json').map((f) => join(dossier, f)) : [];
for (const f of jsonDe(data)) lireJson(f);
for (const sous of ['semaines', 'fallback']) {
	const fichiers = jsonDe(join(data, sous));
	if (fichiers.length === 0) echec(`public/data/${sous}/ : aucun fichier JSON`);
	for (const f of fichiers) lireJson(f);
}
for (const nom of ['fallback.js', 'semaines.js', 'lignes.js', 'messages.js']) {
	const f = join(data, nom);
	if (!existsSync(f)) {
		echec(`public/data/${nom} introuvable`);
		continue;
	}
	const bac = { window: {} };
	bac.globalThis = bac;
	bac.self = bac.window;
	try {
		vm.runInNewContext(readFileSync(f, 'utf8'), vm.createContext(bac), { filename: nom, timeout: 5000 });
		const definis = Object.keys(bac.window).length + Object.keys(bac).length - 3;
		if (definis <= 0) echec(`public/data/${nom} : aucune donnée définie`);
		else ok();
	} catch (e) {
		echec(`public/data/${nom} : erreur au chargement (${e.message.slice(0, 80)})`);
	}
}

// 3. Motifs de secret
const motif = /api[_-]?key|bearer|password/i;
const sources = [
	...readdirSync(pub).filter((f) => extname(f) === '.js').map((f) => join(pub, f)),
	...readdirSync(data).filter((f) => extname(f) === '.js').map((f) => join(data, f)),
];
for (const f of sources) {
	const lignes = readFileSync(f, 'utf8').split('\n');
	const trouve = lignes.findIndex((l) => motif.test(l));
	if (trouve >= 0) echec(`motif de secret dans ${f.slice(racine.length + 1)}, ligne ${trouve + 1}`);
	else ok();
}

// 3 ter. Polices du Pixel DS auto-hébergées (12/11) : fonts.css chargé par le jeu (http seulement), fichiers référencés présents
{
	const css = readFileSync(join(pub, 'fonts.css'), 'utf8');
	/href = '\.\/fonts\.css'/.test(readFileSync(join(pub, 'index.html'), 'utf8')) ? ok() : echec('index.html : fonts.css non lié');
	for (const [, f] of css.matchAll(/url\('\.\/(fonts\/[^']+)'\)/g)) f.includes('BitsyPixels') || existsSync(join(pub, f)) ? ok() : echec(`fonts.css : ${f} absent`);
}
// 3 bis. Webapp installable (prompt 65) : manifest complet, icônes présentes, précache couvrant tout public/
{
	let m = null;
	try {
		m = JSON.parse(readFileSync(join(pub, 'manifest.webmanifest'), 'utf8'));
		ok();
	} catch (e) {
		echec('manifest.webmanifest : JSON invalide');
	}
	if (m) {
		for (const champ of ['name', 'short_name', 'start_url', 'display', 'icons', 'theme_color', 'id', 'scope']) m[champ] ? ok() : echec(`manifest.webmanifest : champ ${champ} manquant`);
		(m.icons || []).forEach((i) => (existsSync(join(pub, i.src)) ? ok() : echec(`manifest : icône absente ${i.src}`)));
		(m.icons || []).some((i) => /maskable/.test(i.purpose || '')) ? ok() : echec('manifest : aucune icône maskable');
		(m.screenshots || []).forEach((i) => (existsSync(join(pub, i.src)) ? ok() : echec(`manifest : capture absente ${i.src}`)));
	}
	const sw = readFileSync(join(pub, 'sw.js'), 'utf8');
	/const VERSION = 'nte-regulation-[0-9a-f]{10}'/.test(sw) ? ok() : echec('sw.js : VERSION non générée (lancer npm run sw ou npm run build)');
	const liste = new Set([...sw.matchAll(/"(\.\/[^"]*)"/g)].map((x) => x[1]));
	for (const ref of [...html.matchAll(/(?:src|href)="(\.\/[^"#?]+)"/g)].map((x) => x[1])) liste.has(ref) ? ok() : echec(`sw.js : ${ref} (index.html) absent du précache`);
	// Prompt 188 : kit de presse — page, communiqué, logo et captures en précache (la vidéo reste ../captures/demo.mp4, non dupliquée)
	for (const ref of ['./kit-presse/', './kit-presse/index.html', './kit-presse/communique-de-presse.txt', './kit-presse/communique-de-presse.md', './kit-presse/README.md', './kit-presse/logo.svg', './kit-presse/hero.jpg', './kit-presse/detail-01.jpg', './kit-presse/process.jpg', './kit-presse/thumb.jpg', './captures/demo.mp4']) liste.has(ref) ? ok() : echec(`sw.js : ${ref} (kit de presse) absent du précache`);
	{
		const kit = readFileSync(join(pub, 'kit-presse', 'index.html'), 'utf8');
		const refs = [...kit.matchAll(/(?:src|href|poster)="([^"#:]+)"/g)].map((x) => x[1]);
		for (const r of refs) existsSync(join(pub, 'kit-presse', r.endsWith('/') ? r + 'index.html' : r)) || r === '../presentation/' ? ok() : echec(`kit-presse/index.html : fichier référencé absent ${r}`);
		// crédit exact de la musique du trailer (trailer/CREDITS.md) : lien vers le texte CC BY 4.0, pas une ressource chargée
		/<html lang="fr">/.test(kit) && !/<script|https?:\/\/(?!workshop-design-interactions\.pages\.dev|github\.com\/ArtistDev44|creativecommons\.org\/licenses\/by\/4\.0\/)/.test(kit) ? ok() : echec('kit-presse/index.html : lang="fr", sans script ni ressource externe');
		readFileSync(join(pub, 'kit-presse', 'communique-de-presse.md'), 'utf8') === readFileSync(join(pub, 'kit-presse', 'communique-de-presse.txt'), 'utf8') ? ok() : echec('kit-presse : communique-de-presse.md et .txt différents');
	}
	// Prompt 82 : la présentation Slidev (public/presentation/) est entièrement en précache, hors ligne compris
	const pres = join(pub, 'presentation');
	if (!existsSync(join(pres, 'index.html'))) echec('presentation/index.html absent : lancer npm run build:slides');
	else {
		const lister = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? lister(join(d, e.name)) : [join(d, e.name)]));
		for (const f of lister(pres)) {
			const ref = './' + relative(pub, f).split(sep).join('/');
			liste.has(ref) ? ok() : echec(`sw.js : ${ref} (présentation) absent du précache`);
		}
		const ph = readFileSync(join(pres, 'index.html'), 'utf8');
		/\/presentation\/assets\//.test(ph) ? ok() : echec('presentation : base /presentation/ absente du build Slidev');
		// Prompt 94 : assets essentiels du deck (image OG, captures fléchées) et métadonnées SEO
		for (const f of ['og-image.png', 'img/decision.webp', 'img/sources.webp', 'img/bureau.webp', 'img/telephone.webp', 'img/journal.webp', 'fonts/jetbrains-mono-var-latin.woff2']) existsSync(join(pres, f)) ? ok() : echec(`presentation/${f} absent du build`);
		/property="og:image" content="https:\/\/workshop-design-interactions\.pages\.dev\/presentation\/og-image\.png"/.test(ph) && /(?:name|property)="twitter:card" content="summary_large_image"/.test(ph) && /<html[^>]*lang="fr"/.test(ph) ? ok() : echec('presentation : métadonnées SEO (og:image, twitter:card, lang) absentes');
	}
}

// 4. Build (facultatif)
const dist = join(racine, 'dist');
if (existsSync(dist)) {
	for (const page of ['index.html', 'cartel/index.html', 'making-of/index.html', 'presentation/index.html', 'manifest.json', 'captures/hero.jpg', 'captures/demo.mp4', 'kit-presse/index.html', 'kit-presse/logo.svg']) {
		if (existsSync(join(dist, page))) ok();
		else echec(`dist/${page} absent : relancer npm run build`);
	}
	// Making-of : chaque fichier de prompt est listé avec son label « fait par … » (prompts/auteurs.json)
	const mo = join(dist, 'making-of/index.html');
	if (existsSync(mo)) {
		const h = readFileSync(mo, 'utf8');
		const fichiers = readdirSync(join(racine, '../prompts')).filter((f) => /^\d{2,3}-.+\.md$/.test(f));
		for (const f of fichiers) h.includes(`>${f}</code>`) ? ok() : echec(`making-of : ${f} absent (ligne du tableau prompts/README.md mal formée ?)`);
		(h.match(/fait par (Guillaume|Mattéo)/g) || []).length === fichiers.length ? ok() : echec('making-of : un prompt sans label « fait par … » (relancer npm run auteurs)');
	}
}

if (erreurs.length) {
	console.error(`Smoke test : ${erreurs.length} erreur(s) sur ${controles + erreurs.length} contrôles`);
	for (const e of erreurs) console.error(`  ✗ ${e}`);
	process.exit(1);
}
console.log(`Smoke test : ${controles} contrôles réussis (${srcs.length} scripts, données, secrets${existsSync(dist) ? ', dist' : ''}).`);
