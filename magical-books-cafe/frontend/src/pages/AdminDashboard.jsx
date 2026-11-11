import { Suspense, lazy, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";

import AdminProducts from "./admin/AdminProducts";
import AdminOrders from "./admin/AdminOrders";
import AdminRentals from "./admin/AdminRentals";
import AdminMessages from "./admin/AdminMessages";
import AdminUsers from "./admin/AdminUsers";

// La pestaña de resumen incluye recharts; se carga bajo demanda para
// no pesar el bundle de la tienda pública.
const AdminOverview = lazy(() => import("./admin/AdminOverview"));

// Menú del sidebar con estructura de árbol. "Gestión" es un nodo
// padre plegable con hijos indentados.
const MENU = [
    { key: "resumen", label: "Resumen", icon: "📊" },
    {
        key: "gestion",
        label: "Gestión",
        icon: "📦",
        children: [
            { key: "productos", label: "Productos", icon: "🛍️" },
            { key: "pedidos", label: "Pedidos", icon: "🧾" },
            { key: "alquileres", label: "Alquileres", icon: "📚" }
        ]
    },
    { key: "mensajes", label: "Mensajes", icon: "✉️" },
    { key: "usuarios", label: "Usuarios", icon: "👥" }
];

const SECTION_TITLES = {
    resumen: "Resumen",
    productos: "Productos",
    pedidos: "Pedidos",
    alquileres: "Alquileres",
    mensajes: "Mensajes",
    usuarios: "Usuarios"
};

function AdminDashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const [accessMessage, setAccessMessage] = useState("");
    const [accessError, setAccessError] = useState("");
    const [activeTab, setActiveTab] = useState("resumen");
    const [gestionOpen, setGestionOpen] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const verifyAccess = async () => {
            try {
                const response = await apiRequest("/admin/access-test");
                setAccessMessage(response.message);
            } catch (err) {
                setAccessError(err.message || "No se pudo verificar el acceso.");
            }
        };

        verifyAccess();
    }, []);

    const selectTab = (key) => {
        setActiveTab(key);
        setSidebarOpen(false);

        // Si el tab vive dentro de "Gestión", el nodo queda expandido.
        const parent = MENU.find(
            (item) => item.children?.some((child) => child.key === key)
        );

        if (parent) setGestionOpen(true);
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        } finally {
            navigate("/");
        }
    };

    const renderTreeItem = (item) => {
        if (item.children) {
            return (
                <div className="admin-tree-group" key={item.key}>
                    <button
                        type="button"
                        className="admin-tree-parent"
                        aria-expanded={gestionOpen}
                        onClick={() => setGestionOpen((open) => !open)}
                    >
                        <span className="admin-tree-icon">{item.icon}</span>
                        <span>{item.label}</span>
                        <span
                            className={
                                gestionOpen
                                    ? "admin-tree-chevron open"
                                    : "admin-tree-chevron"
                            }
                        >
                            ▾
                        </span>
                    </button>

                    {gestionOpen && (
                        <div className="admin-tree-children">
                            {item.children.map((child) => (
                                <button
                                    type="button"
                                    key={child.key}
                                    className={
                                        activeTab === child.key
                                            ? "admin-tree-item active"
                                            : "admin-tree-item"
                                    }
                                    onClick={() => selectTab(child.key)}
                                    aria-current={
                                        activeTab === child.key
                                            ? "page"
                                            : undefined
                                    }
                                >
                                    <span className="admin-tree-branch">
                                        │
                                    </span>
                                    <span className="admin-tree-icon">
                                        {child.icon}
                                    </span>
                                    <span>{child.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <button
                type="button"
                key={item.key}
                className={
                    activeTab === item.key
                        ? "admin-tree-item active"
                        : "admin-tree-item"
                }
                onClick={() => selectTab(item.key)}
                aria-current={activeTab === item.key ? "page" : undefined}
            >
                <span className="admin-tree-icon">{item.icon}</span>
                <span>{item.label}</span>
            </button>
        );
    };

    return (
        <section className="admin-dashboard">

            {/* Overlay móvil para cerrar el sidebar off-canvas */}
            {sidebarOpen && (
                <div
                    className="admin-sidebar-overlay"
                    onClick={() => setSidebarOpen(false)}
                    role="presentation"
                />
            )}

            {/* ---------- Sidebar izquierdo con árbol ---------- */}
            <aside
                className={
                    sidebarOpen
                        ? "admin-sidebar sidebar-open"
                        : "admin-sidebar"
                }
            >
                <Link to="/" className="brand admin-brand">
                    <span className="brand-icon">✦</span>
                    <span>Magical Books Café</span>
                </Link>

                <nav className="admin-tree" aria-label="Menú administrativo">
                    {MENU.map(renderTreeItem)}
                </nav>
            </aside>

            {/* ---------- Columna derecha: header + contenido ---------- */}
            <div className="admin-main">

                <header className="admin-header">
                    <button
                        type="button"
                        className="admin-hamburger"
                        aria-label="Abrir menú"
                        onClick={() => setSidebarOpen(true)}
                    >
                        ☰
                    </button>

                    <div className="admin-header-title">
                        <h1>{SECTION_TITLES[activeTab]}</h1>
                        <p>
                            {accessMessage ||
                                "Gestiona tu café literario desde un solo lugar."}
                        </p>
                    </div>

                    <div className="admin-header-actions">
                        <span className="admin-hola">
                            <span className="admin-avatar" aria-hidden="true">
                                {user?.name?.charAt(0)?.toUpperCase() || "✦"}
                            </span>
                            Hola, {user?.name?.split(" ")[0]}
                        </span>

                        <button
                            type="button"
                            className="btn-logout"
                            onClick={handleLogout}
                        >
                            <span aria-hidden="true">⏻</span>
                            Cerrar sesión
                        </button>
                    </div>
                </header>

                {accessError && (
                    <p className="admin-error admin-header-error">
                        {accessError}
                    </p>
                )}

                <div className="admin-content">
                    {activeTab === "resumen" && (
                        <Suspense
                            fallback={
                                <p className="admin-status">
                                    Cargando el resumen...
                                </p>
                            }
                        >
                            <AdminOverview />
                        </Suspense>
                    )}
                    {activeTab === "productos" && <AdminProducts />}
                    {activeTab === "pedidos" && <AdminOrders />}
                    {activeTab === "alquileres" && <AdminRentals />}
                    {activeTab === "mensajes" && <AdminMessages />}
                    {activeTab === "usuarios" && <AdminUsers />}
                </div>

            </div>

        </section>
    );
}

export default AdminDashboard;
