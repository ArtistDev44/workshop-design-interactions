/* Nantes en régulation — prompt 85 : l'appli Community devient le compte social de la régulation nantaise.
 * Réseau INVENTÉ pour le jeu (« Quai »), compte fictif « Régul' Nantes · salle de contrôle » (@regul.nte) : aucun
 * logo, nom, couleur ni mise en page d'un réseau ou d'un transporteur réel. Design system Pixel (ds.js).
 * Mêmes mécaniques qu'avant (plaintes du prompt 28, réactions du 63, délai du 79), dans une nouvelle interface :
 * profil, onglets Fil / Mentions / Messagerie / Statistiques, colonne « Ce qui se passe à Nantes ».
 * Photos : dessinées par le code (createGraphics basse définition, agrandies avec un lissage léger), mises en cache.
 * Compteurs (abonnés, « j'aime ») : valeurs de jeu dérivées de la réputation, jamais présentées comme réelles.
 */
const COMMU = { onglet: 'fil', defil: 0, grille: false, conv: 0, ouvert: null, publier: null, vus: 0 };
const ONGLETS_COMMU = ['fil', 'mentions', 'messagerie', 'stats'];
const cachePhotos = new Map();
const plaintesPubliques = () => (Jeu.plaintes || []).filter((p) => !(p.def && p.def.prive));
const plaintesPrivees = () => (Jeu.plaintes || []).filter((p) => p.def && p.def.prive);
const enAttenteDe = (liste) => liste.filter((p) => p.reponse === null && !p.expiree && !p.transmise);
/** Plainte visée par le clavier (Tab, Entrée, 1-2-3) : la conversation ouverte en messagerie, sinon la première mention */
function cibleCommunity() {
	if (COMMU.onglet === 'messagerie') {
		const p = plaintesPrivees()[COMMU.conv];
		return p && p.reponse === null && !p.expiree && !p.transmise ? p : null;
	}
	return enAttenteDe(plaintesPubliques())[0] || null;
}

