import Order from "../models/Order.js";
import Rental from "../models/Rental.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import ContactMessage from "../models/ContactMessage.js";

const MESES = [
    "ene", "feb", "mar", "abr", "may", "jun",
    "jul", "ago", "sep", "oct", "nov", "dic"
];

// "Pagado" incluye los pedidos antiguos (creados antes del feature de
// pagos): no tienen paymentStatus y ya generaron ingreso.
// Mongo trata el campo ausente como null dentro de $in.
const PAGO_APROBADO = { $in: [null, "approved"] };

// Devuelve las últimas `n` etiquetas de mes en formato "YYYY-MM"
// (con su etiqueta legible), empezando por el mes actual.
const ultimosMeses = (n = 6) => {
    const meses = [];
    const hoy = new Date();

    for (let i = n - 1; i >= 0; i--) {
        const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
        const key = `${fecha.getFullYear()}-${String(
            fecha.getMonth() + 1
        ).padStart(2, "0")}`;

        meses.push({
            key,
            label: `${MESES[fecha.getMonth()]} ${String(
                fecha.getFullYear()
            ).slice(-2)}`
        });
    }

    return meses;
};

// Rellena con ceros los meses sin movimiento para que las gráficas
// muestren la serie completa.
const serieCompleta = (meses, rows, campo = "total") => {
    const byKey = new Map(rows.map((row) => [row._id, row]));

    return meses.map((mes) => {
        const row = byKey.get(mes.key);

        return {
            month: mes.key,
            label: mes.label,
            total: row ? Number(row[campo]) || 0 : 0,
            count: row ? Number(row.count) || 0 : 0
        };
    });
};

// GET /api/admin/stats — indicadores y series para el dashboard admin.
// Atlas (M0) tarda ~850 ms en ejecutar las 20 consultas del panel; una
// caché corta en memoria hace instantáneas las visitas repetidas (los
// datos del dashboard no necesitan tiempo real).
let statsCache = null;
let statsCacheAt = 0;
const STATS_CACHE_TTL_MS = 30_000;

