import { useNavigate } from "react-router-dom";
import {
    Menu,
    PanelLeftClose,
    PanelLeftOpen,
    LogOut,
    UserRound
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

function AdminHeader({
    collapsed,
    onToggleSidebar,
    onOpenMobileMenu
}) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            navigate("/iniciar-sesion");
        }
    };

    const administratorName =
        user?.name || user?.email || "Administrador";

    return (
        <header className="admin-header">
            <div className="admin-header-left">
                <button
                    type="button"
                    className="admin-icon-button desktop-menu-button"
                    onClick={onToggleSidebar}
                    aria-label="Plegar o desplegar menú"
                >
                    {collapsed
                        ? <PanelLeftOpen size={21} />
                        : <PanelLeftClose size={21} />
                    }
                </button>

                <button
                    type="button"
                    className="admin-icon-button mobile-menu-button"
                    onClick={onOpenMobileMenu}
                    aria-label="Abrir menú"
                >
                    <Menu size={22} />
                </button>

                <div className="admin-header-title">
                    <span>Administración</span>
                    <h1>Panel principal</h1>
                </div>
            </div>

            <div className="admin-header-user">
                <div className="admin-user-avatar">
                    <UserRound size={20} />
                </div>

                <div className="admin-user-info">
                    <strong>{administratorName}</strong>
                    <span>Administrador</span>
                </div>

                <button
                    type="button"
                    className="admin-logout-button"
                    onClick={handleLogout}
                    title="Cerrar sesión"
                >
                    <LogOut size={18} />
                    <span>Cerrar sesión</span>
                </button>
            </div>
        </header>
    );
}

export default AdminHeader;