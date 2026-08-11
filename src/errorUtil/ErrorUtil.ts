export class ErrorUtil {
	static toError(value: unknown, fallbackMessage = 'Unknown error'): Error {
		if (value instanceof Error) return value;

		let message = fallbackMessage;
		let name: string | undefined;
		if (typeof value === 'string' && value.length > 0) {
			message = value;
		} else if (typeof value === 'object' && value !== null) {
			const errorLike = value as { message?: unknown; name?: unknown };
			if (typeof errorLike.message === 'string' && errorLike.message.length > 0) message = errorLike.message;
			if (typeof errorLike.name === 'string' && errorLike.name.length > 0) name = errorLike.name;
		} else if (value !== null && value !== undefined) {
			message = String(value);
		}

		const error = new Error(message);
		if (name) error.name = name;
		Object.defineProperty(error, 'cause', {
			value,
			configurable: true,
			enumerable: false,
			writable: true
		});
		return error;
	}
}
