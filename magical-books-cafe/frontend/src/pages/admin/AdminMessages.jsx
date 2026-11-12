import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "../../services/api";
import { formatDate } from "../../utils/format";

const AUDIENCE_LABELS = {
    duenos: "Dueños",
    desarrolladores: "Desarrollo"
};

function AdminMessages({ onUnreadChange }) {
    const [messages, setMessages] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [savingId, setSavingId] = useState(null);
    const [replyingId, setReplyingId] = useState(null);
    const [replyText, setReplyText] = useState("");

    // Mantiene el contador local y avisa al panel (badge del menú).
    // Estable: onUnreadChange es setState del padre.
    const reportUnread = useCallback(
        (value) => {
            setUnread(value);
            onUnreadChange?.(value);
        },
        [onUnreadChange]
    );

    const loadMessages = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await apiRequest("/contact");

            setMessages(data.messages || []);
            reportUnread(data.unread || 0);

        } catch (err) {
            setError(err.message || "No se pudo cargar la bandeja.");
        } finally {
            setLoading(false);
        }
    }, [reportUnread]);

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

            reportUnread(Math.max(0, unread - 1));

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
                reportUnread(Math.max(0, unread - 1));
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

    const handleOpenReply = (message) => {
        setReplyingId(message._id);
        setReplyText(message.reply || "");
        setFeedback(null);
    };

    const handleCancelReply = () => {
        setReplyingId(null);
        setReplyText("");
    };

    const handleReply = async (message) => {
        const text = replyText.trim();

        if (text.length < 2) {
            setFeedback({
                type: "error",
                message: "Escribe una respuesta (mínimo 2 caracteres)."
            });
            return;
        }

        setSavingId(message._id);
        setFeedback(null);

        try {
            const data = await apiRequest(
                `/contact/${message._id}/reply`,
                {
                    method: "PATCH",
                    body: JSON.stringify({ reply: text })
                }
            );

            setMessages((previous) =>
                previous.map((item) =>
                    item._id === message._id
                        ? { ...item, ...data.contact }
                        : item
                )
            );

            if (message.status === "nuevo") {
                reportUnread(Math.max(0, unread - 1));
            }

            setReplyingId(null);
            setReplyText("");
            setFeedback({
                type: "success",
                message:
                    "Respuesta guardada. El cliente la verá en su cuenta."
            });

        } catch (err) {
            setFeedback({
                type: "error",
                message: err.message || "No se pudo enviar la respuesta."
            });
        } finally {
            setSavingId(null);
        }
    };

    // Abre el cliente de correo con el mensaje (y la respuesta, si
    // existe) listo para reenviarlo al equipo de desarrollo.
    const handleForward = (message) => {
        const devEmail = (import.meta.env.VITE_DEV_EMAIL || "").trim();

        const lines = [
            "Mensaje reenviado desde el panel de Magical Books Café.",
            "",
            `De: ${message.name} <${message.email}>`,
            `Destinatario original: ${
                AUDIENCE_LABELS[message.audience] ||
                message.audience ||
                "General"
            }`,
            `Fecha: ${formatDate(message.createdAt)}`,
            `Asunto: ${message.subject}`,
            "",
            message.message
        ];

        if (message.reply) {
            lines.push("", "Respuesta del equipo:", message.reply);
        }

        const subject = `Reenvío: ${message.subject}`;

        window.location.href =
            `mailto:${devEmail}` +
            `?subject=${encodeURIComponent(subject)}` +
            `&body=${encodeURIComponent(lines.join("\n"))}`;
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

                        {message.reply && (
                            <div className="message-reply">
                                <strong>
                                    Respuesta del equipo ·{" "}
                                    {formatDate(message.repliedAt)}
                                </strong>
                                <p>{message.reply}</p>
                            </div>
                        )}

                        {replyingId === message._id && (
                            <div className="message-reply-form">
                                <label
                                    htmlFor={`reply-${message._id}`}
                                >
                                    Respuesta para {message.name}
                                </label>
                                <textarea
                                    id={`reply-${message._id}`}
                                    rows={4}
                                    maxLength={2000}
                                    value={replyText}
                                    onChange={(event) =>
                                        setReplyText(event.target.value)
                                    }
                                    placeholder="Escribe la respuesta que verá el cliente..."
                                />
                                <div className="field-meta">
                                    <small className="field-counter">
                                        {replyText.length}/2000
                                    </small>
                                </div>
                                <div className="message-actions">
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        disabled={
                                            savingId === message._id
                                        }
                                        onClick={() =>
                                            handleReply(message)
                                        }
                                    >
                                        {savingId === message._id
                                            ? "Enviando..."
                                            : "Enviar respuesta"}
                                    </button>
                                    <button
                                        type="button"
                                        className="admin-link-button"
                                        onClick={handleCancelReply}
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}

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
                                    className="admin-link-button"
                                    disabled={savingId === message._id}
                                    onClick={() =>
                                        handleOpenReply(message)
                                    }
                                >
                                    {message.reply
                                        ? "Responder de nuevo"
                                        : "Responder"}
                                </button>

                                <button
                                    type="button"
                                    className="admin-link-button"
                                    onClick={() => handleForward(message)}
                                >
                                    Reenviar a desarrolladores
                                </button>

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
