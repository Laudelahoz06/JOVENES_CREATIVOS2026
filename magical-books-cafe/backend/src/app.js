import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import adminProductRoutes from "./routes/adminProductRoutes.js";

const app = express();


// añadir cabeceras http para mejorar segurisdad
app.use(helmet());

// 2. Configuración de comunicación con React.
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
})  );

// 3. Permitir solicitudes con información JSON.
app.use(express.json({ limit: "1mb" }));

// 4. Limitar solicitudes para prevenir abusos.
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false
});

app.use("/api", apiLimiter);

// conectar ruta de autenticación.
app.use("/api/auth", authRoutes);


app.use("/api/admin", adminRoutes);

// 5. Ruta para comprobar que la API funciona.
app.get("/api/health", (req, res) => {

    res.status(200).json({
        success: true,
        message: "Magical Books Café API funcionando",
        database: "MongoDB Atlas",
        timestamp: new Date().toISOString()
    });

});

// 6. Respuesta para rutas inexistentes.
app.use((req, res) => {

    res.status(404).json({
        success: false,
        message: "La ruta solicitada no existe."
    });

});

// 7. Manejo centralizado de errores.
app.use((error, req, res, next) => {

    console.error(error);

    res.status(500).json({
        success: false,
        message: "Error interno del servidor."
    });

});


app.use("/api/auth", authRoutes);

app.use("/api/products", productRoutes);

app.use("/api/admin/products", adminProductRoutes);


export default app;     