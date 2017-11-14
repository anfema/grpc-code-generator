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
		default: 'grpc-typed',
		desc: 'template for code generation'
	})
	.help()
	.version()
	.argv;

(async function() {
	try {
		if (args._.length === 1) {
			const templateMap = new TemplateMap();
			const templatePath = path.join(__dirname, 'templates', args['t']);

			try {
				const template = require(templatePath).default as TemplateFunction;

				const protoPath = path.join(process.cwd(), args._[0]);
				const root = await loadProto(protoPath);

				template(templateMap, root);

				await templateMap.writeFiles(path.join(process.cwd(), args['o']));
				process.exit(0);
			}
			catch (err) {
				if (err.code === 'MODULE_NOT_FOUND') {
					console.log(`Error: Template module '${templatePath}' not found.`)
					process.exit(1);
				}
				else {
					throw err;
				}
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



