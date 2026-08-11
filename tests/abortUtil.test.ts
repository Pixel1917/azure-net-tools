import { afterEach, describe, expect, it, vi } from 'vitest';
import { AbortUtil } from '../src/abortUtil/index.js';

describe('AbortUtil', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns the source signal when timeout is disabled', () => {
		const controller = new AbortController();
		const result = AbortUtil.withTimeout(controller.signal, false);

		expect(result.signal).toBe(controller.signal);
		expect(() => result.cleanup()).not.toThrow();
	});

	it('aborts with TimeoutError when the deadline expires', () => {
		vi.useFakeTimers();
		const result = AbortUtil.withTimeout(undefined, 50);

		vi.advanceTimersByTime(50);

		expect(result.signal?.aborted).toBe(true);
		expect(result.signal?.reason).toMatchObject({ name: 'TimeoutError' });
		expect(AbortUtil.isAbortError(result.signal?.reason)).toBe(true);
	});

	it('forwards source cancellation and reason', () => {
		const controller = new AbortController();
		const result = AbortUtil.withTimeout(controller.signal, 1_000);
		const reason = new DOMException('Stopped', 'AbortError');

		controller.abort(reason);

		expect(result.signal?.aborted).toBe(true);
		expect(result.signal?.reason).toBe(reason);
		result.cleanup();
	});

	it('cleanup is idempotent and prevents timeout cancellation', () => {
		vi.useFakeTimers();
		const result = AbortUtil.withTimeout(undefined, 10);

		result.cleanup();
		result.cleanup();
		vi.advanceTimersByTime(10);

		expect(result.signal?.aborted).toBe(false);
	});

	it('rejects non-finite timeout values', () => {
		expect(() => AbortUtil.withTimeout(undefined, Number.POSITIVE_INFINITY)).toThrow(RangeError);
	});
});
