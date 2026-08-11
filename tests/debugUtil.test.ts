import { describe, expect, it } from 'vitest';
import { DebugUtil } from '../src/debugUtil/index.js';

describe('DebugUtil', () => {
	it('serializes complex and cyclic values safely', () => {
		const value: Record<string, unknown> = {
			bigint: 10n,
			date: new Date('2025-01-02T03:04:05.000Z'),
			map: new Map([['key', 1]]),
			set: new Set(['value'])
		};
		value.self = value;

		const result = DebugUtil.stringify(value);

		expect(result).toContain('2025-01-02T03:04:05.000Z');
		expect(result).toContain('10n');
		expect(result).toContain('Map(1)');
		expect(result).toContain('Set(1)');
		expect(result).toContain('[Circular]');
	});

	it('limits depth and collection size', () => {
		const result = DebugUtil.stringify({ list: [1, 2, 3], nested: { value: { deep: true } } }, { maxDepth: 2, maxEntries: 2 });

		expect(result).toContain('[1 more items]');
		expect(result).toContain('[Max depth reached]');
	});

	it('renders primitives in a compact escaped box', () => {
		const result = DebugUtil.render('<script>alert(1)</script>');

		expect(result).toContain('azure-debug-value');
		expect(result).toContain('&lt;script&gt;');
		expect(result).not.toContain('<script>');
	});

	it('renders structured values with syntax highlighting', () => {
		const result = DebugUtil.render({ enabled: true, count: 2 }, { theme: 'dark' });

		expect(result).toContain('azure-debug-view');
		expect(result).toContain('<span');
		expect(result).toContain('#15191f');
	});
});
