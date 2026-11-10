/* Nantes en régulation — menu principal modernisé (prompt 35).
 * Écran titre plein écran affiché AVANT le bureau : Nouvelle partie, Reprendre, Paramètres, Aide, Tutoriel,
 * langue. « Nouvelle partie » ouvre le choix de la semaine (l'ancien accueil du PC, sorti de l'écran).
 * Fond : la pièce du bureau floutée et assombrie. Tout est dessiné par le code, textes via t().
 * Dès qu'une partie démarre ou reprend (ecran === 'jeu'), le menu se ferme et l'on arrive au bureau.
 */
const MENU = { actif: true, ecran: 'titre', choix: 0, choixSemaine: 0, debut: 0 };
const MENU_C = {
	nuit: '#0b1b33',
	encre: '#0b1b33',
	bleu: '#005ae1', // primary de design-system/DESIGN.md
	blanc: '#ffffff',
	doux: 'rgba(255,255,255,0.78)',
};

function ouvrirMenuPrincipal() {
	MENU.actif = true;
	MENU.ecran = 'titre';
	MENU.choix = 0;
	MENU.debut = millis();
	fenetre = null;
	annoncer(t('mp.annonce'));
}
function fermerMenuPrincipal() {
	MENU.actif = false;
	PC.etat = 'appli'; // on arrive au bureau, le PC déjà allumé sur l'appli de régulation
	PC.fenetre = null;
	vue = 'bureau';
}

/** Entrées du menu principal (Reprendre seulement s'il existe une sauvegarde) */
function entreesMenu() {
	const recente = Sauvegarde.lister()[0];
	const e = [{ cle: 'nouvelle', icone: 'plus', action: () => allerChoixSemaine() }];
	if (recente) {
		const d = new Date(recente.sauvegardeLe);
		e.push({
			cle: 'reprendre',
			icone: 'lecture',
			sous: t('accueil.continuerDetail', {
				semaine: Sauvegarde.libelleSemaine(recente.semaine),
				n: recente.etat.dossierIndex + 1,
				total: recente.etat.complet.paquet.length,
				heure: String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'),
			}),
			action: () => continuerPartie(),
		});
	}
	e.push({ cle: 'parametres', icone: 'reglages', action: () => ouvrir('parametres') });
	e.push({ cle: 'aide', icone: 'aide', action: () => ouvrir('aide') });
	e.push({ cle: 'tutoriel', icone: 'livre', action: () => lancerTutoriel() });
	return e;
}
function allerChoixSemaine() {
	MENU.ecran = 'semaines';
	MENU.debut = millis();
	MENU.choixSemaine = Math.min(MENU.choixSemaine, optionsAccueil().length - 1);
	annoncer(t('mp.semaines.titre'));
	Confort.Son.bip('choix');
}
function lancerDepuisMenu() {
	const o = optionsAccueil()[MENU.choixSemaine];
	if (!o || o.desactive) return;
	choixAccueil = MENU.choixSemaine;
	lancerPartie(); // sauvegarde existante → fenêtre « Reprendre / Nouvelle partie » (prompt 33)
}

// ——— Dessin ———
function fondMenu() {
	if (!dernierRenduBureau || millis() - dernierRenduBureau > 250) {
		dessinerPieceBureau();
		dernierRenduBureau = millis();
	}
	background(MENU_C.nuit);
	drawingContext.imageSmoothingEnabled = false;
	if (!reduireAnimations) drawingContext.filter = 'blur(6px)';
	image(gBureau, -40, -24, L + 80, H + 48);
	drawingContext.filter = 'none';
	drawingContext.imageSmoothingEnabled = true;
	// Voile : plus sombre à gauche (lisibilité du menu), la pièce reste devinable à droite
	const g = drawingContext.createLinearGradient(0, 0, L, 0);
	g.addColorStop(0, 'rgba(11,27,51,0.94)');
	g.addColorStop(0.45, 'rgba(11,27,51,0.82)');
	g.addColorStop(1, 'rgba(11,27,51,0.45)');
	drawingContext.fillStyle = g;
	drawingContext.fillRect(0, 0, L, H);
}

/** Petite icône dessinée par le code (traits blancs ou bleus) */
function iconeMenu(type, x, y, c) {
	push();
	translate(x, y);
	stroke(c);
	strokeWeight(5);
	noFill();
	strokeCap(ROUND);
	if (type === 'plus') {
		line(28, 10, 28, 46);
		line(10, 28, 46, 28);
	} else if (type === 'lecture') {
		fill(c);
		noStroke();
		triangle(16, 10, 16, 46, 46, 28);
	} else if (type === 'reglages') {
		circle(28, 28, 22);
		for (let k = 0; k < 8; k++) {
			const a = (k / 8) * TWO_PI;
			line(28 + cos(a) * 16, 28 + sin(a) * 16, 28 + cos(a) * 24, 28 + sin(a) * 24);
		}
	} else if (type === 'aide') {
		circle(28, 28, 44);
		noStroke();
		fill(c);
		textAlign(CENTER, CENTER);
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textSize(28);
		text('?', 28, 29);
		textStyle(NORMAL);
	} else if (type === 'livre') {
		rect(8, 12, 20, 32, 3);
		rect(28, 12, 20, 32, 3);
	} else if (type === 'retour') {
		line(14, 28, 44, 28);
		line(14, 28, 26, 16);
		line(14, 28, 26, 40);
	} else if (type === 'menu') {
		line(12, 16, 44, 16);
		line(12, 28, 44, 28);
		line(12, 40, 44, 40);
	}
	pop();
}

