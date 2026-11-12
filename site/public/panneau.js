/* Nantes en régulation — prompt 87 : un écran principal simplifié, des informations claires, des réponses par problème.
 * Deux colonnes (liste à gauche, panneau du signalement ouvert à droite) sous un bandeau fin (jauges, objectif,
 * équipes, horloge). Panneau en 3 blocs : « Ce qui se passe » (1 phrase), « Pourquoi c'est important » (≤ 3 puces),
 * « Ce que vous savez — et ne savez pas » ; le détail (sources, historique, équipes) derrière « En savoir plus ».
 * Réponses : 3 ou 4 cartes propres à la catégorie du problème (data/reponses.json), chacune avec son explication
 * et la TENDANCE honnête de ses effets dans le contexte réel (signe et ordre de grandeur, pas la valeur exacte).
 * Rien n'est inventé : chaque phrase est construite sur les champs réels ; absent → « non renseigné ».
 */
const BANDEAU = { x: 40, y: 36, l: 1520, h: 44 }; // prompts 144 / 145 : une ligne de 44 px, s'arrête au-dessus de la colonne des équipes
const DATE_COIN = { x: 1576, y: 36, l: 304, h: 44 }; // prompt 144 : date et heure en haut à droite de l'écran
const BANDEAU_TOUT = { x: 40, y: 36, l: 1840, h: 44 }; // bandeau + date (recadrage portrait)
const PANNEAU = { x: 756, y: 92, l: 1124, h: 940 };
const PLUS = { ouvert: false };

// ——— Bandeau fin : jauges compactes · priorités et objectif, sur une ligne (prompts 144 / 145) ; date et heure en coin ———
/** Prompt 143 : seuil de l'objectif du jour (ex. réputation ≥ 60) — null si la jauge n'est pas l'objectif */
function seuilObjectif(cle) {
	const o = Jeu.objectifDuJour ? Jeu.objectifDuJour() : null;
	if (!o || o.jauge !== cle || typeof o.seuil !== 'number') return null;
	return constrain(o.seuil - (Jeu.allegementObjectif || 0), 0, 100);
}
const texteSeuilObjectif = (cle) => t('jauge.seuilObjectif', { seuil: seuilObjectif(cle) });
/** Barre blanche verticale (liseré sombre : lisible sur la piste comme sur le remplissage), dépasse la piste de 5 px
 * en haut et en bas, plus haute que les repères 20 / 40 ; rien sur une jauge sans objectif. Renvoie vrai si dessinée. */
