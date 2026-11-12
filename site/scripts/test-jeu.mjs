// Nantes en régulation — test du jeu sans navigateur (prompt 48), lancé par `npm test`.
// Charge les VRAIS fichiers du jeu (données préparées, i18n.js, game.js) dans un contexte Node isolé,
// joue chaque semaine archivée de bout en bout avec les vraies fonctions de game.js et vérifie des
// invariants : jauges bornées, avancée du paquet, journées, mails, bilan, sauvegarde / reprise,
// reproductibilité, mécaniques du prompt 47. Aucune donnée inventée : seules les archives du dépôt.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
const erreurs = [];
let controles = 0;
const verifier = (ok, message) => (ok ? controles++ : erreurs.push(message));

/** Nouveau contexte : un « window » minimal, puis les scripts du jeu dans l'ordre de index.html */
function contexte(langue, stockage = new Map(), avecHistoire = false) {
	const ctx = {
		console,
		localStorage: { getItem: (k) => (stockage.has(k) ? stockage.get(k) : null), setItem: (k, v) => stockage.set(k, String(v)), removeItem: (k) => stockage.delete(k) },
		navigator: { language: langue },
		location: { search: '', protocol: 'file:' },
		document: { getElementById: () => null, documentElement: { lang: langue } },
	};
	ctx.window = ctx;
	ctx.globalThis = ctx;
	vm.createContext(ctx);
	const fichiers = ['data/lignes.js', 'data/semaines.js', 'data/fallback.js', 'data/messages.js', 'data/reponses.js', 'data/loire.js', 'i18n.js', 'game.js', 'rythme.js', 'taches.js', 'journal-donnees.js', 'traces.js', 'notifs-tel.js', 'texte.js']; // prompts 74 / 88 / 89 / 90 / 92 : logique pure de la couche d'affichage
	if (avecHistoire) fichiers.push('confort.js', 'histoire.js'); // prompt 56 : progression et palmarès (localStorage)
	for (const f of fichiers) {
		vm.runInContext(readFileSync(join(pub, f), 'utf8'), ctx, { filename: f });
	}
	vm.runInContext(`Langue.actuelle = ${JSON.stringify(langue)};`, ctx);
	return ctx;
}

/** Joue une semaine entière : décisions tirées d'une suite fixe, journées enchaînées comme dans le jeu */
function jouer(ctx, lundi, choix) {
	return vm.runInContext(
		`(() => {
		const choix = ${JSON.stringify(choix)};
		Jeu.chargerSemaine(${JSON.stringify(lundi)});
		Jeu.nouvellePartie();
		const traces = { jauges: [], mails: [], inspections: 0, sauvegarde: null, tours: 0 };
		while (!Jeu.terminee && traces.tours++ < 500) {
			const d = Jeu.prochainDuJour();
			if (d) {
				if (Jeu.conflit && Jeu.conflit()) Jeu.choisirPriorite('a');
				const avant = Jeu.index;
				const r = Jeu.decider(choix[Jeu.index % choix.length], d.contradiction ? d.contradiction.bonne : undefined);
				traces.jauges.push(Object.assign({}, Jeu.jauges));
				if (Jeu.index !== avant + 1) throw new Error('le paquet n\\'avance pas');
				if (!r.narration || !r.narration.titre) throw new Error('narration absente');
				if (Jeu.index === 3) traces.sauvegarde = JSON.stringify(Jeu.instantane(0));
			} else {
				Jeu.finDeJourneeTactique();
				const m = Jeu.mailDuJour();
				traces.mails.push(m.lignes.map(String));
				if (!Jeu.jours[Jeu.jourIndex + 1]) break;
				Jeu.journeeSuivante();
				const i = Jeu.preparerInspection();
				if (i) {
					traces.inspections++;
					traces.inspection = Jeu.repondreInspection(i.bonne);
				}
			}
		}
		const b = Jeu.bilan();
		return JSON.parse(JSON.stringify({ traces, bilan: b, score: Jeu.score(), jauges: Jeu.jauges, total: Jeu.paquet.length, index: Jeu.index, profil: Jeu.profilPartie(), affluence: Jeu.jours.map((j) => Jeu.evenementsAffluence(j.date).length) }));
	})()`,
		ctx,
	);
}

const fr = contexte('fr');
const semaines = vm.runInContext('Jeu.semainesProposees().map((s) => s.lundi)', fr);
verifier(semaines.length >= 3, `au moins 3 semaines archivées (trouvé ${semaines.length})`);
const SUITES = [
	['renfort', 'devier', 'retenir'],
	['rien', 'rien', 'temps'],
	['devier'],
];

for (const lundi of semaines) {
	for (const choix of SUITES) {
		const nom = `${lundi} [${choix.join(',')}]`;
		const p = jouer(contexte('fr'), lundi, choix);
		verifier(p.index === p.total && p.total > 0, `${nom} : partie inachevée (${p.index}/${p.total})`);
		verifier(
			p.traces.jauges.every((j) => Object.values(j).every((v) => Number.isInteger(v) && v >= 0 && v <= 100)),
			`${nom} : jauge hors de 0–100 ou non entière`,
		);
		verifier(p.score === p.jauges.fluidite + p.jauges.reputation + p.jauges.budget && p.bilan.score === p.score, `${nom} : score incohérent`);
		verifier(['bonne', 'moyenne', 'mauvaise'].includes(p.bilan.type), `${nom} : type de fin inconnu`);
		const textes = JSON.stringify(p.traces.mails) + JSON.stringify(p.bilan);
		verifier(!textes.includes('[À COMPLÉTER]') && !textes.includes('undefined'), `${nom} : texte manquant dans un mail ou le bilan`);
		verifier(p.traces.mails.length >= 1, `${nom} : aucun mail de fin de journée`);
		verifier(p.traces.inspections <= 1, `${nom} : plus d'une inspection dans la semaine`);
		if (p.traces.inspection) verifier(p.traces.inspection.juste === true && p.traces.inspection.effet === 3, `${nom} : inspection juste mal comptée`);
		const attendu = { renfort: 'pompier', rien: 'spectateur', devier: 'stratege' }[choix[0]];
		verifier(p.profil && p.profil.id === attendu, `${nom} : profil ${p.profil && p.profil.id} au lieu de ${attendu}`);
		// Sauvegarde puis reprise : même fin de partie (graine et tirages restaurés)
		if (p.traces.sauvegarde) {
			const c = contexte('fr');
			const fin = vm.runInContext(
				`(() => {
				Jeu.chargerSemaine(${JSON.stringify(lundi)});
				if (!Jeu.restaurerInstantane(${p.traces.sauvegarde}, 0)) return null;
				const choix = ${JSON.stringify(choix)};
				let n = 0;
				while (!Jeu.terminee && n++ < 500) {
					const d = Jeu.prochainDuJour();
					if (d) { if (Jeu.conflit && Jeu.conflit()) Jeu.choisirPriorite('a'); Jeu.decider(choix[Jeu.index % choix.length], d.contradiction ? d.contradiction.bonne : undefined); }
					else { Jeu.finDeJourneeTactique(); Jeu.mailDuJour(); if (!Jeu.jours[Jeu.jourIndex + 1]) break; Jeu.journeeSuivante(); const i = Jeu.preparerInspection(); if (i) Jeu.repondreInspection(i.bonne); }
				}
				return Jeu.score();
			})()`,
				c,
			);
			verifier(fin === p.score, `${nom} : la reprise d'une sauvegarde ne retrouve pas le même score (${fin} ≠ ${p.score})`);
			verifier(p.traces.sauvegarde.length < 60000, `${nom} : sauvegarde de ${p.traces.sauvegarde.length} octets`);
		}
	}
	// Reproductibilité : deux parties identiques donnent le même score
	verifier(jouer(contexte('fr'), lundi, SUITES[0]).score === jouer(contexte('fr'), lundi, SUITES[0]).score, `${lundi} : deux parties identiques divergent`);
}

// Prompt 100 : la difficulté est un paramètre réellement opérant (livret : ≥ 3 paramètres) — budget de départ
// et vitesse d'aggravation d'un même retard changent avec le niveau (hors défi chrono)
const diff = vm.runInContext(
	`(() => { Jeu.chargerSemaine(${JSON.stringify(semaines[0])}); const out = {};
	for (const niveau of ['facile', 'normale', 'difficile']) {
		Jeu.etat.semaine.difficulte = Object.assign({}, Jeu.etat.semaine.difficulte, { niveau });
		Jeu.defiChrono = false; Jeu.nouvellePartie();
		const d = { retard: 12, minute: 600 };
		out[niveau] = { budget: Jeu.jauges.budget, retard: Jeu.retardEffectif(d, 600 + 20), actifs: Jeu.difficulte().actifs };
	}
	return out; })()`,
	fr,
);
verifier(diff.facile.budget > diff.normale.budget && diff.normale.budget > diff.difficile.budget, `difficulté : budget de départ non ordonné ${JSON.stringify(diff)}`);
verifier(diff.facile.retard < diff.normale.retard && diff.normale.retard < diff.difficile.retard, `difficulté : aggravation non ordonnée ${JSON.stringify(diff)}`);
verifier(diff.facile.actifs > diff.normale.actifs && diff.normale.actifs > diff.difficile.actifs, `difficulté : signalements simultanés non ordonnés ${JSON.stringify(diff)}`);

// Agenda anticipé : les fiches « fourre-tout » (tous types cochés) ne déclenchent rien
const affl = vm.runInContext(
	`(() => { Jeu.chargerSemaine('2026-10-12'); Jeu.nouvellePartie();
	return Jeu.jours.flatMap((j) => Jeu.evenementsAffluence(j.date)).map((e) => String(e.nature).split(',').length); })()`,
	fr,
);
verifier(affl.every((n) => n <= 3), 'agenda anticipé : une fiche fourre-tout a été retenue');

// Démission : seulement quand les trois jauges sont sous 20
const dem = vm.runInContext(
	`(() => { Jeu.chargerSemaine('2026-09-14'); Jeu.nouvellePartie();
	const a = Jeu.peutDemissionner(); Jeu.jauges = { fluidite: 19, reputation: 5, budget: 0 }; const b = Jeu.peutDemissionner();
	Jeu.jauges.budget = 20; return [a, b, Jeu.peutDemissionner()]; })()`,
	fr,
);
verifier(JSON.stringify(dem) === '[false,true,false]', `démission : ${JSON.stringify(dem)}`);

// Prompt 51 : départ avant la fin — dossiers du jour réglés, blâme appliqué une seule fois le lendemain
const dep = vm.runInContext(
	`(() => { Jeu.chargerSemaine('2026-09-14'); Jeu.nouvellePartie();
	Jeu.decider('renfort');
	const restants = Jeu.dossiersRestantsDuJour();
	const d = Jeu.partirAvantLaFin('09:30');
	const toutRegle = !Jeu.prochainDuJour();
	Jeu.finDeJourneeTactique();
	const avant = Jeu.jauges.reputation;
	Jeu.journeeSuivante();
	const apres = Jeu.jauges.reputation;
	const blame = Jeu.blame && String(Jeu.blame.texte);
	Jeu.finDeJourneeTactique(); const avant2 = Jeu.jauges.reputation;
	while (Jeu.prochainDuJour()) Jeu.decider('retenir');
	Jeu.finDeJourneeTactique(); const r2 = Jeu.jauges.reputation; Jeu.journeeSuivante();
	return { restants, laisses: d.laisses, toutRegle, delta: apres - avant, avant, blame, encore: Jeu.jauges.reputation - r2 }; })()`,
	fr,
);
verifier(dep.laisses === dep.restants && dep.restants > 0, `départ anticipé : ${dep.laisses} dossier(s) laissés au lieu de ${dep.restants}`);
verifier(dep.toutRegle, 'départ anticipé : des dossiers du jour restent en suspens');
verifier(dep.delta === Math.max(-dep.avant, -8), `départ anticipé : blâme de ${dep.delta} au lieu de −8`);
verifier(dep.blame && dep.blame.includes('09:30') && !dep.blame.includes('[À COMPLÉTER]'), 'départ anticipé : mail du patron sans l\'heure du départ');
verifier(dep.encore === 0, `départ anticipé : blâme appliqué deux fois (${dep.encore})`);

// Prompt 55 : défis tirés par la graine, bonus une seule fois ; ralenti une fois par jour
const df = vm.runInContext(
	`(() => { Jeu.chargerSemaine('2026-09-14'); Jeu.nouvellePartie();
	const a = Jeu.defis.slice(); Jeu.nouvellePartie(); const b = Jeu.defis.slice();
	const t0 = Jeu.tirages; Jeu.tirerDefis(); const dixAvant = Jeu.tirages - t0; // le tirage des défis ne consomme pas les dés
	// Ralenti
	const r1 = Jeu.demanderRalenti(1000), actif = Jeu.ralentiActif(5000), fini = Jeu.ralentiActif(11000), r2 = Jeu.demanderRalenti(20000);
	Jeu.journeeSuivante(); const r3 = Jeu.demanderRalenti(30000);
	// Défis : on force des valeurs connues, on applique deux fois
	Jeu.defis = ['budget60', 'fluidite60', 'zero_expire'];
	Jeu.jauges = { fluidite: 70, reputation: 40, budget: 20 };
	const avant = Object.assign({}, Jeu.jauges);
	const res = Jeu.appliquerDefis(); const apres1 = Object.assign({}, Jeu.jauges);
	Jeu.appliquerDefis(); const apres2 = Object.assign({}, Jeu.jauges);
	return { a, b, tirages: dixAvant, r1, actif, fini, r2, r3, res, avant, apres1, apres2 }; })()`,
	fr,
);
verifier(df.a.length === 3 && new Set(df.a).size === 3 && JSON.stringify(df.a) === JSON.stringify(df.b), `défis : tirage non reproductible ${JSON.stringify(df.a)} / ${JSON.stringify(df.b)}`);
verifier(df.tirages === 0, `défis : le tirage a consommé le générateur de dés (${df.tirages})`);
verifier(df.r1 && df.actif && !df.fini && !df.r2 && df.r3, `ralenti : ${JSON.stringify([df.r1, df.actif, df.fini, df.r2, df.r3])}`);
const fl = df.res.find((r) => r.id === 'fluidite60');
verifier(fl.tenu && df.apres1.fluidite === df.avant.fluidite + 5 && df.apres2.fluidite === df.apres1.fluidite, `défis : bonus fluidité ${df.avant.fluidite} → ${df.apres1.fluidite} → ${df.apres2.fluidite}`);
verifier(!df.res.find((r) => r.id === 'budget60').tenu && df.apres1.budget === df.avant.budget, 'défis : un défi raté ne doit rien rapporter');

// Prompt 56 : chiffres du rapport de semaine, déblocage persisté, palmarès sans doublon
const st = vm.runInContext(
	`(() => { Jeu.chargerSemaine('2026-09-14'); Jeu.nouvellePartie();
	const suite = ['devier', 'retenir', 'renfort', 'rien', 'temps'];
	let n = 0;
	while (!Jeu.terminee && n < 500) { const d = Jeu.prochainDuJour(); if (d) { Jeu.decider(suite[n % 5], d.contradiction ? d.contradiction.bonne : undefined); n++; } else { Jeu.finDeJourneeTactique(); if (!Jeu.jours[Jeu.jourIndex + 1]) break; Jeu.journeeSuivante(); } }
	const attendu = { renfort: 0, devier: 0, retenir: 0, rien: 0 };
	for (let i = 0; i < n; i++) if (suite[i % 5] !== 'temps') attendu[suite[i % 5]]++; // prompt 163 : par famille (anciennes clés = leur famille)
	return { s: Jeu.statsSemaine(), attendu, n, mail: Jeu.mailFinSemaine().lignes.map(String) }; })()`,
	fr,
);
verifier(st.s.recus === st.n && st.s.traites + st.s.expires === st.n, `rapport : reçus ${st.s.recus}, traités ${st.s.traites}, expirés ${st.s.expires}, décisions ${st.n}`);
verifier(JSON.stringify(st.s.parFamille) === JSON.stringify(st.attendu), `rapport : décisions par famille ${JSON.stringify(st.s.parFamille)} ≠ ${JSON.stringify(st.attendu)}`);
verifier(st.s.score === st.s.jauges.fluidite + st.s.jauges.reputation + st.s.jauges.budget, 'rapport : score ≠ somme des jauges');
verifier(st.mail.length >= 2 && st.mail[0].includes(String(st.s.score)) && !st.mail.join(' ').includes('[À COMPLÉTER]'), 'mail du dernier soir : chiffres absents ou texte manquant');
const stockage = new Map();
const h1 = contexte('fr', stockage, true);
const prog = vm.runInContext(
	`(() => { const p = progressionHistoire(); p.scores[1] = 180; enregistrerProgression(p);
	Confort.Bilans.enregistrer('2026-09-14', 180, { fluidite: 60, reputation: 60, budget: 60 }, { profil: 'pompier', defis: '2/3' });
	Confort.Bilans.enregistrer('2026-09-14', 150, { fluidite: 50, reputation: 50, budget: 50 }, { profil: 'stratege', defis: '0/3' });
	return true; })()`,
	h1,
);
const h2 = contexte('fr', stockage, true); // « rechargement » : nouveau contexte, même stockage
const relu = vm.runInContext(`({ p: progressionHistoire(), b: localStorage.getItem('pxe-nte001:jeu:meilleurs-bilans') })`, h2);
verifier(prog && relu.p.scores[1] === 180, 'déblocage : la semaine terminée n\'est pas retrouvée après rechargement');
const palm = JSON.parse(relu.b || '{}');
verifier(Object.keys(palm).length === 1 && palm['2026-09-14'].score === 180 && palm['2026-09-14'].defis === '2/3', `palmarès : ${relu.b}`);

// Prompt 63 : réactions en chaîne aux réponses Community
const sv = vm.runInContext(
	`(() => {
	const essai = () => { Jeu.chargerSemaine('2026-10-12'); Jeu.nouvellePartie();
		const res = [];
		for (let i = 0; i < Jeu.paquet.length && res.length < 6; i++) { const p = Jeu.declencherPlainte(i); if (p) { Jeu.repondrePlainte(p, 0); res.push(p); Jeu.plaintes.forEach((q) => { if (q.reponse === null) Jeu.repondrePlainte(q, 0); }); } }
		return res.map((p) => (p.suivis || []).map((x) => x.minute + ':' + x.modele + ':' + x.auteur).join(',')); };
	const a = essai(), b = essai();
	const nbs = Jeu.plaintes.map((p) => (p.suivis || []).length);
	const rep0 = Jeu.jauges.reputation;
	const total = Jeu.plaintes.reduce((s, p) => s + (p.suivis || []).length, 0);
	const delta = Jeu.plaintes.reduce((s, p) => s + (p.suivis || []).reduce((t, x) => t + x.delta, 0), 0);
	Jeu.horloge.minutes = Jeu.debutJournee(); const avant = Jeu.majSuivis();
	Jeu.horloge.minutes = 99999; const livres = Jeu.majSuivis(); const encore = Jeu.majSuivis();
	return { a, b, nbs, total, delta, avant, livres, encore, rep: Jeu.jauges.reputation - rep0, comm: Jeu.commentaires.filter((c) => c.suivi).map((c) => String(c.texte)), rel: Jeu.plaintes.reduce((s, p) => s + (p.relances || []).length, 0) };
	})()`,
	fr,
);
verifier(JSON.stringify(sv.a) === JSON.stringify(sv.b) && sv.a.length > 0, 'réactions : tirage non reproductible ou aucune plainte');
verifier(sv.nbs.every((n) => n >= 0 && n <= 3), `réactions : plus de 3 pour une réponse (${sv.nbs})`);
verifier(sv.livres + sv.avant === sv.total && sv.encore === 0, `réactions : ${sv.avant} + ${sv.livres} livrées sur ${sv.total}, ${sv.encore} en double`);
verifier(sv.comm.length + sv.rel === sv.total && sv.comm.every((x) => x && !x.includes('[À COMPLÉTER]') && !x.includes('« »')), 'réactions : texte manquant ou vide (réactions publiques + relances privées du prompt 85)');

// Prompt 68 : gravité, pertinence, équipes limitées (effectif, cycle, refus, remise à zéro, effet hors sujet, sauvegarde)
const eq = vm.runInContext(
	`(() => {
	const g = [Jeu.gravite({ retard: 25 }), Jeu.gravite({ type: 'alerte météo' }), Jeu.gravite({ retard: 12 }), Jeu.gravite({ type: 'événement' }), Jeu.gravite({ type: 'perturbation', retard: null })];
	const p = [Jeu.equipesPertinentes({ type: 'ligne en difficulté' }), Jeu.equipesPertinentes({ type: 'perturbation' }), Jeu.equipesPertinentes({ type: 'événement' }), Jeu.equipesPertinentes({ type: 'alerte météo' }), Jeu.equipesPertinentes({ type: 'perturbation', texte_source: 'Accident de bus' })];
	Jeu.chargerSemaine('2026-10-12'); Jeu.nouvellePartie(); Jeu.jauges.budget = 100;
	Jeu.elementDebloque = () => true;
	const t0 = 1000000;
	const d0 = Jeu.paquet[0];
	const effA = Jeu.effectifJour('ambulance'); // prompt 108 : effectif du jour = base + ⌊signalements ÷ 3⌋, plafonné
	const a = Jeu.envoyerEquipe(0, 'ambulance', t0);
	const deja = Jeu.envoyerEquipe(0, 'ambulance', t0);
	for (let k = 1; k < effA; k++) Jeu.envoyerEquipe(k, 'ambulance', t0 + 15000); // les autres ambulances du jour, engagées plus tard
	const dispoApres = Jeu.equipesDisponibles('ambulance', t0 + 15000);
	Jeu.index = effA;
	const refus = Jeu.envoyerEquipe(effA, 'ambulance', t0 + 16000);
	const libreAvant = Jeu.equipesDisponibles('ambulance', t0 + 20000 + 50000 + 9000);
	const libreApres = Jeu.equipesDisponibles('ambulance', t0 + 20000 + 50000 + 10001);
	// Effet hors sujet : moitié
	const amb = Jeu.equipes[0];
	const rep0 = Jeu.jauges.reputation;
	Jeu.majEquipes(t0 + 20001);
	const gain = Jeu.jauges.reputation - rep0; // prompt 121 : plus de commentaire à l'arrivée (le retour du plaignant vient à la fin de l'intervention)
	// Sauvegarde / reprise : le cycle continue
	const snap = JSON.parse(JSON.stringify(Jeu.instantane(t0 + 30000)));
	// Remise à zéro le matin
	const t1 = t0 + 2000;
	Jeu.envoyerEquipe(effA, 'police', t1); Jeu.envoyerEquipe(effA, 'techniciens', t1);
	const policeAvant = Jeu.effectifJour('police') - Jeu.equipesDisponibles('police', t1) === 1 ? 1 : -1;
	Jeu.journeeSuivante();
	const policeMatin = Jeu.equipesDisponibles('police', t1 + 1) === Jeu.effectifJour('police') ? 2 : -1;
	return { g, p, a: a.ok, deja: deja.ok, dispoApres, refus: refus.ok === false && refus.refus === true && Jeu.refusEquipes, libreAvant, libreApres, pert: amb.pertinente, gain, eff: Jeu.EQUIPES.ambulance.effets.reputation, snapPhase: snap.equipes[0].libre > 0, policeAvant, policeMatin, d0type: d0.type };
	})()`,
	fr,
);
verifier(JSON.stringify(eq.g) === JSON.stringify(['elevee', 'elevee', 'moyenne', 'moyenne', 'faible']), `gravité : ${eq.g}`);
verifier(JSON.stringify(eq.p) === JSON.stringify([['techniciens'], ['police', 'techniciens'], ['police'], ['techniciens', 'pompiers'], ['police', 'ambulance', 'techniciens']]), `pertinence : ${JSON.stringify(eq.p)}`);
verifier(eq.a && !eq.deja && eq.dispoApres === 0, `équipes : envoi ${eq.a}, doublon ${eq.deja}, restant ${eq.dispoApres}`);
verifier(eq.refus === 1, `équipes : refus faute d'effectif non compté (${eq.refus})`);
verifier(eq.libreAvant === 0 && eq.libreApres === 1, `équipes : retour après route + intervention + retour (${eq.libreAvant} → ${eq.libreApres})`);
verifier(eq.pert === true ? eq.gain === eq.eff : eq.gain === Math.round(eq.eff / 2), `équipes : effet ${eq.gain} (pertinente : ${eq.pert}, plein : ${eq.eff})`);
verifier(eq.snapPhase, 'équipes : la sauvegarde ne garde pas le cycle');
verifier(eq.policeAvant === 1 && eq.policeMatin === 2, `équipes : effectifs non remis à zéro le matin (${eq.policeAvant} → ${eq.policeMatin})`);

