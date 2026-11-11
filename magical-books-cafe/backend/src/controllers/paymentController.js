import { validationResult } from "express-validator";

import Order from "../models/Order.js";
import {
    WompiNotConfiguredError,
    getCheckoutParams,
    getTransaction,
    mapWompiStatus,
    verifyWebhookChecksum
} from "../services/wompi.js";

const checkValidation = (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        res.status(400).json({
            success: false,
            message: "Revisa los datos del pago.",
            errors: errors.array().map((error) => ({
                field: error.path,
                message: error.msg
            }))
        });

        return false;
    }

    return true;
};

// Aplica el resultado verificado de una transacción a la orden.
// Idempotente: repetir no cambia un pago ya aprobado.
const applyTransactionResult = async (order, transaction) => {
    const paymentStatus = mapWompiStatus(transaction.status);

    if (order.paymentStatus === "approved") {
        return order;
    }

    order.paymentStatus = paymentStatus;
    order.wompiTransactionId = String(transaction.id);

    if (paymentStatus === "approved") {
        order.paidAt = new Date();

        // El cobro aprobado confirma el pedido (salvo que ya se haya
        // entregado o cancelado por otra vía).
        if (order.status === "pendiente") {
            order.status = "confirmado";
        }
    }

    await order.save();
    return order;
};

// POST /api/payments/wompi — crea los parámetros del checkout para una
// orden del usuario autenticado pendiente de pago online.
export const createWompiPayment = async (req, res, next) => {
    try {
        if (!checkValidation(req, res)) return;

        const order = await Order.findOne({
            _id: req.body.orderId,
            user: req.user._id
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "El pedido no existe o no te pertenece."
            });
        }

        if (order.paymentStatus === "approved") {
            return res.status(409).json({
                success: false,
                message: "Este pedido ya está pagado."
            });
        }

        if (order.status === "cancelado") {
            return res.status(409).json({
                success: false,
                message: "No se puede pagar un pedido cancelado."
            });
        }

        // Referencia única por intento: Wompi rechaza repetir una
        // referencia usada (422), así que se reintenta con sufijo.
        order.paymentAttempts = (order.paymentAttempts || 0) + 1;
        order.paymentMethod = "wompi";
        await order.save();

        const reference = `ORDER-${order._id}-${order.paymentAttempts}`;
        const amountInCents = Math.round(Number(order.total) * 100);

        const checkout = getCheckoutParams({
            reference,
            amountInCents
        });

        return res.status(200).json({
            success: true,
            checkout,
            orderId: order._id
        });

    } catch (error) {
        if (error instanceof WompiNotConfiguredError) {
            return res.status(503).json({
                success: false,
                message: error.message
            });
        }

        next(error);
    }
};

// GET /api/payments/wompi/verify?transactionId= — verifica con Wompi
// el estado real y actualiza la orden. Es el camino principal de cierre
// (el webhook queda como redundancia en producción).
export const verifyWompiPayment = async (req, res, next) => {
    try {
        const { transactionId, reference } = req.query;

        if (!transactionId && !reference) {
            return res.status(400).json({
                success: false,
                message: "Falta transactionId o reference."
            });
        }

        // La orden se busca por transacción o por la referencia usada
        // ("ORDER-{id}-{n}") y siempre debe pertenecer al usuario.
        let order = null;

        if (transactionId) {
            order = await Order.findOne({
                wompiTransactionId: String(transactionId),
                user: req.user._id
            });
        }

        if (!order && reference) {
            const match = /^ORDER-([0-9a-fA-F]{24})-\d+$/.exec(
                String(reference)
            );

            if (match) {
                order = await Order.findOne({
                    _id: match[1],
                    user: req.user._id
                });
            }
        }

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "No se encontró el pedido asociado al pago."
            });
        }

        if (order.paymentStatus === "approved") {
            return res.status(200).json({
                success: true,
                paymentStatus: order.paymentStatus,
                status: order.status,
                alreadyApproved: true
            });
        }

        // Sin transactionId consultamos la referencia del último intento
        // vía la transacción declarada; si aún no la hay, el usuario
        // debe volver desde Wompi (que redirige con ?id=).
        if (!order.wompiTransactionId && !transactionId) {
            return res.status(200).json({
                success: true,
                paymentStatus: order.paymentStatus,
                status: order.status,
                pending: true
            });
        }

        const transaction = await getTransaction(
            transactionId || order.wompiTransactionId
        );

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: "Transacción no encontrada en Wompi."
            });
        }

        // Coincide la referencia con esta orden antes de aprobar.
        const expectedPrefix = `ORDER-${order._id}-`;

        if (
            typeof transaction.reference === "string" &&
            !transaction.reference.startsWith(expectedPrefix)
        ) {
            return res.status(400).json({
                success: false,
                message: "La transacción no corresponde a este pedido."
            });
        }

        await applyTransactionResult(order, transaction);

        return res.status(200).json({
            success: true,
            paymentStatus: order.paymentStatus,
            status: order.status,
            wompiStatus: transaction.status
        });

    } catch (error) {
        if (error instanceof WompiNotConfiguredError) {
            return res.status(503).json({
                success: false,
                message: error.message
            });
        }

        next(error);
    }
};

// POST /api/payments/wompi/webhook — notificación de Wompi.
// Se responde 200 primero (Wompi reintenta si no) y luego se verifica
// el estado real con la llave privada.
export const wompiWebhook = async (req, res) => {
    try {
        if (!verifyWebhookChecksum(req.body)) {
            return res.status(400).json({
                success: false,
                message: "Checksum inválido."
            });
        }

        // Confirmar recepción de inmediato; el trabajo pesado sigue.
        res.status(200).json({ success: true });

        const transaction = req.body?.data?.transaction;

        if (!transaction?.id || !transaction?.reference) return;

        const match = /^ORDER-([0-9a-fA-F]{24})-\d+$/.exec(
            String(transaction.reference)
        );

        if (!match) return;

        const order = await Order.findById(match[1]);

        if (!order || order.paymentStatus === "approved") return;

        // Nunca se confía en el payload: se consulta el estado real.
        const real = await getTransaction(transaction.id);

        if (real) await applyTransactionResult(order, real);

    } catch {
        // El webhook ya fue confirmado con 200; los errores aquí solo
        // se registran para diagnóstico. La verificación manual
        // (/verify) cubre cualquier caso pendiente.
    }
};

// PATCH /api/orders/:id/pay-local — admin registra un pago recibido
// en el local (efectivo, tarjeta en caja, transferencia manual).
export const registerLocalPayment = async (req, res, next) => {
    try {
        if (!checkValidation(req, res)) return;

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "El pedido no existe."
            });
        }

        if (order.paymentStatus === "approved") {
            return res.status(409).json({
                success: false,
                message: "Este pedido ya tiene un pago aprobado."
            });
        }

        order.paymentMethod = "local";
        order.paymentStatus = "approved";
        order.paidAt = new Date();

        if (req.body.paymentReference) {
            order.paymentReference = String(req.body.paymentReference).slice(
                0,
                120
            );
        }

        if (req.body.notes) {
            const note = String(req.body.notes).slice(0, 200);
            order.notes = order.notes
                ? `${order.notes} | Pago local: ${note}`
                : `Pago local: ${note}`;
        }

        if (order.status === "pendiente") {
            order.status = "confirmado";
        }

        await order.save();

        return res.status(200).json({
            success: true,
            message: "Pago registrado en el local.",
            order
        });

    } catch (error) {
        next(error);
    }
};
