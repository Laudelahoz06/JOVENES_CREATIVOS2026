# Notas de avance — Magical Books Café

> Última actualización: 2026-11-12 — navbar con botón "Cerrar sesión" estilo admin + **stock descontado/restaurado en pedidos** + rate-limit adaptado a dev; **push `5c54e79` hecho con la cuenta Laudelahoz06 vía `gh`**
>
> ⚠️ **Regla del equipo:** **Solicitar autorización antes de cualquier cambio en git** (commit, push, stash, reset, etc.). No se toca git sin que el usuario lo apruebe.

## Estado general
- **Rama:** `main`, sincronizada con `origin/main` (`Laudelahoz06/JOVENES_CREATIVOS2026`). **Último push (2026-11-12):** commit `5c54e79` "inventario descontado al crear pedido y devuelto al cancelar, navbar con cerrar sesion estilo admin, rate-limit ampliado en desarrollo" (9 archivos) + esta nota. Commit anterior: `3e6224a` (pagos, dashboard, docs). **Credencial git:** la cuenta activa de `gh` es **Laudelahoz06** (`gh auth switch --user Laudelahoz06`); el helper local del repo quedó en `!gh auth git-credential` — el push con credenciales de `jadies2024` da **403** (sin permiso). **Regla:** pedir autorización antes de commitear/pushear.
- **Stack:** Node.js + Express 5 + Mongoose (backend) · React 19 + Vite (frontend) · JavaScript puro (sin TS)
- **Proveedor cloud:** **MongoDB Atlas en uso** (cluster `cluster0.ziemfyj`, DB `magical_books_cafe`), IP `0.0.0.0/0` (si tu IP pública cambia y no usas 0.0.0.0/0, el backend no conecta). Puerto del backend: **5000**
- **Servidores (2026-11-10):** backend `http://localhost:5000` · frontend `http://localhost:5173` (Vite). Si el backend "no responde", revisar con `Get-NetTCPConnection -LocalPort 5000 -State Listen` quién escucha y relanzar `node src/server.js`.
- **Documentación:**
  - `magical-books-cafe/docs/GUIA_DESARROLLO.md` + **`.docx`** (guía técnica, ampliada con las 15 funcionalidades)
  - `magical-books-cafe/docs/PRESENTACION_PROYECTO.md` + **`.docx`** (presentación y evidencias)
  - `magical-books-cafe/README.md` (arranque rápido, scripts, rutas)

## Qué está hecho
- **Backend completo (2026-11-10):** auth (register/login/profile/logout + `PATCH /auth/profile` con preferencias), CRUD productos admin, inventario con historial, **contacto** (`/api/contact` con bandeja admin), **pedidos** (`/api/orders` con revalidación de precios/stock), **alquileres** (`/api/rentals` con `fisico|digital|kindle|local_pc`), **IA** (`/api/ai/assistant` con motor local + OpenAI opcional), **usuarios admin** (`GET/PATCH /api/admin/users` con protección de auto-desactivación), seguridad (helmet, CORS, rate-limit, express-validator), manejo centralizado de errores
- **Modelos:** `User`, `Product`, `Rental` (enum format ampliado con `fisico`), `Order`, `ContactMessage`, `InventoryMovement`
- **Pruebas automáticas (56 OK, 0 fallidas):** `npm test` (29) y `npm run test:admin` (27) en `backend/`; scripts `smokeTest.js` y `adminSmokeTest.js`
- **Frontend completo:** Home, Catálogo (búsqueda con debounce, filtros, paginación, skeletons), **ficha de producto `/catalogo/:id`** (formatos, cantidad, carrito, formulario de alquiler), **/contacto** con validación en vivo, **/carrito** (CartContext + localStorage, checkout con confirmación), **/perfil** (datos, preferencias, historial de pedidos), **/mis-alquileres** (ticket y estado), **/admin** con 6 pestañas (Resumen con gráficas, Productos, Pedidos, Alquileres, Mensajes, Usuarios), **widget flotante de asistente IA**, Navbar con contador de carrito, `styles/features.css`
- **Auth verificado end-to-end** y lint del frontend en **0 problemas**; `npm run build` OK (CSS ~31 kB, JS ~328 kB); los 16 módulos nuevos se sirven sin error en Vite
- **Seed actualizado:** `scripts/seedProducts.js` ahora hace **upsert por SKU** y fija `stock` (cafés 50, postres 30, libros 4-5, servicio 100) — corrige los 409 "Stock insuficiente" del pedido inicial
- **Utilidades:** `npm run promote-admin <correo>` (promueve a admin), `npm run check` (sintaxis)

