// Reglas de contraseña segura (espejo del validador del backend:
// backend/src/routes/authRoutes.js → STRONG_PASSWORD_REGEX).
export const PASSWORD_RULES = [
    {
        key: "length",
        label: "Entre 8 y 72 caracteres",
        test: (value) => value.length >= 8 && value.length <= 72
    },
    {
        key: "upper",
        label: "Una letra mayúscula (A-Z)",
        test: (value) => /[A-Z]/.test(value)
    },
    {
        key: "lower",
        label: "Una letra minúscula (a-z)",
        test: (value) => /[a-z]/.test(value)
    },
    {
        key: "number",
        label: "Un número (0-9)",
        test: (value) => /\d/.test(value)
    },
    {
        key: "special",
        label: "Un carácter especial (!@#$...)",
        test: (value) => /[^\da-zA-Z]/.test(value)
    }
];

// Cumple todas las reglas → segura.
export const isStrongPassword = (value) =>
    PASSWORD_RULES.every((rule) => rule.test(value || ""));

// Etiquetas de las reglas que aún no se cumplen.
export const missingPasswordRules = (value) =>
    PASSWORD_RULES.filter((rule) => !rule.test(value || "")).map(
        (rule) => rule.label
    );
