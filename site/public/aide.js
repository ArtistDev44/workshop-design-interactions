/* Nantes en régulation — prompt 123 : l'aide revue pour être lisible (UX / UI).
 * Avant : une seule page (19 raccourcis, malus, bloc de règles rétréci jusqu'à 13 px). Maintenant : une fenêtre du
 * Pixel DS à quatre onglets, une idée par écran —
 *   1 Bien démarrer : l'objectif, les seuils des jauges, le tutoriel (bouton primaire) ;
 *   2 Règles : le texte des règles (aide.texte, inchangé sur le fond) découpé par paragraphe en cartes titrées,
 *     sur deux colonnes, paginées si besoin ; le glossaire en lignes terme / définition ;
 *   3 Raccourcis : groupés par contexte, la touche dans une capsule ;
 *   4 Malus : nom, condition → conséquence.
 * Texte courant à 20 px au moins, interligne 1,4 : une rubrique trop longue se pagine, elle ne rétrécit jamais.
 * Clavier : ← → ou Tab (onglets), 1 à 4, ↑ ↓ (pages), T (tutoriel), H / ? / Échap (fermer, sketch.js).
 */
const AIDE = { onglet: 0, page: 0, pages: 1, debut: 0, vue: -9 };
const ONGLETS_AIDE = ['demarrer', 'regles', 'raccourcis', 'malus'];
const LIBELLES_ONGLETS_AIDE = { demarrer: 'aide.onglet.demarrer', regles: 'aide.regles', raccourcis: 'aide.raccourcis', malus: 'aide.malus' };
// Paragraphes de aide.texte, dans l'ordre : 0 objectif · 1 signalements · 2 répondre · 3 gravité · 4 glossaire ·
// 5 défi chrono · 6 somnolence · 7 patron · 8 tâches · 9 comprendre une décision
const ORDRE_REGLES_AIDE = [1, 2, 3, 7, 8, 5, 6, 9];
const GLOSSAIRE_AIDE = 4;
// Le titre de la carte dit déjà le sujet : l'amorce du paragraphe (« Gravité : », « Glossaire — ») est retirée à l'affichage
const AMORCES_AIDE = /^(Objectif|Gravité|Somnolence|Tâches du jour|Goal|Severity|Drowsiness|Daily tasks) ?: |^(Glossaire|Glossary) — /;
const TEXTE_AIDE = { taille: 20, interligne: 28 };

function paragraphesAide() {
	return t('aide.texte')
		.split('\n\n')
		.map((p) => {
			const s = p.replace(AMORCES_AIDE, '');
			return s.charAt(0).toUpperCase() + s.slice(1);
		});
}
function changerOngletAide(i) {
	if (i === AIDE.onglet) return;
	AIDE.onglet = i;
	AIDE.page = 0;
	AIDE.debut = millis();
	Confort.Son.bip('choix');
	annoncer(t('aide.onglet.annonce', { n: i + 1, total: ONGLETS_AIDE.length, titre: t(LIBELLES_ONGLETS_AIDE[ONGLETS_AIDE[i]]) }));
}
function pageAide(sens) {
	const p = constrain(AIDE.page + sens, 0, AIDE.pages - 1);
	if (p === AIDE.page) return;
	AIDE.page = p;
	AIDE.debut = millis();
	Confort.Son.bip('choix');
	annoncer(t('aide.page', { n: p + 1, total: AIDE.pages }));
}
/** Clavier de l'aide (appelé par sketch.js quand la fenêtre est ouverte) ; true si la touche est traitée */
function toucheAide() {
	const n = ONGLETS_AIDE.length;
	if (keyCode === LEFT_ARROW || (keyCode === TAB && keyIsDown(SHIFT))) return changerOngletAide((AIDE.onglet + n - 1) % n), true;
	if (keyCode === RIGHT_ARROW || keyCode === TAB) return changerOngletAide((AIDE.onglet + 1) % n), true;
	if (key >= '1' && key <= String(n)) return changerOngletAide(Number(key) - 1), true;
	if (keyCode === DOWN_ARROW || keyCode === 34) return pageAide(1), true;
	if (keyCode === UP_ARROW || keyCode === 33) return pageAide(-1), true;
	return false;
}

/** Titre de carte : capitales, jaune du DS, filet dessous ; renvoie la hauteur prise */
function titreCarteAide(txt, x, y, l) {
	noStroke();
	textFont(POLICE_DONNEES);
	textStyle(BOLD);
	textSize(18);
	textAlign(LEFT, TOP);
	fill(DS.alerte);
	text(String(txt).toUpperCase(), x, y);
	textStyle(NORMAL);
	fill(DS.blanc15);
	rect(x, y + 28, l, 2);
	return 42;
}
const optionsTexteAide = (couleur, style) => ({ police: POLICE_TEXTE, taille: TEXTE_AIDE.taille, interligne: TEXTE_AIDE.interligne, couleur: couleur || DS.blanc75, style: style || NORMAL });

