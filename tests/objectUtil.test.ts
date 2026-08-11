import { describe, it, expect } from 'vitest';
import { ObjectUtil } from '../src/objectUtil/ObjectUtil.js';

describe('ObjectUtil', () => {
	describe('clone', () => {
		it('returns shallow copy', () => {
			const o = { a: 1, b: { c: 2 } };
			const c = ObjectUtil.clone(o);
			expect(c).not.toBe(o);
			expect(c).toEqual(o);
			expect(c.b).toBe(o.b);
		});
	});
	describe('toEntries', () => {
		it('maps object values and optionally transforms keys', () => {
			expect(ObjectUtil.toEntries({ 1: 'one', 2: 'two' }, { mapKey: Number })).toEqual([
				{ key: 1, value: 'one' },
				{ key: 2, value: 'two' }
			]);
		});
	});
	describe('deepClone', () => {
		it('deep copies with JSON', () => {
			const o = { a: 1, b: { c: 2 } };
			const c = ObjectUtil.deepClone(o, false);
			expect(c.b).not.toBe(o.b);
			expect(c).toEqual(o);
		});
		it('deep copies with structuredClone when true', () => {
			const o = { a: 1, b: { c: 2 } };
			const c = ObjectUtil.deepClone(o, true);
			expect(c.b).not.toBe(o.b);
			expect(c).toEqual(o);
		});
	});
	describe('compareAsString', () => {
		it('returns true for same JSON', () => {
			expect(ObjectUtil.compareAsString({ a: 1 }, { a: 1 })).toBe(true);
		});
		it('returns false for different', () => {
			expect(ObjectUtil.compareAsString({ a: 1 }, { a: 2 })).toBe(false);
		});
	});
	describe('countProps', () => {
		it('counts own enumerable keys', () => {
			expect(ObjectUtil.countProps({ a: 1, b: 2 })).toBe(2);
			expect(ObjectUtil.countProps({})).toBe(0);
		});
		it('returns 0 for non-objects', () => {
			expect(ObjectUtil.countProps(null)).toBe(0);
			expect(ObjectUtil.countProps(123)).toBe(0);
		});
	});
	describe('equals', () => {
		it('primitives', () => {
			expect(ObjectUtil.equals(1, 1)).toBe(true);
			expect(ObjectUtil.equals(1, 2)).toBe(false);
			expect(ObjectUtil.equals('a', 'a')).toBe(true);
		});
		it('objects', () => {
			expect(ObjectUtil.equals({ a: 1 }, { a: 1 })).toBe(true);
			expect(ObjectUtil.equals({ a: 1 }, { a: 2 })).toBe(false);
		});
		it('maps and sets', () => {
			expect(ObjectUtil.equals(new Map<string, { x: number }>([['a', { x: 1 }]]), new Map<string, { x: number }>([['a', { x: 1 }]]))).toBe(true);
			expect(ObjectUtil.equals(new Set([1, 2]), new Set([1, 2]))).toBe(true);
			expect(ObjectUtil.equals(new Set([1, 2]), new Set([1, 3]))).toBe(false);
		});
		it('handles circular references', () => {
			const left: { self?: unknown; x: number } = { x: 1 };
			left.self = left;
			const right: { self?: unknown; x: number } = { x: 1 };
			right.self = right;
			expect(ObjectUtil.equals(left, right)).toBe(true);
		});
		it('is symmetric for shared-reference topology', () => {
			const shared = { value: 1 };
			const sharedGraph = { left: shared, right: shared };
			const splitGraph = { left: { value: 1 }, right: { value: 1 } };
			expect(ObjectUtil.equals(sharedGraph, splitGraph)).toBe(false);
			expect(ObjectUtil.equals(splitGraph, sharedGraph)).toBe(false);
		});
		it('supports errors, URLs and typed arrays', () => {
			expect(ObjectUtil.equals(new Error('x'), new Error('x'))).toBe(true);
			expect(ObjectUtil.equals(new URL('https://example.com/a'), new URL('https://example.com/a'))).toBe(true);
			expect(ObjectUtil.equals(new Uint8Array([1, 2]), new Uint8Array([1, 2]))).toBe(true);
			expect(ObjectUtil.equals(new Uint8Array([1, 2]), new Uint8Array([1, 3]))).toBe(false);
		});
	});
	describe('isAllKeysEmpty', () => {
		it('returns true for null/undefined', () => {
			expect(ObjectUtil.isAllKeysEmpty(null)).toBe(true);
			expect(ObjectUtil.isAllKeysEmpty(undefined)).toBe(true);
		});
		it('returns true for object with all empty values', () => {
			expect(ObjectUtil.isAllKeysEmpty({ a: null, b: undefined })).toBe(true);
		});
		it('returns false when any value is non-empty', () => {
			expect(ObjectUtil.isAllKeysEmpty({ a: null, b: 1 })).toBe(false);
		});
		it('does not read prototype keys', () => {
			const proto = { inherited: 1 };
			const obj = Object.create(proto) as Record<string, unknown>;
			obj.own = null;
			expect(ObjectUtil.isAllKeysEmpty(obj)).toBe(true);
		});
		it('handles circular structures and special collections', () => {
			const value: Record<string, unknown> = { empty: null };
			value.self = value;
			expect(ObjectUtil.isAllKeysEmpty(value)).toBe(true);
			expect(ObjectUtil.isAllKeysEmpty({ value: new Date() })).toBe(false);
			expect(ObjectUtil.isAllKeysEmpty({ value: new Set([1]) })).toBe(false);
		});
	});
	describe('isObjectEmpty', () => {
		it('returns true for empty or null', () => {
			expect(ObjectUtil.isObjectEmpty({})).toBe(true);
			expect(ObjectUtil.isObjectEmpty(null)).toBe(true);
			expect(ObjectUtil.isObjectEmpty({ a: 1 })).toBe(false);
		});
		it('ignores prototype keys', () => {
			const proto = { inherited: 1 };
			const obj = Object.create(proto) as Record<string, unknown>;
			expect(ObjectUtil.isObjectEmpty(obj)).toBe(true);
		});
	});
	describe('pick', () => {
		it('returns only picked keys', () => {
			const o = { a: 1, b: 2, c: 3 };
			expect(ObjectUtil.pick(o, ['a', 'c'])).toEqual({ a: 1, c: 3 });
		});
		it('ignores missing keys', () => {
			const o = { a: 1, b: 2 };
			expect(ObjectUtil.pick(o, ['a', 'x' as keyof typeof o])).toEqual({ a: 1 });
		});
	});
	describe('omit', () => {
		it('returns object without omitted keys', () => {
			const o = { a: 1, b: 2, c: 3 };
			expect(ObjectUtil.omit(o, ['b'])).toEqual({ a: 1, c: 3 });
		});
	});
});
