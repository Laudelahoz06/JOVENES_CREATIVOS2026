import { useState } from "react";
import { Outlet } from "react-router-dom";

import AdminSidebar from "../components/admin/AdminSidebar";
import AdminHeader from "../components/admin/AdminHeader";

import "../styles/admin.css";

function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className={`admin-layout ${collapsed ? "sidebar-collapsed" : ""}`}>
            <AdminSidebar
                collapsed={collapsed}
                mobileMenuOpen={mobileMenuOpen}
                onCloseMobile={() => setMobileMenuOpen(false)}
            />

            {mobileMenuOpen && (
                <button
                    type="button"
                    className="admin-sidebar-overlay"
                    aria-label="Cerrar menú"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <div className="admin-main">
                <AdminHeader
                    collapsed={collapsed}
                    onToggleSidebar={() => setCollapsed(!collapsed)}
                    onOpenMobileMenu={() => setMobileMenuOpen(true)}
                />

                <main className="admin-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default AdminLayout;