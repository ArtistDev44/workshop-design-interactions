/* Nantes en régulation — confort (prompt 18) : réglages, meilleur bilan, son.
 * Persistance en localStorage (Q19, 09-parametres) — jamais de secret ; tout accès est protégé
 * (navigation privée, stockage bloqué : le jeu fonctionne quand même, sans mémoire).
 * Son (Q11) : synthétisé avec Web Audio (aucun fichier, aucun réseau) — ambiance de salle de contrôle
 * (souffle grave + ronron de ventilation) et bips d'interface. Démarre au premier geste du joueur.
 * Prompt 27 : musique de fond générée (arpèges lents, boucle de 4 accords), même interrupteur Son (M).
 */
(function (global) {
	'use strict';

	const CLE_REGLAGES = 'pxe-nte001:jeu:reglages';
	const CLE_BILANS = 'pxe-nte001:jeu:meilleurs-bilans';

	const lire = (cle, defaut) => {
		try {
			const v = JSON.parse(localStorage.getItem(cle) || 'null');
			return v === null ? defaut : v;
		} catch (e) {
			return defaut;
		}
	};
	const ecrire = (cle, v) => {
		try {
			localStorage.setItem(cle, JSON.stringify(v));
			return true;
		} catch (e) {
			return false;
		}
	};

	// ——— Réglages (écran Paramètres, 11-direction-artistique) ———
	const DEFAUTS = { son: true, horsLigneForce: false, reduireAnimations: false, contrasteRenforce: false };
	const Reglages = Object.assign({}, DEFAUTS, lire(CLE_REGLAGES, {}));
	Reglages.basculer = function (nom) {
		Reglages[nom] = !Reglages[nom];
		const a_sauver = {};
		Object.keys(DEFAUTS).forEach((k) => (a_sauver[k] = Reglages[k]));
		ecrire(CLE_REGLAGES, a_sauver);
		if (nom === 'son') Reglages.son ? Son.demarrer() : Son.couper();
		return Reglages[nom];
	};

	// ——— Meilleur bilan par semaine (Q19) ———
	const Bilans = {
		cle: (etat) => (etat.mode === 'semaine' ? etat.semaine.lundi : etat.mode), // 'direct' | 'hors ligne'
		meilleur: (cle) => lire(CLE_BILANS, {})[cle] || null,
		/** Enregistre le bilan s'il bat le précédent ; renvoie { meilleur, record } */
		enregistrer: function (cle, score, jauges) {
			const tous = lire(CLE_BILANS, {});
			const ancien = tous[cle] || null;
			const record = !ancien || score > ancien.score;
			if (record) {
				tous[cle] = { score: score, jauges: Object.assign({}, jauges), le: new Date().toISOString().slice(0, 10) };
				ecrire(CLE_BILANS, tous);
			}
			return { meilleur: tous[cle] || ancien, record: record, ancien: ancien };
		},
	};

	// ——— Son synthétisé ———
	const Son = {
		ctx: null,
		maitre: null,
		ambiance: null,
		demarrer: function () {
			if (!Reglages.son) return;
			const AC = global.AudioContext || global.webkitAudioContext;
			if (!AC) return;
			if (!Son.ctx) {
				Son.ctx = new AC();
				Son.maitre = Son.ctx.createGain();
				Son.maitre.gain.value = 0.5;
				Son.maitre.connect(Son.ctx.destination);
			}
			if (Son.ctx.state === 'suspended') Son.ctx.resume();
			if (!Son.ambiance) Son.ambiance = Son.creerAmbiance();
			Musique.demarrer();
			Ambiances.demarrer();
		},
		couper: function () {
			Musique.arreter();
			Ambiances.arreter();
			if (Son.ambiance) {
				Son.ambiance.forEach((n) => {
					try {
						n.stop();
					} catch (e) {}
				});
				Son.ambiance = null;
			}
		},
		creerAmbiance: function () {
			const c = Son.ctx;
			// Souffle : bruit blanc filtré très bas, volume faible
			const duree = 2;
			const tampon = c.createBuffer(1, c.sampleRate * duree, c.sampleRate);
			const d = tampon.getChannelData(0);
			for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
			const bruit = c.createBufferSource();
			bruit.buffer = tampon;
			bruit.loop = true;
			const filtre = c.createBiquadFilter();
			filtre.type = 'lowpass';
			filtre.frequency.value = 320;
			const gBruit = c.createGain();
			gBruit.gain.value = 0.05;
			bruit.connect(filtre).connect(gBruit).connect(Son.maitre);
			// Ronron de ventilation : deux sinus graves légèrement désaccordés
			const o1 = c.createOscillator();
			const o2 = c.createOscillator();
			o1.frequency.value = 55;
			o2.frequency.value = 55.7;
			const gO = c.createGain();
			gO.gain.value = 0.025;
			o1.connect(gO);
			o2.connect(gO);
			gO.connect(Son.maitre);
			bruit.start();
			o1.start();
			o2.start();
			return [bruit, o1, o2];
		},
		/** Bip d'interface : 'action' | 'dossier' | 'alerte' | 'choix' | 'fin'
		 *  Prompt 30 : 'incident' | 'consequence' | 'mail' (signaux d'événements, timbres distincts, < 1 s) */
		bip: function (type) {
			if (!Reglages.son || !Son.ctx) return;
			if (SIGNAUX[type]) return Son.signal(SIGNAUX[type]);
			const notes = { action: [660], dossier: [520, 780], alerte: [880, 880], choix: [440], fin: [523, 659, 784] }[type] || [600];
			const c = Son.ctx;
			notes.forEach((f, i) => {
				const o = c.createOscillator();
				const g = c.createGain();
				o.type = 'sine';
				o.frequency.value = f;
				const t0 = c.currentTime + i * 0.11;
				g.gain.setValueAtTime(0.0001, t0);
				g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.01);
				g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
				o.connect(g).connect(Son.maitre);
				o.start(t0);
				o.stop(t0 + 0.1);
			});
		},
	};

	// ——— Prompt 30 : signaux d'événements (courts, non agressifs, timbres distincts des bips) ———
	// notes : [fréquence Hz, départ s, durée s] ; volume crête faible ; onde propre à chaque signal.
	const SIGNAUX = {
		incident: { onde: 'square', crete: 0.05, filtre: 1800, notes: [[784, 0, 0.12], [587, 0.14, 0.18]] }, // deux tons descendants
		consequence: { onde: 'sawtooth', crete: 0.045, filtre: 900, notes: [[330, 0, 0.18], [247, 0.2, 0.18], [196, 0.4, 0.3]] }, // compteur à 0
		mail: { onde: 'sine', crete: 0.1, filtre: 4000, notes: [[1047, 0, 0.16], [1319, 0.12, 0.16], [1568, 0.24, 0.3]] }, // carillon de notification
	};
	Son.signal = function (s) {
		const c = Son.ctx;
		const f = c.createBiquadFilter();
		f.type = 'lowpass';
		f.frequency.value = s.filtre;
		f.connect(Son.maitre);
		s.notes.forEach(([freq, depart, duree]) => {
			const o = c.createOscillator();
			const g = c.createGain();
			o.type = s.onde;
			o.frequency.value = freq;
			const t0 = c.currentTime + depart;
			g.gain.setValueAtTime(0.0001, t0);
			g.gain.exponentialRampToValueAtTime(s.crete, t0 + 0.015);
			g.gain.exponentialRampToValueAtTime(0.0001, t0 + duree);
			o.connect(g).connect(f);
			o.start(t0);
			o.stop(t0 + duree + 0.05);
		});
		setTimeout(() => f.disconnect(), 1200);
	};
	/** Clic très discret (interactions au poste) : 12 ms de bruit filtré */
	Son.clic = function () {
		if (!Reglages.son || !Son.ctx) return;
		const c = Son.ctx;
		const n = Math.floor(c.sampleRate * 0.012);
		const b = c.createBuffer(1, n, c.sampleRate);
		const d = b.getChannelData(0);
		for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
		const src = c.createBufferSource();
		src.buffer = b;
		const f = c.createBiquadFilter();
		f.type = 'bandpass';
		f.frequency.value = 2500;
		const g = c.createGain();
		g.gain.value = 0.12;
		src.connect(f).connect(g).connect(Son.maitre);
		src.start();
	};

	// ——— Prompt 30 : ambiances contextuelles (boucles continues, très faibles) ———
	// pluie : bruit blanc en passe-bande 1,2–5 kHz avec lente ondulation ; ville : grondement grave
	// (bruit passe-bas 160 Hz) + passage d'un tram au loin toutes les ~40 s ; nuit : la ville s'efface.
	// Chaque couche suit une cible de volume avec setTargetAtTime (constante 0,33 s ≈ fondu de 1 s).
	const Ambiances = {
		couches: null,
		contexte: { pluie: false, nuit: false, actif: false },
		minuterieTram: null,
		bruit: function (c, secondes) {
			const b = c.createBuffer(1, c.sampleRate * secondes, c.sampleRate);
			const d = b.getChannelData(0);
			for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
			const s = c.createBufferSource();
			s.buffer = b;
			s.loop = true;
			return s;
		},
		demarrer: function () {
			if (Ambiances.couches || !Son.ctx || !Reglages.son) return;
			const c = Son.ctx;
			const pluie = Ambiances.bruit(c, 3);
			const fp = c.createBiquadFilter();
			fp.type = 'bandpass';
			fp.frequency.value = 2600;
			fp.Q.value = 0.6;
			const gp = c.createGain();
			gp.gain.value = 0;
			const lfo = c.createOscillator(); // ondulation lente de l'averse
			lfo.frequency.value = 0.13;
			const gOnde = c.createGain(); // étage d'ondulation (1 ± 0,3), avant le volume cible : à 0, silence total
			gOnde.gain.value = 1;
			const glfo = c.createGain();
			glfo.gain.value = 0.3;
			lfo.connect(glfo).connect(gOnde.gain);
			pluie.connect(fp).connect(gOnde).connect(gp).connect(Son.maitre);
			const ville = Ambiances.bruit(c, 4);
			const fv = c.createBiquadFilter();
			fv.type = 'lowpass';
			fv.frequency.value = 160;
			const gv = c.createGain();
			gv.gain.value = 0;
			ville.connect(fv).connect(gv).connect(Son.maitre);
			pluie.start();
			ville.start();
			lfo.start();
			Ambiances.couches = { pluie, ville, lfo, gp, gv };
			Ambiances.appliquer();
			Ambiances.minuterieTram = setInterval(Ambiances.tram, 40000);
		},
		arreter: function () {
			if (Ambiances.minuterieTram) clearInterval(Ambiances.minuterieTram);
			Ambiances.minuterieTram = null;
			if (!Ambiances.couches) return;
			const k = Ambiances.couches;
			[k.pluie, k.ville, k.lfo].forEach((n) => {
				try {
					n.stop();
				} catch (e) {}
			});
			Ambiances.couches = null;
		},
		/** Contexte réel : { pluie, nuit, actif } — actif = une partie ou la pièce est affichée */
		regler: function (ctx) {
			const a = Ambiances.contexte;
			if (a.pluie === !!ctx.pluie && a.nuit === !!ctx.nuit && a.actif === !!ctx.actif) return;
			Ambiances.contexte = { pluie: !!ctx.pluie, nuit: !!ctx.nuit, actif: !!ctx.actif };
			Ambiances.appliquer();
		},
		appliquer: function () {
			const k = Ambiances.couches;
			if (!k) return;
			const a = Ambiances.contexte;
			const t = Son.ctx.currentTime;
			k.gp.gain.setTargetAtTime(a.actif && a.pluie ? 0.02 : 0, t, 0.33);
			k.gv.gain.setTargetAtTime(a.actif ? (a.nuit ? 0.012 : 0.05) : 0, t, 0.33);
		},
		/** Tram au loin : glissando grave filtré de 3 s, seulement en journée */
		tram: function () {
			const a = Ambiances.contexte;
			if (!Son.ctx || !Ambiances.couches || !a.actif || a.nuit) return;
			const c = Son.ctx;
			const o = c.createOscillator();
			o.type = 'sawtooth';
			const f = c.createBiquadFilter();
			f.type = 'lowpass';
			f.frequency.value = 380;
			const g = c.createGain();
			const t0 = c.currentTime;
			o.frequency.setValueAtTime(70, t0);
			o.frequency.linearRampToValueAtTime(110, t0 + 1.5);
			o.frequency.linearRampToValueAtTime(80, t0 + 3);
			g.gain.setValueAtTime(0.0001, t0);
			g.gain.exponentialRampToValueAtTime(0.012, t0 + 1.2);
			g.gain.exponentialRampToValueAtTime(0.0001, t0 + 3);
			o.connect(f).connect(g).connect(Son.maitre);
			o.start(t0);
			o.stop(t0 + 3.1);
		},
	};
	Son.ambiances = Ambiances;

	// ——— Musique de fond (prompt 27) : 100 % WebAudio, aucun fichier ———
	// Boucle de 4 accords (la mineur 7, fa majeur 7, do majeur, sol majeur), arpège montant-descendant
	// en croches à 72 BPM, onde triangle adoucie par un passe-bas, plus une basse tenue par accord.
	// Ordonnanceur « lookahead » : un setInterval de 100 ms programme les notes des 300 ms suivantes.
	const ACCORDS = [
		[220.0, 261.63, 329.63, 392.0], // Am7
		[174.61, 220.0, 261.63, 329.63], // Fmaj7
		[130.81, 196.0, 261.63, 329.63], // C
		[196.0, 246.94, 293.66, 392.0], // G
	];
	const MOTIF = [0, 1, 2, 3, 2, 1, 2, 1]; // 8 croches par mesure
	const Musique = {
		bus: null,
		minuterie: null,
		pas: 0,
		prochaine: 0,
		volume: 0.05,
		croche: 60 / 72 / 2,
		demarrer: function () {
			if (Musique.minuterie || !Son.ctx || !Reglages.son) return;
			const c = Son.ctx;
			Musique.bus = c.createGain();
			Musique.bus.gain.setValueAtTime(0.0001, c.currentTime);
			Musique.bus.gain.exponentialRampToValueAtTime(Musique.volume, c.currentTime + 2); // entrée en fondu
			const filtre = c.createBiquadFilter();
			filtre.type = 'lowpass';
			filtre.frequency.value = 1400;
			Musique.bus.connect(filtre).connect(Son.maitre);
			Musique.prochaine = c.currentTime + 0.1;
			Musique.minuterie = setInterval(Musique.programmer, 100);
		},
		arreter: function () {
			if (Musique.minuterie) clearInterval(Musique.minuterie);
			Musique.minuterie = null;
			if (Musique.bus && Son.ctx) {
				const b = Musique.bus;
				b.gain.cancelScheduledValues(Son.ctx.currentTime);
				b.gain.setValueAtTime(b.gain.value, Son.ctx.currentTime);
				b.gain.linearRampToValueAtTime(0, Son.ctx.currentTime + 0.2);
				setTimeout(() => b.disconnect(), 400);
			}
			Musique.bus = null;
		},
		note: function (f, t0, duree, gain, type) {
			const c = Son.ctx;
			const o = c.createOscillator();
			const g = c.createGain();
			o.type = type || 'triangle';
			o.frequency.value = f;
			g.gain.setValueAtTime(0.0001, t0);
			g.gain.exponentialRampToValueAtTime(gain, t0 + 0.03);
			g.gain.exponentialRampToValueAtTime(0.0001, t0 + duree);
			o.connect(g).connect(Musique.bus);
			o.start(t0);
			o.stop(t0 + duree + 0.05);
		},
		programmer: function () {
			const c = Son.ctx;
			if (!c || !Musique.bus) return;
			if (Musique.prochaine < c.currentTime) Musique.prochaine = c.currentTime + 0.05; // onglet en arrière-plan
			while (Musique.prochaine < c.currentTime + 0.3) {
				const mesure = Math.floor(Musique.pas / MOTIF.length) % ACCORDS.length;
				const temps = Musique.pas % MOTIF.length;
				const accord = ACCORDS[mesure];
				Musique.note(accord[MOTIF[temps]] * 2, Musique.prochaine, Musique.croche * 1.8, 0.5);
				if (temps === 0) Musique.note(accord[0] / 2, Musique.prochaine, Musique.croche * MOTIF.length, 0.6, 'sine'); // basse tenue
				Musique.prochaine += Musique.croche;
				Musique.pas++;
			}
		},
	};
	Son.musique = Musique;

	global.Confort = { Reglages: Reglages, Bilans: Bilans, Son: Son };
})(typeof window !== 'undefined' ? window : globalThis);
