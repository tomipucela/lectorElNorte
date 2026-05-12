import { useEffect, useRef, useState } from 'react';

const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api/fetch'
  : '/api/fetch';

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function extractAuthors(author) {
  if (!author) return null;
  const arr = Array.isArray(author) ? author : [author];
  return arr
    .map((entry) => (typeof entry === 'string' ? entry : entry?.name))
    .filter(Boolean)
    .join(', ');
}

function truncateBody(text, max = 99999) {
  if (!text) return text;
  const str = String(text);
  // Eliminar puntos suspensivos
  let processed = str.replace(/\.\.\./g, "");
  // Convertir .Letra a .\nLetra
  processed = processed.replace(/\.(?=[A-ZÁÉÍÓÚa-záéíóú0-9])/g, ".\n");
  if (processed.length <= max) return processed;
  return `${processed.slice(0, max).trim()}…`;
}

function normalizeJsonLd(payload) {
  if (!payload) return [];

  const items = Array.isArray(payload) ? payload : [payload];
  const result = [];

  for (const item of items) {
    if (!item || typeof item !== 'object') continue;

    if (Array.isArray(item['@graph'])) {
      result.push(...item['@graph'].filter((entry) => entry && typeof entry === 'object'));
      continue;
    }

    result.push(item);
  }

  return result;
}

function Badge({ children, color = 'blue' }) {
  const colors = {
    blue: { bg: '#E6F1FB', text: '#0C447C' },
    teal: { bg: '#E1F5EE', text: '#085041' },
    amber: { bg: '#FAEEDA', text: '#633806' },
  };

  const selected = colors[color] || colors.blue;

  return <span className="badge" style={{ background: selected.bg, color: selected.text }}>{children}</span>;
}

