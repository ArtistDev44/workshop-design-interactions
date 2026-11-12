/* Nantes en régulation — prompt 87 : un écran principal simplifié, des informations claires, des réponses par problème.
 * Deux colonnes (liste à gauche, panneau du signalement ouvert à droite) sous un bandeau fin (jauges, objectif,
 * équipes, horloge). Panneau en 3 blocs : « Ce qui se passe » (1 phrase), « Pourquoi c'est important » (≤ 3 puces),
 * « Ce que vous savez — et ne savez pas » ; le détail (sources, historique, équipes) derrière « En savoir plus ».
 * Réponses : 3 ou 4 cartes propres à la catégorie du problème (data/reponses.json), chacune avec son explication
 * et la TENDANCE honnête de ses effets dans le contexte réel (signe et ordre de grandeur, pas la valeur exacte).
 * Rien n'est inventé : chaque phrase est construite sur les champs réels ; absent → « non renseigné ».
 */
const BANDEAU = { x: 40, y: 36, l: 1840, h: 84 };
const PANNEAU = { x: 756, y: 132, l: 1124, h: 900 };
const PLUS = { ouvert: false };

// ——— Bandeau fin : jauges (ligne 1), objectif · équipes · horloge (ligne 2), Aide et Recommencer à droite ———
function dessinerBandeau() {
	const z = BANDEAU;
	panneau(z.x, z.y, z.l, z.h);
	cibleGuide('jauges', z.x, z.y, z.l, z.h);
	const jauges = Jeu.jauges || { fluidite: 50, reputation: 50, budget: 50 };
	const aff = jaugesAffichees();
	const lb = 370; // trois jauges, puis Quitter la journée, Aide et Recommencer à droite (prompt 94 : 420 → 370)
	['fluidite', 'reputation', 'budget'].forEach((cle, i) => {
		const x = z.x + 16 + i * (lb + 24);
		noStroke();
		textFont(POLICE_TEXTE);
		textAlign(LEFT, TOP);
		textSize(18);
		fill(C.texte);
		text(t('jaugeTitre.' + cle) + ' ' + Math.round(jauges[cle]), x, z.y + 8);
		const bx = x + 230;
		const bl = lb - 230;
		fill(C.piste);
		rect(bx, z.y + 14, bl, 16);
		const va = aff[cle];
		const c = color(va < 20 ? C.rougeFonce : va < 40 ? C.orange : C.vert);
		if (va < 20) c.setAlpha(255 * opaciteCritique());
		fill(c);
		rect(bx, z.y + 14, (bl * constrain(va, 0, 100)) / 100, 16);
		fill(255, 255, 255, 170);
		[20, 40].forEach((s) => rect(bx + (bl * s) / 100 - 1, z.y + 10, 2, 24)); // seuils réels
		dessinerDeltasJauge(cle, bx, z.y + 14, bl);
	});
	// Ligne 2 : objectif du jour, équipes disponibles, date et heure du jeu
	const o = Jeu.objectifDuJour ? Jeu.objectifDuJour() : null;
	// Prompt 118 : la disponibilité des équipes n'est plus répétée ici (elle est dans le panneau Équipes, à droite)
	const h = heureAffichee();
	const th = typeof Taches !== 'undefined' && Jeu.jourCourant() ? Taches.theme(Jeu.jourCourant().date) : null; // prompt 88 : thème du jour
	const pj = typeof Taches !== 'undefined' && Jeu.jourCourant() ? Taches.prioritesDuJour(Jeu.jourCourant().date) : [];
	const gr = pj.length ? t('bandeau.priorites', { liste: pj.map((p) => t('tache.prioCourt.' + p.id, p.vars)).join(' · ') }) : ''; // prompt 91 § 4 : priorités imposées (le grade reste dans Indicateurs)
	const morceaux = [gr, th && th !== 'ordinaire' ? t('theme.' + th) : '', o ? t('bandeau.objectifCourt', { libelle: String(o.libelle), v: Math.round(Jeu.jauges[o.jauge]) }) : '', t('temps.' + vitesseTemps()) + ' ' + String(h.h).padStart(2, '0') + ':' + String(h.m).padStart(2, '0') + (Jeu.etat.horsLigne ? ' · ' + t('jeu.horsLigne') : '')].filter(Boolean); // prompt 95 : état de la vitesse du temps devant l'heure
	textFont(POLICE_DONNEES);
	textSize(16);
	fill(C.gris);
	textAlign(LEFT, TOP);
	const crise = typeof Taches !== 'undefined' && Taches.crise() && !Taches.crise().resultat; // prompt 88 : cellule de crise du jour
	// Prompt 93 : la ligne coupait l'heure quand elle était trop longue (texte en boîte, 2e ligne masquée) → l'heure
	// reste entière à droite, le début se termine par « … » en fin de mot, la ligne complète s'affiche au survol
	const lbandeau = z.l - (crise ? 940 : 670); // prompt 94 : place du bouton « Quitter la journée »
	const complet = morceaux.join('  ·  ');
	const heureBandeau = morceaux[morceaux.length - 1];
	if (textWidth(complet) <= lbandeau) {
		text(complet, z.x + 16, z.y + 48);
		const xh = z.x + 16 + textWidth(complet) - textWidth(heureBandeau);
		if (mouseX >= xh && mouseX <= xh + textWidth(heureBandeau) && mouseY >= z.y + 44 && mouseY <= z.y + 72) BANDEAU.survol = t('temps.explication'); // prompt 95
	} else {
		const heure = morceaux[morceaux.length - 1];
		const lh = textWidth(heure);
		textAlign(RIGHT, TOP);
		text(heure, z.x + 16 + lbandeau, z.y + 48);
		textAlign(LEFT, TOP);
		dessinerTexte(morceaux.slice(0, -1).join('  ·  ') + '  ·', z.x + 16, z.y + 48 - 3, lbandeau - lh - 12, { police: POLICE_DONNEES, taille: 16, couleur: C.gris, maxLignes: 1, interligne: 22 });
		if (mouseX >= z.x + 16 && mouseX <= z.x + 16 + lbandeau && mouseY >= z.y + 44 && mouseY <= z.y + 72) BANDEAU.survol = mouseX >= z.x + 16 + lbandeau - lh ? t('temps.explication') : complet; // prompt 95 : l'heure explique la vitesse du temps
	}
	if (crise) {
		const actif = Taches.criseActive();
		noStroke();
		fill(actif ? C.primaire : 'rgba(212,3,28,0.25)');
		rect(z.x + z.l - 920, z.y + 42, 254, 32);
		fill('#FFFFFF');
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textAlign(CENTER, CENTER);
		ajusterTaille(t('crise.bandeau'), 236, 18, 14);
		text(t('crise.bandeau'), z.x + z.l - 793, z.y + 58);
		textStyle(NORMAL);
		textAlign(LEFT, TOP);
	}
	// Aide et Recommencer (souris / tactile) — équivalents des touches H et R
	bouton(z.x + z.l - 648, z.y + 14, 280, 56, t('quitter.bouton'), quitterJourneeRapide, false, true); // prompt 94 : toujours visible, touche Q ; prompt 118 : secondaire (le rouge plein reste à l'urgence)
	bouton(z.x + z.l - 358, z.y + 14, 128, 56, t('accueil.aide'), () => ouvrir('aide'), false, true);
	bouton(z.x + z.l - 220, z.y + 14, 206, 56, // prompt 98 : boutons du bandeau 48 → 56 px (≈ 45 px à l'écran)
		 t('jeu.recommencer'), () => ouvrir('reset'), false, true);
	textAlign(LEFT, TOP);
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
	const z = typeof ZONE_CARTE !== 'undefined' ? ZONE_CARTE : { x: 184, y: 132, l: 1376, h: 900 };
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
	// Répliques : en bas de la fenêtre
	const rs = reponsesAffichees(d);
	const hRep = 44 + rs.length * PAS_REPONSE; // prompt 115 : une ligne de plus par réponse (tendance)
	const yr = base.y + base.h - 24 - hRep;
	if (PLUS.ouvert) {
		bouton(x + 32, y, 320, 52, t('plus.fermer'), basculerPlus, false, true);
		textAlign(LEFT, TOP);
		corpsEnquete(d, x + 32, y + 60, l, Math.max(120, yr - 16 - (y + 60)));
	} else {
		bouton(x + 32, y, 320, 52, t('plus.ouvrir'), basculerPlus, false, true);
		textAlign(LEFT, TOP);
		cibleGuide('sources', x + 32, y, 320, 52);
		if (peutPublierDossier(d)) bouton(x + 372, y, Math.min(400, l - 340), 52, '→ ' + t('applis.publier') + ' (B)', () => publierDepuisDossier(d), false, true);
		textAlign(LEFT, TOP);
	}
	if (phase === 'contradiction') return dessinerChoixSource(d, x + 32, yr, l);
	CARTES = []; // prompt 107 : plus de cartes à glisser
	ZONE_DEPOT = null;
	dsTexte(t('dialogue.titre'), x + 32, yr, 18, DS.blanc75, 'left');
	const bloquee = Jeu.actionBloquee ? Jeu.actionBloquee() : null;
	// Prompt 115 : tendance des 3 jauges à droite de chaque réplique (symbole + couleur, jamais la couleur seule) ;
	// option « Pression visible » : pastille « conseillé » sur la ou les réponses que l'évaluation jugerait bonnes
	const conseillees = typeof Traces !== 'undefined' && Traces.option('pressionVisible') && Jeu.reponsesConseillees ? Jeu.reponsesConseillees(d) : [];
	rs.forEach((r, i) => {
		const ry = yr + 36 + i * PAS_REPONSE;
		const off = r.cle === bloquee;
		const survol = !off && mouseX >= x + 32 && mouseX <= x + 32 + l && mouseY >= ry && mouseY <= ry + H_REPONSE;
		noStroke();
		fill(survol ? DS.blanc15 : DS.blanc05);
		rect(x + 32, ry, l, H_REPONSE);
		fill(off ? DS.blanc15 : DS.blanc);
		rect(x + 32, ry, 44, H_REPONSE);
		dsTexte(TOUCHES_REPONSES[i], x + 54, ry + 29, 20, DS.fond, 'center');
		const rep = tSi('repl.' + r.cle, String(r.lib));
		dessinerTexte('« ' + rep + ' »', x + 92, ry + 6, l - 76, { taille: 20, couleur: off ? C.gris : C.texte, maxLignes: 2, interligne: 25 });
		dessinerTendanceReponse(r.cle, d, x + 92, ry + 58, conseillees.includes(r.cle)); // sous la réplique
		if (!off) boutons.push({ x: x + 32, y: ry, l, h: H_REPONSE, action: () => decider(r.cle) });
		if (i === 0) cibleGuide('actions', x + 32, yr + 36, l, rs.length * PAS_REPONSE);
	});
}
/** Prompt 115 : tendance d'une réponse sur les 3 jauges — « Flu. ▲ » en vert, « ≈ » en gris, « ▼ » en orange ; le
 * symbole porte le sens, la couleur le double. Pastille « conseillé » en option (Pression visible). */
