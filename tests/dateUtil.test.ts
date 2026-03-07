import { describe, it, expect } from 'vitest';
import { DateUtil } from '../src/dateUtil/DateUtil.js';

describe('DateUtil', () => {
	describe('pad', () => {
		it('pads with zero', () => {
			expect(DateUtil.pad(5)).toBe('05');
			expect(DateUtil.pad(12)).toBe('12');
		});
	});
	describe('getDateParts', () => {
		it('returns fragments for ISO date', () => {
			const p = DateUtil.getDateParts('2024-05-23T15:30:00Z', true);
			expect(p.day).toBe('23');
			expect(p.month).toBe('05');
			expect(p.year).toBe(2024);
			expect(p.hours).toBe('15');
			expect(p.minutes).toBe('30');
			expect(p.seconds).toBe('00');
		});
	});
	describe('toDate', () => {
		it('formats date and returns empty for invalid', () => {
			expect(DateUtil.toDate('2024-05-23')).toBe('23.05.2024');
			expect(DateUtil.toDate('invalid')).toBe('');
		});
	});
	describe('toTime', () => {
		it('formats time', () => {
			expect(DateUtil.toTime(new Date('2024-01-01T14:30:00'))).toBe('14:30');
		});
	});
	describe('toDateTime', () => {
		it('formats date and time', () => {
			expect(DateUtil.toDateTime('2024-05-23T15:30:00')).toBe('23.05.2024 15:30');
		});
	});
	describe('toFormat', () => {
		it('applies pattern', () => {
			DateUtil.setLocale('en');
			expect(DateUtil.toFormat('2024-12-22', 'yyyy-mm-dd')).toBe('2024-12-22');
			expect(DateUtil.toFormat('2024-09-12', 'dd.mm.yy')).toBe('12.09.24');
			DateUtil.setLocale('ru');
		});
	});
	describe('locale', () => {
		it('default locale is ru', () => {
			expect(DateUtil.locale).toBe('ru');
		});
		it('setLocale changes locale', () => {
			DateUtil.setLocale('en');
			expect(DateUtil.locale).toBe('en');
			DateUtil.setLocale('ru');
		});
	});
});
