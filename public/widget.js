(function () {
  if (!window.location.pathname.match(/\/products\/.+/)) return;

  var apiUrl = document.currentScript?.getAttribute('data-api') || 'https://www.beautyiqapp.com';
  var shop = document.currentScript?.getAttribute('data-shop') || window.location.hostname;

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
      if (kids.length >= 2) {
        var hasForm = false;
        for (var j = 0; j < kids.length; j++) { if (kids[j].querySelector('form[action*="cart"], [type="submit"], .product-form')) { hasForm = true; break; } }
        if (hasForm) { productContainer = grids[i]; break; }
      }
    }
  }
  if (!productContainer) return;
  var containerParent = productContainer.parentElement;
  if (!containerParent) return;

  var productTitle = '';
  var productImage = '';
  var titleEl = document.querySelector('h1[class*="title"], .product__title, [class*="product-title"]');
  if (titleEl) productTitle = titleEl.textContent?.trim() || '';
  var imgEl = document.querySelector('.product__media img, .product-single__media img, [class*="product"] img');
  if (imgEl) productImage = imgEl.src || '';

  var style = document.createElement('style');
  style.textContent = '#bq-advisor-wrap{all:initial;display:flex;gap:24px;align-items:flex-start;margin:24px 0;}#bq-advisor-wrap>*{flex:1;min-width:0;}#bq-advisor-wrap .bq-panel-wrap{flex:0 0 340px;max-width:340px;}.bq-panel{background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif;}.bq-panel *{box-sizing:border-box;margin:0;padding:0;}.bq-header{padding:14px 16px;background:linear-gradient(135deg,#7c3aed,#9333ea);color:#fff;display:flex;justify-content:space-between;align-items:center;}.bq-header-l{display:flex;align-items:center;gap:8px;}.bq-av{width:28px;height:28px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;}.bq-hd{font-weight:700;font-size:13px;}.bq-sub{font-size:10px;color:rgba(255,255,255,0.7);}.bq-skin-toggle{padding:4px 10px;background:rgba(255,255,255,0.15);border:none;color:#fff;border-radius:5px;font-size:11px;cursor:pointer;font-weight:600;}.bq-skin-toggle:hover{background:rgba(255,255,255,0.25);}.bq-prof{padding:12px 16px;background:#faf5ff;border-bottom:1px solid #e5e7eb;display:none;}.bq-prof.open{display:block;}.bq-prof-lbl{font-size:10px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;}.bq-chips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;}.bq-chip{padding:4px 10px;border:1px solid #d1d5db;border-radius:14px;font-size:11px;cursor:pointer;background:#fff;color:#4b5563;transition:all .12s;}.bq-chip.active{border-color:#7c3aed;background:#ede9fe;color:#7c3aed;font-weight:600;}.bq-chip:hover{border-color:#a78bfa;}.bq-body{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;min-height:200px;max-height:420px;}.bq-msg{max-width:88%;padding:9px 13px;border-radius:11px;font-size:12px;line-height:1.5;word-wrap:break-word;}.bq-msg-bot{background:#fff;border-bottom-left-radius:3px;align-self:flex-start;color:#1f2937;box-shadow:0 1px 3px rgba(0,0,0,.06);}.bq-msg-user{background:#7c3aed;border-bottom-right-radius:3px;align-self:flex-end;color:#fff;}.bq-prods{display:flex;flex-direction:column;gap:8px;align-self:stretch;margin:4px 0;}.bq-pcard{display:flex;gap:10px;padding:10px;background:#fff;border:1px solid #e5e7eb;border-radius:9px;align-items:center;}.bq-pimg{width:50px;height:50px;border-radius:6px;object-fit:cover;background:#f3f4f6;flex-shrink:0;}.bq-pinfo{flex:1;min-width:0;}.bq-pn{font-weight:600;color:#111827;font-size:12px;line-height:1.3;}.bq-pp{color:#059669;font-weight:700;font-size:12px;margin-top:2px;}.bq-pstep{font-size:9px;color:#7c3aed;font-weight:600;text-transform:uppercase;letter-spacing:.3px;margin-bottom:2px;}.bq-padd{background:#7c3aed;color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;}.bq-padd:hover{background:#6d28d9;}.bq-foot{border-top:1px solid #e5e7eb;padding:9px 12px;display:flex;gap:6px;background:#fff;}.bq-inp{flex:1;border:1px solid #d1d5db;border-radius:7px;padding:8px 10px;font-size:12px;outline:none;}.bq-inp:focus{border-color:#7c3aed;}.bq-snd{background:#7c3aed;color:#fff;border:none;border-radius:7px;padding:8px 14px;cursor:pointer;font-weight:600;font-size:12px;}.bq-snd:disabled{opacity:.4;cursor:default;}.bq-load{display:flex;align-items:center;gap:6px;padding:4px;}.bq-dot{width:6px;height:6px;background:#7c3aed;border-radius:50%;animation:bqP 1.5s infinite;}.bq-ltxt{color:#9ca3af;font-size:11px;}.bq-quick{display:flex;gap:5px;flex-wrap:wrap;margin:2px 0;align-self:flex-start;}.bq-quick-btn{padding:5px 11px;border:1px solid #c4b5fd;border-radius:100px;font-size:10px;background:#fff;color:#5b21b6;font-weight:500;cursor:pointer;transition:all .12s;}.bq-quick-btn:hover{background:#ede9fe;border-color:#7c3aed;}@media(max-width:768px){#bq-advisor-wrap{flex-direction:column;}#bq-advisor-wrap .bq-panel-wrap{flex:1;max-width:100%;}}@keyframes bqP{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.3)}}';
  document.head.appendChild(style);

  var advisorHTML =
    '<div class="bq-panel">' +
    '<div class="bq-header">' +
    '<div class="bq-header-l"><div class="bq-av">✦</div><div><div class="bq-hd">Smart Beauty Advisor</div><div class="bq-sub">by <span>beautyiq</span></div></div></div>' +
    '<button class="bq-skin-toggle" id="bq-sk">My&nbsp;Skin</button>' +
    '</div>' +
    '<div class="bq-prof" id="bq-prof">' +
    '<div class="bq-prof-lbl">Skin Type</div><div class="bq-chips" id="bq-sk-chips"></div>' +
    '<div class="bq-prof-lbl">Concerns</div><div class="bq-chips" id="bq-co-chips"></div>' +
    '</div>' +
    '<div class="bq-body" id="bq-body"></div>' +
    '<div class="bq-foot"><input class="bq-inp" id="bq-inp" placeholder="Ask about your skin..."><button class="bq-snd" id="bq-snd">Send</button></div>' +
    '</div>';

  var wrap = document.createElement('div');
  wrap.id = 'bq-advisor-wrap';
  var contentWrap = document.createElement('div');
  contentWrap.style.flex = '1';
  contentWrap.style.minWidth = '0';
  contentWrap.className = 'bq-content-wrap';
  var panelWrap = document.createElement('div');
  panelWrap.className = 'bq-panel-wrap';
  panelWrap.innerHTML = advisorHTML;
  containerParent.insertBefore(wrap, productContainer);
  contentWrap.appendChild(productContainer);
  wrap.appendChild(contentWrap);
  wrap.appendChild(panelWrap);

  var SKIN_TYPES = ['dry','oily','combination','normal','sensitive'];
  var CONCERNS = ['acne','aging','hyperpigmentation','dehydration','redness','texture','dullness','large pores'];
  var profile = { skinType: '', concerns: [] };

  var skChips = document.getElementById('bq-sk-chips');
  var coChips = document.getElementById('bq-co-chips');
  var profPanel = document.getElementById('bq-prof');
  var body = document.getElementById('bq-body');
  var inp = document.getElementById('bq-inp');
  var snd = document.getElementById('bq-snd');
  if (!skChips || !coChips || !profPanel || !body || !inp || !snd) return;

  SKIN_TYPES.forEach(function (t) {
    var b = document.createElement('button');
    b.className = 'bq-chip';
    b.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    b.onclick = function () {
      skChips.querySelectorAll('.bq-chip').forEach(function (c) { c.classList.remove('active'); });
      b.classList.add('active');
      profile.skinType = t;
      inp.value = 'What products are best for ' + t + ' skin' + (profile.concerns.length ? ' with ' + profile.concerns.join(', ') : '') + '?';
      send();
    };
    skChips.appendChild(b);
  });

  CONCERNS.forEach(function (c) {
    var b = document.createElement('button');
    b.className = 'bq-chip';
    b.textContent = c.charAt(0).toUpperCase() + c.slice(1);
    b.onclick = function () {
      b.classList.toggle('active');
      var idx = profile.concerns.indexOf(c);
      if (idx > -1) profile.concerns.splice(idx, 1);
      else profile.concerns.push(c);
    };
    coChips.appendChild(b);
  });

  document.getElementById('bq-sk').onclick = function () { profPanel.classList.toggle('open'); };

  function greeting() {
    var m = document.createElement('div');
    m.className = 'bq-msg bq-msg-bot';
    m.textContent = productTitle ? "I know " + productTitle + " — want recommendations or a full routine?" : "Hi! I'll help you find the perfect products for your skin. What do you need?";
    body.appendChild(m);
    var q = document.createElement('div');
    q.className = 'bq-quick';
    var actions = [
      { text: 'Find my products', query: 'What products should I use for my skin type?' },
    ];
    if (productTitle) {
      actions.push({ text: 'Complete my routine', query: 'What products go well with ' + productTitle + '? Build me a full routine' });
    }
    actions.push({ text: 'I have a question', query: 'I have a skincare question' });
    actions.forEach(function (a) {
      var btn = document.createElement('button');
      btn.className = 'bq-quick-btn';
      btn.textContent = a.text;
      btn.onclick = function () { inp.value = a.query; send(); };
      q.appendChild(btn);
    });
    body.appendChild(q);
  }

  function push(text, role, products, routine) {
    var d = document.createElement('div');
    d.className = 'bq-msg ' + (role === 'user' ? 'bq-msg-user' : 'bq-msg-bot');
    d.textContent = text;
    body.appendChild(d);
    // Show routine steps if available
    if (routine && routine.length) {
      var rd = document.createElement('div');
      rd.className = 'bq-msg bq-msg-bot';
      var html = '<div style="font-weight:700;font-size:11px;color:#7c3aed;margin-bottom:6px;">Your Routine</div>';
      routine.forEach(function (s, i) {
        html += '<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:11px;"><span style="width:18px;height:18px;background:#7c3aed;color:#fff;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;flex-shrink:0;">' + (i + 1) + '</span><span>' + s.name + '</span></div>';
      });
      rd.innerHTML = html;
      body.appendChild(rd);
    }
    // Show product cards if available
    if (products && products.length) {
      var pd = document.createElement('div');
      pd.className = 'bq-prods';
      products.slice(0, 5).forEach(function (p) {
        var c = document.createElement('div');
        c.className = 'bq-pcard';
        var img = p.product?.imageUrl || p.metadata?.imageUrl || '';
        var t = p.product?.title || p.metadata?.title || p.label || 'Product';
        var pr = p.product?.price || p.metadata?.price;
        var step = p.product?.step || p.metadata?.step || '';
        c.innerHTML = (img ? '<img class="bq-pimg" src="' + img + '" alt="" loading="lazy">' : '<div class="bq-pimg"></div>') +
          '<div class="bq-pinfo">' +
          (step ? '<div class="bq-pstep">' + step + '</div>' : '') +
          '<div class="bq-pn">' + t + '</div>' +
          (pr ? '<div class="bq-pp">$' + pr + '</div>' : '') +
          '</div>' +
          '<button class="bq-padd" data-variant-id="' + (p.product?.variants?.[0]?.id || p.variantId || '') + '" data-qty="1">Add</button>';
        pd.appendChild(c);
      });
      body.appendChild(pd);
    }
    body.scrollTop = body.scrollHeight;
  }

  // Delegate add-to-cart clicks
  body.addEventListener('click', function (e) {
    var btn = e.target.closest('.bq-padd');
    if (!btn) return;
    var vid = btn.getAttribute('data-variant-id');
    if (!vid) return;
    btn.textContent = '...';
    var formData = new FormData();
    formData.append('id', vid);
    formData.append('quantity', btn.getAttribute('data-qty') || '1');
    fetch('/cart/add.js', { method: 'POST', body: formData })
      .then(function (r) {
        if (!r.ok) throw new Error();
        btn.textContent = '✓ Added';
        btn.style.background = '#059669';
        // Update cart count
        var cartCount = document.querySelector('.cart-count-bubble span, .cart-count, [data-cart-count]');
        if (cartCount) cartCount.textContent = parseInt(cartCount.textContent || '0') + 1;
      })
      .catch(function () { btn.textContent = 'Add'; });
  });

  function send() {
    var text = inp.value.trim();
    if (!text) return;
    push(text, 'user');
    inp.value = '';
    snd.disabled = true;
    snd.textContent = '...';
    var ld = document.createElement('div');
    ld.className = 'bq-load';
    ld.innerHTML = '<div class="bq-dot"></div><div class="bq-dot" style="animation-delay:.2s"></div><div class="bq-dot" style="animation-delay:.4s"></div><span class="bq-ltxt">Analyzing...</span>';
    body.appendChild(ld);
    body.scrollTop = body.scrollHeight;
    fetch(apiUrl + '/widget/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: text, shopDomain: shop, skinType: profile.skinType, skinConcerns: profile.concerns, allergies: [], productId: window.location.pathname.split('/').pop() || '' }),
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      ld.remove();
      var payload = data.payload || data;
      var msg = payload.reasoning?.[1] || payload.reasoning?.[0] || payload.explanation || '';
      var prods = payload.recommendations || payload.products || [];
      var routine = payload.routine || [];
      push(msg || (prods.length ? 'Here are my top picks for you:' : 'Here are my recommendations for you.'), 'bot', prods, routine);
      body.scrollTop = body.scrollHeight;
      snd.disabled = false;
      snd.textContent = 'Send';
    })
    .catch(function () {
      ld.remove();
      push("Sorry, I couldn't process that. Please try again.", 'bot');
      snd.disabled = false;
      snd.textContent = 'Send';
    });
  }

  greeting();
  snd.onclick = send;
  inp.onkeydown = function (e) { if (e.key === 'Enter') send(); };
})();
