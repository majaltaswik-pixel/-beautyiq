(function () {
  if (!window.location.pathname.match(/\/products\/.+/)) return;

  var apiUrl = document.currentScript?.getAttribute('data-api') || 'https://www.beautyiqapp.com';
  var shop = document.currentScript?.getAttribute('data-shop') || window.location.hostname;

  var DEMO_PRODS = [
    { product: { title: 'Vitamin C Brightening Serum', price: 42.00, imageUrl: '' }, match: 96 },
    { product: { title: 'Deep Hydra Repair Cream', price: 38.00, imageUrl: '' }, match: 94 },
  ];

  function findContainer() {
    var selectors = ['#ProductInfo', '.product__main', '.product-single__description', '.product-single', '.product-information', '.product__info-wrapper', '.product-info-wrapper', '[data-product-info]', '.product-form__info', '.product__info', '.grid.product', '.product-page--main-content', '#shopify-section-product-template .grid', '.product-template .grid', '.product_area', '#product-info', '.product-info'];
    for (var i = 0; i < selectors.length; i++) {
      var el = document.querySelector(selectors[i]);
      if (el && el.offsetParent !== null) return el;
    }
    var grids = document.querySelectorAll('.grid, .row, .product-layout');
    for (var i = 0; i < grids.length; i++) {
      var kids = grids[i].children;
      if (kids.length >= 2) {
        for (var j = 0; j < kids.length; j++) {
          if (kids[j].querySelector('form[action*="cart"], [type="submit"], .product-form')) return grids[i];
        }
      }
    }
    return null;
  }

  var target = findContainer();
  if (!target) return;
  var parent = target.parentElement;
  if (!parent) return;

  var css = '#bq-wrap{all:initial;display:flex;flex-direction:row;gap:40px;align-items:flex-start;margin:32px 0;}#bq-wrap>*{flex:1;min-width:0;}#bq-wrap .bq-pw{flex:0 0 560px;max-width:560px;}#bq-wrap .bq-p{background:#f9fafb;border:1px solid #d1d5db;border-radius:18px;overflow:hidden;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif;}#bq-wrap .bq-h{padding:24px 28px;background:linear-gradient(135deg,#7c3aed,#9333ea);display:flex;align-items:center;gap:14px;}#bq-wrap .bq-av{width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}#bq-wrap .bq-ht{font-size:1.5rem;font-weight:700;color:#fff;}#bq-wrap .bq-hs{font-size:1.15rem;color:rgba(255,255,255,0.85);display:flex;align-items:center;gap:6px;margin-top:4px;}#bq-wrap .bq-hd{width:12px;height:12px;background:#4ade80;border-radius:50%;}#bq-wrap .bq-b{flex:1;padding:28px;display:flex;flex-direction:column;gap:18px;min-height:350px;max-height:700px;overflow-y:auto;}#bq-wrap .bq-m{background:#fff;padding:20px 24px;border-radius:16px;border-bottom-left-radius:5px;font-size:1.3rem;color:#1f2937;line-height:1.7;box-shadow:0 1px 4px rgba(0,0,0,.08);align-self:flex-start;max-width:92%;}#bq-wrap .bq-mu{align-self:flex-end;background:#7c3aed;color:#fff;border-bottom-left-radius:16px;border-bottom-right-radius:5px;}#bq-wrap .bq-cr{display:flex;gap:16px;align-self:stretch;margin:8px 0;}#bq-wrap .bq-cd{flex:1;background:#fff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;min-width:0;}#bq-wrap .bq-cd img{width:100%;height:200px;object-fit:cover;display:block;background:#f3f4f6;}#bq-wrap .bq-ci{width:100%;height:200px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;}#bq-wrap .bq-cii{padding:16px 18px 18px;}#bq-wrap .bq-ct{font-weight:600;font-size:1.2rem;color:#111827;line-height:1.3;}#bq-wrap .bq-cp{font-size:1.3rem;font-weight:700;color:#059669;margin-top:6px;}#bq-wrap .bq-cm{font-size:1.05rem;color:#7c3aed;font-weight:600;margin-top:4px;}#bq-wrap .bq-ch{display:flex;flex-wrap:wrap;gap:12px;margin:8px 0;}#bq-wrap .bq-c{padding:12px 22px;border:1px solid #c4b5fd;border-radius:100px;font-size:1.1rem;color:#5b21b6;background:#fff;font-weight:500;cursor:pointer;z-index:2147483647;position:relative;user-select:none;}#bq-wrap .bq-c:hover{background:#ede9fe;border-color:#7c3aed;}#bq-wrap .bq-in{display:flex;align-items:center;gap:12px;padding:22px 28px;border-top:1px solid #e5e7eb;}#bq-wrap .bq-ip{flex:1;padding:16px 22px;border:1px solid #d1d5db;border-radius:14px;font-size:1.2rem;outline:none;background:#fff;color:#1f2937;}#bq-wrap .bq-ip:focus{border-color:#7c3aed;}#bq-wrap .bq-sb{width:56px;height:56px;background:#7c3aed;border:none;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;z-index:2147483647;position:relative;}#bq-wrap .bq-sb:disabled{opacity:.4;}#bq-wrap .bq-sb svg{width:26px;height:26px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;}#bq-wrap .bq-sk{padding:10px 22px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:#fff;border-radius:10px;font-size:1.05rem;cursor:pointer;font-weight:600;white-space:nowrap;z-index:2147483647;position:relative;}#bq-wrap .bq-sk:hover{background:rgba(255,255,255,0.25);}#bq-wrap .bq-prof{padding:22px 28px;background:#faf5ff;border-bottom:1px solid #e5e7eb;display:none;}#bq-wrap .bq-prof.open{display:block;}#bq-wrap .bq-pl{font-size:1rem;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.6px;margin-bottom:12px;}@keyframes bqP{0%,100%{opacity:1}50%{opacity:.4}}@media(max-width:1200px){#bq-wrap{flex-direction:column;}#bq-wrap .bq-pw{flex:1;max-width:100%;}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var pw = document.createElement('div');
  pw.className = 'bq-pw';
  pw.innerHTML =
    '<div class="bq-p">' +
    '  <div class="bq-h">' +
    '    <div class="bq-av">' +
    '      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>' +
    '      </svg>' +
    '    </div>' +
    '    <div class="bq-hi">' +
    '      <div class="bq-ht">Smart Beauty Advisor</div>' +
    '      <div class="bq-hs"><span class="bq-hd"></span>Online — typically replies instantly</div>' +
    '    </div>' +
    '    <button class="bq-sk" id="bq-sk">My Skin</button>' +
    '  </div>' +
    '  <div class="bq-prof" id="bq-prof">' +
    '    <div class="bq-pl">Skin Type</div>' +
    '    <div class="bq-ch" id="bq-skc"></div>' +
    '    <div class="bq-pl">Concerns</div>' +
    '    <div class="bq-ch" id="bq-coc"></div>' +
    '  </div>' +
    '  <div class="bq-b" id="bq-b"></div>' +
    '  <div class="bq-in">' +
    '    <input class="bq-ip" id="bq-ip" placeholder="Ask about your skin...">' +
    '    <button class="bq-sb" id="bq-sb"><svg viewBox="0 0 24 24"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zm7.318-19.539l-10.94 10.939"/></svg></button>' +
    '  </div>' +
    '</div>';

  // Insert widget panel after target
  var wrap = document.createElement('div');
  wrap.id = 'bq-wrap';
  parent.insertBefore(wrap, target);
  target.style.flex = '1';
  target.style.minWidth = '0';
  wrap.appendChild(target);
  wrap.appendChild(pw);

  var SK = ['dry', 'oily', 'combination', 'normal', 'sensitive'];
  var CO = ['acne', 'aging', 'hyperpigmentation', 'dehydration', 'redness', 'texture', 'dullness', 'large pores'];
  var prof = { skinType: '', concerns: [] };

  var skc = document.getElementById('bq-skc');
  var coc = document.getElementById('bq-coc');
  var pp = document.getElementById('bq-prof');
  var bd = document.getElementById('bq-b');
  var ip = document.getElementById('bq-ip');
  var sb = document.getElementById('bq-sb');
  if (!skc || !coc || !pp || !bd || !ip || !sb) return;

  SK.forEach(function (t) {
    var b = document.createElement('button');
    b.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    b.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      skc.querySelectorAll('button').forEach(function (c) { c.classList.remove('a'); });
      b.classList.add('a');
      prof.skinType = t;
      ip.value = 'What products are best for ' + t + ' skin' + (prof.concerns.length ? ' with ' + prof.concerns.join(', ') : '') + '?';
      send();
    });
    skc.appendChild(b);
  });

  CO.forEach(function (c) {
    var b = document.createElement('button');
    b.textContent = c.charAt(0).toUpperCase() + c.slice(1);
    b.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      b.classList.toggle('a');
      var idx = prof.concerns.indexOf(c);
      if (idx > -1) prof.concerns.splice(idx, 1); else prof.concerns.push(c);
    });
    coc.appendChild(b);
  });

  document.getElementById('bq-sk').addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    pp.classList.toggle('open');
  });

  // Fallback: capture phase for chip clicks
  document.addEventListener('click', function (e) {
    for (var el = e.target; el; el = el.parentElement) {
      if (el.classList && el.classList.contains('bq-c')) {
        e.preventDefault();
        e.stopPropagation();
        if (el._q) { ip.value = el._q; send(); }
        return;
      }
    }
  }, true);

  function addMsg(html, isUser) {
    var d = document.createElement('div');
    d.className = 'bq-m' + (isUser ? ' bq-mu' : '');
    if (typeof html === 'string' && (html.indexOf('<') >= 0 || html.indexOf('&') >= 0)) d.innerHTML = html;
    else d.textContent = html;
    bd.appendChild(d);
    bd.scrollTop = bd.scrollHeight;
  }

  function normalizeMatch(raw) {
    var n = raw || 0;
    return n >= 1 ? Math.round(n) : Math.round(n * 100);
  }

  function addProdRow(prods) {
    if (!prods || !prods.length) return;

    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'align-self:flex-start;max-width:92%;width:100%';

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:16px';

    prods.slice(0, 2).forEach(function (p) {
      var product = p.product || p;
      var img = product.imageUrl || product.image_url || product.image || '';
      var t = product.title || product.name || product.label || 'Product';
      var pr = product.price ?? product.compare_at_price ?? product.cost;
      var raw = p.match ?? p.score ?? p.similarity ?? 0;
      var mt = normalizeMatch(raw);
      var priceStr = pr != null && pr !== '' ? '$' + (typeof pr === 'number' ? pr.toFixed(2) : pr) : '';

      var cd = document.createElement('div');
      cd.className = 'bq-cd';

      cd.innerHTML = (img
        ? '<img src="' + img + '" alt="" style="width:100%;height:200px;object-fit:cover;display:block;background:#f3f4f6">'
        : '<div class="bq-ci"><div class="bq-cii"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div></div>') +
        '<div style="padding:16px 18px">' +
        '  <div style="font-weight:600;font-size:1.2rem;color:#111827;line-height:1.3">' + t + '</div>' +
        (priceStr ? '<div style="font-size:1.3rem;font-weight:700;color:#059669;margin-top:6px">' + priceStr + '</div>' : '') +
        (mt > 0 ? '<div style="font-size:1.05rem;color:#7c3aed;font-weight:600;margin-top:4px">' + mt + '% match for your skin</div>' : '') +
        '</div>';

      row.appendChild(cd);
    });

    wrapper.appendChild(row);
    bd.appendChild(wrapper);
    bd.scrollTop = bd.scrollHeight;
  }

  function addChips(items) {
    var ch = document.createElement('div');
    ch.className = 'bq-ch';

    items.forEach(function (a) {
      var b = document.createElement('div');
      b.className = 'bq-c';
      b.textContent = a.text;
      b._q = a.query;
      b.__bq_click = function () { ip.value = a.query; send(); };
      b.setAttribute('onclick', 'event.preventDefault();event.stopPropagation();this.__bq_click()');
      ch.appendChild(b);
    });

    bd.appendChild(ch);
    bd.scrollTop = bd.scrollHeight;
  }

  function showDemo() {
    addMsg("Hi! 😊 I'm your skincare advisor. What's your biggest skin concern right now?");
    addChips([
      { text: 'Oily skin help', query: 'I have oily skin, what products should I use?' },
      { text: 'Acne scars', query: 'What products help with acne scars?' },
      { text: 'Dry & sensitive skin', query: 'I have dry and sensitive skin, what do you recommend?' },
      { text: 'Anti-aging tips', query: 'What anti-aging products do you recommend?' },
    ]);
  }

  function send() {
    var text = ip.value.trim();
    if (!text) return;

    addMsg(text, true);
    ip.value = '';
    sb.disabled = true;
    var ld = document.createElement('div');
    ld.style.cssText = 'display:flex;align-items:center;gap:14px;padding:14px 0;align-self:flex-start';
    ld.innerHTML = '<div style="width:12px;height:12px;background:#7c3aed;border-radius:50%;animation:bqP 1.5s infinite"></div>' +
      '<div style="width:12px;height:12px;background:#7c3aed;border-radius:50%;animation:bqP 1.5s infinite"></div>' +
      '<div style="width:12px;height:12px;background:#7c3aed;border-radius:50%;animation:bqP 1.5s infinite"></div>' +
      '<span style="font-size:1.1rem;color:#9ca3af">Finding your perfect skincare match...</span>';

    bd.appendChild(ld);
    bd.scrollTop = bd.scrollHeight;

    fetch(apiUrl + '/widget/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: text,
        shopDomain: shop,
        skinType: prof.skinType,
        skinConcerns: prof.concerns,
        allergies: [],
        productId: (window.location.pathname.split('/').pop() || ''),
      }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        ld.remove();

        var payload = data && (data.payload || data) ? (data.payload || data) : {};
        var msg = payload.explanation || payload.reasoning?.[1] || payload.reasoning?.[0] || '';
        var prods = payload.recommendations || payload.products || [];
        var routine = payload.routine || [];

        // Demo fallback if API returns empty recommendations
        if (!Array.isArray(prods) || prods.length === 0) prods = DEMO_PRODS;

        if (msg) addMsg(msg);
        else addMsg("Great combination to address! Based on your concerns, I'd recommend our top-rated duo for hydration + anti-aging:");

        addProdRow(prods);

        addMsg('Together, these two work synergistically — the serum penetrates deep, and the cream locks in moisture. Want me to add both to your cart? You\'ll save 15% with the bundle.');

        addChips([
          { text: 'Find my products', query: 'What products should I use for my skin type?' },
          { text: 'I have a question', query: 'I have a skincare question' },
        ]);

        sb.disabled = false;
      })
      .catch(function () {
        ld.remove();
        showDemo();
        sb.disabled = false;
      });
  }

  document.getElementById('bq-sb').addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    send();
  });

  ip.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      send();
    }
  });

  ip.addEventListener('click', function (e) {
    e.stopPropagation();
  });

  showDemo();
})();

