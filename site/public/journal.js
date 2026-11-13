/* Nantes en régulation — prompt 89 : l'appli « Journal » devient un tableau de bord de la journée (design system).
 * Pastilles des journées, tuiles de résumé, filtres, frise horaire de cartes (prompt 140 : vue Semaine supprimée),
 * enquête en fiche (citation, puces de contexte, dés pixel, barres des effets attendus, suites).
 * Données : journal-donnees.js (recalculées, jamais inventées). Remplace appJournal / enqueteJournal d'os.js.
 * Clavier : ← → jours (ou volets dans l'enquête, 1 à 4 aussi) · ↑ ↓ cartes · Entrée enquêter · Échap retour ·
 * Tab zone suivante (prompts 140 / 142 : touches S et K retirées ; prompt 186 : V et C retirés — plus de pli
 * « Détails » ni de « Copier le résumé du jour », filtres en contrôle segmenté du DS).
 */
const JOURNAL = { jour: null, enquete: null, volet: 0, filtre: 'tout', survol: -1, defil: 0, defilMax: 0, focus: 0, zone: 0, ouvertA: 0, voletA: 0, dernierAnnonce: '' };
const VOLETS_ENQUETE = ['passe', 'contexte', 'decision', 'suites'];
const ZONES_JOURNAL = ['jours', 'filtres', 'frise'];
const HAUTEURS_CARTES = { signalement: 116, equipe: 52, plainte: 64, patron: 52, crise: 52 };

const animJ = (debut, duree, retard) => (reduireAnimations ? 1 : constrain((millis() - debut - (retard || 0)) / duree, 0, 1));
const nomJour = (i) => t('journal.pastille', { n: i + 1 });
const sgn = (v) => (v > 0 ? '+' + v : v < 0 ? '−' + Math.abs(v) : '0');
const nonRenseigne = () => t('carte.nonRenseigne');

function choisirJourJournal(i) {
	const n = Math.min(Jeu.jourIndex, (Jeu.jours || []).length - 1);
	i = constrain(i, 0, n);
	if (i === JOURNAL.jour) return;
	JOURNAL.jour = i;
	JOURNAL.enquete = null;
	JOURNAL.defil = 0;
	JOURNAL.focus = 0;
	JOURNAL.ouvertA = millis();
	Confort.Son.clic();
	annoncerJourJournal();
}
function annoncerJourJournal() {
	const tu = JournalDonnees.tuiles(JOURNAL.jour);
	if (!tu) return;
	annoncer(t('journal.annonceJour', { jour: nomJour(JOURNAL.jour), date: dateLongue(tu.date), traites: tu.signalements.traites, recus: tu.signalements.recus, bons: tu.bonnes.n, total: tu.bonnes.total }));
}
function choisirFiltreJournal(f) {
	JOURNAL.filtre = f;
	JOURNAL.defil = 0;
	JOURNAL.focus = 0;
	Confort.Son.clic();
	const F = JournalDonnees.FILTRES;
	annoncer(dsAnnonceSegment(t('journal.filtres'), F.indexOf(f), F.length, libelleFiltreJournal(f))); // prompt 186 : « Filtre n sur N : … »
}
const libelleFiltreJournal = (f) => t('journal.filtreNb', { nom: t('journal.filtre.' + f), n: JournalDonnees.compteurs(JOURNAL.jour)[f] });
function ouvrirEnqueteJournal(e) {
	JOURNAL.citationOuverte = false; // prompt 92
	const ev = (Jeu.evenementsJournee || []).filter((x) => x.jour === e.jour);
	JOURNAL.enquete = ev.indexOf(e);
	JOURNAL.volet = 0;
	JOURNAL.voletA = millis();
	Confort.Son.clic();
	annoncerVoletJournal(e);
}
function annoncerVoletJournal(e) {
	const f = JournalDonnees.enquete(e);
	const v = VOLETS_ENQUETE[JOURNAL.volet];
	const resume = v === 'passe' ? f.faits.citation || nonRenseigne() : v === 'contexte' ? (f.contexte.pointe ? t('journal.pointe.oui') : t('journal.pointe.non')) : v === 'decision' ? t('journal.evaluation', { eval: t('eval.' + f.eval) }) : t('journal.suitesResume', { p: f.suites.plaintes.length, e: f.suites.equipes.length });
	annoncer(t('journal.volet.' + v) + '. ' + resume);
}
function choisirVoletJournal(i) {
	JOURNAL.volet = (i + VOLETS_ENQUETE.length) % VOLETS_ENQUETE.length;
	JOURNAL.voletA = millis();
	Confort.Son.clic();
	const e = enqueteCourante();
	if (e) annoncerVoletJournal(e);
}
function enqueteCourante() {
	const j = (Jeu.jours || [])[JOURNAL.jour];
	if (!j || JOURNAL.enquete === null) return null;
	return (Jeu.evenementsJournee || []).filter((x) => x.jour === j.date)[JOURNAL.enquete] || null;
}

// ——— Point d'entrée (fenêtre d'appli d'os.js) ———
function appJournal(z) {
	if (JOURNAL.jour === null || JOURNAL.jour > Jeu.jourIndex) JOURNAL.jour = Jeu.jourIndex;
	const e = enqueteCourante();
	if (e) return ficheEnquete(z, e);
	JOURNAL.enquete = null;
	barreJours(z);
	vueJour(z); // prompt 140 : la vue Jour est la seule vue
}

