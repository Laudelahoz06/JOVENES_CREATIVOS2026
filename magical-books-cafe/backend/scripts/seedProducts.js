import "dotenv/config";

import dns from "dns";
import mongoose from "mongoose";
import Product from "../src/models/Product.js";

// Mismo fallback DNS que src/config/database.js (el router local no
// responde consultas TXT que Atlas necesita para mongodb+srv).
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const products = [
    {
        sku: "COF-001",
        name: "Café Moka Magical",
        description: "Moka cremoso con chocolate oscuro y un toque de canela.",
        type: "coffee",
        category: "Café",
        price: 12000,
        image:
            "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80",
        availableFor: ["purchase"],
        stock: 50,
        featured: true
    },
    {
        sku: "COF-002",
        name: "Latte de Caramelo",
        description: "Espresso suave con leche vaporizada y caramelo artesanal.",
        type: "coffee",
        category: "Café",
        price: 11000,
        image:
            "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80",
        availableFor: ["purchase"],
        stock: 50,
        featured: false
    },
    {
        sku: "DES-001",
        name: "Cheesecake artesanal",
        description: "Cheesecake horneado a mano con base de galleta y frutos rojos.",
        type: "dessert",
        category: "Postres",
        price: 15000,
        image:
            "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80",
        availableFor: ["purchase"],
        stock: 30,
        featured: true
    },
    {
        sku: "DES-002",
        name: "Brownie con helado",
        description: "Brownie tibio de chocolate con bola de helado de vainilla.",
        type: "dessert",
        category: "Postres",
        price: 13500,
        image:
            "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
        availableFor: ["purchase"],
        stock: 30,
        featured: false
    },
    {
        sku: "LIB-001",
        name: "El Principito",
        description: "Clásico de Antoine de Saint-Exupéry. Disponible en físico y digital.",
        type: "book",
        category: "Libros",
        price: 35000,
        image:
            "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80",
        availableFor: ["purchase", "rental"],
        formats: ["fisico", "digital"],
        rental: { enabled: true, dailyPrice: 2000, maxDays: 21 },
        stock: 5,
        featured: true
    },
    {
        sku: "LIB-002",
        name: "Cien años de soledad",
        description: "Obra maestra de Gabriel García Márquez. Edición en español.",
        type: "book",
        category: "Libros",
        price: 48000,
        image:
            "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
        availableFor: ["purchase", "rental"],
        formats: ["fisico"],
        rental: { enabled: true, dailyPrice: 2500, maxDays: 14 },
        stock: 4,
        featured: false
    },
    {
        sku: "SER-001",
        name: "Sesión de lectura guiada",
        description: "Encuentro mensual de lectura con mediación literaria en el café.",
        type: "service",
        category: "Servicios",
        price: 20000,
        image:
            "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=800&q=80",
        availableFor: ["purchase"],
        stock: 100,
        featured: false
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        let creados = 0;
        let actualizados = 0;

        // Upsert por SKU: crea faltantes y actualiza los existentes
        // (por ejemplo, para cargar el stock de los productos ya sembrados).
        for (const producto of products) {
            const resultado = await Product.updateOne(
                { sku: producto.sku },
                { $set: producto },
                { upsert: true }
            );

            if (resultado.upsertedCount > 0) creados += 1;
            else actualizados += 1;
        }

        console.log(
            `Seed completado: ${creados} creados, ${actualizados} actualizados.`
        );

    } catch (error) {
        console.error("Error en el seed:", error.message);
        process.exitCode = 1;

    } finally {
        await mongoose.disconnect();
    }
}

seed();
