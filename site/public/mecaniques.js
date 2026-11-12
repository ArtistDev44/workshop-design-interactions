/* Nantes en régulation — prompt 47 : inspection surprise, fin « démission », palmarès (prompt 142 : journal de bord retiré).
 * La logique (profils, choix de la décision inspectée, agenda, démission) est dans game.js ; ici, l'interface.
 * Tout part des décisions réelles de la partie : aucun fait inventé.
 */

// ——— Boucle : appelée à chaque image par draw() ———
function verifierMecaniques() {
	if (MENU.actif || ecran !== 'jeu' || phase !== 'attente' || fenetre || smsActif || tutoriel || TRANSITION_JOUR || enPause) return;
	if (typeof CINE !== 'undefined' && CINE) return;
	if (verifierBlame()) return; // prompt 51 : le mail du patron passe avant tout
	const i = Jeu.inspection && !Jeu.inspection.reponse ? Jeu.inspection : Jeu.preparerInspection();
	if (i && !i.reponse) ouvrirInspection();
}
/** Le temps s'arrête pendant l'inspection et les fenêtres de mécanique */
function mecaniquesSuspendentTemps() {
	return fenetre === 'inspection' || fenetre === 'tache' || fenetre === 'demission' || fenetre === 'partir' || fenetre === 'blame' || fenetre === 'cafe';
}

// ——— Inspection surprise (une fois par semaine) ———
const JAUGES_INSPECTION = ['fluidite', 'reputation', 'budget'];
function ouvrirInspection() {
	const i = Jeu.inspection;
	ouvrir('inspection');
	Confort.Son.bip('dossier');
	annoncer(t('insp.titre') + '. ' + texteInspection(i) + ' ' + t('insp.question'));
}
function texteInspection(i) {
	const sujet = i.ligne ? t('insp.ligne', { ligne: i.ligne }) : i.nature;
	return t('insp.texte', { date: dateLongue(i.jour), heure: i.heure || '—', sujet, action: String(Jeu.libelleAction(i.cle)) }); // prompt 87 : réponse de catégorie ou action historique
}
function repondreInspection(n) {
	const r = Jeu.repondreInspection(JAUGES_INSPECTION[n]);
	if (!r) return;
	Confort.Son.bip(r.juste ? 'choix' : 'consequence');
	annoncer(texteResultatInspection(r));
}
function texteResultatInspection(r) {
	return t(r.juste ? 'insp.juste' : 'insp.faux', { jauge: t('jauge.' + r.bonne), effet: (r.effet > 0 ? '+' : '') + r.effet });
}
function fenetreInspection() {
	const i = Jeu.inspection;
	if (!i) return fermer();
	const l = 1100;
	const h = 640;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.accent);
	noStroke();
	fill(C.primaire);
	rect(x, y, 12, h);
	dsTitre(t('insp.titre'), x + 56, y + 44, 48, C.texte, 'left');
	noStroke();
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textSize(25);
	textLeading(36);
	fill(C.texte);
	text(texteInspection(i), x + 56, y + 130, l - 112, 150);
	textStyle(BOLD);
	text(t('insp.question'), x + 56, y + 290, l - 112, 40);
	textStyle(NORMAL);
	if (!i.reponse) {
		const bl = (l - 112 - 2 * 24) / 3;
		JAUGES_INSPECTION.forEach((k, n) => bouton(x + 56 + n * (bl + 24), y + 370, bl, 80, n + 1 + '  ' + t('jaugeTitre.' + k), () => repondreInspection(n)));
		textFont(POLICE_DONNEES);
		textSize(18);
		fill(C.gris);
		text(t('insp.aide'), x + 56, y + h - 110, l - 112, 60);
		return;
	}
	textSize(25);
	fill(i.juste ? C.vert : C.rouge);
	textStyle(BOLD);
	text(texteResultatInspection(i), x + 56, y + 370, l - 112, 100);
	textStyle(NORMAL);
	bouton(x + l - 56 - 460, y + h - 116, 460, 72, t('insp.reprendre'), fermerInspection);
}
function fermerInspection() {
	if (Jeu.inspection && !Jeu.inspection.reponse) return; // il faut répondre au directeur
	fermer();
	Sauvegarde.auto(false);
}