## Avances de la tarde (2026-11-10) ← CONTINUAR AQUÍ EN LA NOCHE
- **Experiencias con imagen y diseño rico (2026-11-10 noche):** cada tarjeta ahora tiene foto real (9 URLs Unsplash verificadas 200), badge circular del icono superpuesto sobre la imagen, overlay degradado, zoom `scale(1.06)` en hover, elevación + sombra, CTA alineado al fondo con flecha animada y descripciones ampliadas; servicios dinámicos usan `product.image` con fallback a `/ProductoNoDisponible.png`; sin imagen → placeholder con degradado dorado. Estilos en `global.css` (bloque `.experience-*`); lint 0 y build OK (CSS ~34 kB)
- **Cancelación de pedido por el cliente (2026-11-11):** nuevo `PATCH /api/orders/:id/cancel` (solo el dueño, solo estado `pendiente` → `cancelado`; 404 si es ajeno, 409 si ya no está pendiente). En `/perfil`, cada pedido pendiente muestra botón "Cancelar pedido" con `window.confirm`, estado actualizado en pantalla y feedback de error. Pruebas nuevas en `smokeTest.js` (cancelar, doble cancelar → 409, ajeno → 404): **20/20**
- **Fallback DNS para Atlas (2026-11-11):** el router local no responde consultas TXT (clave para `mongodb+srv`) y el backend no conectaba → `dns.setServers(["8.8.8.8","8.8.4.4"])` al inicio de `src/config/database.js` y de los scripts (`adminSmokeTest`, `promoteAdmin`, `seedProducts`). Backend reiniciado y verificado en `:5000`. **Nota dejada en "Lecciones de la máquina"** para retomar más adelante (si se cambia el DNS de la PC o el router, se puede quitar)
- **Dashboard administrativo con gráficas (2026-11-11):** nueva pestaña **"Resumen"** (primera, por defecto) en `/admin` con **recharts 3.10**:
  - **Endpoint** `GET /api/admin/stats` (admin) en `adminStatsController.js`: 13 agregaciones en paralelo (MongoDB aggregate) — KPIs (ingresos ventas/alquileres, alquileres, usuarios, productos, stock, mensajes nuevos), ingresos por mes (6 meses, serie completa con ceros), pedidos por estado, top productos, categorías más vendidas (con `$lookup` a products), alquileres por mes/formato/estado, usuarios nuevos por mes, stock ≤ 5, mensajes por estado, catálogo por tipo
  - **UI** `AdminOverview.jsx`: 6 tarjetas KPI + gráficas de área (ingresos), dona (pedidos por estado, alquileres por formato, categorías, catálogo por tipo), barras horizontales (top productos), barras verticales (alquileres por estado, usuarios nuevos), línea (alquileres por mes) + lista de alertas de inventario; responsive 1200/768/480 px, colores de la paleta guía
  - `AdminOverview` con `React.lazy` + `Suspense`: el bundle principal sigue en ~335 kB y recharts (439 kB) se descarga solo al abrir el panel
  - Pruebas: `test:admin` **21/21** (incluye `GET /admin/stats` 200 y 403 como cliente) · `npm test` **20/20** · lint 0 · build OK
