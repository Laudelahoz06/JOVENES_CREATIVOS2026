import express from "express";
import { body } from "express-validator";

import {
    listAdminExperiences,
    createExperience,
    updateExperience,
    changeExperienceStatus,
    deleteExperience
} from "../controllers/experienceController.js";

import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

import {
    createExperienceValidation,
    updateExperienceValidation,
    experienceIdValidation,
    experienceQueryValidation
} from "../utils/experienceValidators.js";

const router = express.Router();

// Todas las rutas de este módulo requieren ser administrador.
router.use(authenticate, authorize("admin"));

// Consultar experiencias, incluidas las inactivas.
router.get(
    "/",
    experienceQueryValidation,
    listAdminExperiences
);

// Crear experiencia.
router.post(
    "/",
    createExperienceValidation,
    createExperience
);

// Editar experiencia.
router.patch(
    "/:id",
    updateExperienceValidation,
    updateExperience
);

// Activar o desactivar.
router.patch(
    "/:id/status",
    [
        ...experienceIdValidation,
        body("active")
            .isBoolean()
            .withMessage("El estado debe ser verdadero o falso.")
            .toBoolean()
    ],
    changeExperienceStatus
);

// Eliminar experiencia.
router.delete(
    "/:id",
    experienceIdValidation,
    deleteExperience
);

export default router;
