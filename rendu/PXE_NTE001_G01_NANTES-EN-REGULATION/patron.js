/* Nantes en régulation — prompt 86 : messagerie du patron ; prompt 185 : l'appli s'appelle « Mails » (EN « Mail ») et
 * prend la forme d'une vraie messagerie en trois zones — dossiers (= filtres par type, compteurs total / non lus
 * toujours visibles), liste des mails, volet de lecture (mail entier, blocs enrichis, réponses rapides). Identifiant
 * interne inchangé : 'patron' (sauvegardes, tests, pile de navigation). Zone étroite (< 1300 px) ou portrait : deux
 * zones, la lecture remplace la liste (← Liste, Échap). Contenu et effets de jeu inchangés : mêmes messages et mêmes
 * déclencheurs (game.js).
 * Prompt 195 : codes d'un client de messagerie — barre d'outils (recherche locale au clavier ; Répondre, Archiver,
 * Marquer comme non lu, Voir le dossier en icônes avec infobulle), « Boîte de réception » puis catégories puis
 * « Archives », rangées à pastille d'initiales groupées par jour de jeu, en-tête De / À, zone « Répondre » en pied,
 * réponse envoyée citée dans le fil. Archiver = m.archive (sauvé avec Jeu.messagesPatron), sans effet de jeu.
 * Clavier : Tab entre barre d'outils, dossiers, liste, lecture (puis menu d'applis) ; dans la barre, la saisie va au
 * champ de recherche, ← → passent aux actions, Entrée agit, Échap efface ; ↑ ↓ dans la zone ; Entrée ouvre ;
 * ← → dossiers ; 1-3 réponses rapides ; V tout déplier.
 */
const PATRON = { deplies: new Set(), toutDeplie: false, dernier: null, filtre: 'tout', defil: 0, defilLecture: 0, maxLecture: 0, ouvert: false, vus: 0, ecritJusqua: 0, max: 0, sel: null, lecture: false, zoneFocus: null, voirSel: false, etroit: false, recherche: '', outil: 0, nonLuForce: null, repondre: false, bulle: null };
const FILTRES_PATRON = [
	{ cle: 'tout', types: null }, // « Boîte de réception »
	{ cle: 'consignes', types: ['consigne'] },
	{ cle: 'alertes', types: ['alerte', 'conseil'] },
	{ cle: 'reproches', types: ['reproche'] },
	{ cle: 'budget', types: ['budget'] },
	{ cle: 'soirs', types: ['soir'] }, // prompt 194 : les mails du soir (fait marquant, mot du patron, bilan)
	{ cle: 'archives', types: null, archives: true }, // prompt 195 : mails archivés (hors des autres dossiers et du badge)
];
const COULEURS_TYPES = { consigne: () => DS.info, alerte: () => DS.erreur, conseil: () => DS.alerte, budget: (m) => (m.meta && m.meta.palier === 'haut' ? DS.succes : DS.alerte), reproche: () => DS.primaire, equipes: () => DS.info, info: () => DS.blanc75, soir: (m) => (m.meta && m.meta.positif ? DS.succes : DS.blanc75) };
const REPONSES_RAPIDES = { consigne: ['recu', 'jemen'], alerte: ['redresse', 'compris'], conseil: ['compris'], reproche: ['corrige'], budget: ['recu'], equipes: ['recu'], info: ['recu'], soir: ['recu'] };
/** Prompt 101 : blocs enrichis repliés en une ligne (déplier : clic, ou V pour tous) ; le dernier message reste déplié */
const BLOCS_PLIABLES = ['consigne', 'reproche', 'budget', 'equipes', 'soir'];
const aUnBloc = (m) => (typeDe(m) === 'reproche' ? (m.meta || {}).index !== undefined : Object.keys(m.meta || {}).some((k) => k !== 'important')); // prompt 185 : un reproche sans dossier (départ anticipé) n'a ni bloc ni lien
const blocDeplie = (m) => !BLOCS_PLIABLES.includes(typeDe(m)) || !aUnBloc(m) || PATRON.toutDeplie || PATRON.deplies.has(m) || m === PATRON.dernier;
const typeDe = (m) => (Jeu.TYPES_MESSAGES.includes(m.type) ? m.type : 'info');
const enPanne = () => !!(Jeu.modificateurActif && Jeu.modificateurActif() === 'panne_messagerie');

/** Prompt 170 : pictogramme Lucide pour chaque type de message (icones-lucide.js) ; aucun emoji système */
const PICTOS = { consigne: 'clipboard-list', alerte: 'triangle-alert', conseil: 'lightbulb', budget: 'coins', reproche: 'message-square-warning', equipes: 'users', info: 'message-square', soir: 'moon' };
function picto(type, x, y, c, taille) {
	iconeLucide(PICTOS[type] || PICTOS.info, x + 1, y, taille || 24, c);
}
/** Prompt 195 : initiales d'un expéditeur — première et dernière lettre des mots porteurs (« Direction de la
 * régulation » → « DR ») ; un seul mot → son initiale (« Vous » → « V ») */
