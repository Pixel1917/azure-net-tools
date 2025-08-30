/**
 * A utility class for working with JavaScript objects.
 */
export class ObjectUtil {
	static toKeyValueArray<T extends object, D = keyof T>(object: T, ObjectKeyAToNumber: boolean = false) {
		return Object.entries(object).map(([key, value]) => ({ key: ObjectKeyAToNumber ? Number(key) : key, value }) as { key: D; value: T[keyof T] });
	}
	/**
	 * Creates a shallow copy of the given object.
	 * @param obj - The object to clone.
	 * @returns A shallow copy of the object.
	 */
	static clone<T>(obj: T): T {
		return { ...obj };
	}

	/**
	 * Creates a deep copy of the given object.
	 * @param obj - The object to deep clone.
	 * @param structured - Whether to use `structuredClone` (true) or `JSON.stringify`/`parse` (false).
	 * @returns A deep copy of the object.
	 * @throws If deep cloning fails.
	 */
	static deepClone<T>(obj: T, structured = false): T {
		try {
			return structured ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
		} catch {
			throw new Error('deep clone failed');
		}
	}

	/**
	 * Compares two values by their JSON string representation.
	 * @param obj1 - First value to compare.
	 * @param obj2 - Second value to compare.
	 * @returns `true` if both values have the same JSON string, `false` otherwise.
	 */
	static compareAsString(obj1: unknown, obj2: unknown): boolean {
		return JSON.stringify(obj1) === JSON.stringify(obj2);
	}

	/**
	 * Counts the number of own enumerable properties of an object.
	 * @param obj - The object to inspect.
	 * @returns The number of own properties.
	 */
	static countProps(obj: unknown): number {
		let count = 0;
		for (const k in obj as object) {
			if (k in (obj as object)) {
				count++;
			}
		}
		return count;
	}

	/**
	 * Deeply compares two values for equality.
	 * Functions are compared by their string representation.
	 * @param v1 - First value.
	 * @param v2 - Second value.
	 * @returns `true` if equal, `false` otherwise.
	 */
	static equals(v1: unknown, v2: unknown): boolean {
		if (typeof v1 !== typeof v2) {
			return false;
		}
		if (typeof v1 === 'function' && typeof v2 === 'function') {
			return v1.toString() === v2.toString();
		}
		if (v1 instanceof Object && v2 instanceof Object) {
			if (this.countProps(v1) !== this.countProps(v2)) {
				return false;
			}
			let r = true;
			for (const k in v1) {
				r = this.equals(v1[k as never], v2[k as never]);
				if (!r) {
					return false;
				}
			}
			return true;
		} else {
			return v1 === v2;
		}
	}

	/**
	 * Checks if all keys in an object (including nested objects) are `null` or `undefined`.
	 * @param obj - The object to check.
	 * @returns `true` if all keys are empty, `false` otherwise.
	 */
	static isAllKeysEmpty(obj: unknown): boolean {
		if (obj === null || obj === undefined) {
			return true;
		}
		if (typeof obj !== 'object') {
			return false;
		}
		for (const key in obj as object) {
			if (key in (obj as object)) {
				const value = (obj as Record<string, unknown>)[key];
				if (typeof value === 'object' && value !== null) {
					if (!this.isAllKeysEmpty(value)) {
						return false;
					}
				} else if (value !== null && value !== undefined) {
					return false;
				}
			}
		}
		return true;
	}

	/**
	 * Checks if the given object has no own properties.
	 * @param obj - The object to check.
	 * @returns `true` if object is empty, `false` otherwise.
	 */
	static isObjectEmpty(obj: unknown): boolean {
		if (obj === null || typeof obj !== 'object') {
			return true;
		}
		for (const key in obj as object) {
			if (key in (obj as object)) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Converts an object into a syntax-highlighted HTML string.
	 * @param obj - The object to render.
	 * @returns HTML string with syntax highlighting for JSON.
	 */
	static renderAsString(obj: unknown): string {
		try {
			return JSON.stringify(obj, null, 2)
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match) => {
					let cls = 'number';
					if (/^"/.test(match)) {
						if (/:$/.test(match)) {
							cls = 'key';
						} else {
							cls = 'string';
						}
					} else if (/true|false/.test(match)) {
						cls = 'boolean';
					} else if (/null/.test(match)) {
						cls = 'null';
					}
					return `<span class="${cls}">${match}</span>`;
				});
		} catch {
			return '';
		}
	}
}