// ——— 1. Barre des journées ———
function barreJours(z) {
	const jours = Jeu.jours || [];
	const lp = Math.min(118, (z.l - 20) / Math.max(1, jours.length) - 8); // prompt 140 : plus de sélecteur Jour / Semaine à droite
	jours.forEach((_, i) => {
		const x = z.x + i * (lp + 8);
		const etat = JournalDonnees.etatJour(i);
		const actif = i === JOURNAL.jour;
		const futur = etat === 'futur';
		noStroke();
		fill(actif ? DS.primaire : futur ? DS.blanc05 : DS.fond);
		rect(x, z.y - 6, lp, 44); // prompt 139 : plus de date JJ/MM sous « J1 » (redondant), 52 → 44 px
		if (!actif) {
			stroke(futur ? DS.blanc15 : JOURNAL.zone === 0 ? DS.blanc : DS.blanc50);
			strokeWeight(2);
			noFill();
			rect(x + 1, z.y - 5, lp - 2, 42);
			noStroke();
		}
		dsTexte(nomJour(i), x + 10, z.y + 4, 17, futur ? DS.blanc50 : DS.blanc, 'left');
		// Pastille d'état : couleur + symbole (la couleur seule ne porte pas le sens)
		const sym = { succes: '✓', erreur: '✗', courant: '•', futur: '' }[etat];
		if (sym) {
			fill(etat === 'succes' ? DS.succes : etat === 'erreur' ? DS.erreur : DS.blanc50);
			rect(x + lp - 26, z.y + 4, 18, 18);
			dsTexte(sym, x + lp - 17, z.y + 4, 14, etat === 'succes' ? DS.fond : DS.blanc, 'center');
		}
		if (!futur) boutons.push({ x, y: z.y - 6, l: lp, h: 44, action: () => choisirJourJournal(i) });
	});
}

// ——— 2. Tuiles ———
function tuileFond(x, y, l, h, titre) {
	zoneTexteDeclarer('tuile', x, y, l, h); // prompt 93
	noStroke();
	fill(DS.blanc05);
	rect(x, y, l, h);
	stroke(DS.blanc15);
	strokeWeight(2);
	noFill();
	rect(x + 1, y + 1, l - 2, h - 2);
	noStroke();
	dsTexte(titre.toUpperCase(), x + 12, y + 10, 14, DS.blanc75, 'left');
}
function vueJour(z) {
	const tu = JournalDonnees.tuiles(JOURNAL.jour);
	if (!tu) return;
	// Prompt 186 : plus de pli « Détails » — les trois tuiles du prompt 141 (signalements, bons choix, objectif du jour)
	// s'affichent d'office ; la frise défile en dessous
	const yr = z.y + 84; // prompt 101 b : 24 px d'air sous la barre des jours
	// Prompt 101 b : seulement l'écart du jour — les valeurs des jauges sont déjà dans la barre des tâches.
	// Prompt 186 : à droite des filtres, seulement ce que les tuiles ne disent pas (écarts des jauges, avertissements)
	const jg = DS_JAUGES.filter(([cle]) => tu.jauges.ecart[cle] !== undefined).map(([cle]) => t('jaugeCourt.' + cle) + ' ' + sgn(tu.jauges.ecart[cle])).join(' · '); // prompt 204 : noms en clair
	const morceaux = [];
	if (jg) morceaux.push(jg);
	if (tu.avertissements) morceaux.push(t('journal.tuile.avertissements', { n: tu.avertissements })); // prompt 204 : nombre dans la phrase, pour l'accord
	const lf = filtreJournal(z, yr - 12);
	const xr = z.x + lf + 24;
	if (morceaux.length) dsTexte(couperLargeur(morceaux.join(' · '), z.l - lf - 24, 16), xr, yr, 16, DS.blanc75, 'left');
	const y0 = yr + 56;
	const liste = ['signalements', 'bonnes', 'objectif'];
	const largeurs = liste.map((k) => (k === 'objectif' ? 1.6 : 1));
	const unite = (z.l - (liste.length - 1) * 12) / largeurs.reduce((a, b) => a + b, 0);
	let x = z.x;
	const h = 140;
	liste.forEach((k, i) => {
		const l = unite * largeurs[i];
		tuileFond(x, y0, l, h, t('journal.tuile.' + k));
		const s = tu.signalements;
		if (k === 'signalements') {
			dsTitre(s.traites + '/' + s.recus, x + 12, y0 + 38, 36, DS.blanc, 'left');
			dsTexte(t('journal.tuile.nonTraites', { n: s.nonTraites }), x + 12, y0 + 88, 15, s.nonTraites ? DS.alerte : DS.blanc75, 'left', l - 24);
		} else if (k === 'bonnes') {
			dsTitre(tu.bonnes.n + '/' + tu.bonnes.total, x + 12, y0 + 38, 36, DS.blanc, 'left');
			fill(DS.blanc15);
			rect(x + 12, y0 + 100, l - 24, 10);
			fill(DS.succes);
			if (tu.bonnes.total) rect(x + 12, y0 + 100, ((l - 24) * tu.bonnes.n) / tu.bonnes.total, 10);
		} else if (k === 'objectif') {
			const o = tu.objectif;
			if (!o) dsTexte(nonRenseigne(), x + 12, y0 + 40, 16, DS.blanc50, 'left', l - 24);
			else {
				dsTexte(o.libelle, x + 12, y0 + 34, 15, DS.blanc, 'left', l - 24);
				dsBadge(x + 12 + 70, y0 + 116, o.enCours ? '• ' + t('journal.enCours') : (o.atteint ? '✓ ' : '✗ ') + t(o.atteint ? 'journal.atteint' : 'journal.rate'), o.enCours ? 'info' : o.atteint ? 'succes' : 'erreur');
			}
		}
		x += l + 12;
	});
	frise(z, y0 + h + 24);
}
/** Coupe un texte à une largeur (police du texte), avec « … » */
function couperLargeur(txt, l, taille) {
	textFont(DS.policeTexte);
	textSize(taille);
	if (textWidth(txt) <= l) return txt;
	let c = txt;
	while (c.length > 4 && textWidth(c + '…') > l) c = c.slice(0, -1);
	return c.trimEnd() + '…';
}
// 4. Filtres — prompt 186 : contrôle segmenté du DS (dsSegments, rôle radiogroup) : un segment par filtre, chacun
// avec son compteur, le filtre actif à la couleur d'accent ; ← → en zone filtres. Renvoie sa largeur
function filtreJournal(z, yf) {
	const F = JournalDonnees.FILTRES;
	const lf = Math.min(Math.round(z.l * 0.62), 180 * F.length);
	dsSegments(z.x, yf, lf, F.map(libelleFiltreJournal), F.indexOf(JOURNAL.filtre), (i) => choisirFiltreJournal(F[i]), JOURNAL.zone === 1);
	return lf;
}
const DS_JAUGES = [
	['fluidite', 'F', '#7FB2FF'],
	['reputation', 'R', '#FFC138'],
	['budget', 'B', '#00B74F'],
];

