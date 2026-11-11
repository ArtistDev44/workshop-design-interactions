/* Nantes en régulation — couche d'immersion (prompt 20).
 * Ajoute, SANS toucher aux décisions Q1–Q61 (jauges, actions, fins) :
 *   § 2 intro SMS · § 3 horloge simulée et temps compressé ×10 · § 4 sieste et « Se réveiller »
 *   § 5 bordures rouges pour les incidents importants · § 6 mail de fin de journée · § 7 livres au bureau
 *   § 1 Échap au bureau = menu.
 * Rien n'est inventé côté données : les textes factuels (mail) viennent des dossiers réellement joués.
 */

// ——— Réglages de l'immersion (tout est ici) ———
const IMMERSION = {
	minutesParSeconde: 1, // rythme normal : 1 minute de journée par seconde réelle
	compression: 100, // § 3 : ×100 quand aucun incident n'est actif (prompt 43 : ×10 → ×30 ; prompt 77 : ×100, valeur verrouillée)
	fenetreReveilMs: { 60: 3000, 30: 2000, 15: 1000 }, // § 4 : selon le compteur de la semaine
	retardImportant: 20, // § 5 : retard ≥ 20 min = bordure rouge
	pulsationsParSeconde: 1.5, // § 5 : jamais plus de 3 flashs/s
};

const SMS = [
	{ de: 'moi', texte: T('sms.0') },
	{ de: T('sms.camille'), texte: T('sms.1') },
	{ de: T('sms.camille'), texte: T('sms.2') },
	{ de: T('sms.camille'), texte: T('sms.3') },
	{ de: T('sms.camille'), texte: T('sms.4') },
	{ de: 'moi', texte: T('sms.5') },
];

const LIVRE_STRESS = [0, 1, 2, 3, 4, 5].map((n) => T('stress.' + n));

let smsActif = false;
let smsIndex = 0;
let introVue = false;
let inactifDepuis = 0; // millis() de la dernière interaction
let enSieste = false;
let debutSieste = 0;
let reveil = null; // { limite } quand une alerte arrive pendant la sieste
let focusBureau = -1; // -1 : aucun ; sinon index dans OBJETS_BUREAU
let derniereImage = 0;

// Objets cliquables du bureau (coordonnées pixel art, voir bureau.js)
const OBJETS_BUREAU = [
	{ nom: 'ecran', label: T('objet.ecran') },
	{ nom: 'aide', label: T('objet.aide'), x: 58, y: 190, l: 50, h: 9 }, // prompt 34 : remplace le livre « tuto »
	{ nom: 'stress', label: T('objet.stress'), x: 62, y: 180, l: 44, h: 9 },
	// Prompt 29 : objets de la pièce (micro-interactions, sans effet sur les jauges ni pause)
	{ nom: 'lampe', piece: true, label: T('piece.lampe'), infobulle: T('piece.lampe.survol'), x: 410, y: 86, l: 16, h: 14 }, // prompt 31 : applique murale (recalée pour le plein écran)
	{ nom: 'plante', piece: true, label: T('piece.plante'), infobulle: T('piece.plante.survol'), x: 69, y: 153, l: 16, h: 21 },
	{ nom: 'tasse', piece: true, label: T('piece.tasse'), infobulle: T('piece.tasse.survol'), x: 118, y: 178, l: 22, h: 28 },
	{ nom: 'rapport', label: T('objet.rapport'), infobulle: T('objet.rapport.survol'), x: 272, y: 178, l: 58, h: 20, visible: () => !!RAPPORT }, // prompt 41 : posée entre le pied de l'écran et le clavier
	{ nom: 'telephone', label: T('objet.telephone'), infobulle: T('objet.telephone.survol'), x: 364, y: 192, l: 26, h: 32 }, // prompt 38
	{ nom: 'dossiers', piece: true, label: T('piece.dossiers'), infobulle: T('piece.dossiers.survol'), x: 390, y: 160, l: 44, h: 15 },
	{ nom: 'fenetre', piece: true, label: T('piece.fenetre'), infobulle: T('piece.fenetre.survol'), x: 334, y: 14, l: 64, h: 96 }, // prompt 31 : la baie s'arrête au pan de mur
	{ nom: 'horloge', label: T('objet.horloge'), infobulle: T('objet.horloge.survol'), x: 404, y: 30, l: 28, h: 29 }, // prompt 51 : finir sa journée
	{ nom: 'webcam', label: T('objet.webcam'), infobulle: T('objet.webcam.survol'), x: 234, y: 39, l: 13, h: 8 }, // prompt 57 : webcam posée sur l'écran
	{ nom: 'micro', label: T('objet.micro'), infobulle: T('objet.micro.survol'), x: 150, y: 170, l: 12, h: 24 }, // prompt 54 : micro du poste (appui maintenu)
	{ nom: 'sortie', label: T('soir.sortie'), infobulle: T('soir.infobulle'), x: 41, y: 92, l: 34, h: 56, visible: () => typeof sortieVisible === 'function' && sortieVisible() }, // prompt 69 : flèche du soir (soir.js)
];

// ——— Prompt 29 : interactions hors écran, dans la pièce ———
const CLE_LAMPE = 'pxe-nte001:jeu:lampe';
const PIECE = {
	lampe: (() => {
		try {
			return localStorage.getItem(CLE_LAMPE) !== 'eteinte';
		} catch (e) {
			return true;
		}
	})(),
	store: false, // store vénitien de la baie : baissé (true) ou relevé (false)
	message: null, // { texte, objet, jusqua }
};

/** Météo affichée (fenêtre, pluie, ambiances) — prompt 49 : elle suit le mode de jeu.
 * Partie en direct : API Open-Meteo chargée en direct. Semaine passée / hors ligne : données archivées du
 * jour joué, jamais la météo d'aujourd'hui. Hors partie (menu) : météo du moment, sinon l'instantané local. */
function meteoFenetre() {
	const enPartie = ecran === 'jeu' && Jeu.etat && Jeu.etat.mode;
	if (enPartie && Jeu.etat.mode !== 'direct') {
		const j = Jeu.jourCourant ? Jeu.jourCourant() : null;
		return j ? Jeu.meteoDuJour(j.date) : null;
	}
	return Jeu.meteoActuelle || (Jeu.fallback && Jeu.fallback.meteo && Jeu.fallback.meteo[0]) || null;
}
// En direct, la météo de l'API est rafraîchie toutes les 30 minutes (hors draw, jamais pendant une semaine passée)
setInterval(() => {
	if (ecran === 'jeu' && Jeu.etat && Jeu.etat.mode === 'direct' && !Confort.Reglages.horsLigneForce) Jeu.verifierConnexion();
}, 30 * 60 * 1000);
const nombreFr = (v) => (Langue.actuelle === 'fr' ? String(v).replace('.', ',') : String(v));

