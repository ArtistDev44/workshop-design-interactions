// Nantes en régulation — test du jeu sans navigateur (prompt 48), lancé par `npm test`.
// Charge les VRAIS fichiers du jeu (données préparées, i18n.js, game.js) dans un contexte Node isolé,
// joue chaque semaine archivée de bout en bout avec les vraies fonctions de game.js et vérifie des
// invariants : jauges bornées, avancée du paquet, journées, mails, bilan, sauvegarde / reprise,
// reproductibilité, mécaniques du prompt 47. Aucune donnée inventée : seules les archives du dépôt.
import { readFileSync } from 'node:fs';
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
	const fichiers = ['data/lignes.js', 'data/semaines.js', 'data/fallback.js', 'data/messages.js', 'i18n.js', 'game.js', 'carte.js']; // prompt 72 : carte.js (réponses d'alerte) testé unitairement
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
	const attendu = { devier: 0, retenir: 0, renfort: 0, rien: 0, temps: 0 };
	for (let i = 0; i < n; i++) attendu[suite[i % 5]]++;
	return { s: Jeu.statsSemaine(), attendu, n, mail: Jeu.mailFinSemaine().lignes.map(String) }; })()`,
	fr,
);
verifier(st.s.recus === st.n && st.s.traites + st.s.expires === st.n, `rapport : reçus ${st.s.recus}, traités ${st.s.traites}, expirés ${st.s.expires}, décisions ${st.n}`);
verifier(JSON.stringify(st.s.parAction) === JSON.stringify(st.attendu), `rapport : décisions par action ${JSON.stringify(st.s.parAction)} ≠ ${JSON.stringify(st.attendu)}`);
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
	return { a, b, nbs, total, delta, avant, livres, encore, rep: Jeu.jauges.reputation - rep0, comm: Jeu.commentaires.filter((c) => c.suivi).map((c) => String(c.texte)) };
	})()`,
	fr,
);
verifier(JSON.stringify(sv.a) === JSON.stringify(sv.b) && sv.a.length > 0, 'réactions : tirage non reproductible ou aucune plainte');
verifier(sv.nbs.every((n) => n >= 0 && n <= 3), `réactions : plus de 3 pour une réponse (${sv.nbs})`);
verifier(sv.livres + sv.avant === sv.total && sv.encore === 0, `réactions : ${sv.avant} + ${sv.livres} livrées sur ${sv.total}, ${sv.encore} en double`);
verifier(sv.comm.length === sv.total && sv.comm.every((x) => x && !x.includes('[À COMPLÉTER]') && !x.includes('« »')), 'réactions : texte manquant ou vide');

