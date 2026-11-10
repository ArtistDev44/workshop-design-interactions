// Prompt 28 : data/messages.json (source brute, modifiable à la main) → data/messages.js
// (window.MESSAGES = …) pour que le jeu fonctionne ouvert par double clic et hors ligne.
// Usage : npm run messages (lancé aussi avant chaque build).
import { readFile, writeFile } from 'node:fs/promises';

const dossier = new URL('../public/data/', import.meta.url);
const brut = await readFile(new URL('messages.json', dossier), 'utf8');
const donnees = JSON.parse(brut); // échoue clairement si le JSON est invalide
if (!Array.isArray(donnees.plaintes)) throw new Error('messages.json : « plaintes » doit être une liste');
await writeFile(new URL('messages.js', dossier), '// Généré depuis messages.json par scripts/generer-messages.mjs — ne pas modifier à la main.\nwindow.MESSAGES = ' + JSON.stringify(donnees) + ';\n');
console.log('messages.js : ' + donnees.plaintes.length + ' plainte(s)');
