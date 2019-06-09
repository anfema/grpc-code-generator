import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { Root } from 'protobufjs';
import { promisify } from 'util';
import { Config } from './config';
import { tryResolveModule } from './utils';

const stat = util.promisify(fs.stat);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

export type TemplateFunction = (root: Root) => Map<string, string>;
export type RenderedTemplatesMap = Map<string, string>; // file path => content

export async function render(config: Config): Promise<RenderedTemplatesMap> {
	const templateFunctions = config.templates.map(t => {
		const path = tryResolveModule(t);

		if (path != undefined) {
			return require(t).default as TemplateFunction;
		} else {
			throw new Error(`Template module '${t}' not found.`);
		}
	});

	(await Promise.all(config.files.map(p => stat(p)))).forEach(s => {
		if (!s.isFile()) {
			throw new Error(`Proto file '${s}' not found`);
		}
	});

	const root = new Root();
	root.resolvePath = (origin: string, target: string) => resolvePath(config.proto_paths, origin, target);

	await root.load(config.files, {
		keepCase: true,
	});

	
	const templateMap = new Map<string, string>();
	
	for (let t of templateFunctions) {
		t(root).forEach((content, path) => {
			if (!templateMap.has(path)) {
				templateMap.set(path, content);
			} else {
				throw new Error(`file '${path}' already generated`);
			}
		});
	}

	return templateMap;
}

export async function writeFiles(templates: RenderedTemplatesMap, outDir: string): Promise<void> {
	// Compute subdirectories to create
	const subDirs = uniq([
		...directoryHierarchy(outDir),
		...Array.from(templates.keys())
			.map(file => directoryHierarchy(path.dirname(file)))
			.reduce((acc, current) => acc.concat(current), [])
			.map(dir => path.join(outDir, dir)),
	]).sort();

	// Create subdirectories
	await Promise.all(
		subDirs.map(async d => {
			try {
				await access(d);
			} catch {
				await mkdir(d);
			}
		}),
	);

	// Write files
	await Promise.all(
		Array.from(templates.entries()).map(async ([filename, content]) =>
			writeFile(path.join(outDir, filename), content),
		),
	);
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
