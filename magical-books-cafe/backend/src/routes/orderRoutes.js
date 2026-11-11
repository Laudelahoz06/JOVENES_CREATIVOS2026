import express from "express";
import { body, param } from "express-validator";

import {
    createOrder,
    listMyOrders,
    listAllOrders,
    cancelMyOrder,
    updateOrderStatus
} from "../controllers/orderController.js";

import { registerLocalPayment } from "../controllers/paymentController.js";

import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

const router = express.Router();

const createValidation = [
    body("items")
        .isArray({ min: 1 })
        .withMessage("El pedido debe incluir productos."),

    body("items.*.product")
        .isMongoId()
        .withMessage("Producto no válido."),

    body("items.*.quantity")
        .isInt({ min: 1, max: 99 })
        .withMessage("Cantidad no válida.")
        .toInt(),

    body("notes")
        .optional()
        .trim()
        .isLength({ max: 500 }),

    // Cómo va a pagar el cliente: Wompi (online) o en el local.
    body("paymentMethod")
        .optional()
        .isIn(["wompi", "local"])
        .withMessage("Método de pago no válido.")
];

const payLocalValidation = [
    body("paymentReference")
        .optional()
        .trim()
        .isLength({ max: 120 })
        .withMessage("Referencia demasiado larga."),
    body("notes")
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage("Nota demasiado larga.")
];

const statusValidation = [
    body("status")
        .isIn(["pendiente", "confirmado", "entregado", "cancelado"])
        .withMessage("Estado no válido.")
];

const idValidation = [
    param("id").isMongoId().withMessage("Identificador no válido.")
];

// Cliente autenticado.
router.post("/", authenticate, createValidation, createOrder);
router.get("/mine", authenticate, listMyOrders);
router.patch(
    "/:id/cancel",
    authenticate,
    idValidation,
    cancelMyOrder
);

// Administración.
router.get("/", authenticate, authorize("admin"), listAllOrders);
router.patch(
    "/:id/status",
    authenticate,
    authorize("admin"),
    idValidation,
    statusValidation,
    updateOrderStatus
);

// Admin registra un pago recibido en el local (caja).
router.patch(
    "/:id/pay-local",
    authenticate,
    authorize("admin"),
    idValidation,
    payLocalValidation,
    registerLocalPayment
);

export default router;
