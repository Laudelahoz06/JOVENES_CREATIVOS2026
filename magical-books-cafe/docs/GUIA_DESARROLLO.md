# Magical Books Café — Guía de desarrollo, paso a paso

> Documento técnico para ejecutar, entender y mantener el proyecto. Cada sección explica **qué se hace**, **por qué se hace** y **qué se espera obtener**, con el código real comentado.


---

## 1. Descripción general

**Magical Books Café** es una aplicación web para un café literario: catálogo de productos (café, postres, libros, servicios), autenticación de usuarios y panel administrativo.

| Parte | Tecnología | Carpeta |
|-------|-----------|---------|
| Backend | Node.js + Express 5 + Mongoose (MongoDB Atlas) | `magical-books-cafe/backend` |
| Frontend | React 19 + Vite + React Router DOM | `magical-books-cafe/frontend` |
| Base de datos | MongoDB Atlas (cluster `cluster0.ziemfyj`, BD `magical_books_cafe`) | en la nube |
| Lenguaje | JavaScript puro (sin TypeScript) | — |

No hay `package.json` en la raíz ni workspaces: **cada paquete se instala y ejecuta en su propia carpeta**.

### Arquitectura de la comunicación

```
Navegador (React en :5173)
   │  fetch  →  http://localhost:5000/api/products
   ▼
Express (API REST en :5000)
   │  mongoose.connect(...)
   ▼
MongoDB Atlas (en la nube)
   │  respuesta JSON
   ▼
React actualiza la interfaz
```

---

## 2. Estructura de carpetas

```
JOVENES_CREATIVOS2026/
├── DOCUMENTACION_PROYECTO.md          <- resumen del estado (equipo)
├── NOTAS.md                           <- notas de avance locales (no se sube)
├── magical-books-cafe/
│   ├── AGENTS.md                      <- reglas para asistentes IA
│   ├── docs/                          <- documentación (Contexto, Docs_App)
│   ├── scripts/
│   │   └── md_a_docx.py               <- generador de este DOCX
│   ├── backend/
│   │   ├── .env                       <- SECRETOS (gitignored, nunca se sube)
│   │   ├── .env.example               <- plantilla SIN secretos
│   │   ├── package.json               <- scripts: start / dev / seed / test / test:admin / promote-admin
│   │   ├── scripts/
│   │   │   ├── seedProducts.js        <- crea/actualiza productos (upsert por SKU)
│   │   │   ├── promoteAdmin.js        <- promueve un usuario a admin
│   │   │   ├── smokeTest.js           <- pruebas de humo de la API (npm test)
│   │   │   └── adminSmokeTest.js      <- pruebas de flujos admin (npm run test:admin)
│   │   └── src/
│   │       ├── server.js              <- entrada: conecta BD y arranca Express
│   │       ├── app.js                 <- configuración de Express y rutas
│   │       ├── config/database.js     <- conexión a MongoDB Atlas
│   │       ├── routes/                <- auth, products, admin, adminProduct, contact, rentals, orders, ai
│   │       ├── controllers/           <- auth, product, contact, rental, order, ai, adminUser
│   │       ├── middlewares/           <- authMiddleware (JWT), roleMiddleware (roles)
│   │       ├── models/                <- Product, User, Order, Rental, ContactMessage, InventoryMovement
│   │       └── utils/                 <- productValidators (express-validator)
│   └── frontend/
│       ├── .env                       <- VITE_API_URL (gitignored en la práctica)
│       ├── public/ProductoNoDisponible.png
│       └── src/
│           ├── main.jsx               <- punto de entrada (AuthProvider + CartProvider)
│           ├── App.jsx                <- componente raíz
│           ├── routes/AppRouter.jsx   <- rutas (React Router)
│           ├── layouts/MainLayout.jsx <- Navbar + Outlet + asistente IA
│           ├── context/AuthContext.jsx<- estado global de autenticación
│           ├── context/CartContext.jsx<- carrito persistente (localStorage)
│           ├── services/
│           │   ├── api.js             <- cliente fetch con token
│           │   └── products.js        <- helper del catálogo (lista y detalle)
│           ├── components/            <- Navbar, catalog/, home/, common/, ai/
│           ├── pages/                 <- Home, Catalog, ProductDetail, Contact, Cart,
│           │                            Profile, MyRentals, Login, Register,
│           │                            AdminDashboard (+ pages/admin/*), NotFound
│           ├── utils/format.js        <- formato COP/fechas y etiquetas de estados
│           └── styles/                <- variables.css, global.css, features.css,
│                                          responsive.css, auth.css
```

---

## 3. Requisitos previos

1. **Node.js y npm** instalados (`node -v`, `npm -v`).
2. **Cuenta en MongoDB Atlas** con un cluster y una base de datos llamada `magical_books_cafe`.
3. **IP habilitada en Atlas**: Security → Network Access → Add IP → `0.0.0.0/0` (recomendado en desarrollo; si agregas una IP fija, ten en cuenta que **tu IP pública cambia** cada cierto tiempo y el backend dejará de conectar).
4. Dependencias instaladas en ambas carpetas:
   - `cd magical-books-cafe/backend && npm install`
   - `cd magical-books-cafe/frontend && npm install`

---

## 4. Configuración paso a paso

### Paso 1 — Archivo `.env` del backend

Copia la plantilla y edita los valores:

```bash
cd magical-books-cafe/backend
copy .env.example .env
```

