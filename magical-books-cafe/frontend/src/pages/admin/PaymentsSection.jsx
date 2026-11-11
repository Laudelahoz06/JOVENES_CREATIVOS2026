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

// Pestaña "Pagos": cómo se está cobrando (Wompi vs local) y el estado
// de los cobros de los últimos 6 meses.
function PaymentsSection({ stats }) {
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

    return (
        <div className="admin-overview">

            <div className="kpi-grid">
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
                    hint="Por cobrar o verificar"
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

        </div>
    );
}

export default PaymentsSection;