// ——— Cartes : { h(l) → hauteur, dessin(x, y, l) } ; placées en colonnes, puis en pages ———
function carteTexteAide(titre, texte) {
	return {
		h: (l) => 42 + hauteurTexte(texte, l, optionsTexteAide()),
		dessin(x, y, l) {
			titreCarteAide(titre, x, y, l);
			dessinerTexte(texte, x, y + 42, l, optionsTexteAide());
		},
	};
}
/** Glossaire : « terme : définition · terme : définition » → une ligne par terme */
function carteGlossaireAide(titre, texte) {
	const lt = 250;
	const lignes = String(texte)
		.replace(/\.$/, '')
		.split(' · ')
		.map((s) => {
			const k = s.indexOf(':');
			return k < 0 ? ['', s.trim()] : [s.slice(0, k).trim(), s.slice(k + 1).trim()];
		});
	const hl = (d, l) => Math.max(TEXTE_AIDE.interligne, hauteurTexte(d, l - lt, optionsTexteAide())) + 8;
	return {
		h: (l) => 42 + lignes.reduce((a, [, d]) => a + hl(d, l), 0),
		dessin(x, y, l) {
			let yy = y + titreCarteAide(titre, x, y, l);
			lignes.forEach(([terme, d]) => {
				dessinerTexte(terme, x, yy, lt - 16, optionsTexteAide(DS.blanc, BOLD));
				dessinerTexte(d, x + lt, yy, l - lt, optionsTexteAide());
				yy += hl(d, l);
			});
		},
	};
}
/** Groupe de raccourcis : la touche dans une capsule, la description à côté */
function carteRaccourcisAide(titre, lignes) {
	const lt = 250;
	const hl = (d, l) => Math.max(40, hauteurTexte(d, l - lt, optionsTexteAide()) + 12);
	return {
		h: (l) => 42 + lignes.reduce((a, [, d]) => a + hl(d, l), 0),
		dessin(x, y, l) {
			let yy = y + titreCarteAide(titre, x, y, l);
			lignes.forEach(([k, d]) => {
				textFont(POLICE_DONNEES);
				textSize(18);
				const lk = Math.min(lt - 20, Math.max(44, textWidth(k) + 24));
				noFill();
				stroke(DS.blanc50);
				strokeWeight(2);
				rect(x + 1, yy + 1, lk - 2, 32);
				noStroke();
				fill(DS.blanc);
				textAlign(CENTER, CENTER);
				zoneTexteDebut('toucheAide', x, yy, lk, 34);
				ajusterTaille(k, lk - 16, 18, 14);
				text(k, x + lk / 2, yy + 17);
				zoneTexteFin();
				textAlign(LEFT, TOP);
				dessinerTexte(d, x + lt, yy + 3, l - lt, optionsTexteAide());
				yy += hl(d, l);
			});
		},
	};
}
function carteMalusAide(m) {
	const txt = String(m.condition) + ' → ' + String(m.consequence);
	return {
		h: (l) => 34 + hauteurTexte(txt, l, optionsTexteAide()),
		dessin(x, y, l) {
			dessinerTexte(String(m.libelle), x, y, l, { police: POLICE_TEXTE, taille: 22, interligne: 30, couleur: DS.erreurClair, style: BOLD });
			dessinerTexte(txt, x, y + 34, l, optionsTexteAide());
		},
	};
}
function cartesAide(onglet) {
	const p = paragraphesAide();
	if (onglet === 'regles') return ORDRE_REGLES_AIDE.filter((i) => p[i]).map((i) => carteTexteAide(t('aide.carte.' + i), p[i])).concat(p[GLOSSAIRE_AIDE] ? [carteGlossaireAide(t('aide.carte.' + GLOSSAIRE_AIDE), p[GLOSSAIRE_AIDE])] : []);
	if (onglet === 'raccourcis')
		return [
			carteRaccourcisAide(t('aide.groupe.signalement'), [
				[t('aide.k.entreeTouche'), t('aide.k.entree')],
				[t('aide.k.actionsTouche'), t('aide.k.actions')],
				[t('aide.k.rienTouche'), t('aide.k.rien')],
				['A / B', t('aide.k.ab')],
				['5 6 7 8', t('aide.k.sources')],
			]),
			carteRaccourcisAide(t('aide.groupe.equipes'), [
				[t('aide.k.glisserTouche'), t('aide.k.glisser')],
				[t('aide.k.majTouche'), t('aide.k.equipes')],
				['↑ ↓', t('aide.k.semaine')],
				['Tab', t('aide.k.objets')],
			]),
			carteRaccourcisAide(t('aide.groupe.bureau'), [
				['← → ↑ ↓', t('aide.k.regarder')],
				[t('aide.k.quitterTouche'), t('aide.k.quitter')],
				['Z', t('aide.k.sieste')],
				[t('aide.k.quitterJourneeTouche'), t('aide.k.quitterJournee')],
			]),
			carteRaccourcisAide(t('aide.groupe.general'), [
				['P', t('aide.k.pause')],
				['R', t('aide.k.reset')],
				['M', t('aide.k.son')],
				[t('aide.k.aideTouche'), t('aide.k.aide')],
				['T', t('aide.k.tuto')],
				['L', t('aide.k.langue')],
			]),
		];
	if (onglet === 'malus') return (Jeu.MALUS || []).map(carteMalusAide);
	return [];
}
/** Répartit les cartes en colonnes puis en pages ; renvoie les pages : [[{ c, x, y }]] */
function mettreEnPagesAide(cartes, x, y, l, h, colonnes, ecart) {
	const lc = (l - (colonnes - 1) * 48) / colonnes;
	const pages = [[]];
	let col = 0;
	let yy = y;
	cartes.forEach((c) => {
		const hc = c.h(lc);
		if (yy > y && yy + hc > y + h) {
			col++;
			yy = y;
			if (col >= colonnes) {
				col = 0;
				pages.push([]);
			}
		}
		pages[pages.length - 1].push({ c, x: x + col * (lc + 48), y: yy, l: lc });
		yy += hc + ecart;
	});
	return pages;
}

