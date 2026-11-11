import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { apiRequest } from "../services/api";
import { useAuth } from "../context/AuthContext";

// Página de retorno desde Wompi (?id=<transaction_id>&reference=...).
// Nada se da por pagado aquí: el backend consulta a Wompi con la llave
// privada antes de marcar el pedido como aprobado.
function PaymentResult() {
    const [searchParams] = useSearchParams();
    const { isAuthenticated } = useAuth();

    const transactionId = searchParams.get("id") || "";
    const reference = searchParams.get("reference") || "";
    const hasInfo = Boolean(transactionId || reference);

    // Estado inicial derivado de la URL (sin efectos).
    const [state, setState] = useState(() =>
        hasInfo
            ? { phase: "loading", message: "", status: "" }
            : {
                  phase: "error",
                  message: "No se recibió información del pago.",
                  status: ""
              }
    );

    const attemptsRef = useRef(0);

    const verify = useCallback(async () => {
        try {
            const query = new URLSearchParams();

            if (transactionId) query.set("transactionId", transactionId);
            if (reference) query.set("reference", reference);

            const data = await apiRequest(
                `/payments/wompi/verify?${query.toString()}`
            );

            if (data.paymentStatus === "approved") {
                setState({
                    phase: "approved",
                    message:
                        "Tu pago fue aprobado y el pedido está confirmado.",
                    status: data.status
                });
                return;
            }

            if (data.paymentStatus === "rejected") {
                setState({
                    phase: "rejected",
                    message:
                        "Wompi rechazó el pago. Puedes intentarlo de nuevo " +
                        "desde tu carrito.",
                    status: data.status
                });
                return;
            }

            setState({
                phase: "pending",
                message:
                    "El pago aún está en proceso. Wompi puede tardar unos " +
                    "segundos en confirmar; vuelve a verificar.",
                status: data.status || ""
            });

        } catch (error) {
            setState({
                phase: "error",
                message: error.message || "No se pudo verificar el pago.",
                status: ""
            });
        }
    }, [transactionId, reference]);

    // Verificación inicial (programada fuera del cuerpo del efecto para
    // no disparar renders encadenados; el setState ocurre tras el await).
    useEffect(() => {
        if (!hasInfo || !isAuthenticated) return;

        const timer = window.setTimeout(verify, 0);

        return () => window.clearTimeout(timer);
    }, [hasInfo, isAuthenticated, verify]);

    // Reintento automático mientras el pago siga como PENDING.
    useEffect(() => {
        if (state.phase !== "pending" || !isAuthenticated) return;
        if (attemptsRef.current >= 5) return;

        const timer = window.setTimeout(() => {
            attemptsRef.current += 1;
            verify();
        }, 4000);

        return () => window.clearTimeout(timer);
    }, [state.phase, isAuthenticated, verify]);

    if (!isAuthenticated) {
        return (
            <section className="payment-result-page">
                <div className="payment-result-card">
                    <span className="payment-result-icon payment-result-error">
                        ⚠
                    </span>

                    <h1>Inicia sesión</h1>

                    <p>
                        Necesitas iniciar sesión para verificar el estado
                        de tu pago.
                    </p>

                    <div className="payment-result-actions">
                        <Link to="/iniciar-sesion" className="btn-primary">
                            Iniciar sesión
                        </Link>

                        <Link to="/catalogo" className="btn-secondary">
                            Seguir explorando
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    const icons = {
        loading: "⏳",
        approved: "✓",
        rejected: "✕",
        pending: "…",
        error: "⚠"
    };

    const titles = {
        loading: "Verificando tu pago...",
        approved: "¡Pago aprobado!",
        rejected: "Pago rechazado",
        pending: "Pago en proceso",
        error: "No pudimos verificar"
    };

    return (
        <section className="payment-result-page">
            <div className="payment-result-card">
                <span
                    className={`payment-result-icon payment-result-${state.phase}`}
                >
                    {icons[state.phase]}
                </span>

                <h1>{titles[state.phase]}</h1>

                <p>{state.message}</p>

                {transactionId && (
                    <p className="payment-result-reference">
                        Transacción: <code>{transactionId}</code>
                    </p>
                )}

                <div className="payment-result-actions">
                    {state.phase === "pending" && (
                        <button
                            type="button"
                            className="btn-primary"
                            onClick={verify}
                        >
                            Volver a verificar
                        </button>
                    )}

                    {state.phase === "approved" && (
                        <Link to="/perfil" className="btn-primary">
                            Ver mis pedidos
                        </Link>
                    )}

                    {(state.phase === "rejected" ||
                        state.phase === "error") && (
                        <Link to="/carrito" className="btn-primary">
                            Reintentar pago
                        </Link>
                    )}

                    <Link to="/catalogo" className="btn-secondary">
                        Seguir explorando
                    </Link>
                </div>
            </div>
        </section>
    );
}

export default PaymentResult;
