/* Nantes en régulation — prompt 175 : UNE fenêtre de paramètres à quatre sections (onglets), sur le modèle de
 * la fenêtre d'aide (aide.js : onglets, cartes, pagination, annonce « onglet n sur total »).
 *   Écran · Son · Accessibilité · Avancé
 * Elle remplace les trois fenêtres d'avant (Paramètres, « Accessibilité et reprise », « Options de jeu ») : tous
 * leurs réglages sont repris ici, sauf « Reprendre sur un autre appareil » (QR code), supprimé.
 * Chaque réglage est une carte : icône Lucide, nom, commande à droite (interrupteur, curseur, choix, bouton du DS),
 * explication dessous. Plus de raccourci chiffré par ligne : Tab ou ↑ ↓ parcourent la rangée d'onglets puis les
 * réglages, ← → changent d'onglet ou de valeur, Entrée / Espace changent le réglage, Échap ferme.
 * Lecteur d'écran : chaque réglage est annoncé avec son nom, son état (« Activé » / « Désactivé ») ou sa valeur.
 */
const PARAM = { onglet: 0, focus: -1, page: 0, pages: 1, debut: 0, vue: -9, suivre: false };
const ONGLETS_PARAM = [
	{ cle: 'ecran', titre: 'param.onglet.ecran', icone: 'monitor' },
	{ cle: 'son', titre: 'param.onglet.son', icone: 'volume-2' },
	{ cle: 'accessibilite', titre: 'acc.titre', icone: 'accessibility' },
	{ cle: 'avance', titre: 'optjeu.titre', icone: 'sliders-horizontal' },
];
// Une icône Lucide par option de la section « Avancé » (et par réglage des autres sections)
const ICONES_OPTIONS_JEU = {
	chaines: 'link',
	deblocages: 'lock-open',
	arbitrage: 'coins',
	traceDossier: 'file-text',
	pressionVisible: 'trending-up',
	deVisible: 'dices',
	eclairageJauges: 'lightbulb',
	npd: 'moon',
	deblocageApplis: 'layout-grid',
	toutDebloque: 'gamepad-2',
	somnolenceNecessaire: 'coffee',
};
const ORDRE_INTENSITE = [100, 50, 0];
const intensiteFeedback = () => (ORDRE_INTENSITE.includes(Confort.Reglages.intensiteFeedback) ? Confort.Reglages.intensiteFeedback : 100);
const libelleIntensite = () => t('acc.intensite.' + intensiteFeedback());
const volumeRegle = () => Math.round(Confort.Son.niveau() * 100);
// 18 / 28 : à « Taille du texte 130 % » le texte monte à 23,4 px et tient encore dans son interligne
const optionsDetailParam = (couleur) => ({ police: POLICE_TEXTE, taille: 18, interligne: 28, couleur: couleur || DS.blanc75 });
const optionsTitreParam = () => ({ police: POLICE_TEXTE, taille: 20, interligne: 28, couleur: DS.blanc, style: BOLD });
/** Largeur de la commande d'une carte (elle fixe la place laissée au nom du réglage, qui passe à la ligne au besoin) */
function largeurCommandeParam(it, l) {
	if (it.type === 'inter') return dsLargeurInterrupteur(it.etat(), it.libelle && it.libelle());
	if (it.type === 'curseur') return Math.min(430, l - 190);
	if (it.type === 'langue') return LANGUES.length * 92;
	if (it.type === 'couleur') return PALETTES_COULEUR.length * 50;
	// Bouton à la largeur de son libellé (même police que bouton() : 15 px gras), borné à 150–340 px
	textFont(POLICE_TEXTE);
	textStyle(BOLD);
	textSize(15);
	const lc = constrain(Math.ceil(textWidth(etatParam(it))) + 40, 150, 340);
	textStyle(NORMAL);
	return lc;
}

