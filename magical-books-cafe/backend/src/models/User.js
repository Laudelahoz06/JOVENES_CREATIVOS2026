import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({

    // Información personal.
    name: {
        type: String,
        required: [true, "El nombre es obligatorio"],
        trim: true,
        maxlenght: 100
    },

    email: {
        type: String,
        required: [true, "El correo es obligatorio"],
        unique: true,
        lowercase: true,
        trim: true,
        maxlenght: 150
    },

    password: {
        type: String,
        required: [true, "La contraseña en obligatoria"],
        minlength: 8,
        select: false
    },

    // Recuperación de contraseña: se guarda solo el hash del token
    // enviado por correo (nunca el token en claro).
    passwordResetToken: {
        type: String,
        select: false
    },

    passwordResetExpires: {
        type: Date,
        select: false
    },

    phone: {
        type: String,
        default: ""
    },

    // Control de permisos.
    role: {
        type: String,
        enum: ["customer", "admin", "staff"],
        default: "customer"
    },

    // Preferencias para futuras recomendaciones de IA.
    preferences: {
        favoriteBooks: [{
            type: String,
            trim: true
        }],

        favoriteGenres: [{
            type: String,
            trim: true
        }],

        favoriteCoffee: [{
            type: String,
            trim: true
        }],

        favoriteMusic: [{
            type: String,
            trim: true
        }]
    },

    active: {
        type: Boolean,
        default: true
    },

    revokedTokens: [{
    type: String
    }],

}, {
    timestamps: true
});

// Encriptamos la contraseña antes de guardarla.
userSchema.pre("save", async function () {

    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 12);
});

// Método para comparar la contraseña ingresada.
userSchema.methods.comparePassword = async function (password) {

    return bcrypt.compare(password, this.password);

};

const User = mongoose.model("User", userSchema);

export default User;