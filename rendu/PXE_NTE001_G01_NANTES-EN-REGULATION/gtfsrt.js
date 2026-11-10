/* Nantes en régulation — décodeur GTFS-RT minimal (prompt 15, mode « aujourd'hui »).
 * Lit le protobuf des flux Naolib sans aucune dépendance, et ne garde que les champs utiles :
 *   trip-updates → ligne (route_id), arrêt (stop_id), retard (delay, en secondes)
 *   alerts       → lignes concernées, texte d'en-tête et de description
 * Référence des numéros de champs : https://gtfs.org/realtime/reference/
 * Script classique (sans import/export) : utilisable par <script> dans le jeu et par Node pour les tests.
 */
(function (global) {
	'use strict';

	const FLUX = {
		tripUpdates: 'https://api.okina.fr/gateway/semgtfsrt/realtime/trip-updates/NAOLIBORG',
		alerts: 'https://api.okina.fr/gateway/semgtfsrt/realtime/alerts/NAOLIBORG',
	};

	// ——— Lecture protobuf bas niveau ———
	function Lecteur(octets) {
		this.b = octets;
		this.p = 0;
	}
	Lecteur.prototype.fini = function (fin) {
		return this.p >= fin;
	};
	// Varint en BigInt (sûr jusqu'à 64 bits, y compris les int32 négatifs codés sur 10 octets)
	Lecteur.prototype.varint = function () {
		let resultat = 0n;
		let decalage = 0n;
		for (;;) {
			if (this.p >= this.b.length) throw new Error('varint tronqué');
			const octet = this.b[this.p++];
			resultat |= BigInt(octet & 0x7f) << decalage;
			if ((octet & 0x80) === 0) return resultat;
			decalage += 7n;
			if (decalage > 70n) throw new Error('varint trop long');
		}
	};
	Lecteur.prototype.int32 = function () {
		return Number(BigInt.asIntN(32, this.varint()));
	};
	Lecteur.prototype.longueur = function () {
		return Number(this.varint());
	};
	Lecteur.prototype.chaine = function () {
		const n = this.longueur();
		const s = new TextDecoder().decode(this.b.subarray(this.p, this.p + n));
		this.p += n;
		return s;
	};
	Lecteur.prototype.sauter = function (type) {
		if (type === 0) this.varint();
		else if (type === 1) this.p += 8;
		else if (type === 2) {
			const n = this.longueur(); // lire la longueur AVANT d'avancer (sinon décalage d'un octet)
			this.p += n;
		}
		else if (type === 5) this.p += 4;
		else throw new Error('type de champ inconnu : ' + type);
	};
	// Parcourt les champs d'un message (de la position courante jusqu'à `fin`)
	Lecteur.prototype.champs = function (fin, rappel) {
		while (!this.fini(fin)) {
			const cle = Number(this.varint());
			const numero = cle >>> 3;
			const type = cle & 7;
			const avant = this.p;
			const lu = rappel(numero, type);
			if (!lu) {
				this.p = avant;
				this.sauter(type);
			}
		}
	};
	Lecteur.prototype.sousMessage = function (rappel) {
		const n = this.longueur();
		const fin = this.p + n;
		this.champs(fin, rappel);
		this.p = fin;
	};

	// ——— Messages GTFS-RT utiles ———
	function lireTraduction(L) {
		// TranslatedString { repeated Translation translation = 1 } ; Translation { text = 1, language = 2 }
		const textes = [];
		L.sousMessage(function (n, t) {
			if (n === 1 && t === 2) {
				let texte = '';
				let langue = '';
				L.sousMessage(function (n2, t2) {
					if (n2 === 1 && t2 === 2) return (texte = L.chaine()), true;
					if (n2 === 2 && t2 === 2) return (langue = L.chaine()), true;
					return false;
				});
				textes.push({ texte: texte, langue: langue });
				return true;
			}
			return false;
		});
		const fr = textes.find(function (x) {
			return /^fr/i.test(x.langue);
		});
		return (fr || textes[0] || { texte: '' }).texte;
	}

	function lireTripUpdate(L) {
		const tu = { ligne: null, trajet: null, retard: null, arrets: [] };
		L.sousMessage(function (n, t) {
			if (n === 1 && t === 2) {
				// TripDescriptor { trip_id = 1, route_id = 5 }
				L.sousMessage(function (n2, t2) {
					if (n2 === 1 && t2 === 2) return (tu.trajet = L.chaine()), true;
					if (n2 === 5 && t2 === 2) return (tu.ligne = L.chaine()), true;
					return false;
				});
				return true;
			}
			if (n === 2 && t === 2) {
				// StopTimeUpdate { arrival = 2, departure = 3, stop_id = 4 } ; StopTimeEvent { delay = 1 }
				const arret = { arret: null, retard: null };
				L.sousMessage(function (n2, t2) {
					if ((n2 === 2 || n2 === 3) && t2 === 2) {
						L.sousMessage(function (n3, t3) {
							if (n3 === 1 && t3 === 0) {
								const d = L.int32();
								if (arret.retard === null || n2 === 2) arret.retard = d;
								return true;
							}
							return false;
						});
						return true;
					}
					if (n2 === 4 && t2 === 2) return (arret.arret = L.chaine()), true;
					return false;
				});
				tu.arrets.push(arret);
				return true;
			}
			if (n === 5 && t === 0) return (tu.retard = L.int32()), true;
			return false;
		});
		return tu;
	}

	function lireAlerte(L) {
		const a = { lignes: [], titre: '', description: '' };
		L.sousMessage(function (n, t) {
			if (n === 5 && t === 2) {
				// EntitySelector { route_id = 2 }
				L.sousMessage(function (n2, t2) {
					if (n2 === 2 && t2 === 2) return a.lignes.push(L.chaine()), true;
					return false;
				});
				return true;
			}
			if (n === 10 && t === 2) return (a.titre = lireTraduction(L)), true;
			if (n === 11 && t === 2) return (a.description = lireTraduction(L)), true;
			return false;
		});
		return a;
	}

	/** Décode un FeedMessage. @param {ArrayBuffer|Uint8Array} donnees */
	function decoder(donnees) {
		const octets = donnees instanceof Uint8Array ? donnees : new Uint8Array(donnees);
		const L = new Lecteur(octets);
		const flux = { horodatage: null, tripUpdates: [], alertes: [] };
		L.champs(octets.length, function (n, t) {
			if (n === 1 && t === 2) {
				// FeedHeader { timestamp = 3 }
				L.sousMessage(function (n2, t2) {
					if (n2 === 3 && t2 === 0) return (flux.horodatage = Number(L.varint())), true;
					return false;
				});
				return true;
			}
			if (n === 2 && t === 2) {
				// FeedEntity { trip_update = 3, alert = 5 }
				L.sousMessage(function (n2, t2) {
					if (n2 === 3 && t2 === 2) return flux.tripUpdates.push(lireTripUpdate(L)), true;
					if (n2 === 5 && t2 === 2) return flux.alertes.push(lireAlerte(L)), true;
					return false;
				});
				return true;
			}
			return false;
		});
		return flux;
	}

	/**
	 * Retards réels ≥ seuil (minutes), un par ligne : le plus fort retard observé sur la ligne.
	 * Retour : [{ ligne, retardMin, arret, trajet }]
	 */
	function retardsParLigne(flux, seuilMin) {
		const seuil = (seuilMin || 10) * 60;
		const parLigne = new Map();
		flux.tripUpdates.forEach(function (tu) {
			const candidats = tu.arrets.map(function (a) {
				return { retard: a.retard, arret: a.arret };
			});
			if (tu.retard !== null) candidats.push({ retard: tu.retard, arret: null });
			candidats.forEach(function (c) {
				if (c.retard === null || c.retard < seuil || !tu.ligne) return;
				const actuel = parLigne.get(tu.ligne);
				if (!actuel || c.retard > actuel.retardS) {
					parLigne.set(tu.ligne, { ligne: tu.ligne, retardS: c.retard, arret: c.arret, trajet: tu.trajet });
				}
			});
		});
		return Array.from(parLigne.values())
			.sort(function (a, b) {
				return b.retardS - a.retardS;
			})
			.map(function (x) {
				return { ligne: x.ligne, retardMin: Math.round(x.retardS / 60), arret: x.arret, trajet: x.trajet };
			});
	}

	/** Télécharge et décode un flux, avec délai maximal. Rejette en cas d'échec. */
	function charger(url, delaiMs) {
		const ctrl = new AbortController();
		const minuterie = setTimeout(function () {
			ctrl.abort();
		}, delaiMs || 8000);
		return fetch(url, { signal: ctrl.signal })
			.then(function (r) {
				if (!r.ok) throw new Error('HTTP ' + r.status);
				return r.arrayBuffer();
			})
			.then(decoder)
			.finally(function () {
				clearTimeout(minuterie);
			});
	}

	global.PXE_GTFSRT = { FLUX: FLUX, decoder: decoder, retardsParLigne: retardsParLigne, charger: charger };
})(typeof window !== 'undefined' ? window : globalThis);
