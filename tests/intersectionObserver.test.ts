import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IntersectionObserverUtil } from '../src/intersectionObserver/IntersectionObserver.js';

describe('IntersectionObserverUtil', () => {
	let el: HTMLDivElement;
	let callback: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		el = document.createElement('div');
		document.body.appendChild(el);
		callback = vi.fn();
	});
	afterEach(() => {
		el.remove();
	});

	it('creates observer and supports disconnect', () => {
		const observer = new IntersectionObserverUtil(el, {
			callback,
			options: { threshold: 0 },
		});
		observer.disconnect();
		expect(typeof observer.disconnect).toBe('function');
	});
	it('disconnect does not throw', () => {
		const observer = new IntersectionObserverUtil(el, { callback });
		expect(() => observer.disconnect()).not.toThrow();
	});
});
