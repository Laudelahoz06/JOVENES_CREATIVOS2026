import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../services/api";
import AccountLayout from "../layouts/AccountLayout";
import {
    formatCOP,
    formatDate,
    PRODUCT_FORMAT_LABELS,
    RENTAL_STATUS_LABELS
} from "../utils/format";

function MyRentals() {
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const loadRentals = async () => {
            try {
                const data = await apiRequest("/rentals/mine");

                if (!cancelled) {
                    setRentals(data.rentals || []);
                }

            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message || "No se pudieron cargar tus alquileres."
                    );
                }

            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadRentals();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <AccountLayout
            eyebrow="BIBLIOTECA EN PRÉSTAMO"
            title="Mis alquileres"
            description="Consulta el estado de tus libros y el código de cada comprobante."
        >

            {loading && (
                <p className="rentals-status">Cargando alquileres...</p>
            )}

            {error && (
                <div className="rentals-status rentals-error">
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && rentals.length === 0 && (
                <div className="rentals-empty">
                    <span>📚</span>

                    <h2>No tienes alquileres activos</h2>

                    <p>
                        Busca un libro con alquiler disponible en el catálogo.
                    </p>

                    <Link to="/catalogo" className="btn-primary">
                        Ver libros
                    </Link>
                </div>
            )}

            {rentals.length > 0 && (
                <div className="rentals-list">
                    {rentals.map((rental) => (
                        <article className="rental-card" key={rental._id}>

                            <div className="rental-card-main">
                                <span className="rental-ticket">
                                    {rental.ticketCode}
                                </span>

                                <h2>
                                    {rental.product?.name || "Libro"}
                                </h2>

                                <p className="rental-meta">
                                    {PRODUCT_FORMAT_LABELS[rental.format] ||
                                        rental.format}
                                    {" · "}
                                    {formatDate(rental.startDate)} →{" "}
                                    {formatDate(rental.endDate)}
                                </p>
                            </div>

                            <div className="rental-card-side">
                                <span
                                    className={`status-chip status-${rental.status}`}
                                >
                                    {RENTAL_STATUS_LABELS[rental.status] ||
                                        rental.status}
                                </span>

                                <strong>{formatCOP(rental.total)}</strong>
                            </div>

                        </article>
                    ))}
                </div>
            )}

        </AccountLayout>
    );
}

export default MyRentals;
