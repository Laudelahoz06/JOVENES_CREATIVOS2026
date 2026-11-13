import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { apiRequest } from "../services/api";
import { isStrongPassword, missingPasswordRules } from "../utils/password";
import PasswordStrength from "../components/auth/PasswordStrength";

// Paso 2 de la recuperación: define la nueva contraseña con el
// token enviado por correo (?token=... en la URL).
function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!isStrongPassword(password)) {
            setError(
                "La contraseña no cumple los requisitos: " +
                    missingPasswordRules(password).join(", ") + "."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        setLoading(true);

        try {
            await apiRequest("/auth/reset-password", {
                method: "POST",
                body: JSON.stringify({ token, password })
            });

            setDone(true);
        } catch (err) {
            setError(
                err.message || "No fue posible restablecer la contraseña."
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
                        Una nueva
                        <span> contraseña.</span>
                    </h1>

                    <p>
                        Elige una contraseña segura: mayúsculas,
                        minúsculas, números y caracteres especiales.
                    </p>

                    <div className="auth-quote">
                        <span>❝</span>
                        <p>
                            Cuidamos tu cuenta igual que cuidamos
                            nuestros libros.
                        </p>
                    </div>
                </div>

                <div className="auth-card">

                    <div className="auth-card-header">
                        <span className="auth-card-icon">✧</span>

                        <h2>Restablecer contraseña</h2>

                        <p>
                            Escribe tu nueva contraseña dos veces
                            para confirmarla.
                        </p>
                    </div>

                    {!token ? (
                        <div className="auth-error" role="alert">
                            <span>⚠</span>
                            El enlace de recuperación no es válido.
                            Solicita uno nuevo.
                        </div>
                    ) : done ? (
                        <div className="auth-success" role="status">
                            <span>✓</span>
                            <p>
                                Tu contraseña se actualizó correctamente.
                                Ya puedes iniciar sesión con la nueva.
                            </p>

                            <Link
                                to="/iniciar-sesion"
                                className="auth-submit"
                            >
                                Iniciar sesión <span>✦</span>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>

                            <div className="auth-field">
                                <label htmlFor="reset-password">
                                    Nueva contraseña
                                </label>

                                <div className="password-wrapper">
                                    <input
                                        id="reset-password"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        placeholder="Tu nueva contraseña"
                                        value={password}
                                        onChange={(event) =>
                                            setPassword(
                                                event.target.value
                                            )
                                        }
                                        autoComplete="new-password"
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() =>
                                            setShowPassword(
                                                (previous) => !previous
                                            )
                                        }
                                    >
                                        {showPassword
                                            ? "Ocultar"
                                            : "Mostrar"}
                                    </button>
                                </div>
                            </div>

                            <PasswordStrength password={password} />

                            <div className="auth-field">
                                <label htmlFor="reset-confirm">
                                    Confirmar contraseña
                                </label>

                                <input
                                    id="reset-confirm"
                                    type={
                                        showPassword ? "text" : "password"
                                    }
                                    placeholder="Repite la nueva contraseña"
                                    value={confirmPassword}
                                    onChange={(event) =>
                                        setConfirmPassword(
                                            event.target.value
                                        )
                                    }
                                    autoComplete="new-password"
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
                                    ? "Guardando..."
                                    : "Guardar contraseña"}
                                <span>✦</span>
                            </button>

                        </form>
                    )}

                    <div className="auth-register">
                        <Link to="/iniciar-sesion">
                            Volver a iniciar sesión
                        </Link>
                    </div>

                </div>

            </div>
        </section>
    );
}

export default ResetPassword;
