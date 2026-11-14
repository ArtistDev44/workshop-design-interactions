/* Nantes en régulation — prompt 61 : appli « Données » de RégulOS (prompt 183 : vue de l'appli principale seulement).
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
	PC.etat = 'os';
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

/** Vue « Données » de l'appli principale (prompt 103 ; prompt 183 : plus de version plein écran hors de l'appli) */
function dessinerAppliDonnees(z) {
	dessinerBlocsDonnees(z);
}
/** Prompt 103 : les mêmes blocs dans une zone (une ligne d'intro, mode en texte secondaire, 2 × 2 blocs) */
function dessinerBlocsDonnees(z) {
	const intro = t('donnees.intro') + ' · ' + (modeDonnees() === 'direct' ? t('donnees.mode.direct') : t('donnees.mode.archive'));
	dsTexte(intro, z.x, z.y, 18, DS.blanc75, 'left', z.l);
	const blocs = blocsDonnees();
	const e = 24;
	// Prompt 205 : en portrait, deux colonnes de 620 px dessinées côte à côte (la vue et sa suite, GEO_PORTRAIT.suite),
	// que le canevas portrait empile : deux blocs par colonne, pleine largeur
	const portrait = typeof PORTRAIT !== 'undefined' && PORTRAIT.actif && typeof GEO_PORTRAIT !== 'undefined';
	const hIntro = portrait ? couperLignes(intro, z.l, DS.policeTexte, 18).length * 26 + 20 : 76;
	const y0 = z.y + hIntro;
	const bl = portrait ? z.l : (z.l - e) / 2;
	const bh = portrait ? (z.h - hIntro - e) / 2 : (z.h - 76 - e) / 2;
	const S = portrait ? GEO_PORTRAIT.suite : null;
	const bhS = portrait ? (S.h - e) / 2 : bh;
	blocs.forEach((b, i) => {
		const x = portrait ? (i < 2 ? z.x : S.x) : z.x + (i % 2) * (bl + e);
		const y = portrait ? (i < 2 ? y0 + i * (bh + e) : S.y + (i - 2) * (bhS + e)) : y0 + Math.floor(i / 2) * (bh + e);
		const hb = portrait && i >= 2 ? bhS : bh; // hauteur du bloc (la suite a sa propre hauteur)
		noStroke();
		fill(DS.blanc05);
		rect(x, y, bl, hb);
		dsTexte(String(b.titre), x + 20, y + 16, 20, DS.blanc, 'left');
		dsTexte(portrait ? couperLargeurCarte(b.statut, bl - 40, 20) : b.statut, x + 20, y + 48, 16, b.statut === t('donnees.repli') ? DS.alerte : DS.succesClair, 'left');
		// Prompt 204 : la source (licence comprise) prend la hauteur de ses lignes réelles, juste au-dessus du bouton —
		// à 3 lignes (Hub'Eau), elle débordait sur « Ouvrir l'API »
		const src = t('donnees.source', { source: b.source, licence: b.licence });
		const nSrc = couperLignes(src, bl - 40, DS.policeTexte, 16).length;
		const ySrc = y + hb - 62 - nSrc * 26; // 26 px : interligne du texte rendu à 20 px
		// prompt 103 : autant de lignes que la place le permet (texte rendu à 20 px dans l'appli), « … » sinon
		const maxL = Math.max(1, Math.floor((ySrc - 12 - (y + 80)) / 26));
		const ls = [];
		b.lignes.forEach((ln) => ls.push(...couperLignes(String(ln), bl - 40, DS.policeTexte, 20)));
		dsTexte(ls.length > maxL ? ls.slice(0, maxL - 1).concat('…').join('\n') : ls.join('\n'), x + 20, y + 80, 18, DS.blanc75, 'left');
		dsTexte(src, x + 20, ySrc, 16, DS.blanc50, 'left', bl - 40);
		dsBouton(x + 20, y + hb - 50, 300, 40, t('donnees.ouvrir'), () => ouvrirLienApi(b.url), 'fantome', false, true); // prompt 211 : « ↗ » seul, sans « › »
	});
}
function ouvrirLienApi(url) {
	try {
		window.open(url, '_blank', 'noopener');
	} catch (e) {}
	annoncer(t('donnees.lienOuvert'));
}
