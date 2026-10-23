type UnionToIntersection<U> = (U extends unknown ? (arg: U) => void : never) extends (arg: infer I) => void ? I : never;

type LastOf<U> = UnionToIntersection<U extends unknown ? () => U : never> extends () => infer R ? R : never;

type UnionToTuple<U, Last = LastOf<U>> = [U] extends [never] ? [] : [...UnionToTuple<Exclude<U, Last>>, Last];

type EnumLength<E> = UnionToTuple<Extract<keyof E, string>> extends infer T extends unknown[] ? T['length'] : never;

type TupleOf<N extends number, T, R extends T[] = []> = R['length'] extends N ? R : TupleOf<N, T, [...R, T]>;

type ObjectEntry<T extends object, K = Extract<keyof T, string>> = {
	key: K;
	value: T[keyof T];
};

export class EnumUtil {
	private static getEntries(enumeration: Record<string, string | number>) {
		return Object.entries(enumeration).filter(
			([key, value]) => !(typeof value === 'string' && Object.hasOwn(enumeration, value) && enumeration[value] === Number(key))
		);
	}

	static associateByIndex<const E extends Record<string, string | number>>(
		enumeration: E,
		...values: TupleOf<EnumLength<E>, string>
	): Record<E[Extract<keyof E, string>], string> {
		const entries = this.getEntries(enumeration);
		const associations: readonly string[] = values as readonly string[];

		if (entries.length !== associations.length) {
			throw new RangeError('Enum values count mismatch');
		}

		return Object.fromEntries(entries.map(([, value], index) => [value, associations[index]])) as Record<E[Extract<keyof E, string>], string>;
	}

	static associateByKey<const T extends Record<string, string | number>, const A extends { [K in keyof T]: unknown }>(
		enumeration: T,
		associations: A
	): Record<T[keyof T], A[keyof T]> {
		return Object.fromEntries(this.getEntries(enumeration).map(([key, value]) => [value, associations[key as keyof T]])) as Record<
			T[keyof T],
			A[keyof T]
		>;
	}

	static toEntries<const T extends object>(object: T): ObjectEntry<T>[];

	static toEntries<const T extends object, K>(
		object: T,
		options: {
			mapKey: (key: Extract<keyof T, string>, value: T[keyof T]) => K;
		}
	): ObjectEntry<T, K>[];

	static toEntries<T extends object, K>(
		object: T,
		options?: {
			mapKey?: (key: Extract<keyof T, string>, value: T[keyof T]) => K;
		}
	): ObjectEntry<T, Extract<keyof T, string> | K>[] {
		return Object.entries(object).map(([key, value]) => {
			const typedKey = key as Extract<keyof T, string>;
			const typedValue = value as T[keyof T];

			return {
				key: options?.mapKey ? options.mapKey(typedKey, typedValue) : typedKey,
				value: typedValue
			};
		});
	}
}
