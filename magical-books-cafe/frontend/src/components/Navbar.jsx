import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    
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

           

            <nav className="nav-links">

                <NavLink to="/">Inicio</NavLink>

                <NavLink to="/catalogo">Catálogo</NavLink>

                <a href="#experiencias">Experiencias</a>

                <a href="#contacto">Contacto</a>

            </nav>

            <div className="nav-actions">

                {isAuthenticated ? (
                    <>
                        <span className="nav-user">
                            Hola, {user?.name?.split(" ")[0]}
                        </span>

                        {user?.role === "admin" && (
                            <Link to="/admin" className="btn-login">
                                Panel administrativo
                            </Link>
                        )}

                        <button
                            type="button"
                            className="btn-login"
                            onClick={handleLogout}
                        >
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