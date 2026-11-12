import crypto from "crypto";

// Integración con Wompi (pasarela de pago colombiana).
// Docs: https://docs.wompi.co/ — entornos independientes: nunca mezclar
// llaves ni URLs de sandbox con producción.

const CHECKOUT_URL = "https://checkout.wompi.co/p/";

const getBase = () =>
    process.env.WOMPI_ENV === "production"
        ? "https://production.wompi.co/v1"
        : "https://sandbox.wompi.co/v1";

// Llaves requeridas según el ambiente.
const getKeys = () => ({
    publicKey: process.env.WOMPI_PUBLIC_KEY || "",
    privateKey: process.env.WOMPI_PRIVATE_KEY || "",
    integrityKey: process.env.WOMPI_INTEGRITY_KEY || "",
    eventsSecret: process.env.WOMPI_EVENTS_SECRET || ""
});

export const isConfigured = () => {
    const { publicKey, privateKey, integrityKey } = getKeys();
    return Boolean(publicKey && privateKey && integrityKey);
};

// Error controlado para respuestas 503 cuando faltan llaves.
export class WompiNotConfiguredError extends Error {
    constructor() {
        super(
            "Wompi no está configurado: faltas WOMPI_PUBLIC_KEY / " +
                "WOMPI_PRIVATE_KEY / WOMPI_INTEGRITY_KEY en backend/.env."
        );
        this.name = "WompiNotConfiguredError";
        this.statusCode = 503;
    }
}

// Firma de integridad del checkout:
// sha256(<referencia><monto en centavos>COP<secreto de integridad>)
// Siempre se calcula en backend: el secreto nunca viaja al navegador.
export const buildSignature = (reference, amountInCents) => {
    const { integrityKey } = getKeys();

    return crypto
        .createHash("sha256")
        .update(`${reference}${amountInCents}COP${integrityKey}`)
        .digest("hex");
};

// El WAF/CloudFront de Wompi responde 403 "Request blocked" cuando
// redirect-url apunta a hosts locales o de red privada (localhost,
// 127.x, 10.x, 192.168.x, 172.16-31.x). En esos casos el parámetro se
// omite: el checkout carga igual, pero sin retorno automático a
// /pagos/resultado. Para probar el retorno completo usa una URL
// pública (p. ej. ngrok) en WOMPI_REDIRECT_URL.
const isLocalHostname = (hostname) => {
    const host = String(hostname || "").toLowerCase();

    return (
        host === "localhost" ||
        host === "[::1]" ||
        host === "host.docker.internal" ||
        /^127\./.test(host) ||
        /^10\./.test(host) ||
        /^192\.168\./.test(host) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    );
};

// URL completa a la que Wompi redirige tras el pago (?id=<transacción>).
// Prioridad: WOMPI_REDIRECT_URL (pública) y si no, FRONTEND_URL + ruta.
const buildRedirectUrl = () => {
    const explicit = (process.env.WOMPI_REDIRECT_URL || "").trim();

    if (explicit) return explicit.replace(/\/$/, "");

    const base = (process.env.FRONTEND_URL || "http://localhost:5173")
        .split(",")[0]
        .trim()
        .replace(/\/$/, "");

    return `${base}/pagos/resultado`;
};

// Parámetros para el checkout alojado (formulario GET a checkout.wompi.co/p/).
export const getCheckoutParams = ({ reference, amountInCents }) => {
    if (!isConfigured()) throw new WompiNotConfiguredError();

    const { publicKey } = getKeys();

    const redirectUrl = buildRedirectUrl();
    let redirectHost = "";

    try {
        redirectHost = new URL(redirectUrl).hostname;
    } catch {
        redirectHost = "";
    }

    return {
        checkoutUrl: CHECKOUT_URL,
        publicKey,
        currency: "COP",
        amountInCents,
        reference,
        signature: buildSignature(reference, amountInCents),
        // null → el frontend no envía el campo (evita el 403 de CloudFront).
        redirectUrl:
            redirectHost && !isLocalHostname(redirectHost)
                ? redirectUrl
                : null
    };
};

// Consulta el estado REAL de la transacción con la llave privada.
// Es la única fuente de verdad: ni la redirección ni el webhook por sí
// solos autorizan marcar un pedido como pagado.
export const getTransaction = async (transactionId) => {
    if (!isConfigured()) throw new WompiNotConfiguredError();

    const { privateKey } = getKeys();

    const response = await fetch(
        `${getBase()}/transactions/${encodeURIComponent(transactionId)}`,
        {
            headers: { Authorization: `Bearer ${privateKey}` }
        }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const message =
            data?.message ||
            data?.error?.reason ||
            `Wompi respondió ${response.status}.`;
        const error = new Error(message);
        error.statusCode = response.status === 404 ? 404 : 502;
        throw error;
    }

    return data?.data || null;
};

// Verificación del checksum del webhook.
// payload.signature.properties contiene los campos (rutas dentro de data)
// que Wompi concatenó; se les suma timestamp + secreto de eventos.
export const verifyWebhookChecksum = (payload) => {
    const { eventsSecret } = getKeys();
    const signature = payload?.signature;

    if (
        !eventsSecret ||
        !signature?.checksum ||
        !Array.isArray(signature.properties)
    ) {
        return false;
    }

    const getValue = (path) =>
        path
            .split(".")
            .reduce(
                (current, key) =>
                    current === null || current === undefined
                        ? undefined
                        : current[key],
                payload.data
            );

    const chain =
        signature.properties
            .map((path) => getValue(path) ?? "")
            .join("") +
        String(payload.timestamp ?? "") +
        eventsSecret;

    const expected = crypto
        .createHash("sha256")
        .update(chain)
        .digest("hex");

    try {
        return crypto.timingSafeEqual(
            Buffer.from(expected, "hex"),
            Buffer.from(String(signature.checksum).toLowerCase(), "hex")
        );
    } catch {
        return false;
    }
};

// Traduce el estado de Wompi a nuestro paymentStatus.
export const mapWompiStatus = (wompiStatus) => {
    if (wompiStatus === "APPROVED") return "approved";
    if (wompiStatus === "DECLINED" || wompiStatus === "ERROR") {
        return "rejected";
    }
    // PENDING y VOIDED siguen pendientes de verificación.
    return "pending";
};