// ——— 3. Frise (cartes ancrées à leur heure, regroupées par dossier) ———
function hauteurCarteJournal(c) {
	return HAUTEURS_CARTES[c.sorte] + c.groupe.reduce((a, g) => a + HAUTEURS_CARTES[g.sorte] + 8, 0);
}
function frise(z, y0) {
	const toutes = JournalDonnees.cartes(JOURNAL.jour);
	const liste = JournalDonnees.filtrer(toutes, JOURNAL.filtre);
	const hz = z.y + z.h - y0;
	if (!liste.length) {
		// État vide illustré (pas de zone noire)
		dessinerPictoJournal('vide', z.x + z.l / 2 - 24, y0 + 30, 48);
		dsTexte(t('journal.vide'), z.x + z.l / 2, y0 + 94, 20, DS.blanc75, 'center');
		return;
	}
	const hs = liste.map(hauteurCarteJournal);
	const total = hs.reduce((a, b) => a + b + 16, 0); // prompt 101 b : 16 px entre cartes
	JOURNAL.defilMax = Math.max(0, total - hz);
	JOURNAL.defil = constrain(JOURNAL.defil, 0, JOURNAL.defilMax);
	JOURNAL.focus = constrain(JOURNAL.focus, 0, Math.max(0, liste.length - 1));
	// Axe horaire vertical
	stroke(DS.blanc15);
	strokeWeight(2);
	line(z.x + 66, y0, z.x + 66, y0 + hz);
	noStroke();
	drawingContext.save();
	drawingContext.beginPath();
	drawingContext.rect(z.x - 4, y0, z.l + 8, hz);
	drawingContext.clip();
	zoneTexteDebut('fileJournal', z.x - 4, y0, z.l + 8, hz, { clip: true }); // prompt 93 : zone défilante (ce qui en sort est masqué exprès)
	let y = y0 - JOURNAL.defil;
	let survol = -1;
	liste.forEach((c, k) => {
		const h = hs[k];
		if (y + h >= y0 && y <= y0 + hz) {
			const dx = (1 - easeOut(animJ(JOURNAL.ouvertA, 150, k * 30))) * 8; // entrée en glissé (8 px, 150 ms, cascade 30 ms)
			const lx = z.x + 84 + dx;
			if (mouseX >= lx && mouseX <= lx + z.l - 112 && mouseY >= Math.max(y, y0) && mouseY <= Math.min(y + h, y0 + hz)) survol = k; // prompt 101
			JOURNAL.carteActive = k === JOURNAL.survol || (k === JOURNAL.focus && JOURNAL.zone === 2);
			dessinerCarteJournal(c, lx, y, z.l - 112, k === JOURNAL.focus && JOURNAL.zone === 2, y0, hz);
			dsTexte(c.heure || '', z.x, y + 8, 15, DS.blanc75, 'left');
			fill(DS.blanc50);
			rect(z.x + 62, y + 14, 9, 9);
		}
		y += h + 16;
	});
	zoneTexteFin();
	drawingContext.restore();
	JOURNAL.survol = survol; // carte survolée : ses actions s'affichent à l'image suivante
	// Barre de défilement DS
	if (JOURNAL.defilMax > 0) {
		fill(DS.blanc05);
		rect(z.x + z.l - 10, y0, 8, hz);
		fill(DS.blanc50);
		const hb = Math.max(40, (hz * hz) / total);
		rect(z.x + z.l - 10, y0 + ((hz - hb) * JOURNAL.defil) / JOURNAL.defilMax, 8, hb);
	}
}
function cadreCarte(x, y, l, h, focus, liseré) {
	zoneTexteDeclarer('carte', x, y, l, h); // prompt 93
	noStroke();
	fill(DS.blanc05);
	rect(x, y, l, h);
	fill(liseré || DS.blanc15);
	rect(x, y, 6, h);
	stroke(focus ? DS.blanc : DS.blanc15);
	strokeWeight(2);
	noFill();
	rect(x + 1, y + 1, l - 2, h - 2);
	noStroke();
}
const COULEUR_EVAL = { bon: DS.succes, rate: DS.erreur, aucun_detour: DS.info, trop_tard: DS.alerte };
const SYMBOLE_EVAL = { bon: '✓', rate: '✗', aucun_detour: '≈', trop_tard: '⏱' };
const TEXTE_EVAL = { bon: DS.succesClair, rate: DS.erreurClair, aucun_detour: DS.infoClair, trop_tard: DS.alerteClair };
/** Prompt 101 : les actions d'une ligne apparaissent au survol ou au focus, toujours en tactile / mobile */
const actionsVisiblesJournal = () => JOURNAL.carteActive || (typeof MOBILE !== 'undefined' && MOBILE.actif);
function badgeLigne(ligne, x, y) {
	const ln = Jeu.lignes && Jeu.lignes.lignes ? Jeu.lignes.lignes.find((l) => l.nom === String(ligne).split(', ')[0]) : null;
	textFont(DS.policeTexte);
	textSize(15);
	const l = textWidth(String(ligne)) + 16;
	fill(ln && ln.couleur ? ln.couleur : DS.blanc15);
	rect(x, y, l, 24);
	fill(DS.blanc);
	textAlign(LEFT, CENTER);
	text(String(ligne), x + 8, y + 12); // texte blanc + liseré sombre : lisible sur les couleurs de ligne
	return l;
}
function dessinerCarteJournal(c, x, y, l, focus, y0, hz) {
	const h = HAUTEURS_CARTES[c.sorte];
	if (c.sorte === 'signalement') carteSignalement(c, x, y, l, focus);
	else if (c.sorte === 'equipe') carteEquipe(c.q, x, y, l, focus);
	else if (c.sorte === 'plainte') cartePlainte(c.p, x, y, l, focus);
	else if (c.sorte === 'patron') cadreCarte(x, y, l, h, focus, DS.alerte), dsTexte('⚠ ' + court(String(c.m.texte), 110), x + 20, y + 14, 16, DS.blanc, 'left', l - 40);
	else if (c.sorte === 'crise') cadreCarte(x, y, l, h, focus, DS.primaire), dsTexte(t('crise.bandeau') + ' · ' + t(c.c.resultat === 'maitrisee' ? 'journal.criseOk' : c.c.resultat === 'debordee' ? 'journal.criseKo' : 'journal.enCours'), x + 20, y + 14, 17, DS.blanc, 'left', l - 40);
	// Cartes liées (même dossier) : en retrait, reliées par un trait
	let yy = y + h + 8;
	c.groupe.forEach((g) => {
		stroke(DS.blanc50);
		strokeWeight(2);
		line(x + 20, yy - 8, x + 20, yy + 20);
		line(x + 20, yy + 20, x + 40, yy + 20);
		noStroke();
		if (g.sorte === 'equipe') carteEquipe(g.q, x + 40, yy, l - 40, false);
		else cartePlainte(g.p, x + 40, yy, l - 40, false);
		yy += HAUTEURS_CARTES[g.sorte] + 8;
	});
}
function carteSignalement(c, x, y, l, focus) {
	const e = c.e;
	const d = e.resultat.dossier;
	cadreCarte(x, y, l, HAUTEURS_CARTES.signalement, focus, COULEUR_EVAL[c.eval]); // prompt 204 : 116 px, la ligne des effets ne déborde plus sur la carte suivante
	dessinerPictoJournal(e.categorie || Jeu.categorie(d) || 'autre', x + 16, y + 12, 28);
	let bx = x + 56;
	if (e.ligne) bx += badgeLigne(e.ligne, bx, y + 14) + 10;
	const titre = d.consequence ? t('chaine.nature') : e.retardEffectif !== null && e.retardEffectif !== undefined && e.ligne ? t('journal.titreRetard', { retard: e.retardEffectif, ligne: e.ligne }) : d.type === 'événement' && d.texte_source ? t('tache.cause.affluence', { nom: String(d.texte_source).split(' — ')[0] }) : String(e.externeCourt || tSi('type.' + d.type, d.type));
	dsTexte(court(String(marquerFictif(e, titre)), 64), bx, y + 14, 18, DS.blanc, 'left'); // prompt 162
	// Réponse choisie (puce) et évaluation (couleur + symbole + mot)
	const rep = e.action ? String(e.action) : t('journal.aucuneAction');
	textFont(DS.policeTexte);
	textSize(15);
	const lr = Math.min(textWidth(rep) + 20, l - 520);
	fill(DS.blanc15);
	rect(x + 56, y + 48, lr, 32); // prompt 204 : 32 px, le texte relevé à 20 px tient dans la puce
	dsTexte(court(rep, 48), x + 66, y + 52, 15, DS.blanc, 'left');
	// Prompt 101 : évaluation en texte (symbole + mot, couleur claire) ; le liseré de la carte garde la couleur pleine
	dsTexte(SYMBOLE_EVAL[c.eval] + ' ' + t('eval.' + c.eval), x + 56 + lr + 16, y + 52, 15, TEXTE_EVAL[c.eval], 'left');
	// Effets réels : Fluidité +4 · Réputation −2 · Budget −8 (prompt 204 : noms en clair, plus F / R / B ; la couleur n'est qu'un renfort)
	let ex = x + 56;
	DS_JAUGES.forEach(([k]) => {
		const v = e.deltas[k] || 0;
		const txt = t('jaugeCourt.' + k) + ' ' + sgn(v);
		dsTexte(txt, ex, y + 88, 14, v > 0 ? DS.succesClair : v < 0 ? DS.erreurClair : DS.blanc75, 'left');
		textSize(14);
		ex += textWidth(txt) + 18;
	});
	if (actionsVisiblesJournal()) dsBouton(x + l - 190, y + 30, 176, 44, t('journal.enqueter'), () => ouvrirEnqueteJournal(e), focus ? 'primaire' : 'contour');
}
function carteEquipe(q, x, y, l, focus) {
	cadreCarte(x, y, l, 52, focus, DS.info);
	const etat = q.inutile ? t('journal.inutile') : q.pertinente === false ? t('journal.horsSujet') : q.arrivee_sim ? t('app.arrivee', { h: q.arrivee_sim }) : t('app.enRoute');
	dsTexte('▣ ' + t('journal.carteEquipe', { nom: q.nom, sujet: q.sujet || nonRenseigne(), cout: q.cout, etat }), x + 20, y + 14, 16, DS.blanc, 'left', l - 40);
}
function cartePlainte(p, x, y, l, focus) {
	cadreCarte(x, y, l, 64, focus, p.reponse === null ? DS.alerte : p.bonne ? DS.succes : DS.erreur);
	dsTexte('✉ ' + p.auteur + ' · ' + court(Jeu.textePlainte(p), 72), x + 20, y + 8, 15, DS.blanc, 'left'); // une ligne : pas de chevauchement
	dsTexte(p.reponse === null ? t('journal.sansReponse') : '↳ ' + court(Jeu.texteReponse(p, p.def.reponses[p.reponse]), 64) + ' · ' + t(p.bonne ? 'journal.bienRecue' : 'journal.malRecue'), x + 20, y + 36, 14, DS.blanc75, 'left'); // prompt 197 : texte du clash généré
	if (actionsVisiblesJournal()) dsBouton(x + l - 190, y + 10, 176, 44, t('journal.voirCommunity'), () => ouvrirAppPC('community'), 'fantome');
}
function ouvrirAppPC(nom) {
	PC.fenetre = nom;
}