/** Carte de menu moderne : sélection = carte blanche + liseré bleu ; sinon carte sombre translucide */
function carteMenu(x, y, l, h, titre, sous, action, sel, icone) {
	const survol = mouseX >= x && mouseX <= x + l && mouseY >= y && mouseY <= y + h;
	const actif = sel || survol;
	noStroke();
	if (actif) {
		fill(MENU_C.blanc);
		rect(x, y, l, h, 18);
		fill(MENU_C.bleu);
		rect(x, y + 14, 6, h - 28, 3);
	} else {
		fill(255, 255, 255, 22);
		rect(x, y, l, h, 18);
		stroke(255, 255, 255, 60);
		strokeWeight(2);
		noFill();
		rect(x + 1, y + 1, l - 2, h - 2, 17);
		noStroke();
	}
	if (icone) iconeMenu(icone, x + 28, y + h / 2 - 28, actif ? MENU_C.bleu : MENU_C.blanc);
	const tx = x + (icone ? 108 : 32);
	textAlign(LEFT, sous ? BOTTOM : CENTER);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(30);
	fill(actif ? MENU_C.encre : MENU_C.blanc);
	text(titre, tx, sous ? y + h / 2 + 4 : y + h / 2);
	textStyle(NORMAL);
	if (sous) {
		textAlign(LEFT, TOP);
		textFont(POLICE_DONNEES);
		textSize(18);
		fill(actif ? '#3d4b5f' : MENU_C.doux);
		text(sous, tx, y + h / 2 + 10, l - (tx - x) - 24, 40);
	}
	boutons.push({ x, y, l, h, action });
	if (sel) {
		// focus clavier : contour bleu extérieur, en plus de la carte blanche
		noFill();
		stroke(MENU_C.bleu);
		strokeWeight(4);
		rect(x - 6, y - 6, l + 12, h + 12, 22);
		noStroke();
	}
}

function dessinerMenuPrincipal() {
	fondMenu();
	if (MENU.ecran === 'semaines') return dessinerChoixSemaine();
	const k = reduireAnimations ? 1 : easeOut(constrain((millis() - MENU.debut) / 500, 0, 1));
	const x0 = 160 - (1 - k) * 40;
	noStroke();
	textAlign(LEFT, TOP);
	textFont(POLICE_DONNEES);
	textSize(20);
	fill(MENU_C.doux);
	text('PXE-NTE001-G01-W01', x0, 120);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(96);
	fill(MENU_C.blanc);
	text(t('accueil.titre'), x0, 156);
	textStyle(NORMAL);
	textSize(28);
	fill(MENU_C.doux);
	text(t('accueil.sousTitre'), x0, 276, 900, 80);
	const e = entreesMenu();
	if (MENU.choix >= e.length) MENU.choix = 0;
	e.forEach((it, i) => {
		const h = it.sous ? 104 : 84;
		const y = 380 + i * 116;
		carteMenu(x0, y, 620, h, t('mp.' + it.cle), it.sous, it.action, i === MENU.choix, it.icone);
	});
	selecteurLangue(L - 80, 56);
	textAlign(LEFT, BOTTOM);
	textFont(POLICE_DONNEES);
	textSize(18);
	fill(MENU_C.doux);
	text(t('mp.clavier'), x0, H - 70);
	text(t('mp.sources'), x0, H - 40);
}