function dessinerSeuilObjectif(cle, bx, by, bl, bh) {
	const s = seuilObjectif(cle);
	if (s === null) return false;
	const sx = Math.round(bx + (bl * s) / 100);
	noStroke();
	fill('#0D0C0C');
	rect(sx - 3, by - 6, 6, bh + 12);
	fill('#FFFFFF');
	rect(sx - 1, by - 5, 2, bh + 10);
	return true;
}
function dessinerBandeau() {
	// Prompts 144 et 145 : UNE ligne de 44 px (au lieu de deux lignes, 84 px) — trois jauges compactes (barre de 10 px
	// à la hauteur du texte), puis « Priorités · Objectif » en un seul élément ; la date et l'heure du jeu sont sorties
	// du bandeau, dans le coin supérieur droit de l'écran (dessinerDateCoin)
	const z = BANDEAU;
	panneau(z.x, z.y, z.l, z.h);
	cibleGuide('jauges', z.x, z.y, z.l, z.h);
	const aff = jaugesAffichees();
	const mobileMenu = typeof MOBILE !== 'undefined' && MOBILE.actif; // prompt 124 : bouton ≡ (menu) au toucher seulement
	const cy = z.y + z.h / 2;
	const hb = 10;
	const by = cy - hb / 2;
	const lbar = 88;
	let x = z.x + 16;
	['fluidite', 'reputation', 'budget'].forEach((cle) => {
		noStroke();
		textFont(POLICE_TEXTE);
		textAlign(LEFT, CENTER);
		textSize(16);
		fill(C.texte);
		const lib = t('jaugeTitre.' + cle); // prompt 143 : plus de valeur chiffrée, la barre suffit
		text(lib, x, cy);
		const bx = x + textWidth(lib) + 8;
		fill(C.piste);
		rect(bx, by, lbar, hb);
		const va = aff[cle];
		const c = color(va < 20 ? C.rougeFonce : va < 40 ? C.orange : C.vert);
		if (va < 20) c.setAlpha(255 * opaciteCritique());
		fill(c);
		rect(bx, by, (lbar * constrain(va, 0, 100)) / 100, hb);
		fill(255, 255, 255, 170);
		[20, 40].forEach((s) => rect(bx + (lbar * s) / 100 - 1, by - 3, 2, hb + 6)); // seuils réels
		if (dessinerSeuilObjectif(cle, bx, by, lbar, hb) && mouseX >= bx - 4 && mouseX <= bx + lbar + 4 && mouseY >= z.y && mouseY <= z.y + z.h) BANDEAU.survol = texteSeuilObjectif(cle); // prompt 143
		dessinerDeltasJauge(cle, bx, by, lbar, hb);
		x = bx + lbar + 18;
	});
	// Priorités et objectif du jour fusionnés (prompt 144) ; thème du jour et « hors ligne » à la suite
	const o = Jeu.objectifDuJour ? Jeu.objectifDuJour() : null;
	const jc = Jeu.jourCourant ? Jeu.jourCourant() : null;
	const th = typeof Taches !== 'undefined' && jc ? Taches.theme(jc.date) : null; // prompt 88 : thème du jour
	const pj = typeof Taches !== 'undefined' && jc ? Taches.prioritesDuJour(jc.date) : [];
	const morceaux = [pj.length ? t('bandeau.priorites', { liste: pj.map((p) => t('tache.prioCourt.' + p.id, p.vars)).join(' · ') }) : '', o ? t('bandeau.objectifCourt', { libelle: t('jaugeTitre.' + o.jauge).toLowerCase() + ' ≥ ' + seuilObjectif(o.jauge) }) + ' ' + (Jeu.jauges[o.jauge] >= seuilObjectif(o.jauge) ? '✓' : '✗') : '', th && th !== 'ordinaire' ? t('theme.' + th) : '', Jeu.etat && Jeu.etat.horsLigne ? t('jeu.horsLigne') : ''].filter(Boolean);
	const crise = typeof Taches !== 'undefined' && Taches.crise() && !Taches.crise().resultat; // prompt 88 : cellule de crise du jour
	const xt = x;
	const lt = z.x + z.l - 16 - (mobileMenu ? 60 : 0) - (crise ? 266 : 0) - xt;
	const complet = morceaux.join(' · ');
	if (complet && lt > 40) {
		// Prompt 93 : trop long → « … » en fin de mot, la ligne complète au survol
		textFont(POLICE_DONNEES);
		textSize(15);
		const tronque = textWidth(complet) > lt;
		dessinerTexte(complet, xt, cy - 10, lt, { police: POLICE_DONNEES, taille: 15, couleur: C.gris, maxLignes: 1, interligne: 22 });
		if (tronque && mouseX >= xt && mouseX <= xt + lt && mouseY >= z.y && mouseY <= z.y + z.h) BANDEAU.survol = complet;
	}
	if (crise) {
		const actif = Taches.criseActive();
		noStroke();
		fill(actif ? C.primaire : primaireRGBA(0.25)); // prompt 115
		rect(z.x + z.l - 266 - (mobileMenu ? 60 : 0), z.y + 6, 254, 32);
		fill('#FFFFFF');
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textAlign(CENTER, CENTER);
		ajusterTaille(t('crise.bandeau'), 236, 18, 14);
		text(t('crise.bandeau'), z.x + z.l - 139 - (mobileMenu ? 60 : 0), cy);
		textStyle(NORMAL);
	}
	// Prompt 124 : plus de boutons dans le bandeau (Quitter la journée, Aide, Recommencer) — touches Q, H et R
	// inchangées ; à la souris et au toucher, ces actions sont dans le menu (Échap, ou le bouton ≡ en mode mobile)
	if (mobileMenu) bouton(z.x + z.l - 52, z.y, 48, 44, '≡', () => ouvrir('menu'), false, true);
	textAlign(LEFT, TOP);
	dessinerDateCoin();
}
/** Prompt 144 : date du jour et heure du jeu (▶ / ▶▶ / pause), seul endroit de l'écran de jeu qui les affiche —
 * coin supérieur droit, au-dessus de la colonne des équipes ; survol → explication de la vitesse du temps */
function dessinerDateCoin() {
	const z = DATE_COIN;
	panneau(z.x, z.y, z.l, z.h);
	const jc = Jeu.jourCourant ? Jeu.jourCourant() : null;
	const h = heureAffichee();
	const heure = t('temps.' + vitesseTemps()) + ' ' + String(h.h).padStart(2, '0') + ':' + String(h.m).padStart(2, '0'); // prompt 95 : état de la vitesse du temps devant l'heure
	const date = jc ? t('bandeau.dateJour', { date: new Date(jc.date + 'T12:00:00Z').toLocaleDateString(localeActive(), { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }) }) : '';
	noStroke();
	textFont(POLICE_DONNEES);
	textAlign(RIGHT, CENTER);
	fill(C.texte);
	ajusterTaille(heure, 130, 18, 13);
	const lh = textWidth(heure);
	text(heure, z.x + z.l - 14, z.y + z.h / 2);
	textFont(POLICE_TEXTE);
	textAlign(LEFT, CENTER);
	ajusterTaille(date, z.l - 42 - lh, 17, 12);
	text(date, z.x + 14, z.y + z.h / 2);
	textAlign(LEFT, TOP);
	if (mouseX >= z.x && mouseX <= z.x + z.l && mouseY >= z.y && mouseY <= z.y + z.h) (BANDEAU.survol = t('temps.explication')), (BANDEAU.survolX = z.x + z.l);
}

