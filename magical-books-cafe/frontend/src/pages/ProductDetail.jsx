import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getProduct } from "../services/products";
import { apiRequest } from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import {
    formatCOP,
    PRODUCT_FORMAT_LABELS
} from "../utils/format";
import Skeleton, { LineSkeleton } from "../components/common/Skeleton";

const DAY_MS = 24 * 60 * 60 * 1000;

const toInputDate = (date) => date.toISOString().slice(0, 10);

function ProductDetail() {
    const { id } = useParams();
    const { addItem } = useCart();
    const { isAuthenticated } = useAuth();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [quantity, setQuantity] = useState(1);
    const [format, setFormat] = useState(null);
    const [feedback, setFeedback] = useState(null);

    const today = new Date();
    const [rentalFormat, setRentalFormat] = useState("");
    const [startDate, setStartDate] = useState(toInputDate(today));
    const [endDate, setEndDate] = useState(
        toInputDate(new Date(today.getTime() + 7 * DAY_MS))
    );
    const [rentalError, setRentalError] = useState("");
    const [renting, setRenting] = useState(false);
    const [rentalSuccess, setRentalSuccess] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const loadProduct = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await getProduct(id);

                if (!cancelled) {
                    setProduct(data);
                    setFormat(
                        Array.isArray(data.formats) && data.formats.length === 1
                            ? data.formats[0]
                            : null
                    );
                    setRentalFormat(
                        Array.isArray(data.formats) && data.formats[0]
                            ? data.formats[0]
                            : ""
                    );
                }

            } catch (err) {
                if (!cancelled) {
                    setError(err.message || "No se pudo cargar el producto.");
                }

            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadProduct();

        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleAddToCart = () => {
        const result = addItem(product, quantity, format);

        setFeedback(result);
    };

    const rentalDays =
        startDate && endDate && endDate > startDate
            ? Math.max(1, Math.ceil(
                (new Date(endDate) - new Date(startDate)) / DAY_MS
            ))
            : 0;

    const handleRental = async (event) => {
        event.preventDefault();
        setRentalError("");
        setRentalSuccess(null);

        if (!rentalDays) {
            setRentalError("La fecha de fin debe ser posterior a la de inicio.");
            return;
        }

        if (product.rental.maxDays && rentalDays > product.rental.maxDays) {
            setRentalError(
                `Este libro admite máximo ${product.rental.maxDays} días de alquiler.`
            );
            return;
        }

        setRenting(true);

        try {
            const data = await apiRequest("/rentals", {
                method: "POST",
                body: JSON.stringify({
                    productId: product._id,
                    format: rentalFormat,
                    startDate: new Date(`${startDate}T12:00:00`).toISOString(),
                    endDate: new Date(`${endDate}T12:00:00`).toISOString()
                })
            });

            setRentalSuccess(data.rental);

        } catch (err) {
            setRentalError(err.message || "No se pudo registrar el alquiler.");
        } finally {
            setRenting(false);
        }
    };

    if (loading) {
        return (
            <section className="product-detail-page">
                <div className="product-detail-grid">
                    <Skeleton height={380} radius={16} />
                    <div className="product-detail-info">
                        <Skeleton width="35%" height={14} />
                        <Skeleton width="70%" height={34} />
                        <Skeleton width="30%" height={24} />
                        <LineSkeleton lines={4} />
                        <Skeleton width="100%" height={46} radius={8} />
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="product-detail-page">
                <div className="detail-status detail-status-error">
                    <p>{error}</p>
                    <Link to="/catalogo" className="btn-primary">
                        Volver al catálogo
                    </Link>
                </div>
            </section>
        );
    }

    if (!product) return null;

    const image =
        product.image || product.imageUrl || "/ProductoNoDisponible.png";

    const availableFormats = product.formats || [];

    return (
        <section className="product-detail-page">

            <Link to="/catalogo" className="detail-back">
                ← Volver al catálogo
            </Link>

            <div className="product-detail-grid">

                <div className="product-detail-media">
                    <img
                        src={image}
                        alt={product.name}
                        onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src =
                                "/ProductoNoDisponible.png";
                        }}
                    />

                    {product.stock <= 0 && (
                        <span className="detail-badge detail-badge-soldout">
                            Agotado
                        </span>
                    )}
                </div>

                <div className="product-detail-info">

                    <span className="detail-category">
                        {product.category} · {product.type}
                    </span>

                    <h1>{product.name}</h1>

                    <p className="detail-price">{formatCOP(product.price)}</p>

                    <p className="detail-description">{product.description}</p>

                    <dl className="detail-meta">
                        <div>
                            <dt>Disponibles</dt>
                            <dd>{product.stock}</dd>
                        </div>
                    </dl>

                    {availableFormats.length > 0 && (
                        <div className="detail-formats">
                            <span className="detail-label">Formato</span>

                            <div className="format-options">
                                {availableFormats.map((item) => (
                                    <button
                                        key={item}
                                        type="button"
                                        className={
                                            format === item ? "active" : ""
                                        }
                                        onClick={() => setFormat(item)}
                                    >
                                        {PRODUCT_FORMAT_LABELS[item] || item}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="detail-quantity">
                        <span className="detail-label">Cantidad</span>

                        <div className="quantity-stepper">
                            <button
                                type="button"
                                onClick={() =>
                                    setQuantity((previous) =>
                                        Math.max(1, previous - 1)
                                    )
                                }
                                aria-label="Disminuir cantidad"
                            >
                                −
                            </button>

                            <span>{quantity}</span>

                            <button
                                type="button"
                                onClick={() =>
                                    setQuantity((previous) =>
                                        Math.min(
                                            Math.max(product.stock, 1),
                                            previous + 1
                                        )
                                    )
                                }
                                aria-label="Aumentar cantidad"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        className="btn-primary detail-add"
                        onClick={handleAddToCart}
                        disabled={product.stock <= 0}
                    >
                        {product.stock <= 0
                            ? "Sin existencias"
                            : "Agregar al carrito ✦"}
                    </button>

                    {feedback && (
                        <p
                            className={`inline-feedback inline-feedback-${
                                feedback.ok ? "success" : "error"
                            }`}
                            role="alert"
                        >
                            {feedback.message}
                        </p>
                    )}

                </div>

            </div>

            {product.type === "book" && product.rental?.enabled && (
                <div className="rental-panel">

                    <div className="rental-panel-header">
                        <span>ALQUILER DE LIBROS</span>
                        <h2>
                            Llévate este libro por{" "}
                            {formatCOP(product.rental.dailyPrice)} al día
                        </h2>
                        <p>
                            Duración máxima: {product.rental.maxDays} días.
                        </p>
                    </div>

                    {rentalSuccess ? (
                        <div className="rental-success">
                            <p>
                                ✅ Alquiler registrado con el código{" "}
                                <strong>{rentalSuccess.ticketCode}</strong>.
                            </p>
                            <p>
                                Total estimado: {formatCOP(rentalSuccess.total)}
                            </p>
                            <Link to="/mis-alquileres" className="btn-secondary">
                                Ver mis alquileres
                            </Link>
                        </div>
                    ) : !isAuthenticated ? (
                        <p className="rental-login">
                            <Link to="/iniciar-sesion">
                                Inicia sesión
                            </Link>{" "}
                            para solicitar este alquiler.
                        </p>
                    ) : (
                        <form className="rental-form" onSubmit={handleRental}>
                            <div className="rental-field">
                                <label htmlFor="rental-format">Formato</label>
                                <select
                                    id="rental-format"
                                    value={rentalFormat}
                                    onChange={(event) =>
                                        setRentalFormat(event.target.value)
                                    }
                                >
                                    {availableFormats.map((item) => (
                                        <option key={item} value={item}>
                                            {PRODUCT_FORMAT_LABELS[item] || item}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="rental-field">
                                <label htmlFor="rental-start">Inicio</label>
                                <input
                                    id="rental-start"
                                    type="date"
                                    value={startDate}
                                    min={toInputDate(new Date())}
                                    onChange={(event) =>
                                        setStartDate(event.target.value)
                                    }
                                />
                            </div>

                            <div className="rental-field">
                                <label htmlFor="rental-end">Devolución</label>
                                <input
                                    id="rental-end"
                                    type="date"
                                    value={endDate}
                                    min={startDate}
                                    onChange={(event) =>
                                        setEndDate(event.target.value)
                                    }
                                />
                            </div>

                            <div className="rental-summary">
                                {rentalDays > 0 ? (
                                    <p>
                                        {rentalDays} día
                                        {rentalDays > 1 ? "s" : ""} ·{" "}
                                        <strong>
                                            {formatCOP(
                                                rentalDays *
                                                    product.rental.dailyPrice
                                            )}
                                        </strong>
                                    </p>
                                ) : (
                                    <p>Selecciona las fechas del alquiler.</p>
                                )}
                            </div>

                            {rentalError && (
                                <p
                                    className="inline-feedback inline-feedback-error"
                                    role="alert"
                                >
                                    {rentalError}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="btn-secondary"
                                disabled={renting || !rentalDays}
                            >
                                {renting
                                    ? "Registrando..."
                                    : "Solicitar alquiler"}
                            </button>
                        </form>
                    )}

                </div>
            )}

        </section>
    );
}

export default ProductDetail;
