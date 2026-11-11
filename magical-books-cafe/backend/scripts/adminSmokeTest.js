// Prueba de humo de los flujos administrativos.
// Requisito: backend corriendo en process.env.PORT || 5000.
// Uso: npm run test:admin

import "dotenv/config";

import dns from "dns";
import mongoose from "mongoose";

import User from "../src/models/User.js";

// Mismo fallback DNS que src/config/database.js (el router local no
// responde consultas TXT que Atlas necesita para mongodb+srv).
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const BASE =
    process.env.API_BASE || `http://localhost:${process.env.PORT || 5000}/api`;

let pasados = 0;
let fallidos = 0;

const verificado = (nombre, condicion, detalle = "") => {
    if (condicion) {
        pasados += 1;
        console.log(`  ok  ${nombre}`);
    } else {
        fallidos += 1;
        console.log(`FAIL  ${nombre} ${detalle}`);
    }
};

const llamar = async (metodo, ruta, { body, auth } = {}) => {
    const response = await fetch(`${BASE}${ruta}`, {
        method: metodo,
        headers: {
            "Content-Type": "application/json",
            ...(auth ? { Authorization: `Bearer ${auth}` } : {})
        },
        body: body ? JSON.stringify(body) : undefined
    });

    const data = response.status === 204
        ? null
        : await response.json().catch(() => null);

    return { status: response.status, data };
};

