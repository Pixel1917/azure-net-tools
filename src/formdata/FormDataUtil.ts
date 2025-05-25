export class FormDataUtil {
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

		const assignNestedValue = (target: Record<string, unknown> | unknown[], keys: string[], value: unknown): void => {
			const lastKey = keys.pop();
			if (!lastKey) return;

			let current: Record<string, unknown> | unknown[] = target;
			for (const key of keys) {
				if (typeof current !== 'object' || current === null || current[key as never] === undefined || typeof current[key as never] !== 'object') {
					current[key as never] = (/^\d+$/.test(key) ? [] : {}) as never;
				}
				current = current[key as never] as Record<string, unknown> | unknown[];
			}

			if (lastKey === '') {
				if (!Array.isArray(current)) return; // safety check
				current.push(value);
			} else if (Array.isArray(current)) {
				const index = parseInt(lastKey, 10);
				current[index] = value;
			} else if (current[lastKey] !== undefined) {
				if (Array.isArray(current[lastKey])) {
					(current[lastKey] as unknown[]).push(value);
				} else {
					current[lastKey] = [current[lastKey], value];
				}
			} else {
				current[lastKey] = value;
			}
		};

		for (const [key, value] of formData.entries()) {
			const keys = key.split(/[\[\]]+/).filter((k) => k !== '');
			assignNestedValue(obj, keys, value);
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
				throw new Error('Циклическая ссылка обнаружена при сериализации объекта');
			}
			seen.add(obj);
		}

		if (obj instanceof Date) {
			form.append(namespace!, obj.toISOString());
		} else if (obj instanceof Blob) {
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
