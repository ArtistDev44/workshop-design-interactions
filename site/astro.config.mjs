// @ts-check
import { defineConfig } from 'astro/config';

// Site 100 % statique déployé à la racine du domaine (Cloudflare Pages, prompt 02).
// URL finale : https://workshop-design-interactions.pages.dev/
// Le déploiement sert dist/ à la racine du domaine : aucun préfixe de base,
// sinon tous les liens internes (ex. /oeuvres/) renvoient une 404.
// https://astro.build/config
export default defineConfig({
	output: 'static',
	site: 'https://workshop-design-interactions.pages.dev',
	base: '/',
	// 'ignore' : /oeuvres et /oeuvres/ répondent tous deux (en local comme en ligne).
	// Les liens générés par src/lib/liens.ts gardent toujours la barre finale.
	trailingSlash: 'ignore',
	// `npm run dev` / `npm run preview` ouvrent directement la racine du site.
	server: { open: '/' },
	build: {
		// Le déploiement sert dist/ à la racine du domaine : les href absolus
		// préfixés par `base` (/workshop-design-interactions/...) n'y résolvent
		// pas. Au-delà de ~4 ko, Astro externalise global.css dans _astro/*.css
		// (prompt 09 a fait passer le CSS au-dessus de ce seuil) et le rendu
		// n'a plus aucun CSS. Toujours inliner garantit le style sur tout hôte.
		inlineStylesheets: 'always',
	},
});