function fenetreAide() {
	const portrait = typeof PORTRAIT !== 'undefined' && PORTRAIT.actif;
	const l = portrait ? 1260 : 1720;
	const h = 1040;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	// Ouverture : retour au premier onglet (la fenêtre n'était pas dessinée à l'image précédente)
	if (frameCount - AIDE.vue > 1) {
		AIDE.onglet = 0;
		AIDE.page = 0;
		AIDE.debut = millis();
	}
	AIDE.vue = frameCount;
	dsPanneau(x, y, l, h, t('aide.titre'));
	// ——— Onglets ———
	const n = ONGLETS_AIDE.length;
	const lo = (l - 96 - (n - 1) * 12) / n;
	const ho = portrait ? 96 : 60; // ≥ 44 px à l'écran en portrait
	ONGLETS_AIDE.forEach((cle, i) => {
		const ox = x + 48 + i * (lo + 12);
		const oy = y + 80;
		const actif = i === AIDE.onglet;
		const survol = mouseX >= ox && mouseX <= ox + lo && mouseY >= oy && mouseY <= oy + ho;
		noStroke();
		fill(actif ? DS.blanc : survol ? DS.blanc15 : DS.blanc05);
		rect(ox, oy, lo, ho);
		if (actif) {
			fill(DS.primaire);
			rect(ox, oy + ho - 6, lo, 6); // liseré primaire
			noFill();
			stroke(DS.blanc);
			strokeWeight(2);
			rect(ox - 5, oy - 5, lo + 10, ho + 10); // double bordure du DS
			noStroke();
		} else {
			noFill();
			stroke(DS.blanc15);
			strokeWeight(2);
			rect(ox + 1, oy + 1, lo - 2, ho - 2);
			noStroke();
		}
		const lib = i + 1 + ' · ' + t(LIBELLES_ONGLETS_AIDE[cle]);
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textAlign(CENTER, CENTER);
		fill(actif ? DS.fond : DS.blanc);
		zoneTexteDebut('ongletAide', ox, oy, lo, ho);
		ajusterTaille(lib, lo - 24, 22, 16);
		text(lib, ox + lo / 2, oy + ho / 2 - 2);
		zoneTexteFin();
		textStyle(NORMAL);
		boutons.push({ x: ox, y: oy, l: lo, h: ho, action: () => changerOngletAide(i) });
	});
	// ——— Contenu (entrée douce, sauf animations réduites) ———
	const cx = x + 48;
	const cy = y + 80 + ho + 36;
	const cl = l - 96;
	const ch = y + h - 116 - cy;
	const k = reduireAnimations ? 1 : easeOut(constrain((millis() - AIDE.debut) / 220, 0, 1));
	const onglet = ONGLETS_AIDE[AIDE.onglet];
	push();
	drawingContext.globalAlpha = k;
	translate(0, (1 - k) * 10);
	if (onglet === 'demarrer') {
		AIDE.pages = 1;
		dessinerDemarrerAide(cx, cy, cl, ch, portrait);
	} else {
		const pages = mettreEnPagesAide(cartesAide(onglet), cx, cy, onglet === 'malus' && !portrait ? Math.min(cl, 1200) : cl, ch, portrait || onglet === 'malus' ? 1 : 2, onglet === 'malus' ? 26 : 30);
		AIDE.pages = pages.length;
		AIDE.page = constrain(AIDE.page, 0, pages.length - 1);
		pages[AIDE.page].forEach((p) => p.c.dessin(p.x, p.y, p.l));
	}
	drawingContext.globalAlpha = 1;
	pop();
	textAlign(LEFT, TOP);
	// ——— Pied : pages à gauche, tutoriel et fermeture à droite ———
	const by = y + h - 92;
	if (AIDE.pages > 1) {
		bouton(cx, by, 64, 60, '←', () => pageAide(-1), AIDE.page === 0, true);
		dsTexte(t('aide.page', { n: AIDE.page + 1, total: AIDE.pages }), cx + 84, by + 18, 20, DS.blanc75, 'left');
		bouton(cx + 240, by, 64, 60, '→', () => pageAide(1), AIDE.page >= AIDE.pages - 1, true);
	} else if (!portrait) dsTexte(t('aide.clavier'), cx, by + 20, 18, DS.blanc50, 'left');
	bouton(x + l - 48 - 240, by, 240, 60, t('commun.fermer'), fermer, false, true);
	if (onglet !== 'demarrer') bouton(x + l - 48 - 240 - 20 - 380, by, 380, 60, t('tuto.relancer'), lancerTutoriel, false, true);
	textAlign(LEFT, TOP);
}

