export class FormDataUtil {
	private static readonly BLOCKED_PATH_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor']);
	private static readonly MAX_PATH_DEPTH = 100;
	private static readonly MAX_ARRAY_INDEX = 1_000_000;

	private static parsePath(key: string): string[] {
		const segments: string[] = [];
		const matcher = /([^\[\]]+)|\[([^\]]*)\]/g;
		let match: RegExpExecArray | null;

		while ((match = matcher.exec(key)) !== null) {
			segments.push(match[1] ?? match[2] ?? '');
		}

		if (segments.length === 0 || segments.length > this.MAX_PATH_DEPTH) {
			throw new Error(`[FormDataUtil] Invalid field path: "${key}"`);
		}

		for (const segment of segments) {
			if (this.BLOCKED_PATH_SEGMENTS.has(segment)) {
				throw new Error(`[FormDataUtil] Unsafe field path segment: "${segment}"`);
			}
		}

		return segments;
	}

	private static isArraySegment(segment: string): boolean {
		return segment === '' || /^\d+$/.test(segment);
	}

	private static getArrayIndex(segment: string): number {
		const index = Number(segment);
		if (!Number.isSafeInteger(index) || index < 0 || index > this.MAX_ARRAY_INDEX) {
			throw new Error(`[FormDataUtil] Invalid array index: "${segment}"`);
		}
		return index;
	}

	private static assignNestedValue(target: Record<string, unknown>, keys: string[], value: unknown): void {
		let current: Record<string, unknown> | unknown[] = target;

		for (let index = 0; index < keys.length - 1; index += 1) {
			const key = keys[index]!;
			const nextKey = keys[index + 1]!;
			const nextContainer: Record<string, unknown> | unknown[] = this.isArraySegment(nextKey) ? [] : {};

			if (Array.isArray(current)) {
				if (key === '') {
					current.push(nextContainer);
					current = nextContainer;
					continue;
				}

				const arrayIndex = this.getArrayIndex(key);
				const existing = current[arrayIndex];
				if (typeof existing !== 'object' || existing === null) {
					current[arrayIndex] = nextContainer;
				}
				current = current[arrayIndex] as Record<string, unknown> | unknown[];
				continue;
			}

			const existing = Object.prototype.hasOwnProperty.call(current, key) ? current[key] : undefined;
			if (typeof existing !== 'object' || existing === null) {
				current[key] = nextContainer;
			}
			current = current[key] as Record<string, unknown> | unknown[];
		}

		const lastKey = keys.at(-1)!;
		if (Array.isArray(current)) {
			if (lastKey === '') {
				current.push(value);
				return;
			}
			current[this.getArrayIndex(lastKey)] = value;
			return;
		}

		if (Object.prototype.hasOwnProperty.call(current, lastKey)) {
			const previous = current[lastKey];
			current[lastKey] = Array.isArray(previous) ? [...previous, value] : [previous, value];
			return;
		}

		current[lastKey] = value;
	}

	/**
	 * Converts a FormData instance into a nested JavaScript object.
	 * Supports keys with bracket notation like "foo[bar][baz]".
	 * Arrays are reconstructed from indexed keys.
	 *
	 * @template T - The expected return object type.
	 * @param {FormData} formData - The FormData to convert.
	 * @returns {T} The resulting nested object.
	 */
	static toObject<T = object>(formData: FormData): T {
		const obj: Record<string, unknown> = {};

		for (const [key, value] of formData.entries()) {
			this.assignNestedValue(obj, this.parsePath(key), value);
		}

		return obj as T;
	}

	/**
	 * Converts a JavaScript object into a FormData instance.
	 * Supports nested objects, arrays, Maps, Sets, Dates, and Blob/File objects.
	 * Detects cyclic references and throws an error if found.
	 *
	 * @param {unknown} obj - The object to convert.
	 * @param {FormData} [formData] - An existing FormData instance to append to (optional).
	 * @param {string} [namespace] - The namespace prefix for nested keys (used internally).
	 * @param {WeakSet<object>} [seen] - Set of visited objects to detect cycles (used internally).
	 * @returns {FormData} The populated FormData instance.
	 * @throws {Error} Throws if a cyclic reference is detected in the object.
	 */
	static fromObject(obj: unknown, formData?: FormData, namespace?: string, seen = new WeakSet<object>()): FormData {
		const form = formData || new FormData();

		if (obj === null || obj === undefined) {
			return form;
		}

		if (typeof obj === 'object' && obj !== null) {
			if (seen.has(obj)) {
				throw new Error('[FormDataUtil] Cycle link detected');
			}
			seen.add(obj);
		}

		if (obj instanceof Date) {
			form.append(namespace!, obj.toISOString());
		} else if (typeof Blob !== 'undefined' && obj instanceof Blob) {
			form.append(namespace!, obj);
		} else if (Array.isArray(obj)) {
			obj.forEach((item, index) => {
				const key = namespace ? `${namespace}[${index}]` : `${index}`;
				this.fromObject(item, form, key, seen);
			});
		} else if (obj instanceof Map) {
			obj.forEach((value, key) => {
				const formKey = namespace ? `${namespace}[${key}]` : String(key);
				this.fromObject(value, form, formKey, seen);
			});
		} else if (obj instanceof Set) {
			Array.from(obj).forEach((item, index) => {
				const key = namespace ? `${namespace}[${index}]` : `${index}`;
				this.fromObject(item, form, key, seen);
			});
		} else if (typeof obj === 'object' && obj !== null) {
			for (const key in obj) {
				if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

				const value = (obj as Record<string, unknown>)[key];

				if (value === undefined) continue;

				const formKey = namespace ? `${namespace}[${key}]` : key;

				this.fromObject(value, form, formKey, seen);
			}
		} else if (typeof obj === 'boolean' || typeof obj === 'number' || typeof obj === 'string') {
			form.append(namespace!, String(obj));
		} else {
			// Ignore functions, symbols, and other unsupported types
		}

		if (typeof obj === 'object' && obj !== null) {
			seen.delete(obj);
		}

		return form;
	}
}