/** Prompt 115 : hauteur d'une ligne de réponse (2 lignes de réplique + la tendance) et pas entre deux lignes */
const H_REPONSE = 84;
const PAS_REPONSE = 92;
function dessinerTendanceReponse(cle, d, x, y, conseillee) {
	const e = Jeu.effetsAttendus(cle, d);
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
	triangle(x + 76, y + 22, x + 66, y + 30, x + 76, y + 38); // pointe de la bulle vers l'avatar
	dsTexte(couperLargeurCarte(auteur, lt - 24, 16), x + 94, y + 14, 16, DS.blanc50, 'left');
	dsTexte(texte, x + 94, y + 42, 20, DS.blanc, 'left', lt - 32);
	if (PC.etat === 'appli' && BULLE.dossier !== d) {
		BULLE.dossier = d;
		annoncer(t('plaignant.annonce', { auteur, texte }));
	}
	let yy = y + hb + 10;
	if (pl) {
		dsTexte(couperLargeurCarte(String(phraseSituation(d)), l, 16), x, yy, 16, DS.blanc50, 'left');
		yy += 28;
	}
	return yy + 12;
}
const BULLE = { dossier: null };
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
const TOUCHES_REPONSES = ['1', '2', '3', '4'];
function reponsesAffichees(d) {
	const cat = Jeu.categorie(d);
	const rs = Jeu.reponsesDe(d);
	if (rs) return rs.map((r) => ({ cle: cat + '.' + r.id, lib: t('rep.' + cat + '.' + r.id), expl: t('repx.' + cat + '.' + r.id), equipe: r.equipe || null }));
	// Repli (dossier sans catégorie) : la table Q57–Q60 et ses descriptions en langage métier (prompt 74)
	return ['devier', 'retenir', 'renfort', 'rien'].map((a) => ({ cle: a, lib: t('action.' + a), expl: t('action.desc.' + a), equipe: null }));
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
	const r = reponsesAffichees(d)[i];
	if (r) decider(r.cle);
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
	// Prompt 115 : le conseil suit aussi la jauge en manque — le dire quand elle est basse (sous 45)
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