Contenido (ejemplo **sin credenciales reales**):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<usuario>:<clave>@cluster0.xxxxx.mongodb.net/magical_books_cafe?retryWrites=true&w=majority
FRONTEND_URL=http://localhost:5173
JWT_SECRET=<clave-aleatoria-larga>
JWT_EXPIRES_IN=1h
```

**Por qué importa cada variable:**

| Variable | Para qué sirve |
|----------|----------------|
| `PORT` | Puerto del servidor. Debe coincidir con el `VITE_API_URL` del frontend. |
| `MONGODB_URI` | Cadena de conexión Atlas. **Ojo:** debe terminar en `/magical_books_cafe` para usar la base correcta; sin eso, Mongoose usa la BD `test`. |
| `FRONTEND_URL` | Origen permitido por CORS. Si cambias el puerto del frontend, cámbialo aquí. |
| `JWT_SECRET` | Firma de los tokens. **Sin él, registro/login fallan** (el backend hace `exit(1)` si no está). |
| `JWT_EXPIRES_IN` | Caducidad del token (`1h`). |

> ⚠️ `backend/.env` está en `.gitignore`. **Nunca pegues credenciales en `.env.example` ni en el código**: ese archivo sí viaja en Git.

### Paso 2 — Archivo `.env` del frontend

```env
VITE_API_URL=http://localhost:5000/api
```

**Por qué lleva `/api`:** el cliente concatena `VITE_API_URL + endpoint` (ej. `/products`), así que la base **debe** incluir el prefijo `/api`. (Nota: el archivo `AGENTS.md` del repo dice `http://localhost:5000` **sin** `/api`; ese ejemplo está mal y rompería las peticiones.)

Solo las variables que empiezan con `VITE_` llegan al navegador; el resto se quedan en el servidor.

### Paso 3 — Base de datos con datos de ejemplo

```bash
cd magical-books-cafe/backend
npm run seed
```

Crea 7 productos (2 cafés, 2 postres, 2 libros, 1 servicio) con `stock` real (cafés 50, postres 30, libros 4-5, servicio 100). Funciona con **upsert por SKU**: puedes ejecutarlo todas las veces que quieras sin duplicar datos, y sirve además para actualizar productos ya existentes.

---

## 5. Cómo ejecutar el proyecto

Terminal 1 — backend:

```bash
cd magical-books-cafe/backend
npm run dev        # nodemon, recarga al guardar cambios
```

Terminal 2 — frontend:

```bash
cd magical-books-cafe/frontend
npm run dev        # Vite en http://localhost:5173
```

### Verificación

| Qué probar | URL | Resultado esperado |
|-----------|-----|--------------------|
| Salud de la API | `http://localhost:5000/api/health` | `{"success":true, ...,"database":"MongoDB Atlas"}` |
| Catálogo JSON | `http://localhost:5000/api/products` | `products` con los 7 items y `pagination` |
| Filtro por tipo | `http://localhost:5000/api/products?type=coffee` | 2 productos |
| Destacados | `http://localhost:5000/api/products?featured=true` | 3 productos |
| Interfaz | `http://localhost:5173/catalogo` | Catálogo renderizado desde la API |

---

## 6. Backend explicado

### 6.1 `src/server.js` — entrada del servidor

```js
import dotenv from "dotenv";
dotenv.config();                 // 1. Carga backend/.env en process.env
import app from "./app.js";
import connectDB from "./config/database.js";

async function iniciarServer() {
    try {
        await connectDB();       // 2. Conecta MongoDB ANTES de escuchar peticiones
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Servidor activo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("No fue posible iniciar el server:", error.message);
        process.exit(1);         // 3. Sin BD, no arranca (fail fast)
    }
}
iniciarServer();
```

**Decisión clave:** si la base de datos no responde, el proceso termina. Evita un servidor "vivo" que fallará en cada petición.

### 6.2 `src/config/database.js` — conexión a Atlas

```js
await mongoose.connect(process.env.MONGODB_URI);
```

Usa la cadena completa de `.env`. Por eso debe incluir el nombre de la base (`/magical_books_cafe`) y los parámetros `retryWrites=true&w=majority` que exige Atlas.

### 6.3 `src/app.js` — configuración de Express

```js
app.use(helmet());                                   // cabeceras de seguridad
app.use(cors({ origin: process.env.FRONTEND_URL,     // solo el frontend permitido
               methods: ["GET","POST","PATCH","DELETE"],
               allowedHeaders: ["Content-Type","Authorization"],
               credentials: true }));
app.use(express.json({ limit: "1mb" }));             // cuerpo JSON (máx 1 MB)

app.use("/api", apiLimiter);                         // 100 peticiones / 15 min

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/contact", contactRoutes);        // formulario + bandeja admin
app.use("/api/rentals", rentalRoutes);         // alquileres de libros
app.use("/api/orders", orderRoutes);           // pedidos del carrito
app.use("/api/ai", aiRoutes);                  // asistente IA
app.get("/api/health", ...);                         // test de salud
app.use((req, res) => res.status(404).json({...}));  // 404 para rutas inexistentes
app.use((error, req, res, next) => { ... });         // errores centralizados
```

**Orden importante:** `/api/admin/products` se monta **antes** que `/api/admin`, porque Express monta rutas por orden y de lo contrario `/products` del módulo admin chocaría con `/:id`.

**Manejo centralizado de errores** (último middleware, se activa con `next(error)`):

- `error.code === 11000` → duplicado en índice único → **409** "El registro ya existe."
- `ValidationError` de Mongoose → **400** con el detalle campo a campo.
- `CastError` (ID inválido) → **400**.
- Cualquier otro → **500** "Error interno del servidor."

