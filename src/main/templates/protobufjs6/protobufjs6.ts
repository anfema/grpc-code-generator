import { Namespace, NamespaceBase, Root, Type } from 'protobufjs';
import { name } from '.';
import { banner, indent, namespacedReferenceForType, namespacesOf, recursiveServicesOf, typesOf, namespaceImportDeclarations, servicesOf } from '../utils';

export default function (root: Root): string {
	return (
		`${banner(name)}
import { Message, Type, Constructor, Writer, Reader, IConversionOptions } from 'protobufjs';

${namespaceImportDeclarations(root, root).join("\n")}

interface MessageCtor<T extends object> {
	new (properties?: Partial<T>): Message<T>;
	readonly $type: Type;
	create(properties?: Partial<T>): Message<T>;
	encode(message: (T | Partial<T>), writer?: Writer): Writer;
	encodeDelimited(message: (T | Partial<T>), writer?: Writer): Writer;
	decode(reader: (Reader | Uint8Array)): T;
	decodeDelimited(reader: (Reader | Uint8Array)): T;
	verify(message: Partial<T>): (string | null);
	fromObject(object: Partial<T>): T;
	toObject(message: T, options?: IConversionOptions): Partial<T>;
}

export default interface ProtobufJs6 {
	${indent(namespaceDeclarations(root), 1)}
}
`);
}

function namespaceDeclarations(namespace: NamespaceBase, indentLevel: number = 0): string {
	const messageDeclaration = namespace instanceof Type
	// <${namespacedReferenceForType(namespace)}>
		? `_Message: MessageCtor<${namespacedReferenceForType(namespace)}>;`
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

