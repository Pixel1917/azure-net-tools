type DateFragments = {
	day: string;
	month: string;
	year: number;
	hours: string;
	minutes: string;
	seconds: string;
};

type CalendarDate = {
	year: number;
	month: number;
	day: number;
};

type ParsedDateInput = {
	date: Date;
	calendar?: CalendarDate;
};

type LocaleData = {
	months: readonly string[];
	atWord: string;
};

export type DateInput = string | Date;

export type DateUtilSettings = {
	utc?: boolean;
	locale?: string;
	timeZone?: string;
};

type SettingsInput = DateUtilSettings | boolean;

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_TIME_RE = /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(Z|[+-]\d{2}:\d{2})?$/;
const EMPTY_FRAGMENTS: DateFragments = { day: '', month: '', year: 0, hours: '', minutes: '', seconds: '' };
const formatterCache = new Map<string, Intl.DateTimeFormat>();
const localeMonthsCache = new Map<string, readonly string[]>();

/**
 * Utility class for strict date parsing, comparison, formatting and localization.
 */
export class DateUtil {
	private static readonly DEFAULT_LOCALES = {
		ru: {
			months: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
			atWord: 'в'
		},
		en: {
			months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
			atWord: 'at'
		},
		es: {
			months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
			atWord: 'a las'
		},
		fr: {
			months: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
			atWord: 'à'
		},
		de: {
			months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
			atWord: 'um'
		},
		it: {
			months: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
			atWord: 'alle'
		},
		pt: {
			months: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
			atWord: 'às'
		},
		ja: {
			months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
			atWord: 'に'
		},
		ko: {
			months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
			atWord: '에'
		},
		zh: {
			months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
			atWord: '在'
		}
	} as const satisfies Record<string, LocaleData>;

	private static readonly FALLBACK_AT_WORD_BY_LANG: Record<string, string> = {
		ru: 'в',
		en: 'at',
		es: 'a las',
		fr: 'à',
		de: 'um',
		it: 'alle',
		pt: 'às',
		ja: 'に',
		ko: '에',
		zh: '在'
	};

	private static _localeResolver?: () => string;

	static get locale(): string {
		return this.resolveLocale();
	}

	static setLocale(localeResolver: () => string): void {
		this._localeResolver = localeResolver;
	}

	static clearLocaleResolver(): void {
		this._localeResolver = undefined;
	}

	static now(): Date {
		return new Date();
	}

	static fromTimestamp(timestamp: number): Date {
		return new Date(timestamp);
	}

	static pad(value: number | string): string {
		return String(value).padStart(2, '0');
	}

	static isDate(date: DateInput): boolean {
		return this.parseDateInput(date) !== null;
	}

	static compare(left: DateInput, right: DateInput): -1 | 0 | 1 | null {
		const leftDate = this.parseDateInput(left)?.date;
		const rightDate = this.parseDateInput(right)?.date;
		if (!leftDate || !rightDate) return null;

		const difference = leftDate.getTime() - rightDate.getTime();
		return difference === 0 ? 0 : difference < 0 ? -1 : 1;
	}

	static isBefore(date: DateInput, comparison: DateInput): boolean {
		return this.compare(date, comparison) === -1;
	}

	static isAfter(date: DateInput, comparison: DateInput): boolean {
		return this.compare(date, comparison) === 1;
	}

	static isSame(date: DateInput, comparison: DateInput): boolean {
		return this.compare(date, comparison) === 0;
	}

	static isBetween(date: DateInput, start: DateInput, end: DateInput, inclusive = true): boolean {
		const parsedDate = this.parseDateInput(date)?.date.getTime();
		const parsedStart = this.parseDateInput(start)?.date.getTime();
		const parsedEnd = this.parseDateInput(end)?.date.getTime();
		if (parsedDate === undefined || parsedStart === undefined || parsedEnd === undefined) return false;

		const min = Math.min(parsedStart, parsedEnd);
		const max = Math.max(parsedStart, parsedEnd);
		return inclusive ? parsedDate >= min && parsedDate <= max : parsedDate > min && parsedDate < max;
	}

	static isPast(date: DateInput, now: DateInput = new Date()): boolean {
		return this.isBefore(date, now);
	}

	static isFuture(date: DateInput, now: DateInput = new Date()): boolean {
		return this.isAfter(date, now);
	}

	static getDateParts(date: DateInput, settings?: SettingsInput): DateFragments {
		return this.getDatePartsInternal(date, settings) ?? { ...EMPTY_FRAGMENTS };
	}

	static toDateTime(date: DateInput, settings?: SettingsInput): string {
		const parts = this.getDatePartsInternal(date, settings);
		return parts ? `${parts.day}.${parts.month}.${parts.year} ${parts.hours}:${parts.minutes}` : '';
	}

