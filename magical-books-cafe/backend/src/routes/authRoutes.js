import express from "express";
import { body } from "express-validator";

import {
    register,
    login,
    getProfile,
    updateProfile,
    logout,
    forgotPassword,
    resetPassword,
    changePassword
} from "../controllers/authController.js";

import { authenticate } from "../middlewares/authMiddleware.js";

import rateLimit from "express-rate-limit";


const router = express.Router();

// En desarrollo se sube el límite para que registrar/probar no bloquee
// la IP; en producción sigue en 10 intentos por 15 minutos.
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: process.env.NODE_ENV === "production" ? 10 : 500,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Demasiados intentos. Intenta nuevamente en 15 minutos."
    }
});

// Contraseña segura: 8-72 caracteres con mayúscula, minúscula,
// número y al menos un carácter especial.
const STRONG_PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,72}$/;
const STRONG_PASSWORD_MESSAGE =
    "La contraseña debe tener de 8 a 72 caracteres e incluir " +
    "mayúscula, minúscula, número y un carácter especial.";

const strongPassword = (field = "password") =>
    body(field)
        .isString()
        .withMessage(STRONG_PASSWORD_MESSAGE)
        .matches(STRONG_PASSWORD_REGEX)
        .withMessage(STRONG_PASSWORD_MESSAGE);

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

    strongPassword()
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

const forgotPasswordValidation = [
    body("email")
        .trim()
        .isEmail()
        .withMessage("Ingresa un correo electrónico válido.")
        .normalizeEmail()
];

const resetPasswordValidation = [
    body("token")
        .isString()
        .isLength({ min: 32, max: 128 })
        .withMessage("El enlace de recuperación no es válido."),
    strongPassword()
];

const changePasswordValidation = [
    body("currentPassword")
        .isString()
        .notEmpty()
        .withMessage("La contraseña actual es obligatoria."),
    strongPassword("newPassword")
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
router.post(
    "/forgot-password",
    authLimiter,
    forgotPasswordValidation,
    forgotPassword
);
router.post(
    "/reset-password",
    authLimiter,
    resetPasswordValidation,
    resetPassword
);
router.patch(
    "/password",
    authenticate,
    authLimiter,
    changePasswordValidation,
    changePassword
);
router.post("/logout", authenticate, logout);

export default router;