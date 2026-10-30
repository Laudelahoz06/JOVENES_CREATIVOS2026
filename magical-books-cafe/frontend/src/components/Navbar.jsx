import { Link, NavLink } from "react-router-dom";

function Navbar() {

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

                <button className="btn-login">
                    Iniciar sesión
                </button>

            </div>

        </header>
    );
}

export default Navbar;  