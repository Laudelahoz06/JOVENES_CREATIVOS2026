import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({

    // Información personal.
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true,
        minlength: 8,
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
            type: String
        }],

        favoriteGenres: [{
            type: String
        }],

        favoriteCoffee: [{
            type: String
        }],

        favoriteMusic: [{
            type: String
        }]
    },

    active: {
        type: Boolean,
        default: true
    }

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