	static toDate(date: DateInput, settings?: SettingsInput): string {
		const parts = this.getDatePartsInternal(date, settings);
		return parts ? `${parts.day}.${parts.month}.${parts.year}` : '';
	}

	static toTime(date: DateInput, settings?: SettingsInput): string {
		const parts = this.getDatePartsInternal(date, settings);
		return parts ? `${parts.hours}:${parts.minutes}` : '';
	}

	static toDayMonth(date: DateInput, settings?: SettingsInput): string {
		const normalized = this.normalizeSettings(settings);
		const parts = this.getDatePartsInternal(date, normalized);
		if (!parts) return '';

		const month = this.resolveLocaleData(normalized.locale).months[Number(parts.month) - 1] ?? '';
		return `${Number(parts.day)} ${month}`;
	}

	static toDayMonthTime(date: DateInput, settings?: SettingsInput): string {
		const normalized = this.normalizeSettings(settings);
		const parts = this.getDatePartsInternal(date, normalized);
		if (!parts) return '';

		const localeData = this.resolveLocaleData(normalized.locale);
		const month = localeData.months[Number(parts.month) - 1] ?? '';
		return `${Number(parts.day)} ${month} ${localeData.atWord} ${parts.hours}:${parts.minutes}`;
	}

	static toFullDateTimeNoTZ(date: DateInput, settings?: SettingsInput): string {
		const parts = this.getDatePartsInternal(date, settings);
		return parts ? `${parts.year}-${parts.month}-${parts.day} ${parts.hours}:${parts.minutes}:${parts.seconds}` : '';
	}

	static toFormat(date: DateInput, pattern: string, settings?: SettingsInput): string {
		const normalized = this.normalizeSettings(settings);
		const parts = this.getDatePartsInternal(date, normalized);
		if (!parts) return '';

		const localeData = this.resolveLocaleData(normalized.locale);
		const replacements = {
			yyyy: String(parts.year),
			yy: String(parts.year).slice(-2),
			MM: localeData.months[Number(parts.month) - 1] ?? '',
			mm: parts.month,
			dd: parts.day,
			d: String(Number(parts.day)),
			HH: parts.hours,
			ii: parts.minutes,
			ss: parts.seconds
		} satisfies Record<string, string>;

		return pattern.replace(/yyyy|yy|MM|mm|dd|d|HH|ii|ss/g, (match) => replacements[match as keyof typeof replacements]);
	}

	private static getDatePartsInternal(date: DateInput, settings?: SettingsInput): DateFragments | null {
		const parsed = this.parseDateInput(date);
		if (!parsed) return null;

		if (parsed.calendar) {
			return {
				day: this.pad(parsed.calendar.day),
				month: this.pad(parsed.calendar.month),
				year: parsed.calendar.year,
				hours: '00',
				minutes: '00',
				seconds: '00'
			};
		}

		const normalized = this.normalizeSettings(settings);
		if (normalized.timeZone && !normalized.utc) {
			return this.getDatePartsForTimeZone(parsed.date, normalized.timeZone);
		}

		const source = parsed.date;
		return {
			day: this.pad(normalized.utc ? source.getUTCDate() : source.getDate()),
			month: this.pad((normalized.utc ? source.getUTCMonth() : source.getMonth()) + 1),
			year: normalized.utc ? source.getUTCFullYear() : source.getFullYear(),
			hours: this.pad(normalized.utc ? source.getUTCHours() : source.getHours()),
			minutes: this.pad(normalized.utc ? source.getUTCMinutes() : source.getMinutes()),
			seconds: this.pad(normalized.utc ? source.getUTCSeconds() : source.getSeconds())
		};
	}

	private static normalizeSettings(settings?: SettingsInput): Required<DateUtilSettings> {
		if (typeof settings === 'boolean') {
			return { utc: settings, locale: this.resolveLocale(), timeZone: '' };
		}

		return {
			utc: settings?.utc ?? false,
			locale: settings?.locale ?? this.resolveLocale(),
			timeZone: settings?.timeZone ?? ''
		};
	}

	private static resolveLocale(): string {
		const resolverLocale = this._localeResolver?.();
		return typeof resolverLocale === 'string' && resolverLocale.trim().length ? resolverLocale : 'en';
	}

	private static resolveLocaleData(locale: string): LocaleData {
		const lang = this.normalizeLanguage(locale);
		const predefined = this.DEFAULT_LOCALES[lang as keyof typeof this.DEFAULT_LOCALES];
		if (predefined) return predefined;

		return {
			months: this.buildMonthsViaIntl(locale),
			atWord: this.FALLBACK_AT_WORD_BY_LANG[lang] ?? 'at'
		};
	}

