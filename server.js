import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.post('/api/fetch', async (req, res) => {
  console.log('Recibida solicitud:', {
    body: req.body,
    type: typeof req.body,
    url: req.body?.url,
    urlType: typeof req.body?.url
  });

  let url = req.body?.url;

  if (!url) {
    return res.status(400).json({ error: 'URL es requerida' });
  }

  // Convertir a string si no lo es
  url = String(url).trim();

  if (!url) {
    return res.status(400).json({ error: 'URL vacía después de procesar' });
  }

  // Validar que sea una URL válida
  try {
    new URL(url);
  } catch (e) {
    return res.status(400).json({ error: `URL inválida: ${url}` });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    
    if (!html || html.trim().length === 0) {
      throw new Error('La respuesta del servidor está vacía');
    }

    res.json({ html });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message || 'Error al descargar la página' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor proxy corriendo en http://localhost:${PORT}`);
});
