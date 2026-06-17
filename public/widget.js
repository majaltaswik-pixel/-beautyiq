(function () {
  var shop =
    document.currentScript?.getAttribute('data-shop') || '';
  var apiUrl =
    document.currentScript?.getAttribute('data-api') ||
    'https://www.beautyiqapp.com';
  if (!shop) shop = window.location.hostname;

  var root = document.createElement('div');
  root.id = 'bq-advisor';
  root.innerHTML =
    '<style>' +
    '#bq-advisor{all:initial;direction:ltr;display:block;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif;}' +
    '#bq-advisor *{box-sizing:border-box;margin:0;padding:0;}' +
    '.bq-panel{background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;max-width:100%;}' +
    '.bq-header{padding:14px 16px;background:linear-gradient(135deg,#7c3aed,#9333ea);color:#fff;display:flex;justify-content:space-between;align-items:center;}' +
    '.bq-header-l{display:flex;align-items:center;gap:8px;}' +
    '.bq-av{width:28px;height:28px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;}' +
    '.bq-hd{font-weight:700;font-size:13px;}' +
    '.bq-sub{font-size:10px;color:rgba(255,255,255,0.7);}' +
    '.bq-skin-toggle{padding:4px 10px;background:rgba(255,255,255,0.15);border:none;color:#fff;border-radius:5px;font-size:11px;cursor:pointer;font-weight:600;}' +
    '.bq-skin-toggle:hover{background:rgba(255,255,255,0.25);}' +
    '.bq-prof{padding:12px 16px;background:#faf5ff;border-bottom:1px solid #e5e7eb;display:none;}' +
    '.bq-prof.open{display:block;}' +
    '.bq-prof-lbl{font-size:10px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:.4px;margin-bottom:6px;}' +
    '.bq-chips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;}' +
    '.bq-chip{padding:4px 10px;border:1px solid #d1d5db;border-radius:14px;font-size:11px;cursor:pointer;background:#fff;color:#4b5563;transition:all .12s;}' +
    '.bq-chip.active{border-color:#7c3aed;background:#ede9fe;color:#7c3aed;font-weight:600;}' +
    '.bq-chip:hover{border-color:#a78bfa;}' +
    '.bq-body{flex:1;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px;min-height:260px;max-height:320px;}' +
    '.bq-msg{max-width:88%;padding:9px 13px;border-radius:11px;font-size:12px;line-height:1.5;word-wrap:break-word;}' +
    '.bq-msg-bot{background:#fff;border-bottom-left-radius:3px;align-self:flex-start;color:#1f2937;box-shadow:0 1px 3px rgba(0,0,0,.06);}' +
    '.bq-msg-user{background:#7c3aed;border-bottom-right-radius:3px;align-self:flex-end;color:#fff;}' +
    '.bq-prods{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;align-self:flex-start;}' +
    '.bq-pcard{padding:7px 10px;background:#fff;border:1px solid #e5e7eb;border-radius:7px;font-size:11px;min-width:100px;}' +
    '.bq-pn{font-weight:600;color:#1f2937;font-size:11px;}' +
    '.bq-pp{color:#059669;font-weight:600;font-size:11px;margin-top:1px;}' +
    '.bq-foot{border-top:1px solid #e5e7eb;padding:9px 12px;display:flex;gap:6px;background:#fff;}' +
    '.bq-inp{flex:1;border:1px solid #d1d5db;border-radius:7px;padding:8px 10px;font-size:12px;outline:none;}' +
    '.bq-inp:focus{border-color:#7c3aed;}' +
    '.bq-snd{background:#7c3aed;color:#fff;border:none;border-radius:7px;padding:8px 14px;cursor:pointer;font-weight:600;font-size:12px;}' +
    '.bq-snd:disabled{opacity:.4;cursor:default;}' +
    '.bq-load{display:flex;align-items:center;gap:6px;padding:4px;}' +
    '.bq-dot{width:6px;height:6px;background:#7c3aed;border-radius:50%;animation:bqP 1.5s infinite;}' +
    '.bq-ltxt{color:#9ca3af;font-size:11px;}' +
    '@keyframes bqP{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.3)}}' +
    '</style>' +
    '<div class="bq-panel">' +
    '<div class="bq-header">' +
    '<div class="bq-header-l">' +
    '<div class="bq-av">AI</div>' +
    '<div><div class="bq-hd">Beauty Advisor</div><div class="bq-sub">by BeautyIQ</div></div>' +
    '</div>' +
    '<button class="bq-skin-toggle" id="bq-sk">My&nbsp;Skin</button>' +
    '</div>' +
    '<div class="bq-prof" id="bq-prof">' +
    '<div class="bq-prof-lbl">Skin Type</div>' +
    '<div class="bq-chips" id="bq-sk-chips"></div>' +
    '<div class="bq-prof-lbl">Concerns</div>' +
    '<div class="bq-chips" id="bq-co-chips"></div>' +
    '</div>' +
    '<div class="bq-body" id="bq-body"></div>' +
    '<div class="bq-foot">' +
    '<input class="bq-inp" id="bq-inp" placeholder="Ask about your skin...">' +
    '<button class="bq-snd" id="bq-snd">Send</button>' +
    '</div>' +
    '</div>';

  document.currentScript?.parentNode?.insertBefore(
    root,
    document.currentScript.nextSibling
  );

  var SKIN_TYPES = ['dry', 'oily', 'combination', 'normal', 'sensitive'];
  var CONCERNS = [
    'acne',
    'aging',
    'hyperpigmentation',
    'dehydration',
    'redness',
    'texture',
    'dullness',
    'large pores',
  ];
  var profile = { skinType: '', concerns: [] };

  var skChips = document.getElementById('bq-sk-chips');
  var coChips = document.getElementById('bq-co-chips');
  var prof = document.getElementById('bq-prof');
  var body = document.getElementById('bq-body');
  var inp = document.getElementById('bq-inp');
  var snd = document.getElementById('bq-snd');

  function greeting() {
    var m = document.createElement('div');
    m.className = 'bq-msg bq-msg-bot';
    m.textContent =
      "Hi! I'm your AI Beauty Advisor. Tell me about your skin and I'll recommend the perfect products for you.";
    body.appendChild(m);
  }
  greeting();

  SKIN_TYPES.forEach(function (t) {
    var b = document.createElement('button');
    b.className = 'bq-chip';
    b.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    b.onclick = function () {
      skChips.querySelectorAll('.bq-chip').forEach(function (c) {
        c.classList.remove('active');
      });
      b.classList.add('active');
      profile.skinType = t;
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

  document.getElementById('bq-sk').onclick = function () {
    prof.classList.toggle('open');
  };

  function push(text, role, products) {
    var d = document.createElement('div');
    d.className = 'bq-msg ' + (role === 'user' ? 'bq-msg-user' : 'bq-msg-bot');
    d.textContent = text;
    body.appendChild(d);
    if (products && products.length) {
      var pd = document.createElement('div');
      pd.className = 'bq-prods';
      products.slice(0, 3).forEach(function (p) {
        var c = document.createElement('div');
        c.className = 'bq-pcard';
        var t = p.product?.title || p.metadata?.title || p.label || 'Product';
        var pr = p.product?.price || p.metadata?.price;
        c.innerHTML =
          '<div class="bq-pn">' +
          t +
          '</div>' +
          (pr ? '<div class="bq-pp">$' + pr + '</div>' : '');
        pd.appendChild(c);
      });
      body.appendChild(pd);
    }
    body.scrollTop = body.scrollHeight;
  }

  function send() {
    var text = inp.value.trim();
    if (!text) return;
    push(text, 'user');
    inp.value = '';
    snd.disabled = true;
    snd.textContent = '...';

    var ld = document.createElement('div');
    ld.className = 'bq-load';
    ld.innerHTML =
      '<div class="bq-dot"></div><div class="bq-dot" style="animation-delay:.2s"></div><div class="bq-dot" style="animation-delay:.4s"></div><span class="bq-ltxt">Analyzing...</span>';
    body.appendChild(ld);
    body.scrollTop = body.scrollHeight;

    fetch(apiUrl + '/widget/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: text,
        shopDomain: shop,
        skinType: profile.skinType,
        skinConcerns: profile.concerns,
        allergies: [],
      }),
    })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        ld.remove();
        var payload = data.payload || data;
        var msg =
          payload.reasoning?.[1] ||
          payload.reasoning?.[0] ||
          payload.explanation ||
          'Here are my recommendations based on your profile.';
        var prods = payload.recommendations || payload.products || [];
        push(msg, 'bot', prods);
        snd.disabled = false;
        snd.textContent = 'Send';
      })
      .catch(function () {
        ld.remove();
        push(
          "Sorry, I couldn't process that. Please try again.",
          'bot'
        );
        snd.disabled = false;
        snd.textContent = 'Send';
      });
  }

  snd.onclick = send;
  inp.onkeydown = function (e) {
    if (e.key === 'Enter') send();
  };
})();
