import { describe, expect, it } from 'vitest';
import { ErrorUtil } from '../src/errorUtil/index.js';

describe('ErrorUtil', () => {
	it('keeps existing Error instances unchanged', () => {
		const source = new TypeError('Invalid value');
		expect(ErrorUtil.toError(source)).toBe(source);
	});

	it('normalizes strings, error-like objects and primitive values', () => {
		expect(ErrorUtil.toError('Failed').message).toBe('Failed');

		const fromObject = ErrorUtil.toError({ name: 'ExternalError', message: 'API failed', status: 500 });
		expect(fromObject.name).toBe('ExternalError');
		expect(fromObject.message).toBe('API failed');
		expect((fromObject as Error & { cause?: unknown }).cause).toEqual({ name: 'ExternalError', message: 'API failed', status: 500 });

		expect(ErrorUtil.toError(42).message).toBe('42');
		expect(ErrorUtil.toError(undefined, 'Fallback').message).toBe('Fallback');
	});
});
