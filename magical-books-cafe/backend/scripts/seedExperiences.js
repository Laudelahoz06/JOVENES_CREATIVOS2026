// Siembra las experiencias de la sección del home en MongoDB.
// Uso: npm run seed:experiences

import "dotenv/config";

import dns from "dns";
import mongoose from "mongoose";

import Experience from "../src/models/Experience.js";

// Mismo fallback DNS que src/config/database.js.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const experiences = [
    {
        title: "Café",
        description:
            "Sabores que inspiran: espresso, filtrados y combinaciones de la casa.",
        icon: "☕",
        image:
            "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80",
        to: "/catalogo",
        category: "Cafetería",
        order: 1,
        featured: true
    },
    {
        title: "Libros",
        description:
            "Historias para descubrir, desde clásicos hasta novedades.",
        icon: "📚",
        image:
            "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80",
        to: "/catalogo",
        category: "Lectura",
        order: 2,
        featured: true
    },
    {
        title: "Comunidad",
        description:
            "Conecta con otros lectores, artistas y creadores del barrio.",
        icon: "✦",
        image:
            "https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=800&q=80",
        to: "/contacto",
        category: "Comunidad",
        order: 3
    },
    {
        title: "Coworking",
        description:
            "Un espacio para crear: wifi, enchufes y buen café sin apuros.",
        icon: "💻",
        image:
            "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=800&q=80",
        to: "/contacto",
        category: "Espacio",
        order: 4
    },
    {
        title: "Música",
        description:
            "Acompaña cada momento con nuestra selección de sonidos y agrega los tuyos a la playlist.",
        icon: "♫",
        image:
            "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
        to: "",
        // Reemplaza por la URL de tu playlist colaborativa de Spotify.
        spotifyUrl: "",
        category: "Ambiente",
        order: 5
    },
    {
        title: "App Inteligente",
        description:
            "Pregunta, descubre y planifica tu visita con nuestra asistente IA.",
        icon: "✧",
        image:
            "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=800&q=80",
        to: "",
        action: "assistant",
        category: "Tecnología",
        order: 6
    },
    {
        title: "Degustaciones",
        description:
            "Cata guiada de nuestras variedades de café junto al barista.",
        icon: "☕",
        image:
            "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
        to: "/catalogo",
        category: "Cafetería",
        order: 7,
        featured: true
    },
    {
        title: "Clubes literarios",
        description:
            "Lectura compartida y conversación mediada cada mes.",
        icon: "📖",
        image:
            "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80",
        to: "/contacto",
        category: "Lectura",
        order: 8
    },
    {
        title: "Reservas de espacio",
        description:
            "Mesa, rincón o sala para tu grupo, con reserva previa.",
        icon: "🗓️",
        image:
            "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
        to: "/contacto",
        category: "Espacio",
        order: 9
    }
];

const main = async () => {
    console.log("Sembrando experiencias...");

    await mongoose.connect(process.env.MONGODB_URI);

    try {
        let creadas = 0;
        let actualizadas = 0;

        for (const item of experiences) {
            const result = await Experience.updateOne(
                { title: item.title },
                {
                    $set: {
                        description: item.description,
                        icon: item.icon,
                        image: item.image,
                        to: item.to || "",
                        action: item.action || "",
                        spotifyUrl: item.spotifyUrl || "",
                        category: item.category,
                        order: item.order,
                        featured: item.featured ?? false,
                        active: true
                    },
                    $setOnInsert: {
                        title: item.title
                    }
                },
                { upsert: true }
            );

            if (result.upsertedCount > 0) creadas += 1;
            else if (result.modifiedCount > 0) actualizadas += 1;
        }

        const total = await Experience.countDocuments();

        console.log(
            `Listo: ${creadas} creadas, ${actualizadas} actualizadas, total en BD: ${total}.`
        );
    } finally {
        await mongoose.disconnect();
    }
};

main().catch((error) => {
    console.error("Error al sembrar experiencias:", error.message);
    process.exit(1);
});