### 6.4 Rutas y validación

`routes/authRoutes.js`:

```js
const authLimiter = rateLimit({ windowMs: 15*60*1000, limit: 10, ... }); // anti fuerza bruta

router.post("/register", authLimiter, registerValidation, register);
router.post("/login",    authLimiter, loginValidation,    login);
router.get ("/profile",  authenticate,                   getProfile);
router.post("/logout",   authenticate,                   logout);
```

`registerValidation` (express-validator) exige: `name` (máx. 100), `email` válido y `password` de 8 a 72 caracteres. `authenticate` es el middleware que valida el JWT.

### 6.5 `controllers/authController.js` — el ciclo de vida del usuario

**Registro:**

```js
const user = await User.create({
    name, email: normalizedEmail, password, role: "customer"
});                       // ↑ el rol por defecto siempre es customer
const token = generateToken(user);
return res.status(201).json({ success: true, token, user: {...} });
```

**Token (JWT):**

```js
const generateToken = (user) => jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h",
      issuer: "magical-books-cafe", audience: "magical-books-cafe-users" }
);
```

`sub` es el ID del usuario; `issuer`/`audience` evitan que un token emitido para otro fines sea aceptado.

**Login:** busca con `.select("+password +revokedTokens")` (esos campos están ocultos por defecto), compara con `bcrypt.compare`, y devuelve 401 genérico *"Correo o contraseña incorrectos."* (no revela cuál falló).

**Logout:** agrega el token a `revokedTokens` con `$addToSet`; el middleware rechaza tokens de esa lista. Así cerrar sesión invalida el token en el servidor, no solo en el navegador.

### 6.6 `models/User.js`

```js
password: { type: String, required: true, minlength: 8, select: false },
role:     { type: String, enum: ["customer","admin","staff"], default: "customer" },
revokedTokens: [String],
active:   { type: Boolean, default: true },
preferences: { favoriteBooks: [], favoriteGenres: [], favoriteCoffee: [], favoriteMusic: [] }
```

`select: false` hace que `password` nunca salga en las consultas salvo que se pida explícitamente.

```js
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 12);  // work factor 12
});
userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};
```

El hook `pre("save")` encripta solo cuando la contraseña cambió (no se re-encripta en cada guardado); `comparePassword` es el método usado en el login.

### 6.7 `models/Product.js` y el catálogo público

Campos principales: `sku`, `name`, `description`, `type` (`coffee|dessert|book|service`), `category`, `price`, `image`, `formats`, `rental` (para libros: `enabled`, `dailyPrice`, `maxDays`), `featured`, `active`.

`controllers/productController.js` construye los filtros del catálogo:

```js
const buildFilters = (query, includeInactive = false) => {
    const filters = {};
    if (!includeInactive) filters.active = true;       // el público nunca ve inactivos
    if (query.type) filters.type = query.type;
    if (query.featured !== undefined) filters.featured = query.featured;
    if (query.search) {                                 // regex escapada, no sensible a mayúsculas
        const search = new RegExp(escapeRegex(query.search), "i");
        filters.$or = [{ name: search }, { description: search },
                       { sku: search }, { category: search }];
    }
    // ... minPrice / maxPrice con $gte / $lte
    return filters;
};
```

La respuesta combina `Promise.all` para traer productos y total en paralelo, con `skip/limit` por paginación:

```json
{
  "success": true,
  "products": [ ... ],
  "pagination": { "total": 7, "page": 1, "limit": 12, "pages": 1,
                  "hasNextPage": false, "hasPreviousPage": false }
}
```

### 6.8 Endpoints disponibles (base `/api`)

| Método | Ruta | Auth | Rol | Descripción |
|--------|------|------|-----|-------------|
| GET | `/health` | No | — | Salud de la API |
| POST | `/auth/register` | No | — | Crea usuario `customer` y devuelve token |
| POST | `/auth/login` | No | — | Devuelve token |
| GET | `/auth/profile` | JWT | — | Perfil del usuario |
| POST | `/auth/logout` | JWT | — | Revoca el token |
| GET | `/products` | No | — | Catálogo paginado (`type`, `category`, `format`, `featured`, `search`, `minPrice`, `maxPrice`, `page`, `limit`, `sort`) |
| GET | `/products/:id` | No | — | Detalle de producto |
| GET | `/admin/products` | JWT | admin | Lista completa (incluye inactivos) |
| POST | `/admin/products` | JWT | admin | Crea producto |
| PATCH | `/admin/products/:id` | JWT | admin | Actualiza producto |
| PATCH | `/admin/products/:id/status` | JWT | admin | Activa/desactiva |
| PATCH | `/admin/products/:id/stock` | JWT | admin | Ajusta inventario |
| GET | `/admin/products/inventory/movements` | JWT | admin | Historial de inventario |
| GET | `/admin/access-test` | JWT | admin | Prueba de permisos (la usa `AdminDashboard`) |
| PATCH | `/auth/profile` | JWT | — | Actualiza nombre, teléfono y preferencias |
| POST | `/contact` | No | — | Envía mensaje desde el formulario público |
| GET | `/contact` | JWT | admin | Bandeja de mensajes (`unread` = sin leer) |
| PATCH | `/contact/:id/read` | JWT | admin | Marca un mensaje como leído |
| DELETE | `/contact/:id` | JWT | admin | Elimina un mensaje |
| POST | `/orders` | JWT | — | Crea pedido (revalida precios y stock en el servidor) |
| GET | `/orders/mine` | JWT | — | Pedidos del usuario |
| GET | `/orders` | JWT | admin | Todos los filtros por `status` |
| PATCH | `/orders/:id/status` | JWT | admin | `pendiente\|confirmado\|entregado\|cancelado` |
| POST | `/rentals` | JWT | — | Solicitud de alquiler (formato, fechas, total) |
| GET | `/rentals/mine` | JWT | — | Alquileres del usuario (con `ticketCode`) |
| GET | `/rentals` | JWT | admin | Bandeja de alquileres |
| PATCH | `/rentals/:id/status` | JWT | admin | `pending\|active\|completed\|cancelled` (+ pago) |
| POST | `/ai/assistant` | No | — | Asistente IA: `{message}` → `{reply}` |
| GET | `/admin/users` | JWT | admin | Usuarios + estadísticas |
| PATCH | `/admin/users/:id` | JWT | admin | Cambia `role` o `active` (no se puede auto-desactivar) |

