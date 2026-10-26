import mongoose from "mongoose";

/**
 Se establece la conexion con MongoDB. la uri se obtiene del entorno para no escribir credenciales directamente en el codigo fuente y mantener la seguridad, cambiar segun sea el caso.
 */

 export async function conectarBd() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error("Faltaa configurar MONGODB_URI en el archivo .env");
    }

    await mongoose.connect(uri);
    console.log("Conexión a la base de datos establecida correctamente.")
 }