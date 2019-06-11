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

function namespaceDeclarations(ns: NamespaceBase): string {
	const subNamespaces = namespacesOf(ns)
		.map(ns => subNamespaceDeclaration(ns));

	return indent`
		${ns instanceof Type ? `_Message: TypedType<${namespacedReferenceForType(ns)}>;` : ''}
		${subNamespaces.join('\n')}
	`;
}

const subNamespaceDeclaration = (ns: Namespace) => indent`
	${ns.name}: {
		${namespaceDeclarations(ns as NamespaceBase)}
	}
`;
