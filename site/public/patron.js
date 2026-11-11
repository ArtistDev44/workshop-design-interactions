/* Nantes en régulation — prompt 86 : l'appli « Messages du patron » devient une messagerie moderne et lisible.
 * Design system Pixel (ds.js) ; aucune imitation d'une messagerie existante. Contenu et effets de jeu inchangés :
 * mêmes messages et mêmes déclencheurs (game.js), désormais typés avec leurs valeurs réelles au moment de l'envoi.
 * En-tête (statut en ligne / hors ligne, filtres), consigne du jour épinglée, historique complet défilable avec
 * séparateurs de journée, cartes typées (bloc enrichi selon le type), lus / non lus, accusés de lecture,
 * indicateur de saisie (affichage seul : l'heure du message ne change pas), réponses rapides SANS effet de jeu.
 */
const PATRON = { filtre: 'tout', defil: 0, ouvert: false, epingle: false, premierNonLu: -1, vus: 0, ecritJusqua: 0, hauteurs: new Map(), max: 0 };
const FILTRES_PATRON = [
	{ cle: 'tout', types: null },
	{ cle: 'consignes', types: ['consigne'] },
	{ cle: 'alertes', types: ['alerte', 'conseil'] },
	{ cle: 'reproches', types: ['reproche'] },
	{ cle: 'budget', types: ['budget'] },
];
const COULEURS_TYPES = { consigne: () => DS.info, alerte: () => DS.erreur, conseil: () => DS.alerte, budget: (m) => (m.meta && m.meta.palier === 'haut' ? DS.succes : DS.alerte), reproche: () => DS.primaire, equipes: () => DS.info, info: () => DS.blanc75 };
const REPONSES_RAPIDES = { consigne: ['recu', 'jemen'], alerte: ['redresse', 'compris'], conseil: ['compris'], reproche: ['corrige'], budget: ['recu'], equipes: ['recu'], info: ['recu'] };
const typeDe = (m) => (Jeu.TYPES_MESSAGES.includes(m.type) ? m.type : 'info');
const enPanne = () => !!(Jeu.modificateurActif && Jeu.modificateurActif() === 'panne_messagerie');