- **Imágenes de referencia:** los 7 productos ahora tienen foto real (Unsplash CDN, todas verificadas 200). Guardadas en `backend/scripts/seedProducts.js` y aplicadas con `npm run seed`; si se reseedea no se pierden. `ProductCard` y `Cart` con `loading="lazy"` y `.card-media` con fondo tenud mientras carga (ya no se ve hueco vacío)
- **SKU oculto:** la ficha pública `/catalogo/:id` ya no muestra el SKU (solo "Disponibles"); sigue visible en el panel admin
- **Footer nuevo:** 4 columnas (marca/tagline, Explorar, Mi cuenta, Visítanos con horario) + barra inferior, estilos en `global.css`, responsive 900/480 px
- **Experiencias mejoradas** (`ExperienceCards.jsx`): tarjetas clicables con "Ver más →" (Café/Libros/Degustaciones → catálogo; Comunidad/Coworking/Clubes/Reservas → contacto), tarjeta "App Inteligente" **abre el asistente IA** (evento `open-assistant` que escucha `AssistantWidget`), 3 experiencias nuevas (Degustaciones, Clubes literarios, Reservas de espacio) y **servicios dinámicos desde la API** (`GET /products?type=service`, contador automático)
- **Navbar por rol:** admin ve solo saludo + "Panel administrativo" + "Cerrar sesión" (ocultos Mi perfil y Carrito); en `/admin` además se ocultan los enlaces públicos (Inicio, Catálogo, Contacto, Experiencias, Mis alquileres) vía `useLocation`
- **Login con rol admin → redirige directo a `/admin`** (`Login.jsx` lee `data.user.role`); cliente normal sigue yendo a `/`
- **Paquete de envío:** `JOVENES_CREATIVOS2026/MagicalBooksCafe.zip` (0.3 MB, 105 archivos, sin `.env` ni `node_modules`) con código + guías completas (.md y .docx regenerados)
- **Verificación al cierre (2026-11-11):** backend `npm test` 20/20 + `npm run test:admin` 21/21 · frontend `lint` 0 · `build` OK

## Pagos: Wompi + pago en local + gráficas de pagos (2026-11-11)
- **Decisiones tomadas:** checkout **alojado** de Wompi (`https://checkout.wompi.co/p/`), el cliente elige método (**Wompi** o **Pagar en el local**) y el admin registra el pago local desde Pedidos; llaves sandbox en `backend/.env` (¡pendiente que el usuario las pegue!)
- **Modelo `Order`** — campos nuevos: `paymentMethod` (`wompi|local|null`), `paymentStatus` (`pending|approved|rejected`, default `pending`), `wompiTransactionId`, `paidAt`, `paymentAttempts` (referencia única por intento: `ORDER-{id}-{n}` evita el 422 de referencia reutilizada al reintentar). `createOrder` acepta `paymentMethod` (default `local`)
- **Servicio Wompi** (`backend/src/services/wompi.js`): base sandbox/production según `WOMPI_ENV`, `buildSignature` = sha256(ref+monto+COP+integrity) **siempre en backend**, `getCheckoutParams` (parámetros del form + `redirectUrl` → `/pagos/resultado`), `getTransaction` (Bearer `prv_*`, única fuente de verdad), `verifyWebhookChecksum` (properties+timestamp+events secret con `timingSafeEqual`), `mapWompiStatus`; sin llaves → error 503 controlado
- **Rutas de pago** (`paymentRoutes.js` + `paymentController.js`, montadas en `/api/payments`):
  - `POST /api/payments/wompi` (cliente) → `{ orderId }` → incrementa intentos y devuelve parámetros del checkout
  - `GET /api/payments/wompi/verify?transactionId=&reference=` (cliente) → consulta Wompi, aprueba (`approved` + `status=confirmado` + `paidAt`) o rechaza; idempotente; valida que la referencia pertenezca a la orden
  - `POST /api/payments/wompi/webhook` (público) → checksum → 200 rápido → verifica con llave privada (en local no llegan webhooks: el flujo principal es verify al volver)
  - `PATCH /api/orders/:id/pay-local` (**admin**) → registra pago en caja (`paymentMethod=local`, `approved`, `paidAt`); 409 si ya estaba aprobado
