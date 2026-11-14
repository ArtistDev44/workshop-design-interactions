// Jeux de données retenus pour la page « Nantes en direct » (prompt 11).
// Choix et budget réseau : contexte/audit-api-open-data-nantes.md (§ 3 et § 5).
// Fichier partagé par le site (navigateur) et par scripts/snapshot.mjs (Node) : JavaScript pur.

const MIN = 60 * 1000;
const HEURE = 60 * MIN;

/** @typedef {{ label: string, valeur: number, max?: number, couleur?: string, detail?: string }} Ligne */

export const DATASETS = [
	// ——— Temps réel (T1–T5) ———
	{
		id: '244400404_parkings-publics-nantes-disponibilites',
		code: 'T1',
		titre: 'Places libres dans les parkings publics',
		producteur: 'Nantes Métropole',
		licence: 'ODbL', // prompt 210 : métadonnées de l'API, 2026-11-14
		frequence: 'Temps réel (quelques minutes)',
		mode: 'live',
		refreshMs: 5 * MIN,
		ttlMs: 5 * MIN,
		select: 'grp_nom,grp_disponible,grp_exploitation,grp_horodatage',
		where: 'grp_exploitation > 0',
		orderBy: 'grp_nom',
		limit: 40,
		viz: 'barres',
		mapping:
			'Le remplissage des parkings du centre (dont FEYDEAU, Commerce, Graslin) mesure la pression de la ville sur les sites du corpus.',
		/** @returns {Ligne[]} */
		lignes: (r) =>
			r.map((x) => ({
				label: x.grp_nom,
				valeur: Number(x.grp_disponible),
				max: Number(x.grp_exploitation),
				detail: `${x.grp_disponible} / ${x.grp_exploitation} places libres`,
			})),
	},
	{
		id: '244400404_disponibilite-temps-reel-velos-libre-service-naolib-nantes-metropole',
		code: 'T2',
		titre: 'Vélos libre-service Naolib : stations les plus vides',
		producteur: 'Nantes Métropole',
		licence: 'ODbL', // prompt 210 : métadonnées de l'API, 2026-11-14
		frequence: 'Temps réel (quelques minutes)',
		mode: 'live',
		refreshMs: 5 * MIN,
		ttlMs: 5 * MIN,
		select: 'name,available_bikes,bike_stands,last_update',
		where: 'bike_stands > 0',
		orderBy: 'available_bikes asc, name',
		limit: 15,
		viz: 'barres',
		mapping:
			'120 stations qui se vident et se remplissent : un rythme urbain lisible, matière à une grammaire de modules ou de pulsation.',
		lignes: (r) =>
			r.map((x) => ({
				label: x.name,
				valeur: Number(x.available_bikes),
				max: Number(x.bike_stands),
				detail: `${x.available_bikes} vélo(s) sur ${x.bike_stands} bornes`,
			})),
	},
	{
		id: '244400404_fluidite-axes-routiers-nantes-metropole',
		code: 'T3',
		titre: 'Fluidité des axes routiers',
		producteur: 'Nantes Métropole',
		licence: 'ODbL',
		frequence: 'Temps réel (environ 5 min)',
		mode: 'live',
		refreshMs: 6 * MIN,
		ttlMs: 6 * MIN,
		select: 'etat_trafic,count(*) as n',
		groupBy: 'etat_trafic',
		orderBy: 'n desc',
		limit: 10,
		viz: 'tableau',
		mapping: 'La répartition des 889 tronçons par état de trafic donne la vitesse de la ville à cet instant.',
		lignes: (r) => r.map((x) => ({ label: x.etat_trafic || 'Non renseigné', valeur: Number(x.n) })),
	},
	{
		id: '323266205_indice-atmo-nantes-metropole',
		code: 'T4',
		titre: 'Qualité de l’air (indice ATMO) à Nantes',
		producteur: 'Air Pays de la Loire',
		licence: 'ODbL',
		frequence: 'Quotidienne',
		mode: 'live',
		refreshMs: 6 * HEURE,
		ttlMs: 6 * HEURE,
		select: 'date_ech,lib_qual,coul_qual,code_qual',
		where: "lib_zone = 'Nantes'",
		orderBy: 'date_ech desc',
		limit: 2,
		viz: 'pastilles',
		mapping: 'L’indice fournit sa propre couleur officielle : un paramètre de couleur justifié par la source, sans rien inventer.',
		lignes: (r) =>
			r.map((x) => ({
				label: x.date_ech,
				valeur: Number(x.code_qual),
				couleur: x.coul_qual,
				detail: x.lib_qual,
			})),
	},
	{
		id: '323266205_alerte-pollens-nantes',
		code: 'T5',
		titre: 'Alerte pollens à Nantes',
		producteur: 'Air Pays de la Loire',
		licence: 'ODbL',
		frequence: 'Quotidienne',
		mode: 'live',
		refreshMs: 6 * HEURE,
		ttlMs: 6 * HEURE,
		select: 'name,group,lib_etat,state',
		orderBy: 'state desc, name',
		limit: 20,
		viz: 'liste',
		mapping: 'Les espèces qui émettent aujourd’hui se croisent avec le patrimoine arboré : quels arbres « s’activent ».',
		lignes: (r) =>
			r.map((x) => ({ label: x.name, valeur: Number(x.state), detail: `${x.group} · ${x.lib_etat}` })),
	},

	// ——— Patrimoine (P1–P4) : jamais en direct, instantané d'agrégat au build ———
	{
		id: '244400404_patrimoine-arbore-nantes-metropole',
		code: 'P1',
		titre: 'Patrimoine arboré : genres les plus présents',
		producteur: 'Nantes Métropole',
		licence: 'Licence Ouverte',
		frequence: 'Annuelle',
		mode: 'snapshot',
		refreshMs: 0,
		ttlMs: 0,
		select: 'lib_genre,count(*) as n',
		where: 'lib_genre is not null',
		groupBy: 'lib_genre',
		orderBy: 'n desc',
		limit: 10,
		viz: 'barres',
		mapping: 'Source patrimoniale du corpus : 124 000 arbres réels, dont on lit ici la distribution par genre.',
		lignes: (r) => r.map((x) => ({ label: x.lib_genre, valeur: Number(x.n), detail: `${x.n} arbres` })),
	},
	{
		id: '244400404_inventaire-collections-musee-arts-nantes',
		code: 'P2',
		titre: 'Collections du Musée d’arts : œuvres par domaine',
		producteur: 'Nantes Métropole',
		licence: 'Licence Ouverte',
		frequence: 'Annuelle',
		mode: 'snapshot',
		refreshMs: 0,
		ttlMs: 0,
		select: 'domaine,count(*) as n',
		where: 'domaine is not null',
		groupBy: 'domaine',
		orderBy: 'n desc',
		limit: 10,
		viz: 'barres',
		mapping: 'Inventaire local, source institutionnelle : la structure d’une collection avant toute forme.',
		lignes: (r) => r.map((x) => ({ label: x.domaine, valeur: Number(x.n), detail: `${x.n} œuvres` })),
	},
	{
		id: '244400404_occupation-sol-2022-niveau-3-nantes-metropole',
		code: 'P3',
		titre: 'Occupation du sol en 2022 : surfaces dominantes',
		producteur: 'Nantes Métropole',
		licence: 'Licence Ouverte',
		frequence: 'Ponctuelle (série 1952 → 2022)',
		mode: 'snapshot',
		refreshMs: 0,
		ttlMs: 0,
		select: 'l_niveau,sum(surface) as m2',
		groupBy: 'l_niveau',
		orderBy: 'm2 desc',
		limit: 10,
		viz: 'barres',
		mapping: 'La série 1952 → 2022 rend lisible la transformation du territoire, dont les anciens chantiers navals.',
		lignes: (r) =>
			r.map((x) => ({
				label: x.l_niveau,
				valeur: Math.round(Number(x.m2) / 10000),
				detail: `${Math.round(Number(x.m2) / 10000).toLocaleString('fr-FR')} ha`,
			})),
	},
	{
		id: '244400404_parcs-jardins-nantes',
		code: 'P4',
		titre: 'Parcs et jardins de Nantes par code postal',
		producteur: 'Ville de Nantes',
		licence: 'Licence Ouverte',
		frequence: 'Annuelle',
		mode: 'snapshot',
		refreshMs: 0,
		ttlMs: 0,
		select: 'code_postal,count(*) as n',
		groupBy: 'code_postal',
		orderBy: 'n desc',
		limit: 10,
		viz: 'barres',
		mapping: 'Complète le patrimoine arboré à une échelle lisible : 135 lieux de nature en ville.',
		lignes: (r) => r.map((x) => ({ label: `Nantes ${x.code_postal}`, valeur: Number(x.n), detail: `${x.n} parcs` })),
	},
];

export const API_BASE = 'https://data.nantesmetropole.fr/api/explore/v2.1/catalog/datasets';

/** URL de l'API Explore v2.1 pour un jeu : seuls les champs utiles sont demandés. */
export function urlDataset(ds) {
	const params = new URLSearchParams({ select: ds.select, limit: String(ds.limit) });
	if (ds.where) params.set('where', ds.where);
	if (ds.groupBy) params.set('group_by', ds.groupBy);
	if (ds.orderBy) params.set('order_by', ds.orderBy);
	return `${API_BASE}/${ds.id}/records?${params}`;
}