// ——— Bloc 1 : une phrase sur les données réelles ———
function phraseSituation(d) {
	if (d.consequence) return t('chaine.phrase', { heure: d.consequence.heure, ligne: d.consequence.ligne, retard: Jeu.retardEffectif(d) }); // prompt 88 : conséquence de jeu, étiquetée
	const cat = Jeu.categorie(d) || 'autre';
	const ln = d.lignes && d.lignes.length ? Jeu.lignes && Jeu.lignes.lignes.find((x) => x.nom === d.lignes[0]) : null;
	const ligne = d.lignes && d.lignes.length ? d.lignes.join(', ') + (ln && t('mode.' + ln.type) ? ' (' + t('mode.' + ln.type) + ')' : '') : null;
	const re = Jeu.retardEffectif(d);
	if (cat === 'retard') return t(ligne ? 'phrase.retard' : 'phrase.retardSansLigne', { ligne, retard: re !== null ? re : t('carte.nonRenseigne'), heure: Jeu.formaterHeure(d.minute) });
	if (cat === 'accident' || cat === 'travaux') return t('phrase.' + cat, { texte: d.texte_source, ligne: ligne || t('carte.nonRenseigne') });
	if (cat === 'affluence') return t('phrase.affluence', { nom: String(d.texte_source).split(' — ')[0], lieu: String(d.texte_source).split(' — ')[1] || t('carte.nonRenseigne') });
	if (cat === 'meteo') {
		if (d.type === 'alerte météo') return t('phrase.alerteMeteo', { nature: d.nature, valeur: d.valeur || t('carte.nonRenseigne'), heure: d.heure || t('carte.nonRenseigne') });
		const m = Jeu.meteoDuJour(d.date) || {};
		return t('phrase.meteoForte', { pluie: nombreFr(m.pluie_mm), vent: nombreFr(m.rafales_max), texte: d.texte_source });
	}
	return t('phrase.autre', { texte: d.texte_source });
}
// ——— Bloc 2 : au plus 3 puces, seulement celles qui s'appliquent ———
function pucesImportance(d) {
	const p = [];
	const m = Jeu.meteoDuJour(d.date) || {};
	const sit = Jeu.situation(d);
	if (sit.includes('pointe')) p.push(t('puce.pointe'));
	if ((m.pluie_mm || 0) >= 5) p.push(t('puce.pluie', { pluie: nombreFr(m.pluie_mm) }));
	else if ((m.rafales_max || 0) >= 50) p.push(t('puce.vent', { vent: nombreFr(m.rafales_max) }));
	const re = Jeu.retardEffectif(d);
	if (re !== null && d.retard !== null && re > d.retard) p.push(t('puce.aggrave', { reel: d.retard, effectif: re }));
	const ev = Jeu.evenementsAffluence ? Jeu.evenementsAffluence(d.date) : [];
	if (d.type !== 'événement' && ev.length) p.push(t('puce.agenda', { nom: String(ev[0].texte_source).split(' — ')[0] }));
	if (d.lignes && d.lignes.length) {
		const n = (Jeu.evenementsJournee || []).filter((e) => e.ligne && d.lignes.some((l) => String(e.ligne).split(', ').includes(l))).length;
		if (n) p.push(t('puce.historique', { n }));
	}
	if (!p.length) p.push(t('puce.calme'));
	return p.slice(0, 3);
}
// ——— Bloc 3 : certitudes et incertitudes dites clairement ———
function savoirs(d) {
	const out = [];
	if (d.consequence) return [{ sur: true, txt: t('savoir.consequence', { heure: d.consequence.heure }) }, { sur: false, txt: t('savoir.sansDuree') }]; // prompt 88 : jamais présentée comme un fait réel
	const src = /GTFS-RT|temps réel/i.test(String(d.source)) ? 'mesure' : /changelog/i.test(String(d.source)) ? 'changelog' : /agenda/i.test(String(d.source)) ? 'agenda' : /meteo|Open-Meteo/i.test(String(d.source)) ? 'meteo' : 'autre';
	out.push({ sur: true, txt: t('savoir.source.' + src) });
	if (d.contradiction) out.push({ sur: false, txt: t('savoir.contradiction') });
	if (!(d.lignes && d.lignes.length)) out.push({ sur: false, txt: t('savoir.sansLigne') });
	if (d.retard === null || d.retard === undefined) out.push({ sur: false, txt: t('savoir.sansDuree') });
	return out.slice(0, 3);
}

// ——— Panneau du signalement ouvert (phase décision / contradiction) ———
/** Prompt 107 : fenêtre flottante du plaignant — posée sur la carte, du côté opposé au marqueur ; Échap ou la
 * croix la réduisent (le signalement reste ouvert, un clic sur son marqueur la rouvre). */