/** Ouvre la fenêtre sur une section donnée (0 à 3), sans retour au premier onglet */
function ouvrirParametres(onglet, page) {
	fenetre = 'parametres';
	PARAM.onglet = constrain(onglet || 0, 0, ONGLETS_PARAM.length - 1);
	PARAM.page = page || 0;
	PARAM.focus = -1;
	PARAM.debut = millis();
	PARAM.vue = frameCount;
	confirmerRemiseCarriere = 0;
	annoncer(annonceOngletParam(PARAM.onglet));
}
function annonceOngletParam(i) {
	const o = ONGLETS_PARAM[i];
	return t('param.onglet.annonce', { n: i + 1, total: ONGLETS_PARAM.length, titre: t(o.titre) }) + (o.cle === 'avance' ? '. ' + t('optjeu.note') : '');
}
function changerOngletParam(i) {
	if (i === PARAM.onglet) return;
	PARAM.onglet = i;
	PARAM.page = 0;
	PARAM.focus = -1;
	PARAM.debut = millis();
	confirmerRemiseCarriere = 0;
	Confort.Son.bip('choix');
	annoncer(annonceOngletParam(i));
}
function pageParam(sens) {
	const p = constrain(PARAM.page + sens, 0, PARAM.pages - 1);
	if (p === PARAM.page) return;
	PARAM.page = p;
	PARAM.focus = -1;
	PARAM.debut = millis();
	Confort.Son.bip('choix');
	annoncer(t('aide.page', { n: p + 1, total: PARAM.pages }));
}

/** Volume maître (0–100, pas de 10) : appliqué tout de suite, mémorisé, annoncé ; 0 % = son désactivé */
function reglerVolumeParam(v) {
	const avant = volumeRegle();
	const apres = Confort.Son.reglerVolume(v);
	if (apres !== avant) Confort.Son.bip('choix');
	annoncer(t('param.volume') + ' : ' + apres + ' %' + (apres === 0 ? '. ' + t('param.son') + ' : ' + t('commun.desactive') : ''));
}

/**
 * Réglages d'une section. Chaque entrée : { id, type, icone, titre, detail, … } avec
 *   activer()  : Entrée, Espace ou clic ;      regler(sens) : ← → (valeur précédente / suivante) ;
 *   etat()     : interrupteur activé ou non ;   valeur()     : texte ou nombre affiché ;
 *   annonce    : true → l'état est annoncé ici (les autres actions s'annoncent elles-mêmes).
 */