// ——— Photos pixel « à peine perceptibles » ———
/** Photo d'un sujet réel (tram, bus, navibus, travaux, foule, météo), météo et heure du fait ; mise en cache */
function photoPixel(photo, pluie, nuit) {
	const cle = [photo.sujet, photo.couleur || '', pluie ? 1 : 0, nuit ? 1 : 0].join('|');
	if (cachePhotos.has(cle)) return cachePhotos.get(cle);
	const W = 160;
	const Hh = 100;
	const g = createGraphics(W, Hh);
	g.pixelDensity(1);
	g.noStroke();
	// Ciel en dégradé (jour / nuit, gris s'il pleut)
	for (let y = 0; y < 62; y++) {
		const k = y / 62;
		if (nuit) g.fill(lerp(14, 32, k), lerp(20, 34, k), lerp(44, 58, k));
		else if (pluie) g.fill(lerp(122, 168, k), lerp(130, 172, k), lerp(140, 178, k));
		else g.fill(lerp(108, 196, k), lerp(160, 214, k), lerp(214, 230, k));
		g.rect(0, y, W, 1);
	}
	// Silhouettes de la ville au loin (profondeur : plus pâles)
	g.fill(nuit ? 'rgba(40,44,60,0.9)' : 'rgba(120,128,140,0.55)');
	[[0, 40, 22], [24, 34, 16], [44, 44, 20], [70, 30, 14], [88, 38, 24], [118, 32, 18], [140, 42, 20]].forEach(([x, y, l]) => g.rect(x, y, l, 62 - y));
	// Sol ou Loire
	if (photo.sujet === 'navibus' || photo.sujet === 'meteo') {
		for (let y = 62; y < Hh; y++) {
			g.fill(nuit ? 20 : 54, nuit ? 34 : 86, nuit ? 52 : 112);
			g.rect(0, y, W, 1);
		}
	} else {
		g.fill(nuit ? 46 : 112, nuit ? 46 : 112, nuit ? 50 : 116);
		g.rect(0, 62, W, Hh - 62);
		g.fill(nuit ? 70 : 150);
		g.rect(0, 74, W, 2);
	}
	const c = photo.couleur || '#c8102e';
	if (photo.sujet === 'tram') {
		g.stroke(nuit ? 90 : 60);
		g.line(0, 30, W, 30); // ligne aérienne
		g.noStroke();
		g.fill(nuit ? 210 : 236);
		g.rect(18, 46, 120, 26, 4);
		g.fill(c);
		g.rect(18, 64, 120, 4);
		g.fill(nuit ? '#f6d77a' : '#5c7a92');
		for (let i = 0; i < 8; i++) g.rect(24 + i * 14, 50, 10, 9);
	} else if (photo.sujet === 'bus') {
		g.fill(nuit ? 210 : 236);
		g.rect(40, 44, 86, 30, 4);
		g.fill(c);
		g.rect(40, 66, 86, 4);
		g.fill(nuit ? '#f6d77a' : '#5c7a92');
		for (let i = 0; i < 5; i++) g.rect(46 + i * 15, 48, 11, 10);
		g.fill(30);
		g.circle(56, 76, 9);
		g.circle(110, 76, 9);
		g.fill(90);
		g.rect(18, 36, 3, 40); // poteau d'arrêt
		g.fill(c);
		g.rect(14, 34, 11, 8);
	} else if (photo.sujet === 'navibus') {
		g.fill(nuit ? 200 : 232);
		g.rect(46, 60, 70, 12, 3);
		g.rect(60, 52, 36, 9);
		g.fill(c);
		g.rect(46, 68, 70, 3);
	} else if (photo.sujet === 'travaux') {
		for (let i = 0; i < 6; i++) {
			g.fill(i % 2 ? '#e8e2d6' : '#c8102e');
			g.rect(16 + i * 12, 58, 12, 6);
		}
		g.fill(70);
		g.rect(18, 64, 2, 10);
		g.rect(84, 64, 2, 10);
		g.fill('#f28c28');
		[104, 120, 136].forEach((x) => g.triangle(x, 76, x + 5, 62, x + 10, 76));
	} else if (photo.sujet === 'foule') {
		g.fill(nuit ? 64 : 150, nuit ? 60 : 140, nuit ? 70 : 126);
		g.rect(40, 24, 80, 38); // château stylisé
		for (let i = 0; i < 5; i++) g.rect(40 + i * 18, 18, 8, 8);
		for (let i = 0; i < 44; i++) {
			g.fill([60, 90, 120, 160][i % 4], [60, 70, 90, 110][(i * 3) % 4], [70, 90, 110, 130][(i * 5) % 4]);
			g.rect(8 + ((i * 37) % 144), 66 + ((i * 13) % 22), 3, 4);
		}
	} else {
		g.fill(nuit ? 70 : 60);
		g.rect(96, 20, 4, 42); // grue (silhouette générique)
		g.rect(70, 20, 60, 3);
		g.rect(126, 22, 2, 14);
		g.fill(nuit ? 'rgba(80,84,96,0.9)' : 'rgba(230,232,236,0.85)');
		[[20, 22, 34, 10], [40, 16, 30, 12], [118, 30, 30, 9]].forEach(([x, y, l, h]) => g.ellipse(x, y, l, h));
	}
	// Pluie et grain de photo (déterministe, discret)
	if (pluie) {
		g.stroke(nuit ? 'rgba(160,180,210,0.5)' : 'rgba(255,255,255,0.55)');
		for (let i = 0; i < 40; i++) g.line((i * 41) % W, (i * 23) % Hh, (i * 41) % W - 2, ((i * 23) % Hh) + 6);
		g.noStroke();
	}
	for (let i = 0; i < 260; i++) {
		g.fill(255, 255, 255, (i % 3) * 5);
		g.rect((i * 53) % W, (i * 29) % Hh, 1, 1);
	}
	cachePhotos.set(cle, g);
	return g;
}
/** Dessine une photo agrandie, lissage léger (les pixels restent visibles de près sans dominer) */
function dessinerPhoto(photo, x, y, l, h, pluie, nuit) {
	const g = photoPixel(photo, pluie, nuit);
	drawingContext.imageSmoothingEnabled = true;
	image(g, x, y, l, h);
	noFill();
	stroke(DS.blanc15);
	strokeWeight(2);
	rect(x, y, l, h);
	noStroke();
}
const meteoDe = (date) => (Jeu.meteoDuJour && date ? Jeu.meteoDuJour(date) : null) || {};
const nuitDe = (minute) => minute !== undefined && minute !== null && (minute < 7 * 60 || minute >= 20 * 60);
function altPhoto(p) {
	const m = meteoDe(p.date);
	return t('commu.alt', { sujet: t('commu.sujet.' + p.photo.sujet), meteo: (m.pluie_mm || 0) >= 1 ? t('commu.alt.pluie') : '' });
}

