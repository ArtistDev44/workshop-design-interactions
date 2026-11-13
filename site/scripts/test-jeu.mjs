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
		phase = 'attente';
		const jauges = JSON.stringify(Jeu.jauges);
		rangerPoste();
		res.soir = phase === 'soir' && __leve === 1 && vue === 'bureau' && !enSieste && PC.fenetre === null && __saves === 1;
		__t = 1000; majSoir(); res.mi = Jeu.horloge.minutes > Jeu.finJournee() && Jeu.horloge.minutes < 21 * 60 && !sortieVisible();
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
		phase = 'attente'; rangerPoste(); res.departSoir = phase === 'soir';
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
			PC.etat = 'appli'; // prompt 183 : le démarrage mène à l'appli principale
			demarrageDuJour(); majDemarrageJour(); // même journée (reprise, retour au poste) : pas de replay
			jours.push({ eteintPendantTransition, attendTransition, demarre, replay: PC.etat !== 'appli' });
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
		Jeu.decider('rien');
		const snap = JSON.parse(JSON.stringify(Jeu.instantane(0)));
		const coherent = snap.jours.every((jj) => jj.dossiers.every((i) => i >= 0)) && new Set(snap.jours.flatMap((jj) => jj.dossiers)).size === snap.paquet.length;
		let tours = 0;
		while (!Jeu.terminee && tours++ < 200) { if (Jeu.prochainDuJour()) Jeu.decider('renfort'); else if (Jeu.jours[Jeu.jourIndex + 1]) Jeu.journeeSuivante(); else break; }
		return { ordre, equipeSuit, arrivees, coherent, fin: Jeu.index === Jeu.paquet.length };
	})()`,
		cs,
	);
	verifier(r.ordre.every(Boolean), `signalements : ordre après prise du 3e (${r.ordre})`);
	verifier(r.equipeSuit, 'signalements : l\'équipe envoyée doit suivre son dossier après réordonnancement');
	verifier(r.arrivees, 'signalements : heures d\'arrivée perdues au réordonnancement');
	verifier(r.coherent && r.fin, `signalements : sauvegarde cohérente (${r.coherent}) et semaine jouée jusqu'au bout (${r.fin})`);
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
	verifier(!/dsTitre\('REGUL'/.test(os) && !/rect\(8, tb \+ 10, 140/.test(os), 'logo : le carré rouge « REGUL » ne doit pas revenir'); // prompt 183 : plus de barre des tâches ni de bouton Démarrer — le logo reste dans le menu de l'appli
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
	const invalides = brut.plaintes.filter((p) => !p.texte.en || p.reponses.length !== 3 || !p.reponses.some((r) => r.bonne) || !p.reponses.some((r) => !r.bonne && !r.clash) || p.reponses.filter((r) => r.clash).length !== 1 || p.reponses.some((r) => !r.clash && !r.texte.en) || Object.keys(p.condition || {}).some((k) => !CLES_COND.includes(k))); // prompt 197 : exactement 3 réponses dont une bonne et une clash
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

// Prompt 196 : clash violent et tentant, réaction de connard du plaignant, masques hors alphabet (&#(, §¤…)
{
	const c194 = contexte('fr');
	vm.runInContext(readFileSync(join(pub, 'panneau.js'), 'utf8').replace(/^const (BANDEAU|PANNEAU|PLUS|TOUCHES_REPONSES|RAISONS)\b/gm, 'var $1'), c194, { filename: 'panneau.js' });
	const r194 = vm.runInContext(`(() => {
		const cats = ['retard', 'travaux', 'affluence', 'meteo', 'accident', 'securite', 'autre'];
		const clair = /\\b(merde|putain|connard|connasse|enculé|salope|bordel|foutre|fuck|shit|bastard|bitch|asshole|crap|damn)\\b/i;
		const hors = /[@#$%&!?(§¤]{2,}/;
		const out = { sansCle: [], enClair: [], sansMasque: [], lire: null, narr: null, reaction: null, repMin: null };
		for (const lg of ['fr', 'en']) for (const c of cats) for (let k = 1; k <= 3; k++) for (const p of ['clash', 'reactionClash']) {
			const cle = p + '.' + c + '.' + k;
			const txt = TRADUCTIONS[lg][cle];
			if (txt === undefined) { out.sansCle.push(lg + ':' + cle); continue; }
			if (clair.test(txt)) out.enClair.push(lg + ':' + cle);
			if (!hors.test(txt)) out.sansMasque.push(lg + ':' + cle);
		}
		out.lire = lireMasques('bravo &#( et encore §¤ voila');
		Jeu.chargerSemaine('2026-10-12'); Jeu.nouvellePartie(); Jeu.modificateur = null;
		const d = Jeu.dossierCourant(); const c = reponsesDialogue(d).find((x) => x.clash);
		Jeu.initialiserAlea(7, 0); Jeu.clashSuivant = true; const r1 = Jeu.decider(c.cle);
		out.narr = String(r1.narration.texte);
		out.reaction = Jeu.reactionClash(d, 0);
		out.repMin = r1.deltas[1];
		return out;
	})()`, c194);
	verifier(!r194.sansCle.length, `196 : clés clash/reactionClash manquantes ${JSON.stringify(r194.sansCle.slice(0, 6))}`);
	verifier(!r194.enClair.length, `196 : mot grossier en clair ${JSON.stringify(r194.enClair.slice(0, 6))}`);
	verifier(!r194.sansMasque.length, `196 : texte sans masque hors alphabet ${JSON.stringify(r194.sansMasque.slice(0, 6))}`);
	verifier(/mot masqué/.test(r194.lire) && !/[@#$%&!?(§¤]{2,}/.test(r194.lire), `196 : lireMasques ne couvre pas &#( / §¤ : ${r194.lire}`);
	verifier(r194.narr.includes('«') && r194.narr.length > 30, `196 : narration du clash sans réaction : ${r194.narr}`);
	verifier(!!r194.reaction && !/\{\w+\}/.test(r194.reaction), `196 : réaction du dossier : ${r194.reaction}`);
	verifier(r194.repMin <= -8, `196 : malus de réputation du clash changé : ${r194.repMin}`);
}

// Prompt 197 : Community — 3 réponses mélangées dont un clash violent et tentant, réaction de connard, masques hors alphabet
{
	const c197 = contexte('fr');
	vm.runInContext(readFileSync(join(pub, 'panneau.js'), 'utf8').replace(/^const (BANDEAU|PANNEAU|PLUS|TOUCHES_REPONSES|RAISONS)\b/gm, 'var $1'), c197, { filename: 'panneau.js' }); // pour lireMasques
	const r197 = vm.runInContext(`(() => {
		const clair = /\\b(merde|putain|connard|connasse|enculé|salope|bordel|foutre|fuck|shit|bastard|bitch|asshole|crap|damn)\\b/i;
		const hors = /[@#$%&!?(§¤]{2,}/;
		const out = { Structure: [], ordre: [], texteClash: null, sansVar: null, rep: null, bonne: null, clash: null, reaction: null, commClash: null, relancePrivee: null, masques: null, enClair: [], commuCle: [] };
		// structure : chaque plainte = 3 réponses, 1 bonne, 1 clash (réputation -8)
		for (const p of Jeu.MESSAGES.plaintes) {
			const clash = p.reponses.filter((r) => r.clash);
			if (p.reponses.length !== 3 || p.reponses.filter((r) => r.bonne).length !== 1 || clash.length !== 1 || Number((clash[0].effets || {}).reputation) > -8 || clash[0].bonne === true) out.Structure.push(p.id);
		}
		// ordre mélangé : permutation déterministe de [0,1,2], au moins 2 ordres distincts sur une semaine
		Jeu.chargerSemaine('2026-10-12'); Jeu.nouvellePartie(); Jeu.modificateur = null;
		const vus = new Set();
		Jeu.paquet.forEach((d, i) => {
			const plainte = { id: 'retard_10', def: Jeu.MESSAGES.plaintes.find((x) => x.id === 'retard_10'), vars: { ligne: '1', retard: 12 }, index: i, heure: '8 h 00', auteur: '@usager_44', reponse: null };
			const o1 = Jeu.ordreReponses(plainte); const o2 = Jeu.ordreReponses(plainte);
			if (JSON.stringify(o1) !== JSON.stringify(o2) || o1.slice().sort().join('') !== '012') out.ordre.push(i);
			vus.add(o1.join(''));
		});
		out.nbOrdres = vus.size;
		// texte du clash : masque hors alphabet, aucune variable restante
		const pl0 = { id: 'retard_10', def: Jeu.MESSAGES.plaintes.find((x) => x.id === 'retard_10'), vars: { ligne: '1', retard: 12 }, index: 0, heure: '8 h 00', auteur: '@usager_44', reponse: null };
		const rClash = pl0.def.reponses.find((r) => r.clash);
		out.texteClash = Jeu.texteReponse(pl0, rClash);
		out.sansVar = /\\{\\w+\\}/.test(out.texteClash);
		if (clair.test(out.texteClash)) out.enClair.push('texteClash');
		if (!hors.test(out.texteClash)) out.enClair.push('texteClash:sansMasque');
		// répondre le clash : index affiché → réel, clash true, bonne false, réputation -8, commentaire de connard
		const ordre = Jeu.ordreReponses(pl0); const iAff = ordre.indexOf(pl0.def.reponses.indexOf(rClash));
		const avant = Jeu.jauges.reputation; const commAvant = Jeu.commentaires.length; const nonLusAvant = Jeu.nonLus.community;
		const res = Jeu.repondrePlainte(pl0, iAff, undefined);
		out.clash = res && res.clash; out.bonne = res && res.bonne; out.rep = res ? res.effets.reputation : null;
		out.repJauge = Math.round(Jeu.jauges.reputation - avant);
		out.reponseStockee = pl0.reponse === pl0.def.reponses.indexOf(rClash);
		out.reaction = res && res.reaction;
		out.commClash = Jeu.commentaires.length - commAvant; // 1 = sa propre réponse + 1 = la réaction de connard
		const dernier = Jeu.commentaires[Jeu.commentaires.length - 1];
		out.dernierAuteur = dernier && dernier.auteur; out.dernierDelta = dernier && dernier.delta;
		if (dernier && clair.test(String(dernier.texte))) out.enClair.push('reaction');
		if (dernier && !hors.test(String(dernier.texte))) out.enClair.push('reaction:sansMasque');
		out.nonLus = Jeu.nonLus.community - nonLusAvant;
		// plainte privée : la réaction de connard part en relance privée
		const defPrive = Jeu.MESSAGES.plaintes.find((x) => x.prive);
		const plP = { id: defPrive.id, def: defPrive, vars: { nature: 'incident' }, index: 2, heure: '8 h 05', auteur: '@usager_9', reponse: null };
		const rC2 = plP.def.reponses.find((r) => r.clash);
		const resP = Jeu.repondrePlainte(plP, Jeu.ordreReponses(plP).indexOf(plP.def.reponses.indexOf(rC2)), undefined);
		out.relancePrivee = resP && resP.clash && (plP.relances || []).length === 1 && hors.test(String(plP.relances[0].texte));
		// lecture : masques hors alphabet lus « mot masqué »
		out.masques = typeof lireMasques === 'function' ? lireMasques(out.texteClash + ' §¤') : null;
		// clés i18n : commu.reactionClash FR + EN
		out.commuCle = ['fr', 'en'].filter((lg) => TRADUCTIONS[lg]['commu.reactionClash'] === undefined);
		return out;
	})()`, c197);
	verifier(!r197.Structure.length, `197 : plaintes sans trio bonne/autre/clash(-8) : ${JSON.stringify(r197.Structure.slice(0, 6))}`);
	verifier(!r197.ordre.length && r197.nbOrdres >= 2, `197 : ordre des réponses non mélangé/déterministe : ${JSON.stringify(r197.ordre.slice(0, 4))}, ordres vus = ${r197.nbOrdres}`);
	verifier(!!r197.texteClash && !r197.sansVar && /[@#$%&!?(§¤]{2,}/.test(r197.texteClash), `197 : texte du clash sans masque ou avec variable : ${r197.texteClash}`);
	verifier(r197.clash === true && r197.bonne === false && r197.rep <= -8 && r197.reponseStockee, `197 : réponse clash (clash=${r197.clash}, bonne=${r197.bonne}, rep=${r197.rep}, stockée=${r197.reponseStockee})`);
	verifier(r197.repJauge <= -8, `197 : malus de réputation appliqué au clash : ${r197.repJauge}`);
	verifier(!!r197.reaction && !/\{\w+\}/.test(r197.reaction) && r197.commClash === 2 && r197.dernierAuteur === '@usager_44' && r197.dernierDelta === -3 && r197.nonLus === 1, `197 : réaction de connard (${JSON.stringify({ reaction: r197.reaction, comm: r197.commClash, auteur: r197.dernierAuteur, delta: r197.dernierDelta, nonLus: r197.nonLus })})`);
	verifier(r197.relancePrivee === true, '197 : clash en privé → relance privée méchante');
	verifier(/mot masqué/.test(String(r197.masques)) && !/[@#$%&!?(§¤]{2,}/.test(String(r197.masques)), `197 : lireMasques sur le clash Community : ${r197.masques}`);
	verifier(!r197.enClair.length && !r197.commuCle.length, `197 : mot grossier en clair ou clé manquante : ${JSON.stringify(r197.enClair)} ${JSON.stringify(r197.commuCle)}`);
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
		Jeu.jauges.reputation = 60; Jeu.finDeJourneeTactique();
		const r1 = Taches.validerRapport('x', 'budget');
		while (Jeu.prochainDuJour()) Jeu.decider('temps');
		Jeu.journeeSuivante(); const b0 = Jeu.jauges.budget; Taches.matin();
		out.accord = { accordee: r1.accordee, delta: Jeu.jauges.budget - b0, message: Jeu.messagesPatron.filter((m) => m.jour === Jeu.jourCourant().date).map((m) => String(m.texte)).join(' | ') };
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
	verifier(!/briefing\(\)|choisirPriorites/.test(readFileSync(join(pub, 'taches.js'), 'utf8') + readFileSync(join(pub, 'taches-ui.js'), 'utf8')), 'priorités : plus aucune fenêtre de choix (briefing retiré, prompt 199)');
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
				if (tache.type === 'info') out.infos++;
				if (tache.type === 'evenement') {
					out.preps++;
					const ev = Jeu.paquet[tache.index];
					if (!ev || ev.type !== 'événement' || ev.date !== d.date || tache.index <= Jeu.index - 1) out.prepSansEvenement++;
				}
			}
		}
		return out;
	})()`,
		cc,
	);
	verifier(r.infos === 0, `info trafic : remplacée par la publication Community (prompt 91), ${r.infos} tâche(s) proposée(s)`);
	verifier(r.prepSansEvenement === 0, `préparer un événement : proposé sans affluence réelle à venir (${r.prepSansEvenement}/${r.preps})`);
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
	verifier(/chaines: false, deblocages: false, arbitrage: false, deVisible: false, eclairageJauges: false/.test(conf), 'options du groupe : désactivées par défaut (Confort.Reglages)');
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
		out.resume = typeof JournalDonnees.resume; // prompt 186 : « Copier le résumé du jour » retiré
		return out;
	})()`,
		cj,
	);
	verifier(r.erreurs.length === 0, `journal : ${r.erreurs.slice(0, 5)}`);
	verifier(r.resume === 'undefined', 'journal : le résumé copié doit avoir disparu (prompt 186)');
	const sv = readFileSync(join(pub, 'sauvegarde.js'), 'utf8');
	verifier(/journal: typeof JOURNAL[^\n]*\{ jour: JOURNAL\.jour, filtre: JOURNAL\.filtre, defil/.test(sv) && /ui\.journal/.test(sv), 'journal : jour, filtre et défilement sauvegardés (prompt 140 : plus de vue)');
	verifier(!/function appJournal|function enqueteJournal/.test(readFileSync(join(pub, 'os.js'), 'utf8')), 'journal : ancien rendu retiré d’os.js');
}

// Prompt 89 bis : trace de la décision, Q25 expliqué, dé visible — aucune valeur d'effet modifiée (prompt 199 : la file
// des « traités » et la pression lisible, que plus rien n'affichait, ont été retirées avec leurs tests)
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
					const res = Jeu.decider(k++ % 4 === 3 ? 'temps' : Jeu.actionsPossibles(d)[k % 3]);
					const e = Jeu.evenementsJournee[Jeu.evenementsJournee.length - 1];
					Jeu.horloge.minutes += 60;
					if (e.retardEffectif !== null && e.retardEffectif !== undefined && Jeu.retardEffectif(d) !== e.retardEffectif) out.erreurs.push('retard non figé');
					const tr = Traces.trace(res);
					if (!tr || !/\\d+h\\d\\d/.test(tr)) out.erreurs.push('trace ' + tr);
					lignes.push(tr);
					const des = Traces.texteDes(res);
					if (des && res.des.some((v, n) => v && !des.includes('dé ' + v))) out.erreurs.push('dé affiché ≠ dé tiré');
				}
				Jeu.finDeJourneeTactique(); Jeu.journeeSuivante();
			}
			return { lignes, jauges: JSON.stringify(Jeu.jauges), tirages: Jeu.tirages };
		};
		const sans = jouer({});
		const avec = jouer({ deVisible: true, eclairageJauges: true });
		const bis = jouer({});
		out.memesEffets = sans.jauges === avec.jauges && sans.tirages === avec.tirages;
		out.repro = JSON.stringify(sans.lignes) === JSON.stringify(bis.lignes);
		out.nb = sans.lignes.length;
		// Q25 : le calcul cite les effets réellement appliqués
		const tps = Jeu.evenementsJournee.filter((e) => e.cleAction === 'temps');
		out.q25 = tps.every((e) => { const c = Traces.calculQ25(e); return ['fluidite', 'reputation', 'budget'].every((k) => !e.deltas[k] || c.includes(String(Math.abs(e.deltas[k])))); }) && tps.length > 0;
		return out;
	})()`,
		ct,
	);
	verifier(r.erreurs.length === 0, `traces : ${[...new Set(r.erreurs)].slice(0, 4)}`);
	verifier(r.memesEffets, 'traces : les options d\'affichage ne changent ni les jauges ni les dés');
	verifier(r.repro && r.nb > 5, `traces : reproductibles par la graine (${r.nb} lignes)`);
	verifier(r.q25, 'Q25 : le calcul affiché cite les effets réellement appliqués');
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
	verifier(r.semaines[0] === 'signalements' && r.semaines[1] === 'community,signalements' && r.semaines[2] === 'community,patron,signalements', `déblocage par semaine : ${r.semaines.join(' | ')}`);
	verifier(r.direct === 5 && r.directTout, `déblocage : temps réel = semaine 4 (${r.direct}) ; « tout débloqué » (${r.directTout})`);
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
	// Quitter la journée : fin de service → soir (prompt 194 : sans mail plein écran) → sortie → lendemain, jauges intactes
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
		const jour = Jeu.jourIndex;
		quitterJourneeRapide(); r.soir = phase === 'soir';
		const jauges = JSON.stringify(Jeu.jauges); // prompt 194 : la fin de service (objectif du jour) est appliquée au même geste
		r.mailDansMails = Jeu.messagesPatron.filter((m) => m.type === 'soir' && !m.lu).length === 1;
		quitterJourneeRapide(); r.sortie = !!SOIR.sortie && vue === 'bureau';
		__t += 5000; majSoir();
		r.lendemain = phase === 'attente' && Jeu.jourIndex === jour + 1;
		r.jaugesIntactes = JSON.stringify(Jeu.jauges) === jauges;
		// sortie automatique peu après la nuit (ranger le poste suffit)
		phase = 'attente'; rangerPoste(); __t += 4100; majSoir(); r.nuit = SOIR.annonce && !SOIR.sortie;
		__t += 8100; majSoir(); r.auto = !!SOIR.sortie;
		r.toucheQ = /key === 'q' \\|\\| key === 'Q'/.test(${JSON.stringify(readFileSync(join(pub, 'journee.js'), 'utf8'))});
		return r;
	})()`,
		cq,
	);
	for (const [k, v] of Object.entries(q)) verifier(v === true, `quitter la journée (prompt 94) : ${k}`);
	const fr94 = contexte('fr');
	const en94 = contexte('en');
	for (const cle of ['quitter.bouton']) {
		const a = vm.runInContext(`t(${JSON.stringify(cle)}, { reponse: 'X' })`, fr94);
		const b = vm.runInContext(`t(${JSON.stringify(cle)}, { reponse: 'X' })`, en94);
		verifier(a !== '[À COMPLÉTER]' && b !== '[À COMPLÉTER]' && a !== b, `prompt 94 : clé ${cle} absente en FR ou en EN`);
	}
	verifier(!/debutGlisser|relacherGlisser|dessinerCartesReponses/.test(['sketch.js', 'micro.js', 'panneau.js', 'glisser.js'].map((f) => readFileSync(join(pub, f), 'utf8')).join('\n')), 'glisser-déposer (prompt 94) : retiré avec les cartes de réponse (prompt 199)');
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
	verifier(/feedback\(dernierResultat\.clash \? 'large' : Juice\.tierDeltas\(dernierResultat\.deltas\)\)/.test(sk96) && /Juice\.decalage\(millis\(\)\)/.test(sk96) && /Juice\.echelleTemps\(maintenant\)/.test(readFileSync(join(pub, 'immersion.js'), 'utf8')), 'game feel : décision, secousse et hit-stop branchés (prompt 196 : un clash force le tier « large »)');
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
	verifier(/y: z\.y - 18, l: z\.l, h: z\.h \+ 18, action: basculerSieste/.test(readFileSync(join(pub, 'sieste.js'), 'utf8')), 'zones de clic ≥ 44 px : somnolence (prompt 183 : plus de ✕ d\'appli)');
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
	const st = new Map([['pxe-nte001:jeu:reglages', '{}'], ['pxe-nte001-langue', 'en'], ['pxe-nte001-tutoriel-vu', 'oui'], ['pxe-nte001-partie-2026-09-14', '{}'], ['pxe-nte001-partie-e178abc', '{}'], ['autre-site', 'x']]); // prompt 178 : + un emplacement de sauvegarde
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
	// Prompt 193 : la liste protan / deutan en dur est remplacée par un texte calculé sur l'aplat (contrôlé plus bas)
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
	// Fenêtre « Votre poste » supprimée (12/11/2026) : plus de fenêtre, d'ouverture automatique ni de textes poste.*
	verifier(!/function (fenetrePoste|majExplicationPoste)|GESTES_POSTE|explicationVue/.test(imm161) && !/ouvrir\('poste'\)|fenetre === 'poste'/.test(readFileSync(join(pub, 'sketch.js'), 'utf8')) && !/explicationVue/.test(readFileSync(join(pub, 'taches-ui.js'), 'utf8')), 'fenêtre « Votre poste » : encore présente ou encore attendue par les tâches');
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
	// Prompt 177 : le sous-titre de « Nouvelle partie » est réduit à « Choisissez un mode de jeu. » — la part réelle /
	// fictive reste dite dans les crédits et les sources de fin (contrôles ci-dessus)
	verifier(d['mp.mode.sous'] === (langue === 'fr' ? 'Choisissez un mode de jeu.' : 'Choose a game mode.') && !('mp.semaines.sous' in d), `prompt 177 : sous-titre de « Nouvelle partie » réduit (${langue} : ${d['mp.mode.sous']})`);
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