function reglagesParam(cle) {
	const R = Confort.Reglages;
	const bascule = (nom, icone, titre, detail) => ({ id: nom, type: 'inter', icone, titre, detail, etat: () => !!R[nom], activer: () => basculerReglage(nom), annonce: true });
	const choix = (id, icone, titre, detail, valeur, changer) => ({ id, type: 'choix', icone, titre, detail, valeur, activer: () => changer(1), regler: changer });
	const action = (id, icone, titre, detail, bouton, activer) => ({ id, type: 'action', icone, titre, detail, bouton, activer });
	if (cle === 'ecran')
		return [
			pleinEcranPossible() && { id: 'pleinEcran', type: 'inter', icone: pleinEcranActif() ? 'minimize' : 'maximize', titre: t('param.pleinEcran'), detail: t('param.pleinEcran.detail'), etat: pleinEcranActif, activer: basculerPleinEcran },
			{ id: 'langue', type: 'langue', icone: 'languages', titre: t('langue.titre'), detail: t('param.langue.detail'), valeur: () => (LANGUES.find((lg) => lg.code === Langue.actuelle) || LANGUES[0]).libelle, activer: () => Langue.suivante(), regler: () => Langue.suivante() },
			{ id: 'couleur', type: 'couleur', icone: 'palette', titre: t('couleur.titre'), valeur: () => t('couleur.' + Theme.id), activer: () => Theme.suivante(1), regler: (s) => Theme.suivante(s) },
			installationPossible() && action('installer', 'download', t('pwa.aide.titre'), t('pwa.aide.horsLigne'), () => t('pwa.installerCourt'), installerApplication),
		].filter(Boolean);
	if (cle === 'son')
		return [
			bascule('son', R.son ? 'volume-2' : 'volume-x', t('param.son'), t('param.son.detail')),
			{ id: 'volume', type: 'curseur', icone: 'sliders-horizontal', titre: t('param.volume'), detail: t('param.volume.detail'), valeur: volumeRegle, fixer: reglerVolumeParam, regler: (s) => reglerVolumeParam(volumeRegle() + 10 * s) },
			choix('musique', 'music', t('param.musique'), t('param.musiqueCredits'), () => t('musique.' + (R.musique || 'coquillage')), musiqueSuivante),
		];
	if (cle === 'accessibilite')
		return [
			bascule('reduireAnimations', 'pause', t('param.animations'), t('param.animations.detail')),
			bascule('contrasteRenforce', 'contrast', t('param.contraste')),
			Object.assign(choix('daltonisme', 'eye', t('acc.daltonisme'), '', () => t('acc.dalt.' + (R.daltonisme || 'normal')), changerDaltonisme), { extra: { h: 30, dessin: apercuPaletteParam } }),
			choix('tailleTexte', 'a-large-small', t('acc.taille'), '', () => (R.tailleTexte || 100) + ' %', changerTailleTexte),
			{ id: 'lectureFacile', type: 'inter', icone: 'book-open', titre: t('acc.lecture'), detail: t('acc.lecture.detail'), etat: () => !!R.lectureFacile, activer: basculerLectureFacile },
			choix('intensiteFeedback', 'vibrate', t('acc.intensite'), t('acc.intensite.detail'), libelleIntensite, changerIntensiteFeedback),
			{ id: 'micro', type: 'inter', icone: 'mic', titre: t('micro.reglage'), etat: () => R.micro !== false, activer: basculerMicroReglage },
			{ id: 'webcam', type: 'inter', icone: 'webcam', titre: t('webcam.reglage'), etat: () => !!(CAM.active || R.webcam), libelle: () => (!CAM.active && R.webcam ? t('webcam.etat.attente') : ''), activer: basculerWebcamReglage },
		];
	// Avancé : mode de jeu, options soumises au groupe (prompts 88 à 91), progression
	const g = Taches.grade();
	const confirmer = confirmerRemiseCarriere && millis() - confirmerRemiseCarriere < 5000;
	return [bascule('horsLigneForce', 'cloud-off', t('param.horsLigne'), t('param.horsLigne.detail')), bascule('defiChrono', 'timer', t('param.defiChrono'), t('param.defiChrono.detail'))]
		.concat(OPTIONS_JEU.map((nom) => ({ id: nom, type: 'inter', icone: ICONES_OPTIONS_JEU[nom] || 'settings', titre: t('optjeu.' + nom), detail: t('optjeu.' + nom + '.detail'), etat: () => !!R[nom], activer: () => basculerOptionJeu(nom) })))
		.concat([
			action('exporter', 'download', t('parametres.exporter.titre'), t('parametres.exporter.detail'), () => t('parametres.exporter'), () => Sauvegarde.exporter()),
			action('copier', 'copy', t('parametres.copier.titre'), t('parametres.copier.detail'), () => t('parametres.copier'), () => Sauvegarde.copier()),
			action('importer', 'upload', t('parametres.import.titre'), t('parametres.importer.detail'), () => t('parametres.importer'), () => Sauvegarde.ouvrirImport()),
			action('carriere', 'rotate-ccw', t('optjeu.carriere', { grade: t('grade.' + g.i), xp: g.xp }), confirmer ? t('optjeu.confirmer') : '', () => t(confirmer ? 'optjeu.confirmerBouton' : 'optjeu.remettre'), remettreCarriere),
			// Lecture seule : version du build (version.js, réécrit par scripts/generer-sw.mjs au build)
			{ id: 'version', type: 'info', icone: 'info', titre: t('param.version'), detail: t('param.version.detail'), valeur: () => (typeof VERSION_BUILD !== 'undefined' ? VERSION_BUILD : '—') },
		]);
}
/** État ou valeur d'un réglage, en toutes lettres (affichage de l'interrupteur, annonce) */
function etatParam(it) {
	if (it.type === 'inter') return (it.libelle && it.libelle()) || t(it.etat() ? 'commun.active' : 'commun.desactive');
	if (it.type === 'curseur') return it.valeur() + ' %';
	if (it.type === 'action') return it.bouton();
	return String(it.valeur());
}
const annonceParam = (it, avecDetail) => it.titre + ' : ' + etatParam(it) + (avecDetail && it.detail ? '. ' + it.detail : '');
function activerParam(i) {
	const it = reglagesParam(ONGLETS_PARAM[PARAM.onglet].cle)[i];
	if (!it) return;
	PARAM.focus = i;
	if (!it.activer) return;
	it.activer();
	if (it.annonce) annoncer(annonceParam(it));
}
function reglerParam(i, sens) {
	const it = reglagesParam(ONGLETS_PARAM[PARAM.onglet].cle)[i];
	if (!it || !it.regler) return false;
	PARAM.focus = i;
	it.regler(sens);
	return true;
}

/** Aperçu de la palette des jauges : bon / attention / critique (couleur ET mot) */
function apercuPaletteParam(x, y, l) {
	const p = palette();
	const pas = Math.min(180, l / 3);
	[['bon', p.bon], ['alerte', p.alerte], ['critique', p.critique]].forEach(([n, c], i) => {
		noStroke();
		fill(c);
		rect(x + i * pas, y + 6, 32, 16);
		dsTexte(t('acc.niveau.' + n), x + i * pas + 42, y + 4, 18, DS.blanc75, 'left');
	});
}

