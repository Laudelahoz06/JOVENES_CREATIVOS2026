// Constantes y helpers compartidos por las secciones de gráficas del
// dashboard admin. Va en un archivo .js (sin componentes) para no
// interferir con el fast refresh de Vite.
// Paleta derivada de variables.css (primary, accent, wood + acentos).

export const CHART_COLORS = [
    "#9B72CF",
    "#D6A968",
    "#63452F",
    "#7BC47F",
    "#E07A7A",
    "#5AA9E6"
];

export const ORDER_STATUS_COLORS = {
    pendiente: "#D6A968",
    confirmado: "#9B72CF",
    entregado: "#7BC47F",
    cancelado: "#E07A7A"
};

export const RENTAL_STATUS_COLORS = {
    pending: "#D6A968",
    active: "#9B72CF",
    completed: "#7BC47F",
    cancelled: "#E07A7A"
};

export const PAYMENT_STATUS_COLORS = {
    approved: "#7BC47F",
    pending: "#D6A968",
    rejected: "#E07A7A"
};

export const PAYMENT_METHOD_COLORS = {
    wompi: "#9B72CF",
    local: "#D6A968"
};

export const TYPE_LABELS = {
    coffee: "Café",
    dessert: "Postres",
    book: "Libros",
    service: "Servicios"
};

export const TOOLTIP_STYLE = {
    background: "#302342",
    border: "1px solid rgba(214, 169, 104, 0.35)",
    borderRadius: "10px",
    color: "#F4EBDD",
    fontSize: "0.88rem"
};

export const AXIS_STYLE = {
    fill: "rgba(244, 235, 221, 0.65)",
    fontSize: 12
};

export const LEGEND_STYLE = {
    color: "rgba(244, 235, 221, 0.8)",
    fontSize: "0.82rem"
};

// Formateador compacto para ejes con valores grandes.
export const axisMoney = (value) =>
    value >= 1000 ? `${Math.round(value / 1000)}k` : value;
