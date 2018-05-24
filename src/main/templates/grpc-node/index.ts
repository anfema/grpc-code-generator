import * as path from 'path';
import { Service } from 'protobufjs';
import { Context, TemplateFunction } from '../..';
import { parentChainOf, recursiveServicesOf } from '../utils';
import grpcNode from './grpc-node';
import serviceDeclaration from './service';

export const name = 'grpc-node';

const template: TemplateFunction = (context: Context) => {
	context.addTemplate('grpc-node.d.ts', grpcNode(context.root));

	recursiveServicesOf(context.root).forEach(service => {
		context.addTemplate(fileNameForService(service), serviceDeclaration(service, context.root))
	});
}

export default template;

function fileNameForService(service: Service): string {
	const parents = [...parentChainOf(service), service]
		.slice(1) // omit the root namespace
		.map(p => p.name);

	return path.join(...parents, 'grpc-node.d.ts');
}
