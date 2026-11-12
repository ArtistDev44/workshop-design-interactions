/* Nantes en régulation — prompt 61 : appli « Données » de RégulOS (plein écran sur l'écran du PC).
 * Montre les données réellement utilisées par la partie, selon le mode (même convention que la météo du
 * prompt 49) : partie en direct → valeurs du moment ; semaine passée / hors ligne → archives de la semaine.
 * Chaque bloc : nom, valeur réelle, « en direct » / « archive du … » / « hors ligne → repli local », source,
 * licence, et un bouton qui ouvre l'URL de l'API (nouvel onglet). Lecture des valeurs déjà chargées (jamais
 * d'appel réseau dans draw) ; à l'ouverture, seul l'agenda du jour peut être demandé (au clic, délai borné).
 * Aucune incidence sur le jeu.
 */
const URL_GTFS = 'https://data.nantesmetropole.fr/explore/dataset/244400404_transports_commun_naolib_nantes_metropole_gtfs/';
const URL_METEO_DIRECT =
	'https://api.open-meteo.com/v1/forecast?latitude=47.2184&longitude=-1.5536&timezone=Europe%2FParis&daily=temperature_2m_min,temperature_2m_max,precipitation_sum,wind_gusts_10m_max&forecast_days=1';
const urlMeteoArchive = (debut, fin) =>
	'https://archive-api.open-meteo.com/v1/archive?latitude=47.2184&longitude=-1.5536&timezone=Europe%2FParis&daily=temperature_2m_min,temperature_2m_max,precipitation_sum,wind_gusts_10m_max&start_date=' +
	debut +
	'&end_date=' +
	fin;
const urlAgenda = (debut, fin) => TEL.url + '?limit=20&where=' + encodeURIComponent("date>=date'" + debut + "' AND date<=date'" + fin + "'");
const LICENCE_NM = 'Licence Ouverte (Nantes Métropole)';

ICONES_OS.push({ cle: 'donnees', nom: T('app.donnees'), dessin: (x, y, s) => iconeDonnees(x, y, s || 1) });

function iconeDonnees(x, y, s) {
	push();
	translate(x, y);
	scale(s);
	noStroke();
	fill(DS.fond);
	rect(0, 0, 80, 80);
	stroke(DS.blanc15);
	strokeWeight(2);
	noFill();
	rect(1, 1, 78, 78);
	noStroke();
	// Tableau de données : en-tête rouge, lignes blanches, colonne de valeurs verte
	fill(DS.primaire);
	rect(14, 16, 52, 10);
	fill(DS.blanc);
	for (let i = 0; i < 4; i++) rect(14, 32 + i * 9, 32, 5);
	fill(DS.succes);
	for (let i = 0; i < 4; i++) rect(50, 32 + i * 9, 16, 5);
	pop();
}

function ouvrirDonnees() {
	if (PC.etat === 'appli') PC.etat = 'os';
	PC.fenetre = 'donnees';
	const d = dateTelephone();
	if (Jeu.etat && Jeu.etat.mode === 'direct') chargerNotifications(d); // agenda du jour (cache, délai 6 s, repli)
	Confort.Son.bip('choix');
	annoncer(t('donnees.annonce', { mode: t(modeDonnees() === 'direct' ? 'donnees.mode.direct' : 'donnees.mode.archive') }));
}
const modeDonnees = () => (Jeu.etat && Jeu.etat.mode === 'direct' ? 'direct' : 'archive');
const horsLigne = () => Confort.Reglages.horsLigneForce || Jeu.enLigne === false;
const dFr = (iso) => (iso ? String(iso).slice(0, 10).split('-').reverse().join('/') : '—');
const nb = (v) => (v === null || v === undefined || Number.isNaN(v) ? '—' : nombreFr(v));

