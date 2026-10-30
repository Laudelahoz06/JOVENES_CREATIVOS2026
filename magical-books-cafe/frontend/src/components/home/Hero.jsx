import { Link } from "react-router-dom";

function Hero() {

    return (
        <section className="hero">

            <div className="hero-overlay">

                <span className="hero-subtitle">
                    COFFEE · BOOKS · ART · TECHNOLOGY
                </span>

                <h1>
                    Magical Books
                    <span> Café</span>
                </h1>

                <p>
                    Un refugio para los amantes del café,
                    las historias y las experiencias extraordinarias.
                </p>

                <div className="hero-buttons">

                    <Link to="/catalogo" className="btn-primary">
                        Explorar catálogo
                    </Link>

                    <a href="#experiencias" className="btn-secondary">
                        Descubrir experiencias
                    </a>

                </div>

            </div>

            <div className="hero-phrase">
                "Entre páginas y aromas, comienza la magia."
            </div>

        </section>
    );
}

export default Hero;