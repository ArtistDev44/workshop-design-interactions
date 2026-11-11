/* Nantes en régulation — prompt 84 : rappel à l'ordre, dernier avertissement, licenciement et écran « game over ».
 * La règle (seuils, hystérésis, délais, file pendant la panne) vit dans game.js (REGLAGES.licenciement,
 * Jeu.majStatutPatron, Jeu.finJourneeStatut). Ici : la pastille de statut, le son des messages mis en avant, le
 * déclenchement du licenciement (jamais au milieu d'une décision : après la narration, ou en fin de journée
 * avant le mail), et l'écran « LICENCIÉ » avec la lettre du patron (faits réels uniquement).
 * Licenciement : sauvegarde effacée, pas de palmarès, ni défis ni progression de l'histoire (comme la démission).
 */
let GAMEOVER = null; // { debut, lettre, vue: 'lettre' | 'journal', focus }
const CLE_LICENCIEMENTS = 'pxe-nte001-licenciements';
let importantsVus = 0;

/** Une fois par image : file de la panne, son des messages mis en avant, licenciement en attente */
function majLicenciement() {
	if (ecran !== 'jeu' || !Jeu.statutPatron || GAMEOVER) return;
	if (Jeu.livrerSanctions) Jeu.livrerSanctions();
	const n = (Jeu.messagesPatron || []).filter((m) => m.important).length;
	if (n > importantsVus) Confort.Son.bip('alerte'); // rappel ou avertissement reçu : notification sonore
	importantsVus = n;
	// Effondrement ou rechute : pas au milieu d'une décision ni d'une narration (on attend la fin du dossier)
	if (Jeu.statutPatron.licencie && ['attente', 'selection'].includes(phase) && !MULTI.actifs.length) lancerLicenciement();
}
function lancerLicenciement() {
	if (GAMEOVER) return;
	GAMEOVER = { debut: millis(), lettre: Jeu.lettreLicenciement(), vue: 'lettre', focus: 0 };
	phase = 'fin';
	fenetre = null;
	enSieste = false;
	reveil = null;
	Sauvegarde.effacer(Sauvegarde.semaineCourante()); // plus rien à reprendre ; pas de palmarès (allerFin n'est pas appelé)
	try {
		localStorage.setItem(CLE_LICENCIEMENTS, String((Number(localStorage.getItem(CLE_LICENCIEMENTS)) || 0) + 1)); // statistique locale
	} catch (e) {}
	Confort.Son.bip('consequence'); // signal grave et court
	if (Confort.Son.musique && Confort.Son.musique.attenuer) Confort.Son.musique.attenuer(0); // musique coupée en fondu
	annoncer(t('gameover.annonce', { score: GAMEOVER.lettre.score }));
}
function quitterGameOver(action) {
	GAMEOVER = null;
	if (Confort.Son.musique && Confort.Son.musique.attenuer) Confort.Son.musique.attenuer(1);
	if (action === 'rejouer') rejouer();
	else retourAccueil();
}
const ACTIONS_GAMEOVER = [
	{ cle: 'gameover.rejouer', action: () => quitterGameOver('rejouer') },
	{ cle: 'gameover.changer', action: () => quitterGameOver('changer') },
	{ cle: 'gameover.journal', action: () => (GAMEOVER.vue = GAMEOVER.vue === 'journal' ? 'lettre' : 'journal') },
];
/** Clavier : Entrée rejouer (ou bouton focalisé), Échap changer de semaine, J journal, Tab / ← → boutons */
function toucheGameOver() {
	const n = ACTIONS_GAMEOVER.length;
	if (keyCode === TAB || keyCode === RIGHT_ARROW) GAMEOVER.focus = (GAMEOVER.focus + 1) % n;
	else if (keyCode === LEFT_ARROW) GAMEOVER.focus = (GAMEOVER.focus + n - 1) % n;
	else if (keyCode === ENTER || keyCode === RETURN || key === ' ') return ACTIONS_GAMEOVER[GAMEOVER.focus].action();
	else if (keyCode === ESCAPE) return quitterGameOver('changer');
	else if (key === 'j' || key === 'J') return ACTIONS_GAMEOVER[2].action();
	else return;
	annoncer(t(ACTIONS_GAMEOVER[GAMEOVER.focus].cle));
}
function dessinerGameOver() {
	const G = GAMEOVER;
	const u = millis() - G.debut;
	const a = reduireAnimations ? 1 : Math.min(1, u / 800); // fondu au noir 0,8 s, jamais de blanc
	noStroke();
	fill(0, 0, 0, 255 * a);
	rect(0, 0, L, H);
	if (a < 1) return;
	dsTitre(t('gameover.titre'), 120, 70, 88, DS.primaire, 'left');
	noStroke();
	textFont(POLICE_TEXTE);
	textAlign(LEFT, TOP);
	textSize(28);
	fill('rgba(255,255,255,0.75)');
	text(t('gameover.sous'), 124, 190);
	const L0 = G.lettre;
	// Lettre du patron (papier), ou journal de la partie en lecture seule
	const x = 120;
	const y = 250;
	const l = L - 240;
	const h = 640;
	fill(G.vue === 'lettre' ? '#f2ead8' : '#171616');
	rect(x, y, l, h);
	if (G.vue === 'lettre') {
		fill('#1c2733');
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textSize(26);
		text(t('gameover.objet'), x + 48, y + 36);
		textStyle(NORMAL);
		textSize(21);
		textLeading(30);
		const lignes = [String(L0.quand), t('gameover.jauges', { liste: String(L0.jauges), score: L0.score }), String(L0.avertissements)];
		if (L0.pires.length) lignes.push(t('gameover.pires'), ...L0.pires.map((p) => '— ' + String(p)));
		if (L0.malus) lignes.push(String(L0.malus));
		lignes.push('', t('gameover.cause.' + L0.cause), String(L0.conseil));
		text(lignes.join('\n'), x + 48, y + 86, l - 420, h - 110);
		// Tampon « RÉSILIÉ » (sans animation si les animations sont réduites)
		const k = reduireAnimations ? 1 : Math.min(1, (u - 800) / 300);
		push();
		translate(x + l - 200, y + 150);
		rotate(-0.18);
		scale(0.7 + 0.3 * k);
		noFill();
		stroke(DS.primaire);
		strokeWeight(6);
		rect(-150, -46, 300, 92);
		noStroke();
		fill(DS.primaire);
		textAlign(CENTER, CENTER);
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textSize(44);
		text(t('gameover.tampon'), 0, 2);
		textStyle(NORMAL);
		pop();
	} else {
		fill('#FFFFFF');
		textFont(POLICE_DONNEES);
		textSize(19);
		textLeading(27);
		const ev = (Jeu.evenementsJournee || []).map((e) => e.jour.split('-').reverse().join('/') + ' ' + String(Jeu.ligneMail(e)));
		text((ev.length ? ev.slice(-20) : [t('gameover.journalVide')]).join('\n'), x + 40, y + 36, l - 80, h - 60);
	}
	textAlign(LEFT, TOP);
	const lb = 420;
	ACTIONS_GAMEOVER.forEach((b, i) => {
		const bx = x + i * (lb + 24);
		bouton(bx, y + h + 40, lb, 72, t(b.cle), b.action, false, i > 0);
		if (G.focus === i) {
			noFill();
			stroke('#FFC138');
			strokeWeight(4);
			rect(bx - 8, y + h + 32, lb + 16, 88);
			noStroke();
		}
	});
	textAlign(LEFT, TOP);
}
/** Pastille de statut dans le bandeau d'état (à gauche de la somnolence) */
function dessinerStatutPatron() {
	const S = Jeu.statutPatron;
	if (!S || !S.niveau || ecran !== 'jeu') return;
	const txt = t(S.niveau === 2 ? 'statut.dernier' : 'statut.surveillance');
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(16);
	const w = textWidth(txt) + 28;
	const x = ZONE_SOMNO.x - 12 - w;
	noStroke();
	fill(S.niveau === 2 ? DS.erreur : DS.alerte);
	rect(x, H - 38, w, 32);
	fill(S.niveau === 2 ? '#FFFFFF' : DS.fond);
	textAlign(LEFT, CENTER);
	text(txt, x + 14, H - 22);
	textStyle(NORMAL);
	textAlign(LEFT, TOP);
}
