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
	atWord: string;
};

export type DateUtilSettings = {
	utc?: boolean;
	locale?: string;
	timeZone?: string;
};

type SettingsInput = DateUtilSettings | boolean;

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_TIME_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)$/;

/**
 * Utility class for date formatting and localization.
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
			months: ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'],
			atWord: 'a'
		},
		de: {
			months: ['Januar', 'Februar', 'Marz', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
			atWord: 'um'
		},
		it: {
			months: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
			atWord: 'alle'
		},
		pt: {
			months: ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
			atWord: 'as'
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
		fr: 'a',
		de: 'um',
		it: 'alle',
		pt: 'as',
		ja: 'に',
		ko: '에',
		zh: '在'
	};

	private static _defaultLocale: string = 'en';
	private static _localeResolver?: () => string;

	static get locale(): string {
		return this.resolveLocale();
	}

	static setLocale(localeResolver: () => string): void {
		this._localeResolver = localeResolver;
	}

	static setDefaultLocale(locale: string): void {
		this._defaultLocale = locale;
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
		return ('0' + value).slice(-2);
	}

	static isDate(date: string | Date): boolean {
		return this.parseDateInput(date) !== null;
	}

	static getDateParts(date: string | Date, settings?: SettingsInput): DateFragments {
		const parsedDate = this.parseDateInput(date);
		if (!parsedDate) {
			return { day: '', month: '', year: 0, hours: '', minutes: '', seconds: '' };
		}

		const normalized = this.normalizeSettings(settings);
		if (normalized.timeZone && !normalized.utc) {
			return this.getDatePartsForTimeZone(parsedDate, normalized.timeZone);
		}

		const day = this.pad(normalized.utc ? parsedDate.getUTCDate() : parsedDate.getDate());
		const month = this.pad((normalized.utc ? parsedDate.getUTCMonth() : parsedDate.getMonth()) + 1);
		const year = normalized.utc ? parsedDate.getUTCFullYear() : parsedDate.getFullYear();
		const hours = this.pad(normalized.utc ? parsedDate.getUTCHours() : parsedDate.getHours());
		const minutes = this.pad(normalized.utc ? parsedDate.getUTCMinutes() : parsedDate.getMinutes());
		const seconds = this.pad(normalized.utc ? parsedDate.getUTCSeconds() : parsedDate.getSeconds());

		return { day, month, year, hours, minutes, seconds };
	}

	static toDateTime(date: string | Date, settings?: SettingsInput): string {
		if (!this.isDate(date)) return '';
		const { day, month, year, hours, minutes } = this.getDateParts(date, settings);
		return `${day}.${month}.${year} ${hours}:${minutes}`;
	}

	static toDate(date: string | Date, settings?: SettingsInput): string {
		if (!this.isDate(date)) return '';
		const { day, month, year } = this.getDateParts(date, settings);
		return `${day}.${month}.${year}`;
	}

	static toTime(date: string | Date, settings?: SettingsInput): string {
		if (!this.isDate(date)) return '';
		const { hours, minutes } = this.getDateParts(date, settings);
		return `${hours}:${minutes}`;
	}

	static toDayMonth(date: string | Date, settings?: SettingsInput): string {
		const parsedDate = this.parseDateInput(date);
		if (!parsedDate) return '';

		const normalized = this.normalizeSettings(settings);
		const localeData = this.resolveLocaleData(normalized.locale);

		const monthIndex = normalized.utc ? parsedDate.getUTCMonth() : parsedDate.getMonth();
		const day = normalized.utc ? parsedDate.getUTCDate() : parsedDate.getDate();
		const month = localeData.months[monthIndex] || '';

		return `${day} ${month}`;
	}

	static toDayMonthTime(date: string | Date, settings?: SettingsInput): string {
		const parsedDate = this.parseDateInput(date);
		if (!parsedDate) return '';

		const normalized = this.normalizeSettings(settings);
		const localeData = this.resolveLocaleData(normalized.locale);
		const { hours, minutes } = this.getDateParts(parsedDate, normalized);

		const monthIndex = normalized.utc ? parsedDate.getUTCMonth() : parsedDate.getMonth();
		const day = normalized.utc ? parsedDate.getUTCDate() : parsedDate.getDate();
		const month = localeData.months[monthIndex] || '';

		return `${day} ${month} ${localeData.atWord} ${hours}:${minutes}`;
	}

	static toFullDateTimeNoTZ(date: string | Date, settings?: SettingsInput): string {
		if (!this.isDate(date)) return '';
		const { day, month, year, hours, minutes, seconds } = this.getDateParts(date, settings);
		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	}

	static toFormat(date: string | Date, pattern: string, settings?: SettingsInput): string {
		const parsedDate = this.parseDateInput(date);
		if (!parsedDate) return '';

		const normalized = this.normalizeSettings(settings);
		const localeData = this.resolveLocaleData(normalized.locale);
		const { day, month, year, hours, minutes, seconds } = this.getDateParts(parsedDate, normalized);
		const monthIndex = normalized.utc ? parsedDate.getUTCMonth() : parsedDate.getMonth();
		const yearShort = String(year).slice(-2);

		const replacements = {
			yyyy: String(year),
			yy: yearShort,
			MM: localeData.months[monthIndex] || '',
			mm: month,
			dd: day,
			d: String(Number(day)),
			HH: hours,
			ii: minutes,
			ss: seconds
		} satisfies Record<string, string>;

		return pattern.replace(/yyyy|yy|MM|mm|dd|d|HH|ii|ss/g, (match) => replacements[match as keyof typeof replacements]);
	}

	private static normalizeSettings(settings?: SettingsInput): Required<DateUtilSettings> {
		if (typeof settings === 'boolean') {
			return {
				utc: settings,
				locale: this.resolveLocale(),
				timeZone: ''
			};
		}

		return {
			utc: settings?.utc ?? false,
			locale: settings?.locale ?? this.resolveLocale(),
			timeZone: settings?.timeZone ?? ''
		};
	}

	private static resolveLocale(): string {
		const resolverLocale = this._localeResolver?.();
		const locale = typeof resolverLocale === 'string' && resolverLocale.trim().length ? resolverLocale : this._defaultLocale;
		return locale;
	}

	private static resolveLocaleData(locale: string): LocaleData {
		const lang = this.normalizeLanguage(locale);
		const predefined = this.DEFAULT_LOCALES[lang as keyof typeof this.DEFAULT_LOCALES];
		if (predefined) {
			return predefined;
		}

		return {
			months: this.buildMonthsViaIntl(locale),
			atWord: this.FALLBACK_AT_WORD_BY_LANG[lang] ?? 'at'
		};
	}

	private static buildMonthsViaIntl(locale: string): string[] {
		const formatter = new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' });
		return Array.from({ length: 12 }, (_, monthIndex) => formatter.format(new Date(Date.UTC(2024, monthIndex, 1))));
	}

	private static normalizeLanguage(locale: string): string {
		return locale.toLowerCase().split('-')[0] || 'en';
	}

	private static getDatePartsForTimeZone(date: Date, timeZone: string): DateFragments {
		const formatter = new Intl.DateTimeFormat('en-CA', {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		});

		const parts = formatter.formatToParts(date);
		const lookup = (type: Intl.DateTimeFormatPartTypes): string => parts.find((part) => part.type === type)?.value ?? '';

		return {
			day: lookup('day'),
			month: lookup('month'),
			year: Number(lookup('year') || 0),
			hours: lookup('hour'),
			minutes: lookup('minute'),
			seconds: lookup('second')
		};
	}

	private static parseDateInput(date: string | Date): Date | null {
		if (date instanceof Date) {
			return Number.isNaN(date.getTime()) ? null : new Date(date.getTime());
		}

		const raw = date.trim();
		if (!raw) return null;

		const dateOnlyMatch = raw.match(ISO_DATE_RE);
		if (dateOnlyMatch) {
			const [, y, m, d] = dateOnlyMatch;
			const year = Number(y);
			const month = Number(m);
			const day = Number(d);
			const parsed = new Date(year, month - 1, day, 0, 0, 0, 0);
			if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
				return null;
			}
			return parsed;
		}

		const dateTimeMatch = raw.match(ISO_DATE_TIME_RE);
		if (!dateTimeMatch) return null;

		const parsed = new Date(raw);
		if (Number.isNaN(parsed.getTime())) return null;
		return parsed;
	}
}
