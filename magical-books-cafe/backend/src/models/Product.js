import mongoose from "mongoose";

const productSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        required: true
    },

    // Tipo de elemento del catálogo.
    type: {
        type: String,
        enum: ["coffee", "dessert", "book", "service"],
        required: true
    },

    category: {
        type: String,
        default: "General"
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
        enum: ["physical", "digital", "kindle", "local_pc"]
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
            default: 30
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
    }

}, {
    timestamps: true
});

const Product = mongoose.model("Product", productSchema);

export default Product;