// ——— Fin « démission » : les trois jauges sous 20 → rendre son badge ———
function dessinerOffreDemission() {
	if (MENU.actif || ecran !== 'jeu' || phase === 'fin' || fenetre || smsActif || !Jeu.peutDemissionner()) return;
	const l = 1240;
	const h = 76;
	const x = (L - l) / 2;
	const y = 18;
	noStroke();
	fill(13, 12, 12, 240);
	rect(x, y, l, h);
	fill(C.rougeFonce);
	rect(x, y, 10, h);
	textAlign(LEFT, CENTER);
	textFont(POLICE_TEXTE);
	textSize(19);
	fill(C.texte);
	text(t('demission.offre'), x + 30, y + 8, l - 380, h - 16);
	bouton(x + l - 330, y + 12, 316, h - 24, t('demission.bouton'), () => ouvrir('demission'));
}
function fenetreDemission() {
	const l = 900;
	const h = 420;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.accent);
	dsTitre(t('demission.titre'), x + 56, y + 44, 48, C.texte, 'left');
	noStroke();
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textSize(24);
	textLeading(34);
	fill(C.texte);
	text(t('demission.texte', { f: Jeu.jauges.fluidite, r: Jeu.jauges.reputation, b: Jeu.jauges.budget }), x + 56, y + 130, l - 112, 140);
	bouton(x + 56, y + h - 116, 380, 72, t('demission.confirmer'), demissionner);
	bouton(x + l - 56 - 340, y + h - 116, 340, 72, t('demission.continuer'), fermer, false, true);
}
function demissionner() {
	if (!Jeu.peutDemissionner()) return fermer();
	Jeu.demission = true;
	Jeu.terminee = true;
	fenetre = null;
	annoncer(t('demission.annonce'));
	allerFin();
}

// ——— Palmarès local : meilleur bilan par semaine, avec le profil de gestion ———
function lignesPalmares() {
	const semaines = Jeu.semainesProposees().map((s) => ({ cle: s.lundi, libelle: t('palmares.semaine', { lundi: s.lundi.split('-').reverse().join('/'), niveau: t('palmares.niveau.' + s.niveau) }) }));
	semaines.push({ cle: 'direct', libelle: t('sauvegarde.semaineDirect') });
	return semaines.map((s) => Object.assign(s, { m: Confort.Bilans.meilleur(s.cle) }));
}
function fenetrePalmares() {
	const l = 1400;
	const lignes = lignesPalmares();
	const h = 300 + lignes.length * 96;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	panneau(x, y, l, h, C.accent);
	dsTitre(t('palmares.titre'), x + 56, y + 40, 52, C.texte, 'left');
	noStroke();
	textAlign(LEFT, TOP);
	textFont(POLICE_DONNEES);
	textSize(18);
	fill(C.gris);
	const cols = [0, 400, 640, 1000];
	[t('palmares.col.semaine'), t('palmares.col.score'), t('palmares.col.jauges'), t('palmares.col.profil')].forEach((c, i) => text(c, x + 56 + cols[i], y + 124));
	lignes.forEach((s, i) => {
		const ly = y + 164 + i * 96;
		fill(255, 255, 255, 13);
		rect(x + 40, ly - 12, l - 80, 84);
		textFont(POLICE_TEXTE);
		textSize(22);
		fill(C.texte);
		text(s.libelle, x + 56 + cols[0], ly, 380, 60);
		if (!s.m) {
			fill(C.gris);
			text(t('palmares.vide'), x + 56 + cols[1], ly);
			return;
		}
		textStyle(BOLD);
		textSize(30);
		text(s.m.score + ' / 300', x + 56 + cols[1], ly);
		textStyle(NORMAL);
		textSize(18);
		fill(C.gris);
		text(t('palmares.le', { date: s.m.le.split('-').reverse().join('/') }), x + 56 + cols[1], ly + 38);
		fill(C.texte);
		textSize(20);
		const j = s.m.jauges || {};
		text(t('palmares.jauges', { f: j.fluidite, r: j.reputation, b: j.budget }), x + 56 + cols[2], ly + 6, 340, 60);
		text((s.m.profil ? t('profil.' + s.m.profil) : '—') + (s.m.defis ? ' · ' + t('palmares.defis', { n: s.m.defis }) : ''), x + 56 + cols[3], ly + 6, 320, 60); // prompt 56 : défis tenus
	});
	textFont(POLICE_DONNEES);
	textSize(18);
	fill(C.gris);
	text(t('palmares.aide'), x + 56, y + h - 110, l - 112 - 340, 100); // prompt 93 : 70 → 100 px (le texte était coupé)
	bouton(x + l - 56 - 300, y + h - 108, 300, 68, t('commun.fermer'), fermer);
}

// ——— Clavier (appelé par keyPressed avant les fenêtres génériques) ; true = touche traitée ———
function toucheMecaniques() {
	if (fenetre === 'inspection') {
		const i = Jeu.inspection;
		if (i && !i.reponse && ['1', '2', '3'].includes(key)) repondreInspection(Number(key) - 1);
		else if (i && i.reponse && (keyCode === ENTER || keyCode === RETURN || keyCode === ESCAPE)) fermerInspection();
		return true; // il faut répondre : Échap ne fait pas disparaître le directeur
	}
	if (fenetre === 'demission') {
		if (keyCode === ENTER || keyCode === RETURN) demissionner();
		else if (keyCode === ESCAPE) fermer();
		return true;
	}
	if (fenetre === 'palmares') {
		if (keyCode === ESCAPE || keyCode === ENTER || keyCode === RETURN) fermer();
		return true;
	}
	if (fenetre || smsActif || MENU.actif || ecran !== 'jeu' || phase === 'fin') return false;
	if ((key === 'd' || key === 'D') && Jeu.peutDemissionner()) return ouvrir('demission'), true;
	return false;
}

// Rapport papier : profil de gestion — prompt 163 : texteProfilRapport (histoire.js), un seul profil
