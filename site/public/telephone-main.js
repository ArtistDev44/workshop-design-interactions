/* Nantes en régulation — le téléphone pris en main (prompt 42).
 * Animation RÉUTILISABLE : le joueur saisit son téléphone, qui monte du bas de l'écran, tenu par une main
 * en pixel art dessinée par le code, devant la pièce ; il redescend quand on le pose. Le contenu de l'écran est une
 * fonction (conversation, notifications…). Animations réduites : apparition / disparition directes.
 * Utilisé par : l'intro (Camille), l'ouverture des semaines 2 et 3 (le patron, prompt 41) et le téléphone
 * de la pièce (notifications de l'Agenda Nantes Métropole, prompt 38).
 */
const TEL_MAIN = { debut: 0, descente: 0, auFin: null, l: 520, h: 940 };
const DUREE_TEL_MAIN = 450;

function leverTelephone() {
	TEL_MAIN.debut = millis();
	TEL_MAIN.descente = 0;
	TEL_MAIN.auFin = null;
	Confort.Son.clic();
}
/** Pose le téléphone (animation inverse), puis appelle auFin */
function baisserTelephone(auFin) {
	if (TEL_MAIN.descente) return;
	TEL_MAIN.descente = millis();
	TEL_MAIN.auFin = auFin || null;
}
function avancementTelephone() {
	if (TEL_MAIN.descente) {
		const k = reduireAnimations ? 0 : 1 - easeOut(constrain((millis() - TEL_MAIN.descente) / DUREE_TEL_MAIN, 0, 1));
		if (k <= 0) {
			const f = TEL_MAIN.auFin;
			TEL_MAIN.auFin = null;
			TEL_MAIN.descente = 0;
			if (f) f();
			return 0;
		}
		return k;
	}
	return reduireAnimations ? 1 : easeOut(constrain((millis() - TEL_MAIN.debut) / DUREE_TEL_MAIN, 0, 1));
}

/** Dessine le téléphone tenu en main. contenu(ecran, pret) dessine l'écran ({x, y, l, h}).
 * Prompt 52 : objet = true → même animation et même main, sans la coque du téléphone (tasse de café). */
function dessinerTelephoneEnMain(contenu, objet) {
	const k = avancementTelephone();
	if (k <= 0) return;
	const pl = TEL_MAIN.l;
	const ph = TEL_MAIN.h;
	const x = L / 2 - pl / 2 + 160;
	const y = lerp(H + 60, 36, k);
	noStroke();
	dsVoile(k); // prompt 173 : même voile que les fenêtres (DS.voile), au rythme de la montée du téléphone
	if (!objet && typeof zoneFenetre === 'function') zoneFenetre(x, y, pl, ph); // clic à côté du téléphone = le reposer
	const e = { x: x + 16, y: y + 16, l: pl - 32, h: ph - 32 };
	if (!objet) {
		// Ombre portée puis coque fine (coins arrondis : objet physique, hors Pixel DS)
		fill(0, 0, 0, 90);
		rect(x + 18, y + 22, pl, ph, 60);
		fill('#0a0b0c');
		rect(x, y, pl, ph, 60);
		fill('#2c3036');
		rect(x + pl - 4, y + 220, 6, 90, 3); // bouton latéral
		fill('#0d0c0c');
		rect(e.x, e.y, e.l, e.h, 46);
		fill('#0a0b0c');
		circle(x + pl / 2, e.y + 24, 16); // caméra
	}
	zoneTexteDeclarer('telephone', e.x, e.y, e.l, e.h); // prompt 93 : cadre de l'écran du téléphone
	if (contenu) contenu(e, k >= 1);
	dessinerMain(x, y);
}

/** Main qui tient le téléphone, en pixel art (même grain et même palette que la tasse en main, cafe.js) :
 * doigts à droite, pouce et éminence à gauche (le pouce ne couvre que la coque), paume et manche en bas.
 * Tout est posé sur une grille de PIX_MAIN px, aplats nets, contour sombre, coins en escalier. */
