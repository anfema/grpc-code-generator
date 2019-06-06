#!/usr/bin/env node

import * as path from 'path';
import * as process from 'process';
import { cli } from './cli';
import { Context, TemplateFunction, loadProto } from './';
import { Config, configFromArgs, configFromFile, mergeConfig, prepareConfig } from './config';

const defaultConfig: Config = {
	out: 'src-gen',
	templates: [
		'grpc-node',
		'protobufjs6',
	],
	proto_paths: [process.cwd()],
	files: [],
};

(async function() {
	try {
		const config = await prepareConfig(
			mergeConfig(configFromArgs(cli), mergeConfig(configFromFile(cli), defaultConfig)),
		);

		const root = await loadProto(config.files, config.proto_paths);
		const context = new Context(root);

		for (let templatePath of config.templates) {
			const templateFunction = require(templatePath).default as TemplateFunction;
			templateFunction(context);
		}

		await context.writeFiles(path.join(process.cwd(), config.out));
		process.exit(0);
	} catch (err) {
		console.error(err.message);
		process.exit(1);
	}
})();
