import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import connectDB from "./config/database.js";



// Iniciamos primero la conexión y después el servidor.
async function iniciarServer() {
    try {
        // Primero conectamos MongoDB Atlas.
        await connectDB();
        
        // Después iniciamos Express.
        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
             console.log("----------------------------------");
            console.log("MAGICAL BOOKS CAFÉ");
            console.log(`Servidor activo en http://localhost:${PORT}`);
            console.log("----------------------------------");
        });
    } catch (error) {
        console.error("No fue posible iniciar el server:", error.message);
        process.exit(1);
    }
}

iniciarServer();