> **Nota de inventario:** `stock` solo se modifica desde `PATCH /admin/products/:id/stock` (reponer/ajustar, con motivo), que además registra un `InventoryMovement`. El `POST /admin/products` no acepta `stock`: tras crear un producto hay que registrar su inventario.

---

## 7. Frontend explicado

### 7.1 Punto de entrada `src/main.jsx`

```jsx
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <AuthProvider>     {/* todo el árbol puede usar useAuth() */}
            <CartProvider> {/* y useCart() para el carrito */}
                <App />
            </CartProvider>
        </AuthProvider>
    </React.StrictMode>
);
```

Los estilos se importan aquí (`variables.css`, `global.css`, `features.css`, `responsive.css`, `auth.css`) para que apliquen a toda la app.

### 7.2 Rutas `src/routes/AppRouter.jsx`

```jsx
<Routes>
    <Route element={<MainLayout />}>              {/* Navbar + <Outlet/> + asistente */}
        <Route path="/" element={<Home />} />
        <Route path="/catalogo" element={<Catalog />} />
        <Route path="/catalogo/:id" element={<ProductDetail />} />
        <Route path="/iniciar-sesion" element={<Login />} />
        <Route path="/registro" element={<Register />} />
        <Route path="/contacto" element={<Contact />} />
        <Route path="/carrito" element={<Cart />} />
        <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/mis-alquileres" element={<ProtectedRoute><MyRentals /></ProtectedRoute>} />
        <Route path="/admin" element={
            <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
            </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
    </Route>
</Routes>
```

`ProtectedRoute` exige sesión (y rol si `allowedRoles`); el panel admin vive **dentro** del layout para conservar el Navbar y poder volver al sitio.

### 7.3 `services/api.js` — cliente HTTP

```js
const API_URL = import.meta.env.VITE_API_URL;

export async function apiRequest(endpoint, options = {}) {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers
            }
        });
        const data = response.status === 204 ? null : await response.json();
        if (!response.ok) throw new Error(data?.message || "Error en la solicitud");
        return data;
    } catch (error) {
        if (error instanceof TypeError) {   // fallo de red (backend apagado)
            throw new Error("No se pudo conectar con el servidor...",
                            { cause: error });
        }
        throw error;
    }
}
```

Puntos clave: **inyecta el JWT** si existe, traduce errores HTTP a mensajes legibles y distingue "el backend no responde" de "el backend respondió con error".

### 7.4 `context/AuthContext.jsx` — estado de sesión

```jsx
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(
        () => Boolean(localStorage.getItem("token"))   // sin token, no hay nada que cargar
    );

    useEffect(() => {                                  // al abrir la app
        if (!localStorage.getItem("token")) return;
        // llama a /auth/profile; si falla, borra el token inválido
        // ... setStates siempre después de await (nunca síncronos en el effect)
    }, []);

    const login    = async (credentials) => { /* POST /auth/login    → token + user */ };
    const register = async (userData)    => { /* POST /auth/register → token + user */ };
    const logout   = async ()            => { /* POST /auth/logout  → borra token */ };

    return <AuthContext.Provider value={{ user, loading,
        isAuthenticated: Boolean(user), login, register, logout }}>
        {children}
    </AuthContext.Provider>;
}

export function useAuth() { /* hook que lanza error si no hay AuthProvider */ }
```

**Flujo:**

1. Al recargar la página, el token sigue en `localStorage`; el efecto llama a `/auth/profile` para validarlos y restaurar la sesión.
2. Si el token expiró, la petición falla → se borra el token → `user = null`.
3. `loading` arranca `true` solo si había token; así `ProtectedRoute` espera antes de redirigir.

### 7.5 `components/common/ProtectedRoute.jsx` — guardian de rutas

```jsx
if (loading) return <div>Verificando permisos...</div>;
if (!isAuthenticated) return <Navigate to="/iniciar-sesion" replace />;
if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role))
    return <Navigate to="/" replace />;
return children;
```

Tres estados: esperando, sin sesión (→ login), con sesión pero rol equivocado (→ home).

### 7.6 `pages/Login.jsx` y `pages/Register.jsx`

Ambos formularios son **controlados** con `useState`:

```jsx
const handleSubmit = async (event) => {
    event.preventDefault();          // evita el submit tradicional de HTML
    setError(""); setLoading(true);
    try {
        await login({ email: formData.email.trim(), password: formData.password });
        navigate("/");               // sesión iniciada → al inicio
    } catch (err) {
        setError(err.message || "No fue posible iniciar sesión.");
    } finally {
        setLoading(false);
    }
};
```