// Prompt 180 : écrans « Jour N sur N » — au moins 3,5 s de texte pleinement lisible (hors fondus 0,3 s + 0,5 s), passables
{
	const im180 = readFileSync(join(pub, 'immersion.js'), 'utf8');
	const d = (nom) => Number((im180.match(new RegExp('const ' + nom + ' = (\\d+);')) || [])[1]);
	verifier(d('DUREE_TRANSITION_INTRO') - 800 >= 3500, 'prompt 180 : transition du premier jour lisible moins de 3,5 s');
	verifier(d('DUREE_TRANSITION_JOUR') - 800 >= 8000, 'prompt 180 : transition de journée (avec explication) lisible moins de 8 s');
	verifier(/boutons = \[\{ x: 0, y: 0, l: L, h: H, action: passerTransitionJour \}\]/.test(im180) && /TRANSITION_JOUR && \(keyCode === ENTER \|\| keyCode === RETURN \|\| key === ' '/.test(readFileSync(join(pub, 'sketch.js'), 'utf8')), 'prompt 180 : la transition ne se passe plus au clic, à Entrée ou à Espace');
	verifier(/TRANSITION_JOUR/.test((im180.match(/function tempsSuspendu\(\) \{\n[^\n]*/) || [''])[0]), 'prompt 180 : le temps de jeu n\'est plus suspendu pendant la transition');
}

// Prompt 190 : public cible et durée de session — concept, README, menu (carte « Nouvelle partie »)
{
	const racine = join(pub, '..', '..');
	verifier(/## Public cible et session/.test(readFileSync(join(racine, 'jeu', '00-concept.md'), 'utf8')), 'prompt 190 : section « Public cible et session » absente du concept');
	verifier(/10 à 20 minutes/.test(readFileSync(join(racine, 'README.md'), 'utf8')) && /10 à 20 minutes/.test(readFileSync(join(racine, 'site', 'README.md'), 'utf8')), 'prompt 190 : durée de session absente des README');
	verifier(/cle: 'nouvelle'[^\n]*sous: t\('mp\.accroche\.duree'\)/.test(readFileSync(join(pub, 'menu.js'), 'utf8')), 'prompt 190 : accroche de durée absente de la carte « Nouvelle partie »');
	for (const langue of ['fr', 'en']) {
		const v = vm.runInContext(`TRADUCTIONS[${JSON.stringify(langue)}]['mp.accroche.duree']`, contexte(langue));
		verifier(typeof v === 'string' && /10/.test(v) && /20/.test(v), `prompt 190 : mp.accroche.duree absente ou sans durée (${langue})`);
	}
}

// Demande du 12/11/2026 : plus de mention « conseillé » sous les répliques ; infobulles de la barre Mails sur sa ligne
{
	const pan = readFileSync(join(pub, 'panneau.js'), 'utf8');
	verifier(!/rep\.conseillee|reponsesConseillees\(d\)/.test(pan), 'répliques : la mention « conseillé » est encore affichée');
	for (const langue of ['fr', 'en']) verifier(vm.runInContext(`TRADUCTIONS[${JSON.stringify(langue)}]['rep.conseillee'] === undefined`, contexte(langue)), `clé rep.conseillee encore présente (${langue})`);
	const pat = readFileSync(join(pub, 'patron.js'), 'utf8');
	verifier(!/PATRON\.bulle = \{[^}]*y: y \+ 56/.test(pat) && /x: finBarre, y: y \+ 6/.test(pat), 'Mails : l\'infobulle d\'une action recouvre encore la ligne du dessous');
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
	verifier(/boutonCarreHaut\(x, y, c, focus, 'download', t\('mp\.installer'\), installerJeu\)/.test(menu171) && /iconeLucide\(icone,/.test(menu171) && /infobulle\(bulle/.test(menu171.slice(menu171.indexOf('function boutonCarreHaut'))) && /cle: 'installer', action: \(\) => installerJeu\(\)/.test(menu171), 'prompt 171 : icône « télécharger » absente, sans infobulle ou hors du parcours clavier');
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
	verifier(nbFenetres >= 16, `prompt 173 : seulement ${nbFenetres} fenêtres relevées (≥ 16 attendues)`); // fenêtre « Votre poste » supprimée (17 → 16) ; // prompt 183 : plus de fenêtre d'intro d'appli (18 → 17) ; // prompt 175 : trois fenêtres de réglages fondues en une (21 → 19) ; prompt 178 : plus de fenêtre « reprise » (19 → 18)
	// Clic sur le fond : point unique dans mousePressed, listes explicites, aucune fenêtre dans les deux à la fois
	verifier(/\tif \(clicFondFenetre\(\)\) return;/.test(sk173.match(/function mousePressed\(\) \{[\s\S]*?\n\}/)[0]), 'prompt 173 : mousePressed ne passe plus par clicFondFenetre()');
	const bloquantes = vm.runInNewContext(sk173.match(/const FENETRES_BLOQUANTES = (\[[^\]]*\]);/)[1]);
	const fermables = [...sk173.match(/const FERMETURE_FOND = \{([\s\S]*?)\n\};/)[1].matchAll(/\n\t(\w+):/g)].map((x) => x[1]);
	for (const n of ['reset', 'demission', 'partir', 'blame', 'inspection', 'tache', 'mailFin', 'rapport', 'cafe']) verifier(bloquantes.includes(n), `prompt 173 : la fenêtre « ${n} » exige une réponse, elle doit rester bloquante`);
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
	verifier(/if \(toucheParametres\(\) \|\| toucheTelephone\(\)/.test(lire175('sketch.js')) && /keyCode === TAB \|\| keyCode === UP_ARROW \|\| keyCode === DOWN_ARROW/.test(pa) && /keyCode === ENTER \|\| keyCode === RETURN \|\| key === ' '/.test(pa), 'prompt 175 : navigation des paramètres par Tab / flèches et Entrée / Espace');
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

// Prompt 176 : la couleur d'accent choisie s'applique partout — une seule source (DS, theme.js), contraste calculé
{
	const lire176 = (f) => readFileSync(join(pub, f), 'utf8');
	const th = lire176('theme.js');
	const c = { DS: { fond: '#0D0C0C' }, C: {}, MENU_C: {}, document: { documentElement: { style: { setProperty: () => {} } } }, localStorage: { getItem: () => null, setItem: () => {} }, location: { search: '' } };
	vm.createContext(c);
	vm.runInContext(th + ';globalThis.T = { PALETTES_COULEUR, Theme, accentDerive, rapportContraste, primaireRGBA };', c);
	const { PALETTES_COULEUR: pal, accentDerive: derive, rapportContraste: rc } = c.T;
	verifier(Math.abs(rc('#FFFFFF', '#000000') - 21) < 1e-9 && Math.abs(rc('#FFFFFF', '#D4031C') - 5.48) < 0.01, 'prompt 176 : rapportContraste doit suivre la formule WCAG');
	verifier(pal.length >= 6, 'prompt 176 : au moins six accents proposés');
	for (const p of pal) {
		const d = derive(p.hex);
		verifier(d.fond === p.hex && (d.texte === '#FFFFFF' || d.texte === '#0D0C0C'), `prompt 176 : ${p.id} — texte sur l'accent blanc ou sombre`);
		verifier(rc(d.texte, p.hex) >= 4.5, `prompt 176 : ${p.id} — texte sur l'accent sous 4,5:1 (${rc(d.texte, p.hex).toFixed(2)})`);
		for (const fond of ['#0D0C0C', '#171616']) {
			verifier(rc(d.trait, fond) >= 3, `prompt 176 : ${p.id} — accent en trait sous 3:1 sur ${fond} (${rc(d.trait, fond).toFixed(2)})`);
			verifier(rc(d.texteSurFond, fond) >= 4.5, `prompt 176 : ${p.id} — accent en texte sous 4,5:1 sur ${fond} (${rc(d.texteSurFond, fond).toFixed(2)})`);
		}
		c.T.Theme.appliquer(p.id, true);
		verifier(c.DS.primaire === p.hex && c.DS.surPrimaire === d.texte && c.DS.primaireTrait === d.trait && c.DS.primaireTexte === d.texteSurFond, `prompt 176 : ${p.id} — Theme.appliquer doit écrire les quatre usages dans DS`);
		verifier(c.T.primaireRGBA(0.5) === `rgba(${parseInt(p.hex.slice(1, 3), 16)},${parseInt(p.hex.slice(3, 5), 16)},${parseInt(p.hex.slice(5, 7), 16)},0.5)`, `prompt 176 : ${p.id} — version translucide de l'accent`);
	}
	// Un accent clair prend un texte sombre ; un accent trop sombre est éclairci pour l'usage en trait
	verifier(derive('#FFC138').texte === '#0D0C0C' && rc(derive('#FFC138').texte, '#FFC138') >= 4.5, 'prompt 176 : un accent clair doit porter du texte sombre');
	verifier(derive('#3A0A66').trait !== '#3A0A66' && rc(derive('#3A0A66').trait, '#171616') >= 3 && derive('#D4031C').trait === '#D4031C', 'prompt 176 : un accent trop sombre doit être éclairci en trait, un accent suffisant rester intact');
	// Valeurs par défaut de ds.js = dérivées de la palette par défaut (jamais désynchronisées)
	const ds176 = lire176('ds.js');
	const d0 = derive(pal[0].hex);
	verifier(ds176.includes(`primaire: '${d0.fond}'`) && ds176.includes(`surPrimaire: '${d0.texte}'`) && ds176.includes(`primaireTrait: '${d0.trait}'`) && ds176.includes(`primaireTexte: '${d0.texteSurFond}'`), 'prompt 176 : les valeurs par défaut de DS doivent être celles de la palette par défaut');
	verifier(/texte: DS\.surPrimaire/.test(ds176), 'prompt 176 : le bouton principal écrit avec DS.surPrimaire');
	// Une seule source : C et MENU_C relisent DS, plus aucune copie de l'hexadécimal ni affectation depuis theme.js
	verifier(/get primaire\(\) \{\s*return DS\.primaire;/.test(lire176('sketch.js')) && /get bleu\(\) \{\s*return DS\.primaire;/.test(lire176('menu.js')), 'prompt 176 : C.primaire et MENU_C.bleu doivent relire DS.primaire');
	verifier(!/C\.primaire = |MENU_C\.bleu = /.test(th), 'prompt 176 : theme.js n\'écrit que dans DS');
	// Plus d'accent en dur pour focus / sélection / mise en avant dans les fichiers repris
	const interdits = { 'carte.js': /rgba\(212,3,28|rgba\(255,193,56/, 'guide.js': /#FFC138/i, 'glisser.js': /rgba\(255,193,56|C\.orange/, 'notifs-tel.js': /#ffc138/i, 'soir.js': /#FFC138|255, 193, 56/i, 'menu.js': /#D4031C/i, 'sketch.js': /primaire: '#/ };
	for (const [f, re] of Object.entries(interdits)) verifier(!re.test(lire176(f)), `prompt 176 : ${f} garde une couleur d'accent en dur (${re})`);
	// Traits et textes posés sur le fond sombre : jamais l'aplat brut
	for (const f of ['menu.js', 'carte.js', 'os.js', 'community.js', 'gameover.js', 'bureau.js', 'carte-alertes.js', 'sketch.js']) verifier(!/stroke\([^)\n]*(?:DS|C)\.primaire\b(?!Trait)|stroke\([^)\n]*MENU_C\.bleu/.test(lire176(f).replace(/primaire(Trait|Texte)/g, 'P$1')), `prompt 176 : ${f} — un trait d'accent doit lire primaireTrait`);
}

// Service worker : chaque script de index.html est dans la liste hors ligne de sw.js
const html = readFileSync(join(pub, 'index.html'), 'utf8');
const sw = readFileSync(join(pub, 'sw.js'), 'utf8');
for (const [, src] of html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) verifier(sw.includes(`'${src}'`) || sw.includes(`"${src}"`), `sw.js : ${src} absent du cache hors ligne`);

// Prompt 178 : plusieurs emplacements de sauvegarde — migration de l'ancienne sauvegarde unique (version 1) vers le
// premier emplacement, trois parties et reprise de la deuxième à l'identique, suppression d'une seule, limite, quota
{
	const lire = (f) => readFileSync(join(pub, f), 'utf8');
	const PRE = 'pxe-nte001-partie-';
	/** Contexte de jeu + sauvegarde.js réel ; `plein.v` à true : localStorage.setItem lève (quota dépassé) */
	const ctxSauv = (stockage, plein = { v: false }) => {
		const c = contexte('fr', stockage, true);
		Object.assign(c.localStorage, {
			key: (i) => [...stockage.keys()][i] ?? null,
			setItem: (k, v) => {
				if (plein.v) throw new Error('QuotaExceededError');
				stockage.set(k, String(v));
			},
		});
		Object.defineProperty(c.localStorage, 'length', { get: () => stockage.size });
		c.__toasts = [];
		const noeud = () => ({ setAttribute() {}, appendChild() {}, remove() {}, set textContent(v) { c.__toasts.push(String(v)); } });
		Object.assign(c.document, { createElement: noeud, body: { appendChild() {} }, addEventListener() {} });
		c.addEventListener = () => {};
		c.setTimeout = () => 0;
		c.clearTimeout = () => {};
		vm.runInContext(
			`var ecran = 'jeu', phase = 'attente', fenetre = null, enPause = false, enSieste = false, reveil = null, smsActif = false, introVue = true, bilanCalcule = null,
				sourceChoisie = null, alerteTempsJouee = false, dernierResultat = null, facteurDuree = 1, arriveeDossier = 0, debutCompteur = 0, __annonces = [];
			var millis = () => 1000, annoncer = (x) => __annonces.push(String(x)), interaction = () => {}, allerFin = () => {};`,
			c,
		);
		vm.runInContext(lire('sauvegarde.js'), c, { filename: 'sauvegarde.js' });
		return c;
	};
	/** Nouvelle partie sur une semaine, `n` décisions, sauvegarde automatique ; renvoie l'état attendu à la reprise */
	const jouerEtSauver = (c, lundi, n) =>
		vm.runInContext(
			`(() => {
			Jeu.chargerSemaine(${JSON.stringify(lundi)});
			Jeu.nouvellePartie();
			Sauvegarde.nouvelle();
			ecran = 'jeu'; phase = 'attente';
			let k = 0, tours = 0;
			while (k < ${n} && tours++ < 200) {
				const d = Jeu.prochainDuJour();
				if (d) { if (Jeu.conflit && Jeu.conflit()) Jeu.choisirPriorite('a'); Jeu.decider(['renfort', 'rien', 'devier'][k % 3], d.contradiction ? d.contradiction.bonne : undefined); k++; }
				else { Jeu.finDeJourneeTactique(); Jeu.mailDuJour(); Jeu.journeeSuivante(); const i = Jeu.preparerInspection(); if (i) Jeu.repondreInspection(i.bonne); }
			}
			const ok = Sauvegarde.auto(false);
			return { ok, id: Sauvegarde.courant, etat: __etat() };
		})()`,
			c,
		);
	const ETAT = `var __etat = () => JSON.stringify({ semaine: Jeu.etat.semaine.lundi, index: Jeu.index, jour: Jeu.jourIndex, jauges: Jeu.jauges, decisions: Jeu.historique.length, graine: Jeu.graine, minutes: Jeu.horloge.minutes, paquet: Jeu.paquet.map((d) => d.id || d.titre || '') });`;
	const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
	const [s1, s2, s3] = semaines;
	const clesParties = (m) => [...m.keys()].filter((k) => k.startsWith(PRE));

	// ——— 1. Ancien format (version 1, clé par semaine) → premier emplacement, sans perte ———
	const stA = new Map();
	const a = ctxSauv(stA);
	vm.runInContext(ETAT, a);
	const origine = jouerEtSauver(a, s1, 4);
	verifier(origine.ok && clesParties(stA).join() === PRE + origine.id, `prompt 178 : une nouvelle partie doit créer son emplacement (${[...stA.keys()]})`);
	const v2 = JSON.parse(stA.get(PRE + origine.id));
	verifier(v2.version === 2 && v2.id === origine.id && typeof v2.creeLe === 'string', `prompt 178 : format versionné (version ${v2.version}, id ${v2.id})`);
	const v1 = Object.assign({}, v2, { version: 1 });
	delete v1.id;
	delete v1.creeLe;
	const CLE_GLOBALES = [['pxe-nte001:jeu:reglages', '{"son":false}'], ['pxe-nte001:jeu:meilleurs-bilans', '{"x":1}'], ['pxe-nte001-langue', 'fr']];
	const stB = new Map([[PRE + s1, JSON.stringify(v1)], ...CLE_GLOBALES]);
	const b = ctxSauv(stB);
	vm.runInContext(ETAT, b);
	const listeB = vm.runInContext('Sauvegarde.lister()', b);
	const migre = JSON.parse(stB.get(PRE + s1) || 'null');
	verifier(listeB.length === 1 && listeB[0].id === s1 && migre && migre.version === 2 && migre.id === s1, `prompt 178 : l'ancienne sauvegarde doit devenir le premier emplacement (${listeB.length}, version ${migre && migre.version})`);
	verifier(JSON.stringify(migre.etat) === JSON.stringify(v1.etat) && migre.sauvegardeLe === v1.sauvegardeLe && migre.semaine === v1.semaine, 'prompt 178 : la migration ne doit rien perdre de la partie');
	verifier(CLE_GLOBALES.every(([k, v]) => stB.get(k) === v) && clesParties(stB).length === 1, 'prompt 178 : réglages, palmarès et langue restent hors emplacements, intacts');
	const repriseV1 = await vm.runInContext('Sauvegarde.reprendre(Sauvegarde.lister()[0]).then((ok) => ({ ok, etat: __etat(), id: Sauvegarde.courant }))', b);
	verifier(repriseV1.ok === true && repriseV1.etat === origine.etat && repriseV1.id === s1, 'prompt 178 : une sauvegarde d\'avant la mise à jour doit être reprise à l\'identique');
	vm.runInContext('Sauvegarde.auto(false)', b);
	verifier([...stB.keys()].filter((k) => k.startsWith(PRE)).length === 1, 'prompt 178 : la partie migrée continue dans son emplacement (pas de doublon)');
	// Une version 1 illisible n'est ni listée ni effacée
	const stC = new Map([[PRE + s1, '{"version":1,"semaine":"' + s1 + '"}']]);
	verifier(vm.runInContext('Sauvegarde.lister().length', ctxSauv(stC)) === 0 && clesParties(stC).length === 1, 'prompt 178 : une sauvegarde invalide n\'est ni proposée ni détruite');

	// ——— 2. Trois parties, reprise de la deuxième à l'identique, suppression de la première seule ———
	const st = new Map(CLE_GLOBALES);
	const plein = { v: false };
	const c = ctxSauv(st, plein);
	vm.runInContext(ETAT, c);
	const parties = [];
	for (const [lundi, n] of [[s1, 2], [s2, 5], [s3, 3]]) {
		parties.push(jouerEtSauver(c, lundi, n));
		await dormir(3); // horodatages distincts
	}
	const ids = vm.runInContext('Sauvegarde.lister().map((o) => o.id)', c);
	verifier(parties.every((p) => p.ok) && new Set(parties.map((p) => p.id)).size === 3 && JSON.stringify(ids) === JSON.stringify(parties.map((p) => p.id).reverse()), `prompt 178 : trois parties = trois emplacements, la plus récente d'abord (${ids})`);
	const r2 = await vm.runInContext(`Sauvegarde.reprendre(Sauvegarde.pour(${JSON.stringify(parties[1].id)})).then((ok) => ({ ok, etat: __etat(), id: Sauvegarde.courant }))`, c);
	verifier(r2.ok === true && r2.etat === parties[1].etat && r2.id === parties[1].id, 'prompt 178 : la deuxième partie doit être reprise à l\'identique (jour, jauges, dossiers)');
	const avant = [st.get(PRE + parties[1].id), st.get(PRE + parties[2].id)];
	vm.runInContext(`Sauvegarde.effacer(${JSON.stringify(parties[0].id)})`, c);
	verifier(!st.has(PRE + parties[0].id) && st.get(PRE + parties[1].id) === avant[0] && st.get(PRE + parties[2].id) === avant[1] && vm.runInContext('Sauvegarde.lister().length', c) === 2, 'prompt 178 : supprimer la première partie ne doit pas toucher aux autres');
	verifier(CLE_GLOBALES.every(([k, v]) => st.get(k) === v), 'prompt 178 : supprimer une partie ne touche ni aux réglages ni au palmarès');
	// La partie reprise continue dans SON emplacement
	vm.runInContext('Sauvegarde.auto(false)', c);
	verifier([...st.keys()].filter((k) => k.startsWith(PRE)).length === 2 && vm.runInContext('Sauvegarde.courant', c) === parties[1].id, 'prompt 178 : la sauvegarde automatique doit écrire dans l\'emplacement de la partie en cours');

	// ——— 3. Limite d'emplacements ———
	const MAX = vm.runInContext('Sauvegarde.MAX', c);
	verifier(MAX >= 3 && MAX <= 8 && vm.runInContext('Sauvegarde.pleine()', c) === false, `prompt 178 : limite d'emplacements raisonnable (${MAX})`);
	while (vm.runInContext('Sauvegarde.lister().length', c) < MAX) {
		await dormir(3);
		jouerEtSauver(c, s1, 1);
	}
	verifier(vm.runInContext('Sauvegarde.pleine()', c) === true && vm.runInContext('Sauvegarde.plusAncienne().id', c) === parties[2].id, 'prompt 178 : à la limite, la plus ancienne partie est proposée à la suppression');
	const sk = lire('sketch.js');
	const lancer = sk.slice(sk.indexOf('function lancerPartie()'), sk.indexOf('function lancerNouvellePartie()'));
	verifier(/if \(Sauvegarde\.pleine\(\)\) return allerSauvegardes\(lancerNouvellePartie\)/.test(lancer) && !/ouvrir\('reprise'\)/.test(sk), 'prompt 178 : à la limite, le lancement passe par l\'écran des sauvegardes (et plus de fenêtre de rappel)');

	// ——— 4. Quota : échec d'écriture → rien de perdu, message clair ———
	const photo = JSON.stringify([...st.entries()]);
	plein.v = true;
	const q = vm.runInContext(`(() => { const d = Jeu.prochainDuJour(); if (d) Jeu.decider('rien', d.contradiction ? d.contradiction.bonne : undefined); return { ok: Sauvegarde.auto(false), n: Sauvegarde.lister().length, index: Jeu.index, courant: Sauvegarde.courant }; })()`, c);
	verifier(q.ok === false && JSON.stringify([...st.entries()]) === photo && q.n === MAX && q.index >= 1, 'prompt 178 : stockage plein — ni la partie en cours ni les autres emplacements ne doivent être perdus');
	verifier(c.__toasts.length === 1 && c.__toasts[0] === vm.runInContext(`t('sauvegarde.indisponible')`, c) && /Reprendre une partie/.test(c.__toasts[0]), `prompt 178 : message clair quand le stockage est plein (${c.__toasts})`);
	plein.v = false;
	verifier(vm.runInContext('Sauvegarde.auto(false)', c) === true && st.has(PRE + q.courant), 'prompt 178 : dès que la place revient, la partie en cours est de nouveau sauvegardée');
	// Partie terminée : seul son emplacement est libéré, et rien n'est réécrit tant qu'une nouvelle partie n'a pas commencé
	const nAvant = vm.runInContext('Sauvegarde.lister().length', c);
	vm.runInContext(`phase = 'fin'; Sauvegarde.auto(false); phase = 'attente'; Sauvegarde.auto(false);`, c);
	verifier(vm.runInContext('Sauvegarde.lister().length', c) === nAvant - 1 && !st.has(PRE + q.courant), 'prompt 178 : une partie terminée libère son seul emplacement');

	// ——— 5. Menu, écran « Reprendre une partie », textes, mode exposition ———
	const menu = lire('menu.js');
	const i18n178 = lire('i18n.js');
	const libelles = [...i18n178.matchAll(/"mp\.reprendre": "([^"]*)"/g)].map((m) => m[1]);
	verifier(libelles.length === 2 && libelles[0] === 'Reprendre une partie' && libelles.every((l) => !/[()]/.test(l)), `prompt 178 : entrée « Reprendre une partie », sans raccourci entre parenthèses (${libelles})`);
	const entrees = menu.slice(menu.indexOf('function entreesMenu'), menu.indexOf('function allerChoixSemaine'));
	verifier(/desactive: !n/.test(entrees) && /allerSauvegardes\(\)/.test(entrees) && /while \(choisi\(\)\.desactive\)/.test(menu) && /carteMenuGrisee/.test(menu), 'prompt 178 : sans sauvegarde, l\'entrée est grisée et sautée au clavier');
	const touches = menu.slice(menu.indexOf('function toucheSauvegardes'), menu.indexOf('/** Clavier du menu principal'));
	verifier(['UP_ARROW', 'DOWN_ARROW', 'ENTER', 'DELETE', 'ESCAPE'].every((k) => touches.includes('keyCode === ' + k)) && /MENU\.confirmeSauv/.test(touches) && /annonceSauvegarde/.test(touches), 'prompt 178 : écran des sauvegardes au clavier (↑ ↓, Entrée, Suppr avec confirmation, Échap) et annoncé');
	verifier(/"sauv\.annonce": "Sauvegarde \{i\} sur \{n\} : /.test(i18n178) && /\[À COMPLÉTER\]/.test(menu.slice(menu.indexOf('function infosSauvegarde'), menu.indexOf('function annonceSauvegarde'))), 'prompt 178 : annonce « sauvegarde 2 sur 3 : … » et champ absent → [À COMPLÉTER]');
	verifier(!/"reprise\.(titre|texte|reprendre|nouvelle|annuler)"|"accueil\.continuerDetail"/.test(i18n178) && !/fenetreReprise|reprendreSemaineChoisie|'reprise'/.test(sk + lire('portrait.js')), 'prompt 178 : la modale de rappel / d\'écrasement et ses textes doivent avoir disparu');
	const garder = (lire('expo.js').match(/const GARDER = \[([^\]]*)\]/) || [])[1] || '';
	verifier(!/partie/.test(garder) && /const PREFIXE = 'pxe-nte001-partie-'/.test(lire('sauvegarde.js')), 'prompt 178 : la purge du mode exposition doit vider les emplacements de sauvegarde');
}

// Prompt 177 : page « Nouvelle partie » — mode temps réel verrouillé / hors ligne hors focus et non activable,
// « Prendre en main » coché d'office tant qu'aucune partie n'est terminée ni le guide achevé
{
	const menu = readFileSync(join(pub, 'menu.js'), 'utf8');
	const guide = readFileSync(join(pub, 'guide.js'), 'utf8');
	const CLE_H = 'pxe-nte001-histoire';
	/** Contexte avec la vraie progression (histoire.js), les vraies fonctions du menu et de guide.js */
	const ctx177 = (stockage, enLigne = true) => {
		const c = contexte('fr', stockage, true);
		c.__annonces = [];
		c.__lancees = 0;
		vm.runInContext(
			`var MENU = { ecran: 'semaines', choixSemaine: 0, debut: 0 }; var boutons = []; var keyCode = 0, key = '';
			const TAB = 9, SHIFT = 16, ENTER = 13, RETURN = 13, ESCAPE = 27, BACKSPACE = 8, LEFT_ARROW = 37, UP_ARROW = 38, RIGHT_ARROW = 39, DOWN_ARROW = 40;
			var __maj = false; function keyIsDown() { return __maj; } function millis() { return 0; }
			function annoncer(x) { __annonces.push(x); }
			function texteMeilleur() { return ''; } function texteDifficulteChapitre() { return ''; }
			function optionsAccueil() { return Jeu.semainesProposees().map((s) => ({ lundi: s.lundi })).concat([{ type: 'direct' }]); }
			var choixAccueil = -1; function avantDeJouer() { __lancees++; }
			var Sauvegarde = { lister: () => [] };
			Confort.Son = Confort.Son || {}; Confort.Son.bip = () => {};
			Jeu.enLigne = ${enLigne};`,
			c,
		);
		const extrait = (src, debut, fin) => src.slice(src.indexOf(debut), src.indexOf(fin, src.indexOf(debut)));
		vm.runInContext(extrait(menu, 'function allerChoixSemaine', '// ——— Dessin ———'), c);
		vm.runInContext(extrait(menu, 'function modesNouvellePartie', 'function dessinerChoixSemaine'), c);
		vm.runInContext(extrait(menu, '/** Clavier du menu principal', '\tconst e = entreesMenu();') + '}', c);
		vm.runInContext(extrait(guide, 'const CLE_GUIDE_OPTION', '// ———') , c);
		return c;
	};
	const touche = (c, code, maj = false) => vm.runInContext(`keyCode = ${code}; __maj = ${maj}; toucheMenu(); MENU.choixSemaine`, c);
	const TOUCHES = [9, 39, 40, 37, 38];

	// 1. Temps réel verrouillé (histoire non terminée) : Tab, Maj+Tab et flèches ne s'y arrêtent jamais
	let c = ctx177(new Map());
	vm.runInContext('allerChoixSemaine()', c);
	let modes = vm.runInContext('modesNouvellePartie().map((m) => ({ cle: m.cle, desactive: !!m.desactive, info: m.info }))', c);
	verifier(modes.length === 2 && modes[1].cle === 'direct' && modes[1].desactive && !modes[0].desactive, `prompt 177 : temps réel attendu verrouillé sans progression (${JSON.stringify(modes)})`);
	verifier(TOUCHES.every((k) => touche(c, k) === 0) && touche(c, 9, true) === 0, 'prompt 177 : Tab et flèches ne doivent jamais focaliser « Mode temps réel » verrouillé');
	const annonce = c.__annonces[0] || '';
	verifier(/indisponible/.test(annonce) && annonce.includes(modes[1].info) && /Mode temps réel/.test(annonce), `prompt 177 : le mode verrouillé doit être annoncé indisponible, avec sa raison (${annonce})`);
	verifier(c.__annonces.slice(1).every((a) => !/Mode temps réel/.test(a)), 'prompt 177 : le focus clavier ne doit jamais annoncer le mode verrouillé comme sélectionné');
	// Sélection forcée sur la carte désactivée : non activable, et recalée sur le mode jouable
	vm.runInContext('MENU.choixSemaine = 1; lancerDepuisMenu()', c);
	verifier(c.__lancees === 0, 'prompt 177 : un mode verrouillé ne doit pas pouvoir être lancé');
	verifier(vm.runInContext('MENU.choixSemaine = 1; recalerChoixMode(modesNouvellePartie()); MENU.choixSemaine', c) === 0, 'prompt 177 : une sélection posée sur la carte désactivée doit revenir au mode jouable');
	vm.runInContext('MENU.choixSemaine = 0; lancerDepuisMenu()', c);
	verifier(c.__lancees === 1, 'prompt 177 : le mode histoire doit rester lançable');

	// 2. Histoire terminée, en ligne : le temps réel redevient focalisable ; hors ligne : de nouveau sauté, raison affichée
	const fini = () => new Map([[CLE_H, JSON.stringify({ termine: true, scores: { 1: 50, 2: 50, 3: 50 } })]]);
	c = ctx177(fini());
	vm.runInContext('allerChoixSemaine()', c);
	verifier(touche(c, 9) === 1 && touche(c, 9) === 0 && touche(c, 37) === 1 && c.__annonces.length && !/indisponible/.test(c.__annonces[0]), 'prompt 177 : le temps réel jouable doit redevenir focalisable (Tab, flèches)');
	c = ctx177(fini(), false);
	vm.runInContext('MENU.choixSemaine = 1; allerChoixSemaine()', c);
	verifier(TOUCHES.every((k) => touche(c, k) === 0) && c.__annonces[0].includes(vm.runInContext(`t('mp.mode.direct.horsLigne')`, c)), 'prompt 177 : hors ligne, le temps réel est sauté et sa raison annoncée');

	// 3. Dessin : la raison reste affichée, la carte désactivée n'est ni sélectionnée ni activable au clic
	const dessin = menu.slice(menu.indexOf('function dessinerChoixSemaine'), menu.indexOf('// ——— Prompt 178 : écran « Reprendre une partie »'));
	verifier(/recalerChoixMode\(modes\)/.test(dessin) && /const sel = i === MENU\.choixSemaine && !o\.desactive/.test(dessin) && /text\(o\.info,/.test(dessin) && /o\.desactive \? annoncer\(annonceModeIndisponible\(o\)\)/.test(dessin), 'prompt 177 : carte désactivée — raison affichée, ni sélection ni activation au clic');
	for (const langue of ['fr', 'en']) {
		const d = vm.runInContext(`TRADUCTIONS[${JSON.stringify(langue)}]`, contexte(langue));
		verifier(/\{titre\}/.test(d['mp.mode.indispo'] || '') && /\{raison\}/.test(d['mp.mode.indispo'] || ''), `prompt 177 : mp.mode.indispo absent (${langue})`);
	}

	// 4. « Prendre en main » : coché d'office au premier lancement, décochable, puis dernier état
	const option = (entrees) => vm.runInContext('optionGuide()', ctx177(new Map(entrees)));
	const BILANS = ['pxe-nte001:jeu:meilleurs-bilans', JSON.stringify({ direct: { score: 50 } })];
	verifier(option([]) === true, 'prompt 177 : stockage vidé → « Prendre en main » doit être coché');
	verifier(option([BILANS]) === false, 'prompt 177 : après une partie terminée (palmarès), « Prendre en main » ne doit plus être coché par défaut');
	verifier(option([[CLE_H, JSON.stringify({ termine: false, scores: { 1: 40 } })]]) === false, 'prompt 177 : une semaine d\'histoire terminée vaut partie terminée');
	verifier(option([['pxe-nte001-prise-en-main-fini', 'oui']]) === false, 'prompt 177 : guide achevé → plus coché par défaut');
	verifier(option([['pxe-nte001-prise-en-main', 'non']]) === false && option([BILANS, ['pxe-nte001-prise-en-main', 'oui']]) === true, 'prompt 177 : le dernier état choisi par le joueur doit être repris');
	// Une partie seulement sauvegardée (non terminée) ne retire pas la case
	c = ctx177(new Map());
	vm.runInContext('Sauvegarde.lister = () => [{ id: "a" }]', c);
	verifier(vm.runInContext('optionGuide()', c) === true, 'prompt 177 : une partie en cours, jamais terminée, laisse « Prendre en main » coché');
	// Décocher : mémorisé, et relu au lancement suivant
	const st = new Map();
	c = ctx177(st);
	vm.runInContext('optionGuide(); basculerOptionGuide()', c);
	verifier(vm.runInContext('optionGuide()', c) === false && st.get('pxe-nte001-prise-en-main') === 'non' && vm.runInContext('optionGuide()', ctx177(st)) === false, 'prompt 177 : la case doit pouvoir être décochée, et le rester');
	// Mode exposition : la purge garde le palmarès et retire les clés du guide (comportement du prompt 160 inchangé)
	const garder177 = (readFileSync(join(pub, 'expo.js'), 'utf8').match(/const GARDER = \[([^\]]*)\]/) || [])[1] || '';
	verifier(/meilleurs-bilans/.test(garder177) && !/prise-en-main/.test(garder177), 'prompt 177 : la purge du mode exposition ne doit pas garder les clés du guide');
}

// Prompt 179 : téléphone — marges des bulles sur la grille 8 px, heure de jeu, bulles découpées entre l'en-tête et le
// pied, plus de mention du chrono dans sms.2, « réputation du réseau », temps gelé à la première lecture
{
	const lire179 = (f) => readFileSync(join(pub, f), 'utf8');
	const telMain = lire179('telephone-main.js');
	const conv = telMain.slice(telMain.indexOf('function contenuConversation'));
	const G = (telMain.match(/const CONV = \{([^}]*)\}/) || [])[1] || '';
	const val = (k) => Number((G.match(new RegExp(k + ': (\\d+)')) || [])[1]);
	verifier(['enTete', 'pied', 'bord', 'marge', 'ecart', 'heure'].every((k) => val(k) > 0 && val(k) % 8 === 0) && val('marge') >= 16 && val('bord') >= 16, `prompt 179 : marges des bulles hors grille 8 px (${G})`);
	verifier(!/textWidth\([^)]*\) \* 1\.\d/.test(conv) && /couperLignes\(/.test(conv), 'prompt 179 : la hauteur des bulles doit venir du vrai retour à la ligne (couperLignes), pas d\'une estimation');
	const iClip = conv.indexOf('drawingContext.clip()');
	const iFin = conv.indexOf('drawingContext.restore()');
	verifier(iClip > 0 && iFin > iClip && conv.indexOf('rect(bx, y, b.w, b.h') > iClip && conv.indexOf('rect(bx, y, b.w, b.h') < iFin && conv.indexOf('circle(') > iClip && conv.indexOf('circle(') < iFin, 'prompt 179 : bulles et « … » doivent être dessinés dans la zone découpée (clip) entre l\'en-tête et le pied');
	verifier(/zoneTexteDebut\('conversationTel'[^\n]*clip: true/.test(conv) && conv.indexOf('zoneTexteFin()') < iFin, 'prompt 179 : la zone des bulles doit être déclarée « clip » à l\'audit des textes');
	verifier(conv.indexOf("t('tel.poser')") > iFin && conv.indexOf("t('intro.suivant')") > iFin, 'prompt 179 : les commandes du pied se dessinent hors de la zone découpée');
	verifier(/text\(heureTelephone\(\)/.test(conv) && /dessinerTexte\(b\.heure/.test(conv) && /heureAffichee\(\)/.test(telMain.slice(telMain.indexOf('function heureTelephone'), telMain.indexOf('const CONV'))), 'prompt 179 : heure de jeu dans la barre d\'état et sous chaque bulle');
	for (const [langue, attendu, chrono, salle, reseau] of [
		['fr', '8 h 02', /chrono/i, /réputation de la salle/i, /réputation du réseau/i],
		['en', '8:02', /timer/i, /room(’s|'s)? reputation/i, /network(’s)? reputation/i],
	]) {
		const c179 = contexte(langue);
		const dico = vm.runInContext(`TRADUCTIONS[${JSON.stringify(langue)}]`, c179);
		verifier(vm.runInContext(`t('tel.heure', { h: 8, m: '02' })`, c179) === attendu, `prompt 179 : format de l'heure du téléphone (${langue})`);
		verifier(!chrono.test(dico['sms.2']) && dico['sms.2'].length > 40, `prompt 179 : sms.2 ne parle plus de chrono et garde la consigne (${langue}) : « ${dico['sms.2']} »`);
		const fautes = Object.keys(dico).filter((k) => salle.test(dico[k]));
		verifier(!fautes.length, `prompt 179 : « réputation de la salle » subsiste (${langue}) : ${fautes.join(', ')}`);
		verifier(['fin.jauge.reputation', 'sms.3'].every((k) => reseau.test(dico[k])), `prompt 179 : « réputation du réseau » attendu dans fin.jauge.reputation et sms.3 (${langue})`);
	}
	// Temps gelé à la première lecture du téléphone, puis comportement normal ; clé purgée par le mode exposition
	verifier(/function tempsSuspendu\(\) \{\n\treturn [^\n]*telephonePremiereLecture\(\)/.test(lire179('immersion.js')), 'prompt 179 : tempsSuspendu() doit tenir compte de la première lecture du téléphone');
	verifier(/function fermer\(\) \{\n\tif \(fenetre === 'telephone'[^\n]*noterTelephoneLu\(\)/.test(lire179('sketch.js')), 'prompt 179 : reposer le téléphone doit noter la première lecture');
	const tel = lire179('telephone.js');
	const st = new Map();
	const ctx179 = (stockage) => {
		const c = vm.createContext({ fenetre: null, TEL: {}, localStorage: { getItem: (k) => (stockage.has(k) ? stockage.get(k) : null), setItem: (k, v) => stockage.set(k, String(v)) } });
		vm.runInContext(tel.slice(tel.indexOf('const CLE_TEL_LU'), tel.indexOf('/** Vue téléphone')) + ';globalThis.CLE = CLE_TEL_LU;', c);
		return c;
	};
	let c = ctx179(st);
	const gel = (cx, f) => vm.runInContext(`fenetre = ${JSON.stringify(f)}; telephonePremiereLecture()`, cx);
	verifier(gel(c, null) === false && gel(c, 'aide') === false && gel(c, 'telephone') === true, 'prompt 179 : seule la première lecture du téléphone gèle le temps');
	vm.runInContext('noterTelephoneLu()', c);
	verifier(gel(c, 'telephone') === false && st.get(c.CLE) === 'oui' && gel(ctx179(st), 'telephone') === false, 'prompt 179 : après la première fermeture (clé mémorisée), le temps ne se gèle plus, même au lancement suivant');
	verifier(gel(ctx179(new Map()), 'telephone') === true, 'prompt 179 : stockage vidé (mode exposition) → la première lecture gèle de nouveau le temps');
	const garder179 = (lire179('expo.js').match(/const GARDER = \[([^\]]*)\]/) || [])[1] || '';
	verifier(c.CLE.startsWith('pxe-nte001') && !garder179.includes(c.CLE) && !/telephone/.test(garder179), 'prompt 179 : la clé de première lecture doit être purgée par le mode exposition');
}

// Prompt 181 : guide « Prendre en main » contraignant — un filtre par type d'entrée (pointeur, clavier) fondé sur le
// rectangle de la cible, « Quitter le guide » rend tout, temps suspendu, aucune étape sans cible ni issue
{
	const lire181 = (f) => readFileSync(join(pub, f), 'utf8');
	const sk = lire181('sketch.js');
	// Points de filtrage uniques, placés avant toute action
	verifier(/function mousePressed\(\) \{[\s\S]*?guideBloque\(mouseX, mouseY\)\) return rappelerConsigneGuide\(\);[^\n]*\n\tif \(typeof debutJeton/.test(sk), 'prompt 181 : mousePressed doit filtrer le clic (guideBloque) avant les jetons, les cartes et les boutons');
	verifier(/interaction\(\);\n\tif \(typeof guideFiltre === 'function' && guideFiltre\(\) && toucheGuide\(\)\) return false;/.test(sk), 'prompt 181 : keyPressed doit passer par toucheGuide avant tout raccourci du jeu');
	verifier(/function mouseWheel\(event\) \{\n\tinteraction\(\);\n\tif \(typeof guideBloque === 'function' && guideBloque\(mouseX, mouseY\)\)/.test(sk), 'prompt 181 : la molette doit être filtrée par guideBloque');
	verifier(/function mouseDragged\(\) \{\n\tif \(typeof guideBloque === 'function' && guideBloque\(pmouseX, pmouseY\)\) return;/.test(lire181('enquete.js')), 'prompt 181 : le glisser doit être filtré par guideBloque');
	verifier(/guideBloque\(d\.x, d\.y\)\) return rappelerConsigneGuide\(\);[^\n]*\n\t\tscrollSortiePC/.test(lire181('mobile.js')), 'prompt 181 : le swipe tactile doit passer par le même filtre, à la position du toucher');
	verifier(/function tempsSuspendu\(\) \{\n\treturn [^\n]*guideSuspendTemps\(\)/.test(lire181('immersion.js')), 'prompt 181 : tempsSuspendu() doit tenir compte du guide');
	for (const langue of ['fr', 'en']) {
		const manquantes = vm.runInContext(`['guide.arreter', 'guide.arrete', 'guide.rappel', 'guide.confirmer', 'guide.attente'].filter((k) => !TRADUCTIONS.${langue}[k])`, contexte(langue));
		verifier(!manquantes.length, `prompt 181 : textes du guide absents (${langue}) : ${manquantes.join(', ')}`);
	}
	// Noms de cibles réellement relevés au dessin (cibleGuide('nom', …) dans les scripts du jeu)
	const relevees = new Set();
	for (const f of ['bureau.js', 'carte.js', 'carte-alertes.js', 'menu-app.js', 'os.js', 'immersion.js', 'panneau.js', 'sieste.js']) for (const m of lire181(f).matchAll(/cibleGuide\('([A-Za-z]+)'/g)) relevees.add(m[1]);
	/** Contexte : le vrai guide.js, un modèle minimal des vues (quelles cibles sont dessinées où) et des actions */
	const ctx181 = () => {
		const c = vm.createContext({});
		vm.runInContext(
			`var L = 1920, H = 1080, ECRAN_POSTE = { x: 0, y: 0, l: 1920, h: 1080 };
			var vue = 'bureau', PC = { etat: 'appli', fenetre: null, flottant: false }, phase = 'attente', ecran = 'jeu', MENU = { actif: false }, fenetre = null, smsActif = false, tutoriel = null;
			var enSieste = false, SOMMEIL = { k: 0 }, clignement = null, Jeu = { historique: [], defiChrono: false }, IMMERSION = { compression: 100 }, PORTRAIT = { actif: false };
			var frameCount = 10, deltaTime = 100, __t = 100000, __annonces = [], __actions = [], __file = [], __bas = [], key = '', keyCode = 0;
			const TAB = 9, SHIFT = 16, CONTROL = 17, ALT = 18, ENTER = 13, RETURN = 13, ESCAPE = 27, UP_ARROW = 38, DOWN_ARROW = 40;
			function millis() { return __t; } function keyIsDown(k) { return __bas.includes(k); } function annoncer(x) { __annonces.push(x); } function t(k) { return k; }
			var Confort = { Son: { bip() {} } }; var localStorage = { getItem: () => null, setItem() {} };
			function sAsseoir() { __actions.push('sAsseoir'); if (vue === 'bureau') vue = 'poste'; } function seLever() { __actions.push('seLever'); if (vue === 'poste') { vue = 'bureau'; PC.fenetre = null; } }
			function quitterPC() { seLever(); } function ouvrirObjetBureau(n) { __actions.push('objet:' + n); if (n === 'aide') fenetre = 'aide'; }
			function fileIncidents() { return __file; } const ENTREES_MENU = ['signalements', 'patron', 'community', 'journal', 'donnees']; function appliDebloquee() { return true; }
			function ouvrirEntreeMenu(k) { __actions.push('menu:' + k); PC.etat = 'os'; PC.fenetre = k; } function versAppliPrincipale() { PC.fenetre = null; PC.etat = 'appli'; } function pcDemarre() { return PC.etat === 'demarrage'; }`,
			c,
		);
		vm.runInContext(lire181('guide.js'), c);
		// Modèle du dessin : les cibles présentes à cette image, selon la vue (mêmes noms que le jeu)
		vm.runInContext(
			`function __dessiner() {
				ciblesGuide = {}; frameCount++; __t += 100;
				if (PC.etat === 'demarrage' && (PC.images = (PC.images || 0) + 1) > 5) versAppliPrincipale(); // prompt 183 : la fin du démarrage mène à l'appli principale
				const pose = (nom, espace) => { espaceDessin = espace; cibleGuide(nom, 100, 100, 200, 100); espaceDessin = 'ecran'; };
				if (vue === 'bureau') ['ecranPC', 'livreAide'].forEach((n) => pose(n, 'ecran'));
				if (vue === 'poste') pose('quitterPC', 'ecran');
				if (vue === 'poste' && PC.etat === 'appli') { ['jauges', 'somnolence', 'iconesOS'].forEach((n) => pose(n, 'pc')); if (__file.length) pose('fileSignalements', 'pc'); if (PHASES_DOSSIER.includes(phase)) pose('actions', 'pc'); }
				if (vue === 'poste' && PC.etat === 'os') ['jauges', 'iconesOS'].forEach((n) => pose(n, 'pc')); // prompt 183 : une autre appli en vue intégrée (bandeau + menu) ; plus de bureau d'icônes
			}
			function __afficher() { __dessiner(); const e = ETAPES_GUIDE[GUIDE.etape]; const z = e && cibleReelle(e.cible()); GUIDE.image = frameCount; GUIDE.trou = z ? { x: z.x - 10, y: z.y - 10, l: z.l + 20, h: z.h + 20 } : null; GUIDE.zones = [{ x: 1300, y: 900, l: 300, h: 48 }]; }
			function __touche(k, code, bas) { key = k; keyCode = code; __bas = bas || []; return toucheGuide(); }`,
			c,
		);
		return c;
	};
	// 1. Chaque étape a une cible relevée par le jeu et une issue ; depuis n'importe quelle vue, la cible redevient
	//    atteignable (le guide ramène la vue), l'étape attend le jeu (temps non suspendu) ou elle est déclarée faite
	const DEPARTS = ["vue = 'bureau'", "vue = 'poste'; PC.etat = 'appli'", "vue = 'poste'; PC.etat = 'os'; PC.fenetre = 'journal'", "vue = 'poste'; PC.etat = 'demarrage'", "vue = 'poste'; PC.etat = 'appli'; phase = 'decision'; __file = [{}]"];
	const nbEtapes = vm.runInContext('ETAPES_GUIDE.length', ctx181());
	verifier(nbEtapes >= 6, `prompt 181 : étapes du guide introuvables (${nbEtapes})`);
	for (let i = 0; i < nbEtapes; i++) {
		for (const depart of DEPARTS) {
			const c = ctx181();
			const r = vm.runInContext(
				`demarrerGuide(); GUIDE.etape = ${i}; ${depart};
				(() => {
					const e = ETAPES_GUIDE[${i}];
					const noms = new Set();
					let issue = '';
					for (let n = 0; n < 120 && !issue; n++) {
						__dessiner();
						noms.add(e.cible());
						if (e.fait()) issue = 'faite';
						else if (cibleReelle(e.cible())) issue = 'cible';
						else if (e.attendre && e.attendre()) issue = guideSuspendTemps() ? '' : 'attente';
						else if (!surveillerCibleGuide(e, null)) issue = 'passee';
					}
					return { id: e.id, issueFn: typeof e.issue === 'function', noms: [...noms], issue, etape: GUIDE.etape };
				})()`,
				c,
			);
			verifier(r.issueFn, `prompt 181 : l'étape « ${r.id} » du guide n'a pas d'issue`);
			verifier(r.noms.length && r.noms.every((n) => relevees.has(n)), `prompt 181 : l'étape « ${r.id} » vise une cible que le jeu ne relève pas (${r.noms.join(', ')})`);
			verifier(!!r.issue, `prompt 181 : étape « ${r.id} » bloquante depuis « ${depart} » (ni cible, ni attente, ni étape passée)`);
		}
	}
	// 2. Filtre du pointeur : hors cible ignoré (et consigne rappelée), cible et bouton de la bulle passés
	let c = ctx181();
	vm.runInContext('demarrerGuide(); __afficher(); __annonces.length = 0', c);
	const bloque = (x, y) => vm.runInContext(`guideBloque(${x}, ${y})`, c);
	verifier(bloque(600, 600) === true && bloque(20, 20) === true, 'prompt 181 : un clic hors de la cible doit être ignoré pendant le guide');
	verifier(bloque(150, 150) === false, 'prompt 181 : un clic sur la cible éclairée doit passer');
	verifier(bloque(1400, 920) === false, 'prompt 181 : le bouton « Quitter le guide » doit rester cliquable');
	vm.runInContext('rappelerConsigneGuide()', c);
	verifier(vm.runInContext("__annonces.length === 1 && __annonces[0].startsWith('guide.rappel') && __annonces[0].includes('guide.installer') && GUIDE.rappel === __t", c), 'prompt 181 : un geste hors cible doit rappeler la consigne (bulle signalée, annonce)');
	verifier(vm.runInContext('guideSuspendTemps()', c) === true, 'prompt 181 : le temps doit être suspendu tant qu\'une étape attend le joueur');
	// Bulle absente de l'image (clignement, changement de vue) : rien ne passe, pas même l'ancienne cible
	vm.runInContext('frameCount += 5', c);
	verifier(bloque(150, 150) === true, 'prompt 181 : sans bulle affichée, l\'ancienne cible ne doit plus laisser passer le clic');
	// Écrans qui ont leur propre interaction : le filtre se retire (pas d'impasse), puis revient
	vm.runInContext("__afficher(); fenetre = 'telephone'", c);
	verifier(bloque(600, 600) === false && vm.runInContext('guideSuspendTemps()', c) === false, 'prompt 181 : une fenêtre ouverte doit rester utilisable pendant le guide');
	vm.runInContext('fenetre = null; enSieste = true', c);
	verifier(bloque(600, 600) === false, 'prompt 181 : la sieste et le réveil ne doivent pas être bloqués par le guide');
	vm.runInContext('enSieste = false; PORTRAIT.actif = true', c);
	verifier(bloque(600, 600) === false, 'prompt 181 : en portrait, le guide ne doit jamais bloquer');
	vm.runInContext('PORTRAIT.actif = false', c);
	verifier(bloque(600, 600) === true, 'prompt 181 : le filtre doit reprendre après la fenêtre');
	// « Quitter le guide » rend tout
	vm.runInContext('arreterGuide()', c);
	verifier(bloque(600, 600) === false && bloque(20, 20) === false && vm.runInContext('guideFiltre() || guideSuspendTemps()', c) === false, 'prompt 181 : « Quitter le guide » doit rendre toutes les interactions et le temps');
	// 3. Filtre du clavier
	c = ctx181();
	vm.runInContext('demarrerGuide(); __afficher()', c);
	const touche = (k, code, bas = []) => vm.runInContext(`__touche(${JSON.stringify(k)}, ${code}, ${JSON.stringify(bas)})`, c);
	verifier(touche('p', 80) === true && touche('h', 72) === true && touche('z', 90) === true && vm.runInContext("vue === 'bureau' && !fenetre && __actions.length === 0", c), 'prompt 181 : une touche qui n\'actionne pas la cible doit être ignorée');
	verifier(touche('l', 76) === false && touche('f', 70) === false && touche('r', 82, [17]) === false, 'prompt 181 : langue, plein écran et raccourcis du navigateur ne doivent pas être avalés');
	// Tab piégé entre la cible et « Quitter le guide » ; Entrée sur « Quitter » quitte
	const focus = () => vm.runInContext('focusGuide()', c);
	verifier(focus() === 'cible' && touche('Tab', 9) === true && focus() === 'quitter' && touche('Tab', 9) === true && focus() === 'cible' && touche('Tab', 9, [16]) === true && focus() === 'quitter', 'prompt 181 : Tab / Maj+Tab doivent tourner entre la cible et « Quitter le guide »');
	vm.runInContext('GUIDE.etape = 1; razEtapeGuide(); vue = "poste"; __afficher()', c);
	verifier(touche('Tab', 9) && focus() === 'suivante' && touche('Tab', 9) && focus() === 'quitter' && touche('Tab', 9) && focus() === 'cible', 'prompt 181 : étape de lecture — Tab passe par « Étape suivante » puis « Quitter le guide »');
	vm.runInContext('GUIDE.etape = 0; razEtapeGuide(); vue = "bureau"; __afficher()', c);
	verifier(touche('Enter', 13) === true && vm.runInContext("__actions.join() === 'sAsseoir' && vue === 'poste'", c), 'prompt 181 : Entrée sur la cible focalisée doit actionner la cible (s\'installer)');
	// Touches de l'étape : 1 à 3 passent au jeu quand les répliques sont la cible ; flèches / Entrée pour la file
	vm.runInContext("GUIDE.etape = ETAPES_GUIDE.findIndex((e) => e.id === 'actions'); razEtapeGuide(); PC.etat = 'appli'; phase = 'decision'; __file = [{}]; __afficher()", c);
	verifier(touche('1', 49) === false && touche('5', 53) === true && touche('e', 69) === true, 'prompt 181 : seules les touches des répliques doivent passer à l\'étape « actions »');
	// Échap : confirmation courte (deux pressions en moins de 5 s), sinon le guide continue
	verifier(touche('Escape', 27) === true && vm.runInContext("GUIDE.actif && __annonces[__annonces.length - 1] === 'guide.confirmer'", c), 'prompt 181 : Échap doit demander confirmation avant de quitter le guide');
	vm.runInContext('__t += 6000', c);
	verifier(touche('Escape', 27) === true && vm.runInContext('GUIDE.actif', c) === true, 'prompt 181 : la confirmation d\'Échap doit expirer (5 s)');
	verifier(touche('Escape', 27) === true && vm.runInContext('GUIDE.actif', c) === false && vm.runInContext('guideBloque(600, 600)', c) === false, 'prompt 181 : Échap deux fois doit quitter le guide et tout rendre');
	// 4. Temps : suspendu quand l'étape attend le joueur, libre quand elle attend le jeu (premier signalement)
	c = ctx181();
	vm.runInContext("demarrerGuide(); GUIDE.etape = ETAPES_GUIDE.findIndex((e) => e.id === 'prendre'); vue = 'poste'; PC.etat = 'appli'; __file = []; __afficher()", c);
	verifier(vm.runInContext('guideSuspendTemps()', c) === false && vm.runInContext("texteEtapeGuide(ETAPES_GUIDE[GUIDE.etape]) === 'guide.attente'", c), 'prompt 181 : en attendant le premier signalement, le temps doit couler et la bulle le dire');
	verifier(bloque.call(null, 0, 0) !== undefined && vm.runInContext('guideBloque(600, 600)', c) === true, 'prompt 181 : pendant l\'attente du signalement, les autres interactions restent ignorées');
	vm.runInContext('__file = [{}]; __afficher()', c);
	verifier(vm.runInContext('guideSuspendTemps() && guideBloque(150, 150) === false', c), 'prompt 181 : signalement arrivé → temps suspendu, cible cliquable');
}

// Prompt 182 : vue bureau ≠ vue PC — l'appli n'est interactive qu'au poste (un seul prédicat, un seul convertisseur de
// pointeur) ; sortie volontaire du PC (bouton, Échap, molette, balayage) seulement quand aucun choix n'attend.
{
	const lire182 = (f) => readFileSync(join(pub, f), 'utf8');
	const bu = lire182('bureau.js');
	const sk = lire182('sketch.js');
	verifier(/function sourisVersEcran\(\) \{[\s\S]{0,120}pointeurEcranPC\(mouseX, mouseY\)/.test(bu), 'prompt 182 : le survol du contenu du PC doit passer par pointeurEcranPC (aucun survol en vue bureau)');
	verifier(/function sourisPC\(\) \{\n\treturn typeof pointeurEcranPC === 'function' \? pointeurEcranPC\(mouseX, mouseY\)/.test(lire182('glisser.js')) && /function sourisEcranPC\(\) \{\n\treturn pointeurEcranPC\(mouseX, mouseY\)/.test(lire182('os.js')), 'prompt 182 : sourisPC / sourisEcranPC doivent passer par pointeurEcranPC (aucun geste sur l\'appli en vue bureau)');
	verifier(/if \(auPoste\) \{[\s\S]{0,260}\} else boutons = \[\];/.test(bu), 'prompt 182 : hors du poste, les boutons du contenu du PC doivent être vidés (composerVue)');
	verifier(/appliInteractive\(\) && typeof toucheCarte === 'function' && toucheCarte\(\)/.test(sk), 'prompt 182 : les raccourcis de la carte ne doivent répondre qu\'au poste');
	const kp = sk.slice(sk.indexOf('function keyPressed()'), sk.indexOf('function mouseWheel('));
	verifier(!/seLever\(\)/.test(kp) && (kp.match(/quitterPC\(\)/g) || []).length >= 4, 'prompt 182 : au clavier, toute sortie du PC doit passer par quitterPC() (Échap, Entrée sur le bouton), jamais par seLever()');
	verifier(/scrollSortiePC\(dy < 0 \? -150 : 150\)/.test(lire182('mobile.js')) && /action: quitterPC, primaire: false, desactive: !!raisonRetenuAuPC\(\)/.test(lire182('portrait.js')), 'prompt 182 : balayage (mobile) et bouton « Se lever » (portrait) doivent suivre la même règle de sortie');
	verifier(/bouton\(b\.x, b\.y, b\.l, b\.h, t\(GUIDE\.actif \? 'poste\.quitter_pc_guide' : 'poste\.quitter_pc'\), quitterPC, !!raison\)/.test(bu), 'prompt 182 : le bouton « Quitter le PC » doit être désactivé tant qu\'un choix attend');
	verifier(/t\('bureau\.inviteInstaller'\)/.test(bu) && /else if \(vue === 'bureau'\) \{[\s\S]{0,200}fill\(13, 12, 12, 96\)/.test(bu), 'prompt 182 : en vue bureau, écran assombri et invite « S\'installer au PC »');
	const c = vm.createContext({ Math });
	vm.runInContext(
		`var vue = 'poste', phase = 'decision', ecran = 'jeu', fenetre = null, smsActif = false, clignement = null, __t = 100000, __actions = [], __annonces = [];
		var L = 1920, H = 1080, PC = { fenetre: null, etat: 'appli' }, MENU = { actif: false }, PHASES_ACTIVES = ['decision', 'contradiction', 'conflit'];
		var GUIDE = { actif: false, etape: 0 }, ETAPES_GUIDE = [{ id: 'quitter' }];
		function guideEnCours() { return GUIDE.actif; } function millis() { return __t; } function annoncer(x) { __annonces.push(x); } function t(k) { return k; }
		function seLever() { __actions.push('seLever'); vue = 'bureau'; } function sAsseoir() { __actions.push('sAsseoir'); vue = 'poste'; }
		const ECRAN_POSTE = { x: 96, y: 40, l: 1728, h: 972 };` +
			bu.slice(bu.indexOf('const appliInteractive'), bu.indexOf('function sourisVersEcran()')) +
			bu.slice(bu.indexOf('// ——— Prompt 26 : sortir du PC'), bu.indexOf('// ——— Prompt 21 § 2')),
		c,
	);
	const ex = (code) => vm.runInContext(code, c);
	// Dossier ouvert : dix crans de molette vers le bas ne font pas quitter le PC (et ne font pas défiler la page)
	for (const ph of ['decision', 'contradiction', 'conflit']) {
		ex(`phase = '${ph}'; vue = 'poste'; __actions = []; var __r = []; for (let i = 0; i < 10; i++) { __t += 700; __r.push(scrollSortiePC(120)); }`);
		verifier(ex(`vue === 'poste' && __actions.length === 0 && __r.every((x) => x === true)`), `prompt 182 : ${ph} — dix crans de molette ne doivent pas faire quitter le PC`);
		ex(`__annonces = []; var __q = quitterPC();`);
		verifier(ex(`__q === false && vue === 'poste' && __actions.length === 0 && __annonces.length === 1 && __annonces[0].indexOf('poste.quitter_retenu') === 0`), `prompt 182 : ${ph} — « Quitter le PC » (bouton, Échap) doit être refusé avec sa raison annoncée`);
	}
	verifier(ex(`raisonRetenuAuPC() === 'poste.quitter_retenu'`), 'prompt 182 : un choix en attente doit retenir au PC');
	// Guide « Prendre en main », étape « quitter » : jamais d'impasse
	verifier(ex(`GUIDE.actif = true; const __g = raisonRetenuAuPC(); GUIDE.actif = false; __g === null`), 'prompt 182 : l\'étape « quitter » du guide ne doit jamais être retenue');
	// Aucun choix : un cran suffit ; le bouton et Échap font se lever
	for (const ph of ['attente', 'selection', 'narration']) {
		ex(`phase = '${ph}'; vue = 'poste'; __actions = []; __t += 5000; scrollSortiePC(120);`);
		verifier(ex(`__actions.join() === 'seLever'`), `prompt 182 : ${ph} — un cran de molette vers le bas doit suffire à quitter le PC`);
		ex(`vue = 'poste'; __actions = []; var __q = quitterPC();`);
		verifier(ex(`__q === true && __actions.join() === 'seLever'`), `prompt 182 : ${ph} — « Quitter le PC » doit faire se lever`);
	}
	// Vue bureau : la molette vers le haut installe, vers le bas ne fait rien ; le pointeur n'existe pas pour l'appli
	ex(`phase = 'decision'; vue = 'bureau'; __actions = []; __t += 5000; scrollSortiePC(120); __t += 5000; scrollSortiePC(-120);`);
	verifier(ex(`__actions.join() === 'sAsseoir'`), 'prompt 182 : au bureau, la molette vers le haut installe au PC, même avec un dossier ouvert');
	verifier(ex(`vue = 'bureau'; pointeurEcranPC(960, 400).x < -1000 && !appliInteractive()`) && ex(`vue = 'zoom-avant'; pointeurEcranPC(960, 400).x < -1000`), 'prompt 182 : hors du poste (bureau, zoom), le pointeur doit être hors de l\'écran du PC');
	verifier(ex(`vue = 'poste'; const __p = pointeurEcranPC(96 + 864, 40 + 486); Math.round(__p.x) === 960 && Math.round(__p.y) === 540`), 'prompt 182 : au poste, le pointeur doit être ramené dans le repère 1920×1080 de l\'écran');
}

// Prompt 183 : plus de bureau d'icônes RégulOS — le PC mène directement à l'appli principale ; plus de fenêtre
// d'introduction d'appli, plus de bouton « Pause » ni de texte d'objectif dans l'appli (le bandeau garde l'objectif)
{
	const lire183 = (f) => readFileSync(join(pub, f), 'utf8');
	const os = lire183('os.js');
	const sk = lire183('sketch.js');
	const ma = lire183('menu-app.js');
	const tous = readdirSync(pub).filter((f) => f.endsWith('.js') && f !== 'sw.js' && f !== 'i18n.js').map(lire183).join('\n');
	for (const mort of ['GRILLE_OS', 'BARRE_OS', 'retourAccueilPC', 'dessinerBoutonDemarrer', 'focusDemarrer', 'dessinerBarreTaches', 'dessinerFenetreApp', 'dessinerFermerAppli', 'CLE_INTRO_APPLIS', 'fenetreDeblocage', 'verifierDeblocages', "'iconeSignalements'"]) verifier(!tous.includes(mort), `prompt 183 : « ${mort} » (bureau d'icônes / intro d'appli) ne doit plus exister`);
	verifier(/if \(tB >= DUREE_DEMARRAGE\) versAppliPrincipale\(\)/.test(os) && !/PC\.etat = 'os';\n\tPC\.fenetre = null/.test(tous), 'prompt 183 : la fin du démarrage doit mener à l\'appli principale, jamais à un bureau sans fenêtre');
	verifier(/function dessinerOS\(\) \{\n\tif \(PC\.etat === 'demarrage'\) return dessinerDemarrage\(\);\n\tbackground\('#050607'\);\n\tif \(PC\.etat !== 'eteint'\) versAppliPrincipale\(\);[^\n]*\n\}/.test(os), 'prompt 183 : dessinerOS ne doit plus dessiner que le PC éteint et le démarrage');
	verifier(/function fermerFenetreApp\(\) \{\n\tversAppliPrincipale\(\);\n\}/.test(os), 'prompt 183 : fermer une appli doit ramener à l\'appli principale');
	verifier(!/fenetre === 'deblocage'|'deblocage'/.test(sk) && !/deblocage:/.test(lire183('portrait.js')) && !/ouvrir\('deblocage'\)/.test(tous), 'prompt 183 : la fenêtre d\'introduction d\'appli (« deblocage ») doit avoir disparu partout');
	verifier(!/pause\.pause/.test(tous) && /if \(key === 'p' \|\| key === 'P'\) return basculerPause\(\), false;/.test(sk), 'prompt 183 : plus de bouton « Pause » dans l\'appli ; la touche P reste');
	verifier(!/fil\.objectif/.test(tous) && /bandeau\.objectifCourt/.test(lire183('panneau.js')), 'prompt 183 : plus de texte d\'objectif dans l\'appli ; le bandeau garde l\'objectif');
	verifier(/if \(keyCode === TAB\) return ecran === 'jeu' && phase !== 'fin' \? tabMenuApp\(\) : basculerFocusQuitter\(!focusQuitter\), false;/.test(sk) && /if \(MENU_FOCUS\.actif && ecran === 'jeu' && \(keyCode === ENTER \|\| keyCode === RETURN \|\| key === ' '\)\) return ouvrirEntreeMenu\(ICONES_OS\[PC\.selection\]\.cle\), false;/.test(sk), 'prompt 183 : depuis la carte, Tab doit parcourir le menu d\'applis et Entrée ouvrir l\'entrée focalisée');
	// Cycle de Tab (modèle) : aucun focus → entrées du menu sauf l'active → « Quitter le PC » → aucun focus
	const c = vm.createContext({});
	vm.runInContext(
		`var PC = { etat: 'appli', fenetre: null, selection: 0 }, focusQuitter = false, __bas = false, __annonces = [], ecran = 'jeu', phase = 'attente';
		const SHIFT = 16; function keyIsDown() { return __bas; } function annoncer(x) { __annonces.push(x); } function basculerFocusQuitter(a) { focusQuitter = a; }
		const ICONES_OS = ['signalements', 'patron', 'community', 'journal', 'donnees'].map((cle) => ({ cle })); function libelleEntreeMenu(k) { return k; }`,
		c,
	);
	vm.runInContext(ma.slice(ma.indexOf('const VUES_APP'), ma.indexOf('function dessinerMenuApp')) + ma.slice(ma.indexOf('function tabMenuApp'), ma.indexOf('/** Contenu de la vue intégrée')), c);
	const tour = (n) => vm.runInContext(`(() => { const r = []; for (let i = 0; i < ${n}; i++) { tabMenuApp(); r.push(focusQuitter ? 'quitter' : MENU_FOCUS.actif ? ICONES_OS[PC.selection].cle : '-'); } return r.join(' '); })()`, c);
	verifier(tour(6) === 'patron community journal donnees quitter -', `prompt 183 : cycle de Tab depuis la carte inattendu (${tour(0)})`);
	vm.runInContext("PC.etat = 'os'; PC.fenetre = 'journal'", c);
	verifier(tour(6) === 'signalements patron community donnees quitter -', 'prompt 183 : depuis une autre appli, Tab doit proposer la carte et sauter l\'appli affichée');
	vm.runInContext('__bas = true', c);
	verifier(tour(2) === 'quitter donnees', 'prompt 183 : Maj + Tab doit parcourir le menu dans l\'autre sens');
	const c183 = contexte('fr');
	for (const langue of ['fr', 'en']) {
		const dico = vm.runInContext(`TRADUCTIONS.${langue}`, c183);
		const restes = Object.keys(dico).filter((k) => /^(applis\.intro\.|os\.demarrer|app\.titre\.|os\.aideClavier$|os\.jauges$|pause\.pause$|fil\.objectif|guide\.ouvrirSignalements$|guide\.apps\.fermer$|app\.bureau$|applis\.nouvelle$)/.test(k));
		verifier(!restes.length, `prompt 183 : clés orphelines (${langue}) : ${restes.join(', ')}`);
	}
}


// Prompt 185 : l'appli « Patron » devient « Mails » — messagerie en zones, compteurs par dossier, badge = non lus,
// « Voir le dossier » (cause du défaut : identité d'objet perdue après une sauvegarde rechargée → retour à la carte)
{
	const ap = readFileSync(join(pub, 'applis.js'), 'utf8');
	const pj = readFileSync(join(pub, 'patron.js'), 'utf8');
	const c = vm.createContext({});
	vm.runInContext(
		`var PC = { etat: 'os', fenetre: 'patron' }, JOURNAL = { jour: null, enquete: null, volet: 0 }, COMMU = { onglet: 'fil' }, __sig = [];
		const Confort = { Reglages: {}, Son: { clic() {}, bip() {} } }; function annoncer() {} function t(k) { return k; } function millis() { return 0; }
		function ouvrirSignalements(d) { PC.fenetre = null; PC.etat = 'appli'; __sig.push(d.id); }
		var Jeu = { TYPES_MESSAGES: ['consigne', 'alerte', 'conseil', 'budget', 'reproche', 'equipes', 'info'], paquet: [{ id: 'A', date: 'J1' }, { id: 'B', date: 'J1' }], jours: [{ date: 'J0' }, { date: 'J1' }], evenementsJournee: [], messagesPatron: [] };
		Jeu.evenementsJournee.push({ jour: 'J1', index: 0, resultat: { dossier: JSON.parse(JSON.stringify(Jeu.paquet[0])) } }); // copie : comme après une sauvegarde rechargée
		Jeu.messagesPatron.push({ type: 'reproche', meta: { index: 0 }, texte: 'clos' }, { type: 'reproche', meta: { blame: true, malus: -5 }, texte: 'sans dossier' }, { type: 'reproche', meta: { index: 1 }, texte: 'ouvert' });
		var PATRON = { filtre: 'reproches', sel: null, lecture: false, deplies: new Set() };`,
		c,
	);
	vm.runInContext(ap.slice(ap.indexOf('const APPLIS')), c);
	vm.runInContext(pj.slice(pj.indexOf('const aUnBloc'), pj.indexOf('const enPanne')), c);
	const r = vm.runInContext(
		`(() => {
		const r = {};
		PATRON.sel = Jeu.messagesPatron[0];
		voirDossierDepuis(Jeu.messagesPatron[0].meta.index);
		r.clos = PC.fenetre + ' ' + JOURNAL.jour + ' ' + JOURNAL.enquete;
		r.retourClos = retourRedirection('journal') && PC.fenetre === 'patron' && PATRON.sel === Jeu.messagesPatron[0] && PATRON.filtre === 'reproches';
		r.retourVide = retourRedirection('journal');
		PATRON.sel = Jeu.messagesPatron[2];
		voirDossierDepuis(Jeu.messagesPatron[2].meta.index);
		r.ouvert = PC.etat + ' ' + PC.fenetre + ' ' + __sig.join(',');
		r.retourOuvert = depilerNavigation() && PC.fenetre === 'patron' && PATRON.sel === Jeu.messagesPatron[2];
		r.sansDossier = aUnBloc(Jeu.messagesPatron[1]);
		r.avecDossier = aUnBloc(Jeu.messagesPatron[0]);
		return r;
	})()`,
		c,
	);
	verifier(r.clos === 'journal 1 0', `prompt 185 : « Voir le dossier » d'un dossier clos (sauvegarde rechargée) doit ouvrir sa fiche du Journal (${r.clos})`);
	verifier(r.retourClos === true && r.retourVide === false, 'prompt 185 : « Retour » / Échap sur la fiche doit rouvrir le mail d\'origine, et seulement après une redirection');
	verifier(r.ouvert === 'appli null B', `prompt 185 : dossier encore ouvert → Signalements sur ce dossier (${r.ouvert})`);
	verifier(r.retourOuvert === true, 'prompt 185 : Échap depuis Signalements doit revenir au mail d\'origine');
	verifier(r.sansDossier === false && r.avecDossier === true && /type === 'reproche' && me\.index !== undefined\) \{[\s\S]{0,700}?voirDossier\(me\)/.test(pj), 'prompt 185 : un mail sans dossier ne montre pas de lien « Voir le dossier »');
	verifier(/retourRedirection\('journal'\) \|\| \(JOURNAL\.enquete = null\)/.test(readFileSync(join(pub, 'journal.js'), 'utf8')), 'prompt 185 : le bouton Retour de la fiche revient d\'abord au mail');
	// Nom affiché, compteurs, badge, clip de la liste
	const c185 = contexte('fr');
	for (const [langue, nom] of [['fr', 'Mails'], ['en', 'Mail']]) {
		const dico = vm.runInContext(`TRADUCTIONS.${langue}`, c185);
		verifier(dico['app.patron'] === nom && dico['menuApp.patron'] === nom, `prompt 185 : l'appli doit s'appeler « ${nom} » (${langue})`);
		const restes = Object.entries(dico).filter(([k, v]) => /^(tuto\.5\.texte|guide\.apps\.ouvrir)$/.test(k) && /\b(Patron|Boss),/.test(v));
		verifier(!restes.length, `prompt 185 : « Patron » / « Boss » encore cité comme nom d'appli (${langue}) : ${restes.map((x) => x[0])}`);
		verifier(['patron.compteur', 'patron.annonceMail', 'patron.zone.liste', 'patron.aucunSel', 'patron.retourListe'].every((k) => dico[k]), `prompt 185 : clés de la messagerie manquantes (${langue})`);
		verifier(!['patron.epingle', 'patron.nouveaux', 'patron.lu', 'patron.envoye', 'patron.vu'].some((k) => k in dico), `prompt 185 : clés orphelines de l'ancienne conversation (${langue})`);
	}
	verifier(/if \(cle === 'patron'\) return typeof mailsNonLus === 'function' \? mailsNonLus\(\)/.test(readFileSync(join(pub, 'multitache.js'), 'utf8')), 'prompt 185 : le badge de Mails doit compter les mails non lus');
	verifier(/zoneTexteDebut\('listeMails', [^)]*\{ clip: true \}\)/.test(pj) && /function zoneDossiers[\s\S]*compteursMails\(f\.cle\)/.test(pj), 'prompt 185 : liste masquée et déclarée à l\'audit, compteurs sur chaque dossier');
	verifier(/iconeLucide\('mail'/.test(pj) && /'inbox'/.test(pj) && /primaireRGBA\(0\.16\)/.test(pj), 'prompt 185 : icônes Lucide et accent du DS');
}

// Prompt 195 : Mails ressemble à une vraie messagerie — barre d'outils (recherche, Répondre, Archiver, Marquer comme
// non lu, Voir le dossier), pastille d'initiales, groupes par jour de jeu, état vide, archivage mémorisé (m.archive)
{
	const pj = readFileSync(join(pub, 'patron.js'), 'utf8');
	const c = vm.createContext({});
	vm.runInContext(
		`var PC = { etat: 'os', fenetre: 'patron' }, __ann = [], reduireAnimations = false;
		const Confort = { Son: { clic() {}, bip() {} } }; function annoncer(x) { __ann.push(x); } function millis() { return 0; }
		function t(k, p) { return p ? k + JSON.stringify(p) : k; } function dateLongue(iso) { return 'lundi ' + iso; } function constrain(v, a, b) { return Math.max(a, Math.min(b, v)); }
		var Jeu = { TYPES_MESSAGES: ['consigne', 'alerte', 'conseil', 'budget', 'reproche', 'equipes', 'info', 'soir'], jourCourant: () => ({ date: '2026-09-14' }), horloge: { minutes: 600 }, formaterHeure: () => '10:00', modificateurActif: () => null, messagesPatron: [] };
		Jeu.messagesPatron.push(
			{ type: 'consigne', jour: '2026-09-10', heure: '08:00', texte: 'Gardez la réputation', meta: { jauge: 'reputation' }, lu: true },
			{ type: 'info', jour: '2026-09-13', heure: '17:40', texte: 'Bonne journée hier', meta: {}, lu: true },
			{ type: 'reproche', jour: '2026-09-14', heure: '09:14', texte: 'Décision coûteuse', meta: { index: 0 }, lu: false },
			{ type: 'alerte', jour: '2026-09-14', heure: '09:40', texte: 'La fluidité baisse', meta: { jauge: 'fluidite', v: 28, seuil: 30 }, lu: false });`,
		c,
	);
	vm.runInContext(pj.slice(pj.indexOf('const PATRON')), c);
	const r = vm.runInContext(
		`(() => {
		const r = {}, M = Jeu.messagesPatron;
		r.init = [initiales('Direction de la régulation'), initiales('Traffic control management'), initiales('Vous'), initiales('')].join(',');
		r.jours = rangeesMails(listeMails().liste).map((x) => (x.m ? x.m.heure : x.jour)).join(',');
		PATRON.recherche = 'FLUIDITE';
		r.rech = listeMails().liste.map((m) => m.heure).join(',');
		PATRON.recherche = 'mail.de';
		r.rechDe = listeMails().liste.length;
		PATRON.recherche = 'zzz';
		r.rechVide = listeMails().liste.length + ' ' + annonceMail(null);
		PATRON.recherche = '';
		r.icones = actionsMails(M[2]).map((a) => a.icone + (a.actif ? '+' : '-')).join(',');
		r.iconesInfo = actionsMails(M[1]).map((a) => a.icone + (a.actif ? '+' : '-')).join(',');
		r.nl0 = mailsNonLus();
		archiverMail(M[3]);
		r.arch = [M[3].archive, mailsDuFiltre('tout').includes(M[3]), mailsDuFiltre('alertes').length, mailsDuFiltre('archives').length, compteursMails('tout').nl, mailsNonLus()].join(',');
		const copie = JSON.parse(JSON.stringify(M)); // la sauvegarde sérialise Jeu.messagesPatron tel quel
		r.sauve = copie[3].archive === true && copie[2].archive === undefined;
		r.iconeArch = actionsMails(M[3])[1].icone;
		archiverMail(M[3]);
		r.desarch = M[3].archive === undefined && mailsDuFiltre('archives').length === 0;
		PATRON.filtre = 'archives';
		r.vide = listeMails().liste.length + ' ' + annonceMail(null);
		PATRON.filtre = 'tout';
		listeMails();
		marquerLu(M[2]);
		marquerNonLu(M[2]);
		marquerLu(M[2]);
		r.nonLu = M[2].lu;
		ouvrirMail(M[2], true);
		marquerLu(M[2]);
		r.relu = M[2].lu;
		repondreRapide(M[2], 'corrige');
		r.rep = M[2].reponse + ' ' + M[2].reponseA + ' ' + actionsMails(M[2])[0].actif;
		return r;
	})()`,
		c,
	);
	verifier(r.init === 'DR,TM,V,?', `prompt 195 : initiales de l'expéditeur (${r.init})`);
	verifier(r.jours === 'patron.jour.aujourdhui,09:40,09:14,patron.jour.hier,17:40,Lundi 2026-09-10,08:00', `prompt 195 : groupes par jour de jeu (Aujourd'hui, Hier, date) (${r.jours})`);
	verifier(r.rech === '09:40' && r.rechDe === 4 && r.rechVide === '0 patron.videRecherche{"q":"zzz"}', `prompt 195 : recherche sans casse ni accents sur texte / expéditeur, état vide annoncé (${r.rech} / ${r.rechDe} / ${r.rechVide})`);
	verifier(r.icones === 'reply+,archive+,mail-,external-link+' && r.iconesInfo === 'reply+,archive+,mail+', `prompt 195 : actions de la barre (Voir le dossier seulement si le mail en cite un) (${r.icones} / ${r.iconesInfo})`);
	verifier(r.nl0 === 2 && r.arch === 'true,false,0,1,1,1' && r.sauve && r.iconeArch === 'inbox' && r.desarch, `prompt 195 : archiver déplace dans « Archives », hors compteurs et badge, mémorisé dans la sauvegarde (${r.arch})`);
	verifier(r.vide.startsWith('0 patron.vide{'), `prompt 195 : dossier vide annoncé (${r.vide})`);
	verifier(r.nonLu === false && r.relu === true, 'prompt 195 : « Marquer comme non lu » tient jusqu\'à la prochaine ouverture du mail');
	verifier(r.rep === 'corrige 10:00 false', `prompt 195 : réponse rapide datée (heure de jeu), plus proposée ensuite (${r.rep})`);
	verifier(/function etatVide[\s\S]{0,200}iconeLucide\('inbox'/.test(pj) && /function reponseCitee/.test(pj) && /function zoneRepondre/.test(pj) && /pastilleInitiales\(t\('mail\.de'\)/.test(pj), 'prompt 195 : état vide « inbox », réponse citée, zone Répondre, pastille d\'initiales');
	verifier(!/\b(lu|archive|reponse)\b[^\n]*Jeu\.(jauges|score)/.test(pj), 'prompt 195 : archiver / non lu / répondre sans effet de jeu');
	verifier(/messagesPatron: Jeu\.messagesPatron,/.test(readFileSync(join(pub, 'game.js'), 'utf8')), 'prompt 195 : Jeu.instantane sauve les mails tels quels (archive comprise)');
	const sk = readFileSync(join(pub, 'sketch.js'), 'utf8');
	verifier(/toucheGuide\(\)\) return false;[^\n]*\n\tif \(!smsActif && !tutoriel && typeof saisieRechercheMails === 'function' && saisieRechercheMails\(\)\) return false;/.test(sk) && /rechercheMailsActive\(\)\)\) return;/.test(readFileSync(join(pub, 'micro.js'), 'utf8')), 'prompt 195 : la frappe dans la recherche de Mails passe avant les raccourcis (M compris)');
	for (const langue of ['fr', 'en']) {
		const dico = vm.runInContext(`TRADUCTIONS.${langue}`, contexte(langue));
		const cles = ['patron.filtre.archives', 'patron.categories', 'patron.recherche', 'patron.recherche.effacer', 'patron.recherche.resultats', 'patron.action.repondre', 'patron.action.archiver', 'patron.action.desarchiver', 'patron.action.nonLu', 'patron.archive', 'patron.desarchive', 'patron.marqueNonLu', 'patron.indisponible', 'patron.vide', 'patron.videRecherche', 'patron.jour.aujourdhui', 'patron.jour.hier', 'patron.de', 'patron.a', 'patron.aDe', 'patron.vous', 'patron.repondreA', 'patron.reponses', 'patron.citation', 'patron.zone.barre'];
		const manquantes = cles.filter((k) => !dico[k]);
		verifier(!manquantes.length, `prompt 195 : clés manquantes (${langue}) : ${manquantes.join(', ')}`);
		verifier(!('app.pasMessage' in dico) && !('patron.role' in dico), `prompt 195 : clés orphelines (${langue})`);
	}
}

// Prompt 174 : raccourcis — l'onglet Raccourcis de l'aide (RACCOURCIS_AIDE) ne cite que des touches lues par le code,
// aucune clé aide.k.* orpheline ; plus de touche pour les actions rares (R = recommencer, B = publier, S = sortie,
// J = journal du game over) ; Ctrl / Cmd / Alt et les champs de saisie laissés au navigateur ; menu du jeu = pause
{
	const lire174 = (f) => readFileSync(join(pub, f), 'utf8');
	const fichiers174 = readdirSync(pub).filter((f) => f.endsWith('.js') && !/^(i18n|sw|audit-|icones-lucide)/.test(f));
	const code = fichiers174.map(lire174).join('\n');
	const aide = lire174('aide.js');
	const lettre = (k) => new RegExp(`key === '${k.toLowerCase()}' \\|\\| key === '${k}'`);
	const LUES = {
		'Entrée|Enter': /keyCode === ENTER/, '1 à 3|1 to 3': /TOUCHES_REPONSES\.indexOf\(key\)/, 'A / B': /key === 'a' \|\| key === 'A'\) choisirSource/,
		'E / 5–8': /key === 'e' \|\| key === 'E'\) return basculerPlus[\s\S]*touche: '8'|touche: '8'[\s\S]*key === 'e' \|\| key === 'E'\) return basculerPlus/, 'Glisser|Drag': /function mouseDragged/, 'Maj + 1 à 4|Shift + 1–4': /keyIsDown\(SHIFT\) \|\| keyCode < 49 \|\| keyCode > 52/,
		'↑ ↓': /SELECTION\.focus = \(SELECTION\.focus \+ \(keyCode === UP_ARROW/, '+ / −': /key === '\+' \|\| key === '='\) return zoomer/, 'Origine|Home': /keyCode === 36\) return recentrer/,
		'Tab': /keyCode === TAB/, '← → ↑ ↓': /keyIsDown\(LEFT_ARROW\)/, 'Molette / Échap|Wheel / Esc': /function mouseWheel[\s\S]*keyCode === ESCAPE/, 'H ou ?|H or ?': /key === 'h' \|\| key === 'H' \|\| key === '\?'\) return ouvrir\('aide'\)/,
		'Z': /key === 'z' \|\| key === 'Z'\) && ecran === 'jeu'/, 'Q': /key === 'q' \|\| key === 'Q'\) && !fenetre/, 'I': /key === 'i' \|\| key === 'I'\) return basculerIndicateurs/,
		'P': /key === 'p' \|\| key === 'P'\) return basculerPause/, 'R': /key === 'r' \|\| key === 'R'\) && Jeu\.defiChrono/, 'M': lettre('M'), 'T': /key === 't' \|\| key === 'T'\)+ return lancerTutoriel/, 'E': /key === 'e' \|\| key === 'E'\) return basculerPlus/,
		'L': /key === 'l' \|\| key === 'L'\) return Langue\.suivante/, 'F': /key === 'f' \|\| key === 'F'\) && !keyIsDown/,
	};
	const regleDe = (k) => Object.entries(LUES).find(([m]) => m.split('|').includes(k));
	const corpsRacc = aide.slice(aide.indexOf('const RACCOURCIS_AIDE'), aide.indexOf('];', aide.indexOf('const RACCOURCIS_AIDE')) + 2);
	verifier(corpsRacc.length > 100 && /RACCOURCIS_AIDE\.map/.test(aide), 'prompt 174 : l\'onglet Raccourcis doit être tiré de RACCOURCIS_AIDE (aide.js)');
	for (const langue of ['fr', 'en']) {
		const c = contexte(langue);
		vm.runInContext(corpsRacc, c);
		const lignes = vm.runInContext('RACCOURCIS_AIDE.flatMap(([g, l]) => l.map(([k, d]) => [k.startsWith("aide.k.") ? t(k) : k, t(d), g]))', c);
		for (const [k, d] of lignes) {
			const r = regleDe(k);
			verifier(!!r, `prompt 174 (${langue}) : touche « ${k} » citée dans l'aide, inconnue du test (ajouter sa lecture dans LUES)`);
			if (r) verifier(r[1].test(code), `prompt 174 (${langue}) : la touche « ${k} » citée dans l'aide n'est plus lue par le code`);
			for (const m of String(d).match(/\(([A-Z])\)/g) || []) verifier(LUES[m[1]] && LUES[m[1]].test(code), `prompt 174 (${langue}) : la touche ${m} citée dans « ${d} » n'est pas lue par le code`);
		}
		const dico = vm.runInContext(`TRADUCTIONS.${langue}`, c);
		const orphelines = Object.keys(dico).filter((k) => /^aide\.k\./.test(k) && !corpsRacc.includes(`'${k}'`));
		verifier(!orphelines.length, `prompt 174 (${langue}) : clés aide.k.* orphelines : ${orphelines.join(', ')}`);
		verifier(!/\((R|J|B)\)/.test([dico['jeu.recommencer'], dico['gameover.journal']].join(' ')) && !/\bS ?: /.test(dico['tuto.6.touches']), `prompt 174 (${langue}) : libellés encore porteurs d'un raccourci retiré`);
		verifier(dico['poste.quitter_pc_guide'] && !/Échap|Esc/.test(dico['poste.quitter_pc_guide']), `prompt 174 (${langue}) : pendant le guide, « Quitter le PC » ne doit pas promettre Échap`);
	}
	const sk = lire174('sketch.js');
	const kp = sk.slice(sk.indexOf('function keyPressed()'), sk.indexOf('function mouseWheel('));
	verifier(/^function keyPressed\(\) \{\n[^\n]*\n\tif \(Sauvegarde\.dialogueOuvert\) return;\n\tif \(saisieOuRaccourciNavigateur\(\)\) return;/.test(kp) && /activeElement[\s\S]{0,120}INPUT\|TEXTAREA\|SELECT[\s\S]{0,200}keyIsDown\(CONTROL\) \|\| keyIsDown\(ALT\) \|\| keyIsDown\(91\)/.test(sk), 'prompt 174 : keyPressed doit d\'abord laisser au navigateur les champs de saisie et Ctrl / Cmd / Alt');
	verifier(!/ouvrir\('reset'\)/.test(kp) && !/publierDepuisDossier/.test(kp) && !/key === 's'/.test(lire174('soir.js')) && !/key === 'j'/.test(lire174('gameover.js')) && !/' \(B\)'/.test(lire174('panneau.js')), 'prompt 174 : raccourcis retirés (R recommencer, B publier, S sortie, J journal du game over) encore lus ou affichés');
	verifier(/function tempsSuspendu\(\) \{\n\treturn [^\n]*fenetre === 'menu'/.test(lire174('immersion.js')), 'prompt 174 : ouvrir le menu du jeu doit suspendre le temps');
	verifier(/bouton\(b\.x, b\.y, b\.l, b\.h, t\(GUIDE\.actif \? 'poste\.quitter_pc_guide'/.test(lire174('bureau.js')), 'prompt 174 : libellé de « Quitter le PC » adapté au guide');
}

// Prompt 184 : après un choix, plus de liste des écarts affichée (narration, panneau) — les jauges du bandeau et des
// Indicateurs s'animent (segment vert / rouge + ▲ / ▼) sur les seules jauges qui changent ; valeurs finales exactes ;
// une phrase « en hausse / en baisse » au lecteur d'écran ; détail chiffré gardé dans l'appli Journal
{
	const lire184 = (f) => readFileSync(join(pub, f), 'utf8');
	const sk = lire184('sketch.js');
	const narr = sk.slice(sk.indexOf('function dessinerNarration()'), sk.indexOf('// ——— Écran de fin'));
	verifier(!/r\.deltas|narration\.de'|r\.des\[/.test(narr) && /explicationDecision\(r, true\)/.test(narr), 'prompt 184 : le panneau de narration ne doit plus lister les écarts (deltas, dés, « Effets : … »)');
	const dec = sk.slice(sk.indexOf('function decider(action)'), sk.indexOf('function continuer()'));
	verifier(/phraseEcarts\(dernierResultat\.deltas\)/.test(dec) && !/Math\.abs\(v\)/.test(dec), 'prompt 184 : l\'annonce de la décision doit passer par phraseEcarts (sens, sans chiffres)');
	verifier(/explicationDecision\(e\.resultat\)/.test(lire184('journal.js')), 'prompt 184 : l\'appli Journal doit garder le détail chiffré (explicationDecision sans drapeau)');
	verifier(/dessinerDeltasJauge\(cle, bx, by, lbar, hb\)/.test(lire184('panneau.js')) && /dessinerDeltasJauge\(k, /.test(lire184('os.js')) && /jaugesAffichees\(\)/.test(lire184('os.js')), 'prompt 184 : bandeau et Indicateurs doivent dessiner les segments d\'écart');
	const fb = lire184('feedback.js');
	verifier(!/fill\(255, 255, 255, 130/.test(fb) && !/text\(txt/.test(fb) && /DS\.succes/.test(fb) && /DS\.erreur/.test(fb) && /triangle\(/.test(fb), 'prompt 184 : plus d\'éclair ni de chiffre flottant ; segment DS.succes / DS.erreur (palettes daltonisme) et triangle ▲ / ▼');
	for (const [langue, attendu] of [['fr', 'Fluidité en hausse, budget en baisse.'], ['en', 'Flow up, budget down.']]) {
		const c = contexte(langue);
		vm.runInContext(sk.slice(sk.indexOf('function phraseEcarts'), sk.indexOf('function continuer()')), c);
		verifier(vm.runInContext('phraseEcarts([4, 0, -6])', c) === attendu, `prompt 184 (${langue}) : phrase des écarts « ${vm.runInContext('phraseEcarts([4, 0, -6])', c)} »`);
		// Narration réelle d'une semaine : aucune « Jauge ±n » dans le texte affiché après la décision
		const fautes = vm.runInContext(`(() => {
			Jeu.chargerSemaine(${JSON.stringify(semaines[0])});
			Jeu.nouvellePartie();
			const f = []; let n = 0;
			while (!Jeu.terminee && n++ < 60) {
				const d = Jeu.prochainDuJour();
				if (!d) { Jeu.finDeJourneeTactique(); if (!Jeu.jours[Jeu.jourIndex + 1]) break; Jeu.journeeSuivante(); continue; }
				if (Jeu.conflit && Jeu.conflit()) Jeu.choisirPriorite('a');
				const r = Jeu.decider(Jeu.actionsPossibles(d)[n % Jeu.actionsPossibles(d).length], d.contradiction ? d.contradiction.bonne : undefined);
				const noms = ['fluidite', 'reputation', 'budget'].map((k) => t('jaugeTitre.' + k)).join('|');
				if (new RegExp('(' + noms + ') [+−-]?\\d', 'i').test(r.narration.texte)) f.push(r.narration.texte);
			}
			return f;
		})()`, c);
		verifier(!fautes.length, `prompt 184 (${langue}) : la narration liste encore des écarts : ${fautes.slice(0, 2).join(' | ')}`);
	}
	// Animation : seules les jauges qui changent, gain vert / perte rouge, valeurs finales exactes, mode sans mouvement
	const c = vm.createContext({ Math, Object, Jeu: { jauges: { fluidite: 50, reputation: 30, budget: 60 }, paquet: [] }, reduireAnimations: false, Juice: { intensite: () => 1 }, horloge: 0 });
	vm.runInContext('const millis = () => horloge; const constrain = (v, a, b) => Math.max(a, Math.min(b, v)); const easeOut = (t) => 1 - Math.pow(1 - t, 3);', c);
	vm.runInContext(fb.slice(fb.indexOf('const JAUGES_AFF'), fb.indexOf('/** Prompt 184 : segment gagné')), c);
	const ev = (x) => vm.runInContext(x, c);
	ev('jaugesAffichees(); horloge = 1000; Jeu.jauges = { fluidite: 54, reputation: 30, budget: 54 }; jaugesAffichees();');
	const notes = ev('JAUGES_AFF.deltas.map((d) => d.jauge + ":" + d.avant + ">" + d.apres).join(",")');
	verifier(notes === 'fluidite:50>54,budget:60>54', `prompt 184 : écarts notés pour les seules jauges qui changent (${notes})`);
	const mi = ev('horloge = 1300; jaugesAffichees(); JSON.stringify(["fluidite", "reputation", "budget"].map((k) => segmentsEcart(k, horloge)))');
	const [sf, sr, sb] = JSON.parse(mi);
	verifier(sf.length === 1 && sf[0].sens === 1 && sf[0].de === 50 && sf[0].a > 50 && sf[0].a <= 54 && sr.length === 0 && sb.length === 1 && sb[0].sens === -1 && sb[0].de === 54 && sb[0].a > 54 && sb[0].a <= 60, `prompt 184 : à mi-course, segment de gain sur fluidité et de perte sur budget, rien sur réputation (${mi})`);
	const fin = JSON.parse(ev('horloge = 1000 + DUREE_ECART_MS; JSON.stringify([jaugesAffichees(), ["fluidite", "budget"].map((k) => segmentsEcart(k, horloge).length)])'));
	verifier(fin[0].fluidite === 54 && fin[0].reputation === 30 && fin[0].budget === 54 && fin[1].join() === '0,0' && ev('DUREE_ECART_MS >= 600 && DUREE_ECART_MS <= 900'), `prompt 184 : valeurs finales exactes et segments terminés (${JSON.stringify(fin)})`);
	for (const regl of ['reduireAnimations = true', 'Juice.intensite = () => 0']) {
		const s0 = JSON.parse(ev(`${regl}; Jeu.jauges = { fluidite: 54, reputation: 30, budget: 44 }; horloge = 5000; const v${regl.length} = jaugesAffichees(); JSON.stringify([v${regl.length}.budget, segmentsEcart('budget', 5100)])`));
		verifier(s0[0] === 44 && s0[1].length === 1 && s0[1][0].de === 54 && s0[1][0].a === 44 && s0[1][0].alpha === 1, `prompt 184 : sans mouvement (${regl}), valeur directe et segment entier, visible (${JSON.stringify(s0)})`);
		const s1 = JSON.parse(ev(`JSON.stringify(segmentsEcart('budget', 5000 + DUREE_ECART_MS * 0.85))`));
		verifier(s1.length === 1 && s1[0].alpha > 0 && s1[0].alpha < 1 && s1[0].a === 44, `prompt 184 : sans mouvement (${regl}), fondu court en fin d'écart (${JSON.stringify(s1)})`);
		ev('reduireAnimations = false; Juice.intensite = () => 1; Jeu.jauges = { fluidite: 54, reputation: 30, budget: 54 }; horloge = 9000; jaugesAffichees(); horloge = 20000; jaugesAffichees();');
	}
}

// Prompt 186 : Community — bascule cartes / liste (icône Lucide, choix mémorisé) ; Journal — filtres en contrôle
// segmenté du DS (dsSegments), plus de pli « Détails » ni de « Copier le résumé du jour » (touches V et C)
{
	const lire = (f) => readFileSync(join(pub, f), 'utf8');
	const jn = lire('journal.js');
	const cm = lire('community.js');
	const ds = lire('ds.js');
	verifier(!/copierResumeJour|afficherZoneCopie|zone-copie-journal|basculerDetailsJournal|JOURNAL\.details|JOURNAL\.copie/.test(jn), 'prompt 186 : copie du résumé et pli « Détails » retirés du Journal');
	verifier(!/key === 'c' \|\| key === 'C'|key === 'v' \|\| key === 'V'/.test(jn), 'prompt 186 : touches C et V plus lues par le Journal');
	verifier(!/function resume\(|resume, minutes/.test(lire('journal-donnees.js')), 'prompt 186 : JournalDonnees.resume retiré');
	verifier(/function vueJour[\s\S]*?tuileFond\(x, y0[\s\S]*?frise\(z, y0 \+ h \+ 24\)/.test(jn) && !/if \(!JOURNAL\.details\) return frise/.test(jn), 'prompt 186 : les tuiles du jour s\'affichent d\'office');
	verifier(/dsSegments\(z\.x, yf, lf, F\.map\(libelleFiltreJournal\), F\.indexOf\(JOURNAL\.filtre\)/.test(jn) && /dsSegmentVoisin\(f\.length/.test(jn) && /dsAnnonceSegment\(t\('journal\.filtres'\)/.test(jn), 'prompt 186 : filtres du Journal en contrôle segmenté (clic, ← →, annonce)');
	verifier(/function dsSegments\([\s\S]*?DS\.primaire[\s\S]*?DS\.surPrimaire[\s\S]*?boutons\.push/.test(ds), 'prompt 186 : dsSegments (ds.js) à la couleur d\'accent');
	verifier(!/dsSegments/.test(lire('patron.js')), 'prompt 186 : pas de contrôle segmenté dans Mails (colonne de dossiers du prompt 185)');
	verifier(/#{3} Interrupteur et curseur[\s\S]*Contrôle segmenté[\s\S]*dsSegments/.test(readFileSync(join(pub, '..', '..', 'design-system', 'DESIGN.md'), 'utf8')), 'prompt 186 : DESIGN.md doit documenter le contrôle segmenté');
	verifier(/iconeLucide\(liste \? 'layout-grid' : 'list'/.test(cm) && /infobulle\(txt/.test(cm) && !/COMMU\.grille/.test(cm), 'prompt 186 : bascule Community par icône Lucide avec infobulle');
	const c = vm.createContext({});
	vm.runInContext(
		`var __st = new Map(), __ann = [], COMMU = { vue: null, defil: 50 }, boutons = [];
		const Confort = { Son: { clic() {} } }; function annoncer(s) { __ann.push(s); } function t(k, v) { return v ? k + JSON.stringify(v) : k; }
		function lireStockage(k) { return __st.has(k) ? __st.get(k) : null; } function ecrireStockage(k, v) { __st.set(k, v); }`,
		c,
	);
	vm.runInContext(cm.slice(cm.indexOf('const CLE_VUE_COMMU'), cm.indexOf('/** Bouton à icône de la bascule')), c);
	vm.runInContext(ds.slice(ds.indexOf('const dsSegmentVoisin'), ds.indexOf('/** Curseur à crans')), c);
	const r = JSON.parse(
		vm.runInContext(
			`(() => {
		const r = { d: vueCommunity() };
		basculerVueCommunity();
		r.apres = COMMU.vue; r.cle = __st.get('pxe-nte001-community-vue'); r.defil = COMMU.defil; r.ann = __ann.slice(-1)[0];
		COMMU.vue = null; // appli fermée puis rouverte (ou partie rechargée)
		r.relu = vueCommunity();
		r.voisins = [dsSegmentVoisin(4, 0, -1), dsSegmentVoisin(4, 3, 1), dsSegmentVoisin(4, 1, 1)];
		r.annSeg = dsAnnonceSegment('Filtre', 1, 4, 'Ratés (3)');
		return JSON.stringify(r);
	})()`,
			c,
		),
	);
	verifier(r.d === 'cartes' && r.apres === 'liste' && r.cle === 'liste' && r.relu === 'liste' && r.defil === 0, `prompt 186 : la vue Community doit basculer et rester mémorisée (${JSON.stringify(r)})`);
	verifier(/commu\.vue\.annonce.*commu\.vue\.liste/.test(r.ann), `prompt 186 : annonce de la vue active (${r.ann})`);
	verifier(r.voisins.join() === '3,0,2' && /ds\.segment\.annonce.*"i":2.*"n":4/.test(r.annSeg), `prompt 186 : ← → en boucle et annonce « n sur N » (${r.voisins} ${r.annSeg})`);
	const ci = contexte('fr');
	for (const langue of ['fr', 'en']) {
		const dico = vm.runInContext(`TRADUCTIONS.${langue}`, ci);
		verifier(['commu.vue.cartes', 'commu.vue.liste', 'commu.vue.annonce', 'commu.vue.versListe', 'commu.vue.versCartes', 'journal.filtres', 'journal.filtreNb', 'ds.segment.annonce', 'parametres.copier', 'parametres.copie.ok', 'parametres.copie.erreur'].every((k) => dico[k]), `prompt 186 : clés manquantes (${langue})`);
		const orphelines = Object.keys(dico).filter((k) => /^(journal\.copi|journal\.resume\.|journal\.filtreActif|commu\.grille|commu\.fil$)/.test(k));
		verifier(!orphelines.length, `prompt 186 : clés orphelines (${langue}) : ${orphelines}`);
	}
}

// Prompt 188 : bouton « Kit de presse » du menu principal (modèle Livrables) — ordre clavier = ordre visuel, textes FR / EN
{
	const menu = readFileSync(join(pub, 'menu.js'), 'utf8');
	const extras = menu.slice(menu.indexOf('const EXTRAS_MENU'), menu.indexOf('const HAUT_MENU'));
	const ordre = [...extras.matchAll(/cle: '(\w+)'/g)].map((x) => x[1]).join();
	verifier(ordre === 'livrables,kitpresse,depot,partager,presentation,pleinEcran,installer', `prompt 188 : ordre des extras du menu (${ordre})`);
	verifier(/function ouvrirKitPresse\(\) \{\s*annoncer\(t\('mp\.kitpresse\.annonce'\)\);\s*ouvrirLien\('\.\/kit-presse\/'\);/.test(menu) && /presse: 'newspaper'/.test(menu), 'prompt 188 : ouvrirKitPresse (annonce + ./kit-presse/ en nouvel onglet) et icône Lucide newspaper');
	// De haut en bas : Livrables, Kit de presse, puis les trois boutons — même largeur, 16 px d'écart
	verifier(/boutonIcone\(b\.x, b\.y - 2 \* \(b\.h \+ 16\), 3 \* b\.l \+ 32, b\.h, 'carnet'/.test(menu) && /boutonIcone\(b\.x, b\.y - b\.h - 16, 3 \* b\.l \+ 32, b\.h, 'presse', t\('mp\.kitpresse'\), ouvrirKitPresse, focusExtra\(n, 'kitpresse'\)\)/.test(menu), 'prompt 188 : rangées Livrables puis Kit de presse au-dessus du bloc');
	verifier(/BLOC_PARTAGE\.y - 2 \* \(BLOC_PARTAGE\.h \+ 16\) - 12, l: 3 \* BLOC_PARTAGE\.l \+ 56, h: 3 \* BLOC_PARTAGE\.h \+ 32 \+ 24/.test(readFileSync(join(pub, 'portrait.js'), 'utf8')), 'prompt 188 : la région portrait du bloc inclut les deux rangées');
	const c = contexte('fr');
	for (const langue of ['fr', 'en']) {
		const dico = vm.runInContext(`TRADUCTIONS.${langue}`, c);
		verifier(['mp.kitpresse', 'mp.kitpresse.infobulle', 'mp.kitpresse.annonce'].every((k) => dico[k]), `prompt 188 : clés mp.kitpresse manquantes (${langue})`);
	}
	verifier(existsSync(join(pub, 'kit-presse', 'index.html')) && existsSync(join(pub, 'kit-presse', 'communique-de-presse.txt')) && existsSync(join(pub, 'kit-presse', 'logo.svg')), 'prompt 188 : fichiers du kit de presse présents');
}

// Prompt 189 : personnages — ton du patron par semaine, trait (esquive / assume), SMS météo de Camille, registres
{
	const perso = readFileSync(join(pub, 'personnages.js'), 'utf8');
	const html = readFileSync(join(pub, 'index.html'), 'utf8');
	verifier(html.indexOf('./personnages.js') > html.indexOf('./histoire.js') && html.indexOf('./personnages.js') > html.indexOf('./game.js'), 'prompt 189 : personnages.js chargé après game.js et histoire.js');
	verifier(/smsMeteoCamille\(journeeSuivante\)/.test(readFileSync(join(pub, 'soir.js'), 'utf8')), 'prompt 189 : finirSoir propose le SMS météo de Camille entre deux journées');
	const TONS = { 0: 'professionnel', 1: 'pedagogue', 2: 'professionnel', 3: 'pression' };
	const avecPerso = (ch) => {
		const c = contexte('fr');
		vm.runInContext(`var chapitreCourant = () => ${ch};`, c);
		vm.runInContext(perso, c, { filename: 'personnages.js' });
		return c;
	};
	const lundi = semaines[0];
	const vus = new Set();
	for (const ch of [0, 1, 2, 3]) {
		const c = avecPerso(ch);
		const r = vm.runInContext(
			`(() => {
			Jeu.chargerSemaine(${JSON.stringify(lundi)});
			Jeu.nouvellePartie();
			const consigne = Jeu.messagesPatron.find((m) => m.type === 'consigne');
			const variantes = ['', '.v1', '.v2'].map((v) => TRADUCTIONS.fr['patron.ton.' + Jeu.tonPatron() + '.consigne' + v]);
			const n0 = Jeu.messagesPatron.length;
			Jeu.messagePatron('Test reproche', 'reproche', {});
			const apresReproche = Jeu.messagesPatron.length - n0;
			const e1 = Jeu.reactionPatronCommunity({ bonne: false }, { auteur: '@x' });
			const e2 = Jeu.reactionPatronCommunity({ bonne: false }, { auteur: '@x' });
			const a1 = Jeu.reactionPatronCommunity({ bonne: true }, { auteur: '@x' });
			const sev = Jeu.messagesPatron.filter((m) => m.meta && m.meta.severe);
			const fel = Jeu.messagesPatron.filter((m) => m.meta && m.meta.felicitation);
			return { ton: Jeu.tonPatron(), champ: consigne && consigne.ton, texte: consigne ? String(consigne.texte) : '', variantes, apresReproche, e1, e2, a1, sev: sev.length, sevType: sev[0] && sev[0].type, fel: fel.length, jauges: JSON.stringify(Jeu.jauges) };
		})()`,
			c,
		);
		verifier(r.ton === TONS[ch] && r.champ === TONS[ch], `prompt 189 : ton du patron au chapitre ${ch} (${r.ton} / champ ${r.champ}, attendu ${TONS[ch]})`);
		verifier(r.variantes.every(Boolean) && r.variantes.some((v) => r.texte.endsWith(v)), `prompt 189 : consigne du jour au chapitre ${ch} sans formulation du ton`);
		vus.add(r.variantes.join('|'));
		verifier(r.apresReproche === (ch === 3 ? 2 : 1), `prompt 189 : semaine 3 = deux messages après un reproche, sinon un (chapitre ${ch} : ${r.apresReproche})`);
		verifier(r.e1 === 'esquive' && r.e2 === null && r.a1 === 'assume' && r.sev === 1 && r.sevType === 'reproche' && r.fel === 1, `prompt 189 : trait du patron (esquive / assume, une fois par jour) au chapitre ${ch}`);
	}
	verifier(vus.size === 3, 'prompt 189 : trois tons distincts sur les trois semaines');
	// Camille : SMS seulement si la donnée météo du jour franchit un seuil explicite ; jamais sans la donnée du jour
	const c = avecPerso(1);
	for (const s of semaines) {
		const r = vm.runInContext(
			`(() => {
			Jeu.chargerSemaine(${JSON.stringify(s)});
			Jeu.nouvellePartie();
			const S = Jeu.SEUILS_METEO_CAMILLE;
			const meteo = Jeu.etat.semaine.meteo || [];
			const erreurs = [];
			Jeu.jours.forEach((j) => {
				const m = meteo.find((x) => x.date === j.date);
				const attendu = !m ? null : m.pluie_mm >= S.pluie_mm ? 'pluie' : m.rafales_max >= S.rafales_max ? 'vent' : m.temp_max >= S.temp_max ? 'chaleur' : null;
				const obtenu = (Jeu.conditionMeteoCamille(j.date) || {}).condition || null;
				if (attendu !== obtenu) erreurs.push(j.date + ' ' + attendu + '≠' + obtenu);
			});
			if (Jeu.conditionMeteoCamille('1999-01-01') !== null) erreurs.push('date sans donnée');
			Jeu.jourIndex = Jeu.jours.length - 1;
			if (Jeu.smsMeteoCamille() !== null) erreurs.push('SMS le dernier soir');
			return erreurs;
		})()`,
			c,
		);
		verifier(r.length === 0, `prompt 189 : SMS météo de Camille (${s}) : ${r.join(', ')}`);
	}
	// Registres des plaintes (source : messages.json, généré en messages.js)
	const msg = JSON.parse(readFileSync(join(pub, 'data', 'messages.json'), 'utf8'));
	const regs = new Set(msg.plaintes.map((p) => p.registre).filter(Boolean));
	verifier(regs.size >= 4 && [...regs].every((x) => ['etudiant', 'senior', 'touriste', 'travailleur', 'parent'].includes(x)), `prompt 189 : au moins 4 registres connus (${[...regs]})`);
	// Clés FR / EN : chaque clé de personnages.js existe avec ses deux variantes dans les deux langues
	const bases = [];
	for (const ton of ['pedagogue', 'professionnel', 'pression']) for (const sorte of ['consigne', 'reproche', 'felicitation']) bases.push(`patron.ton.${ton}.${sorte}`);
	bases.push('patron.ton.pression.relance', 'patron.trait.esquive', 'patron.trait.assume', 'camille.meteo.pluie', 'camille.meteo.vent', 'camille.meteo.chaleur');
	for (const langue of ['fr', 'en']) {
		const dico = vm.runInContext(`TRADUCTIONS.${langue}`, c);
		const manque = bases.flatMap((b) => [b, b + '.v1', b + '.v2']).concat('camille.meteo.reponse').filter((k) => !dico[k]);
		verifier(!manque.length, `prompt 189 : clés manquantes (${langue}) : ${manque.join(', ')}`);
	}
}

// Prompt 191 : le mail du soir comme scène (fait marquant tiré d'un dossier joué, phrase du patron à trois niveaux,
// bilan compact dessous), respiration « Fin de journée. » ≤ 3 s et passable, accroche météo du matin (donnée du jour)
{
	const c = contexte('fr');
	const r = vm.runInContext(
		`(() => {
		Jeu.chargerSemaine(Jeu.semainesProposees()[0].lundi);
		Jeu.nouvellePartie();
		const out = { jours: [], erreurs: [] };
		const choix = ['renfort', 'rien', 'devier', 'retenir'];
		for (let jour = 0; jour < 2 && !Jeu.terminee; jour++) {
			let i = 0;
			while (Jeu.prochainDuJour()) {
				const d = Jeu.prochainDuJour();
				if (Jeu.conflit && Jeu.conflit()) Jeu.choisirPriorite('a');
				Jeu.decider(choix[i++ % choix.length], d.contradiction ? d.contradiction.bonne : undefined);
			}
			Jeu.finDeJourneeTactique();
			const j = Jeu.jourCourant();
			const duJour = Jeu.evenementsJournee.filter((e) => e.jour === j.date);
			const m = Jeu.mailDuJour();
			const sc = m.scene;
			if (!sc || !sc.patron) out.erreurs.push('scène absente');
			else {
				if (duJour.length && (!sc.fait || !duJour.includes(sc.fait.evenement))) out.erreurs.push('fait marquant hors des dossiers joués ce jour');
				if (sc.fait) {
					const e = sc.fait.evenement, txt = String(sc.fait.texte);
					if (!txt.includes(e.heure) || !txt.includes(e.externe) || (e.cleAction !== 'temps' && !txt.includes(e.action))) out.erreurs.push('fait sans heure / nature / décision : ' + txt);
					if (e.ligne && !txt.includes(String(e.ligne))) out.erreurs.push('fait sans ligne : ' + txt);
					if (txt.includes('{') || txt.includes('[À COMPLÉTER]')) out.erreurs.push('gabarit non rempli : ' + txt);
					const chiffres = (txt.match(/\\d+/g) || []).filter((n) => !(e.heure + ' ' + (e.ligne || '') + ' ' + e.externe + ' ' + e.action + ' ' + e.meilleureAction + ' ' + e.retard + ' ' + e.retardEffectif).includes(n));
					if (chiffres.length) out.erreurs.push('chiffre non issu du dossier : ' + chiffres.join(','));
				}
				if (String(Jeu.mailDuJour().scene.patron) !== String(sc.patron)) out.erreurs.push('tirage du patron non déterministe');
				if (m.lignes.length < 2) out.erreurs.push('bilan chiffré absent');
			}
			out.jours.push({ n: duJour.length, niveau: sc && sc.niveau });
			if (!Jeu.jours[Jeu.jourIndex + 1]) break;
			Jeu.journeeSuivante();
		}
		// Niveaux : seuils sur la part de « bon choix ! »
		const faux = (ev) => ({ cleAction: 'x', resultat: {}, heure: '09:00' });
		const sauve = Jeu.evaluer;
		const niv = (bons, total) => { let k = 0; Jeu.evaluer = () => (k++ < bons ? 'bon' : 'rate'); const n = Jeu.niveauPatronDuJour(Array.from({ length: total }, faux)); return n; };
		out.niveaux = [niv(3, 3), niv(1, 2), niv(0, 3), Jeu.niveauPatronDuJour([])].join(',');
		Jeu.evaluer = sauve;
		out.cles = ['satisfait', 'neutre', 'inquiet'].map((n) => { Jeu.jourIndex = 0; return String(T('mailf.patron.' + n)); });
		// Accroche météo : seulement avec la donnée du jour
		const j0 = Jeu.jours[0];
		const met = (Jeu.etat.semaine.meteo || []).find((x) => x.date === j0.date);
		const acc = Jeu.accrocheMeteo(j0.date);
		out.meteoOk = met ? !!acc && String(acc).includes(String(met.temp_max).replace('.', ',')) : acc === null;
		out.meteoAbsente = Jeu.accrocheMeteo('1999-01-01') === null;
		return out;
	})()`,
		c,
	);
	verifier(!r.erreurs.length, `prompt 191 : mail du soir : ${r.erreurs.join(' | ')}`);
	verifier(r.jours.length === 2, `prompt 191 : deux journées jouées (${r.jours.length})`);
	verifier(r.niveaux === 'satisfait,neutre,inquiet,neutre', `prompt 191 : niveaux du patron (${r.niveaux})`);
	verifier(new Set(r.cles).size === 3 && r.cles.every((x) => x && !x.startsWith('mailf.')), 'prompt 191 : trois phrases du patron distinctes');
	verifier(r.meteoOk && r.meteoAbsente, `prompt 191 : accroche météo du jour (présente ${r.meteoOk}, absente sans donnée ${r.meteoAbsente})`);
	for (const langue of ['fr', 'en']) {
		const dico = vm.runInContext(`TRADUCTIONS.${langue}`, c);
		const cles = ['satisfait', 'neutre', 'inquiet'].flatMap((n) => ['', '.v1', '.v2'].map((v) => `mailf.patron.${n}${v}`)).concat('mailf.fait.titre', 'mailf.fait.bon', 'mailf.fait.rate', 'mailf.fait.tropTard', 'mailf.fait.aucun', 'mailf.bilan', 'soir.respiration', 'transition.meteo');
		const manque = cles.filter((k) => !dico[k]);
		verifier(!manque.length, `prompt 191 : clés manquantes (${langue}) : ${manque.join(', ')}`);
	}
	// Respiration : ≤ 3 s, passable (clic, Entrée, Espace), temps suspendu, nuit directe en animations réduites
	const soir = readFileSync(join(pub, 'soir.js'), 'utf8');
	const duree = Number((soir.match(/const DUREE_RESPIRATION = (\d+);/) || [])[1]);
	verifier(duree > 0 && duree <= 3000, `prompt 191 : respiration ≤ 3 s (${duree} ms)`);
	verifier(/action: passerRespiration/.test(soir) && /respirationSoir\(\) && [^\n]*keyCode === ENTER[^\n]*key === ' '[^\n]*passerRespiration\(\)/.test(soir), 'prompt 191 : respiration passable au clic, à Entrée et à Espace');
	verifier(/reduireAnimations \? 1 :/.test(soir.slice(soir.indexOf('function dessinerRespirationSoir'))), 'prompt 191 : animations réduites → pas de fondu progressif');
	verifier(/dessinerRespirationSoir\(\)/.test(readFileSync(join(pub, 'sketch.js'), 'utf8')), 'prompt 191 : respiration dessinée');
	const cr = contexte('fr');
	vm.runInContext(
		`var phase = 'attente', ecran = 'jeu', vue = 'bureau', fenetre = null, enPause = false, enSieste = false, reveil = null, reduireAnimations = false, smsActif = false;
		var MENU = { actif: false }, PC = { fenetre: null }, CAMERA = { x: 0, y: 0 }, METEO_VISU = { nuit: 1 }, PIECE = { lampe: false }, focusBureau = -1, OBJETS_BUREAU = [];
		var L = 1920, H = 1080, __t = 0, ENTER = 13, RETURN = 13, ESCAPE = 27, keyCode = 0, key = '', __annonces = [];
		var millis = () => __t, constrain = (v, a, b) => Math.max(a, Math.min(b, v));
		var seLever = () => {}, annoncer = (x) => __annonces.push(String(x)), interaction = () => {};
		var Confort = { Son: { bip: () => {}, musique: { attenuer: () => {} } } }, Sauvegarde = { auto: () => {} };`,
		cr,
	);
	vm.runInContext(soir, cr, { filename: 'soir.js' });
	const rr = vm.runInContext(
		`(() => {
		Jeu.chargerSemaine(Jeu.semainesProposees()[0].lundi); Jeu.nouvellePartie();
		const o = {};
		rangerPoste();
		o.debut = respirationSoir() && !lampeAllumee() && __annonces.includes('Fin de journée.');
		__t = 1500; o.lampe = lampeAllumee() && respirationSoir() && !sortieVisible();
		__t = 3001; o.finie = !respirationSoir();
		phase = 'attente'; __t = 5000; rangerPoste(); __t = 5200;
		keyCode = 0; key = ' '; o.espace = toucheSoir() === true && !respirationSoir() && sortieVisible();
		phase = 'attente'; __t = 9000; rangerPoste(); keyCode = 13; key = 'Enter'; toucheSoir(); o.entree = !respirationSoir() && !SOIR.sortie;
		phase = 'attente'; __t = 12000; rangerPoste(); passerRespiration(); o.clic = !respirationSoir();
		phase = 'attente'; reduireAnimations = true; __t = 15000; rangerPoste(); o.reduit = nuitSoir() === 1 && lampeAllumee() && respirationSoir();
		return o;
	})()`,
		cr,
	);
	for (const [k, v] of Object.entries(rr)) verifier(v === true, `prompt 191 : respiration ${k} = ${v}`);
	const imm = readFileSync(join(pub, 'immersion.js'), 'utf8');
	verifier(/function tempsSuspendu\(\) \{\n\treturn [^\n]*phase === 'soir'[^\n]*\n\}/.test(imm), 'prompt 191 : tempsSuspendu() reste un return sur une ligne et suspend le soir');
	verifier(/Jeu\.accrocheMeteo\(j\.date\)/.test(imm.slice(imm.indexOf('function lignesTransitionJour'))), 'prompt 191 : accroche météo sur l\'écran « Jour N »');
}

// Prompt 193 : badge lisible dans chaque palette daltonienne, bouton plein écran au menu, musique hors ligne
{
	const lire193 = (f) => readFileSync(join(pub, f), 'utf8');
	// 1. Badge : texte calculé (texteSurAplat, theme.js) ≥ 4,5:1 sur chaque aplat de chaque palette de accessibilite.js
	const c193 = { DS: { fond: '#0D0C0C' }, C: {}, MENU_C: {}, document: { documentElement: { style: { setProperty: () => {} } } }, localStorage: { getItem: () => null, setItem: () => {} }, location: { search: '' } };
	vm.createContext(c193);
	const acc = lire193('accessibilite.js');
	const blocPal = acc.slice(acc.indexOf('const PALETTES = {'), acc.indexOf('const ORDRE_DALTONISME'));
	vm.runInContext(lire193('theme.js') + ';' + blocPal + ';globalThis.T = { PALETTES, texteSurAplat, rapportContraste };', c193);
	const { PALETTES: pals, texteSurAplat: sur, rapportContraste: rc } = c193.T;
	const ds = lire193('ds.js');
	const info = /info: '(#[0-9A-Fa-f]{6})'/.exec(ds)[1];
	verifier(Object.keys(pals).length >= 4 && ['normal', 'protan', 'deutan', 'tritan'].every((k) => pals[k]), 'prompt 193 : les quatre palettes de daltonisme');
	for (const [id, p] of Object.entries(pals)) {
		for (const [type, fond] of [['erreur', p.critique], ['succes', p.bon], ['alerte', p.alerte], ['info', info]]) {
			const txt = sur(fond);
			verifier(rc(txt, fond) >= 4.5, `prompt 193 : badge ${type} en palette ${id} — ${txt} sur ${fond} = ${rc(txt, fond).toFixed(2)}:1 (< 4,5)`);
		}
	}
	verifier(sur(pals.protan.critique) === '#0D0C0C' && sur(pals.normal.critique) === '#FFFFFF', 'prompt 193 : badge sombre sur l\'orange protan / deutan, blanc sur le rouge normal');
	const badge = ds.slice(ds.indexOf('function dsBadge'), ds.indexOf('/** Interrupteur'));
	verifier(/fill\(texteSurAplat\(aplat\)\)/.test(badge) && !/'#[0-9A-Fa-f]{6}'|daltonisme/.test(badge), 'prompt 193 : dsBadge choisit son texte par texteSurAplat, sans hexadécimal ni liste de palettes en dur');
	verifier(/texte: texteSurAplat\(hex\)/.test(lire193('theme.js')), 'prompt 193 : accentDerive et le badge partagent texteSurAplat');
	// 2. Plein écran : bouton de la ligne du haut, même logique que F, avant « installer » dans l'ordre clavier, masqué sans API
	const menu = lire193('menu.js');
	const extras = menu.slice(menu.indexOf('const EXTRAS_MENU'), menu.indexOf('/** Prompt 171 : ligne du haut'));
	verifier(/pleinEcranPossible\(\) \? \[\{ cle: 'pleinEcran'[^\n]*basculerPleinEcran\(\)/.test(extras) && extras.indexOf("cle: 'pleinEcran'") < extras.indexOf("cle: 'installer'"), 'prompt 193 : entrée plein écran dans EXTRAS_MENU, juste avant installer, seulement si l\'API existe');
	verifier(/boutonCarreHaut\(xLangue - LANGUES\.length \* \(84 \+ 8\) - 8 - HAUT_MENU\.h, HAUT_MENU\.y, HAUT_MENU\.h, focusExtra\(e\.length, 'pleinEcran'\), pleinEcranActif\(\) \? 'minimize' : 'maximize', libellePleinEcranMenu\(\), basculerPleinEcran\)/.test(menu), 'prompt 193 : bouton plein écran à gauche de FR / EN, icône maximize / minimize, basculerPleinEcran réutilisé');
	verifier(/annoncer\(choisi\(\)\.libelle \? choisi\(\)\.libelle\(\) : t\('mp\.' \+ choisi\(\)\.cle\)\)/.test(menu), 'prompt 193 : l\'annonce clavier suit l\'état du plein écran');
	verifier((lire193('sketch.js').match(/requestFullscreen\(\)/g) || []).length === 1 && !/requestFullscreen|exitFullscreen/.test(menu), 'prompt 193 : une seule logique de plein écran (sketch.js)');
	const ic = lire193('icones-lucide.js');
	verifier(/'maximize':/.test(ic) && /'minimize':/.test(ic), 'prompt 193 : icônes maximize / minimize disponibles');
	for (const langue of ['fr', 'en']) {
		const d = vm.runInContext(`TRADUCTIONS[${JSON.stringify(langue)}]`, contexte(langue));
		verifier(/\(F\)$/.test(d['mp.pleinEcran'] || '') && /\(F\)$/.test(d['mp.pleinEcran.quitter'] || '') && d['mp.pleinEcran'] !== d['mp.pleinEcran.quitter'], `prompt 193 : libellés du bouton plein écran (${langue})`);
	}
	// 3. Musique hors ligne : Range servi depuis le cache (206), morceaux précachés, repli WebAudio si le fichier échoue
	const sw = lire193('sw.js');
	verifier(/headers\.has\('range'\)\) \{\n\t\te\.respondWith\(caches\.match\(req\.url, \{ ignoreSearch: true \}\)\.then\(\(enCache\) => \(enCache \? reponsePartielle\(req, enCache\) : fetch\(req\)\)\)\);/.test(sw), 'prompt 193 : requêtes Range servies depuis le cache');
	for (const f of readdirSync(join(pub, 'audio')).filter((f) => /\.(ogg|mp3)$/.test(f))) verifier(sw.includes(`"./audio/${f}"`), `prompt 193 : ${f} doit être précaché`);
	verifier(readFileSync(join(pub, '..', 'scripts', 'generer-sw.mjs'), 'utf8').includes('reponsePartielle\\(req, enCache\\)'), 'prompt 193 : le générateur refuse un sw.js sans lecture partielle depuis le cache');
	if (typeof Response === 'function' && typeof Blob === 'function') {
		const fn = sw.slice(sw.indexOf('function reponsePartielle'));
		const rp = new Function('Response', fn + ';return reponsePartielle;')(Response);
		const req = (r) => ({ headers: { get: (k) => (k === 'range' ? r : null) } });
		const plein = () => new Response(new Blob([new Uint8Array(100).map((_, i) => i)]), { headers: { 'content-type': 'audio/ogg' } });
		const essais = [
			['bytes=0-', 206, 'bytes 0-99/100', 100, 0],
			['bytes=10-19', 206, 'bytes 10-19/100', 10, 10],
			['bytes=-5', 206, 'bytes 95-99/100', 5, 95],
			['bytes=90-500', 206, 'bytes 90-99/100', 10, 90],
			['bytes=200-', 416, 'bytes */100', 0, null],
			['n\'importe quoi', 200, null, 100, 0],
		];
		for (const [r, statut, plage, longueur, premier] of essais) {
			const rep = await rp(req(r), plein());
			const octets = new Uint8Array(await rep.arrayBuffer());
			verifier(rep.status === statut && rep.headers.get('content-range') === plage && octets.length === longueur && (premier === null || octets[0] === premier) && (statut === 416 || rep.headers.get('content-type') === 'audio/ogg'), `prompt 193 : réponse partielle « ${r} » (${rep.status}, ${rep.headers.get('content-range')}, ${octets.length} octets)`);
		}
	}
	const conf = lire193('confort.js');
	verifier(/a\.addEventListener\('error', \(\) => \{\n\t\t\t\tif \(Musique\.audio !== a\) return;\n\t\t\t\tMusique\.enPanne\.add\(p\.fichier\);[\s\S]{0,260}Musique\.demarrer\(\);/.test(conf) && /Musique\.enPanne\.has\(p\.fichier\) \? PISTES\.origine : p/.test(conf), 'prompt 193 : musique en fichier injouable → repli sur le morceau WebAudio');
}

// Prompt 194 : finir la journée = cliquer sur l'horloge (ou Q) → le soir directement, sans phase « mail » ; le mail du
// soir est déposé non lu dans l'appli Mails (dossier « Soirs ») ; clés devenues inutiles retirées ; tutoriel sur l'horloge
{
	const lire194 = (f) => readFileSync(join(pub, f), 'utf8');
	const c194 = contexte('fr');
	vm.runInContext(
		`var phase = 'attente', ecran = 'jeu', vue = 'poste', fenetre = null, enPause = false, enSieste = false, reveil = null, reduireAnimations = false, tutoriel = null;
		var MENU = { actif: false }, PC = { fenetre: 'patron' }, CAMERA = { x: 0, y: 0 }, METEO_VISU = { nuit: 1 }, focusBureau = -1, OBJETS_BUREAU = [], PIECE = {};
		var L = 1920, H = 1080, __t = 1000, __ann = [];
		var millis = () => __t, constrain = (v, a, b) => Math.max(a, Math.min(b, v)), heureAffichee = () => ({ h: 20, m: 0 });
		var seLever = () => { vue = 'bureau'; }, annoncer = (x) => __ann.push(String(x)), interaction = () => {}, ouvrir = (f) => { fenetre = f; };
		var Confort = { Son: { bip: () => {}, musique: { attenuer: () => {} } } }, Sauvegarde = { auto: () => {} };
		var dateLongue = (d) => d, localStorage = { getItem: () => null, setItem: () => {} };
		var allerFin = () => { phase = 'fin'; }, lancerLicenciement = () => {};
		var journeeSuivante = () => { Jeu.journeeSuivante(); phase = 'attente'; };`,
		c194,
	);
	for (const f of ['soir.js', 'journee.js']) vm.runInContext(lire194(f), c194, { filename: f });
	const r = vm.runInContext(
		`(() => {
		Jeu.chargerSemaine(Jeu.semainesProposees()[0].lundi); Jeu.nouvellePartie();
		const o = {}, phases = [];
		while (Jeu.prochainDuJour()) Jeu.decider('renfort');
		Jeu.horloge.minutes = Jeu.finJournee();
		clicHorloge(); phases.push(phase);
		o.horloge = phase === 'soir' && vue === 'bureau' && PC.fenetre === null;
		const soirs = Jeu.messagesPatron.filter((m) => m.type === 'soir');
		o.mail = soirs.length === 1 && !soirs[0].lu && soirs[0].jour === Jeu.jourCourant().date && Jeu.nonLus.patron >= 1 && soirs[0].meta.lignes.length > 0;
		const sc = Jeu.mailDuJour().scene;
		o.annonce = __ann.some((a) => a.includes(String(sc.patron)) && a.includes('Mails'));
		o.texte = String(soirs[0].texte).includes(String(sc.patron));
		o.json = !!JSON.parse(JSON.stringify(Jeu.messagesPatron)).find((m) => m.type === 'soir' && typeof m.texte === 'string' && typeof m.meta.objet === 'string');
		Jeu.deposerMailDuSoir(); o.unique = Jeu.messagesPatron.filter((m) => m.type === 'soir').length === 1;
		quitterJourneeRapide(); __t += 5000; majSoir();
		// jour 2 : Q à l'heure de fin → le soir directement aussi
		while (Jeu.prochainDuJour()) Jeu.decider('renfort');
		Jeu.horloge.minutes = Jeu.finJournee();
		// « renfort » partout vide le budget : un licenciement (prompt 84, testé ailleurs) passerait avant le soir
		Jeu.statutPatron.licencie = null;
		quitterJourneeRapide(); phases.push(phase);
		o.q = phase === 'soir' && Jeu.messagesPatron.filter((m) => m.type === 'soir').length === 2;
		o.jamaisMail = !phases.includes('mail');
		return o;
	})()`,
		c194,
	);
	for (const [k, v] of Object.entries(r)) verifier(v === true, `prompt 194 : ${k} = ${v}`);
	// Code : plus de phase « mail », plus de mail plein écran ni d'Entrée associée ; reprise d'une ancienne sauvegarde au soir
	const tout = readdirSync(pub).filter((f) => f.endsWith('.js') && !/^(sw|icones-lucide)/.test(f)).map(lire194).join('\n');
	verifier(!/phase === 'mail'|phase = 'mail'|function dessinerMail|dessinerMail\(\)/.test(tout.replace(/ui\.phase === 'mail'/g, '')), 'prompt 194 : plus de phase « mail » ni de dessinerMail');
	verifier(/ui\.phase === 'mail'[^\n]*\n[^\n]*deposerMailDuSoir[^\n]*\n[^\n]*ancienMail\) && !Jeu\.terminee \? 'soir'/.test(lire194('sauvegarde.js')), 'prompt 194 : une sauvegarde en phase « mail » reprend au soir, mail déposé');
	verifier(/\{ cle: 'soirs', types: \['soir'\] \}/.test(lire194('patron.js')) && /soir: 'moon'/.test(lire194('patron.js')), 'prompt 194 : dossier « Soirs » et pictogramme du mail du soir dans Mails');
	for (const langue of ['fr', 'en']) {
		const dico = vm.runInContext(`TRADUCTIONS.${langue}`, contexte(langue));
		const retirees = ['bureau.mail', 'etat.mail', 'horloge.mail', 'mailf.titre', 'mailf.nouveau', 'mailf.de', 'mailf.a', 'mailf.signature', 'soir.ranger', 'quitter.range'].filter((k) => k in dico);
		verifier(!retirees.length, `prompt 194 (${langue}) : clés à retirer encore présentes : ${retirees.join(', ')}`);
		const ajoutees = ['patron.type.soir', 'patron.filtre.soirs', 'mailf.patronCite'].filter((k) => !dico[k]);
		verifier(!ajoutees.length, `prompt 194 (${langue}) : clés manquantes : ${ajoutees.join(', ')}`);
		verifier(/horlog|clock/i.test(dico['tuto.6.texte']) && /\bQ\b/.test(dico['tuto.6.texte']) && /Mail/.test(dico['tuto.6.texte']) && !/PC/.test(dico['horloge.fin']), `prompt 194 (${langue}) : le tutoriel explique l'horloge et Mails`);
	}
}

if (erreurs.length) {
	console.error(`Test du jeu : ${erreurs.length} erreur(s) sur ${controles + erreurs.length} contrôles`);
	for (const e of erreurs) console.error(`  ✗ ${e}`);
	process.exit(1);
}
console.log(`Test du jeu : ${controles} contrôles réussis (${semaines.length} semaines × ${SUITES.length} façons de jouer, reprise, mécaniques, traductions, hors ligne).`);
