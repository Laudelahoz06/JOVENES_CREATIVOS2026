import mongoose from "mongoose";

const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true,
        maxlenght:150
    },

    description: {
        type: String,
        required: true,
        maxlenght: 2000,
        trim: true
    },

    // Tipo de elemento del catálogo.
    type: {
        type: String,
        enum: ["coffee", "dessert", "book", "service"],
        required: true
    },

    category: {
        type: String,
        default: "General",
        trim: true
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    image: {
        type: String,
        default: ""
    },

    // Disponibilidad para compra o alquiler.
    availableFor: {
        type: [String],
        enum: ["purchase", "rental"],
        default: ["purchase"]
    },

    // Formatos disponibles para libros.
    formats: [{
        type: String,
        enum: ["fisico", "digital", "kindle", "local_pc"]
    }],

    // Información del alquiler.
    rental: {
        enabled: {
            type: Boolean,
            default: false
        },

        pricePerDay: {
            type: Number,
            min: 0,
            default: 0
        },

        maxDays: {
            type: Number,
            default: 30,
            min: 0
        }
    },

    // Inventario físico.
    stock: {
        type: Number,
        default: 0,
        min: 0
    },

    // Control de publicación.
    active: {
        type: Boolean,
        default: true
    },

    featured: {
        type: Boolean,
        default: false
    }

}, {
    timestamps: true
});

const Product = mongoose.model("Product", productSchema);

export default Product;