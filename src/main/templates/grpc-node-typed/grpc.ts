import { Root, ReflectionObject, NamespaceBase, Namespace, Type, Service } from 'protobufjs';
import {
	indent,
	namespacesOf,
	recursiveNamespacesOf,
	servicesOf,
	namespacedReferenceForService,
	recursiveServicesOf,
	importReferenceFor, importFileFor,
	banner
} from '../utils';
import { name } from '.';

export default function (root: Root): string {
	return (
`${banner(name)}
import { Message } from 'protobufjs';
${serviceImportDeclarations(root, root).join("\n")}

export default interface Grpc {
	${indent(namespaceDeclarations(root), 1)}
}
`);
}

function namespaceDeclarations(namespace: NamespaceBase, indentLevel: number = 0): string {
	const serviceTypes = servicesOf(namespace).map(ns => serviceDeclaration(ns));
	const subNamespaces = namespacesOf(namespace)
		.filter(ns => recursiveServicesOf(ns).length > 0)
		.map(ns => subNamespaceDeclaration(ns, indentLevel));

	return indent(
`${serviceTypes.join("\n")}
${subNamespaces.join("\n")}`, indentLevel);
}

function subNamespaceDeclaration(ns: Namespace, indentLevel: number): string {
	return (
`${ns.name}: {
	${indent(namespaceDeclarations(ns as NamespaceBase, indentLevel), indentLevel + 1)}
}`);
}

function serviceDeclaration(service: Service): string {
	return `${service.name}: ${namespacedReferenceForService(service)}.ClientConstructor;`
}

function serviceImportDeclarations(root: Root, baseNs: Namespace): string[] {
	return recursiveServicesOf(root).map(ns =>
		`import * as ${importReferenceFor(ns)} from '${importFileFor(ns, baseNs)}/grpc-node';`
	);
}