function interagirPiece(nom) {
	const hS = heureAffichee();
	const heure = String(hS.h).padStart(2, '0') + ':' + String(hS.m).padStart(2, '0');
	let texte;
	if (nom === 'lampe') {
		PIECE.lampe = !PIECE.lampe;
		try {
			localStorage.setItem(CLE_LAMPE, PIECE.lampe ? 'allumee' : 'eteinte');
		} catch (e) {}
		texte = t(PIECE.lampe ? 'piece.lampe.on' : 'piece.lampe.off');
	} else if (nom === 'fenetre') {
		PIECE.store = !PIECE.store;
		if (typeof revelerSource === 'function') revelerSource('meteo', false); // prompt 50 : regarder dehors
		const m = meteoFenetre();
		const maintenant = new Date();
		const reelle = String(maintenant.getHours()).padStart(2, '0') + ':' + String(maintenant.getMinutes()).padStart(2, '0');
		const meteo = m
			? t('piece.fenetre.meteo', { date: m.date ? m.date.split('-').reverse().join('/') : '', min: nombreFr(m.temp_min), max: nombreFr(m.temp_max), pluie: nombreFr(m.pluie_mm), vent: nombreFr(m.rafales_max) })
			: t('piece.fenetre.inconnue');
		// Prompt 49 : la source du climat suit le mode de jeu
		const sourceMeteo = !m ? '' : ecran === 'jeu' && Jeu.etat.mode && Jeu.etat.mode !== 'direct' ? t('meteo.source.archive') : t('meteo.source.direct');
		texte = t(PIECE.store ? 'piece.fenetre.ferme' : 'piece.fenetre.ouvre') + ' ' + (sourceMeteo ? meteo.replace(/\.$/, '') + sourceMeteo + '.' : meteo) + ' ' + t('piece.fenetre.heures', { reelle, jeu: heure });
	} else if (nom === 'plante') {
		const m = meteoFenetre();
		texte = m && m.pluie_mm >= 1 ? t('piece.plante.pluie', { pluie: nombreFr(m.pluie_mm) }) : t('piece.plante.sec', { heure });
	} else if (nom === 'tasse') {
		const j = ecran === 'jeu' && Jeu.jourCourant ? Jeu.jourCourant() : null;
		texte = j ? t('piece.tasse.jour', { heure, n: j.dossiers.length }) : t('piece.tasse.libre', { heure });
	} else if (nom === 'dossiers') {
		const j = ecran === 'jeu' && Jeu.jourCourant ? Jeu.jourCourant() : null;
		texte = j ? t('piece.dossiers.jour', { n: j.dossiers.length, date: j.date.split('-').reverse().join('/') }) : t('piece.dossiers.libre');
	}
	PIECE.message = { texte, objet: nom, jusqua: millis() + 5000 };
	dernierRenduBureau = 0; // la pièce est redessinée tout de suite (lampe, store)
	annoncer(texte);
	Confort.Son.bip('choix');
}

function interaction() {
	inactifDepuis = millis();
}

// ——— Journées et horloge simulée (§ 3) ———
function demarrerJournee() {
	ecran = 'jeu';
	enPause = false;
	phase = 'attente';
	enSieste = false;
	reveil = null;
	interaction();
	annoncerJournee(); // prompt 43 : écran noir « JOUR n — SEMAINE n »
	demarrageDuJour(); // prompt 71 : le PC redémarre les 3 premiers jours
	filDebutJournee(); // prompt 74 : objectif du jour et bilan de la veille, avant le premier signalement
}

// ——— Prompt 43 : transition entre journées — fond noir, « JOUR n — SEMAINE n » et la date, centrés ———
const DUREE_TRANSITION_JOUR = 2800;
let TRANSITION_JOUR = null; // { debut, jour, semaine, date }
let derniereJourneeAnnoncee = '';
function annoncerJournee() {
	const j = Jeu.jourCourant ? Jeu.jourCourant() : null;
	if (!j) return;
	const cle = (Jeu.etat.semaine ? Jeu.etat.semaine.lundi : Jeu.etat.mode) + '|' + Jeu.jourIndex;
	if (cle === derniereJourneeAnnoncee) return; // pas deux fois pour la même journée (intro SMS)
	derniereJourneeAnnoncee = cle;
	TRANSITION_JOUR = { debut: millis(), jour: Jeu.jourIndex + 1, semaine: typeof chapitreCourant === 'function' ? chapitreCourant() : 0, date: j.date };
	annoncer(texteTransitionJour() + ' — ' + dateLongue(j.date));
}
function texteTransitionJour() {
	const T0 = TRANSITION_JOUR;
	return T0.semaine ? t('transition.jour', { j: T0.jour, s: T0.semaine }) : t('transition.jourDirect', { j: T0.jour });
}
function resteTransitionJour() {
	return TRANSITION_JOUR ? Math.max(0, DUREE_TRANSITION_JOUR - (millis() - TRANSITION_JOUR.debut)) : 0;
}
function passerTransitionJour() {
	TRANSITION_JOUR = null;
}
function dessinerTransitionJour() {
	if (!TRANSITION_JOUR) return false;
	const u = millis() - TRANSITION_JOUR.debut;
	if (u >= DUREE_TRANSITION_JOUR) return (TRANSITION_JOUR = null), false;
	const a = reduireAnimations ? 1 : u < 300 ? u / 300 : u > DUREE_TRANSITION_JOUR - 500 ? (DUREE_TRANSITION_JOUR - u) / 500 : 1;
	boutons = [{ x: 0, y: 0, l: L, h: H, action: passerTransitionJour }];
	noStroke();
	fill(0, 0, 0, 255 * a);
	rect(0, 0, L, H);
	if (a > 0.6) {
		dsTitre(texteTransitionJour(), L / 2, H / 2 - 60, 72, '#ffffff', 'center');
		noStroke();
		textAlign(CENTER, TOP);
		textFont(POLICE_TEXTE);
		textSize(26);
		fill('rgba(255,255,255,0.75)');
		text(dateLongue(TRANSITION_JOUR.date), L / 2, H / 2 + 40);
	}
	return true;
}

function heureAffichee() {
	// Partie en cours : heure simulée ; sinon (et en mode « aujourd'hui ») : heure réelle
	if (ecran === 'jeu' && Jeu.horloge && Jeu.etat.mode !== 'direct' && phase !== 'fin') {
		const m = Math.floor(Jeu.horloge.minutes);
		return { h: Math.floor(m / 60) % 24, m: m % 60, simulee: true };
	}
	const d = new Date();
	return { h: d.getHours(), m: d.getMinutes(), simulee: false };
}

/** Le temps de jeu est-il arrêté ? (fin, mail, soir, démarrage du PC, SMS, pause, tutoriel, transition, fenêtres) */
function tempsSuspendu() {
	return ecran !== 'jeu' || !Jeu.horloge || phase === 'fin' || phase === 'mail' || phase === 'soir' || pcDemarre() || smsActif || enPause || tutoriel || TRANSITION_JOUR || mecaniquesSuspendentTemps() || fenetre === 'poste'; // prompt 74 : explication du poste
}
function tempsCompresse() {
	return ecran === 'jeu' && (phase === 'attente' || phase === 'reveil') && !tempsSuspendu(); // « ×100 » seulement quand le temps file vraiment
}

