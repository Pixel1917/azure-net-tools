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
