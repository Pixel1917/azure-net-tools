type AnyFunction = (...args: never[]) => unknown;

export type ThrottledFunction<T extends AnyFunction> = ((...args: Parameters<T>) => void) & {
	cancel: () => void;
	flush: () => ReturnType<T> | undefined;
	pending: () => boolean;
};

/** Creates a leading + trailing throttled function. */
export class ThrottleUtil {
	static throttle<T extends AnyFunction>(fn: T, ms: number): ThrottledFunction<T> {
		if (!Number.isFinite(ms) || ms < 0) throw new RangeError('Throttle interval must be a non-negative finite number');

		let lastInvokeTime = 0;
		let hasInvoked = false;
		let timeoutId: ReturnType<typeof setTimeout> | undefined;
		let lastArgs: Parameters<T> | undefined;

		const invoke = (): ReturnType<T> | undefined => {
			if (!lastArgs) return undefined;
			const args = lastArgs;
			lastArgs = undefined;
			lastInvokeTime = Date.now();
			hasInvoked = true;
			return fn(...args) as ReturnType<T>;
		};

		const throttled = (...args: Parameters<T>) => {
			const now = Date.now();
			const elapsed = now - lastInvokeTime;
			lastArgs = args;

			if (!hasInvoked || elapsed >= ms) {
				if (timeoutId !== undefined) {
					clearTimeout(timeoutId);
					timeoutId = undefined;
				}
				invoke();
				return;
			}

			if (timeoutId === undefined) {
				timeoutId = setTimeout(() => {
					timeoutId = undefined;
					invoke();
				}, ms - elapsed);
			}
		};

		throttled.cancel = () => {
			if (timeoutId !== undefined) clearTimeout(timeoutId);
			timeoutId = undefined;
			lastArgs = undefined;
			lastInvokeTime = 0;
			hasInvoked = false;
		};

		throttled.flush = () => {
			if (timeoutId !== undefined) clearTimeout(timeoutId);
			timeoutId = undefined;
			return invoke();
		};

		throttled.pending = () => timeoutId !== undefined;

		return throttled as ThrottledFunction<T>;
	}
}
