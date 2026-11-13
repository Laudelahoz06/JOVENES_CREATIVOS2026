import Product from "../models/Product.js";
import Experience from "../models/Experience.js";

// Whitelist de campos públicos: el asistente NUNCA consulta usuarios,
// pedidos, alquileres, mensajes de contacto ni movimientos de inventario.
const CAMPOS_PRODUCTO = [
    "name",
    "price",
    "type",
    "category",
    "description",
    "availableFor",
    "formats",
    "stock",
    "featured",
    "image",
    "rental.enabled",
    "rental.dailyPrice",
    "rental.maxDays"
].join(" ");

const CAMPOS_EXPERIENCIA = [
    "title",
    "description",
    "category",
    "icon",
    "to",
    "featured"
].join(" ");

const TTL = 60 * 1000;

let cache = { productos: null, experiencias: null, categorias: [], en: 0 };

export const getKnowledge = async (forzar = false) => {
    const ahora = Date.now();

    if (!forzar && cache.productos && ahora - cache.en < TTL) {
        return cache;
    }

    const [productos, experiencias] = await Promise.all([
        Product.find({ active: true })
            .select(CAMPOS_PRODUCTO)
            .limit(500)
            .lean(),
        Experience.find({ active: true })
            .select(CAMPOS_EXPERIENCIA)
            .sort({ order: 1 })
            .limit(50)
            .lean()
    ]);

    const categorias = [
        ...new Set(productos.map((producto) => producto.category))
    ].sort();

    cache = { productos, experiencias, categorias, en: ahora };

    return cache;
};
