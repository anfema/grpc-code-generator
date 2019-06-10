import { Namespace, NamespaceBase, Root, Type } from 'protobufjs';
import { name } from '.';
import { namespacedReferenceForType, namespaceImportDeclarations, namespacesOf } from '../utils';
import { banner, indent } from '../tags';

export default (root: Root) => indent`
	${banner(name)}

	import { Message, Type, Constructor, Writer, Reader, IConversionOptions } from 'protobufjs';
	${namespaceImportDeclarations(root, root).join('\n')}

	/** Extend the protobufjs base type 'Type' to include a generic type parameter 'T' to help type inference. */
	export interface TypedType<T extends object> extends Type {}

	export default interface ProtobufJs6 {
		${namespaceDeclarations(root)}
	}
`;

function namespaceDeclarations(namespace: NamespaceBase): string {
	const messageDeclaration =
		namespace instanceof Type ? `_Message: TypedType<${namespacedReferenceForType(namespace)}>;` : '';

	const subNamespaces = namespacesOf(namespace)
		// .filter(ns => servicesOf(ns).length > 0 || typesOf(ns).length > 0)
		.map(ns => subNamespaceDeclaration(ns));

	return indent`
		${messageDeclaration}
		${subNamespaces.join('\n')}
	`;
}

const subNamespaceDeclaration = (ns: Namespace) => indent`
	${ns.name}: {
		${namespaceDeclarations(ns as NamespaceBase)}
	}
`;
