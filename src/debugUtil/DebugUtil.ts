export type DebugRenderOptions = {
	indent?: number;
	maxDepth?: number;
	maxEntries?: number;
	theme?: 'light' | 'dark';
};

const escapeHtml = (value: string): string => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const describePrimitive = (value: unknown): string => {
	if (typeof value === 'string') return value;
	if (typeof value === 'bigint') return `${value}n`;
	if (typeof value === 'symbol') return value.toString();
	if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;
	if (value === undefined) return 'undefined';
	return String(value);
};

export class DebugUtil {
	static stringify(value: unknown, options: DebugRenderOptions = {}): string {
		const maxDepth = options.maxDepth ?? 8;
		const maxEntries = options.maxEntries ?? 100;
		const seen = new WeakSet<object>();

		const normalize = (current: unknown, depth: number): unknown => {
			if (typeof current === 'bigint') return `${current}n`;
			if (typeof current === 'symbol' || typeof current === 'function' || current === undefined) return describePrimitive(current);
			if (current === null || typeof current !== 'object') return current;
			if (depth >= maxDepth) return '[Max depth reached]';
			if (seen.has(current)) return '[Circular]';
			seen.add(current);

			if (current instanceof Date) return Number.isNaN(current.getTime()) ? 'Invalid Date' : current.toISOString();
			if (current instanceof RegExp) return current.toString();
			if (current instanceof Error) {
				return {
					name: current.name,
					message: current.message,
					stack: current.stack,
					cause: normalize((current as Error & { cause?: unknown }).cause, depth + 1)
				};
			}
			if (current instanceof Map) {
				return {
					[`Map(${current.size})`]: Array.from(current.entries())
						.slice(0, maxEntries)
						.map(([key, item]) => [normalize(key, depth + 1), normalize(item, depth + 1)])
				};
			}
			if (current instanceof Set) {
				return {
					[`Set(${current.size})`]: Array.from(current)
						.slice(0, maxEntries)
						.map((item) => normalize(item, depth + 1))
				};
			}
			if (ArrayBuffer.isView(current)) {
				return {
					[current.constructor.name]: Array.from(new Uint8Array(current.buffer, current.byteOffset, current.byteLength)).slice(0, maxEntries)
				};
			}
			if (current instanceof ArrayBuffer) {
				return { ArrayBuffer: Array.from(new Uint8Array(current)).slice(0, maxEntries) };
			}
			if (Array.isArray(current)) {
				const result = current.slice(0, maxEntries).map((item) => normalize(item, depth + 1));
				if (current.length > maxEntries) result.push(`[${current.length - maxEntries} more items]`);
				return result;
			}

			const result: Record<string, unknown> = {};
			const keys = Object.keys(current);
			for (const key of keys.slice(0, maxEntries)) {
				try {
					result[key] = normalize((current as Record<string, unknown>)[key], depth + 1);
				} catch (error) {
					result[key] = `[Property access failed: ${error instanceof Error ? error.message : String(error)}]`;
				}
			}
			if (keys.length > maxEntries) result['...'] = `[${keys.length - maxEntries} more properties]`;
			return result;
		};

		const normalized = normalize(value, 0);
		return JSON.stringify(normalized, null, options.indent ?? 2) ?? describePrimitive(value);
	}

	static render(value: unknown, options: DebugRenderOptions = {}): string {
		const dark = options.theme === 'dark';
		const background = dark ? '#15191f' : '#f2f4f7';
		const color = dark ? '#d7dde5' : '#30363d';
		const border = dark ? '#303844' : '#d8dde5';
		const isStructured = typeof value === 'object' && value !== null;

		if (!isStructured) {
			return `<div class="azure-debug-value" style="box-sizing:border-box;display:inline-block;max-width:100%;padding:8px 10px;border:1px solid ${border};border-radius:7px;background:${background};color:${color};font:13px/1.45 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(describePrimitive(value))}</div>`;
		}

		const escaped = escapeHtml(this.stringify(value, options));
		const highlighted = escaped.replace(
			/("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?/g,
			(match, quoted?: string, colon?: string, literal?: string) => {
				if (literal === 'null') return `<span style="color:${dark ? '#c792ea' : '#7a3e9d'}">null</span>`;
				if (literal !== undefined) return `<span style="color:${dark ? '#ffcb6b' : '#9a6700'}">${literal}</span>`;
				if (quoted !== undefined) {
					const keyColor = dark ? '#82aaff' : '#0550ae';
					const stringColor = dark ? '#c3e88d' : '#116329';
					return `<span style="color:${colon ? keyColor : stringColor}">${quoted}</span>${colon ?? ''}`;
				}
				return `<span style="color:${dark ? '#f78c6c' : '#953800'}">${match}</span>`;
			}
		);

		return `<pre class="azure-debug-view" style="box-sizing:border-box;margin:0;max-width:100%;padding:14px 16px;border:1px solid ${border};border-radius:9px;background:${background};color:${color};font:13px/1.55 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre;overflow:auto;tab-size:2"><code>${highlighted}</code></pre>`;
	}
}
