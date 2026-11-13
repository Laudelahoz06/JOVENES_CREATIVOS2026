import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "El título es obligatorio"],
        trim: true,
        maxlength: 150
    },

    description: {
        type: String,
        required: [true, "La descripción es obligatoria"],
        trim: true,
        maxlength: 2000
    },

    icon: {
        type: String,
        default: "✦",
        trim: true,
        maxlength: 10
    },

    image: {
        type: String,
        default: ""
    },

    // Enlace interno (p. ej. /catalogo, /contacto) o acción especial.
    to: {
        type: String,
        default: "",
        trim: true,
        maxlength: 300
    },

    action: {
        type: String,
        enum: ["", "assistant"],
        default: ""
    },

    // URL de playlist de Spotify (abre el embed colaborativo).
    spotifyUrl: {
        type: String,
        default: "",
        trim: true,
        maxlength: 500
    },

    category: {
        type: String,
        default: "General",
        trim: true,
        maxlength: 80
    },

    // Control de publicación.
    active: {
        type: Boolean,
        default: true
    },

    featured: {
        type: Boolean,
        default: false
    },

    // Orden de aparición en la sección pública.
    order: {
        type: Number,
        default: 0,
        min: 0
    }

}, {
    timestamps: true,
    versionKey: false
});

experienceSchema.index({ title: "text", description: "text" });
experienceSchema.index({ active: 1, order: 1 });
experienceSchema.index({ category: 1, active: 1 });

const Experience = mongoose.model("Experience", experienceSchema);

export default Experience;
