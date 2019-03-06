#!/usr/bin/env node

import * as path from 'path';
import * as process from 'process';
import * as yargs from 'yargs';

import { Context, TemplateFunction, loadProto } from './';
import { Config, configFromArgs, loadConfig, mergeConfig, prepareConfig } from './config';

const args = yargs
	.usage('grpc-code-generator [options] <path/to/main.proto>')
	.option('out', {
		alias: 'o',
		desc: 'Output directory of generated files (default: "src-gen")'
	})
	.option('proto_path', {
		alias: 'I',
		desc: 'Root path for resolving imports (may be specified more than once, default: current workdir)'
	})
	.option('templates', {
		alias: 't',
		array: true,
		desc: 'Templates for code generation (default: "grpc-node" and "protobufjs6")'
	})
	.option('config', {
		alias: 'c',
		desc: 'JSON config file'
	})
	.help()
	.version()
	.argv;

const defaultConfig: Config = {
	out: 'src-gen',
	templates: ['grpc-node', 'protobufjs6'],
	proto_paths: [ process.cwd() ],
	files: [],
};

(async function() {
	try {
		const argConfig = configFromArgs(args);
		const fileConfig = loadConfig(args);

		const config = await prepareConfig((fileConfig
			? mergeConfig(argConfig, mergeConfig(fileConfig, defaultConfig))
			: mergeConfig(argConfig, defaultConfig)) as Config
		);

		const root = await loadProto(config.files, config.proto_paths);
		const context = new Context(root);

		for (let templatePath of config.templates) {
			const templateFunction = require(templatePath).default as TemplateFunction;
			templateFunction(context)
		}

		await context.writeFiles(path.join(process.cwd(), config.out));
		process.exit(0);
	}
	catch (err) {
		console.error(err.message);
		process.exit(1);
	}
})()