- **Validaciones de registro** (antes de llamar al backend): campos obligatorios, contraseña 8–72 caracteres, coincidencia de contraseñas.
- **Botón deshabilitado** mientras `loading` (evita dobles envíos).
- **Mostrar/ocultar contraseña** con `type={showPassword ? "text" : "password"}`.
- Errores del backend se pintan en `<div className="auth-error">`.

### 7.7 `components/Navbar.jsx` — navegación dinámica

```jsx
const { user, isAuthenticated, logout } = useAuth();

{isAuthenticated ? (
    <>
        <span>Hola, {user?.name?.split(" ")[0]}</span>
        {user?.role === "admin" && <Link to="/admin">Panel administrativo</Link>}
        <button onClick={handleLogout}>Cerrar sesión</button>
    </>
) : (
    <>
        <Link to="/iniciar-sesion">Iniciar sesión</Link>
        <Link to="/registro">Registrarse</Link>
    </>
)}
```

`handleLogout` espera el cierre del backend en `finally` y luego navega a `/` (la UI se actualiza sola porque `AuthProvider` cambió `user`).

### 7.8 Catálogo end-to-end (`pages/Catalog.jsx`)

El componente **dueña de los datos**: mantiene `products`, `pagination`, `loading`, `error`, `selectedCategory`, `searchQuery` y `page`.

```jsx
useEffect(() => {
    let cancelled = false;                      // evita escribir estado tras desmontar
    const loadProducts = async () => {
        setLoading(true); setError(null);
        const params = new URLSearchParams({ page: String(page), limit: "12", sort: "newest" });
        if (selectedCategory) params.append("type", selectedCategory);
        if (searchQuery) params.append("search", searchQuery);
        try {
            const data = await apiRequest(`/products?${params}`);
            if (!cancelled) { setProducts(data.products || []);
                              setPagination(data.pagination || null); }
        } catch (err) { if (!cancelled) setError(err.message); }
        finally { if (!cancelled) setLoading(false); }
    };
    const timer = window.setTimeout(loadProducts, 300);   // debounce de la búsqueda
    return () => { cancelled = true; window.clearTimeout(timer); };
}, [selectedCategory, searchQuery, page]);     // ← re-fetch al cambiar filtro/búsqueda/página
```

**Recorrido de un clic en "Ver producto":**

1. `CategoryFilter` llama `onCategoryChange("coffee")` → `setSelectedCategory` y `setPage(1)`.
2. El efecto se re-ejecuta (con debounce de 300 ms) → `GET /api/products?type=coffee&page=1`.
3. `ProductGrid` recibe `products/loading/error` como **props** (componente presentacional) y, mientras carga, pinta 6 `ProductCardSkeleton`.
4. `ProductCard` renderiza un `<Link to={/catalogo/${product._id}}>` → React Router navega al detalle.
5. `pages/ProductDetail.jsx` carga `GET /api/products/:id` (`services/products.js → getProduct`), ofrece formatos, cantidad, **agregar al carrito** y, si es libro con alquiler, el formulario de fechas.

La paginación se controla con `pagination.hasPreviousPage/hasNextPage`; el botón "Limpiar" reinicia búsqueda y página.

### 7.9 `components/catalog/ProductCard.jsx` — tarjeta de producto

```jsx
const image = product.image || product.imageUrl || "/ProductoNoDisponible.png";

<img src={image} alt={product.name}
     onError={(e) => { e.currentTarget.onerror = null;
                       e.currentTarget.src = "/ProductoNoDisponible.png"; }} />

<p>{Number(product.price).toLocaleString("es-CO",
      { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</p>
```

- El `onError` del `<img>` cubre URLs rotas (no solo campos vacíos).
- Los precios se formatean con `utils/format.js → formatCOP()` (`toLocaleString("es-CO")` → `$ 12.000`).
- El botón **"Añadir +"** usa `useCart().addItem(product, 1, format)`: si el producto tiene un solo formato se usa ese; si no, `null`. Devuelve `{ ok, message }` que la tarjeta muestra como micro-feedback durante 2.5 s.

### 7.10 `components/home/FeaturedProducts.jsx` — destacados del home

```jsx
getFeaturedProducts(3)          // services/products.js → GET /products?featured=true&limit=3
    .then(items => setProducts(items))
    .catch(() => setProducts([]))
    .finally(() => setLoading(false));
```

Muestra 3 productos marcados como `featured: true`; si la API falla, muestra "Pronto mostraremos nuestros favoritos".

### 7.11 `services/products.js` — capa de datos del catálogo

```js
export async function getProducts(params = {}) {
    const data = await apiRequest(`/products${buildQuery(params)}`);
    return { products: data.products || [], pagination: data.pagination || null };
}
export async function getFeaturedProducts(limit = 3) {
    const { products } = await getProducts({ featured: true, limit, sort: "newest" });
    return products;
}
```

`buildQuery` omite los parámetros vacíos para no generar `?type=&page=`.

### 7.12 `pages/AdminDashboard.jsx` — panel con pestañas

```jsx
const TABS = ["productos", "pedidos", "alquileres", "mensajes", "usuarios"];

useEffect(() => {
    const timer = window.setTimeout(async () => {
        // verifica en vivo que el token pertenece a un admin
        apiRequest("/admin/access-test").then(r => setAccessMessage(r.message))
                                        .catch(e => setAccessError(e.message));
    }, 0);
    return () => window.clearTimeout(timer);
}, []);

{activeTab === "productos" && <AdminProducts />}
{activeTab === "pedidos"    && <AdminOrders />}
// ...
```