const DIALOGUE = { reduit: false, index: null };
function positionnerDialogue() {
	const z = typeof ZONE_CARTE !== 'undefined' ? ZONE_CARTE : { x: 184, y: 92, l: 1376, h: 940 };
	const F = typeof FENETRE_DIALOGUE !== 'undefined' ? FENETRE_DIALOGUE : { l: 820, h: 868 };
	if (DIALOGUE.index !== Jeu.index) (DIALOGUE.index = Jeu.index), (DIALOGUE.reduit = false);
	const m = typeof CARTE !== 'undefined' ? CARTE.marqueurs.find((k) => k.courant && k.x !== undefined) : null;
	const aGauche = m ? m.x > z.x + z.l / 2 : false; // marqueur à droite → fenêtre à gauche
	Object.assign(PANNEAU, { x: aGauche ? z.x + 16 : z.x + z.l - F.l - 16, y: z.y + 16, l: F.l, h: F.h });
}
function reduireDialogue() {
	DIALOGUE.reduit = true;
	annoncer(t('dialogue.fermer'));
}
/** Fenêtre réduite : un onglet en bas de la carte pour la rouvrir */
function dessinerOngletDialogue(d) {
	const z = typeof ZONE_CARTE !== 'undefined' ? ZONE_CARTE : PANNEAU;
	const txt = t('enq.signalement.' + d.type) + ' · ' + t('carte.gravite', { g: t('gravite.' + Jeu.gravite(d)) }) + '  ›';
	textFont(DS.policeTexte);
	textSize(20);
	const l = textWidth(txt) + 48;
	const x = z.x + (z.l - l) / 2;
	const y = z.y + z.h - 64;
	dsBouton(x, y, l, 48, txt, () => (DIALOGUE.reduit = false), 'primaire');
}
/** Prompt 107 : contenu de la fenêtre — titre, plaignant, (enquête), répliques adaptées à la situation */
function dessinerPanneauSignalement(d, x, base) {
	const l = base.l - 64;
	let y = base.y + 64;
	const titre = (d.lignes && d.lignes.length ? t('dossier.ligne', { lignes: d.lignes.join(', ') }) : t('enq.signalement.' + d.type)) + ' · ' + t('carte.gravite', { g: t('gravite.' + Jeu.gravite(d)) });
	noStroke();
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	ajusterTaille(titre, l - 60, 28, 20);
	fill(C.texte);
	text(titre, x + 32, y);
	textStyle(NORMAL);
	bouton(x + base.l - 76, base.y + 56, 48, 44, '×', reduireDialogue, false, true);
	textAlign(LEFT, TOP);
	y += 48;
	y = bulleDuPlaignant(d, x + 32, y, l);
	// Répliques : en bas de la fenêtre (prompt 116 : + « Dites-m'en plus » ; prompt 117 : 3 répliques mélangées dont un clash)
	const rs = reponsesDialogue(d);
	// Prompt 130 : une ligne de plus par réplique (tendance des jauges) — sauf sources ouvertes : lignes compactes
	const compact = PLUS.ouvert;
	const hL = compact ? 62 : H_REPONSE;
	const pas = compact ? 70 : PAS_REPONSE;
	const hRep = 44 + rs.length * pas + 70;
	const yr = base.y + base.h - 24 - hRep;
	// Prompt 116 : « En savoir plus » devient la réplique « Dites-m'en plus » (dernière de la liste) ; plus de bouton en double
	if (PLUS.ouvert) corpsEnquete(d, x + 32, y, l, Math.max(120, yr - 16 - y));
	else if (peutPublierDossier(d)) {
		bouton(x + 32, y, Math.min(400, l), 52, '→ ' + t('applis.publier') + ' (B)', () => publierDepuisDossier(d), false, true);
		textAlign(LEFT, TOP);
	}
	if (phase === 'contradiction') return dessinerChoixSource(d, x + 32, yr, l);
	CARTES = []; // prompt 107 : plus de cartes à glisser
	ZONE_DEPOT = null;
	dsTexte(t('dialogue.titre'), x + 32, yr, 18, DS.blanc75, 'left');
	const bloquee = Jeu.actionBloquee ? Jeu.actionBloquee() : null;
	// Prompt 130 : tendance des 3 jauges sous chaque réplique (symbole + couleur, jamais la couleur seule) ;
	// option « Pression visible » : pastille « conseillé » sur la ou les réponses que l'évaluation jugerait bonnes
	const conseillees = typeof Traces !== 'undefined' && Traces.option('pressionVisible') && Jeu.reponsesConseillees ? Jeu.reponsesConseillees(d) : [];
	rs.forEach((r, i) => {
		const ry = yr + 36 + i * pas;
		const off = r.cle === bloquee;
		const survol = !off && mouseX >= x + 32 && mouseX <= x + 32 + l && mouseY >= ry && mouseY <= ry + hL;
		noStroke();
		fill(survol ? DS.blanc15 : DS.blanc05);
		rect(x + 32, ry, l, hL);
		fill(off ? DS.blanc15 : DS.blanc);
		rect(x + 32, ry, 44, hL);
		dsTexte(TOUCHES_REPONSES[i], x + 54, ry + (hL - 26) / 2, 20, DS.fond, 'center');
		const rep = repliquesDuDossier(rs, d)[i];
		dessinerTexte('« ' + rep + ' »', x + 92, ry + 6, l - 76, { taille: 20, couleur: off ? C.gris : C.texte, maxLignes: 2, interligne: 25 });
		if (!compact) dessinerTendanceReponse(r, d, x + 92, ry + 58, !r.clash && conseillees.includes(r.cle)); // sous la réplique
		if (!off) boutons.push({ x: x + 32, y: ry, l, h: hL, action: () => choisirReplique(r) });
		if (i === 0) cibleGuide('actions', x + 32, yr + 36, l, rs.length * pas);
	});
	// « Dites-m'en plus » : pas une décision — ouvre / referme les sources de l'enquête (comme E)
	const py = yr + 36 + rs.length * pas;
	const survolP = mouseX >= x + 32 && mouseX <= x + 32 + l && mouseY >= py && mouseY <= py + 62;
	noStroke();
	fill(survolP ? DS.blanc15 : DS.blanc05);
	rect(x + 32, py, l, 62);
	fill(DS.blanc15);
	rect(x + 32, py, 44, 62);
	dsTexte('E', x + 54, py + 18, 20, DS.blanc, 'center');
	dessinerTexte('« ' + t(PLUS.ouvert ? 'dialogue.plusFerme' : 'dialogue.plus') + ' »', x + 92, py + 6, l - 76, { taille: 20, couleur: C.texte, maxLignes: 1, interligne: 25 });
	dsTexte(t('dialogue.plusAide'), x + 92, py + 34, 16, DS.blanc50, 'left');
	boutons.push({ x: x + 32, y: py, l, h: 62, action: basculerPlus });
	cibleGuide('sources', x + 32, py, l, 62);
}
/** Prompt 116 : les répliques d'un dossier, le pseudo du plaignant cité une seule fois */
function repliquesDuDossier(rs, d) {
	let cite = false;
	return rs.map((r) => {
		const txt = repliqueDe(r, d, cite);
		if (!cite && /@\w/.test(txt)) cite = true;
		return txt;
	});
}
/** Prompt 116 : une des trois variantes de la réplique, choisie de façon déterministe (dossier + réponse), parmi
 * celles dont toutes les variables sont connues pour ce dossier ; repli : réplique unique (prompt 107), puis libellé */
