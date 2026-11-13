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

import { formatCOP } from "../../utils/format";
import {
    AXIS_STYLE,
    CHART_COLORS,
    LEGEND_STYLE,
    TOOLTIP_STYLE,
    TYPE_LABELS,
    axisMoney
} from "./chartsConstants";
import { ChartCard, KpiCard } from "./chartsCommon";

const TYPE_COLORS = {
    coffee: "#D6A968",
    dessert: "#E07A7A",
    book: "#9B72CF",
    service: "#63452F",
    otro: "#7BC47F"
};

const labelDeTipo = (type) => TYPE_LABELS[type] || "Otros";

// Pestaña "Productos y servicios": ventas desglosadas por tipo de ítem,
// catálogo activo y los más vendidos.
function ProductsSection({ stats }) {
    const salesByType = stats.salesByType || [];

    const productosTipos = ["coffee", "dessert", "book"];
    const productosActivos = stats.productsByType
        .filter((row) => productosTipos.includes(row.type))
        .reduce((sum, row) => sum + row.count, 0);
    const serviciosActivos =
        stats.productsByType.find((row) => row.type === "service")?.count || 0;

    const unidadesVendidas = salesByType.reduce(
        (sum, row) => sum + row.quantity,
        0
    );
    const ingresosServicios = salesByType
        .filter((row) => row.type === "service")
        .reduce((sum, row) => sum + row.revenue, 0);
    const ingresosProductos = salesByType
        .filter((row) => row.type !== "service" && row.type !== "otro")
        .reduce((sum, row) => sum + row.revenue, 0);

    const ventasPorTipo = salesByType.map((row) => ({
        name: labelDeTipo(row.type),
        type: row.type,
        quantity: row.quantity,
        revenue: row.revenue
    }));

    const ingresosTipo = ventasPorTipo.map((row) => ({
        name: row.name,
        value: row.revenue
    }));

    const comparativa = [
        { name: "Productos", value: ingresosProductos },
        { name: "Servicios", value: ingresosServicios }
    ];

    return (
        <div className="admin-overview">

            <div className="kpi-grid">
                <KpiCard
                    label="Productos activos"
                    value={productosActivos}
                    hint="Café, postres y libros"
                />
                <KpiCard
                    label="Servicios activos"
                    value={serviciosActivos}
                    hint="Experiencias del catálogo"
                />
                <KpiCard
                    label="Unidades vendidas"
                    value={unidadesVendidas}
                    hint="Productos y servicios"
                />
                <KpiCard
                    label="Ingresos por productos"
                    value={formatCOP(ingresosProductos)}
                    hint="Histórico no cancelado"
                />
                <KpiCard
                    label="Ingresos por servicios"
                    value={formatCOP(ingresosServicios)}
                    hint="Histórico no cancelado"
                />
            </div>

            <div className="charts-row">
                <ChartCard
                    title="Unidades vendidas por tipo"
                    hint="Productos frente a servicios"
                >
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={ventasPorTipo}>
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
                                width={50}
                            />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(value) => [value, "Unidades"]}
                            />
                            <Bar
                                dataKey="quantity"
                                name="Unidades"
                                radius={[8, 8, 0, 0]}
                                barSize={42}
                            >
                                {ventasPorTipo.map((entry, index) => (
                                    <Cell
                                        key={entry.name}
                                        fill={
                                            TYPE_COLORS[entry.type] ||
                                            CHART_COLORS[index % 6]
                                        }
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                    title="Ingresos por tipo"
                    hint="Participación de cada tipo en las ventas"
                >
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={ingresosTipo}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={58}
                                outerRadius={92}
                                paddingAngle={3}
                            >
                                {ingresosTipo.map((entry, index) => (
                                    <Cell
                                        key={entry.name}
                                        fill={
                                            CHART_COLORS[index % 6]
                                        }
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(value) => [
                                    formatCOP(value),
                                    "Ingresos"
                                ]}
                            />
                            <Legend wrapperStyle={LEGEND_STYLE} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <div className="charts-row">
                <ChartCard
                    title="Productos vs servicios"
                    hint="Ingresos acumulados comparados"
                >
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={comparativa}>
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
                            <Bar
                                dataKey="value"
                                name="Ingresos"
                                radius={[8, 8, 0, 0]}
                                barSize={70}
                            >
                                <Cell fill="#D6A968" />
                                <Cell fill="#9B72CF" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                    title="Productos y servicios más vendidos"
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
                                width={130}
                            />
                            <Tooltip
                                contentStyle={TOOLTIP_STYLE}
                                formatter={(value, name) =>
                                    name === "Ingresos"
                                        ? [formatCOP(value), name]
                                        : [value, name]
                                }
                                labelFormatter={() => ""}
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
            </div>

        </div>
    );
}

export default ProductsSection;
