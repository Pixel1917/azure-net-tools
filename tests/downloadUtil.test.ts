import { describe, it, expect, vi } from 'vitest';
import { DownloadUtil } from '../src/downloadUtil/DownloadUtil.js';

describe('DownloadUtil', () => {
	it('does not throw when called with url and filename', () => {
		expect(() => DownloadUtil.download('https://example.com/file.pdf', 'file.pdf')).not.toThrow();
	});
	it('does not throw when called with empty url', () => {
		expect(() => DownloadUtil.download('', 'file.pdf')).not.toThrow();
	});
});
