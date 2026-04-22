import { BROWSER } from '../../environment';

/**
 * Utility class for triggering file downloads in the browser.
 */
export class DownloadUtil {
	/**
	 * Initiates a file download in the browser using the provided URL and file name.
	 *
	 * @param {string | Blob | File} [file=''] - File source. can be a string URL, Blob, or File.
	 * @param {string} [fileName='download'] - The name to give the downloaded file.
	 *
	 * @example
	 * DownloadUtil.download('https://example.com/file.pdf', 'myfile.pdf');
	 */
	static download(file: string | Blob | File = '', fileName: string = 'download') {
		if (!BROWSER || !file) return;

		const { fileUrl, isObjectUrl } = this.getFileString(file);
		const link = document.createElement('a');

		try {
			link.href = fileUrl;
			link.download = fileName;
			link.style.opacity = '0';
			link.style.position = 'absolute';
			link.onclick = (e) => e.stopPropagation();

			(document.body ?? document.documentElement).appendChild(link);
			link.click();
		} finally {
			link.remove();
			if (isObjectUrl) {
				URL.revokeObjectURL(fileUrl);
			}
		}
	}

	private static getFileString(file: string | Blob | File): { fileUrl: string; isObjectUrl: boolean } {
		if (typeof file === 'string') {
			return { fileUrl: file, isObjectUrl: false };
		}
		if (file instanceof File || file instanceof Blob) {
			return { fileUrl: URL.createObjectURL(file), isObjectUrl: true };
		}
		throw new Error('Invalid file type');
	}
}
