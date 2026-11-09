# Documentación del Proyecto — Magical Books Café

> Este archivo se va actualizando a medida que se avanza en la unión del backend con el frontend y en la construcción de nuevas funcionalidades.

---

## 1. Descripción general

**Magical Books Café** es una aplicación web con dos partes independientes:

- **Backend:** Node.js + Express + Mongoose (MongoDB). ESM (`"type": "module"`).
- **Frontend:** React + Vite + React Router DOM.

No hay un `package.json` en la raíz ni workspaces; cada paquete se instala y ejecuta en su propia carpeta.

---

## 2. Estructura de carpetas

```
JOVENES_CREATIVOS2026/               <- carpeta general (raíz)
├── DOCUMENTACION_PROYECTO.md        <- este archivo
├── magical-books-cafe/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── server.js            # Entrada: conecta MongoDB y arranca Express
│   │   │   ├── app.js               # Config Express, CORS, rutas y manejo de errores
│   │   │   ├── config/database.js   # Conexión a MongoDB Atlas
│   │   │   ├── routes/              # Rutas de la API
│   │   │   ├── controllers/         # Lógica de controladores
│   │   │   ├── middlewares/         # Autenticación y roles
│   │   │   ├── models/              # Modelos de Mongoose
│   │   │   └── utils/               # Validadores
│   │   ├── .env                     # Variables de entorno del backend
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── main.jsx             # Punto de entrada de React
│       │   ├── App.jsx              # Componente raíz
│       │   ├── routes/AppRouter.jsx # Definición de rutas del frontend
│       │   ├── services/api.js      # Cliente fetch con VITE_API_URL
│       │   ├── context/AuthContext.jsx # Contexto de autenticación (login, register, logout, profile)
│       │   ├── pages/               # Home, Catalog, Login, Register, NotFound
│       │   ├── components/          # Navbar, ProductGrid, ProductCard, etc.
│       │   └── context/ProtectedRoute.jsx # Ruta protegida (no usada aún)
│       ├── .env                     # Variables de entorno del frontend
│       └── package.json
```

---

## 3. Endpoints del backend (base `/api`)

| Método | Ruta | Descripción | ¿Requiere auth? | ¿Requiere rol admin? |
|--------|------|-------------|-----------------|----------------------|
| GET | `/api/health` | Salud de la API | No | No |
| POST | `/api/auth/register` | Registrar usuario | No | No |
| POST | `/api/auth/login` | Iniciar sesión | No | No |
| GET | `/api/auth/profile` | Perfil del usuario autenticado | Sí (JWT) | No |
| POST | `/api/auth/logout` | Cerrar sesión (revoca token) | Sí (JWT) | No |
| GET | `/api/products` | Catálogo público paginado | No | No |
| GET | `/api/products/:id` | Detalle de un producto público | No | No |
| GET | `/api/admin/products` | Listar productos (incluidos inactivos) | Sí | Sí |
| POST | `/api/admin/products` | Crear producto | Sí | Sí |
| PATCH | `/api/admin/products/:id` | Actualizar producto | Sí | Sí |
| PATCH | `/api/admin/products/:id/status` | Activar / desactivar producto | Sí | Sí |
| PATCH | `/api/admin/products/:id/stock` | Ajustar inventario | Sí | Sí |
| GET | `/api/admin/products/inventory/movements` | Historial de movimientos de inventario | Sí | Sí |
| GET | `/api/admin/access-test` | Prueba de acceso administrativo | Sí | Sí |

---

## 4. Rutas del frontend (React Router)

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/` | `Home` | Página de inicio |
| `/catalogo` | `Catalog` | Catálogo público de productos |
| `*` | `NotFound` | Página no encontrada |
| *(en progreso)* `/login` | `Login` | Formulario de inicio de sesión (en desarrollo — Paso 1) |
| *(en progreso)* `/register` | `Register` | Formulario de registro (en desarrollo — Paso 1) |

---

## 5. Funcionalidades implementadas (estado actual)

### Backend
- Servidor Express corriendo (puerto 5000 por defecto).
- Conexión a MongoDB Atlas funcionando.
- Rutas de autenticación (registro, login, perfil, logout) con JWT.
- Rutas públicas de productos (listar paginado, detalle por ID).
- Rutas de administración de productos (CRUD, activar/desactivar, ajuste de stock, historial de movimientos).
- Middlewares de autenticación y autorización por roles (`customer`, `admin`, `staff`).
- CORS configurado para recibir peticiones del frontend (`FRONTEND_URL`).
- Manejo centralizado de errores.

### Frontend
- Aplicación React con Vite.
- Navegación con React Router (`/`, `/catalogo`, `404`).
- Servicio `api.js` que hace `fetch` a `VITE_API_URL + endpoint` y inyección del token JWT desde `localStorage`.
- `AuthContext` con funciones `login`, `register`, `logout` y carga automática del perfil al iniciar.
- Página `Catalog` que ya consume `GET /api/products` y muestra productos.
- Componentes de catálogo (`ProductGrid`, `ProductCard`, `CategoryFilter`).
- Páginas `Login` y `Register` existen pero están **vacías** (0 líneas de código).

### Unión backend → frontend (parcial)
- `VITE_API_URL=http://localhost:5000/api` configurado en `frontend/.env`.
- Las llamadas del frontend resuelven correctamente hacia el backend (ej. `/auth/login` → `http://localhost:5000/api/auth/login`).
- El catálogo ya muestra productos obtenidos del backend.

