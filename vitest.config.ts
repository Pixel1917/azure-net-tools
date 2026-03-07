import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
	test: {
		environment: 'happy-dom',
		include: ['tests/**/*.test.ts'],
		exclude: ['node_modules', 'dist'],
		globals: false,
	},
	resolve: {
		alias: {
			'azure-net-tools': resolve(__dirname, 'src/index.ts'),
		},
	},
});
