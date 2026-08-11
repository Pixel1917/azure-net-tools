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
	it('supports cancel, flush and pending state', () => {
		const fn = vi.fn((value: number) => value * 2);
		const throttled = ThrottleUtil.throttle(fn, 100);
		throttled(1);
		throttled(2);
		expect(throttled.pending()).toBe(true);
		expect(throttled.flush()).toBe(4);
		expect(throttled.pending()).toBe(false);
		throttled(3);
		throttled.cancel();
		vi.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledTimes(2);
	});
	it('validates the interval', () => {
		expect(() => ThrottleUtil.throttle(() => undefined, -1)).toThrow(RangeError);
	});
});
