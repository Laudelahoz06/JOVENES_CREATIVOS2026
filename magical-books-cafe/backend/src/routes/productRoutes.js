import express from "express";

import {
    listPublicProducts,
    getPublicProduct
} from "../controllers/productController.js";

import {
    catalogQueryValidation,
    productIdValidation
} from "../utils/productValidators.js";

const router = express.Router();

router.get(
    "/",
    catalogQueryValidation,
    listPublicProducts
);

router.get(
    "/:id",
    productIdValidation,
    getPublicProduct
);

export default router;