import {
    Area,
    AreaChart,
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

import { formatCOP, ORDER_STATUS_LABELS } from "../../utils/format";
import {
    AXIS_STYLE,
    CHART_COLORS,
    LEGEND_STYLE,
    ORDER_STATUS_COLORS,
    TOOLTIP_STYLE,
    TYPE_LABELS,
    axisMoney
} from "./chartsConstants";
import { ChartCard, KpiCard } from "./chartsCommon";

// Pestaña "General": indicadores del negocio + ventas, pedidos,
// productos, comunidad e inventario.
function GeneralSection({ stats }) {
    const ordersByStatus = stats.ordersByStatus.map((row) => ({
        name: ORDER_STATUS_LABELS[row.status] || row.status,
        value: row.count
    }));

    const productsByType = stats.productsByType.map((row) => ({
        name: TYPE_LABELS[row.type] || row.type,
        value: row.count
    }));

    return (
        <div className="admin-overview">

            <div className="kpi-grid">
                <KpiCard
                    label="Ingresos por ventas"
                    value={formatCOP(stats.kpis.salesTotal)}
                    hint={`${stats.kpis.salesCount} pedidos pagados`}
                />
                <KpiCard
                    label="Ingresos por alquileres"
                    value={formatCOP(stats.kpis.rentalsTotal)}
                    hint="Pagos aprobados"
                />
                <KpiCard
                    label="Alquileres"
                    value={stats.kpis.rentalsCount}
                    hint="Todos los estados"
                />
                <KpiCard
                    label="Usuarios"
                    value={stats.kpis.usersCount}
                    hint="Cuentas registradas"
                />
                <KpiCard
                    label="Productos activos"
                    value={stats.kpis.productsCount}
                    hint={`${stats.kpis.stockTotal} unidades en stock`}
                />
                <KpiCard
                    label="Mensajes nuevos"
                    value={stats.kpis.messagesNew}
                    hint="Bandeja de contacto"
                />
            </div>

            <div className="charts-row">
                <ChartCard
                    title="Ingresos por mes"
                    hint="Últimos 6 meses (solo pedidos pagados)"
                >
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={stats.salesByMonth}>
                            <defs>
                                <linearGradient
                                    id="salesGradient"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop
                                        offset="5%"
                                        stopColor="#9B72CF"
                                        stopOpacity={0.55}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#9B72CF"
                                        stopOpacity={0.05}
                                    />
                                </linearGradient>
                            </defs>
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
                                formatter={(value) => [
                                    formatCOP(value),
                                    "Ingresos"
                                ]}
                            />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke="#9B72CF"
                                strokeWidth={2.5}
                                fill="url(#salesGradient)"
                                name="Ingresos"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Pedidos por estado" hint="Histórico total">
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={ordersByStatus}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={58}
                                outerRadius={92}
                                paddingAngle={3}
                            >
                                {ordersByStatus.map((entry, index) => (
                                    <Cell
                                        key={entry.name}
                                        fill={
                                            ORDER_STATUS_COLORS[
                                                stats.ordersByStatus[index]
                                                    .status
                                            ] || CHART_COLORS[index % 6]
                                        }
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(value, name) => [
                                    value,
                                    name
                                ]}
                            />
                            <Legend wrapperStyle={LEGEND_STYLE} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <div className="charts-row">
                <ChartCard
                    title="Productos más vendidos"
                    hint="Por unidades vendidas"
                >
                    <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                            data={stats.topProducts}
                            layout="vertical"
                            margin={{ left: 10, right: 20 }}
                        >
                            <CartesianGrid
                                stroke="rgba(214, 169, 104, 0.12)"
                                horizontal={false}
                            />
                            <XAxis
                                type="number"
                                tick={AXIS_STYLE}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                type="category"
                                dataKey="name"
                                tick={AXIS_STYLE}
                                tickLine={false}
                                axisLine={false}
                                width={150}
                            />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                cursor={{ fill: "rgba(155, 114, 207, 0.12)" }}
                                formatter={(value, name) =>
                                    name === "revenue"
                                        ? [formatCOP(value), "Ingresos"]
                                        : [value, "Unidades"]
                                }
                            />
                            <Bar
                                dataKey="quantity"
                                name="Unidades"
                                fill="#D6A968"
                                radius={[0, 8, 8, 0]}
                                barSize={18}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                    title="Categorías más vendidas"
                    hint="Participación en ingresos"
                >
                    <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                            <Pie
                                data={stats.salesByCategory.map((row) => ({
                                    name: row.category,
                                    value: row.revenue
                                }))}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={100}
                                label={(entry) =>
                                    `${entry.name} ${Math.round(
                                        (entry.percent || 0) * 100
                                    )}%`
                                }
                            >
                                {stats.salesByCategory.map(
                                    (entry, index) => (
                                        <Cell
                                            key={entry.category}
                                            fill={
                                                CHART_COLORS[index % 6]
                                            }
                                        />
                                    )
                                )}
                            </Pie>
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(value) => [
                                    formatCOP(value),
                                    "Ingresos"
                                ]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <div className="charts-row">
                <ChartCard
                    title="Usuarios nuevos por mes"
                    hint="Últimos 6 meses"
                >
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={stats.usersByMonth}>
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
                                allowDecimals={false}
                                width={40}
                            />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(value) => [
                                    value,
                                    "Usuarios"
                                ]}
                            />
                            <Bar
                                dataKey="count"
                                fill="#9B72CF"
                                radius={[8, 8, 0, 0]}
                                barSize={30}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                    title="Catálogo por tipo"
                    hint="Productos activos"
                >
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie
                                data={productsByType}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={88}
                                label={(entry) =>
                                    `${entry.name}: ${entry.value}`
                                }
                            >
                                {productsByType.map((entry, index) => (
                                    <Cell
                                        key={entry.name}
                                        fill={CHART_COLORS[index % 6]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(value, name) => [value, name]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                    title="Alertas de inventario"
                    hint="Stock ≤ 5 unidades"
                >
                    {stats.lowStock.length === 0 ? (
                        <p className="chart-empty">
                            Todos los productos tienen stock sano.
                        </p>
                    ) : (
                        <ul className="low-stock-list">
                            {stats.lowStock.map((product) => (
                                <li key={product._id}>
                                    <span>{product.name}</span>
                                    <strong
                                        className={
                                            product.stock === 0
                                                ? "low-stock-zero"
                                                : ""
                                        }
                                    >
                                        {product.stock} u.
                                    </strong>
                                </li>
                            ))}
                        </ul>
                    )}
                </ChartCard>
            </div>

        </div>
    );
}

export default GeneralSection;
