import { EventEmitter } from 'events';

export interface EventPayload<T = any> {
  id: string;
  topic: string;
  timestamp: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  data: T;
}

export type EventCallback<T = any> = (event: EventPayload<T>) => void;

class SystemEventBus {
  private emitter = new EventEmitter();
  private eventHistory: EventPayload[] = [];
  private maxHistorySize = 200;

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  public publish<T = any>(topic: string, data: T, priority: EventPayload['priority'] = 'MEDIUM'): EventPayload<T> {
    const event: EventPayload<T> = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      topic,
      timestamp: new Date().toISOString(),
      priority,
      data
    };

    this.eventHistory.unshift(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.pop();
    }

    console.log(`[EventBus] [${priority}] Published '${topic}':`, data);
    this.emitter.emit(topic, event);
    this.emitter.emit('*', event); // Wildcard subscriber for Dev Console Stream

    return event;
  }

  public subscribe<T = any>(topic: string, callback: EventCallback<T>): () => void {
    this.emitter.on(topic, callback);
    return () => {
      this.emitter.off(topic, callback);
    };
  }

  public getHistory(): EventPayload[] {
    return this.eventHistory;
  }
}

export const eventBus = new SystemEventBus();
