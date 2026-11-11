import { validationResult } from "express-validator";

import Product from "../models/Product.js";

// Información del negocio usada por el asistente (fallback local
// y también inyectada como contexto cuando hay proveedor de IA).
const NEGOCIO = {
    nombre: "Magical Books Café",
    horario: "Lunes a domingo de 8:00 a.m. a 9:00 p.m.",
    direccion: "Consulta la sección de contacto de la web",
    contacto: "Desde la página /contacto (puedes elegir dueños o desarrolladores)",
    propuesta:
        "Café literario: café, postres, libros en venta y alquiler, " +
        "experiencias de lectura y espacio para la comunidad."
};

const normalizar = (texto) =>
    texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");

// Resuestas locales por intención (no requieren llaves externas).
const RESPUESTAS = [
    {
        claves: ["horario", "abren", "abierto", "cierran", "hora"],
        texto: `Nuestro horario es: ${NEGOCIO.horario}.`
    },
    {
        claves: ["donde", "ubicacion", "direccion", "llegar", "sucursal"],
        texto: `Estás en ${NEGOCIO.nombre}. ${NEGOCIO.direccion}.`
    },
    {
        claves: ["contacto", "correo", "telefono", "escribir", "duenos"],
        texto: `Puedes escribirnos desde ${NEGOCIO.contacto}.`
    },
    {
        claves: ["alquiler", "alquilar", "prestamo", "prestar"],
        texto:
            "Alquilamos libros por día. Entra al detalle de un libro, " +
            "elige el formato y las fechas para registrar tu solicitud."
    },
    {
        claves: ["envio", "enviar", "domicilio"],
        texto:
            "Los pedidos se confirman en el local; te avisamos cuando estén " +
            "listos. Usa el carrito para preparar tu pedido."
    },
    {
        claves: ["hola", "buenas", "buenos dias", "buenas tardes"],
        texto:
            `¡Hola! Soy el asistente de ${NEGOCIO.nombre}. ${NEGOCIO.propuesta} ` +
            "Pregúntame por productos, precios o alquileres."
    },
    {
        claves: ["gracias", "listo", "perfecto"],
        texto: "¡Con gusto! Si necesitas algo más, sigue preguntando."
    }
];

// Busca productos relacionados con la consulta.
const buscarProductos = async (texto) => {
    const palabras = normalizar(texto)
        .split(/\s+/)
        .filter((palabra) => palabra.length > 3);

    if (palabras.length === 0) return [];

    const filtro = {
        active: true,
        $or: palabras.flatMap((palabra) => {
            const regex = new RegExp(palabra, "i");

            return [
                { name: regex },
                { description: regex },
                { category: regex },
                { type: regex }
            ];
        })
    };

    const productos = await Product.find(filtro)
        .select("name price image type category")
        .limit(3)
        .lean();

    return productos;
};

const responderLocal = async (mensaje) => {
    const texto = normalizar(mensaje);

    const intencion = RESPUESTAS.find((item) =>
        item.claves.some((clave) => texto.includes(clave))
    );

    const productos = await buscarProductos(mensaje);

    let reply = intencion ? intencion.texto : "";

    if (productos.length > 0) {
        const listado = productos
            .map(
                (producto) =>
                    `${producto.name} ($${Number(producto.price).toLocaleString("es-CO")})`
            )
            .join(", ");

        reply = `${reply ? reply + " " : ""}Encontré esto para ti: ${listado}.`;
    }

    if (!reply) {
        reply =
            `Puedo ayudarte con productos, precios, horarios y alquileres. ` +
            `${NEGOCIO.propuesta} También puedes escribirnos desde /contacto.`;
    }

    return { reply, suggestions: productos };
};

// Proveedor externo opcional (OpenAI-compatible) si existe AI_API_KEY.
const responderIA = async (mensaje) => {
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
                            "Responde en español, con tono amable y breve (máx. 4 oraciones)."
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
