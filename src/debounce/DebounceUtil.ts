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
	static debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): (...args: Parameters<T>) => void {
		let timeoutId: ReturnType<typeof setTimeout> | undefined;
		return (...args: Parameters<T>) => {
			if (timeoutId !== undefined) clearTimeout(timeoutId);
			timeoutId = setTimeout(() => {
				timeoutId = undefined;
				fn(...args);
			}, ms);
		};
	}
}