/** Pictogrammes pixel 7 × 7 par catégorie (dessinés par le code) */
const PICTOS_JOURNAL = {
	retard: ['..###..', '.#...#.', '#..#..#', '#..##.#', '#.....#', '.#...#.', '..###..'],
	travaux: ['...#...', '..###..', '..#.#..', '.##.##.', '.#####.', '##...##', '#######'],
	affluence: ['.#...#.', '###.###', '.#...#.', '##.#.##', '..###..', '.#####.', '#.#.#.#'],
	meteo: ['..##...', '.####..', '#######', '.......', '.#.#.#.', '#.#.#..', '.......'],
	accident: ['...#...', '..###..', '..#.#..', '.##.##.', '.##.##.', '#######', '...#...'],
	autre: ['#######', '#.....#', '#.###.#', '#.....#', '#.###.#', '#.....#', '#######'],
	vide: ['#######', '#.....#', '#.#.#.#', '#.....#', '#..#..#', '#.....#', '#######'],
};
function dessinerPictoJournal(cle, x, y, taille) {
	const m = PICTOS_JOURNAL[cle] || PICTOS_JOURNAL.autre;
	const p = taille / 7;
	noStroke();
	fill(DS.blanc75);
	m.forEach((ligne, r) => [...ligne].forEach((ch, k) => ch === '#' && rect(x + k * p, y + r * p, Math.ceil(p), Math.ceil(p))));
}