	private static buildMonthsViaIntl(locale: string): readonly string[] {
		const cacheKey = locale.toLowerCase();
		const cached = localeMonthsCache.get(cacheKey);
		if (cached) return cached;

		const formatter = this.getFormatter(`months:${cacheKey}`, locale, { month: 'long', timeZone: 'UTC' });
		const months = Object.freeze(Array.from({ length: 12 }, (_, monthIndex) => formatter.format(new Date(Date.UTC(2024, monthIndex, 1)))));
		localeMonthsCache.set(cacheKey, months);
		return months;
	}

	private static normalizeLanguage(locale: string): string {
		return locale.toLowerCase().split('-')[0] || 'en';
	}

	private static getFormatter(key: string, locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
		const cached = formatterCache.get(key);
		if (cached) return cached;

		let formatter: Intl.DateTimeFormat;
		try {
			formatter = new Intl.DateTimeFormat(locale, options);
		} catch {
			formatter = new Intl.DateTimeFormat('en', options);
		}
		formatterCache.set(key, formatter);
		return formatter;
	}

	private static getDatePartsForTimeZone(date: Date, timeZone: string): DateFragments {
		const formatter = this.getFormatter(`parts:${timeZone}`, 'en-CA', {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hourCycle: 'h23'
		});

		const result = { ...EMPTY_FRAGMENTS };
		for (const part of formatter.formatToParts(date)) {
			switch (part.type) {
				case 'day':
					result.day = part.value;
					break;
				case 'month':
					result.month = part.value;
					break;
				case 'year':
					result.year = Number(part.value);
					break;
				case 'hour':
					result.hours = part.value;
					break;
				case 'minute':
					result.minutes = part.value;
					break;
				case 'second':
					result.seconds = part.value;
			}
		}

		return result;
	}

	private static isValidCalendarDate(year: number, month: number, day: number): boolean {
		if (!Number.isInteger(year) || year < 0 || year > 9999 || month < 1 || month > 12 || day < 1) return false;
		const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
		const daysByMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		return day <= (daysByMonth[month - 1] ?? 0);
	}

	private static parseDateInput(input: DateInput): ParsedDateInput | null {
		if (input instanceof Date) {
			return Number.isNaN(input.getTime()) ? null : { date: new Date(input.getTime()) };
		}

		const raw = input.trim();
		if (!raw) return null;

		const dateOnlyMatch = raw.match(ISO_DATE_RE);
		if (dateOnlyMatch) {
			const year = Number(dateOnlyMatch[1]);
			const month = Number(dateOnlyMatch[2]);
			const day = Number(dateOnlyMatch[3]);
			if (!this.isValidCalendarDate(year, month, day)) return null;
			const calendarDate = new Date(0);
			calendarDate.setHours(0, 0, 0, 0);
			calendarDate.setFullYear(year, month - 1, day);
			return { date: calendarDate, calendar: { year, month, day } };
		}

		const dateTimeMatch = raw.match(ISO_DATE_TIME_RE);
		if (!dateTimeMatch) return null;

		const year = Number(dateTimeMatch[1]);
		const month = Number(dateTimeMatch[2]);
		const day = Number(dateTimeMatch[3]);
		const hours = Number(dateTimeMatch[4]);
		const minutes = Number(dateTimeMatch[5]);
		const seconds = Number(dateTimeMatch[6] ?? 0);
		const milliseconds = Number((dateTimeMatch[7] ?? '').slice(0, 3).padEnd(3, '0'));
		const zone = dateTimeMatch[8];

		if (!this.isValidCalendarDate(year, month, day) || hours > 23 || minutes > 59 || seconds > 59) return null;
		if (zone && zone !== 'Z') {
			const [offsetHours, offsetMinutes] = zone.slice(1).split(':').map(Number);
			if (offsetHours === undefined || offsetMinutes === undefined || offsetHours > 23 || offsetMinutes > 59) return null;
		}

		const parsed = new Date(0);
		if (!zone) {
			parsed.setHours(hours, minutes, seconds, milliseconds);
			parsed.setFullYear(year, month - 1, day);
			return { date: parsed };
		}

		parsed.setUTCHours(hours, minutes, seconds, milliseconds);
		parsed.setUTCFullYear(year, month - 1, day);
		if (zone !== 'Z') {
			const [offsetHours = 0, offsetMinutes = 0] = zone.slice(1).split(':').map(Number);
			const direction = zone[0] === '+' ? -1 : 1;
			parsed.setTime(parsed.getTime() + direction * (offsetHours * 60 + offsetMinutes) * 60_000);
		}

		return { date: parsed };
	}
}
