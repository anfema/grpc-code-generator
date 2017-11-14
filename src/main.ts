#! /usr/bin/env node

import * as path from 'path';
import * as process from 'process';
import * as yargs from 'yargs';

import template from './templates/grpc-typed';
import { loadProto, writeFiles } from '.';


const args = yargs
	.option('out', {
		alias: 'o',
		default: 'src-gen',
		desc: 'output directory of generated files'
	})
	.help()
	.version()
	.argv;

(async function() {
	try {
		if (args._.length === 1) {
			const protoPath = path.join(process.cwd(), args._[0]);
			const root = await loadProto(protoPath);
			const fileMap = template(root);

			await writeFiles(fileMap, path.join(process.cwd(), args['o']));

			process.exit(0);
		}
		else {

		}
	}
	catch (err) {
		console.error(err);
		process.exit(1);
	}
})()



