
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function ProtectedRoute({ children, allowedRoles = [] }) {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="admin-loading">
                Verificando permisos...
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/iniciar-sesion" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;
