import { validationResult } from "express-validator";

import Experience from "../models/Experience.js";

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

    if (query.category) filters.category = query.category;

    if (query.featured !== undefined) {
        filters.featured = query.featured;
    }

    if (query.search) {
        const search = new RegExp(escapeRegex(query.search), "i");

        filters.$or = [
            { title: search },
            { description: search },
            { category: search }
        ];
    }

    return filters;
};

const getSort = (sort) => {
    const allowedSorts = {
        newest: { createdAt: -1 },
        oldest: { createdAt: 1 },
        order: { order: 1, createdAt: 1 },
        titleAsc: { title: 1 },
        titleDesc: { title: -1 }
    };

    return allowedSorts[sort] || allowedSorts.order;
};

const paginateExperiences = async (filters, query) => {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const [experiences, total] = await Promise.all([
        Experience.find(filters)
            .sort(getSort(query.sort))
            .skip(skip)
            .limit(limit)
            .lean(),

        Experience.countDocuments(filters)
    ]);

    return {
        experiences,
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
export const listPublicExperiences = async (req, res, next) => {
    try {
        if (!checkValidation(req, res)) return;

        const filters = buildFilters(req.query);
        const result = await paginateExperiences(filters, req.query);

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {
        next(error);
    }
};

// CONSULTAR UNA EXPERIENCIA PÚBLICA
export const getPublicExperience = async (req, res, next) => {
    try {
        if (!checkValidation(req, res)) return;

        const experience = await Experience.findOne({
            _id: req.params.id,
            active: true
        }).lean();

        if (!experience) {
            return res.status(404).json({
                success: false,
                message: "Experiencia no encontrada."
            });
        }

        return res.status(200).json({
            success: true,
            experience
        });

    } catch (error) {
        next(error);
    }
};

// CONSULTAR TODAS LAS EXPERIENCIAS DESDE ADMINISTRACIÓN
export const listAdminExperiences = async (req, res, next) => {
    try {
        if (!checkValidation(req, res)) return;

        const filters = buildFilters(req.query, true);
        const result = await paginateExperiences(filters, req.query);

        return res.status(200).json({
            success: true,
            ...result
        });

    } catch (error) {
        next(error);
    }
};

// CREAR EXPERIENCIA
export const createExperience = async (req, res, next) => {
    try {
        if (!checkValidation(req, res)) return;

        const {
            title,
            description,
            icon,
            image,
            to,
            action,
            spotifyUrl,
            whatsappUrl,
            category,
            order,
            featured,
            active
        } = req.body;

        const experience = await Experience.create({
            title,
            description,
            icon: icon || "✦",
            image: image || "",
            to: to || "",
            action: action || "",
            spotifyUrl: spotifyUrl || "",
            whatsappUrl: whatsappUrl || "",
            category: category || "General",
            order: order ?? 0,
            featured: featured ?? false,
            active: active ?? true
        });

        return res.status(201).json({
            success: true,
            message: "Experiencia creada correctamente.",
            experience
        });

    } catch (error) {
        next(error);
    }
};

// ACTUALIZAR EXPERIENCIA
export const updateExperience = async (req, res, next) => {
    try {
        if (!checkValidation(req, res)) return;

        const experience = await Experience.findById(req.params.id);

        if (!experience) {
            return res.status(404).json({
                success: false,
                message: "Experiencia no encontrada."
            });
        }

        const allowedFields = [
            "title",
            "description",
            "icon",
            "image",
            "to",
            "action",
            "spotifyUrl",
            "whatsappUrl",
            "category",
            "order",
            "featured",
            "active"
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                experience[field] = req.body[field];
            }
        }

        await experience.save();

        return res.status(200).json({
            success: true,
            message: "Experiencia actualizada correctamente.",
            experience
        });

    } catch (error) {
        next(error);
    }
};

// ACTIVAR O DESACTIVAR EXPERIENCIA
export const changeExperienceStatus = async (req, res, next) => {
    try {
        if (!checkValidation(req, res)) return;

        const experience = await Experience.findById(req.params.id);

        if (!experience) {
            return res.status(404).json({
                success: false,
                message: "Experiencia no encontrada."
            });
        }

        experience.active = req.body.active;
        await experience.save();

        return res.status(200).json({
            success: true,
            message: experience.active
                ? "Experiencia activada correctamente."
                : "Experiencia desactivada correctamente.",
            experience
        });

    } catch (error) {
        next(error);
    }
};

// ELIMINAR EXPERIENCIA
export const deleteExperience = async (req, res, next) => {
    try {
        if (!checkValidation(req, res)) return;

        const experience = await Experience.findByIdAndDelete(req.params.id);

        if (!experience) {
            return res.status(404).json({
                success: false,
                message: "Experiencia no encontrada."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Experiencia eliminada correctamente.",
            experience
        });

    } catch (error) {
        next(error);
    }
};
