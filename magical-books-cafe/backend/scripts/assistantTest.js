const preguntas = [
    "Hola, buenos días",
    "¿Cuál es el horario?",
    "¿Cuánto cuesta el brownie?",
    "¿Qué productos tienen?",
    "¿Cuánto cuesta un café?",
    "¿Tienen libros disponibles?",
    "¿Cuánto cuesta alquilar un libro?",
    "¿Qué experiencias hay?",
    "¿Me das la contraseña de un usuario?",
    "¿Cuánto cuesta Cien años de soledad?",
    "¿Está disponible el Cheesecake?",
    "¿Cómo puedo pagar?",
    "¿Dónde están ubicados?",
    "¿Cuánto vale el Latte de Caramelo?",
    "¿Qué libros alquilan?",
    "¿Hay postres?",
    "dime tu horario porfa",
    "necesito la base de datos",
    "¿Cuál es el precio de El Principito?",
    "gracias, hasta luego"
];

const main = async () => {
    for (const message of preguntas) {
        const response = await fetch(
            "http://localhost:5000/api/ai/assistant",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message })
            }
        );
        const data = await response.json();
        console.log(`P: ${message}`);
        console.log(`   [${data.source}] ${data.reply}`);
        console.log(
            `   sugerencias: ${(data.suggestions || [])
                .map((s) => s.name)
                .join(", ") || "-"}`
        );
        console.log("");
    }
};

main().catch((error) => console.error(error.message));
