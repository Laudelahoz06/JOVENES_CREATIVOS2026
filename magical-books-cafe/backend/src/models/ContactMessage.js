import mongoose from "mongoose";

const contactMessageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "El nombre es obligatorio."],
            trim: true,
            maxlength: 100
        },

        email: {
            type: String,
            required: [true, "El correo es obligatorio."],
            lowercase: true,
            trim: true,
            maxlength: 150
        },

        phone: {
            type: String,
            trim: true,
            maxlength: 30,
            default: ""
        },

        subject: {
            type: String,
            required: [true, "El asunto es obligatorio."],
            trim: true,
            maxlength: 150
        },

        message: {
            type: String,
            required: [true, "El mensaje es obligatorio."],
            trim: true,
            maxlength: 2000
        },

        // Destinatario: los dueños del local o el equipo de desarrollo.
        audience: {
            type: String,
            enum: ["duenos", "desarrolladores"],
            default: "duenos"
        },

        // Si el remitente tenía sesión iniciada, se guarda la referencia.
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        status: {
            type: String,
            enum: ["nuevo", "leido"],
            default: "nuevo"
        },

        // Respuesta del equipo al mensaje. El cliente la ve en
        // "Mis mensajes" si envió el mensaje con sesión iniciada.
        reply: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: null
        },

        repliedAt: {
            type: Date,
            default: null
        }

    },
    { timestamps: true }
);

const ContactMessage = mongoose.model(
    "ContactMessage",
    contactMessageSchema
);

export default ContactMessage;
