#! /usr/bin/env node

import * as path from 'path';
import * as process from 'process';
import * as fs from 'fs';
import * as yargs from 'yargs';
import * as util from 'util';
import { TemplateMap, TemplateFunction, loadProto } from './';

const stat = util.promisify(fs.stat);

const args = yargs
	.usage('grpc-code-generator [options] <path/to/main.proto>')
	.option('out', {
		alias: 'o',
		default: 'src-gen',
		desc: 'Output directory of generated files'
	})
	.option('proto_path', {
		alias: 'I',
		default: [process.cwd()],
		desc: 'Root path for resolving imports (may be specified more than once)'
	})
	.option('template', {
		alias: 't',
		default: 'grpc-node-typed',
		desc: 'Template for code generation'
	})
	.help()
	.version()
	.argv;

(async function() {
	try {
		const templateMap = new TemplateMap();

		const templatePath =
			tryResolveModule(path.join(process.cwd(), args['t'])) ||
			tryResolveModule(path.join(__dirname, '..', 'main', 'templates', args['t']));

		if (templatePath) {
			const template = require(templatePath).default as TemplateFunction;

			// ensure paths are absolute
			const protoPaths = args._.map(p => path.isAbsolute(p) ? p : path.resolve(p));
			const protoPathStats = await Promise.all(protoPaths.map(p => stat(p)))

			// only use files
			const protoFiles = protoPaths.filter((p, i) => protoPathStats[i].isFile());

			const rootPaths = (typeof args['I'] === 'string'
				? [args['I']]
				: args['I'])
					.map((p: string) => path.isAbsolute(p) ? p : path.resolve(p));

			const root = await loadProto(protoFiles, rootPaths);

			template(templateMap, root);

			await templateMap.writeFiles(path.join(process.cwd(), args['o']));
			process.exit(0);
		}
		else {
			console.log(`Error: Template module '${args['t']}' not found.`);
			process.exit(1);
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

