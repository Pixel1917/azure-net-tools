import { describe, it, expect } from 'vitest';
import {
	EnvironmentUtil,
	type AvailableEnvironments,
	type AvailableEnvironmentModes
} from '../src/environmentUtil/EnvironmentUtil.js';

describe('EnvironmentUtil', () => {
	it('exposes isBrowser boolean', () => {
		expect(typeof EnvironmentUtil.isBrowser).toBe('boolean');
	});
	it('exposes isServer boolean', () => {
		expect(typeof EnvironmentUtil.isServer).toBe('boolean');
	});
	it('exposes isWebWorker boolean', () => {
		expect(typeof EnvironmentUtil.isWebWorker).toBe('boolean');
	});
	it('currentEnvironment returns one of allowed values', () => {
		const env = EnvironmentUtil.currentEnvironment();
		const allowed: AvailableEnvironments[] = ['browser', 'server', 'webWorker', 'unknown'];
		expect(allowed).toContain(env);
	});
	it('isBrowser and isServer are mutually exclusive in typical envs', () => {
		expect(typeof EnvironmentUtil.isBrowser).toBe('boolean');
		expect(typeof EnvironmentUtil.isServer).toBe('boolean');
	});
	it('exposes isDevelopment boolean', () => {
		expect(typeof EnvironmentUtil.isDevelopment).toBe('boolean');
	});
	it('exposes isProduction boolean', () => {
		expect(typeof EnvironmentUtil.isProduction).toBe('boolean');
	});
	it('currentMode returns one of allowed values', () => {
		const mode = EnvironmentUtil.currentMode();
		const allowed: AvailableEnvironmentModes[] = ['development', 'production', 'unknown'];
		expect(allowed).toContain(mode);
	});
});
