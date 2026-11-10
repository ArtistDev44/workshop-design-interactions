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
		},
		couper: function () {
			Musique.arreter();
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
		/** Bip d'interface : 'action' | 'dossier' | 'alerte' | 'choix' | 'fin' */
		bip: function (type) {
			if (!Reglages.son || !Son.ctx) return;
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
