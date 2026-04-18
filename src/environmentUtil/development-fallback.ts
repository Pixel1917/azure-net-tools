type RuntimeGlobalThis = typeof globalThis & {
	process?: { env?: { NODE_ENV?: unknown } };
};

const runtime = globalThis as RuntimeGlobalThis;
const nodeEnv = runtime.process?.env?.NODE_ENV;

const isDevByNodeEnv = typeof nodeEnv === 'string' && !nodeEnv.toLowerCase().startsWith('prod');

export default isDevByNodeEnv;
