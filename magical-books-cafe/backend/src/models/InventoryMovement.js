import mongoose from "mongoose";

const inventoryMovementSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        type: {
            type: String,
            required: true,
            enum: ["restock", "adjustment", "sale"]
        },

        quantity: {
            type: Number,
            required: true,
            validate: {
                validator: Number.isInteger,
                message: "La cantidad debe ser un número entero."
            }
        },

        previousStock: {
            type: Number,
            required: true,
            min: 0
        },

        newStock: {
            type: Number,
            required: true,
            min: 0
        },

        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

inventoryMovementSchema.index({ product: 1, createdAt: -1 });

const InventoryMovement = mongoose.model(
    "InventoryMovement",
    inventoryMovementSchema
);

export default InventoryMovement;