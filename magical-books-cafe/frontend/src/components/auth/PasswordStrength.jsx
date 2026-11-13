import { PASSWORD_RULES } from "../../utils/password";

// Lista de requisitos de la contraseña: se marca en verde cada
// regla cumplida mientras el usuario escribe.
function PasswordStrength({ password = "" }) {
    const allOk = PASSWORD_RULES.every((rule) => rule.test(password));

    return (
        <div
            className={
                allOk
                    ? "password-strength password-strength-ok"
                    : "password-strength"
            }
        >
            <p className="password-strength-title">
                {allOk
                    ? "✓ Contraseña segura"
                    : "La contraseña debe incluir:"}
            </p>

            <ul>
                {PASSWORD_RULES.map((rule) => {
                    const ok = rule.test(password);

                    return (
                        <li key={rule.key} className={ok ? "is-ok" : ""}>
                            <span aria-hidden="true">
                                {ok ? "✓" : "○"}
                            </span>
                            {rule.label}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

export default PasswordStrength;
