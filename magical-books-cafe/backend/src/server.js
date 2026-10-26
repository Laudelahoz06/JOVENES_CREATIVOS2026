const PORT = process.env.PORT || 3000;

// al conectarse mongo correctamente la api empieza a escuchar
async function iniciarServer() {
    try {
        await connectDatabase();
        app.listen(PORT, () => {
            console.log(`API disponible en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("No fue posible iniciar el server:", error.menssage);
        process.exit(1);
    }
}

iniciarServer();