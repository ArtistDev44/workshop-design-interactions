/* Nantes en régulation — couche sonore (prompt 30, avec la piste musicale du jeu).
 * Règle : aucun fichier audio. Tout est synthétisé en WebAudio, donc local, hors ligne, sans licence.
 * Style : sons « 8 bits feutrés », accordés au décor pixel (ondes carrées / triangle, bruit filtré).
 *
 * Ambiance de la pièce, entendue derrière la baie vitrée (filtre passe-bas « vitre ») :
 *   - pluie (souffle + gouttes sur la vitre) : dès 1 mm (comme la pluie dessinée), intensité = pluie_mm réel ;
 *   - vent (souffle modulé + rafales)        : intensité = rafales_max (km/h) de cette même météo ;
 *   - ville et tram au loin (journée simulée) : rumeur grave + cloche de tram lointaine de temps en temps ;
 *   - nuit (avant 7 h, après 20 h)           : ville presque éteinte, musique plus sombre.
 * Musique : boucle originale composée pour le jeu (la mineur, 78 bpm), quatre humeurs :
 *   accueil (calme), jeu (travail), tension (incident en cours), fin (résolution en majeur).
 * Tout suit l'interrupteur Son (M) ; la musique a en plus son propre réglage (touche 5 des Paramètres).
 * Le son démarre au premier geste du joueur (règle d'autoplay des navigateurs).
 */
