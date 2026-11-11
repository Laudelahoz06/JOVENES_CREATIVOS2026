import express from "express";
import { body, param } from "express-validator";

import {
    createRental,
    listMyRentals,
    listAllRentals,
    updateRentalStatus
} from "../controllers/rentalController.js";

import { authenticate } from "../middlewares/authMiddleware.js";
import { authorize } from "../middlewares/roleMiddleware.js";

const router = express.Router();

const createValidation = [
    body("productId")
        .isMongoId()
        .withMessage("Identificador de producto no válido."),

    body("format")
        .isIn(["digital", "kindle", "local_pc", "fisico"])
        .withMessage("Formato de alquiler no válido."),

    body("startDate")
        .isISO8601()
        .withMessage("Fecha de inicio no válida.")
        .toDate(),

    body("endDate")
        .isISO8601()
        .withMessage("Fecha de fin no válida.")
        .toDate(),

    body("notes")
        .optional()
        .trim()
        .isLength({ max: 300 })
];

const idValidation = [
    param("id").isMongoId().withMessage("Identificador no válido.")
];

// Cliente autenticado.
router.post("/", authenticate, createValidation, createRental);
router.get("/mine", authenticate, listMyRentals);

// Administración.
router.get("/", authenticate, authorize("admin"), listAllRentals);
router.patch(
    "/:id/status",
    authenticate,
    authorize("admin"),
    idValidation,
    updateRentalStatus
);

export default router;
