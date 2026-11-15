/* Nantes en régulation — prompt 230 : mode développeur, ouvert par un clic sur le logo PXE du menu principal (ou
 * `?dev=1`, ou ` au clavier sur le menu). Six onglets : Animations, Fins, Partie, Écrans, Options, Outils. Chaque
 * action passe par une fonction existante du jeu (aucune règle dupliquée) ; une partie touchée par le mode dev est
 * marquée (Jeu.dev) et n'entre pas au palmarès. Tout reste local (aucun envoi). Clavier : ← → onglets, ↑ ↓ actions,
 * Entrée lance, Échap ferme. Textes FR + EN dans ce fichier (outil de développement, hors du dictionnaire du jeu).
 */
const DEV = { onglet: 0, focus: 0, defil: 0, defilMax: 0, vitesse: 1, zones: false, fps: false, message: '', avecDonnees: true, confirmerEffacer: 0, fpsMoy: 60 };
const ONGLETS_DEV = ['animations', 'fins', 'partie', 'ecrans', 'options', 'outils'];
const TEXTES_DEV = {
	fr: {
		titre: 'MODE DÉVELOPPEUR', logo: 'Mode développeur', fermer: 'Fermer (Échap)', aide: '← → onglets · ↑ ↓ actions · Entrée lancer · Échap fermer',
		'onglet.animations': 'Animations', 'onglet.fins': 'Fins', 'onglet.partie': 'Partie', 'onglet.ecrans': 'Écrans', 'onglet.options': 'Options', 'onglet.outils': 'Outils',
		fait: 'Fait : {lib}', erreur: 'Impossible : {lib} ({e})', marque: 'DEV · partie modifiée (hors palmarès)', active: 'activé', desactive: 'désactivé',
		'a.fenetre': 'Ouverture de fenêtre (Palmarès)', 'a.bouton': 'Survol et appui : survolez puis cliquez ce bouton', 'a.appli': "Changement d'appli (Carte → Mails)", 'a.juiceS': 'Secousse : petite', 'a.juiceM': 'Secousse : moyenne', 'a.juiceL': 'Secousse : grande', 'a.pop': 'Pop de jauge (+8 fluidité, −6 budget)', 'a.transition': 'Transition de jour', 'a.demarrage': 'Démarrage du PC', 'a.lever': "Se lever / s'asseoir", 'a.lettre': 'Lettre : ouverture et rangement', 'a.telephone': 'Téléphone en main', 'a.cafe': 'Café', 'a.sieste': 'Sieste (active la somnolence pour la session)', 'a.bilan': 'Bilan de fin de journée (XP)', 'a.vitesse': 'Vitesse des animations : ×{v}', 'a.reduites': 'Animations réduites : {etat}',
		'f.donnees': 'Données de la partie en cours : {etat}', 'f.seq': '{nom} · séquence {n}', 'f.tout': '{nom} · vidéo entière', 'f.lettreLic': 'Écran de licenciement (lettre)',
		'p.semaine': 'Lancer : {titre}', 'p.jour': 'Jour suivant', 'p.heure': 'Heure +1 h', 'p.soir': 'Heure : 19 h 30', 'p.jauge': '{jauge} {s}10', 'p.budget0': 'Budget à 0', 'p.budget100': 'Budget à 100', 'p.signalement': 'Prochain signalement, tout de suite', 'p.finJour': 'Finir la journée', 'p.finSemaine': 'Finir la semaine (vidéo puis rapport)', 'p.licenciement': 'Licenciement', 'p.demission': 'Démission', 'p.promesse': "Promesse d'équipe (champ « À envoyer »)", 'p.demande': 'Demande au patron en attente',
		'e.aide': 'Aide', 'e.parametres': 'Paramètres', 'e.palmares': 'Palmarès', 'e.fins': 'Galerie des fins', 'e.lettre': 'Lettre : {type}', 'e.finJour': 'Fin de journée (rapport du soir)', 'e.mailSoir': 'Mail du soir (Mails)', 'e.sms': 'SMS de Camille', 'e.telephone': 'Téléphone', 'e.partir': 'Partir quand même ?', 'e.demission': 'Rendre son badge ?', 'e.mails': 'Mails : briefing du jour',
		'o.reglage': '{nom} : {etat}', 'o.langue': 'Langue : {l}',
		'x.zones': 'Zones de clic et leur taille (px CSS) : {etat}', 'x.fps': 'Images par seconde : {etat}', 'x.version': 'Version : {v}', 'x.donnees': 'Données : {d}', 'x.audit': 'Relancer avec l’audit des textes', 'x.effacer': 'Effacer les données locales du jeu', 'x.effacerConfirmer': 'Confirmer : tout effacer (sauvegardes, réglages, galerie)', 'x.efface': 'Données locales effacées : rechargement.',
	},
	en: {
		titre: 'DEVELOPER MODE', logo: 'Developer mode', fermer: 'Close (Esc)', aide: '← → tabs · ↑ ↓ actions · Enter run · Esc close',
		'onglet.animations': 'Animations', 'onglet.fins': 'Endings', 'onglet.partie': 'Game', 'onglet.ecrans': 'Screens', 'onglet.options': 'Options', 'onglet.outils': 'Tools',
		fait: 'Done: {lib}', erreur: 'Not possible: {lib} ({e})', marque: 'DEV · game modified (not ranked)', active: 'on', desactive: 'off',
		'a.fenetre': 'Window opening (Leaderboard)', 'a.bouton': 'Hover and press: hover then click this button', 'a.appli': 'App switch (Map → Mail)', 'a.juiceS': 'Shake: small', 'a.juiceM': 'Shake: medium', 'a.juiceL': 'Shake: large', 'a.pop': 'Gauge pop (+8 flow, −6 budget)', 'a.transition': 'Day transition', 'a.demarrage': 'PC start-up', 'a.lever': 'Stand up / sit down', 'a.lettre': 'Letter: opening and filing', 'a.telephone': 'Phone in hand', 'a.cafe': 'Coffee', 'a.sieste': 'Nap (turns drowsiness on for the session)', 'a.bilan': 'End-of-day summary (XP)', 'a.vitesse': 'Animation speed: ×{v}', 'a.reduites': 'Reduced animations: {etat}',
		'f.donnees': 'Current game data: {etat}', 'f.seq': '{nom} · sequence {n}', 'f.tout': '{nom} · full video', 'f.lettreLic': 'Dismissal screen (letter)',
		'p.semaine': 'Start: {titre}', 'p.jour': 'Next day', 'p.heure': 'Time +1 h', 'p.soir': 'Time: 7:30 p.m.', 'p.jauge': '{jauge} {s}10', 'p.budget0': 'Budget to 0', 'p.budget100': 'Budget to 100', 'p.signalement': 'Next report, right now', 'p.finJour': 'End the day', 'p.finSemaine': 'End the week (video then report)', 'p.licenciement': 'Dismissal', 'p.demission': 'Resignation', 'p.promesse': 'Team promise (“To send” slot)', 'p.demande': 'Pending request to the boss',
		'e.aide': 'Help', 'e.parametres': 'Settings', 'e.palmares': 'Leaderboard', 'e.fins': 'Endings gallery', 'e.lettre': 'Letter: {type}', 'e.finJour': 'End of day (evening report)', 'e.mailSoir': 'Evening mail (Mail)', 'e.sms': 'Text from Camille', 'e.telephone': 'Phone', 'e.partir': 'Leave anyway?', 'e.demission': 'Hand in your badge?', 'e.mails': "Mail: today's briefing",
		'o.reglage': '{nom}: {etat}', 'o.langue': 'Language: {l}',
		'x.zones': 'Click areas and their size (CSS px): {etat}', 'x.fps': 'Frames per second: {etat}', 'x.version': 'Version: {v}', 'x.donnees': 'Data: {d}', 'x.audit': 'Reload with the text audit', 'x.effacer': 'Erase the game’s local data', 'x.effacerConfirmer': 'Confirm: erase everything (saves, settings, gallery)', 'x.efface': 'Local data erased: reloading.',
	},
};
function td(cle, vars) {
	const l = typeof Langue !== 'undefined' && Langue.actuelle === 'en' ? 'en' : 'fr';
	return String(TEXTES_DEV[l][cle] || TEXTES_DEV.fr[cle] || cle).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined ? String(vars[k]) : m));
}
const etatDev = (v) => td(v ? 'active' : 'desactive');

