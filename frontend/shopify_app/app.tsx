import React, { useState, useEffect } from 'react';
import { Dashboard } from '../dashboard/index';

interface AppProps {
  shop: string;
  host: string;
  apiKey: string;
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
] as const;

export const ShopifyApp: React.FC<AppProps> = ({ shop, host, apiKey }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [shopData, setShopData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/shop?shop=${shop}`);
        setShopData(await res.json());
      } catch {
        /* offline fallback */
      } finally {
        setLoading(false);
      }
    })();
  }, [shop]);

  if (loading) {
    return (
      <div style={splash}>
        <div style={splashInner}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <p style={splashText}>BeautyIQ</p>
        </div>
      </div>
    );
  }

  return (
    <div style={root}>
      <nav style={nav}>
        <div style={navInner}>
          <div style={brand}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span style={brandName}>BeautyIQ</span>
            <span style={brandBadge}>Revenue System</span>
          </div>
          <div style={tabsRow}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...tabBtn,
                  color: activeTab === tab.id ? '#7c3aed' : '#6b7280',
                  background: activeTab === tab.id ? '#f5f3ff' : 'transparent',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div style={shopBadge}>{shop}</div>
        </div>
      </nav>
      <main style={main}>
        <Dashboard shop={shop} shopData={shopData} />
      </main>
    </div>
  );
};

const root: React.CSSProperties = {
  minHeight: '100vh',
  background: '#f9fafb',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif",
  color: '#111827',
};

const splash: React.CSSProperties = {
  display: 'flex', justifyContent: 'center', alignItems: 'center',
  height: '100vh', background: '#f9fafb',
};

const splashInner: React.CSSProperties = {
  textAlign: 'center', opacity: 0.7,
};

const splashText: React.CSSProperties = {
  marginTop: 12, fontSize: 14, color: '#6b7280',
  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
};

const nav: React.CSSProperties = {
  background: '#fff',
  borderBottom: '1px solid #e5e7eb',
  position: 'sticky',
  top: 0,
  zIndex: 50,
};

const navInner: React.CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  height: 56,
  padding: '0 24px',
  gap: 32,
};

const brand: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
};

const brandName: React.CSSProperties = {
  fontSize: 16, fontWeight: 700, color: '#111827', letterSpacing: '-0.3px',
};

const brandBadge: React.CSSProperties = {
  fontSize: 10, fontWeight: 600, color: '#9ca3af',
  background: '#f3f4f6', padding: '2px 8px', borderRadius: 4,
  letterSpacing: '0.3px', textTransform: 'uppercase',
};

const tabsRow: React.CSSProperties = {
  display: 'flex', gap: 2, flex: 1,
};

const tabBtn: React.CSSProperties = {
  padding: '8px 14px', border: 'none', borderRadius: 6,
  cursor: 'pointer', fontSize: 13, fontWeight: 500,
  transition: 'all 0.12s ease',
};

const shopBadge: React.CSSProperties = {
  fontSize: 12, color: '#9ca3af',
  background: '#f3f4f6', padding: '4px 10px', borderRadius: 4,
};

const main: React.CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: '32px 24px',
};

export default ShopifyApp;
