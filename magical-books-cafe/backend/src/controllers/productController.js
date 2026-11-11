import mongoose from "mongoose";
import { validationResult } from "express-validator";

import Product from "../models/Product.js";
import InventoryMovement from "../models/InventoryMovement.js";

const checkValidation = (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: "Los datos enviados no son válidos.",
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg
            }))
        });

        return false;
    }

    return true;
};

const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildFilters = (query, includeInactive = false) => {
    const filters = {};

    if (!includeInactive) {
        filters.active = true;
    }

    if (query.type) filters.type = query.type;
    if (query.category) filters.category = query.category;
    if (query.format) filters.formats = query.format;

    if (query.featured !== undefined) {
        filters.featured = query.featured;
    }

    if (query.search) {
        const search = new RegExp(escapeRegex(query.search), "i");

        filters.$or = [
            { name: search },
            { description: search },
            { sku: search },
            { category: search }
        ];
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
        filters.price = {};

        if (query.minPrice !== undefined) {
            filters.price.$gte = query.minPrice;
        }

        if (query.maxPrice !== undefined) {
            filters.price.$lte = query.maxPrice;
        }
    }

    return filters;
};

const getSort = (sort) => {
    const allowedSorts = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        priceAsc: { price: 1 },
        priceDesc: { price: -1 },
        nameAsc: { name: 1 },
        nameDesc: { name: -1 }
    };

    return allowedSorts[sort] || allowedSorts.newest;
};

const paginateProducts = async (filters, query) => {
    const page = query.page || 1;
    const limit = query.limit || 12;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
        Product.find(filters)
            .sort(getSort(query.sort))
            .skip(skip)
            .limit(limit)
            .lean(),

        Product.countDocuments(filters)
    ]);

    return {
        products,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPreviousPage: page > 1
        }
    };
};

// CATÁLOGO PÚBLICO
export const listPublicProducts = async (req, res, next) => {
    try {
        if (!checkValidation(req, res)) return;

        if (
            req.query.minPrice !== undefined &&
            req.query.maxPrice !== undefined &&
            req.query.minPrice > req.query.maxPrice
        ) {
            return res.status(400).json({
                success: false,
                message: "El precio mínimo no puede superar el máximo."
            });
        }

        const filters = buildFilters(req.query);
        const result = await paginateProducts(filters, req.query);

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {
        next(error);
    }
};

// CONSULTAR UN PRODUCTO PÚBLICO
export const getPublicProduct = async (req, res, next) => {
    try {
        if (!checkValidation(req, res)) return;

        const product = await Product.findOne({
            _id: req.params.id,
            active: true
        }).lean();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Producto no encontrado."
            });
        }

        return res.status(200).json({
            success: true,
            product
        });

    } catch (error) {
        next(error);
    }
};

