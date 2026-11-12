import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

import {
    formatCOP,
    formatDate,
    PAYMENT_METHOD_LABELS,
    PAYMENT_STATUS_LABELS
} from "../../utils/format";
import {
    AXIS_STYLE,
    LEGEND_STYLE,
    PAYMENT_METHOD_COLORS,
    PAYMENT_STATUS_COLORS,
    TOOLTIP_STYLE,
    axisMoney
} from "./chartsConstants";
import { ChartCard, KpiCard } from "./chartsCommon";

// Chip de estado de pago reutilizado en las tablas de detalle.
function PaymentChip({ status }) {
    return (
        <span className={`status-chip payment-${status}`}>
            {PAYMENT_STATUS_LABELS[status] || status}
        </span>
    );
}

// Referencia del cobro (transacción Wompi o referencia manual),
// truncada para no ensanchar la tabla; el tooltip muestra el valor
// completo.
function PaymentReference({ reference }) {
    if (!reference) return <span className="admin-table-sub">—</span>;

    return (
        <span className="admin-table-sub" title={reference}>
            {reference.length > 18
                ? `${reference.slice(0, 18)}…`
                : reference}
        </span>
    );
}

// Pestaña "Pagos": cómo se está cobrando (Wompi vs local), el estado
// de los cobros de los últimos 6 meses y el detalle de los últimos
// pagos y de lo que falta por cobrar.
function PaymentsSection({ stats, onSelectTab }) {
    const paymentsByMethod = stats.paymentsByMethod.map((row) => ({
        name: PAYMENT_METHOD_LABELS[row.method] || row.method,
        value: row.count,
        total: row.total
    }));

    const paymentsByStatus = stats.paymentsByStatus.map((row) => ({
        name: PAYMENT_STATUS_LABELS[row.status] || row.status,
        value: row.count,
        status: row.status
    }));

    const recentPayments = stats.recentPayments || [];
    const pendingPayments = stats.pendingPayments || [];

    return (
        <div className="admin-overview">

            <div className="kpi-grid kpi-grid-wide">
                <KpiCard
                    label="Recaudado total"
                    value={formatCOP(stats.kpis.paidTotal)}
                    hint="Pedidos pagados"
                />
                <KpiCard
                    label="Recaudado con Wompi"
                    value={formatCOP(stats.kpis.paidWompi)}
                    hint="Pagos online aprobados"
                />
                <KpiCard
                    label="Recaudado en el local"
                    value={formatCOP(stats.kpis.paidLocal)}
                    hint="Caja y métodos manuales"
                />
                <KpiCard
                    label="Pagos pendientes"
                    value={stats.kpis.paymentsPending}
                    hint="Por cobrar o reintentar"
                />
                <KpiCard
                    label="Ticket promedio"
                    value={formatCOP(stats.kpis.ticketPromedio || 0)}
                    hint="Promedio por pedido pagado"
                />
                <KpiCard
                    label="Tasa de aprobación"
                    value={`${stats.kpis.approvalRate ?? 0}%`}
                    hint="Pedidos pagados sobre el total"
                />
                <KpiCard
                    label="Pagos rechazados"
                    value={stats.kpis.paymentsRejected ?? 0}
                    hint="Requieren reintento o cobro"
                />
            </div>

            <div className="charts-row">
                <ChartCard
                    title="Método de pago"
                    hint="Pedidos pagados (conteo)"
                >
                    {paymentsByMethod.length === 0 ? (
                        <p className="chart-empty">
                            Todavía no hay pagos registrados.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={paymentsByMethod}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={58}
                                    outerRadius={92}
                                    paddingAngle={3}
                                >
                                    {paymentsByMethod.map(
                                        (entry, index) => (
                                            <Cell
                                                key={entry.name}
                                                fill={
                                                    Object.values(
                                                        PAYMENT_METHOD_COLORS
                                                    )[index] ||
                                                    "#9B72CF"
                                                }
                                            />
                                        )
                                    )}
                                </Pie>
                                <Tooltip
                                    contentStyle={TOOLTIP_STYLE}
                                    formatter={(value, name, entry) => [
                                        `${value} pedidos · ${formatCOP(
                                            entry?.payload?.total || 0
                                        )}`,
                                        name
                                    ]}
                                />
                                <Legend wrapperStyle={LEGEND_STYLE} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                <ChartCard
                    title="Ingresos por mes y método"
                    hint="Últimos 6 meses (pagados)"
                >
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={stats.paymentsByMonth}>
                            <CartesianGrid
                                stroke="rgba(214, 169, 104, 0.12)"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="label"
                                tick={AXIS_STYLE}
                                tickLine={false}
                                axisLine={{
                                    stroke: "rgba(214, 169, 104, 0.25)"
                                }}
                            />
                            <YAxis
                                tick={AXIS_STYLE}
                                tickLine={false}
                                axisLine={false}
                                width={70}
                                tickFormatter={axisMoney}
                            />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(value, name) => [
                                    formatCOP(value),
                                    name === "wompi" ? "Wompi" : "Local"
                                ]}
                            />
                            <Legend wrapperStyle={LEGEND_STYLE} />
                            <Bar
                                dataKey="wompi"
                                stackId="pagos"
                                name="Wompi"
                                fill="#9B72CF"
                                radius={[0, 0, 0, 0]}
                            />
                            <Bar
                                dataKey="local"
                                stackId="pagos"
                                name="Local"
                                fill="#D6A968"
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <div className="charts-row">
                <ChartCard
                    title="Estado de los pagos"
                    hint="Últimos 6 meses (sin cancelados)"
                >
                    {paymentsByStatus.length === 0 ? (
                        <p className="chart-empty">
                            Todavía no hay pagos registrados.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={paymentsByStatus}>
                                <CartesianGrid
                                    stroke="rgba(214, 169, 104, 0.12)"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="name"
                                    tick={AXIS_STYLE}
                                    tickLine={false}
                                    axisLine={{
                                        stroke: "rgba(214, 169, 104, 0.25)"
                                    }}
                                />
                                <YAxis
                                    tick={AXIS_STYLE}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                    width={40}
                                />
                                <Tooltip
                                    contentStyle={TOOLTIP_STYLE}
                                    formatter={(value) => [
                                        value,
                                        "Pedidos"
                                    ]}
                                />
                                <Bar
                                    dataKey="value"
                                    radius={[8, 8, 0, 0]}
                                    barSize={48}
                                >
                                    {paymentsByStatus.map((entry) => (
                                        <Cell
                                            key={entry.name}
                                            fill={
                                                PAYMENT_STATUS_COLORS[
                                                    entry.status
                                                ] || "#9B72CF"
                                            }
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>
            </div>

            <div className="payments-tables">
                <ChartCard
                    title="Últimos pagos"
                    hint="Pedidos pagados (últimos 10)"
                >
                    {recentPayments.length === 0 ? (
                        <p className="chart-empty">
                            Todavía no hay pagos registrados.
                        </p>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Cliente</th>
                                        <th>Estado</th>
                                        <th>Referencia</th>
                                        <th>Total</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {recentPayments.map((payment) => (
                                        <tr key={payment.id}>
                                            <td>
                                                {formatDate(
                                                    payment.paidAt ||
                                                        payment.createdAt
                                                )}
                                            </td>

                                            <td>
                                                <strong>
                                                    {payment.customer}
                                                </strong>
                                                {payment.email && (
                                                    <span className="admin-table-sub">
                                                        {payment.email}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="admin-payment-cell">
                                                <PaymentChip
                                                    status={payment.status}
                                                />
                                                <span className="admin-table-sub">
                                                    {PAYMENT_METHOD_LABELS[
                                                        payment.method
                                                    ] || "Sin método"}
                                                </span>
                                            </td>

                                            <td>
                                                <PaymentReference
                                                    reference={
                                                        payment.reference
                                                    }
                                                />
                                            </td>

                                            <td>
                                                {formatCOP(payment.total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </ChartCard>

                <ChartCard
                    title="Pendientes por cobrar"
                    hint="Cobrar o reintentar (últimos 10)"
                >
                    {pendingPayments.length === 0 ? (
                        <p className="chart-empty">
                            No hay pagos pendientes.
                        </p>
                    ) : (
                        <>
                            <div className="admin-table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Cliente</th>
                                            <th>Estado</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {pendingPayments.map((payment) => (
                                            <tr key={payment.id}>
                                                <td>
                                                    {formatDate(
                                                        payment.createdAt
                                                    )}
                                                </td>

                                                <td>
                                                    <strong>
                                                        {payment.customer}
                                                    </strong>
                                                    {payment.email && (
                                                        <span className="admin-table-sub">
                                                            {payment.email}
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="admin-payment-cell">
                                                    <PaymentChip
                                                        status={
                                                            payment.status
                                                        }
                                                    />
                                                    <span className="admin-table-sub">
                                                        {PAYMENT_METHOD_LABELS[
                                                            payment.method
                                                        ] || "Sin método"}
                                                    </span>
                                                </td>

                                                <td>
                                                    {formatCOP(
                                                        payment.total
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="payments-card-footer">
                                <button
                                    type="button"
                                    className="admin-link-button"
                                    onClick={() => onSelectTab?.("pedidos")}
                                >
                                    Gestionar en Pedidos →
                                </button>
                            </div>
                        </>
                    )}
                </ChartCard>
            </div>

        </div>
    );
}

export default PaymentsSection;
