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
	const DEFAUTS = { son: true, horsLigneForce: false, reduireAnimations: false, contrasteRenforce: false, musique: 'chillin', daltonisme: 'normal', tailleTexte: 100, lectureFacile: false, defiChrono: false, micro: true, webcam: false }; // prompt 57 : webcam désactivée par défaut (opt-in) // prompt 48 : accessibilité ; prompt 54 : micro (push-to-talk) // prompt 44 : choix de la musique ; prompt 62 : Chillin' Poupi par défaut
	const Reglages = Object.assign({}, DEFAUTS, lire(CLE_REGLAGES, {}));
	// Prompt 49 : une seule fois, la musique passe au lofi (l'ancien défaut « chillin » n'était pas un choix)
	// Prompt 62 : « Chillin' Poupi » redevient le morceau principal (une seule bascule pour ceux restés sur le lofi par défaut)
	if (!lire('pxe-nte001:jeu:chillin-v62', false)) {
		if (Reglages.musique === 'softly') Reglages.musique = 'chillin';
		ecrire('pxe-nte001:jeu:chillin-v62', true);
		ecrire('pxe-nte001:jeu:lofi-v49', true); // l'ancienne bascule vers le lofi ne doit plus jouer
	}
	Reglages.basculer = function (nom) {
		Reglages[nom] = !Reglages[nom];
		const a_sauver = {};
		Object.keys(DEFAUTS).forEach((k) => (a_sauver[k] = Reglages[k]));
		ecrire(CLE_REGLAGES, a_sauver);
		if (nom === 'son') Reglages.son ? Son.demarrer() : Son.couper();
		return Reglages[nom];
	};
	/** Prompt 44 : réglage à valeur (musique), mémorisé comme les autres */
	Reglages.choisir = function (nom, valeur) {
		Reglages[nom] = valeur;
		const a_sauver = {};
		Object.keys(DEFAUTS).forEach((k) => (a_sauver[k] = Reglages[k]));
		ecrire(CLE_REGLAGES, a_sauver);
	};

	// ——— Meilleur bilan par semaine (Q19) ———
	const Bilans = {
		cle: (etat) => (etat.mode === 'semaine' ? etat.semaine.lundi : etat.mode) + (global.Jeu && global.Jeu.defiChrono ? '|chrono' : ''), // 'direct' | 'hors ligne' ; prompt 87 : palmarès séparé en défi chrono
		meilleur: (cle) => lire(CLE_BILANS, {})[cle] || null,
		/** Enregistre le bilan s'il bat le précédent ; renvoie { meilleur, record } */
		enregistrer: function (cle, score, jauges, extra) {
			const tous = lire(CLE_BILANS, {});
			const ancien = tous[cle] || null;
			const record = !ancien || score > ancien.score;
			if (record) {
				tous[cle] = Object.assign({ score: score, jauges: Object.assign({}, jauges), le: new Date().toISOString().slice(0, 10) }, extra || {}); // prompt 47 : profil
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
				Son.maitre.gain.value = 0.16; // prompt 49 : bruitages, ambiance et radio en retrait (0,5 avant) ; la musique lofi passe par son propre élément audio
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
			// Prompt 44 § 6 : vent (rafales réelles ≥ 50 km/h) et chaleur (≥ 30 °C : stridulations de cigales)
			const vent = Ambiances.bruit(c, 4);
			const fve = c.createBiquadFilter();
			fve.type = 'lowpass';
			fve.frequency.value = 520;
			const gveOnde = c.createGain();
			gveOnde.gain.value = 1;
			const lfoVent = c.createOscillator();
			lfoVent.frequency.value = 0.17;
			const glv = c.createGain();
			glv.gain.value = 0.6;
			lfoVent.connect(glv).connect(gveOnde.gain);
			const gve = c.createGain();
			gve.gain.value = 0;
			vent.connect(fve).connect(gveOnde).connect(gve).connect(Son.maitre);
			const cigale = Ambiances.bruit(c, 2);
			const fc = c.createBiquadFilter();
			fc.type = 'bandpass';
			fc.frequency.value = 5200;
			fc.Q.value = 9;
			const gcOnde = c.createGain();
			gcOnde.gain.value = 0;
			const lfoC = c.createOscillator();
			lfoC.frequency.value = 18;
			const glc = c.createGain();
			glc.gain.value = 1;
			lfoC.connect(glc).connect(gcOnde.gain);
			const gc = c.createGain();
			gc.gain.value = 0;
			cigale.connect(fc).connect(gcOnde).connect(gc).connect(Son.maitre);
			pluie.start();
			ville.start();
			lfo.start();
			vent.start();
			lfoVent.start();
			cigale.start();
			lfoC.start();
			Ambiances.couches = { pluie, ville, lfo, gp, gv, vent, lfoVent, gve, cigale, lfoC, gc };
			Ambiances.appliquer();
			Ambiances.minuterieTram = setInterval(Ambiances.tram, 40000);
			// Prompt 44 § 1 : murmures radio de la salle, au hasard toutes les 20 à 35 s
			Ambiances.minuterieRadio = setInterval(() => {
				if (Ambiances.contexte.actif && Math.random() < 0.5) Son.radio('ambiance', 0.5);
			}, 20000);
		},
		arreter: function () {
			if (Ambiances.minuterieTram) clearInterval(Ambiances.minuterieTram);
			Ambiances.minuterieTram = null;
			if (!Ambiances.couches) return;
			const k = Ambiances.couches;
			if (Ambiances.minuterieRadio) clearInterval(Ambiances.minuterieRadio);
			Ambiances.minuterieRadio = null;
			[k.pluie, k.ville, k.lfo, k.vent, k.lfoVent, k.cigale, k.lfoC].forEach((n) => {
				try {
					n.stop();
				} catch (e) {}
			});
			Ambiances.couches = null;
		},
		/** Contexte réel : { pluie, nuit, actif } — actif = une partie ou la pièce est affichée */
		regler: function (ctx) {
			const a = Ambiances.contexte;
			if (a.pluie === !!ctx.pluie && a.nuit === !!ctx.nuit && a.actif === !!ctx.actif && a.vent === !!ctx.vent && a.chaleur === !!ctx.chaleur) return;
			Ambiances.contexte = { pluie: !!ctx.pluie, nuit: !!ctx.nuit, actif: !!ctx.actif, vent: !!ctx.vent, chaleur: !!ctx.chaleur };
			Ambiances.appliquer();
		},
		appliquer: function () {
			const k = Ambiances.couches;
			if (!k) return;
			const a = Ambiances.contexte;
			const t = Son.ctx.currentTime;
			k.gp.gain.setTargetAtTime(a.actif && a.pluie ? 0.02 : 0, t, 0.33);
			k.gv.gain.setTargetAtTime(a.actif ? (a.nuit ? 0.012 : 0.05) : 0, t, 0.33);
			if (k.gve) k.gve.gain.setTargetAtTime(a.actif && a.vent ? 0.035 : 0, t, 0.33);
			if (k.gc) k.gc.gain.setTargetAtTime(a.actif && a.chaleur && !a.nuit ? 0.006 : 0, t, 0.33);
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

	// =====================================================================
	// Prompt 44 — immersion sonore (tout en WebAudio, sous l'interrupteur Son)
	// =====================================================================
	const cacheBruit = new Map();
	function bruitCourt(c, secondes) {
		const cle = secondes;
		if (cacheBruit.has(cle)) return cacheBruit.get(cle);
		const b = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * secondes)), c.sampleRate);
		const d = b.getChannelData(0);
		for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
		cacheBruit.set(cle, b);
		return b;
	}
	const pret = () => Reglages.son && Son.ctx;
	function ton(f, t0, duree, gain, onde, sortie, f2) {
		const c = Son.ctx;
		const o = c.createOscillator();
		const g = c.createGain();
		o.type = onde || 'sine';
		o.frequency.setValueAtTime(f, t0);
		if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + duree);
		g.gain.setValueAtTime(0.0001, t0);
		g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
		g.gain.exponentialRampToValueAtTime(0.0001, t0 + duree);
		o.connect(g).connect(sortie || Son.maitre);
		o.start(t0);
		o.stop(t0 + duree + 0.03);
	}
	/** 1. Radio de la salle : rafales de bruit en passe-bande modulées (voix radio indistincte), puis bip de fin
	 *  de transmission. Les annonces « liées à une ligne » suivent le rythme du nom de la ligne (une rafale par signe). */
	Son.radio = function (motif, force) {
		if (!pret()) return;
		const c = Son.ctx;
		const syllabes = String(motif || 'xxxx').slice(0, 8);
		const f = c.createBiquadFilter();
		f.type = 'bandpass';
		f.frequency.value = 1700;
		f.Q.value = 1.4;
		const dist = c.createWaveShaper(); // légère distorsion « talkie »
		const courbe = new Float32Array(256);
		for (let i = 0; i < 256; i++) courbe[i] = Math.tanh(((i / 128) - 1) * 3);
		dist.curve = courbe;
		const g = c.createGain();
		g.gain.value = 0.05 * (force || 1);
		f.connect(dist).connect(g).connect(Son.maitre);
		let t0 = c.currentTime + 0.05;
		Array.from(syllabes).forEach((ch) => {
			const s = c.createBufferSource();
			s.buffer = bruitCourt(c, 0.18);
			s.playbackRate.value = 0.7 + (ch.charCodeAt(0) % 7) / 10; // « hauteur » propre à chaque signe
			s.connect(f);
			s.start(t0);
			t0 += 0.16 + (ch.charCodeAt(0) % 3) * 0.05;
		});
		ton(1200, t0 + 0.05, 0.08, 0.05, 'square', Son.maitre); // fin de transmission
		setTimeout(() => g.disconnect(), (t0 - c.currentTime + 0.5) * 1000);
	};
	/** 2. Alerte d'arrivée de dossier, propre à la source ; intensité selon le nombre d'incidents du jour */
	Son.alerteDossier = function (type, intensite) {
		if (!pret()) return;
		const c = Son.ctx;
		const k = Math.min(1.8, 1 + 0.2 * Math.max(0, (intensite || 1) - 1));
		const t0 = c.currentTime;
		if (type === 'ligne en difficulté') {
			// GTFS-RT (retard) : deux tons carrés descendants
			ton(784, t0, 0.12, 0.05 * k, 'square');
			ton(587, t0 + 0.14, 0.18, 0.05 * k, 'square');
		} else if (type === 'alerte météo') {
			// Open-Meteo : sirène douce, sinus qui monte puis redescend
			ton(330, t0, 0.35, 0.09 * k, 'sine', null, 660);
			ton(660, t0 + 0.35, 0.35, 0.09 * k, 'sine', null, 330);
		} else if (type === 'perturbation') {
			[0, 0.12, 0.24].forEach((d) => ton(523, t0 + d, 0.08, 0.06 * k, 'square')); // trois impulsions
		} else {
			[523, 659, 784].forEach((f, i) => ton(f, t0 + i * 0.05, 0.3, 0.05 * k, 'triangle')); // affluence : accord
		}
	};
	/** 3. Tic-tac du compte à rebours (urgence 0 → 1 : plus aigu et plus fort) */
	Son.tic = function (urgence) {
		if (!pret()) return;
		const u = Math.max(0, Math.min(1, urgence || 0));
		ton(900 + u * 700, Son.ctx.currentTime, 0.03, 0.03 + u * 0.1, 'square'); // prompt 53 : plus fort quand l'échéance approche
	};
	/** 4. Clic de console propre à chaque action */
	Son.clicAction = function (action) {
		if (!pret()) return;
		const t0 = Son.ctx.currentTime;
		if (action === 'devier') (ton(500, t0, 0.05, 0.08, 'square'), ton(750, t0 + 0.06, 0.06, 0.08, 'square')); // aiguillage : montant
		else if (action === 'retenir') (ton(180, t0, 0.12, 0.14, 'sine'), ton(2000, t0, 0.02, 0.05, 'square')); // frein : bruit sourd
		else if (action === 'renfort') [660, 880, 1100].forEach((f, i) => ton(f, t0 + i * 0.045, 0.05, 0.07, 'square')); // départ : triple
		else if (action === 'rien') ton(240, t0, 0.09, 0.08, 'triangle'); // clic mat
		else Son.bip('alerte');
	};
	/** 5. Jauges audibles : chute brutale (stinger grave) ou remontée nette (carillon léger) */
	Son.jauges = function (deltas) {
		if (!pret() || !deltas) return;
		const v = Array.isArray(deltas) ? deltas : Object.values(deltas);
		const min = Math.min(...v);
		const somme = v.reduce((a, b) => a + b, 0);
		const t0 = Son.ctx.currentTime + 0.25;
		if (min <= -8) (ton(220, t0, 0.25, 0.1, 'sawtooth', null, 110), ton(165, t0 + 0.05, 0.3, 0.06, 'square', null, 82));
		else if (somme >= 8) [784, 1047].forEach((f, i) => ton(f, t0 + i * 0.09, 0.2, 0.05, 'sine'));
	};
	/** 7. Signature sonore de chaque fin */
	Son.signatureFin = function (type) {
		if (!pret()) return;
		const t0 = Son.ctx.currentTime + 0.2;
		const motifs = {
			bonne: [[523, 0], [659, 0.15], [784, 0.3], [1047, 0.45]], // majeur, montant
			moyenne: [[440, 0], [523, 0.2], [440, 0.4]], // neutre, suspendu
			mauvaise: [[330, 0], [294, 0.25], [247, 0.5], [196, 0.8]], // mineur, descendant
		}[type] || [];
		motifs.forEach(([f, d]) => ton(f, t0 + d, type === 'mauvaise' ? 0.5 : 0.35, 0.09, type === 'bonne' ? 'square' : 'triangle'));
	};

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
	/* Prompt 44 : morceaux ORIGINAUX composés pour le projet (donc libres de droits), style chiptune / pixel,
	   générés en WebAudio : aucun fichier, jouables hors ligne. Chaque piste = tempo, 4 accords, motif d'arpège,
	   ondes, filtre et éventuelle percussion 8 bits (grosse caisse sinus, charleston en bruit). */
	const PISTES = {
		// Prompt 49 : lo-fi CC0 (Loyalty Freak Music, Wikimedia Commons), en fond — voir audio/CREDITS.md
		softly: { fichier: 'audio/lofi-softly', volume: 0.32 },
		work: { fichier: 'audio/lofi-work', volume: 0.3 },
		standing: { fichier: 'audio/lofi-standing', volume: 0.3 },
		// Vrais morceaux libres de droits, CC0 (Komiku, via Wikimedia Commons) : voir audio/CREDITS.md
		chillin: { fichier: 'audio/chillin-poupi', volume: 0.3 },
		horizon: { fichier: 'audio/travel-to-the-horizon', volume: 0.26 },
		coquillage: { fichier: 'audio/night-in-a-seashell', volume: 0.3 },
		// Morceaux composés en code (prompt 44)
		origine: { bpm: 72, accords: ACCORDS, motif: MOTIF, onde: 'triangle', basse: 'sine', filtre: 1400, gain: 0.5, percu: false },
		pixel: {
			bpm: 112,
			accords: [[261.63, 329.63, 392.0, 523.25], [220.0, 261.63, 329.63, 440.0], [174.61, 220.0, 261.63, 349.23], [196.0, 246.94, 293.66, 392.0]], // C Am F G
			motif: [0, 2, 1, 3, 2, 1, 3, 2],
			onde: 'square', basse: 'triangle', filtre: 2600, gain: 0.32, percu: true,
		},
		loire: {
			bpm: 84,
			accords: [[146.83, 174.61, 220.0, 261.63], [116.54, 146.83, 174.61, 220.0], [174.61, 220.0, 261.63, 329.63], [130.81, 164.81, 196.0, 246.94]], // Dm7 Bbmaj7 F Cmaj7
			motif: [0, 1, 2, 3, 3, 2, 1, 2],
			onde: 'triangle', basse: 'triangle', filtre: 1800, gain: 0.45, percu: false,
		},
		regulation: {
			bpm: 128,
			accords: [[164.81, 196.0, 246.94, 329.63], [130.81, 164.81, 196.0, 261.63], [196.0, 246.94, 293.66, 392.0], [146.83, 185.0, 220.0, 293.66]], // Em C G D
			motif: [0, 0, 2, 1, 3, 1, 2, 1],
			onde: 'square', basse: 'square', filtre: 2200, gain: 0.26, percu: true,
		},
	};
	const piste = () => PISTES[(typeof Musique !== 'undefined' && Musique.humeurActive) || Reglages.musique] || PISTES.origine; // prompt 88 : humeur temporaire (crise)
	const Musique = {
		bus: null,
		minuterie: null,
		pas: 0,
		prochaine: 0,
		volume: 0.15, // prompt 49 : compense le gain maître abaissé (morceaux composés en code, même niveau qu'avant)
		croche: 60 / 72 / 2,
		demarrer: function () {
			if (Musique.minuterie || !Son.ctx || !Reglages.son) return;
			if (piste().fichier) return Musique.demarrerFichier(piste());
			const c = Son.ctx;
			Musique.bus = c.createGain();
			Musique.bus.gain.setValueAtTime(0.0001, c.currentTime);
			Musique.bus.gain.exponentialRampToValueAtTime(Musique.volume, c.currentTime + 2); // entrée en fondu
			const filtre = c.createBiquadFilter();
			filtre.type = 'lowpass';
			filtre.frequency.value = piste().filtre;
			Musique.bus.connect(filtre).connect(Son.maitre);
			Musique.croche = 60 / piste().bpm / 2;
			Musique.pas = 0;
			Musique.prochaine = c.currentTime + 0.1;
			Musique.minuterie = setInterval(Musique.programmer, 100);
		},
		/** Prompt 69 : le soir, la musique baisse (pas d'humeur « soirée » parmi les morceaux) */
		facteur: 1,
		attenuer: function (f) {
			Musique.facteur = f;
			const a = Musique.audio;
			const p = piste();
			if (a && Musique.minuterie === 'fichier' && p && p.volume) a.volume = p.volume * f;
			if (Musique.bus && Son.ctx) Musique.bus.gain.setTargetAtTime(Math.max(0.0001, Musique.volume * f), Son.ctx.currentTime, 0.33);
		},
		/** Morceau CC0 : élément audio en boucle (OGG, ou MP3 si le navigateur ne lit pas l'OGG), fondu d'entrée 2 s */
		audio: null,
		demarrerFichier: function (p) {
			const a = new Audio();
			const ogg = a.canPlayType('audio/ogg; codecs="vorbis"');
			a.src = p.fichier + (ogg ? '.ogg' : '.mp3');
			a.loop = true;
			a.volume = 0;
			a.play().catch(() => {}); // lecture refusée (autoplay) : le prochain geste relancera Son.demarrer
			Musique.audio = a;
			let k = 0;
			Musique.minuterie = setInterval(() => {
				k = Math.min(1, k + 0.05);
				if (Musique.audio === a) a.volume = p.volume * k * Musique.facteur;
				if (k >= 1) {
					clearInterval(Musique.minuterie);
					Musique.minuterie = 'fichier'; // marqueur « en cours de lecture »
				}
			}, 100);
		},
		arreter: function () {
			if (Musique.audio) {
				const a = Musique.audio;
				Musique.audio = null;
				const pas = setInterval(() => {
					a.volume = Math.max(0, a.volume - 0.05);
					if (a.volume <= 0) (clearInterval(pas), a.pause());
				}, 30);
			}
			if (Musique.minuterie && Musique.minuterie !== 'fichier') clearInterval(Musique.minuterie);
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
		/** Batterie 8 bits : grosse caisse (sinus qui chute) sur les temps forts, charleston (bruit) sur les contretemps */
		percussion: function (temps, t0) {
			const c = Son.ctx;
			if (temps % 4 === 0) {
				const o = c.createOscillator();
				const g = c.createGain();
				o.frequency.setValueAtTime(140, t0);
				o.frequency.exponentialRampToValueAtTime(45, t0 + 0.12);
				g.gain.setValueAtTime(0.7, t0);
				g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
				o.connect(g).connect(Musique.bus);
				o.start(t0);
				o.stop(t0 + 0.16);
			}
			if (temps % 2 === 1) {
				const s = c.createBufferSource();
				s.buffer = bruitCourt(c, 0.04);
				const f = c.createBiquadFilter();
				f.type = 'highpass';
				f.frequency.value = 6000;
				const g = c.createGain();
				g.gain.value = 0.18;
				s.connect(f).connect(g).connect(Musique.bus);
				s.start(t0);
			}
		},
		/** Prompt 88 : humeur temporaire (cellule de crise, journée tempête) sans toucher au morceau choisi ; null = retour au choix */
		humeurActive: null,
		humeur: function (nom) {
			const n = nom && PISTES[nom] ? nom : null;
			if (n === Musique.humeurActive) return;
			Musique.humeurActive = n;
			if (Musique.minuterie) {
				Musique.arreter();
				setTimeout(() => Musique.demarrer(), 250);
			}
		},
		/** Change de morceau (mémorisé) et relance la lecture */
		changer: function (nom) {
			Reglages.choisir('musique', PISTES[nom] ? nom : 'origine');
			if (Musique.minuterie) {
				Musique.arreter();
				setTimeout(() => Musique.demarrer(), 250);
			}
		},
		pistes: () => Object.keys(PISTES),
		programmer: function () {
			const c = Son.ctx;
			if (!c || !Musique.bus) return;
			if (Musique.prochaine < c.currentTime) Musique.prochaine = c.currentTime + 0.05; // onglet en arrière-plan
			while (Musique.prochaine < c.currentTime + 0.3) {
				const p = piste();
				const mesure = Math.floor(Musique.pas / p.motif.length) % p.accords.length;
				const temps = Musique.pas % p.motif.length;
				const accord = p.accords[mesure];
				Musique.note(accord[p.motif[temps]] * 2, Musique.prochaine, Musique.croche * (p.percu ? 0.9 : 1.8), p.gain, p.onde);
				if (temps === 0) Musique.note(accord[0] / 2, Musique.prochaine, Musique.croche * (p.percu ? 3.5 : p.motif.length), 0.6, p.basse); // basse
				if (p.percu && temps === 4) Musique.note(accord[0] / 2, Musique.prochaine, Musique.croche * 3.5, 0.5, p.basse);
				if (p.percu) Musique.percussion(temps, Musique.prochaine);
				Musique.prochaine += Musique.croche;
				Musique.pas++;
			}
		},
	};
	Son.musique = Musique;

	global.Confort = { Reglages: Reglages, Bilans: Bilans, Son: Son };
})(typeof window !== 'undefined' ? window : globalThis);
