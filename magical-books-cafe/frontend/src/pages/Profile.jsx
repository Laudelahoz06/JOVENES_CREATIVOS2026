import { useState } from "react";

import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import AccountLayout from "../layouts/AccountLayout";
import PasswordStrength from "../components/auth/PasswordStrength";
import { isStrongPassword, missingPasswordRules } from "../utils/password";

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

    // Formulario de cambio de contraseña.
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [changingPassword, setChangingPassword] = useState(false);
    const [passwordFeedback, setPasswordFeedback] = useState(null);
    const [passwordErrors, setPasswordErrors] = useState({});

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

    const handlePasswordChange = (event) => {
        const { name, value } = event.target;

        setPasswordForm((previous) => ({ ...previous, [name]: value }));
        setPasswordFeedback(null);
        setPasswordErrors((previous) => ({ ...previous, [name]: undefined }));
    };

    const handlePasswordSubmit = async (event) => {
        event.preventDefault();

        const nextErrors = {};

        if (!passwordForm.currentPassword) {
            nextErrors.currentPassword = "Ingresa tu contraseña actual.";
        }

        if (!isStrongPassword(passwordForm.newPassword)) {
            nextErrors.newPassword =
                "Falta: " +
                missingPasswordRules(passwordForm.newPassword).join(", ") +
                ".";
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            nextErrors.confirmPassword = "Las contraseñas no coinciden.";
        }

        if (
            passwordForm.currentPassword &&
            passwordForm.newPassword &&
            passwordForm.currentPassword === passwordForm.newPassword
        ) {
            nextErrors.newPassword =
                "La nueva contraseña debe ser distinta a la actual.";
        }

        if (Object.keys(nextErrors).length > 0) {
            setPasswordErrors(nextErrors);
            return;
        }

        setChangingPassword(true);
        setPasswordFeedback(null);

        try {
            const data = await apiRequest("/auth/password", {
                method: "PATCH",
                body: JSON.stringify({
                    currentPassword: passwordForm.currentPassword,
                    newPassword: passwordForm.newPassword
                })
            });

            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });

            setPasswordFeedback({
                type: "success",
                message: data.message || "Contraseña actualizada."
            });

        } catch (error) {
            setPasswordFeedback({
                type: "error",
                message: error.message || "No se pudo cambiar la contraseña."
            });
        } finally {
            setChangingPassword(false);
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

            <form
                className="profile-form-card"
                onSubmit={handlePasswordSubmit}
                noValidate
            >
                <h2>Cambiar contraseña</h2>

                <p className="profile-hint">
                    Usa al menos 8 caracteres con mayúscula, minúscula,
                    número y un carácter especial.
                </p>

                <div className="profile-field">
                    <label htmlFor="current-password">
                        Contraseña actual
                    </label>
                    <input
                        id="current-password"
                        name="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordChange}
                        autoComplete="current-password"
                    />
                    {passwordErrors.currentPassword && (
                        <small className="field-error">
                            {passwordErrors.currentPassword}
                        </small>
                    )}
                </div>

                <div className="profile-field">
                    <label htmlFor="new-password">
                        Nueva contraseña
                    </label>
                    <input
                        id="new-password"
                        name="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        autoComplete="new-password"
                    />
                    {passwordErrors.newPassword && (
                        <small className="field-error">
                            {passwordErrors.newPassword}
                        </small>
                    )}
                </div>

                <PasswordStrength password={passwordForm.newPassword} />

                <div className="profile-field">
                    <label htmlFor="confirm-new-password">
                        Confirmar nueva contraseña
                    </label>
                    <input
                        id="confirm-new-password"
                        name="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        autoComplete="new-password"
                    />
                    {passwordErrors.confirmPassword && (
                        <small className="field-error">
                            {passwordErrors.confirmPassword}
                        </small>
                    )}
                </div>

                {passwordFeedback && (
                    <div
                        className={`form-feedback form-feedback-${passwordFeedback.type}`}
                        role="alert"
                    >
                        <span>
                            {passwordFeedback.type === "success"
                                ? "✓"
                                : "⚠"}
                        </span>
                        {passwordFeedback.message}
                    </div>
                )}

                <button
                    type="submit"
                    className="btn-primary"
                    disabled={changingPassword}
                >
                    {changingPassword
                        ? "Actualizando..."
                        : "Cambiar contraseña ✦"}
                </button>

            </form>

        </AccountLayout>
    );
}

export default Profile;
