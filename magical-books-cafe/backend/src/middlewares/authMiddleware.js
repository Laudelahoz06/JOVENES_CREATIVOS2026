import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Debes iniciar sesión para continuar."
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Token no proporcionado."
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.sub)
            .select("+revokedTokens");

        if (!user || !user.active) {
            return res.status(401).json({
                success: false,
                message: "La cuenta no existe o está desactivada."
            });
        }

        if (user.revokedTokens.includes(token)) {
            return res.status(401).json({
                success: false,
                message: "La sesión ha sido cerrada."
            });
        }

        req.user = user;
        req.token = token;

        next();

    } catch (error) {
        if (error.name === "TokenExpiredError" ||
            error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "La sesión no es válida o ha expirado."
            });
        }

        next(error);
    }
};