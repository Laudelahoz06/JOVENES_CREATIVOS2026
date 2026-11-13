
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const data = await login({
                email: formData.email.trim(),
                password: formData.password
            });

            // El administrador entra directo a su panel;
            // el resto de usuarios vuelven al inicio.
            if (data.user?.role === "admin") {
                navigate("/admin");
            } else {
                navigate("/");
            }

        } catch (err) {
            setError(
                err.message || "No fue posible iniciar sesión."
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
                        Cada historia
                        <span> comienza aquí.</span>
                    </h1>

                    <p>
                        Un espacio donde la literatura, el café
                        y la imaginación se encuentran.
                        Nos alegra tenerte de vuelta.
                    </p>

                    <div className="auth-quote">
                        <span>❝</span>
                        <p>
                            Entre páginas y aromas,
                            siempre hay un mundo por descubrir.
                        </p>
                    </div>
                </div>

                <div className="auth-card">

                    <div className="auth-card-header">
                        <span className="auth-card-icon">✧</span>

                        <h2>Bienvenido de nuevo</h2>

                        <p>
                            Ingresa a tu cuenta para continuar
                            tu experiencia.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="auth-field">
                            <label htmlFor="email">
                                Correo electrónico
                            </label>

                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="nombre@correo.com"
                                value={formData.email}
                                onChange={handleChange}
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="auth-field">
                            <label htmlFor="password">
                                Contraseña
                            </label>

                            <div className="password-wrapper">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Ingresa tu contraseña"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="current-password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword((previous) => !previous)
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Ocultar contraseña"
                                            : "Mostrar contraseña"
                                    }
                                >
                                    {showPassword ? "Ocultar" : "Mostrar"}
                                </button>
                            </div>

                            <div className="auth-forgot">
                                <Link to="/recuperar-contrasena">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
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
                                ? "Iniciando sesión..."
                                : "Iniciar sesión"}
                            <span>✦</span>
                        </button>

                    </form>

                    <div className="auth-register">
                        <p>
                            ¿Todavía no tienes una cuenta?
                        </p>

                        <Link to="/registro">
                            Crear una cuenta
                        </Link>
                    </div>

                    <div className="auth-divider">
                        <span>✧</span>
                    </div>

                    <p className="auth-footer-text">
                        Tu próximo capítulo comienza aquí.
                    </p>

                </div>

            </div>
        </section>
    );
}

export default Login;
