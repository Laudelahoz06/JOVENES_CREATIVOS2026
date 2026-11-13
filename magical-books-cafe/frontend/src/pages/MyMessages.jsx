import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../services/api";
import AccountLayout from "../layouts/AccountLayout";
import { formatDate } from "../utils/format";

const AUDIENCE_LABELS = {
    duenos: "Dueños del café",
    desarrolladores: "Equipo de desarrollo"
};

// Mensajes que el cliente envió desde /contacto con sesión iniciada,
// junto con las respuestas del equipo.
function MyMessages() {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let cancelled = false;

        const loadMessages = async () => {
            try {
                const data = await apiRequest("/contact/my");

                if (!cancelled) {
                    setMessages(data.messages || []);
                }

            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message || "No se pudieron cargar tus mensajes."
                    );
                }

            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadMessages();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <AccountLayout
            eyebrow="BUZÓN DEL CLIENTE"
            title="Mis mensajes"
            description="Tus mensajes enviados desde la página de contacto y las respuestas del equipo en un solo lugar."
        >

            {loading && (
                <p className="my-messages-status">
                    Cargando mensajes...
                </p>
            )}

            {error && (
                <div className="my-messages-status my-messages-error">
                    <p>{error}</p>
                </div>
            )}

            {!loading && !error && messages.length === 0 && (
                <div className="my-messages-empty">
                    <span>✉️</span>

                    <h2>Aún no has enviado mensajes</h2>

                    <p>
                        Cuando escribas desde la página de contacto con
                        tu sesión iniciada, verás aquí las respuestas
                        del equipo.
                    </p>

                    <Link to="/contacto" className="btn-primary">
                        Ir a contacto
                    </Link>
                </div>
            )}

            {messages.length > 0 && (
                <div className="my-messages-list">
                    {messages.map((message) => (
                        <article
                            className="message-card"
                            key={message._id}
                        >
                            <header>
                                <div>
                                    <strong>
                                        Para:{" "}
                                        {AUDIENCE_LABELS[
                                            message.audience
                                        ] || "Magical Books Café"}
                                    </strong>

                                    <span className="message-subject">
                                        {message.subject}
                                    </span>
                                </div>

                                <span className="message-meta">
                                    {formatDate(message.createdAt)}
                                </span>
                            </header>

                            <p className="message-body">
                                {message.message}
                            </p>

                            {message.reply ? (
                                <div className="message-reply">
                                    <strong>
                                        Respuesta del equipo ·{" "}
                                        {formatDate(message.repliedAt)}
                                    </strong>
                                    <p>{message.reply}</p>
                                </div>
                            ) : (
                                <span
                                    className="status-chip status-pendiente"
                                >
                                    Esperando respuesta
                                </span>
                            )}
                        </article>
                    ))}
                </div>
            )}

        </AccountLayout>
    );
}

export default MyMessages;
