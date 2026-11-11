// Prompt 88 § 0 : mesure de la répétition sur les 3 semaines réelles (une par niveau), par simulation de la logique
// du jeu (mêmes fichiers que test-jeu.mjs, sans affichage). Journalise, par journée : les tâches jouées par type et
// chaque texte montré au joueur (narration, réaction, liaison, contexte, patron, Community, mail), puis compte les
// textes identiques répétés dans une même journée. Usage : node scripts/mesure-repetition.mjs [--json]
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

export function mesurer(langue = 'fr') {
	const ctx = { console, setTimeout, clearTimeout };
	ctx.window = ctx;
	ctx.globalThis = ctx;
	vm.createContext(ctx);
	const fichiers = ['data/lignes.js', 'data/semaines.js', 'data/fallback.js', 'data/messages.js', 'data/reponses.js', 'i18n.js', 'game.js', 'rythme.js', 'taches.js'];
	for (const f of fichiers) if (existsSync(join(pub, f))) vm.runInContext(readFileSync(join(pub, f), 'utf8'), ctx, { filename: f });
	vm.runInContext(`Langue.actuelle = ${JSON.stringify(langue)};`, ctx);
	return vm.runInContext(
		`(() => {
		const semaines = Jeu.semainesProposees();
		const sortie = [];
		const avecTaches = typeof Taches !== 'undefined';
		for (const s of semaines) {
			Jeu.defiChrono = false;
			Jeu.chargerSemaine(s.lundi); Jeu.nouvellePartie();
			if (typeof Rythme !== 'undefined') Rythme.melangerArrivees();
			if (avecTaches) Taches.nouvellePartie();
			let jour = null, garde = 0, liaisonPrec = null;
			const jours = [];
			const ouvrir = () => {
				const j = Jeu.jourCourant();
				jour = { date: j.date, niveau: s.niveau, taches: [], textes: [], patronAvant: Jeu.messagesPatron.length, plaintesAvant: Jeu.plaintes.length };
				jours.push(jour);
				if (avecTaches) {
					Taches.matin();
					const b = Taches.briefing();
					if (b) { Taches.choisirPriorites(b.options.slice(0, 2).map((o) => o.id)); jour.taches.push('briefing'); jour.textes.push(...b.options.map((o) => T('tache.prio.' + o.id, o.vars))); }
				}
			};
			const fermer = () => {
				Jeu.messagesPatron.slice(jour.patronAvant).forEach((m) => { jour.taches.push('message'); jour.textes.push(String(m.texte)); });
				jour.patronAvant = Jeu.messagesPatron.length;
				Jeu.plaintes.slice(jour.plaintesAvant).forEach((p) => { jour.taches.push('plainte'); const tx = p.def.texte[Langue.actuelle] || p.def.texte.fr; jour.textes.push(String(tx).replace(/\\{(\\w+)\\}/g, (m, k) => (p.vars && p.vars[k] !== undefined ? String(p.vars[k]) : m))); });
				jour.plaintesAvant = Jeu.plaintes.length;
			};
			ouvrir();
			while (garde++ < 600) { // la dernière journée va jusqu'au rapport du soir, comme en jeu
				const d = Jeu.prochainDuJour();
				if (d) {
					Jeu.horloge.minutes = Math.max(Jeu.horloge.minutes, d.minute); // l'horloge avance comme en jeu
					fermer(); // messages arrivés depuis la dernière action
					Jeu.declencherPlainte(Jeu.index);
					fermer();
					if (Jeu.conflit && Jeu.conflit()) Jeu.choisirPriorite('a');
					if (d.contradiction) jour.taches.push('verifier');
					const n = Jeu.index;
					const cles = Jeu.actionsPossibles(d);
					const r = Jeu.decider(cles[n % cles.length], d.contradiction ? d.contradiction.bonne : undefined);
					jour.taches.push('signalement');
					jour.textes.push(String(r.narration.titre), String(r.narration.texte));
					if (typeof Rythme !== 'undefined') {
						const c = Rythme.contexteNarration(r, n); if (c) jour.textes.push(T(c.cle, c.vars));
						const l = Rythme.liaison(n, liaisonPrec); if (l) { liaisonPrec = l.cle; jour.textes.push(T(l.cle, l.vars)); }
					}
					fermer();
					if (avecTaches) {
						const tache = Taches.apresDecision(r, n);
						if (tache) { const res = Taches.resoudre(tache, Taches.bonneReponse(tache)); jour.taches.push(tache.type); jour.textes.push(...(res && res.textes ? res.textes : [])); }
					}
				} else {
					if (avecTaches) {
						const rp = Taches.rapport();
						if (rp) { jour.taches.push('rapport'); jour.textes.push(...rp.faits.map((f) => f.texte)); Taches.validerRapport(rp.faits[0].id, 'budget'); }
					}
					Jeu.finDeJourneeTactique();
					const m = Jeu.mailDuJour();
					m.lignes.forEach((l) => jour.textes.push(String(l)));
					fermer();
					if (!Jeu.jours[Jeu.jourIndex + 1]) break;
					Jeu.journeeSuivante();
					const i = Jeu.preparerInspection(); if (i) { jour.taches.push('inspection'); Jeu.repondreInspection(i.bonne); }
					ouvrir();
				}
			}
			sortie.push(...jours.map((j) => {
				const parType = {};
				j.taches.forEach((t) => (parType[t] = (parType[t] || 0) + 1));
				const vus = {}; j.textes.filter(Boolean).forEach((x) => (vus[x] = (vus[x] || 0) + 1));
				const repetes = Object.entries(vus).filter(([, n]) => n > 1).map(([x, n]) => ({ texte: x.slice(0, 90), n }));
				const total = j.taches.length;
				const dominant = Object.entries(parType).sort((a, b) => b[1] - a[1])[0] || ['aucun', 0];
				let suite = 0, maxSuite = 0, prec = null;
				j.taches.forEach((t) => { suite = t === prec ? suite + 1 : 1; prec = t; maxSuite = Math.max(maxSuite, suite); });
				// Vue « décisions actives » : sans la lecture des messages (tâches où le joueur choisit quelque chose)
				const actives = j.taches.filter((t) => t !== 'message');
				const parActif = {};
				actives.forEach((t) => (parActif[t] = (parActif[t] || 0) + 1));
				const domA = Object.entries(parActif).sort((a, b) => b[1] - a[1])[0] || ['aucun', 0];
				let sA = 0, maxA = 0, pA = null;
				actives.forEach((t) => { sA = t === pA ? sA + 1 : 1; pA = t; maxA = Math.max(maxA, sA); });
				return { semaine: s.lundi, niveau: j.niveau, date: j.date, total, parType, dominant: dominant[0], partDominant: total ? dominant[1] / total : 0, types: Object.keys(parType).length, maxSuite, repetes, sequence: j.taches,
					actives: actives.length, dominantActif: domA[0], partDominantActif: actives.length ? domA[1] / actives.length : 0, typesActifs: Object.keys(parActif).length, maxSuiteActif: maxA };
			}));
		}
		return JSON.parse(JSON.stringify(sortie));
	})()`,
		ctx,
	);
}

