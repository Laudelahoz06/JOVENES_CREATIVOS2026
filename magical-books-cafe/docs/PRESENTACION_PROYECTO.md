# Magical Books Café — Presentación del proyecto

> Documento para presentar el avance: qué es, qué hace, cómo se ve, cómo se comprueba y cómo se ejecuta.

---

## 1. ¿Qué es Magical Books Café?

Una aplicación web completa para un **café literario**: los clientes exploran el catálogo (cafés, postres, libros y servicios), compran con carrito, alquilan libros y consultan un asistente inteligente; los administradores gestionan productos, inventario, pedidos, alquileres, mensajes y usuarios desde un panel privado.

| Parte | Tecnología |
|-------|-----------|
| Frontend | React 19 + Vite + React Router DOM |
| Backend | Node.js + Express 5 + Mongoose |
| Base de datos | MongoDB Atlas (`magical_books_cafe`) |
| Seguridad | JWT con revocación de tokens, roles `customer / admin / staff`, rate limiting, Helmet, CORS restringido |
| IA | Asistente contextual (motor local de reglas + búsqueda en catálogo; proveedor OpenAI opcional) |

---

## 2. Las 15 funcionalidades entregadas

1. **Contacto público** — formulario con validación en vivo (`/contacto`) que guarda mensajes en la base de datos.
2. **Bandeja de mensajes admin** — leer, marcar como leído, eliminar y contador de pendientes.
3. **Panel administrativo real** — `/admin` con 5 pestañas: Productos, Pedidos, Alquileres, Mensajes y Usuarios.
4. **Gestión de usuarios y roles** — cambiar rol, activar/desactivar, con protección para no desactivar la propia cuenta.
5. **Productos e inventario** — crear, editar, activar/desactivar y registrar movimientos de stock con motivo e historial.
6. **Pedidos seguros** — el servidor revalida precios y existencias antes de confirmar (nunca se confía en el navegador).
7. **Carrito persistente** — se guarda en `localStorage`, controla stock y muestra el contador en el menú.
8. **Perfil de usuario** — nombre, teléfono y preferencias (libros, géneros, cafés, música) + historial de pedidos.
9. **Alquiler de libros** — formatos (físico, digital, Kindle, PC local), fechas, cálculo automático del total y comprobante.
10. **Mis alquileres** — lista con código de ticket, periodo y estado.
11. **Gestión admin de pedidos y alquileres** — cambio de estados con filtros.
12. **Asistente IA útil** — widget flotante que responde sobre horario, catálogo y alquileres.
13. **Catálogo completo** — búsqueda con debounce, filtros por categoría, paginación, ficha de producto en `/catalogo/:id` e imágenes de referencia para cada producto.
14. **UX cuidada** — skeletons de carga, validaciones en tiempo real, feedback de éxito/error, footer de 4 columnas con enlaces y horario, y diseño responsive.
15. **Calidad** — 36 pruebas automáticas de API, lint en 0 y build de producción verificado.

---

## 3. Cómo se comprueba (evidencias)

### Pruebas automáticas del backend

```bash
cd magical-books-cafe/backend
npm test            # 17 pruebas: API pública, pedidos, alquileres, IA, seguridad
npm run test:admin  # 19 pruebas: usuarios, roles, pedidos, mensajes, alquileres admin
```

Resultado: **36 pruebas, 0 fallidas**.

Incluye verificaciones de seguridad:

- `GET /admin/users` sin token → **401**.
- `GET /orders` y `GET /contact` siendo cliente → **403**.
- Petición con el token de un logout → **401** (token revocado en el servidor).

### Calidad del frontend

```bash
cd magical-books-cafe/frontend
npm run lint    # 0 problemas
npm run build   # build de producción OK
```

### Verificación manual sugerida (demo)

1. Abrir `http://localhost:5173/catalogo`, buscar "principito" y filtrar por "Libros".
2. Abrir un producto, elegir formato, cantidad y **Agregar al carrito**.
3. Ir al carrito y **Confirmar pedido** (si no hay sesión, pide iniciar sesión).
4. Registrarse en `/registro` y completar **Mi perfil** (preferencias).
5. En un libro con alquiler, solicitar fechas → aparece el código de ticket en **Mis alquileres**.
6. Abrir el asistente ✧ (esquina inferior derecha) y preguntar "¿Cuál es el horario?".
7. Enviar un mensaje desde **/contacto**.
8. Promover un usuario a administrador y entrar a `/admin`:

```bash
cd magical-books-cafe/backend
npm run promote-admin correo@ejemplo.com
```

9. En el panel: crear un producto, registrarle inventario, cambiar el estado de un pedido, marcar un mensaje como leído y modificar el rol de un usuario.

---

## 4. Cómo se ejecuta

Requisitos: Node.js + npm y una cuenta de MongoDB Atlas (IP habilitada con `0.0.0.0/0`).

```bash
# 1. Configurar backend/.env (ver GUIA_DESARROLLO, paso 1)

# 2. Base de datos de ejemplo (7 productos con stock)
cd magical-books-cafe/backend
npm run seed

# 3. Backend (terminal 1)
npm run dev            # http://localhost:5000

# 4. Frontend (terminal 2)
cd ../frontend
npm run dev            # http://localhost:5173
```

Verificación rápida: `http://localhost:5000/api/health` debe responder `{"success":true, ..., "database":"MongoDB Atlas"}`.

---

## 5. Arquitectura resumida

```
React (:5173)  ──fetch con JWT──▶  Express (:5000)  ──mongoose──▶  MongoDB Atlas
     │                                  │
     ├─ AuthContext (sesión)            ├─ middlewares: authenticate + authorize
     ├─ CartContext (carrito local)     ├─ controllers por módulo
     ├─ services/api.js (cliente)       ├─ express-validator en cada ruta
     └─ páginas + pestañas admin        └─ manejo centralizado de errores (404/400/409/500)
```

**Endpoints principales** (base `/api`): `/auth`, `/products`, `/orders`, `/rentals`, `/contact`, `/ai/assistant`, `/admin/users`, `/admin/products`.

---

## 6. Decisiones técnicas destacadas

- **Seguridad:** contraseñas con bcrypt (work factor 12), JWT con `issuer/audience`, lista de tokens revocados, rate limit de auth (10 intentos/15 min) y de API (100 peticiones/15 min).
- **Integridad de pedidos:** `POST /orders` consulta los productos en la base y recalcula total y stock; si el precio cambió en el catálogo, el servidor manda.
- **Inventario:** el stock solo se modifica por la ruta de inventario y deja un `InventoryMovement` (quién, cuándo, motivo, antes/después).
- **IA sin dependencia obligatoria:** si no hay `AI_API_KEY`, el asistente responde con un motor de intenciones local que además consulta el catálogo real.
- **Resiliencia de interfaz:** skeletons durante la carga, mensajes de error legibles y estados vacíos amigables en cada vista.

---

## 7. Pendiente / siguientes pasos

- Imágenes reales de los productos (hoy usan el placeholder `ProductoNoDisponible.png`).
- Configurar proveedor de IA para respuestas abiertas (`AI_API_KEY` en `backend/.env`).
- Despliegue en la nube (frontend estático + backend + Atlas).
- Pruebas de frontend con Vitest + Testing Library.

---

*Documento elaborado el 10 de noviembre de 2026. La guía técnica completa está en `magical-books-cafe/docs/GUIA_DESARROLLO.md`.*
