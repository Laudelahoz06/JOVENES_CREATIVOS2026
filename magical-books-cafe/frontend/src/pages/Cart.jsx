import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import { formatCOP, PRODUCT_FORMAT_LABELS } from "../utils/format";

function Cart() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const {
        items,
        updateQuantity,
        removeItem,
        clearCart,
        total
    } = useCart();

    const [notes, setNotes] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("wompi");
    const [sending, setSending] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [confirmedOrder, setConfirmedOrder] = useState(null);

    // Envía el formulario GET al checkout alojado de Wompi.
    // La firma se calcula en backend: el navegador solo arma el form.
    const redirectToWompi = (checkout) => {
        const form = document.createElement("form");

        form.action = checkout.checkoutUrl;
        form.method = "GET";

        const fields = {
            "public-key": checkout.publicKey,
            currency: checkout.currency,
            "amount-in-cents": checkout.amountInCents,
            reference: checkout.reference,
            "signature:integrity": checkout.signature
        };

        // redirect-url es opcional: si el backend lo omite (Wompi
        // bloquea con 403 los destinos locales) no se envía el campo.
        if (checkout.redirectUrl) {
            fields["redirect-url"] = checkout.redirectUrl;
        }

        Object.entries(fields).forEach(([name, value]) => {
            const input = document.createElement("input");

            input.type = "hidden";
            input.name = name;
            input.value = String(value);
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
    };

    const handleCheckout = async () => {
        setFeedback(null);

        if (!isAuthenticated) {
            setFeedback({
                type: "error",
                message: "Inicia sesión para confirmar tu pedido."
            });
            return;
        }

        setSending(true);

        try {
            const data = await apiRequest("/orders", {
                method: "POST",
                body: JSON.stringify({
                    items: items.map((item) => ({
                        product: item.product,
                        quantity: item.quantity,
                        format: item.format || undefined
                    })),
                    notes: notes.trim(),
                    paymentMethod
                })
            });

            clearCart();
            setNotes("");

            if (paymentMethod === "wompi") {
                // Pago online: se piden los parámetros del checkout y se
                // redirige a Wompi. El carrito ya quedó vacío porque la
                // orden existe en el servidor.
                const checkoutData = await apiRequest("/payments/wompi", {
                    method: "POST",
                    body: JSON.stringify({ orderId: data.order.id })
                });

                redirectToWompi(checkoutData.checkout);
                return;
            }

            // Pago en el local: el pedido queda pendiente de cobro en caja.
            setConfirmedOrder(data.order);

        } catch (error) {
            setFeedback({
                type: "error",
                message: error.message || "No se pudo confirmar el pedido."
            });
        } finally {
            setSending(false);
        }
    };

    if (confirmedOrder) {
        return (
            <section className="cart-page">
                <div className="cart-confirmation">
                    <span className="cart-confirmation-icon">✦</span>

                    <h1>¡Pedido registrado!</h1>

                    <p>
                        Registramos tu pedido por{" "}
                        <strong>{formatCOP(confirmedOrder.total)}</strong> con{" "}
                        {confirmedOrder.items} producto
                        {confirmedOrder.items === 1 ? "" : "s"}.
                    </p>

                    <p className="cart-confirmation-status">
                        Pago en el local: pendiente. Paga al recoger en caja
                        y el equipo confirmará tu pedido.
                    </p>

                    <div className="cart-confirmation-actions">
                        <Link to="/catalogo" className="btn-primary">
                            Seguir explorando
                        </Link>

                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => navigate("/mis-pedidos")}
                        >
                            Ver mis pedidos
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    if (items.length === 0) {
        return (
            <section className="cart-page">
                <div className="cart-empty">
                    <span>🛒</span>

                    <h1>Tu carrito está vacío</h1>

                    <p>
                        Explora el catálogo y encuentra tu próximo libro o
                        café favorito.
                    </p>

                    <Link to="/catalogo" className="btn-primary">
                        Ir al catálogo
                    </Link>
                </div>
            </section>
        );
    }

    return (
        <section className="cart-page">

            <div className="cart-header">
                <span>TU SELECCIÓN</span>
                <h1>Carrito de compras</h1>
            </div>

            <div className="cart-grid">

                <div className="cart-items">

                    {items.map((item) => (
                        <article
                            className="cart-item"
                            key={`${item.product}_${item.format || "sin-formato"}`}
                        >
                            <img
                                src={
                                    item.image ||
                                    "/ProductoNoDisponible.png"
                                }
                                alt={item.name}
                                loading="lazy"
                                decoding="async"
                                onError={(event) => {
                                    event.currentTarget.onerror = null;
                                    event.currentTarget.src =
                                        "/ProductoNoDisponible.png";
                                }}
                            />

                            <div className="cart-item-info">
                                <h3>{item.name}</h3>

                                <p className="cart-item-price">
                                    {formatCOP(item.price)} c/u
                                </p>

                                {item.format && (
                                    <span className="cart-item-format">
                                        {PRODUCT_FORMAT_LABELS[item.format] ||
                                            item.format}
                                    </span>
                                )}

                                <button
                                    type="button"
                                    className="cart-item-remove"
                                    onClick={() =>
                                        removeItem(item.product, item.format)
                                    }
                                >
                                    Quitar
                                </button>
                            </div>

                            <div className="quantity-stepper">
                                <button
                                    type="button"
                                    onClick={() =>
                                        updateQuantity(
                                            item.product,
                                            item.format,
                                            item.quantity - 1
                                        )
                                    }
                                    aria-label="Disminuir cantidad"
                                >
                                    −
                                </button>

                                <span>{item.quantity}</span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        updateQuantity(
                                            item.product,
                                            item.format,
                                            item.quantity + 1
                                        )
                                    }
                                    aria-label="Aumentar cantidad"
                                >
                                    +
                                </button>
                            </div>

                            <p className="cart-item-subtotal">
                                {formatCOP(item.price * item.quantity)}
                            </p>

                        </article>
                    ))}

                    <Link to="/catalogo" className="cart-keep-link">
                        ← Seguir comprando
                    </Link>

                </div>

                <aside className="cart-summary">
                    <h2>Resumen</h2>

                    <div className="cart-summary-row">
                        <span>Productos</span>
                        <span>{items.length}</span>
                    </div>

                    <div className="cart-summary-row cart-summary-total">
                        <span>Total</span>
                        <span>{formatCOP(total)}</span>
                    </div>

                    <fieldset className="payment-method-fieldset">
                        <legend>Cómo quieres pagar</legend>

                        <div className="payment-method-grid">
                            <label
                                className={
                                    paymentMethod === "wompi"
                                        ? "payment-method-option payment-method-active"
                                        : "payment-method-option"
                                }
                            >
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="wompi"
                                    checked={paymentMethod === "wompi"}
                                    onChange={(event) => {
                                        setPaymentMethod(event.target.value);
                                        setFeedback(null);
                                    }}
                                />

                                <span className="payment-method-icon">💳</span>

                                <span className="payment-method-text">
                                    <strong>Pagar con Wompi</strong>
                                    <small>
                                        Tarjeta, Nequi, PSE o Bancolombia.
                                        Confirmación inmediata.
                                    </small>
                                </span>
                            </label>

                            <label
                                className={
                                    paymentMethod === "local"
                                        ? "payment-method-option payment-method-active"
                                        : "payment-method-option"
                                }
                            >
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="local"
                                    checked={paymentMethod === "local"}
                                    onChange={(event) => {
                                        setPaymentMethod(event.target.value);
                                        setFeedback(null);
                                    }}
                                />

                                <span className="payment-method-icon">☕</span>

                                <span className="payment-method-text">
                                    <strong>Pagar en el local</strong>
                                    <small>
                                        Pagas en caja al recoger. El pedido
                                        queda pendiente de pago.
                                    </small>
                                </span>
                            </label>
                        </div>
                    </fieldset>

                    <div className="cart-notes">
                        <label htmlFor="cart-notes">Notas del pedido</label>
                        <textarea
                            id="cart-notes"
                            rows={3}
                            maxLength={500}
                            placeholder="Ej: sin azúcar, factura a nombre de..."
                            value={notes}
                            onChange={(event) => {
                                setNotes(event.target.value);
                                setFeedback(null);
                            }}
                        />
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

                            {feedback.message.includes("sesión") && (
                                <Link to="/iniciar-sesion">Iniciar sesión</Link>
                            )}
                        </div>
                    )}

                    <button
                        type="button"
                        className="btn-primary cart-checkout"
                        onClick={handleCheckout}
                        disabled={sending}
                    >
                        {sending
                            ? "Procesando..."
                            : paymentMethod === "wompi"
                              ? "Pagar con Wompi ✦"
                              : "Confirmar pedido ✦"}
                    </button>

                    <p className="cart-summary-hint">
                        {paymentMethod === "wompi"
                            ? "Serás redirigido a Wompi (entorno de prueba) para completar el pago."
                            : "Los precios se validan en el servidor antes de confirmar."}
                    </p>

                </aside>

            </div>

        </section>
    );
}

export default Cart;
