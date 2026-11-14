import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    BookOpen,
    X
} from "lucide-react";

function AdminSidebar({
    collapsed,
    mobileMenuOpen,
    onCloseMobile
}) {
    return (
        <aside
            className={`admin-sidebar
                ${collapsed ? "collapsed" : ""}
                ${mobileMenuOpen ? "mobile-open" : ""}`}
        >
            <div className="admin-sidebar-brand">
                <div className="admin-brand-icon">
                    <BookOpen size={25} />
                </div>

                {!collapsed && (
                    <div className="admin-brand-text">
                        <strong>Magical Books</strong>
                        <span>Panel administrativo</span>
                    </div>
                )}

                <button
                    type="button"
                    className="admin-mobile-close"
                    onClick={onCloseMobile}
                    aria-label="Cerrar menú"
                >
                    <X size={21} />
                </button>
            </div>

            <div className="admin-sidebar-section">
                {!collapsed && (
                    <span className="admin-sidebar-label">
                        GENERAL
                    </span>
                )}

                <NavLink
                    to="/admin"
                    end
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                        `admin-nav-link ${isActive ? "active" : ""}`
                    }
                    title="Panel principal"
                >
                    <LayoutDashboard size={20} />

                    {!collapsed && (
                        <span>Panel principal</span>
                    )}
                </NavLink>
            </div>

            <div className="admin-sidebar-footer">
                {!collapsed && (
                    <p>
                        Magical Books Café
                        <span>Un espacio para vivir historias.</span>
                    </p>
                )}
            </div>
        </aside>
    );
}

export default AdminSidebar;