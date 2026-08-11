import { describe, expect, it } from 'vitest';
import { PromiseUtil } from '../src/promiseUtil/index.js';

describe('PromiseUtil', () => {
	it('detects native promises and thenables', () => {
		expect(PromiseUtil.isPromiseLike(Promise.resolve(1))).toBe(true);
		expect(PromiseUtil.isPromiseLike({ then: () => undefined })).toBe(true);
		expect(PromiseUtil.isPromiseLike(Object.assign(() => undefined, { then: () => undefined }))).toBe(true);
	});

	it('rejects non-promise values', () => {
		expect(PromiseUtil.isPromiseLike(null)).toBe(false);
		expect(PromiseUtil.isPromiseLike({ then: true })).toBe(false);
		expect(PromiseUtil.isPromiseLike('promise')).toBe(false);
	});
});
