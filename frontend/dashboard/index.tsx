import React, { useState, useEffect } from 'react';
import { formatCurrency, formatPercentage } from '../src/formatUtils';

interface DashboardProps {
  shop: string;
  shopData: any;
}

interface MetricCard {
  label: string;
  value?: number;
  format: 'currency' | 'percentage' | 'number';
  accent?: boolean;
}

const RANGES = ['7d', '30d', '90d'] as const;

const METRICS: MetricCard[] = [
  { label: 'Revenue', value: undefined, format: 'currency' },
  { label: 'AI Revenue', value: undefined, format: 'currency', accent: true },
  { label: 'Conversion Rate', value: undefined, format: 'percentage' },
  { label: 'AOV', value: undefined, format: 'currency' },
  { label: 'Recommendations', value: undefined, format: 'number' },
  { label: 'Upsell Rate', value: undefined, format: 'percentage' },
  { label: 'Recovery Rate', value: undefined, format: 'percentage' },
  { label: 'CTR', value: undefined, format: 'percentage' },
];

const BAR_COLORS = ['#7c3aed', '#a78bfa', '#c4b5fd', '#ddd6fe'];

export const Dashboard: React.FC<DashboardProps> = ({ shop }) => {
  const [dateRange, setDateRange] = useState('30d');
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadMetrics(); }, [dateRange, shop]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopDomain: shop, dateRange, query: 'revenue dashboard' }),
      });
      const data = await res.json();
      setMetrics(data.payload || data);
    } catch {
      /* offline */
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ width: 32, height: 32, border: '2.5px solid #e5e7eb', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
      </div>
    );
  }

  const s = metrics?.summary || {};
  const trends: Array<{ date: string; revenue: number; aiRevenue: number; conversions: number }> = metrics?.trends || [];
  const modulePerf: Record<string, { impressions: number; conversions: number; revenue: number }> = metrics?.modulePerformance || {};

  const metricValues: MetricCard[] = [
    { label: 'Revenue', value: s.totalRevenue, format: 'currency' },
    { label: 'AI Revenue', value: s.aiAttributedRevenue, format: 'currency', accent: true },
    { label: 'Conversion Rate', value: s.conversionRate, format: 'percentage' },
    { label: 'AOV', value: s.averageOrderValue, format: 'currency' },
    { label: 'Recommendations', value: s.totalRecommendations, format: 'number' },
    { label: 'Upsell Rate', value: s.upsellAcceptanceRate, format: 'percentage' },
    { label: 'Recovery Rate', value: s.recoveryConversionRate, format: 'percentage' },
    { label: 'CTR', value: s.recommendationClickRate, format: 'percentage' },
  ];

  const maxRevenue = Math.max(...trends.map((t) => t.revenue), 1);

  const moduleEntries = Object.entries(modulePerf);
  const totalModuleRevenue = moduleEntries.reduce((sum, [, d]) => sum + (d.revenue || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>Revenue Dashboard</h2>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '4px 0 0' }}>AI-attributed revenue performance</p>
        </div>
        <div style={toggleGroup}>
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              style={{
                ...toggleBtn,
                background: dateRange === r ? '#fff' : 'transparent',
                color: dateRange === r ? '#7c3aed' : '#6b7280',
                boxShadow: dateRange === r ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div style={metricGrid}>
        {metricValues.map((m) => (
          <div key={m.label} style={metricCard}>
            <div style={metricLabel}>{m.label}</div>
            <div style={{ ...metricValue, color: m.accent ? '#7c3aed' : '#111827' }}>
              {m.format === 'currency' ? formatCurrency(m.value || 0) :
               m.format === 'percentage' ? formatPercentage(m.value || 0) :
               (m.value || 0).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: trends.length > 0 ? '2fr 1fr' : '1fr', gap: 16 }}>
        <div style={panel}>
          <h3 style={panelTitle}>Revenue Trend</h3>
          {trends.length > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{trends[0]?.date}</span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{trends[trends.length - 1]?.date}</span>
              </div>
              <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', gap: 3 }}>
                {trends.map((t, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div
                      style={{
                        width: '100%', height: Math.max((t.revenue / maxRevenue) * 142, 3),
                        background: BAR_COLORS[i % BAR_COLORS.length],
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                      title={`${t.date}: $${t.revenue}`}
                    />
                    {i % 7 === 0 && <span style={{ fontSize: 8, color: '#9ca3af', marginTop: 2 }}>{t.date.slice(5)}</span>}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: 50 }}>
              No revenue data yet. Start processing orders to see trends.
            </div>
          )}
        </div>

        {moduleEntries.length > 0 && (
          <div style={panel}>
            <h3 style={panelTitle}>Module Performance</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {moduleEntries.map(([mod, data]) => {
                const pct = totalModuleRevenue > 0 ? ((data.revenue || 0) / totalModuleRevenue) * 100 : 0;
                return (
                  <div key={mod}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#374151', textTransform: 'capitalize' }}>{mod}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>{formatCurrency(data.revenue || 0)}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
                      <span>{data.conversions || 0} conversions</span>
                      <span>{data.impressions || 0} impressions</span>
                    </div>
                    <div style={{ height: 4, background: '#f3f4f6', borderRadius: 2 }}>
                      <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: '#7c3aed', borderRadius: 2, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {moduleEntries.length === 0 && !loading && (
        <div style={{ ...panel, marginTop: 16 }}>
          <h3 style={panelTitle}>Module Performance</h3>
          <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: 40 }}>
            Module data will appear as features are used.
          </div>
        </div>
      )}
    </div>
  );
};

const toggleGroup: React.CSSProperties = {
  display: 'flex', gap: 2, background: '#f3f4f6', borderRadius: 8, padding: 2,
};
const toggleBtn: React.CSSProperties = {
  padding: '5px 14px', border: 'none', borderRadius: 6, cursor: 'pointer',
  fontSize: 13, fontWeight: 500, transition: 'all 0.12s ease',
};
const metricGrid: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24,
};
const metricCard: React.CSSProperties = {
  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
  padding: '18px 20px',
};
const metricLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, color: '#9ca3af',
  textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6,
};
const metricValue: React.CSSProperties = {
  fontSize: 22, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
};
const panel: React.CSSProperties = {
  background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 20,
};
const panelTitle: React.CSSProperties = {
  fontSize: 14, fontWeight: 600, color: '#374151', margin: '0 0 14px',
};

export default Dashboard;
