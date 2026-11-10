/* Nantes en régulation — le téléphone pris en main (prompt 42).
 * Animation RÉUTILISABLE : le joueur saisit son téléphone, qui monte du bas de l'écran, tenu par une main
 * dessinée par le code, devant la pièce ; il redescend quand on le pose. Le contenu de l'écran est une
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
	fill(13, 12, 12, 150 * k); // la pièce reste visible, assombrie
	rect(0, 0, L, H);
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
	if (contenu) contenu(e, k >= 1);
	dessinerMain(x, y, pl, ph);
}

/** Main qui tient le téléphone : pouce à gauche, doigts à droite, paume et manche en bas (formes simples) */
function dessinerMain(x, y, pl, ph) {
	const peau = '#d9a07f';
	const ombre = '#b97f60';
	noStroke();
	// Doigts derrière le bord droit
	[520, 600, 680, 760].forEach((dy, i) => {
		fill(i % 2 ? ombre : peau);
		rect(x + pl - 18, y + dy, 56, 62, 28);
	});
	// Paume et manche
	fill(peau);
	rect(x - 70, y + ph - 34, pl + 120, 200, 90);
	fill(ombre);
	rect(x - 70, y + ph + 40, pl + 120, 30, 15);
	fill('#1d2a3a'); // manche
	rect(x - 110, y + ph + 70, pl + 200, 200, 30);
	// Pouce posé sur le bord gauche (il ne couvre que la coque)
	fill(ombre);
	rect(x - 74, y + 640, 96, 190, 48);
	fill(peau);
	rect(x - 70, y + 630, 88, 180, 44);
	fill('#ecc3a8');
	rect(x - 22, y + 642, 30, 40, 14); // ongle
}

// ——— Contenu « conversation » (intro, ouverture de semaine) ———
let conversation = null; // { contact, sous, messages: [{ de, texte }], auFin }
let convDepuis = 0;
function lancerConversation(conv) {
	conversation = conv;
	smsActif = true;
	smsIndex = 0;
	leverTelephone();
	const attente = typeof resteTransitionJour === 'function' ? resteTransitionJour() : 0;
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
function poserTelephoneConversation() {
	const c = conversation;
	baisserTelephone(() => {
		conversation = null;
		smsActif = false;
		if (c && c.auFin) c.auFin();
	});
}
function contenuConversation(e, pret) {
	const c = conversation;
	// En-tête : contact
	noStroke();
	fill('#171616');
	rect(e.x, e.y, e.l, 120, 46, 46, 0, 0);
	fill('#ffffff');
	textAlign(CENTER, TOP);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(26);
	text(c.contact, e.x + e.l / 2, e.y + 44);
	textStyle(NORMAL);
	textSize(15);
	fill('rgba(255,255,255,0.6)');
	text(c.sous || '', e.x + e.l / 2, e.y + 80);
	// Bulles (les plus récentes en bas ; « … » pendant que l'autre écrit)
	const ecrit = !reduireAnimations && c.messages[smsIndex].de !== 'moi' && millis() - convDepuis < 650 && smsIndex > 0;
	const visibles = c.messages.slice(0, smsIndex + (ecrit ? 0 : 1));
	textFont(POLICE_TEXTE);
	textSize(21);
	textLeading(29);
	const lmax = e.l - 120;
	const bulles = visibles.map((m) => {
		const moi = m.de === 'moi';
		const w = Math.min(lmax, textWidth(String(m.texte)) + 40);
		const lignes = Math.max(1, Math.ceil((textWidth(String(m.texte)) * 1.08) / (lmax - 40)));
		return { m, moi, w, h: 22 + lignes * 29 };
	});
	let y = e.y + e.h - 150 - (ecrit ? 70 : 0);
	for (let i = bulles.length - 1; i >= 0 && y > e.y + 140; i--) {
		const b = bulles[i];
		y -= b.h;
		const bx = b.moi ? e.x + e.l - 24 - b.w : e.x + 24;
		fill(b.moi ? '#D4031C' : '#2a2828');
		rect(bx, y, b.w, b.h, 18);
		fill('#ffffff');
		textAlign(LEFT, TOP);
		text(String(b.m.texte), bx + 20, y + 11, b.w - 36, b.h);
		y -= 14;
	}
	if (ecrit) {
		fill('#2a2828');
		rect(e.x + 24, e.y + e.h - 214, 96, 52, 18);
		fill('#ffffff');
		for (let i = 0; i < 3; i++) circle(e.x + 50 + i * 22, e.y + e.h - 188 + (Math.floor(millis() / 200) % 3 === i ? -4 : 0), 10);
	}
	// Commandes
	const dernier = smsIndex === c.messages.length - 1;
	if (pret && dernier && !ecrit) bouton(e.x + 40, e.y + e.h - 112, e.l - 80, 72, t('tel.poser'), poserTelephoneConversation);
	else {
		textAlign(CENTER, CENTER);
		textFont(POLICE_DONNEES);
		textSize(16);
		fill('rgba(255,255,255,0.6)');
		text(t('intro.suivant'), e.x + e.l / 2, e.y + e.h - 76);
		if (pret) boutons.push({ x: 0, y: 0, l: L, h: H, action: avancerConversation });
	}
}
