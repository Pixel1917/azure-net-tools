/**
 * Unique id generator
 */
export class UidGenerator {
	private static readonly ALPHANUMERIC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	private static readonly URL_SAFE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
	private static readonly HEX = '0123456789abcdef';

	private static counter = 0;

	/**
	 * Generates unique string
	 * @param length - string length (16 by default)
	 * @param alphabet - symbols alphabet
	 * @returns unique string
	 */
	static generateUniqueString(length: number = 16, alphabet: string = UidGenerator.ALPHANUMERIC): string {
		const chars: string[] = [];
		const randomValues = new Uint8Array(length);

		if (typeof globalThis.crypto !== 'undefined') {
			globalThis.crypto.getRandomValues(randomValues);
		} else {
			try {
				const crypto = eval('require')('crypto');
				crypto.randomFillSync(randomValues);
			} catch {
				for (let i = 0; i < length; i++) {
					randomValues[i] = Math.floor(Math.random() * 256);
				}
			}
		}

		for (let i = 0; i < length; i++) {
			const randomValue = randomValues[i];
			if (Number.isInteger(randomValue) && randomValue !== undefined) {
				const alphabetValue = alphabet[randomValue % alphabet.length];
				if (alphabetValue) {
					chars.push(alphabetValue);
				}
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
		const range = max - min;
		const bytesNeeded = Math.ceil(Math.log2(range) / 8);
		const randomBytes = new Uint8Array(bytesNeeded);

		if (typeof globalThis.crypto !== 'undefined') {
			globalThis.crypto.getRandomValues(randomBytes);
		} else {
			try {
				const crypto = eval('require')('crypto');
				crypto.randomFillSync(randomBytes);
			} catch {
				for (let i = 0; i < bytesNeeded; i++) {
					randomBytes[i] = Math.floor(Math.random() * 256);
				}
			}
		}

		let randomNumber = 0;
		for (let i = 0; i < bytesNeeded; i++) {
			const randomBytesValue = randomBytes[i];
			if (Number.isInteger(randomBytesValue) && randomBytesValue !== undefined) {
				randomNumber = (randomNumber << 8) | randomBytesValue;
			}
		}

		return min + (randomNumber % (range + 1));
	}

	/**
	 * Generates UUID v4
	 * @returns UUID string. Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
	 */
	static generateUuid(): string {
		if (typeof globalThis.crypto?.randomUUID === 'function') {
			return globalThis.crypto.randomUUID();
		}

		const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
		return template.replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
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
		const counter = (++UidGenerator.counter).toString(36);

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
