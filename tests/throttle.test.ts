import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThrottleUtil } from '../src/throttle/ThrottleUtil.js';

describe('ThrottleUtil', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('calls fn immediately on first call', () => {
		const fn = vi.fn();
		const throttled = ThrottleUtil.throttle(fn, 100);
		throttled(1);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenLastCalledWith(1);
	});
	it('throttles subsequent calls within ms', () => {
		const fn = vi.fn();
		const throttled = ThrottleUtil.throttle(fn, 100);
		throttled(1);
		throttled(2);
		throttled(3);
		expect(fn).toHaveBeenCalledTimes(1);
		vi.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledTimes(2);
		expect(fn).toHaveBeenLastCalledWith(3);
	});
});
