import * as path from 'path';
import { Root, ReflectionObject, NamespaceBase, Namespace, Type, Service } from 'protobufjs'
import {
	parentChainOf,
	recursiveNamespacesOf, recursiveServicesOf, recursiveTypesOf,
	fileNameForNamespace,
    hasTypeOrEnum
} from '../utils';
import { TemplateFunction, Context } from '../..';
import grpcNode from './grpc-node';
import namespace from './namespace';
import serviceDeclaration from './service';

export const name = 'grpc-node';

const template: TemplateFunction = (context: Context) => {
	context.addTemplate('grpc-node.d.ts', grpcNode(context.root));

	recursiveNamespacesOf(context.root).forEach(ns => {
		if (hasTypeOrEnum(ns)) {
			context.addTemplate(fileNameForNamespace(ns), namespace(ns, context.root))
		}
	});

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
