import { validationResult } from "express-validator";
import mongoose from "mongoose";

import Rental from "../models/Rental.js";
import Product from "../models/Product.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const checkValidation = (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: "Revisa los datos del alquiler.",
            errors: errors.array().map((error) => ({
                field: error.path,
                message: error.msg
            }))
        });

        return false;
    }

    return true;
};

// POST /api/rentals — crea una solicitud de alquiler de libro.
export const createRental = async (req, res, next) => {
    try {
        if (!checkValidation(req, res)) return;

        const { productId, format, startDate, endDate, notes } = req.body;

        const product = await Product.findById(productId);

        if (!product || !product.active) {
            return res.status(404).json({
                success: false,
                message: "El libro no está disponible."
            });
        }

        if (product.type !== "book" || !product.rental?.enabled) {
            return res.status(400).json({
                success: false,
                message: "Este producto no admite alquiler."
            });
        }

        if (!product.formats.includes(format)) {
            return res.status(400).json({
                success: false,
                message: `Formatos disponibles: ${product.formats.join(", ")}.`
            });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        // Días completos de alquiler (mínimo 1).
        const days = Math.max(
            1,
            Math.ceil((end.getTime() - start.getTime()) / DAY_MS)
        );

        const total = Number(product.rental.dailyPrice) * days;
        const ticketCode = `MBC-${Date.now().toString(36).toUpperCase()}-${
            Math.random().toString(36).slice(2, 6).toUpperCase()
        }`;

        const rental = await Rental.create({
            user: req.user._id,
            product: product._id,
            format,
            startDate: start,
            endDate: end,
            total,
            notes: notes || "",
            ticketCode
        });

        return res.status(201).json({
            success: true,
            message: "Solicitud de alquiler registrada.",
            rental: {
                id: rental._id,
                ticketCode: rental.ticketCode,
                days,
                total,
                status: rental.status,
                paymentStatus: rental.paymentStatus
            }
        });

    } catch (error) {
        next(error);
    }
};

// GET /api/rentals/mine — alquileres del usuario autenticado.
export const listMyRentals = async (req, res, next) => {
    try {
        const rentals = await Rental.find({ user: req.user._id })
            .populate("product", "name image sku category")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            rentals
        });

    } catch (error) {
        next(error);
    }
};

// GET /api/rentals — bandeja administrativa de alquileres (admin).
export const listAllRentals = async (req, res, next) => {
    try {
        const filter = {};

        if (req.query.status) filter.status = req.query.status;

        const rentals = await Rental.find(filter)
            .populate("product", "name sku")
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .limit(Number(req.query.limit) || 100)
            .lean();

        return res.status(200).json({
            success: true,
            rentals
        });

    } catch (error) {
        next(error);
    }
};

// PATCH /api/rentals/:id/status — actualiza estado (admin).
export const updateRentalStatus = async (req, res, next) => {
    try {
        if (!checkValidation(req, res)) return;

        const { status, paymentStatus } = req.body;

        const update = {};

        if (status) update.status = status;
        if (paymentStatus) update.paymentStatus = paymentStatus;

        const rental = await Rental.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        );

        if (!rental) {
            return res.status(404).json({
                success: false,
                message: "El alquiler no existe."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Alquiler actualizado.",
            rental
        });

    } catch (error) {
        next(error);
    }
};

export { mongoose };
