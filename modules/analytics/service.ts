import { OrchestratorState } from '../../core/orchestrator/state';
import { OrchestratorTools } from '../../core/orchestrator/tools';
import { AnalyticsTracker, AnalyticsReport } from './tracker';
import { DEFAULT_DASHBOARD, DashboardWidget, formatMetricValue } from './dashboard';

export class AnalyticsService {
  async generate(state: OrchestratorState, tools: OrchestratorTools): Promise<OrchestratorState> {
    const metadata = state.context.metadata || {};
    const dateRange = metadata.dateRange || '30d';
    const comparison = metadata.comparison || 'previous_period';

    const tracker = new AnalyticsTracker();
    const result = await tracker.track(state, tools);

    const report = result.payload as AnalyticsReport;
    const widgets = this.buildWidgets(report, metadata.widgets);

    return {
      ...result,
      payload: {
        ...report,
        widgets,
        dateRange,
        comparison,
        formattedMetrics: report.metrics.map((m) => ({
          ...m,
          formatted: formatMetricValue(m.metric, m.value),
        })),
      },
      reasoning: [
        ...result.reasoning,
        `Analytics service: ${dateRange} report, ${report.metrics.length} metrics, ${widgets.length} widgets`,
      ],
    };
  }

  private buildWidgets(report: AnalyticsReport, selectedWidgets?: string[]): DashboardWidget[] {
    let widgets = DEFAULT_DASHBOARD;
    if (selectedWidgets?.length) {
      widgets = widgets.filter((w) => selectedWidgets.includes(w.id));
    }
    return widgets.map((w) => ({
      ...w,
      value: this.resolveWidgetValue(w, report),
    }));
  }

  private resolveWidgetValue(widget: DashboardWidget, report: AnalyticsReport): any {
    const path = widget.dataSource.split('.');
    if (path[0] === 'analytics') {
      if (path[1] === 'summary') return (report.summary as any)[path[2]];
      if (path[1] === 'trends') return report.trends;
      if (path[1] === 'modulePerformance') return report.modulePerformance;
    }
    return null;
  }
}

export const analyticsServiceHandler = async (state: OrchestratorState, tools: OrchestratorTools) => {
  const service = new AnalyticsService();
  return service.generate(state, tools);
};
