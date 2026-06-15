import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  shopDomain?: string;
}

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/advisor', label: 'Beauty Advisor', icon: '✨' },
  { path: '/routines', label: 'Routines', icon: '📋' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Layout({ children, title, shopDomain }: LayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={styles.container}>
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? 240 : 60 }}>
        <div style={styles.logo}>
          {sidebarOpen ? (
            <span style={styles.logoText}>BeautyIQ</span>
          ) : (
            <span style={styles.logoIcon}>B</span>
          )}
        </div>
        <nav style={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                ...styles.navItem,
                background: location.pathname === item.path ? '#f3e8ff' : 'transparent',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {sidebarOpen && <span style={styles.navLabel}>{item.label}</span>}
            </Link>
          ))}
        </nav>
        <button
          style={styles.toggleBtn}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </aside>
      <main style={styles.main}>
        {title && (
          <header style={styles.header}>
            <h1 style={styles.headerTitle}>{title}</h1>
            {shopDomain && <span style={styles.shopBadge}>{shopDomain}</span>}
          </header>
        )}
        <div style={styles.content}>{children}</div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', minHeight: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  sidebar: { background: '#1a1a2e', color: '#fff', display: 'flex', flexDirection: 'column', transition: 'width 0.2s', overflow: 'hidden' },
  logo: { padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  logoText: { fontSize: 20, fontWeight: 700, color: '#c084fc' },
  logoIcon: { fontSize: 24, fontWeight: 700, color: '#c084fc' },
  nav: { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 4 },
  navItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, color: '#e2e8f0', textDecoration: 'none', fontSize: 14, transition: 'all 0.15s' },
  navIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  navLabel: { whiteSpace: 'nowrap' },
  toggleBtn: { background: 'transparent', border: 'none', color: '#94a3b8', padding: 12, cursor: 'pointer', fontSize: 12 },
  main: { flex: 1, background: '#f8fafc', display: 'flex', flexDirection: 'column' },
  header: { background: '#fff', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16 },
  headerTitle: { fontSize: 20, fontWeight: 600, color: '#1e293b', margin: 0 },
  shopBadge: { background: '#f1f5f9', padding: '4px 12px', borderRadius: 12, fontSize: 12, color: '#64748b' },
  content: { flex: 1, padding: 24, overflow: 'auto' },
};
