import { useState } from "react";

import { apiRequest } from "../services/api";

const INITIAL_FORM = {
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    audience: "duenos"
};

const validate = (form) => {
    const errors = {};

    if (!form.name.trim()) {
        errors.name = "El nombre es obligatorio.";
    } else if (form.name.trim().length > 100) {
        errors.name = "Máximo 100 caracteres.";
    }

    if (!form.email.trim()) {
        errors.email = "El correo es obligatorio.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
        errors.email = "Ingresa un correo válido.";
    }

    if (!form.subject.trim()) {
        errors.subject = "El asunto es obligatorio.";
    }

    const messageLength = form.message.trim().length;

    if (messageLength < 10) {
        errors.message = "Cuéntanos un poco más (mínimo 10 caracteres).";
    } else if (messageLength > 2000) {
        errors.message = "Máximo 2000 caracteres.";
    }

    return errors;
};

function Contact() {
    const [form, setForm] = useState(INITIAL_FORM);
    const [touched, setTouched] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [sending, setSending] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const errors = validate(form);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({ ...previous, [name]: value }));
        setFeedback(null);
    };

    const handleBlur = (event) => {
        setTouched((previous) => ({ ...previous, [event.target.name]: true }));
    };

    const showError = (field) =>
        (submitted || touched[field]) && errors[field];

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitted(true);

        const currentErrors = validate(form);

        if (Object.keys(currentErrors).length > 0) {
            setFeedback({
                type: "error",
                message: "Revisa los campos marcados antes de enviar."
            });
            return;
        }

        setSending(true);
        setFeedback(null);

        try {
            await apiRequest("/contact", {
                method: "POST",
                body: JSON.stringify({
                    name: form.name.trim(),
                    email: form.email.trim(),
                    phone: form.phone.trim(),
                    subject: form.subject.trim(),
                    message: form.message.trim(),
                    audience: form.audience
                })
            });

            setForm(INITIAL_FORM);
            setTouched({});
            setSubmitted(false);
            setFeedback({
                type: "success",
                message: "¡Mensaje enviado! Te responderemos muy pronto."
            });

        } catch (error) {
            setFeedback({
                type: "error",
                message: error.message || "No se pudo enviar el mensaje."
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <section className="contact-page">

            <div className="contact-header">
                <span>HABLEMOS</span>
                <h1>Contacto</h1>
                <p>
                    Escríbenos sobre el café, el catálogo o cualquier idea
                    que quieras construir con nosotros.
                </p>
            </div>

            <div className="contact-grid">

                <aside className="contact-info-card">
                    <h2>Magical Books Café</h2>

                    <ul>
                        <li>
                            <span>✦</span> Lectura, café y comunidad en un
                            mismo lugar.
                        </li>
                        <li>
                            <span>✦</span> Respondemos los mensajes en un
                            máximo de 48 horas.
                        </li>
                        <li>
                            <span>✦</span> ¿Eres parte del equipo? Elige
                            "Desarrolladores" en el formulario.
                        </li>
                    </ul>

                    <div className="contact-hours">
                        <h3>Horario</h3>
                        <p>Lunes a sábado · 8:00 a. m. – 9:00 p. m.</p>
                        <p>Domingos · 10:00 a. m. – 6:00 p. m.</p>
                    </div>
                </aside>

                <form className="contact-form" onSubmit={handleSubmit} noValidate>

                    <div className="contact-field">
                        <label htmlFor="name">Nombre *</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={form.name}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Tu nombre"
                            autoComplete="name"
                        />
                        {showError("name") && (
                            <small className="field-error">{errors.name}</small>
                        )}
                    </div>

                    <div className="contact-field">
                        <label htmlFor="email">Correo electrónico *</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="nombre@correo.com"
                            autoComplete="email"
                        />
                        {showError("email") && (
                            <small className="field-error">{errors.email}</small>
                        )}
                    </div>

                    <div className="contact-field">
                        <label htmlFor="phone">Teléfono (opcional)</label>
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={form.phone}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="300 000 0000"
                            autoComplete="tel"
                        />
                    </div>

                    <div className="contact-field">
                        <label htmlFor="subject">Asunto *</label>
                        <input
                            id="subject"
                            name="subject"
                            type="text"
                            value={form.subject}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="¿Sobre qué nos escribes?"
                        />
                        {showError("subject") && (
                            <small className="field-error">{errors.subject}</small>
                        )}
                    </div>

                    <div className="contact-field">
                        <label htmlFor="audience">Destinatario</label>
                        <select
                            id="audience"
                            name="audience"
                            value={form.audience}
                            onChange={handleChange}
                        >
                            <option value="duenos">Dueños del café</option>
                            <option value="desarrolladores">
                                Equipo de desarrollo
                            </option>
                        </select>
                    </div>

                    <div className="contact-field contact-field-full">
                        <label htmlFor="message">Mensaje *</label>
                        <textarea
                            id="message"
                            name="message"
                            rows={6}
                            value={form.message}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Escribe aquí tu mensaje (mínimo 10 caracteres)"
                        />
                        <div className="field-meta">
                            {showError("message") && (
                                <small className="field-error">
                                    {errors.message}
                                </small>
                            )}
                            <small className="field-counter">
                                {form.message.length}/2000
                            </small>
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

                    <button
                        type="submit"
                        className="btn-primary contact-submit"
                        disabled={sending}
                    >
                        {sending ? "Enviando..." : "Enviar mensaje ✦"}
                    </button>

                </form>

            </div>

        </section>
    );
}

export default Contact;
