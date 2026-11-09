
import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

function AdminDashboard() {
    const [message, setMessage] = useState("Verificando acceso administrativo...");
    const [error, setError] = useState("");

    useEffect(() => {
        const verifyAccess = async () => {
            try {
                const response = await apiRequest("/admin/access-test");
                setMessage(response.message);
            } catch (err) {
                setError(err.message || "No se pudo verificar el acceso.");
            }
        };

        verifyAccess();
    }, []);

    return (
        <section className="admin-dashboard">
            <div className="admin-welcome">
                <span>✦ MAGICAL BOOKS CAFÉ</span>
                <h1>Panel administrativo</h1>
                <p>
                    Gestiona tu café literario desde un solo lugar.
                </p>
            </div>

            <div className="admin-status">
                {error ? (
                    <p className="admin-error">{error}</p>
                ) : (
                    <p>{message}</p>
                )}
            </div>
        </section>
    );
}

export default AdminDashboard;
