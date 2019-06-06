import * as fs from 'fs';
import * as path from 'path';
import { Root } from 'protobufjs';
import { promisify } from 'util';

// export { TemplateMap };
export type TemplateFunction = (context: Context) => void;

export class Context {
	private _templates: Map<string, string> = new Map();

	constructor(public readonly root: Root) {}

	addTemplate(path: string, contents: string): this {
		if (!this._templates.has(path)) {
			this._templates.set(path, contents);
			return this;
		} else {
			throw new Error(`file '${path}' already generated`);
		}
	}

	async writeFiles(basePath: string): Promise<any> {
		const subDirs = uniq([
			...directoryHierarchy(basePath),
			...Array.from(this._templates.keys())
				.map(file => directoryHierarchy(path.dirname(file)))
				.reduce((acc, current) => acc.concat(current), [])
				.map(dir => path.join(basePath, dir)),
		]).sort();

		for (let i = 0; i < subDirs.length; i++) {
			const dir = subDirs[i];
			try {
				await access(dir);
			} catch {
				await mkdir(dir);
			}
		}

		return Promise.all(
			Array.from(this._templates.entries()).map(async ([filename, content]) =>
				writeFile(path.join(basePath, filename), content),
			),
		);
	}
}

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

export async function loadProto(protoPaths: string[], rootPaths: string[]): Promise<Root> {
	const root = new Root();
	root.resolvePath = (origin: string, target: string) => resolvePath(rootPaths, origin, target);

	return root.load(protoPaths, {
		keepCase: true,
	});
}

function resolvePath(rootPaths: string[], origin: string, target: string): string | null {
	if (path.isAbsolute(target)) {
		// top level file
		return target;
	} else {
		const resolvedRoot = rootPaths.find(r => exists(path.join(r, target)));
		if (resolvedRoot) {
			// resolved via one of rootPaths
			return path.join(resolvedRoot, target);
		} else {
			// resolve relative to origin, even it is out of spec?
			return null;
		}
	}
}

function exists(path: string): boolean {
	try {
		fs.accessSync(path);
		return true;
	} catch (err) {
		return false;
	}
}

function uniq<T>(array: T[]): T[] {
	return array
		.slice()
		.sort()
		.filter((item, pos, ary) => !pos || item != ary[pos - 1]);
}

function directoryHierarchy(pathName: string): string[] {
	const elements = pathName.split(path.sep).filter(e => e.length > 0);

	return elements.map((baseName, i, elements) => '/' + elements.slice(0, i + 1).join(path.sep));
}