/** Onglet 1 : l'objectif (grand texte), les seuils des jauges (légende), puis le tutoriel (bouton primaire) */
function dessinerDemarrerAide(x, y, l, h, portrait) {
	const p = paragraphesAide();
	const lg = portrait ? l : Math.round(l * 0.56);
	let yy = y + titreCarteAide(t('aide.carte.0'), x, y, lg);
	yy += dessinerTexte(p[0] || '', x, yy + 6, lg, { police: POLICE_TEXTE, taille: 26, interligne: 38, couleur: DS.blanc }).h + 40;
	// Légende des seuils (ceux de l'objectif : orange sous 40, rouge sous 20)
	const lb = Math.min(lg, 760);
	[
		[0, 20, DS.erreur],
		[20, 40, DS.alerte],
		[40, 100, DS.succes],
	].forEach(([a, b, c]) => {
		noStroke();
		fill(c);
		rect(x + (lb * a) / 100, yy, (lb * (b - a)) / 100 - 4, 24);
	});
	[0, 20, 40, 100].forEach((v) => dsTexte(String(v), x + (lb * v) / 100 - (v === 100 ? 0 : 0), yy + 34, 20, DS.blanc75, v === 100 ? 'right' : 'left'));
	yy += 84;
	['fluidite', 'reputation', 'budget'].forEach((cle, i) => dsTexte('· ' + t('jaugeTitre.' + cle), x + i * Math.min(260, lb / 3), yy, 22, DS.blanc, 'left'));
	// Le tutoriel
	const tx = portrait ? x : x + lg + 64;
	const ty = portrait ? yy + 70 : y;
	const tl = portrait ? l : l - lg - 64;
	const total = typeof ETAPES_TUTORIEL !== 'undefined' ? ETAPES_TUTORIEL : 0;
	const th = 42 + 44 + total * 34 + 28 + (portrait ? 110 : 76) + 32;
	noStroke();
	fill(DS.blanc05);
	rect(tx, ty, tl, th);
	noFill();
	stroke(DS.blanc15);
	strokeWeight(2);
	rect(tx + 1, ty + 1, tl - 2, th - 2);
	noStroke();
	let y2 = ty + 28 + titreCarteAide(t('aide.tuto.titre'), tx + 32, ty + 28, tl - 64);
	dsTexte(t('aide.tuto.texte', { n: total }), tx + 32, y2, 20, DS.blanc75, 'left');
	y2 += 44;
	for (let i = 1; i <= total; i++) {
		dsTexte(String(i), tx + 32, y2, 20, DS.alerte, 'left');
		textFont(POLICE_TEXTE);
		ajusterTaille(t('tuto.' + i + '.titre'), tl - 64 - 40, 20, 16);
		fill(DS.blanc);
		text(t('tuto.' + i + '.titre'), tx + 72, y2);
		y2 += 34;
	}
	bouton(tx + 32, y2 + 20, tl - 64, portrait ? 110 : 76, t('tuto.relancer'), lancerTutoriel);
}
