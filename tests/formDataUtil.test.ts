import { describe, it, expect } from 'vitest';
import { FormDataUtil } from '../src/formdata/FormDataUtil.js';

describe('FormDataUtil', () => {
	describe('toObject', () => {
		it('converts flat FormData to object', () => {
			const fd = new FormData();
			fd.set('a', '1');
			fd.set('b', '2');
			expect(FormDataUtil.toObject(fd)).toEqual({ a: '1', b: '2' });
		});
		it('converts bracket notation to nested object', () => {
			const fd = new FormData();
			fd.set('user[name]', 'Alice');
			fd.set('user[age]', '30');
			expect(FormDataUtil.toObject(fd)).toEqual({ user: { name: 'Alice', age: '30' } });
		});
		it('converts indexed and append array notation', () => {
			const fd = new FormData();
			fd.append('tags[]', 'one');
			fd.append('tags[]', 'two');
			fd.set('users[0][name]', 'Alice');
			fd.set('users[1][name]', 'Bob');
			expect(FormDataUtil.toObject(fd)).toEqual({ tags: ['one', 'two'], users: [{ name: 'Alice' }, { name: 'Bob' }] });
		});
		it.each(['__proto__[polluted]', 'constructor[prototype][polluted]', 'safe[prototype][polluted]'])('rejects unsafe path %s', (path) => {
			const fd = new FormData();
			fd.set(path, 'yes');
			expect(() => FormDataUtil.toObject(fd)).toThrow(/Unsafe field path/);
			expect(({} as { polluted?: string }).polluted).toBeUndefined();
		});
	});
	describe('fromObject', () => {
		it('converts flat object to FormData', () => {
			const o = { a: '1', b: '2' };
			const fd = FormDataUtil.fromObject(o);
			expect(fd.get('a')).toBe('1');
			expect(fd.get('b')).toBe('2');
		});
		it('converts nested object', () => {
			const o = { user: { name: 'Bob' } };
			const fd = FormDataUtil.fromObject(o);
			expect(fd.get('user[name]')).toBe('Bob');
		});
		it('throws on cyclic reference', () => {
			const o: Record<string, unknown> = { a: 1 };
			o.self = o;
			expect(() => FormDataUtil.fromObject(o)).toThrow(/Cycle/);
		});
	});
});
