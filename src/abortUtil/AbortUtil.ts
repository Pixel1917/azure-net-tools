export type AbortTimeoutResult = {
	signal: AbortSignal | null | undefined;
	cleanup: () => void;
};

export class AbortUtil {
	static withTimeout(source: AbortSignal | null | undefined, timeout: number | false | undefined): AbortTimeoutResult {
		if (timeout === false || timeout === undefined || timeout <= 0) {
			return { signal: source, cleanup: () => undefined };
		}
		if (!Number.isFinite(timeout)) throw new RangeError('Timeout must be a finite number');

		const controller = new AbortController();
		const abortFromSource = () => controller.abort(source?.reason);
		if (source?.aborted) abortFromSource();
		else source?.addEventListener('abort', abortFromSource, { once: true });

		const timer = setTimeout(() => {
			const reason = new Error(`Operation timed out after ${timeout}ms`);
			reason.name = 'TimeoutError';
			controller.abort(reason);
		}, timeout);

		let cleaned = false;
		return {
			signal: controller.signal,
			cleanup: () => {
				if (cleaned) return;
				cleaned = true;
				clearTimeout(timer);
				source?.removeEventListener('abort', abortFromSource);
			}
		};
	}

	static isAbortError(error: unknown): boolean {
		return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
	}
}