/** Carte d'un réglage, au format des cartes de l'aide : { h(l), dessin(x, y, l) } */
function carteParam(it, i) {
	const od = optionsDetailParam();
	const ot = optionsTitreParam();
	const lt = (l) => l - 54 - 16 - largeurCommandeParam(it, l) - 16;
	const he = (l) => Math.max(58, 16 + hauteurTexte(it.titre, lt(l), ot) + 12); // en-tête : nom (1 ou 2 lignes) et commande
	const hd = (l) => (it.detail ? hauteurTexte(it.detail, l - 32, od) + 6 : 0);
	const hauteur = (l) => he(l) + hd(l) + (it.extra ? it.extra.h + 6 : 0) + 8;
	return {
		i,
		h: hauteur,
		dessin(x, y, l) {
			const h = hauteur(l);
			const focus = PARAM.focus === i;
			noStroke();
			fill(focus ? DS.blanc15 : DS.blanc05);
			rect(x, y, l, h);
			noFill();
			stroke(focus ? DS.blanc : DS.blanc15);
			strokeWeight(2);
			rect(x + 1, y + 1, l - 2, h - 2);
			noStroke();
			if (focus) {
				fill(DS.primaire); // liseré de focus à gauche (couleur principale) en plus de la bordure blanche
				rect(x, y, 6, h);
			}
			iconeLucide(it.icone, x + 18, y + 17, 24, DS.blanc);
			// Commande, alignée à droite sur la première ligne du nom
			const xd = x + l - 16;
			const cy = y + 7;
			const lc = largeurCommandeParam(it, l);
			if (it.type === 'inter') dsInterrupteur(xd, cy, it.etat(), () => activerParam(i), it.libelle && it.libelle(), false);
			else if (it.type === 'curseur') dsCurseur(xd - lc, cy, lc, it.valeur(), (v) => ((PARAM.focus = i), it.fixer(v)), [t('param.volume.moins'), t('param.volume.plus')]);
			else if (it.type === 'langue') selecteurLangue(xd, cy, 44);
			else if (it.type === 'couleur') selecteurCouleur(xd, cy + 2, 40);
			else if (it.type === 'info') dsTexte(etatParam(it), xd, cy + 12, 18, DS.blanc75, 'right');
			else bouton(xd - lc, cy, lc, 44, etatParam(it), () => activerParam(i), false, true);
			dessinerTexte(it.titre, x + 54, y + 16, lt(l), ot);
			textStyle(NORMAL);
			if (it.detail) dessinerTexte(it.detail, x + 16, y + he(l), l - 32, od);
			if (it.extra) it.extra.dessin(x + 16, y + he(l) + hd(l), l - 32);
			textAlign(LEFT, TOP);
		},
	};
}

