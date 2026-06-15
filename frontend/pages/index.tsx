import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { AnalyticsChart } from '../components/AnalyticsChart';

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateRange: '30d' }),
    })
      .then((res) => res.json())
      .then((data) => {
        setAnalytics(data.payload || data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div style={styles.loading}>Loading dashboard...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Dashboard">
        <div style={styles.error}>Error loading dashboard: {error}</div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div style={styles.grid}>
        <AnalyticsChart data={analytics} type="summary" />
      </div>
      <div style={styles.grid}>
        <AnalyticsChart data={analytics} type="trend" />
      </div>
      <div style={styles.grid}>
        <AnalyticsChart data={analytics} type="modules" />
      </div>
      <div style={styles.quickActions}>
        <h3 style={styles.sectionTitle}>Quick Actions</h3>
        <div style={styles.actionGrid}>
          <a href="/advisor" style={styles.actionCard}>
            <span style={styles.actionIcon}>✨</span>
            <span style={styles.actionLabel}>Beauty Advisor</span>
          </a>
          <a href="/routines" style={styles.actionCard}>
            <span style={styles.actionIcon}>📋</span>
            <span style={styles.actionLabel}>Routine Builder</span>
          </a>
        </div>
      </div>
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: { marginBottom: 20 },
  loading: { textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 16 },
  error: { textAlign: 'center', padding: 60, color: '#dc2626', fontSize: 16 },
  quickActions: { marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 600, color: '#1e293b', margin: '0 0 12px' },
  actionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 },
  actionCard: { display: 'flex', alignItems: 'center', gap: 12, padding: 16, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', textDecoration: 'none', transition: 'box-shadow 0.15s' },
  actionIcon: { fontSize: 24 },
  actionLabel: { fontSize: 14, fontWeight: 600, color: '#1e293b' },
};
