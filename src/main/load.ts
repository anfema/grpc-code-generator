import * as fs from 'fs';
import * as path from 'path';
import { IParseOptions, Namespace, Root, Type } from 'protobufjs';
import { namespacesOf, typesOf } from './templates/utils';

// TODO this should go into its own package

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
 *
 */
export function loadProtoFiles(
	rootPaths: string[],
	protoPaths: string[],
	options?: IParseOptions
): Promise<Root> {
	const root = new Root();
	const cwd = process.cwd();
	const roots = rootPaths.map(p => path.isAbsolute(p) ? p : path.join(cwd, p));
	root.resolvePath = (origin: string, target: string) => resolvePath(roots, origin, target);

	return root.load(protoPaths, options);
}

export function createMessageTypes<T>(root: Root): T {
	const holder = {};
	attachMessageTypesRecursive(holder, root);
	return holder as T;
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

function attachMessageTypesRecursive(messageTypes: any, namespace: Namespace): void {
	const types = typesOf(namespace);

	namespacesOf(namespace).forEach(ns => {
		const namespaceHolder: any = {};
		const type = types.find(type => type.name === ns.name)
		if (type) {
			namespaceHolder[ '_Message' ] = type;
		}

		messageTypes[ ns.name ] = namespaceHolder;

		if (ns instanceof Type) {
			namespace
		}

		attachMessageTypesRecursive(namespaceHolder, ns);
	});
}