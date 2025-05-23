type DateFragments = {
	day: string;
	month: string;
	year: number;
	hours: string;
	minutes: string;
	seconds: string;
};

type LocaleData = {
	months: string[];
	// You can extend this with weekdays, formats, etc.
};

const DEFAULT_LOCALES: Record<string, LocaleData> = {
	ru: {
		months: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
	},
	en: {
		months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
	}
};

/**
 * Utility class for date formatting and localization.
 *
 * Supports setting a global locale for all formatting methods.
 * Provides methods to format dates and times in different styles.
 */
export class DateUtil {
	/**
	 * Current locale code, default is 'ru'.
	 */
	private static _locale: string = 'ru';

	/**
	 * Optional custom locale data to override default translations.
	 */
	private static _customLocaleData?: LocaleData;

	/**
	 * Gets the current locale code.
	 */
	static get locale(): string {
		return this._locale;
	}

	/**
	 * Sets the current locale and optionally custom locale data.
	 *
	 * @param {string} locale - Locale code (e.g., 'ru', 'en').
	 * @param {LocaleData} [customLocaleData] - Optional custom translations for months, etc.
	 */
	static setLocale(locale: string, customLocaleData?: LocaleData): void {
		this._locale = locale;
		this._customLocaleData = customLocaleData;
	}

	/**
	 * Retrieves the locale data for the current locale.
	 * Falls back to default Russian locale if locale not found.
	 *
	 * @returns {LocaleData} - The locale data object containing translations.
	 */
	static get localeData(): LocaleData {
		return this._customLocaleData ?? DEFAULT_LOCALES[this._locale] ?? DEFAULT_LOCALES['ru'];
	}

	/**
	 * Pads a number or string with leading zero if necessary.
	 *
	 * @param {number | string} value - The value to pad.
	 * @returns {string} - Padded string, always at least 2 characters long.
	 *
	 * @example
	 * DateUtil.pad(5)  // "05"
	 * DateUtil.pad('9')  // "09"
	 */
	static pad(value: number | string): string {
		return ('0' + value).slice(-2);
	}

	/**
	 * Checks if the provided date is valid.
	 *
	 * @param {string | Date} date - Date object or date string.
	 * @returns {boolean} - True if valid date, false otherwise.
	 *
	 * @example
	 * DateUtil.isValidDate('2024-05-23') // true
	 * DateUtil.isValidDate('invalid-date') // false
	 */
	private static isValidDate(date: string | Date): boolean {
		const d = date instanceof Date ? date : new Date(date);
		return !isNaN(d.getTime());
	}

	/**
	 * Extracts individual date and time components from a date.
	 * Returns day, month, year, hours, minutes, seconds as strings (zero-padded).
	 *
	 * @param {string | Date} date - Date object or ISO date string.
	 * @param {boolean} [utc=false] - Whether to use UTC methods instead of local time.
	 * @returns {DateFragments} - Object containing date and time parts.
	 *
	 * @example
	 * DateUtil.getDateParts('2024-05-23T15:30:00Z')
	 * // { day: "23", month: "05", year: 2024, hours: "15", minutes: "30", seconds: "00" }
	 */
	static getDateParts(date: string | Date, utc: boolean = false): DateFragments {
		const d = date instanceof Date ? date : new Date(date);

		const day = this.pad(utc ? d.getUTCDate() : d.getDate());
		const month = this.pad((utc ? d.getUTCMonth() : d.getMonth()) + 1);
		const year = utc ? d.getUTCFullYear() : d.getFullYear();
		const hours = this.pad(utc ? d.getUTCHours() : d.getHours());
		const minutes = this.pad(utc ? d.getUTCMinutes() : d.getMinutes());
		const seconds = this.pad(utc ? d.getUTCSeconds() : d.getSeconds());

		return { day, month, year, hours, minutes, seconds };
	}

	/**
	 * Formats a date/time as "DD.MM.YYYY HH:mm".
	 *
	 * @param {string | Date} date - Date object or ISO date string.
	 * @param {boolean} [utc=false] - Use UTC time if true, local time if false.
	 * @returns {string} - Formatted date-time string or empty string if invalid.
	 *
	 * @example
	 * DateUtil.toDateTime('2024-05-23T15:30:00') // "23.05.2024 15:30"
	 */
	static toDateTime(date: string | Date, utc: boolean = false): string {
		if (!this.isValidDate(date)) return '';
		const { day, month, year, hours, minutes } = this.getDateParts(date, utc);
		return `${day}.${month}.${year} ${hours}:${minutes}`;
	}

	/**
	 * Formats a date as "DD.MM.YYYY".
	 *
	 * @param {string | Date} date - Date object or ISO date string.
	 * @param {boolean} [utc=false] - Use UTC time if true, local time if false.
	 * @returns {string} - Formatted date string or empty string if invalid.
	 *
	 * @example
	 * DateUtil.toDate('2024-05-23') // "23.05.2024"
	 */
	static toDate(date: string | Date, utc: boolean = false): string {
		if (!this.isValidDate(date)) return '';
		const { day, month, year } = this.getDateParts(date, utc);
		return `${day}.${month}.${year}`;
	}

