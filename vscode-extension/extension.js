const vscode = require('vscode');

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('jsonldNewsTransformer.transform', async () => {
      const url = await vscode.window.showInputBox({
        title: 'Transformar noticia',
        prompt: 'Pega la URL de la noticia',
        placeHolder: 'https://www.ejemplo.com/noticia',
        validateInput: (value) => {
          try {
            if (!value) return 'Introduce una URL';
            const parsed = new URL(value);
            if (!['http:', 'https:'].includes(parsed.protocol)) return 'La URL debe empezar por http o https';
            return null;
          } catch {
            return 'URL no válida';
          }
        }
      });

      if (!url) {
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Extrayendo JSON-LD de la noticia',
          cancellable: false
        },
        async () => {
          try {
            const html = await downloadHtml(url);
            const articles = extractJsonLdArticles(html);

            if (!articles.length) {
              vscode.window.showWarningMessage('No se encontró ningún bloque application/ld+json en esa página.');
              return;
            }

            const panel = vscode.window.createWebviewPanel(
              'jsonldNewsTransformer',
              'Noticia transformada',
              vscode.ViewColumn.One,
              {
                enableScripts: true,
                retainContextWhenHidden: true
              }
            );

            panel.webview.html = renderWebview(panel.webview, url, articles);
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            vscode.window.showErrorMessage(`No se pudo transformar la noticia: ${message}`);
          }
        }
      );
    })
  );
}

function deactivate() {}