function avancerTemps() {
	const maintenant = millis();
	const dt = derniereImage ? Math.min(250, maintenant - derniereImage) : 0;
	derniereImage = maintenant;
	if (tempsSuspendu()) return; // prompt 34 / 43 : tutoriel et transition suspendent le temps
	const vitesse = IMMERSION.minutesParSeconde * (tempsCompresse() ? IMMERSION.compression : 1); // prompt 78 : la sieste fait passer le temps ×100 (phase attente)
	const avant = Jeu.horloge.minutes;
	Jeu.horloge.minutes += (dt / 1000) * vitesse;
	// Prompt 78 : l'horloge ne dépasse pas la fin de journée tant que des signalements restent (sieste ×100)
	if (Jeu.etat.mode !== 'direct' && Jeu.horloge.minutes > Jeu.finJournee()) Jeu.horloge.minutes = Math.max(avant, Jeu.finJournee());
	majSomnolence(dt, Jeu.horloge.minutes - avant); // prompt 78 : la somnolence monte avec le temps de jeu et l'inactivité
	if (Jeu.majSuivis && Jeu.majSuivis()) Confort.Son.bip('choix'); // prompt 63 : une réaction arrive sur Community

	if (phase === 'attente') {
		// Prompt 78 : plus de sieste après 20 s d'inactivité — elle tombe quand la somnolence est pleine (sieste.js)
		const prochain = Jeu.prochainDuJour();
		if (prochain && Jeu.horloge.minutes >= prochain.minute) arriveeIncident();
		else if (!prochain && Jeu.horloge.minutes >= Jeu.finJournee()) finJourneeAtteinte(); // prompt 51 : l'horloge s'arrête, le joueur clique dessus pour partir (journee.js)
	} else if (phase === 'reveil' && reveil && maintenant > reveil.limite) {
		rateReveil();
	}
}

function arriveeIncident() {
	if (enSieste) {
		// Prompt 78 : pendant la sieste, les signalements s'accumulent dans la liste ; seul un signalement de gravité
		// élevée déclenche le réveil d'urgence — triple bip, puis fenêtre de réaction 3 / 2 / 1 s selon le compteur
		const urgent = signalementUrgentPendantSieste();
		if (!urgent) return;
		const c = (Jeu.etat.semaine && Jeu.etat.semaine.difficulte && Jeu.etat.semaine.difficulte.compteur_s) || 30;
		phase = 'reveil';
		reveil = { limite: millis() + (IMMERSION.fenetreReveilMs[c] || 2000), d: urgent };
		Confort.Son.bip('alerte');
		setTimeout(() => Confort.Son.bip('alerte'), 180);
		setTimeout(() => Confort.Son.bip('alerte'), 360);
		return;
	}
	entrerSelection(); // prompts 68 / 73 : un signalement dans la liste ; le compteur démarre quand le joueur le prend
}

function seReveiller() {
	if (phase !== 'reveil') return;
	phase = 'attente';
	reveiller(); // prompt 78 : bilan de la sieste, puis la liste des signalements
}

/** Réveil d'urgence raté : le signalement urgent est réglé « non traité » (Q25) + malus de sieste ; on dort encore */
function rateReveil() {
	const d = reveil && reveil.d;
	reveil = null;
	phase = 'attente';
	if (d && Jeu.paquet.indexOf(d) >= Jeu.index) expirerEnFond(d, !actifDe(d)); // malus de sieste appliqué par siesteExpiration
	// Prompt 62 : pas d'interaction() ici — le joueur n'a rien fait
}

/** Après la narration d'une décision : incident suivant de la journée, ou attente de la fin de journée */
function apresDecision() {
	phase = 'attente';
	filApresDecision(); // prompt 74 : texte de liaison (météo, agenda, radio) tiré des données réelles
	reprendreActif(); // prompt 77 : un autre signalement actif attend — on le reprend (le plus urgent)
	// Prompt 62 : plus d'interaction() ici. Après un compteur à 0, la suite est automatique : elle remettait
	// l'inactivité à zéro et un joueur absent ne s'endormait jamais. Ses vrais gestes (clic, touche) le font.
}

function journeeSuivante() {
	if (Jeu.terminee || !Jeu.jours[Jeu.jourIndex + 1]) return allerFin();
	Jeu.journeeSuivante();
	demarrerJournee();
	Sauvegarde.auto(false); // prompt 33
}

function allerFin() {
	phase = 'fin';
	Sauvegarde.auto(false); // prompt 33 : partie finie → sa sauvegarde est effacée (le meilleur bilan reste)
	const cle = Confort.Bilans.cle(Jeu.etat);
	const g = Jeu.profilPartie(); // prompt 47 : profil de gestion gardé au palmarès
	// Une démission n'entre pas au palmarès (prompt 47)
	if (!Jeu.demission && Jeu.appliquerDefis) Jeu.appliquerDefis(); // prompt 55/56 : semaine finie sans soirée (départ le dernier jour) → bonus quand même, une fois
	const defisTenus = Jeu.defisAppliques ? Jeu.defisAppliques.filter((r) => r.tenu).length + '/' + Jeu.defisAppliques.length : null;
	bilanFin = Jeu.demission ? { meilleur: Confort.Bilans.meilleur(cle), record: false } : Confort.Bilans.enregistrer(cle, Jeu.score(), Jeu.jauges, { profil: g ? g.id : null, defis: defisTenus }); // Q19 ; prompt 56 : défis tenus au palmarès
	Confort.Son.bip('fin');
	finDeSemaine(); // prompt 41 : rapport papier sur la table, ou cinématique après la semaine 3
}

// ——— Incidents importants : bordures rouges (§ 5) ———
function incidentImportant() {
	if (ecran !== 'jeu' || !['decision', 'contradiction', 'conflit', 'reveil'].includes(phase)) return false;
	const d = phase === 'reveil' ? Jeu.prochainDuJour() : Jeu.dossierCourant();
	return !!d && ((d.retard !== null && d.retard !== undefined && d.retard >= IMMERSION.retardImportant) || phase === 'conflit');
}
function incidentActif() {
	return ecran === 'jeu' && ['decision', 'contradiction', 'conflit', 'reveil', 'selection'].includes(phase); // prompt 68 : + signalement en attente
}
/** Opacité de la pulsation (0..1) : 1,5 pulsation/s, fixe si animations réduites */
function pulsationRouge() {
	if (reduireAnimations) return 1;
	return 0.55 + 0.45 * Math.sin((millis() / 1000) * Math.PI * 2 * IMMERSION.pulsationsParSeconde);
}
/** Contour d'alerte DANS l'écran du PC : le trait est entièrement à l'intérieur du rectangle (x, y, l, h) */
function bordureRouge(x, y, l, h, epaisseur) {
	const e = epaisseur / 2;
	noFill();
	stroke(209, 11, 0, 255 * pulsationRouge()); // Error Primary du Pixel DS
	strokeWeight(epaisseur);
	rect(x + e, y + e, l - epaisseur, h - epaisseur);
	noStroke();
}

