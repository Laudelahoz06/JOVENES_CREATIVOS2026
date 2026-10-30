import { Link } from "react-router-dom";

function NotFound() {
    return (
        <section className="not-found">
            <h1>404</h1>
            <h2>Esta página aún no existe en nuestra historia.</h2>
            <Link to="/">Regresar al inicio</Link>
        </section>
    );
}

export default NotFound;