/* Nantes en régulation — aides du parcours automatique des écrans (outil de développement).
 * Extraites d'audit-textes.js (prompt 93) au prompt 101 pour être partagées avec audit-densite.js.
 * Chargé SEULEMENT avec ?audit=textes ou ?audit=densite (chargeur en fin d'installation.js).
 */
(() => {
	const attendreImages = (n) =>
		new Promise((res) => {
			const f0 = frameCount;
			const t = setInterval(() => {
				if (frameCount - f0 >= n) clearInterval(t), res();
			}, 16);
		});
	const H = {
		raz() {
			fenetre = null;
			smsActif = false;
			enPause = false;
			if (typeof CINE !== 'undefined') CINE = null;
			if (typeof GAMEOVER !== 'undefined') GAMEOVER = null;
			if (typeof tutoriel !== 'undefined') tutoriel = null;
			if (typeof PLUS !== 'undefined') PLUS.ouvert = false;
			if (typeof TRANSITION_JOUR !== 'undefined') TRANSITION_JOUR = null;
		},
		partie(c) {
			H.raz();
			introVue = true;
			MENU.actif = false;
			choixAccueil = c;
			lancerNouvellePartie();
			H.raz();
			if (typeof TACHE !== 'undefined') (TACHE.courante = null), (TACHE.file = []);
		},
		poste() {
			JOUR_PC.attendu = false;
			PC.etat = 'appli';
			PC.fenetre = null;
			vue = 'poste';
		},
		dossierDeType(type) {
			for (let k = 0; k < 40; k++) {
				const d = Jeu.prochainDuJour();
				if (!d) return false;
				if (!type || d.type === type) break;
				Jeu.decider(Jeu.actionsPossibles(d)[0]);
			}
			const d = Jeu.prochainDuJour();
			if (!d || (type && d.type !== type)) return false;
			Jeu.horloge.minutes = d.minute;
			return true;
		},
		prendre() {
			if (phase === 'reveil') seReveiller();
			if (typeof prendreSignalement === 'function' && typeof fileIncidents === 'function' && fileIncidents().length) prendreSignalement(0);
		},
	};
	window.AUDIT_PARCOURS = { attendreImages, H };
})();
