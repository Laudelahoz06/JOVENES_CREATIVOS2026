import express from "express";
import { body, param } from "express-validator";

import {
    createMessage,
    listMessages,
    markAsRead,
    deleteMessage
} from "../controllers/contactController.js";

import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

const router = express.Router();

const createValidation = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("El nombre es obligatorio.")
        .isLength({ max: 100 }),

    body("email")
        .trim()
        .isEmail()
        .withMessage("Ingresa un correo válido.")
        .normalizeEmail(),

    body("subject")
        .trim()
        .notEmpty()
        .withMessage("El asunto es obligatorio.")
        .isLength({ max: 150 }),

    body("message")
        .trim()
        .isLength({ min: 10, max: 2000 })
        .withMessage("El mensaje debe tener entre 10 y 2000 caracteres."),

    body("phone")
        .optional()
        .trim()
        .isLength({ max: 30 }),

    body("audience")
        .optional()
        .isIn(["duenos", "desarrolladores"])
        .withMessage("Destinatario no válido.")
];

const idValidation = [
    param("id").isMongoId().withMessage("Identificador no válido.")
];

// Público: enviar mensaje desde el formulario de contacto.
router.post("/", createValidation, createMessage);

// Administración de la bandeja.
router.get("/", authenticate, authorize("admin"), listMessages);
router.patch(
    "/:id/read",
    authenticate,
    authorize("admin"),
    idValidation,
    markAsRead
);
router.delete(
    "/:id",
    authenticate,
    authorize("admin"),
    idValidation,
    deleteMessage
);

export default router;
