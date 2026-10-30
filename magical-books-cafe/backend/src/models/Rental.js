import mongoose from "mongoose";

const rentalSchema = new mongoose.Schema({

    // Cliente que realiza el alquiler.
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    // Libro alquilado.
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    // Modalidad del alquiler.
    format: {
        type: String,
        enum: ["digital", "kindle", "local_pc"],
        required: true
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    total: {
        type: Number,
        required: true,
        min: 0
    },

    // Estado del pago.
    paymentStatus: {
        type: String,
        enum: ["pending", "approved", "rejected", "refunded"],
        default: "pending"
    },

    paymentReference: {
        type: String,
        default: null
    },

    // Estado del servicio.
    status: {
        type: String,
        enum: ["pending", "active", "completed", "cancelled"],
        default: "pending"
    },

    // Código único del comprobante.
    ticketCode: {
        type: String,
        unique: true,
        sparse: true
    }

}, {
    timestamps: true
});

const Rental = mongoose.model("Rental", rentalSchema);

export default Rental;