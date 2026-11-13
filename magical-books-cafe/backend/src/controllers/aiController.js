import { validationResult } from "express-validator";

import { getKnowledge } from "../services/assistantKnowledge.js";

// Información del negocio usada por el asistente (fallback local
// y también inyectada como contexto cuando hay proveedor de IA).
const NEGOCIO = {
    nombre: "Magical Books Café",
    horario: "Lunes a domingo de 8:00 a.m. a 9:00 p.m",
    direccion: "Consulta la sección de contacto de la web",
    contacto: "Desde la página /contacto (puedes elegir dueños o desarrolladores)",
    propuesta:
        "Café literario: café, postres, libros en venta y alquiler, " +
        "experiencias de lectura y espacio para la comunidad."
};

const STOPWORDS = new Set([
    "de", "del", "la", "el", "los", "las", "un", "una", "unos", "unas",
    "y", "o", "u", "en", "con", "por", "para", "que", "se", "me", "te",
    "su", "sus", "mi", "tu", "lo", "al", "es", "son", "ser", "esta",
    "este", "esto", "estan", "hay", "tiene", "tienen", "tengo",
    "quiero", "puede", "pueden", "puedo", "favor",
    "cual", "cuales",
    "sobre", "entre", "hasta", "desde", "todo", "todos", "algo",
    "necesito", "busco", "dame", "dime", "diga", "dijiste", "hacer",
    "sabes", "sabe", "seria", "si", "no", "yo", "nos",
    "vuestro", "nuestro", "ahora", "bien", "hoy"
]);

const normalizar = (texto) =>
    String(texto)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");

// Todos los tokens útiles para detectar intención (sin quitar palabras
// clave como "hola", "cuanto" o "gracias").
const tokensIntencion = (texto) =>
    normalizar(texto)
        .split(/[^a-z0-9]+/)
        .filter((palabra) => palabra.length >= 2);

// Tokens para buscar en el catálogo: se ignoran palabras vacías.
const tokenizar = (texto) =>
    tokensIntencion(texto).filter((palabra) => !STOPWORDS.has(palabra));

// Singular/plural suave para comparar tokens ("cafes" → "cafe").
const raiz = (palabra) =>
    palabra.length > 4 && palabra.endsWith("s")
        ? palabra.slice(0, -1)
        : palabra;

const precio = (valor) => `$${Number(valor).toLocaleString("es-CO")}`;

