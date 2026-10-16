
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();


// añadir cabeceras http para mejorar segurisdad
app.use(helmet());
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        methods: ["GET", "POST", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
       
    })
);

//limitemps las solicitudes repetidas para reducir los abusos.
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 200,
        standardHeaders: "draft-7",
        legacyHeaders: false,
    })
);

//limitemos el tamaño del json recibido
app.use(express.json({ limit: "1mb"}));

//endpoint sencillo para comprobar estado de api.
app.get("/api/healt", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Magical books coffee API está funcionando.",
    });
} );


//programamos las respuestas para las rutas que no existen o no estan estipuladas
app.use((err, req, res, next) => {
    console.error(err);

    if (res.headersSent) {
        return next(err);
    }

    res.status(err.status || 500).json({
        success: false,
        message:
        process.env.NODE_ENV === "produccion"
        ? "Ha ocurrido un error interno"
        :err.message,
    });
});

export default app;