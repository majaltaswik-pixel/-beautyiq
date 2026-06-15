import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { AnalyticsChart } from '../components/AnalyticsChart';

interface AnalyticsData {
  summary?: any;
  trends?: any[];
  modulePerformance?: Record<string, any>;
  metrics?: any[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState('30d');
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async (range: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateRange: range }),
      });
      const data = await res.json();
      setAnalytics(data.payload || data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAnalytics(dateRange); }, [dateRange]);

  return (
    <Layout title="Analytics">
      <div style={styles.controls}>
        {['7d', '30d', '90d', '1y'].map((range) => (
          <button
            key={range}
            style={{ ...styles.rangeBtn, background: dateRange === range ? '#7c3aed' : '#f1f5f9', color: dateRange === range ? '#fff' : '#475569' }}
            onClick={() => setDateRange(range)}
          >
            {range}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={styles.loading}>Loading analytics...</div>
      ) : (
        <>
          <AnalyticsChart data={analytics || {}} type="summary" />
          <AnalyticsChart data={analytics || {}} type="trend" />
          <AnalyticsChart data={analytics || {}} type="modules" />
        </>
      )}
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  controls: { display: 'flex', gap: 8, marginBottom: 20 },
  rangeBtn: { padding: '6px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 },
  loading: { textAlign: 'center', padding: 60, color: '#94a3b8' },
};