Cada pestaña es un componente autosuficiente (`pages/admin/*.jsx`) que carga sus datos con `useCallback + useEffect` (el `setTimeout(..., 0)` evita el lint `react-hooks/set-state-in-effect`) y ofrece:

| Pestaña | Acciones |
|---------|----------|
| `AdminProducts` | buscar, crear, editar, activar/desactivar, registrar inventario (reponer/ajustar) |
| `AdminOrders` | filtrar por estado y cambiar `pendiente → confirmado → entregado/cancelado` |
| `AdminRentals` | filtrar y cambiar estado de los alquileres |
| `AdminMessages` | bandeja con contador de no leídos, marcar leído, eliminar |
| `AdminUsers` | estadísticas, filtrar por rol, cambiar rol y activar/desactivar (con bloqueo de auto-desactivación) |

---

## 8. Pruebas realizadas (verificadas hoy)

### 8.1 Pruebas automáticas del backend

```bash
cd magical-books-cafe/backend
npm test           # scripts/smokeTest.js   → 17 pruebas (API pública + seguridad)
npm run test:admin # scripts/adminSmokeTest.js → 19 pruebas (flujos administrativos)
```

**Resultado actual: 17 + 19 = 36 pruebas, 0 fallidas.**

Cobertura de `npm test` (smoke):

| # | Prueba | Resultado |
|---|--------|-----------|
| 1 | `GET /api/health` | `success: true`, `database: MongoDB Atlas` |
| 2 | `GET /api/products` (+ `?type=coffee`) | paginación y filtros OK |
| 3 | `POST /auth/register` + `login` + `GET profile` | token y sesión OK |
| 4 | `PATCH /auth/profile` (preferencias) | guarda `favoriteGenres` |
| 5 | `POST /contact` | mensaje creado (201) |
| 6 | `POST /ai/assistant` | responde con `reply` |
| 7 | `POST /rentals` + `GET /rentals/mine` | alquiler con `ticketCode` |
| 8 | `POST /orders` + `GET /orders/mine` | pedido con `total` numérico |
| 9 | `GET /admin/users` y `/admin/products` como cliente | **403** |
| 10 | `POST /auth/logout` y petición posterior | **401** (token revocado) |

Cobertura de `npm run test:admin`:

| # | Prueba | Resultado |
|---|--------|-----------|
| 1 | Registro + promoción a admin + login | token admin |
| 2 | `GET /admin/users` (lista + estadísticas) | 200 |
| 3 | `PATCH /admin/users/:id` (rol staff → customer) | 200 |
| 4 | Auto-desactivación del admin | **400** "No puedes desactivar tu propia cuenta." |
| 5 | Pedido del cliente → bandeja admin → `status: confirmado` | 200 |
| 6 | `POST /contact` → bandeja → `read` → `DELETE` | 201/200 |
| 7 | `GET /rentals` (bandeja admin) | 200 |
| 8 | Rutas admin sin token (401) y como cliente (403) | correcto |

### 8.2 Verificación manual y de calidad

| # | Prueba | Resultado |
|---|--------|-----------|
| 1 | `GET /api/health` | `success: true`, `database: MongoDB Atlas` |
| 2 | CORS con `Origin: http://localhost:5173` | `Access-Control-Allow-Origin` correcto |
| 3 | `npm run lint` (frontend) | **0 problemas** |
| 4 | `npm run build` (frontend) | build OK (CSS ~31 kB, JS ~328 kB) |
| 5 | Módulos nuevos servidos por Vite (`/src/pages/...`) | 16/16 transformados sin error |
| 6 | `node --check` sobre `src/` y `scripts/` del backend | sintaxis OK |

---

## 9. Problemas conocidos y solución

### 9.1 "Could not connect to any servers in your MongoDB Atlas cluster"

**Causa:** la IP de tu equipo no está en el whitelist de Atlas. Tu **IP pública cambia** con el tiempo (ej. de `38.210.186.75` a `191.156.246.38`).

**Solución:** Atlas → Security → Network Access → Add IP → `0.0.0.0/0` (todo el tiempo en desarrollo). Si prefieres restringir, tendrás que agregar la IP cada vez que cambie.

### 9.2 El backend no arranca y sale `exit(1)`

**Causas típicas:** falta `MONGODB_URI`, la URI no alcanza Atlas, o no existe `JWT_SECRET`.

### 9.3 El frontend no conecta con la API

1. ¿Está el backend en el puerto de `VITE_API_URL`? (el backend usa **5000**).
2. ¿`VITE_API_URL` termina en `/api`?
3. ¿El frontend corre en el puerto de `FRONTEND_URL` (5173)? Si no, CORS lo rechazará.
4. Después de editar `.env` del frontend hay que **reiniciar Vite**.

### 9.4 Lint de React (`npm run lint`)

Se corrigieron 5 errores heredados del avance del equipo:

| Archivo | Problema | Corrección |
|---------|----------|-----------|
| `AuthContext.jsx` | `setLoading(false)` síncrono dentro del `useEffect` | `loading` se inicializa con `Boolean(localStorage.getItem("token"))` y el early-return ya no escribe estado |
| `AuthContext.jsx` | `catch (error)` sin usar | `catch {` |
| `AuthContext.jsx` | exporta componente + hook (fast refresh) | `eslint-disable-next-line` en `useAuth` |
| `Login.jsx` | `const data` sin usar | `await login(...)` directo |
| `api.js` | `throw` sin `cause` | `new Error(msg, { cause: error })` |

