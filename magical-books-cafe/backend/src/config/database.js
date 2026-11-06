
import mongoose from "mongoose";

// Función encargada de conectar nuestra aplicación con MongoDB Atlas.
const connectDB = async () => {
    try {
        
        // Verificamos que exista la cadena de conexión.
        if (!process.env.MONGODB_URI) {
            throw new Error("No se encontró MONGODB_URI en el archivo .env");
        }

        // Establecemos la conexión con la base de datos.
        const connection = await mongoose.connect(
            process.env.MONGODB_URI
        );

        console.log("----------------------------------");
        console.log("¡Conexión exitosa con MongoDB Atlas!");
        console.log(`Servidor: ${connection.connection.host}`);
        console.log(`Base de datos: ${connection.connection.name}`);
        console.log("----------------------------------");

    } catch (error) {
        console.error("Error al conectar con MongoDB:");
        console.error(error.message);

        throw error;
    }
};

export default connectDB;
    