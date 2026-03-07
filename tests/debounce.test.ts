import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DebounceUtil } from '../src/debounce/DebounceUtil.js';

describe('DebounceUtil', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('calls fn only after ms elapsed since last call', () => {
		const fn = vi.fn();
		const debounced = DebounceUtil.debounce(fn, 100);
		debounced(1);
		debounced(2);
		debounced(3);
		expect(fn).not.toHaveBeenCalled();
		vi.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenLastCalledWith(3);
	});
	it('resets timer on each call', () => {
		const fn = vi.fn();
		const debounced = DebounceUtil.debounce(fn, 100);
		debounced(1);
		vi.advanceTimersByTime(50);
		debounced(2);
		vi.advanceTimersByTime(50);
		expect(fn).not.toHaveBeenCalled();
		vi.advanceTimersByTime(50);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenLastCalledWith(2);
	});
});
