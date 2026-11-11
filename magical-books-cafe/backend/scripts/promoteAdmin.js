import "dotenv/config";

import dns from "dns";
import mongoose from "mongoose";
import User from "../src/models/User.js";

// Mismo fallback DNS que src/config/database.js (el router local no
// responde consultas TXT que Atlas necesita para mongodb+srv).
dns.setServers(["8.8.8.8", "8.8.4.4"]);

// Uso: node scripts/promoteAdmin.js correo@ejemplo.com
async function promover() {
    const email = (process.argv[2] || "").toLowerCase().trim();

    if (!email) {
        console.error("Uso: node scripts/promoteAdmin.js correo@ejemplo.com");
        process.exitCode = 1;
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const user = await User.findOneAndUpdate(
            { email },
            { role: "admin", active: true },
            { new: true }
        ).select("name email role active");

        if (!user) {
            console.error(`No existe ningún usuario con el correo ${email}.`);
            process.exitCode = 1;
            return;
        }

        console.log(
            `Listo: ${user.name} <${user.email}> ahora es ${user.role} (activo: ${user.active}).`
        );

    } catch (error) {
        console.error("Error promoviendo usuario:", error.message);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
}

promover();
