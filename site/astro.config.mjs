// @ts-check
import { defineConfig } from 'astro/config';

// Site 100 % statique pour GitHub Pages (prompt 02).
// URL finale : https://artistdev44.github.io/workshop-design-interactions/patrimoine-exe/nantes/001/
// https://astro.build/config
export default defineConfig({
	output: 'static',
	site: 'https://artistdev44.github.io',
	base: '/workshop-design-interactions/patrimoine-exe/nantes/001/',
	// 'ignore' : /oeuvres et /oeuvres/ répondent tous deux (en local comme en ligne).
	// Les liens générés par src/lib/liens.ts gardent toujours la barre finale.
	trailingSlash: 'ignore',
	// `npm run dev` / `npm run preview` ouvrent directement l'adresse du site (sinon
	// http://localhost:4321/ affiche une 404 : le site vit sous la base ci-dessus).
	server: { open: '/workshop-design-interactions/patrimoine-exe/nantes/001/' },
	build: {
		// Le déploiement sert dist/ à la racine du domaine : les href absolus
		// préfixés par `base` (/workshop-design-interactions/...) n'y résolvent
		// pas. Au-delà de ~4 ko, Astro externalise global.css dans _astro/*.css
		// (prompt 09 a fait passer le CSS au-dessus de ce seuil) et le rendu
		// n'a plus aucun CSS. Toujours inliner garantit le style sur tout hôte.
		inlineStylesheets: 'always',
	},
});
