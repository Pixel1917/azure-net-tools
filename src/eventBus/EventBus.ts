/**
 * A type representing a map of event channels, where each channel
 * is optionally associated with an array of listener functions.
 *
 * @template D - The set of allowed string keys for channels.
 */
export type EventBusChannels<D extends string> = Partial<Record<D, ((data: unknown) => void)[]>>;

/**
 * A simple event bus implementation that allows subscribing to
 * channels and publishing data to those channels.
 *
 * @template D - The set of allowed string keys for channels.
 */
export class EventBus<D extends string> {
	/**
	 * Internal map storing channels and their listeners.
	 * @private
	 */
	private channels: Map<D, ((data: unknown) => void)[]>;

	/**
	 * Creates a new EventBus instance.
	 *
	 * @param {EventBusChannels<D>} [initialChannels={}] - Optional initial channels with listeners.
	 */
	constructor(initialChannels: EventBusChannels<D> = {}) {
		this.channels = new Map<D, ((data: unknown) => void)[]>(Object.entries(initialChannels) as [D, ((data: unknown) => void)[]][]);
	}

	/**
	 * Subscribes a listener function to a specific channel.
	 *
	 * @template D - The set of allowed string keys for channels.
	 * @template T - The expected data type for the listener callback.
	 * @param {D} channel - The channel to subscribe to.
	 * @param {(data: T) => void} listener - The callback function to invoke when the event is published.
	 */
	subscribe<T>(channel: D, listener: (data: T) => void): void {
		if (!this.channels.has(channel)) {
			this.channels.set(channel, []);
		}
		this.channels.get(channel)!.push(listener as (data: unknown) => void);
	}

	/**
	 * Publishes data to all listeners subscribed to the given channel.
	 *
	 * @template D - The set of allowed string keys for channels.
	 * @template T - The type of data being published.
	 * @param {D} channel - The channel to publish to.
	 * @param {T} data - The data to send to all listeners.
	 */
	publish<T>(channel: D, data: T): void {
		const listeners = this.channels.get(channel);
		if (!listeners || listeners.length === 0) {
			return;
		}
		listeners.forEach((listener) => listener(data));
	}
}
