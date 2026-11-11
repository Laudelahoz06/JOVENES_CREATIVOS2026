import { useEffect, useRef, useState } from "react";

import { apiRequest } from "../../services/api";

const WELCOME = {
    role: "assistant",
    text: "¡Hola! Soy el asistente de Magical Books Café. Pregúntame por el horario, el catálogo o cómo alquilar un libro."
};

// Widget flotante de asistencia con el motor del backend (IA o local).
function AssistantWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([WELCOME]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);

    const listRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages, open]);

    // Otras secciones (ej. Experiencias) pueden abrir el asistente
    // despachando el evento "open-assistant" en la ventana.
    useEffect(() => {
        const handleOpen = () => setOpen(true);

        window.addEventListener("open-assistant", handleOpen);

        return () => window.removeEventListener("open-assistant", handleOpen);
    }, []);

    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
        }
    }, [open]);

    const handleSend = async (event) => {
        event.preventDefault();

        const text = input.trim();

        if (!text || sending) return;

        setMessages((previous) => [
            ...previous,
            { role: "user", text }
        ]);
        setInput("");
        setSending(true);

        try {
            const data = await apiRequest("/ai/assistant", {
                method: "POST",
                body: JSON.stringify({ message: text })
            });

            setMessages((previous) => [
                ...previous,
                {
                    role: "assistant",
                    text: data.reply || "No pude preparar una respuesta."
                }
            ]);

        } catch (error) {
            setMessages((previous) => [
                ...previous,
                {
                    role: "assistant",
                    text:
                        error.message ||
                        "No estoy pudiendo responder ahora, intenta de nuevo."
                }
            ]);

        } finally {
            setSending(false);
        }
    };

    return (
        <div className={`assistant-widget ${open ? "assistant-open" : ""}`}>

            {open && (
                <div className="assistant-panel">

                    <header className="assistant-header">
                        <div>
                            <span className="assistant-dot" />
                            <strong>Asistente Magical</strong>
                        </div>

                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            aria-label="Cerrar asistente"
                        >
                            ✕
                        </button>
                    </header>

                    <div className="assistant-messages" ref={listRef}>
                        {messages.map((message, index) => (
                            <p
                                key={`${message.role}-${index}`}
                                className={`assistant-message assistant-${message.role}`}
                            >
                                {message.text}
                            </p>
                        ))}

                        {sending && (
                            <p className="assistant-message assistant-assistant assistant-typing">
                                Escribiendo...
                            </p>
                        )}
                    </div>

                    <form
                        className="assistant-input"
                        onSubmit={handleSend}
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(event) => setInput(event.target.value)}
                            placeholder="Pregúntame algo..."
                            maxLength={300}
                            aria-label="Mensaje para el asistente"
                        />

                        <button type="submit" disabled={sending || !input.trim()}>
                            Enviar
                        </button>
                    </form>

                </div>
            )}

            <button
                type="button"
                className="assistant-toggle"
                onClick={() => setOpen((previous) => !previous)}
                aria-label={
                    open ? "Cerrar asistente virtual" : "Abrir asistente virtual"
                }
            >
                {open ? "✕" : "✧"}
            </button>

        </div>
    );
}

export default AssistantWidget;