function ArticleCard({ data }) {
  const headline = data.headline || data.name || '(Sin titular)';
  const description = data.description;
  const body = data.articleBody;
  const image = data.image?.url || (typeof data.image === 'string' ? data.image : null);
  const authors = extractAuthors(data.author);
  const published = formatDate(data.datePublished);
  const modified = formatDate(data.dateModified);
  const section = data.articleSection;
  const publisher = data.publisher?.name;
  const keywords = data.keywords;
  const type = data['@type'];
  const url = data.url || data.mainEntityOfPage?.['@id'];

  return (
    <article className="article-card">
      {image && (
        <div className="article-image-shell">
          <img
            src={image}
            alt={headline}
            className="article-image"
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="article-body">
        <div className="article-meta-row">
          <div className="badge-row">
            {type && <Badge color="blue">{type}</Badge>}
            {section && <Badge color="teal">{section}</Badge>}
            {keywords && Array.isArray(keywords) && keywords[0] && <Badge color="amber">{String(keywords[0]).split(',')[0]}</Badge>}
          </div>
          {publisher && (
            <span className="publisher">
              <i className="ti ti-building-newspaper" aria-hidden />
              {publisher}
            </span>
          )}
        </div>

        <h1 className="article-title">{headline}</h1>

        {description && <p className="article-description">{description}</p>}

        <div className="info-row">
          {authors && (
            <span>
              <i className="ti ti-user" aria-hidden />
              <strong>{authors}</strong>
            </span>
          )}
          {published && (
            <span>
              <i className="ti ti-calendar" aria-hidden />
              {published}
            </span>
          )}
          {modified && modified !== published && (
            <span>
              <i className="ti ti-pencil" aria-hidden />
              Editado: {modified}
            </span>
          )}
          {url && (
            <a href={url} target="_blank" rel="noreferrer" className="external-link">
              <i className="ti ti-external-link" aria-hidden />
              Ver original
            </a>
          )}
        </div>

        {body && (
          <div className="body-block">
            <p className="article-body-text">{truncateBody(body)}</p>
          </div>
        )}

        {keywords && (
          <div className="keywords-row">
            {(Array.isArray(keywords) ? keywords : String(keywords).split(','))
              .slice(0, 8)
              .map((keyword, index) => (
                <span key={`${keyword}-${index}`} className="keyword-pill">#{String(keyword).trim()}</span>
              ))}
          </div>
        )}
      </div>
    </article>
  );
}

export default function App() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle');
  const [articles, setArticles] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const autoLoadDone = useRef(false);

  console.log('App component rendering, status:', status, 'articles:', articles.length);

  async function handleFetch(inputUrl = url) {
    const trimmed = String(inputUrl || url).trim();
    if (!trimmed) {
      setErrorMsg('Ingresa una URL válida');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setArticles([]);
    setErrorMsg('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed })
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error(`Respuesta inválida del servidor: ${parseError.message}`);
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const html = data.html;

      if (!html || html.trim().length === 0) {
        throw new Error('No se pudo descargar el contenido de la página');
      }

      const parser = new DOMParser();
      const documentNode = parser.parseFromString(html, 'text/html');
      const scripts = Array.from(documentNode.querySelectorAll('script[type="application/ld+json"]'));

      const parsed = scripts
        .map((script) => {
          try {
            return JSON.parse(script.textContent);
          } catch {
            return null;
          }
        })
        .filter(Boolean)
        .flatMap((item) => normalizeJsonLd(item));

      if (!parsed.length) {
        throw new Error('Los bloques JSON-LD no pudieron parsearse');
      }

      const ordered = parsed.slice(0, 1);
      setArticles(ordered);
      setStatus('done');
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Error desconocido');
      setStatus('error');
    }
  }

  useEffect(() => {
    if (autoLoadDone.current) return;

    const params = new URLSearchParams(window.location.search);
    const sourceUrl = params.get('source');
    const incomingUrl = params.get('url');

    // Priority: source (from extension) > url (manual)
    const urlToFetch = sourceUrl || incomingUrl;

    console.log('App: checking for auto-load. source=', sourceUrl, 'url=', incomingUrl, 'urlToFetch=', urlToFetch);

    if (!urlToFetch) {
      console.log('App: no URL to fetch, returning');
      return;
    }

    autoLoadDone.current = true;
    setUrl(urlToFetch);
    
    // Execute fetch immediately with the URL
    const executeAutoFetch = async () => {
      try {
        console.log('App: auto-fetching URL:', urlToFetch);
        setStatus('loading');
        setArticles([]);
        setErrorMsg('');

        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlToFetch })
        });

        let data;
        try {
          data = await response.json();
        } catch (parseError) {
          throw new Error(`Respuesta inválida del servidor: ${parseError.message}`);
        }

        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        const html = data.html;

        if (!html || html.trim().length === 0) {
          throw new Error('No se pudo descargar el contenido de la página');
        }

        const parser = new DOMParser();
        const documentNode = parser.parseFromString(html, 'text/html');
        const scripts = Array.from(documentNode.querySelectorAll('script[type="application/ld+json"]'));

        const parsed = scripts
          .map((script) => {
            try {
              return JSON.parse(script.textContent);
            } catch {
              return null;
            }
          })
          .filter(Boolean)
          .flatMap((item) => normalizeJsonLd(item));

        if (!parsed.length) {
          throw new Error('Los bloques JSON-LD no pudieron parsearse');
        }

        const ordered = parsed.slice(0, 1);
        setArticles(ordered);
        setStatus('done');
        console.log('App: auto-fetch completed, found', ordered.length, 'articles');
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error desconocido';
        setErrorMsg(msg);
        setStatus('error');
        console.error('App: auto-fetch error:', msg);
      }
    };
    
    executeAutoFetch();
  }, []);

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Herramienta React</p>
          <h1>Extractor de JSON-LD para noticias</h1>
          <p className="hero-text">
            Ingresa la URL de una página de noticias. La app descargará el código fuente y buscará el bloque <strong>application/ld+json</strong> para mostrarte los metadatos del artículo.
          </p>
        </div>

        <div className="search-panel">
          <label className="field-label" htmlFor="news-url">
            URL de la página
          </label>
          <div className="search-row">
            <input
              id="news-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleFetch()}
              placeholder="https://www.ejemplo.com/noticia"
            />
            <button
              onClick={handleFetch}
              disabled={status === 'loading' || !String(url).trim()}
              style={{ padding: '0.95rem 1.2rem', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, borderRadius: '16px', border: 0, background: 'linear-gradient(180deg, var(--accent), var(--accent-strong))', color: 'white', fontWeight: 700, cursor: 'pointer' }}
            >
              {status === 'loading' ? (
                <>
                  <i className="ti ti-loader-2" aria-hidden style={{ fontSize: 16 }} /> Cargando…
                </>
              ) : (
                <>
                  <i className="ti ti-search" aria-hidden style={{ fontSize: 16 }} /> Extraer
                </>
              )}
            </button>
          </div>
          <p className="helper-text">
            La app descargará el HTML de la URL y buscará los bloques JSON-LD de noticias.
          </p>
        </div>
      </section>

      {status === 'error' && (
        <section className="message error" aria-live="polite">
          <i className="ti ti-alert-circle" aria-hidden />
          <div>
            <strong>Error:</strong> {errorMsg}
          </div>
        </section>
      )}

      {status === 'done' && articles.length > 0 && (
        <section className="results-block">
          {articles.length > 1 && (
            <p className="results-count">
              <i className="ti ti-layers" aria-hidden />
              Se encontraron {articles.length} bloques JSON-LD, ordenados de mayor a menor tamaño
            </p>
          )}
          {articles.map((article, index) => (
            <ArticleCard key={`${article['@id'] || article.url || index}-${index}`} data={article} />
          ))}
        </section>
      )}

      {status === 'idle' && (
        <section className="idle-state">
          <i className="ti ti-file-search" aria-hidden />
          <p>Introduce una URL y pulsa Extraer</p>
        </section>
      )}
    </main>
  );
}
