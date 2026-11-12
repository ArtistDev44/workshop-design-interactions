/* Nantes en régulation — prompt 103 : une seule appli sur le PC. Les autres (Patron, Community, Journal, Données)
 * deviennent des VUES de l'appli principale, choisies dans un menu à gauche (x 40 → 168, réservé au prompt 102).
 * - Le logo du jeu (en haut du menu) = la carte (accueil). Puis la messagerie du patron (en premier), Community,
 *   Journal de bord, Données.
 * - Une vue intégrée garde l'état d'aujourd'hui : PC.fenetre = 'patron' | 'community' | 'journal' | 'donnees', PC.etat
 *   reste 'os' (le clavier des applis est inchangé) ; seul le DESSIN change : dans la fenêtre de l'appli, sous le
 *   bandeau, à droite du menu — sans cadre, sans croix, sans grand titre (le menu dit où l'on est).
 * - Badges : seulement ce qui est À FAIRE (badgeIcone, prompt 101 règle 6), jamais sur l'entrée active.
 * - Mobile portrait : le menu devient une barre d'onglets en bas (dessinée sous le contenu, y 1036).
 */
const VUES_APP = ['patron', 'community', 'journal', 'donnees'];
const ENTREES_MENU = ['signalements', 'patron', 'community', 'journal', 'donnees'];
const ZONE_VUE = { x: 184, y: 132, l: 1696, h: 900 };
const MENU_FOCUS = { actif: false }; // Tab dans le menu (Entrée ouvre l'entrée focalisée)
const MENU_BAS = { x: 40, y: 1036, l: 1840, h: 40 }; // portrait : barre d'onglets

/** Une vue intégrée est affichée (au lieu d'une fenêtre posée sur le bureau) */
function vueIntegree() {
	return typeof ecran !== 'undefined' && ecran === 'jeu' && VUES_APP.includes(PC.fenetre) && (PC.etat === 'os' || PC.etat === 'appli') && typeof phase !== 'undefined' && phase !== 'fin';
}
/** Entrée active du menu */
const entreeActive = () => (vueIntegree() ? PC.fenetre : 'signalements');

function dessinerMenuApp() {
	if (typeof phase !== 'undefined' && phase === 'fin') return;
	const portrait = typeof PORTRAIT !== 'undefined' && PORTRAIT.actif;
	const M = MENU_APP;
	noStroke();
	fill(DS.fond);
	rect(M.x, M.y, M.l, M.h);
	const n = ENTREES_MENU.length;
	ENTREES_MENU.forEach((cle, k) => {
		const i = ICONES_OS.findIndex((ic) => ic.cle === cle);
		if (i < 0) return;
		const ic = ICONES_OS[i];
		const r = portrait ? { x: MENU_BAS.x + k * (MENU_BAS.l / n), y: MENU_BAS.y, l: MENU_BAS.l / n - 6, h: MENU_BAS.h } : { x: M.x, y: M.y + k * 112, l: M.l, h: 104 };
		const actif = entreeActive() === cle;
		const verrou = cle !== 'signalements' && typeof appliDebloquee === 'function' && !appliDebloquee(cle);
		const survol = mouseX >= r.x && mouseX <= r.x + r.l && mouseY >= r.y && mouseY <= r.y + r.h;
		noStroke();
		if (actif || survol) {
			fill(actif ? DS.blanc15 : DS.blanc05);
			rect(r.x, r.y, r.l, r.h);
		}
		if (actif) {
			fill(DS.primaire); // le seul rouge du menu
			if (portrait) rect(r.x, r.y + r.h - 4, r.l, 4);
			else rect(r.x, r.y, 4, r.h);
		}
		const lib = cle === 'signalements' ? t('menuApp.carte') : t('menuApp.' + cle);
		if (portrait) dsTexte(couperLargeurCarte(lib, r.l - 12, 16), r.x + r.l / 2, r.y + 10, 16, actif ? DS.blanc : DS.blanc75, 'center');
		else {
			push();
			if (verrou) drawingContext.globalAlpha = 0.4;
			if (cle === 'signalements' && typeof dessinerLogoPXE === 'function') dessinerLogoPXE(r.x + (r.l - 56) / 2, r.y + 12, 56);
			else ic.dessin(r.x + (r.l - 80 * 0.7) / 2 + (typeof decalTremble === 'function' ? decalTremble(cle) : 0), r.y + 10, 0.7);
			pop();
			dsTexte(couperLargeurCarte(lib, r.l - 8, 20), r.x + r.l / 2, r.y + 76, 16, actif ? DS.blanc : DS.blanc75, 'center'); // 16 px demandés, 20 px rendus dans l'appli (taille minimale)
			if (verrou && typeof voileVerrou === 'function') voileVerrou(cle, r.x, r.y, r.l, r.h);
		}
		// Focus clavier (Tab dans le menu, prompt 103) : double bordure du DS
		if (PC.etat === 'os' && PC.selection === i && vueIntegree() && MENU_FOCUS.actif) {
			noFill();
			stroke(DS.blanc);
			strokeWeight(2);
			rect(r.x + 2, r.y + 2, r.l - 4, r.h - 4);
			noStroke();
		}
		const b = !actif && !verrou && typeof badgeIcone === 'function' ? badgeIcone(cle) : '';
		if (b) dsBadge(r.x + r.l - (portrait ? 30 : 28), r.y + 8, b, 'erreur');
		boutons.push({ x: r.x, y: r.y, l: r.l, h: r.h, action: () => ouvrirEntreeMenu(cle) });
		if (k === 1) cibleGuide('iconesOS', M.x, M.y + 112, M.l, 4 * 112); // prompt 37 : le guide montre le menu
	});
}
function ouvrirEntreeMenu(cle) {
	MENU_FOCUS.actif = false;
	const i = ICONES_OS.findIndex((ic) => ic.cle === cle);
	if (i < 0) return;
	if (cle !== 'signalements' && !appliDebloquee(cle)) return refuserAppliVerrouillee(cle);
	if (entreeActive() === cle) return;
	if (cle === 'signalements') {
		PC.fenetre = null;
		PC.etat = 'appli';
		Confort.Son.bip('choix');
	} else ouvrirIconeOS(i);
	annoncer(t('menuApp.annonce', { vue: cle === 'signalements' ? t('menuApp.carte') : t('menuApp.' + cle) }));
}

/** Contenu de la vue intégrée, à droite du menu et sous le bandeau */
function dessinerVueApp() {
	const Z = ZONE_VUE;
	noStroke();
	fill(DS.fond);
	rect(Z.x, Z.y, Z.l, Z.h);
	const l = Math.min(Z.l - 48, 1440); // largeur de lecture
	const z = { x: Z.x + (Z.l - l) / 2, y: Z.y + 24, l, h: Z.h - 48 };
	if (Jeu.nonLus && Jeu.nonLus[PC.fenetre] !== undefined) Jeu.nonLus[PC.fenetre] = 0; // lu
	if (PC.fenetre === 'patron') appPatron(z);
	else if (PC.fenetre === 'community') appCommunity(z);
	else if (PC.fenetre === 'journal') appJournal(z);
	else if (PC.fenetre === 'donnees') dessinerAppliDonnees(z);
}
