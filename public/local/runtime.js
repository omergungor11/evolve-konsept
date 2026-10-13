/* Local-only integration boundary. The original presentation bundles remain intact. */
(() => {
  'use strict';
  const originalOrigin = 'https://weevolveit.com';
  const originalFetch = window.fetch.bind(window);
  const localUrl = (value) => {
    const url = new URL(value, location.href);
    if (url.hostname === 'weevolveit.com' || url.hostname === 'www.weevolveit.com') {
      return new URL(url.pathname + url.search + url.hash, location.origin);
    }
    return url;
  };
  const json = (data, status = 200) => Promise.resolve(new Response(JSON.stringify(data), {
    status, headers: {'Content-Type': 'application/json'}
  }));
  window.fetch = (input, init) => {
    const source = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
    const url = localUrl(source);
    if (url.hostname === 'ipapi.co') return json({city: 'Ankara', region: 'Ankara', country_code: 'TR', country: 'TR', country_name: 'Turkey', latitude: 39.9334, longitude: 32.8597});
    if (url.origin !== location.origin) return json({local: true, success: false, error: 'External services are disabled in this local demo.'}, 503);
    if (url.pathname === '/api/lead') {
      showLocalFeedback();
      return json({ok: true, success: true, local: true});
    }
    const request = input instanceof Request ? new Request(url, input) : url;
    return originalFetch(request, init);
  };
  // Analytics must never leave this local preview.
  navigator.sendBeacon = () => true;
  window.dataLayer = [];
  window.gtag = () => {};
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, value, ...rest) {
    const url = localUrl(value);
    return originalOpen.call(this, method, url.origin === location.origin ? url.href : '/local/blocked', ...rest);
  };
  // Saved pages are full App Router documents. Keep navigation local and let each
  // document hydrate its own exact application tree, without a production server.
  document.addEventListener('click', event => {
    const anchor = event.target.closest?.('a[href]');
    if (!anchor || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.download || anchor.target === '_blank') return;
    const url = localUrl(anchor.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    location.assign(url.pathname + url.search + url.hash);
  }, true);
  // Original multi-step forms and search keep their own client-side handlers.
  // Only the final lead request receives an explicitly local acknowledgment.
  function showLocalFeedback() {
    const previous = document.getElementById('local-form-feedback');
    previous?.remove();
    const panel = document.createElement('div');
    panel.id = 'local-form-feedback';
    panel.setAttribute('role', 'status');
    panel.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483647;max-width:calc(100vw - 32px);width:440px;border:1px solid #e0fd60;border-radius:18px;padding:20px 48px 20px 22px;background:#151918;color:#f7f9f1;box-shadow:0 18px 70px #0009;font:14px/1.55 system-ui,sans-serif';
    panel.textContent = document.documentElement.lang.startsWith('es') ? 'Demostración local: el formulario fue validado. No se enviaron datos ni mensajes.' : 'Local demo: your form was validated. No data or messages were sent.';
    const close = document.createElement('button');
    close.textContent = '×';
    close.setAttribute('aria-label', 'Close notification');
    close.style.cssText = 'position:absolute;right:14px;top:12px;border:0;background:transparent;color:inherit;font-size:26px;cursor:pointer';
    close.onclick = () => panel.remove();
    panel.appendChild(close);
    document.body.appendChild(panel);
  }
  window.__LOCAL_REPLICA__ = {source: originalOrigin, mode: 'offline', submissions: 'demo-only'};
})();