// ——— 4. Fiche d'enquête ———
function ficheEnquete(z, e) {
	const f = JournalDonnees.enquete(e);
	let y = z.y;
	dsBouton(z.x, y - 6, 200, 44, '← ' + t('journal.retourCourt'), () => retourRedirection('journal') || (JOURNAL.enquete = null), 'contour'); // prompt 185 : ouverte depuis un mail → retour au mail
	dessinerPictoJournal(e.categorie || 'autre', z.x + 220, y, 28);
	const titre = t('journal.titreEnquete', { date: e.jour.split('-').reverse().join('/'), heure: e.heure || '—' });
	dsTitre(titre, z.x + 262, y + 2, 24, DS.blanc, 'left');
	let bx = z.x + z.l - 420;
	if (e.ligne) bx += badgeLigne(e.ligne, bx, y + 4) + 12;
	dsBadge(bx + 90, y + 16, SYMBOLE_EVAL[f.eval] + ' ' + t('eval.' + f.eval), f.eval === 'bon' ? 'succes' : f.eval === 'rate' ? 'erreur' : f.eval === 'trop_tard' ? 'alerte' : 'info');
	y += 56;
	// Onglets DS avec indicateur primaire
	const lb = (z.l - 3 * 8) / 4;
	VOLETS_ENQUETE.forEach((v, i) => {
		const x = z.x + i * (lb + 8);
		dsBouton(x, y, lb, 48, t('journal.volet.' + v), () => choisirVoletJournal(i), 'fantome');
		dsTexte(String(i + 1), x + 14, y + 14, 16, DS.blanc50, 'left'); // prompt 101 : numéro (touche) en texte secondaire
		fill(JOURNAL.volet === i ? DS.primaire : DS.blanc15);
		rect(x, y + 46, lb, JOURNAL.volet === i ? 4 : 2);
	});
	y += 72;
	const a = animJ(JOURNAL.voletA, 120);
	drawingContext.globalAlpha = a; // fondu de 120 ms au changement d'onglet
	const v = VOLETS_ENQUETE[JOURNAL.volet];
	if (v === 'passe') voletPasse(f, z, y);
	else if (v === 'contexte') voletContexte(f, z, y);
	else if (v === 'decision') voletDecision(f, e, z, y);
	else voletSuites(f, z, y);
	drawingContext.globalAlpha = 1;
}
function voletPasse(f, z, y) {
	const F = f.faits;
	tuileFond(z.x, y, z.l, 120, t('journal.faits'));
	const items = [t('journal.type', { type: tSi('type.' + F.type, F.type) }), t('journal.nature', { nature: F.nature || nonRenseigne() }), F.lignes ? t('dossier.ligne', { lignes: F.lignes }) : t('enq.lignes.inconnue'), F.retard !== null ? t('dossier.retard', { retard: F.retard }) : t('dossier.retardInconnu')];
	items.forEach((s, i) => dsTexte(s, z.x + 16 + (i % 2) * (z.l / 2), y + 40 + Math.floor(i / 2) * 34, 17, DS.blanc, 'left', z.l / 2 - 32));
	y += 140;
	// Bloc citation : texte réel de la source, liseré blanc 15 % — prompt 92 : même composant que l'enquête de
	// Signalements (nettoyage typographique, 4 lignes puis « … » en fin de mot et « Lire tout »)
	const cit = F.citation ? nettoyerTexteSource(t('dossier.citation', { texte: F.citation }), Langue.actuelle) : nonRenseigne();
	const rc = dessinerTexte(cit, z.x + 24, y + 4, Math.min(z.l - 40, 70 * TexteUI.mesurer('0', DS.policeTexte, 21)), { police: DS.policeTexte, taille: 21, style: ITALIC, couleur: DS.blanc, maxLignes: JOURNAL.citationOuverte ? 0 : 4 });
	fill(Confort.Reglages.contrasteRenforce ? DS.blanc50 : DS.blanc15);
	rect(z.x, y, 6, Math.max(40, rc.h + 8));
	y += Math.max(40, rc.h + 8) + 12;
	if (F.citation && Langue.actuelle !== 'fr') y += dessinerTexte(t('enq.original'), z.x + 24, y - 6, z.l - 40, { police: DS.policeTexte, taille: 18, couleur: DS.blanc75 }).h + 6;
	if (rc.tronque || JOURNAL.citationOuverte) {
		dsBouton(z.x + 24, y, 240, 44, t(JOURNAL.citationOuverte ? 'enq.reduire' : 'enq.lireTout'), () => (JOURNAL.citationOuverte = !JOURNAL.citationOuverte), 'contour');
		y += 56;
	}
	dsTexte(F.consequence ? t('savoir.consequence', { heure: F.consequence.heure }) : t('journal.source', { source: F.source || nonRenseigne(), date: dateLongue(F.date) + (F.heure ? ' · ' + F.heure : '') }), z.x, y, 16, DS.blanc75, 'left', z.l);
}
function puce(txt, x, y, l) {
	fill(DS.blanc05);
	rect(x, y, l, 48);
	stroke(DS.blanc15);
	strokeWeight(2);
	noFill();
	rect(x + 1, y + 1, l - 2, 46);
	noStroke();
	dessinerTexte(txt, x + 14, y + 12, l - 28, { police: DS.policeTexte, taille: 18, couleur: DS.blanc, maxLignes: 1, interligne: 24 }); // prompt 92 : « … » en fin de mot
}
function voletContexte(f, z, y) {
	const C2 = f.contexte;
	const l = (z.l - 12) / 2;
	const m = C2.meteo;
	const p = [
		m ? '☀ ' + t('journal.puce.temp', { min: nombreFr(m.min), max: nombreFr(m.max) }) : '☀ ' + t('enq.meteo.inconnue'),
		m ? '☂ ' + t('journal.puce.pluie', { pluie: nombreFr(m.pluie) }) : '☂ ' + nonRenseigne(),
		m ? '≋ ' + t('journal.puce.vent', { vent: nombreFr(m.vent) }) : '≋ ' + nonRenseigne(),
		'⏱ ' + t(C2.pointe ? 'journal.pointe.oui' : 'journal.pointe.non'),
		C2.meteoAggravante ? '⚠ ' + t('journal.meteoAggravante') : '✓ ' + t('journal.meteoNeutre'),
		C2.modificateur ? '◆ ' + t('mod.' + C2.modificateur) : '◆ ' + t('journal.sansModificateur'),
	];
	p.forEach((s, i) => puce(s, z.x + (i % 2) * (l + 12), y + Math.floor(i / 2) * 60, l));
	y += 3 * 60 + 12;
	dsTexte(t('journal.agendaTitre').toUpperCase(), z.x, y, 14, DS.blanc75, 'left');
	y += 26;
	if (!C2.agenda.length) dsTexte(t('journal.agendaVide'), z.x, y, 16, DS.blanc50, 'left', z.l);
	C2.agenda.slice(0, 4).forEach((n, i) => puce('◷ ' + nettoyerTexteSource(n, Langue.actuelle), z.x + (i % 2) * (l + 12), y + Math.floor(i / 2) * 60, l));
	if (C2.agenda.length > 4) dsTexte(t('enq.autres', { n: C2.agenda.length - 4 }), z.x, y + 2 * 60 + 4, 18, DS.blanc75, 'left', z.l); // prompt 92 : rien de caché sans le dire
}
function faceDe(v, x, y, s) {
	fill(DS.blanc);
	rect(x, y, s, s);
	fill(DS.fond);
	const c = s / 2;
	const q = s / 4;
	const pts = { 1: [[c, c]], 2: [[q, q], [s - q, s - q]], 3: [[q, q], [c, c], [s - q, s - q]], 4: [[q, q], [s - q, q], [q, s - q], [s - q, s - q]], 5: [[q, q], [s - q, q], [c, c], [q, s - q], [s - q, s - q]], 6: [[q, q], [s - q, q], [q, c], [s - q, c], [q, s - q], [s - q, s - q]] }[v] || [];
	pts.forEach(([a, b]) => rect(x + a - 3, y + b - 3, 6, 6));
}
function voletDecision(f, e, z, y) {
	const D = f.decision;
	dsTexte(t('journal.action', { action: D.action || t('journal.aucuneAction') }), z.x, y, 18, DS.blanc, 'left', z.l);
	y += 36;
	const lp = 220;
	DS_JAUGES.forEach(([k, lettre], i) => {
		const v = D.deltas[k] || 0;
		fill(v > 0 ? DS.succes : v < 0 ? DS.erreur : DS.blanc15);
		rect(z.x + i * (lp + 12), y, lp, 56);
		dsTexte(t('jaugeTitre.' + k) + ' ' + sgn(v), z.x + i * (lp + 12) + 14, y + 16, 19, v > 0 ? DS.fond : DS.blanc, 'left');
	});
	// Dés réels (faces pixel), à droite des effets
	if (D.des.length) {
		dsTexte(t('journal.desTitre'), z.x + 3 * (lp + 12) + 8, y - 4, 14, DS.blanc75, 'left');
		D.des.forEach((d, i) => faceDe(d, z.x + 3 * (lp + 12) + 8 + i * 48, y + 16, 38));
	}
	y += 76;
	// Barres horizontales des effets attendus (axe centré sur 0, échelle affichée)
	dsTexte(t('journal.attendusTitre', { echelle: D.echelle }), z.x, y, 15, DS.blanc75, 'left', z.l);
	y += 28;
	const lx = 360;
	const axe = z.x + lx + (z.l - lx - 220) / 2;
	const demi = (z.l - lx - 220) / 2;
	stroke(DS.blanc50);
	strokeWeight(2);
	line(axe, y - 4, axe, y + D.barres.length * 40);
	noStroke();
	dsTexte('−' + D.echelle, axe - demi, y + D.barres.length * 40 + 4, 14, DS.blanc50, 'center');
	dsTexte('0', axe, y + D.barres.length * 40 + 4, 14, DS.blanc50, 'center');
	dsTexte('+' + D.echelle, axe + demi, y + D.barres.length * 40 + 4, 14, DS.blanc50, 'center');
	D.barres.forEach((b, i) => {
		const by = y + i * 40;
		dsTexte(court(b.lib, 34), z.x, by + 6, 15, b.choix || b.meilleure ? DS.blanc : DS.blanc75, 'left');
		const w = (demi * b.v) / D.echelle;
		fill(b.meilleure ? DS.succes : b.choix ? DS.primaire : DS.blanc50);
		rect(w >= 0 ? axe : axe + w, by + 4, Math.abs(w), 24);
		const etiquettes = [b.v > 0 ? '+' + b.v : String(b.v)].concat(b.choix ? [t('journal.votreChoix')] : [], b.meilleure ? [t('journal.laMeilleure')] : []);
		dsTexte(etiquettes.join(' · '), axe + demi + 12, by + 6, 14, DS.blanc, 'left');
	});
	y += D.barres.length * 40 + 30;
	const expl = typeof explicationDecision === 'function' ? explicationDecision(e.resultat) : [];
	if (expl.length) dsTexte(expl.slice(0, 2).join(' '), z.x, y, 16, DS.blanc75, 'left', z.l);
}
function voletSuites(f, z, y) {
	const S2 = f.suites;
	dsTexte(t('journal.suitesPlaintes').toUpperCase(), z.x, y, 14, DS.blanc75, 'left');
	y += 26;
	if (!S2.plaintes.length) (dsTexte(t('journal.aucunePlainte'), z.x, y, 16, DS.blanc50, 'left', z.l), (y += 34));
	S2.plaintes.forEach((p) => {
		// Bulles DS : usager à gauche, réponse de la salle à droite
		fill(DS.blanc05);
		rect(z.x, y, z.l * 0.62, 52);
		dsTexte(p.auteur + ' : ' + court(p.texte, 80), z.x + 12, y + 8, 15, DS.blanc, 'left', z.l * 0.62 - 24);
		y += 60;
		fill(p.reponse === null ? DS.blanc05 : p.bonne ? 'rgba(0,183,79,0.25)' : 'rgba(209,11,0,0.25)');
		rect(z.x + z.l * 0.38, y, z.l * 0.62, 52);
		dsTexte(p.reponse === null ? t('journal.sansReponse') : '↳ ' + court(p.reponse, 70) + ' · ' + t(p.bonne ? 'journal.bienRecue' : 'journal.malRecue'), z.x + z.l * 0.38 + 12, y + 8, 15, DS.blanc, 'left', z.l * 0.62 - 24);
		y += 60;
		if (p.suivis) (dsTexte(t('journal.suivis', { recues: p.recus, total: p.suivis }), z.x, y, 14, DS.blanc75, 'left'), (y += 28));
	});
	y += 8;
	dsTexte(t('journal.suitesEquipes').toUpperCase(), z.x, y, 14, DS.blanc75, 'left');
	y += 26;
	if (!S2.equipes.length) dsTexte(t('journal.aucuneEquipe'), z.x, y, 16, DS.blanc50, 'left', z.l);
	S2.equipes.forEach((q) => {
		puce('▣ ' + q.nom + ' · ' + (q.inutile ? t('journal.inutile') : t(q.pertinente ? 'journal.pertinente' : 'journal.horsSujet')) + (q.duree !== null ? ' · ' + t('journal.duree', { s: q.duree }) : ''), z.x, y, z.l / 2);
		y += 60;
	});
}

