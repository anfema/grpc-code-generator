#!/usr/bin/env node

import * as yargs from 'yargs';
import * as process from 'process';
import { render, writeFiles } from './';
import { configFromArgs, configFromFile, mergeConfig, defaultConfig } from './config';

export const cli = yargs
	.usage('grpc-code-generator [options] <path/to/main.proto>')
	.option('out', {
		alias: 'o',
		type: 'string',
		desc: 'Output directory of generated files (default: "src-gen")',
	})
	.option('proto_path', {
		alias: 'I',
		array: true,
		type: 'string',
		default: new Array<string>(),
		desc: 'Root path for resolving imports (may be specified more than once, default: current workdir)',
	})
	.option('templates', {
		alias: 't',
		array: true,
		type: 'string',
		desc: 'Templates for code generation (default: "grpc-node" and "protobufjs6")',
	})
	.option('config', {
		alias: 'c',
		type: 'string',
		desc: 'JSON config file',
	})
	.help()
	.version().argv;

(async function() {
	try {
		const config = mergeConfig(configFromArgs(cli), mergeConfig(configFromFile(cli), defaultConfig));
		await writeFiles(await render(config), config.out);

		process.exit(0);
	} catch (err) {
		console.error(err);
		process.exit(1);
	}
})();