if (process.argv[1] && process.argv[1].endsWith('mesure-repetition.mjs')) {
	const jours = mesurer(process.argv.includes('--en') ? 'en' : 'fr');
	if (process.argv.includes('--json')) console.log(JSON.stringify(jours, null, 1));
	else {
		for (const j of jours) console.log(`${j.date} (${j.niveau}) · ${j.total} actions ${JSON.stringify(j.parType)} · dominant ${j.dominant} ${Math.round(j.partDominant * 100)} % · actives : ${j.actives}, ${j.typesActifs} type(s), dominant ${j.dominantActif} ${Math.round(j.partDominantActif * 100)} %, suite max ${j.maxSuiteActif} · textes répétés ${j.repetes.reduce((a, r) => a + r.n - 1, 0)}`);
		const rep = jours.flatMap((j) => j.repetes);
		const top = {}; rep.forEach((r) => (top[r.texte] = (top[r.texte] || 0) + r.n - 1));
		console.log('\nTextes répétés (cumul sur les journées) :');
		Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([x, n]) => console.log(`  ${n} × ${x}`));
		const parts = jours.filter((j) => j.total).map((j) => j.partDominant);
		const pa = jours.filter((j) => j.actives).map((j) => j.partDominantActif);
		console.log(`\nDécisions actives : part moyenne du type dominant ${Math.round((pa.reduce((a, b) => a + b, 0) / pa.length) * 100)} %, journées ≥ 50 % : ${jours.filter((j) => j.partDominantActif >= 0.5).length}/${jours.length}, suite max ${Math.max(...jours.map((j) => j.maxSuiteActif))}, journées < 3 types : ${jours.filter((j) => j.typesActifs < 3).length}, textes répétés : ${rep.reduce((a, r) => a + r.n - 1, 0)}`);
		console.log(`Part moyenne du type dominant : ${Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100)} % · journées sans rien : ${jours.filter((j) => !j.parType.signalement).length} · journées ≥ 5 signalements : ${jours.filter((j) => (j.parType.signalement || 0) >= 5).length}`);
	}
}