### 9.5 Incompatibilidad `image` vs `imageUrl`

El backend devuelve `image`; el `ProductCard` del equipo buscaba `imageUrl` y siempre caía al placeholder. Se corrigió para leer ambos: `product.image || product.imageUrl || fallback`.

### 9.6 Documentación desactualizada en el repo

`DOCUMENTACION_PROYECTO.md` menciona rutas `/login` y `/register`, pero las rutas reales son `/iniciar-sesion` y `/registro`. También `AGENTS.md` indica `VITE_API_URL=http://localhost:5000` sin `/api` (incorrecto).

### 9.7 `POST /orders` respondía 409 "Stock insuficiente"

**Causa:** el seed original no fijaba `stock`, así que los 7 productos quedaron con `stock: 0` (el esquema lo pone en 0 por defecto) y la revalidación del servidor los consideraba agotados.

**Solución:** `scripts/seedProducts.js` ahora fija stock de ejemplo (cafés 50, postres 30, libros 4-5, servicio 100) y aplica **upsert por SKU** (`Product.updateOne({ sku }, { $set }, { upsert: true })`), por lo que `npm run seed` actualiza los productos ya sembrados en lugar de omitirse.

### 9.8 El backend "no responde" aunque el proceso existe

**Síntoma:** `npm test` devuelve "La ruta solicitada no existe." para rutas nuevas, o `Invoke-WebRequest` no conecta.

**Diagnóstico:**

```powershell
Get-NetTCPConnection -LocalPort 5000 -State Listen   # → ¿quién escucha?
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Select ProcessId, CommandLine
```

A veces quedan **varios** procesos `node src\server.js` de ejecuciones anteriores y ninguno ligado al puerto. **Solución:** terminar los obsoletos (`Stop-Process -Id <pid> -Force`), relanzar `node src\server.js` y esperar ~6 s a que conecte Atlas; verificar con `GET /api/health`.

### 9.9 Lint `react-hooks/set-state-in-effect` en las pestañas admin

Las 5 pestañas admin llamaban `loadX()` directamente dentro de `useEffect`, y `loadX` empieza con `setLoading(true)` **síncrono**. Corregido con un desfase de un ciclo:

```jsx
useEffect(() => {
    const timer = window.setTimeout(loadProducts, 0);
    return () => window.clearTimeout(timer);
}, [loadProducts]);
```

Además, en Windows PowerShell `Set-Content` sin `-Encoding` usa ANSI y corrompe los archivos UTF-8: **siempre** `-Encoding UTF8` (o las tildes/ñ quedan mal y fallan los `node --check`).

---

## 10. Cambios locales (NO se suben al Git)

Regla del equipo: **ningún cambio nuestro se commitea ni se pushea**. Todo queda en esta máquina y documentado aquí.

| Archivo | Cambio |
|---------|--------|
| `backend/.env` | Credenciales reales (gitignored) |
| `backend/.env.example` | Restaurado con placeholders (sin secretos) |
| `backend/src/utils/productValidators.js` | Acepta `image` (y alias `imageUrl`) en create/update |
| `backend/src/controllers/productController.js` | Persiste `image` en create y update |
| `backend/src/models/Product.js` | Typo `maxlenght` → `maxlength` |
| `backend/src/models/Rental.js` | Enum de `format` ampliado con `"fisico"` |
| `backend/src/models/ContactMessage.js`, `Order.js` | Nuevos (mensajes y pedidos) |
| `backend/src/controllers/contactController.js` | CRUD de la bandeja de mensajes |
| `backend/src/controllers/rentalController.js` | Alquileres (cliente + admin) |
| `backend/src/controllers/orderController.js` | Pedidos con revalidación de precios/stock |
| `backend/src/controllers/aiController.js` | Asistente IA con motor local + OpenAI opcional |
| `backend/src/controllers/adminUserController.js` | Lista/edita usuarios (roles y estado) |
| `backend/src/controllers/authController.js` | `updateProfile` (nombre, teléfono, preferencias) |
| `backend/src/routes/contactRoutes.js`, `rentalRoutes.js`, `orderRoutes.js`, `aiRoutes.js` | Nuevas rutas |
| `backend/src/routes/adminRoutes.js` | `GET /users`, `PATCH /users/:id` |
| `backend/src/routes/authRoutes.js` | `PATCH /profile` con validación |
| `backend/src/app.js` | Monta las 4 rutas nuevas |
| `backend/scripts/seedProducts.js` | Upsert por SKU + stock de ejemplo + imágenes de referencia (Unsplash) |
| `backend/scripts/promoteAdmin.js` | `npm run promote-admin <correo>` |
| `backend/scripts/smokeTest.js` | 17 pruebas (`npm test`) |
| `backend/scripts/adminSmokeTest.js` | 19 pruebas (`npm run test:admin`) |
| `backend/package.json` | Scripts `test`, `test:admin`, `promote-admin`, `check` |
| `frontend/.env.example` | Plantilla con el puerto 5000 |
| `frontend/src/context/CartContext.jsx` | Carrito persistente (nuevo) |
| `frontend/src/context/AuthContext.jsx` | Fix lint + `updateUser` |
| `frontend/src/services/products.js` | Capa de datos + `getProduct(id)` |
| `frontend/src/utils/format.js` | Formato COP/fechas y etiquetas (nuevo) |
| `frontend/src/pages/Contact.jsx`, `ProductDetail.jsx`, `Cart.jsx`, `Profile.jsx`, `MyRentals.jsx` | Nuevas páginas (el detalle público ya no muestra el SKU; sigue visible en el panel admin) |
| `frontend/src/pages/admin/*.jsx` | 5 pestañas del panel admin |
| `frontend/src/pages/AdminDashboard.jsx` | Reescrito con pestañas |
| `frontend/src/pages/Catalog.jsx` | Búsqueda, paginación y navegación al detalle |
| `frontend/src/components/catalog/ProductCard.jsx` | Link al detalle + añadir al carrito |
| `frontend/src/components/catalog/ProductGrid.jsx` | Skeletons de carga |
| `frontend/src/components/common/Skeleton.jsx` | Esqueletos reutilizables (nuevo) |
| `frontend/src/components/ai/AssistantWidget.jsx` | Widget flotante del asistente (nuevo) |
| `frontend/src/components/Navbar.jsx` | Carrito con contador, contacto, perfil, alquileres |
| `frontend/src/components/common/Footer.jsx` | Footer de 4 columnas (marca, explorar, cuenta, horario) + estilos nuevos en `global.css` |
| `frontend/src/layouts/MainLayout.jsx` | Incluye el asistente IA |
| `frontend/src/routes/AppRouter.jsx` | 6 rutas nuevas (detalle, contacto, carrito, perfil, alquileres, admin en layout) |
| `frontend/src/styles/features.css` | Estilos de todo lo nuevo |
| `NOTAS.md` | Notas de avance |
| `docs/GUIA_DESARROLLO.md/.docx` | Esta documentación |
| `docs/PRESENTACION_PROYECTO.md/.docx` | Documento de presentación |

