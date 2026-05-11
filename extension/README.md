# Transformar El Norte — Extensión

Instalación local (Chrome / Edge):

1. Abrir `chrome://extensions` (o `edge://extensions`).
2. Activar "Modo desarrollador".
3. Pulsar "Cargar descomprimida" y seleccionar la carpeta `extension` dentro del proyecto.

Uso:
- Visita cualquier página en `elnortedecastilla.es` o subdominios. Verás un popup con el botón **TRANSFORMAR**.
- Al pulsar **TRANSFORMAR** se abrirá en una nueva pestaña:
  `https://lector-el-norte-zw6m-rolsufg8j-tomipucelas-projects.vercel.app/?source=<URL_ORIGINAL>`

Archivos añadidos:
- [extension/manifest.json](extension/manifest.json)
- [extension/content.js](extension/content.js)
- [extension/styles.css](extension/styles.css)

Notas:
- El parámetro `source` contiene la URL codificada desde la que se invocó la extensión. Ajusta el lector para recibir y procesar `source` si hace falta.
- Si quieres que el popup se muestre solo una vez, puedo añadir persistencia (localStorage).
