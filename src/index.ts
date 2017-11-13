import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { Root } from 'protobufjs';


export type TemplateMap = Map<string, string>;
export type TemplateFunction = (root: Root) => TemplateMap;

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

export async function loadProto(protoPath: string): Promise<Root> {
	const root = new Root();

	await root.load(protoPath, {
		keepCase: true
	})

	return root;
}

export async function writeFiles(templateMap: TemplateMap, basePath: string): Promise<any> {
	const subDirs = uniq([
		...directoryHierarchy(basePath),
		...Array.from(templateMap.keys()).map(file =>
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

	await Promise.all(Array.from(templateMap.entries()).map(async ([filename, content]) =>
		writeFile(path.join(basePath, filename), content)
	));
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