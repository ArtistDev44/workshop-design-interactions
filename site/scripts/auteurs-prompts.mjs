// Auteur de chaque prompt pour la page /making-of/ : qui a ajouté le fichier prompts/NN-*.md dans git.
// Résultat : prompts/auteurs.json (versionné, lu au build). À relancer après l'ajout de prompts :
//   cd site && npm run auteurs
// Sans historique git complet (clone superficiel), le fichier existant est conservé tel quel.
import { execFileSync } from 'node:child_process';
import { readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const racine = resolve(import.meta.dirname, '../..');
const dossier = join(racine, 'prompts');
// Comptes git → personne (rattachement confirmé par le groupe le 12/11/2026)
const COMPTES = {
	ArtistDev44: 'Guillaume',
	'Vibe Nuage Agent': 'Guillaume', // agent IA lancé par Guillaume
	Skyfe: 'Guillaume',
	'matteobvt49-code': 'Mattéo',
};
const git = (...args) => execFileSync('git', args, { cwd: racine, encoding: 'utf8' }).trim();

try {
	if (git('rev-parse', '--is-shallow-repository') === 'true') throw new Error('clone superficiel');
} catch (e) {
	console.log(`auteurs-prompts : historique git indisponible (${e.message}), prompts/auteurs.json conservé`);
	process.exit(0);
}

const auteurs = {};
const inconnus = new Set();
for (const f of readdirSync(dossier).filter((f) => /^\d{2,3}-.+\.md$/.test(f)).sort()) {
	// Création du fichier en suivant les renommages (un prompt renuméroté reste à celui qui l'a écrit) ;
	// replis : ajout sous ce nom, puis plus ancien commit qui le touche
	const premier = (...a) => git('log', ...a, '--format=%an', '--', 'prompts/' + f).split('\n').filter(Boolean).pop();
	const compte = premier('--follow', '--diff-filter=A') || premier('--diff-filter=A') || premier();
	if (!compte) continue; // pas encore commité
	if (COMPTES[compte]) auteurs[f] = COMPTES[compte];
	else inconnus.add(compte);
}
writeFileSync(join(dossier, 'auteurs.json'), JSON.stringify(auteurs, null, '\t') + '\n');
const total = (p) => Object.values(auteurs).filter((a) => a === p).length;
console.log(`auteurs-prompts : ${Object.keys(auteurs).length} prompts — Guillaume ${total('Guillaume')}, Mattéo ${total('Mattéo')}`);
if (inconnus.size) console.log(`  comptes non rattachés (à ajouter dans COMPTES) : ${[...inconnus].join(', ')}`);
