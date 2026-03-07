import { describe, it, expect } from 'vitest';
import { UidGenerator } from '../src/uidGenerator/UidGenerator.js';

describe('UidGenerator', () => {
	describe('generateUniqueString', () => {
		it('returns string of given length', () => {
			const s = UidGenerator.generateUniqueString(10);
			expect(s).toHaveLength(10);
			expect(typeof s).toBe('string');
		});
		it('default length is 16', () => {
			expect(UidGenerator.generateUniqueString()).toHaveLength(16);
		});
	});
	describe('generateUniqueNumber', () => {
		it('returns number in range', () => {
			for (let i = 0; i < 20; i++) {
				const n = UidGenerator.generateUniqueNumber(1, 10);
				expect(n).toBeGreaterThanOrEqual(1);
				expect(n).toBeLessThanOrEqual(10);
			}
		});
	});
	describe('generateUuid', () => {
		it('returns string in UUID v4 format', () => {
			const u = UidGenerator.generateUuid();
			expect(UidGenerator.isValidUuid(u)).toBe(true);
			expect(u).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
		});
	});
	describe('generateNanoId', () => {
		it('returns url-safe string of default length 21', () => {
			const id = UidGenerator.generateNanoId();
			expect(id).toHaveLength(21);
			expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
		});
	});
	describe('generateTimestampId', () => {
		it('includes prefix when given', () => {
			const id = UidGenerator.generateTimestampId('pre');
			expect(id.startsWith('pre_')).toBe(true);
		});
	});
	describe('generateHashId', () => {
		it('returns hex string of default length 32', () => {
			const id = UidGenerator.generateHashId();
			expect(id).toHaveLength(32);
			expect(id).toMatch(/^[0-9a-f]+$/);
		});
	});
	describe('isValidUuid', () => {
		it('accepts valid v4 uuid', () => {
			expect(UidGenerator.isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
		});
		it('rejects invalid', () => {
			expect(UidGenerator.isValidUuid('not-a-uuid')).toBe(false);
			expect(UidGenerator.isValidUuid('550e8400-e29b-41d4-a716')).toBe(false);
		});
	});
});
