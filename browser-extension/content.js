(() => {
  const TARGET_APP = 'https://lector-el-norte-zw6m-rolsufg8j-tomipucelas-projects.vercel.app/';
  const OVERLAY_ID = 'jsonld-transform-overlay-root';
  const HOST_RE = /(^|\.)elnortedecastilla\.es$/i;

  if (!HOST_RE.test(location.hostname)) return;
  if (document.getElementById(OVERLAY_ID)) return;

  const sendToBackground = () => {
    chrome.runtime.sendMessage(
      { type: 'OPEN_TRANSFORMER', url: location.href },
      () => {
        if (chrome.runtime.lastError) {
          setHint(`No se pudo abrir: ${chrome.runtime.lastError.message}`);
        }
      }
    );
  };

  const root = document.createElement('div');
  root.id = OVERLAY_ID;
  root.style.all = 'initial';
  root.style.position = 'fixed';
  root.style.inset = '0';
  root.style.zIndex = '2147483647';
  root.style.pointerEvents = 'none';

  const shadow = root.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(7, 14, 27, 0.72);
        backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        animation: fadeIn 160ms ease-out;
      }
      .panel {
        width: min(92vw, 640px);
        border-radius: 28px;
        background: linear-gradient(180deg, rgba(255,255,255,0.99), rgba(245,248,252,0.98));
        color: #172033;
        box-shadow: 0 32px 100px rgba(0,0,0,.38);
        border: 1px solid rgba(255,255,255,.72);
        padding: 26px;
        font-family: Inter, system-ui, -apple-system, Segoe UI, sans-serif;
        position: relative;
      }
      .tag {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 5px 10px;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: .12em;
        text-transform: uppercase;
        background: #e7f1ff;
        color: #0e3f87;
        margin-bottom: 12px;
      }
      h1 {
        margin: 0 0 10px;
        font-size: 32px;
        line-height: 1.04;
      }
      p {
        margin: 0 0 16px;
        font-size: 15px;
        line-height: 1.6;
        color: #5d6980;
      }
      .actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      button {
        border: 0;
        border-radius: 14px;
        padding: 13px 18px;
        font: 900 14px/1.2 Inter, system-ui, sans-serif;
        cursor: pointer;
      }
      .primary {
        color: #fff;
        background: linear-gradient(180deg, #1b5dbf, #0e3f87);
        box-shadow: 0 14px 28px rgba(27,93,191,.26);
      }
      .ghost {
        color: #172033;
        background: #eef3fb;
      }
      .close {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 38px;
        height: 38px;
        border-radius: 999px;
        background: #eef3fb;
        color: #172033;
        display: grid;
        place-items: center;
        padding: 0;
      }
      .tiny {
        margin-top: 12px;
        font-size: 12px;
        color: #7b879e;
      }
      .hint {
        margin-top: 10px;
        font-size: 12px;
        color: #0e3f87;
        font-weight: 700;
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.98); }
        to { opacity: 1; transform: scale(1); }
      }
    </style>
    <div class="backdrop" role="dialog" aria-modal="true" aria-label="Transformar noticia">
      <div class="panel">
        <button class="close" type="button" aria-label="Cerrar">×</button>
        <div class="tag">Transformar</div>
        <h1>Noticia detectada</h1>
        <p>Este aviso te lleva a tu deploy con la URL actual ya cargada. No hay copia manual ni CORS.</p>
        <div class="actions">
          <button class="primary" type="button">Transformar ahora</button>
          <button class="ghost" type="button">Cerrar</button>
        </div>
        <div class="hint"></div>
        <div class="tiny">Si cierras esto, vuelve a aparecer con la navegación del sitio.</div>
      </div>
    </div>
  `;

  const backdrop = shadow.querySelector('.backdrop');
  const primary = shadow.querySelector('.primary');
  const ghost = shadow.querySelector('.ghost');
  const close = shadow.querySelector('.close');
  const hint = shadow.querySelector('.hint');

  const remove = () => root.remove();
  const setHint = (message) => {
    hint.textContent = message;
  };

  primary.addEventListener('click', sendToBackground);
  ghost.addEventListener('click', remove);
  close.addEventListener('click', remove);
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) remove();
  });

  document.documentElement.appendChild(root);
  setHint('Pulsa Transformar para abrir el editor con esta noticia.');

  const observer = new MutationObserver(() => {
    if (!document.getElementById(OVERLAY_ID) && HOST_RE.test(location.hostname)) {
      document.documentElement.appendChild(root);
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  const hookHistory = (methodName) => {
    const original = history[methodName];
    history[methodName] = function (...args) {
      const result = original.apply(this, args);
      window.dispatchEvent(new Event('locationchange'));
      return result;
    };
  };

  hookHistory('pushState');
  hookHistory('replaceState');
  window.addEventListener('popstate', () => window.dispatchEvent(new Event('locationchange')));
  window.addEventListener('locationchange', () => {
    if (!document.getElementById(OVERLAY_ID) && HOST_RE.test(location.hostname)) {
      document.documentElement.appendChild(root);
    }
  });
})();
