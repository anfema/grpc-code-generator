import { Root, ReflectionObject, NamespaceBase, Namespace, Type, Service } from 'protobufjs';
import {
	indent,
	allSubNamespacesOf,
	allNamespacesTransitiveOf,
	allServicesOf,
	allTypesOf,
	namespacedReferenceForType,
	namespacedReferenceForService,
	allRecursiveServicesOf,
	allNamespaceImportDeclarations,
	importReferenceFor, importFileFor
} from '../utils';


export default function (root: Root): string {
	return (
`import { Message } from 'protobufjs';
import { MessageBase } from './message-base';
${allNamespaceImportDeclarations(root, root).join("\n")}
${allServiceImportDeclarations(root, root).join("\n")}


export default interface Grpc {
	${indent(namespaceDeclarations(root), 1)}
}
`);
}

function namespaceDeclarations(namespace: NamespaceBase, indentLevel: number = 0): string {
	const messageTypes = allTypesOf(namespace).map(ns => typeDeclaration(ns));
	const serviceTypes = allServicesOf(namespace).map(ns => serviceDeclaration(ns));
	const subNamespaces = allSubNamespacesOf(namespace).map(ns =>
		subNamespaceDeclaration(ns, indentLevel)
	);

	return indent(
`// message types
${messageTypes.join("\n")}

// services
${serviceTypes.join("\n")}

${subNamespaces.join("\n\n")}`, indentLevel);
}

function subNamespaceDeclaration(ns: Namespace, indentLevel: number): string {
	return (
`${ns.name}: {
	${indent(namespaceDeclarations(ns as NamespaceBase, indentLevel), indentLevel + 1)}
}`);
}

function typeDeclaration(type: Type): string {
	return `${type.name}: MessageBase<${namespacedReferenceForType(type)}>;`;
}

function serviceDeclaration(service: Service): string {
	return `${service.name}: typeof ${namespacedReferenceForService(service)}.Client;`
}

function allServiceImportDeclarations(root: Root, baseNs: Namespace): string[] {
	return allRecursiveServicesOf(root)
		.map(ns => `import * as ${importReferenceFor(ns)} from '${importFileFor(ns, baseNs)}/grpc-node';`);
}
