/**
 * Creates a throttled function that invokes the given function at most once per `ms` milliseconds.
 * Uses leading edge: the first call runs immediately, subsequent calls within `ms` are ignored.
 *
 * @template T - Function type with arbitrary arguments and return.
 * @param {T} fn - The function to throttle.
 * @param {number} ms - Throttle interval in milliseconds.
 * @returns {(...args: Parameters<T>) => void} Throttled function.
 *
 * @example
 * const fn = ThrottleUtil.throttle((x: number) => console.log(x), 200);
 * fn(1); fn(2); fn(3); // logs 1 immediately, then 3 after 200ms
 */
export class ThrottleUtil {
	static throttle<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): (...args: Parameters<T>) => void {
		let last = 0;
		let timeoutId: ReturnType<typeof setTimeout> | undefined;
		let lastArgs: Parameters<T> | undefined;
		return (...args: Parameters<T>) => {
			lastArgs = args;
			const now = Date.now();
			const elapsed = now - last;
			if (last === 0 || elapsed >= ms) {
				last = now;
				fn(...args);
				if (timeoutId !== undefined) {
					clearTimeout(timeoutId);
					timeoutId = undefined;
				}
				return;
			}
			if (timeoutId === undefined) {
				timeoutId = setTimeout(() => {
					last = Date.now();
					timeoutId = undefined;
					if (lastArgs !== undefined) fn(...lastArgs);
				}, ms - elapsed);
			}
		};
	}
}