// ——— Clavier et molette ———
function toucheJournal() {
	if (PC.fenetre !== 'journal' || !Jeu.paquet || ecran !== 'jeu') return false;
	const e = enqueteCourante();
	if (e) {
		if (keyCode === ESCAPE) return retourRedirection('journal') || ((JOURNAL.enquete = null), Confort.Son.clic()), true; // prompt 185 : depuis un mail, Échap y revient
		if (keyCode === RIGHT_ARROW || keyCode === LEFT_ARROW) return choisirVoletJournal(JOURNAL.volet + (keyCode === RIGHT_ARROW ? 1 : -1)), true;
		const n = ['1', '2', '3', '4'].indexOf(key);
		if (n >= 0) return choisirVoletJournal(n), true;
		return false;
	}
	if (keyCode === TAB) {
		JOURNAL.zone = (JOURNAL.zone + (keyIsDown(SHIFT) ? ZONES_JOURNAL.length - 1 : 1)) % ZONES_JOURNAL.length;
		annoncer(t('journal.zone.' + ZONES_JOURNAL[JOURNAL.zone]));
		return true;
	}
	if (keyCode === RIGHT_ARROW || keyCode === LEFT_ARROW) {
		if (JOURNAL.zone === 1) {
			const f = JournalDonnees.FILTRES;
			return choisirFiltreJournal(f[dsSegmentVoisin(f.length, f.indexOf(JOURNAL.filtre), keyCode === RIGHT_ARROW ? 1 : -1)]), true; // prompt 186
		}
		return choisirJourJournal(JOURNAL.jour + (keyCode === RIGHT_ARROW ? 1 : -1)), true;
	}
	const liste = JournalDonnees.filtrer(JournalDonnees.cartes(JOURNAL.jour), JOURNAL.filtre);
	if (keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
		JOURNAL.zone = 2;
		JOURNAL.focus = constrain(JOURNAL.focus + (keyCode === DOWN_ARROW ? 1 : -1), 0, Math.max(0, liste.length - 1));
		// Défilement pour garder la carte visible
		const hs = liste.map(hauteurCarteJournal);
		const haut = hs.slice(0, JOURNAL.focus).reduce((a, b) => a + b + 16, 0);
		JOURNAL.defil = constrain(haut - 120, 0, JOURNAL.defilMax);
		const c = liste[JOURNAL.focus];
		if (c) annoncer(texteCarte(c));
		return true;
	}
	if (keyCode === ENTER || keyCode === RETURN) {
		const c = liste[JOURNAL.focus];
		if (c && c.sorte === 'signalement') return ouvrirEnqueteJournal(c.e), true;
		return true;
	}
	return false;
}
function texteCarte(c) {
	if (c.sorte === 'signalement') return (c.heure || '') + ' · ' + String(c.e.externeCourt) + (c.e.ligne ? ' · ' + t('dossier.ligne', { lignes: c.e.ligne }) : '') + ' · ' + (c.e.action ? String(c.e.action) : t('journal.aucuneAction')) + ' · ' + t('eval.' + c.eval);
	if (c.sorte === 'equipe') return t('journal.carteEquipe', { nom: c.q.nom, sujet: c.q.sujet || '', cout: c.q.cout, etat: '' });
	if (c.sorte === 'plainte') return c.p.auteur + ' : ' + Jeu.textePlainte(c.p);
	if (c.sorte === 'patron') return String(c.m.texte);
	return t('crise.bandeau');
}
function molletteJournal(delta) {
	if (PC.fenetre !== 'journal' || JOURNAL.enquete !== null || !Jeu.paquet || ecran !== 'jeu' || vue !== 'poste') return false;
	JOURNAL.defil = constrain(JOURNAL.defil + delta, 0, JOURNAL.defilMax);
	return true;
}