- **Stats admin ampliado** (`adminStatsController.js`): `salesTotal` ahora cuenta solo pagos aprobados (legado con `$ifNull` → `approved`); nuevas series `paymentsByMethod` (dona), `paymentsByStatus` (barras, 6 meses), `paymentsByMonth` (barras apiladas wompi/local) y KPIs `paidTotal|paidWompi|paidLocal|paymentsPending`
- **Frontend:**
  - `Cart.jsx`: selector de método (2 tarjetas radio con icono), Wompi → crea orden + `POST /payments/wompi` + form oculto auto-submit a `checkout.wompi.co`; local → confirmación "pendiente de pago en caja"
  - **Nuevo** `pages/PaymentResult.jsx` (ruta `/pagos/resultado`): lee `?id=&reference=`, llama `verify`, muestra aprobado/rechazado/pendiente con reintento (polling 4 s ×5); estado inicial derivado de la URL y rama "sin sesión" renderizada sin efectos (lint `react-hooks/set-state-in-effect` satisfecho)
  - `Profile.jsx`: chip de pago junto al estado (labels en `format.js`: `PAYMENT_STATUS_LABELS`, `PAYMENT_METHOD_LABELS`; pedidos antiguos sin `paymentStatus` → asumidos `approved`)
  - `AdminOrders.jsx`: columna **Pago** (chip + método) + botón **"Registrar pago"** (`window.prompt` para referencia opcional → `PATCH /orders/:id/pay-local`)
  - **Dashboard en sub-pestañas** (General | Alquileres | Pagos): `AdminOverview.jsx` es ahora contenedor (carga stats una vez + tabs); secciones en `GeneralSection.jsx`, `RentalsSection.jsx`, `PaymentsSection.jsx` (KPIs de pago + dona método + barras apiladas mes×método + barras estado); constantes en `chartsConstants.js` y tarjetas en `chartsCommon.jsx` (separados por el lint `react-refresh/only-export-components`)
  - CSS nuevo en `features.css`: `.payment-method-*`, `.payment-result-*`, `.payment-approved|pending|rejected`, `.admin-payment-cell`, `.admin-pay-btn`, `.admin-subtabs`
- **Pruebas:** `npm test` **25/25** (pedido con `paymentMethod`, checkout 200/503, verify sin params → 400, webhook inválido → 400, pay-local como cliente → 403) + `npm run test:admin` **24/24** (pay-local aprueba + doble → 409, stats con series de pagos) · lint 0 · build OK
- **✅ Llaves Wompi configuradas (2026-11-11):** las 5 variables (`WOMPI_ENV/PUBLIC_KEY/PRIVATE_KEY/INTEGRITY_KEY/EVENTS_SECRET`, sandbox) están en `backend/.env`; backend reiniciado y `POST /api/payments/wompi` **responde 200 con checkout** (publicKey `pub_test_…`, firma sha256 y referencia `ORDER-{id}-{n}` OK). **Lección:** un proceso backend viejo no recarga `.env` — si el archivo cambia, **reiniciar** (pasó: proceso iniciado con `.env` viejo → 503 "Wompi no está configurado" con el archivo ya correcto)
- **Pendiente (mañana):** probar el pago real en navegador con tarjeta `4242 4242 4242 4242` (abrir la URL del checkout generada, verificar redirect a `/pagos/resultado` → `verify` → pedido `approved`); en producción configurar la URL del webhook en el panel de Wompi
- **Pendiente git (requiere autorización):** commit de este `NOTAS.md` (el push grande `3e6224a` ya subió todo lo demás)

