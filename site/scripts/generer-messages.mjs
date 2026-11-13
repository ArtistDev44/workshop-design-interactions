// Prompt 28 : data/messages.json (source brute, modifiable à la main) → data/messages.js
// (window.MESSAGES = …) pour que le jeu fonctionne ouvert par double clic et hors ligne.
// Usage : npm run messages (lancé aussi avant chaque build).
import { readFile, writeFile } from 'node:fs/promises';

const dossier = new URL('../public/data/', import.meta.url);
const brut = await readFile(new URL('messages.json', dossier), 'utf8');
const donnees = JSON.parse(brut); // échoue clairement si le JSON est invalide
if (!Array.isArray(donnees.plaintes)) throw new Error('messages.json : « plaintes » doit être une liste');
// Prompt 189 : registre de langage de l'usager (facultatif, valeur connue) ; au moins 4 registres différents
const REGISTRES = ['etudiant', 'senior', 'touriste', 'travailleur', 'parent'];
for (const p of donnees.plaintes) if (p.registre !== undefined && !REGISTRES.includes(p.registre)) throw new Error('messages.json : registre inconnu « ' + p.registre + ' » (' + p.id + ')');
if (new Set(donnees.plaintes.map((p) => p.registre).filter(Boolean)).size < 4) throw new Error('messages.json : au moins 4 registres différents attendus (prompt 189)');
// Prompt 198 : ton et catégorie connus ; une interaction hors « plainte » est bilingue ; assez de variantes sans variable pour ne jamais se répéter
const TONS = ['provoquant', 'neutre', 'positif'];
const CATEGORIES = ['plainte', 'question', 'remerciement', 'suggestion', 'temoignage', 'relance', 'doublon', 'accessibilite', 'photo'];
for (const p of donnees.plaintes) {
	if (!TONS.includes(p.ton)) throw new Error('messages.json : ton attendu (provoquant, neutre, positif) pour « ' + p.id + ' »');
	if (p.categorie !== undefined && !CATEGORIES.includes(p.categorie)) throw new Error('messages.json : catégorie inconnue « ' + p.categorie + ' » (' + p.id + ')');
	if (p.categorie && p.categorie !== 'plainte' && (!p.texte.en || p.reponses.some((r) => !r.clash && !r.signaler && !r.texte.en))) throw new Error('messages.json : interaction « ' + p.id + ' » sans anglais');
	// Prompt 202 : chaque réponse jouable a une suite FR + EN ; provocant → un « signaler » (la bonne réponse) ; positif → clash froid avec texte
	for (const r of p.reponses) {
		if (r.signaler) { if (r.bonne !== true || p.ton !== 'provoquant') throw new Error('messages.json : « signaler » réservé à la bonne réponse d’un message provoquant (' + p.id + ')'); continue; }
		if (!r.suite || !r.suite.fr || !r.suite.en) throw new Error('messages.json : réponse sans suite FR + EN (' + p.id + ')');
	}
	if (p.ton === 'provoquant' && p.reponses.filter((r) => r.signaler).length !== 1) throw new Error('messages.json : message provoquant sans bouton « Signaler » (' + p.id + ')');
	if (p.ton === 'positif' && !p.reponses.some((r) => r.clash && r.froid && r.texte && r.texte.fr && r.texte.en)) throw new Error('messages.json : message positif sans clash froid (' + p.id + ')');
}
if (donnees.plaintes.length < 300) throw new Error('messages.json : 300 messages de base attendus (prompt 202), ' + donnees.plaintes.length + ' trouvés');
if (new Set(donnees.plaintes.map((p) => p.id)).size !== donnees.plaintes.length) throw new Error('messages.json : identifiants en double');
for (const c of CATEGORIES.slice(1)) if (!donnees.plaintes.some((p) => p.categorie === c)) throw new Error('messages.json : aucune interaction de catégorie « ' + c + ' » (prompt 198)');
// Prompt 90 : modèles du téléphone — FR + EN obligatoires, 3 variantes au moins par fait (Camille) ou par type (chauffeurs)
if (donnees.telephone) {
	const tel = donnees.telephone;
	for (const [groupe, cle] of [['camille', 'fait'], ['chauffeur', 'type']]) {
		const liste = tel[groupe] || [];
		const parCle = {};
		for (const m of liste) {
			if (!m[cle] || !m.texte || !m.texte.fr || !m.texte.en) throw new Error('messages.json : téléphone.' + groupe + ' incomplet (' + JSON.stringify(m).slice(0, 80) + ')');
			parCle[m[cle]] = (parCle[m[cle]] || 0) + 1;
		}
		for (const [k, n] of Object.entries(parCle)) if (n < 3) throw new Error('messages.json : téléphone.' + groupe + ' « ' + k + ' » : 3 variantes au moins');
	}
}
await writeFile(new URL('messages.js', dossier), '// Généré depuis messages.json par scripts/generer-messages.mjs — ne pas modifier à la main.\nwindow.MESSAGES = ' + JSON.stringify(donnees) + ';\n');
console.log('messages.js : ' + donnees.plaintes.length + ' plainte(s)');

// Prompt 87 : réponses par catégorie (data/reponses.json → data/reponses.js, hors ligne et double clic)
const brutR = await readFile(new URL('reponses.json', dossier), 'utf8');
const reponses = JSON.parse(brutR);
if (!reponses.categories || typeof reponses.categories !== 'object') throw new Error('reponses.json : « categories » attendu');
await writeFile(new URL('reponses.js', dossier), '// Généré depuis reponses.json par scripts/generer-messages.mjs — ne pas modifier à la main.\nwindow.PXE_REPONSES = ' + JSON.stringify(reponses) + ';\n');
console.log('reponses.js : ' + Object.keys(reponses.categories).length + ' catégorie(s)');
