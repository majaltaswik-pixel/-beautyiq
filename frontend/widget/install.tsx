import React, { useState, useEffect } from 'react';

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

  return (
    <div style={card}>
      <div style={cardHeader}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Storefront Widget</div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>Beauty Advisor panel for your product pages</div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Checking status...</div>
      ) : installed ? (
        <div>
          <div style={{ padding: '16px 20px', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#166534' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            Widget installed on your store
          </div>
          <div style={{ padding: 20, fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>
            <p style={{ marginBottom: 12 }}>The Beauty Advisor panel appears on the right side of your product pages. Customers can get AI skincare recommendations instantly.</p>
            <p style={{ marginBottom: 12 }}><strong>To customize placement:</strong> Go to your Shopify theme editor (Online Store &rarr; Themes &rarr; Customize &rarr; Product page) and adjust the widget position.</p>
            <p><strong>To remove:</strong> Click Uninstall below, or remove the script tag from Settings &rarr; Online Store &rarr; Script Tags in your Shopify admin.</p>
          </div>
          <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8 }}>
            <button onClick={handleInstall} style={{ ...btn, background: '#ef4444', color: '#fff' }}>Uninstall</button>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ padding: 24, fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>
            <p style={{ marginBottom: 16 }}>Install the AI Beauty Advisor on your store. It appears as a smart panel on product pages, suggesting products based on skin type and concerns.</p>
            <div style={{ background: '#f3f4f6', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 12, color: '#374151' }}>What it does:</div>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                <li style={{ marginBottom: 4 }}>Recommends products based on skin type &amp; concerns</li>
                <li style={{ marginBottom: 4 }}>Answers skincare questions with AI</li>
                <li style={{ marginBottom: 4 }}>Shows product cards your customers can add to cart</li>
                <li>Sits conveniently on product pages</li>
              </ul>
            </div>
            {error && <div style={{ color: '#ef4444', marginBottom: 12, fontSize: 12 }}>{error}</div>}
            <button onClick={handleInstall} disabled={installing} style={{ ...btn, background: installing ? '#9ca3af' : '#7c3aed', color: '#fff', width: '100%', padding: '14px 20px', fontSize: 14, cursor: installing ? 'default' : 'pointer' }}>
              {installing ? 'Installing...' : 'Install Widget — One Click'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden',
};

const cardHeader: React.CSSProperties = {
  padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
  borderBottom: '1px solid #e5e7eb',
};

const btn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '10px 20px', border: 'none', borderRadius: 8,
  fontSize: 13, fontWeight: 600, cursor: 'pointer',
  transition: 'all .12s',
};
