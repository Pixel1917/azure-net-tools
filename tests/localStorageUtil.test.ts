import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageUtil } from '../src/localStorageUtil/LocalStorageUtil.js';

describe('LocalStorageUtil', () => {
	beforeEach(() => {
		window.localStorage.clear();
	});

	it('set and get string', () => {
		LocalStorageUtil.set('key', 'value');
		expect(LocalStorageUtil.get('key')).toBe('value');
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
	it('clear removes all', () => {
		LocalStorageUtil.set('a', '1');
		LocalStorageUtil.clear();
		expect(LocalStorageUtil.get('a')).toBeNull();
	});
});