// ——— Panneau « attente » (aucun incident actif) ———
function dessinerAttente() {
	const z = { x: DROITE.x, y: DROITE.y + 130, l: DROITE.l, h: DROITE.h - 130 };
	panneau(z.x, z.y, z.l, z.h);
	const hA = heureAffichee();
	textAlign(LEFT, TOP);
	noStroke();
	fill(C.gris);
	textFont(POLICE_DONNEES);
	textSize(18);
	const j = Jeu.jourCourant();
	text(t('surv.titre', { date: j ? dateLongue(j.date).toUpperCase() : '' }), z.x + 32, z.y + 32);
	fill(C.texte);
	textFont(POLICE_DONNEES);
	textStyle(BOLD);
	textSize(110);
	text(String(hA.h).padStart(2, '0') + ':' + String(hA.m).padStart(2, '0'), z.x + 32, z.y + 80);
	textStyle(NORMAL);
	textSize(26);
	fill(C.accent);
	if (tempsCompresse()) text(t('surv.accelere', { x: IMMERSION.compression }), z.x + 36, z.y + 210);
	textFont(POLICE_TEXTE);
	textSize(26);
	fill(C.texte);
	const prochain = Jeu.prochainDuJour();
	text(prochain ? t('surv.calme') : t('surv.fin', { heure: Jeu.formaterHeure(Jeu.finJournee()) }), z.x + 32, z.y + 270, z.l - 64, 90);
	textSize(20);
	fill(C.gris);
	const restants = Jeu.paquet.length - Jeu.index;
	text(t('surv.restants', { n: restants, total: Jeu.paquet.length, j: Jeu.jourIndex + 1, jours: Jeu.jours.length }), z.x + 32, z.y + 380, z.l - 64, 80);
	if (enSieste) {
		fill(C.orange);
		textSize(22);
		text(t('surv.sieste'), z.x + 32, z.y + 440);
	}
	// Prompt 74 : objectif du jour avec sa règle, puis le fil de la journée (objectif, bilan, liaisons, rythme)
	const o = Jeu.objectifDuJour ? Jeu.objectifDuJour() : null;
	if (o) {
		fill(255, 255, 255, 13);
		rect(z.x + 32, z.y + 484, z.l - 64, 92);
		fill(C.accent);
		rect(z.x + 32, z.y + 484, 4, 92);
		textFont(POLICE_TEXTE);
		textSize(19);
		textLeading(26);
		fill(C.texte);
		text(t('fil.objectifRegle', { libelle: String(o.libelle), v: Math.round(Jeu.jauges[o.jauge]) }), z.x + 48, z.y + 494, z.l - 96, 78);
	}
	dessinerFil(z.x + 32, z.y + 598, z.l - 64, z.h - 618);
}

// ——— Mail de fin de journée (§ 6), affiché dans l'écran du PC ———
let mailCalcule = null;
function dessinerMail() {
	// Messagerie du PC — Pixel Design System (fond noir, angles droits, titres pixel, bouton primaire rouge)
	if (!mailCalcule || mailCalcule.jour !== Jeu.jourIndex) mailCalcule = Object.assign(Jeu.mailDuJour(), { jour: Jeu.jourIndex });
	const m = mailCalcule;
	const x = 140;
	const y = 90;
	const l = L - 280;
	const h = H - 180;
	noStroke();
	fill(13, 12, 12, 200);
	rect(0, 0, L, H);
	dsPanneau(x, y, l, h, t('mailf.titre'), m.positif ? 'rgba(0,251,116,0.12)' : 'rgba(212,3,28,0.25)');
	dsBadge(x + l - 120, y + 30, t('mailf.nouveau'), m.positif ? 'succes' : 'erreur');
	dsTexte(t('mailf.de', { de: m.de }), x + 32, y + 84, 20, DS.blanc50, 'left');
	dsTexte(t('mailf.a'), x + 32, y + 114, 20, DS.blanc50, 'left');
	dsTitre(String(m.objet).toUpperCase(), x + 32, y + 156, 28, DS.blanc, 'left');
	let ty = y + 220;
	m.lignes.forEach((ligne) => {
		const estFait = !!ligne.fait;
		const ok = !!ligne.ok;
		if (estFait) {
			noStroke();
			fill(ok ? DS.succes : DS.primaire);
			rect(x + 32, ty + 4, 6, 22);
		}
		dsTexte(ligne, x + (estFait ? 50 : 32), ty, estFait ? 19 : 21, estFait ? (ok ? DS.succesClair : DS.erreurClair) : DS.blanc, 'left', l - 100);
		textFont(DS.policeTexte);
		textSize(estFait ? 19 : 21);
		ty += textWidth(ligne) > l - 110 ? 60 : 36;
	});
	dsTexte(t('mailf.signature'), x + 32, Math.min(ty + 10, y + h - 150), 20, DS.blanc50, 'left');
	dsBouton(x + l - 420, y + h - 96, 388, 64, t('soir.ranger'), rangerPoste, 'primaire'); // prompt 69 : la sortie du bureau mène au lendemain (ou au bilan)
}

// ——— Intro SMS (§ 2) ———
function lancerIntroSMS() {
	// Prompt 42 : le joueur saisit son téléphone ; la conversation avec Camille se lit dessus
	lancerConversation({ contact: T('sms.camille'), sous: T('intro.salle'), messages: SMS, auFin: terminerIntro });
}
function terminerIntro() {
	smsActif = false;
	introVue = true;
	demarrerJournee();
	vue = 'bureau'; // on arrive au bureau : l'ouverture est à 8 h (prompt 76)
	if (!tutorielVu() && !GUIDE.actif) lancerTutoriel(); // prompt 34 : à la première partie, juste après les SMS (sauf guide)
}

// =====================================================================
// Prompt 34 — vrai tutoriel guidé (5 étapes), superposé à l'écran ; le temps du jeu est suspendu.
// Relancé depuis le livre « Aide » et l'aide (T). « Tutoriel vu » persiste dans localStorage.
// =====================================================================
const CLE_TUTORIEL = 'pxe-nte001-tutoriel-vu';
const ETAPES_TUTORIEL = 6; // prompt 78 : + « Le jour et la sieste »
let tutoriel = null; // { etape, focus: 'suivant' | 'passer' }
function tutorielVu() {
	try {
		return localStorage.getItem(CLE_TUTORIEL) === 'oui';
	} catch (e) {
		return false;
	}
}
function lancerTutoriel() {
	fenetre = null;
	tutoriel = { etape: 0, focus: 'suivant', tourne: 0, sens: 1 };
	livreOuverture = millis();
	annoncerEtapeTutoriel();
}
function annoncerEtapeTutoriel() {
	const n = tutoriel.etape + 1;
	annoncer(t('tuto.etape', { n, total: ETAPES_TUTORIEL }) + ' — ' + t('tuto.' + n + '.titre') + '. ' + t('tuto.' + n + '.texte'));
}
function fermerTutoriel() {
	tutoriel = null;
	try {
		localStorage.setItem(CLE_TUTORIEL, 'oui');
	} catch (e) {}
	interaction();
}
function etapeSuivante() {
	if (!tutoriel) return;
	if (tutoriel.etape >= ETAPES_TUTORIEL - 1) return fermerTutoriel();
	tutoriel.etape++;
	tutoriel.tourne = millis(); // la page tourne vers la gauche
	tutoriel.sens = 1;
	tutoriel.focus = 'suivant';
	Confort.Son.bip('choix');
	annoncerEtapeTutoriel();
}
function etapePrecedente() {
	if (!tutoriel || tutoriel.etape === 0) return;
	tutoriel.etape--;
	tutoriel.tourne = millis();
	tutoriel.sens = -1;
	annoncerEtapeTutoriel();
}
function dessinerTutoriel() {
	if (!tutoriel) return;
	boutons = []; // seul le tutoriel est cliquable
	voile();
	const n = tutoriel.etape + 1;
	// Le tutoriel est le livre « Aide » ouvert : couverture marine, page gauche = étape, page droite = texte
	const livre = dessinerLivreOuvert(L / 2 - 680, 120, 1360, 700, '#1c2f52', '#121f38');
	if (livre.pret) {
		const g = livre.gauche;
		const d = livre.droite;
		noStroke();
		textAlign(LEFT, TOP);
		textFont(POLICE_DONNEES);
		textSize(20);
		fill('#6b5d45');
		text(t('tuto.etape', { n, total: ETAPES_TUTORIEL }), g.x, g.y);
		for (let i = 0; i < ETAPES_TUTORIEL; i++) {
			fill(i <= tutoriel.etape ? '#1c2f52' : '#d9cfb8');
			rect(g.x + i * 30, g.y + 40, 20, 8, 4);
		}
		fill('#1c2f52');
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textSize(46);
		textLeading(56);
		text(t('tuto.' + n + '.titre'), g.x, g.y + 90, g.l, 200);
		textStyle(NORMAL);
		textSize(19);
		fill('#6b5d45');
		text(t('tuto.pied'), g.x, g.y + g.h - 60, g.l, 60);
		fill('#1c2733');
		textSize(23);
		textLeading(34);
		text(t('tuto.' + n + '.texte'), d.x, d.y, d.l, d.h);
		textLeading(30);
		pageQuiTourne(livre, tutoriel.tourne, tutoriel.sens);
	}
	// Boutons sous le livre
	const by = 120 + 700 + 40;
	const lb = 300;
	const derniere = n === ETAPES_TUTORIEL;
	const pos = { passer: L / 2 - 680, precedent: L / 2 - 680 + 320, suivant: L / 2 + 680 - lb };
	bouton(pos.suivant, by, lb, 68, t(derniere ? 'tuto.terminer' : 'tuto.suivant'), etapeSuivante);
	bouton(pos.passer, by, lb, 68, t('tuto.passer'), fermerTutoriel, false, true);
	if (tutoriel.etape > 0) bouton(pos.precedent, by, lb, 68, t('tuto.precedent'), etapePrecedente, false, true);
	noFill();
	stroke('#f2c94c');
	strokeWeight(4);
	rect(pos[tutoriel.focus] - 8, by - 8, lb + 16, 84, 14);
	noStroke();
}

