(function () {
  if (!window.location.pathname.match(/\/products\/.+/)) return;

  var apiUrl = document.currentScript?.getAttribute('data-api') || 'https://www.beautyiqapp.com';
  var shop = document.currentScript?.getAttribute('data-shop') || window.location.hostname;

  var DEMO_PRODS = [
    { product: { title: 'Vitamin C Brightening Serum', price: 42.00, imageUrl: '' }, match: 96 },
    { product: { title: 'Deep Hydra Repair Cream', price: 38.00, imageUrl: '' }, match: 94 },
  ];

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

  var style = document.createElement('style');
  style.textContent = '#bq-wrap all:initial;display:flex;gap:32px;align-items:flex-start;margin:32px 0}#bq-wrap>*{flex:1;min-width:0}#bq-wrap .bq-pw{flex:0 0 360px;max-width:360px}.bq-p{background:#f9fafb;border:1px solid #d1d5db;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif}.bq-p *{box-sizing:border-box}.bq-h{padding:18px 20px;background:linear-gradient(135deg,#7c3aed,#9333ea);display:flex;align-items:center;gap:12px}.bq-av{width:44px;height:44px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}.bq-hi{flex:1}.bq-ht{font-size:1.05rem;font-weight:700;color:#fff}.bq-hs{font-size:0.85rem;color:rgba(255,255,255,0.85);display:flex;align-items:center;gap:5px;margin-top:2px}.bq-hd{width:8px;height:8px;background:#4ade80;border-radius:50%}.bq-b{flex:1;padding:20px;display:flex;flex-direction:column;gap:14px;min-height:200px;max-height:420px;overflow-y:auto}.bq-m{background:#fff;padding:16px 18px;border-radius:14px;border-bottom-left-radius:4px;font-size:1rem;color:#1f2937;line-height:1.6;box-shadow:0 1px 3px rgba(0,0,0,.08);align-self:flex-start;max-width:90%}.bq-mu{align-self:flex-end;background:#7c3aed;color:#fff;border-bottom-left-radius:14px;border-bottom-right-radius:4px}.bq-cr{display:flex;gap:12px;align-self:stretch;margin:4px 0}.bq-cd{flex:1;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;min-width:0}.bq-cd img{width:100%;height:140px;object-fit:cover;display:block;background:#f3f4f6}.bq-ci{width:100%;height:140px;background:#f3f4f6;display:flex;align-items:center;justify-content:center}.bq-cii{padding:12px 14px 14px}.bq-ct{font-weight:600;font-size:0.95rem;color:#111827;line-height:1.3}.bq-cp{font-size:1rem;font-weight:700;color:#059669;margin-top:4px}.bq-cm{font-size:0.82rem;color:#7c3aed;font-weight:600;margin-top:3px}.bq-ch{display:flex;flex-wrap:wrap;gap:10px;margin:4px 0}.bq-c{padding:9px 16px;border:1px solid #c4b5fd;border-radius:100px;font-size:0.85rem;color:#5b21b6;background:#fff;font-weight:500;cursor:pointer}.bq-c:hover{background:#ede9fe;border-color:#7c3aed}.bq-in{display:flex;align-items:center;gap:10px;padding:16px 20px;border-top:1px solid #e5e7eb}.bq-ip{flex:1;padding:12px 18px;border:1px solid #d1d5db;border-radius:12px;font-size:0.95rem;outline:none;background:#fff;color:#1f2937}.bq-ip:focus{border-color:#7c3aed}.bq-sb{width:44px;height:44px;background:#7c3aed;border:none;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer}.bq-sb:disabled{opacity:.4}.bq-sb svg{width:20px;height:20px;stroke:#fff;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.bq-sk{padding:6px 14px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);color:#fff;border-radius:8px;font-size:0.82rem;cursor:pointer;font-weight:600;white-space:nowrap}.bq-sk:hover{background:rgba(255,255,255,0.25)}.bq-prof{padding:16px 20px;background:#faf5ff;border-bottom:1px solid #e5e7eb;display:none}.bq-prof.open{display:block}.bq-pl{font-size:0.78rem;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.4px;margin-bottom:8px}.bq-sc{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.bq-sc button{padding:7px 14px;border:1px solid #d1d5db;border-radius:18px;font-size:0.82rem;cursor:pointer;background:#fff;color:#4b5563}.bq-sc button.a{border-color:#7c3aed;background:#ede9fe;color:#7c3aed;font-weight:600}.bq-sc button:hover{border-color:#a78bfa}.bq-load{display:flex;align-items:center;gap:10px;padding:10px 0}.bq-dot{width:8px;height:8px;background:#7c3aed;border-radius:50%;animation:bqP 1.5s infinite}.bq-lt{font-size:0.85rem;color:#9ca3af}@keyframes bqP{0%,100%{opacity:1}50%{opacity:.4}}@media(max-width:768px){#bq-wrap{flex-direction:column}#bq-wrap .bq-pw{flex:1;max-width:100%}}';
  document.head.appendChild(style);

  var wrap = document.createElement('div');
  wrap.id = 'bq-wrap';
  wrap.innerHTML =
    '<div class="bq-pw"><div class="bq-p">' +
    '<div class="bq-h"><div class="bq-av"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div><div class="bq-hi"><div class="bq-ht">Smart Beauty Advisor</div><div class="bq-hs"><span class="bq-hd"></span>Online — typically replies instantly</div></div><button class="bq-sk" id="bq-sk">My Skin</button></div>' +
    '<div class="bq-prof" id="bq-prof"><div class="bq-pl">Skin Type</div><div class="bq-sc" id="bq-skc"></div><div class="bq-pl">Concerns</div><div class="bq-sc" id="bq-coc"></div></div>' +
    '<div class="bq-b" id="bq-b"></div>' +
    '<div class="bq-in"><input class="bq-ip" id="bq-ip" placeholder="Ask about your skin..."><button class="bq-sb" id="bq-sb"><svg viewBox="0 0 24 24"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zm7.318-19.539l-10.94 10.939"/></svg></button></div>' +
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
  var ip = document.getElementById('bq-ip');
  var sb = document.getElementById('bq-sb');
  if (!skc || !coc || !pp || !bd || !ip || !sb) return;

  SK.forEach(function (t) {
    var b = document.createElement('button');
    b.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    b.onclick = function () { skc.querySelectorAll('button').forEach(function (c) { c.classList.remove('a'); }); b.classList.add('a'); prof.skinType = t; ip.value = 'What products are best for ' + t + ' skin' + (prof.concerns.length ? ' with ' + prof.concerns.join(', ') : '') + '?'; send(); };
    skc.appendChild(b);
  });
  CO.forEach(function (c) {
    var b = document.createElement('button');
    b.textContent = c.charAt(0).toUpperCase() + c.slice(1);
    b.onclick = function () { b.classList.toggle('a'); var idx = prof.concerns.indexOf(c); if (idx > -1) prof.concerns.splice(idx, 1); else prof.concerns.push(c); };
    coc.appendChild(b);
  });
  document.getElementById('bq-sk').onclick = function () { pp.classList.toggle('open'); };

  function addMsg(html, isUser) {
    var d = document.createElement('div');
    d.className = 'bq-m' + (isUser ? ' bq-mu' : '');
    if (typeof html === 'string' && (html.indexOf('<') >= 0 || html.indexOf('&') >= 0)) d.innerHTML = html;
    else d.textContent = html;
    bd.appendChild(d);
    bd.scrollTop = bd.scrollHeight;
  }

  function addProdRow(prods) {
    if (!prods || !prods.length) return;
    var wrapper = document.createElement('div');
    wrapper.style.cssText = 'align-self:flex-start;max-width:90%;width:100%';
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px';
    prods.slice(0, 2).forEach(function (p) {
      var img = p.product?.imageUrl || p.metadata?.imageUrl || '';
      var t = p.product?.title || p.metadata?.title || p.label || 'Product';
      var pr = p.product?.price || p.metadata?.price;
      var raw = p.match || p.score || 0;
      var mt = raw >= 1 ? Math.round(raw) : Math.round(raw * 100);
      var priceStr = pr ? '$' + (typeof pr === 'number' ? pr.toFixed(2) : pr) : '';
      var cd = document.createElement('div');
      cd.style.cssText = 'flex:1;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;min-width:0';
      cd.innerHTML = (img ? '<img src="' + img + '" alt="" style="width:100%;height:120px;object-fit:cover;display:block;background:#f3f4f6">' : '<div style="width:100%;height:120px;background:#f3f4f6;display:flex;align-items:center;justify-content:center"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>') +
        '<div style="padding:10px 12px"><div style="font-weight:600;font-size:0.9rem;color:#111827;line-height:1.3">' + t + '</div>' + (priceStr ? '<div style="font-size:0.95rem;font-weight:700;color:#059669;margin-top:3px">' + priceStr + '</div>' : '') + (mt > 0 ? '<div style="font-size:0.78rem;color:#7c3aed;font-weight:600;margin-top:2px">' + mt + '% match for your skin</div>' : '') + '</div>';
      row.appendChild(cd);
    });
    wrapper.appendChild(row);
    bd.appendChild(wrapper);
    bd.scrollTop = bd.scrollHeight;
  }

  function addChips(items) {
    var ch = document.createElement('div');
    ch.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;margin:4px 0;align-self:flex-start;max-width:90%';
    items.forEach(function (a) {
      var b = document.createElement('button');
      b.style.cssText = 'padding:9px 16px;border:1px solid #c4b5fd;border-radius:100px;font-size:0.85rem;color:#5b21b6;background:#fff;font-weight:500;cursor:pointer';
      b.onmouseenter = function () { b.style.background = '#ede9fe'; b.style.borderColor = '#7c3aed'; };
      b.onmouseleave = function () { b.style.background = '#fff'; b.style.borderColor = '#c4b5fd'; };
      b.textContent = a.text;
      b.onclick = function () { ip.value = a.query; send(); };
      ch.appendChild(b);
    });
    bd.appendChild(ch);
    bd.scrollTop = bd.scrollHeight;
  }

  function showDemo() {
    addMsg('Hi! 😊 I\'m your skincare advisor. What\'s your biggest skin concern right now?');
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
    ld.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 0;align-self:flex-start';
    ld.innerHTML = '<div style="width:8px;height:8px;background:#7c3aed;border-radius:50%;animation:bqP1 1.5s infinite"></div><div style="width:8px;height:8px;background:#7c3aed;border-radius:50%;animation:bqP2 1.5s infinite"></div><div style="width:8px;height:8px;background:#7c3aed;border-radius:50%;animation:bqP3 1.5s infinite"></div><span style="font-size:0.85rem;color:#9ca3af">Finding your perfect skincare match...</span>';
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
      if (msg) addMsg(msg);
      else addMsg('Great combination to address! Based on your concerns, I\'d recommend our top-rated duo for hydration + anti-aging:');
      if (prods.length) { addProdRow(prods); } else { addProdRow(DEMO_PRODS); }
      addMsg('Together, these two work synergistically — the serum penetrates deep, and the cream locks in moisture. Want me to add both to your cart? You\'ll save 15% with the bundle.');
      if (routine && routine.length) {
        var h = '<div style="font-weight:700;font-size:0.9rem;color:#7c3aed;margin-bottom:6px">Your Routine</div>';
        routine.forEach(function (s, i) { h += '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;font-size:0.88rem"><span style="width:22px;height:22px;background:#7c3aed;color:#fff;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:0.7rem;font-weight:700">' + (i + 1) + '</span><span>' + s.name + '</span></div>'; });
        addMsg(h);
      }
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

  sb.onclick = send;
  ip.onkeydown = function (e) { if (e.key === 'Enter') send(); };
  showDemo();
})();