/** Blocs affichés, construits à partir des données déjà chargées par le jeu */
function blocsDonnees() {
	const b = [];
	if (modeDonnees() === 'direct') {
		const ds = (Jeu.etat && Jeu.etat.dossiers) || [];
		const h = Jeu.etat.horodatage ? new Date(Jeu.etat.horodatage) : null;
		b.push({
			titre: t('donnees.retards'),
			lignes: ds.length ? [t('donnees.retards.n', { n: ds.length })].concat(ds.slice(0, 4).map((d) => t('donnees.retards.ligne', { lignes: (d.lignes || []).join(', ') || '—', retard: d.retard }))) : [t('donnees.aucun')],
			statut: horsLigne() ? t('donnees.repli') : t('donnees.direct', { heure: h ? String(h.getHours()).padStart(2, '0') + ':' + String(h.getMinutes()).padStart(2, '0') : '—' }),
			source: 'GTFS-RT Naolib (passerelle Okina)',
			licence: LICENCE_NM,
			url: PXE_GTFSRT.FLUX.tripUpdates,
		});
		const m = Jeu.meteoActuelle;
		b.push({
			titre: t('donnees.meteo'),
			lignes: m ? [t('donnees.meteo.jour', { date: dFr(m.date), min: nb(m.temp_min), max: nb(m.temp_max), pluie: nb(m.pluie_mm), vent: nb(m.rafales_max) })] : [t('donnees.aucun')],
			statut: m ? t('donnees.direct', { heure: dFr(m.date) }) : t('donnees.repli'),
			source: 'Open-Meteo — prévision',
			licence: 'CC BY 4.0',
			url: URL_METEO_DIRECT,
		});
		const date = dateTelephone();
		const c = TEL.cache[date];
		b.push({
			titre: t('donnees.agenda'),
			lignes: !c ? [t('tel.chargement')] : c.notifs.length ? c.notifs.slice(0, 4).map((n) => '« ' + n.titre + ' »' + (n.lieu ? ' — ' + n.lieu : '')) : [t('donnees.aucun')],
			statut: c && c.source === 'api' ? t('donnees.direct', { heure: dFr(date) }) : t('donnees.repli'),
			source: 'Agenda des événements de Nantes Métropole',
			licence: LICENCE_NM,
			url: urlAgenda(date, date),
		});
	} else {
		const s = Jeu.etat.semaine || (Jeu.fallback && { lundi: Jeu.fallback.semaine.lundi, dimanche: Jeu.fallback.semaine.dimanche, dossiers: Jeu.fallback.dossiers || [], evenements: [], meteo: Jeu.fallback.meteo || [] });
		const periode = t('donnees.archive', { debut: dFr(s.lundi), fin: dFr(s.dimanche) });
		const parType = {};
		(s.dossiers || []).forEach((d) => (parType[d.type] = (parType[d.type] || 0) + 1));
		b.push({
			titre: t('donnees.incidents'),
			lignes: [t('donnees.incidents.n', { n: (s.dossiers || []).length })].concat(Object.keys(parType).map((k) => tSi('type.' + k, k) + ' : ' + parType[k])),
			statut: periode,
			source: 'Changelog daté du GTFS Naolib',
			licence: LICENCE_NM,
			url: URL_GTFS,
		});
		b.push({
			titre: t('donnees.meteoSemaine'),
			lignes: (s.meteo || []).slice(0, 7).map((m) => t('donnees.meteo.jour', { date: dFr(m.date), min: nb(m.temp_min), max: nb(m.temp_max), pluie: nb(m.pluie_mm), vent: nb(m.rafales_max) })),
			statut: periode + ' · ' + t('donnees.journaliere'),
			source: 'Open-Meteo — archive ERA5',
			licence: 'CC BY 4.0',
			url: urlMeteoArchive(s.lundi, s.dimanche),
		});
		const ev = (s.evenements || []).filter((e) => String(e.nature).split(',').length <= 3);
		b.push({
			titre: t('donnees.agendaSemaine'),
			lignes: [t('donnees.agenda.n', { n: (s.evenements || []).length })].concat(ev.slice(0, 3).map((e) => dFr(e.date) + ' · « ' + String(e.texte_source).split(' — ')[0] + ' »')),
			statut: periode,
			source: 'Agenda des événements de Nantes Métropole',
			licence: LICENCE_NM,
			url: urlAgenda(s.lundi, s.dimanche),
		});
	}
	// La Loire : le jeu ne garde pas d'archive, c'est toujours la valeur du moment (ou le repli figé)
	b.push({
		titre: t('donnees.loire'),
		lignes: [t('donnees.loire.h', { h: nb(Math.round(LOIRE.hauteur * 100) / 100) }), LOIRE.source === 'api' ? t('donnees.loire.date', { date: dFr(LOIRE.date) }) : t('donnees.loire.repli')].concat(modeDonnees() === 'archive' ? [t('donnees.loire.pasArchive')] : []),
		statut: LOIRE.source === 'api' ? t('donnees.direct', { heure: dFr(LOIRE.date) }) : t('donnees.repli'),
		source: "Hub'Eau — hydrométrie, station M800001010",
		licence: t('donnees.licenceHubeau'),
		url: LOIRE.url,
	});
	return b;
}