## Dashboard admin con sidebar lateral (2026-11-11)
- **Layout nuevo de `/admin`:** el navbar horizontal público ya no se muestra en el panel — `MainLayout.jsx` detecta `pathname.startsWith("/admin")` y renderiza solo el `<Outlet />` (sin Navbar, **sin Footer y sin asistente IA flotante** — decisión del equipo). Las páginas públicas no cambian
- **Sidebar izquierdo fijo** (`AdminDashboard.jsx`): marca "✦ Magical Books Café" arriba a la izquierda (mismo lugar que antes) + **menú con estructura de árbol**: `Resumen` · **`Gestión`** (nodo padre plegable con chevron ▸/▾ → `Productos`, `Pedidos`, `Alquileres` indentados con línea vertical `│`) · `Mensajes` · `Usuarios`. Ítem activo con borde izquierdo accent; al elegir un hijo, el padre se expande solo
- **Header renovado** (columna derecha, sticky): título de la sección activa + `accessMessage` como subtítulo · a la derecha **"Hola, {Nombre}"** con avatar circular (inicial con degradado primary→accent) + **botón "⏻ Cerrar sesión" renovado** (ghost con borde/fondo rojo tenue, hover más intenso) con su propio `handleLogout`
- **Contenido:** el mismo switch de pestañas de antes (Suspense + AdminOverview/…); desaparecen los 6 botones `.admin-tabs` superiores (los estilos `.admin-tabs` se conservan porque los usa `AdminOverview` vía `.admin-subtabs`); se eliminó el bloque `.admin-welcome` de `global.css`
- **Móvil (≤900px):** hamburguesa ☰ en el header → sidebar off-canvas (`translateX`) + overlay oscuro; se cierra al elegir un ítem. ≤560px: header en dos filas (acciones al ancho completo)
- **CSS:** bloque nuevo "Panel administrativo: layout" en `features.css` (`.admin-dashboard` ahora flex sin padding, `.admin-sidebar`, `.admin-tree*`, `.admin-header`, `.admin-avatar`, `.btn-logout`, `.admin-hamburger`, `.admin-content` + media queries); `padding: 0` anula el `section { padding: 70px 8% }` global
- **Verificación:** lint 0 · build OK (CSS 42.9 kB) · `/admin` sirve 200 en Vite

## Inventario en pedidos + navbar estilo admin (2026-11-12)
- **Navbar del cliente (2026-11-12):** el botón "Cerrar sesión" público ahora usa la clase **`.btn-logout`** con icono `⏻` (mismo diseño del header del panel admin: fantasma con borde/fondo rojo tenue); `features.css` ya estaba importado globalmente en `main.jsx`, no hizo falta CSS nuevo
- **Stock afectado por las compras (2026-11-12):** `createOrder` ahora **descuenta el stock de forma atómica** y lo **devuelve al cancelar**:
  - **Modelo `Order`:** campo nuevo **`stockReserved`** (`Boolean`, default `false`) — marca si el pedido descontó stock; los pedidos antiguos quedan en `false` → cancelarlos NO devuelve stock que nunca se descontó
  - **Modelo `InventoryMovement`:** enum `type` ampliado con **`sale`** (venta = cantidad negativa, devolución por cancelación = positiva); la ruta manual de admin (`restock|adjustment`) no cambió
  - **`orderController.js` reescrito con transacciones** (patrón de `adjustStock` + `session.withTransaction`; Atlas soporta transacciones multi-documento, verificado):
    - `createOrder`: crea pedido con `stockReserved: true` y por ítem llama `deductStock` → `findOneAndUpdate({ stock: { $gte: qty } }, { $inc: { stock: -qty } })` (condicional, evita ventas cruzadas) + `InventoryMovement` (`type: "sale"`, qty negativa, reason `Venta - pedido {id}`); si no alcanza stock → 409 y **la transacción revierte todo** (sin pedido a medias)
    - `cancelMyOrder`: si `stockReserved` → `releaseOrderStock` (devuelve unidades + movimiento de devolución), marca `stockReserved: false`, pasa a `cancelado` (todo en una transacción)
    - `updateOrderStatus` (admin): → `cancelado` devuelve stock si estaba reservado; **`cancelado` → otro estado re-reserva** el stock (409 con mensaje claro si ya no alcanza); mismo estado = no-op
    - Los pagos (Wompi/`pay-local`) solo hacen `pendiente → confirmado`: no tocan stock (ya reservado al crear)
  - **Alcance:** el descuento aplica a **todos los ítems** (incluye formato `digital`), consistente con la validación de stock existente
