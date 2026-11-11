# Magical Books Café

Aplicación web para un café literario: catálogo (cafés, postres, libros, servicios), carrito de compras, alquiler de libros, contacto, asistente IA y panel administrativo con roles.

| Paquete | Tecnología | Puerto |
|---------|-----------|--------|
| `backend/` | Node.js + Express 5 + Mongoose (MongoDB Atlas) | 5000 |
| `frontend/` | React 19 + Vite + React Router DOM | 5173 |

No hay `package.json` en la raíz: **cada paquete se instala y ejecuta en su propia carpeta**.

---

## Arranque rápido

```bash
# 1) Backend: crear backend/.env a partir de .env.example (ver docs/GUIA_DESARROLLO.md)
cd backend
npm install
npm run seed        # 7 productos de ejemplo con stock
npm run dev         # http://localhost:5000

# 2) Frontend (otra terminal)
cd frontend
npm install
npm run dev         # http://localhost:5173
```

`frontend/.env` debe contener:

```env
VITE_API_URL=http://localhost:5000/api
```

> La base **debe** incluir `/api`: el cliente concatena `VITE_API_URL + endpoint`.

---

## Scripts útiles

### Backend (`cd backend`)

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor con recarga (nodemon) |
| `npm start` | Servidor en modo producción |
| `npm run seed` | Crea/actualiza los productos de ejemplo (upsert por SKU) |
| `npm run promote-admin <correo>` | Promueve un usuario a rol `admin` |
| `npm test` | 17 pruebas de humo de la API |
| `npm run test:admin` | 19 pruebas de los flujos administrativos |
| `npm run check` | Verifica sintaxis de `src/server.js` y `src/app.js` |

### Frontend (`cd frontend`)

| Comando | Qué hacer |
|---------|-----------|
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run lint` | ESLint (0 problemas) |
| `npm run build` | Build de producción (`dist/`) |

---

## Rutas de la aplicación

| Ruta | Contenido | Acceso |
|------|-----------|--------|
| `/` | Inicio | público |
| `/catalogo` | Catálogo con búsqueda, filtros y paginación | público |
| `/catalogo/:id` | Ficha de producto (compra y alquiler) | público |
| `/contacto` | Formulario de contacto | público |
| `/iniciar-sesion`, `/registro` | Autenticación | público |
| `/carrito` | Carrito y confirmación de pedido | público (envío con sesión) |
| `/perfil` | Datos, preferencias y pedidos | sesión |
| `/mis-alquileres` | Alquileres con código de ticket | sesión |
| `/admin` | Panel: productos, pedidos, alquileres, mensajes, usuarios | rol `admin` |

---

## Documentación

- **`docs/GUIA_DESARROLLO.md` / `.docx`** — guía técnica completa: configuración, arquitectura, endpoints, pruebas y problemas conocidos.
- **`docs/PRESENTACION_PROYECTO.md` / `.docx`** — presentación del avance y evidencias.
- **`docs/Contexto/`** — reglas del negocio y contexto del emprendimiento.
- **`AGENTS.md`** — notas para asistentes de código.

Para regenerar los DOCX:

```bash
python scripts/md_a_docx.py docs/GUIA_DESARROLLO.md docs/GUIA_DESARROLLO.docx
python scripts/md_a_docx.py docs/PRESENTACION_PROYECTO.md docs/PRESENTACION_PROYECTO.docx
```

---

## Seguridad y secretos

- `backend/.env` contiene credenciales reales y está en `.gitignore`: **nunca se sube**. `.env.example` solo lleva placeholders.
- Autenticación con JWT (revocación de tokens en logout), roles `customer / admin / staff`, bcrypt en contraseñas, Helmet, CORS restringido al frontend y rate limiting.

> **Regla del equipo:** desde esta máquina **no se hacen commits ni pushes**; todo el avance queda local y documentado en `docs/`.
