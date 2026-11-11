import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "../../services/api";
import {
    formatCOP,
    formatDate,
    ORDER_STATUS_LABELS,
    PAYMENT_STATUS_LABELS,
    PAYMENT_METHOD_LABELS
} from "../../utils/format";

const STATUS_FILTERS = ["", "pendiente", "confirmado", "entregado", "cancelado"];

const paymentStatusOf = (order) => order.paymentStatus || "approved";

const canRegisterPayment = (order) =>
    paymentStatusOf(order) !== "approved" && order.status !== "cancelado";

function AdminOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [savingId, setSavingId] = useState(null);
    const [feedback, setFeedback] = useState(null);

    const loadOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = statusFilter
                ? `?status=${encodeURIComponent(statusFilter)}`
                : "";

            const data = await apiRequest(`/orders${params}`);

            setOrders(data.orders || []);

        } catch (err) {
            setError(err.message || "No se pudieron cargar los pedidos.");
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        const timer = window.setTimeout(loadOrders, 0);

        return () => window.clearTimeout(timer);
    }, [loadOrders]);

    const handleStatusChange = async (order, status) => {
        setSavingId(order._id);
        setFeedback(null);

        try {
            await apiRequest(`/orders/${order._id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status })
            });

            setOrders((previous) =>
                previous.map((item) =>
                    item._id === order._id ? { ...item, status } : item
                )
            );

            setFeedback({
                type: "success",
                message: `Pedido de ${
                    order.user?.name || "cliente"
                } actualizado a "${ORDER_STATUS_LABELS[status]}".`
            });

        } catch (err) {
            setFeedback({
                type: "error",
                message: err.message || "No se pudo actualizar el pedido."
            });
        } finally {
            setSavingId(null);
        }
    };

    const handleRegisterPayment = async (order) => {
        const paymentReference = window.prompt(
            `Registrar pago de ${formatCOP(order.total)} ${
                order.user?.name || "cliente"
            }.\n\nReferencia del pago (recibo, últimos dígitos, etc.) — déjalo vacío si no hay referencia:`
        );

        // null = canceló el diálogo.
        if (paymentReference === null) return;

        setSavingId(order._id);
        setFeedback(null);

        try {
            const data = await apiRequest(
                `/orders/${order._id}/pay-local`,
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        ...(paymentReference.trim() && {
                            paymentReference: paymentReference.trim()
                        })
                    })
                }
            );

            setOrders((previous) =>
                previous.map((item) =>
                    item._id === order._id ? data.order : item
                )
            );

            setFeedback({
                type: "success",
                message: `Pago registrado para ${
                    order.user?.name || "cliente"
                }.`
            });

        } catch (err) {
            setFeedback({
                type: "error",
                message: err.message || "No se pudo registrar el pago."
            });
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="admin-panel">

            <div className="admin-toolbar">

                <div className="admin-filter">
                    <label htmlFor="order-status">Estado</label>

                    <select
                        id="order-status"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                    >
                        {STATUS_FILTERS.map((status) => (
                            <option key={status || "all"} value={status}>
                                {status
                                    ? ORDER_STATUS_LABELS[status]
                                    : "Todos"}
                            </option>
                        ))}
                    </select>
                </div>

            </div>

            {feedback && (
                <div
                    className={`form-feedback form-feedback-${feedback.type}`}
                    role="alert"
                >
                    <span>{feedback.type === "success" ? "✓" : "⚠"}</span>
                    {feedback.message}
                </div>
            )}

            {loading && <p className="admin-status">Cargando pedidos...</p>}

            {error && <p className="admin-error">{error}</p>}

            {!loading && !error && orders.length === 0 && (
                <p className="admin-status">No hay pedidos con ese filtro.</p>
            )}

            {orders.length > 0 && (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Productos</th>
                                <th>Total</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                                <th>Pago</th>
                            </tr>
                        </thead>

                        <tbody>
                            {orders.map((order) => (
                                <tr key={order._id}>
                                    <td>
                                        <strong>
                                            {order.user?.name || "Cliente"}
                                        </strong>
                                        <span className="admin-table-sub">
                                            {order.user?.email}
                                        </span>
                                    </td>

                                    <td>
                                        <span className="admin-table-sub">
                                            {order.items
                                                ?.map(
                                                    (item) =>
                                                        `${item.quantity}× ${item.name}`
                                                )
                                                .join(", ")}
                                        </span>
                                    </td>

                                    <td>{formatCOP(order.total)}</td>

                                    <td>{formatDate(order.createdAt)}</td>

                                    <td>
                                        <select
                                            value={order.status}
                                            disabled={savingId === order._id}
                                            onChange={(event) =>
                                                handleStatusChange(
                                                    order,
                                                    event.target.value
                                                )
                                            }
                                            aria-label="Cambiar estado del pedido"
                                        >
                                            {Object.entries(
                                                ORDER_STATUS_LABELS
                                            ).map(([value, label]) => (
                                                <option
                                                    key={value}
                                                    value={value}
                                                >
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </td>

                                    <td className="admin-payment-cell">
                                        <span
                                            className={`status-chip payment-${paymentStatusOf(order)}`}
                                        >
                                            {PAYMENT_STATUS_LABELS[
                                                paymentStatusOf(order)
                                            ] || paymentStatusOf(order)}
                                        </span>

                                        <span className="admin-table-sub">
                                            {order.paymentMethod
                                                ? PAYMENT_METHOD_LABELS[
                                                      order.paymentMethod
                                                  ] || order.paymentMethod
                                                : "Sin método registrado"}
                                        </span>

                                        {canRegisterPayment(order) && (
                                            <button
                                                type="button"
                                                className="admin-pay-btn"
                                                onClick={() =>
                                                    handleRegisterPayment(
                                                        order
                                                    )
                                                }
                                                disabled={
                                                    savingId === order._id
                                                }
                                            >
                                                {savingId === order._id
                                                    ? "Registrando..."
                                                    : "Registrar pago"}
                                            </button>
                                        )}
                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    );
}

export default AdminOrders;