// ——— Avatar du compte : feu de signalisation tram, pictogramme pixel original ———
function avatarCompte(x, y, s) {
	noStroke();
	fill(DS.primaire);
	rect(x, y, s, s);
	fill(DS.fond);
	rect(x + s * 0.32, y + s * 0.14, s * 0.36, s * 0.72);
	fill('#FFFFFF');
	rect(x + s * 0.4, y + s * 0.22, s * 0.2, s * 0.08); // barre horizontale (feu tram : arrêt)
	rect(x + s * 0.46, y + s * 0.4, s * 0.08, s * 0.2); // barre verticale (passage)
	fill(DS.alerte);
	rect(x + s * 0.44, y + s * 0.68, s * 0.12, s * 0.1);
}
function avatarUsager(pseudo, x, y, s) {
	const h = Array.from(String(pseudo)).reduce((a, c) => a + c.charCodeAt(0), 0);
	noStroke();
	fill(['#3860FF', '#00B74F', '#FFC138', '#C2CEFF', '#BFFFDB'][h % 5]);
	rect(x, y, s, s);
	fill(DS.fond);
	rect(x + s * 0.34, y + s * 0.2, s * 0.32, s * 0.3);
	rect(x + s * 0.2, y + s * 0.58, s * 0.6, s * 0.3);
}

// ——— Bannière : même heure et même météo que la baie vitrée ———
function dessinerBanniere(x, y, l, h) {
	const m = typeof meteoFenetre === 'function' ? meteoFenetre() : null;
	const hh = heureAffichee().h;
	const g = photoPixel({ sujet: 'meteo' }, !!(m && m.pluie_mm >= 1), hh < 7 || hh >= 20);
	drawingContext.imageSmoothingEnabled = true;
	image(g, x, y, l, h, 0, 20, 160, 160 * (h / l));
}

// ——— Rendu de l'appli ———
function dessinerCompteSocial(z) {
	const mobile = typeof PORTRAIT !== 'undefined' && PORTRAIT.actif;
	const lp = mobile ? Math.min(z.l, 860) : z.l; // portrait : une seule colonne
	// En-tête de profil
	dessinerBanniere(z.x, z.y, lp, 70);
	avatarCompte(z.x + 16, z.y + 40, 64);
	dsTexte(t('commu.nom'), z.x + 96, z.y + 76, 20, DS.blanc, 'left');
	dsTexte('@regul.nte · ' + t('commu.reseau'), z.x + 96, z.y + 102, 18, DS.blanc50, 'left');
	textFont(DS.policeTexte);
	textSize(20);
	const wn = textWidth(t('commu.nom'));
	textSize(18);
	dsBadge(z.x + 96 + wn + 16 + (textWidth(t('commu.service')) + 16) / 2, z.y + 87, t('commu.service'), 'info'); // badge centré sur x
	const bp = Jeu.bilanPlaintes();
	const abonnes = Math.round((1200 * Jeu.jauges.reputation) / 50);
	const tendance = (Jeu.commentaires || []).filter((c) => c.jour === Jeu.jourIndex).reduce((a, c) => a + (c.delta || 0), 0);
	const posts = Jeu.postsPartie().length + Jeu.postsJoueur.length + Jeu.postsArchive().length;
	if (!mobile) dsTexte(t('commu.compteurs', { posts, abonnes, tendance: tendance > 0 ? '▲' : tendance < 0 ? '▼' : '=', r: bp.traitees, n: bp.total }), z.x + lp, z.y + 82, 18, DS.blanc75, 'right');
	dsTexte(t('commu.bio'), z.x + 96, z.y + 128, 18, DS.blanc50, 'left', lp - 110);
	// Onglets (indicateur rouge sous l'onglet actif) — en bas en portrait
	const yo = mobile ? z.y + z.h - 52 : z.y + 158;
	const nb = { mentions: enAttenteDe(plaintesPubliques()).length, messagerie: enAttenteDe(plaintesPrivees()).length };
	const lo = (lp - (mobile ? 0 : 0)) / 4;
	ONGLETS_COMMU.forEach((o, i) => {
		const ox = z.x + i * lo;
		const actif = COMMU.onglet === o;
		noStroke();
		fill(actif ? DS.blanc15 : DS.blanc05);
		rect(ox, yo, lo - 8, 48);
		if (actif) {
			fill(DS.primaire);
			rect(ox, yo + 44, lo - 8, 4);
		}
		dsTexte(t('commu.onglet.' + o) + (nb[o] ? ' · ' + nb[o] : ''), ox + 14, yo + 14, 20, actif ? DS.blanc : DS.blanc75, 'left');
		boutons.push({ x: ox, y: yo, l: lo - 8, h: 48, action: () => changerOnglet(o) });
	});
	// Contenu (zone défilable) + colonne latérale
	const zc = { x: z.x, y: mobile ? z.y + 158 : z.y + 216, l: mobile ? lp : lp - 320, h: mobile ? z.h - 158 - 60 : z.h - 216 };
	if (!mobile) colonneNantes(z.x + lp - 300, zc.y, 300, zc.h);
	drawingContext.save();
	drawingContext.beginPath();
	drawingContext.rect(zc.x - 4, zc.y, zc.l + 8, zc.h);
	drawingContext.clip();
	const n0 = boutons.length;
	let haut = 0;
	if (COMMU.onglet === 'fil') haut = ongletFil(zc);
	else if (COMMU.onglet === 'mentions') haut = ongletMentions(zc);
	else if (COMMU.onglet === 'messagerie') haut = ongletMessagerie(zc);
	else haut = ongletStats(zc);
	drawingContext.restore();
	// Les zones cliquables hors de la partie visible ne doivent pas l'être
	for (let i = boutons.length - 1; i >= n0; i--) {
		const b = boutons[i];
		if (b.y + b.h < zc.y || b.y > zc.y + zc.h) boutons.splice(i, 1);
	}
	COMMU.max = Math.max(0, haut - zc.h);
	COMMU.defil = constrain(COMMU.defil, 0, COMMU.max);
	if (COMMU.max > 0) {
		// Barre de défilement DS
		const hb = Math.max(40, (zc.h * zc.h) / (zc.h + COMMU.max));
		fill(DS.blanc15);
		rect(zc.x + zc.l + 2, zc.y, 4, zc.h);
		fill(DS.blanc75);
		rect(zc.x + zc.l + 2, zc.y + ((zc.h - hb) * COMMU.defil) / COMMU.max, 4, hb);
	}
	COMMU.zone = zc;
	annoncerNouveautesCommunity();
}
function changerOnglet(o) {
	COMMU.onglet = o;
	COMMU.defil = 0;
	COMMU.publier = null;
	Confort.Son.clic();
	annoncer(t('commu.onglet.' + o));
}
/** aria-live : nouvelles mentions et nouveaux messages privés */
function annoncerNouveautesCommunity() {
	const n = (Jeu.plaintes || []).length;
	if (n > COMMU.vus) {
		const p = Jeu.plaintes[n - 1];
		annoncer(t(p.def && p.def.prive ? 'commu.nouveauPrive' : 'commu.nouvelleMention', { auteur: p.auteur }));
	}
	COMMU.vus = n;
}

