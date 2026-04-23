export type DebouncedFunction<T extends (...args: unknown[]) => unknown> = ((...args: Parameters<T>) => void) & {
	cancel: () => void;
	flush: () => ReturnType<T> | undefined;
};

export type DebouncedAsyncFunction<T extends (...args: unknown[]) => Promise<unknown>> = ((
	...args: Parameters<T>
) => Promise<Awaited<ReturnType<T>>>) & {
	cancel: (reason?: unknown) => void;
	flush: () => Promise<Awaited<ReturnType<T>> | undefined>;
};

/**
 * Creates a debounced function that delays invoking the given function until after `ms` milliseconds
 * have elapsed since the last call.
 *
 * @template T - Function type with arbitrary arguments and return.
 * @param {T} fn - The function to debounce.
 * @param {number} ms - Delay in milliseconds.
 * @returns {(...args: Parameters<T>) => void} Debounced function.
 *
 * @example
 * const fn = DebounceUtil.debounce((x: number) => console.log(x), 200);
 * fn(1); fn(2); fn(3); // logs 3 once after 200ms
 */
export class DebounceUtil {
	static debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): DebouncedFunction<T> {
		let timeoutId: ReturnType<typeof setTimeout> | undefined;
		let lastArgs: Parameters<T> | undefined;

		const invoke = (): ReturnType<T> | undefined => {
			if (!lastArgs) return undefined;
			const args = lastArgs;

			lastArgs = undefined;

			return fn(...args) as ReturnType<T>;
		};

		const debounced = (...args: Parameters<T>) => {
			if (timeoutId !== undefined) clearTimeout(timeoutId);
			lastArgs = args;
			timeoutId = setTimeout(() => {
				timeoutId = undefined;
				invoke();
			}, ms);
		};

		debounced.cancel = () => {
			if (timeoutId !== undefined) {
				clearTimeout(timeoutId);
				timeoutId = undefined;
			}
			lastArgs = undefined;
		};

		debounced.flush = () => {
			if (timeoutId !== undefined) {
				clearTimeout(timeoutId);
				timeoutId = undefined;
			}
			return invoke();
		};

		return debounced as DebouncedFunction<T>;
	}

	static debounceAsync<T extends (...args: unknown[]) => Promise<unknown>>(fn: T, ms: number): DebouncedAsyncFunction<T> {
		let timeoutId: ReturnType<typeof setTimeout> | undefined;
		let lastArgs: Parameters<T> | undefined;
		let pendingResolves: Array<(value: Awaited<ReturnType<T>>) => void> = [];
		let pendingRejects: Array<(reason: unknown) => void> = [];

		const invoke = async (): Promise<Awaited<ReturnType<T>> | undefined> => {
			if (!lastArgs) return undefined;

			const args = lastArgs;
			const resolves = pendingResolves;
			const rejects = pendingRejects;

			lastArgs = undefined;
			pendingResolves = [];
			pendingRejects = [];

			try {
				const result = (await fn(...args)) as Awaited<ReturnType<T>>;
				resolves.forEach((resolve) => resolve(result));
				return result;
			} catch (error) {
				rejects.forEach((reject) => reject(error));
				throw error;
			}
		};

		const debounced = (...args: Parameters<T>) => {
			lastArgs = args;

			if (timeoutId !== undefined) clearTimeout(timeoutId);

			return new Promise<Awaited<ReturnType<T>>>((resolve, reject) => {
				pendingResolves.push(resolve);
				pendingRejects.push(reject);

				timeoutId = setTimeout(() => {
					timeoutId = undefined;
					void invoke();
				}, ms);
			});
		};

		debounced.cancel = (reason?: unknown) => {
			if (timeoutId !== undefined) {
				clearTimeout(timeoutId);
				timeoutId = undefined;
			}

			const rejects = pendingRejects;
			lastArgs = undefined;
			pendingResolves = [];
			pendingRejects = [];

			const cancelReason = reason ?? new Error('Debounced async function canceled');
			rejects.forEach((reject) => reject(cancelReason));
		};

		debounced.flush = async () => {
			if (timeoutId !== undefined) {
				clearTimeout(timeoutId);
				timeoutId = undefined;
			}
			return await invoke();
		};

		return debounced as DebouncedAsyncFunction<T>;
	}
}