	/**
	 * Formats a time as "HH:mm".
	 *
	 * @param {string | Date} date - Date object or ISO date string.
	 * @param {boolean} [utc=false] - Use UTC time if true, local time if false.
	 * @returns {string} - Formatted time string or empty string if invalid.
	 *
	 * @example
	 * DateUtil.toTime('2024-05-23T15:30:00') // "15:30"
	 */
	static toTime(date: string | Date, utc: boolean = false): string {
		if (!this.isValidDate(date)) return '';
		const { hours, minutes } = this.getDateParts(date, utc);
		return `${hours}:${minutes}`;
	}

	/**
	 * Formats a date as "DD month" using the current locale's month names.
	 *
	 * @param {string | Date} date - Date object or ISO date string.
	 * @returns {string} - Formatted string like "15 августа" or "15 May", or empty string if invalid.
	 *
	 * @example
	 * DateUtil.toDayMonth('2024-08-15') // "15 августа" (if locale is 'ru')
	 */
	static toDayMonth(date: string | Date): string {
		const d = date instanceof Date ? date : new Date(date);
		if (!this.isValidDate(d)) return '';

		const day = d.getDate();
		const month = this.localeData.months[d.getMonth()] || '';

		return `${day} ${month}`;
	}

	/**
	 * Formats a date and time as "DD month в HH:mm" using current locale's month names.
	 *
	 * @param {string | Date} date - Date object or ISO date string.
	 * @returns {string} - Formatted string like "15 августа в 15:00" or "15 May at 15:00", or empty string if invalid.
	 *
	 * @example
	 * DateUtil.toDayMonthTime('2024-08-15T15:00:00') // "15 августа в 15:00" (if locale is 'ru')
	 */
	static toDayMonthTime(date: string | Date): string {
		const d = date instanceof Date ? date : new Date(date);
		if (!this.isValidDate(d)) return '';

		const day = d.getDate();
		const month = this.localeData.months[d.getMonth()] || '';
		const hours = this.pad(d.getHours());
		const minutes = this.pad(d.getMinutes());

		return `${day} ${month} в ${hours}:${minutes}`;
	}

	/**
	 * Formats a date as "YYYY-MM-DD HH:mm:ss" without the timezone 'T' character.
	 *
	 * @param {string | Date} date - Date object or ISO date string.
	 * @param {boolean} [utc=false] - Use UTC time if true, local time if false.
	 * @returns {string} - Formatted string or empty string if invalid.
	 *
	 * @example
	 * DateUtil.toFullDateTimeNoTZ('2024-05-23T15:30:45Z') // "2024-05-23 15:30:45"
	 */
	static toFullDateTimeNoTZ(date: string | Date, utc: boolean = false): string {
		if (!this.isValidDate(date)) return '';
		const { day, month, year, hours, minutes, seconds } = this.getDateParts(date, utc);
		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	}

	/**
	 * Formats a date according to a custom pattern string.
	 * Supported tokens:
	 * - yyyy: full year (e.g., 2024)
	 * - yy: two-digit year (e.g., 24)
	 * - MM: localized month name (e.g., "января")
	 * - mm: month number with leading zero (01-12)
	 * - dd: day of month with leading zero (01-31)
	 * - d: day of month without leading zero (1-31)
	 * - HH: hours with leading zero (00-23)
	 * - ii: minutes with leading zero (00-59)
	 * - ss: seconds with leading zero (00-59)
	 *
	 * @param {string | Date} date - Date instance or ISO date string.
	 * @param {string} pattern - Format pattern string containing tokens.
	 * @param {boolean} [utc=false] - If true, use UTC time instead of local time.
	 * @returns {string} Formatted date string based on the pattern.
	 *
	 * @example
	 * DateUtil.toFormat(new Date('2024-12-22T15:30:00'), 'yyyy-MM-dd'); // "2024-12-22"
	 * DateUtil.toFormat('2024-09-12', 'dd.mm.yy'); // "12.09.24"
	 * DateUtil.toFormat('2025-01-12', 'dd MM yyyy'); // "12 января 2025"
	 * DateUtil.toFormat('2024-12-12T12:25:00', 'dd/mm/yy HH:ii'); // "12/12/24 12:25"
	 */
	static toFormat(date: string | Date, pattern: string, utc: boolean = false): string {
		if (!this.isValidDate(date)) return '';

		const d = date instanceof Date ? date : new Date(date);
		const yearFull = utc ? d.getUTCFullYear() : d.getFullYear();
		const yearShort = String(yearFull).slice(-2);
		const monthNum = utc ? d.getUTCMonth() : d.getMonth();
		const dayNum = utc ? d.getUTCDate() : d.getDate();
		const hoursNum = utc ? d.getUTCHours() : d.getHours();
		const minutesNum = utc ? d.getUTCMinutes() : d.getMinutes();
		const secondsNum = utc ? d.getUTCSeconds() : d.getSeconds();

		const months = this.localeData.months;

		const replacements: Record<string, string> = {
			yyyy: String(yearFull),
			yy: yearShort,
			MM: months[monthNum] || '',
			mm: this.pad(monthNum + 1),
			dd: this.pad(dayNum),
			d: String(dayNum),
			HH: this.pad(hoursNum),
			ii: this.pad(minutesNum),
			ss: this.pad(secondsNum)
		};

		return pattern.replace(/yyyy|yy|MM|mm|dd|d|HH|ii|ss/g, (match) => replacements[match]);
	}
}
