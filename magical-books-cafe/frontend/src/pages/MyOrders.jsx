import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../services/api";
import AccountLayout from "../layouts/AccountLayout";
import {
    formatCOP,
    formatDate,
    ORDER_STATUS_LABELS,
    PAYMENT_STATUS_LABELS,
    PAYMENT_METHOD_LABELS
} from "../utils/format";

// Pedidos antiguos no traen paymentStatus: se asumen pagados.
const paymentStatusOf = (order) => order.paymentStatus || "approved";

function MyOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [cancellingId, setCancellingId] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const loadOrders = async () => {
            try {
                const data = await apiRequest("/orders/mine");

                if (!cancelled) {
                    setOrders(data.orders || []);
                }

            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message || "No se pudieron cargar tus pedidos."
                    );
                }

            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadOrders();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleCancelOrder = async (order) => {
        const confirmed = window.confirm(
            `¿Cancelar el pedido de ${formatCOP(order.total)}? ` +
                "Esta acción no se puede deshacer."
        );

        if (!confirmed) return;

        setCancellingId(order._id);
        setError(null);

        try {
            await apiRequest(`/orders/${order._id}/cancel`, {
                method: "PATCH"
            });

            setOrders((previous) =>
                previous.map((item) =>
                    item._id === order._id
                        ? { ...item, status: "cancelado" }
                        : item
                )
            );

        } catch (err) {
            setError(
                err.message || "No se pudo cancelar el pedido."
            );
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <AccountLayout
            title="Mis pedidos"
            description="Historial de tus compras: estado, pago y cancelación."
        >

            <div className="profile-orders-card">

                {loading && (
                    <p className="profile-orders-status">
                        Cargando pedidos...
                    </p>
                )}

                {error && (
                    <p className="profile-orders-status profile-orders-error">
                        {error}
                    </p>
                )}

                {!loading && !error && orders.length === 0 && (
                    <p className="profile-orders-status">
                        Todavía no has hecho pedidos.{" "}
                        <Link to="/catalogo">Explora el catálogo</Link>.
                    </p>
                )}

                {orders.length > 0 && (
                    <div className="profile-orders-list">
                        {orders.map((order) => (
                            <article
                                className="profile-order"
                                key={order._id}
                            >
                                <div>
                                    <strong>
                                        {formatCOP(order.total)}
                                    </strong>
                                    <span>
                                        {order.items?.length} producto
                                        {order.items?.length === 1
                                            ? ""
                                            : "s"}
                                    </span>
                                </div>

                                <div>
                                    <span>
                                        {formatDate(order.createdAt)}
                                    </span>
                                    <span
                                        className={`status-chip status-${order.status}`}
                                    >
                                        {ORDER_STATUS_LABELS[
                                            order.status
                                        ] || order.status}
                                    </span>
                                    <span
                                        className={`status-chip payment-${paymentStatusOf(order)}`}
                                        title={
                                            order.paymentMethod
                                                ? PAYMENT_METHOD_LABELS[
                                                      order
                                                          .paymentMethod
                                                  ] || order.paymentMethod
                                                : "Pago registrado"
                                        }
                                    >
                                        {PAYMENT_STATUS_LABELS[
                                            paymentStatusOf(order)
                                        ] || paymentStatusOf(order)}
                                    </span>
                                </div>

                                {order.status === "pendiente" && (
                                    <div className="profile-order-actions">
                                        <button
                                            type="button"
                                            className="profile-order-cancel"
                                            onClick={() =>
                                                handleCancelOrder(
                                                    order
                                                )
                                            }
                                            disabled={
                                                cancellingId ===
                                                order._id
                                            }
                                        >
                                            {cancellingId ===
                                            order._id
                                                ? "Cancelando..."
                                                : "Cancelar pedido"}
                                        </button>
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                )}

            </div>

        </AccountLayout>
    );
}

export default MyOrders;
