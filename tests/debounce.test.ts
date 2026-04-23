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

	it('supports cancel', () => {
		const fn = vi.fn();
		const debounced = DebounceUtil.debounce(fn, 100);

		debounced(1);
		debounced.cancel();
		vi.advanceTimersByTime(100);

		expect(fn).not.toHaveBeenCalled();
	});

	it('supports flush', () => {
		const fn = vi.fn(() => 'ok');
		const debounced = DebounceUtil.debounce(fn, 100);

		debounced(7);
		const result = debounced.flush();

		expect(result).toBe('ok');
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith(7);
		vi.advanceTimersByTime(100);
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it('debounceAsync resolves all queued calls with the last invocation result', async () => {
		const fn = vi.fn(async (value: number) => value * 2);
		const debounced = DebounceUtil.debounceAsync(fn, 100);

		const p1 = debounced(1);
		const p2 = debounced(2);
		const p3 = debounced(3);

		vi.advanceTimersByTime(100);

		await expect(p1).resolves.toBe(6);
		await expect(p2).resolves.toBe(6);
		await expect(p3).resolves.toBe(6);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith(3);
	});

	it('debounceAsync supports cancel', async () => {
		const fn = vi.fn(async () => 1);
		const debounced = DebounceUtil.debounceAsync(fn, 100);

		const p = debounced();
		debounced.cancel();
		vi.advanceTimersByTime(100);

		await expect(p).rejects.toThrow('Debounced async function canceled');
		expect(fn).not.toHaveBeenCalled();
	});

	it('debounceAsync supports flush', async () => {
		const fn = vi.fn(async (value: number) => value + 1);
		const debounced = DebounceUtil.debounceAsync(fn, 100);

		const p = debounced(4);
		const flushResult = await debounced.flush();

		await expect(p).resolves.toBe(5);
		expect(flushResult).toBe(5);
		expect(fn).toHaveBeenCalledTimes(1);
		expect(fn).toHaveBeenCalledWith(4);
	});
});
