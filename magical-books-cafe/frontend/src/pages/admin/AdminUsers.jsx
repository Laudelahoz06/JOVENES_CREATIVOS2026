import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "../../services/api";
import { formatDate } from "../../utils/format";
import { useAuth } from "../../context/AuthContext";

const ROLE_LABELS = {
    customer: "Cliente",
    admin: "Administrador",
    staff: "Equipo"
};

function AdminUsers() {
    const { user: currentUser } = useAuth();

    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [savingId, setSavingId] = useState(null);
    const [roleFilter, setRoleFilter] = useState("");

    const loadUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = roleFilter
                ? `?role=${encodeURIComponent(roleFilter)}`
                : "";

            const data = await apiRequest(`/admin/users${params}`);

            setUsers(data.users || []);
            setStats(data.stats || null);

        } catch (err) {
            setError(err.message || "No se pudieron cargar los usuarios.");
        } finally {
            setLoading(false);
        }
    }, [roleFilter]);

    useEffect(() => {
        const timer = window.setTimeout(loadUsers, 0);

        return () => window.clearTimeout(timer);
    }, [loadUsers]);

    const handleUpdate = async (targetUser, patch) => {
        setSavingId(targetUser._id);
        setFeedback(null);

        try {
            const data = await apiRequest(
                `/admin/users/${targetUser._id}`,
                {
                    method: "PATCH",
                    body: JSON.stringify(patch)
                }
            );

            setUsers((previous) =>
                previous.map((item) =>
                    item._id === targetUser._id
                        ? { ...item, ...data.user }
                        : item
                )
            );

            setFeedback({
                type: "success",
                message: `${data.user.name}: ${
                    data.user.role === "customer" ? "cliente" : data.user.role
                } · ${data.user.active ? "activo" : "inactivo"}.`
            });

        } catch (err) {
            setFeedback({
                type: "error",
                message: err.message || "No se pudo actualizar el usuario."
            });
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="admin-panel">

            <div className="admin-toolbar">

                <div className="admin-stats">
                    <span>Total: {stats?.total ?? "—"}</span>
                    <span>Admins: {stats?.admins ?? "—"}</span>
                    <span>Inactivos: {stats?.inactivos ?? "—"}</span>
                </div>

                <div className="admin-filter">
                    <label htmlFor="user-role">Rol</label>

                    <select
                        id="user-role"
                        value={roleFilter}
                        onChange={(event) => setRoleFilter(event.target.value)}
                    >
                        <option value="">Todos</option>
                        <option value="customer">Clientes</option>
                        <option value="admin">Administradores</option>
                        <option value="staff">Equipo</option>
                    </select>
                </div>

            </div>

            {feedback && (
                <div
                    className={`form-feedback form-feedback-${feedback.type}`}
                    role="alert"
                >
                    <span>{feedback.type === "success" ? "✓" : "⚠"}</span>
                    {feedback.message}
                </div>
            )}

            {loading && <p className="admin-status">Cargando usuarios...</p>}

            {error && <p className="admin-error">{error}</p>}

            {users.length > 0 && (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th>Registro</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {users.map((user) => (
                                <tr key={user._id}>
                                    <td>
                                        <strong>{user.name}</strong>
                                        <span className="admin-table-sub">
                                            {user.email}
                                        </span>
                                    </td>

                                    <td>
                                        <select
                                            value={user.role}
                                            disabled={savingId === user._id}
                                            onChange={(event) =>
                                                handleUpdate(user, {
                                                    role: event.target.value
                                                })
                                            }
                                            aria-label="Cambiar rol"
                                        >
                                            {Object.entries(ROLE_LABELS).map(
                                                ([value, label]) => (
                                                    <option
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {label}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </td>

                                    <td>
                                        <span
                                            className={`status-chip status-${
                                                user.active
                                                    ? "activo"
                                                    : "cancelado"
                                            }`}
                                        >
                                            {user.active ? "Activo" : "Inactivo"}
                                        </span>
                                    </td>

                                    <td>{formatDate(user.createdAt)}</td>

                                    <td className="admin-table-actions">
                                        <button
                                            type="button"
                                            className="admin-link-button"
                                            disabled={
                                                savingId === user._id ||
                                                String(user._id) ===
                                                    String(
                                                        currentUser?.id ||
                                                            currentUser?._id
                                                    )
                                            }
                                            onClick={() =>
                                                handleUpdate(user, {
                                                    active: !user.active
                                                })
                                            }
                                        >
                                            {user.active
                                                ? "Desactivar"
                                                : "Activar"}
                                        </button>
                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    );
}

export default AdminUsers;
