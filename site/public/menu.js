/* Nantes en régulation — menu principal modernisé (prompt 35).
 * Écran titre plein écran affiché AVANT le bureau : Nouvelle partie, Reprendre, Paramètres, Aide, Tutoriel,
 * langue. « Nouvelle partie » ouvre le choix de la semaine (l'ancien accueil du PC, sorti de l'écran).
 * Fond : la pièce du bureau floutée et assombrie. Tout est dessiné par le code, textes via t().
 * Dès qu'une partie démarre ou reprend (ecran === 'jeu'), le menu se ferme et l'on arrive au bureau.
 */
const MENU = { actif: true, ecran: 'titre', choix: 0, choixSemaine: 0, debut: 0, partage: false, choixPartage: 0 }; // prompt 81 : panneau « Partager »
// Prompt 81 — constantes nommées (une seule source de vérité, jamais d'URL en dur ailleurs)
const DEPOT_URL = 'https://github.com/ArtistDev44/workshop-design-interactions';
const LICENSE_URL = DEPOT_URL + '/blob/main/LICENSE';
const URL_JEU = 'https://workshop-design-interactions.pages.dev/'; // URL canonique à partager (prompt 02)
/** Options de partage : icône pixel + libellé i18n + URL construite (texte encodé) */
const PARTAGES = [
	{ cle: 'x', icone: 'x', url: () => 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(URL_JEU) + '&text=' + encodeURIComponent(t('mp.partager.texte')) },
	{ cle: 'facebook', icone: 'facebook', url: () => 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(URL_JEU) },
	{ cle: 'linkedin', icone: 'linkedin', url: () => 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(URL_JEU) },
	{ cle: 'mastodon', icone: 'mastodon', url: () => 'https://mastodon.social/share?text=' + encodeURIComponent(t('mp.partager.texte') + ' ' + URL_JEU) },
	{ cle: 'copier', icone: 'lien', copier: true },
];
function ouvrirLienExterne(url) {
	window.open(url, '_blank', 'noopener');
}
/** Copier le lien du jeu (repli execCommand si l'API clipboard est indisponible) + annonce aria-live */
function copierLienJeu() {
	const ok = () => annoncer(t('mp.partager.copie'));
	if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(URL_JEU).then(ok).catch(() => repliCopie(ok));
	else repliCopie(ok);
}
function repliCopie(ok) {
	try {
		const el = document.createElement('textarea');
		el.value = URL_JEU;
		document.body.appendChild(el);
		el.select();
		document.execCommand('copy');
		document.body.removeChild(el);
	} catch (e) {}
	ok();
}
function activerPartage(i) {
	const p = PARTAGES[i];
	if (!p) return;
	if (p.copier) return copierLienJeu();
	ouvrirLienExterne(p.url());
	Confort.Son.bip('choix');
}
const MENU_C = {
	nuit: '#0D0C0C', // Background du Pixel DS (prompt 39)
	encre: '#0D0C0C', // Secondary-Foreground
	bleu: '#D4031C', // Primary du Pixel DS (nom de clé conservé)
	blanc: '#ffffff',
	doux: 'rgba(255,255,255,0.75)', // White 75
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
	// Prompt 37 : nouvelle partie avec l'option cochée → guide « Prendre en main »
	if (optionGuide() && Jeu.index === 0 && !(Jeu.historique || []).length) demarrerGuide();
	PC.etat = typeof JOUR_PC !== 'undefined' && JOUR_PC.attendu ? 'eteint' : 'appli'; // on arrive au bureau, le PC déjà allumé sur l'appli (prompt 71 : sauf démarrage du jour en attente)
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
	e.push({ cle: 'palmares', icone: 'trophee', action: () => ouvrir('palmares') }); // prompt 47
	e.push({ cle: 'parametres', icone: 'reglages', action: () => ouvrir('parametres') });
	e.push({ cle: 'aide', icone: 'aide', action: () => ouvrir('aide') });
	e.push({ cle: 'tutoriel', icone: 'livre', action: () => lancerTutoriel() });
	return e;
}
function allerChoixSemaine() {
	MENU.ecran = 'semaines';
	MENU.debut = millis();
	MENU.choixSemaine = 0; // prompt 41 : le mode histoire (recommandé) est présélectionné
	annoncer(t('mp.semaines.titre'));
	Confort.Son.bip('choix');
}
function lancerDepuisMenu() {
	const m = modesNouvellePartie()[MENU.choixSemaine];
	if (!m || m.desactive) return;
	if (m.cle === 'histoire') {
		// Prompt 41 : histoire terminée et relancée → on repart de la semaine 1 (le temps réel reste débloqué)
		const p = progressionHistoire();
		if (p.termine) enregistrerProgression(Object.assign(p, { scores: {} }));
		const lundi = semainesHistoire()[m.chapitre - 1];
		choixAccueil = optionsAccueil().findIndex((o) => o.lundi === lundi);
	} else choixAccueil = optionsAccueil().findIndex((o) => o.type === 'direct');
	if (choixAccueil < 0) return;
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
	g.addColorStop(0, 'rgba(13,12,12,0.95)');
	g.addColorStop(0.45, 'rgba(13,12,12,0.85)');
	g.addColorStop(1, 'rgba(13,12,12,0.5)');
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
	} else if (type === 'trophee') {
		rect(16, 8, 24, 20);
		line(28, 28, 28, 40);
		line(16, 44, 40, 44);
		line(16, 14, 8, 14);
		line(8, 14, 10, 22);
		line(40, 14, 48, 14);
		line(48, 14, 46, 22);
	} else if (type === 'carnet') {
		rect(12, 8, 32, 40);
		line(20, 20, 36, 20);
		line(20, 28, 36, 28);
		line(20, 36, 30, 36);
	} else if (type === 'menu') {
		line(12, 16, 44, 16);
		line(12, 28, 44, 28);
		line(12, 40, 44, 40);
	} else if (type === 'github') {
		// Silhouette du « chat » GitHub en traits (dessin original, pas le logo officiel)
		circle(28, 30, 30);
		fill(c);
		noStroke();
		circle(28, 30, 22);
		stroke(c);
		strokeWeight(4);
		noFill();
		arc(28, 30, 34, 34, PI * 0.15, PI * 0.85, CHORD); // oreilles
		line(16, 44, 12, 52);
		line(40, 44, 44, 52);
	} else if (type === 'partage') {
		// Trois points reliés (nœud de partage)
		strokeWeight(4);
		line(16, 40, 40, 16);
		line(16, 40, 42, 38);
		line(40, 16, 42, 38);
		noStroke();
		fill(c);
		circle(16, 40, 10);
		circle(40, 16, 10);
		circle(42, 38, 10);
	} else if (type === 'x') {
		strokeWeight(6);
		line(14, 14, 42, 42);
		line(42, 14, 14, 42);
	} else if (type === 'facebook') {
		noStroke();
		fill(c);
		textAlign(CENTER, CENTER);
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textSize(34);
		text('f', 28, 30);
		textStyle(NORMAL);
	} else if (type === 'linkedin') {
		noStroke();
		fill(c);
		textAlign(CENTER, CENTER);
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textSize(24);
		text('in', 28, 30);
		textStyle(NORMAL);
	} else if (type === 'mastodon') {
		// « m » éléphant simplifié en blocs
		strokeWeight(5);
		line(12, 44, 12, 20);
		line(12, 20, 24, 32);
		line(24, 32, 32, 20);
		line(32, 20, 32, 44);
		line(32, 20, 44, 32);
		line(44, 32, 44, 44);
	} else if (type === 'lien') {
		strokeWeight(5);
		noFill();
		arc(20, 34, 22, 22, PI, TWO_PI);
		arc(36, 22, 22, 22, 0, PI);
		line(20, 34, 20, 46);
		line(36, 22, 36, 10);
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
		rect(x, y, l, h);
		fill(MENU_C.bleu);
		rect(x, y, 8, h); // liseré primaire
	} else {
		fill(255, 255, 255, 22);
		rect(x, y, l, h);
		stroke(255, 255, 255, 60);
		strokeWeight(2);
		noFill();
		rect(x + 1, y + 1, l - 2, h - 2);
		noStroke();
	}
	if (icone) iconeMenu(icone, x + 28, y + h / 2 - 28, actif ? MENU_C.bleu : MENU_C.blanc);
	const tx = x + (icone ? 108 : 32);
	textAlign(LEFT, sous ? BOTTOM : CENTER);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	ajusterTaille(titre, l - (tx - x) - 24, 30);
	fill(actif ? MENU_C.encre : MENU_C.blanc);
	text(titre, tx, sous ? y + h / 2 + 4 : y + h / 2);
	textStyle(NORMAL);
	if (sous) {
		textAlign(LEFT, TOP);
		textFont(POLICE_DONNEES);
		textSize(18);
		fill(actif ? 'rgba(13,12,12,0.75)' : MENU_C.doux);
		text(sous, tx, y + h / 2 + 10, l - (tx - x) - 24, 40);
	}
	boutons.push({ x, y, l, h, action });
	if (sel) {
		// focus clavier : contour bleu extérieur, en plus de la carte blanche
		noFill();
		stroke(MENU_C.bleu);
		strokeWeight(4);
		rect(x - 6, y - 6, l + 12, h + 12);
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
	dsTitre(t('accueil.titre'), x0, 160, 88, MENU_C.blanc, 'left'); // titre au style pixel (Bitsy Pixels)
	noStroke();
	textSize(28);
	fill(MENU_C.doux);
	text(t('accueil.sousTitre'), x0, 276, 900, 80);
	const e = entreesMenu();
	if (MENU.choix >= e.length) MENU.choix = 0;
	e.forEach((it, i) => {
		const h = it.sous ? 104 : 84;
		const y = e.length > 5 ? 370 + i * 106 : 380 + i * 116; // prompt 47 : 6 entrées avec le palmarès
		carteMenu(x0, y, 620, h, t('mp.' + it.cle), it.sous, it.action, i === MENU.choix, it.icone);
	});
	selecteurLangue(L - 80, 56);
	// Prompt 65 : installation de la webapp (seulement si le navigateur la propose) ; mention une fois installée
	if (installationPossible()) bouton(L - 80 - 420, 130, 420, 64, t('pwa.installer'), installerApplication, false, true);
	else if (estInstallee()) {
		textAlign(RIGHT, TOP);
		textFont(POLICE_DONNEES);
		textSize(18);
		fill(MENU_C.doux);
		text(t('pwa.badge'), L - 80, 130);
		textAlign(LEFT, TOP);
	}
	textAlign(LEFT, BOTTOM);
	textFont(POLICE_DONNEES);
	textSize(18);
	fill(MENU_C.doux);
	text(t('mp.clavier'), x0, H - 96);
	text(t('mp.sources'), x0, H - 70);
	// Prompt 81 : crédits + licence MIT cliquable, en pied de page
	text(t('mp.credits'), x0, H - 44);
	const lc = t('mp.licence');
	const lx = x0 + textWidth(t('mp.credits')) + 18;
	fill(MENU_C.doux);
	text(lc, lx, H - 44);
	boutons.push({ x: lx - 6, y: H - 62, l: textWidth(lc) + 12, h: 26, action: () => ouvrirLienExterne(LICENSE_URL) });
	// Bloc « partager / dépôt » en bas à droite (icônes dessinées par le code, cibles ≥ 44 px)
	const by = H - 156;
	bouton(L - 80 - 320, by, 150, 64, '', () => ouvrirLienExterne(DEPOT_URL));
	iconeMenu('github', L - 80 - 320 + 22, by + 10, MENU_C.blanc);
	dsTexte(t('mp.depot'), L - 80 - 320 + 80, by + 32, 18, MENU_C.blanc, 'left');
	bouton(L - 80 - 160, by, 160, 64, '', () => ((MENU.partage = true), (MENU.choixPartage = 0), annoncer(t('mp.partager'))));
	iconeMenu('partage', L - 80 - 160 + 20, by + 10, MENU_C.blanc);
	dsTexte(t('mp.partager'), L - 80 - 160 + 78, by + 32, 18, MENU_C.blanc, 'left');
}