/** Clavier du tutoriel : Entrée = bouton focalisé, → suivant, ← précédent, Tab = focus, Échap = passer */
function toucheTutoriel() {
	if (!tutoriel) return false;
	const ordre = tutoriel.etape > 0 ? ['suivant', 'passer', 'precedent'] : ['suivant', 'passer'];
	if (keyCode === TAB) {
		const i = ordre.indexOf(tutoriel.focus);
		tutoriel.focus = ordre[(i + (keyIsDown(SHIFT) ? ordre.length - 1 : 1)) % ordre.length];
		annoncer(t('tuto.' + tutoriel.focus));
	} else if (keyCode === ESCAPE) fermerTutoriel();
	else if (keyCode === RIGHT_ARROW) etapeSuivante();
	else if (keyCode === LEFT_ARROW) etapePrecedente();
	else if (keyCode === ENTER || keyCode === RETURN || key === ' ') {
		if (tutoriel.focus === 'passer') fermerTutoriel();
		else if (tutoriel.focus === 'precedent') etapePrecedente();
		else etapeSuivante();
	}
	return true;
}

function dessinerSMS() {
	// Prompt 42 : plus d'écran plein : le téléphone tenu en main, devant la pièce
	dessinerTelephoneEnMain(contenuConversation);
}

// ——— Fenêtres du bureau : menu Échap (§ 1) et livre « stress » (§ 7) ———
// Prompt 35 : menu Échap modernisé (même style que le menu principal)
let choixPause = 0;
const ENTREES_PAUSE = [
	{ cle: 'menu.reprendre', icone: 'lecture', action: () => fermer() },
	{ cle: 'accueil.parametres', icone: 'reglages', action: () => (fenetre = 'parametres') },
	{ cle: 'accueil.aide', icone: 'aide', action: () => (fenetre = 'aide') },
	{ cle: 'menu.carnet', icone: 'carnet', action: () => (fermer(), ouvrirCarnet()) }, // prompt 47 : journal de bord (J)
	{ cle: 'menu.menuPrincipal', icone: 'menu', action: () => quitterPartie() },
];
function fenetreMenu() {
	const l = 700;
	const h = 200 + ENTREES_PAUSE.length * 112;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	noStroke();
	fill(13, 12, 12, 245);
	stroke(255, 255, 255, 38);
	strokeWeight(2);
	rect(x, y, l, h);
	noStroke();
	dsTitre(t('menu.titre'), x + 48, y + 40, 44, '#ffffff', 'left');
	noStroke();
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textSize(19);
	fill('rgba(255,255,255,0.78)');
	text(t('menu.temps'), x + 48, y + 104);
	ENTREES_PAUSE.forEach((e, i) => carteMenu(x + 48, y + 160 + i * 112, l - 96, 88, t(e.cle), null, e.action, i === choixPause, e.icone));
}

function quitterPartie() {
	if (ecran === 'jeu') Sauvegarde.auto(false); // prompt 35 : on retrouve la partie avec « Reprendre »
	fenetre = null;
	enSieste = false;
	reveil = null;
	retourAccueil();
}

function fenetreLivreStress() {
	// Le livre « Bien gérer son stress » s'ouvre : couverture verte, deux pages
	const livre = dessinerLivreOuvert(L / 2 - 680, 110, 1360, 720, '#3f7a43', '#2f5d3a');
	if (livre.pret) {
		const g = livre.gauche;
		const d = livre.droite;
		noStroke();
		textAlign(LEFT, TOP);
		fill('#2f5d3a');
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textSize(40);
		textLeading(50);
		text(LIVRE_STRESS[0], g.x, g.y, g.l, 120);
		textStyle(NORMAL);
		textSize(23);
		textLeading(32);
		fill('#1c2733');
		let ty = g.y + 150;
		LIVRE_STRESS.slice(1, 3).forEach((p) => {
			text(p, g.x, ty, g.l, 180);
			ty += 190;
		});
		ty = d.y;
		LIVRE_STRESS.slice(3).forEach((p) => {
			text(p, d.x, ty, d.l, 180);
			ty += 190;
		});
	}
	bouton(L / 2 + 680 - 260, 110 + 720 + 40, 260, 64, t('commun.fermer'), fermer);
}

// ——— Overlay de réveil (§ 4) ———
function dessinerReveil() {
	const reste = Math.max(0, reveil.limite - millis());
	voile();
	const l = 720;
	const h = 300;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.rouge);
	textAlign(CENTER, TOP);
	noStroke();
	fill(C.rouge);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(40);
	text(t('reveil.titre'), L / 2, y + 36);
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	textSize(22);
	fill(C.texte);
	text(t('reveil.reste', { s: (reste / 1000).toFixed(1).replace('.', Langue.actuelle === 'fr' ? ',' : '.') }), L / 2, y + 98);
	bouton(x + 120, y + 160, l - 240, 90, t('reveil.bouton'), seReveiller);
}

// ——— Personnage qui somnole au bureau (§ 4), en pixel art ———
function dessinerPersonnageSieste(g) {
	// Les paupières ne sont plus dessinées dans la pièce : voir dessinerSommeil (surcouche plein écran)
}

