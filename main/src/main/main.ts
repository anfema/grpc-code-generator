#! /usr/bin/env node

import * as path from 'path';
import * as process from 'process';
import * as yargs from 'yargs';
import { TemplateMap, TemplateFunction, loadProto } from './';


const args = yargs
	.usage('grpc-code-generator [options] <path/to/main.proto>')
	.option('out', {
		alias: 'o',
		default: 'src-gen',
		desc: 'output directory of generated files'
	})
	.option('template', {
		alias: 't',
		default: 'grpc-node-typed',
		desc: 'template for code generation'
	})
	.help()
	.version()
	.argv;

(async function() {
	try {
		if (args._.length === 1) {
			const templateMap = new TemplateMap();

			// @ts-ignore
			const templatePath =
				tryResolveModule(path.join(process.cwd(), args['t'])) ||
				tryResolveModule(path.join(__dirname, '..', 'main', 'templates', args['t']));

			if (templatePath) {
				const template = require(templatePath).default as TemplateFunction;

				const protoPath = path.join(process.cwd(), args._[0]);
				const root = await loadProto(protoPath);

				template(templateMap, root);

				await templateMap.writeFiles(path.join(process.cwd(), args['o']));
				process.exit(0);
			}
			else {
				console.log(`Error: Template module '${args['t']}' not found.`)
			}
		}
		else {
			// TODO print an error message
		}
	}
	catch (err) {
		console.error(err);
		process.exit(1);
	}
})()

function tryResolveModule(path: string): string | undefined {
	try {
		return require.resolve(path);
	}
	catch (error) {
		if (error.code === 'MODULE_NOT_FOUND') {
			return;
		}
		else {
			throw error;
		}
	}
}

