import { useEffect, useState } from "react";

import { apiRequest } from "../../services/api";
import GeneralSection from "./GeneralSection";
import ProductsSection from "./ProductsSection";
import RentalsSection from "./RentalsSection";
import PaymentsSection from "./PaymentsSection";

const OVERVIEW_TABS = [
    { id: "general", label: "General" },
    { id: "productos", label: "Productos y servicios" },
    { id: "alquileres", label: "Alquileres" },
    { id: "pagos", label: "Pagos" }
];

// Contenedor del dashboard admin: carga las estadísticas una sola vez
// y las reparte en sub-pestañas por tema. `onSelectTab` permite que una
// sección (p. ej. Pagos) lleve al admin a otra pestaña del panel.
function AdminOverview({ onSelectTab }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("general");

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const data = await apiRequest("/admin/stats");

                if (!cancelled) setStats(data.stats);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.message || "No se pudieron cargar las estadísticas."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return <p className="admin-status">Cargando estadísticas...</p>;
    }

    if (error) {
        return <p className="admin-error">{error}</p>;
    }

    if (!stats) return null;

    return (
        <div>
            <div className="admin-tabs admin-subtabs" role="tablist">
                {OVERVIEW_TABS.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        className={activeTab === tab.id ? "active" : ""}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="admin-tab-content">
                {activeTab === "general" && (
                    <GeneralSection stats={stats} />
                )}

                {activeTab === "productos" && (
                    <ProductsSection stats={stats} />
                )}

                {activeTab === "alquileres" && (
                    <RentalsSection stats={stats} />
                )}

                {activeTab === "pagos" && (
                    <PaymentsSection
                        stats={stats}
                        onSelectTab={onSelectTab}
                    />
                )}
            </div>
        </div>
    );
}

export default AdminOverview;
