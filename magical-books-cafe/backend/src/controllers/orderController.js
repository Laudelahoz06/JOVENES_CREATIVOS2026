import { validationResult } from "express-validator";
import mongoose from "mongoose";

import Order from "../models/Order.js";
import Product from "../models/Product.js";
import InventoryMovement from "../models/InventoryMovement.js";

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

// Reserva de stock atómica: solo descuenta si alcanza (evita ventas
// cruzadas) y registra el movimiento de inventario en la misma sesión.
const deductStock = async ({
    productId,
    quantity,
    name,
    reason,
    insufficientMessage,
    performedBy
}, session) => {
    const updated = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } },
        { new: true, session }
    );

    if (!updated) {
        const error = new Error(
            insufficientMessage || `Stock insuficiente para ${name}.`
        );
        error.statusCode = 409;
        throw error;
    }

    await InventoryMovement.create(
        [{
            product: productId,
            performedBy,
            type: "sale",
            quantity: -quantity,
            previousStock: updated.stock + quantity,
            newStock: updated.stock,
            reason
        }],
        { session }
    );

    return updated;
};

// Devuelve el stock al cancelar y registra la devolución como movimiento.
const releaseStock = async ({
    productId,
    quantity,
    reason,
    performedBy
}, session) => {
    const updated = await Product.findOneAndUpdate(
        { _id: productId },
        { $inc: { stock: quantity } },
        { new: true, session }
    );

    if (!updated) return;

    await InventoryMovement.create(
        [{
            product: productId,
            performedBy,
            type: "sale",
            quantity,
            previousStock: updated.stock - quantity,
            newStock: updated.stock,
            reason
        }],
        { session }
    );
};

// Devuelve todo el stock reservado de un pedido (una sola vez).
const releaseOrderStock = async (order, performedBy, session) => {
    for (const item of order.items) {
        await releaseStock({
            productId: item.product,
            quantity: item.quantity,
            reason: `Cancelación de pedido ${order._id} - devolución de stock`,
            performedBy
        }, session);
    }

    order.stockReserved = false;
};

// POST /api/orders — confirma un pedido a partir del carrito del cliente.
export const createOrder = async (req, res, next) => {
    const session = await mongoose.startSession();

    try {
        if (!checkValidation(req, res)) {
            await session.endSession();
            return;
        }

        const { items, notes, paymentMethod } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            await session.endSession();

            return res.status(400).json({
                success: false,
                message: "El pedido está vacío."
            });
        }

        // Se revalidan precios contra la base de datos: nunca se confía
        // en el precio enviado por el navegador.
        const ids = items.map((item) => item.product);
        const products = await Product.find({
            _id: { $in: ids },
            active: true
        }).lean();

        const byId = new Map(
            products.map((product) => [String(product._id), product])
        );

        let order;

        await session.withTransaction(async () => {
            const orderItems = [];
            let total = 0;

            for (const item of items) {
                const product = byId.get(String(item.product));

                if (!product) {
                    const error = new Error(
                        "Uno de los productos ya no está disponible."
                    );
                    error.statusCode = 400;
                    throw error;
                }

                const quantity = Math.max(1, Number(item.quantity) || 1);

                orderItems.push({
                    product: product._id,
                    name: product.name,
                    price: Number(product.price),
                    quantity,
                    format: item.format || null
                });

                total += Number(product.price) * quantity;
            }

            [order] = await Order.create(
                [{
                    user: req.user._id,
                    items: orderItems,
                    total,
                    notes: notes ? String(notes).slice(0, 500) : "",
                    paymentMethod:
                        paymentMethod === "wompi" ? "wompi" : "local",
                    stockReserved: true
                }],
                { session }
            );

            // Reserva atómica del stock item por item. Si no alcanza, la
            // transacción se revierte y no queda pedido a medias.
            for (const item of order.items) {
                await deductStock({
                    productId: item.product,
                    quantity: item.quantity,
                    name: item.name,
                    reason: `Venta - pedido ${order._id}`,
                    performedBy: req.user._id
                }, session);
            }
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
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }

        next(error);
    } finally {
        await session.endSession();
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
    const session = await mongoose.startSession();

    try {
        let order;

        await session.withTransaction(async () => {
            order = await Order.findOne({
                _id: req.params.id,
                user: req.user._id
            }).session(session);

            if (!order) {
                const error = new Error(
                    "El pedido no existe o no te pertenece."
                );
                error.statusCode = 404;
                throw error;
            }

            if (order.status !== "pendiente") {
                const error = new Error(
                    "Solo se pueden cancelar pedidos pendientes. " +
                    "Contacta al local si necesitas ayuda con uno confirmado."
                );
                error.statusCode = 409;
                throw error;
            }

            // Solo se devuelve stock si este pedido lo descontó al crearse
            // (los pedidos antiguos nunca lo hicieron).
            if (order.stockReserved) {
                await releaseOrderStock(order, req.user._id, session);
            }

            order.status = "cancelado";
            await order.save({ session });
        });

        return res.status(200).json({
            success: true,
            message: "Pedido cancelado correctamente.",
            order
        });

    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }

        next(error);
    } finally {
        await session.endSession();
    }
};

// PATCH /api/orders/:id/status — actualiza el estado (admin).
// Al cancelar se devuelve el stock reservado; al reactivar un pedido
// cancelado se vuelve a reservar (409 si ya no alcanza).
export const updateOrderStatus = async (req, res, next) => {
    const session = await mongoose.startSession();

    try {
        if (!checkValidation(req, res)) {
            await session.endSession();
            return;
        }

        const nextStatus = req.body.status;
        let order;

        await session.withTransaction(async () => {
            order = await Order.findById(req.params.id).session(session);

            if (!order) {
                const error = new Error("El pedido no existe.");
                error.statusCode = 404;
                throw error;
            }

            const previousStatus = order.status;

            if (previousStatus === nextStatus) return;

            if (nextStatus === "cancelado") {
                if (order.stockReserved) {
                    await releaseOrderStock(order, req.user._id, session);
                }
            } else if (
                previousStatus === "cancelado" &&
                !order.stockReserved
            ) {
                for (const item of order.items) {
                    await deductStock({
                        productId: item.product,
                        quantity: item.quantity,
                        name: item.name,
                        reason: `Reactivación de pedido ${order._id}`,
                        insufficientMessage:
                            `No hay stock suficiente para reactivar el ` +
                            `pedido (${item.name}).`,
                        performedBy: req.user._id
                    }, session);
                }

                order.stockReserved = true;
            }

            order.status = nextStatus;
            await order.save({ session });
        });

        return res.status(200).json({
            success: true,
            message: "Pedido actualizado.",
            order
        });

    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({
                success: false,
                message: error.message
            });
        }

        next(error);
    } finally {
        await session.endSession();
    }
};
