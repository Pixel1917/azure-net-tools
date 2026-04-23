import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IntersectionObserverUtil } from '../src/intersectionObserver/IntersectionObserver.js';

type ObserverRecord = {
	callback: IntersectionObserverCallback;
	options?: IntersectionObserverInit;
	observe: ReturnType<typeof vi.fn>;
	unobserve: ReturnType<typeof vi.fn>;
	disconnect: ReturnType<typeof vi.fn>;
	emit: (entry: Partial<IntersectionObserverEntry> & { target: Element }) => void;
};

describe('IntersectionObserverUtil', () => {
	let el: HTMLDivElement;
	let other: HTMLDivElement;
	let callback: ReturnType<typeof vi.fn>;
	let records: ObserverRecord[];
	let originalIntersectionObserver: typeof globalThis.IntersectionObserver | undefined;

	const installObserverMock = () => {
		records = [];
		const MockIntersectionObserver = class {
			readonly observe = vi.fn();
			readonly unobserve = vi.fn();
			readonly disconnect = vi.fn();
			constructor(
				public callback: IntersectionObserverCallback,
				public options?: IntersectionObserverInit
			) {
				const record: ObserverRecord = {
					callback: this.callback,
					options: this.options,
					observe: this.observe,
					unobserve: this.unobserve,
					disconnect: this.disconnect,
					emit: (entry) => {
						this.callback(
							[
								{
									isIntersecting: false,
									intersectionRatio: 0,
									boundingClientRect: {} as DOMRectReadOnly,
									intersectionRect: {} as DOMRectReadOnly,
									rootBounds: null,
									time: 0,
									...entry
								} as IntersectionObserverEntry
							],
							this as unknown as IntersectionObserver
						);
					}
				};
				records.push(record);
			}
		};

		vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
	};

	beforeEach(() => {
		el = document.createElement('div');
		other = document.createElement('div');
		document.body.appendChild(el);
		document.body.appendChild(other);
		callback = vi.fn();
		originalIntersectionObserver = globalThis.IntersectionObserver;
		installObserverMock();
	});
	afterEach(() => {
		el.remove();
		other.remove();
		vi.unstubAllGlobals();
		if (originalIntersectionObserver) {
			vi.stubGlobal('IntersectionObserver', originalIntersectionObserver);
		}
		vi.restoreAllMocks();
	});

	it('creates observer and supports disconnect', () => {
		const observer = new IntersectionObserverUtil(el, {
			callback,
			options: { threshold: 0 }
		});
		expect(records).toHaveLength(1);
		expect(records[0].observe).toHaveBeenCalledWith(el);
		observer.disconnect();
		expect(records[0].unobserve).toHaveBeenCalledWith(el);
		expect(records[0].disconnect).toHaveBeenCalledTimes(1);
		expect(typeof observer.disconnect).toBe('function');
	});

	it('pools observers with same options', () => {
		const a = new IntersectionObserverUtil(el, { callback, options: { threshold: 0.5 } });
		const b = new IntersectionObserverUtil(other, { callback, options: { threshold: 0.5 } });

		expect(records).toHaveLength(1);
		expect(records[0].observe).toHaveBeenCalledWith(el);
		expect(records[0].observe).toHaveBeenCalledWith(other);

		a.disconnect();
		expect(records[0].disconnect).not.toHaveBeenCalled();

		b.disconnect();
		expect(records[0].disconnect).toHaveBeenCalledTimes(1);
	});

	it('supports once by intersect and triggerOnExit', () => {
		const observer = new IntersectionObserverUtil(el, {
			callback,
			once: true,
			triggerOnExit: true
		});

		records[0].emit({ target: el, isIntersecting: false });
		expect(callback).toHaveBeenCalledTimes(1);
		expect(records[0].unobserve).not.toHaveBeenCalled();

		records[0].emit({ target: el, isIntersecting: true });
		expect(callback).toHaveBeenCalledTimes(2);
		expect(records[0].unobserve).toHaveBeenCalledWith(el);

		records[0].emit({ target: el, isIntersecting: true });
		expect(callback).toHaveBeenCalledTimes(2);
		observer.disconnect();
	});

	it('supports onceMode=entry', () => {
		const observer = new IntersectionObserverUtil(el, {
			callback,
			once: true,
			onceMode: 'entry'
		});

		records[0].emit({ target: el, isIntersecting: false });
		expect(callback).toHaveBeenCalledTimes(1);
		expect(records[0].unobserve).toHaveBeenCalledWith(el);

		records[0].emit({ target: el, isIntersecting: true });
		expect(callback).toHaveBeenCalledTimes(1);
		observer.disconnect();
	});

	it('supports pause/resume and update with options rebind', () => {
		const observer = new IntersectionObserverUtil(el, { callback, options: { threshold: 0 } });

		observer.pause();
		records[0].emit({ target: el, isIntersecting: true });
		expect(callback).not.toHaveBeenCalled();

		observer.resume();
		records[0].emit({ target: el, isIntersecting: true });
		expect(callback).toHaveBeenCalledTimes(1);

		observer.update({ options: { threshold: 1 } });
		expect(records).toHaveLength(2);
		expect(records[0].unobserve).toHaveBeenCalledWith(el);
		expect(records[0].disconnect).toHaveBeenCalledTimes(1);
		expect(records[1].observe).toHaveBeenCalledWith(el);

		observer.disconnect();
	});

	it('is safe when IntersectionObserver is not available', () => {
		vi.unstubAllGlobals();
		vi.stubGlobal('IntersectionObserver', undefined);
		const observer = new IntersectionObserverUtil(el, { callback });

		expect(() => observer.disconnect()).not.toThrow();
		expect(() => observer.pause()).not.toThrow();
		expect(() => observer.resume()).not.toThrow();
		expect(() => observer.update({ once: true })).not.toThrow();
	});
});
