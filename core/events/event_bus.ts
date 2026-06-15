import { EventType, NormalizedEvent, EnrichedEvent, EventHandler } from './types';

type HandlerMap = Map<EventType, Set<EventHandler>>;

export class EventBus {
  private handlers: HandlerMap = new Map();
  private history: NormalizedEvent[] = [];
  private readonly maxHistory: number = 10000;

  on(events: EventType | EventType[], handler: EventHandler): void {
    const eventList = Array.isArray(events) ? events : [events];
    for (const event of eventList) {
      if (!this.handlers.has(event)) {
        this.handlers.set(event, new Set());
      }
      this.handlers.get(event)!.add(handler);
    }
  }

  off(events: EventType | EventType[], handler: EventHandler): void {
    const eventList = Array.isArray(events) ? events : [events];
    for (const event of eventList) {
      this.handlers.get(event)?.delete(handler);
    }
  }

  async emit(event: NormalizedEvent): Promise<void> {
    const enriched = this.enrich(event);
    this.store(enriched);
    const handlers = this.handlers.get(event.type);
    if (!handlers) return;
    const promises: Promise<void>[] = [];
    for (const handler of handlers) {
      promises.push(Promise.resolve(handler(enriched)).catch((err) => {
        console.error(`EventBus: handler failed for ${event.type}:`, err);
      }));
    }
    await Promise.all(promises);
  }

  async emitBatch(events: NormalizedEvent[]): Promise<void> {
    await Promise.all(events.map((e) => this.emit(e)));
  }

  private enrich(event: NormalizedEvent): EnrichedEvent {
    return {
      ...event,
      enrichedData: {
        ingestedAt: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      },
    };
  }

  private store(event: NormalizedEvent): void {
    this.history.push(event);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory / 2);
    }
  }

  getHistory(type?: EventType): NormalizedEvent[] {
    if (type) return this.history.filter((e) => e.type === type);
    return [...this.history];
  }

  getRecent(count: number = 10): NormalizedEvent[] {
    return this.history.slice(-count);
  }

  clear(): void {
    this.history = [];
  }
}

export const globalEventBus = new EventBus();
