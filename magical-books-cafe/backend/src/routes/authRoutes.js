import express from "express";
import { body } from "express-validator";

import {
    register,
    login,
    getProfile,
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

router.post("/register", authLimiter, registerValidation, register);
router.post("/login", authLimiter, loginValidation, login);
router.get("/profile", authenticate, getProfile);
router.post("/logout", authenticate, logout);

export default router;