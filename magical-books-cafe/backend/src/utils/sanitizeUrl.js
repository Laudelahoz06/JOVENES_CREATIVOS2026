// Limpieza de URLs pegadas por usuarios.
//
// Espejo de frontend/src/utils/url.js: ambas piezas deben mantener la
// misma lógica para que lo que se guarda coincida con lo que se previsualiza.

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

    const markdown = clean.match(/^\[[^\]]*]\(\s*([^)\s]+)\s*\)$/);

    if (markdown) {
        clean = markdown[1];
    } else if (clean.includes("](")) {
        const start = clean.indexOf("](") + 2;
        const end = clean.indexOf(")", start);

        clean = end === -1
            ? clean.slice(start).trim()
            : clean.slice(start, end).trim();
    }

    return clean;
}