/** Appli plein écran (sur tout l'écran du PC, barre des tâches comprise), fermeture par la croix ou Échap */
function dessinerAppliDonnees(z) {
	if (z) return dessinerBlocsDonnees(z); // prompt 103 : vue intégrée de l'appli principale (sans bandeau rouge ni croix)
	noStroke();
	fill(DS.fond);
	rect(0, 0, L, H);
	fill(DS.primaire);
	rect(0, 0, L, 72);
	dsTitre(t('app.titre.donnees'), 28, 18, 32, DS.blanc, 'left');
	noStroke();
	textFont(POLICE_DONNEES);
	textSize(22);
	textAlign(RIGHT, CENTER);
	fill('#ffffff');
	text(modeDonnees() === 'direct' ? t('donnees.mode.direct') : t('donnees.mode.archive'), L - 110, 36);
	// Croix de fermeture
	const cx = L - 62;
	const survol = mouseX >= cx && mouseX <= cx + 44 && mouseY >= 14 && mouseY <= 58;
	fill(survol ? DS.fond : DS.primaire);
	stroke(DS.blanc);
	strokeWeight(3);
	rect(cx, 14, 44, 44);
	line(cx + 13, 27, cx + 31, 45);
	line(cx + 31, 27, cx + 13, 45);
	noStroke();
	boutons.push({ x: cx, y: 14, l: 44, h: 44, action: fermerFenetreApp });
	cibleGuide('fermerDonnees', cx, 14, 44, 44);
	textAlign(LEFT, TOP);
	textFont(POLICE_TEXTE);
	textSize(20);
	fill(DS.blanc75);
	text(t('donnees.intro'), 28, 88, L - 56, 60);
	// Blocs : deux colonnes
	const blocs = blocsDonnees();
	const bl = (L - 28 * 3) / 2;
	const bh = (H - 160 - 28 * 2) / 2;
	blocs.forEach((b, i) => {
		const x = 28 + (i % 2) * (bl + 28);
		const y = 150 + Math.floor(i / 2) * (bh + 28);
		dsPanneau(x, y, bl, bh, b.titre);
		noStroke();
		textAlign(LEFT, TOP);
		textFont(POLICE_DONNEES);
		textSize(20);
		fill(b.statut === t('donnees.repli') ? DS.alerte : DS.succes);
		text(b.statut, x + 24, y + 70, bl - 48, 30);
		textFont(POLICE_TEXTE);
		textSize(21);
		textLeading(26); // 7 jours de météo tiennent dans le bloc
		fill(DS.blanc);
		text(b.lignes.join('\n'), x + 24, y + 106, bl - 48, bh - 222);
		textFont(POLICE_DONNEES);
		textSize(20);
		fill(DS.blanc75);
		text(t('donnees.source', { source: b.source, licence: b.licence }), x + 24, y + bh - 118, bl - 48, 56);
		dsBouton(x + 24, y + bh - 60, 360, 44, t('donnees.ouvrir'), () => ouvrirLienApi(b.url), 'contour');
	});
}
/** Prompt 103 : les mêmes blocs dans une zone (une ligne d'intro, mode en texte secondaire, 2 × 2 blocs) */
function dessinerBlocsDonnees(z) {
	dsTexte(t('donnees.intro') + ' · ' + (modeDonnees() === 'direct' ? t('donnees.mode.direct') : t('donnees.mode.archive')), z.x, z.y, 18, DS.blanc75, 'left', z.l);
	const blocs = blocsDonnees();
	const e = 24;
	const y0 = z.y + 76;
	const bl = (z.l - e) / 2;
	const bh = (z.h - 76 - e) / 2;
	blocs.forEach((b, i) => {
		const x = z.x + (i % 2) * (bl + e);
		const y = y0 + Math.floor(i / 2) * (bh + e);
		noStroke();
		fill(DS.blanc05);
		rect(x, y, bl, bh);
		dsTexte(String(b.titre), x + 20, y + 16, 20, DS.blanc, 'left');
		dsTexte(b.statut, x + 20, y + 48, 16, b.statut === t('donnees.repli') ? DS.alerte : DS.succesClair, 'left');
		// prompt 103 : autant de lignes que la place le permet (texte rendu à 20 px dans l'appli), « … » sinon
		const maxL = Math.max(1, Math.floor((bh - 200) / 26));
		const ls = [];
		b.lignes.forEach((ln) => ls.push(...couperLignes(String(ln), bl - 40, DS.policeTexte, 20)));
		dsTexte(ls.length > maxL ? ls.slice(0, maxL - 1).concat('…').join('\n') : ls.join('\n'), x + 20, y + 80, 18, DS.blanc75, 'left');
		dsTexte(t('donnees.source', { source: b.source, licence: b.licence }), x + 20, y + bh - 112, 16, DS.blanc50, 'left', bl - 40); // 2 lignes au plus (20 px rendus)
		dsBouton(x + 20, y + bh - 50, 300, 40, t('donnees.ouvrir'), () => ouvrirLienApi(b.url), 'fantome');
	});
}
function ouvrirLienApi(url) {
	try {
		window.open(url, '_blank', 'noopener');
	} catch (e) {}
	annoncer(t('donnees.lienOuvert'));
}
