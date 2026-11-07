import express from "express";
import { body } from "express-validator";

import {
    listAdminProducts,
    createProduct,
    updateProduct,
    changeProductStatus,
    adjustStock,
    listInventoryMovements
} from "../controllers/productController.js";

import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

import {
    createProductValidation,
    updateProductValidation,
    productIdValidation,
    catalogQueryValidation
} from "../utils/productValidators.js";

const router = express.Router();

// Todas las rutas de este módulo requieren ser administrador.
router.use(authenticate, authorize("admin"));

// Consultar productos, incluidos los inactivos.
router.get(
    "/",
    catalogQueryValidation,
    listAdminProducts
);

// Crear producto.
router.post(
    "/",
    createProductValidation,
    createProduct
);

// Historial de inventario.
router.get(
    "/inventory/movements",
    listInventoryMovements
);

// Editar producto.
router.patch(
    "/:id",
    updateProductValidation,
    updateProduct
);

// Activar o desactivar.
router.patch(
    "/:id/status",
    [
        ...productIdValidation,
        body("active")
            .isBoolean()
            .withMessage("El estado debe ser verdadero o falso.")
            .toBoolean()
    ],
    changeProductStatus
);

// Reposición o ajuste de existencias.
router.patch(
    "/:id/stock",
    [
        ...productIdValidation,

        body("operation")
            .isIn(["restock", "adjustment"])
            .withMessage("Operación de inventario no válida."),

        body("quantity")
            .isInt({ min: 1 })
            .withMessage("La cantidad debe ser un entero mayor que cero.")
            .toInt(),

        body("reason")
            .trim()
            .notEmpty()
            .withMessage("Debes indicar el motivo del movimiento.")
            .isLength({ max: 300 })
    ],
    adjustStock
);

export default router;