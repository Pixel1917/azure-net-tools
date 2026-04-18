export type AvailableEnvironments = 'browser' | 'server' | 'webWorker' | 'unknown';
export type AvailableEnvironmentModes = 'development' | 'production' | 'unknown';

type RuntimeGlobalThis = typeof globalThis & {
	process?: { env?: { NODE_ENV?: unknown }; versions?: { node?: unknown; bun?: unknown } };
	Deno?: { version?: { deno?: unknown } };
};

const runtime = globalThis as RuntimeGlobalThis;

const isBrowserRuntime = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined';

const isNodeOrBunRuntime = (): boolean => {
	const versions = runtime.process?.versions;
	return typeof versions?.node === 'string' || typeof versions?.bun === 'string';
};

const isDenoRuntime = (): boolean => typeof runtime.Deno?.version?.deno === 'string';

const isWorkerRuntime = (): boolean => {
	if (isBrowserRuntime() || typeof self !== 'object' || self === null) return false;

	const workerGlobalScopeCtor = (runtime as { WorkerGlobalScope?: unknown }).WorkerGlobalScope;
	if (typeof workerGlobalScopeCtor === 'function' && self instanceof (workerGlobalScopeCtor as new () => object)) {
		return true;
	}

	const scopeName = (self as { constructor?: { name?: string } }).constructor?.name;
	return (
		scopeName === 'WorkerGlobalScope' ||
		scopeName === 'DedicatedWorkerGlobalScope' ||
		scopeName === 'SharedWorkerGlobalScope' ||
		scopeName === 'ServiceWorkerGlobalScope'
	);
};

const readRuntimeMode = (): AvailableEnvironmentModes => {
	const importMetaEnv = (import.meta as ImportMeta & { env?: { MODE?: unknown; DEV?: unknown; PROD?: unknown } }).env;
	if (typeof importMetaEnv?.DEV === 'boolean') return importMetaEnv.DEV ? 'development' : 'production';
	if (typeof importMetaEnv?.PROD === 'boolean') return importMetaEnv.PROD ? 'production' : 'development';
	if (typeof importMetaEnv?.MODE === 'string') {
		const mode = importMetaEnv.MODE.toLowerCase();
		if (mode.startsWith('prod')) return 'production';
		if (mode.startsWith('dev')) return 'development';
	}

	const nodeEnv = runtime.process?.env?.NODE_ENV;
	if (typeof nodeEnv !== 'string' || nodeEnv.length === 0) return 'unknown';
	return nodeEnv.toLowerCase().startsWith('prod') ? 'production' : 'development';
};

/**
 * Utility class to detect the current JavaScript runtime environment.
 */
export class EnvironmentUtil {
	/**
	 * Indicates if the code is running in a browser environment.
	 * @type {boolean}
	 */
	static get isBrowser(): boolean {
		return isBrowserRuntime();
	}

	/**
	 * Indicates if the code is running on a server environment (Node.js or Bun).
	 * @type {boolean}
	 */
	static get isServer(): boolean {
		return !this.isBrowser && !this.isWebWorker && (isNodeOrBunRuntime() || isDenoRuntime());
	}

	/**
	 * Indicates if the code is running inside a Web Worker.
	 * @type {boolean}
	 */
	static get isWebWorker(): boolean {
		return isWorkerRuntime();
	}

	/**
	 * Indicates if runtime mode is development.
	 */
	static get isDevelopment(): boolean {
		return this.currentMode() === 'development';
	}

	/**
	 * Indicates if runtime mode is production.
	 */
	static get isProduction(): boolean {
		return this.currentMode() === 'production';
	}

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
			case this.isWebWorker:
				return 'webWorker';
			case this.isServer:
				return 'server';
			default:
				return 'unknown';
		}
	}

	/**
	 * Returns current runtime mode.
	 *
	 * Possible return values:
	 * - 'development'
	 * - 'production'
	 * - 'unknown' if mode cannot be determined
	 */
	static currentMode(): AvailableEnvironmentModes {
		return readRuntimeMode();
	}
}
