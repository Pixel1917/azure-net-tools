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
	 * Compares two values by their JSON string representation. (Fast unsafe compare)
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
		if (obj === null || typeof obj !== 'object') {
			return 0;
		}
		return Object.keys(obj).length;
	}

	/**
	 * Deeply compares two values for equality.
	 * Functions are compared by their string representation.
	 * @param a - First value.
	 * @param b - Second value.
	 * @returns `true` if equal, `false` otherwise.
	 */
	static equals(a: unknown, b: unknown): boolean {
		const visited = new WeakMap<object, object>();

		const eq = (left: unknown, right: unknown): boolean => {
			if (Object.is(left, right)) return true;

			if (typeof left !== typeof right) return false;
			if (left == null || right == null) return false;

			if (left instanceof Date && right instanceof Date) return left.getTime() === right.getTime();
			if (left instanceof RegExp && right instanceof RegExp) return left.source === right.source && left.flags === right.flags;

			if (typeof left !== 'object' || typeof right !== 'object') return false;

			const leftObj = left as object;
			const rightObj = right as object;

			const cached = visited.get(leftObj);
			if (cached) {
				return cached === rightObj;
			}
			visited.set(leftObj, rightObj);

			if (Array.isArray(leftObj) || Array.isArray(rightObj)) {
				if (!Array.isArray(leftObj) || !Array.isArray(rightObj)) return false;
				if (leftObj.length !== rightObj.length) return false;
				for (let i = 0; i < leftObj.length; i++) {
					if (!eq(leftObj[i], rightObj[i])) return false;
				}
				return true;
			}

			if (leftObj instanceof Map || rightObj instanceof Map) {
				if (!(leftObj instanceof Map) || !(rightObj instanceof Map)) return false;
				if (leftObj.size !== rightObj.size) return false;
				for (const [key, value] of leftObj) {
					if (!rightObj.has(key)) return false;
					if (!eq(value, rightObj.get(key))) return false;
				}
				return true;
			}

			if (leftObj instanceof Set || rightObj instanceof Set) {
				if (!(leftObj instanceof Set) || !(rightObj instanceof Set)) return false;
				if (leftObj.size !== rightObj.size) return false;
				for (const value of leftObj) {
					if (!rightObj.has(value)) return false;
				}
				return true;
			}

			if (Object.getPrototypeOf(leftObj) !== Object.getPrototypeOf(rightObj)) return false;

			const leftRecord = leftObj as Record<string, unknown>;
			const rightRecord = rightObj as Record<string, unknown>;

			const leftKeys = Object.keys(leftRecord);
			const rightKeys = Object.keys(rightRecord);
			if (leftKeys.length !== rightKeys.length) return false;

			for (const key of leftKeys) {
				if (!Object.prototype.hasOwnProperty.call(rightRecord, key)) return false;
				if (!eq(leftRecord[key], rightRecord[key])) return false;
			}
			return true;
		};

		return eq(a, b);
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

		for (const key of Object.keys(obj as Record<string, unknown>)) {
			const value = (obj as Record<string, unknown>)[key];
			if (typeof value === 'object' && value !== null) {
				if (!this.isAllKeysEmpty(value)) {
					return false;
				}
			} else if (value !== null && value !== undefined) {
				return false;
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
		return Object.keys(obj).length === 0;
	}

	/**
	 * Picks the given keys from the object. Return type is inferred as `Pick<T, K>`.
	 *
	 * @template T - Source object type.
	 * @template K - Keys to pick (must be keys of T).
	 * @param obj - The source object.
	 * @param keys - Array of keys to pick.
	 * @returns New object containing only the picked keys.
	 */
	static pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
		const result = {} as Pick<T, K>;
		for (const key of keys) {
			if (Object.prototype.hasOwnProperty.call(obj, key)) {
				(result as Record<K, T[K]>)[key] = obj[key];
			}
		}
		return result;
	}

	/**
	 * Omits the given keys from the object. Return type is inferred as `Omit<T, K>`.
	 *
	 * @template T - Source object type.
	 * @template K - Keys to omit (must be keys of T).
	 * @param obj - The source object.
	 * @param keys - Array of keys to omit.
	 * @returns New object without the omitted keys.
	 */
	static omit<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K> {
		const set = new Set(keys);
		const result = {} as Omit<T, K>;
		for (const key of Object.keys(obj) as (keyof T)[]) {
			if (!set.has(key as K)) {
				(result as unknown as Record<keyof T, T[keyof T]>)[key] = obj[key];
			}
		}
		return result;
	}

	/**
	 * Converts an object into a syntax-highlighted, pretty-printed HTML string.
	 * Output is wrapped in `<pre>` and `<code>` for block display and monospace. Use CSS classes
	 * `.object-util-json`, `.json-key`, `.json-string`, `.json-number`, `.json-boolean`, `.json-null`
	 * to style.
	 *
	 * @param obj - The object to render.
	 * @param options - Optional settings.
	 * @param options.wrap - If true (default), wrap output in `<pre class="object-util-render"><code class="object-util-json">`.
	 * @returns HTML string with syntax highlighting and indentation.
	 */
	static renderAsString(obj: unknown, options?: { wrap?: boolean }): string {
		const wrap = options?.wrap !== false;
		try {
			const raw = JSON.stringify(obj, null, 2);
			const escaped = raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			const highlighted = escaped.replace(
				/("(?:\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?/g,
				(match: string, quoted?: string, colon?: string, literal?: string) => {
					if (literal !== undefined) {
						return literal === 'null' ? '<span class="json-null">null</span>' : `<span class="json-boolean">${literal}</span>`;
					}
					if (quoted !== undefined) {
						const cls = colon !== undefined ? 'json-key' : 'json-string';
						return `<span class="${cls}">${quoted}</span>${colon ?? ''}`;
					}
					return `<span class="json-number">${match}</span>`;
				}
			);
			return wrap ? `<pre class="object-util-render"><code class="object-util-json">${highlighted}</code></pre>` : highlighted;
		} catch {
			return '';
		}
	}
}
