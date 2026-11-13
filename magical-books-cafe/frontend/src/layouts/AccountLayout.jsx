import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/format";

const ACCOUNT_NAV = [
    { to: "/perfil", icon: "🪪", label: "Mi perfil" },
    { to: "/mis-pedidos", icon: "🛍️", label: "Mis pedidos" },
    { to: "/mis-alquileres", icon: "📚", label: "Mis alquileres" },
    { to: "/mis-mensajes", icon: "💬", label: "Mis mensajes" }
];

const ROLE_LABELS = {
    customer: "Cliente",
    admin: "Administrador",
    staff: "Equipo"
};

// Layout compartido de las vistas del cliente (perfil, pedidos,
// alquileres y mensajes): encabezado + árbol lateral de navegación.
function AccountLayout({ eyebrow, title, description, children }) {
    const { user } = useAuth();

    return (
        <section className="account-page">

            <header className="account-header">
                <span>{eyebrow || "TU CUENTA"}</span>
                <h1>{title}</h1>
                {description && <p>{description}</p>}
            </header>

            <div className="account-layout">

                <aside className="account-sidebar">

                    <div className="account-user-card">
                        <div className="account-avatar">
                            {user?.name?.charAt(0)?.toUpperCase() || "✦"}
                        </div>

                        <div className="account-user-data">
                            <h2>{user?.name}</h2>
                            <p>{user?.email}</p>

                            {user?.phone ? (
                                <p className="account-user-phone">
                                    📞 {user.phone}
                                </p>
                            ) : null}

                            <span className="profile-role">
                                {ROLE_LABELS[user?.role] || user?.role}
                            </span>

                            {user?.createdAt && (
                                <span className="profile-since">
                                    Miembro desde{" "}
                                    {formatDate(user.createdAt)}
                                </span>
                            )}
                        </div>
                    </div>

                    <nav
                        className="account-nav"
                        aria-label="Secciones de mi cuenta"
                    >
                        {ACCOUNT_NAV.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) =>
                                    isActive
                                        ? "account-nav-link is-active"
                                        : "account-nav-link"
                                }
                            >
                                <span
                                    className="account-nav-icon"
                                    aria-hidden="true"
                                >
                                    {item.icon}
                                </span>
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    <nav
                        className="account-nav account-nav-secondary"
                        aria-label="Accesos rápidos"
                    >
                        <Link className="account-nav-link" to="/catalogo">
                            <span
                                className="account-nav-icon"
                                aria-hidden="true"
                            >
                                📖
                            </span>
                            Explorar catálogo
                        </Link>

                        <Link className="account-nav-link" to="/carrito">
                            <span
                                className="account-nav-icon"
                                aria-hidden="true"
                            >
                                🛒
                            </span>
                            Mi carrito
                        </Link>
                    </nav>

                </aside>

                <div className="account-content">
                    {children}
                </div>

            </div>

        </section>
    );
}

export default AccountLayout;
