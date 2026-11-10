/* Nantes en régulation — confort (prompt 18) : réglages, meilleur bilan, son.
 * Persistance en localStorage (Q19, 09-parametres) — jamais de secret ; tout accès est protégé
 * (navigation privée, stockage bloqué : le jeu fonctionne quand même, sans mémoire).
 * Son (Q11) : synthétisé avec Web Audio (aucun fichier, aucun réseau) — ambiance de salle de contrôle
 * (souffle grave + ronron de ventilation) et bips d'interface. Démarre au premier geste du joueur.
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
		},
		couper: function () {
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

	global.Confort = { Reglages: Reglages, Bilans: Bilans, Son: Son };
})(typeof window !== 'undefined' ? window : globalThis);
