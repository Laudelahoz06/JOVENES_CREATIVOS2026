import { validationResult } from "express-validator";
import ContactMessage from "../models/ContactMessage.js";

const checkValidation = (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: "Revisa los datos del formulario.",
            errors: errors.array().map((error) => ({
                field: error.path,
                message: error.msg
            }))
        });

        return false;
    }

    return true;
};

// POST /api/contact — público (dueños o desarrolladores). Con
// optionalAuth, si el cliente envía su token el mensaje queda
// vinculado a su cuenta para verlo en "Mis mensajes".
export const createMessage = async (req, res, next) => {
    try {
        if (!checkValidation(req, res)) return;

        const { name, email, phone, subject, message, audience } = req.body;

        const created = await ContactMessage.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone ? phone.trim() : "",
            subject: subject.trim(),
            message: message.trim(),
            audience: audience === "desarrolladores"
                ? "desarrolladores"
                : "duenos",
            user: req.user ? req.user._id : null
        });

        return res.status(201).json({
            success: true,
            message: "Mensaje enviado correctamente. Te responderemos pronto.",
            contact: { id: created._id, status: created.status }
        });

    } catch (error) {
        next(error);
    }
};

// GET /api/contact — bandeja de entrada (solo admin).
export const listMessages = async (req, res, next) => {
    try {
        const filter = {};

        if (req.query.status) filter.status = req.query.status;
        if (req.query.audience) filter.audience = req.query.audience;

        const messages = await ContactMessage.find(filter)
            .sort({ createdAt: -1 })
            .limit(Number(req.query.limit) || 50)
            .lean();

        const unread = await ContactMessage.countDocuments({
            status: "nuevo"
        });

        return res.status(200).json({
            success: true,
            messages,
            unread
        });

    } catch (error) {
        next(error);
    }
};

// PATCH /api/contact/:id/read — marca un mensaje como leído (admin).
export const markAsRead = async (req, res, next) => {
    try {
        const updated = await ContactMessage.findByIdAndUpdate(
            req.params.id,
            { status: "leido" },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "El mensaje no existe."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Mensaje marcado como leído.",
            contact: updated
        });

    } catch (error) {
        next(error);
    }
};

// DELETE /api/contact/:id — elimina un mensaje (admin).
export const deleteMessage = async (req, res, next) => {
    try {
        const removed = await ContactMessage.findByIdAndDelete(
            req.params.id
        );

        if (!removed) {
            return res.status(404).json({
                success: false,
                message: "El mensaje no existe."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Mensaje eliminado."
        });

    } catch (error) {
        next(error);
    }
};

// PATCH /api/contact/:id/reply — responde un mensaje (admin).
// La respuesta queda guardada en el documento y el mensaje pasa a
// "leido"; el cliente la ve en GET /contact/my.
export const replyMessage = async (req, res, next) => {
    try {
        if (!checkValidation(req, res)) return;

        const reply = req.body.reply.trim();

        const updated = await ContactMessage.findByIdAndUpdate(
            req.params.id,
            {
                reply,
                repliedAt: new Date(),
                status: "leido"
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "El mensaje no existe."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Respuesta guardada. El cliente podrá verla en su cuenta.",
            contact: updated
        });

    } catch (error) {
        next(error);
    }
};

// GET /api/contact/my — mensajes que la cuenta envió con sesión
// iniciada, con las respuestas del equipo (cliente autenticado).
export const listMyMessages = async (req, res, next) => {
    try {
        const messages = await ContactMessage.find({
            user: req.user._id
        })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        return res.status(200).json({
            success: true,
            messages
        });

    } catch (error) {
        next(error);
    }
};

// GET /api/contact/unread-count — contador liviano para el badge
// del menú lateral del panel (admin).
export const unreadCount = async (req, res, next) => {
    try {
        const unread = await ContactMessage.countDocuments({
            status: "nuevo"
        });

        return res.status(200).json({
            success: true,
            unread
        });

    } catch (error) {
        next(error);
    }
};
