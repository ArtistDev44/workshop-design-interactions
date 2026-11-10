// Test de difficulté (10/11/2026) : simule 4 profils de joueur sur les 3 semaines réelles, dans Chromium (Playwright,
// hors dépendances du site). Lancer le site en local (python3 -m http.server 8765 dans site/public), puis :
// node test-difficulte.mjs   (base.mjs : ouverture de la page, voir jeu/36-tests-difficulte.md). Résultats : jeu/36.
import { ouvrir } from './base.mjs';
const { b, page, erreurs } = await ouvrir();
const CONFIGS = JSON.parse(process.argv[2] || '[null]');
for (const cfg of CONFIGS) {
const res = await page.evaluate(async (cfg) => {
  if (cfg) for (const [a, base] of Object.entries(cfg.effets || {})) Jeu.REGLAGES.effets[a].base = base;
  const ACTIONS = ['devier', 'retenir', 'renfort', 'rien'];
  const sortie = [];
  const semaines = Jeu.semainesProposees().slice(0, cfg && cfg.une ? 1 : 3);
  for (const s of semaines) {
    for (const profil of ['expert', 'moyen', 'passif', 'pression']) {
      for (let essai = 0; essai < (profil === 'moyen' || profil === 'pression' ? 5 : 1); essai++) {
        await Jeu.chargerSemaine(s.lundi);
        Jeu.nouvellePartie();
        let rnd = 12345 + essai * 777;
        const alea = () => ((rnd = (rnd * 1103515245 + 12345) >>> 0) / 4294967296);
        let jourActuel = Jeu.jourCourant() && Jeu.jourCourant().date;
        let n = 0;
        while (Jeu.dossierCourant() && !Jeu.terminee && n < 100) {
          n++;
          const d = Jeu.dossierCourant();
          if (d.date !== jourActuel) { Jeu.finDeJourneeTactique(); Jeu.journeeSuivante(); jourActuel = Jeu.jourCourant() && Jeu.jourCourant().date; }
          const p = Jeu.declencherPlainte(Jeu.index);
          const src = d.contradiction ? (profil === 'expert' ? d.contradiction.bonne : profil === 'moyen' ? (alea() < 0.5 ? 'a' : 'b') : null) : null;
          let action;
          const pRate = { 60: 0.05, 30: 0.15, 15: 0.3 }[s.compteur_s] || 0.15; // hypothèse : part de dossiers ratés faute de temps
          if (profil === 'passif' || (profil === 'pression' && alea() < pRate)) action = 'temps';
          else if (profil === 'moyen') action = ACTIONS[Math.floor(alea() * 4)];
          else if (profil === 'moyen') {} else {
            // expert : essaie chaque action sur une copie et garde la meilleure (somme des jauges)
            const t0 = millis();
            const base = JSON.stringify(Jeu.instantane(t0));
            let meilleur = null, meilleurScore = -1;
            for (const a of ACTIONS) {
              const s0 = JSON.parse(base);
              Jeu.restaurerInstantane(Object.assign(s0, { historique: Jeu.historique.slice(), evenementsJournee: Jeu.evenementsJournee.slice() }), t0);
              Jeu.decider(a, src);
              const sc = Jeu.score();
              if (sc > meilleurScore) { meilleurScore = sc; meilleur = a; }
            }
            const s0 = JSON.parse(base);
            Jeu.restaurerInstantane(Object.assign(s0, { historique: Jeu.historique.slice(), evenementsJournee: Jeu.evenementsJournee.slice() }), t0);
            action = meilleur;
          }
          Jeu.decider(action, src);
          if (p && profil !== 'passif') {
            const i = profil === 'expert' || profil === 'pression' ? p.def.reponses.findIndex((r) => r.bonne) : Math.floor(alea() * p.def.reponses.length);
            Jeu.repondrePlainte(Jeu.plaintes.find((x) => x.index === p.index), i);
          }
        }
        Jeu.finDeJourneeTactique();
        sortie.push({ semaine: s.lundi, niveau: s.niveau, profil, essai, dossiers: Jeu.paquet.length, jauges: Object.assign({}, Jeu.jauges), score: Jeu.score(), fin: Jeu.typeFin() });
      }
    }
  }
  return sortie;
}, cfg);
console.log('== config', JSON.stringify(cfg));
const agg = {};
for (const r of res) { const k = r.niveau + ' / ' + r.profil; (agg[k] = agg[k] || []).push(r); }
for (const [k, l] of Object.entries(agg)) {
  const moy = (f) => Math.round(l.reduce((a, r) => a + f(r), 0) / l.length);
  console.log(k.padEnd(20), 'score', moy((r) => r.score), 'F/R/B', moy((r) => r.jauges.fluidite), moy((r) => r.jauges.reputation), moy((r) => r.jauges.budget), 'fins', l.map((r) => r.fin.slice(0,3)).join(','), 'dossiers', l[0].dossiers);
}
}
console.log('erreurs', erreurs); await b.close();
