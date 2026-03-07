import { describe, it, expect } from 'vitest';
import { TextUtil } from '../src/textUtil/TextUtil.js';

describe('TextUtil', () => {
	describe('pluralize', () => {
		it('uses 2 forms for English-like (singular/plural)', () => {
			expect(TextUtil.pluralize(1, ['apple', 'apples'])).toBe('apple');
			expect(TextUtil.pluralize(0, ['apple', 'apples'])).toBe('apples');
			expect(TextUtil.pluralize(2, ['apple', 'apples'])).toBe('apples');
		});
		it('uses 3 forms for Russian-like', () => {
			expect(TextUtil.pluralize(1, ['яблоко', 'яблока', 'яблок'])).toBe('яблоко');
			expect(TextUtil.pluralize(2, ['яблоко', 'яблока', 'яблок'])).toBe('яблока');
			expect(TextUtil.pluralize(5, ['яблоко', 'яблока', 'яблок'])).toBe('яблок');
		});
		it('throws if titles length is not 2 or 3', () => {
			expect(() => TextUtil.pluralize(1, [])).toThrow();
			expect(() => TextUtil.pluralize(1, ['a'])).toThrow();
			expect(() => TextUtil.pluralize(1, ['a', 'b', 'c', 'd'])).toThrow();
		});
	});
	describe('truncate', () => {
		it('returns same string if within maxLength', () => {
			expect(TextUtil.truncate('hi', 5)).toBe('hi');
		});
		it('truncates and adds ellipsis', () => {
			expect(TextUtil.truncate('hello world', 5)).toBe('hello...');
		});
		it('uses custom ellipsis', () => {
			expect(TextUtil.truncate('hello', 2, '..')).toBe('he..');
		});
	});
	describe('capitalize', () => {
		it('capitalizes first char', () => {
			expect(TextUtil.capitalize('hello')).toBe('Hello');
			expect(TextUtil.capitalize('')).toBe('');
		});
	});
	describe('decapitalize', () => {
		it('lowercases first char', () => {
			expect(TextUtil.decapitalize('Hello')).toBe('hello');
			expect(TextUtil.decapitalize('')).toBe('');
		});
	});
	describe('isEmptyOrWhitespace', () => {
		it('returns true for empty or whitespace', () => {
			expect(TextUtil.isEmptyOrWhitespace('')).toBe(true);
			expect(TextUtil.isEmptyOrWhitespace('  \t\n')).toBe(true);
			expect(TextUtil.isEmptyOrWhitespace(' a ')).toBe(false);
		});
	});
});