const main = async () => {
    console.log(`Pruebas administrativas contra ${BASE}\n`);

    await mongoose.connect(process.env.MONGODB_URI);

    const sello = Date.now();
    const adminEmail = `admin.${sello}@mail.com`;
    const clienteEmail = `cliente.admin.${sello}@mail.com`;
    const password = "Secreta123";

    // 1. Usuarios de prueba: admin promovido y cliente normal.
    let res = await llamar("POST", "/auth/register", {
        body: { name: "Admin Humo", email: adminEmail, password }
    });
    verificado(
        "POST /auth/register (admin)",
        res.status === 201 && Boolean(res.data?.token)
    );

    await User.updateOne(
        { email: adminEmail },
        { role: "admin", active: true }
    );

    res = await llamar("POST", "/auth/login", {
        body: { email: adminEmail, password }
    });
    const adminToken = res.data?.token || "";
    const adminId = res.data?.user?.id || "";
    verificado(
        "POST /auth/login (admin)",
        res.status === 200 && Boolean(adminToken)
    );

    res = await llamar("POST", "/auth/register", {
        body: { name: "Cliente Humo", email: clienteEmail, password }
    });
    const clienteToken = res.data?.token || "";
    const clienteId = res.data?.user?.id || "";
    verificado(
        "POST /auth/register (cliente)",
        res.status === 201 && Boolean(clienteToken)
    );

    // 2. Bandeja de usuarios.
    res = await llamar("GET", "/admin/users", { auth: adminToken });
    const usuarios = res.data?.users || [];
    const clienteEnLista = usuarios.find(
        (usuario) => String(usuario._id) === String(clienteId)
    );
    verificado(
        "GET /admin/users lista usuarios",
        res.status === 200 && Boolean(clienteEnLista),
        `status=${res.status}`
    );

    verificado(
        "GET /admin/users calcula estadísticas",
        typeof res.data?.stats?.total === "number" &&
            typeof res.data?.stats?.admins === "number"
    );

    // 3. Cambio de rol de cliente.
    res = await llamar("PATCH", `/admin/users/${clienteId}`, {
        auth: adminToken,
        body: { role: "staff" }
    });
    verificado(
        "PATCH /admin/users/:id cambia rol a staff",
        res.status === 200 && res.data?.user?.role === "staff",
        `status=${res.status}`
    );

    res = await llamar("PATCH", `/admin/users/${clienteId}`, {
        auth: adminToken,
        body: { role: "customer" }
    });
    verificado(
        "PATCH /admin/users/:id devuelve rol a customer",
        res.status === 200 && res.data?.user?.role === "customer"
    );

    // 4. Protección: el admin no se desactiva a sí mismo.
    res = await llamar("PATCH", `/admin/users/${adminId}`, {
        auth: adminToken,
        body: { active: false }
    });
    verificado(
        "PATCH /admin/users/:id bloquea auto-desactivación (400)",
        res.status === 400
    );

    // 5. Pedido del cliente y gestión de estados por el admin.
    res = await llamar("GET", "/products");
    const producto = res.data?.products?.[0];

    res = await llamar("POST", "/orders", {
        auth: clienteToken,
        body: {
            items: [{ product: producto._id, quantity: 2 }],
            notes: "Pedido para prueba administrativa"
        }
    });
    const pedidoId = res.data?.order?.id || "";
    verificado(
        "POST /orders (cliente)",
        res.status === 201 && Boolean(pedidoId),
        `status=${res.status}`
    );

    res = await llamar("GET", "/orders", { auth: adminToken });
    const pedido = (res.data?.orders || []).find(
        (orden) => String(orden._id) === String(pedidoId)
    );
    verificado(
        "GET /orders (bandeja admin)",
        res.status === 200 && Boolean(pedido),
        `status=${res.status}`
    );

    res = await llamar("PATCH", `/orders/${pedidoId}/status`, {
        auth: adminToken,
        body: { status: "confirmado" }
    });
    verificado(
        "PATCH /orders/:id/status → confirmado",
        res.status === 200 && res.data?.order?.status === "confirmado",
        `status=${res.status}`
    );

    // 5b. Registro de pago en el local por el admin.
    res = await llamar("PATCH", `/orders/${pedidoId}/pay-local`, {
        auth: adminToken,
        body: { paymentReference: "CAJA-123", notes: "Efectivo en caja" }
    });
    verificado(
        "PATCH /orders/:id/pay-local aprueba el pago",
        res.status === 200 &&
            res.data?.order?.paymentStatus === "approved" &&
            res.data?.order?.paymentMethod === "local" &&
            Boolean(res.data?.order?.paidAt) &&
            res.data?.order?.paymentReference === "CAJA-123",
        `status=${res.status}`
    );

    res = await llamar("PATCH", `/orders/${pedidoId}/pay-local`, {
        auth: adminToken,
        body: {}
    });
    verificado(
        "pay-local dos veces → 409",
        res.status === 409,
        `status=${res.status}`
    );

    // 6. Bandeja de mensajes de contacto.
    res = await llamar("POST", "/contact", {
        body: {
            name: "Cliente Humo",
            email: clienteEmail,
            subject: "Consulta administrativa",
            message: "Mensaje generado por la prueba administrativa.",
            audience: "duenos"
        }
    });
    const mensajeId = res.data?.contact?.id || "";
    verificado(
        "POST /contact (público)",
        res.status === 201 && Boolean(mensajeId)
    );

    res = await llamar("GET", "/contact", { auth: adminToken });
    const mensaje = (res.data?.messages || res.data?.contacts || []).find(
        (item) => String(item._id) === String(mensajeId)
    );
    verificado(
        "GET /contact (bandeja admin)",
        res.status === 200 && Boolean(mensaje),
        `status=${res.status} keys=${Object.keys(res.data || {}).join(",")}`
    );

    res = await llamar("PATCH", `/contact/${mensajeId}/read`, {
        auth: adminToken
    });
    verificado(
        "PATCH /contact/:id/read marca leído",
        res.status === 200,
        `status=${res.status}`
    );

    res = await llamar("DELETE", `/contact/${mensajeId}`, {
        auth: adminToken
    });
    verificado(
        "DELETE /contact/:id elimina",
        res.status === 200,
        `status=${res.status}`
    );

    // 7. Alquileres (bandeja admin).
    res = await llamar("GET", "/rentals", { auth: adminToken });
    verificado(
        "GET /rentals (bandeja admin)",
        res.status === 200 && Array.isArray(res.data?.rentals),
        `status=${res.status}`
    );

    // 8. Seguridad básica de las rutas administrativas.
    res = await llamar("GET", "/admin/users");
    verificado("GET /admin/users sin token → 401", res.status === 401);

    res = await llamar("GET", "/orders", { auth: clienteToken });
    verificado("GET /orders como cliente → 403", res.status === 403);

    res = await llamar("GET", "/contact", { auth: clienteToken });
    verificado("GET /contact como cliente → 403", res.status === 403);

    // 9. Dashboard: estadísticas para las gráficas.
    res = await llamar("GET", "/admin/stats", { auth: adminToken });
    verificado(
        "GET /admin/stats (dashboard)",
        res.status === 200 &&
            typeof res.data?.stats?.kpis?.salesTotal === "number" &&
            Array.isArray(res.data?.stats?.salesByMonth) &&
            res.data.stats.salesByMonth.length === 6 &&
            Array.isArray(res.data?.stats?.ordersByStatus) &&
            Array.isArray(res.data?.stats?.topProducts) &&
            Array.isArray(res.data?.stats?.salesByCategory) &&
            Array.isArray(res.data?.stats?.rentalsByMonth) &&
            Array.isArray(res.data?.stats?.usersByMonth),
        `status=${res.status}`
    );

    verificado(
        "GET /admin/stats incluye series de pagos",
        Array.isArray(res.data?.stats?.paymentsByMethod) &&
            Array.isArray(res.data?.stats?.paymentsByStatus) &&
            Array.isArray(res.data?.stats?.paymentsByMonth) &&
            res.data.stats.paymentsByMonth.length === 6 &&
            typeof res.data?.stats?.kpis?.paidTotal === "number" &&
            typeof res.data?.stats?.kpis?.paidWompi === "number" &&
            typeof res.data?.stats?.kpis?.paidLocal === "number" &&
            typeof res.data?.stats?.kpis?.paymentsPending === "number",
        `keys=${Object.keys(res.data?.stats || {}).join(",")}`
    );

    res = await llamar("GET", "/admin/stats", { auth: clienteToken });
    verificado(
        "GET /admin/stats como cliente → 403",
        res.status === 403,
        `status=${res.status}`
    );

    console.log(`\nResultado: ${pasados} ok, ${fallidos} fallidas.`);
    process.exitCode = fallidos > 0 ? 1 : 0;
};

main()
    .catch((error) => {
        console.error("Error en la prueba administrativa:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
