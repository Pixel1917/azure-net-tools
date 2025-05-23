/**
 * Parameters for IntersectionObserverUtil.
 *
 * @template T - Type of the observed DOM element.
 */
export interface ObserverParams<T extends Element> {
	/**
	 * Callback function called when the intersection status of the element changes.
	 *
	 * @param entry - The IntersectionObserverEntry for the observed element.
	 * @param node - The observed DOM element.
	 */
	callback: (entry: IntersectionObserverEntry, node: T) => void;

	/**
	 * Options object passed to the IntersectionObserver constructor.
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/IntersectionObserver#parameters
	 */
	options?: IntersectionObserverInit;

	/**
	 * If true, the observer will unobserve the node after the first intersection.
	 */
	once?: boolean;
}

/**
 * Utility class for observing intersection changes on a DOM element.
 *
 * @template T - Type of the observed DOM element.
 */
export class IntersectionObserverUtil<T extends Element> {
	private observer: IntersectionObserver;
	private readonly node: T;
	private params: ObserverParams<T>;

	/**
	 * Creates an IntersectionObserver and starts observing the given node.
	 *
	 * @param node - DOM element to observe.
	 * @param params - Observer parameters including callback, options, and once flag.
	 */
	constructor(node: T, params: ObserverParams<T>) {
		this.node = node;
		this.params = params;

		this.observer = new IntersectionObserver(this.handleIntersect.bind(this), params.options);
		this.observer.observe(this.node);
	}

	/**
	 * Internal handler for IntersectionObserver entries.
	 *
	 * @param entries - Array of IntersectionObserverEntry objects.
	 */
	private handleIntersect(entries: IntersectionObserverEntry[]) {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				this.params.callback(entry, this.node);
				if (this.params.once) {
					this.observer.unobserve(this.node);
				}
			}
		});
	}

	/**
	 * Disconnects the observer and stops observing the element.
	 * Should be called to clean up resources and avoid memory leaks.
	 */
	public disconnect() {
		this.observer.unobserve(this.node);
		this.observer.disconnect();
	}
}
