import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import {
    formatCOP,
    formatDate,
    ORDER_STATUS_LABELS,
    PAYMENT_STATUS_LABELS,
    PAYMENT_METHOD_LABELS
} from "../utils/format";

const PREFERENCE_FIELDS = [
    { key: "favoriteBooks", label: "Libros favoritos" },
    { key: "favoriteGenres", label: "Géneros favoritos" },
    { key: "favoriteCoffee", label: "Cafés favoritos" },
    { key: "favoriteMusic", label: "Música favorita" }
];

const ROLE_LABELS = {
    customer: "Cliente",
    admin: "Administrador",
    staff: "Equipo"
};

const preferencesToString = (preferences = {}) =>
    PREFERENCE_FIELDS.map(
        (field) => (preferences[field.key] || []).join(", ")
    );

// Pedidos antiguos no traen paymentStatus: se asumen pagados.
const paymentStatusOf = (order) => order.paymentStatus || "approved";

function Profile() {
    const { user, updateUser } = useAuth();

    const [formData, setFormData] = useState(() => ({
        name: user?.name || "",
        phone: user?.phone || "",
        preferences: preferencesToString(user?.preferences)
    }));

    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [errors, setErrors] = useState({});

    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    const [ordersError, setOrdersError] = useState(null);
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
                    setOrdersError(
                        err.message || "No se pudieron cargar tus pedidos."
                    );
                }

            } finally {
                if (!cancelled) {
                    setOrdersLoading(false);
                }
            }
        };

        loadOrders();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({ ...previous, [name]: value }));
        setFeedback(null);
        setErrors((previous) => ({ ...previous, [name]: undefined }));
    };

    const handlePreferenceChange = (key, value) => {
        setFormData((previous) => ({
            ...previous,
            preferences: { ...previous.preferences, [key]: value }
        }));
        setFeedback(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const nextErrors = {};

        if (!formData.name.trim()) {
            nextErrors.name = "El nombre es obligatorio.";
        }

        if (formData.phone.trim().length > 30) {
            nextErrors.phone = "Máximo 30 caracteres.";
        }

        const preferences = {};

        for (const field of PREFERENCE_FIELDS) {
            const values = formData.preferences[field.key]
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean)
                .slice(0, 20);

            preferences[field.key] = values;
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        setSaving(true);
        setFeedback(null);

        try {
            const data = await apiRequest("/auth/profile", {
                method: "PATCH",
                body: JSON.stringify({
                    name: formData.name.trim(),
                    phone: formData.phone.trim(),
                    preferences
                })
            });

            updateUser({ ...user, ...data.user });

            setFeedback({
                type: "success",
                message: "Perfil actualizado correctamente."
            });

        } catch (error) {
            setFeedback({
                type: "error",
                message: error.message || "No se pudo actualizar el perfil."
            });
        } finally {
            setSaving(false);
        }
    };

    const handleCancelOrder = async (order) => {
        const confirmed = window.confirm(
            `¿Cancelar el pedido de ${formatCOP(order.total)}? ` +
                "Esta acción no se puede deshacer."
        );

        if (!confirmed) return;

        setCancellingId(order._id);
        setOrdersError(null);

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

        } catch (error) {
            setOrdersError(
                error.message || "No se pudo cancelar el pedido."
            );
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <section className="profile-page">

            <div className="profile-header">
                <span>TU CUENTA</span>
                <h1>Mi perfil</h1>
            </div>

            <div className="profile-grid">

                <aside className="profile-summary-card">

                    <div className="profile-avatar">
                        {user?.name?.charAt(0)?.toUpperCase() || "✦"}
                    </div>

                    <h2>{user?.name}</h2>

                    <p>{user?.email}</p>

                    <span className="profile-role">
                        {ROLE_LABELS[user?.role] || user?.role}
                    </span>

                    <nav className="profile-links">
                        <Link to="/mis-alquileres">Mis alquileres</Link>
                        <Link to="/catalogo">Explorar catálogo</Link>
                        <Link to="/carrito">Mi carrito</Link>
                    </nav>

                </aside>

                <div className="profile-main">

                    <form
                        className="profile-form-card"
                        onSubmit={handleSubmit}
                        noValidate
                    >
                        <h2>Datos personales</h2>

                        <div className="profile-field">
                            <label htmlFor="profile-name">Nombre</label>
                            <input
                                id="profile-name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleChange}
                                autoComplete="name"
                            />
                            {errors.name && (
                                <small className="field-error">
                                    {errors.name}
                                </small>
                            )}
                        </div>

                        <div className="profile-field">
                            <label htmlFor="profile-email">
                                Correo electrónico
                            </label>
                            <input
                                id="profile-email"
                                type="email"
                                value={user?.email || ""}
                                disabled
                            />
                            <small className="field-hint">
                                El correo no se puede modificar.
                            </small>
                        </div>

                        <div className="profile-field">
                            <label htmlFor="profile-phone">
                                Teléfono
                            </label>
                            <input
                                id="profile-phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="300 000 0000"
                                autoComplete="tel"
                            />
                            {errors.phone && (
                                <small className="field-error">
                                    {errors.phone}
                                </small>
                            )}
                        </div>

                        <h3 className="profile-subtitle">Mis preferencias</h3>
                        <p className="profile-hint">
                            Separa cada elemento con comas (máximo 20 por
                            categoría).
                        </p>

                        <div className="profile-preferences">
                            {PREFERENCE_FIELDS.map((field) => (
                                <div
                                    className="profile-field"
                                    key={field.key}
                                >
                                    <label htmlFor={`pref-${field.key}`}>
                                        {field.label}
                                    </label>
                                    <input
                                        id={`pref-${field.key}`}
                                        type="text"
                                        value={
                                            formData.preferences[field.key] || ""
                                        }
                                        onChange={(event) =>
                                            handlePreferenceChange(
                                                field.key,
                                                event.target.value
                                            )
                                        }
                                        placeholder="Ej: Gabriel García Márquez, Isabel Allende"
                                    />
                                </div>
                            ))}
                        </div>

                        {feedback && (
                            <div
                                className={`form-feedback form-feedback-${feedback.type}`}
                                role="alert"
                            >
                                <span>
                                    {feedback.type === "success" ? "✓" : "⚠"}
                                </span>
                                {feedback.message}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={saving}
                        >
                            {saving ? "Guardando..." : "Guardar cambios ✦"}
                        </button>

                    </form>

                    <div className="profile-orders-card">
                        <h2>Mis pedidos</h2>

                        {ordersLoading && (
                            <p className="profile-orders-status">
                                Cargando pedidos...
                            </p>
                        )}

                        {ordersError && (
                            <p className="profile-orders-status profile-orders-error">
                                {ordersError}
                            </p>
                        )}

                        {!ordersLoading && !ordersError && orders.length === 0 && (
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

                </div>

            </div>

        </section>
    );
}

export default Profile;
