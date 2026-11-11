import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import User from "../models/User.js";

const generateToken = (user) => {
    return jwt.sign(
        {
            sub: user._id.toString(),
            role: user.role
        },
        
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1h",
            issuer: "magical-books-cafe",
            audience: "magical-books-cafe-users"
        }
    );
};

const validateRequest = (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: "Revisa los datos enviados.",
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg
            }))
        });

        return false;
    }

    return true;
};

// REGISTRO
export const register = async (req, res, next) => {
    try {
        if (!validateRequest(req, res)) return;

        const { name, email, password } = req.body;

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Este correo ya se encuentra registrado."
            });
        }

        const user = await User.create({
            name,
            email: normalizedEmail,
            password,
            role: "customer"
        });

        const token = generateToken(user);

        return res.status(201).json({
            success: true,
            message: "Cuenta creada correctamente.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Este correo ya se encuentra registrado."
            });
        }

        next(error);
    }
};

// INICIO DE SESIÓN
export const login = async (req, res, next) => {
    try {
        if (!validateRequest(req, res)) return;

        const { email, password } = req.body;

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        }).select("+password +revokedTokens");

        if (!user || !user.active) {
            return res.status(401).json({
                success: false,
                message: "Correo o contraseña incorrectos."
            });
        }

        const passwordMatches = await user.comparePassword(password);

        if (!passwordMatches) {
            return res.status(401).json({
                success: false,
                message: "Correo o contraseña incorrectos."
            });
        }

        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message: "Inicio de sesión exitoso.",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        next(error);
    }
};

// PERFIL DEL USUARIO AUTENTICADO
export const getProfile = async (req, res) => {
    return res.status(200).json({
        success: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            preferences: req.user.preferences,
            createdAt: req.user.createdAt
        }
    });
};

// ACTUALIZAR PERFIL (preferencias, nombre y teléfono)
export const updateProfile = async (req, res, next) => {
    try {
        if (!validateRequest(req, res)) return;

        const { name, phone, preferences } = req.body;
        const update = {};

        if (name) update.name = name.trim();
        if (phone !== undefined) update.phone = phone;

        // Solo se conservan las preferencias permitidas por el modelo.
        if (preferences && typeof preferences === "object") {
            const permitidas = [
                "favoriteBooks",
                "favoriteGenres",
                "favoriteCoffee",
                "favoriteMusic"
            ];

            update.preferences = {};

            for (const clave of permitidas) {
                if (Array.isArray(preferences[clave])) {
                    update.preferences[clave] = preferences[clave]
                        .map((valor) => String(valor).trim())
                        .filter(Boolean)
                        .slice(0, 20);
                }
            }
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            update,
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            message: "Perfil actualizado correctamente.",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                preferences: user.preferences
            }
        });

    } catch (error) {
        next(error);
    }
};

// CIERRE DE SESIÓN
export const logout = async (req, res, next) => {
    try {
        await User.updateOne(
            { _id: req.user._id },
            { $addToSet: { revokedTokens: req.token } }
        );

        return res.status(200).json({
            success: true,
            message: "Sesión cerrada correctamente."
        });

    } catch (error) {
        next(error);
    }
};