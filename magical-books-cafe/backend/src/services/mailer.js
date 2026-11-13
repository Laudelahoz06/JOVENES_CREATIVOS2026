import nodemailer from "nodemailer";

// Configuración SMTP por variables de entorno (.env):
//   SMTP_HOST, SMTP_PORT (587/465), SMTP_USER, SMTP_PASS, SMTP_FROM
export const isSmtpConfigured = () =>
    Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

let transporter = null;

const getTransporter = () => {
    if (!transporter) {
        const port = Number(process.env.SMTP_PORT) || 587;

        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port,
            secure: port === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    return transporter;
};

// Envía el correo con el enlace para restablecer la contraseña.
export const sendPasswordResetEmail = async (to, resetUrl) => {
    if (!isSmtpConfigured()) {
        throw new Error("SMTP no configurado.");
    }

    const from =
        process.env.SMTP_FROM ||
        `Magical Books Café <${process.env.SMTP_USER}>`;

    await getTransporter().sendMail({
        from,
        to,
        subject: "Recupera tu contraseña — Magical Books Café",
        text:
            "Recibimos una solicitud para restablecer tu contraseña.\n\n" +
            `Abre este enlace para elegir una nueva (válido por 30 minutos):\n` +
            `${resetUrl}\n\n` +
            "Si no fuiste tú, ignora este correo. Tu contraseña no cambiará.",
        html: `
            <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
                <h2 style="color: #63452F;">Magical Books Café</h2>
                <p>Recibimos una solicitud para restablecer tu contraseña.</p>
                <p>
                    <a href="${resetUrl}"
                       style="display: inline-block; background: #D6A968; color: #171321;
                              padding: 12px 22px; border-radius: 8px; text-decoration: none;
                              font-weight: bold;">
                        Elegir nueva contraseña
                    </a>
                </p>
                <p style="color: #666; font-size: 13px;">
                    El enlace vence en 30 minutos. Si no fuiste tú, ignora
                    este correo: tu contraseña no cambiará.
                </p>
            </div>
        `
    });
};
