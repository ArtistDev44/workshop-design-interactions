// Nantes en régulation — test du jeu sans navigateur (prompt 48), lancé par `npm test`.
// Charge les VRAIS fichiers du jeu (données préparées, i18n.js, game.js) dans un contexte Node isolé,
// joue chaque semaine archivée de bout en bout avec les vraies fonctions de game.js et vérifie des
// invariants : jauges bornées, avancée du paquet, journées, mails, bilan, sauvegarde / reprise,
// reproductibilité, mécaniques du prompt 47. Aucune donnée inventée : seules les archives du dépôt.
import { readFileSync, existsSync } from 'node:fs';
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
	const fichiers = ['data/lignes.js', 'data/semaines.js', 'data/fallback.js', 'data/messages.js', 'data/reponses.js', 'i18n.js', 'game.js', 'rythme.js', 'taches.js']; // prompts 74 / 88 : logique pure de la couche d'affichage
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
	const cles = ['mp.partager', 'mp.partager.texte', 'mp.partager.fermer', 'mp.partager.copier', 'mp.partager.copie', 'mp.partager.x', 'mp.partager.facebook', 'mp.partager.linkedin', 'mp.partager.mastodon', 'mp.depot', 'mp.credits', 'mp.licence'];
	const manque = vm.runInContext(`${JSON.stringify(cles)}.filter((k) => !TRADUCTIONS.fr[k] || !TRADUCTIONS.en[k])`, fr);
	verifier(manque.length === 0, `menu : clés manquantes ${manque}`);
	verifier(vm.runInContext("TRADUCTIONS.fr['mp.credits'] === 'Mattéo Brevet & Guillaume Renoult'", fr), 'menu : crédits');
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
		r.equipes = !eq || (eq.meta.effectifs && eq.meta.effectifs.police === Jeu.REGLAGES.equipes.police.effectif);
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
		return JSON.parse(JSON.stringify(r));
	})()`,
		fr,
	);
	verifier(pm.invalides === 0 && pm.types.includes('consigne') && pm.types.includes('reproche') && pm.types.length >= 4, `patron : types ${pm.types}`);
	verifier(pm.consigne && pm.reproche && pm.equipes && pm.alerte && pm.budget, `patron : meta réelle ${JSON.stringify(pm)}`);
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
				const b = Taches.briefing();
				if (!b || b.options.length < 2 || b.options.length > 4) out.erreursOpt.push(j.date + ' ' + (b && b.options.length));
				const m = Jeu.meteoDuJour(j.date) || {};
				for (const o of b.options) {
					if (o.id === 'meteo' && !((m.pluie_mm || 0) >= 5 || (m.rafales_max || 0) >= 50)) out.erreursOpt.push(j.date + ' météo sans fait');
					if (o.id === 'evenement' && !Jeu.evenementsAffluence(j.date).length) out.erreursOpt.push(j.date + ' agenda vide');
					if (o.id === 'ligne' && !j.dossiers.some((d) => d.type === 'perturbation' && (d.lignes || []).includes(o.vars.ligne))) out.erreursOpt.push(j.date + ' ligne sans travaux');
				}
				Taches.choisirPriorites(b.options.slice(0, 2).map((o) => o.id));
				while (Jeu.prochainDuJour()) Jeu.decider(Jeu.actionsPossibles(Jeu.dossierCourant())[0]);
				Jeu.finDeJourneeTactique();
				const rp = Taches.rapport();
				Taches.validerRapport(rp.faits[0].id, 'budget');
				if (!Jeu.jours[Jeu.jourIndex + 1]) break;
				Jeu.journeeSuivante(); Taches.matin();
			}
			out.carnet = Math.max(out.carnet, Jeu.taches.carnet.length);
		}
		// Demande accordée (réputation ≥ 50) : +5 de budget le lendemain matin ; refusée sous 50
		Jeu.chargerSemaine('2026-11-02'); Jeu.nouvellePartie(); Taches.nouvellePartie();
		Taches.choisirPriorites([]);
		Jeu.jauges.reputation = 60; Jeu.finDeJourneeTactique();
		const r1 = Taches.validerRapport('x', 'budget');
		while (Jeu.prochainDuJour()) Jeu.decider('temps');
		Jeu.journeeSuivante(); const b0 = Jeu.jauges.budget; Taches.matin();
		out.accord = { accordee: r1.accordee, delta: Jeu.jauges.budget - b0, message: String(Jeu.messagesPatron[Jeu.messagesPatron.length - 1].texte) };
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
	verifier(r.carnet >= 6, `carnet : une ligne par journée (${r.carnet})`);
	verifier(r.accord.accordee && r.accord.delta === 5 && /accordée/.test(r.accord.message), `rapport : demande accordée → +5 de budget le lendemain (${JSON.stringify(r.accord)})`);
	verifier(r.refus.accordee === false && r.refus.bonus === '{}', `rapport : réputation < 50 → demande refusée (${JSON.stringify(r.refus)})`);
	verifier(r.sauve, 'sauvegarde : les tâches de la partie (priorités, rapport, carnet) sont restaurées');
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