/** Tous les posts du fil, du plus récent au plus ancien */
function postsDuFil() {
	const partie = Jeu.postsPartie();
	const joueur = Jeu.postsJoueur.map((p) => ({ sorte: 'joueur', index: p.index, jour: p.jour, heure: p.heure, texte: t('commu.info.' + p.modele, p.vars), photo: Jeu.sujetPhoto(Jeu.paquet[p.index]), likes: Math.round(12 * (Jeu.jauges.reputation / 50)), date: p.jour, coherent: p.coherent }));
	const archive = Jeu.postsArchive().map((p) => Object.assign({}, p, { texte: String(p.texte) }));
	return partie
		.concat(joueur)
		.sort((a, b) => (b.jour + b.heure).localeCompare(a.jour + a.heure))
		.concat(archive);
}
function ongletFil(z) {
	let y = z.y - COMMU.defil;
	// Fil / Grille, et « Publier une info trafic » sur le dernier dossier traité
	dsBouton(z.x, y, 220, 44, t(COMMU.grille ? 'commu.fil' : 'commu.grille'), () => (COMMU.grille = !COMMU.grille), 'contour');
	const dernier = (Jeu.evenementsJournee || []).slice(-1)[0];
	if (dernier && !Jeu.postsJoueur.some((p) => p.index === dernier.index)) dsBouton(z.x + 236, y, 360, 44, t('commu.publier'), () => (COMMU.publier = COMMU.publier === null ? dernier.index : null), 'secondaire');
	y += 60;
	if (COMMU.publier !== null) {
		dsTexte(t('commu.publierAide'), z.x, y, 18, DS.blanc75, 'left', z.l);
		y += 34;
		Jeu.modelesInfo().forEach((m, i) => {
			const d = Jeu.paquet[COMMU.publier];
			const e = Jeu.evenementsJournee.find((x) => x.index === COMMU.publier);
			const txt = t('commu.info.' + m.id, { sujet: d.lignes && d.lignes.length ? t('sujet.ligne', { ligne: d.lignes.join(', ') }) : String(d.nature).split(',')[0], action: e ? e.action || t('action.temps') : '' });
			y += boutonTexte(z.x, y, z.l, i + 1 + '  ' + txt, () => publierInfoTrafic(m.id), false) + 8;
		});
		y += 8;
	}
	const posts = postsDuFil();
	if (!posts.length) {
		dsTexte(t('commu.vide'), z.x, y, 20, DS.blanc50, 'left', z.l);
		return y - (z.y - COMMU.defil) + 40;
	}
	if (COMMU.grille) {
		const c = (z.l - 32) / 3;
		posts.forEach((p, i) => {
			const px = z.x + (i % 3) * (c + 16);
			const py = y + Math.floor(i / 3) * (c * 0.62 + 16);
			const m = meteoDe(p.date);
			dessinerPhoto(p.photo, px, py, c, c * 0.62, (m.pluie_mm || 0) >= 1 || p.photo.pluie, nuitDe(p.minute));
			boutons.push({ x: px, y: py, l: c, h: c * 0.62, action: () => ((COMMU.grille = false), annoncer(altPhoto(p) + ' — ' + p.texte)) });
		});
		return y - (z.y - COMMU.defil) + Math.ceil(posts.length / 3) * (c * 0.62 + 16);
	}
	posts.forEach((p, i) => (y += carteDePost(p, z.x, y, z.l, i)));
	return y - (z.y - COMMU.defil);
}
function publierInfoTrafic(id) {
	const r = Jeu.publierInfo(COMMU.publier, id);
	COMMU.publier = null;
	if (!r) return;
	Confort.Son.bip(r.coherent ? 'action' : 'alerte');
	annoncer(t(r.coherent ? 'commu.publieCoherent' : 'commu.publieIncoherent'));
}
/** Carte d'un post : en-tête, texte, photo, « j'aime », commentaires (plaintes, commentaires, réactions), Répondre */
function carteDePost(p, x, y, l, rang) {
	const m = meteoDe(p.date);
	const lt = l - 300;
	textFont(DS.policeTexte);
	textSize(20);
	const nl = Math.max(1, Math.ceil((textWidth(String(p.texte)) * 1.05) / lt));
	const comms = p.index !== undefined && p.sorte !== 'archive' ? commentairesDuPost(p.index) : [];
	const hTexte = 46 + nl * 28 + 40;
	const hc = Math.max(176, hTexte);
	const arrivee = reduireAnimations ? 0 : Math.max(0, 8 - (millis() - (p._vu || (p._vu = millis()))) / 25);
	noStroke();
	fill(DS.blanc05);
	stroke(DS.blanc15);
	strokeWeight(2);
	rect(x, y + arrivee, l, hc);
	noStroke();
	dessinerPhoto(p.photo, x + 12, y + 12 + arrivee, 260, 152, (m.pluie_mm || 0) >= 1 || p.photo.pluie, nuitDe(p.minute));
	avatarCompte(x + 288, y + 12, 28);
	dsTexte(t('commu.nom') + ' · ' + (p.sorte === 'archive' ? t('commu.archive', { date: p.date.split('-').reverse().join('/') }) : p.heure + (p.sorte === 'joueur' ? ' · ' + t('commu.votrePost') : '')), x + 326, y + 16, 18, DS.blanc50, 'left', lt - 40);
	dsTexte(String(p.texte), x + 288, y + 50, 20, DS.blanc, 'left', lt);
	dsTexte('♥ ' + p.likes + '   ' + (comms.length ? t('commu.nbComm', { n: comms.length }) : ''), x + 288, y + hc - 34, 18, DS.blanc75, 'left');
	if (p.index !== undefined && p.sorte === 'partie') {
		textFont(DS.policeTexte);
		textSize(18);
		const lien = t('commu.voirListe');
		dsTexte(lien, x + l - 16, y + hc - 34, 18, DS.infoClair, 'right');
		boutons.push({ x: x + l - 16 - textWidth(lien), y: y + hc - 40, l: textWidth(lien), h: 32, action: () => (PC.fenetre = null, (PC.etat = 'appli')) });
	}
	let yy = y + hc + 8;
	comms.forEach((c) => (yy += commentaire(c, x + 40, yy, l - 40)));
	return yy - y + 16;
}
/** Commentaires d'un post : plaintes publiques (avec réponse ou « Répondre »), commentaires, réactions en chaîne */
function commentairesDuPost(index) {
	const out = [];
	plaintesPubliques()
		.filter((pl) => pl.index === index)
		.forEach((pl) => {
			out.push({ plainte: pl });
			(pl.suivis || []).forEach((sv) => {
				if (!sv.livre && sv.jour === Jeu.jourIndex && Jeu.horloge && sv.minute - Jeu.horloge.minutes < 15 && sv.minute > Jeu.horloge.minutes) out.push({ ecrit: sv.auteur });
			});
		});
	(Jeu.commentaires || []).filter((c) => c.index === index && !c.suivi).forEach((c) => out.push({ commentaire: c }));
	return out;
}
function commentaire(c, x, y, l) {
	if (c.ecrit) {
		// Indicateur « en train d'écrire… » avant une réaction (points fixes si animations réduites)
		const n = reduireAnimations ? 3 : 1 + (Math.floor(millis() / 400) % 3);
		dsTexte(t('commu.ecrit', { auteur: c.ecrit }) + ' ' + '•'.repeat(n), x, y, 18, DS.blanc50, 'left');
		return 32;
	}
	if (c.commentaire) {
		const k = c.commentaire;
		avatarUsager(k.auteur, x, y + 4, 24);
		dsTexte(k.auteur + ' · ' + k.heure, x + 34, y + 4, 18, DS.blanc50, 'left');
		dsTexte(String(k.texte), x + 34, y + 30, 20, DS.blanc, 'left', l - 160);
		dsBadge(x + l - 70, y + 30, t('app.rep', { d: (k.delta > 0 ? '+' : '') + k.delta }), k.delta > 0 ? 'succes' : 'erreur');
		return 72;
	}
	return blocPlainteSociale(c.plainte, x, y, l);
}
/** Bouton-choix à texte sur plusieurs lignes (les réponses sont longues) ; renvoie sa hauteur */
function boutonTexte(x, y, l, label, action, actif) {
	textFont(DS.policeTexte);
	textSize(18);
	const n = Math.max(1, Math.ceil((textWidth(label) * 1.06) / (l - 32)));
	const h = 20 + n * 26;
	const survol = mouseX >= x && mouseX <= x + l && mouseY >= y && mouseY <= y + h;
	noStroke();
	fill(actif ? DS.primaire : survol ? DS.blanc15 : DS.blanc05);
	rect(x, y, l, h);
	stroke(actif ? DS.primaire : DS.blanc);
	strokeWeight(2);
	noFill();
	rect(x + 1, y + 1, l - 2, h - 2);
	noStroke();
	fill(DS.blanc);
	textAlign(LEFT, TOP);
	textLeading(26);
	text(label, x + 16, y + 10, l - 32, h);
	boutons.push({ x, y, l, h, action });
	return h;
}
/** Une plainte (publique ou privée) : texte, délai (prompt 79), réponse publiée ou brouillons de réponse */
function blocPlainteSociale(pl, x, y, l, prive) {
	let yy = y;
	avatarUsager(pl.auteur, x, yy + 4, 24);
	dsTexte(pl.auteur + ' · ' + pl.heure, x + 34, yy + 4, 18, DS.blanc50, 'left');
	const attente = pl.reponse === null && !pl.expiree && !pl.transmise;
	if (attente) {
		const reste = Jeu.resteReponse(pl, millis());
		dsTexte(t('plainte.delai', { s: Math.ceil(reste / 1000) }), x + l - 8, yy + 4, 18, reste < 30000 ? DS.alerte : DS.blanc75, 'right');
	}
	dsTexte(Jeu.texteMessage(pl.def.texte, pl.vars), x + 34, yy + 30, 20, DS.blanc, 'left', l - 60);
	textFont(DS.policeTexte);
	textSize(20);
	yy += 40 + Math.ceil((textWidth(Jeu.texteMessage(pl.def.texte, pl.vars)) * 1.05) / (l - 60)) * 28;
	if (pl.reponse !== null) {
		const r = pl.def.reponses[pl.reponse];
		noStroke();
		fill(pl.bonne ? 'rgba(0,183,79,0.14)' : 'rgba(209,11,0,0.16)');
		rect(x + 34, yy, l - 60, 46);
		avatarCompte(x + 44, yy + 10, 24);
		dsTexte(Jeu.texteMessage(r.texte, pl.vars), x + 78, yy + 12, 18, pl.bonne ? DS.succesClair : DS.erreurClair, 'left', l - 120);
		yy += 56;
		(pl.relances || []).forEach((rl) => {
			dsTexte(pl.auteur + ' · ' + rl.heure + ' : ' + String(rl.texte), x + 34, yy, 18, DS.blanc75, 'left', l - 60);
			yy += 32;
		});
	} else if (pl.expiree) {
		dsTexte(t('commu.expiree'), x + 34, yy, 18, DS.erreurClair, 'left');
		yy += 32;
	} else if (pl.transmise) {
		dsTexte(t('commu.transmise'), x + 34, yy, 18, DS.infoClair, 'left');
		yy += 32;
	} else {
		const cible = cibleCommunity() === pl;
		pl.def.reponses.forEach((r, i) => {
			const actif = cible && focusReponse === i;
			yy += boutonTexte(x + 34, yy, l - 60, i + 1 + '  ' + Jeu.texteMessage(r.texte, pl.vars), () => repondrePlainte(i, pl), actif) + 8;
		});
		if (prive) {
			dsBouton(x + 34, yy, 340, 44, t('commu.transmettre'), () => transmettreAuPatron(pl), 'secondaire');
			yy += 52;
		}
	}
	return yy - y + 8;
}
function transmettreAuPatron(pl) {
	if (!Jeu.transmettrePatron(pl)) return;
	Confort.Son.bip('choix');
	annoncer(t('commu.transmise'));
}
function ongletMentions(z) {
	let y = z.y - COMMU.defil;
	const att = enAttenteDe(plaintesPubliques());
	dsTexte(t('commu.mentionsIntro', { n: att.length }), z.x, y, 20, DS.blanc75, 'left', z.l);
	y += 40;
	if (typeof retourPlainte !== 'undefined' && retourPlainte && millis() < retourPlainte.jusqua) {
		dsTexte(retourPlainte.texte, z.x, y, 18, retourPlainte.bonne ? DS.succesClair : DS.alerte, 'left', z.l);
		y += 40;
	}
	att.forEach((pl) => (y += blocPlainteSociale(pl, z.x, y, z.l) + 12));
	// Mentions récentes (commentaires et réactions)
	derniers(Jeu.commentaires, 8)
		.reverse()
		.forEach((c) => (y += commentaire({ commentaire: c }, z.x, y, z.l)));
	if (!att.length && !(Jeu.commentaires || []).length) dsTexte(t('app.aucunCommentaire'), z.x, y, 20, DS.blanc50, 'left');
	return y - (z.y - COMMU.defil) + 20;
}
function ongletMessagerie(z) {
	const conv = plaintesPrivees();
	if (!conv.length) {
		dsTexte(t('commu.aucunPrive'), z.x, z.y, 20, DS.blanc50, 'left', z.l);
		return 40;
	}
	COMMU.conv = constrain(COMMU.conv, 0, conv.length - 1);
	const lg = Math.min(340, z.l * 0.34);
	conv.forEach((p, i) => {
		const y = z.y + i * 76;
		const actif = i === COMMU.conv;
		const nonLu = p.reponse === null && !p.expiree && !p.transmise;
		noStroke();
		fill(actif ? DS.blanc15 : DS.blanc05);
		rect(z.x, y, lg, 68);
		avatarUsager(p.auteur, z.x + 10, y + 14, 36);
		dsTexte(p.auteur, z.x + 56, y + 8, 18, DS.blanc, 'left');
		dsTexte(p.heure, z.x + lg - 10, y + 8, 18, DS.blanc50, 'right');
		dsTexte(String(Jeu.texteMessage(p.def.texte, p.vars)).slice(0, 22) + '…', z.x + 56, y + 36, 18, DS.blanc50, 'left');
		if (nonLu) dsBadge(z.x + lg - 30, y + 40, '!', 'info');
		boutons.push({ x: z.x, y, l: lg, h: 68, action: () => ((COMMU.conv = i), (focusReponse = 0)) });
	});
	const p = conv[COMMU.conv];
	const xc = z.x + lg + 16;
	const lc = z.l - lg - 16;
	noStroke();
	fill(DS.blanc05);
	rect(xc, z.y, lc, Math.max(260, z.h - 8));
	return Math.max(conv.length * 76, blocPlainteSociale(p, xc + 12, z.y + 12, lc - 24, true) + 24);
}
function ongletStats(z) {
	const bp = Jeu.bilanPlaintes();
	const jours = (Jeu.jours || []).map((_, i) => Jeu.bilanCommunity(i));
	const tot = jours.reduce((a, b) => ({ temps: a.temps + b.temps, tard: a.tard + b.tard, expire: a.expire + b.expire }), { temps: 0, tard: 0, expire: 0 });
	const reactions = (Jeu.commentaires || []).filter((c) => c.suivi).length + (Jeu.plaintes || []).reduce((a, p) => a + (p.relances || []).length, 0);
	const lignes = [t('app.reputation', { r: Jeu.jauges.reputation }), t('plainte.compteur', { x: bp.traitees, y: bp.total }), t('commu.stats.delais', tot), t('commu.stats.reactions', { n: reactions }), t('commu.stats.bonnes', { n: bp.bonnes }), t('commu.stats.valeurs')];
	lignes.forEach((l, i) => dsTexte(l, z.x, z.y + i * 44, 20, i === lignes.length - 1 ? DS.blanc50 : DS.blanc, 'left', z.l));
	return lignes.length * 44;
}
/** Colonne « Ce qui se passe à Nantes » (faits réels du jour) et « Comptes cités » */
function colonneNantes(x, y, l, h) {
	noStroke();
	fill(DS.blanc05);
	rect(x, y, l, h);
	dsTexte(t('commu.nantes'), x + 14, y + 12, 20, DS.blanc, 'left');
	let yy = y + 48;
	const d = PHASES_ACTIVES.includes(phase) ? Jeu.dossierCourant() : (fileIncidents()[0] || {}).d;
	const lignes = [];
	if (d) lignes.push(t('enq.signalement.' + d.type) + (dossierConnu(Jeu.paquet.indexOf(d)) && d.lignes && d.lignes.length ? ' · ' + d.lignes.join(', ') : ''));
	const j = Jeu.jourCourant && Jeu.jourCourant();
	const m = j ? Jeu.meteoDuJour(j.date) : null;
	if (m) lignes.push(t('commu.meteo', { min: m.temp_min, max: m.temp_max, pluie: m.pluie_mm }));
	const ev = j && Jeu.evenementsAffluence ? Jeu.evenementsAffluence(j.date) : [];
	if (ev.length) lignes.push(String(ev[0].texte_source).split(' — ')[0]);
	if (!lignes.length) lignes.push(t('carte.nonRenseigne'));
	lignes.forEach((ln) => {
		dsTexte('· ' + ln, x + 14, yy, 18, DS.blanc75, 'left', l - 28);
		textFont(DS.policeTexte);
		textSize(18);
		yy += Math.ceil((textWidth('· ' + ln) * 1.05) / (l - 28)) * 26 + 8;
	});
	yy += 12;
	dsTexte(t('commu.cites'), x + 14, yy, 20, DS.blanc, 'left');
	yy += 36;
	const comptes = {};
	(Jeu.commentaires || []).forEach((c) => (comptes[c.auteur] = (comptes[c.auteur] || 0) + 1));
	(Jeu.plaintes || []).forEach((p) => (comptes[p.auteur] = (comptes[p.auteur] || 0) + 1));
	Object.entries(comptes)
		.filter(([a]) => /^@/.test(a))
		.sort((a, b) => b[1] - a[1])
		.slice(0, 4)
		.forEach(([a, n]) => {
			avatarUsager(a, x + 14, yy, 24);
			dsTexte(a + ' · ' + n, x + 46, yy + 2, 18, DS.blanc75, 'left');
			yy += 34;
		});
}
/** Clavier de l'appli : ← → onglets, ↑ ↓ défilement (et conversations en messagerie) ; true si la touche est prise */
function toucheCommunity() {
	if (PC.fenetre !== 'community') return false;
	const i = ONGLETS_COMMU.indexOf(COMMU.onglet);
	if (keyCode === RIGHT_ARROW || keyCode === LEFT_ARROW) return changerOnglet(ONGLETS_COMMU[(i + (keyCode === RIGHT_ARROW ? 1 : 3)) % 4]), true;
	if (keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
		if (COMMU.onglet === 'messagerie') {
			const n = plaintesPrivees().length;
			if (n) COMMU.conv = (COMMU.conv + (keyCode === DOWN_ARROW ? 1 : n - 1)) % n;
			focusReponse = 0;
		} else COMMU.defil = constrain(COMMU.defil + (keyCode === DOWN_ARROW ? 120 : -120), 0, COMMU.max || 0);
		return true;
	}
	if (COMMU.publier !== null && Number(key) >= 1 && Number(key) <= Jeu.modelesInfo().length) return publierInfoTrafic(Jeu.modelesInfo()[Number(key) - 1].id), true;
	return false;
}
/** Molette au-dessus du contenu : défilement */
function molletteCommunity(delta) {
	if (PC.fenetre !== 'community' || !COMMU.zone || vue !== 'poste') return false;
	COMMU.defil = constrain(COMMU.defil + delta, 0, COMMU.max || 0);
	return true;
}
