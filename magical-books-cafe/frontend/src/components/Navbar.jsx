import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";


function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const { count } = useCart();
    const navigate = useNavigate();

    const isAdmin = user?.role === "admin";

    // Menú lateral vertical en árbol (mismo estilo que el panel admin).
    const [menuOpen, setMenuOpen] = useState(false);
    const [groupsOpen, setGroupsOpen] = useState({
        explorar: true,
        cuenta: true
    });

    const MENU = [
        {
            key: "explorar",
            label: "Explorar",
            icon: "🧭",
            children: [
                { key: "inicio", label: "Inicio", icon: "🏠", to: "/" },
                {
                    key: "catalogo",
                    label: "Catálogo",
                    icon: "🛍️",
                    to: "/catalogo"
                },
                {
                    key: "experiencias",
                    label: "Experiencias",
                    icon: "✨",
                    hash: "/#experiencias"
                },
                {
                    key: "contacto",
                    label: "Contacto",
                    icon: "✉️",
                    to: "/contacto"
                }
            ]
        },
        ...(isAuthenticated
            ? [
                  {
                      key: "cuenta",
                      label: "Mi cuenta",
                      icon: "👤",
                      children: [
                          {
                              key: "perfil",
                              label: "Mi perfil",
                              icon: "🪪",
                              to: "/perfil"
                          },
                          {
                              key: "alquileres",
                              label: "Mis alquileres",
                              icon: "📚",
                              to: "/mis-alquileres"
                          },
                          {
                              key: "mensajes",
                              label: "Mis mensajes",
                              icon: "💬",
                              to: "/mis-mensajes"
                          }
                      ]
                  }
              ]
            : [])
    ];

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        } finally {
            navigate("/");
        }
    };

    const toggleGroup = (key) => {
        setGroupsOpen((previous) => ({
            ...previous,
            [key]: !previous[key]
        }));
    };

    const closeMenu = () => setMenuOpen(false);

    return (
        <>
            <header className="navbar">

                <div className="nav-start">
                    <button
                        type="button"
                        className="nav-hamburger"
                        aria-label="Abrir menú"
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen(true)}
                    >
                        ☰
                    </button>

                    <Link to="/" className="brand">
                        <span className="brand-icon">✦</span>
                        <span>Magical Books Café</span>
                    </Link>
                </div>

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
                            <Link
                                to="/iniciar-sesion"
                                className="btn-login"
                            >
                                Iniciar sesión
                            </Link>

                            <Link to="/registro" className="btn-register">
                                Registrarse
                            </Link>
                        </>
                    )}
                </div>

            </header>

            {/* Overlay para cerrar el drawer */}
            {menuOpen && (
                <div
                    className="nav-drawer-overlay"
                    onClick={closeMenu}
                    role="presentation"
                />
            )}

            {/* ---------- Drawer vertical en árbol ---------- */}
            <aside
                className={
                    menuOpen ? "nav-drawer open" : "nav-drawer"
                }
                aria-label="Menú principal"
            >
                <div className="nav-drawer-brand">
                    <Link
                        to="/"
                        className="brand"
                        onClick={closeMenu}
                    >
                        <span className="brand-icon">✦</span>
                        <span>Magical Books Café</span>
                    </Link>

                    <button
                        type="button"
                        className="admin-link-button"
                        aria-label="Cerrar menú"
                        onClick={closeMenu}
                    >
                        ✕
                    </button>
                </div>

                <nav className="admin-tree">
                    {MENU.map((group) => {
                        const isOpen = groupsOpen[group.key] !== false;

                        return (
                            <div
                                className="admin-tree-group"
                                key={group.key}
                            >
                                <button
                                    type="button"
                                    className="admin-tree-parent"
                                    aria-expanded={isOpen}
                                    onClick={() => toggleGroup(group.key)}
                                >
                                    <span className="admin-tree-icon">
                                        {group.icon}
                                    </span>
                                    <span>{group.label}</span>
                                    <span
                                        className={
                                            isOpen
                                                ? "admin-tree-chevron open"
                                                : "admin-tree-chevron"
                                        }
                                    >
                                        ▾
                                    </span>
                                </button>

                                {isOpen && (
                                    <div className="admin-tree-children">
                                        {group.children.map((child) => {
                                            const classes = (isActive) =>
                                                isActive
                                                    ? "admin-tree-item active"
                                                    : "admin-tree-item";

                                            if (child.hash) {
                                                return (
                                                    <a
                                                        key={child.key}
                                                        href={child.hash}
                                                        className="admin-tree-item"
                                                        onClick={closeMenu}
                                                    >
                                                        <span className="admin-tree-branch">
                                                            │
                                                        </span>
                                                        <span className="admin-tree-icon">
                                                            {child.icon}
                                                        </span>
                                                        <span>
                                                            {child.label}
                                                        </span>
                                                    </a>
                                                );
                                            }

                                            return (
                                                <NavLink
                                                    key={child.key}
                                                    to={child.to}
                                                    className={classes}
                                                    onClick={closeMenu}
                                                >
                                                    <span className="admin-tree-branch">
                                                        │
                                                    </span>
                                                    <span className="admin-tree-icon">
                                                        {child.icon}
                                                    </span>
                                                    <span>
                                                        {child.label}
                                                    </span>
                                                </NavLink>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}

export default Navbar;
