import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "../../services/api";
import {
    formatCOP,
    formatDate,
    PRODUCT_FORMAT_LABELS,
    RENTAL_STATUS_LABELS
} from "../../utils/format";

const STATUS_FILTERS = ["", "pending", "active", "completed", "cancelled"];

function AdminRentals() {
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState("");
    const [savingId, setSavingId] = useState(null);
    const [feedback, setFeedback] = useState(null);

    const loadRentals = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = statusFilter
                ? `?status=${encodeURIComponent(statusFilter)}`
                : "";

            const data = await apiRequest(`/rentals${params}`);

            setRentals(data.rentals || []);

        } catch (err) {
            setError(err.message || "No se pudieron cargar los alquileres.");
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        const timer = window.setTimeout(loadRentals, 0);

        return () => window.clearTimeout(timer);
    }, [loadRentals]);

    const handleStatusChange = async (rental, status) => {
        setSavingId(rental._id);
        setFeedback(null);

        try {
            await apiRequest(`/rentals/${rental._id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status })
            });

            setRentals((previous) =>
                previous.map((item) =>
                    item._id === rental._id ? { ...item, status } : item
                )
            );

            setFeedback({
                type: "success",
                message: `Alquiler ${rental.ticketCode} actualizado.`
            });

        } catch (err) {
            setFeedback({
                type: "error",
                message: err.message || "No se pudo actualizar el alquiler."
            });
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="admin-panel">

            <div className="admin-toolbar">
                <div className="admin-filter">
                    <label htmlFor="rental-status">Estado</label>

                    <select
                        id="rental-status"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                    >
                        {STATUS_FILTERS.map((status) => (
                            <option key={status || "all"} value={status}>
                                {status
                                    ? RENTAL_STATUS_LABELS[status]
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

            {loading && <p className="admin-status">Cargando alquileres...</p>}

            {error && <p className="admin-error">{error}</p>}

            {!loading && !error && rentals.length === 0 && (
                <p className="admin-status">No hay alquileres con ese filtro.</p>
            )}

            {rentals.length > 0 && (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Comprobante</th>
                                <th>Cliente</th>
                                <th>Libro</th>
                                <th>Periodo</th>
                                <th>Total</th>
                                <th>Estado</th>
                            </tr>
                        </thead>

                        <tbody>
                            {rentals.map((rental) => (
                                <tr key={rental._id}>
                                    <td>
                                        <strong>{rental.ticketCode}</strong>
                                        <span className="admin-table-sub">
                                            {PRODUCT_FORMAT_LABELS[
                                                rental.format
                                            ] || rental.format}
                                        </span>
                                    </td>

                                    <td>
                                        <strong>
                                            {rental.user?.name || "Cliente"}
                                        </strong>
                                        <span className="admin-table-sub">
                                            {rental.user?.email}
                                        </span>
                                    </td>

                                    <td>{rental.product?.name || "—"}</td>

                                    <td>
                                        {formatDate(rental.startDate)} →{" "}
                                        {formatDate(rental.endDate)}
                                    </td>

                                    <td>{formatCOP(rental.total)}</td>

                                    <td>
                                        <select
                                            value={rental.status}
                                            disabled={savingId === rental._id}
                                            onChange={(event) =>
                                                handleStatusChange(
                                                    rental,
                                                    event.target.value
                                                )
                                            }
                                            aria-label="Cambiar estado del alquiler"
                                        >
                                            {Object.entries(
                                                RENTAL_STATUS_LABELS
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

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    );
}

export default AdminRentals;
