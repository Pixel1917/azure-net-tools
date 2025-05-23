/**
 * Utility class for common text operations such as pluralization, truncation, and more.
 */
export class TextUtil {
	/**
	 * Returns the correct plural form from an array of word forms based on the given number.
	 *
	 * For languages like Russian, array should have 3 forms:
	 *   - titles[0]: singular (1)
	 *   - titles[1]: few (2,3,4)
	 *   - titles[2]: many (0,5-20)
	 *
	 * For languages like English, array should have 2 forms:
	 *   - titles[0]: singular (1)
	 *   - titles[1]: plural (everything else)
	 *
	 * @param {number} num - The number to base the pluralization on.
	 * @param {string[]} titles - Array of word forms (2 or 3 elements).
	 * @returns {string} The correct plural form according to the number.
	 * @throws {Error} Throws if titles array length is not 2 or 3.
	 *
	 * @example
	 * PluralUtil.formatText(1, ['apple', 'apples']); // 'apple'
	 * PluralUtil.formatText(2, ['apple', 'apples']); // 'apples'
	 * PluralUtil.formatText(1, ['яблоко', 'яблока', 'яблок']); // 'яблоко'
	 * PluralUtil.formatText(5, ['яблоко', 'яблока', 'яблок']); // 'яблок'
	 */
	public static pluralize(num: number, titles: string[]): string {
		if (titles.length !== 2 && titles.length !== 3) {
			throw new Error('Titles array must have 2 or 3 elements');
		}

		const number = Math.abs(num);

		if (titles.length === 2) {
			// English-like pluralization (singular/plural)
			return number === 1 ? titles[0] : titles[1];
		} else {
			// Russian-like pluralization with 3 forms
			const cases = [2, 0, 1, 1, 1, 2];
			if (number % 100 > 4 && number % 100 < 20) {
				return titles[2];
			}
			return titles[cases[number % 10 < 5 ? number % 10 : 5]];
		}
	}

	/**
	 * Truncates a string to a specified maximum length, adding ellipsis if truncated.
	 *
	 * @param text - The input string to truncate.
	 * @param maxLength - Maximum allowed length of the string.
	 * @param ellipsis - Optional ellipsis string to append (default: '...').
	 * @returns Truncated string with ellipsis if needed.
	 */
	public static truncate(text: string, maxLength: number, ellipsis = '...'): string {
		if (text.length <= maxLength) return text;
		return text.slice(0, maxLength) + ellipsis;
	}

	/**
	 * Capitalizes the first character of the given string.
	 *
	 * @param text - The input string.
	 * @returns The string with the first character capitalized.
	 */
	public static capitalize(text: string): string {
		if (!text) return '';
		return text.charAt(0).toUpperCase() + text.slice(1);
	}

	/**
	 * Converts the first character of the given string to lowercase.
	 *
	 * @param text - The input string.
	 * @returns The string with the first character in lowercase.
	 */
	public static decapitalize(text: string): string {
		if (!text) return '';
		return text.charAt(0).toLowerCase() + text.slice(1);
	}

	/**
	 * Checks if a string is empty or consists only of whitespace characters.
	 *
	 * @param text - The input string.
	 * @returns True if string is empty or whitespace only, false otherwise.
	 */
	public static isEmptyOrWhitespace(text: string): boolean {
		return !text || text.trim().length === 0;
	}
}
