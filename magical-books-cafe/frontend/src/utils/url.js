// Utilidades para limpiar URLs pegadas por usuarios.
//
// Espejo de backend/src/utils/sanitizeUrl.js: ambas piezas deben
// mantener la misma lógica para que la validación del servidor y la
// vista previa del panel admin coincidan.

// Limpia una URL copiada desde Markdown, HTML o con espacios de más.
//
// Casos cubiertos:
//   "[texto](https://a.com/x.png)"      -> "https://a.com/x.png"
//   "https://a.com/x.png](https://...)" -> "https://a.com/x.png"
//   "  https://a.com/x.png  "           -> "https://a.com/x.png"
//   '"https://a.com/x.png"'             -> "https://a.com/x.png"
export function sanitizeUrl(value) {
    if (typeof value !== "string") return "";

    let clean = value.trim().replace(/^["']+|["']+$/g, "").trim();

    if (!clean) return "";

    // Formato Markdown: [etiqueta](destino)
    const markdown = clean.match(/^\[[^\]]*]\(\s*([^)\s]+)\s*\)$/);

    if (markdown) {
        clean = markdown[1];
    } else if (clean.includes("](")) {
        // Fragmento pegado a medias: conserva la URL que va después de "](".
        const start = clean.indexOf("](") + 2;
        const end = clean.indexOf(")", start);

        clean = end === -1
            ? clean.slice(start).trim()
            : clean.slice(start, end).trim();
    }

    return clean;
}

// Misma limpieza, pero aplicada al vuelo en un input mientras se escribe.
export function sanitizeUrlInput(value) {
    return typeof value === "string" ? value.trimStart() : value;
}