// ——— Prompt 81 : panneau modal « Partager » (même style que les fenêtres, Échap ferme) ———
function dessinerPanneauPartage() {
	if (!MENU.partage) return;
	boutons = []; // seul le panneau est cliquable
	voile();
	const l = 820;
	const h = 130 + PARTAGES.length * 84 + 90;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, MENU_C.bleu);
	textAlign(LEFT, TOP);
	noStroke();
	fill(MENU_C.blanc);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(34);
	text(t('mp.partager'), x + 40, y + 26);
	textStyle(NORMAL);
	// croix de fermeture
	const cx = x + l - 76;
	const cy = y + 18;
	const survolX = mouseX >= cx && mouseX <= cx + 44 && mouseY >= cy && mouseY <= cy + 44;
	noStroke();
	fill(survolX ? MENU_C.bleu : MENU_C.nuit);
	rect(cx, cy, 44, 44);
	stroke(MENU_C.blanc);
	strokeWeight(3);
	line(cx + 12, cy + 12, cx + 32, cy + 32);
	line(cx + 32, cy + 12, cx + 12, cy + 32);
	noStroke();
	boutons.push({ x: cx, y: cy, l: 44, h: 44, action: () => (MENU.partage = false) });
	PARTAGES.forEach((p, i) => {
		const ry = y + 100 + i * 84;
		const sel = i === MENU.choixPartage;
		const survol = mouseX >= x + 32 && mouseX <= x + l - 32 && mouseY >= ry && mouseY <= ry + 72;
		const actif = sel || survol;
		noStroke();
		fill(actif ? MENU_C.blanc : 'rgba(255,255,255,0.06)');
		rect(x + 32, ry, l - 64, 72);
		if (actif) {
			fill(MENU_C.bleu);
			rect(x + 32, ry, 6, 72);
		}
		iconeMenu(p.icone, x + 52, ry + 12, actif ? MENU_C.bleu : MENU_C.blanc);
		textAlign(LEFT, CENTER);
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		ajusterTaille(t('mp.partager.' + p.cle), l - 200, 24);
		fill(actif ? MENU_C.encre : MENU_C.blanc);
		text(t('mp.partager.' + p.cle), x + 116, ry + 36);
		textStyle(NORMAL);
		if (sel) {
			noFill();
			stroke(MENU_C.bleu);
			strokeWeight(4);
			rect(x + 32 - 6, ry - 6, l - 64 + 12, 72 + 12);
			noStroke();
		}
		boutons.push({ x: x + 32, y: ry, l: l - 64, h: 72, action: () => activerPartage(i) });
	});
	bouton(x + l - 40 - 260, y + h - 78, 260, 56, t('mp.partager.fermer'), () => (MENU.partage = false), false, true);
}

