(function(){
  try{
    if (window.__transformPopupInjected) return;
    window.__transformPopupInjected = true;

    const css = `
    /* Popup en esquina superior izquierda */
    .transform-overlay {position:fixed; top:12px; left:12px; background:transparent; z-index:2147483646; display:block;}
    .transform-box {background:#fff; padding:10px 12px; border-radius:8px; box-shadow:0 6px 18px rgba(0,0,0,0.25); font-family:Arial,Helvetica,sans-serif; text-align:left; width:auto; max-width:360px; position:relative}
    .transform-btn{background:#d9534f;color:white;border:none;padding:8px 12px;border-radius:6px;font-weight:700;cursor:pointer;margin-top:8px}
    .transform-close{position:absolute;top:6px;right:8px;background:transparent;border:none;font-size:16px;cursor:pointer;color:#666}
    .transform-title{font-size:13px;font-weight:700}
    .transform-msg{font-size:12px;color:#333;margin-top:6px}
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
    btn.onclick = async ()=>{
      function getArticleContent(){
        const candidates = ['article','main','[role="main"]','div[itemprop="articleBody"]','div.article','div.noticia','.article-content','.noticia-contenido'];
        for(const sel of candidates){
          const el = document.querySelector(sel);
          if(el && el.innerHTML && el.innerHTML.trim().length>50) return {el, html:el.innerHTML, text:el.innerText};
        }
        // fallback: largest text-containing element
        const all = Array.from(document.querySelectorAll('div, section'));
        const big = all.reduce((a,b)=> (a.innerText||'').length > (b.innerText||'').length ? a : b, document.body);
        return {el: big, html: big.innerHTML, text: big.innerText};
      }

      function sanitizeHtml(rawHtml){
        const tpl = document.createElement('template');
        tpl.innerHTML = rawHtml;
        const walk = (root)=>{
          // remove dangerous elements
          const scripts = root.querySelectorAll('script, noscript, iframe, form, input, button, embed, object');
          scripts.forEach(n=>n.remove());
          const elems = root.querySelectorAll('*');
          elems.forEach(el=>{
            // remove event handlers and javascript: hrefs
            for(const attr of Array.from(el.attributes || [])){
              if(/^on/i.test(attr.name)) el.removeAttribute(attr.name);
              if(/href|src/i.test(attr.name) && /javascript:/i.test(attr.value)) el.removeAttribute(attr.name);
            }
          });
        };
        walk(tpl.content);
        return tpl.innerHTML;
      }

      function applyReaderView({title, sourceUrl, html}){
        try{
          // remove paywall overlays and modals
          const overlays = document.querySelectorAll('[role="dialog"], .overlay, .modal, .paywall, .modal-backdrop, [class*="paywall"], [class*="subscription"]');
          overlays.forEach(n=>n.remove());

          // minimal head styling
          const style = document.createElement('style');
          style.textContent = `
            body{font-family: Georgia, 'Times New Roman', serif; line-height:1.6; margin:0; padding:0; background:#fff; color:#111}
            .reader{max-width:820px;margin:0 auto;padding:24px}
            .reader h1{font-size:32px;font-weight:700;margin:0 0 12px 0;line-height:1.2}
            .reader .meta{color:#888;font-size:14px;margin-bottom:24px}
            .reader .meta a{color:#d9534f;text-decoration:none}
            .reader .meta a:hover{text-decoration:underline}
            .reader img{max-width:100%;height:auto;margin:12px 0}
            .reader p{margin:12px 0;text-align:justify}
            .reader h2, .reader h3{margin:18px 0 8px 0}
          `;

          document.head.innerHTML = '';
          document.head.appendChild(style);
          document.title = title || document.title;

          const body = document.body;
          body.innerHTML = '';
          const container = document.createElement('div');
          container.className = 'reader';
          const h1 = document.createElement('h1');
          h1.innerText = title || document.title;
          const meta = document.createElement('div');
          meta.className = 'meta';
          meta.innerHTML = `<a href="${sourceUrl}" target="_blank" rel="noopener">Ver original en El Norte</a>`;
          const article = document.createElement('div');
          article.className = 'article-content';
          article.innerHTML = sanitizeHtml(html || '');

          container.appendChild(h1);
          container.appendChild(meta);
          container.appendChild(article);
          body.appendChild(container);

          window.scrollTo(0,0);
          console.log('Transformar: applied in-page reader view');
        }catch(e){
          console.error('Transformar: error applying reader view', e);
        }
      }

      // Open web app with source URL as parameter
      const webUrl = 'https://lector-el-norte.vercel.app/';
      const sourceUrl = encodeURIComponent(location.href);
      const fullUrl = webUrl + '?source=' + sourceUrl;
      
      console.log('Transformar: opening web with URL:', fullUrl);
      window.open(fullUrl, '_blank');
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
