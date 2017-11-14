import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { Root } from 'protobufjs';

// export { TemplateMap };
export type TemplateFunction = (templateMap: TemplateMap, root: Root) => void;

export class TemplateMap {
	private _templates: Map<string, string> = new Map();

	addTemplate(path: string, contents: string): this {
		if (!this._templates.has(path)) {
			this._templates.set(path, contents);
			return this;
		}
		else {
			throw new Error(`file '${path}' already generated`);
		}
	}

	async writeFiles(basePath: string): Promise<any> {
		const subDirs = uniq([
			...directoryHierarchy(basePath),
			...Array.from(this._templates.keys()).map(file =>
				path.join(basePath, path.dirname(file))
			)
		]).sort();

		for (let i = 0; i < subDirs.length; i++) {
			const dir = subDirs[i];
			try {
				await access(dir);
			}
			catch {
				await mkdir(dir);
			}
		};

		return Promise.all(Array.from(this._templates.entries()).map(async ([filename, content]) =>
			writeFile(path.join(basePath, filename), content)
		));
	}
}

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

export async function loadProto(protoPath: string): Promise<Root> {
	const root = new Root();

	return root.load(protoPath, {
		keepCase: true
	})
}

function uniq<T>(array: T[]): T[] {
	return array
		.slice()
		.sort()
		.filter((item, pos, ary) => !pos || item != ary[pos - 1]);
}

function directoryHierarchy(pathName: string): string[] {
	const elements = pathName
		.split(path.sep)
		.filter(e => e.length > 0);

	return elements.map((baseName, i, elements) => '/' + elements.slice(0, i + 1).join(path.sep));
}