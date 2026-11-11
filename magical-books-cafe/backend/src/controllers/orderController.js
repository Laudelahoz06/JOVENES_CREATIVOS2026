import { validationResult } from "express-validator";

import Order from "../models/Order.js";
import Product from "../models/Product.js";

const checkValidation = (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: "Revisa los datos del pedido.",
            errors: errors.array().map((error) => ({
                field: error.path,
                message: error.msg
            }))
        });

        return false;
    }

    return true;
};

// POST /api/orders — confirma un pedido a partir del carrito del cliente.
export const createOrder = async (req, res, next) => {
    try {
        if (!checkValidation(req, res)) return;

        const { items, notes, paymentMethod } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "El pedido está vacío."
            });
        }

        // Se revalidan precios y existencias contra la base de datos:
        // nunca se confía en el precio enviado por el navegador.
        const ids = items.map((item) => item.product);
        const products = await Product.find({
            _id: { $in: ids },
            active: true
        }).lean();

        const byId = new Map(
            products.map((product) => [String(product._id), product])
        );

        const orderItems = [];
        let total = 0;

        for (const item of items) {
            const product = byId.get(String(item.product));

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: "Uno de los productos ya no está disponible."
                });
            }

            const quantity = Math.max(1, Number(item.quantity) || 1);
            const price = Number(product.price);

            if (
                typeof product.stock === "number" &&
                product.stock < quantity
            ) {
                return res.status(409).json({
                    success: false,
                    message: `Stock insuficiente para ${product.name}.`
                });
            }

            orderItems.push({
                product: product._id,
                name: product.name,
                price,
                quantity,
                format: item.format || null
            });

            total += price * quantity;
        }

        const order = await Order.create({
            user: req.user._id,
            items: orderItems,
            total,
            notes: notes ? String(notes).slice(0, 500) : "",
            paymentMethod: paymentMethod === "wompi" ? "wompi" : "local"
        });

        return res.status(201).json({
            success: true,
            message: "Pedido registrado correctamente.",
            order: {
                id: order._id,
                total: order.total,
                status: order.status,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                items: order.items.length
            }
        });

    } catch (error) {
        next(error);
    }
};

// GET /api/orders/mine — pedidos del usuario autenticado.
export const listMyOrders = async (req, res, next) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            orders
        });

    } catch (error) {
        next(error);
    }
};

// GET /api/orders — bandeja administrativa (admin).
export const listAllOrders = async (req, res, next) => {
    try {
        const filter = {};

        if (req.query.status) filter.status = req.query.status;

        const orders = await Order.find(filter)
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .limit(Number(req.query.limit) || 100)
            .lean();

        return res.status(200).json({
            success: true,
            orders
        });

    } catch (error) {
        next(error);
    }
};

// PATCH /api/orders/:id/cancel — el cliente cancela su propio pedido
// mientras siga en estado "pendiente" (se equivocó al comprar).
export const cancelMyOrder = async (req, res, next) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "El pedido no existe o no te pertenece."
            });
        }

        if (order.status !== "pendiente") {
            return res.status(409).json({
                success: false,
                message:
                    "Solo se pueden cancelar pedidos pendientes. " +
                    "Contacta al local si necesitas ayuda con uno confirmado."
            });
        }

        order.status = "cancelado";
        await order.save();

        return res.status(200).json({
            success: true,
            message: "Pedido cancelado correctamente.",
            order
        });

    } catch (error) {
        next(error);
    }
};

// PATCH /api/orders/:id/status — actualiza el estado (admin).
export const updateOrderStatus = async (req, res, next) => {
    try {
        if (!checkValidation(req, res)) return;

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "El pedido no existe."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Pedido actualizado.",
            order
        });

    } catch (error) {
        next(error);
    }
};