---

## 11. Trabajo pendiente (quedó fuera del alcance)

1. **Imágenes de productos:** el catálogo aún muestra `ProductoNoDisponible.png`; hace falta subir fotos o guardar URLs en `image`.
2. **Proveedor de IA en producción:** el asistente funciona con el motor local; para respuestas abiertas se debe configurar `AI_API_KEY`/`AI_MODEL` en `backend/.env`.
3. **Despliegue:** por ahora solo corre en local (Vite :5173 + Express :5000 + Atlas).
4. **Pruebas de frontend:** hoy solo hay pruebas de API; se podría agregar Vitest + Testing Library.
5. **`DOCUMENTACION_PROYECTO.md` y `AGENTS.md`:** mantenerlos al día con las rutas reales (9.6).

---

## 12. Las 15 funcionalidades implementadas

| # | Funcionalidad | Dónde está | Cómo se verifica |
|---|---------------|-----------|------------------|
| 1 | Formulario de contacto público con validación en vivo | `pages/Contact.jsx` → `POST /api/contact` | `npm test` (prueba 5) |
| 2 | Bandeja de mensajes admin (leer/eliminar, contador de no leídos) | `pages/admin/AdminMessages.jsx` → `GET/PATCH/DELETE /api/contact` | `npm run test:admin` |
| 3 | Panel administrativo real con 5 pestañas | `pages/AdminDashboard.jsx` + `pages/admin/*` | rol `admin` en `/admin` |
| 4 | Gestión de usuarios y roles con protección de auto-desactivación | `pages/admin/AdminUsers.jsx` → `/api/admin/users` | `npm run test:admin` |
| 5 | CRUD de productos + activar/desactivar + inventario con historial | `pages/admin/AdminProducts.jsx` → `/api/admin/products*` | `npm test` + prueba admin |
| 6 | Pedidos con revalidación de precios y stock en el servidor | `pages/Cart.jsx` → `POST /api/orders` | `npm test` (prueba 8) |
| 7 | Carrito persistente con control de stock | `context/CartContext.jsx` (localStorage) | contador del Navbar + checkout |
| 8 | Perfil editable (nombre, teléfono, preferencias) + historial de pedidos | `pages/Profile.jsx` → `PATCH /auth/profile`, `GET /orders/mine` | `npm test` (prueba 4) |
| 9 | Alquiler de libros (formato, fechas, total, comprobante) | `pages/ProductDetail.jsx` → `POST /api/rentals` | `npm test` (prueba 7) |
| 10 | Mis alquileres con código de ticket y estados | `pages/MyRentals.jsx` → `GET /rentals/mine` | `npm test` |
| 11 | Gestión de alquileres y pedidos por el admin | `AdminRentals/AdminOrders.jsx` → `PATCH .../status` | `npm run test:admin` |
| 12 | Asistente IA contextual (motor local + OpenAI opcional) | `components/ai/AssistantWidget.jsx` → `POST /api/ai/assistant` | `npm test` (prueba 6) |
| 13 | Catálogo completo: búsqueda, filtros, paginación, detalle como ruta e imágenes de referencia en internet | `pages/Catalog.jsx`, `/catalogo/:id` | Vite sirve los 16 módulos OK |
| 14 | UX: skeletons, validaciones en vivo, feedback visual, footer renovado y responsive | `Skeleton.jsx`, `Footer.jsx`, `styles/features.css` | `npm run lint` (0) + `npm run build` |
| 15 | Calidad y documentación (guía, presentación, pruebas automáticas) | `scripts/*Test.js`, `docs/*` | 36 pruebas + esta guía |

---

*Documento generado el 9 de noviembre de 2026 y actualizado el 10 de noviembre de 2026. Se actualiza con cada avance; la fuente en Markdown está en `magical-books-cafe/docs/GUIA_DESARROLLO.md`.*