function dessinerChoixSemaine() {
	const opts = optionsAccueil();
	if (MENU.choixSemaine >= opts.length) MENU.choixSemaine = 0;
	noStroke();
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(64);
	fill(MENU_C.blanc);
	text(t('mp.semaines.titre'), 160, 96);
	textStyle(NORMAL);
	textSize(26);
	fill(MENU_C.doux);
	text(t('mp.semaines.sous'), 160, 186, 1400, 60);
	const lc = 780;
	const hc = 200;
	opts.forEach((o, i) => {
		const x = 160 + (i % 2) * (lc + 40);
		const y = 270 + Math.floor(i / 2) * (hc + 32);
		const sel = i === MENU.choixSemaine;
		const survol = mouseX >= x && mouseX <= x + lc && mouseY >= y && mouseY <= y + hc;
		const actif = sel || survol;
		noStroke();
		fill(actif ? MENU_C.blanc : 'rgba(255,255,255,0.09)');
		rect(x, y, lc, hc, 20);
		if (!actif) {
			stroke(255, 255, 255, 60);
			strokeWeight(2);
			noFill();
			rect(x + 1, y + 1, lc - 2, hc - 2, 19);
			noStroke();
		}
		if (sel) {
			noFill();
			stroke(MENU_C.bleu);
			strokeWeight(4);
			rect(x - 6, y - 6, lc + 12, hc + 12, 24);
			noStroke();
		}
		const encre = o.desactive ? (actif ? '#6b7280' : 'rgba(255,255,255,0.55)') : actif ? MENU_C.encre : MENU_C.blanc;
		textAlign(LEFT, TOP);
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textSize(25);
		fill(encre);
		text(o.titre, x + 32, y + 28, lc - 64, 40);
		textStyle(NORMAL);
		textFont(POLICE_DONNEES);
		textSize(21);
		fill(actif ? MENU_C.bleu : MENU_C.doux);
		if (o.desactive) fill(encre);
		text(o.detail, x + 32, y + 82, lc - 64, 30);
		textSize(18);
		fill(actif ? '#3d4b5f' : MENU_C.doux);
		text(o.info, x + 32, y + 124, lc - 64, 60);
		if (o.sauvegarde) {
			// Badge « sauvegardée » (prompt 33)
			const lib = t('accueil.sauvegardee', { n: o.sauvegarde.etat.dossierIndex + 1, total: o.sauvegarde.etat.complet.paquet.length });
			textSize(16);
			const lb = textWidth(lib) + 24;
			fill(MENU_C.bleu);
			rect(x + lc - lb - 24, y + 26, lb, 32, 16);
			fill(MENU_C.blanc);
			textAlign(CENTER, CENTER);
			text(lib, x + lc - lb / 2 - 24, y + 42);
		}
		boutons.push({ x, y, l: lc, h: hc, action: () => (MENU.choixSemaine === i ? lancerDepuisMenu() : (MENU.choixSemaine = i)) });
	});
	if (typeof dessinerOptionsNouvellePartie === 'function') dessinerOptionsNouvellePartie(160, H - 210); // prompt 37
	const o = opts[MENU.choixSemaine];
	bouton(L - 160 - 420, H - 150, 420, 84, t('mp.lancer'), lancerDepuisMenu, !o || o.desactive);
	bouton(160, H - 140, 260, 68, t('mp.retour'), () => ((MENU.ecran = 'titre'), (MENU.debut = millis())), false, true);
	if (Jeu.enLigne === false) {
		textAlign(LEFT, CENTER);
		textFont(POLICE_DONNEES);
		textSize(18);
		fill(MENU_C.doux);
		text(t(Confort.Reglages.horsLigneForce ? 'accueil.horsLigneForce' : 'accueil.horsLigne'), 460, H - 106);
	}
}

/** Clavier du menu principal ; renvoie true si la touche a été traitée */
function toucheMenu() {
	if (MENU.ecran === 'semaines') {
		const n = optionsAccueil().length;
		if (keyCode === LEFT_ARROW || keyCode === UP_ARROW || (keyCode === TAB && keyIsDown(SHIFT))) MENU.choixSemaine = (MENU.choixSemaine + n - 1) % n;
		else if (keyCode === RIGHT_ARROW || keyCode === DOWN_ARROW || keyCode === TAB) MENU.choixSemaine = (MENU.choixSemaine + 1) % n;
		else if (keyCode === ENTER || keyCode === RETURN) lancerDepuisMenu();
		else if (keyCode === ESCAPE || keyCode === BACKSPACE) (MENU.ecran = 'titre'), (MENU.debut = millis());
		else if (typeof toucheOptionsNouvellePartie === 'function') toucheOptionsNouvellePartie(); // prompt 37
		const o = optionsAccueil()[MENU.choixSemaine];
		if (o && (keyCode === TAB || keyCode === UP_ARROW || keyCode === DOWN_ARROW || keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW)) annoncer(String(o.titre) + ' — ' + String(o.detail));
		return true;
	}
	const e = entreesMenu();
	if (keyCode === UP_ARROW || (keyCode === TAB && keyIsDown(SHIFT))) MENU.choix = (MENU.choix + e.length - 1) % e.length;
	else if (keyCode === DOWN_ARROW || keyCode === TAB) MENU.choix = (MENU.choix + 1) % e.length;
	else if (keyCode === ENTER || keyCode === RETURN || key === ' ') e[MENU.choix].action();
	else if ((key === 'c' || key === 'C') && e.some((x) => x.cle === 'reprendre')) continuerPartie();
	else if (key === 'h' || key === 'H' || key === '?') ouvrir('aide');
	if (keyCode === UP_ARROW || keyCode === DOWN_ARROW || keyCode === TAB) annoncer(t('mp.' + e[MENU.choix].cle));
	return true;
}

/** Appli de régulation sans partie en cours (prompt 35) : l'accueil n'est plus dans le PC */
function dessinerAppliSansPartie() {
	background(C.fond);
	const l = 900;
	const h = 360;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.accent);
	noStroke();
	textAlign(CENTER, TOP);
	fill(C.accent);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(44);
	text(t('mp.sansPartie.titre'), L / 2, y + 48);
	textStyle(NORMAL);
	textSize(24);
	fill(C.texte);
	text(t('mp.sansPartie.texte'), x + 60, y + 124, l - 120, 80);
	bouton(L / 2 - 200, y + h - 120, 400, 76, t('menu.menuPrincipal'), ouvrirMenuPrincipal);
}
