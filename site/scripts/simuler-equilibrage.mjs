// Nantes en régulation — simulation d'équilibrage (prompt 201, étendue au prompt 213), outil manuel hors `npm test`.
// Charge les VRAIS fichiers du jeu (comme test-jeu.mjs) et joue chaque semaine archivée selon plusieurs stratégies :
// - meilleure : la réplique que l'évaluation juge la meilleure (depuis le prompt 213, elle tient compte de l'excès :
//   c'est aussi la stratégie « régulateur », qui ramène la jauge en excès vers le milieu) ;
// - maximiseur : la réplique qui fait le plus monter les jauges, sans tenir compte de l'excès (« monter partout ») ;
// - autre, clash : toujours l'autre réplique, toujours le clash ; hasard : 300 parties semées.
// Le délai de réponse compte pour la patience (prompt 213) : 10 min pour les stratégies scriptées, 0 à 90 min au hasard.
// Ne compte ni les réponses Community, ni les équipes, ni la sieste, ni l'incident fictif.
// Usage (dans site/) : node scripts/simuler-equilibrage.mjs [--avant]
//   --avant : neutralise les règles du prompt 213 (zone d'excès, patience, poids négatifs) pour comparer.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const AVANT = process.argv.includes('--avant');
function contexte() {
	const st = new Map();
	const ctx = { console: { log() {}, warn() {}, error() {} }, localStorage: { getItem: (k) => (st.has(k) ? st.get(k) : null), setItem: (k, v) => st.set(k, String(v)), removeItem: (k) => st.delete(k) }, navigator: { language: 'fr' }, location: { search: '', protocol: 'file:' }, document: { getElementById: () => null, documentElement: { lang: 'fr' } } };
	ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
	for (const f of ['data/lignes.js', 'data/semaines.js', 'data/fallback.js', 'data/messages.js', 'data/reponses.js', 'data/loire.js', 'i18n.js', 'game.js', 'rythme.js', 'taches.js', 'journal-donnees.js', 'traces.js', 'notifs-tel.js', 'texte.js', 'posture.js']) vm.runInContext(readFileSync(join(pub, f), 'utf8'), ctx, { filename: f });
	vm.runInContext(readFileSync(join(pub, 'panneau.js'), 'utf8').replace(/^const (BANDEAU|PANNEAU|PLUS|TOUCHES_REPONSES|RAISONS)\b/gm, 'var $1'), ctx, { filename: 'panneau.js' });
	vm.runInContext("Langue.actuelle = 'fr';", ctx);
	if (AVANT) vm.runInContext("Object.assign(Jeu.REGLAGES.exces, { budget: 999, reputation: 999 }); Jeu.REGLAGES.patience.minutesParPoint = 1e9;", ctx);
	return ctx;
}
const ctx = contexte();
const jouer = (lundi, strategie, graine) => vm.runInContext(`(() => {
	let s = ${graine} >>> 0; const alea = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
	const st = ${JSON.stringify(strategie)};
	Jeu.chargerSemaine(${JSON.stringify(lundi)}); Jeu.nouvellePartie(); Taches.nouvellePartie(); Taches.matin && Taches.matin();
	const out = { bon: 0, rate: 0, autres: 0, n: 0, licencie: null, plafond: {}, exces: { budget: 0, reputation: 0 }, patience: 0, jours: Jeu.jours.length, parJour: Jeu.jours.map((j) => j.dossiers.length) };
	const fini = () => Jeu.terminee || (Jeu.statutPatron && Jeu.statutPatron.licencie);
	// « Monter partout » : poids d'avant le prompt 213 (ce qui manque à chaque jauge), sans zone d'excès
	const poidsNaif = () => ['fluidite', 'reputation', 'budget'].map((k) => Math.max(0.25, Math.min(2, (100 - Jeu.jauges[k]) / 50)));
	const valeurNaive = (r, d) => { const e = Jeu.effetsAttendus(r.cle, d).slice(); const p = poidsNaif(); return e.reduce((a, v, i) => a + v * p[i], 0); };
	let garde = 0;
	while (!fini() && garde++ < 400) {
		if (Jeu.prochainDuJour()) {
			const d = Jeu.dossierCourant();
			const delai = st === 'hasard' ? Math.floor(alea() * 91) : 10;
			if (Jeu.horloge && d.minute !== undefined) Jeu.horloge.minutes = Math.max(Jeu.horloge.minutes, d.minute + delai);
			const rs = reponsesDialogue(d);
			const best = Jeu.meilleureReponse(d);
			const a = rs.find((r) => !r.clash && r.cle === best) || rs.find((r) => !r.clash), c = rs.find((r) => r.clash), b = rs.find((r) => r !== a && r !== c) || a;
			const choix = st === 'meilleure' ? a : st === 'maximiseur' ? rs.filter((r) => !r.clash).sort((x, y) => valeurNaive(y, d) - valeurNaive(x, d))[0] : st === 'autre' ? b : st === 'clash' ? c : rs[Math.floor(alea() * 3)];
			Jeu.clashSuivant = !!choix.clash;
			const res = Jeu.decider(choix.cle);
			Jeu.clashSuivant = false;
			out.patience += res.patience || 0;
			const e = Jeu.evenementsJournee[Jeu.evenementsJournee.length - 1];
			const ev = Jeu.evaluer(e);
			out.n++; if (ev === 'bon') out.bon++; else if (ev === 'rate') out.rate++; else out.autres++;
			Taches.apresDecision(res, Jeu.index - 1);
			for (const k of ['fluidite', 'reputation', 'budget']) if (Jeu.jauges[k] >= 100 && out.plafond[k] === undefined) out.plafond[k] = Jeu.jourIndex + 1;
			for (const k of ['budget', 'reputation']) if (Jeu.jauges[k] >= 85) out.exces[k]++; // seuil fixe : comparable avant / après
			if (Jeu.statutPatron.licencie) out.licencie = { jour: Jeu.jourIndex + 1, dossier: out.n, cause: Jeu.statutPatron.licencie.cause };
		} else {
			Jeu.finDeJourneeTactique();
			if (Jeu.statutPatron.licencie) { out.licencie = { jour: Jeu.jourIndex + 1, dossier: out.n, cause: Jeu.statutPatron.licencie.cause }; break; }
			if (!Jeu.jours[Jeu.jourIndex + 1]) break;
			Jeu.journeeSuivante(); Taches.matin && Taches.matin();
		}
	}
	out.soirsExces = (Jeu.excesSoirs || []).filter((x) => x.budget !== null || x.reputation !== null).length;
	out.rappels = Jeu.rappelsExces || 0;
	out.jauges = Object.assign({}, Jeu.jauges); out.score = Jeu.score(); out.palier = Jeu.typeFin(out.score);
	out.fin = out.licencie ? 'licencié' : Jeu.finDeSemaine();
	return out;
})()`, ctx);
const semaines = vm.runInContext('Jeu.semainesProposees().map((x) => ({ lundi: x.lundi }))', ctx);
console.log(AVANT ? '### AVANT (règles du prompt 213 neutralisées)' : '### APRÈS (prompt 213)');
const total = { hasard: {}, paliers: {}, n: 0 };
for (const s of semaines) {
	const m = jouer(s.lundi, 'meilleure', 1);
	console.log(`\n== ${s.lundi} : ${m.n} dossiers, ${m.jours} jours (${m.parJour.join('/')})`);
	for (const st of ['meilleure', 'maximiseur', 'autre', 'clash']) {
		const r = jouer(s.lundi, st, 1);
		console.log(`   ${st.padEnd(10)} : bon ${r.bon}/${r.n}, score ${r.score} (${r.palier}) → « ${r.fin} », jauges ${JSON.stringify(r.jauges)}, en excès B ${r.exces.budget} R ${r.exces.reputation}, soirs ${r.soirsExces}, rappels ${r.rappels}, patience −${r.patience}, plafond ${JSON.stringify(r.plafond)}${r.licencie ? ', LICENCIÉ jour ' + r.licencie.jour + ' (' + r.licencie.cause + ')' : ''}`);
	}
	const N = 300; const fins = {}; const paliers = {}; let somme = 0;
	for (let g = 1; g <= N; g++) { const r = jouer(s.lundi, 'hasard', g * 7919); fins[r.fin] = (fins[r.fin] || 0) + 1; total.hasard[r.fin] = (total.hasard[r.fin] || 0) + 1; total.n++; const p = r.licencie ? 'licencié' : r.palier; paliers[p] = (paliers[p] || 0) + 1; total.paliers[p] = (total.paliers[p] || 0) + 1; somme += r.score; }
	console.log(`   hasard ×${N} : paliers ${JSON.stringify(paliers)}, fins ${JSON.stringify(fins)}, score moyen ${Math.round(somme / N)}`);
}
const pc = (o) => Object.entries(o).map(([k, v]) => k + ' ' + Math.round((v / total.n) * 100) + ' %').join(', ');
console.log(`\nhasard, toutes semaines — paliers : ${pc(total.paliers)}\nhasard, toutes semaines — fins : ${pc(total.hasard)}`);
