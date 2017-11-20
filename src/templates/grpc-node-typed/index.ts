import * as path from 'path';
import { Root, ReflectionObject, NamespaceBase, Namespace, Type, Service } from 'protobufjs'
import { parentChainOf, allNamespacesTransitiveOf, fileNameForNamespace, allRecursiveServicesOf } from '../utils';
import { TemplateFunction, TemplateMap } from '../..';
import grpc from './grpc';
import messageBase from './message-base';
import namespace from './namespace';
import serviceDeclaration from './service';


export default function(templateMap: TemplateMap, root: Root): void {
	templateMap
		.addTemplate('grpc.d.ts', grpc(root))
		.addTemplate('message-base.d.ts', messageBase());

	allNamespacesTransitiveOf(root).forEach(ns => {
		templateMap.addTemplate(fileNameForNamespace(ns), namespace(ns, root))
	});

	allRecursiveServicesOf(root).forEach(service => {
		templateMap.addTemplate(fileNameForService(service), serviceDeclaration(service, root))
	});
}

function fileNameForService(service: Service): string {
	const parents = [...parentChainOf(service), service]
		.slice(1) // omit the root namespace
		.map(p => p.name);

	return path.join(...parents, 'grpc-node.d.ts');
}
