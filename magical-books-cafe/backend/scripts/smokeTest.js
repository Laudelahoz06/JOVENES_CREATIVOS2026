// Prueba de humo: valida los endpoints críticos de la API.
// Requisito: el backend corriendo (npm run dev) en process.env.PORT || 5000.
// Uso: npm test

const BASE =
    process.env.API_BASE || `http://localhost:${process.env.PORT || 5000}/api`;

let pasados = 0;
let fallidos = 0;
let token = "";
let adminToken = "";

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
    console.log(`Pruebas contra ${BASE}\n`);

    // 1. Salud
    let res = await llamar("GET", "/health");
    verificado(
        "GET /health",
        res.status === 200 && res.data?.success === true
    );

    // 2. Catálogo
    res = await llamar("GET", "/products");
    verificado(
        "GET /products devuelve paginación",
        res.status === 200 && typeof res.data?.pagination?.total === "number"
    );

    res = await llamar("GET", "/products?type=coffee");
    verificado(
        "GET /products?type=coffee",
        res.status === 200 && Array.isArray(res.data?.products)
    );

    // 3. Registro + login + perfil + logout
    const correo = `smoke.${Date.now()}@mail.com`;

    res = await llamar("POST", "/auth/register", {
        body: { name: "Smoke Test", email: correo, password: "Secreta123" }
    });
    token = res.data?.token || "";
    verificado("POST /auth/register", res.status === 201 && Boolean(token));

    res = await llamar("POST", "/auth/login", {
        body: { email: correo, password: "Secreta123" }
    });
    verificado(
        "POST /auth/login",
        res.status === 200 && Boolean(res.data?.token)
    );

    res = await llamar("GET", "/auth/profile", { auth: token });
    verificado(
        "GET /auth/profile",
        res.status === 200 && res.data?.user?.email === correo
    );

    res = await llamar("PATCH", "/auth/profile", {
        auth: token,
        body: { preferences: { favoriteGenres: ["realismo mágico"] } }
    });
    verificado(
        "PATCH /auth/profile (preferencias)",
        res.status === 200 &&
            res.data?.user?.preferences?.favoriteGenres?.[0] ===
                "realismo mágico"
    );

    // 4. Contacto
    res = await llamar("POST", "/contact", {
        body: {
            name: "Cliente Prueba",
            email: "cliente@correo.com",
            subject: "Consulta de catálogo",
            message: "¿Tienen libros de Gabriel García Márquez disponibles?",
            audience: "duenos"
        }
    });
    verificado(
        "POST /contact",
        res.status === 201 && res.data?.success === true
    );

    // 5. Asistente IA (motor local si no hay AI_API_KEY)
    res = await llamar("POST", "/ai/assistant", {
        body: { message: "¿Cuál es el horario?" }
    });
    verificado(
        "POST /ai/assistant responde",
        res.status === 200 && typeof res.data?.reply === "string" &&
            res.data.reply.length > 0,
        JSON.stringify(res.data || {}).slice(0, 120)
    );

    // 6. Alquiler (requiere un libro con alquiler habilitado)
    res = await llamar("GET", "/products?type=book");
    const libro = (res.data?.products || []).find(
        (item) => item.rental?.enabled
    );

    if (libro) {
        const inicio = new Date();
        const fin = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

        res = await llamar("POST", "/rentals", {
            auth: token,
            body: {
                productId: libro._id,
                format: libro.formats[0],
                startDate: inicio.toISOString(),
                endDate: fin.toISOString()
            }
        });
        verificado(
            "POST /rentals",
            res.status === 201 && Boolean(res.data?.rental?.ticketCode)
        );

        res = await llamar("GET", "/rentals/mine", { auth: token });
        verificado(
            "GET /rentals/mine",
            res.status === 200 && res.data?.rentals?.length >= 1
        );
    } else {
        verificado("POST /rentals (sin libro sembrado)", false, "ejecuta npm run seed");
    }

    // 7. Pedido (carrito)
    res = await llamar("GET", "/products");
    // Se elige un producto con stock: el primero del catálogo puede
    // estar agotado por pedidos de prueba anteriores.
    const producto =
        (res.data?.products || []).find((p) => (p.stock || 0) >= 2) ||
        res.data?.products?.[0];

    res = await llamar("GET", `/products/${producto._id}`);
    const stockInicial = res.data?.product?.stock;

    res = await llamar("POST", "/orders", {
        auth: token,
        body: {
            items: [{ product: producto._id, quantity: 1 }],
            notes: "Pedido de prueba"
        }
    });
    verificado(
        "POST /orders",
        res.status === 201 && typeof res.data?.order?.total === "number"
    );

    res = await llamar("GET", `/products/${producto._id}`);
    verificado(
        "POST /orders descuenta el stock",
        res.data?.product?.stock === stockInicial - 1,
        `(esperado ${stockInicial - 1}, obtenido ${
            res.data?.product?.stock
        })`
    );

    res = await llamar("GET", "/orders/mine", { auth: token });
    verificado(
        "GET /orders/mine",
        res.status === 200 && res.data?.orders?.length >= 1
    );

    // 7b. Cancelación del pedido por el propio cliente
    const mio = (res.data?.orders || []).find(
        (pedido) => pedido.status === "pendiente"
    );

    if (mio) {
        res = await llamar("PATCH", `/orders/${mio._id}/cancel`, {
            auth: token
        });
        verificado(
            "PATCH /orders/:id/cancel",
            res.status === 200 && res.data?.order?.status === "cancelado"
        );

        res = await llamar("GET", `/products/${producto._id}`);
        verificado(
            "Cancelar el pedido devuelve el stock",
            res.data?.product?.stock === stockInicial,
            `(esperado ${stockInicial}, obtenido ${
                res.data?.product?.stock
            })`
        );

        res = await llamar("PATCH", `/orders/${mio._id}/cancel`, {
            auth: token
        });
        verificado(
            "Cancelar dos veces → 409",
            res.status === 409
        );
    } else {
        verificado("PATCH /orders/:id/cancel (sin pedido pendiente)", false);
    }

    // 7c. Un cliente no puede cancelar pedidos ajenos
    res = await llamar("POST", "/auth/register", {
        body: {
            name: "Otro Cliente",
            email: `otro-${Date.now()}@mail.com`,
            password: "Secreta123"
        }
    });
    const otroToken = res.data?.token || "";

    if (otroToken && mio) {
        res = await llamar("PATCH", `/orders/${mio._id}/cancel`, {
            auth: otroToken
        });
        verificado(
            "Cancelar pedido ajeno → 404",
            res.status === 404
        );
    }

    // 7d. Pagos: pedido con método de pago + checkout Wompi + verify
    res = await llamar("POST", "/orders", {
        auth: token,
        body: {
            items: [{ product: producto._id, quantity: 1 }],
            paymentMethod: "local"
        }
    });
    verificado(
        "POST /orders con paymentMethod=local",
        res.status === 201 &&
            res.data?.order?.paymentMethod === "local" &&
            res.data?.order?.paymentStatus === "pending"
    );
    const pedidoPago = res.data?.order?.id;

    // Checkout de Wompi: 200 si las llaves están en .env, 503 si no.
    res = await llamar("POST", "/payments/wompi", {
        auth: token,
        body: { orderId: pedidoPago }
    });
    verificado(
        "POST /payments/wompi (checkout 200 o 503 sin llaves)",
        (res.status === 200 &&
            typeof res.data?.checkout?.signature === "string" &&
            String(res.data?.checkout?.reference || "").startsWith(
                `ORDER-${pedidoPago}-`
            )) ||
            (res.status === 503 &&
                String(res.data?.message || "").includes("Wompi")),
        JSON.stringify(res.data || {}).slice(0, 140)
    );

    // Verify sin parámetros → 400.
    res = await llamar("GET", "/payments/wompi/verify", { auth: token });
    verificado(
        "GET /payments/wompi/verify sin parámetros → 400",
        res.status === 400
    );

    // Webhook con checksum inválido → 400.
    res = await llamar("POST", "/payments/wompi/webhook", {
        body: { data: {}, timestamp: 0, signature: {} }
    });
    verificado(
        "POST /payments/wompi/webhook inválido → 400",
        res.status === 400
    );

    // Un cliente no puede registrar pagos (solo admin).
    res = await llamar("PATCH", `/orders/${pedidoPago}/pay-local`, {
        auth: token,
        body: { paymentReference: "PRUEBA-1" }
    });
    verificado(
        "PATCH /orders/:id/pay-local rechaza clientes (403)",
        res.status === 403
    );

    // El pedido de pago sigue pendiente: se cancela al final para que
    // la prueba deje el stock neto en 0 en cada corrida.
    res = await llamar("PATCH", `/orders/${pedidoPago}/cancel`, {
        auth: token
    });
    verificado(
        "Cancelar el pedido de pago (stock neto 0)",
        res.status === 200 && res.data?.order?.status === "cancelado"
    );

    res = await llamar("GET", `/products/${producto._id}`);
    verificado(
        "Stock final restaurado al valor inicial",
        res.data?.product?.stock === stockInicial,
        `(esperado ${stockInicial}, obtenido ${
            res.data?.product?.stock
        })`
    );

    // 8. Seguridad: rutas admin sin rol admin deben dar 403
    res = await llamar("GET", "/admin/users", { auth: token });
    verificado(
        "GET /admin/users rechaza clientes (403)",
        res.status === 403
    );

    res = await llamar("GET", "/admin/products", { auth: token });
    verificado(
        "GET /admin/products rechaza clientes (403)",
        res.status === 403
    );

    // 9. Logout
    res = await llamar("POST", "/auth/logout", { auth: token });
    verificado("POST /auth/logout", res.status === 200);

    res = await llamar("GET", "/auth/profile", { auth: token });
    verificado(
        "Token revocado tras logout (401)",
        res.status === 401
    );

    console.log(`\nResultado: ${pasados} ok, ${fallidos} fallidas.`);

    if (adminToken === "" && process.env.SMOKE_ADMIN_EMAIL) {
        // Reservado para futuras pruebas con cuenta administrativa.
    }

    if (fallidos > 0) process.exitCode = 1;
};

main().catch((error) => {
    console.error("No se pudieron ejecutar las pruebas:", error.message);
    process.exitCode = 1;
});
