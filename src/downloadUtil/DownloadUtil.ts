import { EnvironmentUtil } from '../environmentUtil/EnvironmentUtil.js';

/**
 * Utility class for triggering file downloads in the browser.
 */
export class DownloadUtil {
	/**
	 * Initiates a file download in the browser using the provided URL and file name.
	 *
	 * @param {string} [fileUrl=''] - The URL of the file to download.
	 * @param {string} [fileName='download'] - The name to give the downloaded file.
	 *
	 * @example
	 * DownloadUtil.download('https://example.com/file.pdf', 'myfile.pdf');
	 */
	static download(fileUrl: string = '', fileName: string = 'download') {
		if (EnvironmentUtil.isBrowser && fileUrl.length) {
			const link = document.createElement('a');
			link.href = fileUrl;
			link.download = fileName;
			link.style.opacity = '0';
			link.style.position = 'absolute';
			link.onclick = (e) => e.stopPropagation();
			document.body.appendChild(link);
			link.click();
			link.remove();
		}
	}
}
