import * as path from 'path';
import * as util from 'util';
import * as fs from 'fs';
import { tryResolveModule } from './utils';
import { cli } from './cli';

const stat = util.promisify(fs.stat);


export interface Config {
	out: string;
	templates: string[];
	proto_paths: string[];
	files: string[];
}

export async function prepareConfig(config: Config): Promise<Config> {
	const templatePaths = config.templates.map(t => {
		const filePath =
			tryResolveModule(path.join(process.cwd(), t)) || tryResolveModule(path.join(__dirname, 'templates', t));

		if (filePath) {
			return filePath;
		} else {
			throw new Error(`Template module '${t}' not found.`);
		}
	});

	const protoFileStats = await Promise.all(config.files.map(p => stat(p)));

	return {
		out: config.out,
		templates: templatePaths,
		proto_paths: config.proto_paths.map(p => (path.isAbsolute(p) ? p : path.resolve(p))),
		files: config.files
			.filter((p, i) => protoFileStats[i].isFile())
			.map(p => (path.isAbsolute(p) ? p : path.resolve(p))),
	};
}

export function configFromFile(args: typeof cli): Partial<Config> | undefined {
	if (args.config) {
		const configFile = tryResolveModule(path.resolve(args.config));

		if (configFile) {
			return require(configFile);
		} else {
			throw new Error(`Cannot find config file "${args.config}"`);
		}
	}
}

export function configFromArgs(args: typeof cli): Partial<Config> {
	return {
		out: args.out,
		// Relative paths are interpreted from the current work dir
		templates: args.templates.map(t => (t.startsWith('.') ? path.resolve(t) : t)),
		proto_paths: args.proto_path.map(p => path.resolve(p)),
		files: args._.map(f => path.resolve(f)),
	};
}

export function mergeConfig(config: Partial<Config> | undefined, defaultConfig: Config): Config {
	return config != null
		? {
				out: config.out || defaultConfig.out,
				templates: config.templates || defaultConfig.templates,
				proto_paths:
					config.proto_paths != undefined
						? config.proto_paths.concat(defaultConfig.proto_paths)
						: defaultConfig.proto_paths,
				files: config.files != undefined ? config.files.concat(defaultConfig.files) : defaultConfig.files,
		  }
		: defaultConfig;
}
