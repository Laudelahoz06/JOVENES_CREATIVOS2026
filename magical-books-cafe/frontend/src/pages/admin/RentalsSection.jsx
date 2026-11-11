import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

import {
    formatCOP,
    PRODUCT_FORMAT_LABELS,
    RENTAL_STATUS_LABELS
} from "../../utils/format";
import {
    AXIS_STYLE,
    CHART_COLORS,
    LEGEND_STYLE,
    RENTAL_STATUS_COLORS,
    TOOLTIP_STYLE
} from "./chartsConstants";
import { ChartCard } from "./chartsCommon";

// Pestaña "Alquileres": ciclo de negocio de los alquileres.
function RentalsSection({ stats }) {
    const rentalsByFormat = stats.rentalsByFormat.map((row) => ({
        name: PRODUCT_FORMAT_LABELS[row.format] || row.format,
        value: row.count
    }));

    const rentalsByStatus = stats.rentalsByStatus.map((row) => ({
        name: RENTAL_STATUS_LABELS[row.status] || row.status,
        value: row.count
    }));

    return (
        <div className="admin-overview">

            <div className="kpi-grid">
                <p className="admin-status">
                    Resumen de alquileres — usa las gráficas para ver
                    tendencias por mes, formato y estado.
                </p>
            </div>

            <div className="charts-row">
                <ChartCard
                    title="Alquileres por mes"
                    hint="Últimos 6 meses (sin cancelados)"
                >
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={stats.rentalsByMonth}>
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
                                formatter={(value, name) =>
                                    name === "total"
                                        ? [formatCOP(value), "Ingresos"]
                                        : [value, "Alquileres"]
                                }
                            />
                            <Line
                                type="monotone"
                                dataKey="count"
                                name="Alquileres"
                                stroke="#D6A968"
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: "#D6A968" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Alquileres por formato" hint="Distribución">
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={rentalsByFormat}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={58}
                                outerRadius={92}
                                paddingAngle={3}
                            >
                                {rentalsByFormat.map((entry, index) => (
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
                            <Legend wrapperStyle={LEGEND_STYLE} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                    title="Alquileres por estado"
                    hint="Ciclo de vida"
                >
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={rentalsByStatus}>
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
                                formatter={(value) => [value, "Alquileres"]}
                            />
                            <Bar
                                dataKey="value"
                                radius={[8, 8, 0, 0]}
                                barSize={34}
                            >
                                {rentalsByStatus.map((entry, index) => (
                                    <Cell
                                        key={entry.name}
                                        fill={
                                            RENTAL_STATUS_COLORS[
                                                stats.rentalsByStatus[index]
                                                    .status
                                            ] || CHART_COLORS[index % 6]
                                        }
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

        </div>
    );
}

export default RentalsSection;
