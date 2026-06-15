import { OrchestratorState, ContextData, ModuleType, RouterDecision } from './state';
import { OrchestratorRouter } from './router';
import { OrchestratorTools } from './tools';

export interface ModuleHandler {
  (state: OrchestratorState, tools: OrchestratorTools): Promise<OrchestratorState>;
}

export class LangGraphOrchestrator {
  private router: OrchestratorRouter;
  private tools: OrchestratorTools;
  private moduleHandlers: Map<ModuleType, ModuleHandler> = new Map();
  private stateHistory: OrchestratorState[] = [];

  constructor(router: OrchestratorRouter, tools: OrchestratorTools) {
    this.router = router;
    this.tools = tools;
  }

  registerModule(module: ModuleType, handler: ModuleHandler): void {
    this.moduleHandlers.set(module, handler);
  }

  async process(context: ContextData): Promise<OrchestratorState> {
    const initialState: OrchestratorState = {
      context,
      module: null,
      action: 'route',
      payload: null,
      confidence: 0,
      reasoning: [],
      sourceModules: [],
      timestamp: new Date().toISOString(),
      status: 'pending',
    };

    return this.runGraph(initialState);
  }

  async processEvent(context: ContextData): Promise<OrchestratorState> {
    const routingDecision = await this.router.routeFromEvent(
      context.eventType || 'SESSION_STARTED',
      context,
    );

    const initialState: OrchestratorState = {
      context,
      module: routingDecision.module,
      action: 'execute',
      payload: null,
      confidence: routingDecision.confidence,
      reasoning: [routingDecision.reasoning],
      sourceModules: [routingDecision.module],
      timestamp: new Date().toISOString(),
      status: 'processing',
    };

    return this.runGraph(initialState);
  }

  private async runGraph(state: OrchestratorState): Promise<OrchestratorState> {
    let currentState = { ...state };

    if (currentState.status === 'pending') {
      currentState = await this.routeNode(currentState);
    }

    if (currentState.status === 'processing') {
      currentState = await this.executeNode(currentState);
    }

    currentState = await this.aggregateNode(currentState);

    this.stateHistory.push(currentState);
    return currentState;
  }

  private async routeNode(state: OrchestratorState): Promise<OrchestratorState> {
    const decision: RouterDecision = state.module
      ? { module: state.module, confidence: state.confidence, reasoning: state.reasoning.join('; '), priority: 5 }
      : await this.router.route(state.context);

    return {
      ...state,
      module: decision.module,
      action: 'execute',
      confidence: decision.confidence,
      reasoning: [...state.reasoning, decision.reasoning],
      status: 'processing',
    };
  }

  private async executeNode(state: OrchestratorState): Promise<OrchestratorState> {
    if (!state.module) {
      return { ...state, status: 'error', error: 'No module selected', action: 'error' };
    }

    const handler = this.moduleHandlers.get(state.module);
    if (!handler) {
      if (state.module === 'fallback' && this.moduleHandlers.size > 0) {
        return this.fallbackHandler(state);
      }
      return { ...state, status: 'error', error: `No handler for module: ${state.module}`, action: 'error' };
    }

    const moduleState = await handler(state, this.tools);
    return {
      ...moduleState,
      sourceModules: [...state.sourceModules, state.module],
    };
  }

  private async aggregateNode(state: OrchestratorState): Promise<OrchestratorState> {
    return {
      ...state,
      status: state.status === 'error' ? 'error' : 'completed',
      timestamp: new Date().toISOString(),
    };
  }

  private async fallbackHandler(state: OrchestratorState): Promise<OrchestratorState> {
    const context = state.context;
    const ragContext = await this.tools.getRAGContext(context.query || 'general inquiry');

    return {
      ...state,
      action: 'fallback_response',
      payload: {
        response: 'I understand you need help. Could you provide more details? I can help with product recommendations, skincare routines, order support, and more.',
        context: ragContext.context,
        suggestions: ['product recommendations', 'skincare routine', 'order help', 'ingredient information'],
      },
      confidence: 0.3,
      reasoning: [...state.reasoning, 'Fallback handler: general response with context'],
    };
  }

  getHistory(): OrchestratorState[] {
    return [...this.stateHistory];
  }

  clearHistory(): void {
    this.stateHistory = [];
  }
}