function repliqueDe(r, d, sansAuteur) {
	const vars = Object.assign({}, Jeu.variablesReplique ? Jeu.variablesReplique(Jeu.index) : {});
	if (sansAuteur) delete vars.auteur; // le pseudo n'est cité qu'une fois par dossier
	const ok = [];
	const prefixe = r.clash ? 'clash.' + (Jeu.categorie(d) || 'autre') : 'repl.' + r.cle; // prompt 117
	for (let k = 1; k <= 3; k++) {
		const cle = prefixe + '.' + k;
		if (TRADUCTIONS.fr[cle] === undefined) continue;
		const brut = String(t(cle));
		if ((brut.match(/\{(\w+)\}/g) || []).every((m) => vars[m.slice(1, -1)] !== undefined && vars[m.slice(1, -1)] !== '')) ok.push(brut);
	}
	if (!ok.length) return sansAuteur ? (r.clash ? t('clash.autre.1') : tSi('repl.' + r.cle, String(r.lib))) : repliqueDe(r, d, true);
	let h = Jeu.index * 7;
	for (const c of String(r.cle) + (r.clash ? '!' : '')) h = (h * 31 + c.charCodeAt(0)) % 1000003;
	return ok[h % ok.length].replace(/\{(\w+)\}/g, (m, k) => String(vars[k]));
}
/** Prompt 130 : hauteur d'une ligne de réponse (2 lignes de réplique + la tendance) et pas entre deux lignes */
const H_REPONSE = 84;
const PAS_REPONSE = 92;
/** Prompt 130 : tendance d'une réplique sur les 3 jauges — « Flu. ▲ » en vert, « ≈ » en gris, « ▼ » en orange ; le
 * symbole porte le sens, la couleur le double. Le clash (prompt 117) compte son malus de réputation : la tendance
 * reste honnête. Pastille « conseillé » en option (Pression visible). */
function dessinerTendanceReponse(r, d, x, y, conseillee) {
	const e = Jeu.effetsAttendus(r.cle, d).slice();
	if (r.clash) e[1] += Jeu.REGLAGES.malusClash || 0;
	let xx = x;
	['fluidite', 'reputation', 'budget'].forEach((k, j) => {
		const sym = tendance(e[j]);
		const lib = t('jaugeCourt.' + k);
		dsTexte(lib, xx, y, 16, C.gris, 'left');
		xx += textWidth(lib) + 6;
		dsTexte(sym, xx, y, 16, sym === '≈' ? C.gris : sym.includes('▲') ? C.vert : C.orange, 'left');
		xx += textWidth(sym) + 18;
	});
	if (conseillee) dsTexte('✓ ' + t('rep.conseillee'), xx + 8, y, 16, C.vert, 'left');
	zoneTexteDeclarer('tendanceReponse', x, y, xx - x, 22); // prompt 93 : audit des textes
}
/** Prompt 102 : bulle de dialogue — la plainte écrite par le groupe (data/messages.json) que les faits réels du
 * dossier déclenchent (Jeu.plaignantPour, sans effet de bord), sinon la source réelle ; dessous, le fait réel. */