/** Pictogramme pixel original 16 × 16 (agrandi ×2) pour chaque type ; aucun emoji système */
const PICTOS = {
	consigne: ['..######..', '.#......#.', '.#.####.#.', '.#......#.', '.#.####.#.', '.#......#.', '.#.###..#.', '.########.'],
	alerte: ['....##....', '...####...', '...#..#...', '..#.##.#..', '..#.##.#..', '.#......#.', '.#..##..#.', '##########'],
	conseil: ['...####...', '..#....#..', '.#......#.', '.#......#.', '..#....#..', '...####...', '...####...', '....##....'],
	budget: ['..######..', '.#......#.', '#...##...#', '#..#..#..#', '#...##...#', '#..#..#..#', '.#......#.', '..######..'],
	reproche: ['########..', '#......#..', '#.####.#..', '#......###', '#.##.##..#', '#...#....#', '#..#.##..#', '##########'],
	equipes: ['...####...', '..#....#..', '.########.', '#.#.##.#.#', '##########', '#........#', '##.####.##', '.##....##.'],
	info: ['.########.', '#........#', '#.######.#', '#........#', '#.####...#', '#........#', '.###.#####', '...##.....'],
};
function picto(type, x, y, c) {
	noStroke();
	fill(c);
	(PICTOS[type] || PICTOS.info).forEach((ligne, j) => [...ligne].forEach((v, i) => v === '#' && rect(x + i * 2.6, y + j * 3, 2.6, 3)));
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

const messagesFiltres = () => {
	const f = FILTRES_PATRON.find((x) => x.cle === PATRON.filtre) || FILTRES_PATRON[0];
	return (Jeu.messagesPatron || []).filter((m) => !f.types || f.types.includes(typeDe(m)));
};
function changerFiltre(cle) {
	PATRON.filtre = cle;
	PATRON.defil = 0;
	Confort.Son.clic();
	annoncer(t('patron.filtre.' + cle));
}
/** Une fois par image : sons (alerte distincte), indicateur de saisie avant un nouveau message */
function majPatron() {
	const n = (Jeu.messagesPatron || []).length;
	if (n > PATRON.vus && PATRON.vus) {
		const m = Jeu.messagesPatron[n - 1];
		Confort.Son.bip(typeDe(m) === 'alerte' ? 'alerte' : 'choix');
		if (!reduireAnimations) PATRON.ecritJusqua = millis() + 800; // « Direction écrit… » 0,8 s, puis le message glisse
	}
	PATRON.vus = n;
}

/** Hauteur d'une carte, mise en cache (recalculée au changement de langue ou de largeur) */
function hauteurCarte(m, l) {
	const cle = Langue.actuelle + '|' + l + '|' + (m.reponse || '');
	const c = PATRON.hauteurs.get(m);
	if (c && c.cle === cle) return c.h;
	textFont(DS.policeTexte);
	textSize(20);
	const n = Math.max(1, Math.ceil((textWidth(String(m.texte)) * 1.06) / (l - 70)));
	const bloc = { consigne: 56, alerte: 44, conseil: 44, reproche: 60, budget: 44, equipes: 40, info: 0 }[typeDe(m)] || 0;
	const h = 46 + n * 28 + (bloc ? bloc + 8 : 0) + 18 + (m.reponse ? 56 : 0);
	PATRON.hauteurs.set(m, { cle, h });
	return h;
}

function appPatron(z) {
	const mobile = typeof PORTRAIT !== 'undefined' && PORTRAIT.actif;
	const l = mobile ? Math.min(z.l, 860) : z.l;
	const panne = enPanne();
	// À l'ouverture : position sur le premier non lu, séparateur « Nouveaux messages »
	if (!PATRON.ouvert) {
		PATRON.ouvert = true;
		PATRON.premierNonLu = (Jeu.messagesPatron || []).findIndex((m) => !m.lu);
		PATRON.allerNonLu = PATRON.premierNonLu >= 0;
	}
	// En-tête de conversation (88 px) : avatar, nom, rôle, statut ; filtres à droite
	avatarPatron(z.x, z.y, 64);
	dsTexte(t('mail.de'), z.x + 80, z.y + 4, 20, DS.blanc, 'left');
	dsTexte(t('patron.role'), z.x + 80, z.y + 32, 18, DS.blanc50, 'left');
	noStroke();
	fill(panne ? DS.erreur : DS.succes);
	rect(z.x + 80, z.y + 62, 12, 12);
	dsTexte(t(panne ? 'patron.statut.horsLigne' : 'patron.statut.enLigne'), z.x + 100, z.y + 58, 18, panne ? DS.erreurClair : DS.succesClair, 'left');
	let fx = z.x + l;
	FILTRES_PATRON.slice()
		.reverse()
		.forEach((f) => {
			const nb = (Jeu.messagesPatron || []).filter((m) => !f.types || f.types.includes(typeDe(m))).length;
			const lib = t('patron.filtre.' + f.cle) + ' ' + nb;
			textFont(DS.policeTexte);
			textSize(18);
			const w = Math.max(110, textWidth(lib) + 64); // place pour le chevron de dsBouton
			fx -= w + 8;
			if (mobile && f.cle !== 'tout' && f.cle !== PATRON.filtre) return; // portrait : filtres réduits
			dsBouton(fx, z.y + 14, w, 44, lib, () => changerFiltre(f.cle), PATRON.filtre === f.cle ? 'primaire' : 'contour');
		});
	let y = z.y + 88;
	// Bandeau de panne : on ne masque plus tout
	if (panne) {
		noStroke();
		fill(DS.erreur);
		rect(z.x, y, l, 40);
		dsTexte(t('patron.reconnexion', { s: Math.ceil((Jeu.modificateur.fin - millis()) / 1000) }), z.x + 14, y + 8, 20, '#FFFFFF', 'left');
		y += 48;
	}
	// Consigne du jour épinglée (une ligne, se déroule au clic ou avec Entrée)
	const consigne = (Jeu.messagesPatron || []).filter((m) => typeDe(m) === 'consigne' && m.jour === ((Jeu.jourCourant() || {}).date || null)).pop();
	if (consigne) {
		noStroke();
		fill(DS.blanc05);
		rect(z.x, y, l, PATRON.epingle ? 96 : 44);
		fill(DS.info);
		rect(z.x, y, 4, PATRON.epingle ? 96 : 44);
		picto('consigne', z.x + 14, y + 8, DS.infoClair);
		const txt = t('patron.epingle') + ' · ' + String(consigne.texte);
		if (PATRON.epingle) dsTexte(txt, z.x + 52, y + 10, 18, DS.blanc, 'left', l - 70);
		else {
			textFont(DS.policeTexte);
			textSize(18);
			let court = txt;
			while (court.length > 8 && textWidth(court) > l - 90) court = court.slice(0, -2);
			dsTexte(court === txt ? txt : court + '…', z.x + 52, y + 12, 18, DS.blanc, 'left');
		}
		boutons.push({ x: z.x, y, l, h: PATRON.epingle ? 96 : 44, action: () => (PATRON.epingle = !PATRON.epingle) });
		y += (PATRON.epingle ? 96 : 44) + 8;
	}
	// Fil défilable
	const zf = { x: z.x, y, l, h: z.y + z.h - y - 64 };
	const liste = messagesFiltres();
	const cachee = PATRON.ecritJusqua > millis() ? liste[liste.length - 1] : null; // le dernier attend la fin de « écrit… »
	drawingContext.save();
	drawingContext.beginPath();
	drawingContext.rect(zf.x - 4, zf.y, zf.l + 8, zf.h);
	drawingContext.clip();
	const n0 = boutons.length;
	let yy = zf.y - PATRON.defil;
	let jour = null;
	let prec = null;
	liste.forEach((m) => {
		if (m === cachee) return;
		if (m.jour && m.jour !== jour) {
			jour = m.jour;
			yy += separateurJour(m.jour, zf.x, yy, l);
		}
		const i = Jeu.messagesPatron.indexOf(m);
		if (i === PATRON.premierNonLu) {
			if (PATRON.allerNonLu) {
				PATRON.defil = Math.max(0, yy - zf.y - 8 + PATRON.defil);
				PATRON.allerNonLu = false;
			}
			noStroke();
			fill(DS.primaire);
			rect(zf.x, yy + 12, l, 2);
			dsTexte(t('patron.nouveaux'), zf.x + l / 2, yy, 18, DS.erreurClair, 'center');
			yy += 34;
		}
		// Regroupement : même type à moins de 30 min de jeu → une seule heure
		const groupe = prec && typeDe(prec) === typeDe(m) && prec.jour === m.jour && Math.abs(minutesDe(m.heure) - minutesDe(prec.heure)) < 30;
		const h = hauteurCarte(m, l) - (groupe ? 0 : 0);
		if (yy + h >= zf.y && yy <= zf.y + zf.h) carteMessage(m, zf.x, yy, l, groupe, panne); // seulement les cartes visibles
		yy += h + 10;
		prec = m;
	});
	if (cachee) {
		const n = 1 + (Math.floor(millis() / 250) % 3);
		dsTexte(t('patron.ecrit') + ' ' + '•'.repeat(n), zf.x, yy + 6, 18, DS.blanc50, 'left');
		yy += 40;
	}
	if (!liste.length) dsTexte(t('app.pasMessage'), zf.x, zf.y, 20, DS.blanc50, 'left');
	// Accusé du dernier message : « Envoyé » à la réception, « Lu · HH:MM » une fois affiché
	const dernier = liste[liste.length - 1];
	if (dernier && dernier !== cachee) dsTexte(dernier.lu ? t('patron.lu', { heure: dernier.luA || dernier.heure }) : t('patron.envoye'), zf.x + l, yy - 4, 16, DS.blanc50, 'right');
	drawingContext.restore();
	for (let i = boutons.length - 1; i >= n0; i--) if (boutons[i].y + boutons[i].h < zf.y || boutons[i].y > zf.y + zf.h) boutons.splice(i, 1);
	if (panne) {
		noStroke();
		fill(13, 12, 12, 140); // historique lisible mais grisé
		rect(zf.x, zf.y, zf.l, zf.h);
	}
	PATRON.max = Math.max(0, yy + PATRON.defil - zf.y - zf.h);
	PATRON.defil = constrain(PATRON.defil, 0, PATRON.max);
	PATRON.zone = zf;
	if (PATRON.max > 0) {
		const hb = Math.max(40, (zf.h * zf.h) / (zf.h + PATRON.max));
		noStroke();
		fill(DS.blanc15);
		rect(zf.x + l + 4, zf.y, 4, zf.h);
		fill(DS.blanc75);
		rect(zf.x + l + 4, zf.y + ((zf.h - hb) * PATRON.defil) / PATRON.max, 4, hb);
	}
	barreReponses(dernier && dernier !== cachee ? dernier : null, z.x, z.y + z.h - 56, l, panne);
}
const minutesDe = (h) => {
	const m = String(h || '').match(/(\d+)\D(\d+)/);
	return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
};
function separateurJour(iso, x, y, l) {
	const [a, mo, j] = iso.split('-').map(Number);
	const txt = new Date(Date.UTC(a, mo - 1, j)).toLocaleDateString(localeActive(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
	const lib = txt.charAt(0).toUpperCase() + txt.slice(1);
	textFont(DS.policeTexte);
	textSize(18);
	const w = textWidth(lib) + 32;
	noStroke();
	fill(DS.blanc15);
	rect(x, y + 14, (l - w) / 2, 2);
	rect(x + (l + w) / 2, y + 14, (l - w) / 2, 2);
	dsTexte(lib, x + l / 2, y + 4, 18, DS.blanc50, 'center');
	return 40;
}
/** Carte d'un message : barre de couleur du type, pictogramme, libellé, heure, texte, bloc enrichi (meta) */
function carteMessage(m, x, y, l, groupe, panne) {
	const type = typeDe(m);
	const c = COULEURS_TYPES[type](m);
	const h = hauteurCarte(m, l);
	const arrivee = reduireAnimations || m._vu ? 0 : 8;
	if (!m._vu) m._vu = millis();
	const dx = reduireAnimations ? 0 : Math.max(0, arrivee - (millis() - m._vu) / 25);
	noStroke();
	fill(m.important ? 'rgba(212,3,28,0.16)' : DS.blanc05);
	rect(x + dx, y, l - (m.reponse ? 0 : 0), h - (m.reponse ? 56 : 0));
	stroke(DS.blanc15);
	strokeWeight(2);
	noFill();
	rect(x + dx + 1, y + 1, l - 2, h - 2 - (m.reponse ? 56 : 0));
	noStroke();
	fill(c);
	rect(x + dx, y, 4, h - (m.reponse ? 56 : 0));
	if (!m.lu) {
		fill(DS.primaire);
		circle(x + dx - 10, y + 22, 10); // non lu
	}
	picto(type, x + dx + 16, y + 12, c);
	dsTexte(t('patron.type.' + type).toUpperCase() + (m.enRetard ? ' · ' + t('patron.retard') : ''), x + dx + 52, y + 14, 16, c, 'left');
	if (!groupe) dsTexte(m.heure, x + dx + l - 14, y + 14, 18, DS.blanc50, 'right');
	dsTexte(String(m.texte), x + dx + 18, y + 44, 20, m.lu ? DS.blanc75 : DS.blanc, 'left', l - 70);
	textFont(DS.policeTexte);
	textSize(20);
	const yb = y + 44 + Math.max(1, Math.ceil((textWidth(String(m.texte)) * 1.06) / (l - 70))) * 28 + 6;
	blocEnrichi(m, x + dx + 18, yb, l - 36, panne);
	if (m.reponse) {
		// Réponse du joueur : bulle à droite, accusé « Vu ✓ »
		const txt = t('patron.rapide.' + m.reponse);
		textFont(DS.policeTexte);
		textSize(18);
		const w = textWidth(txt) + 120;
		fill(DS.blanc15);
		rect(x + l - w, y + h - 48, w, 40);
		dsTexte(txt + '  · ' + t('patron.vu'), x + l - 14, y + h - 40, 18, DS.blanc, 'right');
	}
	// Lu une fois affiché dans l'appli ouverte
	if (!m.lu && !panne && PC.fenetre === 'patron') {
		m.lu = true;
		m.luA = Jeu.horloge ? Jeu.formaterHeure(Jeu.horloge.minutes) : '';
	}
}
/** Bloc enrichi selon le type, construit avec les valeurs réelles gardées au moment de l'envoi (meta) */
function blocEnrichi(m, x, y, l, panne) {
	const me = m.meta || {};
	const type = typeDe(m);
	if (type === 'consigne' && me.jauge) {
		const obj = me.jauge === 'budget' ? t('obj.budget', { seuil: me.seuil }) : t('obj.garder', { jauge: t('jauge.' + me.jauge), seuil: me.seuil });
		const puces = [t('patron.puce.objectif', { o: obj }), t('patron.puce.budget', { b: me.budget }), t('patron.puce.dossiers', { n: me.n })];
		if (me.mod) puces.push(t('patron.puce.mod', { m: t('mod.' + me.mod) }) + (me.bloque ? ' · ' + t('patron.puce.bloque', { a: t('action.' + { devier: 'devier', retenir: 'retenir', renfort: 'renfort' }[me.bloque]) }) : ''));
		let px = x;
		puces.forEach((p) => {
			textFont(DS.policeTexte);
			textSize(16);
			const w = textWidth(p) + 20;
			if (px + w > x + l) return;
			noStroke();
			fill(DS.blanc15);
			rect(px, y, w, 32);
			dsTexte(p, px + 10, y + 7, 16, DS.blanc, 'left');
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
	} else if (type === 'equipes' && me.effectifs) {
		dsTexte(Object.keys(me.effectifs).map((k) => String(Jeu.EQUIPES[k].nom) + ' ' + me.effectifs[k]).join(' · '), x, y + 6, 18, DS.infoClair, 'left', l);
	}
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
	const e = (Jeu.evenementsJournee || []).find((x) => x.index === me.index && (!me.jour || x.jour === me.jour));
	if (!e) return;
	const ji = (Jeu.jours || []).findIndex((j) => j.date === e.jour);
	JOURNAL.jour = ji;
	JOURNAL.enquete = (Jeu.evenementsJournee || []).filter((x) => x.jour === e.jour).indexOf(e);
	JOURNAL.volet = 0;
	PC.fenetre = 'journal';
	annoncer(t('journal.enquete'));
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
/** Clavier : ← → filtres, ↑ ↓ défilement, Entrée = déroule la consigne épinglée, 1-3 = réponses rapides */
function touchePatron() {
	if (PC.fenetre !== 'patron') return false;
	const i = FILTRES_PATRON.findIndex((f) => f.cle === PATRON.filtre);
	if (keyCode === RIGHT_ARROW || keyCode === LEFT_ARROW) return changerFiltre(FILTRES_PATRON[(i + (keyCode === RIGHT_ARROW ? 1 : FILTRES_PATRON.length - 1)) % FILTRES_PATRON.length].cle), true;
	if (keyCode === UP_ARROW || keyCode === DOWN_ARROW) return (PATRON.defil = constrain(PATRON.defil + (keyCode === DOWN_ARROW ? 120 : -120), 0, PATRON.max)), true;
	if (keyCode === ENTER || keyCode === RETURN) return (PATRON.epingle = !PATRON.epingle), true;
	const l = messagesFiltres();
	const rr = reponsesRapides(l[l.length - 1]);
	if (Number(key) >= 1 && Number(key) <= rr.length) return repondreRapide(l[l.length - 1], rr[Number(key) - 1]), true;
	return false;
}
function mollettePatron(delta) {
	if (PC.fenetre !== 'patron' || !PATRON.zone || vue !== 'poste') return false;
	PATRON.defil = constrain(PATRON.defil + delta, 0, PATRON.max);
	return true;
}