// ——— Ouverture ———
function ouvrirDev() {
	if (typeof CINE !== 'undefined' && CINE) return;
	ouvrir('dev');
	DEV.message = '';
	annoncer(td('titre') + ' — ' + td('onglet.' + ONGLETS_DEV[DEV.onglet]) + '. ' + td('aide'));
}
function fermerDev() {
	if (fenetre === 'dev') fermer();
}
/** Partie touchée par le mode dev : hors palmarès */
function marquerDev() {
	if (typeof Jeu !== 'undefined') Jeu.dev = true;
}
/** Une partie en cours (sinon : la première semaine proposée), joueur au poste, sans écran d'introduction */
function assurerPartie() {
	if (ecran !== 'jeu' || !Jeu.jourCourant || !Jeu.jourCourant()) {
		introVue = true;
		if (typeof MENU !== 'undefined') MENU.actif = false;
		choixAccueil = 0;
		lancerNouvellePartie();
		smsActif = false;
		tutoriel = null;
		TRANSITION_JOUR = null;
		if (typeof TACHE !== 'undefined') (TACHE.courante = null), (TACHE.file = []);
	}
	if (typeof MENU !== 'undefined') MENU.actif = false;
	fenetre = null;
	marquerDev();
}
function auPoste() {
	assurerPartie();
	if (typeof JOUR_PC !== 'undefined') JOUR_PC.attendu = false;
	PC.etat = 'appli';
	PC.fenetre = null;
	vue = 'poste';
}
function auBureau() {
	assurerPartie();
	vue = 'bureau';
}
function lettreDeType(type) {
	auBureau();
	if (type === 'sanction') {
		const S = Jeu.statutPatron;
		S.avertissements = Math.max(1, S.avertissements);
		S.dates.push('10:00|' + Jeu.jourCourant().date);
	}
	const l = lettresDuJour().find((x) => x.type === type);
	if (!l) throw new Error(type);
	LETTRE.courante = l;
	const lues = lettresLues();
	const i = lues.findIndex((x) => x.id === l.id);
	if (i >= 0) lues.splice(i, 1);
	ouvrirLettre();
}
function semainesDev() {
	return typeof optionsAccueil === 'function' ? optionsAccueil().map((o, i) => ({ o, i })).filter((x) => !x.o.desactive) : [];
}

