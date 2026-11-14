# Chatbot IA — Documentación técnica

> Explicación paso a paso del código y la lógica del asistente de Magical Books Café.
> Cada sección referencia el archivo y las líneas exactas para que puedas seguir el código mientras lees.

---

## Índice

1. [Descripción general](#1-descripción-general)
2. [Arquitectura y flujo de un mensaje](#2-arquitectura-y-flujo-de-un-mensaje)
3. [Los archivos que componen el chatbot](#3-los-archivos-que-componen-el-chatbot)
4. [Frontend: `AssistantWidget.jsx`](#4-frontend-assistantwidgetjsx)
5. [Endpoint: `aiRoutes.js`](#5-endpoint-airoutesjs)
6. [Controlador: `aiController.js`](#6-controlador-aicontrollerjs)
7. [Base de conocimiento: `assistantKnowledge.js`](#7-base-de-conocimiento-assistantknowledgejs)
8. [Modo local vs. modo IA](#8-modo-local-vs-modo-ia)
9. [Seguridad en tres capas](#9-seguridad-en-tres-capas)
10. [Trazas de ejecución](#10-trazas-de-ejecución)
11. [Cómo probarlo](#11-cómo-probarlo)
12. [Limitaciones y mejoras futuras](#12-limitaciones-y-mejoras-futuras)

---

## 1. Descripción general

El chatbot es un **asistente contextual** que vive en una esquina de la web y responde preguntas
sobre el negocio: horarios, precios, catálogo, alquileres, experiencias y formas de pago.

Su característica principal es que **no depende obligatoriamente de una API externa**. Tiene dos
modos de respuesta que funcionan de forma intercambiable:

| Modo | Cuándo se usa | Qué necesita |
|------|---------------|--------------|
| **Motor local** | Siempre está disponible; es el modo por defecto | Nada: solo Node.js y la base de datos |
| **Proveedor IA (OpenAI)** | Solo si existe la variable `AI_API_KEY` en `backend/.env` | Una llave de API y conexión a internet |

Si el proveedor IA falla (sin internet, llave inválida, límite de cuota), el sistema **cae
automáticamente al motor local** y el usuario nunca ve un error.

Otra decisión de diseño importante: el asistente **nunca consulta información privada**. Tiene
una lista blanca de campos permitidos y un filtro de palabras sensibles, de modo que no puede
devolver contraseñas, cédulas, correos de clientes ni registros de otros usuarios.

---

## 2. Arquitectura y flujo de un mensaje

```
┌─────────────────────────────────────────────┐
│  NAVEGADOR (React :5173)                    │
│                                             │
│  ExperienceCards ──evento──┐                │
│                            ▼                │
│                    AssistantWidget          │
│                    botón ✧ flotante         │
└────────────────────────────┬────────────────┘
                             │  POST /api/ai/assistant
                             │  { "message": "¿cuánto cuesta el café?" }
                             ▼
┌─────────────────────────────────────────────┐
│  BACKEND (Express :5000)                    │
│                                             │
│  1. aiRoutes.js ─ validación 2..500 car.    │
│              │                              │
│              ▼                              │
│  2. ¿Es petición sensible?                  │
│        ├── SÍ → respuesta fija y cierra     │
│        │        (NO toca la base de datos)  │
│        ▼                                    │
│  3. ¿Existe AI_API_KEY?                     │
│        ├── SÍ → responderIA() ── falla ─┐   │
│        └── NO ──────────────────────┐    │   │
│                                     ▼    ▼   │
│                              responderLocal()│
│                                     │        │
│                                     ▼        │
│                        getKnowledge()        │
│                        (caché 60 s)          │
└────────────────────────────┬────────────────┘
                             │
                             ▼
              { reply, source, suggestions }
```

**Respuesta del servidor** (siempre la misma forma, independientemente del modo):

```json
{
  "success": true,
  "reply": "Nuestro horario es: Lunes a domingo de 8:00 a.m. a 9:00 p.m.",
  "source": "local",
  "suggestions": []
}
```

- `reply` — el texto que se muestra en la burbuja.
- `source` — `"local"` o `"ia"`, permite saber qué motor respondió.
- `suggestions` — productos relacionados (solo el motor local los devuelve).

---

## 3. Los archivos que componen el chatbot

| # | Archivo | Líneas | Responsabilidad |
|---|---------|--------|-----------------|
| 1 | `frontend/src/components/ai/AssistantWidget.jsx` | 161 | Interfaz: burbujas, input, envío, estados de carga |
| 2 | `backend/src/routes/aiRoutes.js` | 19 | Endpoint y validación de la entrada |
| 3 | `backend/src/controllers/aiController.js` | 492 | **Núcleo**: intenciones, búsqueda, seguridad, proveedor IA |
| 4 | `backend/src/services/assistantKnowledge.js` | 61 | Carga y cachea los datos públicos de la BD |

**Archivos de apoyo:**

| Archivo | Rol |
|---------|-----|
| `frontend/src/layouts/MainLayout.jsx:28` | Monta el widget en todas las páginas públicas |
| `frontend/src/components/home/ExperienceCards.jsx:9,234` | Tarjeta "App Inteligente" que abre el chat |
| `frontend/src/styles/features.css:1144-1286` | Estilos del widget |
| `backend/scripts/assistantTest.js` | Batería de 20 preguntas de prueba |
| `backend/scripts/smokeTest.js:112-121` | Prueba automática 5 del asistente |

---

## 4. Frontend: `AssistantWidget.jsx`

### 4.1 El mensaje de bienvenida (líneas 5-8)

```jsx
const WELCOME = {
    role: "assistant",
    text: "¡Hola! Soy el asistente de Magical Books Café. Pregúntame por el horario, el catálogo o cómo alquilar un libro."
};
```

Es una constante fuera del componente: se crea **una sola vez** al cargar el módulo, no en cada
render. Almacena el rol para poder pintarlo con una clase CSS distinta.

### 4.2 Estado y referencias (líneas 13-18)

```jsx
const [open, setOpen] = useState(false);          // ¿está desplegado el panel?
const [messages, setMessages] = useState([WELCOME]); // historial de la conversación
const [input, setInput] = useState("");           // texto escrito en el input
const [sending, setSending] = useState(false);    // ¿hay una petición en vuelo?

const listRef = useRef(null);   // <div> contenedor de las burbujas
const inputRef = useRef(null);  // <input> del formulario
```

Cuatro estados y dos refs. Las **refs** se usan porque necesitan acceder al DOM directamente
(hacer scroll y poner el cursor), algo que no debe disparar un re-render.

### 4.3 Efecto 1 — auto-scroll (líneas 20-24)

```jsx
useEffect(() => {
    if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
    }
}, [messages, open]);
```

`scrollHeight` es la altura total del contenido; asignarlo a `scrollTop` lleva la vista al
final. Se ejecuta cada vez que cambia `messages` (llega una respuesta) o `open` (se abre el
panel). **No llama a `setState`**, solo toca el DOM.

### 4.4 Efecto 2 — abrirse desde otra parte de la app (líneas 28-34)

```jsx
useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("open-assistant", handleOpen);
    return () => window.removeEventListener("open-assistant", handleOpen);
}, []);
```

Es una comunicación **desacoplada por eventos**: quien quiere abrir el chat no necesita importar
ni conocer el componente, solo despachar un evento en `window`.

El emisor está en `ExperienceCards.jsx`:

```jsx
// línea 9
const OPEN_ASSISTANT_EVENT = "open-assistant";

// líneas 234-236
const openAssistant = () => {
    window.dispatchEvent(new CustomEvent(OPEN_ASSISTANT_EVENT));
};

// líneas 345-356: la tarjeta "App Inteligente" renderiza un <button> con onClick={openAssistant}
```

**Orden importante:** el `return` que limpia el listener evita fugas de memoria si el componente
se desmonta.

### 4.5 Efecto 3 — foco automático (líneas 36-40)

```jsx
useEffect(() => {
    if (open && inputRef.current) {
        inputRef.current.focus();
    }
}, [open]);
```

Al abrir el panel el cursor queda listo para escribir.

### 4.6 `handleSend` — el envío, paso a paso (líneas 42-84)

```jsx
const handleSend = async (event) => {
    event.preventDefault();                    // (1) evita recargar la página

    const text = input.trim();
    if (!text || sending) return;              // (2) no envía vacíos ni duplica envíos

    setMessages((previous) => [                // (3) eco optimista: la burbuja del
        ...previous,                           //     usuario aparece al instante,
        { role: "user", text }                 //     sin esperar al servidor
    ]);
    setInput("");                              // (4) limpia el input de inmediato
    setSending(true);                          // (5) bloquea el botón y muestra "Escribiendo..."

    try {
        const data = await apiRequest("/ai/assistant", {   // (6) fetch con la
            method: "POST",                                //     URL base y
            body: JSON.stringify({ message: text })        //     encabezados
        });

        setMessages((previous) => [            // (7) añade la respuesta real
            ...previous,
            { role: "assistant", text: data.reply || "No pude preparar una respuesta." }
        ]);

    } catch (error) {                          // (8) si algo falla, el usuario
        setMessages((previous) => [            //     ve un mensaje amable en la
            ...previous,                       //     misma burbuja, no un error
            { role: "assistant",                                   //     técnico
              text: error.message || "No estoy pudiendo responder ahora, intenta de nuevo." }
        ]);

    } finally {                                // (9) SIEMPRE se ejecuta: desactiva
        setSending(false);                     //     el indicador de carga, haya
    }                                          //     éxito o error
};
```

**Patrón clave:** el `try/catch/finally` garantiza que la interfaz nunca queda "pegada" en
estado de carga. Incluso si el backend cae, el chat sigue siendo usable.

### 4.7 El render (líneas 86-158)

```jsx
<div className={`assistant-widget ${open ? "assistant-open" : ""}`}>
```

El contenedor siempre está en el DOM (para conservar el botón ✧) y cambia de clase según
`open`.

```jsx
{open && (
    <div className="assistant-panel">
```

El panel **solo se renderiza si está abierto**. Es una mejora de rendimiento y evita que el
teclado del celular se abra solo al cargar la página.

| Bloque | Qué hace |
|--------|----------|
| `assistant-header` (líneas 92-105) | Título, punto verde de conexión y botón ✕ |
| `assistant-messages` (líneas 107-122) | Recorre `messages` con `.map()` y pinta cada burbuja con `key` compuesta `role-índice` |
| Indicador de escritura (líneas 117-122) | `{sending && <p>Escribiendo...</p>}` — aparece solo mientras hay una petición en vuelo |
| `assistant-input` (líneas 124-141) | Formulario con `maxLength={300}` y botón deshabilitado si `sending || !input.trim()` |
| Botón flotante (líneas 146-155) | Alterna `open`; su `aria-label` cambia según el estado para accesibilidad |

**Auto-scroll:** como `messages` cambia, el efecto de la sección 4.3 vuelve a ejecutarse y la
lista baja sola hasta la última burbuja.

### 4.8 Dónde se monta

`MainLayout.jsx:18-30`:

```jsx
if (isAdminPage) {
    return <Outlet />;          // /admin → sin asistente
}

return (
    <>
        <Navbar />
        <main><Outlet /></main>
        <Footer />
        <AssistantWidget />     // presente en todas las páginas públicas
    </>
);
```

**Decisión deliberada:** el panel de administración no muestra el asistente flotante.

---

## 5. Endpoint: `aiRoutes.js`

Archivo completo (19 líneas):

```jsx
const router = express.Router();

router.post(
    "/assistant",
    [
        body("message")
            .trim()                                    // quita espacios sobrantes
            .isLength({ min: 2, max: 500 })            // longitud mínima y máxima
            .withMessage("El mensaje debe tener entre 2 y 500 caracteres.")
    ],
    assistant                                           // controlador
);

export default router;
```

Se monta en `app.js:81` con `app.use("/api/ai", aiRoutes)`, así que la ruta final es
`POST /api/ai/assistant`.

**¿Por qué limitar a 500 caracteres?** Evita payloads gigantes y abuso del endpoint, que además
no requiere autenticación (es público, como la tienda). Si la validación falla, `checkValidation`
responde `400` con el mensaje en español.

---

## 6. Controlador: `aiController.js`

Es el corazón del sistema (492 líneas). Lo dividimos en siete bloques.

### 6.1 Datos del negocio (líneas 7-15)

```js
const NEGOCIO = {
    nombre: "Magical Books Café",
    horario: "Lunes a domingo de 8:00 a.m. a 9:00 p.m",
    direccion: "Consulta la sección de contacto de la web",
    contacto: "Desde la página /contacto (puedes elegir dueños o desarrolladores)",
    propuesta:
        "Café literario: café, postres, libros en venta y alquiler, " +
        "experiencias de lectura y espacio para la comunidad."
};
```

Están **incrustadas en el código**, no en la base de datos: son datos fijos del negocio que
sirven como respuesta inmediata y como contexto para el proveedor IA.

### 6.2 Las palabras vacías (líneas 17-28)

```js
const STOPWORDS = new Set([
    "de", "del", "la", "el", "los", "las", "un", "una", ...
]);
```

71 palabras sin significado propio. Se usan para **no** penalizar frases como *"¿cuánto cuesta
un café?"*: `un` y `de` no aportan nada a la búsqueda.

### 6.3 Funciones de normalización (líneas 30-51)

```js
const normalizar = (texto) =>
    String(texto)
        .toLowerCase()              // "Café" → "café"
        .normalize("NFD")           // separa "é" en "e" + "´"
        .replace(/[̀-ͯ]/g, "");     // elimina los acentos sueltos
```

**Por qué importa:** sin esto, `"horario"` y `"HORARIO"` o `"café"` y `"cafe"` serían
distintos y la detección fallaría.

```js
// Línea 38: tokens COMPLETOS, para detectar intención
const tokensIntencion = (texto) =>
    normalizar(texto)
        .split(/[^a-z0-9]+/)
        .filter((palabra) => palabra.length >= 2);

// Línea 44: tokens SIN palabras vacías, para buscar en el catálogo
const tokenizar = (texto) =>
    tokensIntencion(texto).filter((palabra) => !STOPWORDS.has(palabra));

// Línea 48: plural → singular suave
const raiz = (palabra) =>
    palabra.length > 4 && palabra.endsWith("s")
        ? palabra.slice(0, -1)      // "cafes" → "cafe"
        : palabra;
```

**Dos tokenizadores distintos a propósito:**
- Para **intenciones** se conservan todas las palabras (porque `"hola"`, `"cuánto"` y `"gracias"`
  son justamente las claves que se buscan).
- Para el **catálogo** se quitan las vacías (para que `"de"` no puntúe contra ningún producto).

`raiz()` es un singular/plural aproximado: `"libros"` → `"libro"`. No es un stemmer completo,
pero resuelve el caso más frecuente en español con una sola línea.

### 6.4 Utilidades de formato (líneas 53-59)

```js
const precio = (valor) => `$${Number(valor).toLocaleString("es-CO")}`;
// 15000 → "$15.000"

const listado = (items) => {
    if (items.length === 1) return items[0];                                  // "A"
    if (items.length === 2) return `${items[0]} y ${items[1]}`;               // "A y B"
    return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;   // "A, B y C"
};
```

Notar la coma solo antes del último elemento — una regla de redacción en español.

### 6.5 Capa de seguridad: detección de datos sensibles (líneas 66-82)

```js
const PATRONES_SENSIBLES = [
    "contrasena", "password", "clave de acceso", "token", "jwt",
    "base de datos", "mongodb", "coleccion", "admin", "administrador",
    "datos personales", "cedula", "documento de identidad",
    "usuario registrado", "usuarios registrados", "lista de usuarios",
    "credenciales", "pedidos de otros", "correo de un cliente",
    "telefono de un cliente", "direccion de un cliente",
    "salario", "sueldo"
];

const esSolicitudSensible = (texto) =>
    PATRONES_SENSIBLES.some((patron) => texto.includes(patron));
```

**Lógica:** recorre los 23 patrones y devuelve `true` si el mensaje (ya normalizado, sin
acentos ni mayúsculas) contiene alguno.

**Se evalúa ANTES que cualquier otra cosa.** En el punto de entrada (línea 455):

```js
if (esSolicitudSensible(normalizar(message))) {
    return res.status(200).json({
        success: true,
        reply: RESPUESTA_SENSIBLE,   // respuesta fija y amable
        source: "local",
        suggestions: []
    });
}
```

Fíjate en dos detalles:
1. **Responde `200`, no `403`.** No delata que hay un sistema de seguridad; simplemente
   reorienta la conversación.
2. **No llega a consultar la base de datos.** El rechazo ocurre antes de `getKnowledge()`.

### 6.6 El motor de intenciones (líneas 88-183)

Hay **13 intenciones** definidas como datos, no como `if/else`:

```js
const INTENCIONES = [
    { id: "saludo",           claves: ["hola", "buenas", "buenos", "saludos", "hey"], texto: () => `¡Hola!...` },
    { id: "horario",          claves: ["horario", "abren", "cierran", "hora", "abierto"], texto: () => `Nuestro horario es...` },
    { id: "ubicacion",        claves: ["donde", "ubicacion", "direccion", "llegar", "sucursal", "mapa"], ... },
    { id: "contacto",         claves: ["contacto", "correo", "telefono", "escribir", "duenos", "whatsapp"], ... },
    { id: "alquiler",         claves: ["alquiler", "alquilar", "alquilo", "prestamo", "prestar", "rentar"], texto: null },
    { id: "pedido",           claves: ["pedido", "pedir", "envio", "domicilio", "comprar", "carrito"], ... },
    { id: "pago",             claves: ["pago", "pagar", "tarjeta", "efectivo", "datáfono", "plataforma"], ... },
    { id: "experiencias",     claves: ["experiencia", "evento", "actividad", "agenda", "club", "taller"], texto: null },
    { id: "catalogo",         claves: ["catalogo", "menu", "carta", "tienen", "venden", "productos"], texto: null },
    { id: "precio",           claves: ["precio", "precios", "cuanto", "cuesta", "cuestan", "vale", "costo"], texto: null },
    { id: "disponibilidad",   claves: ["disponible", "agotado", "quedan", "stock", "existencia"], texto: null },
    { id: "agradecimiento",   claves: ["gracias", "grax", "listo", "adios", "chao", "hasta"], ... },
    { id: "ayuda",            claves: ["ayuda", "funciona", "asistente", "bot"], ... }
];
```

**Estructura híbrida importante:** algunas intenciones tienen `texto` (respuesta fija, se
resuelven ahí mismo) y otras tienen `texto: null` (necesitan consultar el catálogo y armar la
respuesta en tiempo de ejecución).

#### La función de detección (líneas 165-183)

```js
const detectarIntencion = (tokens) => {
    let mejor = null;
    let mejorPuntaje = 0;

    for (const intencion of INTENCIONES) {
        let puntaje = 0;

        for (const clave of intencion.claves) {
            if (tokens.includes(clave)) puntaje += 1;   // coincidencia EXACTA por token
        }

        if (puntaje > mejorPuntaje) {   // ">" estricto: gana la PRIMERA en empate
            mejor = intencion;
            mejorPuntaje = puntaje;
        }
    }

    return mejor;
};
```

**Por qué por token y no por subcadena:** si se buscara `"hola"` dentro del texto completo,
*"melocotón"* contendría... no, pero *"sh**hola**"* sí, y casos como `"no"` dentro de
*"nube"* o *"antorcha"* producirían falsos positivos. Comparar tokens exactos elimina ese
problema.

**Umbral de confianza:** si `mejorPuntaje` sigue en `0`, significa que ninguna clave coincidió,
y la función devuelve `null`. Luego el código cae a una respuesta genérica (línea 357).

### 6.7 Búsqueda de productos por similitud (líneas 188-215)

```js
const puntuarProducto = (producto, tokensRaiz) => {
    const nombre      = tokenizar(producto.name).map(raiz);
    const meta        = tokenizar(`${producto.category} ${producto.type}`).map(raiz);
    const descripcion = tokenizar(producto.description || "").map(raiz);

    let puntaje = 0;

    for (const token of tokensRaiz) {
        if (nombre.includes(token))                        puntaje += 3;  // coincidencia exacta en el nombre
        else if (nombre.some((propio) => propio.startsWith(token))) puntaje += 2;  // prefijo del nombre
        else if (meta.includes(token))                     puntaje += 2;  // categoría o tipo exactos
        else if (meta.some((propio) => propio.startsWith(token))) puntaje += 1;   // prefijo de categoría
        else if (descripcion.includes(token))              puntaje += 1;  // solo la descripción
    }

    return puntaje;
};
```

**Sistema de pesos jerárquico:** cuanto más relevante es la ubicación del texto, más puntos.
La cadena de `if/else if` garantiza que **cada token puntúe una sola vez** por su mejor
coincidencia.

**El filtro y el corte** (líneas 206-215):

```js
const buscarProductos = (productos, mensaje, maximo = 3) =>
    productos
        .map((producto) => ({
            producto,
            puntaje: puntuarProducto(producto, tokenizar(mensaje).map(raiz))
        }))
        .filter((resultado) => resultado.puntaje >= 2)   // umbral mínimo
        .sort((a, b) => b.puntaje - a.puntaje)           // de mayor a menor
        .slice(0, maximo)                                // top 3
        .map((resultado) => resultado.producto);
```

- **Umbral ≥ 2:** con 1 punto (una coincidencia débil en la descripción) el resultado sería
  ruido. Mínimo 2 asegura que haya al menos una señal real.
- **`slice(0, 3)`:** evita respuestas interminables listando todo el catálogo.

### 6.8 Las respuestas especializadas (líneas 217-324)

Cada una arma el texto a partir de los productos encontrados.

**`describirProducto` (líneas 217-232)** construye una ficha compacta:

```js
const partes = [`${producto.name} (${precio(producto.price)})`];
// → "Café Moka Magical ($8.500)"

if (producto.rental?.enabled && producto.rental.dailyPrice > 0) {
    partes.push(`alquiler ${precio(producto.rental.dailyPrice)}/día (máx. ${producto.rental.maxDays} días)`);
}
// → "... — alquiler $2.000/día (máx. 14 días)"

if ((producto.stock || 0) <= 0) {
    partes.push("agotado por ahora");
}
// → "... — agotado por ahora"
```

Usa `?.` (optional chaining) y `|| 0` porque un producto puede no tener `rental` ni `stock`.

| Función | Líneas | Qué resuelve |
|---------|--------|--------------|
| `respuestaPrecio` | 234-243 | Devuelve fichas; si no encuentra nada, pide el nombre exacto |
| `respuestaAlquiler` | 245-264 | **Filtra** solo libros con `rental.enabled` y `stock > 0` |
| `respuestaCatalogo` | 266-292 | Resume categorías con conteo + destacados + coincidencias |
| `respuestaExperiencias` | 294-307 | Lista las 3 primeras experiencias |
| `respuestaDisponibilidad` | 309-324 | "disponible (N en existencia)" o "agotado por ahora" |

### 6.9 `responderLocal` — el orquestador (líneas 329-364)

```js
const responderLocal = async (mensaje) => {
    const knowledge = await getKnowledge();              // (1) datos (con caché)
    const tokens    = tokensIntencion(mensaje);          // (2) tokens completos
    const intencion = detectarIntencion(tokens);         // (3) ¿qué quiere?
    const productos = buscarProductos(knowledge.productos, mensaje); // (4) ¿qué relacionado hay?

    let reply = "";

    if      (intencion?.id === "precio")           reply = respuestaPrecio(productos);
    else if (intencion?.id === "alquiler")         reply = respuestaAlquiler(productos);
    else if (intencion?.id === "catalogo")         reply = respuestaCatalogo(knowledge, productos);
    else if (intencion?.id === "experiencias")     reply = respuestaExperiencias(knowledge);
    else if (intencion?.id === "disponibilidad")   reply = respuestaDisponibilidad(productos);
    else {
        reply = intencion?.texto ? intencion.texto() : "";   // (5) respuesta fija

        if (productos.length > 0) {                          // (6) enriquecer con
            reply = `${reply ? reply + " " : ""}Sobre tu consulta: ${          //    productos
                listado(productos.map(describirProducto))}.`;
        }
    }

    if (!reply) {                                            // (7) último recurso
        reply = "Puedo ayudarte con productos, precios, horarios y alquileres. " + ...;
    }

    return { reply, suggestions: productos };
};
```

**Nota sobre `?.`:** `intencion` puede ser `null` (no se reconoció ninguna intención), y sin
optional chaining la línea `intencion.id` lanzaría una excepción.

### 6.10 Modo proveedor IA (líneas 370-439)

#### El contexto público (líneas 370-395)

```js
const contextoPublico = async () => {
    const knowledge = await getKnowledge();

    const productos = knowledge.productos
        .slice(0, 60)                       // máximo 60 productos
        .map((producto) => `- ${producto.name}: ${precio(producto.price)} (${producto.category}...)`)
        .join("\n");

    const experiencias = knowledge.experiencias
        .slice(0, 15)                       // máximo 15 experiencias
        .map((experiencia) => `- ${experiencia.title}`)
        .join("\n");

    return (
        `CATÁLOGO PÚBLICO (no inventes otros precios):\n${productos}\n\n` +
        `EXPERIENCIAS:\n${experiencias}`
    );
};
```

**Idea central:** se le pasa al modelo un **catálogo congelado** con la instrucción explícita
*"no inventes otros precios"*. Así el modelo puede conversar con naturalidad pero no puede
inventar precios.

#### La llamada (líneas 397-439)

```js
const responderIA = async (mensaje) => {
    const contexto = await contextoPublico();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.AI_API_KEY}`
        },
        body: JSON.stringify({
            model: process.env.AI_MODEL || "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        `Eres el asistente de ${NEGOCIO.nombre}. ${NEGOCIO.propuesta} ` +
                        `Horario: ${NEGOCIO.horario}. ` +
                        "Responde en español, con tono amable y breve (máx. 4 oraciones).\n" +
                        "Reglas: usa solo los precios del catálogo adjunto y no inventes productos. " +
                        "Nunca compartas datos personales de clientes, credenciales ni información " +
                        "interna del sistema; si te la piden, declina amablemente.\n\n" +
                        contexto
                },
                { role: "user", content: mensaje }
            ],
            max_tokens: 300,     // tope de longitud de la respuesta
            temperature: 0.4     // bajo → respuestas más consistentes, menos creativas
        })
    });

    if (!response.ok) throw new Error(`Proveedor IA: ${response.status}`);

    const data = await response.json();

    return {
        reply: data.choices?.[0]?.message?.content?.trim() || "",
        suggestions: []          // el modo IA no devuelve sugerencias
    };
};
```

**Claves del diseño:**
- **`temperature: 0.4`** — valor bajo deliberado: un asistente de atención al cliente debe ser
  predecible, no creativo.
- **`max_tokens: 300`** — coste controlado y respuestas cortas.
- **`throw` si falla** — no intenta manejar el error aquí; lo hace el llamador (ver 6.11).

### 6.11 `assistant` — el punto de entrada (líneas 442-492)

```js
export const assistant = async (req, res, next) => {
    try {
        const errors = validationResult(req);            // (1) validación de aiRoutes
        if (!errors.isEmpty()) {
            return res.status(400).json({ ... });
        }

        const { message } = req.body;

        if (esSolicitudSensible(normalizar(message))) {  // (2) FILTRO DE SEGURIDAD
            return res.status(200).json({ ... RESPUESTA_SENSIBLE ... });   // ← corta aquí
        }

        const usarIA = Boolean(process.env.AI_API_KEY);  // (3) ¿hay proveedor?

        let resultado;
        let source = "local";

        if (usarIA) {
            try {
                resultado = await responderIA(message);   // (4a) intenta OpenAI
                source = "ia";
            } catch {
                resultado = await responderLocal(message); // (4b) FALLBACK silencioso
                source = "local";
            }
        } else {
            resultado = await responderLocal(message);     // (4c) solo motor local
        }

        return res.status(200).json({                     // (5) respuesta uniforme
            success: true,
            reply: resultado.reply,
            source,
            suggestions: resultado.suggestions
        });

    } catch (error) {
        next(error);   // (6) errores inesperados → manejador centralizado
    }
};
```

**El bloque `catch` vacío de la línea 473 es intencional:** si OpenAI falla, no se informa al
usuario, se cambia de motor y se responde igual. El usuario no debe enterarse de qué motor
está detrás.

---

## 7. Base de conocimiento: `assistantKnowledge.js`

Archivo completo (61 líneas).

### 7.1 La lista blanca de campos (líneas 6-29)

```js
const CAMPOS_PRODUCTO = [
    "name", "price", "type", "category", "description",
    "availableFor", "formats", "stock", "featured", "image",
    "rental.enabled", "rental.dailyPrice", "rental.maxDays"
].join(" ");

const CAMPOS_EXPERIENCIA = [
    "title", "description", "category", "icon", "to", "featured"
].join(" ");
```

`.join(" ")` produce el string que pasa Mongoose a `.select()`. Así **solo se leen esos campos**
de la base de datos.

El comentario de la línea 4-5 lo dice explícitamente:

> El asistente NUNCA consulta usuarios, pedidos, alquileres, mensajes de contacto ni
> movimientos de inventario.

La colección `users` ni siquiera se importa en este archivo.

### 7.2 La caché (líneas 31-61)

```js
const TTL = 60 * 1000;   // 60 segundos

let cache = { productos: null, experiencias: null, categorias: [], en: 0 };

export const getKnowledge = async (forzar = false) => {
    const ahora = Date.now();

    if (!forzar && cache.productos && ahora - cache.en < TTL) {
        return cache;                        // (1) caché vigente → 0 consultas
    }

    const [productos, experiencias] = await Promise.all([   // (2) 2 consultas EN PARALELO
        Product.find({ active: true }).select(CAMPOS_PRODUCTO).limit(500).lean(),
        Experience.find({ active: true }).select(CAMPOS_EXPERIENCIA).sort({ order: 1 }).limit(50).lean()
    ]);

    const categorias = [...new Set(productos.map((p) => p.category))].sort();  // (3) únicas

    cache = { productos, experiencias, categorias, en: ahora };   // (4) guardar

    return cache;
};
```

| Decisión | Motivo |
|----------|--------|
| `TTL` de 60 s | El catálogo cambia poco; un producto nuevo aparece en el chat en ≤ 1 min |
| `Promise.all` | Las dos consultas corren en paralelo → ~la mitad de latencia |
| `.lean()` | Devuelve objetos planos de JS en vez de documentos Mongoose → mucho más rápido |
| `active: true` | El asistente nunca filtra productos inactivos |
| `limit(500)` / `limit(50)` | Techo de seguridad ante un catálogo enorme |
| `new Set(...)` | Categorías únicas sin duplicados, con `Set` nativo |

**Variable en el módulo:** `let cache` está fuera de la función, así que sobrevive entre
peticiones. Es una caché en memoria del proceso.

---

## 8. Modo local vs. modo IA

| Aspecto | Motor local | Proveedor IA (OpenAI) |
|---------|-------------|------------------------|
| Se activa con | Siempre disponible | `AI_API_KEY` en `backend/.env` |
| Modelo | Reglas + tokenización + scoring | `gpt-4o-mini` (o `AI_MODEL`) |
| Latencia | Muy baja (en memoria) | Alta (red + inferencia) |
| Coste | $0 | Por token |
| Precios | Lee la BD en vivo | Recibe un catálogo congelado en el prompt |
| Flexibilidad | Solo las 13 intenciones | Cualquier pregunta en lenguaje natural |
| `suggestions` | ✅ Productos relacionados | ❌ Siempre `[]` |
| Sin internet | ✅ Funciona | ❌ Caerá al motor local |
| Si falla | — | Fallback automático al local |

**Resultado:** el chatbot **siempre responde**, aunque no haya llave de API ni conexión.

---

## 9. Seguridad en tres capas

| Capa | Dónde | Qué protege |
|------|-------|-------------|
| **1. Lista blanca de campos** | `assistantKnowledge.js:6-29` | El asistente solo puede *leer* 13 campos públicos de producto y 6 de experiencia. Nunca `users`, `orders`, `contactmessages` ni `inventorymovements` |
| **2. Filtro de patrones sensibles** | `aiController.js:66-82` | Rechaza 23 peticiones (credenciales, cédulas, datos de terceros, salarios) **antes** de tocar la BD |
| **3. Reglas en el prompt** | `aiController.js:413-422` | Instrucción explícita al modelo: no inventar precios, no compartir datos personales, máximo 4 oraciones |

**Refuerzos adicionales:**

- **Validación de entrada** (`aiRoutes.js:11-14`): 2 a 500 caracteres.
- **Sin autenticación, pero público:** el endpoint no da acceso a nada privado por diseño.
- **El rechazo sensible responde `200`**, no `403` — no revela que existe un filtro.
- **Límites de consulta** (`limit(500)` / `limit(50)`) contra abuso.
- **Caché de 60 s:** aunque 1000 usuarios pregunten a la vez, solo se consulta la BD una vez.

---

## 10. Trazas de ejecución

Cuatro ejemplos con el camino exacto que recorre cada mensaje.

### Traza 1 — Pregunta simple con respuesta fija

**Usuario:** `"¿Cuál es el horario?"`

```
1. aiRoutes       → "¿Cuál es el horario?" tiene 21 caracteres → ✅ pasa
2. normalizar     → "cual es el horario"
3. sensible?      → ninguno de los 23 patrones coincide → sigue
4. AI_API_KEY     → no existe → modo local
5. getKnowledge() → caché fría → 2 consultas a MongoDB (Promise.all)
6. tokensIntencion→ ["cual","es","el","horario"]
7. detectarIntencion
      horario.claves → "horario" está en tokens → puntaje = 1
      (ninguna otra intención puntúa)
      → { id: "horario", ... }
8. intencion.id === "horario" → no está en el grupo de "requieren catálogo"
   → usa intencion.texto() → "Nuestro horario es: Lunes a domingo de 8:00 a.m. a 9:00 p.m."
9. buscarProductos("¿Cuál es el horario?") → probablemente 0 coincidencias (umbral ≥2)
   → no se enriquece
10. Respuesta: { reply: "Nuestro horario es: ...", source: "local", suggestions: [] }
```

### Traza 2 — Pregunta de precio con búsqueda en catálogo

**Usuario:** `"¿Cuánto cuesta el brownie?"`

```
1. validación     → ✅
2. normalizar     → "cuanto cuesta el brownie"
3. sensible?      → no
4. modo local
5. getKnowledge() → 8 productos en caché
6. tokensIntencion → ["cuanto","cuesta","el","brownie"]
7. detectarIntencion
      precio.claves → "cuanto" ✅, "cuesta" ✅ → puntaje = 2  ← GANA
      (otras intenciones: 0 o 1)
      → { id: "precio", texto: null }
8. intencion.id === "precio" → respuestaPrecio(productos)
9. buscarProductos:
      tokens = tokenizar("cuanto cuesta el brownie") = ["cuanto","cuesta","brownie"]
      (quitó "el")
      raiz() → ["cuanto","cuesta","brownie"]

      "Brownie con helado":
         nombre = ["brownie","con","helado"]
         token "brownie" → nombre.includes("brownie") ✅ → +3
         tokens "cuanto","cuesta" → sin coincidencia
         puntaje = 3  → ✅ supera el umbral ≥2

      Otros productos → puntaje 0 → descartados
10. respuestaPrecio → "Encontré: Brownie con helado ($9.000)."
11. Respuesta: { reply: "Encontré: Brownie con helado ($9.000).",
                 source: "local",
                 suggestions: [<Brownie con helado>] }
```

### Traza 3 — Petición sensible bloqueada

**Usuario:** `"¿Me das la contraseña de un usuario?"`

```
1. validación     → ✅ (40 caracteres)
2. normalizar     → "me das la contrasena de un usuario"   ← pierde la ñ
3. sensible?      → PATRONES_SENSIBLES incluye "contrasena"
                    "me das la contrasena de un usuario".includes("contrasena") → true
4. ⛔ SE CORTA AQUÍ
   → getKnowledge() NUNCA se ejecuta
   → detectarIntencion() NUNCA se ejecuta
   → Ninguna colección se consulta
5. Respuesta:
   { reply: "No puedo compartir datos personales, credenciales ni información
              interna del sistema. Con gusto te ayudo con el catálogo, precios,
              horarios, alquileres y experiencias de Magical Books Café.",
     source: "local",
     suggestions: [] }
   → HTTP 200 (no 403)
```

**Nota clave:** `normalizar()` se aplica **antes** de comparar. Por eso el patrón está escrito
sin tilde (`"contrasena"`) y detecta también `"contraseña"`.

### Traza 4 — Fallback del proveedor IA

**Situación:** existe `AI_API_KEY`, pero OpenAI responde `429 Too Many Requests`.

```
1. validación     → ✅
2. sensible?      → no
3. usarIA         → true (hay AI_API_KEY)
4. responderIA()  → fetch a api.openai.com
                    response.ok === false
                    → throw new Error("Proveedor IA: 429")
5. catch {}       → ⚠️ error capturado y DESCARTADO en silencio
                    → resultado = await responderLocal(mensaje)
                    → source = "local"
6. El usuario recibe una respuesta normal del motor local.
   No hay error en la interfaz, ni en la consola del navegador.
```

---

## 11. Cómo probarlo

### 11.1 Batería de 20 preguntas

```bash
cd magical-books-cafe/backend
node scripts/assistantTest.js
```

Requiere el servidor levantado (`npm run dev`). Para cada pregunta imprime la respuesta y el
motor que la produjo:

```
P: ¿Cuál es el horario?
   [local] Nuestro horario es: Lunes a domingo de 8:00 a.m. a 9:00 p.m.
   sugerencias: -
```

Las preguntas incluyen deliberadamente casos límite:
- `¿Me das la contraseña de un usuario?` → debe rechazar
- `necesito la base de datos` → debe rechazar
- `¿Cuánto cuesta Cien años de soledad?` → debe encontrar el producto
- `gracias, hasta luego` → intención de agradecimiento

### 11.2 Prueba automática en la suite

`backend/scripts/smokeTest.js:112-121` (prueba 5):

```js
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
```

Verifica tres cosas: HTTP 200, que `reply` sea string y que no esté vacío (el tercer
argumento es el detalle que se imprime si la prueba falla).

```bash
cd magical-books-cafe/backend
npm test            # incluye la prueba 5
```

### 11.3 Prueba manual desde la web

1. Levanta backend y frontend.
2. Pulsa el botón **✧** (esquina inferior derecha).
3. Prueba: `¿Cuánto cuesta el café?`, `¿Qué experiencias hay?`, `dime tu horario porfa`.
4. Revisa la pestaña *Network* del navegador: verás `POST /ai/assistant` y la respuesta con
   `source: "local"`.

### 11.4 Activar el modo IA (opcional)

```bash
# backend/.env
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini    # opcional
```

Reinicia el backend. Ahora `source` será `"ia"`. Puedes desactivarlo borrando la variable.

---

## 12. Limitaciones y mejoras futuras

### Limitaciones actuales

| # | Limitación | Detalle |
|---|------------|---------|
| 1 | **`source` y `suggestions` no se muestran** | El backend los devuelve, pero `AssistantWidget.handleSend` solo usa `data.reply` (línea 66). Se pierde la información de qué motor respondió y las sugerencias de productos |
| 2 | **Intenciones limitadas** | 13 intenciones fijas. Algo fuera de esa lista cae a la respuesta genérica de la línea 357 |
| 3 | **Sin memoria de conversación** | Cada mensaje se procesa aislado; el asistente no recuerda la pregunta anterior |
| 4 | **`NEGOCIO` hardcodeada** | Horario y dirección están en el código (`aiController.js:7-15`); un cambio obliga a editar y redesplegar |
| 5 | **Sugerencias sin interfaz** | El motor local devuelve productos relacionados, pero no hay chips ni tarjetas clicables en el chat |
| 6 | **`suggestions` solo en modo local** | El modo IA devuelve siempre `[]` |

### Mejoras propuestas

1. **Mostrar el motor y las sugerencias** en la burbuja de respuesta (esfuerzo bajo, impacto
   inmediato).
2. **Chips de productos clicables** bajo la respuesta, que naveguen a `/catalogo/:id`.
3. **Historial de la conversación** enviando los últimos N mensajes como contexto.
4. **Mover `NEGOCIO` a la base de datos** o a un archivo de configuración.
5. **Métricas de intenciones fallidas** — registrar los mensajes que caen a la respuesta
   genérica para descubrir qué preguntas faltan.
6. **Streaming de respuestas** en modo IA para reducir la percepción de espera.

---

*Documento generado el 14 de noviembre de 2026. Archivos de referencia:*
`frontend/src/components/ai/AssistantWidget.jsx` · `backend/src/routes/aiRoutes.js` ·
`backend/src/controllers/aiController.js` · `backend/src/services/assistantKnowledge.js`
