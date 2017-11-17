import { Root, ReflectionObject, NamespaceBase, Namespace, Type, Service } from 'protobufjs';
import {
	indent,
	allSubNamespacesOf,
	allNamespacesTransitiveOf,
	allServicesOf,
	allTypesOf,
	importDeclaration
} from '../utils';
import { namespacedReferenceFor } from './';


export default function (root: Root): string {
	const imports = allNamespacesTransitiveOf(root)
		.map(ns => importDeclaration(ns, root));

	return (
`import { Message } from 'protobufjs';
import { MessageBase } from './message-base';
${imports.join("\n")}

export default interface Grpc {
	${indent(namespaceDeclarations(root), 1)}
}
`);
}

function subNamespaceDeclaration(ns: Namespace, indentLevel: number): string {
	return (
`${ns.name}: {
	${indent(namespaceDeclarations(ns as NamespaceBase, indentLevel), indentLevel + 1)}
}`);
}

function typeDeclaration(type: Type): string {
	return `${type.name}: MessageBase<${namespacedReferenceFor(type)}>;`;
}

function serviceDeclaration(service: Service): string {
	return `${service.name}: typeof ${namespacedReferenceFor(service)}.Client;`
}

function namespaceDeclarations(namespace: NamespaceBase, indentLevel: number = 0): string {
	const messageTypes = allTypesOf(namespace).map(ns => typeDeclaration(ns));
	const serviceTypes = allServicesOf(namespace).map(ns => serviceDeclaration(ns));
	const subNamespaces = allSubNamespacesOf(namespace).map(ns =>
		subNamespaceDeclaration(ns, indentLevel)
	);

	return indent(
`// message types
${messageTypes.join("\n\n")}

// services
${serviceTypes.join("\n\n")}
${subNamespaces.join("\n\n")}
`, indentLevel);
}
