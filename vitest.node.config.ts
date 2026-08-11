import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'node',
		include: ['tests-node/**/*.test.ts'],
		exclude: ['node_modules', 'dist'],
		globals: false
	},
	resolve: {
		alias: {
			'@azure-net/tools/environment/browser': resolve(__dirname, 'src/environmentUtil/browser-fallback.ts'),
			'@azure-net/tools/environment/development': resolve(__dirname, 'src/environmentUtil/development-fallback.ts'),
			'@azure-net/tools/environment/node': resolve(__dirname, 'src/environmentUtil/true.ts')
		}
	}
});
