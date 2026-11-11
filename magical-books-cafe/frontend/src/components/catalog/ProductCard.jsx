import { useState } from "react";
import { Link } from "react-router-dom";

import { useCart } from "../../context/CartContext";
import { formatCOP } from "../../utils/format";

function ProductCard({ product }) {
    const { addItem } = useCart();
    const [feedback, setFeedback] = useState(null);

    const image =
        product.image ||
        product.imageUrl ||
        "/ProductoNoDisponible.png";

    const handleAdd = () => {
        const format =
            Array.isArray(product.formats) && product.formats.length === 1
                ? product.formats[0]
                : null;

        const result = addItem(product, 1, format);

        setFeedback(result);

        window.setTimeout(() => setFeedback(null), 2500);
    };

    return (
        <article className="catalog-product-card">

            <Link to={`/catalogo/${product._id}`} className="card-media">
                <img
                    src={image}
                    alt={product.name}
                    loading="lazy"
                    decoding="async"
                    onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = "/ProductoNoDisponible.png";
                    }}
                />
            </Link>

            <div className="catalog-product-info">

                <span>{product.category}</span>

                <h3>{product.name}</h3>

                <p>{formatCOP(product.price)}</p>

                {feedback && (
                    <small
                        className={`inline-feedback inline-feedback-${
                            feedback.ok ? "success" : "error"
                        }`}
                    >
                        {feedback.message}
                    </small>
                )}

                <div className="card-actions">
                    <Link
                        to={`/catalogo/${product._id}`}
                        className="card-detail-link"
                    >
                        Ver producto
                    </Link>

                    <button
                        type="button"
                        onClick={handleAdd}
                        disabled={product.stock <= 0}
                    >
                        {product.stock <= 0 ? "Agotado" : "Añadir +"}
                    </button>
                </div>

            </div>

        </article>
    );
}

export default ProductCard;
