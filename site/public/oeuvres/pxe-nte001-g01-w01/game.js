/* Nantes en régulation — logique du jeu (Q41 : game.js = logique, sketch.js = boucle p5).
 * Prompt 15 : chargement des données uniquement. Boucle, effets et jauges : prompts 17 à 19.
 *
 * Trois sources, toujours réelles :
 *   - « semaine »     : semaines d'archives publiques (data/semaines.js, préparé par scripts/preparer-semaines.mjs)
 *   - « direct »      : GTFS-RT Naolib du moment (gtfsrt.js), retards réels ≥ 10 min
 *   - « hors ligne »  : 6 dossiers réels d'une semaine d'archive (data/fallback.js), seed fixe (Q26, Q35)
 * Les données hors ligne sont chargées par <script> (window.PXE_*) : le jeu s'ouvre aussi par double clic.
 */
(function (global) {
	'use strict';

	const SEUIL_RETARD_MIN = 10; // Q1 / 00-concept : retard ≥ 10 min = dossier « ligne en difficulté »
	const DELAI_DIRECT_MS = 8000;

	const Jeu = {
		lignes: global.PXE_LIGNES || null,
		semaines: global.PXE_SEMAINES || null,
		fallback: global.PXE_FALLBACK || null,
		etat: { mode: null, semaine: null, dossiers: [], horsLigne: false, message: '' },
	};

	/** Nom court d'une ligne (« C7 ») à partir de son route_id GTFS. */
	Jeu.nomLigne = function (routeId) {
		const l = Jeu.lignes && Jeu.lignes.lignes.find((x) => x.id === routeId);
		return l ? l.nom : String(routeId || '').replace(/^.*:Line:/, '');
	};

	/** Liste des semaines proposées à l'accueil (Q14) : une par difficulté. */
	Jeu.semainesProposees = function () {
		return Jeu.semaines ? Jeu.semaines.index : [];
	};

	/** Mode « semaine rejouée » (archives). */
	Jeu.chargerSemaine = function (lundi) {
		const s = Jeu.semaines && Jeu.semaines.semaines[lundi];
		if (!s) return Jeu.chargerHorsLigne('Semaine introuvable : semaine de référence hors ligne.');
		Jeu.etat = { mode: 'semaine', semaine: s, dossiers: s.dossiers.slice(), horsLigne: false, message: '' };
		return Promise.resolve(Jeu.etat);
	};

	/** Mode hors ligne : semaine de référence (6 dossiers réels, seed fixe). */
	Jeu.chargerHorsLigne = function (message) {
		const fb = Jeu.fallback;
		Jeu.etat = {
			mode: 'hors ligne',
			semaine: fb ? fb.semaine : null,
			dossiers: fb ? fb.dossiers.slice() : [],
			seed: fb ? fb.seed : 1001,
			horsLigne: true,
			message: message || 'Mode hors ligne : semaine de référence enregistrée.',
		};
		return Promise.resolve(Jeu.etat);
	};

	/** Mode « aujourd'hui en direct » : un seul appel GTFS-RT au lancement, repli hors ligne si échec. */
	Jeu.chargerDirect = function () {
		if (!global.PXE_GTFSRT) return Jeu.chargerHorsLigne('Décodeur absent : mode hors ligne.');
		return global.PXE_GTFSRT.charger(global.PXE_GTFSRT.FLUX.tripUpdates, DELAI_DIRECT_MS)
			.then(function (flux) {
				const retards = global.PXE_GTFSRT.retardsParLigne(flux, SEUIL_RETARD_MIN);
				if (!retards.length) return Jeu.chargerHorsLigne('Aucun retard ≥ 10 min en ce moment : semaine de référence.');
				const quand = new Date((flux.horodatage || Date.now() / 1000) * 1000);
				Jeu.etat = {
					mode: 'direct',
					semaine: null,
					horodatage: quand.toISOString(),
					dossiers: retards.map(function (r) {
						return {
							date: quand.toISOString().slice(0, 10),
							type: 'ligne en difficulté',
							nature: 'retard',
							lignes: [Jeu.nomLigne(r.ligne)],
							retard: r.retardMin, // retard réel lu dans le flux (minutes)
							source: 'Flux GTFS-RT trip-updates Naolib (temps réel)',
							texte_source: 'Retard de ' + r.retardMin + ' min mesuré sur la ligne ' + Jeu.nomLigne(r.ligne),
						};
					}),
					horsLigne: false,
					message: '',
				};
				if (typeof console !== 'undefined') console.info('[direct] ' + retards.length + ' ligne(s) avec un retard ≥ ' + SEUIL_RETARD_MIN + ' min');
				return Jeu.etat;
			})
			.catch(function () {
				return Jeu.chargerHorsLigne('Flux temps réel injoignable : mode hors ligne.');
			});
	};

	global.Jeu = Jeu;
})(typeof window !== 'undefined' ? window : globalThis);