function bulleDuPlaignant(d, x, y, l) {
	const pl = Jeu.plaignantPour ? Jeu.plaignantPour(Jeu.index) : null;
	const auteur = pl ? pl.auteur : t('plaignant.source', { source: d.source || t('carte.nonRenseigne') });
	const texte = pl ? String(pl.texte) : String(d.texte_source || phraseSituation(d));
	const lt = l - 84;
	const lignes = typeof couperLignes === 'function' ? couperLignes(texte, lt - 32, DS.policeTexte, 20).length : 2;
	const hb = 52 + lignes * 28 + 12;
	noStroke();
	if (pl && typeof avatarUsager === 'function') avatarUsager(pl.auteur, x, y + 6, 56);
	else {
		fill(DS.blanc15);
		rect(x, y + 6, 56, 56);
		fill(DS.blanc75);
		rect(x + 20, y + 18, 16, 4);
		rect(x + 20, y + 28, 16, 4);
		rect(x + 20, y + 38, 10, 4);
	}
	fill(DS.blanc05);
	rect(x + 76, y, lt + 8, hb);
	if (pl && pl.ton === 'agressif') {
		fill(DS.alerte); // prompt 118 : ton agressif voulu — liseré d'alerte
		rect(x + 76, y, 4, hb);
	}
	triangle(x + 76, y + 22, x + 66, y + 30, x + 76, y + 38); // pointe de la bulle vers l'avatar
	dsTexte(couperLargeurCarte(auteur, lt - 24, 16), x + 94, y + 14, 16, DS.blanc50, 'left');
	dsTexte(texte, x + 94, y + 42, 20, DS.blanc, 'left', lt - 32);
	if (PC.etat === 'appli' && BULLE.dossier !== d) {
		BULLE.dossier = d;
		annoncer(t('plaignant.annonce', { auteur, texte: lireMasques(texte) })); // prompt 118 : « mot masqué » à la place des symboles
	}
	let yy = y + hb + 10;
	if (d.fictif) {
		noStroke();
		fill(DS.alerte);
		rect(x, yy + 2, 4, 22);
		dsTexte(t('fictif.badge'), x + 14, yy, 16, DS.alerteClair, 'left'); // prompt 119 : un incident inventé est toujours signalé comme tel
		yy += 34;
	}
	if (pl) {
		dsTexte(couperLargeurCarte(String(phraseSituation(d)), l, 16), x, yy, 16, DS.blanc50, 'left');
		yy += 28;
	}
	return yy + 12;
}
const BULLE = { dossier: null };
/** Prompt 118 : pour la synthèse vocale, un mot masqué par des symboles (&#@!%$) est lu « mot masqué » */
function lireMasques(txt) {
	return String(txt).replace(/[\wÀ-ÿ]*[@#$%&!]{2,}[\wÀ-ÿ]*/g, t('plaignant.motMasque'));
}
function bloc(titre, lignes, x, y, l, couleur) {
	noStroke();
	textFont(POLICE_DONNEES);
	textStyle(BOLD);
	textSize(16);
	fill(couleur);
	text(titre.toUpperCase(), x, y);
	textStyle(NORMAL);
	textFont(POLICE_TEXTE);
	textSize(20);
	textLeading(27);
	fill(C.texte);
	let yy = y + 26;
	lignes.forEach((ln) => {
		const n = Math.max(1, Math.ceil((textWidth(String(ln)) * 1.06) / l));
		text(String(ln), x, yy, l, n * 27 + 4);
		yy += n * 27 + 2;
	});
	return yy + 14;
}
function basculerPlus() {
	PLUS.ouvert = !PLUS.ouvert;
	Confort.Son.clic();
	annoncer(t(PLUS.ouvert ? 'plus.ouvert' : 'plus.ferme'));
}
/** Contradiction (Q9, Q31) : l'incertitude est dite clairement ; choisir d'abord la source à croire */
function dessinerChoixSource(d, x, y, l) {
	const c = d.contradiction;
	noStroke();
	fill(C.orange);
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(20);
	text(t('savoir.contradiction'), x, y, l, 56);
	textStyle(NORMAL);
	[['A', c.a.libelle, 'a'], ['B', c.b.libelle, 'b']].forEach(([k, lib, cle], i) => bouton(x, y + 70 + i * 90, l, 76, k + '  ' + lib, () => choisirSource(cle), false, true));
	textAlign(LEFT, TOP);
}

// ——— Cartes de réponse : libellé, explication, tendance des effets, coût, équipe liée ———
const TOUCHES_REPONSES = ['1', '2', '3']; // prompt 117 : trois répliques
function reponsesAffichees(d) {
	const cat = Jeu.categorie(d);
	const rs = Jeu.reponsesDe(d);
	if (rs) return rs.map((r) => ({ cle: cat + '.' + r.id, lib: t('rep.' + cat + '.' + r.id), expl: t('repx.' + cat + '.' + r.id), equipe: r.equipe || null }));
	// Repli (dossier sans catégorie) : la table Q57–Q60 et ses descriptions en langage métier (prompt 74)
	return ['devier', 'retenir', 'renfort', 'rien'].map((a) => ({ cle: a, lib: t('action.' + a), expl: t('action.desc.' + a), equipe: null }));
}
/** Prompt 117 : les trois répliques du dialogue — la meilleure réponse, une autre réponse de la catégorie, et le clash
 * (réponse « attendre » + malus de réputation, game.js) — dans un ordre mélangé, déterministe pour le dossier */
const PERMUTATIONS_3 = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
function reponsesDialogue(d) {
	const tout = reponsesAffichees(d);
	if (!tout.length) return [];
	const idx = Math.max(0, Jeu.paquet ? Jeu.paquet.indexOf(d) : 0);
	const best = Jeu.meilleureReponse ? Jeu.meilleureReponse(d) : tout[0].cle;
	const a = tout.find((r) => r.cle === best) || tout[0];
	const rien = (r) => Jeu.familleDe(r.cle) === 'rien';
	let autres = tout.filter((r) => r !== a && !rien(r));
	if (!autres.length) autres = tout.filter((r) => r !== a);
	const b = autres[(idx * 3) % autres.length];
	const attendre = tout.find(rien) || tout[tout.length - 1];
	const c = Object.assign({}, attendre, { clash: true });
	const trio = [a, b, c];
	return PERMUTATIONS_3[(idx * 5 + 2) % 6].map((k) => trio[k]);
}
/** Choisir une réplique (clic ou touche) : le clash est signalé au moteur juste avant la décision */
function choisirReplique(r) {
	Jeu.clashSuivant = !!r.clash;
	decider(r.cle);
	Jeu.clashSuivant = false;
}
/** Tendance honnête d'un effet attendu : signe et ordre de grandeur */
function tendance(v) {
	if (Math.abs(v) < 1.5) return '≈';
	if (v >= 8) return '▲▲';
	if (v > 0) return '▲';
	if (v <= -8) return '▼▼';
	return '▼';
}
function dessinerCartesReponses(d, x, y, l, h) {
	const rs = reponsesAffichees(d);
	const lc = (l - 16) / 2;
	const hc = (h - 16) / 2;
	const bloquee = Jeu.actionBloquee ? Jeu.actionBloquee() : null;
	CARTES = []; // prompt 94 : rectangles des cartes, pour le glisser-déposer (glisser.js)
	rs.forEach((r, i) => {
		const cx = x + (i % 2) * (lc + 16);
		const cy = y + Math.floor(i / 2) * (hc + 16);
		if (r.cle !== bloquee) CARTES.push({ cle: r.cle, x: cx, y: cy, l: lc, h: hc, lib: String(r.lib), touche: TOUCHES_REPONSES[i] });
		if (carteSaisie(r.cle)) return emplacementCarte({ x: cx, y: cy, l: lc, h: hc }); // la carte flotte : son emplacement en pointillés
		// Prompt 96 : les cartes arrivent en pop (1,15 → 1, ease-out-back, décalées de 50 ms) ; exactement 1 ensuite
		const sp = typeof Juice !== 'undefined' ? Juice.pop(arriveeDossier + 250 + i * 50, millis()) : 1;
		push();
		if (sp !== 1) translate(cx + lc / 2, cy + hc / 2), scale(sp), translate(-(cx + lc / 2), -(cy + hc / 2));
		const survol = mouseX >= cx && mouseX <= cx + lc && mouseY >= cy && mouseY <= cy + hc;
		noStroke();
		fill(survol ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)');
		rect(cx, cy, lc, hc);
		stroke(survol ? '#FFFFFF' : C.bord);
		strokeWeight(2);
		noFill();
		rect(cx + 1, cy + 1, lc - 2, hc - 2);
		noStroke();
		zoneTexteDeclarer('carteReponse', cx, cy, lc, hc); // prompt 93
		fill(C.primaire);
		rect(cx, cy, 44, 40);
		textAlign(CENTER, CENTER);
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textSize(20);
		fill('#FFFFFF');
		text(TOUCHES_REPONSES[i], cx + 22, cy + 20);
		textAlign(LEFT, TOP);
		ajusterTaille(String(r.lib), lc - 70, 20, 16);
		text(String(r.lib), cx + 56, cy + 9);
		textStyle(NORMAL);
		textFont(POLICE_DONNEES);
		textSize(16);
		textLeading(21);
		fill(C.gris);
		textLeading(24);
		text(String(r.expl), cx + 14, cy + 46, lc - 28, hc - 90); // l'explication entière (2 à 3 lignes)
		// Tendance dans le contexte réel du dossier (Jeu.effetsAttendus : même calcul que l'évaluation)
		const e = Jeu.effetsAttendus(r.cle, d);
		const tend = ['fluidite', 'reputation', 'budget'].map((k, j) => t('jaugeCourt.' + k) + ' ' + tendance(e[j])).join('  ');
		fill(C.texte);
		text(tend, cx + 14, cy + hc - 32);
		if (r.equipe && Jeu.elementDebloque('equipes')) {
			const dispo = Jeu.equipesDisponibles(r.equipe, (typeof tempsEquipes === 'function' ? tempsEquipes() : millis()));
			fill(dispo ? C.vert : C.orange);
			textAlign(RIGHT, TOP);
			text(t('rep.equipe', { nom: String(Jeu.EQUIPES[r.equipe].nom), n: dispo, maj: Jeu.TYPES_EQUIPES.indexOf(r.equipe) + 1 }), cx + lc - 14, cy + hc - 32);
			textAlign(LEFT, TOP);
		}
		pop();
		if (r.cle !== bloquee) boutons.push({ x: cx, y: cy, l: lc, h: hc, action: () => decider(r.cle) });
	});
	cibleGuide('actions', x, y, l, h); // prompt 37
}
/** Clavier : 1 à 4 = réponse de la carte (dans l'ordre affiché) ; E = « En savoir plus » ; true si la touche est prise */
function toucheReponses() {
	if (phase !== 'decision') return false;
	if (key === 'e' || key === 'E') return basculerPlus(), true;
	const i = TOUCHES_REPONSES.indexOf(key);
	const d = Jeu.dossierCourant();
	if (i < 0 || !d) return false;
	const r = reponsesDialogue(d)[i]; // prompt 117 : les 3 répliques affichées, dans leur ordre
	if (r) choisirReplique(r);
	return !!r;
}

// ——— Retour après décision : ce qui s'est passé, et pourquoi (la meilleure réponse si la vôtre l'était moins) ———
const RAISONS = { meteo: 'raison.meteo', forte: 'raison.forte', pointe: 'raison.pointe', long: 'raison.long', calme: 'raison.calme' };
function explicationDecision(r) {
	const e = (Jeu.evenementsJournee || []).filter((x) => x.resultat === r)[0];
	if (!e) return [];
	const effets = ['fluidite', 'reputation', 'budget'].filter((k, i) => r.deltas[i]).map((k, i) => t('jaugeTitre.' + k) + ' ' + (r.deltas[['fluidite', 'reputation', 'budget'].indexOf(k)] > 0 ? '+' : '') + r.deltas[['fluidite', 'reputation', 'budget'].indexOf(k)]);
	const lignes = [t('retour.passe', { action: String(e.action || t('action.temps')), effets: effets.join(', ') || t('narr.aucunEffet') }) + (e.retardEffectif !== null && e.retardEffectif !== undefined ? ' ' + t('trace.retardFige', { retard: e.retardEffectif }) : '')]; // prompt 89 bis : retard retenu au moment du choix
	const des = typeof Traces !== 'undefined' && Traces.option('deVisible') ? Traces.texteDes(r) : null; // option : le dé réellement tiré
	if (des) lignes.push(des);
	const sit = e.categorie ? Jeu.situation(r.dossier) : null;
	let pourquoi = sit ? sit.split('+').map((s) => t(RAISONS[s] || 'raison.calme')).join(', ') : '';
	// Prompt 130 : le conseil suit aussi la jauge en manque — le dire quand elle est basse (sous 45)
	if (e.jaugeBasse && e.valeurBasse !== undefined && e.valeurBasse < 45) pourquoi = t('raison.besoin', { jauge: t('jaugeTitre.' + e.jaugeBasse), v: e.valeurBasse }) + (pourquoi ? ', ' + pourquoi : '');
	const ev = Jeu.evaluer(e);
	if (ev === 'bon') lignes.push(t('retour.bon', { pourquoi: pourquoi || t('raison.calme') }));
	else if (e.cleAction === 'temps') lignes.push(t('retour.tard', { meilleure: String(e.meilleureAction) }));
	else lignes.push(t('retour.mieux', { meilleure: String(e.meilleureAction), pourquoi: pourquoi || t('raison.calme') }));
	return lignes;
}

// ——— Prompt 91 § 3 : du dossier vers Community (brouillon des faits), Échap revient au dossier ———
function peutPublierDossier(d) {
	const cat = d && Jeu.categorie(d);
	return !!cat && cat !== 'affluence' && (typeof appliDebloquee !== 'function' || appliDebloquee('community')) && !(Jeu.postsJoueur || []).some((p) => p.index === Jeu.paquet.indexOf(d));
}
function publierDepuisDossier(d) {
	const index = Jeu.paquet.indexOf(d);
	if (!peutPublierDossier(d)) return;
	redirigerVers('community', () => {
		COMMU.onglet = 'fil';
		COMMU.defil = 0;
		COMMU.brouillon = { index };
	});
}
