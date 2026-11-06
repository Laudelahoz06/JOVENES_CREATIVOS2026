import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

const router = express.Router();

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