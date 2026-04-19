import { afterEach, describe, expect, it } from 'vitest';
import { DateUtil } from '../src/dateUtil/DateUtil.js';

afterEach(() => {
	DateUtil.clearLocaleResolver();
	DateUtil.setDefaultLocale('ru');
});

describe('DateUtil', () => {
	describe('pad', () => {
		it('pads with zero', () => {
			expect(DateUtil.pad(5)).toBe('05');
			expect(DateUtil.pad(12)).toBe('12');
		});
	});

	describe('isDate', () => {
		it('returns true for valid ISO date and Date instance', () => {
			expect(DateUtil.isDate('2024-05-23')).toBe(true);
			expect(DateUtil.isDate(new Date('2024-05-23T00:00:00Z'))).toBe(true);
		});

		it('returns false for invalid or non-ISO strings', () => {
			expect(DateUtil.isDate('invalid')).toBe(false);
			expect(DateUtil.isDate('05/23/2024')).toBe(false);
			expect(DateUtil.isDate('2024-13-10')).toBe(false);
		});
	});

	describe('getDateParts', () => {
		it('returns fragments for ISO date in UTC mode', () => {
			const p = DateUtil.getDateParts('2024-05-23T15:30:00Z', { utc: true });
			expect(p.day).toBe('23');
			expect(p.month).toBe('05');
			expect(p.year).toBe(2024);
			expect(p.hours).toBe('15');
			expect(p.minutes).toBe('30');
			expect(p.seconds).toBe('00');
		});

		it('uses timeZone when provided', () => {
			const p = DateUtil.getDateParts('2024-01-01T00:00:00Z', { timeZone: 'Asia/Tokyo' });
			expect(p.day).toBe('01');
			expect(p.month).toBe('01');
			expect(p.year).toBe(2024);
			expect(p.hours).toBe('09');
			expect(p.minutes).toBe('00');
		});
	});

	describe('toDate', () => {
		it('formats date and returns empty for invalid', () => {
			expect(DateUtil.toDate('2024-05-23')).toBe('23.05.2024');
			expect(DateUtil.toDate('invalid')).toBe('');
		});
	});

	describe('toTime', () => {
		it('formats time in utc mode', () => {
			expect(DateUtil.toTime('2024-01-01T14:30:00Z', { utc: true })).toBe('14:30');
		});
	});

	describe('toDateTime', () => {
		it('formats date and time in utc mode', () => {
			expect(DateUtil.toDateTime('2024-05-23T15:30:00Z', { utc: true })).toBe('23.05.2024 15:30');
		});
	});

	describe('toDayMonthTime', () => {
		it('uses locale resolver and localized connector word', () => {
			DateUtil.setLocale(() => 'en');
			expect(DateUtil.toDayMonthTime('2024-08-15T15:00:00Z', { utc: true })).toBe('15 August at 15:00');
		});

		it('falls back to Intl for unknown locale', () => {
			const value = DateUtil.toDayMonth('2024-08-15', { locale: 'pl-PL' });
			expect(value.startsWith('15 ')).toBe(true);
			expect(value.length).toBeGreaterThan(3);
		});
	});

	describe('toFormat', () => {
		it('applies pattern', () => {
			expect(DateUtil.toFormat('2024-12-22', 'yyyy-mm-dd')).toBe('2024-12-22');
			expect(DateUtil.toFormat('2024-09-12', 'dd.mm.yy')).toBe('12.09.24');
		});
	});

	describe('locale resolution', () => {
		it('uses default locale when resolver is not set', () => {
			expect(DateUtil.locale).toBe('ru');
			DateUtil.setDefaultLocale('en');
			expect(DateUtil.locale).toBe('en');
		});

		it('uses resolver locale when set', () => {
			DateUtil.setLocale(() => 'ja');
			expect(DateUtil.locale).toBe('ja');
		});
	});

	describe('timestamps', () => {
		it('now returns date object', () => {
			expect(DateUtil.now()).toBeInstanceOf(Date);
		});

		it('fromTimestamp creates date from ms timestamp', () => {
			const date = DateUtil.fromTimestamp(0);
			expect(date.toISOString()).toBe('1970-01-01T00:00:00.000Z');
		});
	});
});
