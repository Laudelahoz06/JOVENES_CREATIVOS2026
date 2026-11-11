import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "../../services/api";
import { formatDate } from "../../utils/format";

const AUDIENCE_LABELS = {
    duenos: "Dueños",
    desarrolladores: "Desarrollo"
};

function AdminMessages() {
    const [messages, setMessages] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [savingId, setSavingId] = useState(null);

    const loadMessages = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await apiRequest("/contact");

            setMessages(data.messages || []);
            setUnread(data.unread || 0);

        } catch (err) {
            setError(err.message || "No se pudo cargar la bandeja.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(loadMessages, 0);

        return () => window.clearTimeout(timer);
    }, [loadMessages]);

    const handleMarkAsRead = async (message) => {
        setSavingId(message._id);
        setFeedback(null);

        try {
            await apiRequest(`/contact/${message._id}/read`, {
                method: "PATCH"
            });

            setMessages((previous) =>
                previous.map((item) =>
                    item._id === message._id
                        ? { ...item, status: "leido" }
                        : item
                )
            );

            setUnread((previous) => Math.max(0, previous - 1));

        } catch (err) {
            setFeedback({
                type: "error",
                message: err.message || "No se pudo marcar el mensaje."
            });
        } finally {
            setSavingId(null);
        }
    };

    const handleDelete = async (message) => {
        const confirmed = window.confirm(
            `¿Eliminar el mensaje de ${message.name}?`
        );

        if (!confirmed) return;

        setSavingId(message._id);
        setFeedback(null);

        try {
            await apiRequest(`/contact/${message._id}`, {
                method: "DELETE"
            });

            setMessages((previous) =>
                previous.filter((item) => item._id !== message._id)
            );

            if (message.status === "nuevo") {
                setUnread((previous) => Math.max(0, previous - 1));
            }

        } catch (err) {
            setFeedback({
                type: "error",
                message: err.message || "No se pudo eliminar el mensaje."
            });
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="admin-panel">

            <div className="admin-toolbar">
                <span className="admin-badge">
                    {unread} sin leer
                </span>

                <button
                    type="button"
                    className="btn-secondary"
                    onClick={loadMessages}
                >
                    Actualizar
                </button>
            </div>

            {feedback && (
                <div
                    className={`form-feedback form-feedback-${feedback.type}`}
                    role="alert"
                >
                    <span>⚠</span>
                    {feedback.message}
                </div>
            )}

            {loading && <p className="admin-status">Cargando mensajes...</p>}

            {error && <p className="admin-error">{error}</p>}

            {!loading && !error && messages.length === 0 && (
                <p className="admin-status">
                    La bandeja de entrada está vacía.
                </p>
            )}

            <div className="message-list">
                {messages.map((message) => (
                    <article
                        className={`message-card ${
                            message.status === "nuevo"
                                ? "message-unread"
                                : ""
                        }`}
                        key={message._id}
                    >
                        <header>
                            <div>
                                <strong>{message.name}</strong>

                                <span className="message-subject">
                                    {message.subject}
                                </span>
                            </div>

                            <span className="message-meta">
                                {AUDIENCE_LABELS[message.audience] ||
                                    message.audience ||
                                    "General"}
                                {" · "}
                                {formatDate(message.createdAt)}
                            </span>
                        </header>

                        <p className="message-email">{message.email}</p>

                        <p className="message-body">{message.message}</p>

                        <footer>
                            <span
                                className={`status-chip status-${
                                    message.status === "nuevo"
                                        ? "pendiente"
                                        : "entregado"
                                }`}
                            >
                                {message.status === "nuevo"
                                    ? "Nuevo"
                                    : "Leído"}
                            </span>

                            <div className="message-actions">
                                {message.status === "nuevo" && (
                                    <button
                                        type="button"
                                        className="admin-link-button"
                                        disabled={savingId === message._id}
                                        onClick={() =>
                                            handleMarkAsRead(message)
                                        }
                                    >
                                        Marcar leído
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className="admin-link-button admin-link-danger"
                                    disabled={savingId === message._id}
                                    onClick={() => handleDelete(message)}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </footer>

                    </article>
                ))}
            </div>

        </div>
    );
}

export default AdminMessages;
