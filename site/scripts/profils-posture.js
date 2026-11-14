/* Prompt 207 — profils de joueurs scriptés pour l'équilibrage des dix fins (chargé dans le contexte vm de test-jeu.mjs,
 * après game.js, posture.js et panneau.js). Joue une semaine archivée avec les VRAIES fonctions du jeu ; seuls les gestes
 * de l'interface (café, réponse sur Quai, laisser filer un signalement) sont simulés par les mêmes appels que l'interface.
 * Profils : applique (meilleure réplique + Quai juste), autre (toujours l'autre réplique), clasheur (4 clashs puis la
 * meilleure), cafe (renforts quand proposés + un café chaque jour), renforts (renforts quand proposés), communicant
 * (une décision sur deux la meilleure + Quai juste), desobeissant (jours 1–4 : la réplique qui sert le moins la jauge de
 * l'objectif du jour), deborde (meilleure réplique, un signalement sur deux laissé filer, Quai ignoré), neutre (au hasard
 * entre la meilleure et l'autre, Quai une fois sur deux au hasard). */
function jouerProfil(lundi, profil, graine) {
	let s = graine >>> 0;
	const alea = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
	Jeu.chargerSemaine(lundi);
	Jeu.nouvellePartie();
	Taches.nouvellePartie();
	if (Taches.matin) Taches.matin();
	const fini = () => Jeu.terminee || (Jeu.statutPatron && Jeu.statutPatron.licencie);
	let garde = 0;
	let clashs = 0;
	let n = 0;
	const repondreQuai = (bonne) =>
		(Jeu.plaintes || [])
			.filter((p) => p.reponse === null && !p.expiree && p.def)
			.forEach((p) => {
				const ordre = Jeu.ordreReponses(p);
				let i = ordre.findIndex((ri) => (p.def.reponses[ri] || {}).bonne === true || (p.def.reponses[ri] || {}).signaler === true);
				if (!bonne) i = Math.floor(alea() * ordre.length);
				if (i >= 0) Jeu.repondrePlainte(p, i, 0);
			});
	while (!fini() && garde++ < 400) {
		if (Jeu.prochainDuJour()) {
			const d = Jeu.dossierCourant();
			if (profil === 'cafe' && !(Jeu.posture.joursCafe || []).includes(Jeu.jourIndex)) Jeu.noterPosture('cafes');
			if (Jeu.declencherPlainte) Jeu.declencherPlainte(Jeu.index);
			const rs = reponsesDialogue(d);
			const best = Jeu.meilleureReponse(d);
			const a = rs.find((r) => !r.clash && r.cle === best) || rs[0];
			const c = rs.find((r) => r.clash);
			const b = rs.find((r) => r !== a && r !== c) || a;
			let choix = a;
			if (profil === 'autre') choix = b;
			if (profil === 'clasheur') choix = clashs < 4 ? c : a;
			if (profil === 'renforts' || profil === 'cafe') choix = [a, b].find((r) => Jeu.familleDe(r.cle) === 'renfort') || a;
			if (profil === 'neutre') choix = alea() < 0.5 ? a : b;
			if (profil === 'communicant') choix = n % 2 ? a : b;
			if (profil === 'desobeissant' && Jeu.jourIndex < 4) {
				const k = ['fluidite', 'reputation', 'budget'].indexOf(Jeu.objectifDuJour().jauge);
				const v = (r) => ((Jeu.reponse(d, r.cle) || {}).base || [0, 0, 0])[k] || 0;
				choix = v(a) <= v(b) ? a : b;
			}
			if (profil === 'deborde') choix = n % 2 ? null : a;
			n++;
			if (choix && choix.clash) clashs++;
			Jeu.clashSuivant = !!(choix && choix.clash);
			const res = Jeu.decider(choix ? choix.cle : 'temps');
			Jeu.clashSuivant = false;
			Taches.apresDecision(res, Jeu.index - 1);
			if (profil === 'deborde') {
				Jeu.majPlaintes(0);
				Jeu.majPlaintes(1e9); // Quai ignoré : chaque plainte s'envenime
			}
			if (profil === 'communicant' || profil === 'applique') repondreQuai(true);
			if (profil === 'neutre' && alea() < 0.5) repondreQuai(alea() < 0.5);
		} else {
			Jeu.finDeJourneeTactique();
			if (Jeu.statutPatron.licencie) break;
			if (!Jeu.jours[Jeu.jourIndex + 1]) break;
			Jeu.journeeSuivante();
			if (Taches.matin) Taches.matin();
		}
	}
	if (Jeu.statutPatron.licencie) return { fin: 'licencie', signaux: null };
	const sg = Jeu.signauxPosture();
	return { fin: Jeu.finDeSemaine(sg), signaux: { score: sg.score, jauges: sg.jauges, bons: sg.bons, decisions: sg.decisions, clashs: sg.clashs, quai: sg.quai, objectifsRates: sg.objectifsRates } };
}