- **Pruebas actualizadas:** `smokeTest.js` verifica descuento al crear, devolución al cancelar y cancela el pedido de pago al final (**stock neto 0 por corrida**) → **29/29**; `adminSmokeTest.js` verifica descuento de 2 unidades, cancelación admin al final que las devuelve → **27/27**. `lint` 0 · `build` OK
- **Nota:** hay movimientos `InventoryMovement` de prueba en la DB (corridas de tests previas al cambio no registraban movimientos de venta)
- **Rate-limit adaptado a desarrollo (2026-11-12):** al hacer clic en "Iniciar sesión" salía **429 Too Many Requests** — las corridas de tests + la navegación local comparten IP (localhost) y agotaban los límites en memoria (100 req/15 min globales + 10 logins/15 min). Solución aprobada: **límites según `NODE_ENV`** — producción mantiene 100 (`app.js`) y 10 (`authRoutes.js`); **desarrollo usa 10000 y 500**. Verificado con header `RateLimit-Policy: 10000;w=900` y reinicio del backend; pruebas 29/29 + 27/27 después del cambio. **Si vuelve a bloquear en dev:** reiniciar el backend (los contadores viven en memoria)

## Qué falta (prioridad sugerida)
1. **Proveedor de IA:** configurar `AI_API_KEY`/`AI_MODEL` en `backend/.env` para respuestas abiertas (el motor local ya funciona)
2. **Despliegue** (frontend estático + backend + Atlas)
3. **Pruebas de frontend** (Vitest + Testing Library)
4. Actualizar `DOCUMENTACION_PROYECTO.md` y `AGENTS.md` (rutas reales: `/iniciar-sesion`, `/registro`; `VITE_API_URL` debe llevar `/api`)

## Checklist de setup local
- [x] `npm install` en `magical-books-cafe/backend`
- [x] `npm install` en `magical-books-cafe/frontend`
- [x] Crear `magical-books-cafe/backend/.env` con tu URI de MongoDB Atlas (cuenta ya creada):
      `PORT=5000`, `NODE_ENV=development`, `MONGODB_URI=<mongodb+srv://...>/magical_books_cafe?retryWrites=true&w=majority`, `FRONTEND_URL=http://localhost:5173`, `JWT_SECRET=...`, `JWT_EXPIRES_IN=1h`
- [x] `npm run dev` en backend (puerto 5000) y `npm run dev` en frontend (puerto 5173)
- [x] Verificar `http://localhost:5000/api/health` → `success: true`
- [x] Verificar `http://localhost:5000/api/products` → 7 productos con stock

## Semilla de datos
```bash
# backend — crea/actualiza 7 productos (upsert por SKU, con stock de ejemplo)
npm run seed
```

## Comandos
```bash
# backend (requiere .env con MONGODB_URI de Atlas)
npm run dev             # nodemon src/server.js (puerto 5000)
npm start               # node src/server.js
npm run seed            # upsert de productos de ejemplo
npm run promote-admin <correo>   # promover usuario a admin
npm test                # 29 pruebas de humo
npm run test:admin      # 27 pruebas administrativas

# frontend
npm run dev             # vite (5173)
npm run build
npm run lint
```

## Tipos de datos (esquemas Mongoose)
- **User:** name/email/phone (`String`), password (`String`, select:false), role (enum `customer|admin|staff`), preferences (4 arreglos `[String]`), active (`Boolean`), revokedTokens (`[String]`)
- **Product:** sku/name/description/category/image (`String`), type (enum `coffee|dessert|book|service`), price/stock (`Number`), availableFor (`[String]`), formats (`[String]`: `fisico|digital|kindle|local_pc`), rental.enabled/dailyPrice/maxDays, active/featured (`Boolean`)
- **Rental:** user/product (`ObjectId`), startDate/endDate (`Date`), total (`Number`), format (enum `fisico|digital|kindle|local_pc`), paymentStatus (enum `pending|approved|rejected|refunded`), status (enum `pending|active|completed|cancelled`), ticketCode (`String` única)
- **Order:** user (`ObjectId`), items[{product,name,price,quantity,format `fisico|digital`}], total (`Number`), status (enum `pendiente|confirmado|entregado|cancelado`), notes, paymentReference, **paymentMethod** (enum `wompi|local`, default null), **paymentStatus** (enum `pending|approved|rejected`, default `pending`), **wompiTransactionId**, **paidAt**, **paymentAttempts** (referencia Wompi única por intento), **stockReserved** (`Boolean`, default `false` — el stock del pedido ya fue descontado)
- **ContactMessage:** name/email/phone/subject/message, audience (enum `duenos|desarrolladores`), status (enum `nuevo|leido`), user (`ObjectId` o null)
- **InventoryMovement:** product/performedBy (`ObjectId`), type (enum `restock|adjustment|sale` — `sale` lo registran los pedidos), quantity/previousStock/newStock (`Number` enteros), reason (`String`)

