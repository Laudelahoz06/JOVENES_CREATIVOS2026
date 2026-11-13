import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";


function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const { count } = useCart();
    const navigate = useNavigate();

    const isAdmin = user?.role === "admin";

    // Menú lateral vertical en árbol con estilo propio del cliente.
    const [menuOpen, setMenuOpen] = useState(false);
    const [groupsOpen, setGroupsOpen] = useState({
        explorar: true,
        cuenta: true
    });

    // Con el drawer abierto no se desplaza la página de fondo.
    useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "";

        return () => {
            document.body.style.overflow = "";
        };
    }, [menuOpen]);

    // Escape cierra el menú.
    useEffect(() => {
        if (!menuOpen) return undefined;

        const onKeyDown = (event) => {
            if (event.key === "Escape") setMenuOpen(false);
        };

        window.addEventListener("keydown", onKeyDown);

        return () => window.removeEventListener("keydown", onKeyDown);
    }, [menuOpen]);

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
                              key: "pedidos",
                              label: "Mis pedidos",
                              icon: "🛍️",
                              to: "/mis-pedidos"
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
            setMenuOpen(false);
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
                        className={
                            menuOpen
                                ? "nav-hamburger active"
                                : "nav-hamburger"
                        }
                        aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                        aria-expanded={menuOpen}
                        onClick={() =>
                            menuOpen ? closeMenu() : setMenuOpen(true)
                        }
                    >
                        <span aria-hidden="true">
                            {menuOpen ? "✕" : "☰"}
                        </span>
                    </button>

                    <Link to="/" className="brand" onClick={closeMenu}>
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
                                <span className="btn-logout-label">
                                    Cerrar sesión
                                </span>
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

            {/* Overlay con desenfoque para cerrar el drawer */}
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
                aria-hidden={!menuOpen}
            >
                <div className="nav-drawer-brand">
                    <Link
                        to="/"
                        className="brand nav-drawer-logo"
                        onClick={closeMenu}
                    >
                        <span className="brand-icon-badge">✦</span>
                        <span className="nav-drawer-logo-text">
                            Magical Books
                            <small>Café literario</small>
                        </span>
                    </Link>

                    <button
                        type="button"
                        className="nav-drawer-close"
                        aria-label="Cerrar menú"
                        onClick={closeMenu}
                    >
                        ✕
                    </button>
                </div>

                <nav className="nav-tree">
                    <p className="nav-tree-label">Menú</p>

                    {MENU.map((group) => {
                        const isOpen = groupsOpen[group.key] !== false;

                        return (
                            <div
                                className="nav-tree-group"
                                key={group.key}
                            >
                                <button
                                    type="button"
                                    className="nav-tree-parent"
                                    aria-expanded={isOpen}
                                    onClick={() => toggleGroup(group.key)}
                                >
                                    <span className="nav-tree-icon">
                                        {group.icon}
                                    </span>
                                    <span className="nav-tree-parent-label">
                                        {group.label}
                                    </span>
                                    <span
                                        className={
                                            isOpen
                                                ? "nav-tree-chevron open"
                                                : "nav-tree-chevron"
                                        }
                                    >
                                        ▾
                                    </span>
                                </button>

                                <div
                                    className={
                                        isOpen
                                            ? "nav-tree-children open"
                                            : "nav-tree-children"
                                    }
                                    aria-hidden={!isOpen}
                                >
                                    {group.children.map((child, index) => {
                                        const itemStyle = {
                                            "--item-delay": `${index * 40}ms`
                                        };

                                        const inner = (
                                            <>
                                                <span
                                                    className="nav-tree-dot"
                                                    aria-hidden="true"
                                                />
                                                <span className="nav-tree-icon">
                                                    {child.icon}
                                                </span>
                                                <span>{child.label}</span>
                                            </>
                                        );

                                        if (child.hash) {
                                            return (
                                                <a
                                                    key={child.key}
                                                    href={child.hash}
                                                    className="nav-tree-item"
                                                    style={itemStyle}
                                                    onClick={closeMenu}
                                                >
                                                    {inner}
                                                </a>
                                            );
                                        }

                                        return (
                                            <NavLink
                                                key={child.key}
                                                to={child.to}
                                                className={({ isActive }) =>
                                                    isActive
                                                        ? "nav-tree-item active"
                                                        : "nav-tree-item"
                                                }
                                                style={itemStyle}
                                                onClick={closeMenu}
                                            >
                                                {inner}
                                            </NavLink>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* Pie del drawer con acciones rápidas */}
                <div className="nav-drawer-footer">
                    {!isAdmin && (
                        <Link
                            to="/carrito"
                            className="nav-drawer-cart"
                            onClick={closeMenu}
                        >
                            🛒 Ver carrito
                            {count > 0 && (
                                <span className="nav-cart-badge">
                                    {count}
                                </span>
                            )}
                        </Link>
                    )}

                    {isAuthenticated ? (
                        <button
                            type="button"
                            className="nav-drawer-logout"
                            onClick={handleLogout}
                        >
                            <span aria-hidden="true">⏻</span>
                            Cerrar sesión
                        </button>
                    ) : (
                        <Link
                            to="/iniciar-sesion"
                            className="nav-drawer-login"
                            onClick={closeMenu}
                        >
                            Iniciar sesión →
                        </Link>
                    )}

                    <p className="nav-drawer-quote">
                        «Un café, un libro, una historia.»
                    </p>
                </div>
            </aside>
        </>
    );
}

export default Navbar;
