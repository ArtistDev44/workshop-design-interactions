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
 * Prompt 174 : les raccourcis affichés viennent de RACCOURCIS_AIDE (tableau unique, vérifié par test-jeu.mjs).
 *
 * Prompt 172 : chaque carte de règle et chaque malus porte une illustration dessinée en code (illustrationAide) —
 * les composants réels du jeu en réduction (jauge du bandeau, pin de la carte, jauge de somnolence, répliques) ou
 * une icône Lucide ; aucune image. Leur équivalent texte est dit par l'annonce de l'onglet (aide.illus.*).
 * La fenêtre s'ouvre aussi depuis les livres du bureau (immersion.js), à la place de l'ancien livre.
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
	annoncer(annonceOngletAide(i));
}
/** Annonce d'un onglet : son rang, son titre et l'équivalent texte de ses illustrations (prompt 172) */
function annonceOngletAide(i) {
	const cle = ONGLETS_AIDE[i];
	return t('aide.onglet.annonce', { n: i + 1, total: ONGLETS_AIDE.length, titre: t(LIBELLES_ONGLETS_AIDE[cle]) }) + (ONGLETS_ILLUSTRES_AIDE.includes(cle) ? ' ' + t('aide.illus.' + cle) : '');
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

// ——— Illustrations (prompt 172) : une vignette par carte, dessinée en code, jamais plus haute que la carte ———
const ONGLETS_ILLUSTRES_AIDE = ['demarrer', 'regles', 'malus'];
const VIGNETTE_AIDE = { l: 116, h: 84, ecart: 20 };
const ICONES_MALUS_AIDE = { non_traite: 'inbox', sieste: 'moon', objectif_rate: 'flag', equipe_inutile: 'users', budget_epuise: 'wallet' };
/** Jauge du bandeau en réduction : piste, remplissage à la couleur du seuil (vert, orange sous 40, rouge sous 20), repères 20 et 40 */
function miniJaugeAide(x, y, l, h, v) {
	noStroke();
	fill(C.piste);
	rect(x, y, l, h);
	fill(v < 20 ? C.rougeFonce : v < 40 ? C.orange : C.vert);
	rect(x, y, (l * v) / 100, h);
	fill(255, 255, 255, 170);
	[20, 40].forEach((s) => rect(x + (l * s) / 100 - 1, y - 2, 2, h + 4));
}
/** Pin d'alerte de la carte (ICONE_PIN, comme dessinerMarqueur) : taille et couleur selon la gravité, liseré blanc si élevée */
function miniPinAide(x, y, g) {
	const tm = g === 'elevee' ? 36 : g === 'moyenne' ? 28 : 20;
	if (g === 'elevee') {
		const blanc = { P: DS.blanc, W: DS.blanc };
		for (let dx = -2; dx <= 2; dx += 2) for (let dy = -2; dy <= 2; dy += 2) if (dx || dy) dessinerIconePixel(ICONE_PIN, x + dx, y + dy, tm, blanc);
	}
	dessinerIconePixel(ICONE_PIN, x, y, tm, { P: couleurGravite(g), W: g === 'elevee' ? DS.blanc : DS.fond });
}
/** Vignette d'une carte : cle = rang du paragraphe de aide.texte (1 à 9) ou identifiant de malus */
function illustrationAide(cle, x, y, l, h) {
	const barre = (bx, by, bl, c) => (noStroke(), fill(c), rect(x + bx, y + by, bl, 6));
	push();
	noStroke();
	fill(DS.blanc05);
	rect(x, y, l, h);
	noFill();
	stroke(DS.blanc15);
	strokeWeight(2);
	rect(x + 1, y + 1, l - 2, h - 2);
	noStroke();
	if (ICONES_MALUS_AIDE[cle]) {
		iconeLucide(ICONES_MALUS_AIDE[cle], x + (l - 32) / 2, y + (h - 32) / 2, 32, DS.erreurClair);
	} else if (cle === 1) {
		// Signalements : la carte (fleuve, ligne), deux pins à leur lieu
		fill('rgba(56,96,255,0.55)');
		rect(x + 8, y + 56, l - 16, 8);
		fill(DS.blanc50);
		for (let i = 0; i < 12; i++) rect(x + 10 + i * 8, y + 30 + Math.round(Math.sin(i / 2.2) * 5), 6, 2);
		miniPinAide(x + 26, y + 10, 'moyenne');
		miniPinAide(x + 78, y + 40, 'faible');
	} else if (cle === 2) {
		// Répondre : trois répliques, la touche à gauche ; celle du haut est choisie
		for (let i = 0; i < 3; i++) {
			fill(i === 0 ? DS.alerte : DS.blanc50);
			rect(x + 12, y + 13 + i * 22, 14, 14);
			fill(i === 0 ? DS.blanc : DS.blanc15);
			rect(x + 34, y + 13 + i * 22, l - 46, 14);
		}
	} else if (cle === 3) {
		// Gravité : les trois tailles du pin de la carte (élevée, moyenne, faible)
		miniPinAide(x + 12, y + 24, 'elevee');
		miniPinAide(x + 54, y + 30, 'moyenne');
		miniPinAide(x + 86, y + 36, 'faible');
	} else if (cle === 5) {
		// Défi chrono : minuteur et compteur qui se vide
		iconeLucide('timer', x + (l - 32) / 2, y + 12, 32, DS.alerte);
		barre(14, 58, l - 28, C.piste);
		barre(14, 58, (l - 28) * 0.4, DS.alerte);
	} else if (cle === 6) {
		// Somnolence : la jauge du poste (bleue, orange à 50, rouge à 80) sous une lune
		iconeLucide('moon', x + (l - 32) / 2, y + 12, 32, DS.blanc);
		barre(14, 58, l - 28, C.piste);
		barre(14, 58, (l - 28) * 0.62, C.orange);
	} else if (cle === 7) {
		// Le patron surveille : œil, deux jauges trop basses
		iconeLucide('eye', x + (l - 32) / 2, y + 10, 32, DS.blanc);
		miniJaugeAide(x + 14, y + 52, l - 28, 6, 22);
		miniJaugeAide(x + 14, y + 66, l - 28, 6, 14);
	} else if (cle === 8) {
		// Tâches du jour : deux priorités cochées, une à faire
		for (let i = 0; i < 3; i++) {
			if (i < 2) iconeLucide('check', x + 12, y + 10 + i * 22, 20, DS.succes);
			else (noFill(), stroke(DS.blanc50), strokeWeight(2), rect(x + 15, y + 13 + i * 22, 14, 14), noStroke());
			barre(40, 17 + i * 22, l - 54 - i * 10, i < 2 ? DS.blanc50 : DS.blanc);
		}
	} else if (cle === 9) {
		// Comprendre une décision : la loupe, une jauge qui monte, une qui baisse
		iconeLucide('search', x + 14, y + (h - 32) / 2, 32, DS.blanc);
		iconeLucide('trending-up', x + 62, y + 16, 24, DS.succes);
		iconeLucide('trending-down', x + 62, y + 46, 24, DS.erreurClair);
	}
	pop();
}

// ——— Cartes : { h(l) → hauteur, dessin(x, y, l) } ; placées en colonnes, puis en pages ———
/** Carte de règle : titre, vignette à gauche (illus : rang du paragraphe), texte à droite */
function carteTexteAide(titre, texte, illus) {
	const V = VIGNETTE_AIDE;
	const dx = illus ? V.l + V.ecart : 0;
	return {
		h: (l) => 42 + Math.max(illus ? V.h + 4 : 0, hauteurTexte(texte, l - dx, optionsTexteAide())),
		dessin(x, y, l) {
			titreCarteAide(titre, x, y, l);
			if (illus) illustrationAide(illus, x, y + 46, V.l, V.h);
			dessinerTexte(texte, x + dx, y + 42, l - dx, optionsTexteAide());
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
			iconeLucide('book-open', x + l - 24, y - 2, 24, DS.alerte); // prompt 172 : le glossaire garde toute sa largeur, l'illustration est dans le titre
			lignes.forEach(([terme, d]) => {
				dessinerTexte(terme, x, yy, lt - 16, optionsTexteAide(DS.blanc, BOLD));
				dessinerTexte(d, x + lt, yy, l - lt, optionsTexteAide());
				yy += hl(d, l);
			});
		},
	};
}
/** Prompt 174 : l'onglet Raccourcis, tiré du même tableau que jeu/174-raccourcis.md — [groupe, [[touche, description]]] ;
 * la touche est une clé i18n (aide.k.*Touche, traduite) ou un libellé identique dans les deux langues. Un test
 * (test-jeu.mjs, bloc « Prompt 174 ») vérifie que chaque touche citée ici est lue par le code. */
const RACCOURCIS_AIDE = [
	['signalement', [['aide.k.entreeTouche', 'aide.k.entree'], ['aide.k.actionsTouche', 'aide.k.actions'], ['A / B', 'aide.k.ab'], ['E / 5–8', 'aide.k.sources']]], // prompt 161 : une seule vérité avec le tutoriel (E ouvre, 5 à 8 révèlent)
	['equipes', [['aide.k.glisserTouche', 'aide.k.glisser'], ['aide.k.majTouche', 'aide.k.equipes'], ['↑ ↓', 'aide.k.semaine'], ['aide.k.zoomTouche', 'aide.k.zoom'], ['aide.k.origineTouche', 'aide.k.origine'], ['Tab', 'aide.k.objets']]],
	['bureau', [['← → ↑ ↓', 'aide.k.regarder'], ['aide.k.quitterTouche', 'aide.k.quitter'], ['Z', 'aide.k.sieste'], ['aide.k.quitterJourneeTouche', 'aide.k.quitterJournee'], ['I', 'aide.k.indicateurs']]],
	['general', [['P', 'aide.k.pause'], ['R', 'aide.k.reset'], ['M', 'aide.k.son'], ['aide.k.aideTouche', 'aide.k.aide'], ['T', 'aide.k.tuto'], ['L', 'aide.k.langue']]],
];
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
	const dx = 64 + VIGNETTE_AIDE.ecart; // prompt 172 : vignette (icône du malus) à gauche
	return {
		h: (l) => Math.max(64, 34 + hauteurTexte(txt, l - dx, optionsTexteAide())),
		dessin(x, y, l) {
			illustrationAide(m.id, x, y + 2, 64, 60);
			dessinerTexte(String(m.libelle), x + dx, y, l - dx, { police: POLICE_TEXTE, taille: 22, interligne: 30, couleur: DS.erreurClair, style: BOLD });
			dessinerTexte(txt, x + dx, y + 34, l - dx, optionsTexteAide());
		},
	};
}
function cartesAide(onglet) {
	const p = paragraphesAide();
	if (onglet === 'regles') return ORDRE_REGLES_AIDE.filter((i) => p[i]).map((i) => carteTexteAide(t('aide.carte.' + i), p[i], i)).concat(p[GLOSSAIRE_AIDE] ? [carteGlossaireAide(t('aide.carte.' + GLOSSAIRE_AIDE), p[GLOSSAIRE_AIDE])] : []);
	if (onglet === 'raccourcis') return RACCOURCIS_AIDE.map(([g, lignes]) => carteRaccourcisAide(t('aide.groupe.' + g), lignes.map(([k, d]) => [k.startsWith('aide.k.') ? t(k) : k, t(d)])));
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
	const l = DS.fenetre.large; // prompt 173 (était 1720)
	const h = 1040;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	// Ouverture : retour au premier onglet (la fenêtre n'était pas dessinée à l'image précédente)
	if (frameCount - AIDE.vue > 1) {
		AIDE.onglet = 0;
		AIDE.page = 0;
		AIDE.debut = millis();
		annoncer(annonceOngletAide(0)); // prompt 172 : l'ouverture dit l'onglet et ses illustrations
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
		// Prompt 170 : flèches Lucide (page précédente / suivante), nommées par « Page n / total » juste à côté
		bouton(cx, by, 64, 60, '', () => pageAide(-1), AIDE.page === 0, true);
		iconeLucide('arrow-left', cx + 20, by + 18, 24, AIDE.page === 0 ? 'rgba(255,255,255,0.5)' : '#FFFFFF');
		dsTexte(t('aide.page', { n: AIDE.page + 1, total: AIDE.pages }), cx + 84, by + 18, 20, DS.blanc75, 'left');
		bouton(cx + 240, by, 64, 60, '', () => pageAide(1), AIDE.page >= AIDE.pages - 1, true);
		iconeLucide('arrow-right', cx + 260, by + 18, 24, AIDE.page >= AIDE.pages - 1 ? 'rgba(255,255,255,0.5)' : '#FFFFFF');
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
	// Prompt 172 : les trois jauges du bandeau en réduction, une dans chaque état (vert, orange, rouge)
	const pas = Math.min(260, lb / 3);
	['fluidite', 'reputation', 'budget'].forEach((cle, i) => {
		dsTexte(t('jaugeTitre.' + cle), x + i * pas, yy, 22, DS.blanc, 'left');
		miniJaugeAide(x + i * pas, yy + 38, pas - 40, 10, [72, 31, 12][i]);
	});
	// Le tutoriel
	const tx = portrait ? x : x + lg + 64;
	const ty = portrait ? yy + 70 : y;
	const tl = portrait ? l : l - lg - 64;
	const total = typeof ETAPES_TUTORIEL !== 'undefined' ? ETAPES_TUTORIEL : 0;
	const deuxLignes = !portrait; // prompt 173 : fenêtre large (1280) → l'accroche du tutoriel passe sur deux lignes
	const th = 42 + 44 + (deuxLignes ? 28 : 0) + total * 34 + 28 + (portrait ? 110 : 76) + 32;
	noStroke();
	fill(DS.blanc05);
	rect(tx, ty, tl, th);
	noFill();
	stroke(DS.blanc15);
	strokeWeight(2);
	rect(tx + 1, ty + 1, tl - 2, th - 2);
	noStroke();
	let y2 = ty + 28 + titreCarteAide(t('aide.tuto.titre'), tx + 32, ty + 28, tl - 64);
	push(); // interligne local
	textLeading(28);
	dsTexte(t('aide.tuto.texte', { n: total }), tx + 32, y2, 20, DS.blanc75, 'left', deuxLignes ? tl - 64 : undefined);
	pop();
	y2 += 44 + (deuxLignes ? 28 : 0);
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
