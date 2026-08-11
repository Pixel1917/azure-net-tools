/**
 * A utility class for working with JavaScript objects.
 */
export class ObjectUtil {
	static toEntries<T extends object>(object: T): Array<{ key: string; value: T[keyof T] }>;
	static toEntries<T extends object, K>(object: T, options: { mapKey: (key: string, value: T[keyof T]) => K }): Array<{ key: K; value: T[keyof T] }>;
	static toEntries<T extends object, K>(
		object: T,
		options?: { mapKey?: (key: string, value: T[keyof T]) => K }
	): Array<{ key: string | K; value: T[keyof T] }> {
		return Object.entries(object).map(([key, value]) => ({
			key: options?.mapKey ? options.mapKey(key, value as T[keyof T]) : key,
			value: value as T[keyof T]
		}));
	}

	/**
	 * Creates a shallow copy of the given object.
	 * @param obj - The object to clone.
	 * @returns A shallow copy of the object.
	 */
	static clone<T extends object>(obj: T): T {
		return (Array.isArray(obj) ? [...obj] : { ...obj }) as T;
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
	 * Functions are equal only when they reference the same function.
	 * @param a - First value.
	 * @param b - Second value.
	 * @returns `true` if equal, `false` otherwise.
	 */
	static equals(a: unknown, b: unknown): boolean {
		const leftVisited = new WeakMap<object, object>();
		const rightVisited = new WeakMap<object, object>();

		const eq = (left: unknown, right: unknown): boolean => {
			if (Object.is(left, right)) return true;

			if (typeof left !== typeof right) return false;
			if (left == null || right == null) return false;

			if (left instanceof Date && right instanceof Date) return left.getTime() === right.getTime();
			if (left instanceof RegExp && right instanceof RegExp) return left.source === right.source && left.flags === right.flags;

			if (typeof left !== 'object' || typeof right !== 'object') return false;

			const leftObj = left as object;
			const rightObj = right as object;

			const cachedRight = leftVisited.get(leftObj);
			if (cachedRight) return cachedRight === rightObj;
			const cachedLeft = rightVisited.get(rightObj);
			if (cachedLeft) return cachedLeft === leftObj;
			leftVisited.set(leftObj, rightObj);
			rightVisited.set(rightObj, leftObj);

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

			if (leftObj instanceof URL || rightObj instanceof URL) {
				return leftObj instanceof URL && rightObj instanceof URL && leftObj.href === rightObj.href;
			}

			if (leftObj instanceof Error || rightObj instanceof Error) {
				return (
					leftObj instanceof Error &&
					rightObj instanceof Error &&
					leftObj.name === rightObj.name &&
					leftObj.message === rightObj.message &&
					eq((leftObj as Error & { cause?: unknown }).cause, (rightObj as Error & { cause?: unknown }).cause)
				);
			}

			if (ArrayBuffer.isView(leftObj) || ArrayBuffer.isView(rightObj)) {
				if (!ArrayBuffer.isView(leftObj) || !ArrayBuffer.isView(rightObj) || leftObj.constructor !== rightObj.constructor) return false;
				const leftBytes = new Uint8Array(leftObj.buffer, leftObj.byteOffset, leftObj.byteLength);
				const rightBytes = new Uint8Array(rightObj.buffer, rightObj.byteOffset, rightObj.byteLength);
				if (leftBytes.length !== rightBytes.length) return false;
				for (let index = 0; index < leftBytes.length; index += 1) {
					if (leftBytes[index] !== rightBytes[index]) return false;
				}
				return true;
			}

			if (leftObj instanceof ArrayBuffer || rightObj instanceof ArrayBuffer) {
				if (!(leftObj instanceof ArrayBuffer) || !(rightObj instanceof ArrayBuffer) || leftObj.byteLength !== rightObj.byteLength) return false;
				const leftBytes = new Uint8Array(leftObj);
				const rightBytes = new Uint8Array(rightObj);
				for (let index = 0; index < leftBytes.length; index += 1) {
					if (leftBytes[index] !== rightBytes[index]) return false;
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
		const visited = new WeakSet<object>();
		const isEmpty = (value: unknown): boolean => {
			if (value === null || value === undefined) return true;
			if (typeof value !== 'object') return false;

			if (visited.has(value)) return true;
			visited.add(value);

			if (Array.isArray(value)) return value.every(isEmpty);
			if (value instanceof Map || value instanceof Set) return value.size === 0;
			if (value instanceof Date || value instanceof RegExp || value instanceof ArrayBuffer || ArrayBuffer.isView(value)) return false;

			return Object.keys(value).every((key) => isEmpty((value as Record<string, unknown>)[key]));
		};

		return isEmpty(obj);
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
}
