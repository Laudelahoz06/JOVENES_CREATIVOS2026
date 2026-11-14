import { body, query, param } from "express-validator";

import { sanitizeUrl } from "./sanitizeUrl.js";

export const createExperienceValidation = [
    body("title")
        .trim()
        .notEmpty()
        .withMessage("El título es obligatorio.")
        .isLength({ max: 150 }),

    body("description")
        .trim()
        .notEmpty()
        .withMessage("La descripción es obligatoria.")
        .isLength({ max: 2000 }),

    body("icon")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 10 })
        .withMessage("El icono no puede superar 10 caracteres."),

    body("image")
        .optional({ values: "falsy" })
        .customSanitizer(sanitizeUrl)
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .withMessage("La imagen debe tener una URL HTTP o HTTPS válida."),

    body("to")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 300 })
        .withMessage("El enlace no puede superar 300 caracteres."),

    body("action")
        .optional()
        .isIn(["", "assistant"])
        .withMessage("La acción no es válida."),

    body("spotifyUrl")
        .optional({ values: "falsy" })
        .isURL({ protocols: ["http", "https"], require_protocol: true, host_whitelist: ["open.spotify.com", "www.open.spotify.com", "spotify.link", "www.spotify.link"] })
        .withMessage("La URL debe ser de Spotify (open.spotify.com)."),

    body("whatsappUrl")
        .optional({ values: "falsy" })
        .isURL({ protocols: ["http", "https"], require_protocol: true, host_whitelist: ["chat.whatsapp.com", "www.chat.whatsapp.com", "wa.me", "www.wa.me", "api.whatsapp.com", "whatsapp.com", "www.whatsapp.com"] })
        .withMessage("La URL debe ser un enlace de WhatsApp (chat.whatsapp.com o wa.me)."),

    body("category")
        .optional({ values: "falsy" })
        .trim()
        .isLength({ max: 80 }),

    body("order")
        .optional()
        .isInt({ min: 0 })
        .withMessage("El orden debe ser un entero no negativo.")
        .toInt(),

    body("featured")
        .optional()
        .isBoolean()
        .withMessage("El estado destacado debe ser verdadero o falso.")
        .toBoolean(),

    body("active")
        .optional()
        .isBoolean()
        .withMessage("El estado debe ser verdadero o falso.")
        .toBoolean()
];

export const updateExperienceValidation = [
    param("id").isMongoId().withMessage("El identificador no es válido."),

    body("title").optional().trim().notEmpty().isLength({ max: 150 }),

    body("description")
        .optional()
        .trim()
        .notEmpty()
        .isLength({ max: 2000 }),

    body("icon").optional().trim().isLength({ max: 10 }),

    body("image")
        .optional({ values: "falsy" })
        .customSanitizer(sanitizeUrl)
        .isURL({ protocols: ["http", "https"], require_protocol: true }),

    body("to").optional().trim().isLength({ max: 300 }),

    body("action").optional().isIn(["", "assistant"]),

    body("spotifyUrl")
        .optional({ values: "falsy" })
        .isURL({ protocols: ["http", "https"], require_protocol: true, host_whitelist: ["open.spotify.com", "www.open.spotify.com", "spotify.link", "www.spotify.link"] }),

    body("whatsappUrl")
        .optional({ values: "falsy" })
        .isURL({ protocols: ["http", "https"], require_protocol: true, host_whitelist: ["chat.whatsapp.com", "www.chat.whatsapp.com", "wa.me", "www.wa.me", "api.whatsapp.com", "whatsapp.com", "www.whatsapp.com"] }),

    body("category").optional().trim().notEmpty().isLength({ max: 80 }),

    body("order").optional().isInt({ min: 0 }).toInt(),

    body("featured").optional().isBoolean().toBoolean(),

    body("active").optional().isBoolean().toBoolean()
];

export const experienceIdValidation = [
    param("id").isMongoId().withMessage("El identificador no es válido.")
];

export const experienceQueryValidation = [
    query("page").optional().isInt({ min: 1 }).toInt(),

    query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),

    query("search").optional().trim().isLength({ max: 100 }),

    query("category")
        .optional()
        .trim()
        .isLength({ max: 80 }),

    query("featured").optional().isBoolean().toBoolean(),

    query("sort")
        .optional()
        .isIn([
            "newest",
            "oldest",
            "order",
            "titleAsc",
            "titleDesc"
        ])
];
