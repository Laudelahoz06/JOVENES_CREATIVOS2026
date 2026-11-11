// Utilidades compartidas de formato para toda la interfaz.

export function formatCOP(value) {
    return Number(value ?? 0).toLocaleString("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    });
}

export function formatDate(value) {
    if (!value) return "—";

    return new Date(value).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

export const PRODUCT_FORMAT_LABELS = {
    fisico: "Físico",
    digital: "Digital",
    kindle: "Kindle",
    local_pc: "PC local"
};

export const ORDER_STATUS_LABELS = {
    pendiente: "Pendiente",
    confirmado: "Confirmado",
    entregado: "Entregado",
    cancelado: "Cancelado"
};

export const RENTAL_STATUS_LABELS = {
    pending: "Pendiente",
    active: "Activo",
    completed: "Completado",
    cancelled: "Cancelado"
};

export const PAYMENT_METHOD_LABELS = {
    wompi: "Wompi (online)",
    local: "En el local"
};

export const PAYMENT_STATUS_LABELS = {
    pending: "Pago pendiente",
    approved: "Pagado",
    rejected: "Pago rechazado"
};
