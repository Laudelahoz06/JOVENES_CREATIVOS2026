import { useState } from "react";

import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import AccountLayout from "../layouts/AccountLayout";

const PREFERENCE_FIELDS = [
    { key: "favoriteBooks", label: "Libros favoritos" },
    { key: "favoriteGenres", label: "Géneros favoritos" },
    { key: "favoriteCoffee", label: "Cafés favoritos" },
    { key: "favoriteMusic", label: "Música favorita" }
];

// Convierte las preferencias del usuario en un objeto de textos (coma).
const preferencesToForm = (preferences = {}) => {
    const result = {};

    for (const field of PREFERENCE_FIELDS) {
        result[field.key] = (preferences[field.key] || []).join(", ");
    }

    return result;
};

function Profile() {
    const { user, updateUser } = useAuth();

    const [formData, setFormData] = useState(() => ({
        name: user?.name || "",
        phone: user?.phone || "",
        preferences: preferencesToForm(user?.preferences)
    }));

    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [errors, setErrors] = useState({});

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({ ...previous, [name]: value }));
        setFeedback(null);
        setErrors((previous) => ({ ...previous, [name]: undefined }));
    };

    const handlePreferenceChange = (key, value) => {
        setFormData((previous) => ({
            ...previous,
            preferences: { ...previous.preferences, [key]: value }
        }));
        setFeedback(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const nextErrors = {};

        if (!formData.name.trim()) {
            nextErrors.name = "El nombre es obligatorio.";
        }

        if (formData.phone.trim().length > 30) {
            nextErrors.phone = "Máximo 30 caracteres.";
        }

        const preferences = {};

        for (const field of PREFERENCE_FIELDS) {
            const values = (formData.preferences[field.key] || "")
                .split(",")
                .map((value) => value.trim())
                .filter(Boolean)
                .slice(0, 20);

            preferences[field.key] = values;
        }

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            return;
        }

        setSaving(true);
        setFeedback(null);

        try {
            const data = await apiRequest("/auth/profile", {
                method: "PATCH",
                body: JSON.stringify({
                    name: formData.name.trim(),
                    phone: formData.phone.trim(),
                    preferences
                })
            });

            updateUser({ ...user, ...data.user });

            setFeedback({
                type: "success",
                message: "Perfil actualizado correctamente."
            });

        } catch (error) {
            setFeedback({
                type: "error",
                message: error.message || "No se pudo actualizar el perfil."
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <AccountLayout
            title="Mi perfil"
            description="Guarda tus datos y preferencias de Magical Books Café."
        >

            <form
                className="profile-form-card"
                onSubmit={handleSubmit}
                noValidate
            >
                <h2>Datos personales</h2>

                <div className="profile-field">
                    <label htmlFor="profile-name">Nombre</label>
                    <input
                        id="profile-name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        autoComplete="name"
                    />
                    {errors.name && (
                        <small className="field-error">
                            {errors.name}
                        </small>
                    )}
                </div>

                <div className="profile-field">
                    <label htmlFor="profile-email">
                        Correo electrónico
                    </label>
                    <input
                        id="profile-email"
                        type="email"
                        value={user?.email || ""}
                        disabled
                    />
                    <small className="field-hint">
                        El correo no se puede modificar.
                    </small>
                </div>

                <div className="profile-field">
                    <label htmlFor="profile-phone">
                        Teléfono
                    </label>
                    <input
                        id="profile-phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="300 000 0000"
                        autoComplete="tel"
                    />
                    {errors.phone && (
                        <small className="field-error">
                            {errors.phone}
                        </small>
                    )}
                </div>

                <h3 className="profile-subtitle">Mis preferencias</h3>
                <p className="profile-hint">
                    Separa cada elemento con comas (máximo 20 por
                    categoría).
                </p>

                <div className="profile-preferences">
                    {PREFERENCE_FIELDS.map((field) => (
                        <div
                            className="profile-field"
                            key={field.key}
                        >
                            <label htmlFor={`pref-${field.key}`}>
                                {field.label}
                            </label>
                            <input
                                id={`pref-${field.key}`}
                                type="text"
                                value={
                                    formData.preferences[field.key] || ""
                                }
                                onChange={(event) =>
                                    handlePreferenceChange(
                                        field.key,
                                        event.target.value
                                    )
                                }
                                placeholder="Ej: Gabriel García Márquez, Isabel Allende"
                            />
                        </div>
                    ))}
                </div>

                {feedback && (
                    <div
                        className={`form-feedback form-feedback-${feedback.type}`}
                        role="alert"
                    >
                        <span>
                            {feedback.type === "success" ? "✓" : "⚠"}
                        </span>
                        {feedback.message}
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={saving}
                >
                    {saving ? "Guardando..." : "Guardar cambios ✦"}
                </button>

            </form>

        </AccountLayout>
    );
}

export default Profile;