function fenetreParametres() {
	const portrait = typeof PORTRAIT !== 'undefined' && PORTRAIT.actif;
	const l = DS.fenetre.large;
	const h = 1040;
	const x = (L - l) / 2;
	const y = (H - h) / 2;
	// Ouverture : retour au premier onglet (la fenêtre n'était pas dessinée à l'image précédente)
	if (frameCount - PARAM.vue > 1) ouvrirParametres(0);
	PARAM.vue = frameCount;
	dsPanneau(x, y, l, h, t('param.titre'));
	// ——— Onglets (mêmes formes que l'aide), avec leur icône ———
	const n = ONGLETS_PARAM.length;
	const lo = (l - 96 - (n - 1) * 12) / n;
	const ho = portrait ? 96 : 60;
	ONGLETS_PARAM.forEach((o, i) => {
		const ox = x + 48 + i * (lo + 12);
		const oy = y + 80;
		const actif = i === PARAM.onglet;
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
		const lib = t(o.titre);
		textFont(POLICE_TEXTE);
		textStyle(BOLD);
		textAlign(LEFT, CENTER);
		zoneTexteDebut('ongletParam', ox, oy, lo, ho);
		ajusterTaille(lib, lo - 24 - 36, 22, 16);
		const tx = ox + (lo - textWidth(lib) - 36) / 2;
		fill(actif ? DS.fond : DS.blanc);
		text(lib, tx + 36, oy + ho / 2 - 2);
		zoneTexteFin();
		textStyle(NORMAL);
		iconeLucide(o.icone, tx, oy + ho / 2 - 13, 24, actif ? DS.fond : DS.blanc);
		boutons.push({ x: ox, y: oy, l: lo, h: ho, action: () => changerOngletParam(i) });
	});
	// ——— Cartes des réglages : deux colonnes, paginées si besoin ———
	const cx = x + 48;
	const cy = y + 80 + ho + 36;
	const cl = l - 96;
	const ch = y + h - 116 - cy;
	const items = reglagesParam(ONGLETS_PARAM[PARAM.onglet].cle);
	PARAM.focus = constrain(PARAM.focus, -1, items.length - 1);
	const pages = mettreEnPagesAide(items.map(carteParam), cx, cy, cl, ch, portrait ? 1 : 2, 10);
	PARAM.pages = pages.length;
	if (PARAM.suivre && PARAM.focus >= 0) {
		const p = pages.findIndex((pg) => pg.some((e) => e.c.i === PARAM.focus)); // la page suit le focus du clavier
		if (p >= 0) PARAM.page = p;
	}
	PARAM.suivre = false;
	PARAM.page = constrain(PARAM.page, 0, pages.length - 1);
	const k = reduireAnimations ? 1 : easeOut(constrain((millis() - PARAM.debut) / 220, 0, 1));
	push();
	drawingContext.globalAlpha = k;
	translate(0, (1 - k) * 10);
	pages[PARAM.page].forEach((p) => p.c.dessin(p.x, p.y, p.l));
	drawingContext.globalAlpha = 1;
	pop();
	textAlign(LEFT, TOP);
	// ——— Pied : pages à gauche, rappel du clavier (ou note de la section « Avancé »), fermeture à droite ———
	const by = y + h - 92;
	let fx = cx;
	if (PARAM.pages > 1) {
		bouton(cx, by, 64, 60, '', () => pageParam(-1), PARAM.page === 0, true);
		iconeLucide('arrow-left', cx + 20, by + 18, 24, PARAM.page === 0 ? 'rgba(255,255,255,0.5)' : '#FFFFFF');
		dsTexte(t('aide.page', { n: PARAM.page + 1, total: PARAM.pages }), cx + 84, by + 18, 20, DS.blanc75, 'left');
		bouton(cx + 240, by, 64, 60, '', () => pageParam(1), PARAM.page >= PARAM.pages - 1, true);
		iconeLucide('arrow-right', cx + 260, by + 18, 24, PARAM.page >= PARAM.pages - 1 ? 'rgba(255,255,255,0.5)' : '#FFFFFF');
		fx = cx + 336;
	}
	if (!portrait) {
		const note = t(ONGLETS_PARAM[PARAM.onglet].cle === 'avance' ? 'optjeu.note' : 'param.clavier');
		const fl = x + l - 48 - 240 - 32 - fx;
		const on = optionsDetailParam(DS.blanc50);
		dessinerTexte(note, fx, by + 30 - hauteurTexte(note, fl, on) / 2, fl, on);
	}
	bouton(x + l - 48 - 240, by, 240, 60, t('commun.fermer'), fermer, false, true);
	textAlign(LEFT, TOP);
}

/** Clavier des paramètres ; true si la fenêtre est ouverte (elle capte alors tout le clavier, F et L exceptés) */
function toucheParametres() {
	if (fenetre !== 'parametres') return false;
	const N = ONGLETS_PARAM.length;
	const items = reglagesParam(ONGLETS_PARAM[PARAM.onglet].cle);
	const n = items.length;
	if (keyCode === ESCAPE) return fermer(), true;
	if (keyCode === TAB || keyCode === UP_ARROW || keyCode === DOWN_ARROW) {
		// −1 = la rangée d'onglets, puis les réglages de la section, en boucle
		const sens = keyCode === UP_ARROW || (keyCode === TAB && keyIsDown(SHIFT)) ? -1 : 1;
		PARAM.focus = ((PARAM.focus + 1 + sens + n + 1) % (n + 1)) - 1;
		PARAM.suivre = true;
		annoncer(PARAM.focus < 0 ? annonceOngletParam(PARAM.onglet) : annonceParam(items[PARAM.focus], true));
		return true;
	}
	if (keyCode === LEFT_ARROW || keyCode === RIGHT_ARROW) {
		const sens = keyCode === LEFT_ARROW ? -1 : 1;
		if (!reglerParam(PARAM.focus, sens)) changerOngletParam((PARAM.onglet + sens + N) % N); // sans valeur à régler : onglet voisin
		return true;
	}
	if (keyCode === 33 || keyCode === 34) return pageParam(keyCode === 33 ? -1 : 1), true; // Page préc. / suiv.
	if (keyCode === ENTER || keyCode === RETURN || key === ' ') {
		if (PARAM.focus >= 0) activerParam(PARAM.focus);
		else if (n) {
			PARAM.focus = 0; // depuis la rangée d'onglets : entrer dans la section
			PARAM.suivre = true;
			annoncer(annonceParam(items[0], true));
		}
	}
	return true;
}
