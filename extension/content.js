(function(){
  try{
    if (window.__transformPopupInjected) return;
    window.__transformPopupInjected = true;

    const css = `
  .transform-overlay {position:fixed; inset:0; background:rgba(0,0,0,0.25); z-index:2147483646; display:flex; align-items:center; justify-content:center;}
  .transform-box {background:#fff; padding:18px 22px; border-radius:8px; box-shadow:0 8px 24px rgba(0,0,0,0.35); font-family:Arial,Helvetica,sans-serif; text-align:center; max-width:320px; position:relative}
  .transform-btn{background:#d9534f;color:white;border:none;padding:10px 18px;border-radius:6px;font-weight:700;cursor:pointer;margin-top:12px}
  .transform-close{position:absolute;top:8px;right:12px;background:transparent;border:none;font-size:18px;cursor:pointer;color:#666}
  `;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
  overlay.className = 'transform-overlay';

  const box = document.createElement('div');
  box.className = 'transform-box';

  const close = document.createElement('button');
  close.className = 'transform-close';
  close.innerText = '✕';
  close.onclick = ()=>{ overlay.remove(); };

  const title = document.createElement('div');
  title.style.fontSize = '16px';
  title.style.fontWeight = '700';
  title.innerText = 'TRANSFORMAR';

  const msg = document.createElement('div');
  msg.style.marginTop = '8px';
  msg.style.fontSize = '13px';
  msg.innerText = 'Transforma esta página en el lector del proyecto.';

  const btn = document.createElement('button');
  btn.className = 'transform-btn';
  btn.innerText = 'TRANSFORMAR';
  btn.onclick = ()=>{
    const target = 'https://lector-el-norte-zw6m-rolsufg8j-tomipucelas-projects.vercel.app/';
    const src = encodeURIComponent(location.href);
    window.open(target + '?source=' + src, '_blank');
  };

    box.appendChild(close);
    box.appendChild(title);
    box.appendChild(msg);
    box.appendChild(btn);
    overlay.appendChild(box);

    function inject(){
      if (!document.body) return setTimeout(inject, 50);
      document.body.appendChild(overlay);
      console.log('Transformar: popup injected on', location.href);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', inject);
    } else {
      inject();
    }
  } catch(e){
    console.error('Transformar: error injecting popup', e);
  }
})();
