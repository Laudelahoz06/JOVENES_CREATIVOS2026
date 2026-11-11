import express from "express";
import { body } from "express-validator";

import {
    createWompiPayment,
    verifyWompiPayment,
    wompiWebhook
} from "../controllers/paymentController.js";

import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

const createValidation = [
    body("orderId").isMongoId().withMessage("Pedido no válido.")
];

// Cliente autenticado.
router.post("/wompi", authenticate, createValidation, createWompiPayment);
router.get("/wompi/verify", authenticate, verifyWompiPayment);

// Webhook público de Wompi: se verifica con checksum + llave privada.
router.post("/wompi/webhook", wompiWebhook);

export default router;
