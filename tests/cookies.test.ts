import { describe, it, expect, beforeEach } from 'vitest';
import { Cookies } from '../src/cookies/Cookies.js';

describe('Cookies', () => {
	beforeEach(() => {
		document.cookie.split(';').forEach((c) => {
			document.cookie = c.replace(/^[^=]+=/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString());
		});
	});

	it('set and get string', () => {
		Cookies.set('theme', 'dark');
		expect(Cookies.get('theme')).toBe('dark');
	});
	it('set and get object', () => {
		Cookies.set('user', { name: 'Alice' });
		expect(Cookies.get<{ name: string }>('user')).toEqual({ name: 'Alice' });
	});
	it('has returns true when key exists', () => {
		Cookies.set('k', 'v');
		expect(Cookies.has('k')).toBe(true);
		expect(Cookies.has('missing')).toBe(false);
	});
	it('delete removes cookie', () => {
		Cookies.set('k', 'v');
		Cookies.delete('k');
		expect(Cookies.get('k')).toBeNull();
	});
	it('getAll returns record', () => {
		Cookies.set('a', '1');
		Cookies.set('b', '2');
		const all = Cookies.getAll();
		expect(all['a']).toBeDefined();
		expect(all['b']).toBeDefined();
		expect(String(all['a'])).toBe('1');
		expect(String(all['b'])).toBe('2');
	});
	it('clear removes all', () => {
		Cookies.set('a', '1');
		Cookies.clear();
		expect(Cookies.get('a')).toBeNull();
	});
	it('throws on invalid key', () => {
		expect(() => Cookies.set('invalid key!', 'v')).toThrow();
	});
});
