
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");

        if (!name.trim() || !email.trim() || !password || !confirmPassword) {
            setError("Completa todos los campos.");
            return;
        }

        if (password.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres.");
            return;
        }

        if (password.length > 72) {
            setError("La contraseña no puede superar los 72 caracteres.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        try {
            setLoading(true);

            await register({
                name: name.trim(),
                email: email.trim(),
                password
            });

            navigate("/");
        } catch (err) {
            setError(err.message || "No fue posible crear la cuenta.");
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
                    <span className="auth-eyebrow">✦ UN LUGAR PARA LOS SOÑADORES ✦</span>

                    <h1>
                        Tu próxima
                        <span> gran historia </span>
                        comienza aquí.
                    </h1>

                    <p>
                        Crea tu cuenta y descubre un universo de libros,
                        café, experiencias y momentos especiales.
                    </p>

                    <div className="auth-quote">
                        “Cada página es una puerta a otro mundo”.
                    </div>
                </div>

                <div className="auth-card">
                    <div className="auth-card-header">
                        <span className="auth-icon">✦</span>
                        <h2>Crear una cuenta</h2>
                        <p>Únete a la comunidad de Magical Books Café.</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="auth-field">
                            <label htmlFor="register-name">Nombre completo</label>
                            <input
                                id="register-name"
                                type="text"
                                placeholder="Escribe tu nombre"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                maxLength={100}
                                autoComplete="name"
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="register-email">Correo electrónico</label>
                            <input
                                id="register-email"
                                type="email"
                                placeholder="nombre@correo.com"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="register-password">Contraseña</label>
                            <div className="password-wrapper">
                                <input
                                    id="register-password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Mínimo 8 caracteres"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    autoComplete="new-password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? "Ocultar" : "Mostrar"}
                                </button>
                            </div>
                        </div>

                        <div className="auth-field">
                            <label htmlFor="register-confirm-password">
                                Confirmar contraseña
                            </label>
                            <input
                                id="register-confirm-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Escribe nuevamente tu contraseña"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        {error && (
                            <div className="auth-error" role="alert">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="auth-submit"
                            disabled={loading}
                        >
                            {loading ? "Creando cuenta..." : "Crear mi cuenta"}
                        </button>
                    </form>

                    <div className="auth-register">
                        ¿Ya tienes una cuenta?{" "}
                        <Link to="/iniciar-sesion">Inicia sesión</Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Register;