// ——— Les actions, par onglet : { lib, faire } (faire peut renvoyer false pour garder la fenêtre ouverte) ———
function actionsDev(onglet) {
	const A = [];
	const a = (lib, faire, garder) => A.push({ lib, faire, garder });
	if (onglet === 'animations') {
		a(td('a.fenetre'), () => ouvrir('palmares'));
		a(td('a.bouton'), () => (DEV.message = td('a.bouton')), true);
		a(td('a.appli'), () => (auPoste(), (PC.etat = 'os'), (PC.fenetre = 'patron')));
		['S', 'M', 'L'].forEach((k) => a(td('a.juice' + k), () => (auPoste(), feedback({ S: 'small', M: 'medium', L: 'large' }[k]))));
		a(td('a.pop'), () => (auPoste(), Jeu.appliquerDeltas({ fluidite: 8, budget: -6 })));
		a(td('a.transition'), () => (assurerPartie(), (derniereJourneeAnnoncee = ''), annoncerJournee()));
		a(td('a.demarrage'), () => (auPoste(), (PC.etat = 'eteint'), demarrerPC()));
		a(td('a.lever'), () => (assurerPartie(), vue === 'poste' ? seLever() : sAsseoir()));
		a(td('a.lettre'), () => lettreDeType('mission'));
		a(td('a.telephone'), () => (auBureau(), ouvrirTelephone()));
		a(td('a.cafe'), () => (auBureau(), boireCafe()));
		a(td('a.sieste'), () => (auPoste(), (Confort.Reglages.somnolence = true), dormir(true)));
		a(td('a.bilan'), () => {
			auPoste();
			const rp = Taches.rapport();
			if (!rp) throw new Error('rapport');
			ouvrirTache({ type: 'rapport', donnees: rp }, () => {});
		});
		a(td('a.vitesse', { v: DEV.vitesse }), () => ((DEV.vitesse = DEV.vitesse === 1 ? 0.5 : DEV.vitesse === 0.5 ? 0.25 : 1), (DEV.message = td('a.vitesse', { v: DEV.vitesse }))), true);
		a(td('a.reduites', { etat: etatDev(reduireAnimations) }), () => basculerReglage('reduireAnimations'), true);
	} else if (onglet === 'fins') {
		a(td('f.donnees', { etat: etatDev(DEV.avecDonnees) }), () => (DEV.avecDonnees = !DEV.avecDonnees), true);
		FINS_VIDEO.forEach((cle) => {
			const nom = nomFinVideo(cle);
			const lancer = (plan) => () => {
				const enJeu = ecran === 'jeu' && Jeu.jourCourant && Jeu.jourCourant();
				const d = DEV.avecDonnees && enJeu ? donneesVideoFin(cle, Jeu.bilan()) : { cle };
				fermerDev();
				lancerVideoFin(cle, d, ouvrirDev);
				if (plan !== null) (CINE.plan = plan), (CINE.suite = () => ouvrirDev());
			};
			a(td('f.tout', { nom }), lancer(null));
			[0, 1, 2].forEach((n) => a(td('f.seq', { nom, n: n + 1 }), lancer(n)));
		});
		a(td('f.lettreLic'), () => (assurerPartie(), (Jeu.statutPatron.licencie = { date: Jeu.jourCourant().date, heure: '10h00', cause: 'effondrement' }), lancerLicenciement(), CINE && finVideo()));
	} else if (onglet === 'partie') {
		semainesDev().forEach(({ o, i }) =>
			a(td('p.semaine', { titre: String(o.titre) }), () => {
				introVue = true;
				MENU.actif = false;
				choixAccueil = i;
				lancerNouvellePartie();
				marquerDev();
			}),
		);
		a(td('p.jour'), () => (assurerPartie(), journeeSuivante()));
		a(td('p.heure'), () => (assurerPartie(), (Jeu.horloge.minutes = Math.min(Jeu.finJournee(), Jeu.horloge.minutes + 60))));
		a(td('p.soir'), () => (assurerPartie(), (Jeu.horloge.minutes = 19 * 60 + 30)));
		['fluidite', 'reputation', 'budget'].forEach((k) =>
			['+', '−'].forEach((sg) => a(td('p.jauge', { jauge: t('jaugeTitre.' + k), s: sg }), () => (assurerPartie(), Jeu.appliquerDeltas({ [k]: sg === '+' ? 10 : -10 })), true)),
		);
		a(td('p.budget0'), () => (assurerPartie(), (Jeu.jauges.budget = 0)), true);
		a(td('p.budget100'), () => (assurerPartie(), (Jeu.jauges.budget = 100)), true);
		a(td('p.signalement'), () => {
			auPoste();
			const d = Jeu.prochainDuJour();
			if (!d) throw new Error('aucun');
			Jeu.horloge.minutes = Math.max(Jeu.horloge.minutes, d.minute);
		});
		a(td('p.finJour'), () => (auPoste(), quitterJourneeRapide()));
		a(td('p.finSemaine'), () => (assurerPartie(), (Jeu.terminee = true), allerFin()));
		a(td('p.licenciement'), () => (assurerPartie(), (Jeu.statutPatron.licencie = { date: Jeu.jourCourant().date, heure: '10h00', cause: 'effondrement' }), lancerLicenciement()));
		a(td('p.demission'), () => (assurerPartie(), (Jeu.demission = true), (Jeu.terminee = true), allerFin()));
		a(td('p.promesse'), () => {
			auPoste();
			const i = Jeu.paquet.findIndex((d, k) => Jeu.actionsPossibles(d).some((x) => Jeu.reponse(d, x) && Jeu.reponse(d, x).equipe));
			const d = Jeu.paquet[i];
			const cle = d && Jeu.actionsPossibles(d).find((x) => Jeu.reponse(d, x) && Jeu.reponse(d, x).equipe);
			if (!cle || !Jeu.promettreEquipe(i, cle, tempsEquipes())) throw new Error('promesse');
		});
		a(td('p.demande'), () => (assurerPartie(), (Taches.etat().demande = { id: 'budget', accordee: true, pour: Jeu.jourIndex + 1 })), true);
	} else if (onglet === 'ecrans') {
		a(td('e.aide'), () => ouvrir('aide'));
		a(td('e.parametres'), () => ouvrir('parametres'));
		a(td('e.palmares'), () => ouvrir('palmares'));
		a(td('e.fins'), () => ouvrirFins());
		['mission', 'bilan', 'sanction'].forEach((ty) => a(td('e.lettre', { type: t('lettre.type.' + ty) }), () => lettreDeType(ty)));
		a(td('e.finJour'), () => {
			auPoste();
			const rp = Taches.rapport();
			if (!rp) throw new Error('rapport');
			ouvrirTache({ type: 'rapport', donnees: rp }, () => {});
		});
		a(td('e.mailSoir'), () => (auPoste(), Jeu.deposerMailDuSoir(), (PC.etat = 'os'), (PC.fenetre = 'patron'), (PATRON.filtre = 'soirs')));
		a(td('e.mails'), () => (auPoste(), (PC.etat = 'os'), (PC.fenetre = 'patron'), (PATRON.filtre = 'tout')));
		a(td('e.sms'), () => (assurerPartie(), lancerConversation({ contact: T('sms.camille'), sous: T('intro.salle'), messages: SMS, auFin: () => (smsActif = false) })));
		a(td('e.telephone'), () => (auBureau(), ouvrirTelephone()));
		a(td('e.partir'), () => (assurerPartie(), ouvrir('partir')));
		a(td('e.demission'), () => (assurerPartie(), ouvrir('demission')));
	} else if (onglet === 'options') {
		const R = Confort.Reglages;
		[['somnolence', 'optjeu.somnolence'], ['defiChrono', 'param.defiChrono'], ['npd', 'optjeu.npd'], ['reduireAnimations', 'param.animations'], ['contrasteRenforce', 'param.contraste'], ['toutDebloque', 'optjeu.toutDebloque'], ['masquerViolence', 'param.violence'], ['sousTitresSons', 'param.sousTitres']].forEach(([nom, cleLib]) =>
			a(td('o.reglage', { nom: t(cleLib), etat: etatDev(R[nom]) }), () => basculerReglage(nom), true),
		);
		a(td('o.langue', { l: Langue.actuelle.toUpperCase() }), () => Langue.suivante(), true);
	} else {
		a(td('x.zones', { etat: etatDev(DEV.zones) }), () => (DEV.zones = !DEV.zones), true);
		a(td('x.fps', { etat: etatDev(DEV.fps) }), () => (DEV.fps = !DEV.fps), true);
		a(td('x.version', { v: typeof VERSION_BUILD !== 'undefined' ? VERSION_BUILD : '—' }), () => (DEV.message = td('x.version', { v: typeof VERSION_BUILD !== 'undefined' ? VERSION_BUILD : '—' })), true);
		const donnees = Jeu.etat ? (Jeu.etat.horsLigne ? 'instantané (hors ligne)' : Jeu.etat.mode || '—') : '—';
		a(td('x.donnees', { d: donnees }), () => (DEV.message = td('x.donnees', { d: donnees })), true);
		a(td('x.audit'), () => (window.location.search = '?audit=textes&parcours=1'));
		const conf = DEV.confirmerEffacer && millis() - DEV.confirmerEffacer < 5000;
		a(td(conf ? 'x.effacerConfirmer' : 'x.effacer'), () => {
			if (!conf) return (DEV.confirmerEffacer = millis()), (DEV.message = td('x.effacerConfirmer'));
			try {
				Object.keys(localStorage).filter((k) => /^pxe-nte001/.test(k)).forEach((k) => localStorage.removeItem(k));
			} catch (e) {}
			DEV.message = td('x.efface');
			setTimeout(() => window.location.reload(), 600);
		}, true);
	}
	return A;
}
function lancerActionDev(act) {
	if (!act) return;
	try {
		DEV.message = '';
		if (!act.garder) fermerDev();
		act.faire();
		if (!DEV.message) DEV.message = td('fait', { lib: act.lib });
		annoncer(DEV.message);
	} catch (e) {
		DEV.message = td('erreur', { lib: act.lib, e: e && e.message ? e.message : String(e) });
		annoncer(DEV.message);
		if (fenetre !== 'dev') ouvrirDev();
	}
}

