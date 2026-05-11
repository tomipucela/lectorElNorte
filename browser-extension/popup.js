function cleanJsonLd(value) {
  return String(value || '')
    .replace(/^\s*<!--/g, '')
    .replace(/-->\s*$/g, '')
    .trim();
}

function normalizeJsonLd(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload.flatMap((item) => normalizeJsonLd(item));
  if (typeof payload === 'object' && payload['@graph']) return normalizeJsonLd(payload['@graph']);
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

function truncate(text, max = 360) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max).trim()}…` : text;
}

function renderArticleCard(article) {
  const headline = article.headline || article.name || '(Sin titular)';
  const description = article.description || '';
  const body = article.articleBody || '';
  const authors = Array.isArray(article.author)
    ? article.author.map((item) => (typeof item === 'string' ? item : item?.name)).filter(Boolean).join(', ')
    : typeof article.author === 'string'
      ? article.author
      : article.author?.name || '';
  const url = article.url || article.mainEntityOfPage?.['@id'] || '';
  const section = article.articleSection || '';
  const published = article.datePublished || '';

  return `
    <article class="card">
      <h2>${escapeHtml(headline)}</h2>
      ${description ? `<p>${escapeHtml(description)}</p>` : ''}
      ${body ? `<p>${escapeHtml(truncate(body, 500))}</p>` : ''}
      <div class="pill-row">
        ${authors ? `<span class="pill">${escapeHtml(authors)}</span>` : ''}
        ${section ? `<span class="pill">${escapeHtml(section)}</span>` : ''}
        ${published ? `<span class="pill">${escapeHtml(published)}</span>` : ''}
        ${url ? `<a class="pill" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">Ver original</a>` : ''}
      </div>
    </article>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab?.id) {
    throw new Error('No se pudo obtener la pestaña activa');
  }
  return tab;
}

function setStatus(message) {
  document.getElementById('status').textContent = message;
}

function extractJsonLdFromPage() {
  function normalizeJsonLd(payload) {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload.flatMap((item) => normalizeJsonLd(item));
    if (typeof payload === 'object' && payload['@graph']) return normalizeJsonLd(payload['@graph']);
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

  const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));

  return scripts
    .map((script) => {
      const content = String(script.textContent || '')
        .replace(/^\s*<!--/g, '')
        .replace(/-->\s*$/g, '')
        .trim();

      try {
        return JSON.parse(content);
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .flatMap((item) => normalizeJsonLd(item))
    .sort((left, right) => scoreArticle(right) - scoreArticle(left));
}

document.getElementById('transformBtn').addEventListener('click', async () => {
  const button = document.getElementById('transformBtn');
  const meta = document.getElementById('meta');
  const cards = document.getElementById('cards');
  const raw = document.getElementById('raw');

  button.disabled = true;
  meta.classList.add('hidden');
  cards.innerHTML = '';
  raw.classList.add('hidden');
  raw.textContent = '';
  setStatus('Leyendo la pestaña activa...');

  try {
    const tab = await getActiveTab();
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractJsonLdFromPage
    });

    const articles = results?.[0]?.result || [];

    if (!articles.length) {
      throw new Error('No se encontró ningún bloque application/ld+json en esta página');
    }

    meta.textContent = `URL: ${tab.url || 'desconocida'} | Bloques JSON-LD: ${articles.length}`;
    meta.classList.remove('hidden');
    cards.innerHTML = articles.map(renderArticleCard).join('');
    raw.textContent = JSON.stringify(articles, null, 2);
    raw.classList.remove('hidden');
    setStatus('Transformación completada.');
  } catch (error) {
    setStatus(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  } finally {
    button.disabled = false;
  }
});