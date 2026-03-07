import { describe, it, expect } from 'vitest';
import { EventBus } from '../src/eventBus/EventBus.js';

describe('EventBus', () => {
	it('publish calls subscribed listeners', () => {
		const bus = new EventBus<'ev'>();
		let received: number | null = null;
		bus.subscribe('ev', (data: number) => {
			received = data;
		});
		bus.publish('ev', 42);
		expect(received).toBe(42);
	});
	it('does not call listeners on other channels', () => {
		const bus = new EventBus<'a' | 'b'>();
		let a = 0;
		let b = 0;
		bus.subscribe('a', () => { a++; });
		bus.subscribe('b', () => { b++; });
		bus.publish('a', null);
		expect(a).toBe(1);
		expect(b).toBe(0);
	});
	it('calls multiple listeners on same channel', () => {
		const bus = new EventBus<'ev'>();
		let c1 = 0;
		let c2 = 0;
		bus.subscribe('ev', () => { c1++; });
		bus.subscribe('ev', () => { c2++; });
		bus.publish('ev', null);
		expect(c1).toBe(1);
		expect(c2).toBe(1);
	});
	it('publish to channel with no listeners does not throw', () => {
		const bus = new EventBus<'ev'>();
		bus.publish('ev', 1);
	});
});
