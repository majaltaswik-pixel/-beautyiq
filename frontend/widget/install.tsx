import React, { useState, useEffect } from 'react';

const FEATURES = [
  { title: 'Product Recommendation', desc: 'AI-powered product matching based on skin type, concerns, ingredients, and purchase history. Like a dermatologist in your store.', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { title: 'Autonomous Support', desc: 'Instant answers to returns, shipping, ingredient questions, and usage instructions. 68% of tickets resolved without a human.', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { title: 'Upsell & Cross-Sell', desc: 'Intelligent bundling and routine recommendations that increase average order value by $18.50+ per transaction.', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  { title: 'Routine Builder', desc: 'Automatic skincare routine generation — cleanser, serum, moisturizer, SPF. Each step linked to a product they can add to cart.', icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2' },
  { title: 'Cart Recovery', desc: 'Personalized cart abandonment recovery with targeted messaging and smart incentives. Recover 22%+ of lost carts automatically.', icon: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2m4-1v8m0 0l-3-3m3 3l3-3' },
  { title: 'Marketing Content Engine', desc: 'Auto-generates product descriptions, email copy, and social content in your brand voice. Scale content without hiring a writer.', icon: 'M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
];

const METRICS = [
  { label: 'AOV Lift', value: '+$18.50' },
  { label: 'Recovery Rate', value: '22%+' },
  { label: 'Support Automation', value: '68%' },
  { label: 'Conversion Uplift', value: '14.3%' },
];

interface WidgetInstallProps {
  shop: string;
}

export const WidgetInstall: React.FC<WidgetInstallProps> = ({ shop }) => {
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/v1/widget/status?shop=${shop}`)
      .then(r => r.json())
      .then(d => { setInstalled(d.installed); setLoading(false); })
      .catch(() => { setInstalled(false); setLoading(false); });
  }, [shop]);

  const handleInstall = async () => {
    setInstalling(true);
    setError('');
    try {
      const r = await fetch(`/api/v1/widget/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop }),
      });
      const d = await r.json();
      if (d.installed) setInstalled(true);
      else setError(d.error || 'Installation failed');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setInstalling(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80, color: '#9ca3af', fontSize: 13 }}>Loading...</div>;
  }

  if (installed) {
    return (
      <div style={maxW}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#166534' }}>Widget is live on your store</span>
          </div>
          <div style={{ padding: 24, fontSize: 13, color: '#4b5563', lineHeight: 1.7 }}>
            <p style={{ marginBottom: 12 }}>The Beauty Advisor panel appears automatically on the right side of every product page. Your customers can get AI skincare recommendations, ask questions, and discover routines — without leaving the page.</p>
            <p style={{ marginBottom: 12 }}><strong>To preview:</strong> Open a product on your storefront and look for the purple Beauty Advisor panel.</p>
            <p><strong>To disable:</strong> Click Uninstall below, or remove the script tag via Shopify admin → Settings → Online Store → Script Tags.</p>
          </div>
          <div style={{ padding: '12px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8 }}>
            <button onClick={handleInstall} style={{ ...btn, background: '#ef4444', color: '#fff' }}>Uninstall</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={maxW}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px', color: '#111827' }}>Storefront Widget</h2>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>One-click install — the Beauty Advisor appears automatically on your product pages</p>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #7c3aed, #9333ea)', borderRadius: 12, padding: '28px 32px', marginBottom: 28, color: '#fff' }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Beauty Advisor</div>
        <div style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.9, marginBottom: 20, maxWidth: 500 }}>A smart panel on your product pages that recommends products, builds routines, answers questions, and increases sales — all automatically.</div>
        <button onClick={handleInstall} disabled={installing} style={{ padding: '14px 32px', background: '#fff', color: '#7c3aed', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: installing ? 'default' : 'pointer', opacity: installing ? 0.7 : 1 }}>
          {installing ? 'Installing...' : 'Install Widget — One Click'}
        </button>
        {error && <div style={{ marginTop: 12, color: '#fca5a5', fontSize: 12 }}>{error}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        {METRICS.map(m => (
          <div key={m.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#059669' }}>{m.value}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {FEATURES.map(f => (
          <div key={f.title} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '18px 20px', display: 'flex', gap: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon}/></svg>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#111827', marginBottom: 4 }}>{f.title}</div>
              <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const maxW: React.CSSProperties = { maxWidth: 900, margin: '0 auto' };

const btn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '10px 20px', border: 'none', borderRadius: 8,
  fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .12s',
};
