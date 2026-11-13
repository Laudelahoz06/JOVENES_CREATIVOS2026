import express from "express";

import {
    listPublicExperiences,
    getPublicExperience
} from "../controllers/experienceController.js";

import {
    experienceQueryValidation,
    experienceIdValidation
} from "../utils/experienceValidators.js";

const router = express.Router();

router.get(
    "/",
    experienceQueryValidation,
    listPublicExperiences
);

router.get(
    "/:id",
    experienceIdValidation,
    getPublicExperience
);

export default router;