export const getAdminStats = async (req, res, next) => {
    try {
        if (statsCache && Date.now() - statsCacheAt < STATS_CACHE_TTL_MS) {
            return res.status(200).json(statsCache);
        }

        const desde6Meses = new Date();
        desde6Meses.setDate(1);
        desde6Meses.setHours(0, 0, 0, 0);
        desde6Meses.setMonth(desde6Meses.getMonth() - 5);

        const [
            kpis,
            ventasMes,
            pedidosEstado,
            topProductos,
            categoriasVendidas,
            ventasPorTipo,
            alquileresMes,
            alquileresFormato,
            alquileresEstado,
            usuariosMes,
            stockBajo,
            mensajes,
            productosTipo,
            pagosMetodo,
            pagosEstado,
            pagosMes,
            pagosPendientes,
            alquileresAprobados,
            inventario,
            rentalsCount,
            usersCount,
            pagosEstadoTodo,
            ultimosPagos,
            porCobrar
        ] = await Promise.all([
            // ---- KPIs generales (ventas = pedidos realmente pagados) ----
            Order.aggregate([
                {
                    $match: {
                        paymentStatus: PAGO_APROBADO,
                        status: { $ne: "cancelado" }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$total" },
                        count: { $sum: 1 }
                    }
                }
            ]),
            // ---- Ingresos por mes (últimos 6, solo pagados) ----
            Order.aggregate([
                {
                    $match: {
                        paymentStatus: PAGO_APROBADO,
                        status: { $ne: "cancelado" },
                        createdAt: { $gte: desde6Meses }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m",
                                date: "$createdAt"
                            }
                        },
                        total: { $sum: "$total" },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // ---- Pedidos por estado (dona) ----
            Order.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            // ---- Top productos vendidos (barras) ----
            Order.aggregate([
                { $match: { status: { $ne: "cancelado" } } },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: "$items.name",
                        quantity: { $sum: "$items.quantity" },
                        revenue: {
                            $sum: {
                                $multiply: ["$items.price", "$items.quantity"]
                            }
                        }
                    }
                },
                { $sort: { quantity: -1 } },
                { $limit: 6 }
            ]),
            // ---- Categorías más vendidas (dona/barras) ----
            Order.aggregate([
                { $match: { status: { $ne: "cancelado" } } },
                { $unwind: "$items" },
                {
                    $lookup: {
                        from: "products",
                        localField: "items.product",
                        foreignField: "_id",
                        as: "producto"
                    }
                },
                { $unwind: { path: "$producto", preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: {
                            $ifNull: ["$producto.category", "Otros"]
                        },
                        quantity: { $sum: "$items.quantity" },
                        revenue: {
                            $sum: {
                                $multiply: ["$items.price", "$items.quantity"]
                            }
                        }
                    }
                },
                { $sort: { revenue: -1 } }
            ]),
            // ---- Ventas por tipo de ítem (productos vs servicios) ----
            Order.aggregate([
                { $match: { status: { $ne: "cancelado" } } },
                { $unwind: "$items" },
                {
                    $lookup: {
                        from: "products",
                        localField: "items.product",
                        foreignField: "_id",
                        as: "producto"
                    }
                },
                {
                    $unwind: {
                        path: "$producto",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $group: {
                        _id: {
                            $ifNull: ["$producto.type", "otro"]
                        },
                        quantity: { $sum: "$items.quantity" },
                        revenue: {
                            $sum: {
                                $multiply: ["$items.price", "$items.quantity"]
                            }
                        }
                    }
                },
                { $sort: { revenue: -1 } }
            ]),
            // ---- Alquileres por mes (últimos 6) ----
            Rental.aggregate([
                {
                    $match: {
                        status: { $ne: "cancelled" },
                        createdAt: { $gte: desde6Meses }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m",
                                date: "$createdAt"
                            }
                        },
                        total: { $sum: "$total" },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // ---- Alquileres por formato (dona) ----
            Rental.aggregate([
                { $match: { status: { $ne: "cancelled" } } },
                { $group: { _id: "$format", count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            // ---- Alquileres por estado ----
            Rental.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            // ---- Usuarios nuevos por mes (últimos 6) ----
            User.aggregate([
                { $match: { createdAt: { $gte: desde6Meses } } },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m",
                                date: "$createdAt"
                            }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]),
            // ---- Productos con stock bajo (≤ 5) ----
            Product.find({
                active: true,
                stock: { $lte: 5 },
                type: { $ne: "service" }
            })
                .select("name stock category")
                .sort({ stock: 1 })
                .limit(8)
                .lean(),
            // ---- Bandeja de mensajes ----
            ContactMessage.aggregate([
                { $group: { _id: "$status", count: { $sum: 1 } } }
            ]),
            // ---- Catálogo activo por tipo ----
            Product.aggregate([
                { $match: { active: true } },
                { $group: { _id: "$type", count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            // ---- Pagos aprobados por método (dona) ----
            Order.aggregate([
                {
                    $match: {
                        paymentStatus: PAGO_APROBADO,
                        status: { $ne: "cancelado" }
                    }
                },
                {
                    $group: {
                        _id: { $ifNull: ["$paymentMethod", "local"] },
                        count: { $sum: 1 },
                        total: { $sum: "$total" }
                    }
                },
                { $sort: { count: -1 } }
            ]),
            // ---- Estado de los pagos (barras) ----
            Order.aggregate([
                {
                    $match: {
                        status: { $ne: "cancelado" },
                        createdAt: { $gte: desde6Meses }
                    }
                },
                {
                    $group: {
                        _id: { $ifNull: ["$paymentStatus", "approved"] },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } }
            ]),
            // ---- Ingresos pagados por mes y método (barras apiladas) ----
            Order.aggregate([
                {
                    $match: {
                        paymentStatus: PAGO_APROBADO,
                        status: { $ne: "cancelado" },
                        createdAt: { $gte: desde6Meses }
                    }
                },
                {
                    $group: {
                        _id: {
                            month: {
                                $dateToString: {
                                    format: "%Y-%m",
                                    date: "$createdAt"
                                }
                            },
                            method: { $ifNull: ["$paymentMethod", "local"] }
                        },
                        total: { $sum: "$total" }
                    }
                },
                { $sort: { "_id.month": 1 } }
            ]),
            // ---- Pagos pendientes (cobro en caja, online sin cerrar
            // o rechazados que hay que reintentar) ----
            Order.countDocuments({
                status: { $ne: "cancelado" },
                paymentStatus: { $in: [null, "pending", "rejected"] },
                paymentMethod: { $ne: null }
            }),
            // ---- Ingresos por alquileres: solo pagos aprobados ----
            Rental.aggregate([
                { $match: { paymentStatus: "approved" } },
                { $group: { _id: null, total: { $sum: "$total" } } }
            ]),
            // ---- Inventario activo (productos y unidades en stock) ----
            Product.aggregate([
                { $match: { active: true, type: { $ne: "service" } } },
                {
                    $group: {
                        _id: null,
                        products: { $sum: 1 },
                        stock: { $sum: "$stock" }
                    }
                }
            ]),
            // ---- Conteos simples ----
            Rental.countDocuments(),
            User.countDocuments(),
            // ---- Estado de los pagos (histórico, sin cancelados) ----
            Order.aggregate([
                {
                    $match: { status: { $ne: "cancelado" } }
                },
                {
                    $group: {
                        _id: { $ifNull: ["$paymentStatus", "approved"] },
                        count: { $sum: 1 }
                    }
                }
            ]),
            // ---- Últimos pagos aprobados (tabla de detalle) ----
            Order.find({
                paymentStatus: PAGO_APROBADO,
                status: { $ne: "cancelado" }
            })
                .select(
                    "total status paymentMethod paymentStatus paidAt " +
                        "createdAt wompiTransactionId paymentReference user"
                )
                .sort({ createdAt: -1 })
                .limit(10)
                .populate("user", "name email")
                .lean(),
            // ---- Pendientes por cobrar (tabla de detalle) ----
            Order.find({
                status: { $ne: "cancelado" },
                paymentStatus: { $in: [null, "pending", "rejected"] },
                paymentMethod: { $ne: null }
            })
                .select(
                    "total status paymentMethod paymentStatus paidAt " +
                        "createdAt wompiTransactionId paymentReference user"
                )
                .sort({ createdAt: -1 })
                .limit(10)
                .populate("user", "name email")
                .lean()
        ]);

        const totalVentas = kpis[0]?.total || 0;
        const totalPedidos = kpis[0]?.count || 0;

        // ---- Derivados de pagos ----
        const pagadoWompi = pagosMetodo.find((row) => row._id === "wompi");
        const pagadoLocal = pagosMetodo.find((row) => row._id === "local");

        // Ticket promedio y tasa de aprobación (histórico de pedidos
        // no cancelados; los pedidos antiguos sin paymentStatus cuentan
        // como aprobados, igual que en el resto del dashboard).
        const pagosPorEstado = Object.fromEntries(
            pagosEstadoTodo.map((row) => [row._id, row.count])
        );
        const intentosPago =
            (pagosPorEstado.approved || 0) +
            (pagosPorEstado.pending || 0) +
            (pagosPorEstado.rejected || 0);

        const mapearPedidoPago = (order, estadoPorDefecto) => ({
            id: order._id,
            total: order.total,
            method: order.paymentMethod,
            status: order.paymentStatus || estadoPorDefecto,
            reference:
                order.wompiTransactionId || order.paymentReference || null,
            paidAt: order.paidAt,
            createdAt: order.createdAt,
            customer: order.user?.name || "Cliente",
            email: order.user?.email || ""
        });

        const meses = ultimosMeses(6);

        const mensajesMap = Object.fromEntries(
            mensajes.map((row) => [row._id, row.count])
        );

        const payload = {
            success: true,
            stats: {
                generatedAt: new Date().toISOString(),

                kpis: {
                    salesTotal: totalVentas,
                    salesCount: totalPedidos,
                    rentalsTotal: alquileresAprobados[0]?.total || 0,
                    rentalsCount,
                    usersCount,
                    productsCount: inventario[0]?.products || 0,
                    stockTotal: inventario[0]?.stock || 0,
                    messagesNew: mensajesMap.nuevo || 0,

                    // ---- Pagos ----
                    paidTotal:
                        (pagadoWompi?.total || 0) + (pagadoLocal?.total || 0),
                    paidWompi: pagadoWompi?.total || 0,
                    paidLocal: pagadoLocal?.total || 0,
                    paymentsPending: pagosPendientes,
                    ticketPromedio:
                        totalPedidos > 0
                            ? Math.round(totalVentas / totalPedidos)
                            : 0,
                    approvalRate:
                        intentosPago > 0
                            ? Math.round(
                                  ((pagosPorEstado.approved || 0) /
                                      intentosPago) *
                                      100
                              )
                            : 0,
                    paymentsRejected: pagosPorEstado.rejected || 0
                },

                salesByMonth: serieCompleta(meses, ventasMes),
                ordersByStatus: pedidosEstado.map((row) => ({
                    status: row._id,
                    count: row.count
                })),
                topProducts: topProductos.map((row) => ({
                    name: row._id,
                    quantity: row.quantity,
                    revenue: row.revenue
                })),
                salesByCategory: categoriasVendidas.map((row) => ({
                    category: row._id,
                    quantity: row.quantity,
                    revenue: row.revenue
                })),
                salesByType: ventasPorTipo.map((row) => ({
                    type: row._id,
                    quantity: row.quantity,
                    revenue: row.revenue
                })),
                rentalsByMonth: serieCompleta(meses, alquileresMes),
                rentalsByFormat: alquileresFormato.map((row) => ({
                    format: row._id,
                    count: row.count
                })),
                rentalsByStatus: alquileresEstado.map((row) => ({
                    status: row._id,
                    count: row.count
                })),
                usersByMonth: serieCompleta(meses, usuariosMes, "count"),
                lowStock: stockBajo,
                messagesByStatus: mensajes.map((row) => ({
                    status: row._id,
                    count: row.count
                })),
                productsByType: productosTipo.map((row) => ({
                    type: row._id,
                    count: row.count
                })),

                // ---- Pagos ----
                paymentsByMethod: pagosMetodo.map((row) => ({
                    method: row._id,
                    count: row.count,
                    total: row.total
                })),
                paymentsByStatus: pagosEstado.map((row) => ({
                    status: row._id,
                    count: row.count
                })),
                paymentsByMonth: serieCompleta(meses, []).map((mes) => {
                    const rows = pagosMes.filter(
                        (row) => row._id.month === mes.month
                    );

                    return {
                        month: mes.month,
                        label: mes.label,
                        wompi: rows.find((r) => r._id.method === "wompi")
                            ?.total || 0,
                        local: rows.find((r) => r._id.method === "local")
                            ?.total || 0,
                        total: rows.reduce(
                            (sum, row) => sum + (row.total || 0),
                            0
                        )
                    };
                }),

                // ---- Detalle de pagos (tablas) ----
                recentPayments: ultimosPagos.map((order) =>
                    mapearPedidoPago(order, "approved")
                ),
                pendingPayments: porCobrar.map((order) =>
                    mapearPedidoPago(order, "pending")
                )
            }
        };

        statsCache = payload;
        statsCacheAt = Date.now();

        return res.status(200).json(payload);

    } catch (error) {
        next(error);
    }
};
