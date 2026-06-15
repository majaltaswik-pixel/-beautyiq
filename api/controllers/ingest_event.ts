import { EventIngestor } from '../../core/events/ingestor';
import { EventType, EVENT_TYPES } from '../../core/events/types';

export async function handleIngestEvent(body: any, ingestor: EventIngestor) {
  const { type, data, customerId, sessionId, shopDomain } = body;

  if (!type || !data) {
    return { error: 'Missing required fields: type, data', status: 400 };
  }

  if (!EVENT_TYPES.includes(type)) {
    return { error: `Invalid event type: ${type}`, status: 400 };
  }

  await ingestor.ingestCustomEvent(type as EventType, data, customerId, sessionId, shopDomain);

  return { success: true, eventType: type, timestamp: new Date().toISOString() };
}
