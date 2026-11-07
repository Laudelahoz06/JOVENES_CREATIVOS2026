import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    // Código único de producto
    sku: {
        type: String,
        required: [true, "El código SKU es obligatorio"],
        unique: true,
        uppercase: true,
        trim: true,
        maxlength: 40
    },

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
        required: true,
        default: "General",
        trim: true,
        maxlength: 80
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
// a reconsiderar.
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

        dailyPrice: {
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
        min: 0,
        validate: {
                validator: Number.isInteger,
                message: "El inventario debe ser un número entero."
            }
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
    timestamps: true,
    versionKey: false
});


// reglas adicionales antes de ser guardado 
productSchema.pre("validate", function () {
    if (this.type !== "book" && this.formats.length > 0) {
        this.invalidate(
            "formats",
            "Solo los libros pueden tener formatos de lectura."
        );
    }

    if (this.rental.enabled) {
        if (this.type !== "book") {
            this.invalidate(
                "rental.enabled",
                "Solo los libros pueden habilitar alquiler."
            );
        }

        if (this.rental.dailyPrice <= 0) {
            this.invalidate(
                "rental.dailyPrice",
                "El precio diario debe ser mayor que cero."
            );
        }

        if (this.rental.maxDays < 1) {
            this.invalidate(
                "rental.maxDays",
                "La duración máxima debe ser al menos un día."
            );
        }
    }
});

productSchema.index({ name: "text", description: "text" });
productSchema.index({ type: 1, active: 1 });
productSchema.index({ category: 1, active: 1 });
productSchema.index({ price: 1 });
const Product = mongoose.model("Product", productSchema);

export default Product;