// ——— Sieste : paupières en surcouche plein écran, au-dessus de tout le contenu ———
// Fermeture (1,8 s) : les paupières tombent, le joueur lutte (elles se relèvent un peu), puis se ferment
// entièrement — plus rien du bureau, du PC ni de l'interface n'est visible. Ouverture (1 s) : les yeux
// s'entrouvrent, un clignement, puis s'ouvrent. Animations réduites : fondu au noir (0,4 s), sans mouvement.
const SOMMEIL = { k: 0, de: 0, vers: 0, debut: 0 };
const DUREE_FERMETURE_SIESTE = 1800;
const DUREE_OUVERTURE_SIESTE = 1000;
const DUREE_FONDU_SIESTE = 400;
const lisse = (a, b, u) => a + (b - a) * (u * u * (3 - 2 * u));
/** Profil de fermeture f(u), 0 → 1 : chute, sursaut, fermeture */
function profilFermeture(u) {
	if (u < 0.3) return lisse(0, 0.55, u / 0.3);
	if (u < 0.45) return lisse(0.55, 0.38, (u - 0.3) / 0.15);
	return lisse(0.38, 1, (u - 0.45) / 0.55);
}
/** Profil d'ouverture g(u), 1 → 0 : entrouverture, clignement, ouverture */
function profilOuverture(u) {
	if (u < 0.35) return lisse(1, 0.45, u / 0.35);
	if (u < 0.5) return lisse(0.45, 0.8, (u - 0.35) / 0.15);
	return lisse(0.8, 0, (u - 0.5) / 0.5);
}
function majSommeil() {
	const cible = ecran === 'jeu' && enSieste ? 1 : 0;
	const m = millis();
	if (cible !== SOMMEIL.vers) {
		SOMMEIL.de = SOMMEIL.k; // une animation interrompue repart de l'état courant
		SOMMEIL.vers = cible;
		SOMMEIL.debut = m;
	}
	const duree = reduireAnimations ? DUREE_FONDU_SIESTE : cible ? DUREE_FERMETURE_SIESTE : DUREE_OUVERTURE_SIESTE;
	const u = constrain((m - SOMMEIL.debut) / duree, 0, 1);
	if (reduireAnimations) SOMMEIL.k = SOMMEIL.de + (cible - SOMMEIL.de) * u;
	else if (cible) SOMMEIL.k = SOMMEIL.de + (1 - SOMMEIL.de) * profilFermeture(u);
	else SOMMEIL.k = SOMMEIL.de * profilOuverture(u);
	if (u >= 1) SOMMEIL.k = cible;
	return SOMMEIL.k;
}
/** Hauteur (px) de la paupière en x, pour un niveau k : bord bombé, pas de 8 px ; k = 1 couvre tout */
function hauteurPaupiere(x, k, hauteur, largeur) {
	const d = (x - largeur / 2) / (largeur / 2);
	const coins = 0.32 * hauteur * Math.sin(Math.PI * k) * d * d; // en amande : les coins se ferment avant le centre
	const h = k * (hauteur / 2 + 16) + coins;
	return Math.min(hauteur / 2 + 16, Math.ceil(h / 8) * 8);
}
/** Dessine les paupières sur un contexte 2D (canevas principal ou portrait) */
function paupieres(ctx, k, largeur, hauteur) {
	if (k <= 0.001) return;
	if (reduireAnimations) {
		ctx.fillStyle = 'rgba(10,8,7,' + Math.min(1, k).toFixed(3) + ')';
		ctx.fillRect(0, 0, largeur, hauteur);
		return;
	}
	const pas = 32;
	for (let x = 0; x < largeur; x += pas) {
		const h = hauteurPaupiere(x + pas / 2, k, hauteur, largeur);
		ctx.fillStyle = '#120c0a';
		ctx.fillRect(x, 0, pas, h);
		ctx.fillRect(x, hauteur - h, pas, h);
		if (h < hauteur / 2) {
			ctx.fillStyle = '#3a2a22'; // bord de paupière
			ctx.fillRect(x, h - 8, pas, 8);
			ctx.fillRect(x, hauteur - h, pas, 8);
			ctx.fillStyle = '#0a0605'; // cils
			ctx.fillRect(x + 6, h, 4, 8);
			ctx.fillRect(x + 20, h, 4, 6);
			ctx.fillRect(x + 6, hauteur - h - 6, 4, 6);
		}
	}
}
/** Surcouche de sieste sur le canevas principal (appelée dans draw, au-dessus du contenu) */
function dessinerSommeil() {
	const k = majSommeil();
	if (k <= 0.001) return;
	paupieres(drawingContext, k, L, H);
	if (k > 0.5 && phase !== 'reveil') boutons = []; // yeux fermés : rien de caché n'est cliquable (sauf « Se réveiller »)
	if (k >= 0.999) {
		// Yeux fermés : « Z » qui montent doucement, et une ligne pour comprendre ce qui se passe
		const n = reduireAnimations ? 3 : 1 + (Math.floor(millis() / 600) % 3);
		noStroke();
		for (let i = 0; i < n; i++) dsTitre('Z', L / 2 + 30 + i * 46, H / 2 - 40 - i * 52, 40 + i * 12, '#f7f1e1', 'center');
		textAlign(CENTER, TOP);
		textFont(POLICE_TEXTE);
		textSize(22);
		fill('rgba(255,255,255,0.75)');
		text(t(SOMNO.forcee ? 'sieste.forcee' : 'surv.sieste'), L / 2, H / 2 + 70);
		textAlign(LEFT, TOP);
		// Prompt 78 : se réveiller (Espace, Entrée, Z ou clic) — le temps file ×100 tant qu'on dort
		if (phase !== 'reveil') bouton(L / 2 - 200, H / 2 + 130, 400, 72, t('sieste.reveiller'), reveiller);
	}
}

// ——— Livres posés sur le plateau (§ 7) : placeholder pixel art (dos + titre) ———
function dessinerLivres(g) {
	const t = OBJETS_BUREAU[1];
	const s = OBJETS_BUREAU[2];
	const tps = reduireAnimations ? 0 : millis();
	// Livre survolé ou focalisé : il se soulève de 2 px (ombre dessous) ; animations réduites : 1 px, sans transition
	const leve = (o) => (vue === 'bureau' && objetSurvol === o.nom ? (reduireAnimations ? 1 : 2) : 0);
	const lc = leve(t);
	const ls = leve(s);
	ombreObjet(g, t.x, t.y + t.h, t.l + lc); // prompt 51 : ombre portée des livres (même trame que le téléphone)
	// Livre « Aide » (dessous, prompt 70 : ex-« Commande ») : couverture marine, liseré doré, marque-page qui se balance
	const yc = t.y - lc;
	boite(g, t.x, yc, t.l, t.h, '#1c2f52', '#34507f', '#121f38');
	px(g, '#d9b45a', t.x + 2, yc + 1, 1, t.h - 2);
	textePixel(g, 'AIDE', t.x + 18, yc + 2, '#fff8e6'); // prompt 70 : titre centré sur la couverture
	const balance = Math.round(Math.sin(tps / 650) * 1);
	px(g, '#b3261e', t.x + t.l - 8 + balance, yc + t.h, 2, 4);
	// Livre « stress » (dessus)
	if (ls) ombreTramee(g, s.x, s.y + s.h - lc, s.l, 1, 90); // livre du dessus soulevé : ombre sur l'autre livre
	const ys = s.y - ls - lc; // posé sur l'autre : il suit aussi le soulèvement du livre du dessous
	boite(g, s.x, ys, s.l, s.h, '#3f7a43', '#5f9e4f', '#2f5d3a');
	textePixel(g, 'STRESS', s.x + 10, ys + 2, '#f7f1e1');
}

// ——— Livres : soulevés au survol, ouverts en vrai livre (deux pages) quand on les clique ———
let objetSurvol = null; // objet survolé ou focalisé à l'image précédente
let livreOuverture = 0; // millis() de l'ouverture du livre affiché
const DUREE_OUVERTURE_LIVRE = 450;
const DUREE_PAGE = 380;

/** Dessine un livre ouvert (couverture, deux pages, dos, tranches, marque-page) ; s'ouvre depuis le dos.
 *  Renvoie les zones de texte des deux pages et « pret » quand l'ouverture est assez avancée pour écrire. */