// Prompt 68 : gravité, pertinence, équipes limitées (effectif, cycle, refus, remise à zéro, effet hors sujet, sauvegarde)
const eq = vm.runInContext(
	`(() => {
	const g = [Jeu.gravite({ retard: 25 }), Jeu.gravite({ type: 'alerte météo' }), Jeu.gravite({ retard: 12 }), Jeu.gravite({ type: 'événement' }), Jeu.gravite({ type: 'perturbation', retard: null })];
	const p = [Jeu.equipesPertinentes({ type: 'ligne en difficulté' }), Jeu.equipesPertinentes({ type: 'perturbation' }), Jeu.equipesPertinentes({ type: 'événement' }), Jeu.equipesPertinentes({ type: 'alerte météo' }), Jeu.equipesPertinentes({ type: 'perturbation', texte_source: 'Accident de bus' })];
	Jeu.chargerSemaine('2026-10-12'); Jeu.nouvellePartie(); Jeu.jauges.budget = 100;
	Jeu.elementDebloque = () => true;
	const t0 = 1000000;
	const d0 = Jeu.paquet[0];
	const a = Jeu.envoyerEquipe(0, 'ambulance', t0); // 1 ambulance par jour
	const deja = Jeu.envoyerEquipe(0, 'ambulance', t0);
	const dispoApres = Jeu.equipesDisponibles('ambulance', t0);
	Jeu.index = 1;
	const refus = Jeu.envoyerEquipe(1, 'ambulance', t0 + 1000);
	const libreAvant = Jeu.equipesDisponibles('ambulance', t0 + 20000 + 50000 + 9000);
	const libreApres = Jeu.equipesDisponibles('ambulance', t0 + 20000 + 50000 + 10001);
	// Effet hors sujet : moitié
	const amb = Jeu.equipes[0];
	const rep0 = Jeu.jauges.reputation;
	Jeu.majEquipes(t0 + 20001);
	const gain = Jeu.jauges.reputation - rep0 - 1; // − commentaire « équipe » (+1)
	// Sauvegarde / reprise : le cycle continue
	const snap = JSON.parse(JSON.stringify(Jeu.instantane(t0 + 30000)));
	// Remise à zéro le matin
	const t1 = t0 + 2000;
	Jeu.envoyerEquipe(1, 'police', t1); Jeu.envoyerEquipe(1, 'techniciens', t1);
	const policeAvant = Jeu.equipesDisponibles('police', t1);
	Jeu.journeeSuivante();
	const policeMatin = Jeu.equipesDisponibles('police', t1 + 1);
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

// Prompt 69 : fin de journée — phase « soir », nuit à 21 h, sortie → lendemain 6 h (ou bilan le dernier jour)
{
	const cs = contexte('fr');
	vm.runInContext(
		`var phase = 'attente', ecran = 'jeu', vue = 'poste', fenetre = null, enPause = false, enSieste = true, reveil = null, reduireAnimations = false;
		var MENU = { actif: false }, PC = { fenetre: 'journal' }, SABLIER = { actif: true }, CAMERA = { x: 0, y: 0 }, METEO_VISU = { nuit: 1 }, focusBureau = -1, OBJETS_BUREAU = [];
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
		res.soir = phase === 'soir' && __leve === 1 && vue === 'bureau' && !enSieste && !SABLIER.actif && PC.fenetre === null && __saves === 1;
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
	verifier(garde.includes("phase === 'soir'"), 'soir : le temps (incidents, sieste, sablier) ne doit pas avancer pendant le soir');
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

// Prompt 72 : alertes → 2 à 4 réponses, chacune mappée vers une action ou une équipe existante, mélange reproductible
const alertes = vm.runInContext(
	`(() => {
		const bilan = { alertes: 0, autres: 0, pluieDevie: false, rafalesPompiers: false, secoursAmbulance: false, affluencePolice: false, memeOrdre: true, typesVus: {} };
		const teste = (d) => {
			const reps = reponsesAlerte(d);
			if (!estAlerte(d)) { if (reps.length) throw new Error('réponses proposées hors alerte'); bilan.autres++; return; }
			bilan.alertes++;
			bilan.typesVus[d.type] = true;
			if (reps.length < 2 || reps.length > 4) throw new Error('alerte avec ' + reps.length + ' réponses');
			reps.forEach((r) => {
				if (!r.cle || !r.vers || !r.vers.cle) throw new Error('réponse sans mapping');
				if (r.vers.type === 'action' && !['devier', 'retenir', 'renfort', 'rien'].includes(r.vers.cle)) throw new Error('action inconnue : ' + r.vers.cle);
				if (r.vers.type === 'equipe' && !Jeu.EQUIPES[r.vers.cle]) throw new Error('équipe inconnue : ' + r.vers.cle);
			});
			// mélange reproductible (même graine → même ordre)
			const ordre = reponsesAlerte(d).map((r) => r.cle).join('|');
			if (reponsesAlerte(d).map((r) => r.cle).join('|') !== ordre) bilan.memeOrdre = false;
			const m = Jeu.meteoDuJour(d.date) || {};
			if (d.type === 'alerte météo' && (m.pluie_mm || 0) >= 10 && reps.some((r) => r.vers.cle === 'devier')) bilan.pluieDevie = true;
			if (d.type === 'alerte météo' && (m.rafales_max || 0) >= 50 && reps.some((r) => r.vers.cle === 'pompiers')) bilan.rafalesPompiers = true;
			if (/accident|malaise|bless|chute/i.test(String(d.texte_source || '')) && reps.some((r) => r.vers.cle === 'ambulance')) bilan.secoursAmbulance = true;
			if ((d.type === 'événement' || d.affluence) && reps.some((r) => r.vers.cle === 'police')) bilan.affluencePolice = true;
		};
		Jeu.semainesProposees().forEach((s) => { Jeu.chargerSemaine(s.lundi); Jeu.nouvellePartie(); Jeu.paquet.forEach(teste); });
		Jeu.chargerHorsLigne(); Jeu.nouvellePartie(); Jeu.paquet.forEach(teste);
		// Dossiers synthétiques construits sur des champs réels (mapping pluie forte / rafales / secours / affluence)
		Jeu.chargerSemaine('2026-09-14'); Jeu.nouvellePartie(); // 2026-09-15 : rafales 50,4 km/h réelles
		const base = Jeu.paquet[0];
		const synthetic = [
			Object.assign({}, base, { type: 'alerte météo', date: '2026-09-15', texte_source: 'Rafales de vent' }),
			Object.assign({}, base, { type: 'perturbation', texte_source: 'Accident sur la ligne, un usager a fait un malaise' }),
			Object.assign({}, base, { type: 'événement', affluence: true, texte_source: 'Concert géant — Stade de la Beaujoire', nature: 'Concert' }),
		];
		const r1 = reponsesAlerte(synthetic[0]);
		bilan.rafalesPompiers = bilan.rafalesPompiers || r1.some((r) => r.vers.cle === 'pompiers' && r.vars.rafales === 50);
		const r2 = reponsesAlerte(synthetic[1]);
		bilan.secoursAmbulance = bilan.secoursAmbulance || r2.some((r) => r.vers.cle === 'ambulance');
		const r3 = reponsesAlerte(synthetic[2]);
		bilan.affluencePolice = bilan.affluencePolice || r3.some((r) => r.vers.cle === 'police' && r.vars.evenement.includes('Concert géant'));
		// Pluie forte : aucune semaine archivée n'atteint 10 mm → mapping testé avec la météo du jour forcée (champ réel du même format)
		const m0 = Jeu.meteoDuJour;
		Jeu.meteoDuJour = () => ({ date: base.date, pluie_mm: 12.5, rafales_max: 10, temp_min: 8, temp_max: 14 });
		bilan.pluieDevie = reponsesAlerte(Object.assign({}, base, { type: 'alerte météo' })).some((r) => r.vers.cle === 'devier' && r.vars.pluie === 12.5);
		Jeu.meteoDuJour = m0;
		return bilan;
	})()`,
	fr,
);
verifier(alertes.alertes > 0, 'prompt 72 : aucune alerte trouvée dans les semaines archivées');
verifier(alertes.memeOrdre, 'prompt 72 : le mélange des réponses n\u2019est pas reproductible');
verifier(alertes.pluieDevie, 'prompt 72 : pluie forte sans réponse « dévier »');
verifier(alertes.rafalesPompiers, 'prompt 72 : rafales fortes sans réponse « pompiers »');
verifier(alertes.secoursAmbulance, 'prompt 72 : secours (malaise/accident) sans réponse « ambulanciers »');
verifier(alertes.affluencePolice, 'prompt 72 : affluence sans réponse « police » avec le nom réel de l\u2019événement');

// Prompt 74 : textes de liaison reproductibles par graine et ancrés dans les données réelles ; série des évaluations
const p74 = vm.runInContext(
	`(() => {
		Jeu.chargerSemaine('2026-09-14'); Jeu.nouvellePartie();
		const out = { liaisons: [], meme: true, serie: null, avant: Jeu.paquet.map((d) => d.date + '|' + (d.heure || '') + '|' + d.type).join(';') };
		Jeu.paquet.forEach((d) => {
			const a = texteLiaison(d);
			const b = texteLiaison(d);
			if (a !== b) out.meme = false;
			out.liaisons.push(a);
		});
		// la série suit les vraies évaluations du journal
		Jeu.decider('renfort');
		out.serie = serieDecisions();
		// l'ordre d'arrivée (paquet) n'est PAS modifié : toujours chronologique sur les données réelles
		Jeu.decider('rien');
		out.apres = Jeu.paquet.map((d) => d.date + '|' + (d.heure || '') + '|' + d.type).join(';');
		return out;
	})()`,
	fr,
);
verifier(p74.meme, 'prompt 74 : les textes de liaison ne sont pas reproductibles');
verifier(p74.liaisons.every((l) => typeof l === 'string' && l.length > 0 && !l.includes('[À COMPLÉTER]')), 'prompt 74 : texte de liaison manquant');
verifier(p74.liaisons.some((l) => l !== p74.liaisons[0]) || p74.liaisons.length < 2, 'prompt 74 : tous les textes de liaison sont identiques');
verifier(p74.serie && p74.serie.n >= 1 && ['bon', 'rate'].includes(p74.serie.type), 'prompt 74 : la série des évaluations ne fonctionne pas');
verifier(p74.avant === p74.apres, 'prompt 74 : game.js / l\u2019ordre du paquet a changé (doit rester inchangé)');

// Traductions : toute clé française existe en anglais
const manquantes = vm.runInContext('Object.keys(TRADUCTIONS.fr).filter((k) => TRADUCTIONS.en[k] === undefined)', fr);
verifier(manquantes.length === 0, `clés sans traduction anglaise : ${manquantes.slice(0, 8).join(', ')}`);
// Une partie en anglais ne laisse pas de texte manquant
const en = jouer(contexte('en'), semaines[0], SUITES[0]);
verifier(!JSON.stringify(en.traces.mails).includes('[À COMPLÉTER]'), 'mails anglais : texte manquant');

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