const MOTS_VIDES = ['de', 'du', 'des', 'la', 'le', 'les', 'l', 'd', 'et', 'of', 'the', 'and'];
function initiales(nom) {
	const mots = String(nom || '')
		.split(/[\s'’-]+/)
		.filter((w) => w && !MOTS_VIDES.includes(w.toLowerCase()));
	if (!mots.length) return '?';
	if (mots.length === 1) return mots[0][0].toUpperCase();
	return (mots[0][0] + mots[mots.length - 1][0]).toUpperCase();
}
/** Pastille d'initiales (carré du Pixel DS) */
function pastilleInitiales(nom, x, y, s) {
	noStroke();
	fill(DS.blanc15);
	rect(x, y, s, s);
	dsTexte(initiales(nom), x + s / 2, y + s / 2 - Math.round(s * 0.21), Math.round(s * 0.4), DS.blanc, 'center');
}
/** Texte en gras (rangée non lue) ; dsTexte remet le style normal */
function texteGras(txt, x, y, taille, couleur, align) {
	textFont(DS.policeTexte);
	textStyle(BOLD);
	textSize(taille);
	const l = textWidth(txt) + 4;
	textStyle(NORMAL);
	const x0 = align === 'right' ? x - l : align === 'center' ? x - l / 2 : x;
	dessinerTexte(txt, x0, y, l, { police: DS.policeTexte, taille, interligne: taille, couleur, style: BOLD, align, maxLignes: 1 });
}

const filtreDe = (cle) => FILTRES_PATRON.find((x) => x.cle === cle) || FILTRES_PATRON[0];
/** Messages bruts d'un dossier (filtre) — base des compteurs ; les archivés ne sont que dans « Archives » */
const mailsDuFiltre = (cle) => {
	const f = filtreDe(cle);
	return (Jeu.messagesPatron || []).filter((m) => !!m.archive === !!f.archives && (!f.types || f.types.includes(typeDe(m))));
};
const messagesFiltres = () => mailsDuFiltre(PATRON.filtre);
/** Compteurs d'un dossier : total et non lus (prompt 185 : toujours affichés) */
function compteursMails(cle) {
	const l = mailsDuFiltre(cle);
	return { n: l.length, nl: l.filter((m) => !m.lu).length };
}
/** Nombre total de mails non lus (badge de l'appli dans le menu) — prompt 195 : hors archives */
const mailsNonLus = () => (Jeu.messagesPatron || []).filter((m) => !m.lu && !m.archive).length;
/** Prompt 195 : recherche locale, sans casse ni accents, sur l'expéditeur, l'objet et le texte */
const sansAccents = (s) =>
	String(s || '')
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase();
const correspond = (m, q) => !q.trim() || sansAccents([t('mail.de'), objetMail(m), m.texte].join(' ')).includes(sansAccents(q.trim()));
/** Liste affichée : la plus récente en haut ; un même message répété le même jour (même type, même texte) n'est
 * montré qu'une fois, avec « ×N » (prompt 101 b) ; le dernier attend la fin de « Direction écrit… » ; prompt 195 :
 * filtrée par la recherche */
function listeMails() {
	const brut = messagesFiltres();
	const cachee = PATRON.ecritJusqua > millis() ? brut[brut.length - 1] : null;
	const groupes = new Map();
	brut.forEach((m) => {
		if (m === cachee) return;
		const k = typeDe(m) + '|' + m.jour + '|' + String(m.texte);
		if (groupes.has(k)) groupes.get(k).push(m);
		else groupes.set(k, [m]);
	});
	PATRON.repetes = new Map([...groupes.values()].map((g) => [g[0], g]));
	PATRON.dernier = brut[brut.length - 1] || null;
	const q = PATRON.recherche || '';
	return { liste: [...groupes.values()]
		.map((g) => g[0])
		.reverse()
		.filter((m) => correspond(m, q)), cachee: q ? null : cachee };
}
const groupeDe = (m) => (PATRON.repetes && PATRON.repetes.get(m)) || [m];
const nonLu = (m) => groupeDe(m).some((x) => !x.lu);
/** Prompt 195 : intitulé du groupe d'un jour de jeu — « Aujourd'hui », « Hier » ou la date (jour joué, pas l'horloge réelle) */
function libelleJourMail(jour) {
	const auj = ((Jeu.jourCourant && Jeu.jourCourant()) || {}).date;
	if (!jour || jour === auj) return t('patron.jour.aujourdhui');
	const ecart = auj ? Math.round((Date.parse(auj + 'T12:00:00Z') - Date.parse(jour + 'T12:00:00Z')) / 86400000) : NaN;
	if (ecart === 1) return t('patron.jour.hier');
	const d = typeof dateLongue === 'function' ? String(dateLongue(jour)) : jour;
	return d.charAt(0).toUpperCase() + d.slice(1);
}
/** Rangées de la liste : un intitulé à chaque changement de jour, puis les mails */
function rangeesMails(liste) {
	const r = [];
	let jour;
	liste.forEach((m) => {
		if (m.jour !== jour || !r.length) r.push({ jour: libelleJourMail(m.jour) }), (jour = m.jour);
		r.push({ m });
	});
	return r;
}
function changerFiltre(cle) {
	PATRON.filtre = cle;
	PATRON.defil = 0;
	PATRON.sel = null;
	PATRON.lecture = false;
	Confort.Son.clic();
	const c = compteursMails(cle);
	annoncer(t('patron.filtre.' + cle) + ' · ' + t('patron.compteur', { n: c.n, nl: c.nl }));
}
/** Ouvre un mail dans le volet de lecture (en zone étroite : la lecture remplace la liste) */
function ouvrirMail(m, sansSon) {
	if (!m) return;
	PATRON.sel = m;
	PATRON.defilLecture = 0;
	PATRON.voirSel = true;
	PATRON.nonLuForce = null;
	PATRON.repondre = false;
	if (PATRON.etroit) PATRON.lecture = true;
	if (!sansSon) Confort.Son.clic();
}
/** Lu une fois ouvert dans le volet de lecture (avec ses répétitions « ×N ») ; sauf juste après « Marquer comme non lu » */
function marquerLu(m) {
	if (enPanne() || PC.fenetre !== 'patron' || m === PATRON.nonLuForce) return;
	groupeDe(m).forEach((x) => {
		if (!x.lu) (x.lu = true), (x.luA = Jeu.horloge ? Jeu.formaterHeure(Jeu.horloge.minutes) : '');
	});
}
/** Prompt 195 : actions de la barre d'outils — purement locales, aucun effet de jeu */
function marquerNonLu(m) {
	if (!m || enPanne()) return;
	groupeDe(m).forEach((x) => ((x.lu = false), delete x.luA));
	PATRON.nonLuForce = m;
	if (PATRON.etroit) (PATRON.lecture = false), (PATRON.voirSel = true);
	Confort.Son.clic();
	annoncer(t('patron.marqueNonLu'));
}
function archiverMail(m) {
	if (!m || enPanne()) return;
	const { liste } = listeMails();
	const i = liste.indexOf(m);
	const vers = !m.archive;
	groupeDe(m).forEach((x) => (vers ? (x.archive = true) : delete x.archive));
	PATRON.sel = liste[i + 1] || liste[i - 1] || null;
	PATRON.voirSel = true;
	PATRON.nonLuForce = null;
	if (PATRON.etroit) PATRON.lecture = false;
	Confort.Son.clic();
	annoncer(t(vers ? 'patron.archive' : 'patron.desarchive'));
}
function repondreMail(m) {
	const rr = reponsesRapides(m);
	if (!rr.length || enPanne()) return;
	if (PATRON.etroit) PATRON.lecture = true;
	PATRON.zoneFocus = 'lecture';
	PATRON.repondre = true;
	annoncer(t('patron.reponses', { liste: rr.map((c, i) => i + 1 + ' ' + t('patron.rapide.' + c)).join(' · ') }));
}
/** Actions de la barre d'outils sur le mail ouvert ; « Voir le dossier » seulement quand le mail en cite un */
function actionsMails(m) {
	const panne = enPanne();
	const a = [
		{ cle: 'repondre', icone: 'reply', lib: t('patron.action.repondre'), actif: !!m && !panne && reponsesRapides(m).length > 0, faire: () => repondreMail(m) },
		{ cle: 'archiver', icone: m && m.archive ? 'inbox' : 'archive', lib: t(m && m.archive ? 'patron.action.desarchiver' : 'patron.action.archiver'), actif: !!m && !panne, faire: () => archiverMail(m) },
		{ cle: 'nonLu', icone: 'mail', lib: t('patron.action.nonLu'), actif: !!m && !panne && !nonLu(m), faire: () => marquerNonLu(m) },
	];
	if (m && typeDe(m) === 'reproche' && aUnBloc(m)) a.push({ cle: 'dossier', icone: 'external-link', lib: t('patron.voirDossier'), actif: !panne, faire: () => voirDossier(m.meta) });
	return a;
}
/** Une fois par image : sons (alerte distincte), indicateur de saisie avant un nouveau message */
function majPatron() {
	const n = (Jeu.messagesPatron || []).length;
	if (n > PATRON.vus && PATRON.vus) {
		const m = Jeu.messagesPatron[n - 1];
		Confort.Son.bip(typeDe(m) === 'alerte' ? 'alerte' : 'choix');
		if (!reduireAnimations) PATRON.ecritJusqua = millis() + 800; // « Direction écrit… » 0,8 s, puis le mail arrive
	}
	PATRON.vus = n;
}
const objetMail = (m) => (typeDe(m) === 'soir' && m.meta && m.meta.objet ? String(m.meta.objet) : t('patron.type.' + typeDe(m))) + (groupeDe(m).length > 1 ? ' ×' + groupeDe(m).length : '') + (m.enRetard ? ' · ' + t('patron.retard') : '');
/** Heure de jeu ; date courte si le mail n'est pas du jour */
function heureMail(m) {
	const auj = ((Jeu.jourCourant && Jeu.jourCourant()) || {}).date;
	return (m.jour && m.jour !== auj ? m.jour.split('-').reverse().slice(0, 2).join('/') + ' · ' : '') + (m.heure || '');
}
/** Contour de focus clavier (zone active) */
function contourFocus(x, y, l, h) {
	noFill();
	stroke(DS.primaireTrait);
	strokeWeight(2);
	rect(x + 1, y + 1, l - 2, h - 2);
	noStroke();
}

function appPatron(z) {
	const panne = enPanne();
	const portrait = typeof PORTRAIT !== 'undefined' && PORTRAIT.actif;
	const etroit = portrait || z.l < 1300; // 3 zones lisibles (texte ≥ 18 px) à partir de 1300 px
	PATRON.etroit = etroit;
	PATRON.bulle = null;
	const { liste, cachee } = listeMails();
	if (!PATRON.ouvert) {
		// À l'ouverture : le plus ancien non lu du dossier (sinon le plus récent) ; en zone étroite, la liste d'abord
		PATRON.ouvert = true;
		PATRON.zoneFocus = null;
		PATRON.lecture = false;
		PATRON.recherche = '';
		PATRON.nonLuForce = null;
		PATRON.repondre = false;
		const nl = liste.filter(nonLu);
		PATRON.sel = nl[nl.length - 1] || liste[0] || null;
		PATRON.voirSel = true;
		PATRON.defilLecture = 0;
	}
	if (PATRON.sel && !liste.includes(PATRON.sel)) PATRON.sel = liste.find((m) => groupeDe(m).includes(PATRON.sel)) || null;
	if (!PATRON.sel && !etroit && liste.length) PATRON.sel = liste[0];
	if (!PATRON.sel) PATRON.lecture = false;
	// En-tête (56 px) : icône, nom de l'appli, statut ; en grand, la barre d'outils sur la même ligne
	iconeLucide('mail', z.x, z.y + 4, 32, DS.blanc);
	dsTexte(t('app.patron'), z.x + 44, z.y + 4, 24, DS.blanc, 'left');
	noStroke();
	fill(panne ? DS.erreur : DS.succes);
	rect(z.x + 160, z.y + 14, 12, 12);
	dsTexte(t(panne ? 'patron.statut.horsLigne' : 'patron.statut.enLigne'), z.x + 180, z.y + 8, 18, panne ? DS.erreurClair : DS.blanc50, 'left');
	let y = z.y;
	if (etroit) {
		y += 56;
		barreOutils(z.x, y, z.l, 0);
		y += 60;
	} else {
		barreOutils(z.x + 368, y, z.l - 368, 536);
		y += 64;
	}
	if (panne) {
		noStroke();
		fill(DS.erreur);
		rect(z.x, y, z.l, 40);
		dsTexte(t('patron.reconnexion', { s: Math.ceil((Jeu.modificateur.fin - millis()) / 1000) }), z.x + 14, y + 8, 20, '#FFFFFF', 'left');
		y += 48;
	}
	const h = z.y + z.h - y;
	// Dossiers : colonne à gauche (rangée en haut en portrait)
	let x = z.x;
	if (portrait) {
		zoneDossiers(z.x, y, z.l, 56, true);
		y += Math.ceil(FILTRES_PATRON.length / colonnesDossiersMails(z.l, true)) * 64; // prompt 205
	} else {
		zoneDossiers(z.x, y, 352, h, false); // prompt 195 : « Boîte de réception » et ses deux compteurs en entier
		x += 368;
	}
	const hc = z.y + z.h - y;
	const lr = z.x + z.l - x;
	if (etroit) {
		if (PATRON.lecture && PATRON.sel) voletLecture(PATRON.sel, x, y, lr, hc, panne, true);
		else zoneListe(liste, cachee, x, y, lr, hc, panne);
	} else {
		zoneListe(liste, cachee, x, y, 520, hc, panne);
		voletLecture(PATRON.sel, x + 544, y, lr - 544, hc, panne, false);
	}
	if (PATRON.bulle) {
		// Infobulle d'une action (survol ou focus clavier), gardée dans la zone de l'appli
		textFont(typeof POLICE_DONNEES !== 'undefined' ? POLICE_DONNEES : DS.policeTexte);
		textSize(18);
		const b = PATRON.bulle;
		const lb = textWidth(b.txt) + 28;
		const bx = Math.max(z.x, Math.min(b.ancre === 'gauche' ? b.x - lb : b.x, z.x + z.l - lb));
		infobulle(b.txt, bx, b.y);
		noFill();
		stroke(DS.blanc15);
		strokeWeight(1);
		rect(bx + 0.5, b.y + 0.5, lb - 1, 39); // bord : l'infobulle se détache du titre du mail
		noStroke();
	}
}
/** Prompt 195 — barre d'outils : champ de recherche (largeur rech ; 0 = toute la place libre) puis les actions */
function barreOutils(x, y, l, rech) {
	const m = PATRON.sel;
	const actions = actionsMails(m);
	const pas = 52;
	const la = actions.length * pas;
	const lr = rech ? rech - 16 : Math.max(200, l - la - 16);
	const focusBarre = PATRON.zoneFocus === 'barre';
	PATRON.outil = constrain(PATRON.outil || 0, 0, actions.length);
	// Champ de recherche (dessiné : la saisie arrive par saisieRechercheMails, au clavier)
	const fr = focusBarre && PATRON.outil === 0;
	noStroke();
	fill(DS.blanc05);
	rect(x, y + 4, lr, 44);
	if (fr) contourFocus(x, y + 4, lr, 44);
	else {
		noFill();
		stroke(DS.blanc15);
		strokeWeight(1);
		rect(x + 0.5, y + 4.5, lr - 1, 43);
		noStroke();
	}
	iconeLucide('search', x + 12, y + 14, 24, DS.blanc75);
	const q = PATRON.recherche || '';
	const place = lr - 96;
	const lib = q ? couperDebut(q, place, 18) : t('patron.recherche');
	dsTexte(q ? lib : couperLargeurCarte(lib, place, 18), x + 48, y + 16, 18, q ? DS.blanc : DS.blanc50, 'left');
	if (fr && (reduireAnimations || Math.floor(millis() / 500) % 2 === 0)) {
		textFont(DS.policeTexte);
		textSize(18);
		fill(DS.blanc);
		rect(x + 48 + (q ? textWidth(lib) : 0) + 2, y + 14, 2, 24); // curseur (fixe si mouvements réduits)
	}
	zoneTexteDeclarer('barreMails', x, y, l, 52);
	boutons.push({ x, y: y + 4, l: lr - (q ? 44 : 0), h: 44, action: () => focusRecherche() });
	if (q) {
		const ex = x + lr - 44;
		iconeLucide('x', ex + 10, y + 14, 24, DS.blanc75);
		if (survole(ex, y + 4, 44, 44)) PATRON.bulle = { txt: t('patron.recherche.effacer'), x: ex - 6, y: y + 6, ancre: 'gauche' }; // sur la ligne de la barre, à gauche du × : ne couvre pas la liste
		boutons.push({ x: ex, y: y + 4, l: 44, h: 44, action: () => ((PATRON.recherche = ''), majRecherche()) });
	}
	// Actions : icônes 24 px dans des cibles 44 × 44, infobulle au survol et au focus
	let ax = x + lr + 16;
	const finBarre = ax + actions.length * pas; // infobulles des actions : sur la ligne de la barre, à droite des icônes (elles couvraient l'objet du mail ouvert)
	actions.forEach((a, k) => {
		const foc = focusBarre && PATRON.outil === k + 1;
		const sur = survole(ax, y + 4, 44, 44);
		noStroke();
		if (sur && a.actif) {
			fill(DS.blanc15);
			rect(ax, y + 4, 44, 44);
		}
		iconeLucide(a.icone, ax + 10, y + 14, 24, a.actif ? DS.blanc : DS.blanc50);
		if (foc) contourFocus(ax, y + 4, 44, 44);
		if (sur || foc) PATRON.bulle = { txt: a.lib, x: finBarre, y: y + 6 };
		if (a.actif) boutons.push({ x: ax, y: y + 4, l: 44, h: 44, action: a.faire });
		ax += pas;
	});
}
const survole = (x, y, l, h) => mouseX >= x && mouseX <= x + l && mouseY >= y && mouseY <= y + h;
/** Fin de la saisie visible quand elle dépasse le champ (« …fluidité ») */
function couperDebut(txt, l, taille) {
	textFont(DS.policeTexte);
	textSize(taille);
	let c = txt;
	while (c.length > 1 && textWidth('…' + c) > l) c = c.slice(1);
	return c === txt ? txt : '…' + c;
}
function focusRecherche() {
	PATRON.zoneFocus = 'barre';
	PATRON.outil = 0;
	annoncer(t('patron.zone.barre') + ' · ' + t('patron.recherche') + (PATRON.recherche ? ' · ' + PATRON.recherche : ''));
}
/** Après chaque frappe : liste en haut, sélection gardée si elle correspond encore, nombre de résultats annoncé */
function majRecherche() {
	PATRON.defil = 0;
	PATRON.voirSel = true;
	if (PATRON.etroit) PATRON.lecture = false;
	const { liste } = listeMails();
	if (!liste.includes(PATRON.sel)) PATRON.sel = liste[0] || null;
	annoncer(PATRON.recherche ? t('patron.recherche.resultats', { n: liste.length, q: PATRON.recherche }) : t('patron.recherche'));
}
/** Saisie au clavier dans le champ de recherche quand il a le focus : appelée tôt par keyPressed (sketch.js) pour que
 * les lettres n'atteignent pas les raccourcis du jeu ; Tab, flèches et Entrée restent à touchePatron ; true si pris */
function rechercheMailsActive() {
	return typeof PC !== 'undefined' && PC.fenetre === 'patron' && PC.etat === 'os' && PATRON.zoneFocus === 'barre' && PATRON.outil === 0 && typeof vue !== 'undefined' && vue === 'poste' && ecran === 'jeu' && !fenetre && !(typeof MENU !== 'undefined' && MENU.actif) && !(typeof MENU_FOCUS !== 'undefined' && MENU_FOCUS.actif);
}
function saisieRechercheMails() {
	if (!rechercheMailsActive()) return false;
	if (keyCode === BACKSPACE || keyCode === DELETE) {
		if (PATRON.recherche) (PATRON.recherche = PATRON.recherche.slice(0, -1)), majRecherche();
		return true;
	}
	if (keyCode === ESCAPE) {
		if (!PATRON.recherche) return false; // champ vide : Échap garde son sens (retour, fermeture)
		PATRON.recherche = '';
		majRecherche();
		return true;
	}
	if (typeof key === 'string' && key.length === 1 && key >= ' ') {
		if (PATRON.recherche.length < 40) (PATRON.recherche += key), majRecherche();
		return true;
	}
	return false;
}
/** Colonne des dossiers : « Boîte de réception », puis les catégories, puis « Archives » ; non lus (pastille
 * d'accent) et total alignés à droite */
/** Prompt 205 : nombre de dossiers par rangée (portrait) — tous sur une ligne s'ils tiennent, sinon 3 */
function colonnesDossiersMails(l, rangee) {
	return rangee && l < 1000 ? 3 : FILTRES_PATRON.length;
}
function zoneDossiers(x, y, l, h, rangee) {
	const n = FILTRES_PATRON.length;
	let yy = y;
	FILTRES_PATRON.forEach((f, k) => {
		if (!rangee && k === 1) {
			dsTexte(t('patron.categories'), x + 14, yy + 8, 16, DS.blanc50, 'left');
			yy += 36;
		}
		if (!rangee && f.archives) {
			noStroke();
			fill(DS.blanc15);
			rect(x + 14, yy + 8, l - 28, 1);
			yy += 16;
		}
		const cols = colonnesDossiersMails(l, rangee); // prompt 205 : en colonne étroite, grille de 3 par rangée
		const r = rangee ? { x: x + ((k % cols) * l) / cols, y: y + Math.floor(k / cols) * (h + 8), l: l / cols - 8, h } : { x, y: yy, l, h: 52 };
		yy += 56;
		const actif = PATRON.filtre === f.cle;
		const c = compteursMails(f.cle);
		noStroke();
		if (actif) {
			fill(primaireRGBA(0.16));
			rect(r.x, r.y, r.l, r.h);
			fill(DS.primaire);
			rect(r.x, r.y, 4, r.h);
		}
		const types = f.types;
		if (!rangee) iconeLucide(f.archives ? 'archive' : types ? PICTOS[types[0]] : 'inbox', r.x + 14, r.y + 14, 24, actif ? DS.blanc : DS.blanc75);
		const lx = rangee ? r.x + 10 : r.x + 50;
		// Compteurs à droite : non lus (pastille d'accent) puis total
		textFont(DS.policeTexte);
		textSize(18);
		const totTxt = String(c.n);
		const wt = textWidth(totTxt);
		dsTexte(totTxt, r.x + r.l - 12, r.y + 16, 18, DS.blanc75, 'right');
		let wnl = 0;
		if (c.nl && !f.archives) {
			const txt = String(c.nl);
			wnl = Math.max(32, textWidth(txt) + 16);
			noStroke();
			fill(DS.primaire);
			rect(r.x + r.l - 24 - wt - wnl, r.y + 12, wnl, 28);
			dsTexte(txt, r.x + r.l - 24 - wt - wnl / 2, r.y + 16, 18, DS.surPrimaire, 'center');
		}
		const place = r.x + r.l - 32 - wt - wnl - lx;
		const nom = couperLargeurCarte(t('patron.filtre.' + f.cle), place, 20);
		if (k === 0 && c.nl) texteGras(nom, lx, r.y + 14, 20, DS.blanc, 'left');
		else dsTexte(nom, lx, r.y + 14, 20, actif ? DS.blanc : DS.blanc75, 'left');
		zoneTexteDeclarer('dossierMails', r.x, r.y, r.l, r.h);
		if (actif && PATRON.zoneFocus === 'dossiers') contourFocus(r.x, r.y, r.l, r.h);
		boutons.push({ x: r.x, y: r.y, l: r.l, h: r.h, action: () => changerFiltre(f.cle) });
	});
}
/** Liste des mails : groupée par jour de jeu, défilable et masquée hors de sa zone (déclarée à l'audit) */
const HAUTEUR_MAIL = 104;
const HAUTEUR_JOUR = 40;
function zoneListe(liste, cachee, x, y, l, h, panne) {
	noStroke();
	fill(DS.blanc05);
	rect(x, y, l, h);
	drawingContext.save();
	drawingContext.beginPath();
	drawingContext.rect(x, y, l, h);
	drawingContext.clip();
	zoneTexteDebut('listeMails', x, y, l, h, { clip: true }); // prompt 93 : ce qui sort de la zone est masqué exprès
	const n0 = boutons.length;
	const haut = cachee ? 48 : 0;
	const rangees = rangeesMails(liste);
	// Position de chaque rangée (en px depuis le haut de la liste)
	let o = haut;
	rangees.forEach((r) => ((r.top = o), (o += r.m ? HAUTEUR_MAIL : HAUTEUR_JOUR)));
	const rSel = rangees.find((r) => r.m && r.m === PATRON.sel);
	if (PATRON.voirSel && rSel) {
		const top = rSel.top - (rangees[rangees.indexOf(rSel) - 1] && !rangees[rangees.indexOf(rSel) - 1].m ? HAUTEUR_JOUR : 0);
		if (top < PATRON.defil) PATRON.defil = top;
		else if (rSel.top + HAUTEUR_MAIL > PATRON.defil + h) PATRON.defil = rSel.top + HAUTEUR_MAIL - h;
		PATRON.voirSel = false;
	}
	PATRON.max = Math.max(0, o - h);
	PATRON.defil = constrain(PATRON.defil, 0, PATRON.max);
	const y0 = y - PATRON.defil;
	if (cachee) {
		const k = 1 + (Math.floor(millis() / 250) % 3);
		dsTexte(t('patron.ecrit') + ' ' + '•'.repeat(k), x + 32, y0 + 12, 18, DS.blanc50, 'left');
	}
	if (!liste.length && !cachee) etatVide(x, y, l, h);
	rangees.forEach((r) => {
		const ry = y0 + r.top;
		const rh = r.m ? HAUTEUR_MAIL : HAUTEUR_JOUR;
		if (ry + rh < y || ry > y + h) return;
		if (r.m) itemMail(r.m, x, ry, l, rh);
		else dsTexte(r.jour, x + 16, ry + 14, 16, DS.blanc75, 'left');
	});
	zoneTexteFin();
	drawingContext.restore();
	for (let i = boutons.length - 1; i >= n0; i--) if (boutons[i].y + boutons[i].h <= y || boutons[i].y >= y + h) boutons.splice(i, 1);
	if (panne) {
		noStroke();
		fill(13, 12, 12, 140); // liste lisible mais grisée
		rect(x, y, l, h);
	}
	PATRON.zone = { x, y, l, h };
	if (PATRON.max > 0) {
		const hb = Math.max(40, (h * h) / (h + PATRON.max));
		noStroke();
		fill(DS.blanc15);
		rect(x + l - 4, y, 4, h);
		fill(DS.blanc75);
		rect(x + l - 4, y + ((h - hb) * PATRON.defil) / PATRON.max, 4, hb);
	}
}
/** Prompt 195 : état vide — icône « inbox » et une phrase (dossier vide, ou recherche sans résultat) */
function etatVide(x, y, l, h) {
	const cy = y + Math.min(h / 2 - 40, 160);
	iconeLucide('inbox', x + l / 2 - 16, cy, 32, DS.blanc50);
	const txt = PATRON.recherche ? t('patron.videRecherche', { q: PATRON.recherche }) : t('patron.vide');
	dessinerTexte(txt, x + 24, cy + 48, l - 48, { police: DS.policeTexte, taille: 20, interligne: 28, couleur: DS.blanc75, align: 'center', maxLignes: 3 });
}
/** Une rangée : point non lu, pastille d'initiales ; expéditeur + heure ; objet ; aperçu coupé par « … » */
function itemMail(m, x, y, l, h) {
	const sel = m === PATRON.sel;
	const nl = nonLu(m);
	noStroke();
	if (sel) {
		fill(primaireRGBA(0.16));
		rect(x, y, l, h);
		fill(DS.primaire);
		rect(x, y, 4, h);
	}
	fill(DS.blanc15);
	rect(x + 16, y + h - 1, l - 32, 1); // séparateur fin
	if (nl) {
		fill(DS.primaire);
		circle(x + 16, y + 34, 10); // non lu
	}
	pastilleInitiales(t('mail.de'), x + 28, y + 16, 44);
	const tx = x + 88;
	const lt = l - 88 - 16;
	const heure = m.heure || '';
	textFont(DS.policeTexte);
	textSize(18);
	const wh = textWidth(heure);
	if (nl) texteGras(heure, x + l - 16, y + 14, 18, DS.blanc, 'right');
	else dsTexte(heure, x + l - 16, y + 14, 18, DS.blanc50, 'right');
	const de = couperLargeurCarte(t('mail.de'), lt - wh - 16, 20);
	if (nl) texteGras(de, tx, y + 12, 20, DS.blanc, 'left');
	else dsTexte(de, tx, y + 12, 20, DS.blanc75, 'left');
	picto(typeDe(m), tx - 1, y + 44, COULEURS_TYPES[typeDe(m)](m), 16);
	const objet = couperLargeurCarte(objetMail(m), lt - 24, 18);
	if (nl) texteGras(objet, tx + 24, y + 42, 18, DS.blanc, 'left');
	else dsTexte(objet, tx + 24, y + 42, 18, DS.blanc75, 'left');
	dsTexte(couperLargeurCarte(String(m.texte).replace(/\s+/g, ' '), lt, 18), tx, y + 70, 18, DS.blanc50, 'left');
	zoneTexteDeclarer('itemMail', x, y, l, h);
	if (sel && PATRON.zoneFocus === 'liste') contourFocus(x, y, l, h);
	boutons.push({ x, y, l, h, action: () => ouvrirMail(m) });
}
/** Volet de lecture : en-tête (objet, De, À, date et heure de jeu), corps, bloc enrichi, réponse envoyée citée dans
 * le fil ; en pied, la zone « Répondre » et ses réponses rapides */
const STYLE_CORPS = () => ({ police: DS.policeTexte, taille: 20, interligne: 32, couleur: DS.blanc });
function voletLecture(m, x, y, l, h, panne, avecRetour) {
	if (!m) {
		iconeLucide('mail', x + l / 2 - 16, y + Math.min(h / 2 - 16, 200), 32, DS.blanc15);
		return;
	}
	marquerLu(m);
	let yy = y;
	if (avecRetour) {
		dsBouton(x, yy, 180, 44, '← ' + t('patron.retourListe'), () => ((PATRON.lecture = false), (PATRON.voirSel = true), Confort.Son.clic()), 'contour', false, true);
		yy += 56;
	}
	// En-tête du mail
	picto(typeDe(m), x, yy + 2, COULEURS_TYPES[typeDe(m)](m));
	dsTexte(couperLargeurCarte(objetMail(m), l - 40, 24), x + 36, yy, 24, DS.blanc, 'left');
	yy += 48;
	pastilleInitiales(t('mail.de'), x, yy, 48);
	const date = (m.jour ? libelleJourMail(m.jour) + ' · ' : '') + (m.heure || '');
	textFont(DS.policeTexte);
	textSize(18);
	const wd = textWidth(date);
	dsTexte(date, x + l, yy + 2, 18, DS.blanc50, 'right');
	dsTexte(couperLargeurCarte(t('patron.de', { de: t('mail.de') }), l - 80 - wd, 20), x + 64, yy, 20, DS.blanc, 'left');
	dsTexte(t('patron.a'), x + 64, yy + 28, 18, DS.blanc75, 'left');
	yy += 64;
	noStroke();
	fill(m.important ? DS.primaire : DS.blanc15); // prompt 115 : mail mis en avant
	rect(x, yy, l, m.important ? 2 : 1);
	yy += 20;
	// Corps défilable (masqué hors zone)
	const rr = reponsesRapides(m);
	const hPied = rr.length ? 124 : 0;
	const bas = y + h - hPied;
	const zc = { x, y: yy, l, h: bas - yy };
	drawingContext.save();
	drawingContext.beginPath();
	drawingContext.rect(zc.x - 4, zc.y, zc.l + 8, zc.h);
	drawingContext.clip();
	zoneTexteDebut('lectureMail', zc.x - 4, zc.y, zc.l + 8, zc.h, { clip: true });
	const n0 = boutons.length;
	let yc = zc.y - PATRON.defilLecture;
	const lt = Math.min(l - 24, 820); // lignes de lecture confortables
	yc += dessinerTexte(String(m.texte), x, yc, lt, STYLE_CORPS()).h + 20;
	if (aUnBloc(m)) {
		const hb = typeDe(m) === 'reproche' || !blocDeplie(m) ? 32 : typeDe(m) === 'soir' ? blocSoir(m, x, 0, Math.min(lt, 720), false) : { consigne: 56, alerte: 44, conseil: 44, reproche: 60, budget: 44, equipes: 40, info: 0 }[typeDe(m)] || 0;
		blocEnrichi(m, x, yc, Math.min(lt, 720), panne);
		yc += hb + 20;
	}
	if (m.reponse) yc += reponseCitee(m, x, yc, lt);
	zoneTexteFin();
	drawingContext.restore();
	for (let i = boutons.length - 1; i >= n0; i--) if (boutons[i].y + boutons[i].h <= zc.y || boutons[i].y >= zc.y + zc.h) boutons.splice(i, 1);
	PATRON.maxLecture = Math.max(0, yc + PATRON.defilLecture - zc.y - zc.h);
	PATRON.defilLecture = constrain(PATRON.defilLecture, 0, PATRON.maxLecture);
	PATRON.zoneLecture = { x, y, l, h };
	if (PATRON.zoneFocus === 'lecture') contourFocus(x - 12, y - 8, l + 24, h + 8);
	if (rr.length) zoneRepondre(m, x, y + h - hPied + 12, l, hPied - 12, panne);
}
/** Prompt 195 : la réponse envoyée, comme un message du fil — « Vous », destinataire, heure, texte, puis le mail
 * d'origine cité (barre à gauche) ; renvoie la hauteur */
function reponseCitee(m, x, y, l) {
	noStroke();
	fill(DS.blanc15);
	rect(x, y, l, 1);
	let yy = y + 20;
	pastilleInitiales(t('patron.vous'), x, yy, 40);
	dsTexte(t('patron.vous') + (m.reponseA ? ' · ' + m.reponseA : ''), x + 56, yy - 2, 18, DS.blanc, 'left');
	dsTexte(couperLargeurCarte(t('patron.aDe', { de: t('mail.de') }), l - 56, 18), x + 56, yy + 22, 18, DS.blanc50, 'left');
	yy += 56;
	yy += dessinerTexte(t('patron.rapide.' + m.reponse), x + 56, yy, l - 56, STYLE_CORPS()).h + 12;
	const cite = t('patron.citation', { heure: m.heure || '', de: t('mail.de') });
	const extrait = couperLargeurCarte(String(m.texte).replace(/\s+/g, ' '), l - 76, 18);
	fill(DS.blanc15);
	rect(x + 56, yy, 3, 56);
	dsTexte(couperLargeurCarte(cite, l - 76, 16), x + 72, yy + 2, 16, DS.blanc50, 'left');
	dsTexte(extrait, x + 72, yy + 28, 18, DS.blanc50, 'left');
	return yy + 72 - y;
}
/** Pied du volet : une zone qui ressemble à un champ de réponse, avec les réponses rapides (aucun effet de jeu) */
function zoneRepondre(m, x, y, l, h, panne) {
	noStroke();
	fill(DS.blanc05);
	rect(x, y, l, h);
	if (PATRON.repondre && PATRON.zoneFocus === 'lecture') contourFocus(x, y, l, h);
	else {
		noFill();
		stroke(DS.blanc15);
		strokeWeight(1);
		rect(x + 0.5, y + 0.5, l - 1, h - 1);
		noStroke();
	}
	iconeLucide('reply', x + 12, y + 10, 20, DS.blanc50);
	dsTexte(couperLargeurCarte(t('patron.repondreA', { de: t('mail.de') }), l - 56, 18), x + 42, y + 10, 18, DS.blanc50, 'left');
	barreReponses(m, x + 12, y + h - 56, l - 24, panne);
}
const minutesDe = (h) => {
	const m = String(h || '').match(/(\d+)\D(\d+)/);
	return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
};
/** Bloc enrichi selon le type, construit avec les valeurs réelles gardées au moment de l'envoi (meta) */
function blocEnrichi(m, x, y, l, panne) {
	const me = m.meta || {};
	const type = typeDe(m);
	if (type === 'reproche' && me.index !== undefined) {
		// Prompt 101 b : « Dossier lié : action » et le rappel répétaient le message ; une seule ligne, un seul geste
		const lib = (me.ligne ? t('sujet.ligne', { ligne: me.ligne }) + ' · ' : '') + t('patron.voirDossier') + '  ›';
		textFont(DS.policeTexte);
		textSize(18);
		dsTexte(lib, x, y + 4, 18, DS.blanc75, 'left');
		if (!panne) boutons.push({ x, y: y - 8, l: Math.min(l, textWidth(lib) + 16), h: 44, action: () => voirDossier(me) });
		return;
	}
	if (!blocDeplie(m)) {
		// Prompt 101 : une ligne en texte secondaire, dépliée au clic (ou V : tout déplier)
		const lib = (type === 'reproche' && me.index !== undefined ? t('patron.dossierLie', { r: [me.ligne ? t('sujet.ligne', { ligne: me.ligne }) : '', me.action ? String(Jeu.libelleAction(me.action)) : ''].filter(Boolean).join(' · ') }) : t('journal.details')) + '  ›';
		textFont(DS.policeTexte);
		textSize(18);
		dsTexte(lib, x, y + 4, 18, DS.blanc50, 'left');
		boutons.push({ x, y: y - 8, l: Math.min(l, textWidth(lib) + 16), h: 44, action: () => (PATRON.deplies.add(m), annoncer(lib)) });
		return;
	}
	if (type === 'consigne' && me.jauge) {
		const obj = me.jauge === 'budget' ? t('obj.budget', { seuil: me.seuil }) : t('obj.garder', { jauge: t('jauge.' + me.jauge), seuil: me.seuil });
		const puces = [t('patron.puce.objectif', { o: obj }), t('patron.puce.budget', { b: me.budget }), t('patron.puce.dossiers', { n: me.n })];
		if (me.mod) puces.push(t('patron.puce.mod', { m: t('mod.' + me.mod) }));
		let px = x;
		puces.forEach((p) => {
			textFont(DS.policeTexte);
			textSize(18);
			const w = textWidth(p) + 20;
			if (px + w > x + l) return;
			noStroke();
			fill(DS.blanc15);
			rect(px, y, w, 32);
			dsTexte(p, px + 10, y + 7, 18, DS.blanc, 'left');
			px += w + 8;
		});
	} else if ((type === 'alerte' || type === 'conseil') && me.jauge) {
		miniJauge(t('jaugeTitre.' + me.jauge), me.v, 100, me.seuil, x, y, Math.min(l, 520));
	} else if (type === 'alerte' && me.score !== undefined) {
		miniJauge(t('patron.scoreSalle') + ' · ' + t(me.niveau === 2 ? 'statut.dernier' : 'statut.surveillance'), me.score, 300, me.niveau === 2 ? 90 : 120, x, y, Math.min(l, 520));
	} else if (type === 'reproche' && me.index !== undefined) {
		const rappel = (me.ligne ? t('sujet.ligne', { ligne: me.ligne }) : '') + (me.action ? ' · ' + String(Jeu.libelleAction(me.action)) : '') + (me.meilleure ? ' → ' + t('patron.meilleure', { a: String(Jeu.libelleAction(me.meilleure)) }) : '');
		dsTexte(rappel, x, y + 10, 18, DS.blanc75, 'left', l - 260);
		dsBouton(x + l - 240, y, 240, 48, t('patron.voirDossier'), () => voirDossier(me), 'contour', panne);
	} else if (type === 'budget' && me.b !== undefined) {
		dsTexte(t('patron.budgetValeur', { b: me.b }), x, y + 8, 18, DS.blanc, 'left');
		dsBadge(x + 220, y + 18, t('patron.palier.' + (me.palier || 'moyen')), me.palier === 'haut' ? 'succes' : me.palier === 'bas' ? 'erreur' : 'alerte');
	} else if (type === 'soir' && me.lignes) {
		blocSoir(m, x, y, l, true);
	} else if (type === 'equipes' && me.effectifs) {
		dsTexte(Object.keys(me.effectifs).map((k) => String(Jeu.EQUIPES[k].nom) + ' ' + me.effectifs[k]).join(' · '), x, y + 6, 18, DS.infoClair, 'left', l);
	}
}
/** Prompt 194 : bilan compact du mail du soir (prompt 191) — lignes réelles gardées à l'envoi ; renvoie la hauteur */
function blocSoir(m, x, y, l, dessiner) {
	const o = { taille: 18, interligne: 26, maxLignes: 3 };
	let h = 28;
	if (dessiner) dsTexte(t('mailf.bilan'), x, y, 16, DS.blanc50, 'left');
	for (const ligne of m.meta.lignes || []) {
		const txt = String(ligne.texte);
		const hl = hauteurTexte(txt, l - 18, o);
		if (dessiner) {
			if (ligne.fait) {
				noStroke();
				fill(ligne.ok ? DS.succes : DS.primaire);
				rect(x, y + h + 3, 4, 18);
			}
			dessinerTexte(txt, x + 18, y + h, l - 18, Object.assign({ couleur: ligne.fait ? (ligne.ok ? DS.succesClair : DS.erreurClair) : DS.blanc75 }, o));
		}
		h += hl + 6;
	}
	return h;
}
function miniJauge(lib, v, max, seuil, x, y, l) {
	dsTexte(lib + ' ' + v, x, y + 4, 18, DS.blanc, 'left');
	const bx = x + 300;
	const bl = l - 300;
	noStroke();
	fill(DS.blanc15);
	rect(bx, y + 10, bl, 14);
	fill(v < seuil ? DS.erreur : v < seuil * 1.5 ? DS.alerte : DS.succes);
	rect(bx, y + 10, (bl * constrain(v, 0, max)) / max, 14);
	fill('#FFFFFF');
	rect(bx + (bl * seuil) / max - 1, y + 4, 2, 26); // seuil
}
/** « Voir le dossier » : ouvre l'enquête du Journal (prompt 63) sur ce dossier */
function voirDossier(me) {
	// Prompt 91 § 3 : redirection avec retour (Échap revient à la messagerie)
	if (typeof voirDossierDepuis === 'function') return voirDossierDepuis(me.index);
}
/** Réponses rapides (2 ou 3, selon le type du dernier message) : AUCUN effet de jeu, une par message */
function reponsesRapides(m) {
	return m && !m.reponse ? REPONSES_RAPIDES[typeDe(m)] || [] : [];
}
function barreReponses(m, x, y, l, panne) {
	const rr = reponsesRapides(m);
	if (!rr.length) return;
	let bx = x;
	rr.forEach((cle, i) => {
		const lib = i + 1 + '  ' + t('patron.rapide.' + cle);
		textFont(DS.policeTexte);
		textSize(18);
		const w = Math.min(textWidth(lib) + 60, x + l - bx);
		if (w < 120) return;
		dsBouton(bx, y, w, 44, lib, () => repondreRapide(m, cle), 'secondaire', panne);
		bx += w + 12;
	});
}
function repondreRapide(m, cle) {
	if (!m || m.reponse || enPanne()) return;
	m.reponse = cle; // cosmétique : rien d'autre ne change (ni jauges, ni score, ni malus)
	m.reponseA = Jeu.horloge ? String(Math.floor(Jeu.horloge.minutes / 60) % 24).padStart(2, '0') + ':' + String(Math.floor(Jeu.horloge.minutes) % 60).padStart(2, '0') : ''; // prompt 195 : heure de jeu affichée dans le fil, au format des mails (hh:mm)
	PATRON.repondre = false;
	Confort.Son.clic();
	annoncer(t('patron.rapide.' + cle));
}
/** Prompt 185 — Tab entre les zones (prompt 195 : barre d'outils → dossiers → liste → lecture), puis le menu
 * d'applis (tabMenuApp) ; true si pris */
const ZONES_MAILS = () => (PATRON.etroit ? (PATRON.lecture ? ['barre', 'dossiers', 'lecture'] : ['barre', 'dossiers', 'liste']) : ['barre', 'dossiers', 'liste', 'lecture']);
function tabPatron() {
	if (typeof MENU_FOCUS !== 'undefined' && MENU_FOCUS.actif) return false;
	if (typeof focusQuitter !== 'undefined' && focusQuitter) return false;
	const zs = ZONES_MAILS();
	const k = zs.indexOf(PATRON.zoneFocus);
	const recul = keyIsDown(SHIFT);
	if (k < 0 && recul) return false; // Maj + Tab sans focus : le menu, à rebours
	const n = k + (recul ? -1 : 1);
	PATRON.repondre = false;
	if (n >= zs.length) return (PATRON.zoneFocus = null), false; // après la dernière zone : le menu d'applis
	PATRON.zoneFocus = n < 0 ? null : zs[n];
	if (PATRON.zoneFocus === 'barre') focusRecherche();
	else if (PATRON.zoneFocus === 'dossiers') {
		const c = compteursMails(PATRON.filtre);
		annoncer(t('patron.zone.dossiers') + ' · ' + t('patron.filtre.' + PATRON.filtre) + ' · ' + t('patron.compteur', { n: c.n, nl: c.nl }));
	} else if (PATRON.zoneFocus === 'liste') annoncer(t('patron.zone.liste') + ' · ' + annonceMail(PATRON.sel));
	else if (PATRON.zoneFocus === 'lecture') annoncer(t('patron.zone.lecture') + (PATRON.sel ? ' · ' + objetMail(PATRON.sel) + ' · ' + String(PATRON.sel.texte) : ''));
	return true;
}
/** « Mail 3 sur 12, non lu · Consigne · 08:49 » */
function annonceMail(m) {
	const { liste } = listeMails();
	const i = liste.indexOf(m);
	if (i < 0) return t(liste.length ? 'patron.aucunSel' : PATRON.recherche ? 'patron.videRecherche' : 'patron.vide', { q: PATRON.recherche });
	return t('patron.annonceMail', { i: i + 1, n: liste.length, nonlu: nonLu(m) ? t('patron.nonLu') : '', type: objetMail(m), heure: heureMail(m) });
}
/** Échap en zone étroite : la lecture revient à la liste ; true si pris */
function echapPatron() {
	if (PC.fenetre !== 'patron' || !PATRON.etroit || !PATRON.lecture) return false;
	PATRON.lecture = false;
	PATRON.voirSel = true;
	if (PATRON.zoneFocus === 'lecture') PATRON.zoneFocus = 'liste';
	Confort.Son.clic();
	annoncer(t('patron.zone.liste'));
	return true;
}
/** Clavier : Tab zones ; ↑ ↓ dossiers / mails / défilement de la lecture ; ← → dossiers (dans la barre d'outils :
 * recherche et actions) ; Entrée ouvre ou agit ; 1-3 réponses rapides du mail ouvert ; V tout déplier */
function touchePatron() {
	if (PC.fenetre !== 'patron') return false;
	if (keyCode === TAB) return tabPatron();
	const zf = PATRON.zoneFocus;
	if (zf === 'barre' && (keyCode === RIGHT_ARROW || keyCode === LEFT_ARROW || keyCode === ENTER || keyCode === RETURN)) {
		const actions = actionsMails(PATRON.sel);
		if (keyCode === ENTER || keyCode === RETURN) {
			const a = actions[PATRON.outil - 1];
			if (a) return a.actif && a.faire(), true;
			PATRON.zoneFocus = 'liste'; // Entrée dans la recherche : aux résultats
			return annoncer(t('patron.zone.liste') + ' · ' + annonceMail(PATRON.sel)), true;
		}
		const n = actions.length + 1; // 0 = recherche, puis les actions
		PATRON.outil = (PATRON.outil + (keyCode === RIGHT_ARROW ? 1 : n - 1)) % n;
		const a = actions[PATRON.outil - 1];
		annoncer(a ? a.lib + (a.actif ? '' : ' · ' + t('patron.indisponible')) : t('patron.recherche'));
		return true;
	}
	const i = FILTRES_PATRON.findIndex((f) => f.cle === PATRON.filtre);
	const pasFiltre = (d) => changerFiltre(FILTRES_PATRON[(i + d + FILTRES_PATRON.length) % FILTRES_PATRON.length].cle);
	if (keyCode === RIGHT_ARROW || keyCode === LEFT_ARROW) return pasFiltre(keyCode === RIGHT_ARROW ? 1 : -1), true;
	const haut = keyCode === UP_ARROW;
	if (haut || keyCode === DOWN_ARROW) {
		if (zf === 'dossiers') return pasFiltre(haut ? -1 : 1), true;
		if (zf === 'lecture' || (PATRON.etroit && PATRON.lecture)) return (PATRON.defilLecture = constrain(PATRON.defilLecture + (haut ? -120 : 120), 0, PATRON.maxLecture)), true;
		const { liste } = listeMails();
		if (!liste.length) return true;
		const k = liste.indexOf(PATRON.sel);
		const m = liste[k < 0 ? 0 : constrain(k + (haut ? -1 : 1), 0, liste.length - 1)];
		annoncer(annonceMail(m)); // avant l'ouverture : l'état « non lu » est encore vrai
		if (PATRON.etroit) (PATRON.sel = m), (PATRON.voirSel = true);
		else ouvrirMail(m, true);
		return true;
	}
	if (keyCode === ENTER || keyCode === RETURN) {
		if (zf === 'dossiers') return (PATRON.zoneFocus = 'liste'), annoncer(t('patron.zone.liste') + ' · ' + annonceMail(PATRON.sel)), true;
		if (zf === 'lecture' || (PATRON.etroit && PATRON.lecture)) {
			const m = PATRON.sel;
			if (m && aUnBloc(m) && BLOCS_PLIABLES.includes(typeDe(m)) && typeDe(m) !== 'reproche') PATRON.deplies.has(m) ? PATRON.deplies.delete(m) : PATRON.deplies.add(m);
			else if (m && typeDe(m) === 'reproche' && aUnBloc(m) && !enPanne()) voirDossier(m.meta);
			return true;
		}
		if (PATRON.sel) {
			ouvrirMail(PATRON.sel);
			PATRON.zoneFocus = 'lecture';
			annoncer(objetMail(PATRON.sel) + ' · ' + String(PATRON.sel.texte));
		}
		return true;
	}
	if (key === 'v' || key === 'V') return (PATRON.toutDeplie = !PATRON.toutDeplie), annoncer(t(PATRON.toutDeplie ? 'journal.details' : 'journal.detailsMasquer')), true; // prompt 101
	const rr = reponsesRapides(PATRON.sel);
	if (Number(key) >= 1 && Number(key) <= rr.length) return repondreRapide(PATRON.sel, rr[Number(key) - 1]), true;
	return false;
}
function mollettePatron(delta) {
	if (PC.fenetre !== 'patron' || vue !== 'poste') return false;
	const zl = PATRON.zoneLecture;
	const dansLecture = zl && (PATRON.etroit ? PATRON.lecture : mouseX >= zl.x - 12 && mouseX <= zl.x + zl.l + 12 && mouseY >= zl.y && mouseY <= zl.y + zl.h);
	if (dansLecture) PATRON.defilLecture = constrain(PATRON.defilLecture + delta, 0, PATRON.maxLecture);
	else if (PATRON.zone) PATRON.defil = constrain(PATRON.defil + delta, 0, PATRON.max);
	else return false;
	return true;
}
