import React from 'react';

interface DataPoint {
  date: string;
  revenue: number;
  aiRevenue: number;
  conversions: number;
}

interface ModulePerf {
  impressions: number;
  conversions: number;
  revenue: number;
}

interface AnalyticsData {
  summary?: {
    totalRevenue: number;
    aiAttributedRevenue: number;
    conversionRate: number;
    averageOrderValue: number;
    totalRecommendations: number;
  };
  trends?: DataPoint[];
  modulePerformance?: Record<string, ModulePerf>;
  metrics?: Array<{ metric: string; value: number; change: number; formatted?: string }>;
}

interface AnalyticsChartProps {
  data: AnalyticsData;
  type?: 'summary' | 'trend' | 'modules';
}

export function AnalyticsChart({ data, type = 'summary' }: AnalyticsChartProps) {
  if (!data) return <div style={styles.empty}>No analytics data available</div>;

  if (type === 'trend' && data.trends) {
    const maxRevenue = Math.max(...data.trends.map((t) => t.revenue), 1);
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Revenue Trend (30 days)</h3>
        <div style={styles.chart}>
          {data.trends.map((point, i) => {
            const height = (point.revenue / maxRevenue) * 180;
            return (
              <div key={i} style={styles.barWrapper}>
                <div style={{ ...styles.bar, height: Math.max(height, 4) }} title={`${point.date}: $${point.revenue}`} />
                {i % 7 === 0 && <span style={styles.barLabel}>{point.date.slice(5)}</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === 'modules' && data.modulePerformance) {
    const modules = Object.entries(data.modulePerformance);
    return (
      <div style={styles.container}>
        <h3 style={styles.title}>Module Performance</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Module</th>
              <th style={styles.th}>Impressions</th>
              <th style={styles.th}>Conversions</th>
              <th style={styles.th}>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {modules.map(([name, perf]) => (
              <tr key={name}>
                <td style={styles.td}><strong>{name}</strong></td>
                <td style={styles.td}>{perf.impressions.toLocaleString()}</td>
                <td style={styles.td}>{perf.conversions.toLocaleString()}</td>
                <td style={styles.td}>${Math.round(perf.revenue).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const metrics = data.metrics || [
    { metric: 'Total Revenue', value: data.summary?.totalRevenue || 0, change: 0, formatted: `$${Math.round(data.summary?.totalRevenue || 0).toLocaleString()}` },
    { metric: 'AI Revenue', value: data.summary?.aiAttributedRevenue || 0, change: 0, formatted: `$${Math.round(data.summary?.aiAttributedRevenue || 0).toLocaleString()}` },
    { metric: 'Conversion Rate', value: data.summary?.conversionRate || 0, change: 0, formatted: `${(data.summary?.conversionRate || 0).toFixed(2)}%` },
    { metric: 'AOV', value: data.summary?.averageOrderValue || 0, change: 0, formatted: `$${(data.summary?.averageOrderValue || 0).toFixed(2)}` },
  ];

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Key Metrics</h3>
      <div style={styles.metricGrid}>
        {metrics.map((m, i) => (
          <div key={i} style={styles.metricCard}>
            <p style={styles.metricLabel}>{m.metric}</p>
            <p style={styles.metricValue}>{m.formatted || m.value.toLocaleString()}</p>
            {m.change !== 0 && (
              <p style={{ ...styles.metricChange, color: m.change > 0 ? '#16a34a' : '#dc2626' }}>
                {m.change > 0 ? '+' : ''}{m.change.toFixed(1)}%
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { background: '#fff', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0', marginBottom: 20 },
  title: { fontSize: 16, fontWeight: 600, color: '#1e293b', margin: '0 0 16px' },
  empty: { color: '#94a3b8', fontSize: 14, textAlign: 'center', padding: 40 },
  metricGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 },
  metricCard: { padding: 16, background: '#f8fafc', borderRadius: 8 },
  metricLabel: { fontSize: 12, color: '#64748b', margin: '0 0 4px' },
  metricValue: { fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 },
  metricChange: { fontSize: 12, margin: '4px 0 0' },
  chart: { display: 'flex', alignItems: 'flex-end', gap: 2, height: 200, padding: '8px 0' },
  barWrapper: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  bar: { width: '100%', maxWidth: 24, background: 'linear-gradient(180deg, #7c3aed, #a78bfa)', borderRadius: '4px 4px 0 0', minWidth: 4 },
  barLabel: { fontSize: 9, color: '#94a3b8', marginTop: 4, transform: 'rotate(-45deg)' as any },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '8px 12px', fontSize: 12, color: '#64748b', borderBottom: '2px solid #e2e8f0' },
  td: { padding: '8px 12px', fontSize: 13, borderBottom: '1px solid #f1f5f9' },
};