(function (global) {
	'use strict';
	const Son = global.Confort.Son;
	const R = global.Confort.Reglages;
	const borne = (v, a, b) => Math.max(a, Math.min(b, v));

	const A = {
		pret: false,
		cibles: {},
		mode: null,
		minuterie: null,
		prochainPas: 0,
		pas: 0,
		prochaineGoutte: 0,
		prochaineRafale: 0,
		prochainTram: 0,
	};

	// ——— Construction du graphe ———
	function bruitRose(c, secondes) {
		const b = c.createBuffer(1, c.sampleRate * secondes, c.sampleRate);
		const d = b.getChannelData(0);
		let b0 = 0, b1 = 0, b2 = 0;
		for (let i = 0; i < d.length; i++) {
			const w = Math.random() * 2 - 1;
			b0 = 0.997 * b0 + w * 0.029591;
			b1 = 0.985 * b1 + w * 0.032534;
			b2 = 0.95 * b2 + w * 0.048056;
			d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.6;
		}
		return b;
	}
	function bruitBlanc(c, secondes) {
		const b = c.createBuffer(1, c.sampleRate * secondes, c.sampleRate);
		const d = b.getChannelData(0);
		for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
		return b;
	}
	function source(c, buffer, debut) {
		const s = c.createBufferSource();
		s.buffer = buffer;
		s.loop = true;
		s.start(0, debut || 0);
		return s;
	}
	function gain(c, v) {
		const g = c.createGain();
		g.gain.value = v;
		return g;
	}
	function filtre(c, type, f, q) {
		const b = c.createBiquadFilter();
		b.type = type;
		b.frequency.value = f;
		if (q) b.Q.value = q;
		return b;
	}

	function construire() {
		const c = Son.ctx;
		A.rose = bruitRose(c, 4);
		A.blanc = bruitBlanc(c, 1);
		// Onde « pulse 25 % » : timbre console 8 bits, adouci plus loin par un passe-bas
		const n = 32;
		const re = new Float32Array(n);
		const im = new Float32Array(n);
		for (let k = 1; k < n; k++) im[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25);
		A.pulse = c.createPeriodicWave(re, im);

		// Bus : ambiance (derrière la vitre) et musique
		A.vitre = filtre(c, 'lowpass', 3200, 0.5);
		A.busAmbiance = gain(c, 0);
		A.vitre.connect(A.busAmbiance).connect(Son.maitre);
		A.busMusique = gain(c, 0);
		A.filtreMusique = filtre(c, 'lowpass', 2400, 0.6);
		A.filtreMusique.connect(A.busMusique).connect(Son.maitre);

		// Pluie : souffle continu
		A.gPluie = gain(c, 0);
		source(c, A.rose, 0).connect(filtre(c, 'highpass', 700)).connect(filtre(c, 'lowpass', 5200)).connect(A.gPluie).connect(A.vitre);

		// Vent : souffle passe-bande dont la fréquence ondule lentement (LFO)
		A.gVent = gain(c, 0);
		const bpVent = filtre(c, 'bandpass', 380, 0.9);
		const lfo = c.createOscillator();
		lfo.frequency.value = 0.08;
		const prof = gain(c, 220);
		lfo.connect(prof).connect(bpVent.frequency);
		lfo.start();
		A.gRafale = gain(c, 1);
		source(c, A.rose, 1.7).connect(bpVent).connect(A.gRafale).connect(A.gVent).connect(A.vitre);

		// Ville : rumeur grave (circulation lointaine) + ventilation de la salle (déjà présente avant, conservée)
		A.gVille = gain(c, 0);
		source(c, A.rose, 2.9).connect(filtre(c, 'lowpass', 140, 0.7)).connect(A.gVille).connect(A.vitre);
		A.gVentil = gain(c, 0.018);
		[55, 55.7].forEach((f) => {
			const o = c.createOscillator();
			o.frequency.value = f;
			o.connect(A.gVentil);
			o.start();
		});
		A.gVentil.connect(A.busAmbiance);
		A.pret = true;
	}

	// ——— Événements ponctuels de l'ambiance ———
	function goutte(t) {
		const c = Son.ctx;
		const s = c.createBufferSource();
		s.buffer = A.blanc;
		const bp = filtre(c, 'bandpass', 2600 + Math.random() * 3200, 6);
		const g = c.createGain();
		const pan = c.createStereoPanner ? c.createStereoPanner() : null;
		const v = 0.08 + Math.random() * 0.12;
		g.gain.setValueAtTime(v, t);
		g.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
		s.connect(bp).connect(g);
		if (pan) {
			pan.pan.value = Math.random() * 2 - 1;
			g.connect(pan).connect(A.vitre);
		} else g.connect(A.vitre);
		s.start(t, Math.random() * 0.8, 0.05);
	}

	function rafale(t, force) {
		// Rafale : le vent monte puis retombe en quelques secondes (aucun à-coup)
		const g = A.gRafale.gain;
		g.cancelScheduledValues(t);
		g.setValueAtTime(g.value, t);
		g.linearRampToValueAtTime(1 + force * 1.6, t + 1.2 + Math.random());
		g.linearRampToValueAtTime(1, t + 4 + Math.random() * 2);
	}

	function tram(t) {
		// Tram au loin : roulement qui enfle et passe, puis deux coups de cloche lointains
		const c = Son.ctx;
		const s = c.createBufferSource();
		s.buffer = A.rose;
		const lp = filtre(c, 'lowpass', 180, 1.2);
		const g = gain(c, 0);
		g.gain.setValueAtTime(0, t);
		g.gain.linearRampToValueAtTime(0.35, t + 3);
		g.gain.linearRampToValueAtTime(0, t + 7);
		s.connect(lp).connect(g).connect(A.vitre);
		s.start(t, Math.random() * 2, 7.5);
		[t + 1.6, t + 1.95].forEach((tc) => {
			[1180, 2960].forEach((f, i) => {
				const o = c.createOscillator();
				o.frequency.value = f;
				const go = gain(c, 0);
				go.gain.setValueAtTime(i ? 0.012 : 0.03, tc);
				go.gain.exponentialRampToValueAtTime(0.0001, tc + 0.9);
				o.connect(go).connect(A.vitre);
				o.start(tc);
				o.stop(tc + 1);
			});
		});
	}

	// ——— Musique originale : pas de 16e, 4 mesures en boucle ———
	const NOTES = { A2: 110, C3: 130.81, D3: 146.83, E3: 164.81, F2: 87.31, G2: 98, C2: 65.41, E2: 82.41 };
	const f = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
	// Accords (notes MIDI) et basses, par humeur
	const GRILLES = {
		accueil: { bpm: 70, accords: [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 66]], basses: ['A2', 'F2', 'C3', 'G2'], chapeau: 0, melodie: false },
		jeu: { bpm: 78, accords: [[57, 60, 64, 67], [53, 57, 60, 64], [48, 52, 55, 59], [55, 59, 62, 67]], basses: ['A2', 'F2', 'C3', 'G2'], chapeau: 1, melodie: true },
		tension: { bpm: 92, accords: [[57, 60, 64], [57, 60, 64], [53, 57, 60], [52, 56, 59]], basses: ['A2', 'A2', 'F2', 'E2'], chapeau: 2, melodie: false },
		fin: { bpm: 72, accords: [[48, 52, 55, 59], [55, 59, 62, 67], [57, 60, 64, 67], [53, 57, 60, 64]], basses: ['C3', 'G2', 'A2', 'F2'], chapeau: 0, melodie: true },
	};
	// Motif mélodique fixe (gamme de la mineur), 16 pas par mesure, null = silence
	const MELODIE = [76, null, null, 74, null, 72, null, null, 71, null, 72, null, 74, null, null, null,
		72, null, null, 69, null, 72, null, null, 74, null, 76, null, 79, null, 76, null,
		76, null, null, 74, null, 72, null, null, 67, null, 69, null, 72, null, null, null,
		74, null, null, 72, null, 71, null, null, 67, null, null, null, null, null, null, null];

	function note(t, freq, duree, vol, onde, sortie) {
		const c = Son.ctx;
		const o = c.createOscillator();
		if (onde === 'pulse') o.setPeriodicWave(A.pulse);
		else o.type = onde;
		o.frequency.value = freq;
		const g = c.createGain();
		g.gain.setValueAtTime(0.0001, t);
		g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
		g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
		o.connect(g).connect(sortie || A.filtreMusique);
		o.start(t);
		o.stop(t + duree + 0.02);
	}
	function chapeau(t, vol) {
		const c = Son.ctx;
		const s = c.createBufferSource();
		s.buffer = A.blanc;
		const g = c.createGain();
		g.gain.setValueAtTime(vol, t);
		g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
		s.connect(filtre(c, 'highpass', 7000)).connect(g).connect(A.busMusique);
		s.start(t, Math.random() * 0.5, 0.05);
	}

	function jouerPas(t) {
		const G = GRILLES[A.mode] || GRILLES.jeu;
		const mesure = Math.floor(A.pas / 16) % 4;
		const p = A.pas % 16;
		const acc = G.accords[mesure];
		const duree16 = 60 / G.bpm / 4;
		// Basse (triangle) : temps 1 et « et » du 2
		if (p === 0 || p === 6 || (A.mode === 'tension' && p % 4 === 0)) note(t, NOTES[G.basses[mesure]], duree16 * (A.mode === 'tension' ? 3 : 5), 0.16, 'triangle');
		// Arpège (pulse 25 %) en croches, montant puis descendant
		if (p % 2 === 0) {
			const i = (p / 2) % 6;
			const idx = [0, 1, 2, 3, 2, 1][i] % acc.length;
			note(t, f(acc[idx] + 12), duree16 * 1.6, A.mode === 'accueil' ? 0.035 : 0.045, 'pulse');
		}
		// Nappe : l'accord entier, très doux, sur le premier temps de chaque mesure
		if (p === 0) acc.forEach((m) => note(t, f(m), duree16 * 15, 0.012, 'triangle'));
		// Mélodie (jeu, fin)
		if (G.melodie) {
			const m = MELODIE[A.pas % 64];
			if (m) note(t, f(m), duree16 * 3, 0.03, 'square');
		}
		// Chapeau : contretemps (jeu) ou doubles croches (tension)
		if (G.chapeau === 1 && p % 4 === 2) chapeau(t, 0.025);
		if (G.chapeau === 2 && p % 2 === 1) chapeau(t, 0.02);
		A.pas = (A.pas + 1) % 64;
		return duree16;
	}

	function ordonnanceur() {
		if (!Son.ctx || !A.pret) return;
		const c = Son.ctx;
		const maintenant = c.currentTime;
		if (A.prochainPas < maintenant) A.prochainPas = maintenant + 0.05;
		while (A.prochainPas < maintenant + 0.15) {
			const d = R.musique !== false ? jouerPas(A.prochainPas) : 60 / 78 / 4;
			A.prochainPas += d;
		}
		// Gouttes sur la vitre : densité proportionnelle à la pluie réelle
		const pluie = A.cibles.pluie || 0;
		if (pluie > 0 && maintenant >= A.prochaineGoutte) {
			goutte(maintenant + 0.02);
			A.prochaineGoutte = maintenant + (0.05 + Math.random() * 0.4) / pluie;
		}
		// Rafales : plus fréquentes et plus fortes avec les rafales réelles
		const vent = A.cibles.vent || 0;
		if (vent > 0.05 && maintenant >= A.prochaineRafale) {
			rafale(maintenant, vent);
			A.prochaineRafale = maintenant + 5 + Math.random() * (14 - vent * 8);
		}
		// Tram au loin : de jour seulement
		if (A.cibles.jour && maintenant >= A.prochainTram) {
			if (A.prochainTram > 0) tram(maintenant + 0.1);
			A.prochainTram = maintenant + 40 + Math.random() * 60;
		}
	}

	// ——— Contexte du jeu → cibles sonores (appelé à chaque image depuis draw) ———
	function viser(param, valeur, temps) {
		if (Math.abs(param.value - valeur) > 0.0005) param.setTargetAtTime(valeur, Son.ctx.currentTime, temps || 0.35);
	}

	A.maj = function (ctx) {
		if (!A.pret || !Son.ctx || !R.son) return;
		const m = ctx.meteo || {};
		// Pluie : même seuil que la pluie dessinée sur la baie (≥ 1 mm), pleine intensité vers 12 mm
		const pluie = m.pluie_mm >= 1 ? borne(0.25 + m.pluie_mm / 16, 0, 1) : 0;
		// Vent : rafales réelles, audible dès ~20 km/h, plein vers 75 km/h
		const vent = borne(((m.rafales_max || 0) - 18) / 57, 0, 1);
		const jour = !ctx.nuit;
		A.cibles = { pluie, vent, jour };
		// Fondus courts (~1 s) quand le contexte change
		viser(A.gPluie.gain, pluie * 0.32, 0.4);
		viser(A.gVent.gain, vent * 0.42, 0.4);
		viser(A.gVille.gain, jour ? 0.22 : 0.06, 0.4);
		viser(A.busAmbiance.gain, ctx.auPoste ? 0.75 : 1, 0.3);
		// Musique : volume réglable, plus sombre la nuit et feutrée sous la pluie, baissée en pause
		const vol = R.musique === false ? 0 : ctx.pause ? 0.25 : 0.8;
		viser(A.busMusique.gain, vol, 0.4);
		viser(A.filtreMusique.frequency, (ctx.nuit ? 1500 : 2600) - pluie * 600, 0.5);
		if (ctx.mode !== A.mode) {
			// Changement d'humeur au début de la mesure suivante
			const avant = A.mode;
			A.mode = ctx.mode;
			if (avant) A.pas = Math.ceil(A.pas / 16) * 16 % 64;
		}
	};

	// ——— Branchement sur Confort.Son (démarrage au premier geste, coupure par M) ———
	const demarrerOrigine = Son.demarrer;
	Son.creerAmbiance = function () {
		if (!A.pret) construire();
		viser(A.busAmbiance.gain, 1, 0.5);
		if (!A.minuterie) A.minuterie = setInterval(ordonnanceur, 30);
		return [];
	};
	Son.demarrer = function () {
		demarrerOrigine();
		if (Son.ctx && R.son && !A.minuterie && A.pret) {
			A.minuterie = setInterval(ordonnanceur, 30);
			viser(A.busAmbiance.gain, 1, 0.5);
		}
	};
	Son.couper = function () {
		if (A.minuterie) clearInterval(A.minuterie);
		A.minuterie = null;
		if (A.pret) {
			viser(A.busAmbiance.gain, 0, 0.15);
			viser(A.busMusique.gain, 0, 0.15);
		}
		Son.ambiance = null;
	};

	// ——— Signaux d'événements (courts, < 1 s, timbre 8 bits) ———
	const bipOrigine = Son.bip;
	Son.bip = function (type) {
		if (!R.son || !Son.ctx || !A.pret) return bipOrigine(type);
		const c = Son.ctx;
		const t = c.currentTime + 0.01;
		const sortie = Son.maitre;
		if (type === 'incident') {
			// Alerte incident : deux notes descendantes répétées, carré
			[[988, 0], [784, 0.12], [988, 0.3], [784, 0.42]].forEach(([fr, d]) => note(t + d, fr, 0.11, 0.07, 'pulse', sortie));
		} else if (type === 'consequence') {
			// Compteur à 0 : note grave qui retombe
			const o = c.createOscillator();
			o.type = 'triangle';
			o.frequency.setValueAtTime(220, t);
			o.frequency.exponentialRampToValueAtTime(70, t + 0.5);
			const g = gain(c, 0);
			g.gain.setValueAtTime(0.2, t);
			g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
			o.connect(g).connect(sortie);
			o.start(t);
			o.stop(t + 0.65);
		} else if (type === 'mail') {
			// Notification de mail : petit arpège montant
			[784, 988, 1319].forEach((fr, i) => note(t + i * 0.08, fr, 0.18, 0.05, 'triangle', sortie));
		} else if (type === 'clic') {
			const s = c.createBufferSource();
			s.buffer = A.blanc;
			const g = gain(c, 0);
			g.gain.setValueAtTime(0.06, t);
			g.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);
			s.connect(filtre(c, 'bandpass', 4200, 3)).connect(g).connect(sortie);
			s.start(t, Math.random() * 0.5, 0.02);
		} else bipOrigine(type);
	};

	global.Audio8 = A;
})(typeof window !== 'undefined' ? window : globalThis);
