import { useCallback, useEffect, useState } from "react";

import { apiRequest } from "../../services/api";

const EMPTY_FORM = {
    title: "",
    description: "",
    icon: "✦",
    image: "",
    to: "",
    action: "",
    spotifyUrl: "",
    category: "General",
    order: 0,
    featured: false,
    active: true
};

function AdminExperiences() {
    const [experiences, setExperiences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [search, setSearch] = useState("");
    const [activeSearch, setActiveSearch] = useState("");
    const [formOpen, setFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [savingId, setSavingId] = useState(null);

    const loadExperiences = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({ limit: "50", sort: "order" });
            if (activeSearch) params.set("search", activeSearch);

            const data = await apiRequest(
                `/admin/experiences?${params.toString()}`
            );

            setExperiences(data.experiences || []);
        } catch (err) {
            setError(
                err.message || "No se pudieron cargar las experiencias."
            );
        } finally {
            setLoading(false);
        }
    }, [activeSearch]);

    useEffect(() => {
        const timer = window.setTimeout(loadExperiences, 0);

        return () => window.clearTimeout(timer);
    }, [loadExperiences]);

    const handleSearch = (event) => {
        event.preventDefault();
        setActiveSearch(search.trim());
    };

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setFormOpen(true);
        setFeedback(null);
    };

    const openEdit = (experience) => {
        setEditingId(experience._id);
        setForm({
            title: experience.title || "",
            description: experience.description || "",
            icon: experience.icon || "✦",
            image: experience.image || "",
            to: experience.to || "",
            action: experience.action || "",
            spotifyUrl: experience.spotifyUrl || "",
            category: experience.category || "General",
            order: experience.order ?? 0,
            featured: Boolean(experience.featured),
            active: experience.active !== false
        });
        setFormOpen(true);
        setFeedback(null);
    };

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.title.trim() || !form.description.trim()) {
            setFeedback({
                type: "error",
                message: "Título y descripción son obligatorios."
            });
            return;
        }

        setSaving(true);
        setFeedback(null);

        const payload = {
            title: form.title.trim(),
            description: form.description.trim(),
            icon: form.icon.trim() || "✦",
            image: form.image.trim(),
            to: form.to.trim(),
            action: form.action,
            spotifyUrl: form.spotifyUrl.trim(),
            category: form.category.trim() || "General",
            order: Number(form.order) || 0,
            featured: form.featured,
            active: form.active
        };

        try {
            if (editingId) {
                await apiRequest(`/admin/experiences/${editingId}`, {
                    method: "PATCH",
                    body: JSON.stringify(payload)
                });

                setFeedback({
                    type: "success",
                    message: "Experiencia actualizada correctamente."
                });
            } else {
                await apiRequest("/admin/experiences", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });

                setFeedback({
                    type: "success",
                    message: "Experiencia creada correctamente."
                });
            }

            setFormOpen(false);
            setEditingId(null);
            setForm(EMPTY_FORM);
            await loadExperiences();
        } catch (err) {
            setFeedback({
                type: "error",
                message: err.message || "No se pudo guardar la experiencia."
            });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (experience) => {
        setSavingId(experience._id);
        setFeedback(null);

        try {
            await apiRequest(
                `/admin/experiences/${experience._id}/status`,
                {
                    method: "PATCH",
                    body: JSON.stringify({ active: !experience.active })
                }
            );

            setExperiences((previous) =>
                previous.map((item) =>
                    item._id === experience._id
                        ? { ...item, active: !experience.active }
                        : item
                )
            );

            setFeedback({
                type: "success",
                message: !experience.active
                    ? `"${experience.title}" activada correctamente.`
                    : `"${experience.title}" desactivada correctamente.`
            });
        } catch (err) {
            setFeedback({
                type: "error",
                message: err.message || "No se pudo cambiar el estado."
            });
        } finally {
            setSavingId(null);
        }
    };

    const handleDelete = async (experience) => {
        const confirmed = window.confirm(
            `¿Eliminar la experiencia "${experience.title}"? Esta acción no se puede deshacer.`
        );

        if (!confirmed) return;

        setSavingId(experience._id);
        setFeedback(null);

        try {
            await apiRequest(`/admin/experiences/${experience._id}`, {
                method: "DELETE"
            });

            setExperiences((previous) =>
                previous.filter((item) => item._id !== experience._id)
            );

            setFeedback({
                type: "success",
                message: "Experiencia eliminada correctamente."
            });
        } catch (err) {
            setFeedback({
                type: "error",
                message: err.message || "No se pudo eliminar la experiencia."
            });
        } finally {
            setSavingId(null);
        }
    };

    return (
        <div className="admin-panel">
            <div className="admin-toolbar">
                <form className="admin-search" onSubmit={handleSearch}>
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar experiencia..."
                        aria-label="Buscar experiencia"
                    />
                    <button type="submit" className="btn-secondary">
                        Buscar
                    </button>
                </form>

                <button
                    type="button"
                    className="btn-primary"
                    onClick={openCreate}
                >
                    Nueva experiencia ✦
                </button>
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

            {formOpen && (
                <form className="admin-form" onSubmit={handleSubmit} noValidate>
                    <div className="admin-form-header">
                        <h3>
                            {editingId
                                ? "Editar experiencia"
                                : "Nueva experiencia"}
                        </h3>
                        <button
                            type="button"
                            className="admin-link-button"
                            onClick={() => {
                                setFormOpen(false);
                                setEditingId(null);
                                setForm(EMPTY_FORM);
                            }}
                        >
                            Cancelar
                        </button>
                    </div>

                    <div className="admin-form-grid">
                        <label>
                            Título *
                            <input
                                name="title"
                                value={form.title}
                                onChange={handleChange}
                                maxLength={150}
                                required
                            />
                        </label>

                        <label>
                            Icono
                            <input
                                name="icon"
                                value={form.icon}
                                onChange={handleChange}
                                maxLength={10}
                                placeholder="✦"
                            />
                        </label>

                        <label>
                            Imagen (URL)
                            <input
                                name="image"
                                type="url"
                                value={form.image}
                                onChange={handleChange}
                                placeholder="https://..."
                            />
                        </label>

                        <label>
                            Categoría
                            <input
                                name="category"
                                value={form.category}
                                onChange={handleChange}
                                maxLength={80}
                            />
                        </label>

                        <label>
                            Enlace (p. ej. /catalogo)
                            <input
                                name="to"
                                value={form.to}
                                onChange={handleChange}
                                maxLength={300}
                                placeholder="/contacto"
                            />
                        </label>

                        <label>
                            Acción
                            <select
                                name="action"
                                value={form.action}
                                onChange={handleChange}
                            >
                                <option value="">Ninguna</option>
                                <option value="assistant">
                                    Asistente IA
                                </option>
                            </select>
                        </label>

                        <label className="admin-form-full">
                            Playlist de Spotify (opcional)
                            <input
                                name="spotifyUrl"
                                type="url"
                                value={form.spotifyUrl}
                                onChange={handleChange}
                                placeholder="https://open.spotify.com/playlist/..."
                            />
                        </label>

                        <label>
                            Orden
                            <input
                                name="order"
                                type="number"
                                min={0}
                                value={form.order}
                                onChange={handleChange}
                            />
                        </label>

                        <label className="admin-form-full">
                            Descripción *
                            <textarea
                                name="description"
                                rows={3}
                                value={form.description}
                                onChange={handleChange}
                                maxLength={2000}
                                required
                            />
                        </label>
                    </div>

                    <div className="admin-checkbox-row">
                        <label className="admin-checkbox">
                            <input
                                type="checkbox"
                                name="featured"
                                checked={form.featured}
                                onChange={handleChange}
                            />
                            Destacada
                        </label>

                        <label className="admin-checkbox">
                            <input
                                type="checkbox"
                                name="active"
                                checked={form.active}
                                onChange={handleChange}
                            />
                            Activa (visible en el inicio)
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={saving}
                    >
                        {saving
                            ? "Guardando..."
                            : editingId
                              ? "Guardar cambios"
                              : "Crear experiencia"}
                    </button>
                </form>
            )}

            {loading && (
                <p className="admin-status">Cargando experiencias...</p>
            )}

            {error && <p className="admin-error">{error}</p>}

            {!loading && !error && experiences.length === 0 && (
                <p className="admin-status">
                    No hay experiencias registradas.
                </p>
            )}

            {experiences.length > 0 && (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Experiencia</th>
                                <th>Categoría</th>
                                <th>Orden</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>

                        <tbody>
                            {experiences.map((experience) => (
                                <tr key={experience._id}>
                                    <td>
                                        <strong>
                                            {experience.icon}{" "}
                                            {experience.title}
                                        </strong>
                                        <span className="admin-table-sub">
                                            {experience.description.slice(0, 60)}
                                            {experience.description.length > 60
                                                ? "..."
                                                : ""}
                                        </span>
                                    </td>

                                    <td>{experience.category}</td>

                                    <td>{experience.order}</td>

                                    <td>
                                        <span
                                            className={`status-chip status-${
                                                experience.active
                                                    ? "activo"
                                                    : "cancelado"
                                            }`}
                                        >
                                            {experience.active
                                                ? "Activa"
                                                : "Inactiva"}
                                        </span>
                                        {experience.featured && (
                                            <span className="status-chip status-activo">
                                                Destacada
                                            </span>
                                        )}
                                    </td>

                                    <td className="admin-table-actions">
                                        <button
                                            type="button"
                                            className="admin-link-button"
                                            onClick={() =>
                                                openEdit(experience)
                                            }
                                        >
                                            Editar
                                        </button>

                                        <button
                                            type="button"
                                            className="admin-link-button"
                                            disabled={
                                                savingId === experience._id
                                            }
                                            onClick={() =>
                                                handleToggleStatus(experience)
                                            }
                                        >
                                            {experience.active
                                                ? "Desactivar"
                                                : "Activar"}
                                        </button>

                                        <button
                                            type="button"
                                            className="admin-link-button"
                                            disabled={
                                                savingId === experience._id
                                            }
                                            onClick={() =>
                                                handleDelete(experience)
                                            }
                                        >
                                            Eliminar
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

export default AdminExperiences;
