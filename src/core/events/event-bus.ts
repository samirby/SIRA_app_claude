export interface DomainEvent<T = unknown> {
  id: string;
  name: string;
  version: number;
  organizationId: number;
  occurredAt: string;
  correlationId?: string;
  payload: T;
}

export type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void>;

const handlers = new Map<string, EventHandler[]>();

export function subscribe<T>(eventName: string, handler: EventHandler<T>) {
  const current = handlers.get(eventName) ?? [];
  handlers.set(eventName, [...current, handler as EventHandler]);
}

export async function publish<T>(event: DomainEvent<T>) {
  const listeners = handlers.get(event.name) ?? [];
  await Promise.all(listeners.map((handler) => handler(event)));
}
