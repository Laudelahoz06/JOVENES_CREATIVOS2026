import { useState } from "react";
import { Link } from "react-router-dom";

import { apiRequest } from "../services/api";

// Paso 1 de la recuperación: el usuario entrega su correo y el
// backend envía un enlace (válido 30 min) si la cuenta existe.
function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sent, setSent] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!email.trim()) {
            setError("Ingresa tu correo electrónico.");
            return;
        }

        setLoading(true);

        try {
            await apiRequest("/auth/forgot-password", {
                method: "POST",
                body: JSON.stringify({ email: email.trim() })
            });

            setSent(true);
        } catch (err) {
            setError(
                err.message || "No fue posible procesar la solicitud."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="auth-page">
            <div className="auth-decoration auth-decoration-one"></div>
            <div className="auth-decoration auth-decoration-two"></div>

            <div className="auth-container">
                <div className="auth-information">
                    <span className="auth-symbol">✦</span>

                    <span className="auth-eyebrow">
                        MAGICAL BOOKS CAFÉ
                    </span>

                    <h1>
                        Recupera
                        <span> tu acceso.</span>
                    </h1>

                    <p>
                        Te enviaremos un enlace seguro a tu correo para
                        elegir una nueva contraseña.
                    </p>

                    <div className="auth-quote">
                        <span>❝</span>
                        <p>
                            Tu cuenta y tus pedidos siguen donde los
                            dejaste.
                        </p>
                    </div>
                </div>

                <div className="auth-card">

                    <div className="auth-card-header">
                        <span className="auth-card-icon">✧</span>

                        <h2>Olvidé mi contraseña</h2>

                        <p>
                            Escribe el correo de tu cuenta y te
                            enviaremos las instrucciones.
                        </p>
                    </div>

                    {sent ? (
                        <div className="auth-success" role="status">
                            <span>✉️</span>
                            <p>
                                Si el correo{" "}
                                <strong>{email.trim()}</strong> está
                                registrado, recibirás un enlace de
                                recuperación (válido por 30 minutos).
                            </p>
                            <p className="auth-success-hint">
                                Revisa también la carpeta de correo no
                                deseado.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>

                            <div className="auth-field">
                                <label htmlFor="forgot-email">
                                    Correo electrónico
                                </label>

                                <input
                                    id="forgot-email"
                                    name="email"
                                    type="email"
                                    placeholder="nombre@correo.com"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    autoComplete="email"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="auth-error" role="alert">
                                    <span>⚠</span>
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="auth-submit"
                                disabled={loading}
                            >
                                {loading
                                    ? "Enviando..."
                                    : "Enviar enlace"}
                                <span>✦</span>
                            </button>

                        </form>
                    )}

                    <div className="auth-register">
                        <p>
                            ¿Ya la recordaste?
                        </p>

                        <Link to="/iniciar-sesion">
                            Volver a iniciar sesión
                        </Link>
                    </div>

                </div>

            </div>
        </section>
    );
}

export default ForgotPassword;
