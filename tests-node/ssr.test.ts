import { describe, expect, it, vi } from 'vitest';
import { Cookies, DownloadUtil, LocalStorageUtil } from '../src/index.js';

describe('SSR safety', () => {
	it('imports the public entry without browser globals', () => {
		expect(typeof window).toBe('undefined');
		expect(typeof document).toBe('undefined');
	});

	it('browser-backed utilities degrade safely on the server', () => {
		const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

		expect(Cookies.get('missing')).toBeNull();
		expect(Cookies.getAll()).toEqual({});
		expect(Cookies.has('missing')).toBe(false);
		expect(() => Cookies.set('key', 'value')).not.toThrow();
		expect(() => Cookies.delete('key')).not.toThrow();

		expect(LocalStorageUtil.get('missing')).toBeNull();
		expect(LocalStorageUtil.getAll()).toEqual({});
		expect(LocalStorageUtil.keys()).toEqual([]);
		expect(() => LocalStorageUtil.set('key', 'value')).not.toThrow();
		expect(() => LocalStorageUtil.delete('key')).not.toThrow();
		expect(() => LocalStorageUtil.clear()).not.toThrow();

		expect(() => DownloadUtil.download('content', 'file.txt')).not.toThrow();
		warning.mockRestore();
	});
});
