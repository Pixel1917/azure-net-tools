import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageUtil } from '../src/localStorageUtil/LocalStorageUtil.js';

describe('LocalStorageUtil', () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it('set and get string', () => {
		LocalStorageUtil.set('key', 'value');
		expect(LocalStorageUtil.get('key')).toBe('value');
	});
	it('can disable automatic JSON parsing', () => {
		LocalStorageUtil.set('numeric-string', '123');
		expect(LocalStorageUtil.get('numeric-string')).toBe(123);
		expect(LocalStorageUtil.get('numeric-string', { parse: false })).toBe('123');
	});
	it('set and get object', () => {
		LocalStorageUtil.set('user', { name: 'Bob' });
		expect(LocalStorageUtil.get<{ name: string }>('user')).toEqual({ name: 'Bob' });
	});
	it('has returns true when key exists', () => {
		LocalStorageUtil.set('k', 'v');
		expect(LocalStorageUtil.has('k')).toBe(true);
		expect(LocalStorageUtil.has('missing')).toBe(false);
	});
	it('delete removes item', () => {
		LocalStorageUtil.set('k', 'v');
		LocalStorageUtil.delete('k');
		expect(LocalStorageUtil.get('k')).toBeNull();
	});
	it('keys returns all keys', () => {
		LocalStorageUtil.set('a', 1);
		LocalStorageUtil.set('b', 2);
		expect(LocalStorageUtil.keys()).toEqual(['a', 'b']);
	});
	it('getAll returns record', () => {
		LocalStorageUtil.set('a', '1');
		LocalStorageUtil.set('b', '2');
		const all = LocalStorageUtil.getAll();
		expect(all['a']).toBeDefined();
		expect(all['b']).toBeDefined();
		expect(String(all['a'])).toBe('1');
		expect(String(all['b'])).toBe('2');
	});
	it('supports key-bound instances and default read options', () => {
		const preferences = LocalStorageUtil.createInstance<string>('preferences', { parse: false });
		preferences.set('true');
		expect(preferences.key).toBe('preferences');
		expect(preferences.has()).toBe(true);
		expect(preferences.get()).toBe('true');
		expect(preferences.get({ parse: true })).toBe(true);
		preferences.clear();
		expect(preferences.has()).toBe(false);
	});
	it('does not probe storage support on every operation', () => {
		const setItem = vi.spyOn(window.localStorage, 'setItem');
		const removeItem = vi.spyOn(window.localStorage, 'removeItem');
		LocalStorageUtil.set('probe', 'value');
		const writesAfterFirstOperation = setItem.mock.calls.length;
		const removalsAfterFirstOperation = removeItem.mock.calls.length;
		for (let index = 0; index < 20; index += 1) LocalStorageUtil.get('probe');
		expect(setItem).toHaveBeenCalledTimes(writesAfterFirstOperation);
		expect(removeItem).toHaveBeenCalledTimes(removalsAfterFirstOperation);
	});
	it('does not throw when serialization fails', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
		const cyclic: Record<string, unknown> = {};
		cyclic.self = cyclic;
		expect(() => LocalStorageUtil.set('cyclic', cyclic)).not.toThrow();
		expect(LocalStorageUtil.has('cyclic')).toBe(false);
		warn.mockRestore();
	});
	it('clear removes all', () => {
		LocalStorageUtil.set('a', '1');
		LocalStorageUtil.clear();
		expect(LocalStorageUtil.get('a')).toBeNull();
	});
});