// ——— Clavier, molette ———
function toucheDev() {
	if (fenetre !== 'dev') return false;
	const n = actionsDev(ONGLETS_DEV[DEV.onglet]).length;
	if (keyCode === ESCAPE) return fermerDev(), true;
	if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW || (keyCode === TAB && !keyIsDown(SHIFT))) {
		DEV.onglet = (DEV.onglet + (keyCode === LEFT_ARROW ? ONGLETS_DEV.length - 1 : 1)) % ONGLETS_DEV.length;
		DEV.focus = 0;
		DEV.defil = 0;
		annoncer(td('onglet.' + ONGLETS_DEV[DEV.onglet]));
		return true;
	}
	if (keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
		DEV.focus = (DEV.focus + (keyCode === UP_ARROW ? n - 1 : 1)) % Math.max(1, n);
		annoncer(actionsDev(ONGLETS_DEV[DEV.onglet])[DEV.focus].lib);
		return true;
	}
	if (keyCode === ENTER || keyCode === RETURN || key === ' ') return lancerActionDev(actionsDev(ONGLETS_DEV[DEV.onglet])[DEV.focus]), true;
	return true;
}
function molletteDev(delta) {
	if (fenetre !== 'dev') return false;
	DEV.defil = constrain(DEV.defil + delta, 0, DEV.defilMax);
	return true;
}
/** ` (accent grave) sur le menu principal : ouvre le mode dev */
function raccourciDev() {
	if (key === '`' && typeof MENU !== 'undefined' && MENU.actif && !fenetre) return ouvrirDev(), true;
	return false;
}

