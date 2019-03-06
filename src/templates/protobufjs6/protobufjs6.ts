import { Namespace, NamespaceBase, Root, Type } from 'protobufjs';
import { name } from '.';
import { banner, indent, namespacedReferenceForType, namespaceImportDeclarations, namespacesOf } from '../utils';

export default function (root: Root): string {
	return (
		`${banner(name)}
import { Message, Type, Constructor, Writer, Reader, IConversionOptions } from 'protobufjs';

${namespaceImportDeclarations(root, root).join("\n")}

/** Extend the protobufjs base type 'Type' to include a generic type parameter 'T', to help type inference. */
export interface TypedType<T extends object> extends Type {
}

export default interface ProtobufJs6 {
	${indent(namespaceDeclarations(root), 1)}
}
`);
}

function namespaceDeclarations(namespace: NamespaceBase, indentLevel: number = 0): string {
	const messageDeclaration = namespace instanceof Type
	// <${namespacedReferenceForType(namespace)}>
		? `_Message: TypedType<${namespacedReferenceForType(namespace)}>;`
		: '';

	const subNamespaces = namespacesOf(namespace)
		// .filter(ns => servicesOf(ns).length > 0 || typesOf(ns).length > 0)
		.map(ns => subNamespaceDeclaration(ns, indentLevel));

	return (
`${messageDeclaration}
${subNamespaces.join("\n")}`);
}

function subNamespaceDeclaration(ns: Namespace, indentLevel: number): string {
	return (
`${ns.name}: {
	${indent(namespaceDeclarations(ns as NamespaceBase, indentLevel), indentLevel + 1)}
}`);
}

