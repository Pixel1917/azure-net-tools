/**
 * Unique id generator
 */
export class UidGenerator {
	private static readonly ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	private static readonly URL_SAFE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
	private static readonly HEX = '0123456789abcdef';

	private static counter = 0;
	private static readonly MAX_RANDOM_BYTES = 65_536;
	private static readonly RANDOM_NUMBER_SPACE = 2 ** 53;

	private static fillRandomBytes(bytes: Uint8Array): void {
		if (typeof globalThis.crypto?.getRandomValues === 'function') {
			for (let offset = 0; offset < bytes.length; offset += this.MAX_RANDOM_BYTES) {
				globalThis.crypto.getRandomValues(bytes.subarray(offset, offset + this.MAX_RANDOM_BYTES));
			}
			return;
		}

		for (let i = 0; i < bytes.length; i++) {
			bytes[i] = Math.floor(Math.random() * 256);
		}
	}

	/**
	 * Generates unique string
	 * @param length - string length (16 by default)
	 * @param alphabet - symbols alphabet
	 * @returns unique string
	 */
	static generateUniqueString(length: number = 16, alphabet: string = UidGenerator.ALPHANUMERIC): string {
		if (!Number.isSafeInteger(length) || length < 0) {
			throw new RangeError('Length must be a non-negative safe integer');
		}
		if (alphabet.length === 0 || alphabet.length > 256) {
			throw new RangeError('Alphabet must contain between 1 and 256 symbols');
		}
		if (length === 0) return '';

		const chars: string[] = [];
		const acceptanceLimit = 256 - (256 % alphabet.length);

		while (chars.length < length) {
			const remaining = length - chars.length;
			const batchSize = Math.min(this.MAX_RANDOM_BYTES, Math.ceil((remaining * 256) / acceptanceLimit));
			const randomValues = new Uint8Array(batchSize);
			this.fillRandomBytes(randomValues);

			for (const randomValue of randomValues) {
				if (randomValue >= acceptanceLimit) continue;
				chars.push(alphabet[randomValue % alphabet.length]!);
				if (chars.length === length) break;
			}
		}

		return chars.join('');
	}

	/**
	 * Generates unique number
	 * @param min - min value (0 by default)
	 * @param max - max value (Number.MAX_SAFE_INTEGER by default)
	 * @returns unique number
	 */
	static generateUniqueNumber(min: number = 0, max: number = Number.MAX_SAFE_INTEGER): number {
		if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)) {
			throw new RangeError('Min and max must be safe integers');
		}
		if (max < min) throw new RangeError('Max must be greater than or equal to min');
		if (min === max) return min;

		const rangeSize = max - min + 1;
		if (!Number.isSafeInteger(rangeSize) && rangeSize !== this.RANDOM_NUMBER_SPACE) {
			throw new RangeError('Requested range is too large');
		}

		const acceptanceLimit = Math.floor(this.RANDOM_NUMBER_SPACE / rangeSize) * rangeSize;
		const bytes = new Uint8Array(7);
		let randomNumber: number;
		do {
			this.fillRandomBytes(bytes);
			randomNumber = bytes[0]! & 0x1f;
			for (let index = 1; index < bytes.length; index += 1) {
				randomNumber = randomNumber * 256 + bytes[index]!;
			}
		} while (randomNumber >= acceptanceLimit);

		return min + (randomNumber % rangeSize);
	}

	/**
	 * Generates UUID v4
	 * @returns UUID string. Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
	 */
	static generateUuid(): string {
		if (typeof globalThis.crypto?.randomUUID === 'function') {
			return globalThis.crypto.randomUUID();
		}

		const bytes = new Uint8Array(16);
		this.fillRandomBytes(bytes);
		bytes[6] = (bytes[6]! & 0x0f) | 0x40;
		bytes[8] = (bytes[8]! & 0x3f) | 0x80;
		const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
		return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
	}

	/**
	 * Generates url-safe ID (like NanoID)
	 * @param length - length (21 by default)
	 * @returns URL-safe id
	 */
	static generateNanoId(length: number = 21): string {
		return UidGenerator.generateUniqueString(length, UidGenerator.URL_SAFE);
	}

	/**
	 * Generates id by current timestamp
	 * @param prefix - prefix
	 * @param includeRandom - includes random part (for unique safety)
	 * @returns ID with timestamp
	 */
	static generateTimestampId(prefix: string = '', includeRandom: boolean = true): string {
		const timestamp = Date.now().toString(36);
		UidGenerator.counter = UidGenerator.counter >= Number.MAX_SAFE_INTEGER ? 1 : UidGenerator.counter + 1;
		const counter = UidGenerator.counter.toString(36);

		let id = prefix ? `${prefix}_${timestamp}` : timestamp;
		id += `_${counter}`;

		if (includeRandom) {
			const random = UidGenerator.generateUniqueString(6, UidGenerator.ALPHANUMERIC);
			id += `_${random}`;
		}

		return id;
	}

	/**
	 * Generates hash id
	 * @param length - length (32 by default)
	 * @returns hash-like string
	 */
	static generateHashId(length: number = 32): string {
		return UidGenerator.generateUniqueString(length, UidGenerator.HEX);
	}

	/**
	 * Checks that uuid is valid
	 * @param uuid - uuid string
	 * @returns boolean - is uuid valid or not
	 */
	static isValidUuid(uuid: string): boolean {
		const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
		return uuidRegex.test(uuid);
	}
}
