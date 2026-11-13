/* Nantes en régulation — pointeur dans le repère de l'écran du PC.
 * Le glisser-déposer des cartes de réponse (prompt 94) a été retiré : les cartes ont laissé la place aux répliques
 * du plaignant au prompt 107, et le code qui les faisait flotter n'était plus atteint (prompt 199).
 */
/** Souris en coordonnées de l'écran du PC (1920×1080), hors image (dans mousePressed / mouseReleased) */
function sourisPC() {
	return typeof pointeurEcranPC === 'function' ? pointeurEcranPC(mouseX, mouseY) : { x: mouseX, y: mouseY }; // prompt 182 : hors du poste, le pointeur n'est « nulle part » pour l'appli (bureau.js)
}
