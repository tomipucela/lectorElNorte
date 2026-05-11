# Transformar El Norte — Extensión

Extensión que añade un popup a **elnortedecastilla.es** para transformar artículos en tu web app sin necesidad de acceder al sitio original (evita paywalls, publicidad, etc.).

## Instalación

1. Abrir `chrome://extensions` (o `edge://extensions` en Edge).
2. Activar **"Modo desarrollador"** (esquina superior derecha).
3. Pulsar **"Cargar descomprimida"** y seleccionar la carpeta `extension` de este proyecto.

## Uso

- Visita cualquier página en `elnortedecastilla.es` o subdominios.
- Verás un popup pequeño en la esquina superior izquierda con el botón **TRANSFORMAR**.
- Al pulsar **TRANSFORMAR**:
  1. Se abre tu web app en una nueva pestaña.
  2. Se extrae el contenido del artículo desde El Norte.
  3. Se envía el contenido vía `postMessage` a tu web.
  4. Tu web muestra el artículo transformado directamente (sin acceder a la URL ni paywalls).

## Cómo funciona

**Extension (content.js)**:
- Inyecta un popup en el sitio de El Norte.
- Al hacer click en TRANSFORMAR:
  - Extrae el contenido del artículo (busca selectores comunes como `<article>`, `<main>`, etc.).
  - Abre tu web app en una nueva pestaña.
  - Envía un mensaje `postMessage` con el payload: `{type:'transform', sourceUrl, title, html, text}`.

**Web App (App.jsx)**:
- Escucha eventos `message` en `useEffect`.
- Cuando recibe un payload con `type === 'transform'`, crea un objeto `ArticleCard` y lo muestra directamente.
- No necesita hacer fetch a la URL original.

## Configuración

Si quieres usar esta extensión con otra URL:
1. Abre `extension/content.js`.
2. Encuentra la línea: `const webUrl = 'https://lector-el-norte-zw6m-rolsufg8j-tomipucelas-projects.vercel.app';`
3. Cambia la URL por la de tu web app.

## Archivos

- `manifest.json` — Configuración de la extensión.
- `content.js` — Script que se inyecta en elnortedecastilla.es.
- `styles.css` — Estilos mínimos.
