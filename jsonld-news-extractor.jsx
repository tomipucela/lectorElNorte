import { useState } from "react";

const PROXY = "https://api.allorigins.win/get?url=";

function formatDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }).format(new Date(dateStr));
  } catch { return dateStr; }
}

function extractAuthors(author) {
  if (!author) return null;
  const arr = Array.isArray(author) ? author : [author];
  return arr.map(a => (typeof a === "string" ? a : a.name)).filter(Boolean).join(", ");
}

function truncateBody(text, max = 800) {
  if (!text || text.length <= max) return text;
  return text.slice(0, max).trim() + "…";
}

function Badge({ children, color = "blue" }) {
  const colors = {
    blue: { bg: "#E6F1FB", text: "#0C447C" },
    teal: { bg: "#E1F5EE", text: "#085041" },
    amber: { bg: "#FAEEDA", text: "#633806" },
  };
  const c = colors[color] || colors.blue;
  return (
    <span style={{
      display: "inline-block",
      background: c.bg,
      color: c.text,
      fontSize: 11,
      fontWeight: 500,
      padding: "3px 10px",
      borderRadius: 20,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
    }}>{children}</span>
  );
}

function ArticleCard({ data }) {
  const [showRaw, setShowRaw] = useState(false);

  const headline = data.headline || data.name || "(Sin titular)";
  const description = data.description;
  const body = data.articleBody;
  const image = data.image?.url || (typeof data.image === "string" ? data.image : null);
  const authors = extractAuthors(data.author);
  const published = formatDate(data.datePublished);
  const modified = formatDate(data.dateModified);
  const section = data.articleSection;
  const publisher = data.publisher?.name;
  const keywords = data.keywords;
  const type = data["@type"];
  const url = data.url || data.mainEntityOfPage?.["@id"];

  return (
    <div style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: "var(--border-radius-lg)",
      overflow: "hidden",
      marginBottom: "1.5rem",
    }}>
      {image && (
        <div style={{ position: "relative", background: "var(--color-background-secondary)" }}>
          <img
            src={image}
            alt={headline}
            style={{ width: "100%", maxHeight: 320, objectFit: "cover", display: "block" }}
            onError={e => { e.target.style.display = "none"; }}
          />
        </div>
      )}

      <div style={{ padding: "1.5rem 1.75rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14, alignItems: "center" }}>
          {type && <Badge color="blue">{type}</Badge>}
          {section && <Badge color="teal">{section}</Badge>}
          {publisher && (
            <span style={{ fontSize: 12, color: "var(--color-text-secondary)", marginLeft: "auto" }}>
              <i className="ti ti-building-newspaper" aria-hidden style={{ marginRight: 4, fontSize: 13, verticalAlign: -1 }} />
              {publisher}
            </span>
          )}
        </div>

        <h1 style={{
          fontSize: 22,
          fontWeight: 500,
          lineHeight: 1.3,
          color: "var(--color-text-primary)",
          margin: "0 0 0.75rem",
          fontFamily: "var(--font-serif)",
        }}>{headline}</h1>

        {description && (
          <p style={{
            fontSize: 16,
            color: "var(--color-text-secondary)",
            lineHeight: 1.6,
            margin: "0 0 1.25rem",
            borderLeft: "3px solid var(--color-border-secondary)",
            paddingLeft: 14,
            fontStyle: "italic",
          }}>{description}</p>
        )}

        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "1.25rem",
          fontSize: 13,
          color: "var(--color-text-secondary)",
          marginBottom: body ? "1.5rem" : 0,
          borderTop: "0.5px solid var(--color-border-tertiary)",
          paddingTop: 14,
        }}>
          {authors && (
            <span>
              <i className="ti ti-user" aria-hidden style={{ marginRight: 5, fontSize: 14, verticalAlign: -2 }} />
              <strong style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>{authors}</strong>
            </span>
          )}
          {published && (
            <span>
              <i className="ti ti-calendar" aria-hidden style={{ marginRight: 5, fontSize: 14, verticalAlign: -2 }} />
              {published}
            </span>
          )}
          {modified && modified !== published && (
            <span>
              <i className="ti ti-pencil" aria-hidden style={{ marginRight: 5, fontSize: 14, verticalAlign: -2 }} />
              Editado: {modified}
            </span>
          )}
          {url && (
            <a href={url} target="_blank" rel="noreferrer" style={{
              color: "var(--color-text-info)",
              textDecoration: "none",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <i className="ti ti-external-link" aria-hidden style={{ fontSize: 14 }} />
              Ver original
            </a>
          )}
        </div>

        {body && (
          <div style={{ marginTop: "1.25rem" }}>
            <p style={{
              fontSize: 15,
              lineHeight: 1.75,
              color: "var(--color-text-primary)",
              margin: 0,
              whiteSpace: "pre-wrap",
            }}>
              {(() => {
                let text = body
                  .replace(/\.\.\./g, "")
                  .replace(/\.(?=[A-ZÁÉÍÓÚa-záéíóú0-9])/g, ".\n");
                return truncateBody(text);
              })()}
            </p>
            {body.length > 800 && (
              <p style={{ fontSize: 13, color: "var(--color-text-tertiary)", marginTop: 8 }}>
                … texto completo disponible en el original
              </p>
            )}
          </div>
        )}

        {keywords && (
          <div style={{ marginTop: "1.25rem", display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(Array.isArray(keywords) ? keywords : keywords.split(",")).slice(0, 8).map((kw, i) => (
              <span key={i} style={{
                fontSize: 11,
                padding: "3px 10px",
                background: "var(--color-background-secondary)",
                color: "var(--color-text-secondary)",
                borderRadius: 20,
                border: "0.5px solid var(--color-border-tertiary)",
              }}>#{kw.trim()}</span>
            ))}
          </div>
        )}

        <div style={{ marginTop: "1.25rem", borderTop: "0.5px solid var(--color-border-tertiary)", paddingTop: 12 }}>
          <button
            onClick={() => setShowRaw(v => !v)}
            style={{ fontSize: 12, color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 5 }}
          >
            <i className={`ti ti-${showRaw ? "chevron-up" : "chevron-down"}`} aria-hidden style={{ fontSize: 13 }} />
            {showRaw ? "Ocultar" : "Ver"} JSON-LD completo
          </button>
          {showRaw && (
            <pre style={{
              marginTop: 10,
              padding: "1rem",
              background: "var(--color-background-secondary)",
              borderRadius: "var(--border-radius-md)",
              fontSize: 11,
              color: "var(--color-text-secondary)",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              border: "0.5px solid var(--color-border-tertiary)",
            }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error
  const [articles, setArticles] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleFetch() {
    const trimmed = url.trim();
    if (!trimmed) return;
    setStatus("loading");
    setArticles([]);
    setErrorMsg("");

    try {
      const proxyUrl = PROXY + encodeURIComponent(trimmed);
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const html = json.contents;
      if (!html) throw new Error("El proxy no devolvió contenido");

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const scripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));

      if (!scripts.length) throw new Error("No se encontró ningún bloque application/ld+json en esta página");

      const parsed = scripts
        .map(s => { try { return JSON.parse(s.textContent); } catch { return null; } })
        .filter(Boolean);

      if (!parsed.length) throw new Error("Los bloques JSON-LD no pudieron parsearse");

      const largest = parsed.slice(0, 1);
      setArticles(largest);
      setStatus("done");
    } catch (e) {
      setErrorMsg(e.message);
      setStatus("error");
    }
  }

  return (
    <div style={{ padding: "1.5rem 0", fontFamily: "var(--font-sans)" }}>
      <h2 style={{ sr: "only", position: "absolute", opacity: 0, pointerEvents: "none" }}>Extractor de JSON-LD</h2>

      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 10px" }}>
          <i className="ti ti-code" aria-hidden style={{ marginRight: 5, verticalAlign: -2 }} />
          Extrae y presenta el bloque <code style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>application/ld+json</code> más completo de cualquier página
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleFetch()}
            placeholder="https://ejemplo.com/noticia"
            style={{ flex: 1, fontSize: 14 }}
          />
          <button
            onClick={handleFetch}
            disabled={status === "loading" || !url.trim()}
            style={{ padding: "0 1.25rem", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}
          >
            {status === "loading" ? (
              <><i className="ti ti-loader-2" aria-hidden style={{ fontSize: 16 }} /> Cargando…</>
            ) : (
              <><i className="ti ti-search" aria-hidden style={{ fontSize: 16 }} /> Extraer</>
            )}
          </button>
        </div>
      </div>

      {status === "error" && (
        <div style={{
          padding: "1rem 1.25rem",
          borderRadius: "var(--border-radius-md)",
          background: "#FCEBEB",
          color: "#791F1F",
          fontSize: 14,
          display: "flex", alignItems: "flex-start", gap: 10,
        }}>
          <i className="ti ti-alert-circle" aria-hidden style={{ fontSize: 18, marginTop: 1, flexShrink: 0 }} />
          <span><strong>Error:</strong> {errorMsg}</span>
        </div>
      )}

      {status === "done" && articles.length > 0 && (
        <>
          {articles.map((a, i) => <ArticleCard key={i} data={a} />)}
        </>
      )}

      {status === "idle" && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem 1rem",
          gap: 12,
          border: "0.5px dashed var(--color-border-secondary)",
          borderRadius: "var(--border-radius-lg)",
          color: "var(--color-text-tertiary)",
        }}>
          <i className="ti ti-file-search" aria-hidden style={{ fontSize: 40 }} />
          <p style={{ fontSize: 14, margin: 0 }}>Introduce una URL y pulsa Extraer</p>
        </div>
      )}
    </div>
  );
}
