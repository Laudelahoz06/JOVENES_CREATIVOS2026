import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { conectarBd } from "./config/database.js";
const PORT = process.env.PORT || 5000;


// Iniciamos primero la conexión y después el servidor.
async function iniciarServer() {
    try {
        await conectarBd();
        app.listen(PORT, () => {
            console.log(`API disponible en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("No fue posible iniciar el server:", error.message);
        process.exit(1);
    }
}

iniciarServer();