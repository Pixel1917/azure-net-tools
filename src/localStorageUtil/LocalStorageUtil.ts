import { BROWSER } from '../../environment.js';

/**
 * Utility class for managing localStorage in the browser environment.
 * Supports setting, getting, deleting, checking, and clearing items.
 * All methods are static. Uses EnvironmentUtil to avoid access on server.
 */
export class LocalStorageUtil {
	/**
	 * Checks if localStorage is available in the current environment.
	 * @returns {boolean} True if running in browser and localStorage is available.
	 * @private
	 */
	private static isSupported(): boolean {
		if (!BROWSER || typeof window === 'undefined') return false;
		try {
			const key = '__storage_test__';
			window.localStorage.setItem(key, '');
			window.localStorage.removeItem(key);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Sets an item with the specified key and value. Serializes non-string values as JSON.
	 *
	 * @template T
	 * @param {string} key - The storage key.
	 * @param {T} value - The value to store.
	 * @returns {void}
	 */
	public static set<T = string>(key: string, value: T): void {
		if (!this.isSupported()) {
			console.warn('localStorage is not supported in this environment.');
			return;
		}
		const serialized = typeof value === 'string' ? value : JSON.stringify(value);
		try {
			window.localStorage.setItem(key, serialized);
		} catch {
			console.warn('localStorage.setItem failed.');
		}
	}

	/**
	 * Retrieves the value by key. Attempts to parse JSON if possible.
	 *
	 * @template T
	 * @param {string} key - The storage key to retrieve.
	 * @returns {T | null} The value, parsed as type T, or null if not found.
	 */
	public static get<T = string>(key: string): T | null {
		if (!this.isSupported()) {
			console.warn('localStorage is not supported in this environment.');
			return null;
		}
		try {
			const raw = window.localStorage.getItem(key);
			if (raw === null) return null;
			try {
				return JSON.parse(raw) as T;
			} catch {
				return raw as T;
			}
		} catch {
			return null;
		}
	}

	/**
	 * Removes an item by key.
	 *
	 * @param {string} key - The storage key to remove.
	 * @returns {void}
	 */
	public static delete(key: string): void {
		if (!this.isSupported()) {
			console.warn('localStorage is not supported in this environment.');
			return;
		}
		try {
			window.localStorage.removeItem(key);
		} catch {
			console.warn('localStorage.removeItem failed.');
		}
	}

	/**
	 * Checks if an item with the given key exists.
	 *
	 * @param {string} key - The storage key to check.
	 * @returns {boolean} True if key exists, false otherwise.
	 */
	public static has(key: string): boolean {
		if (!this.isSupported()) return false;
		return window.localStorage.getItem(key) !== null;
	}

	/**
	 * Returns all keys in localStorage. Does not parse values.
	 *
	 * @returns {string[]} Array of keys.
	 */
	public static keys(): string[] {
		if (!this.isSupported()) return [];
		const n = window.localStorage.length;
		const result: string[] = [];
		for (let i = 0; i < n; i++) {
			const key = window.localStorage.key(i);
			if (key !== null) result.push(key);
		}
		return result;
	}

	/**
	 * Retrieves all items as a key-value record. Attempts to parse JSON values.
	 *
	 * @returns {Record<string, unknown>} Object with all keys and their values.
	 */
	public static getAll(): Record<string, unknown> {
		if (!this.isSupported()) return {};
		const result: Record<string, unknown> = {};
		for (const key of this.keys()) {
			const value = this.get(key);
			if (value !== null) result[key] = value;
		}
		return result;
	}

	/**
	 * Removes all items from localStorage.
	 *
	 * @returns {void}
	 */
	public static clear(): void {
		if (!this.isSupported()) {
			console.warn('localStorage is not supported in this environment.');
			return;
		}
		try {
			window.localStorage.clear();
		} catch {
			console.warn('localStorage.clear failed.');
		}
	}
}