function dessinerLivreOuvert(x, y, l, h, couv, couvSombre) {
	const k = reduireAnimations ? 1 : easeOut(constrain((millis() - livreOuverture) / DUREE_OUVERTURE_LIVRE, 0, 1));
	const cx = x + l / 2;
	const demi = (l / 2) * Math.max(0.04, k);
	noStroke();
	fill(0, 0, 0, 70);
	rect(cx - demi + 14, y + 22, demi * 2, h, 14); // ombre portée
	fill(couvSombre);
	rect(cx - demi - 6, y - 6, demi * 2 + 12, h + 16, 12); // couverture
	fill(couv);
	rect(cx - demi, y - 10, demi * 2, h + 12, 10);
	// Tranches (feuilles empilées) puis pages
	for (let i = 3; i >= 1; i--) {
		fill(i % 2 ? '#e8dfc9' : '#f3ecda');
		rect(cx - demi + 12 + i * 2, y + 8 + i * 3, demi * 2 - 24 - i * 4, h - 22, 4);
	}
	fill('#fbf6ea');
	rect(cx - demi + 12, y + 6, demi - 12, h - 20, 6, 0, 0, 6);
	rect(cx, y + 6, demi - 12, h - 20, 0, 6, 6, 0);
	// Creux du dos : ombre douce au centre
	for (let i = 0; i < 6; i++) {
		fill(80, 60, 30, 26 - i * 4);
		rect(cx - 18 + i * 3, y + 6, 36 - i * 6, h - 20);
	}
	// Marque-page (ruban) qui dépasse en bas de la page droite
	fill('#b3261e');
	rect(cx + demi * 0.55, y + h - 20, 14, 46);
	triangle(cx + demi * 0.55, y + h + 26, cx + demi * 0.55 + 14, y + h + 26, cx + demi * 0.55 + 7, y + h + 16);
	const marge = 64;
	return {
		pret: k > 0.85,
		k,
		cx,
		y,
		h,
		demi,
		gauche: { x: cx - demi + 12 + marge, y: y + 60, l: demi - 12 - marge * 2, h: h - 140 },
		droite: { x: cx + marge, y: y + 60, l: demi - 12 - marge * 2, h: h - 140 },
	};
}

/** Une page qui tourne (vers la gauche si sens = 1) : la feuille se replie sur le dos puis retombe de l'autre côté */
function pageQuiTourne(livre, debut, sens) {
	if (reduireAnimations || !debut) return;
	const u = (millis() - debut) / DUREE_PAGE;
	if (u >= 1) return;
	const largeur = (livre.demi - 12) * Math.abs(1 - 2 * u); // 1 → 0 → 1
	const premiereMoitie = u < 0.5;
	const aDroite = sens > 0 ? premiereMoitie : !premiereMoitie;
	noStroke();
	fill(80, 60, 30, 40);
	rect(aDroite ? livre.cx : livre.cx - largeur - 8, livre.y + 6, largeur + 8, livre.h - 20); // ombre de la feuille
	fill('#fbf6ea');
	rect(aDroite ? livre.cx : livre.cx - largeur, livre.y + 6, largeur, livre.h - 20);
}

function ouvrirObjetBureau(nom) {
	interaction();
	if (nom === 'ecran') return sAsseoir();
	if (nom === 'sortie') return quitterBureau(); // prompt 69
	if (nom === 'rapport') return ouvrirRapport(); // prompt 41
	if (nom === 'telephone') return ouvrirTelephone(); // prompt 38 : notifications de l'Agenda Nantes Métropole
	if (nom === 'aide') return lancerTutoriel(); // prompt 34 / 70 : le livre « Aide » ouvre le tutoriel
	if (nom === 'stress') return (livreOuverture = millis()), ouvrir('livre-stress');
	if (nom === 'horloge') return clicHorloge(); // prompt 51
	if (nom === 'tasse') return boireCafe(); // prompt 52 : le café en main, puis le boost
	if (nom === 'micro') return clicMicro(); // prompt 54 : push-to-talk
	if (nom === 'webcam') return clicWebcam(); // prompt 57 : présence
	if (OBJETS_BUREAU.some((o) => o.nom === nom && o.piece)) return interagirPiece(nom); // prompt 29
}

/** Zones cliquables du bureau (livres) + focus clavier ; appelé par la vue bureau */
function zonesObjetsBureau() {
	objetSurvol = null;
	OBJETS_BUREAU.slice(1).forEach((o, i) => {
		if (o.visible && !o.visible()) return; // prompt 41 : le rapport n'existe qu'en fin de semaine
		const r = versEcranBureau(o.x, o.y, o.l, o.h, COEF_OBJETS[o.nom]); // prompt 25/40 : suit la caméra et le plan de l'objet
		if (o.nom === 'aide') cibleGuide('livreAide', r.x, r.y, r.l, r.h); // prompt 37
		boutons.push({ x: r.x, y: r.y, l: r.l, h: r.h, action: () => ouvrirObjetBureau(o.nom) });
		const survol = mouseX >= r.x && mouseX <= r.x + r.l && mouseY >= r.y && mouseY <= r.y + r.h;
		if (survol || focusBureau === i + 1) objetSurvol = o.nom; // les livres se soulèvent (dessinerLivres)
		const enReaction = PIECE.message && PIECE.message.objet === o.nom && millis() < PIECE.message.jusqua; // prompt 29
		if (survol || focusBureau === i + 1) {
			contourSurvol(r.x - 2 * PIX, r.y - 2 * PIX, r.l + 4 * PIX, r.h + 4 * PIX);
			const ib = o.infobulle ? String(o.infobulle) : t('objet.ouvrir', { label: o.label });
			if (!enReaction) infobulle(ib, Math.max(16, Math.min(r.x, L - textWidth(ib) - 60)), r.y < 120 ? r.y + r.h + 24 : r.y - 70);
		}
	});
	// Prompt 29 : réaction de l'objet (5 s), au-dessus de l'objet, sans pause ni effet sur les jauges
	if (PIECE.message && millis() < PIECE.message.jusqua) {
		const o = OBJETS_BUREAU.find((x) => x.nom === PIECE.message.objet);
		const r = versEcranBureau(o.x, o.y, o.l, o.h, COEF_OBJETS[o.nom]);
		bulleTexte(PIECE.message.texte, r.x + r.l / 2, r.y < 160 ? r.y + r.h + 20 : r.y - 20, r.y < 160);
	}
	if (focusBureau === 0) {
		const e = rectEcranPC();
		contourSurvol(e.x - 7 * PIX, e.y - 7 * PIX, e.l + 14 * PIX, e.h + 15 * PIX);
	}
}

/** Bulle de texte multiligne (max 560 px), centrée sur x ; au-dessus de y, ou en dessous si dessous = true */
function bulleTexte(texte, x, y, dessous) {
	textFont(POLICE_DONNEES);
	textSize(18);
	const l = Math.min(560, textWidth(texte) + 32);
	const lignes = Math.max(1, Math.ceil((textWidth(texte) * 1.08) / (l - 32))); // marge pour le retour à la ligne par mots
	const h = 20 + lignes * 24;
	const bx = constrain(x - l / 2, 16, L - l - 16);
	const by = dessous ? y : y - h;
	noStroke();
	fill(13, 12, 12, 240);
	rect(bx, by, l, h);
	fill('#FFFFFF');
	textAlign(LEFT, TOP);
	textLeading(24);
	text(texte, bx + 16, by + 10, l - 32, h - 10);
}