const PIX_MAIN = 15;
const PAL_MAIN = { peau: '#e2ab84', ombre: '#c08461', contour: '#6b3f2a', ongle: '#f3cdb0', manche: '#1d2a3a', mancheClair: '#2c3f57', mancheContour: '#101a26' };
function dessinerMain(x, y) {
	const P = PAL_MAIN;
	const s = PIX_MAIN;
	const bx = Math.round(x);
	const by = Math.round(y);
	// Rectangle en cases de la grille (origine : coin haut gauche du téléphone)
	const r = (gx, gy, gl, gh, c) => {
		fill(c);
		rect(bx + gx * s, by + gy * s, gl * s, gh * s);
	};
	// Forme pleine aux coins en escalier (« coin » cases rognées), puis bloc = contour + aplat
	const forme = (gx, gy, gl, gh, coin, c) => {
		for (let i = 0; i <= coin; i++) r(gx + coin - i, gy + i, gl - 2 * (coin - i), gh - 2 * i, c);
	};
	const bloc = (gx, gy, gl, gh, coin, c, contour) => {
		forme(gx, gy, gl, gh, coin, contour || P.contour);
		forme(gx + 1, gy + 1, gl - 2, gh - 2, coin, c);
	};
	noStroke();
	// Quatre doigts repliés sur le bord droit (contours partagés), ombre sous chaque phalange
	for (let i = 0; i < 4; i++) {
		const gy = 34 + i * 5;
		bloc(34, gy, 5, 6, 1, P.peau);
		r(35, gy + 4, 3, 1, P.ombre);
		r(37, gy + 1, 1, 1, P.ongle); // reflet de la jointure
	}
	// Paume, son ombre, puis la manche et son revers
	bloc(-7, 60, 46, 9, 2, P.peau);
	r(-6, 65, 44, 2, P.ombre);
	bloc(-9, 67, 50, 14, 1, P.manche, P.mancheContour);
	r(-8, 68, 48, 1, P.mancheClair);
	// Éminence du pouce, le long du téléphone, fondue dans la paume
	bloc(-7, 51, 7, 12, 1, P.peau);
	r(-5, 61, 4, 2, P.peau); // fondu dans la paume (sans trait de contour)
	r(-6, 52, 1, 11, P.ombre);
	// Pouce posé sur le bord gauche, ongle en haut
	bloc(-5, 42, 6, 13, 1, P.peau);
	r(-4, 43, 1, 9, P.ombre);
	r(-5, 52, 1, 2, P.peau); // raccord pouce / éminence (sans trait de contour)
	r(-4, 54, 3, 1, P.peau);
	r(-2, 43, 2, 3, P.ongle);
}

