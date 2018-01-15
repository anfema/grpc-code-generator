import * as path from 'path';
import * as fs from 'fs';
import { Root, IParseOptions } from 'protobufjs';

/**
 * Load .proto files with a set of root paths, with the same import resolution logic like 'protoc'
 * into a protobufjs root. This object can then be used with `grpc.loadObject()`.
 *
 * If the path is absolute, try to load the file as is, otherwise try to prepend the root paths in
 * the given order and try to load the proto file.
 *
 * @param protoPaths An array of paths to proto files.
 * @param rootPaths An array of paths used as import root. If the a path is not absolute, it will be
 * 		interpreted as relative to the current working directory.
 * @param options Parse options from protobufjs load() method.
 */
export default async function(
	protoPaths: string[],
	rootPaths: string[],
	options?: IParseOptions
): Promise<Root> {
	const root = new Root();
	const cwd = process.cwd();
	const roots = rootPaths.map(p => path.isAbsolute(p) ? p : path.join(cwd, p));
	root.resolvePath = (origin: string, target: string) => resolvePath(roots, origin, target);

	return root.load(protoPaths, options);
}

function resolvePath(rootPaths: string[], origin: string, target: string): string {
	if (path.isAbsolute(target)) {
		// top level file
		return target;
	}
	else {
		const resolvedRoot = rootPaths.find(r => exists(path.join(r, target)));

		if (resolvedRoot) {
			// resolved via one of rootPaths
			return path.join(resolvedRoot, target);
		}
		else {
			// resolve relative to origin, even it is out of spec?
			throw new Error(`Could not find file "${target}"`);
		}
	}
}

function exists(path: string): boolean {
	try {
		fs.accessSync(path);
		return true;
	}
	catch (err) {
		return false
	}
}

