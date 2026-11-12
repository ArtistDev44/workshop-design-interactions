/* Nantes en régulation — prompt 86 : messagerie du patron ; prompt 185 : l'appli s'appelle « Mails » (EN « Mail ») et
 * prend la forme d'une vraie messagerie en trois zones — dossiers (= filtres par type, compteurs total / non lus
 * toujours visibles), liste des mails (expéditeur, objet, début du texte, heure de jeu, pastille « non lu »), volet de
 * lecture (mail entier, blocs enrichis, réponses rapides). Identifiant interne inchangé : 'patron' (sauvegardes,
 * tests, pile de navigation). Zone étroite (< 1300 px) ou portrait : deux zones, la lecture remplace la liste
 * (← Liste, Échap). Contenu et effets de jeu inchangés : mêmes messages et mêmes déclencheurs (game.js).
 * Clavier : ↑ ↓ dans la zone qui a le focus, Tab entre les zones (puis menu d'applis), Entrée ouvre, ← → dossiers,
 * 1-3 réponses rapides, V tout déplier.
 */
const PATRON = { deplies: new Set(), toutDeplie: false, dernier: null, filtre: 'tout', defil: 0, defilLecture: 0, maxLecture: 0, ouvert: false, vus: 0, ecritJusqua: 0, max: 0, sel: null, lecture: false, zoneFocus: null, voirSel: false, etroit: false };
const FILTRES_PATRON = [
	{ cle: 'tout', types: null },
	{ cle: 'consignes', types: ['consigne'] },
	{ cle: 'alertes', types: ['alerte', 'conseil'] },
	{ cle: 'reproches', types: ['reproche'] },
	{ cle: 'budget', types: ['budget'] },
	{ cle: 'soirs', types: ['soir'] }, // prompt 194 : les mails du soir (fait marquant, mot du patron, bilan)
];
const COULEURS_TYPES = { consigne: () => DS.info, alerte: () => DS.erreur, conseil: () => DS.alerte, budget: (m) => (m.meta && m.meta.palier === 'haut' ? DS.succes : DS.alerte), reproche: () => DS.primaire, equipes: () => DS.info, info: () => DS.blanc75, soir: (m) => (m.meta && m.meta.positif ? DS.succes : DS.blanc75) };
const REPONSES_RAPIDES = { consigne: ['recu', 'jemen'], alerte: ['redresse', 'compris'], conseil: ['compris'], reproche: ['corrige'], budget: ['recu'], equipes: ['recu'], info: ['recu'], soir: ['recu'] };
/** Prompt 101 : blocs enrichis repliés en une ligne (déplier : clic, ou V pour tous) ; le dernier message reste déplié */
const BLOCS_PLIABLES = ['consigne', 'reproche', 'budget', 'equipes', 'soir'];
const aUnBloc = (m) => (typeDe(m) === 'reproche' ? (m.meta || {}).index !== undefined : Object.keys(m.meta || {}).some((k) => k !== 'important')); // prompt 185 : un reproche sans dossier (départ anticipé) n'a ni bloc ni lien
const blocDeplie = (m) => !BLOCS_PLIABLES.includes(typeDe(m)) || !aUnBloc(m) || PATRON.toutDeplie || PATRON.deplies.has(m) || m === PATRON.dernier;
const typeDe = (m) => (Jeu.TYPES_MESSAGES.includes(m.type) ? m.type : 'info');
const enPanne = () => !!(Jeu.modificateurActif && Jeu.modificateurActif() === 'panne_messagerie');

/** Prompt 170 : pictogramme Lucide 24 px pour chaque type de message (icones-lucide.js) ; aucun emoji système */
const PICTOS = { consigne: 'clipboard-list', alerte: 'triangle-alert', conseil: 'lightbulb', budget: 'coins', reproche: 'message-square-warning', equipes: 'users', info: 'message-square', soir: 'moon' };
function picto(type, x, y, c) {
	iconeLucide(PICTOS[type] || PICTOS.info, x + 1, y, 24, c);
}
/** Avatar original du patron : buste stylisé, cravate, sans visage réaliste */
function avatarPatron(x, y, s) {
	noStroke();
	fill('#2a2626');
	rect(x, y, s, s);
	fill('#c9b8a6');
	rect(x + s * 0.34, y + s * 0.14, s * 0.32, s * 0.3);
	fill('#3a4258');
	rect(x + s * 0.16, y + s * 0.52, s * 0.68, s * 0.48);
	fill('#FFFFFF');
	rect(x + s * 0.42, y + s * 0.52, s * 0.16, s * 0.2);
	fill(DS.primaire);
	rect(x + s * 0.46, y + s * 0.56, s * 0.08, s * 0.36);
}

