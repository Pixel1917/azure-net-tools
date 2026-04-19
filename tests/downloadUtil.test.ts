import { describe, it, expect, vi } from 'vitest';
import { DownloadUtil } from '../src/downloadUtil/DownloadUtil.js';

describe('DownloadUtil', () => {
	it('does not throw when called with url and filename', () => {
		expect(() => DownloadUtil.download('https://example.com/file.pdf', 'file.pdf')).not.toThrow();
	});

	it('does not throw when called with empty url', () => {
		expect(() => DownloadUtil.download('', 'file.pdf')).not.toThrow();
	});

	it('uses object URL for Blob and revokes it after download', () => {
		const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob://test-url');
		const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

		const blob = new Blob(['hello'], { type: 'text/plain' });
		expect(() => DownloadUtil.download(blob, 'blob.txt')).not.toThrow();

		expect(createSpy).toHaveBeenCalledTimes(1);
		expect(createSpy).toHaveBeenCalledWith(blob);
		expect(revokeSpy).toHaveBeenCalledTimes(1);
		expect(revokeSpy).toHaveBeenCalledWith('blob://test-url');

		createSpy.mockRestore();
		revokeSpy.mockRestore();
	});

	it('uses object URL for File and revokes it after download', () => {
		const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob://file-url');
		const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

		const file = new File(['abc'], 'doc.txt', { type: 'text/plain' });
		expect(() => DownloadUtil.download(file, 'doc.txt')).not.toThrow();

		expect(createSpy).toHaveBeenCalledTimes(1);
		expect(createSpy).toHaveBeenCalledWith(file);
		expect(revokeSpy).toHaveBeenCalledTimes(1);
		expect(revokeSpy).toHaveBeenCalledWith('blob://file-url');

		createSpy.mockRestore();
		revokeSpy.mockRestore();
	});

	it('does not create or revoke object URL for plain string url', () => {
		const createSpy = vi.spyOn(URL, 'createObjectURL');
		const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');

		DownloadUtil.download('https://example.com/test.pdf', 'test.pdf');

		expect(createSpy).not.toHaveBeenCalled();
		expect(revokeSpy).not.toHaveBeenCalled();

		createSpy.mockRestore();
		revokeSpy.mockRestore();
	});

	it('removes temporary anchor element from DOM', () => {
		const before = document.querySelectorAll('a').length;
		DownloadUtil.download('https://example.com/file.pdf', 'file.pdf');
		const after = document.querySelectorAll('a').length;

		expect(after).toBe(before);
	});
});
