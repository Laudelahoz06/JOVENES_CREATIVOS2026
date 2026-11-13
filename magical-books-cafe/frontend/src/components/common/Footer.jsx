import { Link } from "react-router-dom";

function Footer() {
    return (
        <footer className="footer">

            <div className="footer-grid">

                <div className="footer-brand">
                    <Link to="/" className="footer-logo">
                        <span className="footer-icon">✦</span>
                        <span>Magical Books Café</span>
                    </Link>

                    <p className="footer-tagline">
                        Entre páginas y aromas, comienza la magia.
                    </p>

                    <p className="footer-about">
                        Café literario: café premium, postres artesanales,
                        libros en venta y alquiler, y un espacio para la
                        comunidad.
                    </p>
                </div>

                <nav className="footer-col" aria-label="Explorar">
                    <h4>Explorar</h4>
                    <Link to="/">Inicio</Link>
                    <Link to="/catalogo">Catálogo</Link>
                    <Link to="/#experiencias">Experiencias</Link>
                    <Link to="/contacto">Contacto</Link>
                </nav>

                <nav className="footer-col" aria-label="Mi cuenta">
                    <h4>Mi cuenta</h4>
                    <Link to="/carrito">Carrito</Link>
                    <Link to="/perfil">Mi perfil</Link>
                    <Link to="/mis-pedidos">Mis pedidos</Link>
                    <Link to="/mis-alquileres">Mis alquileres</Link>
                    <Link to="/iniciar-sesion">Iniciar sesión</Link>
                </nav>

                <div className="footer-col">
                    <h4>Visítanos</h4>
                    <p>Lunes a domingo</p>
                    <p>8:00 a.m. – 9:00 p.m.</p>
                    <Link to="/contacto" className="footer-contact-link">
                        Escríbenos →
                    </Link>
                </div>

            </div>

            <div className="footer-bottom">
                <p>© 2026 Magical Books Café. Todos los derechos reservados.</p>
                <p className="footer-signature">✦ Café · Libros · Comunidad</p>
            </div>

        </footer>
    );
}

export default Footer;
