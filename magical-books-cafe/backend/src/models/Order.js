import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        name: {
            type: String,
            required: true
        },

        price: {
            type: Number,
            required: true,
            min: 0
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        format: {
            type: String,
            enum: ["fisico", "digital"],
            default: null
        }
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        items: {
            type: [orderItemSchema],
            validate: {
                validator: (items) => items.length > 0,
                message: "El pedido debe tener al menos un producto."
            }
        },

        total: {
            type: Number,
            required: true,
            min: 0
        },

        status: {
            type: String,
            enum: ["pendiente", "confirmado", "entregado", "cancelado"],
            default: "pendiente"
        },

        // ---- Información de pago ----
        // Cómo eligió pagar el cliente: Wompi (online) o en el local.
        paymentMethod: {
            type: String,
            enum: ["wompi", "local"],
            default: null
        },

        // Estado del cobro (independiente del estado de fulfillment).
        paymentStatus: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },

        // ID de la transacción en Wompi (cuando aplica).
        wompiTransactionId: {
            type: String,
            default: null
        },

        // Momento en que el pago quedó aprobado (Wompi o caja).
        paidAt: {
            type: Date,
            default: null
        },

        // Intentos de pago online: la referencia de Wompi es única por
        // intento ("ORDER-{id}-{n}") para poder reintentar sin 422.
        paymentAttempts: {
            type: Number,
            default: 0,
            min: 0
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 500,
            default: ""
        },

        // Referencia de pago cuando el negocio lo confirme manualmente.
        paymentReference: {
            type: String,
            default: null
        },

        // Indica si el stock de los items ya fue descontado al crear el
        // pedido. Los pedidos antiguos (anteriores a este control) quedan
        // en false: al cancelarlos NO se devuelve stock que nunca se descontó.
        stockReserved: {
            type: Boolean,
            default: false
        }

    },
    { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
