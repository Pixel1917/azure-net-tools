import { describe, it, expect, expectTypeOf, vi } from 'vitest';
import { EventBus } from '../src/eventBus/EventBus.js';

type TestEvents = {
	ev: number;
	a: null;
	b: null;
	ready: void;
	error: { message: string };
};

describe('EventBus', () => {
	it('publish calls subscribed listeners', async () => {
		const bus = new EventBus<TestEvents>();
		let received: number | null = null;
		bus.subscribe('ev', (data) => {
			received = data;
		});
		await bus.publish('ev', () => 42);
		expect(received).toBe(42);
	});
	it('does not call listeners on other channels', async () => {
		const bus = new EventBus<TestEvents>();
		let a = 0;
		let b = 0;
		bus.subscribe('a', () => {
			a++;
		});
		bus.subscribe('b', () => {
			b++;
		});
		await bus.publish('a', () => null);
		expect(a).toBe(1);
		expect(b).toBe(0);
	});
	it('calls multiple listeners on same channel', async () => {
		const bus = new EventBus<TestEvents>();
		let c1 = 0;
		let c2 = 0;
		bus.subscribe('ev', () => {
			c1++;
		});
		bus.subscribe('ev', () => {
			c2++;
		});
		await bus.publish('ev', () => 1);
		expect(c1).toBe(1);
		expect(c2).toBe(1);
	});
	it('publish to channel with no listeners does not throw', async () => {
		const bus = new EventBus<TestEvents>();
		await expect(bus.publish('ev', () => 1)).resolves.toBe(1);
	});
	it('subscribe returns unsubscribe function', async () => {
		const bus = new EventBus<TestEvents>();
		const listener = vi.fn();
		const unsubscribe = bus.subscribe('ev', listener);

		await bus.publish('ev', () => 1);
		unsubscribe();
		await bus.publish('ev', () => 2);

		expect(listener).toHaveBeenCalledTimes(1);
	});
	it('once listener is called only once', async () => {
		const bus = new EventBus<TestEvents>();
		const listener = vi.fn();
		bus.once('ev', listener);

		await bus.publish('ev', () => 1);
		await bus.publish('ev', () => 2);

		expect(listener).toHaveBeenCalledTimes(1);
	});
	it('supports wildcard listeners', async () => {
		const bus = new EventBus<TestEvents>();
		const anyListener = vi.fn();
		bus.subscribeAll(anyListener);

		await bus.publish('ev', () => 5);
		await bus.publish('error', () => ({ message: 'boom' }));

		expect(anyListener).toHaveBeenCalledTimes(2);
		expect(anyListener).toHaveBeenNthCalledWith(1, 'ev', 5);
		expect(anyListener).toHaveBeenNthCalledWith(2, 'error', { message: 'boom' });
	});
	it('listener diagnostics work', async () => {
		const bus = new EventBus<TestEvents>();
		const offA = bus.subscribe('a', () => {});
		bus.subscribe('a', () => {});

		expect(bus.listenerCount('a')).toBe(2);
		expect(bus.hasListeners('a')).toBe(true);
		expect(bus.eventNames()).toContain('a');

		offA();
		expect(bus.listenerCount('a')).toBe(1);

		bus.clear('a');
		expect(bus.hasListeners('a')).toBe(false);

		await bus.publish('a', () => null);
	});
	it('awaits async payload factory before listeners', async () => {
		const bus = new EventBus<TestEvents>();
		const values: string[] = [];
		bus.subscribe('ev', () => {
			values.push('listener');
		});

		await bus.publish('ev', async () => {
			values.push('factory:start');
			await Promise.resolve();
			values.push('factory:end');
			return 10;
		});

		expect(values).toEqual(['factory:start', 'factory:end', 'listener']);
	});
	it('forwards listener errors to onError and continues', async () => {
		const onError = vi.fn();
		const bus = new EventBus<TestEvents>({}, { onError });
		const okListener = vi.fn();
		bus.subscribe('ev', () => {
			throw new Error('bad');
		});
		bus.subscribe('ev', okListener);

		await bus.publish('ev', () => 1);

		expect(onError).toHaveBeenCalledTimes(1);
		expect(okListener).toHaveBeenCalledTimes(1);
	});
	it('warns when max listeners exceeded', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const bus = new EventBus<TestEvents>({}, { maxListeners: 1 });
		bus.subscribe('ev', () => {});
		bus.subscribe('ev', () => {});

		expect(warnSpy).toHaveBeenCalledTimes(1);
		warnSpy.mockRestore();
	});
	it('enforces event payload typing', async () => {
		const bus = new EventBus<TestEvents>();
		bus.subscribe('ev', (payload) => {
			expectTypeOf(payload).toEqualTypeOf<number>();
		});
		bus.subscribe('ready', (payload) => {
			expectTypeOf(payload).toEqualTypeOf<void>();
		});

		// @ts-expect-error wrong payload type for ev
		bus.subscribe('ev', (payload: string) => payload);

		// @ts-expect-error wrong event payload factory type
		await bus.publish('ev', () => 'wrong');
	});
});
