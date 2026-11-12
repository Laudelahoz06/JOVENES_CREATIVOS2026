import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";


function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const { count } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    const isAdmin = user?.role === "admin";

    // En el panel administrativo solo se muestran las acciones de admin:
    // los enlaces públicos del menú central quedan ocultos.
    const isAdminPage = location.pathname.startsWith("/admin");


    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        } finally {
            navigate("/");
        }
    };


    return (
        <header className="navbar">

            <Link to="/" className="brand">
                <span className="brand-icon">✦</span>
                <span>Magical Books Café</span>
            </Link>

            {!isAdminPage && (
                <nav className="nav-links">

                    <NavLink to="/">Inicio</NavLink>

                    <NavLink to="/catalogo">Catálogo</NavLink>

                    <NavLink to="/contacto">Contacto</NavLink>

                    <a href="/#experiencias">Experiencias</a>

                    {isAuthenticated && (
                        <NavLink to="/mis-alquileres">Mis alquileres</NavLink>
                    )}

                </nav>
            )}

            <div className="nav-actions">

                {!isAdmin && (
                    <Link
                        to="/carrito"
                        className="nav-cart"
                        aria-label="Ver carrito"
                    >
                        🛒 Carrito

                        {count > 0 && (
                            <span className="nav-cart-badge">{count}</span>
                        )}
                    </Link>
                )}

                {isAuthenticated ? (
                    <>
                        <span className="nav-user">
                            Hola, {user?.name?.split(" ")[0]}
                        </span>

                        {!isAdmin && (
                            <NavLink to="/perfil" className="btn-login">
                                Mi perfil
                            </NavLink>
                        )}

                        {isAdmin && (
                            <Link to="/admin" className="btn-login">
                                Panel administrativo
                            </Link>
                        )}

                        <button
                            type="button"
                            className="btn-logout"
                            onClick={handleLogout}
                        >
                            <span aria-hidden="true">⏻</span>
                            Cerrar sesión
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/iniciar-sesion" className="btn-login">
                            Iniciar sesión
                        </Link>

                        <Link to="/registro" className="btn-register">
                            Registrarse
                        </Link>
                    </>
                )}
            </div>

        </header>
    );
}

export default Navbar;
