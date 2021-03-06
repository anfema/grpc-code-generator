import * as path from 'path';
import { tryResolveModule } from './utils';
import { cli } from './cli';
import { IParseOptions } from 'protobufjs';

export interface Config {
	out: string;
	templates: string[];
	proto_paths: string[];
	files: string[];
	parse_options: IParseOptions;
}

export const defaultConfig: Config = {
	out: 'src-gen',
	templates: [
		'@anfema/grpc-code-generator/dist/templates/grpc-node',
		'@anfema/grpc-code-generator/dist/templates/protobufjs6',
	],
	proto_paths: [process.cwd()],
	files: [],
	parse_options: {
		keepCase: true,
	},
};

export function configFromFile(args: typeof cli): Partial<Config> | undefined {
	if (args.config) {
		const configFile = tryResolveModule(path.resolve(args.config));

		if (!configFile) {
			throw new Error(`Cannot find config file "${args.config}"`);
		} else {
			const configDir = path.dirname(configFile);
			const config = require(configFile) as Partial<Config>;

			// Relative paths are interpreted from the config file's dir
			config.out = config.out && path.resolve(configDir, config.out);
			config.templates =
				config.templates && config.templates.map(t => (t.startsWith('.') ? path.resolve(configDir, t) : t));
			config.proto_paths =
				config.proto_paths &&
				config.proto_paths.map(p => (path.isAbsolute(p) ? path.resolve(configDir, p) : p));
			config.files = config.files && config.files.map(f => (path.isAbsolute(f) ? path.resolve(configDir, f) : f));

			return config;
		}
	}
}

export function configFromArgs(args: typeof cli): Partial<Config> {
	return {
		// Relative paths are interpreted from the current work dir
		out: args.out && path.resolve(args.out),
		templates: args.templates && args.templates.map(t => (t.startsWith('.') ? path.resolve(t) : t)),
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
				parse_options: config.parse_options || defaultConfig.parse_options,
		  }
		: defaultConfig;
}
