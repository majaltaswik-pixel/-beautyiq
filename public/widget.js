(function () {
  if (!window.location.pathname.match(/\/products\/.+/)) return;

  var apiUrl = document.currentScript?.getAttribute('data-api') || 'https://www.beautyiqapp.com';
  var shop = document.currentScript?.getAttribute('data-shop') || window.location.hostname;

  // Demo products (fallback when API returns nothing)
  var DEMO_PRODS = [
    { product: { title: 'Vitamin C Brightening Serum', price: 42.00, imageUrl: '' }, match: 96 },
    { product: { title: 'Deep Hydra Repair Cream', price: 38.00, imageUrl: '' }, match: 94 },
  ];

  // Find product container
  var selectors = ['#ProductInfo', '.product__main', '.product-single__description', '.product-single', '.product-information', '.product__info-wrapper', '.product-info-wrapper', '[data-product-info]', '.product-form__info', '.product__info', '.grid.product', '.product-page--main-content', '#shopify-section-product-template .grid', '.product-template .grid', '.product_area', '#product-info', '.product-info'];
  var productContainer = null;
  for (var i = 0; i < selectors.length; i++) {
    var el = document.querySelector(selectors[i]);
    if (el && el.offsetParent !== null) { productContainer = el; break; }
  }
  if (!productContainer) {
    var grids = document.querySelectorAll('.grid, .row, .product-layout');
    for (var i = 0; i < grids.length; i++) {
      var kids = grids[i].children;
      if (kids.length >= 2) { var hasForm = false; for (var j = 0; j < kids.length; j++) { if (kids[j].querySelector('form[action*="cart"], [type="submit"], .product-form')) { hasForm = true; break; } } if (hasForm) { productContainer = grids[i]; break; } }
    }
  }
  if (!productContainer) return;
  var containerParent = productContainer.parentElement;
  if (!containerParent) return;

  // Get current product info
  var curProd = { title: '', image: '' };
  var titleEl = document.querySelector('h1[class*="title"], .product__title, [class*="product-title"]');
  if (titleEl) curProd.title = titleEl.textContent?.trim() || '';
  var imgEl = document.querySelector('.product__media img, .product-single__media img, [class*="product"] img');
  if (imgEl) curProd.image = imgEl.src || '';

  // Styles
  var style = document.createElement('style');
  style.textContent = '#bq-wrap{all:initial;display:flex;gap:24px;align-items:flex-start;margin:24px 0;}#bq-wrap>*{flex:1;min-width:0;}#bq-wrap .bq-pw{flex:0 0 340px;max-width:340px;}.bq-p{border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif;}.bq-p *{box-sizing:border-box;}.bq-h{padding:14px 16px;background:linear-gradient(135deg,#7c3aed,#9333ea);color:#fff;display:flex;justify-content:space-between;align-items:center;}.bq-hl{display:flex;align-items:center;gap:8px;}.bq-av{width:28px;height:28px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;}.bq-hd{font-weight:700;font-size:13px;}.bq-sub{font-size:10px;color:rgba(255,255,255,0.7);}.bq-sk{padding:4px 10px;background:rgba(255,255,255,0.15);border:none;color:#fff;border-radius:5px;font-size:11px;cursor:pointer;font-weight:600;}.bq-sk:hover{background:rgba(255,255,255,0.25);}.bq-prof{padding:12px 16px;background:#faf5ff;border-bottom:1px solid #e5e7eb;display:none;}.bq-prof.open{display:block;}.bq-pl{font-size:10px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;}.bq-ch{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;}.bq-c{padding:4px 10px;border:1px solid #d1d5db;border-radius:14px;font-size:11px;cursor:pointer;background:#fff;color:#4b5563;}.bq-c.a{border-color:#7c3aed;background:#ede9fe;color:#7c3aed;font-weight:600;}.bq-c:hover{border-color:#a78bfa;}.bq-b{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;min-height:200px;max-height:420px;}.bq-m{max-width:88%;padding:9px 13px;border-radius:11px;font-size:12px;line-height:1.5;word-wrap:break-word;}.bq-mb{background:#fff;border-bottom-left-radius:3px;align-self:flex-start;color:#1f2937;box-shadow:0 1px 3px rgba(0,0,0,.06);}.bq-mu{background:#7c3aed;border-bottom-right-radius:3px;align-self:flex-end;color:#fff;}.bq-pc{display:flex;flex-direction:column;gap:8px;align-self:stretch;margin:2px 0;}.bq-cd{display:flex;gap:10px;padding:10px;background:#fff;border:1px solid #e5e7eb;border-radius:9px;align-items:center;}.bq-ci{width:50px;height:50px;border-radius:6px;object-fit:cover;background:#f3f4f6;flex-shrink:0;}.bq-ci2{width:50px;height:50px;border-radius:6px;background:#f3f4f6;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:18px;color:#d1d5db;}.bq-cii{flex:1;min-width:0;}.bq-ct{font-weight:600;color:#111827;font-size:12px;}.bq-cp{color:#059669;font-weight:700;font-size:12px;margin-top:1px;}.bq-cm{color:#7c3aed;font-size:9px;font-weight:600;}.bq-ca{background:#7c3aed;color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;}.bq-ca:hover{background:#6d28d9;}.bq-ca2{background:#059669;color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;}.bq-ca2:hover{background:#047857;}.bq-ft{border-top:1px solid #e5e7eb;padding:9px 12px;display:flex;gap:6px;background:#fff;}.bq-i{flex:1;border:1px solid #d1d5db;border-radius:7px;padding:8px 10px;font-size:12px;outline:none;}.bq-i:focus{border-color:#7c3aed;}.bq-s{background:#7c3aed;color:#fff;border:none;border-radius:7px;padding:8px 14px;cursor:pointer;font-weight:600;font-size:12px;}.bq-s:disabled{opacity:.4;cursor:default;}.bq-l{display:flex;align-items:center;gap:6px;padding:4px;}.bq-d{width:6px;height:6px;background:#7c3aed;border-radius:50%;animation:bqP 1.5s infinite;}.bq-lt{color:#9ca3af;font-size:11px;}.bq-q{display:flex;gap:5px;flex-wrap:wrap;margin:2px 0;align-self:flex-start;}.bq-qb{padding:5px 11px;border:1px solid #c4b5fd;border-radius:100px;font-size:10px;background:#fff;color:#5b21b6;font-weight:500;cursor:pointer;}.bq-qb:hover{background:#ede9fe;border-color:#7c3aed;}@media(max-width:768px){#bq-wrap{flex-direction:column;}#bq-wrap .bq-pw{flex:1;max-width:100%;}}@keyframes bqP{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.3)}}';
  document.head.appendChild(style);

  // Insert widget
  var wrap = document.createElement('div');
  wrap.id = 'bq-wrap';
  wrap.innerHTML =
    '<div class="bq-pw"><div class="bq-p">' +
    '<div class="bq-h"><div class="bq-hl"><div class="bq-av">✦</div><div><div class="bq-hd">Smart Beauty Advisor</div><div class="bq-sub">by <span>beautyiq</span></div></div></div><button class="bq-sk" id="bq-sk">My Skin</button></div>' +
    '<div class="bq-prof" id="bq-prof"><div class="bq-pl">Skin Type</div><div class="bq-ch" id="bq-skc"></div><div class="bq-pl">Concerns</div><div class="bq-ch" id="bq-coc"></div></div>' +
    '<div class="bq-b" id="bq-b"></div>' +
    '<div class="bq-ft"><input class="bq-i" id="bq-i" placeholder="Ask about your skin..."><button class="bq-s" id="bq-s">Send</button></div>' +
    '</div></div>';
  var cw = document.createElement('div');
  cw.style.flex = '1';
  cw.style.minWidth = '0';
  containerParent.insertBefore(wrap, productContainer);
  cw.appendChild(productContainer);
  wrap.insertBefore(cw, wrap.firstChild);

  var SK = ['dry','oily','combination','normal','sensitive'];
  var CO = ['acne','aging','hyperpigmentation','dehydration','redness','texture','dullness','large pores'];
  var prof = { skinType: '', concerns: [] };

  var skc = document.getElementById('bq-skc');
  var coc = document.getElementById('bq-coc');
  var pp = document.getElementById('bq-prof');
  var bd = document.getElementById('bq-b');
  var ip = document.getElementById('bq-i');
  var sd = document.getElementById('bq-s');
  if (!skc || !coc || !pp || !bd || !ip || !sd) return;

  SK.forEach(function (t) {
    var b = document.createElement('button');
    b.className = 'bq-c';
    b.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    b.onclick = function () { skc.querySelectorAll('.bq-c').forEach(function (c) { c.classList.remove('a'); }); b.classList.add('a'); prof.skinType = t; ip.value = 'What products are best for ' + t + ' skin' + (prof.concerns.length ? ' with ' + prof.concerns.join(', ') : '') + '?'; sd.disabled = false; send(); };
    skc.appendChild(b);
  });
  CO.forEach(function (c) {
    var b = document.createElement('button');
    b.className = 'bq-c';
    b.textContent = c.charAt(0).toUpperCase() + c.slice(1);
    b.onclick = function () { b.classList.toggle('a'); var idx = prof.concerns.indexOf(c); if (idx > -1) prof.concerns.splice(idx, 1); else prof.concerns.push(c); };
    coc.appendChild(b);
  });
  document.getElementById('bq-sk').onclick = function () { pp.classList.toggle('open'); };

  function addMsg(text, role) {
    var d = document.createElement('div');
    d.className = 'bq-m ' + (role === 'user' ? 'bq-mu' : 'bq-mb');
    d.textContent = text;
    bd.appendChild(d);
    bd.scrollTop = bd.scrollHeight;
  }

  function addProducts(prods, upsell) {
    if (!prods || !prods.length) return;
    var pc = document.createElement('div');
    pc.className = 'bq-pc';
    prods.slice(0, 4).forEach(function (p) {
      var img = p.product?.imageUrl || p.metadata?.imageUrl || '';
      var t = p.product?.title || p.metadata?.title || p.label || 'Product';
      var pr = p.product?.price || p.metadata?.price;
      var raw = p.match || p.score || 0;
      var mt = raw >= 1 ? Math.round(raw) : Math.round(raw * 100);
      var vid = p.product?.variants?.[0]?.id || p.variantId || '';
      var cd = document.createElement('div');
      cd.className = 'bq-cd';
      var priceStr = pr ? '$' + (typeof pr === 'number' ? pr.toFixed(2) : pr) : '';
      cd.innerHTML = (img ? '<img class="bq-ci" src="' + img + '" alt="" loading="lazy">' : '<div class="bq-ci2">✦</div>') +
        '<div class="bq-cii"><div class="bq-ct">' + t + '</div>' + (priceStr ? '<div class="bq-cp">' + priceStr + '</div>' : '') + (mt > 0 ? '<div class="bq-cm">' + mt + '% match</div>' : '') + '</div>' +
        (upsell ? '<button class="bq-ca2" data-act="upsell">Add Both</button>' : '<button class="bq-ca" data-vid="' + vid + '">Add</button>');
      pc.appendChild(cd);
    });
    bd.appendChild(pc);
    bd.scrollTop = bd.scrollHeight;
  }

  function addQuick(btns) {
    var q = document.createElement('div');
    q.className = 'bq-q';
    btns.forEach(function (a) {
      var b = document.createElement('button');
      b.className = 'bq-qb';
      b.textContent = a.text;
      b.onclick = function () { ip.value = a.query; send(); };
      q.appendChild(b);
    });
    bd.appendChild(q);
    bd.scrollTop = bd.scrollHeight;
  }

  // Demo greeting with products
  function showDemo(msg, showProds) {
    addMsg(msg, 'bot');
    if (showProds) {
      addProducts(DEMO_PRODS, true);
      addMsg('Together, these two work synergistically — the serum penetrates deep, and the cream locks in moisture. Want me to add both to your cart? You\'ll save 15% with the bundle.', 'bot');
    }
    addQuick([
      { text: 'Find my products', query: 'What products should I use for my skin type?' },
      { text: 'I have a question', query: 'I have a skincare question' },
    ]);
  }

  function send() {
    var text = ip.value.trim();
    if (!text) return;
    addMsg(text, 'user');
    ip.value = '';
    sd.disabled = true;
    sd.textContent = '...';
    var ld = document.createElement('div');
    ld.className = 'bq-l';
    ld.innerHTML = '<div class="bq-d"></div><div class="bq-d" style="animation-delay:.2s"></div><div class="bq-d" style="animation-delay:.4s"></div><span class="bq-lt">Analyzing your skin...</span>';
    bd.appendChild(ld);
    bd.scrollTop = bd.scrollHeight;
    fetch(apiUrl + '/widget/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: text, shopDomain: shop, skinType: prof.skinType, skinConcerns: prof.concerns, allergies: [], productId: window.location.pathname.split('/').pop() || '' }),
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      ld.remove();
      var payload = data.payload || data;
      var msg = payload.explanation || payload.reasoning?.[1] || payload.reasoning?.[0] || '';
      var prods = payload.recommendations || payload.products || [];
      var routine = payload.routine || [];
      if (msg) addMsg(msg, 'bot');
      if (prods.length) addProducts(prods, false);
      else addProducts(DEMO_PRODS, false);
      if (routine && routine.length) {
        var rd = document.createElement('div');
        rd.className = 'bq-m bq-mb';
        var h = '<div style="font-weight:700;font-size:11px;color:#7c3aed;margin-bottom:4px;">Your Routine</div>';
        routine.forEach(function (s, i) { h += '<div style="display:flex;align-items:center;gap:5px;padding:3px 0;font-size:11px;"><span style="width:16px;height:16px;background:#7c3aed;color:#fff;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:7px;font-weight:700;">' + (i + 1) + '</span><span>' + s.name + '</span></div>'; });
        rd.innerHTML = h;
        bd.appendChild(rd);
      }
      addQuick([
        { text: 'Find my products', query: 'What products should I use for my skin type?' },
        { text: 'I have a question', query: 'I have a skincare question' },
      ]);
      bd.scrollTop = bd.scrollHeight;
      sd.disabled = false;
      sd.textContent = 'Send';
    })
    .catch(function () {
      ld.remove();
      showDemo('Hi! I\'m your skincare advisor. What\'s your biggest skin concern right now?', true);
      sd.disabled = false;
      sd.textContent = 'Send';
    });
  }

  // Init
  sd.onclick = send;
  ip.onkeydown = function (e) { if (e.key === 'Enter') send(); };
  showDemo('Hi! I\'m your skincare advisor. What\'s your biggest skin concern right now?', true);
})();
