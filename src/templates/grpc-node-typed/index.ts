import * as path from 'path';
import { Root, ReflectionObject, NamespaceBase, Namespace, Type, Service } from 'protobufjs'
import { parentChainOf, allNamespacesTransitiveOf, fileNameForNamespace } from '../utils';
import { TemplateFunction, TemplateMap } from '../..';
import grpc from './grpc';
import messageBase from './message-base';
import namespace from './namespace';


export default function(templateMap: TemplateMap, root: Root): void {
	templateMap
		.addTemplate('grpc.d.ts', grpc(root))
		.addTemplate('message-base.d.ts', messageBase());

	allNamespacesTransitiveOf(root).forEach(ns => {
		templateMap.addTemplate(fileNameForNamespace(ns), namespace(ns, root))
	});
}

export function namespacedReferenceFor(type: ReflectionObject): string {
	const chain = parentChainOf(type);
	const parents = parentChainOf(type)
		.slice(1) // omit the root namespace
		.map(p => p.name);

	return `$${parents.join('$')}.${type.name}`;
}

/**
 * The reference part of an import declaration (import * as <ref> from './file').
 */
function importReferenceFor(namespace: NamespaceBase): string {
	const parents = [...parentChainOf(namespace), namespace]
		.slice(1) // omit the root namespace
		.map(p => p.name);

	return `$${parents.join('$')}`;
}