async function downloadHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache'
    }
  });

  if (!response.ok) {
    if (response.status === 403 || response.status === 429) {
      throw new Error(`El sitio bloqueó la solicitud (${response.status}). Prueba con otra URL o usa el HTML copiado desde "Ver código fuente".`);
    }

    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

function extractJsonLdArticles(html) {
  const scripts = [];
  const regex = /<script[^>]*type=(['"])application\/ld\+json\1[^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = regex.exec(html))) {
    const content = cleanJsonLd(match[2]);
    if (!content) continue;

    try {
      const parsed = JSON.parse(content);
      scripts.push(...normalizeJsonLd(parsed));
    } catch {
      // Ignorar bloques malformados
    }
  }

  return scripts
    .filter(Boolean)
    .sort((left, right) => scoreArticle(right) - scoreArticle(left));
}

function cleanJsonLd(value) {
  return value
    .replace(/^\s*<!--/g, '')
    .replace(/-->\s*$/g, '')
    .trim();
}

function normalizeJsonLd(payload) {
  if (!payload) return [];

  if (Array.isArray(payload)) {
    return payload.flatMap((item) => normalizeJsonLd(item));
  }

  if (typeof payload === 'object' && payload['@graph']) {
    return normalizeJsonLd(payload['@graph']);
  }

  return [payload];
}

function scoreArticle(article) {
  let score = 0;
  if (article.headline) score += 3;
  if (article.articleBody) score += 3;
  if (article.description) score += 2;
  if (article.image) score += 1;
  if (article.author) score += 1;
  return score + JSON.stringify(article).length / 10000;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderWebview(webview, sourceUrl, articles) {
  const nonce = getNonce();
  const cards = articles.map((article, index) => renderArticleCard(article, index)).join('');
  const rawData = escapeHtml(JSON.stringify(articles, null, 2));

  return `<!doctype html>
  <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';" />
      <title>Noticia transformada</title>
      <style>
        :root {
          color-scheme: light;
          --bg: #f4f7fb;
          --panel: #ffffff;
          --text: #172033;
          --muted: #5d6980;
          --line: rgba(93, 105, 128, 0.18);
          --accent: #1b5dbf;
          --accent-strong: #0e3f87;
          --soft: #e7f1ff;
        }
        body {
          margin: 0;
          padding: 24px;
          background: linear-gradient(180deg, #eef3fb 0%, #f6f8fc 100%);
          color: var(--text);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .shell {
          max-width: 1100px;
          margin: 0 auto;
        }
        .hero {
          background: rgba(255,255,255,0.9);
          border: 1px solid var(--line);
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 20px 50px rgba(19,31,55,0.08);
          margin-bottom: 20px;
        }
        .eyebrow {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: .16em;
          color: var(--accent-strong);
          font-weight: 700;
          margin: 0 0 10px;
        }
        h1 {
          margin: 0;
          font-size: 30px;
          line-height: 1.1;
        }
        .url {
          margin-top: 10px;
          color: var(--muted);
          font-size: 13px;
          word-break: break-word;
        }
        .grid {
          display: grid;
          gap: 16px;
        }
        .card {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(19,31,55,0.08);
        }
        .card-image {
          width: 100%;
          max-height: 360px;
          object-fit: cover;
          display: block;
          background: #edf2f7;
        }
        .card-body {
          padding: 22px;
        }
        .badges {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .badge {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .05em;
          text-transform: uppercase;
          border-radius: 999px;
          padding: 4px 10px;
          background: var(--soft);
          color: var(--accent-strong);
        }
        .title {
          margin: 0 0 12px;
          font-size: 26px;
          line-height: 1.15;
        }
        .description {
          margin: 0 0 16px;
          color: var(--muted);
          font-size: 16px;
          line-height: 1.7;
          border-left: 3px solid rgba(27,93,191,.18);
          padding-left: 14px;
        }
        .meta {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          color: var(--muted);
          font-size: 13px;
          padding-top: 14px;
          border-top: 1px solid var(--line);
          margin-bottom: 16px;
        }
        .body {
          white-space: pre-wrap;
          line-height: 1.8;
          font-size: 15px;
          color: var(--text);
        }
        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
        }
        .chip {
          border: 1px solid var(--line);
          background: #f7f9fc;
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 12px;
          color: var(--muted);
        }
        details {
          margin-top: 16px;
          border-top: 1px solid var(--line);
          padding-top: 12px;
        }
        pre {
          white-space: pre-wrap;
          word-break: break-word;
          background: #0f172a;
          color: #dbeafe;
          padding: 16px;
          border-radius: 16px;
          overflow: auto;
        }
      </style>
    </head>
    <body>
      <div class="shell">
        <section class="hero">
          <p class="eyebrow">JSON-LD News Transformer</p>
          <h1>Noticia transformada</h1>
          <div class="url">Fuente: ${escapeHtml(sourceUrl)}</div>
        </section>
        <section class="grid">
          ${cards}
        </section>
        <details>
          <summary>Ver JSON-LD completo</summary>
          <pre>${rawData}</pre>
        </details>
      </div>
      <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
      </script>
    </body>
  </html>`;
}

function renderArticleCard(article, index) {
  const headline = escapeHtml(article.headline || article.name || `Bloque ${index + 1}`);
  const description = article.description ? `<p class="description">${escapeHtml(article.description)}</p>` : '';
  const body = article.articleBody ? `<div class="body">${escapeHtml(article.articleBody)}</div>` : '';
  const image = extractImage(article.image);
  const badges = [article['@type'], article.articleSection, article.publisher?.name]
    .filter(Boolean)
    .map((value) => `<span class="badge">${escapeHtml(value)}</span>`)
    .join('');
  const meta = [];
  if (article.author) meta.push(`<span><strong>Autor:</strong> ${escapeHtml(extractAuthors(article.author) || '')}</span>`);
  if (article.datePublished) meta.push(`<span><strong>Publicado:</strong> ${escapeHtml(article.datePublished)}</span>`);
  if (article.dateModified) meta.push(`<span><strong>Editado:</strong> ${escapeHtml(article.dateModified)}</span>`);
  if (article.url || article.mainEntityOfPage?.['@id']) {
    meta.push(`<span><strong>URL:</strong> ${escapeHtml(article.url || article.mainEntityOfPage['@id'])}</span>`);
  }
  const chips = normalizeKeywords(article.keywords)
    .slice(0, 12)
    .map((keyword) => `<span class="chip">#${escapeHtml(keyword)}</span>`)
    .join('');

  return `
    <article class="card">
      ${image ? `<img class="card-image" src="${escapeHtml(image)}" alt="${headline}" />` : ''}
      <div class="card-body">
        <div class="badges">${badges}</div>
        <h2 class="title">${headline}</h2>
        ${description}
        ${meta.length ? `<div class="meta">${meta.join('')}</div>` : ''}
        ${body}
        ${chips ? `<div class="chips">${chips}</div>` : ''}
      </div>
    </article>`;
}

function extractImage(image) {
  if (!image) return null;
  if (typeof image === 'string') return image;
  if (Array.isArray(image)) return extractImage(image[0]);
  if (typeof image === 'object' && image.url) return image.url;
  return null;
}

function normalizeKeywords(keywords) {
  if (!keywords) return [];
  if (Array.isArray(keywords)) return keywords.map(String).filter(Boolean);
  return String(keywords)
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function extractAuthors(author) {
  if (!author) return null;
  const list = Array.isArray(author) ? author : [author];
  return list
    .map((item) => (typeof item === 'string' ? item : item && item.name))
    .filter(Boolean)
    .join(', ');
}

function getNonce() {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 32 }, () => possible.charAt(Math.floor(Math.random() * possible.length))).join('');
}

module.exports = {
  activate,
  deactivate
};
