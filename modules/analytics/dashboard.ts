export interface DashboardConfig {
  refreshInterval: number;
  metrics: string[];
  dateRange: '7d' | '30d' | '90d' | '1y';
  comparison: 'previous_period' | 'previous_year';
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'metric' | 'chart' | 'table' | 'list';
  dataSource: string;
  size: 'small' | 'medium' | 'large';
  order: number;
}

export const DEFAULT_DASHBOARD: DashboardWidget[] = [
  { id: 'total-revenue', title: 'Total Revenue', type: 'metric', dataSource: 'analytics.summary.totalRevenue', size: 'small', order: 1 },
  { id: 'ai-revenue', title: 'AI-Attributed Revenue', type: 'metric', dataSource: 'analytics.summary.aiAttributedRevenue', size: 'small', order: 2 },
  { id: 'conversion-rate', title: 'Conversion Rate', type: 'metric', dataSource: 'analytics.summary.conversionRate', size: 'small', order: 3 },
  { id: 'aov', title: 'Average Order Value', type: 'metric', dataSource: 'analytics.summary.averageOrderValue', size: 'small', order: 4 },
  { id: 'revenue-trend', title: 'Revenue Trend', type: 'chart', dataSource: 'analytics.trends', size: 'large', order: 5 },
  { id: 'module-performance', title: 'Module Performance', type: 'table', dataSource: 'analytics.modulePerformance', size: 'medium', order: 6 },
  { id: 'recommendation-stats', title: 'Recommendation Stats', type: 'metric', dataSource: 'analytics.summary.totalRecommendations', size: 'small', order: 7 },
  { id: 'recovery-rate', title: 'Recovery Rate', type: 'metric', dataSource: 'analytics.summary.recoveryConversionRate', size: 'small', order: 8 },
];

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatMetricValue(metric: string, value: number): string {
  if (metric.toLowerCase().includes('revenue') || metric.includes('AOV')) {
    return formatCurrency(value);
  }
  if (metric.toLowerCase().includes('rate') || metric.toLowerCase().includes('ctr')) {
    return formatPercentage(value);
  }
  return value.toLocaleString();
}