// ——— Contenu « conversation » (intro, ouverture de semaine) ———
let conversation = null; // { contact, sous, messages: [{ de, texte }], auFin }
let convDepuis = 0;
function lancerConversation(conv) {
	conversation = conv;
	smsActif = true;
	smsIndex = 0;
	leverTelephone();
	// Prompt 112 : le téléphone se lève pendant le fondu de sortie de la transition (400 ms avant sa fin), sans l'attendre
	const attente = typeof resteTransitionJour === 'function' ? Math.max(0, resteTransitionJour() - 400) : 0;
	TEL_MAIN.debut += attente; // prompt 43 : le téléphone attend la fin de l'écran « Jour n »
	convDepuis = millis() + attente;
	annoncer(String(conv.contact) + ' : ' + String(conv.messages[0].texte));
	Confort.Son.bip('dossier');
}
function avancerConversation() {
	if (!conversation || TEL_MAIN.descente) return;
	if (smsIndex < conversation.messages.length - 1) {
		smsIndex++;
		convDepuis = millis();
		annoncer(String(conversation.messages[smsIndex].texte));
		Confort.Son.bip('choix');
	} else poserTelephoneConversation();
}
/** Prompt 97 : passer toute la conversation d'un geste ; les messages restants sont annoncés d'un bloc (rien n'est perdu) */
function passerConversation() {
	if (!conversation || TEL_MAIN.descente) return;
	const reste = conversation.messages.slice(smsIndex + 1).map((m) => String(m.texte));
	if (reste.length) annoncer(reste.join(' '));
	smsIndex = conversation.messages.length - 1;
	poserTelephoneConversation();
}
function poserTelephoneConversation() {
	const c = conversation;
	baisserTelephone(() => {
		conversation = null;
		smsActif = false;
		if (c && c.auFin) c.auFin();
	});
}
/** Prompt 179 : heure de JEU au format du téléphone (« 8 h 02 » / « 8:02 »), d'après heureAffichee() */
function heureTelephone() {
	const h = heureAffichee();
	return t('tel.heure', { h: h.h, m: String(h.m).padStart(2, '0') });
}
// Prompt 179 : grille 8 px — marge de 24 px entre une bulle et le bord de l'écran, 16 px entre le texte et le bord de
// sa bulle, heure de jeu sous chaque bulle, 16 px entre deux messages ; en-tête et pied hors de la zone des bulles
const CONV = { enTete: 120, pied: 136, bord: 24, marge: 16, interligne: 28, taille: 21, heure: 16, ecart: 16 };
function contenuConversation(e, pret) {
	const c = conversation;
	if (!c) return;
	const G = CONV;
	// En-tête : barre d'état (heure de jeu), contact
	noStroke();
	fill('#171616');
	rect(e.x, e.y, e.l, G.enTete, 46, 46, 0, 0);
	fill('#ffffff');
	textFont(POLICE_DONNEES);
	textStyle(NORMAL);
	textSize(15);
	textAlign(LEFT, TOP);
	text(heureTelephone(), e.x + 40, e.y + 16); // barre d'état : heure courante (de jeu)
	textAlign(CENTER, TOP);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	ajusterTaille(String(c.contact), e.l - 32, 26, 22); // prompt 93 : le nom sortait de l'écran du téléphone
	text(c.contact, e.x + e.l / 2, e.y + 44);
	textStyle(NORMAL);
	textSize(15);
	fill('rgba(255,255,255,0.6)');
	text(c.sous || '', e.x + e.l / 2, e.y + 80);
	// Bulles (les plus récentes en bas ; « … » pendant que l'autre écrit)
	const ecrit = !reduireAnimations && c.messages[smsIndex].de !== 'moi' && millis() - convDepuis < 650 && smsIndex > 0;
	const visibles = c.messages.slice(0, smsIndex + (ecrit ? 0 : 1));
	if (!c.heures) c.heures = [];
	const lmax = e.l - G.bord - 72; // la bulle laisse 72 px libres du côté opposé
	const bulles = visibles.map((m, i) => {
		if (!c.heures[i]) c.heures[i] = heureTelephone(); // heure de jeu à l'arrivée du message
		const lignes = couperLignes(String(m.texte), lmax - 2 * G.marge, POLICE_TEXTE, G.taille);
		textFont(POLICE_TEXTE);
		textSize(G.taille);
		const w = Math.ceil(Math.max(...lignes.map((ln) => textWidth(ln)))) + 2 * G.marge;
		return { m, moi: m.de === 'moi', w: Math.min(lmax, Math.max(w, 96)), h: 2 * G.marge + lignes.length * G.interligne, heure: c.heures[i] };
	});
	// Zone des bulles, découpée entre l'en-tête et le pied : rien ne passe devant le nom du contact ni devant les commandes
	const zy = e.y + G.enTete;
	const zh = e.h - G.enTete - G.pied;
	drawingContext.save();
	drawingContext.beginPath();
	drawingContext.rect(e.x, zy, e.l, zh);
	drawingContext.clip();
	zoneTexteDebut('conversationTel', e.x, zy, e.l, zh, { clip: true }); // zone défilante : ce qui en sort est masqué exprès
	let y = zy + zh - 8;
	if (ecrit) {
		y -= 48;
		noStroke();
		fill('#2a2828');
		rect(e.x + G.bord, y, 96, 48, 18);
		fill('#ffffff');
		for (let i = 0; i < 3; i++) circle(e.x + G.bord + 26 + i * 22, y + 24 + (Math.floor(millis() / 200) % 3 === i ? -4 : 0), 10);
		y -= G.ecart;
	}
	for (let i = bulles.length - 1; i >= 0 && y > zy; i--) {
		const b = bulles[i];
		const bx = b.moi ? e.x + e.l - G.bord - b.w : e.x + G.bord;
		y -= G.heure;
		// Heure de jeu, sous la bulle, du côté de son auteur
		dessinerTexte(b.heure, bx + 4, y - 2, b.w - 8, { police: POLICE_DONNEES, taille: 14, couleur: 'rgba(255,255,255,0.7)', align: b.moi ? 'right' : 'left', maxLignes: 1, interligne: 18 });
		noStroke();
		y -= 4 + b.h;
		fill(b.moi ? DS.primaire : '#2a2828'); // prompt 115
		rect(bx, y, b.w, b.h, 18);
		dessinerTexte(String(b.m.texte), bx + G.marge, y + G.marge, b.w - 2 * G.marge, { taille: G.taille, interligne: G.interligne, couleur: b.moi ? DS.surPrimaire : '#ffffff' });
		y -= G.ecart;
	}
	zoneTexteFin();
	drawingContext.restore();
	textAlign(LEFT, TOP);
	// Commandes
	const dernier = smsIndex === c.messages.length - 1;
	if (pret && dernier && !ecrit) bouton(e.x + 40, e.y + e.h - 112, e.l - 80, 72, t('tel.poser'), poserTelephoneConversation);
	else {
		// Prompt 97 : consigne sur deux lignes au plus dans la largeur de l'écran (« Échap : tout passer » ajouté)
		dessinerTexte(t('intro.suivant'), e.x + 24, e.y + e.h - 98, e.l - 48, { police: POLICE_DONNEES, taille: 16, couleur: 'rgba(255,255,255,0.6)', align: 'center', maxLignes: 2, interligne: 22 });
		if (pret) boutons.push({ x: 0, y: 0, l: L, h: H, action: avancerConversation });
	}
}