const typesFiltre = (cle) => (FILTRES_PATRON.find((x) => x.cle === cle) || FILTRES_PATRON[0]).types;
/** Messages bruts d'un dossier (filtre) — base des compteurs */
const mailsDuFiltre = (cle) => {
	const types = typesFiltre(cle);
	return (Jeu.messagesPatron || []).filter((m) => !types || types.includes(typeDe(m)));
};
const messagesFiltres = () => mailsDuFiltre(PATRON.filtre);
/** Compteurs d'un dossier : total et non lus (prompt 185 : toujours affichés) */
function compteursMails(cle) {
	const l = mailsDuFiltre(cle);
	return { n: l.length, nl: l.filter((m) => !m.lu).length };
}
/** Nombre total de mails non lus (badge de l'appli dans le menu) */
const mailsNonLus = () => (Jeu.messagesPatron || []).filter((m) => !m.lu).length;
/** Liste affichée : la plus récente en haut ; un même message répété le même jour (même type, même texte) n'est
 * montré qu'une fois, avec « ×N » (prompt 101 b) ; le dernier attend la fin de « Direction écrit… » */
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
	return { liste: [...groupes.values()].map((g) => g[0]).reverse(), cachee };
}
const groupeDe = (m) => (PATRON.repetes && PATRON.repetes.get(m)) || [m];
const nonLu = (m) => groupeDe(m).some((x) => !x.lu);
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
	if (PATRON.etroit) PATRON.lecture = true;
	if (!sansSon) Confort.Son.clic();
}
/** Lu une fois ouvert dans le volet de lecture (avec ses répétitions « ×N ») */
function marquerLu(m) {
	if (enPanne() || PC.fenetre !== 'patron') return;
	groupeDe(m).forEach((x) => {
		if (!x.lu) (x.lu = true), (x.luA = Jeu.horloge ? Jeu.formaterHeure(Jeu.horloge.minutes) : '');
	});
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
	const { liste, cachee } = listeMails();
	if (!PATRON.ouvert) {
		// À l'ouverture : le plus ancien non lu du dossier (sinon le plus récent) ; en zone étroite, la liste d'abord
		PATRON.ouvert = true;
		PATRON.zoneFocus = null;
		PATRON.lecture = false;
		const nl = liste.filter(nonLu);
		PATRON.sel = nl[nl.length - 1] || liste[0] || null;
		PATRON.voirSel = true;
		PATRON.defilLecture = 0;
	}
	if (PATRON.sel && !liste.includes(PATRON.sel)) PATRON.sel = liste.find((m) => groupeDe(m).includes(PATRON.sel)) || null;
	if (!PATRON.sel && !etroit && liste.length) PATRON.sel = liste[0];
	if (!PATRON.sel) PATRON.lecture = false;
	// En-tête (56 px) : icône, nom de l'appli, statut ; compteur global à droite
	iconeLucide('mail', z.x, z.y + 4, 32, DS.blanc);
	dsTexte(t('app.patron'), z.x + 44, z.y + 4, 24, DS.blanc, 'left');
	noStroke();
	fill(panne ? DS.erreur : DS.succes);
	rect(z.x + 160, z.y + 14, 12, 12);
	dsTexte(t(panne ? 'patron.statut.horsLigne' : 'patron.statut.enLigne'), z.x + 180, z.y + 8, 18, panne ? DS.erreurClair : DS.blanc50, 'left');
	const tot = compteursMails('tout');
	dsTexte(t('patron.compteur', { n: tot.n, nl: tot.nl }), z.x + z.l, z.y + 8, 18, DS.blanc75, 'right');
	let y = z.y + 56;
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
		y += 64;
	} else {
		zoneDossiers(z.x, y, 320, h, false);
		x += 336;
	}
	const hc = z.y + z.h - y;
	const lr = z.x + z.l - x;
	if (etroit) {
		if (PATRON.lecture && PATRON.sel) voletLecture(PATRON.sel, x, y, lr, hc, panne, true);
		else zoneListe(liste, cachee, x, y, lr, hc, panne);
	} else {
		zoneListe(liste, cachee, x, y, 520, hc, panne);
		voletLecture(PATRON.sel, x + 536, y, lr - 536, hc, panne, false);
	}
}
/** Colonne des dossiers : un par filtre, avec le total et les non lus (pastille d'accent) */
function zoneDossiers(x, y, l, h, rangee) {
	const n = FILTRES_PATRON.length;
	FILTRES_PATRON.forEach((f, k) => {
		const r = rangee ? { x: x + (k * l) / n, y, l: l / n - 8, h } : { x, y: y + k * 64, l, h: 56 };
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
		if (!rangee) iconeLucide(types ? PICTOS[types[0]] : 'inbox', r.x + 14, r.y + 16, 24, actif ? DS.blanc : DS.blanc75);
		const lx = rangee ? r.x + 10 : r.x + 50;
		// Compteurs à droite : non lus (pastille d'accent) puis total
		textFont(DS.policeTexte);
		textSize(18);
		const totTxt = String(c.n);
		const wt = textWidth(totTxt);
		dsTexte(totTxt, r.x + r.l - 12, r.y + 18, 18, DS.blanc75, 'right');
		let wnl = 0;
		if (c.nl) {
			const txt = String(c.nl);
			wnl = Math.max(32, textWidth(txt) + 16);
			noStroke();
			fill(DS.primaire);
			rect(r.x + r.l - 24 - wt - wnl, r.y + 14, wnl, 28);
			dsTexte(txt, r.x + r.l - 24 - wt - wnl / 2, r.y + 18, 18, DS.surPrimaire, 'center');
		}
		const place = r.x + r.l - 32 - wt - wnl - lx;
		dsTexte(couperLargeurCarte(t('patron.filtre.' + f.cle), place, 20), lx, r.y + 16, 20, actif ? DS.blanc : DS.blanc75, 'left');
		zoneTexteDeclarer('dossierMails', r.x, r.y, r.l, r.h);
		if (actif && PATRON.zoneFocus === 'dossiers') contourFocus(r.x, r.y, r.l, r.h);
		boutons.push({ x: r.x, y: r.y, l: r.l, h: r.h, action: () => changerFiltre(f.cle) });
	});
}
/** Liste des mails : défilable et masquée hors de sa zone (déclarée à l'audit) */
function zoneListe(liste, cachee, x, y, l, h, panne) {
	noStroke();
	fill(DS.blanc05);
	rect(x, y, l, h);
	const HM = 116;
	drawingContext.save();
	drawingContext.beginPath();
	drawingContext.rect(x, y, l, h);
	drawingContext.clip();
	zoneTexteDebut('listeMails', x, y, l, h, { clip: true }); // prompt 93 : ce qui sort de la zone est masqué exprès
	const n0 = boutons.length;
	let yy = y - PATRON.defil;
	if (cachee) {
		const k = 1 + (Math.floor(millis() / 250) % 3);
		dsTexte(t('patron.ecrit') + ' ' + '•'.repeat(k), x + 32, yy + 12, 18, DS.blanc50, 'left');
		yy += 48;
	}
	if (!liste.length && !cachee) dsTexte(t('app.pasMessage'), x + 16, yy + 16, 20, DS.blanc50, 'left', l - 32);
	const iSel = liste.indexOf(PATRON.sel);
	if (PATRON.voirSel && iSel >= 0) {
		const top = (cachee ? 48 : 0) + iSel * HM;
		if (top < PATRON.defil) PATRON.defil = top;
		else if (top + HM > PATRON.defil + h) PATRON.defil = top + HM - h;
		yy = y - PATRON.defil + (cachee ? 48 : 0);
		PATRON.voirSel = false;
	} else if (cachee) yy = y - PATRON.defil + 48;
	liste.forEach((m) => {
		if (yy + HM >= y && yy <= y + h) itemMail(m, x, yy, l, HM);
		yy += HM;
	});
	zoneTexteFin();
	drawingContext.restore();
	for (let i = boutons.length - 1; i >= n0; i--) if (boutons[i].y + boutons[i].h <= y || boutons[i].y >= y + h) boutons.splice(i, 1);
	if (panne) {
		noStroke();
		fill(13, 12, 12, 140); // liste lisible mais grisée
		rect(x, y, l, h);
	}
	PATRON.max = Math.max(0, yy + PATRON.defil - y - h);
	PATRON.defil = constrain(PATRON.defil, 0, PATRON.max);
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
/** Une ligne de la liste : pastille non lu, expéditeur, heure ; objet ; début du texte */
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
	rect(x + 16, y + h - 1, l - 32, 1);
	if (nl) {
		fill(DS.primaire);
		circle(x + 20, y + 26, 12); // non lu
	}
	dsTexte(heureMail(m), x + l - 16, y + 14, 18, nl ? DS.blanc : DS.blanc50, 'right');
	textFont(DS.policeTexte);
	textSize(18);
	const wh = textWidth(heureMail(m));
	dsTexte(couperLargeurCarte(t('mail.de'), l - 76 - wh, 20), x + 36, y + 12, 20, nl ? DS.blanc : DS.blanc75, 'left');
	picto(typeDe(m), x + 34, y + 44, COULEURS_TYPES[typeDe(m)](m));
	dsTexte(couperLargeurCarte(objetMail(m), l - 100, 18), x + 68, y + 46, 18, nl ? DS.blanc : DS.blanc75, 'left');
	dsTexte(couperLargeurCarte(String(m.texte).replace(/\s+/g, ' '), l - 52, 18), x + 36, y + 78, 18, DS.blanc50, 'left');
	zoneTexteDeclarer('itemMail', x, y, l, h);
	if (sel && PATRON.zoneFocus === 'liste') contourFocus(x, y, l, h);
	boutons.push({ x, y, l, h, action: () => ouvrirMail(m) });
}
/** Volet de lecture : mail entier, bloc enrichi, réponse envoyée ; réponses rapides en pied */
function voletLecture(m, x, y, l, h, panne, avecRetour) {
	if (!m) {
		dsTexte(t('patron.aucunSel'), x + 24, y + 24, 20, DS.blanc50, 'left', l - 48);
		return;
	}
	marquerLu(m);
	let yy = y;
	if (avecRetour) {
		dsBouton(x, yy, 180, 44, '← ' + t('patron.retourListe'), () => ((PATRON.lecture = false), (PATRON.voirSel = true), Confort.Son.clic()), 'contour', false, true);
		yy += 56;
	}
	// En-tête du mail : objet, expéditeur (avatar, nom, rôle), heure de jeu
	picto(typeDe(m), x, yy + 2, COULEURS_TYPES[typeDe(m)](m));
	dsTexte(couperLargeurCarte(objetMail(m), l - 40, 24), x + 36, yy, 24, DS.blanc, 'left');
	yy += 44;
	avatarPatron(x, yy, 48);
	dsTexte(couperLargeurCarte(t('mail.de'), l - 260, 20), x + 64, yy, 20, DS.blanc, 'left');
	dsTexte(couperLargeurCarte(t('patron.role'), l - 80, 18), x + 64, yy + 28, 18, DS.blanc50, 'left');
	dsTexte(heureMail(m), x + l, yy + 2, 18, DS.blanc50, 'right');
	yy += 64;
	noStroke();
	fill(m.important ? DS.primaire : DS.blanc15); // prompt 115 : mail mis en avant
	rect(x, yy, l, m.important ? 2 : 1);
	yy += 16;
	// Corps défilable (masqué hors zone)
	const rr = reponsesRapides(m);
	const bas = y + h - (rr.length ? 64 : 0);
	const zc = { x, y: yy, l, h: bas - yy };
	drawingContext.save();
	drawingContext.beginPath();
	drawingContext.rect(zc.x - 4, zc.y, zc.l + 8, zc.h);
	drawingContext.clip();
	zoneTexteDebut('lectureMail', zc.x - 4, zc.y, zc.l + 8, zc.h, { clip: true });
	const n0 = boutons.length;
	let yc = zc.y - PATRON.defilLecture;
	const lt = l - 24;
	dsTexte(String(m.texte), x, yc, 20, DS.blanc, 'left', lt);
	textFont(DS.policeTexte);
	textSize(20);
	yc += Math.max(1, couperLignes(String(m.texte), lt, DS.policeTexte, 20).length) * 28 + 16;
	if (aUnBloc(m)) {
		const hb = typeDe(m) === 'reproche' || !blocDeplie(m) ? 32 : typeDe(m) === 'soir' ? blocSoir(m, x, 0, Math.min(lt, 720), false) : { consigne: 56, alerte: 44, conseil: 44, reproche: 60, budget: 44, equipes: 40, info: 0 }[typeDe(m)] || 0;
		blocEnrichi(m, x, yc, Math.min(lt, 720), panne);
		yc += hb + 16;
	}
	if (m.reponse) {
		// Réponse du joueur : bulle à droite
		const txt = t('patron.rapide.' + m.reponse);
		textFont(DS.policeTexte);
		textSize(18);
		const w = Math.min(l, textWidth(txt) + 40);
		noStroke();
		fill(DS.blanc15);
		rect(x + l - w, yc, w, 40);
		dsTexte(txt, x + l - 20, yc + 9, 18, DS.blanc, 'right');
		yc += 56;
	}
	zoneTexteFin();
	drawingContext.restore();
	for (let i = boutons.length - 1; i >= n0; i--) if (boutons[i].y + boutons[i].h <= zc.y || boutons[i].y >= zc.y + zc.h) boutons.splice(i, 1);
	PATRON.maxLecture = Math.max(0, yc + PATRON.defilLecture - zc.y - zc.h);
	PATRON.defilLecture = constrain(PATRON.defilLecture, 0, PATRON.maxLecture);
	PATRON.zoneLecture = { x, y, l, h };
	if (PATRON.zoneFocus === 'lecture') contourFocus(x - 12, y - 8, l + 24, h + 8);
	barreReponses(m, x, y + h - 52, l, panne);
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
		if (me.mod) puces.push(t('patron.puce.mod', { m: t('mod.' + me.mod) }) + (me.bloque ? ' · ' + t('patron.puce.bloque', { a: t('action.' + { devier: 'devier', retenir: 'retenir', renfort: 'renfort' }[me.bloque]) }) : ''));
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
		const w = textWidth(lib) + 60;
		dsBouton(bx, y, w, 48, lib, () => repondreRapide(m, cle), 'secondaire', panne);
		bx += w + 12;
	});
}
function repondreRapide(m, cle) {
	if (!m || m.reponse || enPanne()) return;
	m.reponse = cle; // cosmétique : rien d'autre ne change (ni jauges, ni score, ni malus)
	Confort.Son.clic();
	annoncer(t('patron.rapide.' + cle));
}
/** Prompt 185 — Tab entre les zones (dossiers → liste → lecture), puis le menu d'applis (tabMenuApp) ; true si pris */
const ZONES_MAILS = () => (PATRON.etroit ? (PATRON.lecture ? ['dossiers', 'lecture'] : ['dossiers', 'liste']) : ['dossiers', 'liste', 'lecture']);
function tabPatron() {
	if (typeof MENU_FOCUS !== 'undefined' && MENU_FOCUS.actif) return false;
	if (typeof focusQuitter !== 'undefined' && focusQuitter) return false;
	const zs = ZONES_MAILS();
	const k = zs.indexOf(PATRON.zoneFocus);
	const recul = keyIsDown(SHIFT);
	if (k < 0 && recul) return false; // Maj + Tab sans focus : le menu, à rebours
	const n = k + (recul ? -1 : 1);
	if (n >= zs.length) return (PATRON.zoneFocus = null), false; // après la dernière zone : le menu d'applis
	PATRON.zoneFocus = n < 0 ? null : zs[n];
	if (PATRON.zoneFocus === 'dossiers') {
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
	if (i < 0) return t('patron.aucunSel');
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
/** Clavier : Tab zones ; ↑ ↓ dossiers / mails / défilement de la lecture ; ← → dossiers ; Entrée ouvre ;
 * 1-3 réponses rapides du mail ouvert ; V tout déplier */
function touchePatron() {
	if (PC.fenetre !== 'patron') return false;
	if (keyCode === TAB) return tabPatron();
	const zf = PATRON.zoneFocus;
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