/* Prompt 41 : « Nouvelle partie » = deux modes. Histoire (recommandé) : semaine facile, normale, difficile,
   un élément de jeu de plus chaque semaine. Temps réel : débloqué quand l'histoire est terminée. */
function modesNouvellePartie() {
	const p = progressionHistoire();
	const semaines = semainesHistoire();
	const prochain = p.termine ? 1 : [1, 2, 3].find((n) => p.scores[n] === undefined) || 1;
	const enLigne = Jeu.enLigne !== false;
	return [
		{
			cle: 'histoire',
			titre: t('mp.mode.histoire'),
			detail: t('mp.mode.histoire.sous'),
			info: t('mp.mode.histoire.etat', { n: prochain, element: t('histoire.element.' + ELEMENTS_CHAPITRE[prochain]) }),
			chapitre: prochain,
			recommande: true,
			desactive: semaines.length < 3,
		},
		{
			cle: 'direct',
			titre: t('mp.mode.direct'),
			detail: t('mp.mode.direct.sous'),
			info: !tempsReelDebloque() ? t('mp.mode.direct.verrou') : !enLigne ? t('mp.mode.direct.horsLigne') : t('accueil.direct.info', { meilleur: texteMeilleur('direct') }),
			verrou: !tempsReelDebloque(),
			desactive: !tempsReelDebloque() || !enLigne,
		},
	];
}
function dessinerChoixSemaine() {
	const modes = modesNouvellePartie();
	if (MENU.choixSemaine >= modes.length) MENU.choixSemaine = 0;
	noStroke();
	dsTitre(t('mp.semaines.titre'), 160, 100, 60, MENU_C.blanc, 'left');
	noStroke();
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textSize(26);
	fill(MENU_C.doux);
	text(t('mp.mode.sous'), 160, 186, 1500, 60);
	const lc = 780;
	const hc = 400;
	modes.forEach((o, i) => {
		const x = 160 + i * (lc + 40);
		const y = 280;
		const sel = i === MENU.choixSemaine;
		const survol = mouseX >= x && mouseX <= x + lc && mouseY >= y && mouseY <= y + hc;
		const actif = (sel || survol) && !o.verrou;
		noStroke();
		fill(actif ? MENU_C.blanc : 'rgba(255,255,255,0.06)');
		rect(x, y, lc, hc);
		if (!actif) {
			stroke(255, 255, 255, 60);
			strokeWeight(2);
			noFill();
			rect(x + 1, y + 1, lc - 2, hc - 2);
			noStroke();
		}
		if (sel) {
			noFill();
			stroke(MENU_C.bleu);
			strokeWeight(4);
			rect(x - 6, y - 6, lc + 12, hc + 12);
			noStroke();
		}
		const encre = o.verrou ? 'rgba(255,255,255,0.55)' : actif ? MENU_C.encre : MENU_C.blanc;
		if (o.recommande) {
			fill(MENU_C.bleu);
			rect(x, y, 300, 40);
			fill('#ffffff');
			textAlign(LEFT, CENTER);
			textFont(POLICE_DONNEES);
			textSize(18);
			text(t('mp.mode.recommande'), x + 20, y + 20);
		}
		if (o.verrou) {
			// cadenas dessiné par le code
			stroke('rgba(255,255,255,0.7)');
			strokeWeight(6);
			noFill();
			arc(x + lc - 80, y + 70, 44, 50, PI, TWO_PI);
			noStroke();
			fill('rgba(255,255,255,0.7)');
			rect(x + lc - 110, y + 70, 60, 46);
		}
		textAlign(LEFT, TOP);
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		ajusterTaille(o.titre, lc - 200, 40);
		fill(encre);
		text(o.titre, x + 40, y + 70);
		textStyle(NORMAL);
		textSize(22);
		textLeading(32);
		fill(o.verrou ? encre : actif ? MENU_C.bleu : MENU_C.doux);
		text(o.detail, x + 40, y + 140, lc - 80, 140);
		textSize(19);
		fill(o.verrou ? encre : actif ? 'rgba(13,12,12,0.75)' : MENU_C.doux);
		text(o.info, x + 40, y + 290, lc - 80, 90);
		boutons.push({ x, y, l: lc, h: hc, action: () => (MENU.choixSemaine === i ? lancerDepuisMenu() : (MENU.choixSemaine = i)) });
	});
	if (typeof dessinerOptionsNouvellePartie === 'function') dessinerOptionsNouvellePartie(160, H - 250); // prompt 37
	const o = modes[MENU.choixSemaine];
	bouton(L - 160 - 420, H - 150, 420, 84, t('mp.lancer'), lancerDepuisMenu, !o || o.desactive);
	bouton(160, H - 140, 260, 68, t('mp.retour'), () => ((MENU.ecran = 'titre'), (MENU.debut = millis())), false, true);
}