// ——— Fenêtre ———
function fenetreDev() {
	const portrait = typeof PORTRAIT !== 'undefined' && PORTRAIT.actif;
	const l = DS.fenetre.large;
	const h = H - 60;
	const x = (L - l) / 2;
	const y = 30;
	panneau(x, y, l, h, C.accent);
	dsTitre(td('titre'), x + 40, y + 28, portrait ? 36 : 40, C.texte, 'left');
	// Onglets
	const cols = portrait ? 3 : ONGLETS_DEV.length;
	const ho = hCible(56, 74);
	const lo = (l - 80 - (cols - 1) * 8) / cols;
	ONGLETS_DEV.forEach((o, i) => {
		const ox = x + 40 + (i % cols) * (lo + 8);
		const oy = y + 96 + Math.floor(i / cols) * (ho + 8);
		bouton(ox, oy, lo, ho, td('onglet.' + o), () => ((DEV.onglet = i), (DEV.focus = 0), (DEV.defil = 0)), false, i !== DEV.onglet);
	});
	const yl = y + 96 + Math.ceil(ONGLETS_DEV.length / cols) * (ho + 8) + 12;
	const pied = portrait ? 200 : 120;
	const hl = y + h - pied - yl;
	// Liste des actions (deux colonnes sur ordinateur), défilable
	const acts = actionsDev(ONGLETS_DEV[DEV.onglet]);
	const c2 = portrait ? 1 : 2;
	const la = (l - 80 - (c2 - 1) * 16) / c2;
	const ha = hCible(56, 74);
	const pas = ha + 10;
	DEV.defilMax = Math.max(0, Math.ceil(acts.length / c2) * pas - hl);
	DEV.defil = constrain(DEV.defil, 0, DEV.defilMax);
	// Le focus clavier reste visible
	const rf = Math.floor(DEV.focus / c2) * pas;
	if (rf - DEV.defil < 0) DEV.defil = rf;
	if (rf + pas - DEV.defil > hl) DEV.defil = rf + pas - hl;
	drawingContext.save();
	drawingContext.beginPath();
	drawingContext.rect(x, yl - 8, l, hl + 16);
	drawingContext.clip();
	const n0 = boutons.length;
	acts.forEach((act, i) => {
		const ax = x + 40 + (i % c2) * (la + 16);
		const ay = yl + Math.floor(i / c2) * pas - DEV.defil;
		if (ay + ha < yl - 8 || ay > yl + hl + 8) return;
		// Portrait : libellé abrégé pour rester lisible (≥ 12 px CSS) ; le libellé entier est annoncé au lancement
		const lib = portrait && act.lib.length > Math.floor(la / 17) ? act.lib.slice(0, Math.floor(la / 17) - 1).trim() + '…' : act.lib;
		bouton(ax, ay, la, ha, lib, () => ((DEV.focus = i), lancerActionDev(act)), false, true);
		if (i === DEV.focus) {
			noFill();
			stroke(C.primaireTrait);
			strokeWeight(3);
			rect(ax - 4, ay - 4, la + 8, ha + 8);
			noStroke();
		}
	});
	drawingContext.restore();
	for (let i = boutons.length - 1; i >= n0; i--) if (boutons[i].y + boutons[i].h <= yl - 8 || boutons[i].y >= yl + hl + 8) boutons.splice(i, 1);
	// Pied : message, aide clavier, Fermer
	const yp = y + h - pied + 16;
	if (DEV.message) dessinerTexte(DEV.message, x + 40, yp, l - 80 - (portrait ? 0 : 340), { taille: 20, interligne: 26, couleur: C.texte, maxLignes: 2 });
	if (!portrait) dessinerTexte(td('aide'), x + 40, yp + 56, l - 80 - 340, { taille: 18, interligne: 24, couleur: C.gris, police: POLICE_DONNEES, maxLignes: 1 });
	bouton(portrait ? x + 40 : x + l - 40 - 300, portrait ? yp + 70 : yp + 20, portrait ? l - 80 : 300, hCible(56, 74), td('fermer'), fermerDev);
}

