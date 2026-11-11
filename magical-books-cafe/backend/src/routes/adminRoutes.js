import express from "express";
import { body, param } from "express-validator";

import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

import {
    listUsers,
    updateUser
} from "../controllers/adminUserController.js";

import { getAdminStats } from "../controllers/adminStatsController.js";

const router = express.Router();

// Dashboard: indicadores y series para las gráficas.
router.get(
    "/stats",
    authenticate,
    authorize("admin"),
    getAdminStats
);

// Gestión de usuarios (rol y estado).
router.get(
    "/users",
    authenticate,
    authorize("admin"),
    listUsers
);

router.patch(
    "/users/:id",
    authenticate,
    authorize("admin"),
    [
        param("id").isMongoId().withMessage("Identificador no válido."),

        body("role")
            .optional()
            .isIn(["customer", "admin", "staff"])
            .withMessage("Rol no válido."),

        body("active")
            .optional()
            .isBoolean()
            .withMessage("El estado debe ser verdadero o falso.")
            .toBoolean()
    ],
    updateUser
);

// Ruta temporal para verificar los permisos administrativos.
router.get(
    "/access-test",
    authenticate,
    authorize("admin"),
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "Acceso administrativo autorizado."
        });
    }
);

export default router;