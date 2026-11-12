/* Nantes en régulation — personnages (prompt 189) : un trait et un arc pour le patron, Camille ancrée dans la météo réelle.
 * Couche de présentation seulement : aucune règle verrouillée nouvelle, aucun effet de jeu. Les messages du patron
 * passent toujours par Jeu.messagePatron (appli « Mails ») ; on y ajoute un champ `ton` et une formulation par
 * semaine du mode histoire. Les textes sont dans i18n.js (FR + EN), variantes tirées par la graine (Jeu.variante).
 * Chargé après game.js et histoire.js (chapitreCourant).
 */
(function () {
	if (typeof Jeu === 'undefined' || !Jeu.messagePatron) return;

	/** Ton du patron : semaine 1 pédagogue, semaine 2 professionnel, semaine 3 sous pression ; hors histoire professionnel */
	const TONS_PATRON = { 1: 'pedagogue', 2: 'professionnel', 3: 'pression' };
	Jeu.tonPatron = function () {
		const ch = typeof chapitreCourant === 'function' ? chapitreCourant() : 0;
		return TONS_PATRON[ch] || 'professionnel';
	};
	/** Types de messages qui reçoivent la formulation du ton (consigne du jour, reproche, félicitation) */
	const SORTES_TON = ['consigne', 'reproche', 'felicitation'];
	const cleJour = () => String(Jeu.graine) + '|' + Jeu.jourIndex;
	let relanceJour = null; // semaine 3 : au plus une relance « deux messages à la suite » par jour

	const envoyer = Jeu.messagePatron;
	/** Envoi avec le ton : formulation finale tirée par la graine + champ `ton` sur l'entrée de la messagerie (et dans meta) */
	function envoyerAvecTon(texte, type, meta) {
		const ton = Jeu.tonPatron();
		const sorte = meta && meta.felicitation ? 'felicitation' : type;
		const n = (Jeu.messagesPatron || []).length + (Jeu.patronEnAttente || []).length;
		let corps = texte;
		if (SORTES_TON.includes(sorte)) corps = Liste([texte, T(Jeu.variante('patron.ton.' + ton + '.' + sorte, sorte + '|' + Jeu.jourIndex + '|' + n))], ' '); // formulation du ton en fin de message
		const r = envoyer(corps, type, Object.assign({}, meta || {}, { ton }));
		const dernier = (Jeu.patronEnAttente || []).length + (Jeu.messagesPatron || []).length > n ? [].concat(Jeu.messagesPatron || [], Jeu.patronEnAttente || []).find((m) => m.texte === corps) : null;
		if (dernier) dernier.ton = ton;
		// Semaine 3 : sous pression, il envoie un second message court juste après un reproche (une fois par jour)
		if (ton === 'pression' && sorte === 'reproche' && relanceJour !== cleJour()) {
			relanceJour = cleJour();
			envoyer(T(Jeu.variante('patron.ton.pression.relance', 'relance|' + Jeu.jourIndex)), 'info', { ton, relance: true });
			const m = (Jeu.messagesPatron || []).concat(Jeu.patronEnAttente || []).slice(-1)[0];
			if (m) m.ton = ton;
		}
		return r;
	}
	Jeu.messagePatron = envoyerAvecTon;

	/* Trait : le patron déteste qu'on esquive. Après une réponse Community jugée mauvaise, message sévère ; après une
	 * bonne, message de satisfaction court. Une fois par jour et par sorte. Aucun delta de jauge : le jeu n'a pas de
	 * reproche Community chiffré (−3) à aggraver, et les messages du patron n'ont pas d'effet (voir fiche 189). */
	const traitJour = {};
	Jeu.reactionPatronCommunity = function (r, plainte) {
		if (!r || !Jeu.messagesPatron) return null;
		const sorte = r.bonne ? 'assume' : 'esquive';
		const k = sorte + '|' + cleJour();
		if (traitJour[k]) return null;
		traitJour[k] = true;
		const texte = T(Jeu.variante('patron.trait.' + sorte, k), { auteur: (plainte && plainte.auteur) || '' });
		if (r.bonne) Jeu.messagePatron(texte, 'info', { felicitation: true, community: true });
		else Jeu.messagePatron(texte, 'reproche', { community: true, severe: true });
		return sorte;
	};
	const repondre = Jeu.repondrePlainte;
	Jeu.repondrePlainte = function (plainte, i, maintenant) {
		const r = repondre(plainte, i, maintenant);
		if (r) Jeu.reactionPatronCommunity(r, plainte);
		return r;
	};

	/* Camille : SMS entre deux journées sur la météo RÉELLE du jour joué (archives Open-Meteo de la semaine, ou
	 * Open-Meteo du jour en direct). Seuils explicites ; si la donnée du jour manque, pas de SMS. */
	const SEUILS_METEO_CAMILLE = { pluie_mm: 5, rafales_max: 50, temp_max: 30 }; // pluie et vent : mêmes seuils que le contexte « météo » de game.js
	Jeu.SEUILS_METEO_CAMILLE = SEUILS_METEO_CAMILLE;
	const nombre = (v) => (typeof nombreFr === 'function' ? nombreFr(v) : String(v));
	Jeu.conditionMeteoCamille = function (date) {
		const m = date && Jeu.meteoDuJour ? Jeu.meteoDuJour(date) : null;
		if (!m || m.date !== date) return null; // meteoDuJour retombe sur le 1er jour de la semaine : pas de SMS sans la donnée du jour
		const vaut = (k) => typeof m[k] === 'number' && isFinite(m[k]) && m[k] >= SEUILS_METEO_CAMILLE[k];
		if (vaut('pluie_mm')) return { condition: 'pluie', vars: { pluie: nombre(m.pluie_mm) } };
		if (vaut('rafales_max')) return { condition: 'vent', vars: { vent: nombre(Math.round(m.rafales_max)) } };
		if (vaut('temp_max')) return { condition: 'chaleur', vars: { temp: nombre(Math.round(m.temp_max)) } };
		return null;
	};
	const smsMeteoVus = {};
	/** Texte du SMS du soir (null si pas de condition réelle ou déjà envoyé ce jour) */
	Jeu.smsMeteoCamille = function () {
		const j = Jeu.jourCourant ? Jeu.jourCourant() : null;
		if (!j || !Jeu.jours || !Jeu.jours[Jeu.jourIndex + 1] || Jeu.terminee) return null; // entre deux journées seulement
		const k = String(Jeu.graine) + '|' + j.date;
		if (smsMeteoVus[k]) return null;
		const c = Jeu.conditionMeteoCamille(j.date);
		if (!c) return null;
		smsMeteoVus[k] = true;
		return { condition: c.condition, texte: T(Jeu.variante('camille.meteo.' + c.condition, k), c.vars) };
	};
	/* Une nouvelle partie (même semaine rejouée = même graine) repart sans mémoire des « une fois par jour » */
	const nouvelle = Jeu.nouvellePartie;
	Jeu.nouvellePartie = function () {
		relanceJour = null;
		[traitJour, smsMeteoVus].forEach((o) => Object.keys(o).forEach((k) => delete o[k]));
		return nouvelle.apply(this, arguments);
	};
})();

/** Fin du soir (soir.js) : SMS météo de Camille avant le jour suivant ; true = conversation lancée, `suite` à la fin */
function smsMeteoCamille(suite) {
	if (typeof lancerConversation !== 'function' || (typeof ecran !== 'undefined' && ecran !== 'jeu')) return false;
	const s = Jeu.smsMeteoCamille();
	if (!s) return false;
	lancerConversation({
		contact: T('sms.camille'),
		sous: T('intro.salle'),
		messages: [
			{ de: T('sms.camille'), texte: s.texte },
			{ de: 'moi', texte: T('camille.meteo.reponse') },
		],
		auFin: () => {
			smsActif = false;
			suite();
		},
	});
	return true;
}
