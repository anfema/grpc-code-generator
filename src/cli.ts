import * as yargs from 'yargs';

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
		default: new Array<string>(),
		desc: 'Templates for code generation (default: "grpc-node" and "protobufjs6")',
	})
	.option('config', {
		alias: 'c',
		type: 'string',
		desc: 'JSON config file',
	})
	.help()
	.version().argv;
