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
	 * @param api - Current util instance (for optional control from callback).
	 */
	callback: (entry: IntersectionObserverEntry, node: T, api: IntersectionObserverUtil<T>) => void;

	/**
	 * Options object passed to the IntersectionObserver constructor.
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver/IntersectionObserver#parameters
	 */
	options?: IntersectionObserverInit;

	/**
	 * If true, the observer will unobserve the node after the first intersection.
	 */
	once?: boolean;

	/**
	 * Decides when one-shot observer should stop.
	 * - `intersect`: stop on first intersecting callback (legacy-compatible default).
	 * - `entry`: stop on first delivered entry.
	 */
	onceMode?: 'intersect' | 'entry';

	/**
	 * If true, callback also runs on exit events (`isIntersecting === false`).
	 */
	triggerOnExit?: boolean;
}

type PoolEntry = {
	observer: IntersectionObserver;
	handlers: Map<Element, Set<IntersectionObserverUtil<Element>>>;
	refs: number;
};

const observerPools = new Map<string, PoolEntry>();
const rootIds = new WeakMap<object, number>();
let rootIdCounter = 0;

const isObserverSupported = (): boolean => {
	return typeof window !== 'undefined' && typeof IntersectionObserver !== 'undefined';
};

const getRootId = (root: Element | Document | null | undefined): string => {
	if (!root) return 'null';
	const key = root as unknown as object;
	let id = rootIds.get(key);
	if (id === undefined) {
		id = ++rootIdCounter;
		rootIds.set(key, id);
	}
	return String(id);
};

const normalizeThreshold = (threshold: IntersectionObserverInit['threshold']): string => {
	if (Array.isArray(threshold)) {
		return threshold.join(',');
	}
	return threshold === undefined ? '0' : String(threshold);
};

const optionsKey = (options?: IntersectionObserverInit): string => {
	if (!options) return 'root:null|margin:|threshold:0';
	const root = getRootId(options.root);
	const margin = options.rootMargin ?? '';
	const threshold = normalizeThreshold(options.threshold);
	return `root:${root}|margin:${margin}|threshold:${threshold}`;
};

const getOrCreatePool = (options: IntersectionObserverInit | undefined, key: string): PoolEntry => {
	const existing = observerPools.get(key);
	if (existing) return existing;

	const handlers = new Map<Element, Set<IntersectionObserverUtil<Element>>>();
	const observer = new IntersectionObserver((entries) => {
		for (const entry of entries) {
			const instances = handlers.get(entry.target);
			if (!instances || instances.size === 0) continue;
			for (const instance of instances) {
				instance.__handleEntry(entry);
			}
		}
	}, options);

	const pool: PoolEntry = { observer, handlers, refs: 0 };
	observerPools.set(key, pool);
	return pool;
};

/**
 * Utility class for observing intersection changes on a DOM element.
 *
 * @template T - Type of the observed DOM element.
 */
export class IntersectionObserverUtil<T extends Element> {
	private readonly node: T;
	private params: ObserverParams<T>;
	private poolKey?: string;
	private observed = false;
	private disconnected = false;
	private onceConsumed = false;

	/**
	 * Creates an IntersectionObserver and starts observing the given node.
	 *
	 * @param node - DOM element to observe.
	 * @param params - Observer parameters including callback, options, and once flag.
	 */
	constructor(node: T, params: ObserverParams<T>) {
		this.node = node;
		this.params = params;

		if (!isObserverSupported()) return;
		this.bindToPool(params.options);
		this.observe();
	}

	private bindToPool(options?: IntersectionObserverInit) {
		const key = optionsKey(options);
		const pool = getOrCreatePool(options, key);
		this.poolKey = key;
		pool.refs += 1;
	}

	private unbindFromPool() {
		const key = this.poolKey;
		if (!key) return;
		const pool = observerPools.get(key);
		if (!pool) {
			this.poolKey = undefined;
			return;
		}

		this.removeHandler(pool);
		pool.refs -= 1;

		if (pool.refs <= 0) {
			pool.observer.disconnect();
			observerPools.delete(key);
		}

		this.poolKey = undefined;
	}

	private addHandler(pool: PoolEntry) {
		const target = this.node as unknown as Element;
		let set = pool.handlers.get(target);
		if (!set) {
			set = new Set();
			pool.handlers.set(target, set);
			pool.observer.observe(target);
		}
		set.add(this as unknown as IntersectionObserverUtil<Element>);
	}

	private removeHandler(pool: PoolEntry) {
		const target = this.node as unknown as Element;
		const set = pool.handlers.get(target);
		if (!set) return;
		set.delete(this as unknown as IntersectionObserverUtil<Element>);
		if (set.size === 0) {
			pool.handlers.delete(target);
			pool.observer.unobserve(target);
		}
	}

	/**
	 * Internal handler for IntersectionObserver entries routed from pooled observer.
	 *
	 * @param entry - IntersectionObserverEntry object for current target.
	 */
	__handleEntry(entry: IntersectionObserverEntry) {
		if (this.disconnected || !this.observed) return;

		const onceMode = this.params.onceMode ?? 'intersect';
		const isOneShot = this.params.once === true;
		const shouldEmit = entry.isIntersecting || this.params.triggerOnExit === true || (isOneShot && onceMode === 'entry' && !this.onceConsumed);

		if (!shouldEmit) return;

		this.params.callback(entry, this.node, this);

		if (!isOneShot) return;

		const shouldStop = onceMode === 'entry' ? true : entry.isIntersecting;
		if (shouldStop) {
			this.onceConsumed = true;
			this.unobserve();
		}
	}

	/**
	 * Starts observing (or resumes after pause).
	 */
	public observe() {
		if (this.disconnected || !isObserverSupported() || this.observed) return;
		const key = this.poolKey;
		if (!key) return;
		const pool = observerPools.get(key);
		if (!pool) return;

		this.addHandler(pool);
		this.observed = true;
	}

	/**
	 * Stops observing without disconnecting from util lifecycle.
	 */
	public unobserve() {
		if (!this.observed) return;
		const key = this.poolKey;
		if (!key) return;
		const pool = observerPools.get(key);
		if (!pool) return;

		this.removeHandler(pool);
		this.observed = false;
	}

	/**
	 * Alias for unobserve().
	 */
	public pause() {
		this.unobserve();
	}

	/**
	 * Alias for observe().
	 */
	public resume() {
		this.observe();
	}

	/**
	 * Updates observer behavior and optionally recreates pooled observer when options changed.
	 */
	public update(next: Partial<ObserverParams<T>>) {
		if (this.disconnected) return;

		const prevOptionsKey = optionsKey(this.params.options);
		this.params = { ...this.params, ...next };
		const nextOptionsKey = optionsKey(this.params.options);

		if (!isObserverSupported() || prevOptionsKey === nextOptionsKey) return;

		const wasObserved = this.observed;
		this.unobserve();
		this.unbindFromPool();
		this.bindToPool(this.params.options);
		if (wasObserved) this.observe();
	}

	/**
	 * Disconnects the observer and stops observing the element.
	 * Should be called to clean up resources and avoid memory leaks.
	 */
	public disconnect() {
		if (this.disconnected) return;
		this.disconnected = true;
		this.unobserve();
		this.unbindFromPool();
	}
}
