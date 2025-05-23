import { EnvironmentUtil } from '../environmentUtil';

export class DownloadUtil {
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
