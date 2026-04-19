export type EventBusMap = Record<string, unknown>;
type EventKey<E extends EventBusMap> = Extract<keyof E, string>;
type ListenerPayload<E extends EventBusMap> = E[EventKey<E>];
type InternalListener = (payload: unknown) => void | Promise<void>;

export type EventBusListener<E extends EventBusMap, K extends EventKey<E>> = (payload: E[K]) => void | Promise<void>;
export type EventBusAnyListener<E extends EventBusMap> = (event: EventKey<E>, payload: ListenerPayload<E>) => void | Promise<void>;
export type EventBusPayloadFactory<E extends EventBusMap, K extends EventKey<E>> = () => E[K] | Promise<E[K]>;

export type EventBusChannels<E extends EventBusMap> = Partial<{
	[K in EventKey<E>]: EventBusListener<E, K>[];
}>;

export type EventBusErrorContext<E extends EventBusMap> = {
	event: EventKey<E>;
	payload: ListenerPayload<E>;
	phase: 'listener' | 'any-listener';
};

export type EventBusErrorHandler<E extends EventBusMap> = (error: unknown, context: EventBusErrorContext<E>) => void;

export type EventBusOptions<E extends EventBusMap> = {
	maxListeners?: number;
	onError?: EventBusErrorHandler<E>;
};

/**
 * A typed event bus where event names are keys of `E`, and each key defines payload type.
 */
export class EventBus<E extends EventBusMap> {
	private channels: Map<EventKey<E>, Set<InternalListener>>;
	private anyListeners: Set<EventBusAnyListener<E>>;
	private warnedChannels: Set<EventKey<E>>;
	private readonly maxListeners: number;
	private readonly onError?: EventBusErrorHandler<E>;

	constructor(initialChannels: EventBusChannels<E> = {}, options: EventBusOptions<E> = {}) {
		this.channels = new Map<EventKey<E>, Set<InternalListener>>();
		this.anyListeners = new Set<EventBusAnyListener<E>>();
		this.warnedChannels = new Set<EventKey<E>>();
		this.maxListeners = options.maxListeners ?? 50;
		this.onError = options.onError;

		for (const [event, listeners] of Object.entries(initialChannels) as [EventKey<E>, EventBusListener<E, EventKey<E>>[]][]) {
			for (const listener of listeners) {
				this.subscribe(event, listener);
			}
		}
	}

	subscribe<K extends EventKey<E>>(event: K, listener: EventBusListener<E, K>): () => void {
		const listeners = this.getOrCreateListeners(event);
		listeners.add(listener as InternalListener);
		this.warnIfMaxListenersExceeded(event, listeners.size);
		return () => this.unsubscribe(event, listener);
	}

	once<K extends EventKey<E>>(event: K, listener: EventBusListener<E, K>): () => void {
		const wrapped: EventBusListener<E, K> = async (payload) => {
			this.unsubscribe(event, wrapped);
			await listener(payload);
		};
		return this.subscribe(event, wrapped);
	}

	unsubscribe<K extends EventKey<E>>(event: K, listener: EventBusListener<E, K>): boolean {
		const listeners = this.channels.get(event);
		if (!listeners) return false;

		const removed = listeners.delete(listener as InternalListener);
		if (listeners.size === 0) {
			this.channels.delete(event);
			this.warnedChannels.delete(event);
		}
		return removed;
	}

	subscribeAll(listener: EventBusAnyListener<E>): () => void {
		this.anyListeners.add(listener);
		return () => this.unsubscribeAll(listener);
	}

	unsubscribeAll(listener: EventBusAnyListener<E>): boolean {
		return this.anyListeners.delete(listener);
	}

	clear<K extends EventKey<E>>(event?: K): void {
		if (event !== undefined) {
			this.channels.delete(event);
			this.warnedChannels.delete(event);
			return;
		}

		this.channels.clear();
		this.anyListeners.clear();
		this.warnedChannels.clear();
	}

	listenerCount<K extends EventKey<E>>(event: K): number {
		return this.channels.get(event)?.size ?? 0;
	}

	hasListeners<K extends EventKey<E>>(event: K): boolean {
		return this.listenerCount(event) > 0;
	}

	eventNames(): EventKey<E>[] {
		return [...this.channels.keys()];
	}

	async publish<K extends EventKey<E>>(event: K, payloadFactory: EventBusPayloadFactory<E, K>): Promise<E[K]> {
		const payload = await payloadFactory();
		await this.emitToChannelListeners(event, payload);
		await this.emitToAnyListeners(event, payload);
		return payload;
	}

	private getOrCreateListeners<K extends EventKey<E>>(event: K): Set<InternalListener> {
		let listeners = this.channels.get(event);
		if (!listeners) {
			listeners = new Set<InternalListener>();
			this.channels.set(event, listeners);
		}
		return listeners;
	}

	private warnIfMaxListenersExceeded(event: EventKey<E>, size: number): void {
		if (size <= this.maxListeners || this.warnedChannels.has(event)) return;
		this.warnedChannels.add(event);
		console.warn(`[EventBus] Max listeners warning for event "${event}": ${size} listeners attached (limit: ${this.maxListeners}).`);
	}

	private async emitToChannelListeners<K extends EventKey<E>>(event: K, payload: E[K]): Promise<void> {
		const listeners = this.channels.get(event);
		if (!listeners || listeners.size === 0) return;

		for (const listener of [...listeners]) {
			try {
				await listener(payload);
			} catch (error) {
				this.handleError(error, { event, payload, phase: 'listener' });
			}
		}
	}

	private async emitToAnyListeners<K extends EventKey<E>>(event: K, payload: E[K]): Promise<void> {
		if (this.anyListeners.size === 0) return;

		for (const listener of [...this.anyListeners]) {
			try {
				await listener(event, payload as ListenerPayload<E>);
			} catch (error) {
				this.handleError(error, { event, payload, phase: 'any-listener' });
			}
		}
	}

	private handleError<K extends EventKey<E>>(error: unknown, context: { event: K; payload: E[K]; phase: 'listener' | 'any-listener' }): void {
		if (this.onError) {
			this.onError(error, {
				event: context.event,
				payload: context.payload as ListenerPayload<E>,
				phase: context.phase
			});
			return;
		}

		console.error('[EventBus] Listener execution error:', error);
	}
}