const listado = (items) => {
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} y ${items[1]}`;
    return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
};

// ---------------------------------------------------------------------------
// Detección de peticiones de información sensible.
// El asistente no tiene acceso a usuarios, pedidos de terceros ni credenciales:
// se rechaza de forma explícita antes de tocar cualquier colección.
// ---------------------------------------------------------------------------
const PATRONES_SENSIBLES = [
    "contrasena", "password", "clave de acceso", "token", "jwt",
    "base de datos", "mongodb", "coleccion", "admin", "administrador",
    "datos personales", "cedula", "documento de identidad",
    "usuario registrado", "usuarios registrados", "lista de usuarios",
    "credenciales", "pedidos de otros", "correo de un cliente",
    "telefono de un cliente", "direccion de un cliente",
    "salario", "sueldo"
];

const esSolicitudSensible = (texto) =>
    PATRONES_SENSIBLES.some((patron) => texto.includes(patron));

const RESPUESTA_SENSIBLE =
    "No puedo compartir datos personales, credenciales ni información " +
    "interna del sistema. Con gusto te ayudo con el catálogo, precios, " +
    "horarios, alquileres y experiencias de Magical Books Café.";

// ---------------------------------------------------------------------------
// Intenciones del motor local: coincidencia por token con puntaje,
// no por subcadena cruda (evita falsos positivos tipo "hola" en "melocotón").
// ---------------------------------------------------------------------------
const INTENCIONES = [
    {
        id: "saludo",
        claves: ["hola", "buenas", "buenos", "saludos", "hey"],
        texto: () =>
            `¡Hola! Soy el asistente de ${NEGOCIO.nombre}. ${NEGOCIO.propuesta} ` +
            "Pregúntame por productos, precios, horarios o alquileres."
    },
    {
        id: "horario",
        claves: ["horario", "abren", "abren", "cierran", "hora", "abierto", "abiertos"],
        texto: () => `Nuestro horario es: ${NEGOCIO.horario}.`
    },
    {
        id: "ubicacion",
        claves: ["donde", "ubicacion", "direccion", "llegar", "sucursal", "mapa"],
        texto: () => `Estás en ${NEGOCIO.nombre}. ${NEGOCIO.direccion}.`
    },
    {
        id: "contacto",
        claves: ["contacto", "correo", "telefono", "escribir", "duenos", "whatsapp"],
        texto: () => `Puedes escribirnos desde ${NEGOCIO.contacto}.`
    },
    {
        id: "alquiler",
        claves: ["alquiler", "alquilar", "alquilo", "prestamo", "prestar", "rentar"],
        texto: null
    },
    {
        id: "pedido",
        claves: ["pedido", "pedir", "envio", "enviar", "domicilio", "comprar", "carrito", "compra"],
        texto: () =>
            "Los pedidos se confirman en el local; te avisamos cuando estén " +
            "listos. Usa el carrito para preparar tu pedido."
    },
    {
        id: "pago",
        claves: ["pago", "pagar", "tarjeta", "efectivo", "datáfono", "datfono", "plataforma"],
        texto: () =>
            "Aceptamos pago en el local y pago en línea al confirmar tu pedido " +
            "desde el carrito."
    },
    {
        id: "experiencias",
        claves: ["experiencia", "experiencias", "evento", "eventos", "actividad", "agenda", "club", "taller"],
        texto: null
    },
    {
        id: "catalogo",
        claves: ["catalogo", "menu", "carta", "tienen", "venden", "ofrecen", "productos", "opciones"],
        texto: null
    },
    {
        id: "precio",
        claves: ["precio", "precios", "cuanto", "cuesta", "cuestan", "vale", "valen", "costo"],
        texto: null
    },
    {
        id: "disponibilidad",
        claves: ["disponible", "disponibles", "agotado", "quedan", "stock", "existencia"],
        texto: null
    },
    {
        id: "agradecimiento",
        claves: ["gracias", "grax", "listo", "perfecto", "adios", "chao", "hasta"],
        texto: () => "¡Con gusto! Si necesitas algo más, sigue preguntando."
    },
    {
        id: "ayuda",
        claves: ["ayuda", "ayudar", "funciona", "asistente", "bot"],
        texto: () =>
            "Puedo ayudarte con: precios y disponibilidad del catálogo, " +
            "cómo alquilar libros, horarios, experiencias y formas de pago. " +
            "Solo escribe tu pregunta con tus palabras."
    }
];

const detectarIntencion = (tokens) => {
    let mejor = null;
    let mejorPuntaje = 0;

    for (const intencion of INTENCIONES) {
        let puntaje = 0;

        for (const clave of intencion.claves) {
            if (tokens.includes(clave)) puntaje += 1;
        }

        if (puntaje > mejorPuntaje) {
            mejor = intencion;
            mejorPuntaje = puntaje;
        }
    }

    return mejor;
};

// ---------------------------------------------------------------------------
// Búsqueda de productos en el catálogo por similitud de tokens.
// ---------------------------------------------------------------------------
const puntuarProducto = (producto, tokensRaiz) => {
    const nombre = tokenizar(producto.name).map(raiz);
    const meta = tokenizar(`${producto.category} ${producto.type}`).map(raiz);
    const descripcion = tokenizar(producto.description || "").map(raiz);

    let puntaje = 0;

    for (const token of tokensRaiz) {
        if (nombre.includes(token)) puntaje += 3;
        else if (nombre.some((propio) => propio.startsWith(token))) puntaje += 2;
        else if (meta.includes(token)) puntaje += 2;
        else if (meta.some((propio) => propio.startsWith(token))) puntaje += 1;
        else if (descripcion.includes(token)) puntaje += 1;
    }

    return puntaje;
};

const buscarProductos = (productos, mensaje, maximo = 3) =>
    productos
        .map((producto) => ({
            producto,
            puntaje: puntuarProducto(producto, tokenizar(mensaje).map(raiz))
        }))
        .filter((resultado) => resultado.puntaje >= 2)
        .sort((a, b) => b.puntaje - a.puntaje)
        .slice(0, maximo)
        .map((resultado) => resultado.producto);

const describirProducto = (producto) => {
    const partes = [`${producto.name} (${precio(producto.price)})`];

    if (producto.rental?.enabled && producto.rental.dailyPrice > 0) {
        partes.push(
            `alquiler ${precio(producto.rental.dailyPrice)}/día ` +
            `(máx. ${producto.rental.maxDays} días)`
        );
    }

    if ((producto.stock || 0) <= 0) {
        partes.push("agotado por ahora");
    }

    return partes.join(" — ");
};

const respuestaPrecio = (productos) => {
    if (productos.length === 0) {
        return (
            "No encuentro ese producto en el catálogo. " +
            "Escríbeme el nombre exacto o pregúntame por café, postres o libros."
        );
    }

    return `Encontré: ${listado(productos.map(describirProducto))}.`;
};

const respuestaAlquiler = (productos) => {
    const alquilables = productos.filter(
        (producto) =>
            producto.rental?.enabled &&
            producto.rental.dailyPrice > 0 &&
            (producto.stock || 0) > 0
    );

    if (alquilables.length === 0) {
        return (
            "Alquilamos libros por día. Entra al detalle de un libro, " +
            "elige el formato y las fechas para registrar tu solicitud. " +
            "Pregúntame por un título y te digo su precio de alquiler."
        );
    }

    return `Disponibles para alquiler: ${listado(
        alquilables.map(describirProducto)
    )}. Entra al detalle del libro para elegir fechas.`;
};

const respuestaCatalogo = (knowledge, productos) => {
    const resumen = knowledge.categorias.map((categoria) => {
        const total = knowledge.productos.filter(
            (producto) => producto.category === categoria
        ).length;
        return `${categoria} (${total})`;
    });

    const destacados = knowledge.productos
        .filter((producto) => producto.featured)
        .slice(0, 3)
        .map((producto) => producto.name);

    let texto = `Tenemos: ${listado(resumen)}.`;

    if (destacados.length > 0) {
        texto += ` Entre nuestros destacados: ${listado(destacados)}.`;
    }

    if (productos.length > 0) {
        texto += ` Sobre tu pregunta: ${listado(
            productos.map(describirProducto)
        )}.`;
    }

    return texto;
};

const respuestaExperiencias = (knowledge) => {
    const experiencias = knowledge.experiencias.slice(0, 3);

    if (experiencias.length === 0) {
        return (
            "Pronto publicaremos nuevas experiencias de lectura. " +
            "Míralas en la sección de experiencias de la página."
        );
    }

    return `Estas son algunas experiencias: ${listado(
        experiencias.map((experiencia) => experiencia.title)
    )}. Detalles en la sección de experiencias de la página.`;
};

const respuestaDisponibilidad = (productos) => {
    if (productos.length === 0) {
        return (
            "No encuentro ese producto en el catálogo. " +
            "Pregúntame por nombre y te confirmo si está disponible."
        );
    }

    return listado(
        productos.map((producto) =>
            (producto.stock || 0) > 0
                ? `${producto.name}: disponible (${producto.stock} en existencia)`
                : `${producto.name}: agotado por ahora`
        )
    ) + ".";
};

// ---------------------------------------------------------------------------
// Motor local: intención + productos relacionados de la base de datos.
// ---------------------------------------------------------------------------
const responderLocal = async (mensaje) => {
    const knowledge = await getKnowledge();
    const tokens = tokensIntencion(mensaje);
    const intencion = detectarIntencion(tokens);
    const productos = buscarProductos(knowledge.productos, mensaje);

    let reply = "";

    if (intencion?.id === "precio") {
        reply = respuestaPrecio(productos);
    } else if (intencion?.id === "alquiler") {
        reply = respuestaAlquiler(productos);
    } else if (intencion?.id === "catalogo") {
        reply = respuestaCatalogo(knowledge, productos);
    } else if (intencion?.id === "experiencias") {
        reply = respuestaExperiencias(knowledge);
    } else if (intencion?.id === "disponibilidad") {
        reply = respuestaDisponibilidad(productos);
    } else {
        reply = intencion?.texto ? intencion.texto() : "";

        if (productos.length > 0) {
            reply = `${reply ? reply + " " : ""}Sobre tu consulta: ${listado(
                productos.map(describirProducto)
            )}.`;
        }
    }

    if (!reply) {
        reply =
            "Puedo ayudarte con productos, precios, horarios y alquileres. " +
            `${NEGOCIO.propuesta} También puedes escribirnos desde /contacto.`;
    }

    return { reply, suggestions: productos };
};

// ---------------------------------------------------------------------------
// Proveedor externo opcional (OpenAI-compatible) si existe AI_API_KEY.
// El contexto inyectado solo contiene campos públicos del catálogo.
// ---------------------------------------------------------------------------
const contextoPublico = async () => {
    const knowledge = await getKnowledge();

    const productos = knowledge.productos
        .slice(0, 60)
        .map(
            (producto) =>
                `- ${producto.name}: ${precio(producto.price)} ` +
                `(${producto.category}${
                    producto.rental?.enabled
                        ? `, alquiler ${precio(producto.rental.dailyPrice)}/día`
                        : ""
                })`
        )
        .join("\n");

    const experiencias = knowledge.experiencias
        .slice(0, 15)
        .map((experiencia) => `- ${experiencia.title}`)
        .join("\n");

    return (
        `CATÁLOGO PÚBLICO (no inventes otros precios):\n${productos}\n\n` +
        `EXPERIENCIAS:\n${experiencias}`
    );
};

const responderIA = async (mensaje) => {
    const contexto = await contextoPublico();

    const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.AI_API_KEY}`
            },
            body: JSON.stringify({
                model: process.env.AI_MODEL || "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content:
                            `Eres el asistente de ${NEGOCIO.nombre}. ` +
                            `${NEGOCIO.propuesta} Horario: ${NEGOCIO.horario}. ` +
                            "Responde en español, con tono amable y breve (máx. 4 oraciones).\n" +
                            "Reglas: usa solo los precios del catálogo adjunto y no " +
                            "inventes productos. Nunca compartas datos personales de " +
                            "clientes, credenciales ni información interna del sistema; " +
                            "si te la piden, declina amablemente.\n\n" +
                            contexto
                    },
                    { role: "user", content: mensaje }
                ],
                max_tokens: 300,
                temperature: 0.4
            })
        }
    );

    if (!response.ok) throw new Error(`Proveedor IA: ${response.status}`);

    const data = await response.json();

    return {
        reply: data.choices?.[0]?.message?.content?.trim() || "",
        suggestions: []
    };
};

// POST /api/ai/assistant — { message } → { reply, source, suggestions }
export const assistant = async (req, res, next) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Escribe un mensaje para el asistente."
            });
        }

        const { message } = req.body;

        if (esSolicitudSensible(normalizar(message))) {
            return res.status(200).json({
                success: true,
                reply: RESPUESTA_SENSIBLE,
                source: "local",
                suggestions: []
            });
        }

        const usarIA = Boolean(process.env.AI_API_KEY);

        let resultado;
        let source = "local";

        if (usarIA) {
            try {
                resultado = await responderIA(message);
                source = "ia";
            } catch {
                // Si el proveedor falla, se responde con el motor local.
                resultado = await responderLocal(message);
                source = "local";
            }
        } else {
            resultado = await responderLocal(message);
        }

        return res.status(200).json({
            success: true,
            reply: resultado.reply,
            source,
            suggestions: resultado.suggestions
        });

    } catch (error) {
        next(error);
    }
};
