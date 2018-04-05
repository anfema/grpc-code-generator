import * as path from 'path';
import { Root, ReflectionObject, NamespaceBase, Namespace, Type, Service } from 'protobufjs'
import {
	parentChainOf,
	recursiveNamespacesOf, recursiveServicesOf, recursiveTypesOf,
	fileNameForNamespace,
    hasTypeOrEnum
} from '../utils';
import { TemplateFunction, TemplateMap } from '../..';
import grpc from './grpc';
import namespace from './namespace';
import serviceDeclaration from './service';

export const name = 'grpc-node-typed';

const template: TemplateFunction = (root: Root) => {
	const templateMap = new TemplateMap();

	templateMap.addTemplate('grpc.d.ts', grpc(root));

	recursiveNamespacesOf(root).forEach(ns => {
		if (hasTypeOrEnum(ns)) {
			templateMap.addTemplate(fileNameForNamespace(ns), namespace(ns, root))
		}
	});

	recursiveServicesOf(root).forEach(service => {
		templateMap.addTemplate(fileNameForService(service), serviceDeclaration(service, root))
	});

	return templateMap;
}

export default template;

function fileNameForService(service: Service): string {
	const parents = [...parentChainOf(service), service]
		.slice(1) // omit the root namespace
		.map(p => p.name);

	return path.join(...parents, 'grpc-node.d.ts');
}
