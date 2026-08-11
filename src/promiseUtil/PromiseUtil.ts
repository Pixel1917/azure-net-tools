export class PromiseUtil {
	static isPromiseLike<T = unknown>(value: unknown): value is PromiseLike<T> {
		return ((typeof value === 'object' && value !== null) || typeof value === 'function') && typeof (value as { then?: unknown }).then === 'function';
	}
}
