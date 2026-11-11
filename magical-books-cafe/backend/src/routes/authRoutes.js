import express from "express";
import { body } from "express-validator";

import {
    register,
    login,
    getProfile,
    updateProfile,
    logout
} from "../controllers/authController.js";

import { authenticate } from "../middlewares/authMiddleware.js";

import rateLimit from "express-rate-limit";


const router = express.Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Demasiados intentos. Intenta nuevamente en 15 minutos."
    }
});

const registerValidation = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("El nombre es obligatorio.")
        .isLength({ max: 100 })
        .withMessage("El nombre no puede superar 100 caracteres."),

    body("email")
        .trim()
        .isEmail()
        .withMessage("Ingresa un correo electrónico válido.")
        .normalizeEmail(),

    body("password")
        .isString()
        .isLength({ min: 8, max: 72 })
        .withMessage("La contraseña debe tener entre 8 y 72 caracteres.")
];

const loginValidation = [
    body("email")
        .trim()
        .isEmail()
        .withMessage("Ingresa un correo válido.")
        .normalizeEmail(),

    body("password")
        .isString()
        .notEmpty()
        .withMessage("La contraseña es obligatoria.")
];

const updateProfileValidation = [
    body("name")
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("El nombre debe tener entre 2 y 100 caracteres."),

    body("phone")
        .optional()
        .trim()
        .isLength({ max: 30 })
        .withMessage("El teléfono no puede superar 30 caracteres."),

    body("preferences")
        .optional()
        .isObject()
        .withMessage("Las preferencias deben ser un objeto.")
];

router.post("/register", authLimiter, registerValidation, register);
router.post("/login", authLimiter, loginValidation, login);
router.get("/profile", authenticate, getProfile);
router.patch(
    "/profile",
    authenticate,
    updateProfileValidation,
    updateProfile
);
router.post("/logout", authenticate, logout);

export default router;