/** Clavier du menu principal ; renvoie true si la touche a été traitée */
function toucheMenu() {
	if (MENU.partage) {
		// Prompt 81 : ↑/↓ ou Tab parcourt les options, Entrée active, Échap ferme le panneau
		if (keyCode === ESCAPE || keyCode === BACKSPACE) MENU.partage = false;
		else if (keyCode === UP_ARROW || (keyCode === TAB && keyIsDown(SHIFT))) MENU.choixPartage = (MENU.choixPartage + PARTAGES.length - 1) % PARTAGES.length;
		else if (keyCode === DOWN_ARROW || keyCode === TAB) MENU.choixPartage = (MENU.choixPartage + 1) % PARTAGES.length;
		else if (keyCode === ENTER || keyCode === RETURN || key === ' ') activerPartage(MENU.choixPartage);
		if (keyCode === UP_ARROW || keyCode === DOWN_ARROW || keyCode === TAB) annoncer(t('mp.partager.' + PARTAGES[MENU.choixPartage].cle));
		return true;
	}
	if (MENU.ecran === 'semaines') {
		const n = modesNouvellePartie().length;
		if (keyCode === LEFT_ARROW || keyCode === UP_ARROW || (keyCode === TAB && keyIsDown(SHIFT))) MENU.choixSemaine = (MENU.choixSemaine + n - 1) % n;
		else if (keyCode === RIGHT_ARROW || keyCode === DOWN_ARROW || keyCode === TAB) MENU.choixSemaine = (MENU.choixSemaine + 1) % n;
		else if (keyCode === ENTER || keyCode === RETURN) lancerDepuisMenu();
		else if (keyCode === ESCAPE || keyCode === BACKSPACE) (MENU.ecran = 'titre'), (MENU.debut = millis());
		else if (typeof toucheOptionsNouvellePartie === 'function') toucheOptionsNouvellePartie(); // prompt 37
		const o = modesNouvellePartie()[MENU.choixSemaine];
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
	noStroke();
	fill(C.fond);
	rect(0, 0, L, H); // prompt 50 : pas de background() dans la fenêtre de l'appli (il ignore la transformation)
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
