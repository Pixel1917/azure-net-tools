import { BROWSER } from '../../environment.js';

export type StorageReadOptions = {
	parse?: boolean;
};

let storageSupported: boolean | undefined;
let unsupportedWarningShown = false;

const parseStorageValue = <T>(value: string, options?: StorageReadOptions): T => {
	if (options?.parse === false) return value as T;
	try {
		return JSON.parse(value) as T;
	} catch {
		return value as T;
	}
};

export class LocalStorageInstance<T = string> {
	readonly key: string;
	private readonly options: StorageReadOptions;

	constructor(key: string, options: StorageReadOptions = {}) {
		this.key = key;
		this.options = options;
	}

	set(value: T): void {
		LocalStorageUtil.set(this.key, value);
	}

	get(options?: StorageReadOptions): T | null {
		return LocalStorageUtil.get<T>(this.key, { ...this.options, ...options });
	}

	delete(): void {
		LocalStorageUtil.delete(this.key);
	}

	clear(): void {
		this.delete();
	}

	has(): boolean {
		return LocalStorageUtil.has(this.key);
	}
}

/** Browser-safe localStorage access with optional JSON parsing. */
export class LocalStorageUtil {
	private static warnUnsupported(): void {
		if (!BROWSER || unsupportedWarningShown) return;
		unsupportedWarningShown = true;
		console.warn('localStorage is not supported in this environment.');
	}

	private static isSupported(): boolean {
		if (!BROWSER || typeof window === 'undefined') return false;
		if (storageSupported !== undefined) return storageSupported;

		try {
			const key = `__azure_net_storage_test__${Date.now()}`;
			window.localStorage.setItem(key, '');
			window.localStorage.removeItem(key);
			storageSupported = true;
		} catch {
			storageSupported = false;
		}
		return storageSupported;
	}

	static createInstance<T = string>(key: string, options: StorageReadOptions = {}): LocalStorageInstance<T> {
		if (!key) throw new Error('localStorage key must not be empty');
		return new LocalStorageInstance<T>(key, options);
	}

	static set<T = string>(key: string, value: T): void {
		if (!this.isSupported()) {
			this.warnUnsupported();
			return;
		}

		try {
			const serialized = typeof value === 'string' ? value : JSON.stringify(value);
			if (serialized === undefined) {
				console.warn('localStorage value is not JSON-serializable.');
				return;
			}
			window.localStorage.setItem(key, serialized);
		} catch {
			console.warn('localStorage.setItem failed.');
		}
	}

	static get<T = string>(key: string, options?: StorageReadOptions): T | null {
		if (!this.isSupported()) {
			this.warnUnsupported();
			return null;
		}

		try {
			const raw = window.localStorage.getItem(key);
			return raw === null ? null : parseStorageValue<T>(raw, options);
		} catch {
			return null;
		}
	}

	static delete(key: string): void {
		if (!this.isSupported()) {
			this.warnUnsupported();
			return;
		}

		try {
			window.localStorage.removeItem(key);
		} catch {
			console.warn('localStorage.removeItem failed.');
		}
	}

	static has(key: string): boolean {
		if (!this.isSupported()) return false;
		try {
			return window.localStorage.getItem(key) !== null;
		} catch {
			return false;
		}
	}

	static keys(): string[] {
		if (!this.isSupported()) return [];
		try {
			const result: string[] = [];
			for (let index = 0; index < window.localStorage.length; index += 1) {
				const key = window.localStorage.key(index);
				if (key !== null) result.push(key);
			}
			return result;
		} catch {
			return [];
		}
	}

	static getAll(options?: StorageReadOptions): Record<string, unknown> {
		if (!this.isSupported()) return {};

		const result: Record<string, unknown> = {};
		try {
			for (let index = 0; index < window.localStorage.length; index += 1) {
				const key = window.localStorage.key(index);
				if (key === null) continue;
				const value = window.localStorage.getItem(key);
				if (value !== null) result[key] = parseStorageValue(value, options);
			}
		} catch {
			return result;
		}
		return result;
	}

	static clear(): void {
		if (!this.isSupported()) {
			this.warnUnsupported();
			return;
		}

		try {
			window.localStorage.clear();
		} catch {
			console.warn('localStorage.clear failed.');
		}
	}
}