## Conexión a Mongo
- Código en `backend/src/config/database.js` (`mongoose.connect(process.env.MONGODB_URI)`), invocado en `server.js` antes de arrancar Express (falla con `exit(1)` si no hay URI)
- **Conectado y probado** contra MongoDB Atlas (2026-11-11): `/api/health`, catálogo, auth, pedidos (incluye cancelación), alquileres, contacto, IA, rutas admin y dashboard de estadísticas verificados con `npm test` + `npm run test:admin` (41/41)
- ⚠️ `backend/.env` contiene credenciales reales y está en `.gitignore`; **nunca** pegarlas en `.env.example` ni en el código

## Lecciones de la máquina (Windows/PowerShell)
- ⚠️ **DNS local vs Atlas (2026-11-11):** el router `192.168.15.10` (DNS de Ethernet) **no responde consultas TXT** (SRV sí) → `queryTxt ETIMEOUT cluster0.ziemfyj.mongodb.net` y el backend no conecta a Atlas. Causa probable: proxy DNS del router que no reenvía registros TXT (filtro/firmware). **Solución aplicada:** `dns.setServers(["8.8.8.8","8.8.4.4"])` al inicio de `src/config/database.js` y de los scripts que conectan directo (`adminSmokeTest`, `promoteAdmin`, `seedProducts`) — afecta solo al proceso de Node, no a la red de la PC. **Pendiente/más adelante:** si se cambia el DNS de la PC a 8.8.8.8 (o el router se actualiza), se puede quitar ese `setServers`; si otro equipo no conecta, revisar primero `nslookup -type=txt cluster0.ziemfyj.mongodb.net` contra el DNS configurado.
- `Set-Content` / `Add-Content` sin `-Encoding` usa ANSI en PS 5.1 y corrompe UTF-8 → usar `-Encoding UTF8`. **Ojo:** si ya se corrompió un archivo (build falla con "stream did not contain valid UTF-8"), se puede reconstruir leyendo la parte válida como UTF-8 y la añadida en ANSI (1252) y reescribiendo todo con `UTF8Encoding($false)`.
- **Cambio de red/IP pública (2026-11-11):** al cambiar de conexión a internet cambia la IP pública → Atlas rechaza el handshake TLS en 27017 (`ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR`, el TCP sí conecta). Solución: agregar la IP nueva en **Atlas → Network Access** (o `0.0.0.0/0` en dev) y reiniciar el backend. Ver IP actual: `Invoke-WebRequest https://api.ipify.org?format=json`.
- **Backend "código viejo" tras editar:** `node src/server.js` sin nodemon no recarga — reiniciar el proceso en :5000 (`Stop-Process`) y relanzar con `-WorkingDirectory` al backend, si no arranca con `MODULE_NOT_FOUND src\server.js`.
- Evitar caracteres unicode literales dentro de comandos; construirlos con `[char]0x0300` / `[char]0x036f` o escapes ASCII en JSON.
- `Start-Process -RedirectStandardOutput` rompe el wrapper de la terminal → arrancar el backend con `Start-Process -FilePath node -ArgumentList "src\server.js" -WindowStyle Hidden` y esperar ~6 s.