---

## 6. Requisitos previos antes de empezar

1. **Node.js y npm** instalados.
2. **MongoDB** corriendo y accesible (la conexión ya está configurada en `backend/.env` y funciona).
3. Dependencias instaladas en ambas carpetas:
   - `cd magical-books-cafe/backend && npm install`
   - `cd magical-books-cafe/frontend && npm install`
4. Archivos `.env` creados y configurados:
   - `backend/.env`: `PORT`, `MONGODB_URI`, `FRONTEND_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`
   - `frontend/.env`: `VITE_API_URL=http://localhost:5000/api`

---

## 7. Plan paso a paso para unir backend y frontend

> Cada paso indica **qué hacer**, **por qué se hace** y **qué se espera obtener**. Tú ejecutas los cambios manualmente; yo solo te guío.

### Paso 0 — Verificación del estado actual
Objetivo: confirmar que backend y frontend levantan por separado y que el catálogo ya consume datos del backend.

1. Iniciar el backend: `npm run dev` (o `npm start`) dentro de `magical-books-cafe/backend`.
2. Abrir el navegador en `http://localhost:5000/api/health`. Debe responder con JSON indicando que la API funciona y la base de datos está conectada.
3. Iniciar el frontend: `npm run dev` dentro de `magical-books-cafe/frontend`.
4. Abrir `http://localhost:5173/catalogo`. Debe mostrarse el catálogo con productos cargados desde el backend.
5. Revisar los archivos:
   - `frontend/src/App.jsx`
   - `frontend/src/main.jsx`
   - `frontend/src/components/Navbar.jsx`
   - `frontend/src/pages/Login.jsx` (vacío)
   - `frontend/src/pages/Register.jsx` (vacío)
   - `frontend/src/routes/AppRouter.jsx`

### Paso 1 — Completar páginas de autenticación
Objetivo: que el usuario pueda crear cuenta e iniciar sesión desde la interfaz.

1. Editar `frontend/src/pages/Login.jsx`: crear un formulario con email y contraseña que llame a `login()` de `AuthContext`.
2. Editar `frontend/src/pages/Register.jsx`: crear un formulario con nombre, email y contraseña que llame a `register()` de `AuthContext`.
3. Ambos deben manejar estados de carga, errores y redirigir al catálogo o al home tras éxito.

### Paso 2 — Agregar rutas `/login` y `/register`
Objetivo: que el frontend tenga navegación a las páginas de autenticación.

1. Editar `frontend/src/routes/AppRouter.jsx`.
2. Importar `Login` y `Register`.
3. Agregar `<Route path="/login" element={<Login />} />` y `<Route path="/register" element={<Register />} />`.

### Paso 3 — Envolver la app en `AuthProvider`
Objetivo: que el estado de autenticación esté disponible en toda la aplicación.

1. Revisar `frontend/src/main.jsx` o `frontend/src/App.jsx`.
2. Asegurar que `<AuthProvider>` envuelva a `<AppRouter />` (o a los componentes que usen `useAuth`).

### Paso 4 — Actualizar `Navbar`
Objetivo: reflejar el estado de autenticación en la navegación.

1. Editar `frontend/src/components/Navbar.jsx`.
2. Usar `useAuth()` para saber si hay usuario.
3. Mostrar:
   - "Iniciar sesión" / "Registrarse" cuando no hay sesión.
   - Nombre de usuario y "Cerrar sesión" cuando hay sesión activa.

### Paso 5 — Probar flujo completo
Objetivo: validar que backend y frontend están unidos y funcionan juntos.

1. Registrar un usuario nuevo desde el frontend.
2. Iniciar sesión con ese usuario.
3. Verificar que se guarda el token y se carga el perfil.
4. Navegar al catálogo y ver productos.
5. Cerrar sesión y verificar que se limpia el token y la UI se actualiza.

### Paso 6 — (Después) Rutas protegidas y administración
Objetivo: seguir construyendo el producto final.

1. Conectar `ProtectedRoute.jsx` en las rutas que lo requieran.
2. Crear vistas de administración para crear/editar productos y ver movimientos de inventario.
3. Validar roles (`admin`, `staff`, `customer`) en la UI.

---

## 8. Notas importantes

- **CORS:** el backend acepta peticiones desde `FRONTEND_URL` (por defecto `http://localhost:5173`). Si cambias el puerto del frontend, actualiza `backend/.env`.
- **Prefijo `/api`:** el backend sirve todas las rutas bajo `/api/...`. El servicio `api.js` ya concatena `VITE_API_URL` (que incluye `/api`) con el endpoint, así que no duplicar el `/api` en los llamados del frontend.
- **MongoDB:** si no está corriendo, el backend termina con `process.exit(1)` al iniciar.
- **JWT_SECRET:** es obligatorio en `backend/.env`; sin él, el registro y login fallarán.

---

*Este documento se actualizará a medida que se completen los pasos y se agreguen nuevas funcionalidades.*