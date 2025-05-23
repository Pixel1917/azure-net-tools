import { EnvironmentUtil } from '../environmentUtil';

/**
 * Utility class for managing cookies in the browser environment.
 * Supports setting, getting, deleting, checking, and clearing cookies.
 * All methods are static and operate without creating instances.
 */
export class Cookies {
	/**
	 * Checks if cookies are supported in the current environment.
	 * @returns {boolean} True if running in browser and cookies are enabled.
	 * @private
	 */
	private static isSupported(): boolean {
		return EnvironmentUtil.isBrowser && typeof document !== 'undefined' && navigator.cookieEnabled;
	}

	/**
	 * Sets a cookie with the specified key, value, and options.
	 * Serializes non-string values as JSON.
	 *
	 * @template T
	 * @param {string} key - The cookie key (alphanumeric, dash, underscore only).
	 * @param {T} value - The value to store in the cookie.
	 * @param {Object} [options] - Optional cookie attributes.
	 * @param {Date|number} [options.expires] - Expiration date or number of days until expiration.
	 * @param {number} [options.maxAge] - Max age in seconds.
	 * @param {string} [options.path] - Cookie path.
	 * @param {string} [options.domain] - Cookie domain.
	 * @param {boolean} [options.secure] - Secure flag.
	 * @param {'Strict'|'Lax'|'None'} [options.sameSite] - SameSite attribute.
	 * @returns {void}
	 */
	public static set<T = string>(
		key: string,
		value: T,
		options: {
			expires?: Date | number;
			maxAge?: number; // seconds
			path?: string;
			domain?: string;
			secure?: boolean;
			sameSite?: 'Strict' | 'Lax' | 'None';
		} = {}
	): void {
		if (!this.isSupported()) {
			console.warn('Cookies are not supported in this browser.');
			return;
		}

		if (!key || !/^[a-zA-Z0-9_-]+$/.test(key)) {
			throw new Error('Invalid cookie key. Key must be alphanumeric, dash or underscore.');
		}

		const encodedKey = encodeURIComponent(key);

		let serializedValue: string;
		if (typeof value === 'string') {
			serializedValue = encodeURIComponent(value);
		} else {
			serializedValue = encodeURIComponent(JSON.stringify(value));
		}

		let cookieString = `${encodedKey}=${serializedValue}`;

		if (options.expires) {
			if (typeof options.expires === 'number') {
				const date = new Date();
				date.setTime(date.getTime() + options.expires * 86400 * 1000);
				cookieString += `; expires=${date.toUTCString()}`;
			} else {
				cookieString += `; expires=${options.expires.toUTCString()}`;
			}
		}

		if (options.maxAge !== undefined) {
			cookieString += `; max-age=${options.maxAge}`;
		}

		if (options.path) {
			cookieString += `; path=${options.path}`;
		}

		if (options.domain) {
			cookieString += `; domain=${options.domain}`;
		}

		if (options.secure) {
			cookieString += '; secure';
		}

		if (options.sameSite) {
			cookieString += `; SameSite=${options.sameSite}`;
		}

		document.cookie = cookieString;
	}

	/**
	 * Retrieves the value of a cookie by key.
	 * Attempts to parse JSON if possible.
	 *
	 * @template T
	 * @param {string} key - The cookie key to retrieve.
	 * @returns {T | null} The cookie value, parsed as type T or null if not found.
	 */
	public static get<T = string>(key: string): T | null {
		if (!this.isSupported()) {
			console.warn('Cookies are not supported in this browser.');
			return null;
		}

		const encodedKey = encodeURIComponent(key);

		const cookies = document.cookie.split(';').map((cookie) => cookie.trim());
		for (const cookie of cookies) {
			const [cookieKey] = cookie.split('=', 2);
			if (cookieKey === encodedKey) {
				const cookieValue = cookie.substring(cookieKey.length + 1);
				const decodedValue = decodeURIComponent(cookieValue);

				try {
					return JSON.parse(decodedValue) as T;
				} catch {
					return decodedValue as T;
				}
			}
		}
		return null;
	}

	/**
	 * Deletes a cookie by key, optionally specifying path and domain.
	 *
	 * @param {string} key - The cookie key to delete.
	 * @param {string} [path] - The path attribute to match.
	 * @param {string} [domain] - The domain attribute to match.
	 * @returns {void}
	 */
	public static delete(key: string, path?: string, domain?: string): void {
		if (!this.isSupported()) {
			console.warn('Cookies are not supported in this browser.');
			return;
		}

		this.set(key, '', {
			expires: new Date(0),
			path,
			domain
		});
	}

	/**
	 * Checks if a cookie with the given key exists.
	 *
	 * @param {string} key - The cookie key to check.
	 * @returns {boolean} True if cookie exists, false otherwise.
	 */
	public static has(key: string): boolean {
		return this.get(key) !== null;
	}

	/**
	 * Retrieves all cookies as a key-value record.
	 * Attempts to parse JSON values.
	 *
	 * @returns {Record<string, unknown>} An object with all cookie keys and their values.
	 */
	public static getAll(): Record<string, unknown> {
		if (!this.isSupported()) {
			console.warn('Cookies are not supported in this browser.');
			return {};
		}

		const cookies = document.cookie.split(';').map((cookie) => cookie.trim());
		const result: Record<string, unknown> = {};
		for (const cookie of cookies) {
			const [key] = cookie.split('=', 2);
			const value = cookie.substring(key.length + 1);
			const decodedKey = decodeURIComponent(key);
			const decodedValue = decodeURIComponent(value);
			try {
				result[decodedKey] = JSON.parse(decodedValue);
			} catch {
				result[decodedKey] = decodedValue;
			}
		}
		return result;
	}

	/**
	 * Deletes all cookies for the current domain and optional path.
	 * It's recommended to specify path and domain for full cleanup.
	 *
	 * @param {string} [path] - The path attribute to match when deleting.
	 * @param {string} [domain] - The domain attribute to match when deleting.
	 * @returns {void}
	 */
	public static clear(path?: string, domain?: string): void {
		if (!this.isSupported()) {
			console.warn('Cookies are not supported in this browser.');
			return;
		}

		const allCookies = this.getAll();
		for (const key in allCookies) {
			this.delete(key, path, domain);
		}
	}
}