// CONSULTAR TODOS LOS PRODUCTOS DESDE ADMINISTRACIÓN
export const listAdminProducts = async (req, res, next) => {
    try {
        if (!checkValidation(req, res)) return;

        const filters = buildFilters(req.query, true);
        const result = await paginateProducts(filters, req.query);

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {
        next(error);
    }
};

// CREAR PRODUCTO
export const createProduct = async (req, res, next) => {
    try {
        if (!checkValidation(req, res)) return;

        const {
            sku,
            name,
            description,
            type,
            category,
            price,
            image,
            imageUrl,
            formats,
           // stock,
            rental,
            featured
        } = req.body;

        const product = await Product.create({
            sku,
            name,
            description,
            type,
            category,
            price,
            image: image || imageUrl || "",
            formats: formats || [],
          //  stock: stock ?? 0,
            rental: rental || {},
            featured: featured ?? false
        });

        return res.status(201).json({
            success: true,
            message: "Producto creado correctamente.",
            product
        });
/*
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Ya existe un producto con ese código SKU."
            });
        }

        next(error);
    }*/




        } catch (error) {

    console.error("========== ERROR AL CREAR PRODUCTO ==========");

    console.error("Código:", error.code);
    console.error("Índice:", error.keyPattern);
    console.error("Valor duplicado:", error.keyValue);
    console.error("Mensaje:", error.message);

    console.error("==============================================");

    if (error.code === 11000) {
        return res.status(409).json({
            success: false,
            message: "Se produjo un conflicto con un índice único.",
            details: {
                field: error.keyPattern,
                value: error.keyValue
            }
        });
    }

    next(error);
}


};

// ACTUALIZAR PRODUCTO
export const updateProduct = async (req, res, next) => {
    try {
        if (!checkValidation(req, res)) return;

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Producto no encontrado."
            });
        }

        // Lista explícita de campos editables.
        const allowedFields = [
            "sku",
            "name",
            "description",
            "type",
            "category",
            "price",
            "image",
            "formats",
            "featured"
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                product[field] = req.body[field];
            }
        }

        if (req.body.imageUrl !== undefined && req.body.image === undefined) {
            product.image = req.body.imageUrl;
        }

        if (req.body.rental !== undefined) {
            const rentalFields = [
                "enabled",
                "dailyPrice",
                "maxDays"
            ];

            for (const field of rentalFields) {
                if (req.body.rental[field] !== undefined) {
                    product.rental[field] = req.body.rental[field];
                }
            }
        }

        // El stock se modifica exclusivamente desde la ruta de inventario.
        await product.save();

        return res.status(200).json({
            success: true,
            message: "Producto actualizado correctamente.",
            product
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "El código SKU ya está registrado."
            });
        }

        next(error);
    }
};

// ACTIVAR O DESACTIVAR PRODUCTO
export const changeProductStatus = async (req, res, next) => {
    try {
        if (!checkValidation(req, res)) return;

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Producto no encontrado."
            });
        }

        product.active = req.body.active;
        await product.save();

        return res.status(200).json({
            success: true,
            message: product.active
                ? "Producto activado correctamente."
                : "Producto desactivado correctamente.",
            product
        });

    } catch (error) {
        next(error);
    }
};

// REGISTRAR MOVIMIENTO DE INVENTARIO
export const adjustStock = async (req, res, next) => {
    const session = await mongoose.startSession();

    try {
        if (!checkValidation(req, res)) {
            await session.endSession();
            return;
        }

        const { operation, quantity, reason } = req.body;

        let updatedProduct;
        let movement;

        await session.withTransaction(async () => {
            const product = await Product.findById(req.params.id)
                .session(session);

            if (!product) {
                const error = new Error("Producto no encontrado.");
                error.statusCode = 404;
                throw error;
            }

            const previousStock = product.stock;

            const newStock = operation === "restock"
                ? previousStock + quantity
                : quantity;

            const difference = newStock - previousStock;

            if (difference === 0) {
                const error = new Error(
                    "El inventario no presenta ningún cambio."
                );
                error.statusCode = 400;
                throw error;
            }

            product.stock = newStock;

            await product.save({ session });

            const movements = await InventoryMovement.create(
                [{
                    product: product._id,
                    performedBy: req.user._id,
                    type: operation,
                    quantity: difference,
                    previousStock,
                    newStock,
                    reason
                }],
                { session }
            );

            updatedProduct = product;
            movement = movements[0];
        });

        return res.status(200).json({
            success: true,
            message: "Inventario actualizado correctamente.",
            product: updatedProduct,
            movement
        });

    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }

        next(error);

    } finally {
        await session.endSession();
    }
};

// HISTORIAL DE INVENTARIO
export const listInventoryMovements = async (req, res, next) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(
            Math.max(Number(req.query.limit) || 20, 1),
            50
        );

        const filters = {};

        if (req.query.productId) {
            if (!mongoose.isValidObjectId(req.query.productId)) {
                return res.status(400).json({
                    success: false,
                    message: "El identificador del producto no es válido."
                });
            }

            filters.product = req.query.productId;
        }

        const [movements, total] = await Promise.all([
            InventoryMovement.find(filters)
                .populate("product", "name sku")
                .populate("performedBy", "name email")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),

            InventoryMovement.countDocuments(filters)
        ]);

        return res.status(200).json({
            success: true,
            movements,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        next(error);
    }
};