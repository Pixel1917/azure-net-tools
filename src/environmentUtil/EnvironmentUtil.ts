export type AvailableEnvironments = 'browser' | 'server' | 'webWorker' | 'unknown';

/**
 * Utility class to detect the current JavaScript runtime environment.
 */
export class EnvironmentUtil {
	/**
	 * Indicates if the code is running in a browser environment.
	 * @type {boolean}
	 */
	static isBrowser: boolean = typeof window !== 'undefined' && typeof document !== 'undefined';

	/**
	 * Indicates if the code is running on a server environment (Node.js or Bun).
	 * @type {boolean}
	 */
	static isServer: boolean =
		typeof process !== 'undefined' &&
		(typeof process.versions?.node === 'string' || typeof process.versions?.bun === 'string') &&
		typeof window === 'undefined';

	/**
	 * Indicates if the code is running inside a Web Worker.
	 * @type {boolean}
	 */
	static isWebWorker: boolean = typeof self === 'object' && self.constructor?.name === 'DedicatedWorkerGlobalScope';

	/**
	 * Returns the current runtime environment.
	 *
	 * Possible return values:
	 * - 'browser' if running in a browser
	 * - 'server' if running on a server (Node.js or Bun)
	 * - 'webWorker' if running inside a Web Worker
	 * - 'unknown' if the environment cannot be determined
	 *
	 * @returns {AvailableEnvironments} The current runtime environment.
	 */
	static currentEnvironment(): AvailableEnvironments {
		switch (true) {
			case this.isBrowser:
				return 'browser';
			case this.isServer:
				return 'server';
			case this.isWebWorker:
				return 'webWorker';
			default:
				return 'unknown';
		}
	}
}
