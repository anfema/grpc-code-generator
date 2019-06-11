export function tryResolveModule(path: string): string | undefined {
	try {
		return require.resolve(path);
	} catch (error) {
		if (error.code === 'MODULE_NOT_FOUND') {
			return;
		} else {
			throw error;
		}
	}
}