function infobulle(texte, x, y) {
	textFont(POLICE_DONNEES);
	textSize(18);
	const l = textWidth(texte) + 28;
	noStroke();
	fill(13, 12, 12, 235);
	rect(x, y, l, 40);
	fill('#FFFFFF');
	textAlign(LEFT, CENTER);
	text(texte, x + 14, y + 20);
}

// =====================================================================
// Prompt 74 — comprendre le poste, et une journée qui « vit » (rythme.js : logique pure, reproductible)
// =====================================================================
const FIL = { messages: [], serieDepuis: 0, rythmeFaits: {}, jourCle: '', explicationVue: false };
/** Remise à zéro pour une nouvelle partie (le mélange des arrivées est fait juste après Jeu.nouvellePartie) */
function nouvellePartieRythme() {
	Rythme.clamperDebut(); // prompt 76 : aucun dossier avant 8 h
	Rythme.melangerArrivees();
	FIL.messages = [];
	FIL.serieDepuis = 0;
	FIL.rythmeFaits = {};
	FIL.jourCle = '';
	FIL.explicationVue = false;
}
/** Ajoute une ligne au fil de la journée (texte traduit au dessin) ; annoncée en aria-live */
function ajouterFil(m, sorte) {
	if (!m) return;
	FIL.messages.push({ cle: m.cle, vars: m.vars, sorte: sorte || 'info', heure: Jeu.horloge ? Jeu.formaterHeure(Jeu.horloge.minutes) : '' });
	if (FIL.messages.length > 6) FIL.messages.shift();
	annoncer(t(m.cle, m.vars));
}
/** Début de journée : objectif concret avec sa règle, et bilan de la veille (chiffres réels) */
function filDebutJournee() {
	const o = Jeu.objectifDuJour ? Jeu.objectifDuJour() : null;
	if (o) ajouterFil({ cle: 'fil.objectif', vars: { libelle: String(o.libelle) } }, 'objectif');
	ajouterFil(Rythme.bilanVeille(), 'veille');
}
/** Après chaque décision : texte de liaison (après la narration) */
function filApresDecision() {
	if (Jeu.index <= 0) return;
	const prec = FIL.messages.filter((m) => m.sorte === 'liaison').pop();
	const n = dernierResultat ? Jeu.paquet.indexOf(dernierResultat.dossier) : Jeu.index - 1; // prompt 77 : d'autres dossiers ont pu être réglés en arrière-plan
	ajouterFil(Rythme.liaison(n, prec && prec.cle), 'liaison');
}
/** Une fois par image : événements de rythme à heures fixes (une fois par jour, jamais rejoués à la reprise) */
function majRythme() {
	if (ecran !== 'jeu' || !Jeu.horloge || !Jeu.jourCourant || !Jeu.jourCourant() || phase === 'fin') return;
	const cle = (Jeu.etat.semaine ? Jeu.etat.semaine.lundi : Jeu.etat.mode) + '|' + Jeu.jourIndex;
	const h = Math.floor(Jeu.horloge.minutes / 60);
	if (FIL.jourCle !== cle) {
		// Nouvelle journée (ou reprise) : les heures déjà passées ne sont pas rejouées
		FIL.jourCle = cle;
		Object.keys(Rythme.HEURES).forEach((x) => (FIL.rythmeFaits[cle + '|' + x] = Number(x) <= h && Jeu.horloge.minutes > Jeu.debutJournee() + 1));
	}
	Object.keys(Rythme.HEURES).forEach((x) => {
		const k = cle + '|' + x;
		if (FIL.rythmeFaits[k] || h < Number(x)) return;
		FIL.rythmeFaits[k] = true;
		ajouterFil(Rythme.rythme(Number(x)), 'rythme');
		Confort.Son.bip('choix');
	});
}
/** Après chaque décision : série de 2 bonnes ou 2 ratées → mot du patron (présentation seule, aucun effet) */
function verifierSerie() {
	const s = Rythme.serie(Jeu.evenementsJournee, FIL.serieDepuis);
	if (!s) return;
	FIL.serieDepuis = (Jeu.evenementsJournee || []).length; // la série repart à zéro
	if (Jeu.messagePatron) Jeu.messagePatron(T(s.cle), s.sorte === 'courage' ? 'conseil' : 'info');
	ajouterFil({ cle: s.cle, vars: {} }, s.sorte);
}
/** Fil de la journée, dans le panneau d'attente : objectif, bilan, liaisons, rythme, séries (les plus récents en bas) */
function dessinerFil(x, y, l, h) {
	const couleurs = { objectif: C.accent, veille: C.gris, liaison: C.texte, rythme: C.orange, bravo: C.vert, courage: C.orange, info: C.texte };
	noStroke();
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(20);
	fill(C.texte);
	text(t('fil.titre'), x, y);
	textStyle(NORMAL);
	textFont(POLICE_DONNEES);
	textSize(17);
	textLeading(22);
	let yy = y + 34;
	const liste = FIL.messages.slice(-4);
	if (!liste.length) {
		fill(C.gris);
		text(t('fil.vide'), x, yy, l, 44);
		return;
	}
	liste.forEach((m) => {
		const txt = (m.heure ? m.heure + ' · ' : '') + t(m.cle, m.vars);
		const n = Math.min(3, Math.ceil((textWidth(txt) * 1.08) / l));
		if (yy + n * 22 > y + h) return;
		fill(couleurs[m.sorte] || C.texte);
		text(txt, x, yy, l, n * 22 + 4);
		yy += n * 22 + 10;
	});
}

// ——— Explication du poste : à la première ouverture de l'écran de jeu de la partie (gardée dans la sauvegarde) ———
function majExplicationPoste() {
	if (FIL.explicationVue || fenetre || tutoriel || smsActif || TRANSITION_JOUR || MENU.actif) return;
	if (ecran !== 'jeu' || vue !== 'poste' || PC.etat !== 'appli' || phase === 'fin') return;
	FIL.explicationVue = true;
	ouvrir('poste');
	annoncer(t('poste.titre') + '. ' + t('poste.role') + ' ' + ['devier', 'retenir', 'renfort', 'rien'].map((a) => t('action.desc.' + a)).join(' '));
}
function fenetrePoste() {
	const l = 1240;
	const h = 860;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.accent);
	noStroke();
	textAlign(LEFT, TOP);
	fill(C.texte);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(36);
	text(t('poste.titre'), x + 56, y + 44, l - 112, 50);
	textStyle(NORMAL);
	textSize(22);
	textLeading(32);
	text(t('poste.role'), x + 56, y + 108, l - 112, 140);
	textStyle(BOLD);
	textSize(24);
	text(t('poste.decisions'), x + 56, y + 262);
	textStyle(NORMAL);
	[['1', 'devier'], ['2', 'retenir'], ['3', 'renfort'], ['0', 'rien'], [t('alerte.maj') + ' + 1–4', 'equipes']].forEach(([k, a], i) => {
		const yy = y + 310 + i * 62;
		textFont(POLICE_DONNEES);
		textStyle(BOLD);
		textSize(22);
		fill(C.orange);
		text(k, x + 56, yy);
		textStyle(NORMAL);
		textFont(POLICE_TEXTE);
		textSize(21);
		textLeading(27);
		fill(C.texte);
		text(t('action.desc.' + a), x + 230, yy, l - 290, 58);
	});
	textSize(20);
	textLeading(28);
	fill(C.gris);
	text(t('poste.apprendre'), x + 56, y + h - 196, l - 112, 90);
	bouton(x + l - 56 - 360, y + h - 96, 360, 64, t('poste.compris'), fermer);
}
