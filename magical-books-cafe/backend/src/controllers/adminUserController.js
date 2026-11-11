import { validationResult } from "express-validator";

import User from "../models/User.js";

// GET /api/admin/users — lista de usuarios (admin).
export const listUsers = async (req, res, next) => {
    try {
        const filter = {};

        if (req.query.role) filter.role = req.query.role;

        const users = await User.find(filter)
            .select("name email role active phone createdAt")
            .sort({ createdAt: -1 })
            .limit(Number(req.query.limit) || 100)
            .lean();

        const stats = {
            total: users.length,
            admins: users.filter((user) => user.role === "admin").length,
            inactivos: users.filter((user) => !user.active).length
        };

        return res.status(200).json({
            success: true,
            users,
            stats
        });

    } catch (error) {
        next(error);
    }
};

// PATCH /api/admin/users/:id — cambia rol o estado (admin).
export const updateUser = async (req, res, next) => {
    try {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Datos no válidos.",
                errors: errors.array().map((error) => ({
                    field: error.path,
                    message: error.msg
                }))
            });
        }

        const { role, active } = req.body;
        const update = {};

        if (role !== undefined) update.role = role;
        if (active !== undefined) update.active = active;

        // Un administrador no se puede desactivar a sí mismo.
        if (
            String(req.params.id) === String(req.user._id) &&
            active === false
        ) {
            return res.status(400).json({
                success: false,
                message: "No puedes desactivar tu propia cuenta."
            });
        }

        const user = await User.findByIdAndUpdate(req.params.id, update, {
            new: true
        }).select("name email role active");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "El usuario no existe."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Usuario actualizado.",
            user
        });

    } catch (error) {
        next(error);
    }
};
