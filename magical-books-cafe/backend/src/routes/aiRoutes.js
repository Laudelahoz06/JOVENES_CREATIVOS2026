import express from "express";
import { body } from "express-validator";

import { assistant } from "../controllers/aiController.js";

const router = express.Router();

router.post(
    "/assistant",
    [
        body("message")
            .trim()
            .isLength({ min: 2, max: 500 })
            .withMessage("El mensaje debe tener entre 2 y 500 caracteres.")
    ],
    assistant
);

export default router;
