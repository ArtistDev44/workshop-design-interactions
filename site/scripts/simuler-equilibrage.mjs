// Nantes en régulation — simulation d'équilibrage (prompt 201), outil manuel hors `npm test`.
// Charge les VRAIS fichiers du jeu (comme test-jeu.mjs) et joue chaque semaine archivée selon quatre stratégies :
// toujours la meilleure réplique du trio, toujours l'autre, toujours le clash, au hasard (300 parties semées).
// Ne compte ni les réponses Community, ni les équipes, ni la sieste, ni l'incident fictif.
// Usage (dans site/) : node scripts/simuler-equilibrage.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
function contexte() {
	const st = new Map();
	const ctx = { console: { log() {}, warn() {}, error() {} }, localStorage: { getItem: (k) => (st.has(k) ? st.get(k) : null), setItem: (k, v) => st.set(k, String(v)), removeItem: (k) => st.delete(k) }, navigator: { language: 'fr' }, location: { search: '', protocol: 'file:' }, document: { getElementById: () => null, documentElement: { lang: 'fr' } } };
	ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
	for (const f of ['data/lignes.js', 'data/semaines.js', 'data/fallback.js', 'data/messages.js', 'data/reponses.js', 'data/loire.js', 'i18n.js', 'game.js', 'rythme.js', 'taches.js', 'journal-donnees.js', 'traces.js', 'notifs-tel.js', 'texte.js']) vm.runInContext(readFileSync(join(pub, f), 'utf8'), ctx, { filename: f });
	vm.runInContext(readFileSync(join(pub, 'panneau.js'), 'utf8').replace(/^const (BANDEAU|PANNEAU|PLUS|TOUCHES_REPONSES|RAISONS)\b/gm, 'var $1'), ctx, { filename: 'panneau.js' });
	vm.runInContext("Langue.actuelle = 'fr';", ctx);
	return ctx;
}
const ctx = contexte();
const jouer = (lundi, strategie, graine) => vm.runInContext(`(() => {
	let s = ${graine} >>> 0; const alea = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
	Jeu.chargerSemaine(${JSON.stringify(lundi)}); Jeu.nouvellePartie(); Taches.nouvellePartie(); Taches.matin && Taches.matin();
	const out = { bon: 0, rate: 0, autres: 0, n: 0, licencie: null, max: { fluidite: 0, reputation: 0, budget: 0 }, plafond: {}, jours: Jeu.jours.length, parJour: Jeu.jours.map((j) => j.dossiers.length), types: {}, cats: {} };
	Jeu.paquet.forEach((d) => { out.types[d.type] = (out.types[d.type] || 0) + 1; const c = Jeu.categorie(d); out.cats[c] = (out.cats[c] || 0) + 1; });
	out.retards = Jeu.paquet.filter((d) => d.retard !== null && d.retard !== undefined).length;
	const fini = () => Jeu.terminee || (Jeu.statutPatron && Jeu.statutPatron.licencie);
	let garde = 0;
	while (!fini() && garde++ < 400) {
		if (Jeu.prochainDuJour()) {
			const d = Jeu.dossierCourant();
			const rs = reponsesDialogue(d);
			const best = Jeu.meilleureReponse(d);
			const a = rs.find((r) => !r.clash && r.cle === best), c = rs.find((r) => r.clash), b = rs.find((r) => r !== a && r !== c);
			const choix = ${JSON.stringify(strategie)} === 'meilleure' ? a : ${JSON.stringify(strategie)} === 'autre' ? b : ${JSON.stringify(strategie)} === 'clash' ? c : rs[Math.floor(alea() * 3)];
			Jeu.clashSuivant = !!choix.clash;
			const res = Jeu.decider(choix.cle);
			Jeu.clashSuivant = false;
			const e = Jeu.evenementsJournee[Jeu.evenementsJournee.length - 1];
			const ev = Jeu.evaluer(e);
			out.n++; if (ev === 'bon') out.bon++; else if (ev === 'rate') out.rate++; else out.autres++;
			Taches.apresDecision(res, Jeu.index - 1);
			for (const k of ['fluidite', 'reputation', 'budget']) { out.max[k] = Math.max(out.max[k], Jeu.jauges[k]); if (Jeu.jauges[k] >= 100 && out.plafond[k] === undefined) out.plafond[k] = Jeu.jourIndex + 1; }
			if (Jeu.statutPatron.licencie) out.licencie = { jour: Jeu.jourIndex + 1, dossier: out.n, cause: Jeu.statutPatron.licencie.cause };
		} else {
			Jeu.finDeJourneeTactique();
			if (Jeu.statutPatron.licencie) { out.licencie = { jour: Jeu.jourIndex + 1, dossier: out.n, cause: Jeu.statutPatron.licencie.cause }; break; }
			if (!Jeu.jours[Jeu.jourIndex + 1]) break;
			Jeu.journeeSuivante(); Taches.matin && Taches.matin();
		}
	}
	out.jauges = Object.assign({}, Jeu.jauges); out.score = Jeu.score(); out.fin = Jeu.typeFin(out.score);
	return out;
})()`, ctx);
const semaines = vm.runInContext('Jeu.semainesProposees().map((x) => ({ lundi: x.lundi }))', ctx);
for (const s of semaines) {
	const m = jouer(s.lundi, 'meilleure', 1);
	console.log(`\n== ${s.lundi} : ${m.n} dossiers joués, ${m.jours} jours, par jour ${m.parJour.join('/')}, retards ${m.retards}`);
	console.log('   types', JSON.stringify(m.types), '| catégories', JSON.stringify(m.cats));
	for (const st of ['meilleure', 'autre', 'clash']) {
		const r = jouer(s.lundi, st, 1);
		console.log(`   ${st.padEnd(9)} : bon ${r.bon}/${r.n}, raté ${r.rate}, score ${r.score} (${r.fin}), jauges ${JSON.stringify(r.jauges)}, plafond 100 atteint jour ${JSON.stringify(r.plafond)}${r.licencie ? ', LICENCIÉ jour ' + r.licencie.jour + ' au dossier ' + r.licencie.dossier + ' (' + r.licencie.cause + ')' : ''}`);
	}
	const N = 300; const fins = {}; let lic = 0, somme = 0, min = 999, maxi = 0;
	for (let g = 1; g <= N; g++) { const r = jouer(s.lundi, 'hasard', g * 7919); const f = r.licencie ? 'licencié' : r.fin; fins[f] = (fins[f] || 0) + 1; if (r.licencie) lic++; somme += r.score; min = Math.min(min, r.score); maxi = Math.max(maxi, r.score); }
	console.log(`   hasard ×${N} : fins ${JSON.stringify(fins)}, score moyen ${Math.round(somme / N)} (min ${min}, max ${maxi})`);
}