// ——— Surcouches (au-dessus de tout) : zones de clic, images par seconde, marque « DEV » ———
function dessinerSurcoucheDev() {
	if (DEV.zones) {
		const cv = document.querySelector('#scene canvas.p5Canvas');
		const k = cv ? cv.getBoundingClientRect().width / L : 1;
		push();
		textFont(POLICE_DONNEES);
		textSize(14);
		boutons.forEach((b) => {
			const mn = Math.min(b.l, b.h) * k;
			noFill();
			stroke(mn < 44 ? '#ff3b30' : '#34c759');
			strokeWeight(1);
			rect(b.x, b.y, b.l, b.h);
			noStroke();
			fill(0, 0, 0, 200);
			rect(b.x, b.y, 64, 18);
			fill(mn < 44 ? '#ff6b5e' : '#7ee29a');
			textAlign(LEFT, TOP);
			text(Math.round(b.l * k) + '×' + Math.round(b.h * k), b.x + 3, b.y + 2);
		});
		pop();
	}
	if (DEV.fps) {
		DEV.fpsMoy = DEV.fpsMoy * 0.95 + frameRate() * 0.05;
		push();
		noStroke();
		fill(0, 0, 0, 200);
		rect(L - 150, 8, 140, 40);
		fill('#7ee29a');
		textFont(POLICE_DONNEES);
		textSize(20);
		textAlign(LEFT, CENTER);
		text(Math.round(DEV.fpsMoy) + ' i/s', L - 136, 28);
		pop();
	}
	if (typeof Jeu !== 'undefined' && Jeu.dev && ecran === 'jeu') {
		push();
		noStroke();
		textFont(POLICE_DONNEES);
		textSize(16);
		const txt = td('marque');
		fill(179, 38, 30, 230);
		rect(8, H - 34, textWidth(txt) + 20, 28);
		fill('#ffffff');
		textAlign(LEFT, CENTER);
		text(txt, 18, H - 20);
		pop();
	}
}
/** `?dev=1` : le mode dev s'ouvre dès que le menu principal est affiché */
if (typeof window !== 'undefined' && /[?&]dev=1/.test(window.location.search)) {
	const attendre = setInterval(() => {
		if (typeof MENU !== 'undefined' && MENU.actif && typeof fenetre !== 'undefined' && !fenetre && typeof ouvrir === 'function') {
			clearInterval(attendre);
			ouvrirDev();
		}
	}, 300);
}
