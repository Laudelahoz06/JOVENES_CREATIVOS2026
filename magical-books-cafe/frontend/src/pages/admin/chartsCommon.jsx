// Tarjetas compartidas por las secciones de gráficas del dashboard.
// Las constantes viven en chartsConstants.js (fast refresh).

export function ChartCard({ title, hint, children }) {
    return (
        <article className="chart-card">
            <header className="chart-card-header">
                <h3>{title}</h3>
                {hint && <span>{hint}</span>}
            </header>
            <div className="chart-card-body">{children}</div>
        </article>
    );
}

export function KpiCard({ label, value, hint }) {
    return (
        <article className="kpi-card">
            <span className="kpi-label">{label}</span>
            <strong className="kpi-value">{value}</strong>
            {hint && <span className="kpi-hint">{hint}</span>}
        </article>
    );
}
