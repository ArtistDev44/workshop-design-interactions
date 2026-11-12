/* Nantes en régulation — sauvegarde de la progression (prompt 33).
 * Une sauvegarde par semaine dans localStorage (clé pxe-nte001-partie-<semaine>), automatique ;
 * reprise depuis l'accueil ; export (fichier JSON via Blob local, presse-papiers) et import (fichier ou
 * texte collé) depuis les Paramètres, avec validation stricte (JSON.parse en try/catch, jamais d'eval).
 * Rien d'autre que l'état du jeu n'est stocké : aucune donnée personnelle, aucun réseau.
 * Les autres clés (meilleurs bilans, réglages, langue, lampe) ne sont jamais touchées.
 */
const Sauvegarde = (function () {
	'use strict';

	const PREFIXE = 'pxe-nte001-partie-';
	const VERSION = 1;
	const JEU = 'PXE-NTE001-G01-W01';
	const PHASES_COMPTEUR = ['decision', 'contradiction', 'conflit'];
	let indisponibleSignale = false;
	let derniere = null; // Date de la dernière sauvegarde automatique (indicateur)
	let derniereJeu = null; // prompt 95 : { minutes, jour } du jeu au moment de la sauvegarde

	// ——— Encodage des textes différés (Texte, ListeTextes) : ils restent traduisibles après reprise ———
	function encoder(v, pile) {
		pile = pile || [];
		if (v === null || v === undefined) return v === undefined ? undefined : null;
		if (typeof v === 'number') return Number.isFinite(v) ? v : null;
		if (typeof v !== 'object') return typeof v === 'function' ? undefined : v;
		if (pile.includes(v)) return null; // pas de cycle
		pile.push(v);
		let r;
		if (typeof Texte !== 'undefined' && v instanceof Texte) r = { __t: v.cle, v: encoder(v.v, pile) };
		else if (typeof ListeTextes !== 'undefined' && v instanceof ListeTextes) r = { __l: encoder(v.items, pile), sep: v.sep, maj: !!v.majuscule };
		else if (Array.isArray(v)) r = v.map((x) => encoder(x, pile));
		else if (Object.prototype.hasOwnProperty.call(v, 'toString') && typeof v.toString === 'function') r = String(v); // objet « texte » ad hoc
		else {
			r = {};
			Object.keys(v).forEach((k) => {
				const e = encoder(v[k], pile);
				if (e !== undefined) r[k] = e;
			});
		}
		pile.pop();
		return r;
	}
	function decoder(v) {
		if (Array.isArray(v)) return v.map(decoder);
		if (!v || typeof v !== 'object') return v;
		if (typeof v.__t === 'string') return new Texte(v.__t, decoder(v.v));
		if (Array.isArray(v.__l)) return new ListeTextes(decoder(v.__l), v.sep, v.maj);
		const r = {};
		Object.keys(v).forEach((k) => (r[k] = decoder(v[k])));
		return r;
	}

	// ——— localStorage protégé ———
	function signalerIndisponible() {
		if (indisponibleSignale) return;
		indisponibleSignale = true;
		toast(t('sauvegarde.indisponible'), 'erreur');
	}
	function lireCle(cle) {
		try {
			const brut = localStorage.getItem(cle);
			return brut ? JSON.parse(brut) : null;
		} catch (e) {
			return null;
		}
	}
	function ecrireCle(cle, objet) {
		try {
			localStorage.setItem(cle, JSON.stringify(objet));
			return true;
		} catch (e) {
			signalerIndisponible();
			return false;
		}
	}

	// ——— Modèle ———
	const cleSemaine = (semaine) => PREFIXE + semaine;
	function semaineCourante() {
		const e = Jeu.etat || {};
		return e.mode === 'semaine' && e.semaine ? e.semaine.lundi : e.mode === 'direct' ? 'direct' : 'fallback';
	}

	/** Prompt 95 : les horodatages des équipes suivent l'horloge de jeu (TEMPS_EQUIPES), pas millis() — décalage en ms */
	function recalerEquipes(liste, decal) {
		(liste || []).forEach((q) => ['depart', 'arrivee', 'finIntervention', 'libre'].forEach((k) => typeof q[k] === 'number' && (q[k] += decal)));
	}
	/** Objet de sauvegarde de la partie en cours (null si aucune partie à sauver) */
	function construire() {
		if (ecran !== 'jeu' || !Jeu.paquet || !Jeu.paquet.length) return null;
		const maintenant = millis();
		const s = Jeu.instantane(maintenant);
		if (!s) return null;
		recalerEquipes(s.equipes, maintenant - (typeof tempsEquipes === 'function' ? tempsEquipes() : maintenant)); // prompt 95 : délais des équipes en temps de jeu
		const historique = s.historique;
		const evenements = s.evenementsJournee;
		s.historique = undefined;
		s.evenementsJournee = undefined;
		const R = Confort.Reglages;
		return {
			version: VERSION,
			sauvegardeLe: new Date().toISOString(),
			semaine: s.semaine,
			etat: {
				dossierIndex: s.index,
				decisions: encoder(historique),
				jauges: s.jauges,
				evenementsJournee: encoder(evenements),
				graine: s.graine,
				modeHorsLigne: s.mode === 'hors ligne',
				parametres: { son: !!R.son, contraste: !!R.contrasteRenforce, reduireAnimations: !!R.reduireAnimations, tailleTexte: 1 },
				// Où en était l'écran : la phase, et le temps déjà écoulé du compte à rebours (recalculé à la reprise)
				interface: { phase, ecoule: PHASES_COMPTEUR.includes(phase) ? Math.max(0, maintenant - debutCompteur) : 0, pcJour: typeof JOUR_PC !== 'undefined' ? JOUR_PC.fait : '', explication: typeof FIL !== 'undefined' && FIL.explicationVue, somnolence: typeof SOMNO !== 'undefined' ? Math.round(SOMNO.v) : 0, community: typeof COMMU !== 'undefined' ? COMMU.onglet : 'fil', patron: typeof PATRON !== 'undefined' ? { filtre: PATRON.filtre, defil: PATRON.defil } : null, pile: typeof APPLIS !== 'undefined' ? APPLIS.pile.slice() : [], brouillon: typeof COMMU !== 'undefined' ? COMMU.brouillon : null, telephone: typeof TELN !== 'undefined' ? { jour: TELN.jour, recues: TELN.recues.filter((n) => !n.heureReelle).map((n) => Object.assign({}, n)), vus: Object.assign({}, TELN.vus), spontanees: TELN.spontanees, dernier: TELN.dernier } : null, journal: typeof JOURNAL !== 'undefined' ? { jour: JOURNAL.jour, filtre: JOURNAL.filtre, defil: Math.round(JOURNAL.defil) } : null }, // prompt 71 : journée dont le PC a déjà démarré ; prompt 74 : explication du poste vue
				complet: encoder(s),
			},
		};
	}

	/** Sauvegarde automatique : après chaque décision, à la pause, en fin de journée, en quittant la page */
	function auto(annonce) {
		if (ecran !== 'jeu' || !Jeu.paquet) return false;
		if (phase === 'fin') {
			effacer(semaineCourante()); // partie terminée : plus rien à reprendre (le meilleur bilan est gardé à part)
			return false;
		}
		const o = construire();
		if (!o || !ecrireCle(cleSemaine(o.semaine), o)) return false;
		derniere = new Date();
		derniereJeu = Jeu.horloge && Jeu.jourCourant && Jeu.jourCourant() ? { minutes: Jeu.horloge.minutes, jour: Jeu.jourIndex + 1 } : null;
		if (annonce) annoncer(texteIndicateur());
		return true;
	}
	function texteIndicateur() {
		if (!derniere) return '';
		// Prompt 95 : l'heure et le jour du JEU (une seule horloge visible) ; l'heure réelle hors partie
		if (derniereJeu) return t('sauvegarde.autoJeu', { heure: Jeu.formaterHeure(derniereJeu.minutes), j: derniereJeu.jour });
		return t('sauvegarde.auto', { heure: String(derniere.getHours()).padStart(2, '0') + ':' + String(derniere.getMinutes()).padStart(2, '0') });
	}

	function effacer(semaine) {
		try {
			localStorage.removeItem(cleSemaine(semaine));
		} catch (e) {}
	}

	/** Toutes les sauvegardes valides, la plus récente d'abord */
	function lister() {
		const liste = [];
		try {
			for (let i = 0; i < localStorage.length; i++) {
				const cle = localStorage.key(i);
				if (!cle || cle.indexOf(PREFIXE) !== 0) continue;
				const o = lireCle(cle);
				if (valider(o).ok) liste.push(o);
			}
		} catch (e) {
			return [];
		}
		return liste.sort((a, b) => String(b.sauvegardeLe).localeCompare(String(a.sauvegardeLe)));
	}
	const pour = (semaine) => {
		const o = lireCle(cleSemaine(semaine));
		return valider(o).ok ? o : null;
	};

	// ——— Validation stricte (aucune écriture si un seul critère échoue) ———
	function semaineConnue(id) {
		if (id === 'fallback' || id === 'direct') return true;
		return !!(Jeu.semaines && Jeu.semaines.semaines && Jeu.semaines.semaines[id]);
	}
	function valider(o) {
		const non = (raison) => ({ ok: false, raison });
		if (!o || typeof o !== 'object' || Array.isArray(o)) return non('objet');
		if (o.version !== VERSION) return non('version');
		if (typeof o.semaine !== 'string' || !semaineConnue(o.semaine)) return non('semaine');
		const e = o.etat;
		if (!e || typeof e !== 'object') return non('etat');
		if (!Number.isInteger(e.dossierIndex) || e.dossierIndex < 0) return non('dossierIndex');
		const j = e.jauges;
		if (!j || !['fluidite', 'reputation', 'budget'].every((k) => typeof j[k] === 'number' && j[k] >= 0 && j[k] <= 100)) return non('jauges');
		if (typeof e.graine !== 'number' || !Number.isFinite(e.graine)) return non('graine');
		const c = e.complet;
		if (!c || typeof c !== 'object') return non('complet');
		if (!Array.isArray(c.paquet) || e.dossierIndex > c.paquet.length) return non('paquet');
		if (!Array.isArray(c.jours) || !c.jours.length || !c.jours.every((x) => x && typeof x.date === 'string' && Array.isArray(x.dossiers) && x.dossiers.every((i) => Number.isInteger(i) && i >= 0 && i < c.paquet.length))) return non('jours');
		if (!Number.isInteger(c.jourIndex) || c.jourIndex < 0 || c.jourIndex >= c.jours.length) return non('jourIndex');
		if (!c.horloge || typeof c.horloge.minutes !== 'number') return non('horloge');
		if (!Number.isInteger(c.tirages) || c.tirages < 0 || c.tirages > 1e6) return non('tirages');
		if (e.decisions !== undefined && !Array.isArray(e.decisions)) return non('decisions');
		if (e.evenementsJournee !== undefined && !Array.isArray(e.evenementsJournee)) return non('evenementsJournee');
		return { ok: true };
	}

	/** Analyse un texte JSON importé : jamais d'eval, jamais d'exception vers l'appelant */
	function analyser(texte) {
		let o;
		try {
			o = JSON.parse(String(texte));
		} catch (e) {
			return { ok: false, raison: 'json' };
		}
		const v = valider(o);
		return v.ok ? { ok: true, objet: o } : v;
	}

	// ——— Reprise ———
	function reprendre(o) {
		if (!valider(o).ok) return toast(t('parametres.import.erreur'), 'erreur'), Promise.resolve(false);
		const c = o.etat.complet;
		const charge =
			o.semaine === 'fallback'
				? Jeu.chargerHorsLigne()
				: o.semaine === 'direct'
					? Promise.resolve((Jeu.etat = { mode: 'direct', semaine: null, dossiers: c.paquet.slice(), horodatage: c.horodatage, horsLigne: false, message: '' }))
					: Jeu.chargerSemaine(o.semaine);
		return charge.then(() => {
			const maintenant = millis();
			const s = decoder(c);
			s.historique = decoder(o.etat.decisions || []);
			s.evenementsJournee = decoder(o.etat.evenementsJournee || []);
			s.index = o.etat.dossierIndex;
			s.jauges = o.etat.jauges;
			s.graine = o.etat.graine;
			let ok = false;
			try {
				ok = Jeu.restaurerInstantane(s, maintenant);
				if (ok) recalerEquipes(Jeu.equipes, (typeof tempsEquipes === 'function' ? tempsEquipes() : maintenant) - maintenant); // prompt 95
			} catch (e) {
				ok = false;
			}
			if (!ok) {
				Jeu.terminee = true;
				ecran = 'accueil';
				toast(t('parametres.import.erreur'), 'erreur');
				return false;
			}
			// Paramètres de la partie sauvegardée
			const p = o.etat.parametres || {};
			const R = Confort.Reglages;
			[['son', 'son'], ['contraste', 'contrasteRenforce'], ['reduireAnimations', 'reduireAnimations']].forEach(([a, b]) => {
				if (typeof p[a] === 'boolean' && R[b] !== p[a]) R.basculer(b);
			});
			if (typeof appliquerReglages === 'function') appliquerReglages();
			// Écran : on reprend où l'on s'était arrêté ; le compte à rebours repart du temps déjà écoulé
			const ui = o.etat.interface || {};
			ecran = 'jeu';
			fenetre = null;
			enPause = false;
			enSieste = false;
			reveil = null;
			smsActif = false;
			introVue = true;
			bilanCalcule = null;
			sourceChoisie = null;
			alerteTempsJouee = false;
			dernierResultat = null;
			const enCompteur = PHASES_COMPTEUR.includes(ui.phase) && Jeu.dossierCourant() && !Jeu.terminee;
			phase = enCompteur ? ui.phase : ui.phase === 'mail' ? 'mail' : ui.phase === 'soir' && !Jeu.terminee ? 'soir' : Jeu.terminee ? 'fin' : 'attente';
			if (phase === 'soir' && typeof reprendreSoir === 'function') reprendreSoir(); // prompt 69 : la nuit est tombée, la flèche attend
			if (phase === 'fin') allerFin();
			facteurDuree = Jeu.modificateurActif && Jeu.modificateurActif(maintenant) === 'heure_pointe' ? 0.8 : 1;
			arriveeDossier = debutCompteur = maintenant - (enCompteur ? Math.max(0, Number(ui.ecoule) || 0) : 0);
			interaction();
			if (typeof Rythme !== 'undefined') Rythme.clamperDebut(); // prompt 76 : sauvegarde d'avant le passage à 8 h → horloge et dossiers ramenés à 8 h
			if (typeof COMMU !== 'undefined' && ONGLETS_COMMU.includes(ui.community)) COMMU.onglet = ui.community; // prompt 85 : onglet actif
			if (typeof APPLIS !== 'undefined' && Array.isArray(ui.pile)) APPLIS.pile = ui.pile.slice(-12); // prompt 91 : pile de navigation
			if (typeof COMMU !== 'undefined' && ui.brouillon && Number.isInteger(ui.brouillon.index)) COMMU.brouillon = { index: ui.brouillon.index }; // brouillon non envoyé
			if (typeof TELN !== 'undefined' && ui.telephone && ui.telephone.jour) Object.assign(TELN, { jour: ui.telephone.jour, plan: Jeu.jourCourant() && Jeu.jourCourant().date === ui.telephone.jour ? NotifsTel.planJour(Jeu.jourCourant()) : [], recues: ui.telephone.recues || [], vus: ui.telephone.vus || {}, attente: [], spontanees: ui.telephone.spontanees || 0, dernier: ui.telephone.dernier === undefined ? -999 : ui.telephone.dernier }); // prompt 90 : lues, ignorées, prochaines arrivées (le direct est rechargé)
			if (typeof JOURNAL !== 'undefined' && ui.journal) Object.assign(JOURNAL, { jour: Number.isInteger(ui.journal.jour) ? ui.journal.jour : null, filtre: JournalDonnees.FILTRES.includes(ui.journal.filtre) ? ui.journal.filtre : 'tout', defil: Number(ui.journal.defil) || 0, enquete: null }); // prompt 89 : jour, filtre, défilement (prompt 140 : plus de vue Semaine) (données recalculées)
			if (typeof PATRON !== 'undefined' && ui.patron && FILTRES_PATRON.some((f) => f.cle === ui.patron.filtre)) Object.assign(PATRON, { filtre: ui.patron.filtre, defil: Number(ui.patron.defil) || 0 }); // prompt 86
			if (typeof SOMNO !== 'undefined') {
				SOMNO.v = Math.max(0, Math.min(100, Number(ui.somnolence) || 0)); // prompt 78
				SOMNO.jourCle = cleJourSomno();
			}
			if (typeof FIL !== 'undefined') {
				FIL.messages = [];
				FIL.serieDepuis = (Jeu.evenementsJournee || []).length;
				FIL.jourCle = ''; // les heures de rythme déjà passées ne sont pas rejouées (majRythme)
				FIL.explicationVue = ui.explication !== undefined ? !!ui.explication : true; // anciennes sauvegardes : déjà joué
			}
			if (typeof JOUR_PC !== 'undefined') {
				// Prompt 71 : reprise en cours de journée → pas de nouveau démarrage (anciennes sauvegardes : idem)
				JOUR_PC.fait = ui.pcJour !== undefined ? ui.pcJour : cleJourPC();
				JOUR_PC.attendu = false;
				demarrageDuJour();
			}
			derniere = new Date(o.sauvegardeLe);
			derniereJeu = null;
			annoncer(t('sauvegarde.reprise', { semaine: libelleSemaine(o.semaine), n: o.etat.dossierIndex + 1, total: c.paquet.length }));
			return true;
		});
	}
	function libelleSemaine(id) {
		if (id === 'fallback') return t('sauvegarde.semaineRef');
		if (id === 'direct') return t('sauvegarde.semaineDirect');
		return id.split('-').reverse().join('/');
	}

	// ——— Export ———
	function aExporter() {
		if (ecran === 'jeu') auto(false);
		const courante = ecran === 'jeu' ? pour(semaineCourante()) : null;
		return courante || lister()[0] || null;
	}
	function contenuExport(o) {
		return JSON.stringify(Object.assign({ jeu: JEU, exporteLe: new Date().toISOString() }, o), null, 1);
	}
	function exporter() {
		const o = aExporter();
		if (!o) return toast(t('parametres.export.rien'), 'erreur');
		const d = new Date();
		const p = (n) => String(n).padStart(2, '0');
		const nom = 'pxe-nte001-progression-' + o.semaine + '-' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + '.json';
		try {
			const url = URL.createObjectURL(new Blob([contenuExport(o)], { type: 'application/json' }));
			const a = document.createElement('a');
			a.href = url;
			a.download = nom;
			document.body.appendChild(a);
			a.click();
			a.remove();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
			toast(t('parametres.export.ok', { fichier: nom }), 'ok');
		} catch (e) {
			toast(t('parametres.export.erreur'), 'erreur');
		}
	}
	function copier() {
		const o = aExporter();
		if (!o) return toast(t('parametres.export.rien'), 'erreur');
		const texte = contenuExport(o);
		const repli = () => {
			// Repli : textarea hors écran + execCommand (navigateurs sans API presse-papiers, file://)
			const zone = document.createElement('textarea');
			zone.value = texte;
			zone.setAttribute('readonly', '');
			zone.className = 'sr-only';
			document.body.appendChild(zone);
			zone.select();
			let ok = false;
			try {
				ok = document.execCommand('copy');
			} catch (e) {}
			zone.remove();
			toast(t(ok ? 'parametres.copie.ok' : 'parametres.copie.erreur'), ok ? 'ok' : 'erreur');
		};
		if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texte).then(() => toast(t('parametres.copie.ok'), 'ok'), repli);
		else repli();
	}

	// ——— Import : petite boîte de dialogue HTML (fichier + zone de texte), accessible au clavier ———
	let dialogue = null;
	let focusAvant = null;
	function importer(texte) {
		const r = analyser(texte);
		if (!r.ok) {
			toast(t('parametres.import.erreur'), 'erreur'); // aucun état modifié
			return false;
		}
		if (!ecrireCle(cleSemaine(r.objet.semaine), stripExport(r.objet))) return false;
		toast(t('parametres.import.ok', { semaine: libelleSemaine(r.objet.semaine) }), 'ok');
		montrerReprise(r.objet);
		return true;
	}
	function stripExport(o) {
		const c = Object.assign({}, o);
		delete c.jeu;
		delete c.exporteLe;
		return c;
	}
	function el(tag, attrs, texte) {
		const e = document.createElement(tag);
		Object.keys(attrs || {}).forEach((k) => e.setAttribute(k, attrs[k]));
		if (texte !== undefined) e.textContent = texte;
		return e;
	}
	function ouvrirImport() {
		fermerImport();
		focusAvant = document.activeElement;
		const fond = el('div', { class: 'sv-fond' });
		const boite = el('div', { class: 'sv-dialogue', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'sv-titre' });
		boite.appendChild(el('h2', { id: 'sv-titre' }, t('parametres.import.titre')));
		boite.appendChild(el('p', {}, t('parametres.import.aide')));
		const fichier = el('input', { type: 'file', id: 'sv-fichier', accept: '.json,application/json', class: 'sr-only' });
		const label = el('label', { for: 'sv-fichier', class: 'sv-bouton', tabindex: '0', role: 'button' }, t('parametres.import.fichier'));
		label.addEventListener('keydown', (ev) => {
			if (ev.key === 'Enter' || ev.key === ' ') {
				ev.preventDefault();
				fichier.click();
			}
		});
		fichier.addEventListener('change', () => {
			const f = fichier.files && fichier.files[0];
			if (!f) return;
			const lecteur = new FileReader();
			lecteur.onload = () => importer(lecteur.result);
			lecteur.onerror = () => toast(t('parametres.import.erreur'), 'erreur');
			lecteur.readAsText(f);
		});
		boite.appendChild(fichier);
		boite.appendChild(label);
		const lz = el('label', { for: 'sv-texte' }, t('parametres.import.coller'));
		const zone = el('textarea', { id: 'sv-texte', rows: '6', spellcheck: 'false' });
		boite.appendChild(lz);
		boite.appendChild(zone);
		const actions = el('div', { class: 'sv-actions' });
		const valider = el('button', { type: 'button', class: 'sv-bouton' }, t('parametres.import.valider'));
		valider.addEventListener('click', () => importer(zone.value));
		const annuler = el('button', { type: 'button', class: 'sv-bouton sv-secondaire' }, t('commun.fermer'));
		annuler.addEventListener('click', fermerImport);
		actions.appendChild(valider);
		actions.appendChild(annuler);
		boite.appendChild(actions);
		boite.appendChild(el('div', { class: 'sv-reprise', id: 'sv-reprise' }));
		boite.addEventListener('keydown', (ev) => {
			if (ev.key === 'Escape') {
				ev.preventDefault();
				fermerImport();
			}
			if (ev.key === 'Tab') {
				// Focus piégé dans la boîte
				const f = Array.from(boite.querySelectorAll('[tabindex="0"], textarea, button')).filter((x) => x.offsetParent !== null);
				const i = f.indexOf(document.activeElement);
				if (ev.shiftKey && i <= 0) (ev.preventDefault(), f[f.length - 1].focus());
				else if (!ev.shiftKey && i === f.length - 1) (ev.preventDefault(), f[0].focus());
			}
		});
		fond.appendChild(boite);
		document.body.appendChild(fond);
		dialogue = fond;
		label.focus();
	}
	function montrerReprise(o) {
		const z = document.getElementById('sv-reprise');
		if (!z) return;
		z.textContent = '';
		const b = el('button', { type: 'button', class: 'sv-bouton' }, t('parametres.import.reprendre'));
		b.addEventListener('click', () => {
			fermerImport();
			if (typeof fermer === 'function') fermer();
			reprendre(o);
		});
		z.appendChild(b);
		b.focus();
	}
	function fermerImport() {
		if (dialogue) dialogue.remove();
		dialogue = null;
		if (focusAvant && focusAvant.focus) focusAvant.focus(); // focus rendu à l'origine
		focusAvant = null;
	}

	// ——— Toast (role=status, annoncé ; disparaît seul ; aucun flash) ———
	let minuterieToast = null;
	function toast(texte, type) {
		let z = document.getElementById('sv-toast');
		if (!z) {
			z = el('div', { id: 'sv-toast', role: 'status', 'aria-live': 'polite' });
			document.body.appendChild(z);
		}
		z.className = 'sv-toast sv-' + (type || 'ok');
		z.textContent = String(texte);
		z.hidden = false;
		clearTimeout(minuterieToast);
		minuterieToast = setTimeout(() => (z.hidden = true), 5000);
	}

	// Quitter la page ou passer en arrière-plan : on sauve
	if (typeof window !== 'undefined') {
		window.addEventListener('beforeunload', () => auto(false));
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'hidden') auto(false);
		});
	}

	return {
		auto,
		effacer,
		lister,
		pour,
		valider,
		analyser,
		importer,
		reprendre,
		exporter,
		copier,
		ouvrirImport,
		fermerImport,
		texteIndicateur,
		semaineCourante,
		libelleSemaine,
		get dialogueOuvert() {
			return !!dialogue;
		},
		_encoder: encoder,
		_decoder: decoder,
	};
})();
