import * as path from 'path';
import { Root, ReflectionObject, NamespaceBase, Namespace, Type, Service } from 'protobufjs';
import grpcNodeTypedTemplate from '../grpc-node-typed';
import { parentChainOf, allNamespacesTransitiveOf, allRecursiveServicesOf } from '../utils';
import { TemplateFunction, TemplateMap } from '../..';
import { serviceInterface } from './service';


export default function(templateMap: TemplateMap, root: Root): void {
	// generate base grpc-node templates too
	grpcNodeTypedTemplate(templateMap, root);

	allRecursiveServicesOf(root).forEach(service => {
		templateMap.addTemplate(fileNameForService(service), serviceInterface(service, root))
	});
}

function fileNameForService(service: Service): string {
	const parents = [...parentChainOf(service), service]
		.slice(1) // omit the root namespace
		.map(p => p.name);

	return path.join(...parents, 'grpc-node-rxjs.d.ts');
}

