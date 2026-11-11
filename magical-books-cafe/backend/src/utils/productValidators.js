import { body, query, param } from "express-validator";

const allowedTypes = ["coffee", "dessert", "book", "service"];

const allowedFormats = [
    "fisico",
    "digital",
    "kindle",
    "local_pc"
];

export const createProductValidation = [
    body("sku")
        .trim()
        .notEmpty()
        .withMessage("El SKU es obligatorio.")
        .matches(/^[A-Za-z0-9_-]{3,40}$/)
        .withMessage("El SKU debe tener entre 3 y 40 caracteres válidos."),

    body("name")
        .trim()
        .notEmpty()
        .withMessage("El nombre es obligatorio.")
        .isLength({ max: 150 }),

    body("description")
        .trim()
        .notEmpty()
        .withMessage("La descripción es obligatoria.")
        .isLength({ max: 2000 }),

    body("type")
        .isIn(allowedTypes)
        .withMessage("El tipo de producto no es válido."),

    body("category")
        .trim()
        .notEmpty()
        .withMessage("La categoría es obligatoria.")
        .isLength({ max: 80 }),

    body("price")
        .isFloat({ min: 0 })
        .withMessage("El precio debe ser un número igual o mayor a cero.")
        .toFloat(),

    body("image")
        .optional({ values: "falsy" })
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .withMessage("La imagen debe tener una URL HTTP o HTTPS válida."),

    body("imageUrl")
        .optional({ values: "falsy" })
        .isURL({ protocols: ["http", "https"], require_protocol: true })
        .withMessage("La imagen debe tener una URL HTTP o HTTPS válida."),

    body("formats")
        .optional()
        .isArray()
        .withMessage("Los formatos deben enviarse como una lista."),

    body("formats.*")
        .optional()
        .isIn(allowedFormats)
        .withMessage("Se ha enviado un formato no permitido."),

    /*body("stock")
        .optional()
        .isInt({ min: 0 })
        .withMessage("El inventario debe ser un entero no negativo.")
        .toInt(),
*/
    body("rental.enabled")
        .optional()
        .isBoolean()
        .withMessage("El estado de alquiler debe ser verdadero o falso.")
        .toBoolean(),

    body("rental.dailyPrice")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("El precio diario no puede ser negativo.")
        .toFloat(),

    body("rental.maxDays")
        .optional()
        .isInt({ min: 0 })
        .withMessage("La duración máxima debe ser un entero no negativo.")
        .toInt(),

    body("featured")
        .optional()
        .isBoolean()
        .withMessage("El estado destacado debe ser verdadero o falso.")
        .toBoolean()
];

export const updateProductValidation = [
    param("id").isMongoId().withMessage("El identificador no es válido."),

    body("sku")
        .optional()
        .trim()
        .matches(/^[A-Za-z0-9_-]{3,40}$/),

    body("name").optional().trim().notEmpty().isLength({ max: 150 }),

    body("description")
        .optional()
        .trim()
        .notEmpty()
        .isLength({ max: 2000 }),

    body("type").optional().isIn(allowedTypes),

    body("category").optional().trim().notEmpty().isLength({ max: 80 }),

    body("price").optional().isFloat({ min: 0 }).toFloat(),

    body("image")
        .optional({ values: "falsy" })
        .isURL({ protocols: ["http", "https"], require_protocol: true }),

    body("imageUrl")
        .optional({ values: "falsy" })
        .isURL({ protocols: ["http", "https"], require_protocol: true }),

    body("formats").optional().isArray(),

    body("formats.*").optional().isIn(allowedFormats),

    body("rental.enabled").optional().isBoolean().toBoolean(),

    body("rental.dailyPrice").optional().isFloat({ min: 0 }).toFloat(),

    body("rental.maxDays").optional().isInt({ min: 0 }).toInt(),

    body("featured").optional().isBoolean().toBoolean()
];

export const productIdValidation = [
    param("id").isMongoId().withMessage("El identificador no es válido.")
];

export const catalogQueryValidation = [
    query("page").optional().isInt({ min: 1 }).toInt(),

    query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),

    query("minPrice").optional().isFloat({ min: 0 }).toFloat(),

    query("maxPrice").optional().isFloat({ min: 0 }).toFloat(),

    query("type").optional().isIn(allowedTypes),

    query("format").optional().isIn(allowedFormats),

    query("featured").optional().isBoolean().toBoolean(),

    query("search").optional().trim().isLength({ max: 100 }),

    query("category")
    .optional()
    .trim()
    .isLength({ max: 80 }),

query("sort")
    .optional()
    .isIn([
        "newest",
        "oldest",
        "priceAsc",
        "priceDesc",
        "nameAsc",
        "nameDesc"
    ]),
];