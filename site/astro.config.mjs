// @ts-check
import { defineConfig } from 'astro/config';

// Site 100 % statique pour GitHub Pages (prompt 02).
// URL finale : https://artistdev44.github.io/workshop-design-interactions/patrimoine-exe/nantes/001/
// https://astro.build/config
export default defineConfig({
	output: 'static',
	site: 'https://artistdev44.github.io',
	base: '/workshop-design-interactions/patrimoine-exe/nantes/001/',
	trailingSlash: 'always',
});
