import * as path from 'path';
import { Arguments } from 'yargs';
import * as util from 'util';
import * as fs from 'fs';

import { tryResolveModule } from './utils';

const stat = util.promisify(fs.stat);

export interface Config {
	out: string;
	template: string;
	proto_paths: string[];
	files: string[];
}

export async function prepareConfig(config: Config): Promise<Config> {
	const templatePath =
		tryResolveModule(path.join(process.cwd(), config.template)) ||
		tryResolveModule(path.join(__dirname, '..', 'main', 'templates', config.template));

	if (templatePath) {
		const protoFileStats = await Promise.all(config.files.map(p => stat(p)))

		return {
			out: config.out,
			template: templatePath,
			proto_paths: config.proto_paths
				.map(p => path.isAbsolute(p) ? p : path.resolve(p)),
			files: config.files
				.filter((p, i) => protoFileStats[i].isFile())
				.map(p => path.isAbsolute(p) ? p : path.resolve(p))
		}
	}
	else {
		throw new Error(`Template module '${config.template}' not found.`);
	}
}

export function loadConfig(args: Arguments): Partial<Config> | undefined {
	if (args['c']) {
		const configFile = tryResolveModule(path.resolve(args['c']));

		if (configFile) {
			return require(configFile);
		}
		else {
			throw new Error(`Cannot find config file "${args['c']}"`);
		}
	}
}

export function configFromArgs(args: Arguments): Partial<Config> {
	return {
		out: args['o'],
		template: args['t'],
		proto_paths: typeof args['I'] === 'string' ? [args['I']] : args['I'], // coerce to array
		files: args._.length > 0 ? args._ : undefined,
	}
}

export function mergeConfig(config: Partial<Config>, defaultConfig: Partial<Config>): Partial<Config> {
	return {
		out: config.out || defaultConfig.out,
		template: config.template || defaultConfig.template,
		proto_paths: config.proto_paths || defaultConfig.proto_paths,
		files: config.files ||  defaultConfig.files,
	}
}

