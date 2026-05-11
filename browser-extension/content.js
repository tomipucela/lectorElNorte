(() => {
  const TARGET_APP = 'https://lector-el-norte-zw6m-rolsufg8j-tomipucelas-projects.vercel.app/';
  const BUTTON_ID = 'jsonld-transform-button';

  if (document.getElementById(BUTTON_ID)) return;

  const isTargetSite = /(^|\.)elnortedecastilla\.es$/i.test(location.hostname);
  if (!isTargetSite) return;

  const button = document.createElement('button');
  button.id = BUTTON_ID;
  button.type = 'button';
  button.textContent = 'Transformar';
  button.title = 'Abrir el transformador con esta URL';
  button.setAttribute('aria-label', 'Transformar noticia');

  const baseStyle = [
    'position: fixed',
    'right: 16px',
    'bottom: 16px',
    'z-index: 2147483647',
    'padding: 12px 16px',
    'border: 0',
    'border-radius: 999px',
    'font: 700 14px/1.2 system-ui, -apple-system, Segoe UI, sans-serif',
    'color: #fff',
    'background: linear-gradient(180deg, #1b5dbf, #0e3f87)',
    'box-shadow: 0 14px 34px rgba(19,31,55,.22)',
    'cursor: pointer'
  ].join(';');
  button.style.cssText = baseStyle;

  button.addEventListener('click', () => {
    const target = `${TARGET_APP}?url=${encodeURIComponent(location.href)}`;
    window.open(target, '_blank', 'noopener,noreferrer');
  });

  document.documentElement.appendChild(button);
})();