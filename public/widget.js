(function() {
  var shop = document.currentScript?.getAttribute('data-shop') || '';
  var apiUrl = document.currentScript?.getAttribute('data-api') || 'https://www.beautyiqapp.com';

  if (!shop) {
    shop = window.location.hostname;
  }

  var container = document.createElement('div');
  container.id = 'beautyiq-widget-container';
  container.innerHTML = `
<style>
  #beautyiq-widget-btn {
    position: fixed; bottom: 24px; right: 24px; z-index: 999999;
    width: 60px; height: 60px; border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed, #9333ea);
    border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(124,58,237,0.4);
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s;
  }
  #beautyiq-widget-btn:hover { transform: scale(1.08); }
  #beautyiq-widget-btn svg { width: 28px; height: 28px; fill: white; }
  #beautyiq-widget-panel {
    position: fixed; bottom: 96px; right: 24px; z-index: 999999;
    width: 380px; height: 560px; background: white; border-radius: 16px;
    box-shadow: 0 12px 48px rgba(0,0,0,0.18); display: none;
    flex-direction: column; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif;
  }
  #beautyiq-widget-panel.open { display: flex; }
  #beautyiq-header {
    background: linear-gradient(135deg, #7c3aed, #9333ea);
    padding: 16px 20px; color: white; display: flex; justify-content: space-between; align-items: center;
  }
  #beautyiq-header-title { font-weight: 700; font-size: 15px; }
  #beautyiq-header-close { background: none; border: none; color: rgba(255,255,255,0.8); cursor: pointer; font-size: 20px; }
  #beautyiq-messages {
    flex: 1; overflow-y: auto; padding: 16px 20px;
    display: flex; flex-direction: column; gap: 12px; background: #f9fafb;
  }
  .beautyiq-msg { max-width: 85%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.5; }
  .beautyiq-msg-bot { background: white; border-bottom-left-radius: 4px; align-self: flex-start; color: #1f2937; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
  .beautyiq-msg-user { background: #7c3aed; border-bottom-right-radius: 4px; align-self: flex-end; color: white; }
  #beautyiq-input-row {
    border-top: 1px solid #e5e7eb; padding: 10px 14px;
    display: flex; gap: 8px; background: white;
  }
  #beautyiq-input {
    flex: 1; border: 1px solid #e5e7eb; border-radius: 8px;
    padding: 9px 12px; font-size: 13px; outline: none;
  }
  #beautyiq-send {
    background: #7c3aed; color: white; border: none; border-radius: 8px;
    padding: 9px 16px; cursor: pointer; font-weight: 600; font-size: 13px;
  }
  #beautyiq-send:disabled { opacity: 0.4; cursor: default; }
  .beautyiq-product-card {
    background: white; border: 1px solid #e5e7eb; border-radius: 8px;
    padding: 10px 12px; margin-top: 8px;
  }
  .beautyiq-product-name { font-weight: 600; font-size: 12px; color: #1f2937; }
  .beautyiq-product-price { font-size: 12px; color: #059669; margin-top: 2px; }
  .beautyiq-loading { display: flex; align-items: center; gap: 8px; padding: 4px; }
  .beautyiq-dot { width: 7px; height: 7px; background: #7c3aed; border-radius: 50%; animation: beautyiqPulse 1.5s infinite; }
  @keyframes beautyiqPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }
</style>
  <button id="beautyiq-widget-btn" aria-label="Open BeautyIQ">
    <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
  </button>
  <div id="beautyiq-widget-panel">
    <div id="beautyiq-header">
      <span id="beautyiq-header-title">BeautyIQ Advisor</span>
      <button id="beautyiq-header-close">&times;</button>
    </div>
    <div id="beautyiq-messages">
      <div class="beautyiq-msg beautyiq-msg-bot">Hi! I'm your AI Beauty Advisor. Tell me about your skin and I'll recommend the perfect products for you.</div>
    </div>
    <div id="beautyiq-input-row">
      <input id="beautyiq-input" placeholder="Ask about skincare..." />
      <button id="beautyiq-send">Send</button>
    </div>
  </div>
`;
  document.body.appendChild(container);

  var btn = document.getElementById('beautyiq-widget-btn');
  var panel = document.getElementById('beautyiq-widget-panel');
  var closeBtn = document.getElementById('beautyiq-header-close');
  var messages = document.getElementById('beautyiq-messages');
  var input = document.getElementById('beautyiq-input');
  var sendBtn = document.getElementById('beautyiq-send');

  btn.onclick = function() { panel.classList.toggle('open'); };
  closeBtn.onclick = function() { panel.classList.remove('open'); };

  function addMessage(text, role) {
    var div = document.createElement('div');
    div.className = 'beautyiq-msg ' + (role === 'user' ? 'beautyiq-msg-user' : 'beautyiq-msg-bot');
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function sendMessage() {
    var text = input.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    input.value = '';
    sendBtn.disabled = true;
    sendBtn.textContent = '...';

    var loading = document.createElement('div');
    loading.className = 'beautyiq-loading';
    loading.innerHTML = '<div class="beautyiq-dot"></div><span style="color:#9ca3af;font-size:12px">Analyzing...</span>';
    messages.appendChild(loading);
    messages.scrollTop = messages.scrollHeight;

    fetch(apiUrl + '/widget/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: text, shopDomain: shop, skinType: '', skinConcerns: [], allergies: [] }),
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      loading.remove();
      var payload = data.payload || data;
      var msg = payload.reasoning?.[0] || payload.explanation || 'Here are my recommendations based on your skin type and concerns.';
      addMessage(msg, 'bot');
      if (payload.recommendations && payload.recommendations.length > 0) {
        var productDiv = document.createElement('div');
        productDiv.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;align-self:flex-start';
        payload.recommendations.slice(0, 3).forEach(function(p) {
          var card = document.createElement('div');
          card.className = 'beautyiq-product-card';
          card.innerHTML = '<div class="beautyiq-product-name">' + (p.product?.title || p.metadata?.title || 'Product') + '</div>' +
            (p.product?.price ? '<div class="beautyiq-product-price">$' + p.product.price + '</div>' : '');
          productDiv.appendChild(card);
        });
        messages.appendChild(productDiv);
        messages.scrollTop = messages.scrollHeight;
      }
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send';
    })
    .catch(function() {
      loading.remove();
      addMessage('Sorry, I encountered an error. Please try again.', 'bot');
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send';
    });
  }

  sendBtn.onclick = sendMessage;
  input.onkeydown = function(e) { if (e.key === 'Enter') sendMessage(); };
})();