// Prompt 123 : l'aide en onglets — 10 paragraphes de règles (FR et EN), un titre par carte, aide.js chargé
for (const [nom, ctx] of [['fr', contexte('fr')], ['en', contexte('en')]]) {
	const r = vm.runInContext(`({ n: t('aide.texte').split('\\n\\n').length, titres: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => t('aide.carte.' + i)), autres: ['aide.onglet.demarrer', 'aide.onglet.annonce', 'aide.page', 'aide.clavier', 'aide.tuto.titre', 'aide.tuto.texte', 'aide.groupe.signalement', 'aide.groupe.equipes', 'aide.groupe.bureau', 'aide.groupe.general'].map((k) => t(k)) })`, ctx);
	verifier(r.n === 10, `aide (${nom}) : ${r.n} paragraphes de règles au lieu de 10 (les cartes de aide.js suivent cet ordre)`);
	verifier(r.titres.concat(r.autres).every((x) => x && !/^aide\./.test(x) && !x.includes('[À COMPLÉTER]')), `aide (${nom}) : titre ou libellé manquant`);
}
{
	const aide = readFileSync(join(pub, 'aide.js'), 'utf8');
	verifier(/<script src="\.\/aide\.js"><\/script>/.test(readFileSync(join(pub, 'index.html'), 'utf8')) && /function fenetreAide\(/.test(aide) && !/function fenetreAide\(/.test(readFileSync(join(pub, 'sketch.js'), 'utf8')), 'aide : aide.js non chargé, ou fenetreAide en double');
	verifier(/taille: 20/.test(aide) && !/for \(; ts > 13/.test(aide), 'aide : le texte courant doit rester à 20 px (pagination, pas de rétrécissement)');
}

// Prompt 121 : sans équipe → clos ; avec équipe → en attente jusqu'à la fin de l'intervention, puis retour du plaignant
{
	const r = vm.runInContext(
		`(() => {
		Jeu.chargerSemaine('2026-10-12'); Jeu.nouvellePartie(); Jeu.jauges.budget = 100; Jeu.jauges.reputation = 50;
		Jeu.elementDebloque = () => true;
		const T0 = 5000000;
		const ouvert = Jeu.statutSignalement(0);
		const e = Jeu.envoyerEquipe(0, 'techniciens', T0);
		const q = Jeu.equipes[0];
		Jeu.index = 2; // le joueur a répondu aux dossiers 0 (avec équipe) et 1 (sans équipe)
		const clos = Jeu.statutSignalement(1);
		const attente = Jeu.statutSignalement(0);
		const nAtt = Jeu.signalementsEnAttente().length;
		Jeu.majEquipes(q.arrivee + 1);
		const surPlace = Jeu.statutSignalement(0);
		const n0 = Jeu.commentaires.length; const rep0 = Jeu.jauges.reputation;
		Jeu.majEquipes(q.finIntervention + 1);
		const termine = Jeu.statutSignalement(0);
		const gainRep = Jeu.jauges.reputation - rep0;
		const c = Jeu.commentaires[Jeu.commentaires.length - 1];
		const pl = Jeu.plaignantPour(0);
		Jeu.majEquipes(q.finIntervention + 5000);
		const unSeul = Jeu.commentaires.length - n0;
		// équipe inutile : envoyée après la réponse, le signalement reste clos
		const inutile = Jeu.envoyerEquipe(1, 'police', T0 + 200000);
		Jeu.majEquipes(T0 + 900000);
		// reprise : aucun remerciement en double, et une ancienne sauvegarde (sans drapeau) non plus
		const snap = JSON.parse(JSON.stringify(Jeu.instantane(T0 + 900000)));
		snap.equipes.forEach((x) => delete x.remercie);
		const nAvant = Jeu.commentaires.length;
		Jeu.restaurerInstantane(snap, T0 + 900000); Jeu.index = 2; Jeu.majEquipes(T0 + 2000000);
		return { ouvert, ok: e.ok, clos, attente, nAtt, surPlace, termine, retour: !!(c && c.retour), auteur: c && c.auteur, attendu: pl ? pl.auteur : null, texte: c && String(c.texte), index: c && c.index, gainRep, unSeul, inutileOk: inutile.ok, closApres: Jeu.statutSignalement(1), doublon: Jeu.commentaires.length - nAvant, fin: Jeu.signalementsEnAttente().length };
		})()`,
		contexte('fr'),
	);
	verifier(r.ouvert === 'ouvert' && r.ok && r.clos === 'clos', `retour : sans équipe ${r.clos} (attendu clos), avant réponse ${r.ouvert}`);
	verifier(r.attente === 'attente' && r.nAtt === 1 && r.surPlace === 'attente', `retour : avec équipe ${r.attente}, sur place ${r.surPlace}, en attente ${r.nAtt}`);
	verifier(r.termine === 'termine' && r.retour && r.index === 0 && r.unSeul === 1 && r.gainRep === 1, `retour : fin ${r.termine}, ${r.unSeul} retour(s), réputation +${r.gainRep}`);
	verifier((!r.attendu || r.auteur === r.attendu) && r.texte && !r.texte.includes('{') && !r.texte.includes('[À COMPLÉTER]'), `retour : auteur ${r.auteur} (plaignant ${r.attendu}), texte « ${r.texte} »`);
	verifier(r.inutileOk === false && r.closApres === 'clos' && r.doublon === 0 && r.fin === 0, `retour : équipe inutile ${r.closApres}, doublon à la reprise ${r.doublon}, encore en attente ${r.fin}`);
}

// Prompt 69 : fin de journée — phase « soir », nuit à 21 h, sortie → lendemain 8 h (prompt 76 ; ou bilan le dernier jour)
{
	const cs = contexte('fr');
	vm.runInContext(
		`var phase = 'attente', ecran = 'jeu', vue = 'poste', fenetre = null, enPause = false, enSieste = true, reveil = null, reduireAnimations = false;
		var MENU = { actif: false }, PC = { fenetre: 'journal' }, CAMERA = { x: 0, y: 0 }, METEO_VISU = { nuit: 1 }, focusBureau = -1, OBJETS_BUREAU = [];
		var L = 1920, H = 1080, __t = 0, __leve = 0, __fin = 0, __annonces = [], __saves = 0;
		var millis = () => __t, constrain = (v, a, b) => Math.max(a, Math.min(b, v));
		var seLever = () => { __leve++; vue = 'bureau'; }, annoncer = (x) => __annonces.push(String(x)), interaction = () => {};
		var Confort = { Son: { bip: () => {}, musique: { attenuer: () => {} } } }, Sauvegarde = { auto: () => __saves++ };
		var dateLongue = (d) => d, localStorage = { getItem: () => null, setItem: () => {} };
		var allerFin = () => { phase = 'fin'; __fin++; };
		var journeeSuivante = () => { if (Jeu.terminee || !Jeu.jours[Jeu.jourIndex + 1]) return allerFin(); Jeu.journeeSuivante(); phase = 'attente'; };`,
		cs,
	);
	vm.runInContext(readFileSync(join(pub, 'soir.js'), 'utf8'), cs, { filename: 'soir.js' });
	const r = vm.runInContext(
		`(() => {
		Jeu.chargerSemaine(Jeu.semainesProposees()[0].lundi);
		Jeu.nouvellePartie();
		const res = {};
		// journée 1 jouée jusqu'au soir (décisions « renfort »)
		while (Jeu.prochainDuJour()) Jeu.decider('renfort');
		Jeu.finDeJourneeTactique();
		Jeu.horloge.minutes = Jeu.finJournee();
		phase = 'mail';
		const jauges = JSON.stringify(Jeu.jauges);
		rangerPoste();
		res.soir = phase === 'soir' && __leve === 1 && vue === 'bureau' && !enSieste && PC.fenetre === null && __saves === 1;
		__t = 2000; majSoir(); res.mi = Jeu.horloge.minutes > Jeu.finJournee() && Jeu.horloge.minutes < 21 * 60 && !sortieVisible();
		__t = 4100; majSoir(); res.h21 = Jeu.horloge.minutes === 21 * 60 && sortieVisible() && __annonces.some((a) => a.includes('sortie est à gauche'));
		res.nuit = nuitSoir() === 1;
		res.reglesIntactes = JSON.stringify(Jeu.jauges) === jauges; // le soir ne touche à aucune jauge
		const jour = Jeu.jourIndex;
		quitterBureau();
		res.pan = cameraSoir() === 0; // début du pan
		__t += 400; res.panMi = cameraSoir() > 0;
		__t += 3000; majSoir();
		res.lendemain = phase === 'attente' && Jeu.jourIndex === jour + 1 && Jeu.horloge.minutes === Jeu.debutJournee() && CAMERA.x === 0;
		// départ anticipé le jour 2 : malus inchangé, puis le soir
		Jeu.partirAvantLaFin('10:00');
		phase = 'mail'; rangerPoste(); res.departSoir = phase === 'soir';
		__t += 4100; majSoir(); quitterBureau(); __t += 5000; majSoir();
		res.departMalus = phase === 'attente' && !!Jeu.blame && Jeu.blame.malus === -8; // malus inchangé, le lendemain
		// reprise d'une sauvegarde faite le soir : nuit installée, flèche visible
		phase = 'soir'; __t += 10; reprendreSoir(); majSoir(); res.reprise = sortieVisible();
		// dernier jour : la sortie mène au bilan
		phase = 'soir'; SOIR.sortie = 0;
		while (Jeu.jours[Jeu.jourIndex + 1]) Jeu.journeeSuivante();
		res.texteFin = texteNoirSoir().titre;
		reprendreSoir(); majSoir(); quitterBureau(); __t += 5000; majSoir();
		res.bilan = phase === 'fin' && __fin === 1;
		return res;
	})()`,
		cs,
	);
	for (const [k, v] of Object.entries(r)) if (k !== 'texteFin') verifier(v === true, `soir (prompt 69) : ${k} = ${v}`);
	verifier(r.texteFin === 'Fin de la semaine', `soir : texte du dernier soir « ${r.texteFin} »`);
	const imm = readFileSync(join(pub, 'immersion.js'), 'utf8');
	const garde = ((imm.match(/function tempsSuspendu\(\) \{\n\treturn ([^\n]*);/) || [])[1] || '') + (/function avancerTemps\(\)[\s\S]*?if \(tempsSuspendu\(\)\) return;/.test(imm) ? '' : ' SANS GARDE');
	verifier(!garde.includes('SANS GARDE'), 'avancerTemps doit s\'arrêter quand tempsSuspendu()');
	verifier(/function tempsCompresse\(\)[^}]*!tempsSuspendu\(\)/.test(imm), '« ×30 » ne doit s\'afficher que si le temps file');
	verifier(garde.includes("phase === 'soir'"), 'soir : le temps (incidents, sieste) ne doit pas avancer pendant le soir');
	verifier(/phase === 'soir'\) return; \/\/ prompt 69/.test(readFileSync(join(pub, 'webcam.js'), 'utf8')), 'soir : la main devant la webcam ne doit pas lancer de sieste le soir');
	verifier(/ui\.phase === 'soir'/.test(readFileSync(join(pub, 'sauvegarde.js'), 'utf8')), 'soir : la sauvegarde doit reprendre la phase soir');
}

// Prompt 71 : démarrage du PC rejoué au début des 3 premières journées, une seule fois par jour
{
	const co = contexte('fr');
	vm.runInContext(
		`var L = 1920, H = 1080, ecran = 'jeu', TRANSITION_JOUR = null, smsActif = false, MENU = { actif: false }, reduireAnimations = false, __t = 0;
		var millis = () => __t, Confort = { Son: { bip: () => {} } };`,
		co,
	);
	vm.runInContext(readFileSync(join(pub, 'os.js'), 'utf8'), co, { filename: 'os.js' });
	const r = vm.runInContext(
		`(() => {
		Jeu.chargerSemaine(Jeu.semainesProposees()[0].lundi);
		Jeu.nouvellePartie();
		const jours = [];
		do {
			PC.etat = 'appli';
			TRANSITION_JOUR = { debut: 0 };
			demarrageDuJour();
			const eteintPendantTransition = PC.etat === 'eteint';
			majDemarrageJour(); // écran « JOUR n » encore affiché : rien
			const attendTransition = PC.etat !== 'demarrage';
			TRANSITION_JOUR = null;
			majDemarrageJour();
			const demarre = PC.etat === 'demarrage';
			PC.etat = 'os';
			demarrageDuJour(); majDemarrageJour(); // même journée (reprise, retour au poste) : pas de replay
			jours.push({ eteintPendantTransition, attendTransition, demarre, replay: PC.etat !== 'os' });
			if (!Jeu.jours[Jeu.jourIndex + 1]) break;
			Jeu.journeeSuivante();
		} while (true);
		return jours;
	})()`,
		co,
	);
	verifier(r.length >= 4, `démarrage PC : semaine trop courte (${r.length} jours)`);
	r.forEach((j, i) => {
		const attendu = i < 3;
		verifier(j.demarre === attendu && j.eteintPendantTransition === attendu, `démarrage PC, jour ${i + 1} : démarrage ${j.demarre} (attendu ${attendu})`);
		verifier(j.attendTransition, `démarrage PC, jour ${i + 1} : ne doit pas démarrer pendant l'écran « JOUR n »`);
		verifier(!j.replay, `démarrage PC, jour ${i + 1} : rejoué deux fois dans la journée`);
	});
	verifier(/pcDemarre\(\)/.test((readFileSync(join(pub, 'immersion.js'), 'utf8').match(/function tempsSuspendu\(\) \{\n\treturn [^\n]*;/) || [''])[0]), 'démarrage PC : le temps de jeu doit être suspendu pendant le démarrage (et « ×30 » masqué)');
}

// Prompt 72 : réponses d'alerte — retirées par le prompt 87 (remplacées par les réponses par catégorie, data/reponses.json)

// Prompt 73 : plus de carte — liste de signalements ; prendre un signalement hors tête de file ne casse rien
{
	const cs = contexte('fr');
	// Couche d'affichage chargée avec des bouchons minimaux (pas de p5) : seules les fonctions de file sont appelées
	vm.runInContext('var ecran = "jeu", phase = "selection", DROITE = {}, ENQ_STUB = 0; function millis() { return 1000; } function facteurLecture() { return 1; }', cs);
	for (const f of ['enquete.js', 'carte.js']) vm.runInContext(readFileSync(join(pub, f), 'utf8'), cs, { filename: f });
	const r = vm.runInContext(
		`(() => {
		Jeu.chargerSemaine('2026-11-02'); Jeu.nouvellePartie(); Jeu.elementDebloque = () => true; Jeu.jauges.budget = 100;
		const j = Jeu.jourCourant();
		Jeu.horloge.minutes = j.dossiers[2].minute;
		const f = fileIncidents();
		const avant = f.map((x) => x.d);
		Jeu.envoyerEquipe(0, 'police', 1000); // équipe envoyée sur la tête de file (phase sélection)
		amenerEnTete(f[2].index);
		const ordre = [Jeu.paquet[0] === avant[2], Jeu.paquet[1] === avant[0], Jeu.paquet[2] === avant[1]];
		const equipeSuit = Jeu.paquet[Jeu.equipes[0].index] === avant[0];
		const arrivees = Object.keys(SELECTION.arrivees).length === 3;
		const lignes = texteLignes({ lignes: ['1'] }, 5); // dossier à venir : ligne pas encore identifiée
		const connu = texteLignes({ lignes: ['1'] }, -1); // dossier déjà traité : ligne connue
		Jeu.decider('rien');
		const snap = JSON.parse(JSON.stringify(Jeu.instantane(0)));
		const coherent = snap.jours.every((jj) => jj.dossiers.every((i) => i >= 0)) && new Set(snap.jours.flatMap((jj) => jj.dossiers)).size === snap.paquet.length;
		let tours = 0;
		while (!Jeu.terminee && tours++ < 200) { if (Jeu.prochainDuJour()) Jeu.decider('renfort'); else if (Jeu.jours[Jeu.jourIndex + 1]) Jeu.journeeSuivante(); else break; }
		return { ordre, equipeSuit, arrivees, coherent, fin: Jeu.index === Jeu.paquet.length, lignes, connu };
	})()`,
		cs,
	);
	verifier(r.ordre.every(Boolean), `signalements : ordre après prise du 3e (${r.ordre})`);
	verifier(r.equipeSuit, 'signalements : l\'équipe envoyée doit suivre son dossier après réordonnancement');
	verifier(r.arrivees, 'signalements : heures d\'arrivée perdues au réordonnancement');
	verifier(r.coherent && r.fin, `signalements : sauvegarde cohérente (${r.coherent}) et semaine jouée jusqu'au bout (${r.fin})`);
	verifier(/François Mitterrand/.test(r.connu) && !/Mitterrand/.test(r.lignes), `signalements : ligne avec son nom réel une fois identifiée (${r.connu} / ${r.lignes})`);
	const code = ['sketch.js', 'carte.js', 'os.js', 'portrait.js', 'mobile.js', 'guide.js'].map((f) => readFileSync(join(pub, f), 'utf8')).join('\n');
	verifier(!/zoomerCarte|CARTE_VUE|commandesCarte|dessinerLignesEtat|dessinerReperesCarte|positionDossier|centreLigne|traceDecision|dessinerBandeauEquipes|zoomCarteMolette|iconeCarte/.test(code), 'signalements : reste du code de la carte');
	const orphelines = vm.runInContext("['carte.zoom', 'carte.reseau', 'legende.heure', 'app.carte', 'enq.source.carte', 'guide.ouvrirCarte'].filter((k) => TRADUCTIONS.fr[k] !== undefined || TRADUCTIONS.en[k] !== undefined)", cs);
	verifier(orphelines.length === 0, `signalements : clés i18n orphelines ${orphelines}`);
	verifier(vm.runInContext("TRADUCTIONS.fr['app.signalements'] === 'Signalements' && TRADUCTIONS.en['app.signalements'] === 'Reports'", cs), 'signalements : appli mal nommée');
}

// Prompt 74 : ordre d'arrivée par la graine (reproductible, restauré par la sauvegarde), textes de variété réels
{
	const ordre = (ctx, lundi) =>
		vm.runInContext(
			`(() => {
			Jeu.chargerSemaine(${JSON.stringify(lundi)}); Jeu.nouvellePartie();
			const source = Jeu.paquet.map((d) => d.texte_source + '|' + d.minute);
			const minutesAvant = Jeu.jours.map((j) => j.dossiers.map((d) => d.minute).sort((a, b) => a - b).join());
			const heuresReelles = Jeu.paquet.filter((d) => d.heure).map((d) => d.minute + '|' + d.heure);
			const tirages = Jeu.tirages;
			Rythme.melangerArrivees();
			const apres = Jeu.paquet.map((d) => d.texte_source + '|' + d.minute);
			const minutesApres = Jeu.jours.map((j) => j.dossiers.map((d) => d.minute).sort((a, b) => a - b).join());
			const triee = Jeu.jours.every((j) => j.dossiers.every((d, i) => !i || j.dossiers[i - 1].minute <= d.minute));
			const reelles = Jeu.paquet.filter((d) => d.heure).every((d) => d.minute === Number(d.heure.slice(0, 2)) * 60 + Number(d.heure.slice(3, 5)));
			return { source, apres, memesCreneaux: JSON.stringify(minutesAvant) === JSON.stringify(minutesApres), triee, reelles, tirages: Jeu.tirages === tirages, snap: JSON.stringify(Jeu.instantane(0)) };
		})()`,
			ctx,
		);
	let change = false;
	for (const lundi of semaines) {
		const a = ordre(contexte('fr'), lundi);
		const b = ordre(contexte('en'), lundi);
		change = change || a.apres.join() !== a.source.join();
		verifier(a.apres.join() === b.apres.join(), `ordre d'arrivée non reproductible (${lundi})`);
		verifier(a.memesCreneaux && a.triee && a.reelles, `ordre d'arrivée : créneaux ${a.memesCreneaux}, tri ${a.triee}, heures réelles ${a.reelles} (${lundi})`);
		verifier(a.tirages, 'ordre d\'arrivée : les dés ne doivent pas être consommés');
		const c = contexte('fr');
		const restaure = vm.runInContext(`(() => { Jeu.chargerSemaine(${JSON.stringify(lundi)}); Jeu.restaurerInstantane(JSON.parse(${JSON.stringify(a.snap)}), 0); return Jeu.paquet.map((d) => d.texte_source + '|' + d.minute); })()`, c);
		verifier(restaure.join() === a.apres.join(), `ordre d'arrivée non restauré par la sauvegarde (${lundi})`);
	}
	verifier(change, 'ordre d\'arrivée : le mélange ne change rien sur les 3 semaines');
	const v = vm.runInContext(
		`(() => {
		const cles = [];
		for (const lundi of Jeu.semainesProposees().map((s) => s.lundi)) {
			Jeu.chargerSemaine(lundi); Jeu.nouvellePartie(); Rythme.melangerArrivees();
			for (let n = 0; n < Jeu.paquet.length; n++) {
				const d = Jeu.paquet[n];
				Jeu.jourIndex = Jeu.jours.findIndex((j) => j.date === d.date);
				const l = Rythme.liaison(n); if (l) cles.push(l);
				const c = Rythme.contexteNarration({ dossier: d, minuteSim: d.minute }, n); if (c) cles.push(c);
				[10, 12, 17].forEach((h) => cles.push(Rythme.rythme(h)));
			}
		}
		Jeu.chargerSemaine('2026-10-12'); Jeu.nouvellePartie();
		const ev = (a) => ({ cleAction: a, cleMeilleure: 'renfort', attendus: { devier: 1, retenir: 1, renfort: 5, rien: -2 } });
		const serie = [Rythme.serie([ev('renfort'), ev('renfort')]), Rythme.serie([ev('rien'), ev('temps')]), Rythme.serie([ev('renfort'), ev('rien')]), Rythme.serie([ev('renfort'), ev('renfort')], 1)];
		return { cles, serie };
	})()`,
		fr,
	);
	const malformees = v.cles.filter((m) => !m || vm.runInContext(`TRADUCTIONS.fr[${JSON.stringify(m && m.cle)}] === undefined || TRADUCTIONS.en[${JSON.stringify(m && m.cle)}] === undefined`, fr) || Object.values(m.vars).some((x) => x === null || x === undefined || x === '' || String(x) === 'undefined'));
	verifier(v.cles.length > 50 && malformees.length === 0, `variété : ${v.cles.length} textes, ${malformees.length} sans clé ou avec un trou vide (${JSON.stringify(malformees[0])})`);
	verifier(new Set(v.cles.map((m) => m.cle)).size >= 8, 'variété : trop peu de textes différents');
	verifier(v.serie[0] && v.serie[0].sorte === 'bravo' && v.serie[1] && v.serie[1].sorte === 'courage' && v.serie[2] === null && v.serie[3] === null, `série : ${JSON.stringify(v.serie)}`);
	verifier(!/\bRythme\./.test(readFileSync(join(pub, 'game.js'), 'utf8')), 'variété : game.js doit rester inchangé');
}

// Prompt 75 : le bouton de la barre des tâches reprend le logo de l'écran de chargement (une seule source de formes)
{
	const svg = readFileSync(join(pub, 'index.html'), 'utf8').match(/<svg class="logo"[\s\S]*?<\/svg>/);
	const rects = svg ? [...svg[0].matchAll(/<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)" fill="(#[0-9a-f]+)"/gi)].map((m) => [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), m[5].toLowerCase()]) : [];
	const ds = readFileSync(join(pub, 'ds.js'), 'utf8');
	const bloc = ds.match(/const LOGO_PXE = \[([\s\S]*?)\n\];/);
	const formes = bloc ? [...bloc[1].matchAll(/\[(\d+), (\d+), (\d+), (\d+), '(#[0-9a-f]+)'\]/gi)].map((m) => [Number(m[1]), Number(m[2]), Number(m[3]), Number(m[4]), m[5].toLowerCase()]) : [];
	verifier(rects.length > 0 && JSON.stringify(rects) === JSON.stringify(formes), `logo : formes du bouton ≠ SVG du chargement (${rects.length} / ${formes.length})`);
	const os = readFileSync(join(pub, 'os.js'), 'utf8');
	// Prompt 151 : l'appli « carte » du menu garde le moniteur d'origine
	verifier(/const LOGO_MONITEUR = \[/.test(ds) && /dessinerLogoPXE\([^;]*LOGO_MONITEUR/.test(readFileSync(join(pub, 'menu-app.js'), 'utf8')), 'logo : l\'appli carte doit garder le moniteur (LOGO_MONITEUR)');
	verifier(/dessinerLogoPXE\(/.test(os) && !/dsTitre\('REGUL'/.test(os) && !/rect\(8, tb \+ 10, 140/.test(os), 'logo : le carré rouge « REGUL » doit être remplacé par le logo');
}

// Prompt 76 : la journée commence à 8 h 00 (fin toujours à 20 h), aucun dossier avant 8 h, anciennes sauvegardes recalées
{
	const h = vm.runInContext(
		`(() => {
		const out = { debut: [], fin: [], avant8: 0, heuresIntactes: true, lendemain: null, reprise: null };
		for (const lundi of Jeu.semainesProposees().map((s) => s.lundi)) {
			Jeu.chargerSemaine(lundi); Jeu.nouvellePartie();
			const heures = Jeu.paquet.map((d) => d.heure || '');
			Rythme.clamperDebut(); Rythme.melangerArrivees();
			out.debut.push(Jeu.horloge.minutes, Jeu.debutJournee());
			out.fin.push(Jeu.finJournee());
			out.avant8 += Jeu.paquet.filter((d) => d.minute < 8 * 60).length;
			out.heuresIntactes = out.heuresIntactes && Jeu.paquet.map((d) => d.heure || '').sort().join() === heures.sort().join();
			Jeu.journeeSuivante();
			out.lendemain = Jeu.horloge.minutes;
		}
		// Sauvegarde d'avant le prompt 76 : horloge à 6 h 30, un dossier à 7 h → ramenés à 8 h
		Jeu.chargerSemaine('2026-10-12'); Jeu.nouvellePartie();
		const snap = JSON.parse(JSON.stringify(Jeu.instantane(0)));
		snap.horloge.minutes = 6 * 60 + 30;
		snap.paquet[0].minute = 7 * 60;
		Jeu.chargerSemaine('2026-10-12');
		Jeu.restaurerInstantane(snap, 0);
		Rythme.clamperDebut();
		out.reprise = [Jeu.horloge.minutes, Jeu.paquet[0].minute];
		return out;
	})()`,
		fr,
	);
	verifier(h.debut.every((m) => m === 480) && h.fin.every((m) => m === 1200) && h.lendemain === 480, `horaires : début ${h.debut}, fin ${h.fin}, lendemain ${h.lendemain}`);
	verifier(h.avant8 === 0 && h.heuresIntactes, `horaires : ${h.avant8} dossier(s) avant 8 h, heures réelles intactes ${h.heuresIntactes}`);
	verifier(JSON.stringify(h.reprise) === '[480,480]', `horaires : ancienne sauvegarde non recalée à 8 h (${h.reprise})`);
	const six = vm.runInContext("[...Object.entries(TRADUCTIONS.fr), ...Object.entries(TRADUCTIONS.en)].filter(([, v]) => /(^|[^0-9])6 ?h([^a-z0-9]|$)|6 ?a\\.m\\.|06:00/.test(String(v))).map(([k]) => k)", fr);
	verifier(six.length === 0, `horaires : texte qui cite encore 6 h (${six})`);
}

// Prompt 77 : 3 signalements actifs en parallèle — compteurs indépendants, expiration individuelle, décisions
{
	const cm = contexte('fr');
	// Bouchons de sketch.js (affichage p5) : seules les variables d'état et les appels utiles au multitâche
	vm.runInContext(
		`var __t = 1000, ecran = 'jeu', phase = 'selection', enPause = false, DROITE = {}, debutCompteur = 0, arriveeDossier = 0, sourceChoisie = null, alerteTempsJouee = false, facteurDuree = 1, dernierResultat = null, reduireAnimations = true, vue = 'poste', PC = { etat: 'appli' }, ICONES_OS = [], keyCode = 0, TAB = 9;
		var __annonces = [];
		function millis() { return __t; } function facteurLecture() { return 1; } function annoncer(x) { __annonces.push(String(x)); } function interaction() {}
		var Confort = { Son: { bip() {}, clic() {} } }; var Sauvegarde = { auto() {} };
		function nouveauDossier() { debutCompteur = arriveeDossier = millis(); sourceChoisie = null; phase = 'decision'; }
		function decider(a) { const d = Jeu.dossierCourant(); dernierResultat = Jeu.decider(a); retirerActif(d); phase = 'narration'; }`,
		cm,
	);
	for (const f of ['enquete.js', 'carte.js', 'multitache.js']) vm.runInContext(readFileSync(join(pub, f), 'utf8'), cm, { filename: f });
	const m = vm.runInContext(
		`(() => {
		Jeu.defiChrono = true; // prompt 87 : compteurs parallèles et expiration = mode défi chrono
		Jeu.chargerSemaine('2026-11-02'); Jeu.nouvellePartie();
		const ds = Jeu.jourCourant().dossiers; Jeu.horloge.minutes = ds[3].minute;
		const arrivees = fileIncidents().length;
		prendreSignalement(0); __t += 5000;
		prendreSignalement(fileIncidents().findIndex((it) => !actifDe(it.d))); __t += 5000;
		prendreSignalement(fileIncidents().findIndex((it) => !actifDe(it.d)));
		const trois = MULTI.actifs.length;
		prendreSignalement(fileIncidents().findIndex((it) => !actifDe(it.d))); // 4e : refusé
		const refus = MULTI.actifs.length === 3 && /3/.test(String(SELECTION.message && SELECTION.message.texte));
		const restes = MULTI.actifs.map((a) => Math.round(resteActif(a) / 1000));
		const sel = actifSelectionne();
		const premier = MULTI.actifs[0].d;
		// Le 1er (pris il y a 10 s) expire seul, en arrière-plan : le sélectionné reste affiché
		__t += 20001;
		majMultitache();
		const apresExp = { actifs: MULTI.actifs.length, selReste: actifSelectionne() === sel, tete: Jeu.dossierCourant() === sel.d, regle: Jeu.historique[0].dossier === premier && Jeu.historique[0].action === 'temps', index: Jeu.index };
		// Décision sur le sélectionné, puis reprise de l'autre actif, décision, plus aucun actif
		decider('renfort');
		const reprise = reprendreActif() && MULTI.actifs.length === 1 && phase === 'decision';
		decider('retenir');
		return { arrivees, trois, refus, restes, apresExp, reprise, fin: MULTI.actifs.length === 0 && Jeu.index === 3, notifs: NOTIFS.liste.length };
	})()`,
		cm,
	);
	verifier(m.trois === 3 && m.refus, `multitâche : 3 actifs (${m.trois}), 4e refusé (${m.refus})`);
	verifier(JSON.stringify(m.restes) === JSON.stringify([20, 25, 30]), `multitâche : compteurs indépendants ${m.restes}`);
	verifier(m.apresExp.actifs === 2 && m.apresExp.selReste && m.apresExp.tete && m.apresExp.regle && m.apresExp.index === 1, `multitâche : expiration individuelle en arrière-plan ${JSON.stringify(m.apresExp)}`);
	verifier(m.reprise && m.fin, `multitâche : décisions successives sans perdre les autres (reprise ${m.reprise}, fin ${m.fin})`);
	verifier(m.notifs >= m.arrivees, `multitâche : une notification par arrivée (${m.notifs} / ${m.arrivees})`);
	verifier(/compression: 100,/.test(readFileSync(join(pub, 'immersion.js'), 'utf8')), 'temps : la compression entre deux dossiers doit être ×100');
}

// Prompt 78 : la somnolence remplace le sablier ; sieste volontaire ou forcée, expirations pendant la sieste punies
{
	const cz = contexte('fr');
	vm.runInContext(
		`var __t = 100000, ecran = 'jeu', phase = 'attente', enPause = false, DROITE = {}, debutCompteur = 0, arriveeDossier = 0, sourceChoisie = null, alerteTempsJouee = false, facteurDuree = 1, dernierResultat = null, reduireAnimations = true, vue = 'bureau', PC = { etat: 'appli' }, ICONES_OS = [], keyCode = 0, TAB = 9, H = 1080;
		var enSieste = false, debutSieste = 0, reveil = null, inactifDepuis = 0, MENU = { actif: false }, fenetre = null, smsActif = false, tutoriel = null, TRANSITION_JOUR = null, __fil = [];
		function millis() { return __t; } function facteurLecture() { return 1; } function annoncer() {} function interaction() { inactifDepuis = __t; } function seLever() {}
		function ajouterFil(m) { __fil.push(m.cle); }
		var Confort = { Son: { bip() {}, clic() {}, alerteDossier() {} } }; var Sauvegarde = { auto() {} };
		function nouveauDossier() { debutCompteur = arriveeDossier = millis(); phase = 'decision'; }
		function decider(a) { const d = Jeu.dossierCourant(); dernierResultat = Jeu.decider(a); retirerActif(d); phase = 'narration'; }`,
		cz,
	);
	for (const f of ['enquete.js', 'carte.js', 'multitache.js', 'sieste.js']) vm.runInContext(readFileSync(join(pub, f), 'utf8'), cz, { filename: f });
	const z = vm.runInContext(
		`(() => {
		Jeu.defiChrono = true; // prompt 87 : l'expiration en cours de journée n'existe qu'en défi chrono
		Jeu.chargerSemaine('2026-11-02'); Jeu.nouvellePartie();
		const R = Jeu.REGLAGES.somnolence;
		inactifDepuis = __t;
		majSomnolence(1000, 60); // une heure de jeu, joueur actif
		const uneHeure = SOMNO.v;
		__t += 20000; majSomnolence(1000, 0); // inactif depuis 20 s
		const inactif = SOMNO.v - uneHeure;
		// Sieste forcée à 100
		SOMNO.v = 99.9; majSomnolence(1000, 60);
		const forcee = enSieste && SOMNO.forcee;
		// Pendant la sieste : deux signalements arrivent, un expire en file → « non traité » + malus de sieste
		const ds = Jeu.jourCourant().dossiers; Jeu.horloge.minutes = ds[1].minute;
		fileIncidents();
		const nt0 = (Jeu.malus.non_traite || 0), si0 = (Jeu.malus.sieste || 0);
		__t += 61000; majMultitache();
		const r = Jeu.historique[Jeu.historique.length - 1];
		const malus = { nonTraite: (Jeu.malus.non_traite || 0) - nt0, sieste: (Jeu.malus.sieste || 0) - si0, marque: !!(r && r.sieste) };
		majSomnolence(1000, 100); // une seconde de sieste
		const recupere = Math.abs(SOMNO.v - (100 - Jeu.REGLAGES.somnolence.recuperationParSeconde)) < 0.01;
		const bilan = Object.assign({}, SOMNO.bilan);
		reveiller();
		const reveille = !enSieste && __fil.includes('sieste.bilan');
		// Sieste volontaire, annulable ; impossible pendant une narration
		phase = 'narration'; const refus = dormir(true) === false;
		phase = 'attente'; const ok = dormir(true) && enSieste && !SOMNO.forcee; reveiller();
		return { uneHeure, inactif, forcee, malus, recupere, bilan, reveille, refus, ok, annule: !enSieste, regle: R.parHeureJeu };
	})()`,
		cz,
	);
	verifier(Math.abs(z.uneHeure - z.regle) < 0.01 && Math.abs(z.inactif - 0.5) < 0.01, `somnolence : +${z.uneHeure} par heure de jeu, +${z.inactif} par seconde d'inactivité`);
	verifier(z.forcee, 'somnolence : à 100, la sieste doit être forcée');
	verifier(z.malus.nonTraite >= 1 && z.malus.sieste >= 1 && z.malus.marque && z.bilan.expires >= 1 && z.bilan.arrives >= 2, `sieste : expiration pendant la sieste ${JSON.stringify(z.malus)} · bilan ${JSON.stringify(z.bilan)}`);
	verifier(z.recupere && z.reveille, 'sieste : récupération et bilan au réveil');
	verifier(z.refus && z.ok && z.annule, `sieste volontaire : refus en narration ${z.refus}, déclenchable ${z.ok}, annulable ${z.annule}`);
	const imm = readFileSync(join(pub, 'immersion.js'), 'utf8');
	verifier(/function dormir[\s\S]*?phase = 'attente'/.test(readFileSync(join(pub, 'sieste.js'), 'utf8')) && /function tempsCompresse\(\)[^}]*phase === 'attente'/.test(imm), 'sieste : le temps doit filer ×100 pendant la sieste (phase attente compressée)');
	verifier(!/siesteApresMs|inactifDepuis > IMMERSION/.test(imm), 'sieste : plus de sieste après 20 s d\'inactivité');
	const tout = ['journee.js', 'immersion.js', 'bureau.js', 'soir.js', 'sieste.js', 'feedback.js', 'sketch.js', 'webcam.js', 'cafe.js'].map((f) => readFileSync(join(pub, f), 'utf8')).join('\n');
	const clesSablier = vm.runInContext("Object.keys(TRADUCTIONS.fr).concat(Object.keys(TRADUCTIONS.en)).filter((k) => /sablier/i.test(k) || /sablier|hourglass/i.test(String(TRADUCTIONS.fr[k] || '') + String(TRADUCTIONS.en[k] || '')))", cz);
	verifier(!/sablier/i.test(tout) && clesSablier.length === 0, `sablier : références restantes (${clesSablier.slice(0, 3)})`);
}

// Prompt 79 : retards qui s'aggravent (réel + calcul documenté), aggravation durable après un raté ; Community avec délai
{
	const ra = vm.runInContext(
		`(() => {
		Jeu.defiChrono = true; // prompt 87 : en défi chrono, l'aggravation garde sa vitesse d'origine (×1)
		Jeu.chargerSemaine('2026-10-12'); Jeu.nouvellePartie();
		// Fixtures de test (jamais affichées) : les archives du dépôt n'ont pas de retard chiffré (il vient du GTFS-RT en direct)
		const fx = (min) => ({ date: Jeu.paquet[0].date, type: 'ligne en difficulté', nature: 'retard', lignes: ['C1'], retard: 12, minute: min, texte_source: 'fixture', source: 'test' });
		const a = fx(600);
		const r = [600, 610, 616, 700].map((m) => Jeu.retardEffectif(a, m));
		Jeu.horloge.minutes = 600; const g0 = Jeu.gravite(a);
		Jeu.horloge.minutes = 616; const g1 = Jeu.gravite(a);
		// Q58 : « retenir » vaut +8 en réputation si le retard EFFECTIF dépasse 20 min (réel 12 + 10 = 22)
		Jeu.paquet.splice(Jeu.index, 0, a);
		Jeu.horloge.minutes = 620;
		const res = Jeu.decider('retenir');
		const q58 = res.deltas[1] >= 8;
		const fige = a.retardFige === 22 && Jeu.retardEffectif(a, 900) === 22;
		// Raté sur un retard : +5 durables sur la ligne C1 pour la suite de la journée
		const b = fx(620);
		Jeu.paquet.splice(Jeu.index, 0, b);
		const avantRate = Jeu.aggravationLignes.C1 || 0; // « retenir » a pu déjà être évalué raté
		Jeu.decider('rien');
		const ev = Jeu.evaluer(Jeu.evenementsJournee[Jeu.evenementsJournee.length - 1]);
		const durable = Jeu.aggravationLignes.C1 - avantRate;
		const total = Jeu.aggravationLignes.C1;
		const c = fx(Jeu.horloge.minutes);
		const avecDurable = Jeu.retardEffectif(c);
		const snap = JSON.parse(JSON.stringify(Jeu.instantane(0)));
		Jeu.journeeSuivante();
		const matin = Object.keys(Jeu.aggravationLignes).length;
		// Community : délai de réponse (temps réel)
		const def = { id: 'fixture', texte: 'Plainte de test', reponses: [{ texte: 'Réponse', effets: { reputation: 2 }, bonne: true }] };
		const nouvelle = () => { const p = { id: 'fixture', def, vars: {}, index: 0, auteur: '@test', heure: '09:00', reponse: null }; Jeu.plaintes.push(p); return p; };
		const p1 = nouvelle(); Jeu.majPlaintes(0);
		const r0 = Jeu.jauges.reputation; const rapide = Jeu.repondrePlainte(p1, 0, 10000);
		const p2 = nouvelle(); Jeu.majPlaintes(0);
		const tard = Jeu.repondrePlainte(p2, 0, 20000);
		const p3 = nouvelle(); Jeu.majPlaintes(0);
		Jeu.majPlaintes(44999); const avant = !p3.expiree;
		const r1 = Jeu.jauges.reputation; Jeu.majPlaintes(45000);
		const expire = p3.expiree && Jeu.jauges.reputation === Math.max(0, r1 - 3) && !Jeu.plaintesEnAttente().includes(p3);
		const bc = Jeu.bilanCommunity(Jeu.jourIndex);
		const p4 = nouvelle(); Jeu.majPlaintes(1000);
		const s2 = JSON.parse(JSON.stringify(Jeu.instantane(31000)));
		const relatif = s2.plaintes[s2.plaintes.length - 1].depuis === -30000;
		const mail = Jeu.mailDuJour().lignes.map(String).join(' | ');
		Jeu.defiChrono = false;
		return { r, g: [g0, g1], q58, fige, ev, durable, total, avecDurable, snap: snap.aggravationLignes, matin, rapide: rapide.tardive === false && rapide.effets.reputation === 2, tard: tard.tardive === true && tard.effets.reputation === -1, avant, expire, bc, relatif, mailCommunity: /Community/.test(mail) };
	})()`,
		fr,
	);
	verifier(JSON.stringify(ra.r) === JSON.stringify([12, 17, 20, 42]), `retards : effectif = réel + 1 min / 2 min de jeu, plafond +30 (${ra.r})`);
	verifier(ra.g[0] === 'moyenne' && ra.g[1] === 'elevee', `retards : la gravité suit le retard effectif (${ra.g})`);
	verifier(ra.q58 && ra.fige, `retards : Q58 sur le retard effectif (${ra.q58}), figé à la décision (${ra.fige})`);
	verifier(ra.ev === 'rate' && ra.durable === 5 && ra.avecDurable === 12 + ra.total && ra.total <= 15 && ra.snap && ra.snap.C1 === ra.total && ra.matin === 0, `retards : aggravation durable après « ${ra.ev} » (${ra.durable}, ${ra.avecDurable}), sauvegardée, remise à zéro le matin (${ra.matin})`);
	verifier(ra.rapide && ra.tard, `community : réponse rapide = effets prévus (${ra.rapide}), tardive = −3 en plus (${ra.tard})`);
	verifier(ra.avant && ra.expire, `community : expiration à 45 s → réputation −3, plainte close (${ra.avant} / ${ra.expire})`);
	verifier(ra.bc.temps === 1 && ra.bc.tard === 1 && ra.bc.expire === 1 && ra.mailCommunity, `community : bilan du jour ${JSON.stringify(ra.bc)} et ligne du mail`);
	verifier(ra.relatif, 'community : le délai doit être sauvegardé relativement à la reprise');
}

// Prompt 81 : menu principal — dépôt, partage, crédits, licence MIT ; URLs définies une seule fois
{
	const menu = readFileSync(join(pub, 'menu.js'), 'utf8');
	const autres = ['sketch.js', 'os.js', 'immersion.js', 'carte.js', 'multitache.js', 'sieste.js', 'donnees.js', 'accessibilite.js'].map((f) => readFileSync(join(pub, f), 'utf8')).join('\n');
	verifier(/const DEPOT_URL = 'https:\/\/github\.com\/ArtistDev44\/workshop-design-interactions';/.test(menu) && /const URL_JEU = 'https:\/\/workshop-design-interactions\.pages\.dev\/';/.test(menu), 'menu : constantes DEPOT_URL et URL_JEU');
	verifier((menu.match(/workshop-design-interactions\.pages\.dev/g) || []).length === 1 && (menu.match(/github\.com/g) || []).length === 1 && !/workshop-design-interactions\.pages\.dev|github\.com\/ArtistDev44/.test(autres), 'menu : les URL du jeu et du dépôt ne doivent être écrites qu\'une fois');
	verifier(/window\.open\(url, '_blank', 'noopener'\)/.test(menu) && /navigator\.clipboard/.test(menu) && /execCommand\('copy'\)/.test(menu), 'menu : liens en nouvel onglet noopener, copie avec repli');
	const cles = ['mp.partager', 'mp.partager.texte', 'mp.partager.fermer', 'mp.partager.copier', 'mp.partager.copie', 'mp.partager.x', 'mp.partager.facebook', 'mp.partager.linkedin', 'mp.partager.mastodon', 'mp.depot', 'mp.credits']; // prompt 125 : plus de lien de licence sur le menu (il est dans les Crédits)
	const manque = vm.runInContext(`${JSON.stringify(cles)}.filter((k) => !TRADUCTIONS.fr[k] || !TRADUCTIONS.en[k])`, fr);
	verifier(manque.length === 0, `menu : clés manquantes ${manque}`);
	verifier(vm.runInContext("TRADUCTIONS.fr['mp.credits'] === 'Mattéo Brevet & Guillaume Renoult'", fr), 'menu : crédits');
	verifier(!/mp\.licence|mp\.sources|mp\.clavier/.test(menu) && !/cle: 'licence'/.test(menu.slice(menu.indexOf('const EXTRAS_MENU'), menu.indexOf('const focusExtra'))) && /LICENCE_URL/.test(readFileSync(join(pub, 'credits.js'), 'utf8')), 'prompt 125 : pied du menu réduit aux noms, licence dans les Crédits');
	verifier(vm.runInContext("['mp.clavier', 'mp.sources', 'mp.licence', 'mp.licence.infobulle'].every((k) => !TRADUCTIONS.fr[k] && !TRADUCTIONS.en[k]) && /Naolib/.test(TRADUCTIONS.fr['credits.lic.donnees.v']) && /Naolib/.test(TRADUCTIONS.en['credits.lic.donnees.v'])", fr), 'prompt 125 : clés du pied de page supprimées, Naolib cité dans les Crédits');
	const lic = readFileSync(join(pub, '..', '..', 'LICENSE'), 'utf8');
	verifier(/MIT License/.test(lic) && /Copyright \(c\) 2026 Mattéo Brevet & Guillaume Renoult/.test(lic) && /THE SOFTWARE IS PROVIDED "AS IS"/.test(lic) && /Nantes en régulation/.test(lic) && !/À COMPLÉTER/.test(lic), 'LICENSE : texte MIT complet, crédits, en-tête conservé');
	verifier(!/ouvrirPartage|fenetrePartage/.test(readFileSync(join(pub, 'immersion.js'), 'utf8')), 'menu : le partage reste sur l\'écran titre (pas dans le menu Échap)');
}

// Prompt 84 : rappel à l'ordre, dernier avertissement, licenciement (game over)
{
	const lic = vm.runInContext(
		`(() => {
		const r = {};
		const regler = (f, rep, b) => { Jeu.jauges.fluidite = f; Jeu.jauges.reputation = rep; Jeu.jauges.budget = b; Jeu.majStatutPatron(); return Object.assign({}, Jeu.statutPatron, { enAttente: Jeu.statutPatron.enAttente.length }); };
		const importants = () => Jeu.messagesPatron.filter((m) => m.important).length;
		Jeu.chargerSemaine('2026-10-12'); Jeu.nouvellePartie(); Jeu.modificateur = null;
		r.bien = regler(50, 50, 50).niveau;
		r.vigil = regler(40, 40, 30); r.rappels = importants();
		r.reste = regler(45, 45, 35).niveau; // 125 : on reste sous surveillance (hystérésis)
		regler(40, 40, 30); r.rappelsUneFois = importants();
		r.sortie = regler(50, 50, 41); // 141 : surveillance levée, avertissement effacé
		r.leve = Jeu.messagesPatron.some((m) => /140|141/.test(String(m.texte)));
		// Danger immédiat → dernier avertissement ; licenciement le lendemain soir si toujours sous 90
		r.danger = regler(30, 30, 25);
		r.memeJour = Jeu.finJourneeStatut();
		Jeu.journeeSuivante();
		r.lendemain = Jeu.finJourneeStatut();
		// Effondrement : licenciement immédiat, sans avertissement
		Jeu.chargerSemaine('2026-10-12'); Jeu.nouvellePartie(); Jeu.modificateur = null;
		r.effondre = regler(0, 60, 60).licencie;
		// Vigilance qui dure jusqu'au soir suivant → dernier avertissement en fin de journée
		Jeu.chargerSemaine('2026-10-12'); Jeu.nouvellePartie(); Jeu.modificateur = null;
		regler(40, 40, 30); Jeu.finJourneeStatut(); const j0 = Jeu.statutPatron.avertissements;
		Jeu.journeeSuivante(); Jeu.finJourneeStatut(); r.vigilanceDure = [j0, Jeu.statutPatron.avertissements];
		r.mail = Jeu.mailDuJour().lignes.map(String)[0];
		// Panne de messagerie : avertissement compté tout de suite, message délivré à la fin de la panne
		Jeu.chargerSemaine('2026-10-12'); Jeu.nouvellePartie();
		Jeu.modificateur = { id: 'panne_messagerie', debut: Date.now(), fin: Date.now() + 1e7 };
		const avant = Jeu.messagesPatron.length;
		const p = regler(30, 30, 25);
		r.panne = { avert: p.avertissements, file: p.enAttente, recus: Jeu.messagesPatron.length - avant, recuJour: p.dernierRecuJour };
		Jeu.modificateur.fin = 0; Jeu.livrerSanctions();
		r.apresPanne = { recus: Jeu.messagesPatron.length - avant, recuJour: Jeu.statutPatron.dernierRecuJour };
		const snap = JSON.parse(JSON.stringify(Jeu.instantane(0)));
		Jeu.chargerSemaine('2026-10-12'); Jeu.restaurerInstantane(snap, 0);
		r.reprise = [Jeu.statutPatron.niveau, Jeu.statutPatron.avertissements, Jeu.statutPatron.dernierRecuJour];
		r.lettre = JSON.parse(JSON.stringify(Jeu.lettreLicenciement()));
		return JSON.parse(JSON.stringify(r));
	})()`,
		fr,
	);
	verifier(lic.bien === 0 && lic.vigil.niveau === 1 && lic.vigil.avertissements === 1 && lic.rappels === 1, `licenciement : vigilance et rappel (${JSON.stringify(lic.vigil)})`);
	verifier(lic.reste === 1 && lic.rappelsUneFois === 1, `licenciement : hystérésis et rappel unique (${lic.reste}, ${lic.rappelsUneFois})`);
	verifier(lic.sortie.niveau === 0 && lic.sortie.avertissements === 0 && lic.leve, `licenciement : rattrapage efface l'avertissement (${JSON.stringify(lic.sortie)})`);
	verifier(lic.danger.niveau === 2 && lic.danger.avertissements === 2 && lic.memeJour === null && lic.lendemain && lic.lendemain.cause === 'delai', `licenciement : dernier avertissement immédiat, licencié le lendemain soir (${JSON.stringify(lic.lendemain)})`);
	verifier(lic.effondre && lic.effondre.cause === 'effondrement', 'licenciement : effondrement → licenciement immédiat');
	verifier(JSON.stringify(lic.vigilanceDure) === '[1,2]' && /AVERTISSEMENT/.test(lic.mail), `licenciement : vigilance qui dure → dernier avertissement le soir suivant, en tête du mail (${lic.vigilanceDure} / ${lic.mail})`);
	verifier(lic.panne.avert === 2 && lic.panne.file === 1 && lic.panne.recus === 0 && lic.panne.recuJour === null && lic.apresPanne.recus === 1 && lic.apresPanne.recuJour !== null, `licenciement : file pendant la panne ${JSON.stringify(lic.panne)} → ${JSON.stringify(lic.apresPanne)}`);
	verifier(lic.reprise[0] === 2 && lic.reprise[1] === 2 && lic.reprise[2] !== null, `licenciement : sauvegarde / reprise du statut (${lic.reprise})`);
	verifier(/30/.test(lic.lettre.jauges) && lic.lettre.score === 85 && /2/.test(lic.lettre.avertissements), 'licenciement : la lettre cite les vraies valeurs');
	const go = readFileSync(join(pub, 'gameover.js'), 'utf8');
	verifier(/Sauvegarde\.effacer/.test(go) && !/allerFin\(|Bilans\.enregistrer|appliquerDefis/.test(go), 'licenciement : sauvegarde effacée, ni palmarès ni défis');
}

// Prompt 85 : compte social (Quai) — plaintes ajoutées, posts réels, archive, info trafic, messages privés
{
	const brut = JSON.parse(readFileSync(join(pub, 'data', 'messages.json'), 'utf8'));
	const CLES_COND = ['type', 'retard_min', 'ligne', 'nature_contient', 'pointe', 'meteo'];
	const invalides = brut.plaintes.filter((p) => !p.texte.en || p.reponses.length < 2 || !p.reponses.some((r) => r.bonne) || !p.reponses.some((r) => !r.bonne) || p.reponses.some((r) => !r.texte.en) || Object.keys(p.condition || {}).some((k) => !CLES_COND.includes(k)));
	verifier(invalides.length === 0 && brut.plaintes.length >= 21 && brut.plaintes.filter((p) => p.prive).length >= 3, `community : plaintes invalides ${invalides.map((p) => p.id)}`);
	verifier((brut.modeles || []).length === 3 && brut.modeles.every((m) => m.texte.fr && m.texte.en && m.coherent.length), 'community : 3 modèles d\'info trafic FR + EN');
	const cs = vm.runInContext(
		`(() => {
		const r = {};
		Jeu.chargerSemaine('2026-09-14'); Jeu.nouvellePartie();
		r.archive1 = Jeu.postsArchive().length; // première semaine archivée : pas de semaine précédente → aucun post
		Jeu.chargerSemaine('2026-10-12'); Jeu.nouvellePartie();
		const prec = PXE_SEMAINES.semaines['2026-09-14'];
		const faits = prec.dossiers.map((d) => d.texte_source).concat(prec.evenements.map((e) => String(e.texte_source).split(' — ')[0]));
		const arch = Jeu.postsArchive().map((p) => String(p.texte));
		r.archive = arch.length;
		r.archiveReels = arch.every((tx) => faits.some((f) => tx.includes(f)) || /mm|°|km.h/.test(tx));
		Jeu.decider('renfort');
		const e0 = Jeu.evenementsJournee[0];
		const post = Jeu.postsPartie()[0];
		r.postFidele = String(post.texte).includes(e0.action) && post.index === 0;
		r.coherent = Jeu.publierInfo(0, 'annonce');
		r.deux = Jeu.publierInfo(0, 'excuses');
		Jeu.decider('renfort');
		const rep = Jeu.jauges.reputation;
		r.incoherent = Jeu.publierInfo(1, 'excuses');
		r.repDelta = Jeu.jauges.reputation - rep;
		// Message privé : délai, effets, au plus une relance, transfert au patron
		const def = Jeu.MESSAGES.plaintes.find((p) => p.prive);
		const pv = { id: def.id, def, vars: { ligne: '1', nature: 'test' }, index: 0, auteur: '@test', heure: '09:00', reponse: null };
		Jeu.plaintes.push(pv); Jeu.majPlaintes(0);
		const resPv = Jeu.repondrePlainte(pv, 0, 5000);
		r.prive = { rapide: resPv && !resPv.tardive, relances: (pv.suivis || []).length };
		const pv2 = { id: def.id, def, vars: { ligne: '1', nature: 'test' }, index: 1, auteur: '@test2', heure: '09:10', reponse: null };
		Jeu.plaintes.push(pv2);
		const nb = Jeu.messagesPatron.length; const rp = Jeu.jauges.reputation;
		r.transmis = Jeu.transmettrePatron(pv2) && Jeu.messagesPatron.length === nb + 1 && Jeu.jauges.reputation === rp && !Jeu.plaintesEnAttente().includes(pv2);
		const snap = JSON.parse(JSON.stringify(Jeu.instantane(0)));
		Jeu.chargerSemaine('2026-10-12'); Jeu.restaurerInstantane(snap, 0);
		r.reprise = Jeu.postsJoueur.length;
		return JSON.parse(JSON.stringify(r));
	})()`,
		fr,
	);
	verifier(cs.archive1 === 0 && cs.archive > 0 && cs.archive <= 9 && cs.archiveReels, `community : posts d'archive tirés de faits réels uniquement (${cs.archive1} / ${cs.archive}, ${cs.archiveReels})`);
	verifier(cs.postFidele, 'community : post automatique fidèle à l\'action réelle');
	verifier(cs.coherent && cs.coherent.coherent && cs.coherent.delta === 1 && cs.deux === null && cs.incoherent && !cs.incoherent.coherent && cs.repDelta === -2, `community : info trafic +1 / −2, une par incident (${JSON.stringify(cs.incoherent)})`);
	verifier(cs.prive.rapide && cs.prive.relances <= 1 && cs.transmis, `community : message privé ${JSON.stringify(cs.prive)}, transmis ${cs.transmis}`);
	verifier(cs.reprise === 2, `community : infos publiées gardées par la sauvegarde (${cs.reprise})`);
	verifier(!/Instagram|Facebook|Naolib|Semitan|TAN\b|Nantes Métropole/.test(readFileSync(join(pub, 'community.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//, '')), 'community : aucun nom de réseau ou de transporteur réel dans l\'interface');
}

// Prompt 86 : messagerie du patron — messages typés avec meta réelle, file pendant la panne, réponses sans effet
{
	const pm = vm.runInContext(
		`(() => {
		const r = {};
		Jeu.chargerSemaine('2026-10-12'); Jeu.nouvellePartie(); Jeu.modificateur = null;
		let tours = 0;
		while (!Jeu.terminee && tours++ < 200) { if (Jeu.prochainDuJour()) Jeu.decider(['rien', 'renfort', 'temps'][Jeu.index % 3]); else if (Jeu.jours[Jeu.jourIndex + 1]) { Jeu.finDeJourneeTactique(); Jeu.journeeSuivante(); } else break; }
		const M = Jeu.messagesPatron;
		r.types = [...new Set(M.map((m) => m.type))].sort();
		r.invalides = M.filter((m) => !Jeu.TYPES_MESSAGES.includes(m.type)).length;
		const c = M.find((m) => m.type === 'consigne');
		r.consigne = c && c.meta.jauge && typeof c.meta.seuil === 'number' && typeof c.meta.budget === 'number' && c.meta.n >= 0;
		const rp = M.find((m) => m.type === 'reproche' && m.meta.index !== undefined);
		r.reproche = !rp || (Jeu.evenementsJournee.some((e) => e.index === rp.meta.index) && !!rp.meta.meilleure);
		const eq = M.find((m) => m.type === 'equipes');
		r.equipes = !eq || (eq.meta.effectifs && eq.meta.effectifs.police >= Jeu.REGLAGES.equipes.police.effectif); // prompt 108 : effectif du jour ≥ base
		const al = M.find((m) => m.type === 'alerte' && m.meta.jauge);
		r.alerte = !al || (al.meta.v < al.meta.seuil);
		const bu = M.find((m) => m.type === 'budget');
		r.budget = !bu || ['bas', 'moyen', 'haut'].includes(bu.meta.palier);
		// Panne : le message attend, garde son heure, arrive « en retard »
		Jeu.modificateur = { id: 'panne_messagerie', debut: Date.now(), fin: Date.now() + 1e7 };
		const n0 = M.length; Jeu.messagePatron('test panne', 'info');
		r.pendant = Jeu.messagesPatron.length - n0;
		Jeu.modificateur.fin = 0; Jeu.livrerSanctions();
		const recu = Jeu.messagesPatron[Jeu.messagesPatron.length - 1];
		r.apres = recu.texte === 'test panne' && recu.enRetard === true;
		// Ancienne sauvegarde sans type → « info »
		const snap = JSON.parse(JSON.stringify(Jeu.instantane(0)));
		snap.messagesPatron.forEach((m) => delete m.type);
		Jeu.chargerSemaine('2026-10-12'); Jeu.restaurerInstantane(snap, 0);
		r.ancienne = Jeu.messagesPatron.every((m) => m.type === 'info');
		r.plateau = !!Jeu.plateauEquipesVisible; // prompt 103 : les effectifs sont sur le panneau des équipes
		return JSON.parse(JSON.stringify(r));
	})()`,
		fr,
	);
	verifier(pm.invalides === 0 && pm.types.includes('consigne') && pm.types.includes('reproche') && pm.types.length >= 4, `patron : types ${pm.types}`);
	verifier(pm.consigne && pm.reproche && (pm.equipes || pm.plateau) && pm.alerte && pm.budget, `patron : meta réelle ${JSON.stringify(pm)}`);
	verifier(pm.pendant === 0 && pm.apres, 'patron : message en file pendant la panne, « reçu en retard » ensuite');
	verifier(pm.ancienne, 'patron : ancienne sauvegarde sans type chargée en « info »');
	const pj = readFileSync(join(pub, 'patron.js'), 'utf8');
	verifier(!/appliquerDeltas|Jeu\.jauges\.\w+\s*[-+]?=|compterMalus/.test(pj), 'patron : les réponses rapides n\'ont aucun effet de jeu');
	verifier(!/function appPatron/.test(readFileSync(join(pub, 'os.js'), 'utf8')), 'patron : ancien rendu supprimé');
}

// Traductions : toute clé française existe en anglais
const manquantes = vm.runInContext('Object.keys(TRADUCTIONS.fr).filter((k) => TRADUCTIONS.en[k] === undefined)', fr);
verifier(manquantes.length === 0, `clés sans traduction anglaise : ${manquantes.slice(0, 8).join(', ')}`);
// Une partie en anglais ne laisse pas de texte manquant
const en = jouer(contexte('en'), semaines[0], SUITES[0]);
verifier(!JSON.stringify(en.traces.mails).includes('[À COMPLÉTER]'), 'mails anglais : texte manquant');

// Prompt 87 : décider sans chrono — catégories réelles, réponses sans dominante, tendance honnête, horloge en pause
{
	const cr = contexte('fr');
	const r = vm.runInContext(
		`(() => {
		const out = { cats: {}, sansCat: 0, erreursRep: [], dominantes: [], tendance: [], fin: null, defi: null, sauve: null, ancien: null, cles: [] };
		const signe = (v) => (Math.abs(v) < 1.5 ? 0 : Math.sign(v));
		for (const lundi of Jeu.semainesProposees().map((x) => x.lundi)) {
			Jeu.defiChrono = false;
			Jeu.chargerSemaine(lundi); Jeu.nouvellePartie();
			for (const d of Jeu.paquet) {
				const c = Jeu.categorie(d);
				if (!c) { out.sansCat++; continue; }
				out.cats[c] = (out.cats[c] || 0) + 1;
				const cles = Jeu.actionsPossibles(d);
				if (cles.length < 3 || cles.length > 4 || !cles.some((k) => Jeu.familleDe(k) === 'rien')) out.erreursRep.push(lundi + ' ' + c + ' ' + cles.length);
				for (const k of cles) if (!Jeu.libelleAction(k) || /^rep\\./.test(Jeu.libelleAction(k))) out.cles.push(k);
				// La tendance affichée a le signe de l'effet attendu
				const e = Jeu.effetsAttendus(cles[0], d);
				if (!Array.isArray(e) || e.length !== 3 || e.some((v) => typeof v !== 'number' || isNaN(v))) out.tendance.push(cles[0]);
			}
		}
		// Aucune réponse dominante : chaque réponse est la meilleure (somme des effets attendus, même calcul que journaliser)
		// dans au moins un contexte réel du jeu — dossiers réels (semaines + hors ligne) rejoués aux dates archivées
		// (météo réelle de ces jours), en heure creuse ou de pointe, avec un retard court ou long
		const meilleure = {};
		const reels = [];
		for (const lundi of Jeu.semainesProposees().map((x) => x.lundi)) { Jeu.chargerSemaine(lundi); Jeu.nouvellePartie(); reels.push(...Jeu.paquet); }
		Jeu.chargerHorsLigne(); Jeu.nouvellePartie(); reels.push(...Jeu.paquet);
		const dates = [...new Set(reels.map((d) => d.date))];
		for (const d0 of reels) {
			if (!Jeu.categorie(d0)) continue;
			// Les archives ne contiennent ni retard mesuré (GTFS-RT, mode direct) ni accident : variantes de test construites
			// sur des perturbations réelles (mêmes lignes, dates et heures), pour couvrir ces deux catégories
			const types = d0.type === 'perturbation' && d0.lignes && d0.lignes.length ? [{}, { type: 'ligne en difficulté' }, { texte_source: 'Accident — ' + d0.texte_source }] : [{}];
			for (const v of types) for (const date of dates) for (const heure of ['12:00', '08:00']) for (const retard of (v.type || d0.type) === 'ligne en difficulté' ? [10, 30] : [d0.retard]) {
				const d = Object.assign({}, d0, v, { date, heure, retard });
				const c = Jeu.categorie(d); if (!c) continue;
				out.cats[c] = out.cats[c] || 0;
				const sc = Jeu.actionsPossibles(d).map((k) => [k, Jeu.effetsAttendus(k, d).reduce((a, b) => a + b, 0)]).sort((a, b) => b[1] - a[1]);
				meilleure[sc[0][0]] = true;
			}
		}
		for (const c of Object.keys(Jeu.REPONSES)) for (const x of Jeu.REPONSES[c]) if (!meilleure[c + '.' + x.id] && out.cats[c] !== undefined) out.dominantes.push(c + '.' + x.id);
		out.reelsCats = {};
		for (const d of reels) { const c = Jeu.categorie(d) || 'aucune'; out.reelsCats[c] = (out.reelsCats[c] || 0) + 1; }
		// « Non traité » seulement à l'heure de fin : sans chrono, Jeu.expirerFinJournee règle ce qui reste du jour
		Jeu.defiChrono = false;
		Jeu.chargerSemaine('2026-11-02'); Jeu.nouvellePartie();
		const j0 = Jeu.jourCourant().date, restants = Jeu.dossiersRestantsDuJour();
		const n = Jeu.expirerFinJournee();
		out.fin = { restants, n, toutTemps: Jeu.historique.slice(0, n).every((h) => h.action === 'temps'), plusRien: Jeu.dossiersRestantsDuJour() === 0, jour: Jeu.jourCourant().date === j0 };
		// Difficulté : budget de départ et nombre d'actifs ; défi chrono = budget 50 d'avant
		out.difficulte = Jeu.difficulte();
		out.budget = Jeu.jauges.budget;
		Jeu.defiChrono = true; Jeu.nouvellePartie(); out.defi = Jeu.jauges.budget;
		// Sauvegarde : le mode est conservé ; une ancienne sauvegarde (sans le champ) se reprend en défi chrono
		const snap = Jeu.instantane(0); Jeu.defiChrono = false; Jeu.restaurerInstantane(JSON.parse(JSON.stringify(snap)), 0); out.sauve = Jeu.defiChrono;
		const vieux = JSON.parse(JSON.stringify(snap)); delete vieux.defiChrono; Jeu.defiChrono = false; Jeu.restaurerInstantane(vieux, 0); out.ancien = Jeu.defiChrono;
		return out;
	})()`,
		cr,
	);
	verifier(['travaux', 'affluence', 'meteo'].every((c) => r.reelsCats[c] > 0) && !r.reelsCats.aucune, `réponses : catégories des dossiers réels (semaines + hors ligne) ${JSON.stringify(r.reelsCats)}`);
	verifier(Object.keys(r.cats).length === 5, `réponses : les 5 catégories couvertes par le contrôle d'équilibre (${Object.keys(r.cats)})`);
	verifier(r.erreursRep.length === 0, `réponses : 3 ou 4 réponses dont « attendre » (${r.erreursRep.slice(0, 5)})`);
	verifier(r.cles.length === 0, `réponses : libellé manquant (${r.cles.slice(0, 5)})`);
	verifier(r.tendance.length === 0, `réponses : effets attendus invalides (${r.tendance.slice(0, 5)})`);
	verifier(r.dominantes.length === 0, `réponses : jamais la meilleure dans une situation réelle (${r.dominantes})`);
	verifier(r.fin.restants > 0 && r.fin.n === r.fin.restants && r.fin.toutTemps && r.fin.plusRien && r.fin.jour, `fin de journée : non traités à l'heure de fin ${JSON.stringify(r.fin)}`);
	verifier(r.difficulte && r.difficulte.actifs >= 1 && r.budget === r.difficulte.budget && r.defi === 50, `difficulté : budget ${r.budget} (attendu ${r.difficulte && r.difficulte.budget}), défi chrono ${r.defi}`);
	verifier(r.sauve === true && r.ancien === true, `sauvegarde : mode défi conservé (${r.sauve}), ancienne sauvegarde en défi chrono (${r.ancien})`);
	const im = readFileSync(join(pub, 'immersion.js'), 'utf8');
	verifier(/lecturePanneau\(\)/.test((im.match(/function tempsSuspendu\(\) \{\n\treturn [^\n]*;/) || [''])[0]) && /!Jeu\.defiChrono && [^\n]*PHASES_ACTIVES\.includes\(phase\)/.test(im), 'horloge : en pause pendant la lecture d\'un signalement, hors défi chrono');
	const mt = readFileSync(join(pub, 'multitache.js'), 'utf8');
	verifier(/if \(!Jeu\.defiChrono\) return;/.test(mt), 'multitâche : aucune expiration en cours de journée hors défi chrono');
	const sk = readFileSync(join(pub, 'sketch.js'), 'utf8');
	verifier(/if \(Jeu\.defiChrono\) \{[\s\S]{0,400}figerCompteurRalenti\(\)/.test(sk) && !/DROITE|dessinerListeLignes/.test(sk), 'panneau : compteur seulement en défi chrono, ancienne disposition retirée');
	verifier(!existsSync(join(pub, 'alertes.js')), 'alertes.js retiré (remplacé par les réponses par catégorie)');
	// Panneau : la tendance affichée suit le signe de l'effet
	const cp = contexte('fr');
	vm.runInContext(readFileSync(join(pub, 'panneau.js'), 'utf8').replace(/^const (BANDEAU|PANNEAU|PLUS|TOUCHES_REPONSES|RAISONS)\b/gm, 'var $1'), cp, { filename: 'panneau.js' });
	const tend = vm.runInContext("[tendance(0), tendance(3), tendance(-3), tendance(9), tendance(-9)].join(' ')", cp);
	verifier(tend === '≈ ▲ ▼ ▲▲ ▼▼', `panneau : tendance ${tend}`);
	// Prompt 116 : répliques au plaignant — variantes FR/EN, jamais de variable vide, au moins 2 phrases différentes par catégorie
	for (const lg of ['fr', 'en']) {
		const cr = contexte(lg);
		vm.runInContext(readFileSync(join(pub, 'panneau.js'), 'utf8').replace(/^const (BANDEAU|PANNEAU|PLUS|TOUCHES_REPONSES|RAISONS)\b/gm, 'var $1'), cr, { filename: 'panneau.js' });
		const r = vm.runInContext(`(() => {
			const out = { n: 0, vides: [], parCat: {} };
			for (const sem of ['2026-09-14', '2026-10-12', '2026-11-02']) {
				Jeu.chargerSemaine(sem); Jeu.nouvellePartie();
				Jeu.paquet.forEach((d, i) => {
					Jeu.index = i;
					const cat = Jeu.categorie(d);
					const rs = reponsesDialogue(d); // prompt 117 : 3 répliques mélangées, dont 1 clash et la meilleure réponse
					if (rs.length !== 3 || rs.filter((x) => x.clash).length !== 1 || !rs.some((x) => !x.clash && x.cle === Jeu.meilleureReponse(d))) out.vides.push('trio invalide ' + i);
					out.ordres = out.ordres || new Set();
					out.ordres.add(rs.findIndex((x) => x.clash));
					const txts = repliquesDuDossier(rs, d);
					if (txts.filter((x) => /@\\w/.test(x)).length > 1) out.vides.push('pseudo cité plusieurs fois');
					rs.forEach((rp, k) => {
						const txt = txts[k];
						out.n++;
						if (!txt || /\{\w+\}/.test(txt) || txt === '[À COMPLÉTER]') out.vides.push(rp.cle + ' : ' + txt);
						(out.parCat[cat] = out.parCat[cat] || new Set()).add(txt);
					});
				});
			}
			out.diff = Object.entries(out.parCat).filter(([, s]) => s.size < 2).map(([c]) => c);
			return { n: out.n, vides: out.vides.slice(0, 3), diff: out.diff, positionsClash: out.ordres.size };
		})()`, cr);
		verifier(r.n > 0 && !r.vides.length, `répliques (${lg}) : ${r.n} affichées, variables vides ${JSON.stringify(r.vides)}`);
		verifier(!r.diff.length, `répliques (${lg}) : une seule formulation pour ${r.diff}`);
		verifier(r.positionsClash >= 2, `répliques (${lg}) : le clash est toujours à la même place`);
		// Prompt 117 : une décision « clash » = attendre + malus de réputation, comptée ratée
		const cl = vm.runInContext(`(() => {
			Jeu.chargerSemaine('2026-10-12'); Jeu.nouvellePartie(); Jeu.modificateur = null;
			const d = Jeu.dossierCourant(); const c = reponsesDialogue(d).find((x) => x.clash);
			Jeu.initialiserAlea(7, 0); const rep0 = Jeu.jauges.reputation; Jeu.clashSuivant = true; const r1 = Jeu.decider(c.cle);
			return { clash: r1.clash, eval: Jeu.evaluer(Jeu.evenementsJournee[Jeu.evenementsJournee.length - 1]), dRep: r1.deltas[1] };
		})()`, cr);
		verifier(cl.clash === true && cl.eval === 'rate' && cl.dRep <= -8, `clash (${lg}) : ${JSON.stringify(cl)}`);
	}
}

// Prompt 118 : plaintes agressives — FR et EN, aucun gros mot en clair (masqués par des symboles), conditions réelles, ≈ 1 sur 3
{
	const c118 = contexte('fr');
	const r = vm.runInContext(`(() => {
		const ag = Jeu.MESSAGES.plaintes.filter((p) => p.ton === 'agressif');
		const textes = ag.flatMap((p) => [p.texte.fr, p.texte.en || '']);
		const clair = /\\b(merde|putain|connard|connasse|enculé|salope|bordel|foutre|fuck|shit|bastard|bitch|asshole|crap|damn)\\b/i;
		const out = { n: ag.length, sansEn: ag.filter((p) => !p.texte.en).map((p) => p.id), enClair: textes.filter((x) => clair.test(x)), sansSymbole: ag.filter((p) => !/[@#$%&!]{2,}/.test(p.texte.fr)).map((p) => p.id), agressifs: 0, total: 0 };
		for (const sem of ['2026-09-14', '2026-10-12', '2026-11-02']) {
			Jeu.chargerSemaine(sem); Jeu.nouvellePartie();
			Jeu.paquet.forEach((d, i) => { const pl = Jeu.plaignantPour(i); if (pl) { out.total++; if (pl.ton === 'agressif') out.agressifs++; } });
		}
		return out;
	})()`, c118);
	verifier(r.n >= 6 && !r.sansEn.length && !r.enClair.length && !r.sansSymbole.length, `plaintes agressives : ${JSON.stringify(r)}`);
	verifier(r.agressifs > 0 && r.agressifs < r.total, `plaintes agressives : ${r.agressifs} sur ${r.total} plaignants (ni aucune, ni toutes)`);
}

// Prompt 119 : incidents inventés — au plus un par semaine, marqués fictifs, sur une ligne réelle, catégorie « securite »,
// témoin trouvé ; désactivés (tests de règles) → paquet inchangé
{
	const c119 = contexte('fr');
	const r = vm.runInContext(`(() => {
		const out = [];
		for (const sem of ['2026-09-14', '2026-10-12', '2026-11-02']) {
			Jeu.incidentsFictifs = false; Jeu.chargerSemaine(sem); Jeu.nouvellePartie(); const sans = Jeu.paquet.length;
			Jeu.incidentsFictifs = true; Jeu.chargerSemaine(sem); Jeu.nouvellePartie();
			const f = Jeu.paquet.filter((d) => d.fictif);
			const d = f[0];
			out.push({ sans, avec: Jeu.paquet.length, n: f.length, ok: !!d && d.type === 'incident fictif' && /fictif/i.test(d.source) && Jeu.lignes.lignes.some((l) => l.nom === d.lignes[0]) && Jeu.categorie(d) === 'securite' && Jeu.gravite(d) === 'elevee' && Jeu.equipesPertinentes(d).includes('police') && !!Jeu.plaignantPour(Jeu.paquet.indexOf(d)) });
		}
		Jeu.incidentsFictifs = false;
		return out;
	})()`, c119);
	verifier(r.every((x) => x.n === 1 && x.avec === x.sans + 1 && x.ok), `incidents fictifs : ${JSON.stringify(r)}`);
}

// Prompt 88 : aucun texte identique deux fois dans une même journée (mesure du § 0, FR et EN), variantes reproductibles
{
	const { mesurer } = await import('./mesure-repetition.mjs');
	for (const lg of ['fr', 'en']) {
		const jours = mesurer(lg);
		const rep = jours.filter((j) => j.repetes.length).map((j) => j.date + ' : ' + j.repetes.map((r) => r.n + '× ' + r.texte).join(' | '));
		verifier(jours.length >= 19 && rep.length === 0, `variantes (${lg}) : textes répétés dans une journée — ${rep.slice(0, 3).join(' · ')}`);
		const bis = mesurer(lg);
		verifier(JSON.stringify(bis) === JSON.stringify(jours), `variantes (${lg}) : deux mesures de même graine doivent être identiques`);
	}
}

// Prompt 88 lot B : briefing du matin (priorités sur faits réels), rapport du soir (demande selon la réputation), carnet
{
	const cb = contexte('fr');
	const r = vm.runInContext(
		`(() => {
		const out = { erreursOpt: [], flux: null, accord: null, refus: null, carnet: 0, sauve: null };
		for (const lundi of Jeu.semainesProposees().map((x) => x.lundi)) {
			Jeu.chargerSemaine(lundi); Jeu.nouvellePartie(); Taches.nouvellePartie();
			for (let i = 0; i < Jeu.jours.length; i++) {
				const j = Jeu.jourCourant();
				// Prompt 91 § 4 : priorités imposées (2, puis 3 au bout de 4 jours joués), choisies d'abord parmi les faits réels
				const pr = Taches.imposerPriorites();
				const b = { options: Taches.jour(j.date).options };
				if (!pr || pr.length !== Taches.nbPriorites() && pr.length !== b.options.length) out.erreursOpt.push(j.date + ' priorités ' + (pr && pr.length));
				out.nbPrio = (out.nbPrio || []).concat([pr.length]);
				if (!b || b.options.length < 2 || b.options.length > 4) out.erreursOpt.push(j.date + ' ' + (b && b.options.length));
				const m = Jeu.meteoDuJour(j.date) || {};
				for (const o of b.options) {
					if (o.id === 'meteo' && !((m.pluie_mm || 0) >= 5 || (m.rafales_max || 0) >= 50)) out.erreursOpt.push(j.date + ' météo sans fait');
					if (o.id === 'evenement' && !Jeu.evenementsAffluence(j.date).length) out.erreursOpt.push(j.date + ' agenda vide');
					if (o.id === 'ligne' && !j.dossiers.some((d) => d.type === 'perturbation' && (d.lignes || []).includes(o.vars.ligne))) out.erreursOpt.push(j.date + ' ligne sans travaux');
				}
				while (Jeu.prochainDuJour()) Jeu.decider(Jeu.actionsPossibles(Jeu.dossierCourant())[0]);
				Jeu.finDeJourneeTactique();
				const rp = Taches.rapport();
				Taches.validerRapport(rp.faits[0].id, 'budget');
				if (!Jeu.jours[Jeu.jourIndex + 1]) break;
				Jeu.journeeSuivante(); Taches.matin();
			}
			out.carnet = Math.max(out.carnet, Object.values(Jeu.taches.jours).filter((x) => x.rapport).length); // prompt 142 : plus de carnet, un rapport par journée
			out.sansCarnet = !('carnet' in Jeu.taches);
		}
		// Demande accordée (réputation ≥ 50) : +5 de budget le lendemain matin ; refusée sous 50
		Jeu.chargerSemaine('2026-11-02'); Jeu.nouvellePartie(); Taches.nouvellePartie();
		Taches.choisirPriorites([]);
		Jeu.jauges.reputation = 60; Jeu.finDeJourneeTactique();
		const r1 = Taches.validerRapport('x', 'budget');
		while (Jeu.prochainDuJour()) Jeu.decider('temps');
		Jeu.journeeSuivante(); const b0 = Jeu.jauges.budget; Taches.matin();
		out.accord = { accordee: r1.accordee, delta: Jeu.jauges.budget - b0, message: Jeu.messagesPatron.filter((m) => m.jour === Jeu.jourCourant().date).map((m) => String(m.texte)).join(' | ') };
		Taches.choisirPriorites([]);
		Jeu.jauges.reputation = 30;
		const r2 = Taches.validerRapport('x', 'equipe');
		Jeu.journeeSuivante(); Taches.matin();
		out.refus = { accordee: r2.accordee, bonus: JSON.stringify(Jeu.bonusEffectifs) };
		// Sauvegarde : les tâches de la journée reviennent à l'identique
		const snap = JSON.parse(JSON.stringify(Jeu.instantane(0)));
		const avant = JSON.stringify(Jeu.taches);
		Jeu.taches = null; Jeu.restaurerInstantane(snap, 0);
		out.sauve = JSON.stringify(Jeu.taches) === avant;
		return out;
	})()`,
		cb,
	);
	verifier(r.erreursOpt.length === 0, `briefing : options sans fait réel ou en nombre incorrect (${r.erreursOpt.slice(0, 4)})`);
	verifier(r.carnet >= 6 && r.sansCarnet, `rapport du soir : un par journée, sans carnet (prompt 142) (${r.carnet})`);
	verifier(r.nbPrio && r.nbPrio.slice(0, 4).every((n) => n === 2) && r.nbPrio.slice(4, 6).every((n) => n === 3), `priorités imposées : 2 par jour puis 3 après 4 jours joués (${r.nbPrio && r.nbPrio.slice(0, 7)})`);
	verifier(/function briefing\(\) \{\n\t\treturn null;/.test(readFileSync(join(pub, 'taches.js'), 'utf8')), 'priorités : plus aucune fenêtre de choix (briefing() renvoie null)');
	verifier(r.accord.accordee && r.accord.delta === 5 && /accordée/.test(r.accord.message), `rapport : demande accordée → +5 de budget le lendemain (${JSON.stringify(r.accord)})`);
	verifier(r.refus.accordee === false && r.refus.bonus === '{}', `rapport : réputation < 50 → demande refusée (${JSON.stringify(r.refus)})`);
	verifier(r.sauve, 'sauvegarde : les tâches de la partie (priorités, rapport) sont restaurées');
}

// Prompt 88 lot C : rotation des tâches, info trafic fondée sur le dossier réel, préparation seulement si l'agenda l'annonce
{
	const { mesurer } = await import('./mesure-repetition.mjs');
	const jours = mesurer('fr');
	// Prompt 91 (« less is more ») remplace la rotation du prompt 88 : priorités imposées, plus de tâche info trafic ; seuls
	// restent garantis : aucun texte répété dans une journée (test des variantes) et au moins 2 types de décision par journée
	const mauvais = jours.filter((j) => j.typesActifs < 1).map((j) => `${j.date} suite ${j.maxSuiteActif}, ${j.typesActifs} types, ${Math.round(j.partDominantActif * 100)} %`);
	verifier(mauvais.length === 0, `mesure : chaque journée a au moins une décision (${mauvais.slice(0, 3)})`);
	const cc = contexte('fr');
	const r = vm.runInContext(
		`(() => {
		const out = { infos: 0, erreursInfo: [], prepSansEvenement: 0, preps: 0, effetInfo: null, plainte: false };
		for (const lundi of Jeu.semainesProposees().map((x) => x.lundi)) {
			Jeu.chargerSemaine(lundi); Jeu.nouvellePartie(); Taches.nouvellePartie();
			while (Jeu.prochainDuJour() || Jeu.jours[Jeu.jourIndex + 1]) {
				if (!Jeu.prochainDuJour()) { Jeu.journeeSuivante(); continue; }
				const d = Jeu.dossierCourant();
				const res = Jeu.decider(Jeu.actionsPossibles(d)[0]);
				const tache = Taches.apresDecision(res, Jeu.index - 1);
				if (!tache) continue;
				if (tache.type === 'info') {
					out.infos++;
					const b = tache.blocs;
					const ligne = d.lignes && d.lignes.length ? T('tache.info.ligne', { ligne: d.lignes[0] }) : T('tache.info.ligneInconnue');
					if (String(b[0].options[b[0].bonne]) !== String(ligne)) out.erreursInfo.push('ligne ' + d.texte_source);
					if (b.some((x) => x.options.length < 2 || x.bonne < 0 || new Set(x.options.map(String)).size !== x.options.length)) out.erreursInfo.push('options ' + d.texte_source);
				}
				if (tache.type === 'evenement') {
					out.preps++;
					const ev = Jeu.paquet[tache.index];
					if (!ev || ev.type !== 'événement' || ev.date !== d.date || tache.index <= Jeu.index - 1) out.prepSansEvenement++;
				}
			}
		}
		// Effet : info exacte +2, info fausse −2 et une plainte Community étiquetée « info_erronee »
		Jeu.chargerSemaine('2026-11-02'); Jeu.nouvellePartie(); Taches.nouvellePartie();
		const res = Jeu.decider(Jeu.actionsPossibles(Jeu.dossierCourant())[0]);
		const tache = Taches.tacheInfo(res, 0);
		const r0 = Jeu.jauges.reputation;
		Taches.resoudre(tache, Taches.bonneReponse(tache));
		const r1 = Jeu.jauges.reputation;
		Taches.resoudre(tache, tache.blocs.map((b) => (b.bonne + 1) % b.options.length));
		out.effetInfo = [r1 - r0, Jeu.jauges.reputation - r1];
		out.plainte = Jeu.plaintes.some((p) => p.id === 'info_erronee');
		return out;
	})()`,
		cc,
	);
	verifier(r.infos === 0, `info trafic : remplacée par la publication Community (prompt 91), ${r.infos} tâche(s) proposée(s)`);
	verifier(r.prepSansEvenement === 0, `préparer un événement : proposé sans affluence réelle à venir (${r.prepSansEvenement}/${r.preps})`);
	verifier(JSON.stringify(r.effetInfo) === '[2,-2]' && r.plainte, `info trafic : effets ${r.effetInfo}, plainte ${r.plainte}`);
}

// Prompt 88 lot D : thème du jour calculé sur les faits réels, au plus une cellule de crise par semaine
{
	const cd = contexte('fr');
	const r = vm.runInContext(
		`(() => {
		const out = { erreurs: [], crises: [], themes: {}, repro: true, heures: true };
		for (const lundi of Jeu.semainesProposees().map((x) => x.lundi)) {
			Jeu.chargerSemaine(lundi); Jeu.nouvellePartie();
			const heures = Jeu.paquet.map((d) => d.heure);
			const e = Taches.nouvellePartie();
			if (JSON.stringify(Jeu.paquet.map((d) => d.heure)) !== JSON.stringify(heures)) out.heures = false;
			const th = e.themes;
			const met = (d) => Jeu.meteoDuJour(d) || {};
			const tempetes = Object.keys(th).filter((d) => th[d] === 'tempete');
			const animees = Object.keys(th).filter((d) => th[d] === 'animee');
			if (tempetes.length > 1 || animees.length > 1) out.erreurs.push(lundi + ' plusieurs tempêtes / journées animées');
			tempetes.forEach((d) => { const m = met(d); if (!((m.pluie_mm || 0) >= 5 || (m.rafales_max || 0) >= 50)) out.erreurs.push(d + ' tempête sans météo'); });
			animees.forEach((d) => { if (!Jeu.evenementsAffluence(d).length) out.erreurs.push(d + ' animée sans agenda'); });
			Jeu.jours.forEach((j) => {
				if (th[j.date] === 'chantier' && !j.dossiers.some((x) => x.type === 'perturbation')) out.erreurs.push(j.date + ' chantier sans travaux');
				out.themes[th[j.date]] = (out.themes[th[j.date]] || 0) + 1;
			});
			if (e.crise) {
				const j = Jeu.jours.find((x) => x.date === e.crise.date);
				out.crises.push(e.crise.date);
				if (!j || j.dossiers.length < 3) out.erreurs.push(e.crise.date + ' crise sur un jour calme');
				const sans = j.dossiers.filter((d) => !d.heure);
				if (sans.some((d) => d.minute < Taches.R.crise.debut || d.minute > Taches.R.crise.fin)) out.erreurs.push(e.crise.date + ' arrivées hors fenêtre de crise');
				if (Jeu.paquet.some((d, i) => i && d.date === Jeu.paquet[i - 1].date && d.minute < Jeu.paquet[i - 1].minute)) out.erreurs.push(lundi + ' paquet non trié');
			}
			Jeu.chargerSemaine(lundi); Jeu.nouvellePartie();
			if (JSON.stringify(Taches.nouvellePartie().themes) !== JSON.stringify(th)) out.repro = false;
		}
		return out;
	})()`,
		cd,
	);
	verifier(r.erreurs.length === 0, `thèmes et crise : ${r.erreurs.slice(0, 4)}`);
	verifier(r.crises.length >= 1 && r.crises.length <= 3, `crise : au plus une par semaine (${r.crises})`);
	verifier(Object.keys(r.themes).length >= 3, `thèmes : au moins 3 thèmes différents sur les 3 semaines (${JSON.stringify(r.themes)})`);
	verifier(r.repro && r.heures, `thèmes reproductibles (${r.repro}), heures réelles intactes (${r.heures})`);
}

// Prompt 88 lot E : expérience, grade et badges calculés sur des faits de la partie, sans effet sur les jauges
{
	const ce = contexte('fr');
	const r = vm.runInContext(
		`(() => {
		Taches.reinitialiserCarriere();
		const out = { jours: [], jaugesIntactes: true, double: null, grades: null, reset: null };
		Jeu.chargerSemaine('2026-09-14'); Jeu.nouvellePartie(); Taches.nouvellePartie();
		for (let i = 0; i < Jeu.jours.length; i++) {
			Taches.imposerPriorites(); // prompt 91 : priorités imposées
			let k = 0;
			while (Jeu.prochainDuJour()) Jeu.decider(k++ % 3 === 2 ? 'temps' : Jeu.actionsPossibles(Jeu.dossierCourant())[0]);
			Jeu.finDeJourneeTactique();
			const date = Jeu.jourCourant().date;
			const rp = Taches.rapport();
			const xp0 = Taches.carriere().xp;
			Taches.validerRapport(rp.faits[0].id, null);
			const j = Taches.jour(date);
			const ev = Jeu.evenementsJournee.filter((e) => e.jour === date);
			const jauges = JSON.stringify(Jeu.jauges);
			const x2 = Taches.xpJour(date, j, { priorites: j.rapport.priorites, crise: null });
			if (JSON.stringify(Jeu.jauges) !== jauges) out.jaugesIntactes = false;
			out.jours.push({ date, xp: j.recap.xp.total, somme: j.recap.xp.lignes.reduce((a, l) => a + l.v, 0), recalc: x2.total, verse: Taches.carriere().xp - xp0, zero: j.recap.badges.includes('zero_non_traite'), sansTemps: ev.length > 0 && !ev.some((e) => e.cleAction === 'temps') });
			if (!Jeu.jours[Jeu.jourIndex + 1]) break;
			Jeu.journeeSuivante(); Taches.matin();
		}
		// Rejouer la même journée (même graine) ne verse pas deux fois
		const xp = Taches.carriere().xp;
		const date = Jeu.jourCourant().date;
		Taches.jour(date).rapport = null;
		Taches.validerRapport('x', null);
		out.double = Taches.carriere().xp === xp;
		out.grades = [0, 149, 150, 449, 450, 899, 900, 5000].map((v) => Taches.gradeDe(v));
		Taches.reinitialiserCarriere();
		out.reset = Taches.carriere().xp === 0 && Object.keys(Taches.carriere().badges).length === 0;
		return out;
	})()`,
		ce,
	);
	const faux = r.jours.filter((j) => j.xp !== j.somme || j.xp !== j.recalc || j.verse !== j.xp || j.zero !== j.sansTemps);
	verifier(r.jours.length >= 6 && faux.length === 0, `expérience / badge « zéro non traité » calculés sur les faits (${JSON.stringify(faux.slice(0, 2))})`);
	verifier(r.jaugesIntactes, 'expérience : aucun effet sur les jauges');
	verifier(r.double, 'carrière : une journée n\'est versée qu\'une fois');
	verifier(JSON.stringify(r.grades) === '[0,0,1,1,2,2,3,3]', `grades : seuils 150 / 450 / 900 (${r.grades})`);
	verifier(r.reset, 'carrière : réinitialisation');
}

// Prompt 88 lot F : options du groupe désactivées par défaut ; chaînes étiquetées et plafonnées ; déblocages ; arbitrage
{
	const conf = readFileSync(join(pub, 'confort.js'), 'utf8');
	verifier(/chaines: false, deblocages: false, arbitrage: false, traceDossier: false, pressionVisible: false, deVisible: false, eclairageJauges: false/.test(conf), 'options du groupe : désactivées par défaut (Confort.Reglages)');
	const cf = contexte('fr');
	const r = vm.runInContext(
		`(() => {
		const out = { sansOption: 0, chaines: [], erreurs: [], sauve: null, deblocage: null, arbitrage: null };
		const pire = (d) => { const ks = Jeu.actionsPossibles(d); const p = Jeu.poidsBesoin(Jeu.jauges); return ks.map((k) => [k, Jeu.effetsAttendus(k, d).reduce((a, v, i) => a + v * p[i], 0)]).sort((a, b) => a[1] - b[1])[0][0]; }; // prompt 130 : la pire réponse au sens de l'évaluation pondérée
		const jouer = (opts) => {
			Jeu.chargerSemaine('2026-09-14'); Jeu.nouvellePartie(); Taches.nouvellePartie(opts);
			let n = 0, garde = 0;
			while (garde++ < 300) {
				const d = Jeu.prochainDuJour();
				if (!d) { if (!Jeu.jours[Jeu.jourIndex + 1]) break; Jeu.journeeSuivante(); Taches.matin(); continue; }
				Jeu.horloge.minutes = Math.max(Jeu.horloge.minutes, d.minute);
				const avant = Jeu.paquet.slice(0, Jeu.index + 1);
				const res = Jeu.decider(pire(d));
				Taches.apresDecision(res, Jeu.index - 1);
				if (avant.some((x, i) => Jeu.paquet[i] !== x)) out.erreurs.push('index déplacés');
				n = Jeu.paquet.filter((x) => x.consequence).length;
			}
			return n;
		};
		out.sansOption = jouer({});
		jouer({ chaines: true });
		const parJour = {};
		Jeu.paquet.filter((x) => x.consequence).forEach((c) => {
			parJour[c.date] = (parJour[c.date] || 0) + 1;
			out.chaines.push({ date: c.date, src: c.source, texte: c.texte_source, minute: c.minute });
			if (!/pas une donnée réelle/.test(c.source) || !/Conséquence de votre décision/.test(c.texte_source)) out.erreurs.push('chaîne non étiquetée');
			if (c.minute > Jeu.finJournee() - Taches.R.chaine.marge) out.erreurs.push('chaîne trop tard');
		});
		if (Object.values(parJour).some((n) => n > 1)) out.erreurs.push('plus d\\'une chaîne par jour');
		const snap = JSON.parse(JSON.stringify(Jeu.instantane(0)));
		const total = Jeu.paquet.length;
		Jeu.restaurerInstantane(snap, 0);
		out.sauve = Jeu.paquet.length === total && Jeu.paquet.some((x) => x.consequence);
		// Déblocages : grade 2 → +1 police, prévision à 1 h
		Taches.reinitialiserCarriere(); Taches.carriere().xp = 500;
		Jeu.chargerSemaine('2026-09-14'); Jeu.nouvellePartie(); Taches.nouvellePartie({ deblocages: true }); Taches.matin();
		const d0 = Jeu.prochainDuJour(); Jeu.horloge.minutes = d0.minute - 30;
		out.deblocage = { police: Jeu.bonusEffectifs.police, prevision: !!Taches.prevision() };
		Taches.nouvellePartie({}); Taches.matin();
		out.deblocage.sans = [Jeu.bonusEffectifs.police || 0, !!Taches.prevision()];
		Taches.reinitialiserCarriere();
		// Arbitrage : un jour tiré, ni le premier ni la crise ; « véhicules » rend 1 de budget sur un renfort
		const e = Taches.nouvellePartie({ arbitrage: true });
		out.arbitrage = { date: e.arbitrage && e.arbitrage.date, premier: Jeu.jours[0].date, crise: e.crise && e.crise.date };
		e.arbitrage.choix = 'vehicules';
		const d = Jeu.dossierCourant();
		const renfort = Jeu.actionsPossibles(d).find((k) => Jeu.familleDe(k) === 'renfort');
		if (renfort) { const res = Jeu.decider(renfort); const b = Jeu.jauges.budget; Taches.apresDecision(res, 0); out.arbitrage.rendu = Jeu.jauges.budget - b; }
		return out;
	})()`,
		cf,
	);
	verifier(r.sansOption === 0, `chaînes : aucune sans l'option (${r.sansOption})`);
	verifier(r.chaines.length >= 1 && r.erreurs.length === 0, `chaînes : ${r.chaines.length} créée(s), ${r.erreurs.slice(0, 3)}`);
	verifier(r.sauve, 'chaînes : la conséquence est gardée par la sauvegarde');
	verifier(r.deblocage.police === 1 && r.deblocage.prevision && r.deblocage.sans[0] === 0 && !r.deblocage.sans[1], `déblocages : ${JSON.stringify(r.deblocage)}`);
	verifier(r.arbitrage.date && r.arbitrage.date !== r.arbitrage.premier && r.arbitrage.date !== r.arbitrage.crise && (r.arbitrage.rendu === undefined || r.arbitrage.rendu === 1), `arbitrage : ${JSON.stringify(r.arbitrage)}`);
}

// Prompt 89 : données de l'appli Journal recalculées sur la partie réelle (tuiles, courbes, filtres, semaine, enquête, résumé)
{
	const cj = contexte('fr');
	const r = vm.runInContext(
		`(() => {
		const out = { erreurs: [] };
		Jeu.chargerSemaine('2026-10-12'); Jeu.nouvellePartie(); Taches.nouvellePartie();
		for (let i = 0; i < 3; i++) {
			let k = 0;
			while (Jeu.prochainDuJour()) { const d = Jeu.prochainDuJour(); Jeu.horloge.minutes = Math.max(Jeu.horloge.minutes, d.minute); Jeu.decider(k++ % 4 === 3 ? 'temps' : Jeu.actionsPossibles(d)[k % 3]); }
			Jeu.finDeJourneeTactique();
			Jeu.journeeSuivante();
		}
		for (let i = 0; i < 3; i++) {
			const j = Jeu.jours[i];
			const ev = Jeu.evenementsJournee.filter((e) => e.jour === j.date);
			const tu = JournalDonnees.tuiles(i);
			if (tu.signalements.recus !== j.dossiers.length) out.erreurs.push(j.date + ' reçus ' + tu.signalements.recus + '/' + j.dossiers.length);
			if (tu.signalements.nonTraites !== ev.filter((e) => e.cleAction === 'temps').length) out.erreurs.push(j.date + ' non traités');
			if (tu.bonnes.n !== ev.filter((e) => Jeu.evaluer(e) === 'bon').length || tu.bonnes.total !== ev.length) out.erreurs.push(j.date + ' bonnes');
			const o = Jeu.objectifsResultats.find((x) => x.jourIndex === i);
			if (!tu.objectif || tu.objectif.atteint !== o.atteint) out.erreurs.push(j.date + ' objectif');
			if (tu.equipes || tu.theme !== undefined || tu.jauges.points) out.erreurs.push(j.date + ' tuiles retirées encore calculées (prompt 141)');
			// Courbes : un point au début, puis exactement les jauges après chaque événement réel
			const pts = JournalDonnees.courbes(j.date);
			if (pts.length !== ev.length + 1 || ev.some((e, n) => JSON.stringify(pts[n + 1]) !== JSON.stringify(e.resultat.jaugesApres))) out.erreurs.push(j.date + ' courbes');
			if (JSON.stringify(pts[0]) !== JSON.stringify(Jeu.jaugesDebutJour[j.date] || pts[0])) out.erreurs.push(j.date + ' début');
			// Filtres : comptes et contenu
			const cartes = JournalDonnees.cartes(i);
			const rates = JournalDonnees.filtrer(cartes, 'rates');
			if (rates.some((c) => !['rate', 'trop_tard'].includes(c.eval)) || rates.length !== ev.filter((e) => ['rate', 'trop_tard'].includes(Jeu.evaluer(e))).length) out.erreurs.push(j.date + ' filtre ratés');
			if (JournalDonnees.compteurs(i).rates !== rates.length) out.erreurs.push(j.date + ' compteur ratés');
			const heures = cartes.filter((c) => c.minute !== null).map((c) => c.minute);
			if (heures.some((m, n) => n && m < heures[n - 1])) out.erreurs.push(j.date + ' frise non triée');
		}
		if (JournalDonnees.semaine || JournalDonnees.FILTRES.includes('notes') || JournalDonnees.cartes(0).some((c) => c.sorte === 'note')) out.erreurs.push('vue Semaine ou notes encore là (prompts 140 / 142)');
		// Enquête : barres = attendus, choix et meilleure repérés
		const e = Jeu.evenementsJournee.find((x) => x.cleAction !== 'temps');
		const f = JournalDonnees.enquete(e);
		if (f.decision.barres.length !== Object.keys(e.attendus).length || f.decision.barres.some((b) => Math.abs(b.v - e.attendus[b.cle]) > 0.051)) out.erreurs.push('barres ≠ attendus');
		if (f.decision.barres.filter((b) => b.choix).map((b) => b.cle).join() !== e.cleAction || f.decision.barres.filter((b) => b.meilleure).map((b) => b.cle).join() !== e.cleMeilleure) out.erreurs.push('choix / meilleure');
		if (f.decision.barres.some((b) => Math.abs(b.v) > f.decision.echelle)) out.erreurs.push('échelle');
		out.resume = JournalDonnees.resume(0);
		out.lignesMail = Jeu.evenementsJournee.filter((x) => x.jour === Jeu.jours[0].date).length;
		return out;
	})()`,
		cj,
	);
	verifier(r.erreurs.length === 0, `journal : ${r.erreurs.slice(0, 5)}`);
	verifier(/^Nantes en régulation — journée du 12\/10\/2026/.test(r.resume) && r.resume.split('\n').filter((l) => l.startsWith('- ')).length === r.lignesMail && !/\[À COMPLÉTER\]|undefined/.test(r.resume), `journal : résumé copié (${r.resume.slice(0, 120)})`);
	const sv = readFileSync(join(pub, 'sauvegarde.js'), 'utf8');
	verifier(/journal: typeof JOURNAL[^\n]*\{ jour: JOURNAL\.jour, filtre: JOURNAL\.filtre, defil/.test(sv) && /ui\.journal/.test(sv), 'journal : jour, filtre et défilement sauvegardés (prompt 140 : plus de vue)');
	verifier(!/function appJournal|function enqueteJournal/.test(readFileSync(join(pub, 'os.js'), 'utf8')), 'journal : ancien rendu retiré d’os.js');
}

// Prompt 89 bis : traces dans la file, pression lisible, Q25 expliqué, dé visible — aucune valeur d'effet modifiée
{
	const ct = contexte('fr');
	const r = vm.runInContext(
		`(() => {
		const out = { erreurs: [] };
		var Confort = globalThis.Confort || { Reglages: {} };
		globalThis.Confort = Confort;
		const jouer = (opts) => {
			Confort.Reglages = Object.assign({}, opts);
			Jeu.chargerSemaine('2026-11-02'); Jeu.nouvellePartie();
			const lignes = [];
			for (let i = 0; i < 3; i++) {
				let k = 0;
				while (Jeu.prochainDuJour()) {
					const d = Jeu.prochainDuJour();
					Jeu.horloge.minutes = Math.max(Jeu.horloge.minutes, d.minute);
					const p1 = Traces.pression(d);
					Jeu.horloge.minutes += 30;
					const p2 = Traces.pression(d);
					if (p2.ecoule !== Math.floor(Jeu.horloge.minutes - d.minute)) out.erreurs.push('temps écoulé');
					if (p1.retard !== null && p2.retard < p1.retard) out.erreurs.push('retard qui baisse');
					const res = Jeu.decider(k++ % 4 === 3 ? 'temps' : Jeu.actionsPossibles(d)[k % 3]);
					const e = Jeu.evenementsJournee[Jeu.evenementsJournee.length - 1];
					Jeu.horloge.minutes += 60;
					if (e.retardEffectif !== null && e.retardEffectif !== undefined && Jeu.retardEffectif(d) !== e.retardEffectif) out.erreurs.push('retard non figé');
					const l = Traces.lignesFile(d.date)[0];
					if (e.cleAction === 'temps') { if (l.etat !== 'nonTraite' || !l.detail) out.erreurs.push('non traité sans calcul'); }
					else if (l.etat !== 'traite' || !l.titre.includes(String(e.action)) || !/\\d+h\\d\\d/.test(l.titre)) out.erreurs.push('trace file ' + l.titre);
					const des = Traces.texteDes(res);
					if (des && res.des.some((v, n) => v && !des.includes('dé ' + v))) out.erreurs.push('dé affiché ≠ dé tiré');
				}
				lignes.push(...Traces.lignesFile(Jeu.jourCourant().date).map((x) => x.titre));
				Jeu.finDeJourneeTactique(); Jeu.journeeSuivante();
			}
			return { lignes, jauges: JSON.stringify(Jeu.jauges), tirages: Jeu.tirages };
		};
		const sans = jouer({});
		const avec = jouer({ traceDossier: true, pressionVisible: true, deVisible: true, eclairageJauges: true });
		const bis = jouer({});
		out.memesEffets = sans.jauges === avec.jauges && sans.tirages === avec.tirages;
		out.repro = JSON.stringify(sans.lignes) === JSON.stringify(bis.lignes);
		out.nb = sans.lignes.length;
		// Q25 : le calcul cite les effets réellement appliqués
		const tps = Jeu.evenementsJournee.filter((e) => e.cleAction === 'temps');
		out.q25 = tps.every((e) => { const c = Traces.calculQ25(e); return ['fluidite', 'reputation', 'budget'].every((k) => !e.deltas[k] || c.includes(String(Math.abs(e.deltas[k])))); }) && tps.length > 0;
		// Sauvegarde : les traces sont reconstruites à l'identique depuis le journal sauvegardé
		const date = Jeu.jours[0].date;
		const avant = JSON.stringify(Traces.lignesFile(date).map((x) => x.titre));
		Jeu.restaurerInstantane(JSON.parse(JSON.stringify(Jeu.instantane(0))), 0);
		out.sauve = JSON.stringify(Traces.lignesFile(date).map((x) => x.titre)) === avant;
		return out;
	})()`,
		ct,
	);
	verifier(r.erreurs.length === 0, `traces : ${[...new Set(r.erreurs)].slice(0, 4)}`);
	verifier(r.memesEffets, 'traces : les options d\'affichage ne changent ni les jauges ni les dés');
	verifier(r.repro && r.nb > 5, `traces : reproductibles par la graine (${r.nb} lignes)`);
	verifier(r.q25, 'Q25 : le calcul affiché cite les effets réellement appliqués');
	verifier(r.sauve, 'traces : restaurées depuis la sauvegarde');
}

// Prompt 90 : notifications du téléphone — données réelles seulement, rythme, priorités, Ne pas déranger, pas de doublon
{
	const cn = contexte('fr');
	const r = vm.runInContext(
		`(() => {
		const out = { erreurs: [], parJour: [], repro: true };
		const DIRECT = ['parkings', 'velos', 'trafic', 'pollens'];
		for (const lundi of Jeu.semainesProposees().map((x) => x.lundi)) {
			Jeu.chargerSemaine(lundi); Jeu.nouvellePartie(); Taches.nouvellePartie();
			const plans = [];
			for (let i = 0; i < Jeu.jours.length; i++) {
				const jr = Jeu.jourCourant();
				const plan = NotifsTel.planJour(jr);
				plans.push(plan.map((n) => n.id + NotifsTel.texte(n)).join('|'));
				const m = Jeu.meteoDuJour(jr.date) || {};
				plan.forEach((n) => {
					if (DIRECT.includes(n.app)) out.erreurs.push('direct dans une semaine archivée');
					if (n.app === 'meteo' && !((m.pluie_mm || 0) >= 1 || (m.rafales_max || 0) >= 40 || (m.temp_min !== null && m.temp_min <= 0))) out.erreurs.push(jr.date + ' météo sans seuil');
					if (n.app === 'travaux' && !jr.dossiers.some((d) => d.type === 'perturbation')) out.erreurs.push(jr.date + ' travaux sans changelog');
					if (n.app === 'agenda' && !Jeu.evenementsAffluence(jr.date).length) out.erreurs.push(jr.date + ' agenda vide');
					if (n.app === 'loire' && !(jr.date >= window.PXE_LOIRE.periode.du.slice(0, 10) && jr.date <= window.PXE_LOIRE.periode.au.slice(0, 10))) out.erreurs.push(jr.date + ' Loire hors période');
					if (n.de === 'chauffeur' && !(Jeu.paquet[n.dossier] && Jeu.paquet[n.dossier].lignes.length)) out.erreurs.push('chauffeur sans dossier');
					if (/\\{\\w+\\}|undefined|\\[À COMPLÉTER\\]/.test(NotifsTel.texte(n))) out.erreurs.push('texte ' + NotifsTel.texte(n));
				});
				// Rythme : une journée simulée par pas de 5 min de jeu
				const et = NotifsTel.etatVide();
				let spont = [], ouvert = 0;
				for (let mn = 480; mn <= Jeu.finJournee(); mn += 5) {
					Jeu.horloge.minutes = mn;
					const panneau = mn >= 600 && mn < 640; // un panneau ouvert 40 min
					const x = NotifsTel.maj(et, { panneauOuvert: panneau, npd: false });
					if (x && panneau) ouvert++;
					if (x) {
						spont.push({ mn, prio: x.n.prio, bureau: !!x.n.bureau });
						if (x.autres && et.recues.filter((n) => !n.bureau).length < x.autres + 1) out.erreurs.push('regroupement');
					}
				}
				if (ouvert) out.erreurs.push('notification pendant un panneau ouvert');
				if (spont.length > NotifsTel.R.maxJour) out.erreurs.push(jr.date + ' trop de spontanées ' + spont.length);
				spont.forEach((s, k) => { if (k && s.prio !== 0 && s.mn - spont[k - 1].mn < NotifsTel.R.ecartMin) out.erreurs.push(jr.date + ' écart < 20 min'); if (s.bureau) out.erreurs.push('doublon bureau'); });
				out.parJour.push(spont.length);
				while (Jeu.prochainDuJour()) Jeu.decider('temps');
				if (!Jeu.jours[Jeu.jourIndex + 1]) break;
				Jeu.journeeSuivante(); Taches.matin();
			}
			Jeu.chargerSemaine(lundi); Jeu.nouvellePartie(); Taches.nouvellePartie();
			if (NotifsTel.planJour(Jeu.jourCourant()).map((n) => n.id + NotifsTel.texte(n)).join('|') !== plans[0]) out.repro = false;
		}
		// Priorités et Ne pas déranger : une alerte de jauge passe avant tout, et seule en Ne pas déranger
		Jeu.chargerSemaine('2026-09-14'); Jeu.nouvellePartie(); Taches.nouvellePartie();
		const et = NotifsTel.etatVide();
		Jeu.horloge.minutes = 600; Jeu.jauges.budget = 20;
		const a = NotifsTel.maj(et, { panneauOuvert: false, npd: false });
		out.prio = a && a.n.app === 'regul' && a.n.prio === 0;
		const et2 = NotifsTel.etatVide(); Jeu.jauges.budget = 60; Jeu.horloge.minutes = 1150;
		out.npd = NotifsTel.maj(et2, { panneauOuvert: false, npd: true }) === null && et2.recues.length > 0;
		return out;
	})()`,
		cn,
	);
	verifier(r.erreurs.length === 0, `téléphone : ${[...new Set(r.erreurs)].slice(0, 4)}`);
	verifier(r.parJour.some((n) => n >= 3) && r.parJour.every((n) => n <= 10), `téléphone : rythme par journée (${r.parJour})`);
	verifier(r.repro, 'téléphone : plan et variantes reproductibles par la graine');
	verifier(r.prio && r.npd, `téléphone : alerte prioritaire (${r.prio}), Ne pas déranger ne laisse passer que les alertes (${r.npd})`);
	const nt = readFileSync(join(pub, 'notifs-tel.js'), 'utf8');
	verifier(/if \(Jeu\.etat\.mode === 'direct' && TELN\.jour\)/.test(nt) && !/function majNotifsTel\(\) \{[^}]*fetch/.test(nt), 'téléphone : le direct seulement en mode « aujourd’hui », aucun appel réseau dans draw');
	verifier(/Date\.now\(\) - dernier < 10 \* 60 \* 1000/.test(nt) && /6000/.test(nt) && /limit=1/.test(nt), 'téléphone : appels sobres (10 min, 6 s, limit=1)');
	verifier(/telephone: typeof TELN/.test(readFileSync(join(pub, 'sauvegarde.js'), 'utf8')), 'téléphone : notifications du jour sauvegardées');
}

// Prompt 91 § 1 : aucune collision de nom global entre les scripts du jeu (une fonction écrasée a figé la messagerie)
{
	const html0 = readFileSync(join(pub, 'index.html'), 'utf8');
	const scripts = [...html0.matchAll(/<script src="\.\/([^"]+\.js)"/g)].map((m) => m[1]).filter((f) => !f.startsWith('lib/') && !f.startsWith('data/'));
	const vus = {};
	const doublons = [];
	for (const f of scripts) {
		for (const m of readFileSync(join(pub, f), 'utf8').matchAll(/^(?:function|const|let|var|class) ([A-Za-z_$][\w$]*)/gm)) {
			if (vus[m[1]] && vus[m[1]] !== f) doublons.push(`${m[1]} (${vus[m[1]]}, ${f})`);
			vus[m[1]] = f;
		}
	}
	verifier(doublons.length === 0, `noms globaux en double : ${doublons.slice(0, 5)}`);
}

// Prompt 91 : déblocage par semaine (option), brouillon Community = faits du dossier, pile de navigation, somnolence
{
	const ca = contexte('fr');
	vm.runInContext(
		`var __t = 1000, ecran = 'jeu', phase = 'attente', vue = 'poste', fenetre = null, reduireAnimations = true, __ann = [];
		var PC = { etat: 'appli', fenetre: null }; var JOURNAL = { jour: 0, enquete: null, vue: 'jour', volet: 0 }; var COMMU = { onglet: 'fil', defil: 0, brouillon: null };
		var Confort = { Reglages: {}, Son: { bip() {}, clic() {} } };
		var __chap = 1; function chapitreCourant() { return __chap; }
		function millis() { return __t; } function annoncer(x) { __ann.push(String(x)); } function ouvrir(f) { fenetre = f; } function fermer() { fenetre = null; }`,
		ca,
	);
	vm.runInContext(readFileSync(join(pub, 'applis.js'), 'utf8'), ca, { filename: 'applis.js' });
	const r = vm.runInContext(
		`(() => {
		const out = {};
		const toutes = Object.keys(PLANNING_APPLIS);
		out.sansOption = toutes.every((c) => appliDebloquee(c));
		Confort.Reglages.deblocageApplis = true;
		out.semaines = [1, 2, 3].map((n) => ((__chap = n), toutes.filter((c) => appliDebloquee(c)).sort().join(',')));
		__chap = 0; Jeu.etat = { mode: 'direct' }; out.direct = toutes.filter((c) => appliDebloquee(c)).length;
		Confort.Reglages.toutDebloque = true; out.directTout = toutes.every((c) => appliDebloquee(c));
		Confort.Reglages.deblocageApplis = false; Confort.Reglages.toutDebloque = false; __chap = 1;
		// Pile : dossier (appli) → Community → Échap revient au dossier ; deux niveaux
		Jeu.chargerSemaine('2026-09-14'); Jeu.nouvellePartie();
		PC.etat = 'appli'; PC.fenetre = null;
		redirigerVers('community', () => (COMMU.brouillon = { index: 0 }));
		const a = [PC.etat, PC.fenetre];
		redirigerVers('journal');
		const b = [PC.etat, PC.fenetre];
		depilerNavigation(); const c = [PC.etat, PC.fenetre];
		depilerNavigation(); const d = [PC.etat, PC.fenetre];
		out.pile = [a, b, c, d].map((x) => x.join('/')).join(' > ');
		out.vide = depilerNavigation() === false;
		return out;
	})()`,
		ca,
	);
	verifier(r.sansOption, 'déblocage : sans l\'option (défaut), toutes les applis sont ouvertes');
	verifier(r.semaines[0] === 'signalements' && r.semaines[1] === 'community,corbeille,signalements' && r.semaines[2] === 'community,corbeille,patron,signalements', `déblocage par semaine : ${r.semaines.join(' | ')}`);
	verifier(r.direct === 6 && r.directTout, `déblocage : temps réel = semaine 4 (${r.direct}) ; « tout débloqué » (${r.directTout})`);
	verifier(r.pile === 'os/community > os/journal > os/community > appli/' && r.vide, `pile de navigation : ${r.pile}`);
	// Brouillon Community : faits réels du dossier (ligne, cause, durée), publication sans effet de jauge
	const cb = contexte('fr');
	const b = vm.runInContext(
		`(() => {
		let i = -1;
		for (const l of Jeu.semainesProposees().map((x) => x.lundi)) { Jeu.chargerSemaine(l); Jeu.nouvellePartie(); Taches.nouvellePartie(); i = Jeu.paquet.findIndex((d) => d.type === 'perturbation' && d.lignes && d.lignes.length); if (i >= 0) break; }
		const d = Jeu.paquet[i];
		const faits = [Taches.ligneDe(d), Taches.causeDe(d), Taches.dureeDe(d)].map(String);
		const jauges = JSON.stringify(Jeu.jauges);
		const p = Jeu.publierBrouillon(i);
		const deux = Jeu.publierBrouillon(i);
		return { faits, ligneOk: faits[0].includes(d.lignes[0]), causeOk: faits[1] === String(d.nature).split(',')[0].trim(), jaugesIntactes: JSON.stringify(Jeu.jauges) === jauges, publie: !!p && p.brouillon, une: deux === null, invente: faits.some((f) => /undefined|\\[À COMPLÉTER\\]/.test(f)) };
	})()`,
		cb,
	);
	verifier(b.ligneOk && b.causeOk && !b.invente, `brouillon : faits du dossier (${b.faits})`);
	verifier(b.publie && b.une && b.jaugesIntactes, 'brouillon : publié une fois par dossier, sans effet de jauge');
	const g = readFileSync(join(pub, 'game.js'), 'utf8');
	verifier(/\(Jeu\.somnolenceElevee \? 1\.5 : 1\)/.test(g) && /Jeu\.DELAI_EQUIPE_MS \* \(Jeu\.somnolenceElevee \? 1\.5 : 1\)/.test(g), 'somnolence (option) : au-delà de 70, aggravation ×1,5 et équipes plus lentes');
	const sx = readFileSync(join(pub, 'sieste.js'), 'utf8');
	verifier(/q\.arrivee -= decal/.test(sx) && /sieste\.prevision/.test(sx) && /somnolenceNecessaire \? 2 : 1/.test(sx), 'somnolence : la sieste fait arriver les équipes et annonce le prochain signalement ; option ×2');
	verifier(!/return tacheInfo\(r, n\)/.test(readFileSync(join(pub, 'taches.js'), 'utf8')), 'info trafic (prompt 88) remplacée par la publication Community');
}

// Prompt 92 : composant de texte fiable (coupure, ellipse en fin de mot, cache), nettoyage typographique
// mot pour mot, découpage de l'agenda, modèles des sources d'enquête (rien d'inventé, citation intacte)
for (const langue of ['fr', 'en']) {
	const ct = contexte(langue);
	vm.runInContext('var MOBILE = { actif: false }; var C = {}; function dateLongue(d) { return String(d); } function nombreFr(v) { return Langue.actuelle === "fr" ? String(v).replace(".", ",") : String(v); }', ct);
	vm.runInContext(readFileSync(join(pub, 'enquete.js'), 'utf8'), ct, { filename: 'enquete.js' });
	const r = vm.runInContext(
		`(() => {
		TexteUI.mesureur = (s, p, t) => [...String(s)].length * t * 0.6; // police à chasse fixe : 0,6 em par caractère
		const W = (s) => [...s].length * 22 * 0.6;
		const out = { erreurs: [] };
		const err = (x) => out.erreurs.push(x);
		// couperLignes : largeur respectée, mots longs coupés (trait d'union ou coupure naturelle), retours à la ligne
		const larg = 300; // 22 caractères
		const long = 'Anticonstitutionnellementissimementplus';
		const lm = TexteUI.couperLignes('Un ' + long + ' fin', larg, 'mono', 22);
		if (lm.some((l) => W(l) > larg)) err('mot long : ligne trop large ' + JSON.stringify(lm));
		if (!lm.some((l) => l.endsWith('-'))) err('mot long : pas de trait d\\'union ' + JSON.stringify(lm));
		if (lm.join('').replace(/-/g, '').replace(/ /g, '') !== ('Un' + long + 'fin')) err('mot long : lettres perdues');
		const url = TexteUI.couperLignes('Voir https://data.nantesmetropole.fr/explore/dataset/244400404_reseau', larg, 'mono', 22);
		if (url.some((l) => W(l) > larg) || !url.some((l) => /\\/$/.test(l))) err('URL : coupure après « / » attendue ' + JSON.stringify(url));
		const cc = TexteUI.couperLignes('Lignes C1/C2/C3/C4/C5/C6/C7/C8/C9/C10 déviées', 200, 'mono', 22);
		if (cc.some((l) => W(l) > 200) || cc.some((l) => /-$/.test(l))) err('C1/C2 : coupure après « / » sans trait d\\'union ' + JSON.stringify(cc));
		const nl = TexteUI.couperLignes('Ligne 1\\nLigne 2', 600, 'mono', 22);
		if (nl.length !== 2) err('retour à la ligne de la source non respecté');
		const etroit = TexteUI.couperLignes('Bonjour tout le monde', 1, 'mono', 22);
		if (!etroit.length || etroit.some((l) => !l)) err('largeur minimale : lignes vides');
		const n0 = TexteUI.tailleCache();
		const a1 = TexteUI.couperLignes('Texte mis en cache pour le test', 260, 'mono', 22);
		const a2 = TexteUI.couperLignes('Texte mis en cache pour le test', 260, 'mono', 22);
		if (a1 !== a2 || TexteUI.tailleCache() !== n0 + 1) err('cache : résultat recalculé');
		// Ellipse en fin de mot + indicateur « tronqué »
		const phrase = 'Manifestation et service garanti le dix-sept octobre sur toutes les lignes du réseau de tramway et de bus';
		const h = TexteUI.hauteurTexte(phrase, 300, { taille: 22, maxLignes: 2, police: 'mono' });
		const der = h.lignes[1];
		if (!h.tronque || h.lignes.length !== 2 || !/ …$/.test(der)) err('ellipse : ' + JSON.stringify(h.lignes));
		const motsVus = (h.lignes[0] + ' ' + der.replace(/ …$/, '')).split(' ');
		if (motsVus.join(' ') !== phrase.split(' ').slice(0, motsVus.length).join(' ')) err('ellipse au milieu d\\'un mot : ' + der);
		if (TexteUI.hauteurTexte('court', 300, { taille: 22, maxLignes: 2, police: 'mono' }).tronque) err('texte court marqué tronqué');
		// Nettoyage typographique
		const n = (s) => TexteUI.nettoyerTexteSource(s, Langue.actuelle);
		const brut = 'Travaux &amp; d&#039;eviation  <b>ligne C1</b> : 50.4 km/h , 12 mm... 18min ,, 12345 voyageurs en 2026 !';
		const net = n(brut);
		if (/&amp;|&#|<b>|  /.test(net) || !/&/.test(net)) err('nettoyage commun : ' + net);
		if (Langue.actuelle === 'fr') {
			if (!/d’eviation/.test(net) || !/C1\u202F:/.test(net) || !/50,4\u00A0km\\/h/.test(net) || !/12\u00A0mm/.test(net) || !/…/.test(net) || !/18\u00A0min/.test(net) || !/12\u00A0345/.test(net) || !/2026\u202F!/.test(net)) err('typographie FR : ' + JSON.stringify(net));
			if (!/15:00/.test(n('le 2026-09-15 à 15:00'))) err('heure 15:00 modifiée');
			if (n('« Ligne 1 »') !== '«\u202FLigne 1\u202F»') err('guillemets FR');
		} else {
			if (/ [!:,]/.test(net) || !/50\\.4/.test(net)) err('typographie EN : ' + JSON.stringify(net));
			if (n('« Line 1 »') !== '“Line 1”') err('guillemets EN');
		}
		// Mot pour mot : sur toutes les citations réelles des 3 semaines (et le fallback)
		let nb = 0;
		for (const l of Jeu.semainesProposees().map((x) => x.lundi)) {
			Jeu.chargerSemaine(l); Jeu.nouvellePartie();
			const sources = Jeu.paquet.map((d) => d.texte_source).concat(Jeu.evenementsAffluence ? Jeu.paquet.flatMap((d) => Jeu.evenementsAffluence(d.date).map((x) => x.texte_source)) : []);
			for (const s of sources) {
				if (!s) continue;
				nb++;
				if (TexteUI.mots(n(String(s))).join(' ') !== TexteUI.mots(String(s)).join(' ')) err('mots changés : ' + s + ' → ' + n(String(s)));
			}
			// Modèles des 4 sources sur chaque dossier : textes présents, citation identique à la donnée
			for (const d of Jeu.paquet) {
				for (const cle of ['lignes', 'trafic', 'meteo', 'agenda']) {
					const m = modeleSource(cle, d);
					const tout = [m.fait, m.provenance].concat(m.paires.flat(), (m.puces || []).map((x) => x.txt), (m.liste || []).map((x) => x.titre)).join(' | ');
					if (!m.fait || /undefined|\\[À COMPLÉTER\\]|\\{\\w+\\}|NaN/.test(tout)) err(cle + ' : texte manquant ' + tout);
					if (cle === 'trafic' && d.texte_source && m.citation !== String(d.texte_source)) err('citation reformulée');
					if (cle === 'trafic' && d.texte_source && !annonceSource(m).includes(n(String(d.texte_source)))) err('annonce : citation incomplète');
				}
			}
		}
		out.nb = nb;
		// Agenda : « Titre — Lieu, Ville », repli si le format diffère
		const ag = TexteUI.decouperAgenda('Exposition Le Muséum au fil du temps — Place de la Monnaie, Nantes');
		if (ag.titre !== 'Exposition Le Muséum au fil du temps' || ag.lieu !== 'Place de la Monnaie, Nantes') err('agenda : découpage ' + JSON.stringify(ag));
		const ag2 = TexteUI.decouperAgenda('Atelier sans lieu');
		if (ag2.titre !== 'Atelier sans lieu' || ag2.lieu !== null) err('agenda : repli');
		// Relief : le texte reconstitué est identique
		const sg = TexteUI.segments('Ligne C1 : 18 min le 4/10', /\\d+(?:[\\/]\\d+)*|C\\d+/g);
		if (sg.map((x) => x.txt).join('') !== 'Ligne C1 : 18 min le 4/10' || sg.filter((x) => x.relief).length !== 3) err('relief : ' + JSON.stringify(sg));
		return out;
	})()`,
		ct,
	);
	verifier(r.erreurs.length === 0, `textes d'enquête (${langue}) : ${r.erreurs.slice(0, 4).join(' ; ')}`);
	verifier(r.nb > 50, `textes d'enquête : trop peu de citations réelles vérifiées (${r.nb})`);
}
for (const f of ['enquete.js', 'carte.js', 'journal.js']) verifier(!/\*\s*1\.05\s*\)/.test(readFileSync(join(pub, f), 'utf8')), `${f} : estimation « textWidth × 1,05 » restante (prompt 92)`);
{
	const en = readFileSync(join(pub, 'enquete.js'), 'utf8');
	verifier(/toucheSourcesEnquete\(\)/.test(readFileSync(join(pub, 'sketch.js'), 'utf8')) && /molletteEnquete\(/.test(readFileSync(join(pub, 'sketch.js'), 'utf8')), 'sources : clavier et molette branchés');
	verifier(/reduireAnimations \? 1/.test(en) && /reduireAnimations \|\|/.test(en), 'sources : fondu et défilement instantanés avec animations réduites');
}

// Prompt 93 : détecteur de textes hors cadre — inactif par défaut ; libellés longs réels qui doivent tenir ;
// garde-fou contre les estimations « × 1,05 » et les nouveaux text() sans largeur dans les applis
{
	const html93 = readFileSync(join(pub, 'index.html'), 'utf8');
	const inst93 = readFileSync(join(pub, 'installation.js'), 'utf8');
	const sk93 = readFileSync(join(pub, 'sketch.js'), 'utf8');
	verifier(!html93.includes('audit-textes.js') && /audit=textes/.test(inst93) && /function zoneTexteDebut\(\) \{\}/.test(sk93) && /function zoneTexteFin\(\) \{\}/.test(sk93) && /function zoneTexteDeclarer\(\) \{\}/.test(sk93), 'audit textes : chargé seulement avec ?audit=textes, cadres vides en jeu normal');
	// Le module en mode « tête » : sans le paramètre, il ne fait rien (pas d'objet global, pas d'enveloppe)
	const ca = vm.createContext({ location: { search: '' }, URLSearchParams, p5: { prototype: { text() {} } } });
	ca.window = ca;
	vm.runInContext(readFileSync(join(pub, 'audit-textes.js'), 'utf8'), ca, { filename: 'audit-textes.js' });
	verifier(ca.AUDIT_TEXTES === undefined && ca.p5.prototype.registerMethod === undefined, 'audit textes : actif sans ?audit=textes');
	const ca2 = vm.createContext({ location: { search: '?audit=textes' }, URLSearchParams, p5: { prototype: { text() {}, registerMethod() {} } }, addEventListener() {} });
	ca2.window = ca2;
	vm.runInContext(readFileSync(join(pub, 'audit-parcours.js'), 'utf8'), ca2, { filename: 'audit-parcours.js' }); // prompt 101 : aides partagées
	vm.runInContext(readFileSync(join(pub, 'audit-textes.js'), 'utf8'), ca2, { filename: 'audit-textes.js' });
	verifier(ca2.AUDIT_TEXTES && typeof ca2.AUDIT_TEXTES.rapport === 'function' && typeof ca2.zoneTexteDebut === 'function' && ca2.AUDIT_TEXTES.etapes().length > 40, 'audit textes : module ou parcours incomplet avec ?audit=textes');
	// Prompt 101 : mesure de densité, même principe (rien sans ?audit=densite, parcours complet avec)
	verifier(!html93.includes('audit-densite.js') && /audit=\(textes\|densite\)/.test(inst93), 'audit densité : chargé seulement avec ?audit=densite');
	const cd = vm.createContext({ location: { search: '' }, URLSearchParams, p5: { prototype: { text() {} } } });
	cd.window = cd;
	vm.runInContext(readFileSync(join(pub, 'audit-densite.js'), 'utf8'), cd, { filename: 'audit-densite.js' });
	verifier(cd.AUDIT_DENSITE === undefined && cd.p5.prototype.registerMethod === undefined, 'audit densité : actif sans ?audit=densite');
	const cd2 = vm.createContext({ location: { search: '?audit=densite' }, URLSearchParams, p5: { prototype: { text() {}, rect() {}, image() {}, registerMethod() {} } }, addEventListener() {} });
	cd2.window = cd2;
	vm.runInContext(readFileSync(join(pub, 'audit-parcours.js'), 'utf8'), cd2, { filename: 'audit-parcours.js' });
	vm.runInContext(readFileSync(join(pub, 'audit-densite.js'), 'utf8'), cd2, { filename: 'audit-densite.js' });
	verifier(cd2.AUDIT_DENSITE && typeof cd2.AUDIT_DENSITE.rapport === 'function' && typeof cd2.AUDIT_DENSITE.parcours === 'function', 'audit densité : module incomplet avec ?audit=densite');
	// Cas réels de libellés longs corrigés (JetBrains Mono : 0,6 em par caractère), en FR et en EN
	for (const langue of ['fr', 'en']) {
		const c93 = contexte(langue);
		const r93 = vm.runInContext(
			`(() => {
			TexteUI.mesureur = (s, p, t) => [...String(s)].length * t * 0.6;
			const n = (cle, taille, l) => TexteUI.couperLignes(t(cle), l, 'mono', taille).length;
			return {
				credits: n('param.musiqueCredits', 14, 1000 - 96),
				palmares: (n('palmares.aide', 18, 1400 - 112 - 340) - 1) * 22.5 + 18,
				contact: TexteUI.mesurer(t('histoire.patron'), 'mono', 22) <= 520 - 32 - 32 && TexteUI.mesurer(t('sms.camille'), 'mono', 22) <= 520 - 32 - 32,
			};
		})()`,
			c93,
		);
		verifier(r93.credits === 1 && r93.palmares <= 100 && r93.contact, `libellés longs (${langue}) : ${JSON.stringify(r93)}`);
	}
	// Garde-fou : aucune estimation « textWidth(...) * 1.05 » ; text(x, y) sans largeur limité aux exceptions motivées
	// (heures, chiffres, touches, titres courts centrés : comptage figé au prompt 93 — tout nouveau cas doit passer
	// par dessinerTexte / ajusterTaille ou être ajouté ici avec sa raison)
	const EXCEPTIONS_TEXTE = { 'community.js': 0, 'patron.js': 0, 'journal.js': 1, 'os.js': 0, 'donnees.js': 1, 'notifs-tel.js': 4, 'telephone.js': 4, 'telephone-main.js': 3, 'taches-ui.js': 3, 'applis.js': 0, 'multitache.js': 2, 'carte.js': 5, 'enquete.js': 0, 'panneau.js': 9 };
	const reSans = /(^|[^a-zA-Z.])text\(([^,()]|\([^()]*\))*,([^,()]|\([^()]*\))*,([^,()]|\([^()]*\))*\);/gm;
	for (const f of readdirSync(pub).filter((x) => x.endsWith('.js'))) {
		const src = readFileSync(join(pub, f), 'utf8');
		verifier(!/textWidth\([^;]*\)\s*\*\s*1\.05/.test(src), `${f} : estimation « textWidth × 1,05 » (prompt 93 : utiliser couperLignes)`);
		if (f in EXCEPTIONS_TEXTE) {
			const nb = (src.match(reSans) || []).length;
			verifier(nb <= EXCEPTIONS_TEXTE[f], `${f} : ${nb} text() sans largeur (max ${EXCEPTIONS_TEXTE[f]}) — passer par dessinerTexte ou ajusterTaille`);
		}
	}
}

// Prompt 94 : prise en main — glisser-déposer (dépôt = décision, ailleurs = rien, clic = décision),
// « Quitter la journée » (mail → soir → sortie, sans toucher aux jauges), clés FR + EN
{
	const cg = contexte('fr');
	vm.runInContext(
		`var ecran = 'jeu', phase = 'decision', vue = 'poste', fenetre = null, enPause = false, reduireAnimations = false;
		var PC = { etat: 'appli' }, MOBILE = { actif: false }, ECRAN_POSTE = { x: 96, y: 40, l: 1728, h: 972 }, L = 1920, H = 1080;
		var mouseX = 0, mouseY = 0, __t = 0, __decide = [], __ann = [];
		var millis = () => __t, decider = (c) => __decide.push(c), annoncer = (x) => __ann.push(String(x)), constrain = (v, a, b) => Math.max(a, Math.min(b, v));
		var Confort = { Son: { clic() {}, bip() {} } };
		function ecranVers(x, y) { mouseX = ECRAN_POSTE.x + (x * ECRAN_POSTE.l) / L; mouseY = ECRAN_POSTE.y + (y * ECRAN_POSTE.h) / H; }`,
		cg,
	);
	vm.runInContext(readFileSync(join(pub, 'glisser.js'), 'utf8'), cg, { filename: 'glisser.js' });
	const g = vm.runInContext(
		`(() => {
		CARTES = [{ cle: 'renfort', x: 820, y: 640, l: 420, h: 140, lib: 'Renforcer', touche: '1' }, { cle: 'rien', x: 1260, y: 640, l: 420, h: 140, lib: 'Ne rien faire', touche: '4' }];
		ZONE_DEPOT = { x: 810, y: 210, l: 900, h: 340 };
		const r = {};
		// glisser la carte 1 sur le dossier
		ecranVers(900, 700); r.prise = debutGlisser(); ecranVers(1200, 380); relacherGlisser();
		r.depot = __decide.join() === 'renfort';
		// glisser ailleurs : aucun choix, retour en ressort, annonce
		ecranVers(1300, 700); debutGlisser(); ecranVers(200, 900); relacherGlisser();
		r.ailleurs = __decide.length === 1 && !!GLISSER.retour && /aucun choix/.test(__ann[__ann.length - 1]);
		// simple clic : décide
		ecranVers(1300, 700); debutGlisser(); ecranVers(1302, 702); relacherGlisser();
		r.clic = __decide.join() === 'renfort,rien';
		// hors décision ou au doigt : pas de prise
		phase = 'narration'; ecranVers(900, 700); r.horsDecision = debutGlisser() === false; phase = 'decision';
		MOBILE.actif = true; r.tactile = debutGlisser() === false; MOBILE.actif = false;
		// poids : amplitude selon les deltas réels, coupée avec les animations réduites
		// prompt 96 : la secousse passe par juice.js (testé plus bas)
		return r;
	})()`,
		cg,
	);
	for (const [k, v] of Object.entries(g)) verifier(v === true, `glisser-déposer (prompt 94) : ${k}`);
	// Quitter la journée : fin de service → mail → soir → sortie → lendemain, jauges intactes
	const cq = contexte('fr');
	vm.runInContext(
		`var phase = 'attente', ecran = 'jeu', vue = 'poste', fenetre = null, enPause = false, enSieste = false, reveil = null, reduireAnimations = false, tutoriel = null;
		var MENU = { actif: false }, PC = { fenetre: null }, CAMERA = { x: 0, y: 0 }, METEO_VISU = { nuit: 1 }, focusBureau = -1, OBJETS_BUREAU = [], PIECE = {};
		var L = 1920, H = 1080, __t = 1000, __fen = [], __ann = [];
		var millis = () => __t, constrain = (v, a, b) => Math.max(a, Math.min(b, v)), heureAffichee = () => ({ h: 20, m: 0 });
		var seLever = () => { vue = 'bureau'; }, annoncer = (x) => __ann.push(String(x)), interaction = () => {}, ouvrir = (f) => { fenetre = f; __fen.push(f); };
		var Confort = { Son: { bip: () => {}, musique: { attenuer: () => {} } } }, Sauvegarde = { auto: () => {} };
		var dateLongue = (d) => d, localStorage = { getItem: () => null, setItem: () => {} };
		var allerFin = () => { phase = 'fin'; }, lancerLicenciement = () => {};
		var journeeSuivante = () => { Jeu.journeeSuivante(); phase = 'attente'; };`,
		cq,
	);
	for (const f of ['soir.js', 'journee.js']) vm.runInContext(readFileSync(join(pub, f), 'utf8'), cq, { filename: f });
	const q = vm.runInContext(
		`(() => {
		Jeu.chargerSemaine(Jeu.semainesProposees()[0].lundi); Jeu.nouvellePartie();
		const r = {};
		quitterJourneeRapide(); r.avantHeure = fenetre === 'partir'; fenetre = null;
		while (Jeu.prochainDuJour()) Jeu.decider('renfort');
		Jeu.horloge.minutes = Jeu.finJournee();
		quitterJourneeRapide(); r.mail = phase === 'mail';
		const jauges = JSON.stringify(Jeu.jauges), jour = Jeu.jourIndex;
		quitterJourneeRapide(); r.soir = phase === 'soir';
		quitterJourneeRapide(); r.sortie = !!SOIR.sortie && vue === 'bureau';
		__t += 5000; majSoir();
		r.lendemain = phase === 'attente' && Jeu.jourIndex === jour + 1;
		r.jaugesIntactes = JSON.stringify(Jeu.jauges) === jauges;
		// sortie automatique peu après la nuit (ranger le poste suffit)
		phase = 'mail'; rangerPoste(); __t += 4100; majSoir(); r.nuit = SOIR.annonce && !SOIR.sortie;
		__t += 8100; majSoir(); r.auto = !!SOIR.sortie;
		r.toucheQ = /key === 'q' \\|\\| key === 'Q'/.test(${JSON.stringify(readFileSync(join(pub, 'journee.js'), 'utf8'))});
		return r;
	})()`,
		cq,
	);
	for (const [k, v] of Object.entries(q)) verifier(v === true, `quitter la journée (prompt 94) : ${k}`);
	const fr94 = contexte('fr');
	const en94 = contexte('en');
	for (const cle of ['quitter.bouton', 'quitter.range', 'glisser.deposer', 'glisser.annule']) {
		const a = vm.runInContext(`t(${JSON.stringify(cle)}, { reponse: 'X' })`, fr94);
		const b = vm.runInContext(`t(${JSON.stringify(cle)}, { reponse: 'X' })`, en94);
		verifier(a !== '[À COMPLÉTER]' && b !== '[À COMPLÉTER]' && a !== b, `prompt 94 : clé ${cle} absente en FR ou en EN`);
	}
	verifier(/debutGlisser\(\)/.test(readFileSync(join(pub, 'sketch.js'), 'utf8')) && /relacherGlisser\(\)/.test(readFileSync(join(pub, 'micro.js'), 'utf8')), 'glisser-déposer : appui et relâchement branchés');
}

// Prompt 95 : journées synchronisées et expliquées — une seule horloge (équipes en temps de jeu), titres de
// transition justes, explication de la journée tirée des données, indicateur de sauvegarde en heure de jeu
{
	const c95 = contexte('fr');
	vm.runInContext('var setInterval = () => 0, localeActive = () => "fr-FR";', c95);
	vm.runInContext(readFileSync(join(pub, 'immersion.js'), 'utf8'), c95, { filename: 'immersion.js' });
	const r95 = vm.runInContext(
		`(() => {
		const r = {};
		Jeu.chargerSemaine('2026-09-14'); Jeu.nouvellePartie();
		TRANSITION_JOUR = { jour: 1, semaine: 0, date: Jeu.jours[0].date };
		r.archive = texteTransitionJour() === 'JOUR 1/' + Jeu.jours.length;
		TRANSITION_JOUR.semaine = 2; r.histoire = texteTransitionJour() === 'JOUR 1/' + Jeu.jours.length + ' — SEMAINE 2';
		const mode = Jeu.etat.mode; Jeu.etat.mode = 'direct'; r.direct = /TEMPS RÉEL/.test(texteTransitionJour()); Jeu.etat.mode = mode;
		TRANSITION_JOUR.semaine = 0;
		const l = lignesTransitionJour().join(' | ');
		r.prevus = l.includes(Jeu.jours[0].dossiers.length + ' dossier(s) prévu(s)') && !/réel\(s\) prévu/.test(l); // prompt 162 : composition, plus de « réels »
		r.service = l.includes('8h00') && l.includes('20h00') && /touche Q/.test(l);
		r.courte = Jeu.jours.length < 7 ? /aucun événement réel le dimanche 20 septembre/.test(l) : true;
		TRANSITION_JOUR.jour = 2; r.courteUneFois = !/aucun événement réel/.test(lignesTransitionJour().join(' '));
		// Équipes : 20 minutes de jeu (1 000 ms de l'horloge des équipes = 1 min de jeu au rythme normal)
		Jeu.elementDebloque = () => true; Jeu.jauges.budget = 100;
		const T0 = 500000;
		const e = Jeu.envoyerEquipe(0, 'police', T0);
		const q = Jeu.equipes[0];
		Jeu.majEquipes(T0 + 19999); const avant = q.arrivee_sim === null;
		Jeu.majEquipes(T0 + 20000); r.vingtMinutes = e.ok && avant && q.arrivee_sim !== null;
		return r;
	})()`,
		c95,
	);
	for (const [k, v] of Object.entries(r95)) verifier(v === true, `journées (prompt 95) : ${k}`);
	const im = readFileSync(join(pub, 'immersion.js'), 'utf8');
	const corps = (im.match(/function avancerTemps\(\) \{[\s\S]*?\n\}/) || [''])[0];
	verifier(corps.indexOf('if (tempsSuspendu()) return;') >= 0 && corps.indexOf('TEMPS_EQUIPES.ms +=') > corps.indexOf('if (tempsSuspendu()) return;') && /vitesse \/ IMMERSION\.minutesParSeconde/.test(corps), 'journées : l\'horloge des équipes doit s\'arrêter avec le temps de jeu et suivre le ×100');
	verifier(!/majEquipes\(millis\(\)\)|envoyerEquipe\([^)]*millis\(\)\)/.test(['sketch.js', 'carte.js'].map((f) => readFileSync(join(pub, f), 'utf8')).join('\n')), 'journées : des équipes comptent encore en millis()');
	verifier(/sauvegarde\.autoJeu/.test(readFileSync(join(pub, 'sauvegarde.js'), 'utf8')) && /recalerEquipes/.test(readFileSync(join(pub, 'sauvegarde.js'), 'utf8')), 'journées : indicateur de sauvegarde en heure de jeu, équipes recalées à la reprise');
	const en95 = contexte('en');
	for (const cle of ['temps.pause', 'temps.normal', 'temps.accelere', 'temps.explication', 'jour.reste', 'jour.resteAucun', 'jour.resteArrives', 'transition.jourArchive', 'transition.prevus', 'transition.service', 'transition.rythme', 'transition.finir', 'transition.courte', 'transition.passer', 'sauvegarde.autoJeu']) {
		verifier(vm.runInContext(`t(${JSON.stringify(cle)})`, c95) !== '[À COMPLÉTER]' && vm.runInContext(`t(${JSON.stringify(cle)})`, en95) !== '[À COMPLÉTER]', `prompt 95 : clé ${cle} absente en FR ou EN`);
	}
}

// Prompt 96 : game feel (skill game-feel) — tiers selon les deltas réels, trauma² qui revient à 0 en temps réel,
// hit-stop à propriétaire unique (deux impacts à 30 ms), pops qui finissent exactement à 1, réduction du mouvement
{
	const cj = vm.createContext({ Math, reduireAnimations: false, Confort: { Reglages: { intensiteFeedback: 100 } } });
	cj.window = cj;
	vm.runInContext(readFileSync(join(pub, 'juice.js'), 'utf8'), cj, { filename: 'juice.js' });
	const j = vm.runInContext(
		`(() => {
		const r = {};
		r.tiers = Juice.tierDeltas([-12, 3, 0]) === 'large' && Juice.tierDeltas([6, 0, 0]) === 'medium' && Juice.tierDeltas([1, -2, 0]) === 'small' && Juice.tierDeltas([0, 0, 0]) === 'small';
		// deux impacts larges à 30 ms : l'échelle revient à 1 après le plus récent, pas avant
		Juice.retour('large', 1000); Juice.retour('large', 1030);
		r.borne = Juice.E.trauma === 1;
		r.stopPendant = Juice.echelleTemps(1110) === 0.05; // le premier aurait fini à 1100
		r.stopFini = Juice.echelleTemps(1131) === 1;
		// la secousse décroît en temps réel et revient exactement à 0 en moins de 1 / décroissance
		let d = Juice.decalage(1030), max = 0;
		for (let t = 1046; t <= 1030 + 900; t += 16) { d = Juice.decalage(t); max = Math.max(max, Math.abs(d.x)); }
		r.secoue = max > 1;
		r.repos = d.x === 0 && d.y === 0 && Juice.E.trauma === 0;
		// pops : dépassent puis finissent exactement à 1
		r.pop = Juice.pop(0, 90) < 1.15 && Juice.pop(0, 180) === 1 && Juice.pop(0, 1000) === 1 && Math.min(...[20, 60, 100, 140].map((t) => Juice.pop(0, t))) < 1;
		// mouvement réduit ou intensité 0 : rien
		reduireAnimations = true; const a = Juice.retour('large', 5000); r.reduit = a.stop === 0 && Juice.echelleTemps(5010) === 1 && Juice.pop(4990, 5000) === 1;
		reduireAnimations = false; Confort.Reglages.intensiteFeedback = 0; Juice.retour('large', 6000); r.intensiteZero = Juice.E.trauma === 0;
		Confort.Reglages.intensiteFeedback = 50; Juice.retour('medium', 7000); r.intensiteMoitie = Math.abs(Juice.E.trauma - 0.2) < 1e-9;
		return r;
	})()`,
		cj,
	);
	for (const [k, v] of Object.entries(j)) verifier(v === true, `game feel (prompt 96) : ${k}`);
	const sk96 = readFileSync(join(pub, 'sketch.js'), 'utf8');
	verifier(/feedback\(Juice\.tierDeltas\(dernierResultat\.deltas\)\)/.test(sk96) && /Juice\.decalage\(millis\(\)\)/.test(sk96) && /Juice\.echelleTemps\(maintenant\)/.test(readFileSync(join(pub, 'immersion.js'), 'utf8')), 'game feel : décision, secousse et hit-stop branchés');
	verifier(!/Jeu\.|game\.js/.test(readFileSync(join(pub, 'juice.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//, '')), 'game feel : juice.js ne doit pas toucher la simulation (Jeu)');
	verifier(vm.runInContext("t('acc.intensite')", contexte('fr')) !== '[À COMPLÉTER]' && vm.runInContext("t('acc.intensite')", contexte('en')) !== '[À COMPLÉTER]', 'game feel : clé acc.intensite FR / EN');
}

// Prompt 97 (skill game-design-theory) : apprendre vite — l'aide H et le guide nomment les gestes (glisser / clic,
// 1-4, Q) et les 3 jauges, et répondent à « pourquoi ma décision a raté ? » ; la difficulté est lisible avant de jouer
for (const [langue, mots] of [
	['fr', { glisser: /Glisser/, touches: /1 à 3/, q: /Quitter la journée/, jauges: /fluidité, réputation et budget/, rate: /Pourquoi une décision a raté/, guide: /répondez-lui/, diff: /Difficulté facile : budget de départ 60 · jusqu’à 3 signalements en même temps/ }],
	['en', { glisser: /Drag/, touches: /1 to 3/, q: /End the day/, jauges: /flow, reputation and budget/, rate: /Why did a decision fail/, guide: /then reply/, diff: /easy difficulty: starting budget 60 · up to 3 reports at once/ }],
]) {
	const c97 = contexte(langue);
	const a = vm.runInContext(
		`({ raccourcis: [t('aide.k.glisserTouche'), t('aide.k.glisser'), t('aide.k.actionsTouche'), t('aide.k.quitterJournee')].join(' | '), texte: t('aide.texte'), guide: t('guide.actions'), diff: t('mp.difficulte', { niveau: t('niveau.facile'), budget: Jeu.REGLAGES.difficultes.facile.budget, actifs: t('mp.actifs.plusieurs', { n: Jeu.REGLAGES.difficultes.facile.actifs }) }) })`,
		c97,
	);
	const tout = a.raccourcis + ' ' + a.texte;
	for (const [k, re] of Object.entries(mots)) verifier(re.test(k === 'guide' ? a.guide : k === 'diff' ? a.diff : tout), `aide / guide (prompt 97, ${langue}) : « ${k} » absent`);
	verifier(!/briefing du matin|morning briefing|info trafic \(4 blocs|traffic info \(4 exact/.test(a.texte), `aide (prompt 97, ${langue}) : décrit encore le briefing ou l'info trafic retirés au prompt 91`);
}
verifier(/aide\.k\.glisserTouche/.test(readFileSync(join(pub, 'aide.js'), 'utf8')) && /texteDifficulteChapitre/.test(readFileSync(join(pub, 'menu.js'), 'utf8')), 'prompt 97 : aide (glisser, Q) et difficulté du mode histoire affichées');

// Prompt 98 (skill game-ui-design, validations.md) : aucun texte fixe sous 14 px, boutons qui ne rétrécissent pas
// sous 14 px, zones de clic élargies (✕ des applis, somnolence), infobulle du bandeau temporisée (350 ms)
{
	const petits = [];
	for (const f of readdirSync(pub).filter((x) => x.endsWith('.js') && x !== 'audit-textes.js')) {
		const src = readFileSync(join(pub, f), 'utf8');
		for (const m of src.matchAll(/textSize\((\d+)\)|dsTexte\([^;\n]*?, (\d+), (?:DS|C|MENU_C)\.[a-zA-Z0-9]+, '(?:left|right|center)'/g)) {
			const v = Number(m[1] || m[2]);
			if (v < 14) petits.push(`${f} : ${m[0].slice(0, 50)}`);
		}
	}
	verifier(petits.length === 0, `textes sous 14 px (prompt 98) : ${petits.slice(0, 4).join(' ; ')}`);
	const sk98 = readFileSync(join(pub, 'sketch.js'), 'utf8');
	verifier(/while \(textSize\(\) > 14 && textWidth\(label\)/.test(sk98), 'bouton() ne doit pas réduire un libellé sous 14 px');
	verifier(/millis\(\) - BANDEAU\.survolDepuis >= 350/.test(sk98), 'infobulle du bandeau : délai de 350 ms');
	verifier(/boutons\.push\(\{ x: x - 12, y: 0, l: 58, h: 52, action: fermerAppli \}\)/.test(readFileSync(join(pub, 'os.js'), 'utf8')) && /y: z\.y - 18, l: z\.l, h: z\.h \+ 18, action: basculerSieste/.test(readFileSync(join(pub, 'sieste.js'), 'utf8')), 'zones de clic ≥ 44 px : ✕ des applis et somnolence');
}

// Prompt 130 : l'évaluation suit le besoin des jauges — jouer toujours une réponse jugée « bonne » ne mène plus au
// licenciement (avant : fluidité vidée par « attendre », licenciement au 10e–14e dossier) et finit au moins « moyenne »
for (const s of semaines) {
	const c114 = contexte('fr');
	const r114 = vm.runInContext(
		`(() => {
		Jeu.chargerSemaine(${JSON.stringify(s)});
		Jeu.nouvellePartie();
		let n = 0; let bons = 0; let licencie = null;
		while (!Jeu.terminee && n++ < 200) {
			const d = Jeu.prochainDuJour();
			if (!d) { Jeu.finDeJourneeTactique(); if (!Jeu.jours[Jeu.jourIndex + 1]) break; Jeu.journeeSuivante(); continue; }
			if (Jeu.conflit && Jeu.conflit()) Jeu.choisirPriorite('a');
			const cle = Jeu.reponsesConseillees(d)[0];
			Jeu.decider(cle, d.contradiction ? d.contradiction.bonne : undefined);
			const e = Jeu.evenementsJournee[Jeu.evenementsJournee.length - 1];
			if (Jeu.evaluer(e) === 'bon') bons++;
			if (Jeu.statutPatron && Jeu.statutPatron.licencie && !licencie) licencie = Jeu.statutPatron.licencie.cause;
		}
		return { bons, total: Jeu.paquet.length, licencie, score: Jeu.score() };
	})()`,
		c114,
	);
	verifier(!r114.licencie, `prompt 130 : suivre l'évaluation mène au licenciement (${s}, ${r114.licencie})`);
	verifier(r114.bons === r114.total, `prompt 130 : une réponse conseillée doit être évaluée « bon » (${s} : ${r114.bons}/${r114.total})`);
	verifier(r114.score >= 180, `prompt 130 : suivre l'évaluation doit finir au moins « moyenne » (${s} : ${r114.score})`);
}

// Prompt 131 : l'intro décrit le jeu actuel (pas de chrono par défaut, la sieste est une mécanique), la narration ne
// passe plus seule hors défi chrono, et le délai des plaintes Community suit le temps de jeu actif
{
	const f116 = contexte('fr');
	const e116 = contexte('en');
	const sms = (c) => vm.runInContext(`[0, 1, 2, 3, 4, 5].map((i) => t('sms.' + i)).join(' ')`, c);
	verifier(!/chrono tourne|pas de sieste/i.test(sms(f116)) && !/clock is ticking|no napping/i.test(sms(e116)), 'prompt 131 : les SMS d\'intro parlent encore de chrono ou interdisent la sieste');
	const sk116 = readFileSync(join(pub, 'sketch.js'), 'utf8');
	verifier(/if \(auto && tA >= 1/.test(sk116) && /const auto = !!Jeu\.defiChrono/.test(sk116), 'prompt 131 : la narration ne doit passer seule qu\'en défi chrono');
	verifier(/majPlaintes\(tempsPlaintes\(\)\)/.test(sk116) && /resteReponse\(pl, typeof tempsPlaintes/.test(readFileSync(join(pub, 'community.js'), 'utf8')), 'prompt 131 : délai des plaintes en temps de jeu actif');
	const reste = vm.runInContext(`Jeu.resteReponse({ depuis: 90000 }, 1000)`, f116);
	verifier(reste === vm.runInContext('Jeu.REGLAGES.community.delaiMs', f116), `prompt 131 : une plainte datée du futur doit repartir du délai complet (${reste})`);
}

// Prompt 132 : mode exposition — expo.js chargé en premier (la purge précède toute lecture du stockage), réglages et
// langue gardés, sauvegardes et tutoriel effacés ; filet de rechargement après une erreur qui fige le rendu
{
	const html117 = readFileSync(join(pub, 'index.html'), 'utf8');
	const premier = (html117.match(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/i) || [])[1];
	verifier(premier === './expo.js', `prompt 132 : expo.js doit être le premier script (${premier})`);
	const st = new Map([['pxe-nte001:jeu:reglages', '{}'], ['pxe-nte001-langue', 'en'], ['pxe-nte001-tutoriel-vu', 'oui'], ['pxe-nte001-partie-2026-09-14', '{}'], ['autre-site', 'x']]);
	const ls = { getItem: (k) => (st.has(k) ? st.get(k) : null), setItem: (k, v) => st.set(k, String(v)), removeItem: (k) => st.delete(k), key: (i) => [...st.keys()][i] };
	const c117 = { localStorage: new Proxy(ls, { ownKeys: () => [...st.keys()], getOwnPropertyDescriptor: (o, k) => (st.has(k) ? { enumerable: true, configurable: true, value: st.get(k) } : Reflect.getOwnPropertyDescriptor(o, k)) }), location: { search: '?expo=1', hash: '' }, URLSearchParams, Date, window: { addEventListener: () => {} }, setInterval: () => 0, document: {} };
	c117.window = Object.assign(c117.window, c117);
	vm.createContext(c117);
	vm.runInContext(readFileSync(join(pub, 'expo.js'), 'utf8') + ';globalThis.__E = EXPO;', c117);
	verifier(c117.__E.actif && [...st.keys()].sort().join(',') === 'autre-site,pxe-nte001-langue,pxe-nte001:jeu:reglages', `prompt 132 : purge du mode exposition (${[...st.keys()].join(',')})`);
	verifier(/filetErreur/.test(readFileSync(join(pub, 'installation.js'), 'utf8')) && /sessionStorage\.setItem\(CLE/.test(readFileSync(join(pub, 'installation.js'), 'utf8')), 'prompt 132 : filet de rechargement (une fois par minute au plus)');
}

// Prompt 133 : « Quitter la journée » en secondaire, gravité « élevée » en rouge franc doublée par la taille,
// badge à texte sombre en palette protan / deutan, touche F (plein écran)
{
	// Prompt 124 : le bouton a quitté le bandeau (immersion) — l'action est dans le menu Échap, la touche Q reste
	{
		const pan = readFileSync(join(pub, 'panneau.js'), 'utf8');
		const imm = readFileSync(join(pub, 'immersion.js'), 'utf8');
		verifier(!/t\('quitter\.bouton'\)|t\('accueil\.aide'\)|t\('jeu\.recommencer'\)/.test(pan), 'prompt 124 : plus de bouton Quitter la journée / Aide / Recommencer dans le bandeau');
		verifier(/cle: 'quitter\.bouton'[^\n]*quitterJourneeRapide/.test(imm) && /cle: 'jeu\.recommencer'[^\n]*'reset'/.test(imm) && /cle: 'mp\.aide'/.test(imm), 'prompt 124 : quitter la journée, recommencer et aide dans le menu Échap');
		verifier(!/t\('mp\.clavier'\)/.test(readFileSync(join(pub, 'menu.js'), 'utf8')), 'prompt 124 : plus de ligne d\'aide clavier sur le menu principal');
		const sk = readFileSync(join(pub, 'sketch.js'), 'utf8');
		const be = sk.slice(sk.indexOf('function bandeauEtat'), sk.indexOf('dessinerSomnolence();', sk.indexOf('function bandeauEtat')));
		verifier(/annoncer\(/.test(be) && !/text\(|rect\(/.test(be), 'prompt 124 : l\'état du jeu est annoncé (aria-live), plus dessiné');
	}
	verifier(/g === 'elevee' \? C\.rougeFonce/.test(readFileSync(join(pub, 'carte.js'), 'utf8')) && /const tm = g === 'elevee' \? 36/.test(readFileSync(join(pub, 'carte-alertes.js'), 'utf8')), 'prompt 133 : gravité élevée en rouge franc et plus grande');
	verifier(/\['protan', 'deutan'\]\.includes\(Confort\.Reglages\.daltonisme\)/.test(readFileSync(join(pub, 'ds.js'), 'utf8')), 'prompt 133 : badge lisible en protan / deutan');
	verifier(/function basculerPleinEcran/.test(readFileSync(join(pub, 'sketch.js'), 'utf8')), 'prompt 133 : touche F, plein écran');
}

// Prompt 161 : les textes décrivent le jeu qui tourne (prolonge le contrôle du prompt 131 sur sms.*) — pas de chrono par
// défaut (prompt 87), équipes dès la semaine 1 (prompt 108), trois répliques (prompt 117), archives sans minutes de retard
{
	const PREFIXES = ['histoire.c', 'histoire.prochain', 'mp.mode.', 'mp.difficulte', 'mp.actifs.', 'poste.', 'sieste.', 'cafe.', 'credits.', 'fin.', 'guide.somnolence', 'tuto.', 'objet.micro.', 'webcam.', 'enq.revele.'];
	const PERIMEES = {
		fr: [/15 secondes/i, /quatre répliques/i, /\b1 à 4\b/, /expirent sont perdus/i, /Nouveauté : vous pouvez envoyer des équipes/i, /un nouvel élément de jeu/i, /\bDévier\b|\bRetenir\b|Ne rien faire|ne rien faire/, /retards ×/, /chrono est long/i, /ne se met pas en pause/i, /ne dépend que de l'inactivité/i, /Révèle le retard/i],
		en: [/15 seconds/i, /four replies/i, /\b1 to 4\b/, /expire are lost/i, /New this week: you can send/i, /new game element/i, /\bDivert\b|Hold at terminus|Do nothing|do nothing/, /delays ×/, /timer is long/i, /can.t be paused/i, /only depend on inactivity/i, /Reveals the delay/i],
	};
	// Exceptions motivées : les touches du tutoriel des équipes (Maj + 1 à 4 = quatre équipes, pas des répliques)
	const EXCEPTIONS = new Set(['tuto.4.touches']);
	const c161 = contexte('fr', new Map(), true);
	for (const langue of ['fr', 'en']) {
		const dico = vm.runInContext(`TRADUCTIONS[${JSON.stringify(langue)}]`, c161);
		const cles = Object.keys(dico).filter((k) => PREFIXES.some((p) => k.startsWith(p)) && !EXCEPTIONS.has(k));
		verifier(cles.length > 60, `prompt 161 : clés contrôlées (${langue}) trop peu nombreuses (${cles.length})`);
		for (const k of cles) for (const re of PERIMEES[langue]) verifier(!re.test(dico[k]), `prompt 161 : formule périmée ${re} dans ${k} (${langue}) : « ${dico[k]} »`);
	}
	// Ce que le patron annonce aux semaines 2 et 3 = règle réellement jouée (signalements simultanés, budget, compteur ;
	// en défi chrono, 3 signalements chaque semaine : la semaine 2 n'annonce que le compteur et le budget)
	const r161 = vm.runInContext(
		`(() => {
		const vu = [];
		globalThis.lancerConversation = (o) => vu.push(o.messages.map((m) => String(m.texte)));
		globalThis.interaction = () => {};
		const out = {};
		for (const chrono of [false, true]) for (const n of [2, 3]) {
			Jeu.chargerSemaine(semainesHistoire()[n - 1]);
			Jeu.defiChrono = chrono;
			Jeu.nouvellePartie();
			conversationChapitre(n);
			const actifs = chrono ? 3 : Jeu.difficulte().actifs;
			out[n + (chrono ? 'c' : '')] = { texte: vu[vu.length - 1][0], budget: Jeu.jauges.budget, actifs: String(texteActifs(actifs)), s: Jeu.etat.semaine.difficulte.compteur_s, crise: Jeu.elementDebloque('crise'), equipes: Jeu.elementDebloque('equipes') };
		}
		Jeu.defiChrono = false;
		return { out, nouveau: [1, 2, 3].map(elementNouveauChapitre) };
	})()`,
		c161,
	);
	for (const [id, o] of Object.entries(r161.out)) {
		verifier(o.texte.includes(String(o.budget)) && (id === '2c' || o.texte.includes(o.actifs)), `prompt 161 : semaine ${id}, le patron doit annoncer le budget et les signalements réels (${o.texte})`);
		verifier(id.endsWith('c') ? o.texte.includes(String(o.s)) : !/secondes/.test(o.texte), `prompt 161 : semaine ${id}, durée par signalement seulement en défi chrono (${o.texte})`);
		verifier(o.equipes, `prompt 161 : équipes actives dès la semaine 1 (semaine ${id})`);
	}
	verifier(!r161.out['2'].crise && r161.out['3'].crise && JSON.stringify(r161.nouveau) === '[null,null,"crise"]', `prompt 161 : seul « crise » est nouveau en semaine 3 (${JSON.stringify(r161.nouveau)})`);
	// Code : annonce de la fenêtre « Votre poste », difficulté du menu, sieste / café / micro / guide selon le mode
	const imm161 = readFileSync(join(pub, 'immersion.js'), 'utf8');
	const expl = imm161.slice(imm161.indexOf('function majExplicationPoste'), imm161.indexOf('function fenetrePoste'));
	verifier(/GESTES_POSTE\.map/.test(expl) && !/action\.desc\./.test(expl), 'prompt 161 : l\'annonce « Votre poste » doit lire les gestes affichés (poste.geste.*)');
	verifier(/survolChrono/.test(imm161), 'prompt 161 : infobulle du micro selon le défi chrono');
	const menu161 = readFileSync(join(pub, 'menu.js'), 'utf8');
	const diff = menu161.slice(menu161.indexOf('function texteDifficulteChapitre'), menu161.indexOf('function modesNouvellePartie'));
	verifier(!/aggravation/.test(diff) && /mp\.difficulteChrono/.test(diff), 'prompt 161 : difficulté du menu sans « retards × », budget réel en défi chrono');
	verifier(/sieste\.aideChrono/.test(readFileSync(join(pub, 'sieste.js'), 'utf8')) && /'sieste\.bilanSans'/.test(readFileSync(join(pub, 'sieste.js'), 'utf8')), 'prompt 161 : aide et bilan de la sieste selon le mode');
	verifier(/cafe\.boostChrono/.test(readFileSync(join(pub, 'cafe.js'), 'utf8')), 'prompt 161 : effet du café selon le mode');
	const guide161 = readFileSync(join(pub, 'guide.js'), 'utf8');
	verifier(/id: 'jauges'[^\n]*fait: \(\) => GUIDE\.vu >/.test(guide161) && /GUIDE\.vu \+=/.test(guide161), 'prompt 161 : l\'étape « jauges » du guide se valide après affichage de sa bulle');
	verifier(!/'5 6 7 8'/.test(readFileSync(join(pub, 'aide.js'), 'utf8')), 'prompt 161 : raccourcis des sources, une seule vérité aide / tutoriel');
	verifier(!/retards Naolib/.test(readFileSync(join(pub, 'index.html'), 'utf8')), 'prompt 161 : méta description sans « retards Naolib »');
	// Les textes reformulés tiennent dans leur cadre (JetBrains Mono : 0,6 em par caractère, estimation prudente)
	for (const langue of ['fr', 'en']) {
		const c = contexte(langue);
		const r = vm.runInContext(
			`(() => {
			TexteUI.mesureur = (s, p, t) => [...String(s)].length * t * 0.6;
			const n = (txt, taille, l) => TexteUI.couperLignes(txt, l, 'mono', taille).length;
			const v = { niveau: t('niveau.difficile'), budget: 50, actifs: t('mp.actifs.plusieurs', { n: 3 }), s: 15, n: 3, element: t('histoire.element.crise') };
			return {
				repondre: n(t('poste.geste.repondre'), 21, 950) <= 2,
				carte: n(t('poste.geste.carte'), 21, 950) <= 2,
				info: n(t('mp.mode.histoire.etatNouveau', v), 19, 700) + n(t('mp.difficulteChrono', v), 19, 700) <= 4,
				sous: n(t('mp.mode.histoire.sous'), 22, 700) <= 4,
				prochain: n(t('histoire.prochainSans', v), 18, 1000) === 1 && n(t('histoire.prochain', v), 18, 1000) === 1,
				lecture: n(t('acc.lecture.detail'), 18, 1144) <= 2,
				palmares: (n(t('palmares.aide'), 18, 1400 - 112 - 340) - 1) * 22.5 + 18 <= 100,
			};
		})()`,
			c,
		);
		verifier(Object.values(r).every(Boolean), `prompt 161 : texte reformulé hors de son cadre (${langue}) : ${JSON.stringify(r)}`);
	}
}

// Prompt 162 : « Fictif » sur chaque trace du dossier fictif, « affluence supposée » pour l'agenda, « réel » réservé à la
// source (grammar.md, prompts 119 et 134) — partie jouée avec l'incident fictif activé, en FR et en EN
for (const [langue, pre] of [['fr', 'Fictif · '], ['en', 'Fictional · ']]) {
	const c162 = contexte(langue);
	const r = vm.runInContext(
		`(() => {
		Jeu.incidentsFictifs = true;
		Jeu.chargerSemaine('2026-09-14');
		Jeu.nouvellePartie();
		const iF = Jeu.paquet.findIndex((d) => d.fictif);
		const jourF = iF >= 0 ? Jeu.paquet[iF].date : null;
		const out = { iF, mails: [], compo: '', faits: [] };
		let tours = 0;
		while (!Jeu.terminee && tours++ < 500) {
			const d = Jeu.prochainDuJour();
			if (d) {
				if (Jeu.conflit && Jeu.conflit()) Jeu.choisirPriorite('a');
				Jeu.decider(Jeu.actionsPossibles(d)[0]);
			} else {
				Jeu.finDeJourneeTactique();
				const j = Jeu.jourCourant();
				if (j && j.date === jourF) {
					out.mails = Jeu.mailDuJour().lignes.map(String);
					out.compo = String(Jeu.compositionDossiers(j.dossiers));
					const tous = Jeu.evenementsJournee;
					Jeu.evenementsJournee = tous.filter((e) => e.index === iF);
					out.faits = Taches.faitsDuJour(jourF).map((f) => String(f.texte));
					Jeu.evenementsJournee = tous;
				}
				if (!Jeu.jours[Jeu.jourIndex + 1]) break;
				Jeu.journeeSuivante();
			}
		}
		const eF = Jeu.evenementsJournee.find((e) => e.index === iF);
		const autres = Jeu.evenementsJournee.filter((e) => e.index !== iF);
		out.ligneF = eF ? String(Jeu.ligneMail(eF)) : '';
		out.autresMarques = autres.filter((e) => String(Jeu.ligneMail(e)).includes(PRE)).length;
		out.postF = String((Jeu.postsPartie().find((p) => p.index === iF) || {}).texte || '');
		out.comF = Jeu.commentaires.filter((c) => c.index === iF).map((c) => String(c.texte));
		out.reprochesF = (Jeu.messagesPatron || []).filter((m) => m.meta && m.meta.index === iF).map((m) => String(m.texte));
		const iEv = Jeu.paquet.findIndex((d) => d.type === 'événement');
		const plainte = (index) => Jeu.textePlainte({ index, def: { texte: { fr: 'x', en: 'x' } }, vars: {} });
		out.plainteF = plainte(iF);
		out.plainteAutre = plainte(iEv);
		const fictifs = Jeu.historique.filter((h) => h.action && h.dossier && h.dossier.fictif).map((h) => String(h.narration.titre));
		out.clesF = Jeu.bilan().decisionsCles.filter((k) => fictifs.some((f) => String(k.titre).endsWith(f))).map((k) => String(k.titre));
		const consigne = (Jeu.messagesPatron || []).find((m) => m.type === 'consigne');
		out.consigne = consigne ? String(consigne.texte) : '';
		out.notif = NotifsTel.texte({ dossier: iF, texte: 'x' });
		const ev = Jeu.paquet[iEv];
		out.causeEv = String(Taches.causeDe(ev));
		out.causeRetard = String(Taches.causeDe({ type: 'ligne en difficulté', lignes: ['1'], retard: null }));
		out.vars = Jeu.variablesReplique(iEv);
		out.nomEv = String(ev.texte_source).split(' — ')[0].trim();
		out.dico = TRADUCTIONS[LANGUE];
		return out;
	})()`.replaceAll('PRE', JSON.stringify(pre)).replaceAll('LANGUE', JSON.stringify(langue)),
		c162,
	);
	verifier(r.iF >= 0, `prompt 162 : la semaine du 14/09 doit contenir l'incident fictif (${langue})`);
	verifier(r.ligneF.includes(pre), `prompt 162 : ligne du mail / journal du dossier fictif sans « ${pre}» (${r.ligneF})`);
	verifier(r.autresMarques === 0, `prompt 162 : « ${pre}» sur ${r.autresMarques} ligne(s) de dossiers réels`);
	verifier(r.mails.some((l) => l.includes(pre)), `prompt 162 : mail du soir du jour fictif sans « ${pre}» (${langue})`);
	verifier(r.postF.startsWith(pre), `prompt 162 : post Community du dossier fictif sans « ${pre}» (${r.postF})`);
	verifier(r.comF.length > 0 && r.comF.every((c) => c.startsWith(pre)), `prompt 162 : commentaires Community du dossier fictif sans « ${pre}» (${JSON.stringify(r.comF)})`);
	verifier(r.reprochesF.every((m) => m.startsWith(pre)), `prompt 162 : reproche du patron sur le dossier fictif sans « ${pre}» (${JSON.stringify(r.reprochesF)})`);
	verifier(r.plainteF.startsWith(pre) && !r.plainteAutre.includes(pre), `prompt 162 : plainte du dossier fictif (et elle seule) marquée (${r.plainteF} / ${r.plainteAutre})`);
	verifier(r.notif.startsWith(pre), `prompt 162 : notification du téléphone rattachée au dossier fictif sans « ${pre}»`);
	const faitsDossier = r.faits.filter((f) => /\d{2}:\d{2}/.test(f));
	verifier(faitsDossier.length > 0 && faitsDossier.every((f) => f.includes(pre)), `prompt 162 : fait marquant du dossier fictif sans « ${pre}» (${JSON.stringify(r.faits)})`);
	verifier(r.clesF.every((k) => k.startsWith(pre)), `prompt 162 : décision clé du dossier fictif sans « ${pre}» (${JSON.stringify(r.clesF)})`);
	verifier((langue === 'fr' ? /1 incident fictif/ : /1 fictional incident/).test(r.compo) && !/réel\(s\) prévu|real report/.test(r.compo), `prompt 162 : composition du jour fictif (${r.compo})`);
	verifier(langue === 'fr' ? /dossier\(s\) attendus aujourd’hui \([^)]*\) : \d+ /.test(r.consigne) : /case\(s\) expected today \([^)]*\): \d+ /.test(r.consigne), `prompt 162 : la consigne du patron dit la composition (${r.consigne})`);
	verifier(r.causeEv.includes(langue === 'fr' ? 'Affluence supposée' : 'Assumed crowds') && r.causeRetard === r.dico['tache.cause.retardSignale'], `prompt 162 : causes d'info trafic (${r.causeEv} / ${r.causeRetard})`);
	verifier(r.vars.nom === r.nomEv && r.nomEv.length > 0, `prompt 162 : variable {nom} = nom de l'événement (${JSON.stringify(r.vars)})`);
	// Dictionnaire : « réel » réservé à la source ; affluence dite comme une hypothèse ; fictif dans les crédits et la fin
	const d = r.dico;
	const interdits =
		langue === 'fr'
			? [/rien n.est inventé/i, /Aucun événement inventé/i, /Chiffres réels/, /valeur réelle/i, /signalement\(s\) réel\(s\)/, /dossier\(s\) réels/, /attire du monde/, /Affluence signalée/, /affluence est attendue/i, /\bVigilance\b/]
			: [/nothing made up/i, /No invented event/i, /Real figures/, /actual value/i, /real report\(s\) expected/, /real case\(s\)/, /draws crowds/, /Crowds reported/, /Crowds are expected/i, /\bwarning \{valeur\}/];
	for (const re of interdits) {
		const cles = Object.keys(d).filter((k) => re.test(d[k]));
		verifier(!cles.length, `prompt 162 : formule ${re} encore dans ${cles.join(', ')} (${langue})`);
	}
	verifier(/fictif|fictional/i.test(d['credits.ia.donnees.v']) && /suppos|assumed/i.test(d['credits.ia.donnees.v']), `prompt 162 : crédits sans l'incident fictif ni l'affluence supposée (${langue})`);
	verifier(/fictif|fictional/i.test(d['fin.sources']), `prompt 162 : fin.sources sans l'incident fictif (${langue})`);
	verifier(/fictif|fictional/i.test(d['mp.mode.sous']) && /2 (à|to) 4/.test(d['mp.mode.sous']), `prompt 162 : mp.mode.sous sans la part réelle / fictive (${langue})`);
	verifier(/suppos|assum/i.test(d['enq.signalement.événement']) && /suppos|assum/i.test(d['phrase.affluence']) && /suppos|assum/i.test(d['tache.prep.contexte']) && /hypoth|assumption/i.test(d['enq.fait.evenement']), `prompt 162 : affluence non dite comme une hypothèse (${langue})`);
}
{
	// Plaintes d'affluence : nom de l'événement (pas la catégorie brute de l'agenda) et doute, jamais la foule affirmée
	const m162 = JSON.parse(readFileSync(join(pub, 'data/messages.json'), 'utf8'));
	const affl = m162.plaintes.filter((x) => x.condition && x.condition.type === 'événement');
	verifier(affl.length >= 5, `prompt 162 : plaintes d'affluence trop peu nombreuses (${affl.length})`);
	for (const p of affl) {
		for (const l of ['fr', 'en']) verifier(!/\{nature\}/.test(p.texte[l]) && /\{nom\}/.test(p.texte[l]), `prompt 162 : plainte ${p.id} (${l}) doit citer {nom}, pas {nature}`);
		verifier(/risqu|\?|pourrait|\bsi /i.test(p.texte.fr) && /might|may|could|\?|\bif /i.test(p.texte.en), `prompt 162 : plainte ${p.id} affirme la foule au lieu d'en douter`);
	}
	const pan = readFileSync(join(pub, 'panneau.js'), 'utf8');
	verifier(/const titre = String\(marquerFictif\(d,/.test(pan), 'prompt 162 : titre de la fenêtre du dossier préfixé « Fictif · »');
	verifier(/phrase\.alerteMeteo', \{[^}]*nombreFr\(d\.valeur\)/.test(pan), 'prompt 162 : alerte météo, nombre à la française');
	verifier(/marquerFictif\(e, titre\)/.test(readFileSync(join(pub, 'journal.js'), 'utf8')), 'prompt 162 : Journal, titre du dossier fictif marqué');
	verifier(/marquerFictif\(Jeu\.paquet\[p\.index\]/.test(readFileSync(join(pub, 'community.js'), 'utf8')), 'prompt 162 : info trafic publiée sur le dossier fictif marquée');
	verifier(/compositionDossiers/.test(readFileSync(join(pub, 'immersion.js'), 'utf8')), 'prompt 162 : transition et pile de dossiers disent la composition');
}

// Prompt 163 : le rapport de fin de semaine compte juste (familles des réponses jouées) et cite ses sources
for (const langue of ['fr', 'en']) {
	for (const lundi of semaines) {
		const c163 = contexte(langue, new Map(), true);
		const r = vm.runInContext(
			`(() => { Jeu.chargerSemaine(${JSON.stringify(lundi)}); Jeu.nouvellePartie();
			let n = 0;
			while (!Jeu.terminee && n < 500) { const d = Jeu.prochainDuJour(); if (d) { const a = Jeu.actionsPossibles(d); Jeu.decider(a[n % a.length], d.contradiction ? d.contradiction.bonne : undefined); n++; } else { Jeu.finDeJourneeTactique(); if (!Jeu.jours[Jeu.jourIndex + 1]) break; Jeu.journeeSuivante(); } }
			const s = Jeu.statsSemaine(); const b = Jeu.bilan(); const d = Jeu.resultatsDefis ? (Jeu.defis = ['plaintes', 'budget60', 'fluidite60'], Jeu.resultatsDefis()) : [];
			RAPPORT = { bilan: b, mode: 'semaine', page: 0, stats: s, chapitre: 1 };
			const l3 = lignesSourcesRapport().map((x) => String(x.texte));
			const rang = Jeu.RANG_EVALUATION;
			const cles = b.decisionsCles.map((k) => ({ q: k.qualite, ev: k.evaluation, r: rang[k.evaluation], txt: texteDecisionCle(k), ec: ecartsDecisionCle(k) }));
			const evals = Jeu.historique.filter((h) => h.action && h.action !== 'temps').map((h) => h.evaluation);
			return JSON.parse(JSON.stringify({ s, n, cles, evals, l3, periode: String(b.faits.periodeTexte), compo: String(b.faits.composition), plaintes: Jeu.bilanPlaintes(), defis: d, mail: Jeu.mailFinSemaine().lignes.map(String), fait: String(Jeu.faitSourceSemaine() || ''), profil: texteProfilRapport(), fictifs: Jeu.paquet.filter((x) => estFictif(x)).length })); })()`,
			c163,
		);
		const nom = `prompt 163 ${lundi} (${langue})`;
		const somme = Object.values(r.s.parFamille).reduce((a, v) => a + v, 0);
		verifier(somme === r.s.traites && r.s.traites + r.s.expires === r.n && r.s.traites > 0, `${nom} : familles ${JSON.stringify(r.s.parFamille)} ≠ traités ${r.s.traites}`);
		verifier(Object.values(r.s.parFamille).filter((v) => v > 0).length >= 2, `${nom} : une seule famille comptée ${JSON.stringify(r.s.parFamille)}`);
		verifier(r.evals.every((e) => ['bon', 'rate', 'aucun_detour'].includes(e)), `${nom} : évaluation absente du résultat ${JSON.stringify(r.evals.slice(0, 5))}`);
		const best = r.cles.find((k) => k.q === 'meilleure');
		const worst = r.cles.find((k) => k.q === 'pire' || k.q === 'moins bonne');
		verifier(best && worst && best.r <= worst.r && Math.min(...r.evals.map((e) => ({ bon: 0, aucun_detour: 1, rate: 2 })[e])) === best.r, `${nom} : décisions clés mal classées ${JSON.stringify(r.cles)}`);
		verifier(!worst || (worst.q === 'pire') === (worst.r > 0), `${nom} : « pire » donné à un bon choix ${JSON.stringify(worst)}`);
		verifier(r.cles.every((k) => !/—\s*$/.test(k.txt) && /\(.+\)$/.test(k.txt) && k.ec.split(' · ').length === 3), `${nom} : décision clé incomplète ${JSON.stringify(r.cles.map((k) => k.txt + ' | ' + k.ec))}`);
		verifier(langue === 'fr' ? /^du \d\d\/\d\d au \d\d\/\d\d\/\d{4} · \d jour\(s\) joué\(s\)$/.test(r.periode) : /^\d\d\/\d\d to \d\d\/\d\d\/\d{4} · \d day/.test(r.periode), `${nom} : période ${r.periode}`);
		verifier(r.l3.length >= 7 && r.l3.some((x) => x === r.compo || x.includes(r.compo)) && r.l3.some((x) => /Open-Meteo/.test(x)) && r.l3.some((x) => /archives/.test(x)) && r.l3.filter((x) => /Période|Period/.test(x)).every((x) => (x.match(/Période|Period/g) || []).length === 1), `${nom} : page des sources incomplète ${JSON.stringify(r.l3)}`);
		if (r.fictifs) verifier(/fictif|fictional/i.test(r.compo), `${nom} : composition sans l'incident fictif (${r.compo})`);
		verifier(!r.l3.join(' ').includes('[À COMPLÉTER]') && !r.l3.join(' ').includes('undefined'), `${nom} : texte manquant page 3`);
		const pl = r.defis.find((x) => x.id === 'plaintes');
		if (pl && !r.plaintes.total) verifier(pl.sansObjet && !pl.tenu && pl.bonus === 0, `${nom} : défi des plaintes 0/0 compté tenu ${JSON.stringify(pl)}`);
		verifier(r.fait && r.mail.includes(r.fait) && /Open|réel|real/.test(r.fait), `${nom} : le mail de fin de semaine ne cite aucune donnée de la source`);
		verifier(r.profil && !r.profil.includes('[À COMPLÉTER]') && (r.profil.match(/Profil|Profile/g) || []).length === 1, `${nom} : profil du rapport ${r.profil}`);
	}
	const dico = vm.runInContext(`TRADUCTIONS[${JSON.stringify(langue)}]`, contexte(langue));
	for (const k of ['famille.renfort', 'famille.devier', 'famille.retenir', 'famille.rien', 'rapport.sourcesTitre', 'rapport.versPage3', 'rapport.page3', 'rapport.periodeSemaine', 'rapport.typeFin.bonne', 'rapport.typeFin.moyenne', 'rapport.typeFin.mauvaise', 'defi.sansObjet', 'stats.sansObjet', 'qualite.moins bonne', 'finSemaine.faitAgenda'])
		verifier(typeof dico[k] === 'string' && dico[k].length > 0, `prompt 163 : clé ${k} absente (${langue})`);
	verifier(!/sept jours|seven days/.test(['bonne', 'moyenne', 'mauvaise'].map((ty) => dico['fin.' + ty + '.texte']).join(' ')), `prompt 163 : « sept jours » dans le texte de fin (${langue})`);
	verifier(/240/.test(vm.runInContext(`String(T('rapport.typeFin.bonne', { s: Jeu.SEUILS_FIN.bonne }))`, contexte(langue))), `prompt 163 : seuil de la bonne fin absent (${langue})`);
}
{
	const h163 = readFileSync(join(pub, 'histoire.js'), 'utf8');
	verifier(!/parAction|action\.devier|stats\.final|rapport\.defis/.test(h163), 'prompt 163 : le rapport utilise encore les anciennes clés (parAction, action.devier, jauges finales, défis en page 1)');
	verifier(/fenetreRapportSources/.test(h163) && /PAGES_RAPPORT = 3/.test(h163), 'prompt 163 : page « Sources et faits de la semaine » absente');
	verifier((h163.match(/dessinerCourbesJauges\(/g) || []).length === 1 && (h163.match(/stats\.defis/g) || []).length === 1, 'prompt 163 : courbes ou défis en double dans le rapport');
	verifier(/changerPageRapport\(keyIsDown\(SHIFT\) \? -1 : 1\)/.test(readFileSync(join(pub, 'journee.js'), 'utf8')), 'prompt 163 : Maj + Tab ne recule pas dans le rapport');
	verifier(/rapport page 3/.test(readFileSync(join(pub, 'audit-textes.js'), 'utf8')), 'prompt 163 : audit des textes sans la page 3 du rapport');
}

// Prompt 170 : icônes Lucide embarquées (aucun CDN, aucune dépendance) — table de tracés copiés, licence ISC,
// iconeLucide robuste (nom inconnu → rien, un seul avertissement), tous les noms employés par le jeu existent
{
	const src170 = readFileSync(join(pub, 'icones-lucide.js'), 'utf8');
	const avertis = [];
	const appels = [];
	class Path2D {
		constructor(d) {
			this.d = d;
		}
		arc() {}
		ellipse() {}
		moveTo() {}
		lineTo() {}
		rect() {}
		closePath() {}
	}
	const dc = { fillStyle: '#123456', save: () => appels.push('save'), restore: () => appels.push('restore'), translate: (x, y) => appels.push(['translate', x, y]), scale: (k) => appels.push(['scale', k]), setLineDash: () => {}, stroke: () => appels.push('stroke'), fill: () => appels.push('fill') };
	const c170 = { console: { warn: (m) => avertis.push(m) }, Path2D, drawingContext: dc, color: (v) => ({ toString: () => 'rgba(' + v + ')' }) };
	vm.createContext(c170);
	vm.runInContext(src170, c170, { filename: 'icones-lucide.js' });
	const noms = vm.runInContext('Object.keys(LUCIDE)', c170);
	verifier(noms.length >= 40, `prompt 170 : ${noms.length} icônes Lucide seulement`);
	verifier(/ISC License/.test(src170) && /Lucide Icons and Contributors/.test(src170), 'prompt 170 : licence ISC absente de l’en-tête de icones-lucide.js');
	const lic = join(pub, 'licences', 'lucide-LICENSE.txt');
	verifier(existsSync(lic) && /^ISC License/.test(readFileSync(lic, 'utf8')) && /Cole Bemis/.test(readFileSync(lic, 'utf8')), 'prompt 170 : licences/lucide-LICENSE.txt absente ou incomplète');
	verifier(vm.runInContext(`Object.values(LUCIDE).every((els) => els.length && els.every(([b, a]) => ['path', 'circle', 'rect', 'line', 'ellipse', 'polyline', 'polygon'].includes(b) && (b !== 'path' || /^[Mm]/.test(a.d))))`, c170), 'prompt 170 : élément SVG non pris en charge dans la table');
	verifier(vm.runInContext(`Object.entries(LUCIDE_ALIAS).every(([a, n]) => !LUCIDE[a] && LUCIDE[n])`, c170), 'prompt 170 : alias Lucide vers une icône absente');
	for (const n of ['download', 'settings', 'play', 'rotate-ccw', 'help-circle', 'x', 'check', 'chevron-left', 'chevron-right', 'arrow-left', 'mail', 'inbox', 'list', 'layout-grid', 'volume-2', 'volume-x', 'maximize', 'minimize', 'monitor', 'bell', 'moon', 'clock', 'triangle-alert', 'info', 'pause', 'home', 'map-pin', 'book-open', 'users', 'message-square', 'share-2', 'presentation', 'file-text', 'trash-2', 'bar-chart-3', 'database', 'sliders-horizontal', 'accessibility', 'save', 'calendar', 'search', 'plus', 'minus'])
		verifier(vm.runInContext(`lucideExiste(${JSON.stringify(n)})`, c170), `prompt 170 : icône ${n} absente (prompts 171, 175, 185, 186)`);
	// Dessin : état du canvas sauvé puis rendu, échelle taille / 24, couleur donnée ou remplissage courant
	const ok = vm.runInContext(`iconeLucide('settings', 10, 20, 48, '#ff0000')`, c170);
	verifier(ok === true && appels[0] === 'save' && appels[appels.length - 1] === 'restore' && appels.some((a) => a[0] === 'scale' && a[1] === 2) && appels.some((a) => a[0] === 'translate' && a[1] === 10 && a[2] === 20) && appels.filter((a) => a === 'stroke').length === 2 && dc.strokeStyle === '#ff0000' && dc.lineWidth === 2 && dc.lineCap === 'round', `prompt 170 : iconeLucide dessine mal ${JSON.stringify(appels)}`);
	dc.fillStyle = '#abcdef';
	vm.runInContext(`iconeLucide('help-circle', 0, 0, 24)`, c170);
	verifier(dc.strokeStyle === '#abcdef', 'prompt 170 : couleur omise ≠ remplissage courant (couleur du texte)');
	vm.runInContext(`iconeLucide('x', 0, 0, 24, 255)`, c170);
	verifier(dc.strokeStyle === 'rgba(255)', 'prompt 170 : couleur p5 non convertie');
	appels.length = 0;
	const ko = vm.runInContext(`[iconeLucide('pas-une-icone', 0, 0, 24, '#fff'), iconeLucide('pas-une-icone', 0, 0, 24, '#fff'), iconeLucide(undefined, 0, 0), iconeLucide('constructor', 0, 0)]`, c170);
	verifier(ko.every((v) => v === false) && appels.length === 0 && avertis.filter((m) => /pas-une-icone/.test(m)).length === 1, `prompt 170 : nom inconnu mal géré ${JSON.stringify(ko)} ${avertis.length} avertissement(s)`);
	// Chaque nom employé par le jeu existe dans la table (appels directs et tables menu / Mails / téléphone)
	const jeux = readdirSync(pub).filter((f) => f.endsWith('.js') && f !== 'sw.js' && f !== 'icones-lucide.js');
	let employes = 0;
	for (const f of jeux) {
		const js = readFileSync(join(pub, f), 'utf8');
		const cites = [...js.matchAll(/iconeLucide\(\s*'([^']+)'/g)].map((m) => m[1]);
		for (const m of js.matchAll(/const (?:ICONES_MENU|PICTOS|ICONES_TEL) = \{([^}]*)\}/g)) cites.push(...[...m[1].matchAll(/: '([^']+)'/g)].map((x) => x[1]));
		for (const n of cites) (employes++, verifier(vm.runInContext(`lucideExiste(${JSON.stringify(n)})`, c170), `prompt 170 : ${f} emploie l'icône inconnue « ${n} »`));
	}
	verifier(employes >= 30, `prompt 170 : ${employes} icônes Lucide employées seulement (menu, Mails, téléphone)`);
	const menu170 = readFileSync(join(pub, 'menu.js'), 'utf8');
	verifier(/iconeLucide\(ICONES_MENU\[type\]/.test(menu170) && !/strokeWeight\(5\)/.test(menu170) && /github: \[/.test(menu170), 'prompt 170 : iconeMenu ne passe pas par Lucide (ou le logo du dépôt a disparu)');
	verifier(!/text\('✕'/.test(readFileSync(join(pub, 'notifs-tel.js'), 'utf8')) && !/'☾ '/.test(readFileSync(join(pub, 'notifs-tel.js'), 'utf8')) && !/'□'/.test(readFileSync(join(pub, 'carte-alertes.js'), 'utf8')), 'prompt 170 : glyphe texte encore employé comme icône de bouton');
	// Hors ligne : aucun CDN, aucune dépendance ajoutée ; crédit dans le jeu (FR + EN) et dans le cartel
	const html170 = readFileSync(join(pub, 'index.html'), 'utf8');
	verifier(/<script src="\.\/icones-lucide\.js">/.test(html170) && !/unpkg|jsdelivr|cdnjs/.test(html170), 'prompt 170 : icones-lucide.js absent de index.html ou CDN présent');
	verifier(Object.keys(JSON.parse(readFileSync(join(pub, '..', 'package.json'), 'utf8')).dependencies).join() === 'astro', 'prompt 170 : dépendance ajoutée à package.json');
	for (const langue of ['fr', 'en']) {
		const dico = vm.runInContext(`TRADUCTIONS[${JSON.stringify(langue)}]`, contexte(langue));
		verifier(/Lucide/.test(dico['credits.lic.icones.v'] || '') && /ISC/.test(dico['credits.lic.icones.v'] || '') && dico['credits.lic.icones'], `prompt 170 : crédit Lucide absent des Crédits (${langue})`);
		for (const k of ['carte.zoomer', 'carte.dezoomer']) verifier(typeof dico[k] === 'string' && dico[k].length > 0, `prompt 170 : clé ${k} absente (${langue})`);
	}
	verifier(/'icones'/.test(readFileSync(join(pub, 'credits.js'), 'utf8')) && /lucide\.dev/.test(readFileSync(join(pub, '..', 'src', 'pages', 'cartel.astro'), 'utf8')), 'prompt 170 : Lucide non crédité (credits.js, cartel)');
}

// Prompt 171 : menu principal épuré — plus d'entrée « Aide et tutoriel » ni « Crédits », plus de mention « PXE- »,
// logo et bloc langue + installation sur la même ligne, « Retour » sans flèche, interlignage du sous-titre
{
	const lire = (f) => readFileSync(join(pub, f), 'utf8');
	const menu171 = lire('menu.js');
	const entrees = menu171.slice(menu171.indexOf('function entreesMenu'), menu171.indexOf('function allerChoixSemaine'));
	verifier(!/cle: 'aide'/.test(entrees) && !/credits\.menu/.test(menu171) && !/ouvrirCredits/.test(entrees), 'prompt 171 : « Aide et tutoriel » ou « Crédits » encore dans les entrées du menu principal');
	verifier(!/ouvrir\('aide'\)/.test(menu171), 'prompt 171 : l\'aide s\'ouvre encore depuis le menu titre (entrée ou raccourci H)');
	verifier(/ouvrirCredits\(\)/.test(menu171.slice(menu171.indexOf('function piedCredits'), menu171.indexOf('function boutonIcone'))) && /function dessinerCredits/.test(lire('credits.js')), 'prompt 171 : les noms du pied de page ne mènent plus aux Crédits');
	verifier(/mp\.aide/.test(lire('immersion.js')) && (lire('sketch.js').match(/ouvrir\('aide'\)/g) || []).length >= 2 && /function fenetreAide/.test(lire('aide.js')), 'prompt 171 : l\'aide doit rester atteignable en partie (H, menu pause)');
	verifier(!/PXE-NTE001/.test(menu171) && /dessinerLogoPXE\(HAUT_MENU\.marge, HAUT_MENU\.y, HAUT_MENU\.h\)/.test(menu171) && /const JEU = 'PXE-NTE001-G01-W01'/.test(lire('sauvegarde.js')), 'prompt 171 : mention « PXE- » encore affichée au menu (ou clé de stockage renommée)');
	verifier(/const HAUT_MENU = \{ y: 56, h: 60, marge: 80 \}/.test(menu171) && /selecteurLangue\([^;]*HAUT_MENU\.y, HAUT_MENU\.h\)/.test(menu171) && /boutonInstaller\(xi, HAUT_MENU\.y, HAUT_MENU\.h/.test(menu171), 'prompt 171 : logo, langue et installation ne partagent plus y, hauteur et marge');
	verifier(/iconeLucide\('download'/.test(menu171) && /infobulle\(bulle/.test(menu171.slice(menu171.indexOf('function boutonInstaller'))) && /cle: 'installer', action: \(\) => installerJeu\(\)/.test(menu171), 'prompt 171 : icône « télécharger » absente, sans infobulle ou hors du parcours clavier');
	const inst171 = lire('installation.js');
	verifier(/function installerJeu\(\) \{[^}]*installationPossible\(\)\) return installerApplication\(\);[^}]*ouvrirInstallation\(\);/.test(inst171) && /fenetre === 'installation'\) return fenetreInstallation\(\)/.test(lire('sketch.js')), 'prompt 171 : l\'icône doit installer le jeu (beforeinstallprompt) ou ouvrir l\'explication');
	// Comportement : avec une invitation du navigateur, elle est jouée ; sans, la fenêtre d'explication s'ouvre
	{
		const c = vm.createContext({ window: { addEventListener() {} }, navigator: {}, matchMedia: () => ({ matches: false }), ouvertes: [], annonces: [] });
		vm.runInContext(inst171.slice(0, inst171.indexOf('// ——— Service worker')) + "\nfunction ouvrir(n) { ouvertes.push(n); } function annoncer(s) { annonces.push(s); } function t(k) { return k; }", c);
		vm.runInContext("installerJeu(); var sans = ouvertes.join(); var joue = 0; PWA.invite = { prompt() { joue++; }, userChoice: Promise.resolve({ outcome: 'accepted' }) }; installerJeu();", c);
		verifier(vm.runInContext("sans === 'installation' && joue === 1 && ouvertes.length === 1 && /pwa\\.aide\\.titre/.test(annonces[0])", c), 'prompt 171 : installerJeu ne joue pas l\'invitation ou n\'ouvre pas l\'explication');
	}
	verifier(/push\(\);[^\n]*\n\ttextLeading\(40\)/.test(menu171) && !/textLeading\(interligneAvant\)/.test(menu171), 'prompt 171 : interlignage du sous-titre du menu (≈ 1,4 × 28 px) non fixé ou non rendu');
	verifier(/sansChevron \? label : label \+ '  ›'/.test(lire('ds.js')) && /'contour', false, retour\)/.test(lire('credits.js')) && !/[←‹]/.test(menu171.slice(menu171.indexOf('function dessinerChoixSemaine'), menu171.indexOf('function toucheMenu'))), 'prompt 171 : flèche encore présente sur un bouton « Retour » du menu');
	for (const langue of ['fr', 'en']) {
		const dico = vm.runInContext(`TRADUCTIONS[${JSON.stringify(langue)}]`, contexte(langue));
		for (const k of ['mp.installer', 'pwa.aide.titre', 'pwa.aide.intro', 'pwa.aide.ordinateur.k', 'pwa.aide.ordinateur', 'pwa.aide.android.k', 'pwa.aide.android', 'pwa.aide.ios.k', 'pwa.aide.ios', 'pwa.aide.horsLigne', 'pwa.aide.dejaInstalle', 'mp.aide', 'mp.credits']) verifier(typeof dico[k] === 'string' && dico[k].length > 0, `prompt 171 : clé ${k} absente (${langue})`);
		for (const k of ['mp.credits.menu', 'pwa.installer', 'pwa.badge']) verifier(dico[k] === undefined, `prompt 171 : clé ${k} devenue inutile, à supprimer (${langue})`);
		for (const k of ['mp.retour', 'credits.retour']) verifier(!/[←‹›→]/.test(dico[k] || ''), `prompt 171 : flèche dans le libellé ${k} (${langue})`);
	}
}

// Prompt 172 : aide illustrée (une vignette dessinée en code par carte de règle et par malus, équivalent texte dans
// l'annonce de l'onglet) ; les livres du bureau ouvrent cette fenêtre, l'ancien livre « stress » et ses textes ont disparu
{
	const lire = (f) => readFileSync(join(pub, f), 'utf8');
	const aide172 = lire('aide.js');
	const imm172 = lire('immersion.js');
	verifier(/function illustrationAide\(/.test(aide172) && /carteTexteAide\(t\('aide\.carte\.' \+ i\), p\[i\], i\)/.test(aide172) && /illustrationAide\(m\.id,/.test(aide172) && /miniJaugeAide\(/.test(aide172.slice(aide172.indexOf('function dessinerDemarrerAide'))), 'prompt 172 : une illustration par carte de règle, par malus et dans « Bien démarrer »');
	verifier(!/loadImage|\.png|\.webp|\.svg/.test(aide172), 'prompt 172 : les illustrations de l\'aide sont dessinées en code, sans image');
	// Chaque carte de règle (paragraphes 1 à 9 hors glossaire) et chaque malus a son dessin
	const illus = aide172.slice(aide172.indexOf('function illustrationAide'), aide172.indexOf('// ——— Cartes'));
	const ordre = JSON.parse(aide172.match(/const ORDRE_REGLES_AIDE = (\[[^\]]*\])/)[1]);
	verifier(ordre.every((i) => new RegExp('cle === ' + i + '\\)').test(illus)), 'prompt 172 : une carte de règle sans illustration');
	const c172 = contexte('fr');
	const icones = vm.runInContext(aide172.match(/const ICONES_MALUS_AIDE = (\{[^}]*\})/)[1].replace(/^/, '(') + ')', vm.createContext({}));
	const lucide172 = lire('icones-lucide.js');
	verifier(vm.runInContext('Jeu.MALUS.map((m) => m.id)', c172).every((id) => icones[id] && lucide172.includes(icones[id])), 'prompt 172 : un malus sans icône (ICONES_MALUS_AIDE) ou icône absente de icones-lucide.js');
	for (const nom of [...illus.matchAll(/iconeLucide\('([a-z0-9-]+)'/g)].map((x) => x[1])) verifier(new RegExp("['\"]?" + nom + "['\"]?: ").test(lucide172), `prompt 172 : icône Lucide « ${nom} » absente`);
	// Équivalent texte : l'annonce de chaque onglet illustré, dans les deux langues
	verifier(/annoncer\(annonceOngletAide\(i\)\)/.test(aide172) && /annoncer\(annonceOngletAide\(0\)\)/.test(aide172), 'prompt 172 : l\'annonce de l\'onglet ne dit plus les illustrations');
	for (const langue of ['fr', 'en']) {
		const dico = vm.runInContext(`TRADUCTIONS.${langue}`, c172);
		for (const o of ['demarrer', 'regles', 'malus']) verifier(String(dico['aide.illus.' + o] || '').length > 40, `prompt 172 : équivalent texte aide.illus.${o} absent (${langue})`);
		verifier(!Object.keys(dico).some((k) => /^stress\./.test(k)), `prompt 172 : textes de l'ancien livre encore présents (${langue})`);
	}
	// Les livres ouvrent l'aide ; plus de fenêtre « livre-stress » ; le guide et H pointent la même fenêtre
	verifier(/if \(nom === 'aide' \|\| nom === 'stress'\) return ouvrir\('aide'\)/.test(imm172), 'prompt 172 : les livres du bureau doivent ouvrir la fenêtre d\'aide');
	verifier(['immersion.js', 'sketch.js', 'guide.js', 'portrait.js', 'audit-textes.js'].every((f) => !/livre-stress|fenetreLivreStress|LIVRE_STRESS/.test(lire(f))), 'prompt 172 : référence à l\'ancien livre (livre-stress)');
	verifier(/id: 'livre', cible: \(\) => 'livreAide', fait: \(\) => !!tutoriel \|\| fenetre === 'aide'/.test(lire('guide.js')), 'prompt 172 : l\'étape « livre » du guide doit se valider à l\'ouverture de l\'aide');
	verifier(/function tempsSuspendu\(\) \{\n\treturn [^\n]*fenetre === 'aide'/.test(imm172), 'prompt 172 : le temps de jeu doit être suspendu pendant la lecture de l\'aide');
	verifier(/fenetre === 'aide' && \(key === 't' \|\| key === 'T'\)\) return lancerTutoriel\(\)/.test(lire('sketch.js')) && /nom: 'aide'[^\n]*\n\t\{ nom: 'stress'/.test(imm172) && /function dessinerLivres/.test(imm172), 'prompt 172 : tutoriel (T) depuis l\'aide ou objets livres du décor disparus');
}

// Prompt 173 : un seul voile de fenêtre (DS.voile), clic sur le fond = fermer (sauf fenêtres bloquantes), trois
// largeurs de fenêtre (DS.fenetre), mise en avant du guide par l'obscurité (voile percé) au lieu du contour jaune
{
	const lire = (f) => readFileSync(join(pub, f), 'utf8');
	const ds173 = lire('ds.js');
	const sk173 = lire('sketch.js');
	verifier(/\tvoile: 0\.8,/.test(ds173) && /function dsVoile\(k\)/.test(ds173) && /function voile\(\) \{\n\tdsVoile\(\);/.test(sk173), 'prompt 173 : voile() doit passer par dsVoile() et DS.voile (0,8)');
	verifier(/fenetre: \{ etroite: 640, moyenne: 960, large: 1280, marge: 48, entete: 80 \}/.test(ds173), 'prompt 173 : DS.fenetre doit déclarer les trois largeurs 640 / 960 / 1280');
	verifier(/function dsVoilePerce\(cible, marge, opacite\)/.test(ds173) && /dureeVoile: 1\d\d,/.test(ds173) && /reduit \? 1 :/.test(ds173), 'prompt 173 : voile percé absent, trop lent (> 200 ms) ou non immédiat en animations réduites');
	// Plus aucun voile de fenêtre écrit en dur (fill(13, 12, 12, 150|190) plein écran)
	for (const f of ['sketch.js', 'immersion.js', 'telephone-main.js', 'autorisations.js']) verifier(!/fill\((13, 12, 12, (150|190)[^)]*|'rgba\(13,12,12,0\.7\)')\);[^\n]*\n\trect\(0, 0, L, H\)/.test(lire(f)), `prompt 173 : ${f} dessine encore son propre voile de fenêtre`);
	// Chaque fenêtre prend sa largeur dans DS.fenetre (plus de « const l = 1100 » dans une fonction fenetreX)
	const fichiersFenetres = ['sketch.js', 'immersion.js', 'histoire.js', 'mecaniques.js', 'taches-ui.js', 'applis.js', 'parametres.js', 'journee.js', 'menu.js', 'installation.js', 'aide.js']; // prompt 175 : parametres.js remplace les fenêtres d'accessibilite.js et de taches-ui.js
	let nbFenetres = 0;
	for (const f of fichiersFenetres)
		for (const m of lire(f).matchAll(/\nfunction (fenetre[A-Z]\w*|dessinerPause|dessinerReveil)\(\) \{\n([\s\S]*?)\n\}/g)) {
			const larg = m[2].match(/\tconst l = ([^;]+);/);
			if (!larg || /^fenetreRapport(Chiffres|Sources)?$/.test(m[1])) continue; // le rapport de fin est une feuille de papier (hors gabarit)
			nbFenetres++;
			verifier(/^DS\.fenetre\.(etroite|moyenne|large)$/.test(larg[1]), `prompt 173 : ${f} ${m[1]} — largeur « ${larg[1]} » hors des trois tailles du DS`);
		}
	verifier(nbFenetres >= 19, `prompt 173 : seulement ${nbFenetres} fenêtres relevées (≥ 19 attendues)`); // prompt 175 : trois fenêtres de réglages fondues en une (21 → 19)
	// Clic sur le fond : point unique dans mousePressed, listes explicites, aucune fenêtre dans les deux à la fois
	verifier(/\tif \(clicFondFenetre\(\)\) return;/.test(sk173.match(/function mousePressed\(\) \{[\s\S]*?\n\}/)[0]), 'prompt 173 : mousePressed ne passe plus par clicFondFenetre()');
	const bloquantes = vm.runInNewContext(sk173.match(/const FENETRES_BLOQUANTES = (\[[^\]]*\]);/)[1]);
	const fermables = [...sk173.match(/const FERMETURE_FOND = \{([\s\S]*?)\n\};/)[1].matchAll(/\n\t(\w+):/g)].map((x) => x[1]);
	for (const n of ['reset', 'reprise', 'demission', 'partir', 'blame', 'inspection', 'tache', 'mailFin', 'rapport', 'cafe']) verifier(bloquantes.includes(n), `prompt 173 : la fenêtre « ${n} » exige une réponse, elle doit rester bloquante`);
	for (const n of ['aide', 'parametres', 'partage', 'installation', 'palmares', 'menu', 'telephone']) verifier(fermables.includes(n), `prompt 173 : la fenêtre « ${n} » doit se fermer au clic sur le fond`);
	verifier(!fermables.some((n) => bloquantes.includes(n)), 'prompt 173 : une fenêtre est à la fois bloquante et fermable au clic sur le fond');
	const dessinees = [...sk173.match(/function contenuFenetre\(\) \{[\s\S]*?\n\}/)[0].matchAll(/fenetre === '(\w+)'/g)].map((x) => x[1]);
	for (const n of new Set(dessinees)) verifier(bloquantes.includes(n) || fermables.includes(n), `prompt 173 : fenêtre « ${n} » non classée (bloquante ou fermable au clic sur le fond)`);
	// Logique du clic : hors du panneau → ferme ; dans le panneau, fenêtre bloquante, tutoriel ou SMS → ne ferme pas
	{
		const ctx = vm.createContext({ fenetre: null, tutoriel: null, smsActif: false, mouseX: 0, mouseY: 0, Confort: { Son: { clic() {}, bip() {} } } });
		vm.runInContext(sk173.match(/function ouvrir\(nom\) \{[\s\S]*?\n\}/)[0] + '\n' + sk173.match(/function fermer\(\) \{[\s\S]*?\n\}/)[0] + '\n' + sk173.match(/const FENETRES_BLOQUANTES[\s\S]*?\nfunction clicFondFenetre\(\) \{[\s\S]*?\n\}/)[0], ctx);
		const essai = (nom, x, y, plus) => vm.runInContext(`fenetre = '${nom}'; ZONE_FENETRE = { x: 480, y: 100, l: 960, h: 800 }; mouseX = ${x}; mouseY = ${y}; tutoriel = null; smsActif = false; ${plus || ''}; [clicFondFenetre(), fenetre]`, ctx);
		verifier(JSON.stringify(essai('aide', 20, 20)) === '[true,null]', 'prompt 173 : un clic sur le fond doit fermer l\'aide');
		verifier(JSON.stringify(essai('aide', 900, 500)) === '[false,"aide"]', 'prompt 173 : un clic dans la fenêtre ne doit pas la fermer');
		verifier(JSON.stringify(essai('parametres', 20, 20)) === '[true,null]' && !fermables.includes('accessibilite') && !fermables.includes('optionsJeu'), 'prompt 175 : une seule fenêtre de paramètres, fermée au clic sur le fond (plus de sous-fenêtres)');
		for (const n of bloquantes) verifier(JSON.stringify(essai(n, 20, 20)) === `[false,"${n}"]`, `prompt 173 : la fenêtre bloquante « ${n} » se ferme au clic sur le fond`);
		verifier(JSON.stringify(essai('aide', 20, 20, 'smsActif = true')) === '[false,"aide"]' && JSON.stringify(essai('aide', 20, 20, 'tutoriel = { etape: 0 }')) === '[false,"aide"]', 'prompt 173 : sous le tutoriel ou les SMS, le clic sur le fond ne ferme rien');
		verifier(JSON.stringify(essai('inconnue', 20, 20)) === '[false,"inconnue"]', 'prompt 173 : une fenêtre non classée doit être traitée comme bloquante');
	}
	// Guide : plus de contour jaune, voile percé à la place ; focus du bureau et du game over sans jaune
	const guide173 = lire('guide.js');
	verifier(/dsVoilePerce\(c, 10\)/.test(guide173) && !/stroke\('#FFC138'\)/.test(guide173), 'prompt 173 : le guide doit assombrir le reste (dsVoilePerce) sans contour jaune');
	verifier(!/#f2c94c/i.test(lire('bureau.js')) && !/stroke\('#FFC138'\)/.test(lire('gameover.js')), 'prompt 173 : contour de survol / focus encore jaune (bureau.js, gameover.js)');
	verifier(/rgba\(13, 12, 12, 0\.8\)/.test(lire('style.css').match(/\.sv-fond \{[^}]*\}/)[0]) && /ev\.target === fond && fermerImport\(\)/.test(lire('sauvegarde.js')), 'prompt 173 : la boîte d\'import doit avoir le même voile et se fermer au clic sur le fond');
	verifier(/### Fenêtres et voiles/.test(readFileSync(join(pub, '..', '..', 'design-system', 'DESIGN.md'), 'utf8')), 'prompt 173 : DESIGN.md doit documenter les trois largeurs de fenêtre et le voile');
}

// Prompt 175 : paramètres en sections (une fenêtre à onglets), plein écran, volume maître, interrupteurs « Activé / Désactivé »
{
	const lire175 = (f) => readFileSync(join(pub, f), 'utf8');
	const pa = lire175('parametres.js');
	const tousJs = readdirSync(pub).filter((f) => f.endsWith('.js') && f !== 'sw.js' && f !== 'i18n.js').map((f) => [f, lire175(f)]);
	// Une seule fenêtre, quatre sections, plus de sous-fenêtres ni de raccourcis chiffrés
	verifier(/<script src="\.\/parametres\.js"><\/script>/.test(lire175('index.html')), 'prompt 175 : index.html doit charger parametres.js');
	const onglets = [...pa.match(/const ONGLETS_PARAM = \[([\s\S]*?)\n\];/)[1].matchAll(/cle: '(\w+)'/g)].map((m) => m[1]);
	verifier(JSON.stringify(onglets) === '["ecran","son","accessibilite","avance"]', `prompt 175 : sections attendues Écran · Son · Accessibilité · Avancé (${onglets.join(', ')})`);
	for (const [f, src] of tousJs) {
		verifier(!/fenetreAccessibilite|fenetreOptionsJeu|ouvrirAccessibilite|ouvrirOptionsJeu|toucheOptionsJeu|toucheAccessibilite/.test(src), `prompt 175 : ${f} référence encore une sous-fenêtre de paramètres`);
		verifier(!/commun\.(oui|non)'|param\.touche|acc\.reprise|qr-edition/.test(src), `prompt 175 : ${f} emploie encore « oui / non », « touche {k} » ou la reprise sur un autre appareil`);
		verifier(!/fenetre = 'accessibilite'|ouvrir\('optionsJeu'\)|ouvrir\('accessibilite'\)/.test(src), `prompt 175 : ${f} ouvre encore une fenêtre supprimée`);
	}
	verifier(/toucheDeblocage\(\) \|\| toucheParametres\(\)/.test(lire175('sketch.js')) && /keyCode === TAB \|\| keyCode === UP_ARROW \|\| keyCode === DOWN_ARROW/.test(pa) && /keyCode === ENTER \|\| keyCode === RETURN \|\| key === ' '/.test(pa), 'prompt 175 : navigation des paramètres par Tab / flèches et Entrée / Espace');
	verifier(!/key === '\d'/.test(pa.match(/function toucheParametres\(\) \{[\s\S]*?\n\}/)[0]), 'prompt 175 : plus de raccourci chiffré dans les paramètres');
	// Tous les réglages mémorisés restent accessibles dans la fenêtre (inventaire : DEFAUTS de confort.js)
	const cf = lire175('confort.js');
	const defauts = [...cf.match(/const DEFAUTS = \{([^}]*)\}/)[1].matchAll(/(\w+):/g)].map((m) => m[1]);
	const optionsJeu = vm.runInNewContext(lire175('taches-ui.js').match(/const OPTIONS_JEU = (\[[^\]]*\]);/)[1]);
	const icones175 = vm.runInNewContext('(' + pa.match(/const ICONES_OPTIONS_JEU = (\{[\s\S]*?\n\});/)[1] + ')');
	const lucide = lire175('icones-lucide.js');
	for (const k of defauts) verifier(optionsJeu.includes(k) || new RegExp(`'${k}'|R\\.${k}\\b`).test(pa), `prompt 175 : le réglage « ${k} » n'est plus accessible dans la fenêtre des paramètres`);
	for (const k of optionsJeu) verifier(icones175[k] && lucide.includes(`'${icones175[k]}': [`), `prompt 175 : l'option « ${k} » de la section Avancé n'a pas d'icône Lucide embarquée`);
	for (const m of pa.matchAll(/icone: '([a-z0-9-]+)'|, '([a-z0-9-]+)', t\('/g)) verifier(lucide.includes(`'${m[1] || m[2]}': [`) || lucide.includes(`\t${m[1] || m[2]}: [`), `prompt 175 : icône « ${m[1] || m[2]} » absente de icones-lucide.js`);
	// Composants du DS : interrupteur (état lisible sans la couleur) et curseur ; documentés
	const ds175 = lire175('ds.js');
	verifier(/function dsInterrupteur\(xDroite, y, actif, action, libelle, focus\)/.test(ds175) && /commun\.active' : 'commun\.desactive'/.test(ds175) && /function dsCurseur\(x, y, l, valeur, regler, noms\)/.test(ds175), 'prompt 175 : ds.js doit fournir dsInterrupteur (libellé Activé / Désactivé) et dsCurseur');
	verifier(!/#[0-9a-fA-F]{6}/.test(ds175.match(/function dsInterrupteur[\s\S]*?\n\}/)[0] + ds175.match(/function dsCurseur[\s\S]*?\n\}/)[0]), 'prompt 175 : l\'interrupteur et le curseur lisent la palette (DS.primaire), aucune couleur en dur');
	verifier(/dsInterrupteur\(/.test(lire175('notifs-tel.js').match(/function contenuCentreNotifications[\s\S]*?\n\}/)[0]), 'prompt 175 : « Ne pas déranger » du téléphone doit être un interrupteur du DS');
	verifier(/### Interrupteur et curseur/.test(readFileSync(join(pub, '..', '..', 'design-system', 'DESIGN.md'), 'utf8')), 'prompt 175 : DESIGN.md doit documenter l\'interrupteur et le curseur');
	// Plein écran : une seule logique (touche F et interrupteur), état réel, jamais mémorisé
	const sk175 = lire175('sketch.js');
	verifier(tousJs.reduce((n, [, src]) => n + (src.match(/requestFullscreen\(\)/g) || []).length, 0) === 1, 'prompt 175 : requestFullscreen() doit n\'être appelé qu\'à un endroit (basculerPleinEcran)');
	verifier(/addEventListener\('fullscreenchange'/.test(sk175) && /activer: basculerPleinEcran/.test(pa) && /pleinEcranPossible\(\) && \{ id: 'pleinEcran'/.test(pa) && !/pleinEcran/.test(cf), 'prompt 175 : interrupteur plein écran — état réel (fullscreenchange), masqué sans API, non mémorisé');
	// Volume maître : mémorisé, rétrocompatible avec « son: true / false », 0 % = son désactivé
	const essaiVolume = (stocke) => {
		const st = new Map(stocke === undefined ? [] : [['pxe-nte001:jeu:reglages', JSON.stringify(stocke)]]);
		const c = contexte('fr', st, true);
		return { c, st, lireVolume: () => vm.runInContext('({ v: Confort.Reglages.volume, son: Confort.Reglages.son, n: Confort.Son.niveau() })', c), stocke: () => JSON.parse(st.get('pxe-nte001:jeu:reglages')) };
	};
	{
		const a = essaiVolume({ son: true, musique: 'horizon', contrasteRenforce: true });
		const r = a.lireVolume();
		verifier(r.v === 100 && r.son === true && r.n === 1 && vm.runInContext('Confort.Reglages.musique === "horizon" && Confort.Reglages.contrasteRenforce === true', a.c), 'prompt 175 : réglages déjà stockés (sans volume) repris tels quels, volume à 100 %');
		const b = essaiVolume({ son: false });
		verifier(b.lireVolume().son === false && b.lireVolume().n === 0 && b.lireVolume().v === 100, 'prompt 175 : « son: false » déjà stocké doit rester muet');
		vm.runInContext('Confort.Son.reglerVolume(40)', b.c);
		verifier(b.lireVolume().son === true && Math.abs(b.lireVolume().n - 0.4) < 1e-9 && b.stocke().volume === 40 && b.stocke().son === true, 'prompt 175 : remonter le volume rétablit le son et mémorise la valeur');
		vm.runInContext('Confort.Son.reglerVolume(0)', b.c);
		verifier(b.lireVolume().son === false && b.lireVolume().n === 0 && b.stocke().volume === 0 && b.stocke().son === false, 'prompt 175 : 0 % équivaut à « son désactivé »');
		vm.runInContext("Confort.Reglages.basculer('son')", b.c);
		verifier(b.lireVolume().son === true && b.lireVolume().v === 100, 'prompt 175 : rétablir le son depuis 0 % doit redonner un volume audible');
		vm.runInContext('Confort.Son.reglerVolume(57)', b.c);
		verifier(b.lireVolume().v === 60 && vm.runInContext('Confort.Son.reglerVolume(250)', b.c) === 100 && vm.runInContext('Confort.Son.reglerVolume(-5)', b.c) === 0, 'prompt 175 : volume borné à 0–100, par pas de 10');
		const d = essaiVolume({ son: true, volume: 30 });
		verifier(d.lireVolume().v === 30 && Math.abs(d.lireVolume().n - 0.3) < 1e-9, 'prompt 175 : le volume mémorisé doit être relu au chargement');
	}
	verifier(/Son\.maitre\.gain\.value = GAIN_MAITRE \* Son\.niveau\(\)/.test(cf) && (cf.match(/\* Son\.niveau\(\)/g) || []).length >= 4, 'prompt 175 : le volume doit s\'appliquer au gain maître et à la musique en fichier');
	// Textes : nouvelles clés dans les deux langues, clés retirées absentes, « Options de jeu » → « Avancé »
	for (const langue of ['fr', 'en']) {
		const c = contexte(langue);
		const dico = vm.runInContext(`TRADUCTIONS[${JSON.stringify(langue)}]`, c);
		for (const k of ['commun.active', 'commun.desactive', 'param.onglet.ecran', 'param.onglet.son', 'param.onglet.annonce', 'param.clavier', 'param.pleinEcran', 'param.pleinEcran.detail', 'param.volume', 'param.volume.detail', 'param.volume.moins', 'param.volume.plus', 'param.son.detail', 'acc.intensite.detail', 'acc.intensite.100', 'acc.intensite.50', 'acc.intensite.0', 'pleinEcran.f11', 'parametres.exporter.titre', 'parametres.copier.titre', 'param.horsLigne.detail', 'param.defiChrono.detail']) verifier(typeof dico[k] === 'string' && dico[k].length > 0, `prompt 175 : clé ${k} absente (${langue})`);
		for (const k of ['commun.oui', 'commun.non', 'param.touche', 'param.note', 'param.retour', 'acc.ouvrir', 'optjeu.ouvrir', 'acc.reprise.titre', 'acc.reprise.texte', 'parametres.progression', 'param.musiqueCreditsLong', 'webcam.etat.on']) verifier(!(k in dico), `prompt 175 : clé ${k} devenue inutile, à retirer (${langue})`);
		verifier(dico['optjeu.titre'] === (langue === 'fr' ? 'Avancé' : 'Advanced'), `prompt 175 : « Options de jeu » doit s'appeler « Avancé » (${langue})`);
		for (const k of ['parametres.exporter', 'parametres.copier', 'parametres.importer', 'optjeu.remettre', 'optjeu.confirmerBouton', 'optjeu.note']) verifier(!/\(\d\)|1 à 9|1 to 9/.test(dico[k]), `prompt 175 : raccourci chiffré dans ${k} (${langue})`);
		verifier(/100 ?%/.test(dico['acc.intensite.detail']) && /50 ?%/.test(dico['acc.intensite.detail']) && /0 ?%/.test(dico['acc.intensite.detail']), `prompt 175 : l'explication de l'intensité doit dire ce que font les trois valeurs (${langue})`);
	}
}

// Service worker : chaque script de index.html est dans la liste hors ligne de sw.js
const html = readFileSync(join(pub, 'index.html'), 'utf8');
const sw = readFileSync(join(pub, 'sw.js'), 'utf8');
for (const [, src] of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) verifier(sw.includes(`'${src}'`) || sw.includes(`"${src}"`), `sw.js : ${src} absent du cache hors ligne`);

if (erreurs.length) {
	console.error(`Test du jeu : ${erreurs.length} erreur(s) sur ${controles + erreurs.length} contrôles`);
	for (const e of erreurs) console.error(`  ✗ ${e}`);
	process.exit(1);
}
console.log(`Test du jeu : ${controles} contrôles réussis (${semaines.length} semaines × ${SUITES.length} façons de jouer, reprise, mécaniques, traductions, hors ligne).`);
